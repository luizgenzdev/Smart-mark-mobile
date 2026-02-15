import {
  collection,
  doc,
  setDoc,
  getDoc,
  query,
  orderBy,
  onSnapshot,
  updateDoc,
  getDocs,
  writeBatch,
  increment
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { getToday, restrictPupilChanges } from "../helpers/helpers.js";
import { showToast } from "../helpers/toast.js";
import { db } from "../firebase/db.js";
import renderMainApp from "../main.js";
import { toggleAddPupilBox } from "../helpers/drawer.js";
import { isOnline } from '../firebase/helpers.js';
/* ===================== GLOBAL STATE ===================== */
export let pupilsCache = [];
let listenerTimeout = null;

const syncKey = `isAllSync_${getToday()}`;

/* Allow adding pupils Jan–Apr */
const currentMonth = new Date().getMonth();
export const dueDate = currentMonth >= 0 && currentMonth <= 3;

/* ===================== START LISTENER ===================== */
export async function startPupilListen(profile, callback) {
  let unsubscribePupils = localStorage.getItem("listener");
  const isDeactivated = localStorage.getItem("isDeactivated") === "true";
  if (!profile?.schoolId || !profile?.classId || !profile?.uid) {
    showToast("Teacher profile incomplete");
    
    return pupilsCache;
  }
  
  if (isDeactivated) {
        showToast("School Inactive.Pay to continue");
    return;
  }
  
  
  /* ---------- Prevent duplicate listeners ---------- */
  if (unsubscribePupils) {
    return pupilsCache;
  }
 
  
  
  
  /* ---------- Load cached pupils FIRST ---------- */
  const cached = localStorage.getItem("pupils");
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed)) {
        pupilsCache = parsed;
        renderMainApp();
      }
    } catch {
      console.warn("Invalid cached pupils");
    }
  }

  /* ---------- Offline → cache only ---------- */
  
  
  
  const online = await isOnline();
  /* ---------- ONLINE CHECK ---------- */
  if (!online) {
    
    showToast("Offline: showing cached pupils", { color: "orange" });
    return pupilsCache;
  }
  
  
  
  
  const currentYear = new Date().getFullYear().toString();
  const classRef = doc(db, "schools", profile.schoolId, "classes", profile.classId);
  const classSnap = await getDoc(classRef);
  const classYear = classSnap.exists() ? classSnap.data().currentYear : null;

  
  /* ---------- Ensure teacher doc exists ---------- */
  try {
    const teacherRef = doc(
      db,
      "schools",
      profile.schoolId,
      "classes",
      profile.classId,
      "teachers",
      profile.uid
    );
    await getDoc(teacherRef);
  } catch {
    console.warn("Teacher doc missing");
    return pupilsCache;
  }
  
  
  if (!classSnap.exists() || classYear !== currentYear) {
    showToast("New year started — pupils collection reseting.Please wait", { color: "blue" });
    const pupilsCol = collection(db, "schools", profile.schoolId, "classes", profile.classId, "pupils");
    const pupilsSnapshot = await getDocs(pupilsCol);
    const batch = writeBatch(db);

    pupilsSnapshot.docs.forEach(pupilDoc => {
      batch.delete(pupilDoc.ref);
    });

    await batch.commit();
    await updateDoc(classRef, { currentYear });
    
  }

  
  /* ---------- Firestore listener ---------- */
  const pupilsCol = collection(
    db,
    "schools",
    profile.schoolId,
    "classes",
    profile.classId,
    "pupils"
  );

  const q = query(pupilsCol, orderBy("name", "asc"));

  showToast("Pupil sync started (5-minute window)", { color: "green" });
  localStorage.setItem("pupilListen", "true");

  unsubscribePupils = onSnapshot(
    q,
    snapshot => {
      pupilsCache = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      localStorage.setItem("pupils", JSON.stringify(pupilsCache));
      if (callback) callback(snapshot);
      renderMainApp();
    },
    error => console.error("Pupil listener error:", error)
  );

  /* ---------- Auto-stop after 5 minutes ---------- */
  listenerTimeout = setTimeout(() => {
    stopPupilListen();

    showToast(
      "Pupil sync paused — using cached data",
      { color: "orange" }
    );

    // ✅ Force UI refresh with cached pupils
    renderMainApp();
  }, 5 * 60 * 1000);

  return pupilsCache;
}

