import type { ProblemData } from "./problem"

/**
 * Represents the final structured JSON object saved in the GitHub repository.
 * Comprises both problem details and submission metrics (active duration, timestamps).
 */
export interface SubmissionMetadata extends ProblemData {
  platform: "leetcode" | "geeksforgeeks"
  language: string               // E.g. "python3", "cpp", "javascript"
  startedAt: string             // ISO string when problem tracking started
  solvedAt: string              // ISO string when submission was accepted
  activeDurationSeconds: number // Total seconds spent actively coding
  createdAt: string             // ISO string of first submission sync
  lastUpdatedAt: string         // ISO string of latest resubmission sync
}
