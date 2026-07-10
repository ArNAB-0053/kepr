import type { PlasmoCSConfig } from "plasmo"

export const config: PlasmoCSConfig = {
  matches: [
    "https://practice.geeksforgeeks.org/problems/*",
    "https://www.geeksforgeeks.org/problems/*"
  ],
  world: "MAIN"
}

window.addEventListener("message", (event) => {
  if (event.source !== window || !event.data || event.data.source !== "kepr-isolated") {
    return
  }

  if (event.data.type === "GET_CODE_AND_LANG") {
    let code = ""
    let language = "unknown"

    try {
      // 1. Try Monaco Editor
      const monaco = (window as any).monaco
      if (monaco && typeof monaco.editor?.getEditors === "function") {
        const editors = monaco.editor.getEditors()
        if (editors && editors.length > 0) {
          const editor = editors[0]
          code = editor.getValue()
          const model = editor.getModel()
          language = model ? model.getLanguageId() : "unknown"
        }
      }
    } catch (error) {
      console.error("[Kepr] Error reading Monaco Editor in GFG MAIN world:", error)
    }

    // 2. Try Ace Editor if code is still empty
    if (!code) {
      try {
        const ace = (window as any).ace
        if (ace && typeof ace.edit === "function") {
          const aceDiv = document.querySelector(".ace_editor")
          if (aceDiv) {
            const editor = ace.edit(aceDiv)
            code = editor.getValue()
            const modeId = editor.getSession()?.getMode()?.$id || ""
            language = modeId.split("/").pop() || "unknown"
          }
        }
      } catch (error) {
        console.error("[Kepr] Error reading Ace Editor in GFG MAIN world:", error)
      }
    }

    window.postMessage({
      source: "kepr-main",
      type: "SEND_CODE_AND_LANG",
      payload: { code, language }
    }, "*")
  }

  if (event.data.type === "GET_CURRENT_LANGUAGE") {
    let language = "unknown"

    try {
      // 1. Try Monaco
      const monaco = (window as any).monaco
      if (monaco && typeof monaco.editor?.getEditors === "function") {
        const editors = monaco.editor.getEditors()
        if (editors && editors.length > 0) {
          const model = editors[0].getModel()
          language = model ? model.getLanguageId() : "unknown"
        }
      }
    } catch (error) {
      console.error("[Kepr] Error reading Monaco Editor language in GFG MAIN world:", error)
    }

    if (language === "unknown") {
      try {
        // 2. Try Ace
        const ace = (window as any).ace
        if (ace && typeof ace.edit === "function") {
          const aceDiv = document.querySelector(".ace_editor")
          if (aceDiv) {
            const editor = ace.edit(aceDiv)
            const modeId = editor.getSession()?.getMode()?.$id || ""
            language = modeId.split("/").pop() || "unknown"
          }
        }
      } catch (error) {
        console.error("[Kepr] Error reading Ace Editor language in GFG MAIN world:", error)
      }
    }

    window.postMessage({
      source: "kepr-main",
      type: "SEND_CURRENT_LANGUAGE",
      language
    }, "*")
  }
})
