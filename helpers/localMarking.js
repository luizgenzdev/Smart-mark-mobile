import { getToday } from "../helpers/helpers.js";

const STORAGE_KEY = "att_today";
const MONTH_KEY = "att_month";

/* ---------------- DEFAULT ATTENDANCE ---------------- */
function defaultAttendance() {
  return {
    date: getToday(),
    data: []
  };
}

/* ---------------- LOAD TODAY'S ATTENDANCE ---------------- */
export function loadAttendanceToday() {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (!saved) return defaultAttendance(); // Not found → default

  const parsed = JSON.parse(saved);

  if (parsed.date !== getToday()) { // Old data → reset
    localStorage.removeItem(STORAGE_KEY);
    return defaultAttendance();
  }

  return parsed; // Today’s data → use saved
}

/* ---------------- SAVE TODAY'S ATTENDANCE ---------------- */
export function saveAttendanceToday(attendance) {
  if (!attendance || !attendance.date) {
    attendance = defaultAttendance();
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(attendance));
}

/* ---------------- LOAD TODAY'S ATTENDANCE ---------------- */
export function loadAttendanceMonth() {
  const saved = localStorage.getItem(MONTH_KEY);

  if (!saved) return; // Not found → default

  const parsed = JSON.parse(saved);

  return parsed; // Today’s data → use saved
}

/* ---------------- SAVE TODAY'S ATTENDANCE ---------------- */
export function saveAttendanceMonth(attendance) {
  if (!attendance) {
    return null;
  }
  localStorage.setItem(MONTH_KEY, JSON.stringify(attendance));
}


