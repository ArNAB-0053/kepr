import React, { useState, useEffect } from "react"
import { Eye, EyeOff, Key, FolderGit2, FolderClosed, CheckCircle2, XCircle, RefreshCw } from "lucide-react"
import type { GitHubSettings as SettingsType } from "~lib/types/settings"
import { sanitizePath } from "~lib/utils/path"

interface GitHubSettingsProps {
  initialSettings: SettingsType
  onSave: (settings: SettingsType) => void
  onTestConnection: (pat: string, repo: string) => Promise<{ success: boolean; error?: string }>
}

/**
 * Renders the GitHub configuration form, supporting token visibility toggle, settings saving, and asynchronous connection testing.
 */
export const GitHubSettings: React.FC<GitHubSettingsProps> = ({
  initialSettings,
  onSave,
  onTestConnection,
}) => {
  const [pat, setPat] = useState("")
  const [repo, setRepo] = useState("")
  const [leetcodeDir, setLeetcodeDir] = useState("LeetCode")
  const [geeksforgeeksDir, setGeeksforgeeksDir] = useState("GeeksForGeeks")
  const [showPat, setShowPat] = useState(false)
  
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "success" | "error">("idle")
  const [testError, setTestError] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved">("idle")

  useEffect(() => {
    setPat(initialSettings.pat)
    setRepo(initialSettings.repo)
    setLeetcodeDir(initialSettings.leetcodeDir || "LeetCode")
    setGeeksforgeeksDir(initialSettings.geeksforgeeksDir || "GeeksForGeeks")
  }, [initialSettings])

  const handleSave = () => {
    const sanitizedLeetCode = sanitizePath(leetcodeDir) || "LeetCode"
    const sanitizedGFG = sanitizePath(geeksforgeeksDir) || "GeeksForGeeks"
    onSave({
      pat: pat.trim(),
      repo: repo.trim(),
      leetcodeDir: sanitizedLeetCode,
      geeksforgeeksDir: sanitizedGFG,
      isConfigured: pat.trim() !== "" && repo.trim() !== "",
    })
    setLeetcodeDir(sanitizedLeetCode)
    setGeeksforgeeksDir(sanitizedGFG)
    setSaveStatus("saved")
    setTimeout(() => setSaveStatus("idle"), 2500)
  }



  const handleTest = async () => {
    if (!pat.trim() || !repo.trim()) {
      setTestStatus("error")
      setTestError("Please enter both your PAT and Repository name.")
      return
    }

    setTestStatus("testing")
    setTestError(null)

    const result = await onTestConnection(pat.trim(), repo.trim())
    if (result.success) {
      setTestStatus("success")
    } else {
      setTestStatus("error")
      setTestError(result.error || "Failed to establish a connection.")
    }
  }

  return (
    <div className="space-y-4 text-xs">
      {/* Form Fields */}
      <div className="space-y-3.5 bg-card rounded-xl border border-border p-4">
        {/* GitHub PAT */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            <Key size={12} />
            GitHub Personal Access Token (PAT)
          </label>
          <div className="relative flex items-center">
            <input
              type={showPat ? "text" : "password"}
              value={pat}
              onChange={(e) => setPat(e.target.value)}
              placeholder="github_pat_..."
              className="w-full bg-secondary border border-border rounded-lg pl-3 pr-10 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-mono text-xs placeholder:text-muted-foreground/60 placeholder:font-sans"
            />
            <button
              type="button"
              onClick={() => setShowPat(!showPat)}
              className="absolute right-3 text-muted-foreground hover:text-foreground focus:outline-none"
            >
              {showPat ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </div>

        {/* Repository Name */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            <FolderGit2 size={12} />
            Repository Name
          </label>
          <input
            type="text"
            value={repo}
            onChange={(e) => setRepo(e.target.value)}
            placeholder="e.g. leetcode-sync or owner/repo"
            className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-xs placeholder:text-muted-foreground/60"
          />
        </div>



        {/* LeetCode Directory */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            <FolderClosed size={12} />
            LeetCode Directory
          </label>
          <input
            type="text"
            value={leetcodeDir}
            onChange={(e) => setLeetcodeDir(e.target.value)}
            placeholder="Default: LeetCode"
            className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-xs placeholder:text-muted-foreground/60"
          />
        </div>

        {/* GeeksForGeeks Directory */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            <FolderClosed size={12} />
            GeeksForGeeks Directory
          </label>
          <input
            type="text"
            value={geeksforgeeksDir}
            onChange={(e) => setGeeksforgeeksDir(e.target.value)}
            placeholder="Default: GeeksForGeeks"
            className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-xs placeholder:text-muted-foreground/60"
          />
        </div>
      </div>

      {/* Test Connection Results Banner */}
      {testStatus !== "idle" && (
        <div className={`p-3 rounded-lg border flex gap-2 items-start ${
          testStatus === "success" 
            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
            : testStatus === "error" 
              ? "bg-rose-500/10 border-rose-500/20 text-rose-400" 
              : "bg-blue-500/10 border-blue-500/20 text-blue-400"
        }`}>
          {testStatus === "success" && (
            <>
              <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-bold leading-none">Connection Successful</p>
                <p className="text-[10px] text-emerald-500/85 mt-1 leading-normal font-medium">Successfully authenticated and verified repository permissions.</p>
              </div>
            </>
          )}
          {testStatus === "error" && (
            <>
              <XCircle size={16} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-bold leading-none">Connection Failed</p>
                <p className="text-[10px] text-rose-500/85 mt-1 leading-normal font-medium">{testError}</p>
              </div>
            </>
          )}
          {testStatus === "testing" && (
            <>
              <RefreshCw size={16} className="shrink-0 mt-0.5 animate-spin" />
              <div>
                <p className="font-bold leading-none">Connecting to GitHub</p>
                <p className="text-[10px] text-blue-500/85 mt-1 leading-normal font-medium">Testing Personal Access Token scopes and repository write access...</p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Form Buttons */}
      <div className="flex gap-2.5">
        <button
          onClick={handleTest}
          disabled={testStatus === "testing"}
          className="flex-1 border border-border bg-secondary hover:bg-secondary/80 text-foreground py-2 rounded-lg font-semibold transition-all duration-200 select-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20 text-center"
        >
          Test Connection
        </button>
        <button
          onClick={handleSave}
          disabled={testStatus === "testing"}
          className="flex-1 bg-primary hover:bg-primary/95 text-primary-foreground py-2 rounded-lg font-semibold transition-all duration-200 select-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background text-center shadow-md shadow-primary/10"
        >
          {saveStatus === "saved" ? "Settings Saved ✓" : "Save Settings"}
        </button>
      </div>
    </div>
  )
}
export default GitHubSettings
