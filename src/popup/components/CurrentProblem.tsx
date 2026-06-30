import React from "react"
import type { ProblemData } from "~lib/types/problem"

interface CurrentProblemProps {
  problem: ProblemData | null
}

/**
 * Minimalist display showing only the active problem number and title,
 * stripping away all metrics, difficulty indicators, and clocks.
 */
export const CurrentProblem: React.FC<CurrentProblemProps> = ({ problem }) => {
  if (!problem) {
    return (
      <div className="py-2.5 text-center text-[10px] text-muted-foreground bg-secondary/35 rounded-lg border border-border/50 select-none">
        No active LeetCode problem page open
      </div>
    )
  }

  return (
    <div className="bg-card rounded-lg border border-border/60 p-2.5 select-none">
      <h2 className="text-[11px] font-bold text-foreground leading-snug truncate">
        {Number(problem.id)}. {problem.title}
      </h2>
    </div>
  )
}
export default CurrentProblem