/* ===================== STOP LISTENER ===================== */
export function stopPupilListen() {
  let unsubscribePupils = localStorage.getItem("listener");

  if (unsubscribePupils) {
    unsubscribePupils();
    unsubscribePupils = null;
  }

  if (listenerTimeout) {
    clearTimeout(listenerTimeout);
    listenerTimeout = null;
  }

  // ✅ DO NOT clear cache
  localStorage.removeItem("pupilListen");

  return pupilsCache;
}

/* ===================== RESTART LISTENER ===================== */
export async function restartPupilListen(profile, callback) {
  let isLocked = localStorage.getItem("pupilListen") === "true";
  let unsubscribePupils = localStorage.getItem("listener");
  const online = await isOnline();
  /* ---------- ONLINE CHECK ---------- */
  if (!online) {
    showToast("You are offline", {color: "red", icon: "offline_bolt"});
    return pupilsCache;
  }
  const isDeactivated = localStorage.getItem("isDeactivated") === "true";
  
  if (isDeactivated) {
    showToast("School Inactive.Pay to continue.");
    return;
  }
  
  if (isLocked) {
    showToast("Listener already running.");
    return pupilsCache;
  }
  localStorage.setItem("pupilListen", "true");
  return startPupilListen(profile, callback);
}

/* ===================== ADD PUPIL ===================== */
export async function addPupil(name, profile) {
  if (!name?.trim()) return;
  if (!profile?.schoolId || !profile?.classId) return;

  const pupilsCol = collection(
    db,
    "schools",
    profile.schoolId,
    "classes",
    profile.classId,
    "pupils"
  );

  const classRef = doc(
    db,
    "schools",
    profile.schoolId,
    "classes",
    profile.classId
  );

  // Ensure currentYear is up to date & increment total pupils
  const currentYear = new Date().getFullYear().toString();
  await updateDoc(classRef, {
    currentYear,
    totalPupils: increment(1)
  });

  const docRef = doc(pupilsCol);
  await setDoc(docRef, {
    id: docRef.id,
    name: name.trim(),
    createdAt: new Date()
  });

  showToast(`${name} added successfully`);
}

/* ===================== ADD PUPIL BUTTON ===================== */
const addBtn = document.getElementById("addPupil");

if (addBtn) {
  addBtn.addEventListener("click", async () => {
     const isDeactivated = localStorage.getItem("isDeactivated") === "true";
    
  
  if (isDeactivated) {
        showToast("School Inactive.Pay to continue");
    return;
  }
    
    if(!dueDate){
      restrictPupilChanges("add");
      return;
    }
    
    
    const isAllSync = localStorage.getItem(syncKey) === "true";
    const input = document.getElementById("pupil-add");
    
    const online = await isOnline();
  /* ---------- ONLINE CHECK ---------- */
  if (!online || isAllSync) {
      input.value = "";
      showToast(
        "Cannot add pupil while offline or after submission",
        { color: "red", icon: "cancel" }
      );
      toggleAddPupilBox();
      return;
    }
    
    
const isListener = localStorage.getItem("pupilListen") === "true";
    
    if (!isListener) {
        showToast("Listen closed. Turn on the listener first", {color: "yellow"});
    return;
  }
    if (!input?.value.trim()) {
      showToast("Enter pupil name");
      return;
    }

    const profile = JSON.parse(localStorage.getItem("userProfile"));
    toggleAddPupilBox();
    await addPupil(input.value, profile);
    input.value = "";
  });
}