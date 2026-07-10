/**
 * Sanitizes a folder path by removing invalid characters and formatting it correctly.
 * Invalid characters for repository/folder paths are: \ : * ? " < > |
 * Collapses consecutive slashes and trims leading/trailing slashes and whitespace.
 */
export function sanitizePath(path: string): string {
  if (!path) return ""
  // Remove invalid characters
  let sanitized = path.replace(/[\\:*?"<>|]/g, "")
  // Collapse consecutive slashes
  sanitized = sanitized.replace(/\/+/g, "/")
  // Trim leading/trailing slashes and whitespace
  sanitized = sanitized.trim().replace(/^\/|\/$/g, "").trim()
  return sanitized
}
