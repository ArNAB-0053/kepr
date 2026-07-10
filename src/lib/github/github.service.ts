import { getOctokitClient } from "./github.client"
import type { GitHubSettings } from "../types/settings"
import type { SubmissionMetadata } from "../types/metadata"
import type { Octokit } from "@octokit/rest"

/**
 * Resolves repository string (handles both "owner/repo" and "repo" inputs).
 * If owner is not provided, queries the authenticated user details to extract the owner login.
 */
export async function parseRepo(octokit: Octokit, repoString: string): Promise<{ owner: string; repo: string }> {
  const parts = repoString.split("/")
  if (parts.length === 2) {
    return { owner: parts[0].trim(), repo: parts[1].trim() }
  }
  const { data: user } = await octokit.users.getAuthenticated()
  return { owner: user.login, repo: repoString.trim() }
}

/**
 * Encodes a string to base64 safely in both browser and service worker contexts.
 */
function toBase64(str: string): string {
  try {
    return Buffer.from(str, "utf-8").toString("base64")
  } catch (e) {
    return btoa(unescape(encodeURIComponent(str)))
  }
}

/**
 * Retrieves the SHA hash of a file if it exists, otherwise returns null.
 * Required for updating files in the GitHub Contents API.
 */
async function getFileSha(octokit: Octokit, owner: string, repo: string, path: string): Promise<string | null> {
  try {
    const { data } = await octokit.repos.getContent({
      owner,
      repo,
      path,
    })
    if (!Array.isArray(data) && data.type === "file") {
      return data.sha
    }
    return null
  } catch (error: any) {
    if (error.status === 404) {
      return null
    }
    throw error
  }
}

/**
 * Service to manage GitHub API integration.
 */
export const githubService = {
  /**
   * Validates if the GitHub PAT token is correct and has access to the specified repository.
   */
  async validateCredentials(pat: string, repoString: string): Promise<{ isValid: boolean; error?: string }> {
    try {
      const octokit = getOctokitClient(pat)
      // 1. Check token validity by fetching authenticated user details
      await octokit.users.getAuthenticated()
      
      // 2. Resolve owner and repo details
      const { owner, repo } = await parseRepo(octokit, repoString)
      
      // 3. Check repository access
      await octokit.repos.get({
        owner,
        repo,
      })
      
      return { isValid: true }
    } catch (error: any) {
      console.error("[Kepr] GitHub validation failed:", error)
      let message = "Failed to connect to GitHub."
      if (error.status === 401) {
        message = "Invalid Personal Access Token (401 Unauthorized)."
      } else if (error.status === 404) {
        message = `Repository "${repoString}" not found. Verify owner/repo name and token scopes.`
      } else if (error.message) {
        message = error.message
      }
      return { isValid: false, error: message }
    }
  },

  /**
   * Pushes a LeetCode submission to GitHub: solution code, notes.md (if missing), and metadata.json.
   * If metadata.json already exists, merges solving time and preserves initial timestamps.
   */
  async pushSubmission(
    settings: GitHubSettings,
    metadata: SubmissionMetadata,
    code: string,
    notes: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const octokit = getOctokitClient(settings.pat)
      const { owner, repo } = await parseRepo(octokit, settings.repo)
      
      // Determine platform-specific folder path
      const folderName = metadata.platform === "leetcode" && metadata.id
        ? `${metadata.id}-${metadata.slug}`
        : metadata.slug
        
      const platformDir = metadata.platform === "leetcode"
        ? (settings.leetcodeDir || "LeetCode")
        : (settings.geeksforgeeksDir || "GeeksForGeeks")
      
      const folderPath = `${platformDir}/${folderName}`
      
      // 1. Push solution code file
      const fileExt = getFileExtension(metadata.language)
      const solutionPath = `${folderPath}/solution${fileExt}`
      const solutionSha = await getFileSha(octokit, owner, repo, solutionPath)
      
      await octokit.repos.createOrUpdateFileContents({
        owner,
        repo,
        path: solutionPath,
        message: `Kepr: Sync solution for "${metadata.title}" [${metadata.language}]`,
        content: toBase64(code),
        sha: solutionSha || undefined,
      })

      // 2. Push notes.md (overwrite with custom notes or default template)
      const notesPath = `${folderPath}/notes.md`
      const notesSha = await getFileSha(octokit, owner, repo, notesPath)
      
      const notesContent = notes.trim() !== "" ? notes : `# Notes\n\nAdd your revision notes here.\n`
      await octokit.repos.createOrUpdateFileContents({
        owner,
        repo,
        path: notesPath,
        message: `Kepr: Sync notes.md for "${metadata.title}"`,
        content: toBase64(notesContent),
        sha: notesSha || undefined,
      })

      // 3. Push metadata.json (merge with existing if present)
      const metadataPath = `${folderPath}/metadata.json`
      const metadataSha = await getFileSha(octokit, owner, repo, metadataPath)
      
      let finalMetadata = metadata
      if (metadataSha) {
        try {
          const response: any = await octokit.repos.getContent({
            owner,
            repo,
            path: metadataPath,
          })
          const rawContent = Buffer.from(response.data.content, "base64").toString("utf-8")
          const existingMetadata = JSON.parse(rawContent) as SubmissionMetadata
          
          const now = new Date().toISOString()
          finalMetadata = {
            ...metadata,
            createdAt: existingMetadata.createdAt || existingMetadata.createdAt || now,
            startedAt: existingMetadata.startedAt || metadata.startedAt,
            activeDurationSeconds: Math.round((existingMetadata.activeDurationSeconds || 0) + metadata.activeDurationSeconds),
            lastUpdatedAt: now
          }
        } catch (e) {
          console.warn("[Kepr] Failed to merge existing metadata. Overwriting:", e)
        }
      }

      await octokit.repos.createOrUpdateFileContents({
        owner,
        repo,
        path: metadataPath,
        message: `Kepr: Sync metadata.json for "${metadata.title}"`,
        content: toBase64(JSON.stringify(finalMetadata, null, 2)),
        sha: metadataSha || undefined,
      })

      return { success: true }
    } catch (error: any) {
      console.error("[Kepr] GitHub sync error:", error)
      return { success: false, error: error.message || "Failed to commit solution to GitHub." }
    }
  }
}

/**
 * Returns correct file extension for given LeetCode language string.
 */
function getFileExtension(language: string): string {
  const mapping: Record<string, string> = {
    cpp: ".cpp",
    "c++": ".cpp",
    java: ".java",
    python: ".py",
    python3: ".py",
    c: ".c",
    csharp: ".cs",
    "c#": ".cs",
    javascript: ".js",
    typescript: ".ts",
    js: ".js",
    ts: ".ts",
    ruby: ".rb",
    swift: ".swift",
    golang: ".go",
    go: ".go",
    scala: ".scala",
    kotlin: ".kt",
    rust: ".rs",
    php: ".php",
    sql: ".sql",
    database: ".sql",
    mysql: ".sql",
    postgresql: ".sql"
  }
  
  const normalized = language.toLowerCase().trim()
  return mapping[normalized] || ".txt"
}
