/**
 * Represents the configuration settings for the GitHub integration.
 */
export interface GitHubSettings {
  pat: string;          // GitHub Personal Access Token
  repo: string;         // Repository name (e.g. "leetcode-solutions" or "interview-prep")
  leetcodeDir?: string; // Customizable folder name for LeetCode (default: "LeetCode")
  geeksforgeeksDir?: string; // Customizable folder name for GeeksForGeeks (default: "GeeksForGeeks")
  isConfigured: boolean; // Flag to indicate if settings are configured and valid
}
