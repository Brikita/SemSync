import {
  collection,
  addDoc,
  getDocs,
  doc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";
import { db } from "./firebase";

export interface AcademicGroup {
  id: string;
  name: string; // e.g. "BSc Computer Science Y2"
  code: string; // e.g. "CS-Y2"
  joinCode: string;
  // lecturerName is less relevant on the course level now, but we'll keep it for backward compat or Head of Dept
  lecturerName: string;
  repId: string;
  memberCount: number;
  createdAt: number;
}

export interface UnitSchedule {
  day: string; // "Monday", "Tuesday"
  startTime: string; // "08:00"
  endTime: string; // "10:00"
  location: string; // "Lab 1"
}

export interface AcademicUnit {
  id: string;
  groupId: string;
  name: string; // "Distributed Systems"
  code: string; // "SCT 211"
  lecturerName: string;
  schedule: UnitSchedule[];
}

export interface GroupPost {
  id: string;
  groupId: string;
  authorId: string;
  authorName: string;
  content: string;
  type: "announcement" | "general";

  // New fields for Unit context
  unitId?: string;
  unitName?: string;

  // New fields for Assessments
  isAssessment?: boolean;
  eventDate?: any; // Timestamp of the exam/deadline

  createdAt: any;
}

// Helper to generate random 6-char join code
const generateJoinCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

export const createGroup = async (
  userId: string,
  data: { name: string; code: string; lecturerName: string }
) => {
  const joinCode = generateJoinCode();

  const groupData = {
    ...data,
    repId: userId,
    joinCode,
    memberCount: 1, // Start with creator
    members: [userId], // Simple array for small groups, or subcollection for huge ones. Array is cheaper/faster for <1000.
    createdAt: Date.now(),
  };

  const docRef = await addDoc(collection(db, "groups"), groupData);
  return { id: docRef.id, ...groupData };
};

export const joinGroup = async (userId: string, joinCode: string) => {
  // 1. Find the group by join code
  const q = query(collection(db, "groups"), where("joinCode", "==", joinCode));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    throw new Error("Invalid join code");
  }

  const groupDoc = snapshot.docs[0];
  const groupData = groupDoc.data();
  const groupId = groupDoc.id;

  // 2. Check if already a member
  if (groupData.members && groupData.members.includes(userId)) {
    throw new Error("You are already a member of this group");
  }

  // 3. Add to members array and increment count
  await updateDoc(doc(db, "groups", groupId), {
    members: arrayUnion(userId),
    memberCount: (groupData.memberCount || 0) + 1,
  });

  return groupId;
};

// Subscribe to groups where the user is a member
export const subscribeToUserGroups = (
  userId: string,
  callback: (groups: AcademicGroup[]) => void
) => {
  if (!userId) return () => {};

  const q = query(
    collection(db, "groups"),
    where("members", "array-contains", userId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const groups = snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          } as AcademicGroup)
      );

      callback(groups);
    },
    (error) => {
      console.error("Error subscribing to user groups:", error);
      // Don't crash the app, just log it. The UI will show empty state.
    }
  );
};

export const createPost = async (
  groupId: string,
  userId: string,
  authorName: string,
  content: string,
  type: "announcement" | "general" = "general",
  additionalData: {
    unitId?: string;
    unitName?: string;
    isAssessment?: boolean;
    eventDate?: Date;
  } = {}
) => {
  const postsRef = collection(db, "groups", groupId, "posts");
  await addDoc(postsRef, {
    groupId,
    authorId: userId,
    authorName,
    content,
    type,
    ...additionalData,
    createdAt: serverTimestamp(),
  });
};

// --- Unit Management ---

export const createUnit = async (
  groupId: string,
  data: {
    name: string;
    code: string;
    lecturerName: string;
    schedule: UnitSchedule[];
  }
) => {
  const unitsRef = collection(db, "groups", groupId, "units");
  await addDoc(unitsRef, data);
};

export const subscribeToUnits = (
  groupId: string,
  callback: (units: AcademicUnit[]) => void
) => {
  const unitsRef = collection(db, "groups", groupId, "units");
  return onSnapshot(
    unitsRef,
    (snapshot) => {
      const units = snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            groupId,
            ...doc.data(),
          } as AcademicUnit)
      );
      callback(units);
    },
    (error) => {
      console.error("Error subscribing to units:", error);
    }
  );
};

export const subscribeToPosts = (
  groupId: string,
  callback: (posts: GroupPost[]) => void
) => {
  const q = query(collection(db, "groups", groupId, "posts")); // Add orderBy logic in index later

  return onSnapshot(
    q,
    (snapshot) => {
      const posts = snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          } as GroupPost)
      );
      // Client side sort for now
      posts.sort(
        (a, b) =>
          (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0)
      );
      callback(posts);
    },
    (error) => {
      console.error("Error subscribing to posts:", error);
    }
  );
};
