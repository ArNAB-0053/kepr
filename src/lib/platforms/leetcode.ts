import { getProblemData } from "../leetcode/extractProblem"
import { detectAcceptedState, detectFailedState, detectPendingState } from "../leetcode/extractSubmission"
import type { PlatformAdapter } from "./adapter"
import type { ProblemData } from "../types/problem"

export class LeetCodeAdapter implements PlatformAdapter {
  async getProblemData(): Promise<ProblemData | null> {
    if (typeof window !== "undefined" && !window.location.hostname.includes("leetcode.com")) {
      return null
    }
    const data = await getProblemData()
    if (data) {
      data.platform = "leetcode"
    }
    return data
  }

  detectPendingState(): boolean {
    return detectPendingState()
  }

  detectAcceptedState(): boolean {
    return detectAcceptedState()
  }

  detectFailedState(): boolean {
    return detectFailedState()
  }
}
