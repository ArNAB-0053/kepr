import type { ProblemData } from "../types/problem"

export interface PlatformAdapter {
  getProblemData(): Promise<ProblemData | null>
  detectPendingState(): boolean
  detectAcceptedState(): boolean
  detectFailedState(): boolean
}
