import type { PlasmoCSConfig } from "plasmo"
import { GFGAdapter } from "~lib/platforms/geeksforgeeks"
import { ActivityTracker } from "~lib/leetcode/activityTracker"
import { storageService } from "~lib/storage/storage.service"

export const config: PlasmoCSConfig = {
  matches: [
    "https://practice.geeksforgeeks.org/problems/*",
    "https://www.geeksforgeeks.org/problems/*"
  ]
}

const adapter = new GFGAdapter()
let activeTracker: ActivityTracker | null = null
let currentProblemData: any = null
let lastUrl = ""
let isSubmitting = false
let observer: MutationObserver | null = null
let onCodeExtracted: ((payload: { code: string; language: string }) => void) | null = null

// Listen for messages from the MAIN world content script
window.addEventListener("message", (event) => {
  if (event.source !== window || !event.data || event.data.source !== "kepr-main") {
    return
  }

  if (event.data.type === "SEND_CODE_AND_LANG") {
    if (onCodeExtracted) {
      onCodeExtracted(event.data.payload)
    }
  }

  if (event.data.type === "SEND_CURRENT_LANGUAGE") {
    if (currentProblemData && currentProblemData.language !== event.data.language) {
      currentProblemData.language = event.data.language
      storageService.setCurrentProblem(currentProblemData)
      console.log(`[Kepr] Language updated for GFG ${currentProblemData.slug}: ${event.data.language}`)
    }
  }
})

async function initializeProblemPage() {
  const currentUrl = window.location.href
  if (currentUrl === lastUrl) return
  lastUrl = currentUrl

  if (activeTracker) {
    activeTracker.destroy()
    activeTracker = null
  }
  stopObservation()
  isSubmitting = false

  console.log("[Kepr] Initializing GFG problem page tracking...")

  const problem = await adapter.getProblemData()
  if (!problem) {
    setTimeout(initializeProblemPage, 1000)
    return
  }

  currentProblemData = problem
  await storageService.setCurrentProblem(problem)

  const existingStatus = await storageService.getSyncStatus(problem.slug)
  if (!existingStatus) {
    await storageService.setSyncStatus(problem.slug, "unsaved")
  }

  activeTracker = new ActivityTracker(problem.slug)
  await activeTracker.init()

  window.postMessage({ source: "kepr-isolated", type: "GET_CURRENT_LANGUAGE" }, "*")
}

function startObservation() {
  stopObservation()

  observer = new MutationObserver(async () => {
    if (!isSubmitting || !currentProblemData || !activeTracker) return

    if (adapter.detectPendingState()) {
      return
    }

    if (adapter.detectAcceptedState()) {
      console.log("[Kepr] GFG Submission ACCEPTED! Initiating sync...")
      isSubmitting = false
      stopObservation()

      await storageService.setSyncStatus(currentProblemData.slug, "saving")

      onCodeExtracted = async (payload) => {
        onCodeExtracted = null
        const { code, language } = payload
        if (!code) {
          console.error("[Kepr] Failed to extract solution code from editor.")
          await storageService.setSyncStatus(
            currentProblemData.slug,
            "error",
            "Could not read code from Editor. Try refreshing the page."
          )
          return
        }

        const session = await activeTracker.getSessionData()
        const solvedAt = new Date().toISOString()
        const duration = Math.round(activeTracker ? await activeTracker.getFinalDuration() : 0)
        const notes = await storageService.getNotes(currentProblemData.slug)

        await storageService.clearActiveSession(currentProblemData.slug)

        chrome.runtime.sendMessage({
          type: "SAVE_SUBMISSION",
          payload: {
            code,
            language,
            problemData: currentProblemData,
            sessionData: {
              startedAt: session ? session.startedAt : solvedAt,
              solvedAt,
              activeDurationSeconds: duration
            },
            notes
          }
        })
      }

      window.postMessage({ source: "kepr-isolated", type: "GET_CODE_AND_LANG" }, "*")
      return
    }

    if (adapter.detectFailedState()) {
      console.log("[Kepr] GFG Submission failed. Halting observation.")
      isSubmitting = false
      stopObservation()
    }
  })

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true
  })
}

function stopObservation() {
  if (observer) {
    observer.disconnect()
    observer = null
  }
}

// Watch for clicks on the Submit button
document.addEventListener("click", (event) => {
  const target = event.target as HTMLElement
  const button = target.closest("button")
  if (!button) return
  const btnText = button.textContent?.trim() || ""

  // Match "Submit" button on GFG
  const isSubmitBtn = /^\s*Submit\s*$/i.test(btnText)

  if (isSubmitBtn && currentProblemData) {
    isSubmitting = true
    startObservation()
  }
})

initializeProblemPage()

window.addEventListener("beforeunload", () => {
  if (activeTracker) {
    activeTracker.destroy()
  }
})

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GET_ACTIVE_PROBLEM") {
    sendResponse({ problem: currentProblemData })
    return true
  }
  if (message.type === "MANUAL_SYNC_TRIGGER" && currentProblemData && activeTracker) {
    console.log("[Kepr] Manual sync triggered from GFG popup!")
    isSubmitting = false
    stopObservation()

    storageService.setSyncStatus(currentProblemData.slug, "saving").then(() => {
      onCodeExtracted = async (payload) => {
        onCodeExtracted = null
        const { code, language } = payload
        if (!code) {
          await storageService.setSyncStatus(
            currentProblemData.slug,
            "error",
            "Could not read code from Editor. Try refreshing the page."
          )
          return
        }

        const session = await activeTracker.getSessionData()
        const solvedAt = new Date().toISOString()
        const duration = Math.round(activeTracker ? await activeTracker.getFinalDuration() : 0)
        const notes = await storageService.getNotes(currentProblemData.slug)

        await storageService.clearActiveSession(currentProblemData.slug)

        chrome.runtime.sendMessage({
          type: "SAVE_SUBMISSION",
          payload: {
            code,
            language,
            problemData: currentProblemData,
            sessionData: {
              startedAt: session ? session.startedAt : solvedAt,
              solvedAt,
              activeDurationSeconds: duration
            },
            notes
          }
        })
      }

      window.postMessage({ source: "kepr-isolated", type: "GET_CODE_AND_LANG" }, "*")
    })
  }
})

// Interval loop to monitor client-side SPA URL changes & query active language
setInterval(() => {
  if (window.location.href !== lastUrl && (window.location.pathname.includes("/problems/"))) {
    initializeProblemPage()
  } else if (currentProblemData) {
    window.postMessage({ source: "kepr-isolated", type: "GET_CURRENT_LANGUAGE" }, "*")
  }
}, 1000)
