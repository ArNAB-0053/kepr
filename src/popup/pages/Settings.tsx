import React, { useState, useEffect } from "react"
import { GitHubSettings } from "../components/GitHubSettings"
import { storageService } from "~lib/storage/storage.service"
import { githubService } from "~lib/github/github.service"
import type { GitHubSettings as SettingsType } from "~lib/types/settings"
import { DEFAULT_GITHUB_SETTINGS } from "~lib/constants/settings"
import { Loader } from "lucide-react"

/**
 * Settings configuration screen for LeetPush.
 * Manages loading/persisting settings and invoking credentials validation services.
 */
export const Settings: React.FC = () => {
  const [settings, setSettings] = useState<SettingsType>(DEFAULT_GITHUB_SETTINGS)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const loadSettings = async () => {
      try {
        const currentSettings = await storageService.getGitHubSettings()

        if (mounted) {
          setSettings(currentSettings)
        }
      } catch (error) {
        console.error("Error loading settings:", error)
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    loadSettings()

    return () => {
      mounted = false
    }
  }, [])

  const handleSaveSettings = async (newSettings: SettingsType) => {
    await storageService.setGitHubSettings(newSettings)
    setSettings(newSettings)
  }

  const handleTestConnection = async (pat: string, repo: string) => {
    try {
      const result = await githubService.validateCredentials(pat, repo)

      return {
        success: result.isValid,
        error: result.error
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      }
    }
  }

  if (isLoading) {
    return (
      <div className="p-4 text-xs text-muted-foreground flex flex-col items-center justify-center mt-28">
        <Loader className="animate-spin h-6 w-6 inline-block" />
      </div>
    )
  }

  return (
    <div className="space-y-4 px-4 py-4">
      <div>
        <h2 className="text-sm font-bold text-foreground">GitHub Integration</h2>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          Configure repository credentials to sync your solutions automatically.
        </p>
      </div>

      <GitHubSettings
        initialSettings={settings}
        onSave={handleSaveSettings}
        onTestConnection={handleTestConnection}
      />
    </div>
  )
}
export default Settings
