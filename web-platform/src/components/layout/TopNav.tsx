import { Menu, Sun, Moon } from "lucide-react";
import { useTheme } from "../../hooks/useTheme";
import { useLocation } from "react-router-dom";
import { cn } from "../../lib/utils";
import NotificationsDropdown from "../notifications/NotificationsDropdown";

interface TopNavProps {
  onMenuClick: () => void;
}

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/timetable": "Timetable",
  "/tasks": "Tasks",
  "/notebook": "Notes",
  "/groups": "Classes",
  "/profile": "Settings",
};

export default function TopNav({ onMenuClick }: TopNavProps) {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  // Get page title from path (handle dynamic routes like /groups/:id)
  const pathBase = "/" + location.pathname.split("/")[1];
  const pageTitle =
    pageTitles[pathBase] || pageTitles[location.pathname] || "SemSync";

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4 md:px-8">
        {/* Left side: Menu + Title + Tabs */}
        <div className="flex items-center gap-4">
          {/* Mobile menu button */}
          <button
            onClick={onMenuClick}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background text-sm font-medium shadow-sm transition-colors hover:bg-accent lg:hidden"
          >
            <Menu className="h-4 w-4" />
            <span className="sr-only">Toggle Menu</span>
          </button>

          {/* Page Title */}
          <h1 className="text-xl md:text-2xl font-extrabold tracking-tight">
            {pageTitle}
          </h1>

          {/* Header Tabs (Desktop only) */}
          <div className="hidden md:flex items-center gap-1 ml-4 p-1 rounded-xl bg-muted/50 border border-border">
            <button
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-semibold transition-all",
                "bg-background text-foreground shadow-sm"
              )}
            >
              Overview
            </button>
            <button
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-semibold transition-all",
                "text-muted-foreground hover:text-foreground"
              )}
            >
              Analytics
            </button>
            <button
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-semibold transition-all",
                "text-muted-foreground hover:text-foreground"
              )}
            >
              Activity
            </button>
          </div>
        </div>

        {/* Right side: Actions */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground shadow-sm transition-all hover:bg-accent hover:text-primary hover:border-primary"
            title={
              theme === "light" ? "Switch to dark mode" : "Switch to light mode"
            }
          >
            {theme === "light" ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4" />
            )}
            <span className="sr-only">Toggle theme</span>
          </button>

          {/* Notifications Dropdown */}
          <NotificationsDropdown />

          {/* New Task Button (Desktop only) */}
          <button className="hidden md:inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-purple-500 text-white font-semibold text-sm shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all">
            <span className="text-base">+</span>
            New Task
          </button>
        </div>
      </div>
    </header>
  );
}
