import type { ProblemData } from "../types/problem"
import type { PlatformAdapter } from "./adapter"

export class GFGAdapter implements PlatformAdapter {
  async getProblemData(): Promise<ProblemData | null> {
    if (
      typeof window !== "undefined" &&
      !window.location.hostname.includes("geeksforgeeks.org")
    ) {
      return null
    }
    const scriptTag = document.getElementById("__NEXT_DATA__")
    if (!scriptTag || !scriptTag.textContent) {
      return null
    }

    try {
      const nextData = JSON.parse(scriptTag.textContent)
      const probData = nextData?.props?.pageProps?.initialState?.problemData?.allData?.probData
      if (!probData) return null

      const topics =
        probData.tags?.topic_tags?.map((t: any) =>
          typeof t === "string" ? t : t.name
        ) ?? []

      const companies =
        probData.tags?.company_tags?.map((t: any) =>
          typeof t === "string" ? t : t.name
        ) ?? []

      return {
        id: "",
        title: probData.problem_name || "",
        slug: probData.slug || "",
        difficulty: probData.difficulty || "",
        topics: probData.tags?.topic_tags ?? [],
        companies: probData.tags?.company_tags ?? [],
        url: window.location.href,
        platform: "geeksforgeeks"
      }
    } catch (error) {
      console.error("[Kepr] Error parsing GFG __NEXT_DATA__:", error)
      return null
    }
  }

  detectPendingState(): boolean {
    const text = document.body.innerText
    return (
      text.includes("Running...") ||
      text.includes("Evaluating...") ||
      text.includes("Queued...") ||
      text.includes("Compiling...")
    )
  }

  detectAcceptedState(): boolean {
    const text = document.body.innerText
    return (
      text.includes("Problem Solved Successfully") ||
      text.includes("Correct Answer")
    )
  }

  detectFailedState(): boolean {
    const text = document.body.innerText
    const failedTerms = [
      "Wrong Answer",
      "Time Limit Exceeded",
      "Memory Limit Exceeded",
      "Runtime Error",
      "Compile Error",
      "Compilation Error",
      "Output Limit Exceeded"
    ]
    return failedTerms.some((term) => text.includes(term))
  }
}
