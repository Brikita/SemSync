import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarDays,
  CheckSquare,
  BookText,
  Users,
  FolderOpen,
  LogOut,
  X,
  Search,
  Settings,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { useAuthStore } from "../../store/authStore";
import { auth } from "../../lib/firebase";

interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export default function Sidebar({ open, setOpen }: SidebarProps) {
  const { user } = useAuthStore();

  const mainNavigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Timetable", href: "/timetable", icon: CalendarDays },
    { name: "Tasks", href: "/tasks", icon: CheckSquare, badge: 5 },
    { name: "Notes", href: "/notebook", icon: BookText },
  ];

  const classNavigation = [
    { name: "My Classes", href: "/groups", icon: Users },
    { name: "Resources", href: "/groups", icon: FolderOpen },
  ];

  const settingsNavigation = [
    { name: "Settings", href: "/profile", icon: Settings },
  ];

  const handleLogout = () => {
    auth.signOut();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-background/80 backdrop-blur-sm transition-opacity lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={() => setOpen(false)}
      />

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 transform bg-card border-r border-border transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 flex flex-col",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo Header */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-primary/25">
              S
            </div>
            <span className="text-xl font-extrabold tracking-tight">
              Sem
              <span className="bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                Sync
              </span>
            </span>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="rounded-lg p-2 hover:bg-accent transition-colors lg:hidden"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        </div>

        {/* Search Box */}
        <div className="px-4 py-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-10 pr-12 py-3 rounded-xl border border-border bg-muted/50 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex h-5 items-center gap-1 rounded border border-border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 px-3 py-2 overflow-y-auto">
          <div className="px-3 py-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
              Menu
            </span>
          </div>
          <div className="space-y-1">
            {mainNavigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200 group",
                    isActive
                      ? "bg-gradient-to-r from-primary to-purple-500 text-white shadow-lg shadow-primary/25"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground hover:translate-x-1"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
                        isActive
                          ? "bg-white/20"
                          : "bg-primary/10 group-hover:bg-primary/20"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                    </span>
                    {item.name}
                    {item.badge && (
                      <span className="ml-auto rounded-full bg-secondary px-2.5 py-0.5 text-[10px] font-bold text-white">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>

          {/* Classes Section */}
          <div className="px-3 py-2 mt-6">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
              Your Classes
            </span>
          </div>
          <div className="space-y-1">
            {classNavigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200 group",
                    isActive
                      ? "bg-gradient-to-r from-primary to-purple-500 text-white shadow-lg shadow-primary/25"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground hover:translate-x-1"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
                        isActive
                          ? "bg-white/20"
                          : "bg-primary/10 group-hover:bg-primary/20"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                    </span>
                    {item.name}
                  </>
                )}
              </NavLink>
            ))}
          </div>

          {/* Settings Section */}
          <div className="px-3 py-2 mt-6">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
              Account
            </span>
          </div>
          <div className="space-y-1">
            {settingsNavigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200 group",
                    isActive
                      ? "bg-gradient-to-r from-primary to-purple-500 text-white shadow-lg shadow-primary/25"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground hover:translate-x-1"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
                        isActive
                          ? "bg-white/20"
                          : "bg-primary/10 group-hover:bg-primary/20"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                    </span>
                    {item.name}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </nav>

        {/* User Card */}
        <div className="p-4">
          <div className="rounded-2xl bg-gradient-to-br from-primary to-purple-500 p-4 text-white shadow-lg">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/25 text-base font-bold">
                {user?.displayName?.charAt(0).toUpperCase() || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-bold">
                  {user?.displayName || "User"}
                </p>
                <p className="truncate text-xs opacity-80 capitalize">
                  {user?.role || "Student"}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
