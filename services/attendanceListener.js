import { onSnapshot, doc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { db } from "../firebase/db.js";
import { getActiveTerm } from "../services/termService.js";
import { getToday, getMonthName } from "../helpers/helpers.js";
import { showToast } from "../helpers/toast.js";
import renderMainApp from "../main.js";
import { saveAttendanceToday, saveAttendanceMonth } from "../helpers/localMarking.js";

// Cache for attendance data
export let attendanceCache = [];
const year = new Date().getFullYear();

/* ---------------- REAL-TIME LISTENER FOR TODAY'S CLASS ATTENDANCE ---------------- */
export async function listenToAttendance() {
  const profile = JSON.parse(localStorage.getItem("userProfile"));
  if (!profile?.schoolId || !profile?.classId) {
    console.error("Teacher profile missing schoolId or classId");
    return null;
  }

  const today = getToday();
  const monthName = getMonthName(today);
  const syncKey = `isAllSync_${today}`;

  const termId = await getActiveTerm(profile);
  if (!termId) return null;
  

  const monthRef = doc(
    db,
    "schools", profile.schoolId,
    "classes", profile.classId,
    "attendance", String(year),
    termId, monthName
  );

  const unsubscribe = onSnapshot(monthRef, (snap) => {

  

    if (!snap.exists()) {
      attendanceCache = [];
      renderMainApp(profile);
      return;
    }

const isAllSync = localStorage.getItem(syncKey) === "true";
    const monthData = snap.data();
    const todayRecord = monthData.records?.find(r => r.date === today) || { data: [] };
    attendanceCache = todayRecord.data || [];
      saveAttendanceToday(todayRecord);
      saveAttendanceMonth(monthData);
    console.warn("UPDATED")
    
      localStorage.setItem(syncKey, `${todayRecord.isAllSync}`);
    if (todayRecord.markedAt) {
      const lastNotify = localStorage.getItem("attendanceNotifiedAt");
      const currentUserId = profile?.email;
      const markedByOtherUser =
        todayRecord.markedById &&
        todayRecord.markedById !== currentUserId;

      if (markedByOtherUser && lastNotify !== String(todayRecord.markedAt)) {
        showToast(`Attendance has been marked by ${todayRecord.markedBy}`);
        localStorage.setItem(
          "attendanceNotifiedAt",
          String(todayRecord.markedAt)
        );
      }
    }

    renderMainApp();
  });

  return unsubscribe; // ✅ unchanged
}