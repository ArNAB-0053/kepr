import type { GitHubSettings } from "../types/settings"
import type { ProblemData } from "../types/problem"
import type { SubmissionMetadata } from "../types/metadata"
import { DEFAULT_GITHUB_SETTINGS } from "../constants/settings"

export interface ActiveSession {
  startedAt: string
  activeDurationSeconds: number
  lastActiveTimestamp: number | null
}

const STORAGE_KEYS = {
  GITHUB_SETTINGS: "github_settings",
  CURRENT_PROBLEM: "current_problem",
  SESSION_PREFIX: "session_",
  SYNC_STATUS_PREFIX: "sync_status_",
  METADATA_PREFIX: "meta_",
  NOTES_PREFIX: "notes_",
}

// In-memory mock storage fallback for non-extension (e.g. localhost dev server) environments
const mockStore: Record<string, any> = {}

// Tracks active callbacks for change events
const changeCallbacks = new Set<(changes: Record<string, any>) => void>()
let isChromeListenerRegistered = false

/**
 * Checks if the extension context is fully active and chrome APIs are accessible.
 * Catches "Extension context invalidated" errors.
 */
export function isExtensionContextActive(): boolean {
  try {
    return (
      typeof chrome !== "undefined" &&
      chrome.runtime !== undefined &&
      chrome.runtime.id !== undefined &&
      chrome.storage !== undefined &&
      chrome.storage.local !== undefined
    )
  } catch (error) {
    return false
  }
}

// Global listener that maps chrome storage updates to active callbacks
const chromeStorageChangeListener = (
  changes: { [key: string]: chrome.storage.StorageChange },
  areaName: string
) => {
  if (areaName !== "local") return

  try {
    const updatedValues: Record<string, any> = {}
    for (const [key, change] of Object.entries(changes)) {
      updatedValues[key] = change.newValue
    }
    
    // Distribute updates to all active hooks
    changeCallbacks.forEach((cb) => {
      try {
        cb(updatedValues)
      } catch (err) {
        console.error("[Kepr] Error in storage change subscriber callback:", err)
      }
    })
  } catch (error) {
    console.error("[Kepr] Error processing chrome storage onChanged event:", error)
  }
}

/**
 * Service to handle data persistence inside chrome.storage.local.
 * Includes complete environment checks, try-catch blocks, and in-memory mock fallbacks.
 */
