import {
  doc,
  getDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { db } from "../firebase/db.js";
import { getActiveTerm } from "../services/termService.js";
import { getToday, getMonthName } from "../helpers/helpers.js";
import { showToast } from "../helpers/toast.js";
import { isOnline } from '../firebase/helpers.js';
import {
  loadAttendanceToday,
  saveAttendanceToday
} from "../helpers/localMarking.js";
//import { pupilsCache } from "./pupils.js";

/* =====================================================
   SANITIZE ATTENDANCE AGAINST LIVE PUPILS CACHE
===================================================== */
function sanitizeAttendance(attendance, pupils) {
  if (!attendance || !Array.isArray(attendance.data)) return attendance;

  const pupilIds = new Set(pupils.map(p => p.id));

  return {
    ...attendance,
    data: attendance.data.filter(p => pupilIds.has(p.id))
  };
}

/* =====================================================
   SUBMIT TODAY'S ATTENDANCE
===================================================== */
export async function submitData() {
   const isDeactivated = localStorage.getItem("isDeactivated") === "true";
  
    /* ---------- LOAD TEACHER PROFILE ---------- */
  const profile = JSON.parse(localStorage.getItem("userProfile"));
  if (!profile?.schoolId || !profile?.classId) {
    showToast("Teacher profile missing school/class info" , {color: "red", icon: "cancel"});
    return;
  }
  
  if (isDeactivated) {
        showToast("School Inactive.Pay to continue", {color: "red", icon: "cancel"});
    return;
  }

  const pupilsCache = JSON.parse(localStorage.getItem("pupils"));
  const online = await isOnline();
  /* ---------- ONLINE CHECK ---------- */
  if (!online) {
    showToast("Cannot submit data when offline", {color: "red", icon: "cancel"});
    return;
  }

  /* ---------- LOAD LOCAL ATTENDANCE ---------- */
  let localData = loadAttendanceToday();
  const today = getToday();
  const syncKey = `isAllSync_${today}`;

  if (!localData?.data?.length) {
    showToast("Nothing to submit for today",{color: "yellow"});
    return;
  }

  /* ---------- CLEAN INVALID PUPILS ---------- */
  if (localData.data.length === 0) {
    showToast("Attendance cleared (no valid pupils)");
    return;
  }

  /* ---------- CHECK IF ALL RECORDS ALREADY SYNCED ---------- */
  if (localData.data.every(p => p.isSync)) {
    showToast("No data to upload. Thank you!");
    return;
  }

  /* ---------- GET ACTIVE TERM ---------- */
  const termId = await getActiveTerm(profile);
  if (!termId) {
    showToast("No active term", {color: "red", icon: "cancel"});
    return;
  }

  /* ---------- BUILD FIRESTORE PATH ---------- */
  const monthName = getMonthName(today);
  const year = new Date().getFullYear();
  
  const monthRef = doc(
    db,
    "schools", profile.schoolId,
    "classes", profile.classId,
    "attendance", String(year),
    termId, monthName
  );
  
  const pupilsRef = doc(
    db,
    "schools", profile.schoolId,
    "classes", profile.classId,
    "attendance", String(year),
  );
  
  /* ---------- STRONG isAllSync CHECK ---------- */
  const pupilIds = new Set(pupilsCache.map(p => p.id));
  const attendanceIds = localData.data.map(p => p.pupilId);
  const isAllSync = localData.data.length === pupilsCache.length && attendanceIds.every(id => pupilIds.has(id));
  
  /* ---------- LOAD EXISTING MONTH DATA ---------- */ 
  const snap = await getDoc(monthRef);
  const monthData = snap.exists()
    ? snap.data()
    : { records: [] };

  /* ---------- REMOVE OLD RECORD FOR TODAY ---------- */
  monthData.records = monthData.records.filter(
    r => r.date !== today
  );

  /* ---------- PUSH TODAY'S ATTENDANCE ---------- */
  monthData.records.push({
    date: today,
    data: localData.data.map(p => ({
      ...p,
      isSync: true
    })),
    markedBy: profile.name || "Teacher",
    markedById: profile.email || null,
    markedAt: Date.now(),
    isAllSync
  });
  
  /* ---------- UPLOAD ---------- */
  showToast("Uploading...");
  await setDoc(monthRef, monthData);

  /* ---------- UPLOAD PUPILS ONLY IF NOVEMBER ---------- */
  if (monthName.toLowerCase() === "november") {
    const pupils = { pupils: pupilsCache };
    await setDoc(pupilsRef, pupils);
  }
  

  /* ---------- UPDATE LOCAL CACHE ---------- */
  saveAttendanceToday({
    date: today,
    data: localData.data.map(p => ({
      ...p,
      isSync: true
    })),
  });
  showToast(`Uploaded attendance for ${localData.data.length} pupils`);
}