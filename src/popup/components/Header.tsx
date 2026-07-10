import React from "react"
import { Code2, Settings, Home } from "lucide-react"

import Logo from "~/assets/logo.png"

interface HeaderProps {
  currentPage: "home" | "settings"
  onNavigate: (page: "home" | "settings") => void
}

/**
 * Premium navigation header for the extension popup UI.
 * Integrates an animated SVG logo and smooth transition hover buttons for navigation.
 */
export const Header: React.FC<HeaderProps> = ({ currentPage, onNavigate }) => {
  return (
    <header className="flex items-center justify-between border-b border-border bg-card px-4 py-3 select-none">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-lg shadow-primary/20">
            <img src={Logo} alt="Kepr Logo" className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-base font-bold tracking-tight text-foreground">Kepr</h1>
          <p className="text-[10px] text-muted-foreground font-medium">GitHub Solutions Sync</p>
        </div>
      </div>
      
      <div className="flex items-center gap-1">
        <button
          onClick={() => onNavigate("home")}
          className={`flex h-8 w-8 items-center justify-center rounded-md transition-all duration-200 ${
            currentPage === "home"
              ? "bg-primary text-primary-foreground shadow-sm shadow-primary/10"
              : "text-muted-foreground hover:bg-secondary hover:text-foreground"
          }`}
          title="Home"
        >
          <Home size={16} />
        </button>
        <button
          onClick={() => onNavigate("settings")}
          className={`flex h-8 w-8 items-center justify-center rounded-md transition-all duration-200 ${
            currentPage === "settings"
              ? "bg-primary text-primary-foreground shadow-sm shadow-primary/10"
              : "text-muted-foreground hover:bg-secondary hover:text-foreground"
          }`}
          title="Settings"
        >
          <Settings size={16} />
        </button>
      </div>
    </header>
  )
}
export default Header
