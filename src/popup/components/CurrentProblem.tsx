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
        No active problem page open
      </div>
    )
  }

  const platformLabel = problem.platform === "geeksforgeeks" ? "GeeksForGeeks" : "LeetCode"

  return (
    <div className="bg-card rounded-lg border border-border/60 p-2.5 select-none space-y-1">
      <div className="flex justify-between items-center text-[9px] font-semibold text-muted-foreground/80 uppercase tracking-wider">
        <span>Active Problem</span>
        <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded-md text-[8.5px]">
          {platformLabel}
        </span>
      </div>
      <h2 className="text-[11px] font-bold text-foreground leading-snug truncate">
        {problem.id && !isNaN(Number(problem.id)) && Number(problem.id) !== 0 ? `${Number(problem.id)}. ` : ""}{problem.title}
      </h2>
    </div>
  )
}
export default CurrentProblem
