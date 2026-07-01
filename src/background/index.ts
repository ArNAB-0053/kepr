import { storageService } from "~lib/storage/storage.service"
import { githubService } from "~lib/github/github.service"
import { buildSubmissionMetadata } from "~lib/leetcode/extractMetadata"

console.log("[Kepr] Background worker initialized 🚀")

/**
 * Event listener: Handles incoming messages from content scripts.
 * Runs asynchronously to ensure network operations succeed even if the user closes the tab.
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "SAVE_SUBMISSION") {
    const { code, language, problemData, sessionData, notes } = message.payload
    
    // Trigger async processing and immediately release the port channel
    handleSubmissionSave(code, language, problemData, sessionData, notes || "")
    return true
  }
})

/**
 * Handles compiling metadata and pushing solution files and notes to GitHub.
 * Updates storage sync status to reflect progress/results in popup and contents.
 */
async function handleSubmissionSave(
  code: string,
  language: string,
  problemData: any,
  sessionData: any,
  notes: string
) {
  const slug = problemData.slug
  console.log(`[Kepr] Background worker starting sync for: ${problemData.title}`)

  try {
    // 1. Fetch GitHub settings
    const settings = await storageService.getGitHubSettings()
    if (!settings.isConfigured || !settings.pat || !settings.repo) {
      console.warn("[Kepr] GitHub settings are missing or unconfigured.")
      await storageService.setSyncStatus(
        slug,
        "error",
        "GitHub integration is not configured. Please open settings in the extension popup."
      )
      return
    }

    // 2. Retrieve cached sync metadata from previous solution if it exists (for resubmissions)
    const existingMetadata = await storageService.getLastSyncMetadata(slug)

    // 3. Compile the final metadata JSON representation
    const metadata = buildSubmissionMetadata(
      problemData,
      language,
      sessionData.activeDurationSeconds,
      sessionData.startedAt,
      sessionData.solvedAt,
      existingMetadata
    )

    // 4. Push files (solution code, notes.md, metadata.json) to GitHub via service API
    const result = await githubService.pushSubmission(settings, metadata, code, notes)

    if (result.success) {
      console.log(`[Kepr] Successfully pushed solution for "${problemData.title}" to GitHub!`)
      // Cache the sync details and update status
      await storageService.setLastSyncMetadata(slug, metadata)
      await storageService.setSyncStatus(slug, "saved")
    } else {
      console.error(`[Kepr] Failed to push solution: ${result.error}`)
      await storageService.setSyncStatus(slug, "error", result.error || "GitHub commit failed.")
    }
  } catch (error: any) {
    console.error("[Kepr] Unexpected error in background worker sync:", error)
    await storageService.setSyncStatus(slug, "error", error.message || "An unexpected error occurred during sync.")
  }
}
