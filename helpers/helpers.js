import { showToast } from "./toast.js";

// ================= DATE HELPERS =================
export function parseDate(dmy) {
  const [day, month, year] = dmy.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function getToday() {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

export function formatDate(dmy) {
  const [day, month, year] = dmy.split("-").map(Number);
  const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
];
  return `${day} ${months[month - 1]} ${year}`;
}

// ================= WEEK / DAY HELPERS =================
const weekDays = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

export function getWeekdayName(date) {
  return weekDays[(date.getDay() + 6) % 7]; // Monday = 0
}

export function getWeekNumber(date, termStartDate) {
  const diffDays = Math.floor((date - termStartDate) / 86400000);
  return Math.floor(diffDays / 7) + 1;
}

export function isWeekend(dateStr) {
  const date = dateStr ? parseDate(dateStr) : new Date();
  const day = date.getDay();
  return day === 0 || day === 6;
}

// ================= STATUS HELPERS =================
export function statusColor(status) {
  switch (status?.toUpperCase()) {
    case "PRESENT": return "bg-green-500";
    case "ABSENT": return "bg-red-500";
    case "SICK": return "bg-orange-500";
    case "HOLIDAY": return "bg-blue-500";
    default: return "bg-gray-400";
  }
}

export function countPresent(days) {
  return Object.values(days).filter(
    s => s?.toUpperCase() === "PRESENT"
  ).length;
}

// ================= TERM DATE LOGIC =================
export function isDateInTerm(dateStr, term) {
  if (!term?.begin || !term?.end) return false;
  const date = parseDate(dateStr);
  return date >= parseDate(term.begin) && date <= parseDate(term.end);
}

export function isFutureTerm(term) {
  return parseDate(getToday()) < parseDate(term.begin);
}

export function isActiveTerm(term) {
  const today = parseDate(getToday());
  return today >= parseDate(term.begin) && today <= parseDate(term.end);
}

export function isPastTerm(term) {
  return parseDate(getToday()) > parseDate(term.end);
}

// ================= WEEKLY ATTENDANCE =================
export function getWeeklyAttendance(attendance, termName, termStart) {
  if (!attendance?.records?.length) return {};

  const termStartDate = parseDate(termStart);
  const weekly = {};
  attendance.records.forEach(record => {
    
    const dateObj = parseDate(record.date);
    const weekKey = `${termName}_Week_${getWeekNumber(dateObj, termStartDate)}`;
    const dayName = getWeekdayName(dateObj);

    if (!weekly[weekKey]) weekly[weekKey] = {};

    record.data.forEach(pupil => {
     
      if (!weekly[weekKey][pupil.pupilId]) {
        weekly[weekKey][pupil.pupilId] = {};
      }
      weekly[weekKey][pupil.pupilId][dayName] =
        pupil.status?.toUpperCase();
    });
  });

  return weekly;
}

// ================= TERM MAINTENANCE =================
export async function clearPastTerms() {
  const attendance = loadAttendance();
  const today = parseDate(getToday());

  const archive = JSON.parse(localStorage.getItem("lg") || "{}");
  const active = {};

  Object.entries(attendance).forEach(([name, term]) => {
    if (parseDate(term.end) < today) {
      archive[name] = term;
    } else {
      active[name] = term;
    }
  });

  localStorage.setItem("lg", JSON.stringify(archive));
  saveAttendance(active);

  return active;
}

// ================= ADD NEW TERM =================
export function addTerm(termName, begin, end) {
  const attendance = loadAttendance();

  const newBegin = parseDate(begin);
  const newEnd = parseDate(end);

  // Block overlapping terms ONLY
  const overlaps = Object.values(attendance).some(term => {
    const b = parseDate(term.begin);
    const e = parseDate(term.end);
    return newBegin <= e && newEnd >= b;
  });

  if (overlaps) return false;

  attendance[termName] = {
    termName,
    begin,
    end,
    records: []
  };

  saveAttendance(attendance);
  return true;
}

/**
 * Get full month name from a date string (YYYY-MM-DD)
 * @param {string} dateStr - date in format "YYYY-MM-DD"
 * @returns {string} Month name, e.g., "January"
 */
export function getMonthName(dateStr) {
  const [d,m,y] = dateStr.split('-');
  const newDate = `${y}-${m}-${d}`;
  
  const date = new Date(newDate);
  // Using Intl.DateTimeFormat for locale-safe month name
  return new Intl.DateTimeFormat("en-US", { month: "long" }).format(date);
}


export function parseDDMMYYYY(dateStr) {
  const [day, month, year] = dateStr.split("-").map(Number);

  // JS months are 0-based (0 = January)
  return new Date(year, month - 1, day);
}

export function compareDates(dateA, dateB) {
  const d1 = parseDDMMYYYY(dateA);
  const d2 = parseDDMMYYYY(dateB);
  
  return d1 < d2;
}

export function restrictPupilChanges(action) {
  
  const messages = {
    add: "You can only add pupils from January to April.",
    edit: "Editing pupils is only allowed from January to April.",
    delete: "Deleting pupils is only allowed from January to April."
  };

  showToast(messages[action], { color: "yellow" });
}


