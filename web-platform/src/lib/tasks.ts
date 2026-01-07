import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  onSnapshot,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';

export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskStatus = 'todo' | 'in-progress' | 'done';

export interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string;
  courseCode?: string; // Optional link to a course
  dueDate: Date;
  priority: TaskPriority;
  status: TaskStatus;
  completed: boolean;
}

export const subscribeToTasks = (userId: string, callback: (tasks: Task[]) => void) => {
  if (!userId) {
    callback([]);
    return () => {};
  }

  const q = query(
    collection(db, 'tasks'),
    where('userId', '==', userId)
  );

  return onSnapshot(q, (snapshot) => {
    const tasks = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // Convert Firestore Timestamp to JS Date
        dueDate: data.dueDate instanceof Timestamp ? data.dueDate.toDate() : new Date(data.dueDate),
      } as Task;
    });
    
    // Client-side sort by due date (nearest first)
    tasks.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
    
    callback(tasks);
  });
};

export const addTask = async (userId: string, task: Omit<Task, 'id' | 'userId' | 'completed'>) => {
  await addDoc(collection(db, 'tasks'), {
    ...task,
    userId,
    completed: task.status === 'done',
    createdAt: serverTimestamp(),
  });
};

export const updateTaskStatus = async (taskId: string, status: TaskStatus) => {
  const taskRef = doc(db, 'tasks', taskId);
  await updateDoc(taskRef, {
    status,
    completed: status === 'done'
  });
};

export const deleteTask = async (taskId: string) => {
  await deleteDoc(doc(db, 'tasks', taskId));
};
