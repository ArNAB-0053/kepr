import type { PlasmoCSConfig } from "plasmo"
import { getProblemData } from "~lib/leetcode/extractProblem"
import { detectAcceptedState, detectFailedState, detectPendingState } from "~lib/leetcode/extractSubmission"
import { ActivityTracker } from "~lib/leetcode/activityTracker"
import { storageService } from "~lib/storage/storage.service"

/**
 * Plasmo content script config.
 * Runs in the ISOLATED world (default) which gives us access to Chrome APIs like chrome.runtime.
 */
export const config: PlasmoCSConfig = {
  matches: ["https://leetcode.com/problems/*"]
}

let activeTracker: ActivityTracker | null = null
let currentProblemData: any = null
let lastUrl = ""
let isSubmitting = false
let observer: MutationObserver | null = null

// Callback placeholder for communicating with MAIN world Monaco extractor
let onCodeExtracted: ((payload: { code: string; language: string }) => void) | null = null

/**
 * Receives messages from the MAIN world content script.
 * Handles Monaco editor value extraction and active language updates.
 */
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
      console.log(`[Kepr] Language updated for ${currentProblemData.slug}: ${event.data.language}`)
    }
  }
})

/**
 * Initializes tracking for the problem page.
 * Loads problem details, sets state, and launches the active solving session timer.
 */
async function initializeProblemPage() {
  const currentUrl = window.location.href
  if (currentUrl === lastUrl) return
  lastUrl = currentUrl

  // Destroy previous session tracker if moving between problems client-side
  if (activeTracker) {
    activeTracker.destroy()
    activeTracker = null
  }
  stopObservation()
  isSubmitting = false

  console.log("[Kepr] Initializing problem page tracking...")

  // Extract problem metadata (asynchronously handles GraphQL SPA fallbacks)
  const problem = await getProblemData()
  if (!problem) {
    // If LeetCode's SPA/React Query state isn't hydrated yet, retry
    setTimeout(initializeProblemPage, 1000)
    return
  }

  currentProblemData = problem
  await storageService.setCurrentProblem(problem)
  
  // Initialize sync status to "unsaved" if this problem has never been synced
  const existingStatus = await storageService.getSyncStatus(problem.slug)
  if (!existingStatus) {
    await storageService.setSyncStatus(problem.slug, "unsaved")
  }

  // Create and initialize focus tracker
  activeTracker = new ActivityTracker(problem.slug)
  await activeTracker.init()

  // Query editor language immediately on load
  window.postMessage({ source: "kepr-isolated", type: "GET_CURRENT_LANGUAGE" }, "*")
}

/**
 * Starts observing the DOM for submission result updates.
 */
function startObservation() {
  stopObservation()
  
  observer = new MutationObserver(async () => {
    if (!isSubmitting || !currentProblemData || !activeTracker) return

    // 1. Wait if the submission is currently pending/judging
    if (detectPendingState()) {
      return
    }

    // 2. Submission accepted!
    if (detectAcceptedState()) {
      console.log("[Kepr] Submission ACCEPTED! Initiating sync process...")
      isSubmitting = false
      stopObservation()
      
      // Update problem status in storage
      await storageService.setSyncStatus(currentProblemData.slug, "saving")

      // Define callback to receive code from MAIN world Monaco editor extractor
      onCodeExtracted = async (payload) => {
        onCodeExtracted = null // Consume callback
        
        const { code, language } = payload
        if (!code) {
          console.error("[Kepr] Failed to extract solution code from editor.")
          await storageService.setSyncStatus(
            currentProblemData.slug,
            "error",
            "Could not read code from Monaco Editor. Try refreshing the page."
          )
          return
        }

        // Get final solving statistics
        const session = await activeTracker.getSessionData()
        const solvedAt = new Date().toISOString()
        const duration = Math.round(activeTracker ? await activeTracker.getFinalDuration() : 0)

        // Fetch user's local notes for this problem
        const notes = await storageService.getNotes(currentProblemData.slug)

        // Clear active session since problem is solved
        await storageService.clearActiveSession(currentProblemData.slug)

        // Delegate GitHub push to the background worker (including notes!)
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

      // Query editor code from the MAIN world content script
      window.postMessage({ source: "kepr-isolated", type: "GET_CODE_AND_LANG" }, "*")
      return
    }

    // 3. Submission failed (Wrong Answer, TLE, MLE, etc.)
    if (detectFailedState()) {
      console.log("[Kepr] Submission evaluation failed. Halting sync observation.")
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

// Event listener: Watch for clicks on the Submit button
document.addEventListener("click", (event) => {
  const target = event.target as HTMLElement
  const isSubmitBtn = target.closest('button[data-e2e-locator="console-submit-button"]')
    || (target.tagName === "BUTTON" && target.textContent?.trim() === "Submit")

  if (isSubmitBtn && currentProblemData) {
    isSubmitting = true
    startObservation()
  }
})

// Initialize on page load
initializeProblemPage()

// Flush active time tracker when navigating away or closing the tab
window.addEventListener("beforeunload", () => {
  if (activeTracker) {
    activeTracker.destroy()
  }
})

/**
 * Event listener: Handles manual synchronization triggers sent from the extension popup.
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "MANUAL_SYNC_TRIGGER" && currentProblemData && activeTracker) {
    console.log("[Kepr] Manual sync triggered from popup!")
    isSubmitting = false // Reset standard observation
    stopObservation()
    
    // Trigger sync sequence
    storageService.setSyncStatus(currentProblemData.slug, "saving").then(() => {
      onCodeExtracted = async (payload) => {
        onCodeExtracted = null // Consume callback
        
        const { code, language } = payload
        if (!code) {
          await storageService.setSyncStatus(
            currentProblemData.slug,
            "error",
            "Could not read code from Monaco Editor. Try refreshing the page."
          )
          return
        }

        const session = await activeTracker.getSessionData()
        const solvedAt = new Date().toISOString()
        const duration = Math.round(activeTracker ? await activeTracker.getFinalDuration() : 0)

        // Fetch user's local notes for this problem
        const notes = await storageService.getNotes(currentProblemData.slug)

        // Clear session since it's saved
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

      // Dispatch request to MAIN world script to fetch code
      window.postMessage({ source: "kepr-isolated", type: "GET_CODE_AND_LANG" }, "*")
    })
  }
})

// Interval loop to monitor client-side Next.js SPA URL changes & query active language
setInterval(() => {
  if (window.location.href !== lastUrl && window.location.pathname.startsWith("/problems/")) {
    initializeProblemPage()
  } else if (currentProblemData) {
    // Keep language updated if user changes editor settings
    window.postMessage({ source: "kepr-isolated", type: "GET_CURRENT_LANGUAGE" }, "*")
  }
}, 1000)
