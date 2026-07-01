import type { PlasmoCSConfig } from "plasmo"

/**
 * Plasmo content script config.
 * Runs in the MAIN world to access LeetCode's page-level global variables (window.monaco).
 */
export const config: PlasmoCSConfig = {
  matches: ["https://leetcode.com/problems/*"],
  world: "MAIN"
}

/**
 * Listen for messages from the ISOLATED world content script.
 * When requested, reads the active code value and language configuration from Monaco Editor
 * and sends it back.
 */
window.addEventListener("message", (event) => {
  // Security check: only respond to messages originating from the same page window
  if (event.source !== window || !event.data || event.data.source !== "kepr-isolated") {
    return
  }

  if (event.data.type === "GET_CODE_AND_LANG") {
    try {
      const editors = (window as any).monaco?.editor?.getEditors()
      if (editors && editors.length > 0) {
        // The first Monaco editor instance is the primary writing workspace
        const editor = editors[0]
        const code = editor.getValue()
        const model = editor.getModel()
        const language = model ? model.getLanguageId() : "javascript"

        // Send results back to the ISOLATED world content script
        window.postMessage({
          source: "kepr-main",
          type: "SEND_CODE_AND_LANG",
          payload: { code, language }
        }, "*")
        return
      }
    } catch (error) {
      console.error("[Kepr] Error reading Monaco Editor in MAIN world:", error)
    }

    // Return empty payload fallback
    window.postMessage({
      source: "kepr-main",
      type: "SEND_CODE_AND_LANG",
      payload: { code: "", language: "" }
    }, "*")
  }

  if (event.data.type === "GET_CURRENT_LANGUAGE") {
    try {
      const editors = (window as any).monaco?.editor?.getEditors()
      if (editors && editors.length > 0) {
        const model = editors[0].getModel()
        const language = model ? model.getLanguageId() : "unknown"

        window.postMessage({
          source: "kepr-main",
          type: "SEND_CURRENT_LANGUAGE",
          language
        }, "*")
        return
      }
    } catch (error) {
      console.error("[Kepr] Error reading Monaco Editor language in MAIN world:", error)
    }

    // Fallback if editor not ready/accessible
    window.postMessage({
      source: "kepr-main",
      type: "SEND_CURRENT_LANGUAGE",
      language: "unknown"
    }, "*")
  }
})
