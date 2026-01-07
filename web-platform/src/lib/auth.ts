import { doc, getDoc, setDoc } from "firebase/firestore";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { db, auth } from "./firebase";
import type { UserProfile } from "../types";

export const loginWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // Check if user profile (additional data) exists in Firestore
    const userProfile = await getUserProfile(user.uid);

    if (!userProfile) {
      // Create new profile for Google user if it doesn't exist
      const newProfile: Omit<UserProfile, "uid"> = {
        email: user.email || "",
        displayName: user.displayName || "User",
        role: "student", // Default role
        createdAt: Date.now(),
      };

      await createUserProfile(user.uid, newProfile);
    }

    return user;
  } catch (error) {
    console.error("Error signing in with Google:", error);
    throw error;
  }
};

export const createUserProfile = async (
  uid: string,
  data: Omit<UserProfile, "uid">
) => {
  const userRef = doc(db, "users", uid);
  await setDoc(userRef, {
    uid,
    ...data,
  });
  return { uid, ...data };
};

export const getUserProfile = async (
  uid: string
): Promise<UserProfile | null> => {
  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    return userSnap.data() as UserProfile;
  } else {
    return null;
  }
};
