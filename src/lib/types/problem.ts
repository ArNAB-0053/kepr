/**
 * Represents the structured metadata of an extracted LeetCode problem.
 */
export interface ProblemData {
  id: string;          // The frontend ID of the problem (e.g., "1" or "0127")
  title: string;       // The human-readable title of the problem (e.g., "Two Sum")
  slug: string;        // The URL slug of the problem (e.g., "two-sum")
  difficulty: string;  // The difficulty level (e.g., "Easy", "Medium", "Hard")
  topics: string[];    // Array of topic tags (e.g., ["Array", "Hash Table"])
  companies?: string[]; // Array of company tags (e.g., ["Amazon", "Google"])
  url: string;         // The full problem URL
  language?: string;   // The currently selected language (e.g., "cpp", "python3")
  platform: "leetcode" | "geeksforgeeks"; // The source coding platform
}
