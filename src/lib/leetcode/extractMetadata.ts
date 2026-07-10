import type { ProblemData } from "../types/problem"
import type { SubmissionMetadata } from "../types/metadata"

/**
 * Builds the structured SubmissionMetadata object for metadata.json.
 * If existingMetadata is provided (from a previous sync), it preserves original creation timestamps
 * and accumulates solving duration.
 */
export function buildSubmissionMetadata(
  problem: ProblemData,
  language: string,
  activeSeconds: number,
  startedAt: string,
  solvedAt: string,
  existingMetadata: SubmissionMetadata | null
): SubmissionMetadata {
  const now = new Date().toISOString()
  
  // Preserve initial timestamps if this is a resubmission update
  const createdAt = existingMetadata ? existingMetadata.createdAt : now
  const initialStartedAt = existingMetadata ? existingMetadata.startedAt : startedAt
  
  // Accumulate solving active duration from past sessions
  const accumulatedDuration = existingMetadata
    ? existingMetadata.activeDurationSeconds + activeSeconds
    : activeSeconds

  return {
    id: problem.id,
    title: problem.title,
    slug: problem.slug,
    difficulty: problem.difficulty,
    topics: problem.topics,
    companies: problem.companies,
    platform: problem.platform || "leetcode",
    language,
    url: problem.url,
    startedAt: initialStartedAt,
    solvedAt,
    activeDurationSeconds: Math.round(accumulatedDuration),
    createdAt,
    lastUpdatedAt: now
  }
}
