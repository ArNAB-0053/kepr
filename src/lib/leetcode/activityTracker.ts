import { storageService, type ActiveSession } from "../storage/storage.service"

/**
 * Helper class to track active time spent on a LeetCode problem.
 * Listens to document visibility changes and window focus/blur events to pause/resume
 * tracking, ensuring we only capture active solving time.
 * Persists data to chrome.storage.local periodically using a heartbeat to survive refreshes.
 */
export class ActivityTracker {
  private slug: string
  private session: ActiveSession | null = null
  private heartbeatInterval: any = null

  constructor(slug: string) {
    this.slug = slug
  }

  /**
   * Initializes the tracker, restoring any existing tracking session or starting a new one.
   */
  async init(): Promise<ActiveSession> {
    const existing = await storageService.getActiveSession(this.slug)
    if (existing) {
      this.session = existing
      console.log(`[Kepr] Restored active session for ${this.slug}: ${Math.round(this.session.activeDurationSeconds)}s`)
    } else {
      this.session = {
        startedAt: new Date().toISOString(),
        activeDurationSeconds: 0,
        lastActiveTimestamp: null,
      }
      await this.save()
      console.log(`[Kepr] Started new active session for ${this.slug}`)
    }

    // Start tracking if the tab is currently active and focused
    if (document.visibilityState === "visible" && document.hasFocus()) {
      this.resume()
    }

    this.setupListeners()
    this.startHeartbeat()
    return this.session
  }

  /**
   * Clean up listeners and stop the heartbeat. Call when leaving the page.
   */
  destroy() {
    this.pause()
    this.removeListeners()
    this.stopHeartbeat()
  }

  private setupListeners() {
    document.addEventListener("visibilitychange", this.handleVisibilityChange)
    window.addEventListener("focus", this.handleFocus)
    window.addEventListener("blur", this.handleBlur)
  }

  private removeListeners() {
    document.removeEventListener("visibilitychange", this.handleVisibilityChange)
    window.removeEventListener("focus", this.handleFocus)
    window.removeEventListener("blur", this.handleBlur)
  }

  private handleVisibilityChange = () => {
    if (document.visibilityState === "visible") {
      if (document.hasFocus()) {
        this.resume()
      }
    } else {
      this.pause()
    }
  }

  private handleFocus = () => {
    if (document.visibilityState === "visible") {
      this.resume()
    }
  }

  private handleBlur = () => {
    this.pause()
  }

  /**
   * Resume counting time.
   */
  private resume() {
    if (!this.session) return
    if (this.session.lastActiveTimestamp === null) {
      this.session.lastActiveTimestamp = Date.now()
      this.save()
    }
  }

  /**
   * Pause counting time and accumulate elapsed seconds.
   */
  private pause() {
    if (!this.session) return
    if (this.session.lastActiveTimestamp !== null) {
      const elapsedSeconds = (Date.now() - this.session.lastActiveTimestamp) / 1000
      this.session.activeDurationSeconds += Math.max(0, elapsedSeconds)
      this.session.lastActiveTimestamp = null
      this.save()
    }
  }

  /**
   * Save the current session state to storage.
   */
  private async save() {
    if (!this.session) return
    await storageService.setActiveSession(this.slug, this.session)
  }

  /**
   * Starts a periodic timer that flushes active time to storage every 5 seconds.
   * Prevents losing accumulated time if the browser/tab is closed unexpectedly.
   */
  private startHeartbeat() {
    this.stopHeartbeat()
    this.heartbeatInterval = setInterval(async () => {
      if (!this.session) return
      if (this.session.lastActiveTimestamp !== null) {
        const now = Date.now()
        const elapsedSeconds = (now - this.session.lastActiveTimestamp) / 1000
        this.session.activeDurationSeconds += Math.max(0, elapsedSeconds)
        this.session.lastActiveTimestamp = now
        await this.save()
      }
    }, 5000)
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  /**
   * Pauses the timer and returns the final active duration in seconds.
   */
  async getFinalDuration(): Promise<number> {
    this.pause() // Ensure any currently active time is accumulated
    return this.session ? Math.round(this.session.activeDurationSeconds) : 0
  }

  /**
   * Pauses the timer and returns the final session data.
   */
  async getSessionData(): Promise<ActiveSession | null> {
    this.pause()
    return this.session
  }
}
