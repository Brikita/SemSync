import { useState, useEffect } from "react";
import {
  User,
  Mail,
  Shield,
  Calendar,
  Save,
  Loader2,
  Moon,
  Sun,
  Bell,
  BellOff,
  LogOut,
  Trash2,
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { updateUserProfile, getUserProfile } from "../../lib/auth";
import { auth } from "../../lib/firebase";
import { useTheme } from "../../hooks/useTheme";

export default function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const { theme, setTheme } = useTheme();

  // Form State
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Notification Preferences (local for now)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Load extra profile data if we add more fields later
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || "");
      setRegistrationNumber(user.registrationNumber || "");
    }
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user) return;

    setIsSaving(true);
    setSaveSuccess(false);

    try {
      await updateUserProfile(user.uid, {
        displayName: displayName.trim(),
        registrationNumber: registrationNumber.trim(),
      });

      // Refresh user in store
      const updatedProfile = await getUserProfile(user.uid);
      if (updatedProfile) {
        setUser(updatedProfile);
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error("Failed to save profile:", error);
      alert("Failed to save profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    auth.signOut();
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Profile & Settings
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your account information and preferences.
        </p>
      </div>

      {/* Profile Card */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-start gap-6 flex-col sm:flex-row">
          {/* Avatar */}
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-primary to-purple-500 text-white text-3xl font-bold shadow-lg shrink-0">
            {user?.displayName?.charAt(0).toUpperCase() || "U"}
          </div>

          {/* Info */}
          <div className="flex-1 space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                {user?.displayName || "User"}
              </h2>
              <p className="text-muted-foreground flex items-center gap-2 mt-1">
                <Mail className="h-4 w-4" />
                {user?.email}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                <Shield className="h-3.5 w-3.5" />
                {user?.role === "instructor" ? "Instructor" : "Student"}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-sm font-medium text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                Joined {user?.createdAt ? formatDate(user.createdAt) : "N/A"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Section */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <User className="h-5 w-5" />
          Edit Profile
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Registration Number
              <span className="text-muted-foreground font-normal ml-1">
                (Optional)
              </span>
            </label>
            <input
              type="text"
              value={registrationNumber}
              onChange={(e) => setRegistrationNumber(e.target.value)}
              placeholder="e.g., STU/2024/001"
              className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              value={user?.email || ""}
              disabled
              className="w-full px-4 py-2.5 rounded-lg border border-input bg-muted text-muted-foreground cursor-not-allowed"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Email cannot be changed. Linked to your Google account.
            </p>
          </div>

          <button
            onClick={handleSaveProfile}
            disabled={isSaving}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isSaving ? "Saving..." : "Save Changes"}
          </button>

          {saveSuccess && (
            <p className="text-sm text-green-600 dark:text-green-400">
              ✓ Profile saved successfully!
            </p>
          )}
        </div>
      </div>

      {/* Preferences Section */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Preferences
        </h3>

        <div className="space-y-4">
          {/* Theme Toggle */}
          <div className="flex items-center justify-between py-3 border-b border-border">
            <div className="flex items-center gap-3">
              {theme === "dark" ? (
                <Moon className="h-5 w-5 text-muted-foreground" />
              ) : (
                <Sun className="h-5 w-5 text-muted-foreground" />
              )}
              <div>
                <p className="font-medium text-foreground">Dark Mode</p>
                <p className="text-sm text-muted-foreground">
                  Toggle between light and dark theme
                </p>
              </div>
            </div>
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                theme === "dark" ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  theme === "dark" ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* Notifications Toggle */}
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              {notificationsEnabled ? (
                <Bell className="h-5 w-5 text-muted-foreground" />
              ) : (
                <BellOff className="h-5 w-5 text-muted-foreground" />
              )}
              <div>
                <p className="font-medium text-foreground">
                  Push Notifications
                </p>
                <p className="text-sm text-muted-foreground">
                  Receive reminders for classes and deadlines
                </p>
              </div>
            </div>
            <button
              onClick={() => setNotificationsEnabled(!notificationsEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                notificationsEnabled ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  notificationsEnabled ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="rounded-xl border border-destructive/30 bg-card p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Trash2 className="h-5 w-5 text-destructive" />
          Danger Zone
        </h3>

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3 border-b border-border">
            <div>
              <p className="font-medium text-foreground">Sign Out</p>
              <p className="text-sm text-muted-foreground">
                Sign out of your account on this device
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card text-foreground hover:bg-muted px-4 py-2 text-sm font-medium transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3">
            <div>
              <p className="font-medium text-destructive">Delete Account</p>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all data
              </p>
            </div>
            <button
              onClick={() =>
                alert(
                  "Account deletion is not yet implemented. Contact support."
                )
              }
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 px-4 py-2 text-sm font-medium transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
