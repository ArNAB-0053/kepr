import { useState } from "react"
import Header from "./components/Header"
import Home from "./pages/Home"
import Settings from "./pages/Settings"
import "~style.css"

/**
 * Main layout entry point for the Kepr popup panel.
 * Enforces standard dimensions for Chrome Extension compatibility and handles simple tab routing.
 */
function IndexPopup() {
  const [page, setPage] = useState<"home" | "settings">("home")

  return (
    <div className="w-[350px] min-h-[420px] bg-background text-foreground flex flex-col overflow-hidden font-sans select-none antialiased">
      {/* Premium Navigation Header */}
      <Header currentPage={page} onNavigate={setPage} />

      {/* Main Page Render View */}
      <main className="flex-1 bg-background">
        {page === "home" ? <Home /> : <Settings />}
      </main>
    </div>
  )
}

export default IndexPopup
