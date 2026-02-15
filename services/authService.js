import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  doc,
  setDoc,
  getDoc,
  runTransaction,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { auth } from "../firebase/auth.js";
import { db } from "../firebase/db.js";
import { showToast } from "../helpers/toast.js";

const date = new Date();

const pad = (n) => String(n).padStart(2, '0');

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const formattedDate = `${pad(date.getDate())} ${months[date.getMonth()]} ${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;


/* ===============================
   SIGNUP USER (NO REDIRECT)
=============================== */
export const signup = async (
  name,
  email,
  password,
  schoolId,
  classId,
  signupCode
) => {
  try {
    if (!name || !email || !password || !schoolId || !classId || !signupCode) {
      throw new Error("All signup fields are required");
    }

    // Validate class
    const classSnap = await getDoc(doc(db, "schools", schoolId, "classes", classId));
    if (!classSnap.exists()) throw new Error("Class not found");

    // Validate school
    const schoolSnap = await getDoc(doc(db, "schools", schoolId));
    if (!schoolSnap.exists()) throw new Error("School not found");
    const schoolName = schoolSnap.data().name || "Unknown School";

    // Signup code
    const codeRef = doc(db, "schools", schoolId, "signupCodes", signupCode.trim());
    const tempCodeSnap = await getDoc(codeRef);
    
    if (!tempCodeSnap.exists()) throw new Error("Invalid signup code");
    if (tempCodeSnap.data().used) throw new Error("Signup code already used");
    
    let role = "teacher";
    const date = new Date();
    // Create auth user
    const { user } = await createUserWithEmailAndPassword(auth, email, password);

    // Transaction to validate code
    await runTransaction(db, async (tx) => {
      const codeSnap = await tx.get(codeRef);
      if (!codeSnap.exists()) throw new Error("Invalid signup code");
      if (codeSnap.data().used) throw new Error("Signup code already used");

      role = codeSnap.data().role || "teacher";

      tx.update(codeRef, {
        used: true,
        usedBy: name,
        usedById: user.uid,
        usedAt: formattedDate,
      });
    });

    // Profile data
    const profileData = {
      uid: user.uid,
      name,
      email,
      role,
      schoolId,
      schoolName,
      classId,
      isFromSignup: true, // first-time onboarding flag
      createdAt: serverTimestamp(),
    };

    // Save school profile
    await setDoc(doc(db, "schools", schoolId, "users", user.uid), profileData);

    // Save global profile
    await setDoc(doc(db, "users", user.uid), profileData);

    showToast("Signup successful. Please login.");
    return { uid: user.uid };
  } catch (error) {
    console.error("Signup error:", error.message);
    showToast(`Signup error: ${error.message}`, { color: "red", icon: "cancel" });
    throw error;
  }
};

/* ===============================
   LOGIN USER
=============================== */
export const login = async (email, password) => {
  try {
    if (!email || !password) throw new Error("Email and password are required");

    const { user } = await signInWithEmailAndPassword(auth, email, password);
    showToast("Login successful");
    return user;
  } catch (error) {
    console.error("Login error:", error.message);
    showToast(`Login error: ${error.message}`, { color: "red", icon: "cancel" });
    throw error;
  }
};

/* ===============================
   LOGOUT USER
=============================== */
export const logout = async () => {
  try {
    [
      "userProfile",
      "activeTerm",
      "isDeactivated",
      "termData",
      "att_today",
      "att_month",
      "pupils",
    ].forEach(k => localStorage.removeItem(k));

    await signOut(auth);
  } catch (error) {
    console.error("Logout error:", error.message);
    showToast(`Logout error: ${error.message}`);
    throw error;
  }
};

/* ===============================
   WATCH AUTH STATE
=============================== */
export const watchAuth = (callback) => {
  return onAuthStateChanged(auth, callback);
};