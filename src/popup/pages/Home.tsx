import React, { useState, useEffect } from "react"
import { CurrentProblem } from "../components/CurrentProblem"
import { SaveButton } from "../components/SaveButton"
import { storageService, isExtensionContextActive } from "~lib/storage/storage.service"
import type { ProblemData } from "~lib/types/problem"
import { AlertTriangle, Eye, FileText, Info, PenSquare } from "lucide-react"
import { marked } from "marked"

/**
 * Custom inline GitHub SVG icon.
 */
const GithubIcon: React.FC<{ size?: number; className?: string }> = ({ size = 16, className = "" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
)

/**
 * Renders the Home tab, refactored to prioritize clean, distraction-free note-taking.
 * Wastes no space on timers, difficulty markers, or topics.
 */
export const Home: React.FC = () => {
  const [problem, setProblem] = useState<ProblemData | null>(null)
  const [syncStatus, setSyncStatus] = useState<"unsaved" | "saving" | "saved" | "error" | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isConfigured, setIsConfigured] = useState(false)
  const [notes, setNotes] = useState("")
  const [mode, setMode] = useState<"edit" | "preview">("edit")

  // Context status flags
  const [isContextInvalidated, setIsContextInvalidated] = useState(false)
  const [isMockActive, setIsMockActive] = useState(false)

  // Initialize data on component mount
  useEffect(() => {
    storageService.logDiagnostics()
    setIsMockActive(!isExtensionContextActive())

    const queryActiveTabProblem = () => {
      if (typeof chrome !== "undefined" && chrome.tabs && chrome.tabs.query) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          try {
            const activeTab = tabs[0]
            if (activeTab && activeTab.id) {
              chrome.tabs.sendMessage(activeTab.id, { type: "GET_ACTIVE_PROBLEM" }, (response) => {
                if (chrome.runtime.lastError) {
                  // Content script not loaded / not a supported page
                  setProblem(null)
                  setSyncStatus(null)
                  setNotes("")
                } else if (response && response.problem) {
                  setProblem(response.problem)
                  storageService.setCurrentProblem(response.problem)
                } else {
                  setProblem(null)
                  setSyncStatus(null)
                  setNotes("")
                }
              })
            } else {
              setProblem(null)
              setSyncStatus(null)
              setNotes("")
            }
          } catch (err) {
            console.error("[Kepr] Error querying active tab:", err)
          }
        })
      }
    }

    const loadInitialData = async () => {
      try {
        // 1. Load GitHub settings
        const settings = await storageService.getGitHubSettings()
        setIsConfigured(settings.isConfigured)

        // 2. Load active problem
        if (typeof chrome !== "undefined" && chrome.tabs && chrome.tabs.query) {
          queryActiveTabProblem()
        } else {
          const currentProb = await storageService.getCurrentProblem()
          setProblem(currentProb)

          if (currentProb) {
            // 3. Load sync status
            const syncState = await storageService.getSyncStatus(currentProb.slug)
            if (syncState) {
              setSyncStatus(syncState.status)
              setErrorMsg(syncState.error || null)
            }

            // 4. Load notes
            const userNotes = await storageService.getNotes(currentProb.slug)
            setNotes(userNotes)
          }
        }
      } catch (error) {
        console.error("[Kepr] Error loading initial storage data in Home popup:", error)
        if (error instanceof Error && error.message.includes("Extension context invalidated")) {
          setIsContextInvalidated(true)
        }
      }
    }

    loadInitialData()

    // Listen for storage changes
    const unsubscribe = storageService.subscribeToChanges((changes) => {
      try {
        if (changes.current_problem !== undefined) {
          const newProb = changes.current_problem as ProblemData | null
          setProblem(newProb)
          if (!newProb) {
            setSyncStatus(null)
            setNotes("")
          }
        }

        if (changes.github_settings !== undefined) {
          const settings = changes.github_settings
          setIsConfigured(settings?.isConfigured || false)
        }
      } catch (error) {
        console.error("[Kepr] Error in storage change listener:", error)
        if (error instanceof Error && error.message.includes("Extension context invalidated")) {
          setIsContextInvalidated(true)
        }
      }
    })

    // Listen for tab activated and tab updated events
    const handleTabActivated = () => {
      queryActiveTabProblem()
    }

    const handleTabUpdated = (tabId: number, changeInfo: chrome.tabs.TabChangeInfo) => {
      if (changeInfo.status === "complete" || changeInfo.url) {
        queryActiveTabProblem()
      }
    }

    if (typeof chrome !== "undefined" && chrome.tabs && chrome.tabs.onActivated) {
      chrome.tabs.onActivated.addListener(handleTabActivated)
      chrome.tabs.onUpdated.addListener(handleTabUpdated)
    }

    return () => {
      unsubscribe()
      if (typeof chrome !== "undefined" && chrome.tabs && chrome.tabs.onActivated) {
        chrome.tabs.onActivated.removeListener(handleTabActivated)
        chrome.tabs.onUpdated.removeListener(handleTabUpdated)
      }
    }
  }, [])

  // Hook to handle reloading sync status and notes when problem slug changes
  useEffect(() => {
    if (!problem) return

    const loadProblemDetails = async () => {
      try {
        const syncState = await storageService.getSyncStatus(problem.slug)
        if (syncState) {
          setSyncStatus(syncState.status)
          setErrorMsg(syncState.error || null)
        }

        const userNotes = await storageService.getNotes(problem.slug)
        setNotes(userNotes)
      } catch (error) {
        console.error("[Kepr] Error fetching problem details from storage:", error)
        if (error instanceof Error && error.message.includes("Extension context invalidated")) {
          setIsContextInvalidated(true)
        }
      }
    }

    loadProblemDetails()

    const unsubscribe = storageService.subscribeToChanges((changes) => {
      const syncKey = `sync_status_${problem.slug}`
      const notesKey = `notes_${problem.slug}`

      if (changes[syncKey] !== undefined || changes[notesKey] !== undefined) {
        loadProblemDetails()
      }
    })

    return () => {
      unsubscribe()
    }
  }, [problem])

  /**
   * Persists changes to the notes field in local storage.
   */
  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setNotes(value)
    if (problem) {
      storageService.setNotes(problem.slug, value)
    }
  }

  /**
   * Fires a MANUAL_SYNC_TRIGGER event to the active tab's content script.
   */
  const handleManualSync = async () => {
    if (!problem) return

    try {
      if (!isExtensionContextActive()) {
        console.warn("[Kepr] Cannot run manual sync: extension context is inactive.")
        alert("Action unavailable: Popup is running outside of the extension runtime.")
        return
      }

      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        try {
          const activeTab = tabs[0]
          if (activeTab && activeTab.id) {
            chrome.tabs.sendMessage(activeTab.id, { type: "MANUAL_SYNC_TRIGGER" })
          }
        } catch (err) {
          console.error("[Kepr] Failed to send manual sync message:", err)
          if (err instanceof Error && err.message.includes("Extension context invalidated")) {
            setIsContextInvalidated(true)
          }
        }
      })
    } catch (error) {
      console.error("[Kepr] Failed to query tabs for manual sync:", error)
      if (error instanceof Error && error.message.includes("Extension context invalidated")) {
        setIsContextInvalidated(true)
      }
    }
  }

  // Render context-invalidated fallback view if background reloads occur
  if (isContextInvalidated) {
    return (
      <div className="space-y-4 px-4 py-6 text-xs text-center select-none">
        <div className="mx-auto h-12 w-12 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-4">
          <AlertTriangle size={24} className="animate-pulse" />
        </div>
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-foreground">Extension Context Invalidated</h3>
          <p className="text-[10px] text-muted-foreground leading-normal max-w-[240px] mx-auto">
            Kepr was recently updated or reloaded in the background. Stale connections are disconnected.
          </p>
          <div className="p-3 bg-secondary rounded-lg border border-border text-[10px] text-left text-muted-foreground space-y-1.5 mt-4">
            <p className="font-bold text-foreground">To resolve this:</p>
            <ol className="list-decimal pl-4 space-y-1">
              <li>Close this popup panel.</li>
              <li>Refresh your active problem browser tab.</li>
              <li>Re-open the Kepr extension popup.</li>
            </ol>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3 px-4 py-3">
      {/* Dev warning indicator if mock storage is active */}
      {isMockActive && (
        <div className="flex gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 p-2 text-[9px] text-amber-400">
          <Info size={12} className="shrink-0 mt-0.5" />
          <p className="leading-normal">
            Popup running outside the Chrome runtime. Changes will save in-memory only.
          </p>
        </div>
      )}

      {/* Current Problem View Card */}
      <CurrentProblem problem={problem} />

      {/* Notes Textarea Section */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
            <PenSquare size={10} className="text-primary" />
            Revision Notes
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setMode("edit")}
              className={`px-2 py-1 rounded text-[9px] ${mode === "edit"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground"
                }`}
            >
              Edit
            </button>

            <button
              onClick={() => setMode("preview")}
              className={`px-2 py-1 rounded text-[9px] flex items-center justify-center gap-0.5 ${mode === "preview"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground"
                }`}
            >
              <Eye className="w-3 h-3"/> Preview
            </button>
          </div>
        </div>

        {mode === "edit" ? (
          <textarea
            value={notes}
            onChange={handleNotesChange}
            disabled={!problem}
            placeholder={problem ? "Write complexity analysis, key takeaways, or notes..." : "Open a problem to write notes."}
            className="w-full h-[220px] bg-[#ffffff05] border border-border rounded-lg p-2.5 text-[11px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary resize-none placeholder:text-muted-foreground/45 transition-colors duration-200 leading-normal"
          />
        ) : (
          <div className="h-[220px] overflow-x-hidden overflow-y-auto border border-border rounded-lg p-2.5 bg-[#ffffff05]">
            {
              notes.trim() === "" && (
                <div className="flex flex-col items-center justify-center h-full gap-y-1 text-center select-none px-6">
                  <div className="rounded-full bg-muted/50 p-4">
                    <FileText className="h-6 w-6 text-muted-foreground/50" strokeWidth={1.5} />
                  </div>
                  <div className="opacity-80">
                    <p className="text-xs font-medium text-muted-foreground">No notes yet</p>
                    <p className="text-[11px] text-muted-foreground/70">
                      Switch to Edit mode to start writing
                    </p>
                  </div>
                </div>
              )
            }
            <div
              className="markdown-preview"
              dangerouslySetInnerHTML={{
                __html: marked.parse(notes)
              }}
            />
          </div>
        )}
        {/* Recommendation Helper Caption */}
        <p className="text-[8.5px] leading-normal text-muted-foreground/60 select-none">
          We recommend writing notes in your coding platform's Notes section first and then copying them here for long-term storage in GitHub.
        </p>
      </div>

      {/* Configuration Alert Check */}
      {!isConfigured && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-2.5 text-xs text-primary-foreground/90 select-none">
          <div className="flex gap-2">
            <GithubIcon size={14} className="shrink-0 mt-0.5 text-primary" />
            <div className="space-y-0.5">
              <p className="font-bold text-[10px] text-foreground leading-none">GitHub integration required</p>
              <p className="text-[9px] text-muted-foreground leading-normal">
                Visit the Settings page to configure credentials.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Action Save Button & Status indicators */}
      {problem && (
        <div className="space-y-1.5 pt-0.5">
          <SaveButton
            status={syncStatus}
            disabled={!isConfigured}
            onClick={handleManualSync}
          />

          {/* Minimal Inline Sync Status Logger */}
          {syncStatus && (
            <div className="text-center text-[9px] select-none font-bold min-h-[14px]">
              {syncStatus === "saved" && (
                <span className="text-emerald-400">✓ Saved to GitHub</span>
              )}
              {syncStatus === "saving" && (
                <span className="text-blue-400">Saving to GitHub...</span>
              )}
              {syncStatus === "error" && (
                <span className="text-rose-400" title={errorMsg || "Sync failed"}>
                  ⚠ Sync Failed: {errorMsg ? (errorMsg.length > 40 ? errorMsg.substring(0, 38) + "..." : errorMsg) : "Error"}
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
export default Home
