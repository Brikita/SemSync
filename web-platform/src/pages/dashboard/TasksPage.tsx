import { useState, useEffect } from "react";
import {
  Plus,
  Calendar,
  Flag,
  CheckCircle2,
  Circle,
  Trash2,
  BookOpen,
  School,
  AlertCircle,
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import {
  subscribeToTasks,
  addTask,
  updateTaskStatus,
  deleteTask,
  type Task,
} from "../../lib/tasks";
import {
  subscribeToUserGroups,
  subscribeToAssessments,
  type GroupPost,
  type AcademicGroup,
} from "../../lib/groups";
import AddTaskDialog from "../../components/tasks/AddTaskDialog";

type DisplayItem = {
  id: string;
  source: "personal" | "assessment";
  title: string;
  description: string;
  dueDate: Date | null;
  status: "todo" | "done";
  priority: "low" | "medium" | "high";
  tag?: string; // Course Name or Code
  originalObject: Task | GroupPost;
};

export default function TasksPage() {
  const { user } = useAuthStore();

  // Data State
  const [personalTasks, setPersonalTasks] = useState<Task[]>([]);
  const [userGroups, setUserGroups] = useState<AcademicGroup[]>([]);
  const [assessments, setAssessments] = useState<GroupPost[]>([]);

  // UI State
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "todo" | "completed">("all");

  // 1. Subscribe to Personal Tasks
  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToTasks(user.uid, (data) => {
      setPersonalTasks(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  // 2. Subscribe to User Groups
  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToUserGroups(user.uid, (groups) => {
      setUserGroups(groups);
    });
    return () => unsubscribe();
  }, [user]);

  // 3. Subscribe to Assessments from those groups
  useEffect(() => {
    if (userGroups.length === 0) {
      setAssessments([]);
      return;
    }

    const unsubscribers: (() => void)[] = [];
    const assessmentsMap = new Map<string, GroupPost[]>();

    userGroups.forEach((group) => {
      const unsub = subscribeToAssessments(group.id, (posts) => {
        assessmentsMap.set(group.id, posts);
        const allAssessments = Array.from(assessmentsMap.values()).flat();
        setAssessments(allAssessments);
      });
      unsubscribers.push(unsub);
    });

    return () => {
      unsubscribers.forEach((u) => u());
    };
  }, [userGroups]);

  const handleAddTask = async (taskData: any) => {
    if (!user) return;
    await addTask(user.uid, taskData);
  };

  const handleToggleStatus = async (item: DisplayItem) => {
    if (item.source === "assessment") return; // Cannot toggle assessment status yet (read only)

    // Type guard for personal task
    const task = item.originalObject as Task;
    const newStatus = task.status === "done" ? "todo" : "done";
    await updateTaskStatus(task.id, newStatus);
  };

  const handleDeleteTask = async (item: DisplayItem) => {
    if (item.source === "assessment") return;

    if (confirm("Are you sure you want to delete this task?")) {
      await deleteTask(item.id);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-600 bg-red-50 border-red-200";
      case "medium":
        return "text-amber-600 bg-amber-50 border-amber-200";
      case "low":
        return "text-green-600 bg-green-50 border-green-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  // Merge and Transform Data
  const allItems: DisplayItem[] = [
    ...personalTasks.map((t) => ({
      id: t.id,
      source: "personal" as const,
      title: t.title,
      description: t.description || "",
      dueDate: t.dueDate,
      status: t.status === "done" ? ("done" as const) : ("todo" as const),
      priority: t.priority,
      tag: t.courseCode,
      originalObject: t,
    })),
    ...assessments.map((a) => {
      // Helper to convert Firestore timestamp
      const date = a.eventDate?.seconds
        ? new Date(a.eventDate.seconds * 1000)
        : null;
      return {
        id: a.id,
        source: "assessment" as const,
        title: `Exam/CAT: ${a.unitName || "Unknown Unit"}`,
        description: a.content,
        dueDat: date,
        dueDate: date,
        status: "todo" as const, // Assessments default to todo for now
        priority: "high" as const, // Assessments are always high priority
        tag: "Academic",
        originalObject: a,
      };
    }),
  ].sort((a, b) => {
    // Sort by due date (soonest first)
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return a.dueDate.getTime() - b.dueDate.getTime();
  });

  const filteredItems = allItems.filter((item) => {
    if (filter === "all") return true;
    if (filter === "completed") return item.status === "done";
    if (filter === "todo") return item.status !== "done";
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            My Tasks & Homework
          </h1>
          <p className="text-gray-500 mt-1">
            Manage your personal to-dos and track class assignments.
          </p>
        </div>
        <button
          onClick={() => setIsAddDialogOpen(true)}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-indigo-600 text-white hover:bg-indigo-700 h-10 px-4 py-2 shadow-sm"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Personal Task
        </button>
      </div>

      {/* Filters */}
      <div className="flex space-x-1 rounded-lg bg-gray-100 p-1 w-fit">
        {(["all", "todo", "completed"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`
              inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50
              ${
                filter === f
                  ? "bg-white text-gray-950 shadow-sm"
                  : "text-gray-500 hover:text-gray-900"
              }
            `}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Tasks List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12 text-gray-500">
            Loading tasks...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-lg border-gray-200">
            <CheckCircle2 className="h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900">
              All caught up!
            </h3>
            <p className="text-gray-500 max-w-sm mt-1">
              {filter === "all"
                ? "You have no pending tasks or assignments."
                : `No ${filter} tasks found.`}
            </p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <div
              key={item.id}
              className={`
                group flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-lg border p-4 transition-all hover:shadow-md
                ${item.status === "done" ? "bg-gray-50/50" : "bg-white"}
                ${
                  item.source === "assessment"
                    ? "border-l-4 border-l-red-500"
                    : ""
                }
              `}
            >
              <div className="flex items-start gap-4 flex-1">
                <button
                  onClick={() => handleToggleStatus(item)}
                  disabled={item.source === "assessment"}
                  className={`mt-1 flex-shrink-0 rounded-full transition-colors ${
                    item.source === "assessment"
                      ? "cursor-default opacity-50"
                      : "cursor-pointer"
                  } ${
                    item.status === "done"
                      ? "text-green-500"
                      : "text-gray-300 hover:text-gray-500"
                  }`}
                >
                  {item.status === "done" ? (
                    <CheckCircle2 className="h-6 w-6" />
                  ) : (
                    <Circle className="h-6 w-6" />
                  )}
                </button>

                <div className="space-y-1 flex-1">
                  <h3
                    className={`font-semibold ${
                      item.status === "done"
                        ? "line-through text-gray-500"
                        : "text-gray-900"
                    }`}
                  >
                    {item.title}
                  </h3>

                  {item.description && (
                    <p className="text-sm text-gray-500 line-clamp-1">
                      {item.description}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-gray-500">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(
                        item.priority
                      )}`}
                    >
                      {item.source === "assessment" && (
                        <AlertCircle className="w-3 h-3 mr-1" />
                      )}
                      <Flag className="mr-1 h-3 w-3" />
                      {item.priority}
                    </span>

                    {item.dueDate && (
                      <span className="flex items-center">
                        <Calendar className="mr-1 h-3 w-3" />
                        {item.dueDate.toLocaleDateString(undefined, {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    )}

                    {item.tag && (
                      <span className="flex items-center text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                        <BookOpen className="mr-1 h-3 w-3" />
                        {item.tag}
                      </span>
                    )}

                    {item.source === "assessment" && (
                      <span className="flex items-center text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded-md">
                        <School className="mr-1 h-3 w-3" />
                        Class Assessment
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {item.source === "personal" && (
                <div className="flex sm:flex-col items-center sm:items-end gap-2 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleDeleteTask(item)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                    title="Delete task"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <AddTaskDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onAddTask={handleAddTask}
      />
    </div>
  );
}
