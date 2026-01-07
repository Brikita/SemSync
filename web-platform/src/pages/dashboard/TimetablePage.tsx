import { useState, useRef, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { Plus } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import AddCourseDialog from "../../components/timetable/AddCourseDialog";
import { addCourse, subscribeToCourses } from "../../lib/courses";
import type { Course } from "../../types";

export default function TimetablePage() {
  const { user } = useAuthStore();
  const calendarRef = useRef<FullCalendar>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToCourses(user.uid, (fetchedCourses) => {
      setCourses(fetchedCourses);
    });
    return () => unsubscribe();
  }, [user]);

  // Transform Firestore courses into FullCalendar recurring events
  const events = courses.map((course) => ({
    id: course.id,
    title: course.name,
    daysOfWeek: [parseInt(course.dayOfWeek.toString())], // FullCalendar uses 0=Sunday
    startTime: course.startTime, // "10:00"
    endTime: course.endTime, // "12:00"
    backgroundColor: course.color,
    borderColor: course.color,
    extendedProps: {
      location: course.location,
      code: course.code,
    },
  }));

  const handleAddCourse = async (data: any) => {
    if (!user) return;
    await addCourse(user.uid, {
      code: "", // Optional or could be added to form
      name: data.name,
      location: data.location,
      dayOfWeek: parseInt(data.dayOfWeek), // Store as number
      startTime: data.startTime,
      endTime: data.endTime,
      color: data.color,
    });
  };

  return (
    <div className="h-full space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Timetable</h1>
          <p className="text-muted-foreground">
            Manage your semester schedule and recurring classes.
          </p>
        </div>

        <button
          onClick={() => setDialogOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Add Course
        </button>
      </div>

      <div className="rounded-xl border bg-card p-4 shadow text-card-foreground">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          slotMinTime="07:00:00"
          slotMaxTime="20:00:00"
          allDaySlot={false}
          events={events} // Use dynamic events
          height="auto"
          contentHeight="75vh"
          eventContent={(eventInfo) => (
            <div className="p-1 h-full flex flex-col overflow-hidden leading-tight">
              <div className="font-semibold text-xs truncate">
                {eventInfo.event.title}
              </div>
              <div className="text-[10px] opacity-90 truncate">
                {eventInfo.event.extendedProps.location}
              </div>
              <div className="text-[10px] opacity-75">{eventInfo.timeText}</div>
            </div>
          )}
        />
      </div>

      <AddCourseDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onAddCourse={handleAddCourse}
      />
    </div>
  );
}
