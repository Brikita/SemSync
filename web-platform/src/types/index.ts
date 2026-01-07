export type UserRole = "student" | "instructor";

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: number;
}

export interface Course {
  id: string;
  code: string;       // e.g. "CS101"
  name: string;       // e.g. "Intro to Computer Science"
  instructorId: string;
  location: string;   // e.g. "Room 304"
  dayOfWeek: number;  // 0=Sunday, 1=Monday, etc.
  startTime: string;  // "10:00"
  endTime: string;    // "12:00"
  color?: string;     // For UI
}

export interface ScheduleEvent {
  id: string;
  title: string;
  start: string;      // ISO string
  end: string;        // ISO string
  extendedProps: {
    courseId: string;
    location: string;
    type: "class" | "exam" | "assignment";
  };
  backgroundColor?: string;
}