export const storageService = {
  /**
   * Diagnostic function to log storage and context environment details.
   */
  logDiagnostics(): void {
    const hasChrome = typeof chrome !== "undefined"
    const hasStorage = hasChrome && chrome.storage !== undefined
    const activeContext = isExtensionContextActive()
    
    console.log("[Kepr] --- Diagnostics ---")
    console.log(`- Browser 'chrome' object defined: ${hasChrome}`)
    console.log(`- 'chrome.storage' defined: ${hasStorage}`)
    console.log(`- Extension context active: ${activeContext}`)
    console.log(`- Mock storage fallback active: ${!activeContext}`)
    console.log("-------------------------------")
  },

  /**
   * Retrieves notes for a specific problem slug.
   */
  async getNotes(slug: string): Promise<string> {
    const key = `${STORAGE_KEYS.NOTES_PREFIX}${slug}`
    if (!isExtensionContextActive()) {
      return mockStore[key] || ""
    }

    return new Promise((resolve) => {
      try {
        chrome.storage.local.get([key], (result) => {
          if (chrome.runtime.lastError) {
            console.error("[Kepr] getNotes error:", chrome.runtime.lastError.message)
            resolve("")
          } else {
            resolve(result[key] || "")
          }
        })
      } catch (error) {
        console.error("[Kepr] Failed to access getNotes:", error)
        resolve("")
      }
    })
  },

  /**
   * Saves notes for a specific problem slug.
   */
  async setNotes(slug: string, notes: string): Promise<void> {
    const key = `${STORAGE_KEYS.NOTES_PREFIX}${slug}`
    if (!isExtensionContextActive()) {
      mockStore[key] = notes
      this.triggerMockChange({ [key]: notes })
      return
    }

    return new Promise((resolve) => {
      try {
        chrome.storage.local.set({ [key]: notes }, () => {
          if (chrome.runtime.lastError) {
            console.error("[Kepr] setNotes error:", chrome.runtime.lastError.message)
          }
          resolve()
        })
      } catch (error) {
        console.error("[Kepr] Failed to access setNotes:", error)
        resolve()
      }
    })
  },

  /**
   * Clears notes for a specific problem slug.
   */
  async clearNotes(slug: string): Promise<void> {
    const key = `${STORAGE_KEYS.NOTES_PREFIX}${slug}`
    if (!isExtensionContextActive()) {
      delete mockStore[key]
      this.triggerMockChange({ [key]: null })
      return
    }

    return new Promise((resolve) => {
      try {
        chrome.storage.local.remove([key], () => {
          if (chrome.runtime.lastError) {
            console.error("[Kepr] clearNotes error:", chrome.runtime.lastError.message)
          }
          resolve()
        })
      } catch (error) {
        console.error("[Kepr] Failed to access clearNotes:", error)
        resolve()
      }
    })
  },

  /**
   * Retrieves user GitHub settings.
   */
  async getGitHubSettings(): Promise<GitHubSettings> {
    if (!isExtensionContextActive()) {
      const settings = mockStore[STORAGE_KEYS.GITHUB_SETTINGS] || DEFAULT_GITHUB_SETTINGS
      if (settings) {
        settings.leetcodeDir = settings.leetcodeDir || "LeetCode"
        settings.geeksforgeeksDir = settings.geeksforgeeksDir || "GeeksForGeeks"
      }
      return settings
    }

    return new Promise((resolve) => {
      try {
        chrome.storage.local.get([STORAGE_KEYS.GITHUB_SETTINGS], (result) => {
          if (chrome.runtime.lastError) {
            console.error("[Kepr] getGitHubSettings error:", chrome.runtime.lastError.message)
            resolve(DEFAULT_GITHUB_SETTINGS)
          } else {
            const settings = result[STORAGE_KEYS.GITHUB_SETTINGS] || DEFAULT_GITHUB_SETTINGS
            if (settings) {
              settings.leetcodeDir = settings.leetcodeDir || "LeetCode"
              settings.geeksforgeeksDir = settings.geeksforgeeksDir || "GeeksForGeeks"
            }
            resolve(settings)
          }
        })
      } catch (error) {
        console.error("[Kepr] Failed to access getGitHubSettings:", error)
        resolve(DEFAULT_GITHUB_SETTINGS)
      }
    })
  },

  /**
   * Saves user GitHub settings.
   */
  async setGitHubSettings(settings: GitHubSettings): Promise<void> {
    if (!isExtensionContextActive()) {
      mockStore[STORAGE_KEYS.GITHUB_SETTINGS] = settings
      this.triggerMockChange({ [STORAGE_KEYS.GITHUB_SETTINGS]: settings })
      return
    }

    return new Promise((resolve) => {
      try {
        chrome.storage.local.set({ [STORAGE_KEYS.GITHUB_SETTINGS]: settings }, () => {
          if (chrome.runtime.lastError) {
            console.error("[Kepr] setGitHubSettings error:", chrome.runtime.lastError.message)
          }
          resolve()
        })
      } catch (error) {
        console.error("[Kepr] Failed to access setGitHubSettings:", error)
        resolve()
      }
    })
  },

  /**
   * Retrieves the current tracking session for a specific problem slug.
   */
  async getActiveSession(slug: string): Promise<ActiveSession | null> {
    const key = `${STORAGE_KEYS.SESSION_PREFIX}${slug}`
    if (!isExtensionContextActive()) {
      return mockStore[key] || null
    }

    return new Promise((resolve) => {
      try {
        chrome.storage.local.get([key], (result) => {
          if (chrome.runtime.lastError) {
            console.error("[Kepr] getActiveSession error:", chrome.runtime.lastError.message)
            resolve(null)
          } else {
            resolve(result[key] || null)
          }
        })
      } catch (error) {
        console.error("[Kepr] Failed to access getActiveSession:", error)
        resolve(null)
      }
    })
  },

  /**
   * Saves the tracking session for a specific problem slug.
   */
  async setActiveSession(slug: string, session: ActiveSession): Promise<void> {
    const key = `${STORAGE_KEYS.SESSION_PREFIX}${slug}`
    if (!isExtensionContextActive()) {
      mockStore[key] = session
      this.triggerMockChange({ [key]: session })
      return
    }

    return new Promise((resolve) => {
      try {
        chrome.storage.local.set({ [key]: session }, () => {
          if (chrome.runtime.lastError) {
            console.error("[Kepr] setActiveSession error:", chrome.runtime.lastError.message)
          }
          resolve()
        })
      } catch (error) {
        console.error("[Kepr] Failed to access setActiveSession:", error)
        resolve()
      }
    })
  },

  /**
   * Clears the tracking session for a specific problem slug.
   */
  async clearActiveSession(slug: string): Promise<void> {
    const key = `${STORAGE_KEYS.SESSION_PREFIX}${slug}`
    if (!isExtensionContextActive()) {
      delete mockStore[key]
      this.triggerMockChange({ [key]: null })
      return
    }

    return new Promise((resolve) => {
      try {
        chrome.storage.local.remove([key], () => {
          if (chrome.runtime.lastError) {
            console.error("[Kepr] clearActiveSession error:", chrome.runtime.lastError.message)
          }
          resolve()
        })
      } catch (error) {
        console.error("[Kepr] Failed to access clearActiveSession:", error)
        resolve()
      }
    })
  },

  /**
   * Gets the problem the user is currently viewing.
   */
  async getCurrentProblem(): Promise<ProblemData | null> {
    if (!isExtensionContextActive()) {
      return mockStore[STORAGE_KEYS.CURRENT_PROBLEM] || null
    }

    return new Promise((resolve) => {
      try {
        chrome.storage.local.get([STORAGE_KEYS.CURRENT_PROBLEM], (result) => {
          if (chrome.runtime.lastError) {
            console.error("[Kepr] getCurrentProblem error:", chrome.runtime.lastError.message)
            resolve(null)
          } else {
            resolve(result[STORAGE_KEYS.CURRENT_PROBLEM] || null)
          }
        })
      } catch (error) {
        console.error("[Kepr] Failed to access getCurrentProblem:", error)
        resolve(null)
      }
    })
  },

  /**
   * Sets the problem the user is currently viewing.
   */
  async setCurrentProblem(problem: ProblemData | null): Promise<void> {
    if (!isExtensionContextActive()) {
      mockStore[STORAGE_KEYS.CURRENT_PROBLEM] = problem
      this.triggerMockChange({ [STORAGE_KEYS.CURRENT_PROBLEM]: problem })
      return
    }

    return new Promise((resolve) => {
      try {
        chrome.storage.local.set({ [STORAGE_KEYS.CURRENT_PROBLEM]: problem }, () => {
          if (chrome.runtime.lastError) {
            console.error("[Kepr] setCurrentProblem error:", chrome.runtime.lastError.message)
          }
          resolve()
        })
      } catch (error) {
        console.error("[Kepr] Failed to access setCurrentProblem:", error)
        resolve()
      }
    })
  },

  /**
   * Gets the synchronization status (unsaved, saving, saved, error) of a problem.
   */
  async getSyncStatus(slug: string): Promise<{ status: "unsaved" | "saving" | "saved" | "error"; error?: string } | null> {
    const key = `${STORAGE_KEYS.SYNC_STATUS_PREFIX}${slug}`
    if (!isExtensionContextActive()) {
      return mockStore[key] || null
    }

    return new Promise((resolve) => {
      try {
        chrome.storage.local.get([key], (result) => {
          if (chrome.runtime.lastError) {
            console.error("[Kepr] getSyncStatus error:", chrome.runtime.lastError.message)
            resolve(null)
          } else {
            resolve(result[key] || null)
          }
        })
      } catch (error) {
        console.error("[Kepr] Failed to access getSyncStatus:", error)
        resolve(null)
      }
    })
  },

  /**
   * Sets the synchronization status of a problem.
   */
  async setSyncStatus(slug: string, status: "unsaved" | "saving" | "saved" | "error", error?: string): Promise<void> {
    const key = `${STORAGE_KEYS.SYNC_STATUS_PREFIX}${slug}`
    const payload = { status, error, timestamp: Date.now() }
    if (!isExtensionContextActive()) {
      mockStore[key] = payload
      this.triggerMockChange({ [key]: payload })
      return
    }

    return new Promise((resolve) => {
      try {
        chrome.storage.local.set({ [key]: payload }, () => {
          if (chrome.runtime.lastError) {
            console.error("[Kepr] setSyncStatus error:", chrome.runtime.lastError.message)
          }
          resolve()
        })
      } catch (error) {
        console.error("[Kepr] Failed to access setSyncStatus:", error)
        resolve()
      }
    })
  },

  /**
   * Gets the metadata of the last successful submission sync for a problem.
   */
  async getLastSyncMetadata(slug: string): Promise<SubmissionMetadata | null> {
    const key = `${STORAGE_KEYS.METADATA_PREFIX}${slug}`
    if (!isExtensionContextActive()) {
      return mockStore[key] || null
    }

    return new Promise((resolve) => {
      try {
        chrome.storage.local.get([key], (result) => {
          if (chrome.runtime.lastError) {
            console.error("[Kepr] getLastSyncMetadata error:", chrome.runtime.lastError.message)
            resolve(null)
          } else {
            resolve(result[key] || null)
          }
        })
      } catch (error) {
        console.error("[Kepr] Failed to access getLastSyncMetadata:", error)
        resolve(null)
      }
    })
  },

  /**
   * Saves the metadata of the last successful submission sync for a problem.
   */
  async setLastSyncMetadata(slug: string, metadata: SubmissionMetadata): Promise<void> {
    const key = `${STORAGE_KEYS.METADATA_PREFIX}${slug}`
    if (!isExtensionContextActive()) {
      mockStore[key] = metadata
      this.triggerMockChange({ [key]: metadata })
      return
    }

    return new Promise((resolve) => {
      try {
        chrome.storage.local.set({ [key]: metadata }, () => {
          if (chrome.runtime.lastError) {
            console.error("[Kepr] setLastSyncMetadata error:", chrome.runtime.lastError.message)
          }
          resolve()
        })
      } catch (error) {
        console.error("[Kepr] Failed to access setLastSyncMetadata:", error)
        resolve()
      }
    })
  },

  /**
   * Subscribes to storage changes. Returns an unsubscribe function.
   * Handles chrome.storage.onChanged event listeners safely.
   */
  subscribeToChanges(callback: (changes: Record<string, any>) => void): () => void {
    changeCallbacks.add(callback)

    if (isExtensionContextActive() && !isChromeListenerRegistered) {
      try {
        chrome.storage.onChanged.addListener(chromeStorageChangeListener)
        isChromeListenerRegistered = true
      } catch (error) {
        console.error("[Kepr] Failed to attach chrome storage listener:", error)
      }
    }

    // Return unsubscribe handler
    return () => {
      this.removeListener(callback)
    }
  },

  /**
   * Removes a specific callback listener.
   */
  removeListener(callback: (changes: Record<string, any>) => void): void {
    changeCallbacks.delete(callback)
    
    // If no subscribers remain, clean up Chrome listener to prevent leaks
    if (changeCallbacks.size === 0 && isChromeListenerRegistered) {
      if (isExtensionContextActive()) {
        try {
          chrome.storage.onChanged.removeListener(chromeStorageChangeListener)
        } catch (error) {
          console.error("[Kepr] Failed to detach chrome storage listener:", error)
        }
      }
      isChromeListenerRegistered = false
    }
  },

  // Helper to trigger mock local callback loops
  triggerMockChange(changes: Record<string, any>) {
    changeCallbacks.forEach((cb) => {
      try {
        cb(changes)
      } catch (err) {
        console.error("[Kepr] Error in mock storage change callback:", err)
      }
    })
  }
}
export default storageService
