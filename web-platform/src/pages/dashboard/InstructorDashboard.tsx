import { useEffect, useState } from "react";
import { useAuthStore } from "../../store/authStore";
import {
  subscribeToUserGroups,
  createPost,
  type AcademicGroup,
  subscribeToUnits,
  type AcademicUnit,
} from "../../lib/groups";
import {
  Megaphone,
  Users,
  Send,
  Calendar,
  BookOpen,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowRight,
} from "lucide-react";

export default function InstructorDashboard() {
  const { user } = useAuthStore();
  const [groups, setGroups] = useState<AcademicGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [units, setUnits] = useState<AcademicUnit[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [content, setContent] = useState("");
  const [selectedUnitId, setSelectedUnitId] = useState("");
  const [postType, setPostType] = useState<
    "announcement" | "assessment" | "postponement"
  >("announcement");
  const [eventDate, setEventDate] = useState("");
  const [newDate, setNewDate] = useState(""); // For postponement (new time)
  const [isPosting, setIsPosting] = useState(false);
  const [postSuccess, setPostSuccess] = useState(false);
  const [postError, setPostError] = useState("");

  // Subscribe to groups
  useEffect(() => {
    if (!user?.uid) return;

    const unsubscribe = subscribeToUserGroups(user.uid, (data) => {
      setGroups(data);
      setLoading(false);
      // Auto-select first group if available
      if (data.length > 0 && !selectedGroup) {
        setSelectedGroup(data[0].id);
      }
    });

    return () => unsubscribe();
  }, [user?.uid, selectedGroup]);

  // Subscribe to units when group changes
  useEffect(() => {
    if (!selectedGroup) {
      setUnits([]);
      return;
    }

    const unsubscribe = subscribeToUnits(selectedGroup, (data) => {
      setUnits(data);
    });

    return () => unsubscribe();
  }, [selectedGroup]);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedGroup || !content.trim()) return;

    setIsPosting(true);
    setPostError("");
    setPostSuccess(false);

    try {
      const unit = units.find((u) => u.id === selectedUnitId);

      // Construct clean additional data object (remove undefined values)
      const additionalData: any = {
        isAssessment: postType === "assessment",
        isPostponement: postType === "postponement",
        postType,
      };

      if (selectedUnitId) additionalData.unitId = selectedUnitId;
      if (unit?.name) additionalData.unitName = unit.name;

      // Handle dates based on type
      if (postType === "assessment" && eventDate) {
        additionalData.eventDate = new Date(eventDate);
      } else if (postType === "postponement") {
        if (eventDate) additionalData.originalDate = new Date(eventDate);
        if (newDate) additionalData.newDate = new Date(newDate);
      }

      await createPost(
        selectedGroup,
        user.uid,
        user.displayName || "Instructor",
        content,
        "announcement",
        additionalData
      );

      // Reset form
      setContent("");
      setSelectedUnitId("");
      setPostType("announcement");
      setEventDate("");
      setNewDate("");
      setPostSuccess(true);

      // Clear success message after 3 seconds
      setTimeout(() => setPostSuccess(false), 3000);
    } catch (error) {
      console.error("Failed to post:", error);
      setPostError("Failed to post announcement. Please try again.");
    } finally {
      setIsPosting(false);
    }
  };

  const selectedGroupData = groups.find((g) => g.id === selectedGroup);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-lg bg-primary/10">
          <Megaphone className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Instructor Dashboard
          </h1>
          <p className="text-muted-foreground">
            Post announcements and assessments to your groups
          </p>
        </div>
      </div>

      {groups.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-8 text-center">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-foreground mb-2">
            No Groups Yet
          </h2>
          <p className="text-muted-foreground">
            You haven't joined any academic groups yet. Join a group using a
            join code to start posting announcements.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Group Selection Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-card border border-border rounded-lg p-4">
              <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Your Groups
              </h2>
              <div className="space-y-2">
                {groups.map((group) => (
                  <button
                    key={group.id}
                    onClick={() => setSelectedGroup(group.id)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedGroup === group.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted/50 hover:bg-muted text-foreground"
                    }`}
                  >
                    <div className="font-medium truncate">{group.name}</div>
                    <div
                      className={`text-sm ${
                        selectedGroup === group.id
                          ? "text-primary-foreground/70"
                          : "text-muted-foreground"
                      }`}
                    >
                      {group.code} • {group.memberCount} students
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Announcement Form */}
          <div className="lg:col-span-2">
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Send className="h-4 w-4" />
                Post to {selectedGroupData?.name || "Group"}
              </h2>

              {postSuccess && (
                <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2 text-green-700 dark:text-green-400">
                  <CheckCircle className="h-4 w-4" />
                  Announcement posted successfully! All students have been
                  notified.
                </div>
              )}

              {postError && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-700 dark:text-red-400">
                  <AlertCircle className="h-4 w-4" />
                  {postError}
                </div>
              )}

              <div className="flex gap-2 mb-6 p-1 bg-muted/30 rounded-lg">
                <button
                  type="button"
                  onClick={() => setPostType("announcement")}
                  className={`flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-colors ${
                    postType === "announcement"
                      ? "bg-background shadow-sm text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Announcement
                </button>
                <button
                  type="button"
                  onClick={() => setPostType("assessment")}
                  className={`flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-colors ${
                    postType === "assessment"
                      ? "bg-background shadow-sm text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Assessment
                </button>
                <button
                  type="button"
                  onClick={() => setPostType("postponement")}
                  className={`flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-colors ${
                    postType === "postponement"
                      ? "bg-background shadow-sm text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Postponement
                </button>
              </div>

              <form onSubmit={handlePost} className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  {/* Unit Selection */}
                  {units.length > 0 && (
                    <div
                      className={
                        postType === "postponement" ? "md:col-span-2" : ""
                      }
                    >
                      <label className="block text-sm font-medium text-foreground mb-1.5">
                        Related Unit (Optional)
                      </label>
                      <select
                        value={selectedUnitId}
                        onChange={(e) => setSelectedUnitId(e.target.value)}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="">General Announcement</option>
                        {units.map((unit) => (
                          <option key={unit.id} value={unit.id}>
                            {unit.code} - {unit.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Dates for Assessment/Postponement */}
                  {postType === "assessment" && (
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5 flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Assessment Date
                      </label>
                      <input
                        type="datetime-local"
                        value={eventDate}
                        onChange={(e) => setEventDate(e.target.value)}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  )}

                  {postType === "postponement" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 col-span-1 md:col-span-2">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5 flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Old Class Time (To Identify)
                        </label>
                        <input
                          type="datetime-local"
                          value={eventDate}
                          onChange={(e) => setEventDate(e.target.value)}
                          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5 flex items-center gap-2">
                          <ArrowRight className="h-4 w-4" />
                          New Class Time (Optional)
                        </label>
                        <input
                          type="datetime-local"
                          value={newDate}
                          onChange={(e) => setNewDate(e.target.value)}
                          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    {postType === "postponement"
                      ? "Reason / Details"
                      : "Announcement Content"}{" "}
                    *
                  </label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={
                      postType === "postponement"
                        ? "e.g. Instructor unavailable, class moved to..."
                        : "Write your announcement here..."
                    }
                    rows={5}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    required
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isPosting || !content.trim()}
                  className="w-full py-3 px-4 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isPosting ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
                      Posting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Post Announcement
                    </>
                  )}
                </button>

                <p className="text-xs text-muted-foreground text-center">
                  All {selectedGroupData?.memberCount || 0} students in this
                  group will receive a notification.
                </p>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
