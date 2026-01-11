import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  query,
  onSnapshot,
  serverTimestamp,
  orderBy,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { db, storage } from "./firebase";

export interface CourseResource {
  id: string;
  groupId: string;
  unitId: string;
  unitName: string;
  title: string;
  description?: string;
  fileUrl: string;
  fileType: string; // MIME type or extension derived category
  fileName: string;
  uploadedBy: string;
  createdAt: any; // Timestamp or number
}

// 1. Upload File & Save Metadata
export const uploadResource = async (
  groupId: string,
  file: File,
  metadata: {
    unitId: string;
    unitName: string;
    title: string;
    description: string;
    uploadedBy: string;
  }
) => {
  // A. Upload to Firebase Storage
  // Path: groups/{groupId}/materials/{timestamp}_{filename}
  const storagePath = `groups/${groupId}/materials/${Date.now()}_${file.name}`;
  const storageRef = ref(storage, storagePath);

  const snapshot = await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(snapshot.ref);

  // B. Save Metadata to Firestore
  // Collection: groups/{groupId}/resources
  // We use a subcollection so specific listeners don't download everything
  const resourceData = {
    groupId,
    ...metadata,
    fileUrl: downloadURL,
    storagePath, // Saved to delete later
    fileName: file.name,
    fileType: file.type,
    createdAt: serverTimestamp(),
  };

  await addDoc(collection(db, "groups", groupId, "resources"), resourceData);
};

// 2. Subscribe to Resources
export const subscribeToResources = (
  groupId: string,
  callback: (resources: CourseResource[]) => void
) => {
  const q = query(
    collection(db, "groups", groupId, "resources"),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(q, (snapshot) => {
    const resources = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as CourseResource[];
    callback(resources);
  });
};

// 3. Delete Resource
export const deleteResource = async (
  groupId: string,
  resourceId: string,
  storagePath: string
) => {
  // A. Delete from Storage
  const storageRef = ref(storage, storagePath);
  try {
    await deleteObject(storageRef);
  } catch (err) {
    console.error(
      "Error deleting file from storage (might already be gone):",
      err
    );
  }

  // B. Delete from Firestore
  const docRef = doc(db, "groups", groupId, "resources", resourceId);
  await deleteDoc(docRef);
};
