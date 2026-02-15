/* =============================== IMPORTS ================================ */
import { parseDate, statusColor, countPresent, getWeeklyAttendance, getToday, getMonthName, parseDDMMYYYY } from "../helpers/helpers.js";
import { loadAttendanceMonth } from "../helpers/localMarking.js";
import { getActiveTerm } from "../services/termService.js";
import { pupilsCache } from "../components/pupils.js";
import { showToast } from "../helpers/toast.js";
import { db } from "../firebase/db.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";


/* =============================== CONFIG ================================ */
const syncKey = `isAllSync_${getToday()}`;
const isAllSync = localStorage.getItem(syncKey) === "true";
const profile = JSON.parse(localStorage.getItem("userProfile"));
const year = new Date().getFullYear();


/* =============================== TEACHER MESSAGES ================================ */
const teacherMessages = [
  "Hello {name}! The new term hasn’t started yet.",
  "Hi {name}, the next term is coming soon.",
  "Almost there, {name}! Get ready for another term.",
  "Good things take time, {name}.",
  "Relax for now, {name}. School resumes soon.",
  "Patience 🌱 — this term is preparing to begin.",
  "Good things take time ⏳. The term hasn’t started yet.",
  "The journey hasn’t begun 🚦. Get ready!",
  "Almost there 📅 — the term will start soon.",
  "Planning mode 🧠. Classes begin shortly."
];


/* =============================== HELPER FUNCTIONS ================================ */
function filterDayByPupils(day, validPupilIds) {
  if (!day.pupils) return day;
  const filteredPupils = {};
  for (const pupilId in day.pupils) {
    if (validPupilIds.has(pupilId)) {
      filteredPupils[pupilId] = day.pupils[pupilId];
    }
  }
  return { ...day, pupils: filteredPupils };
}

function renderPupilCard(pupilId, days, pupils) {
  const pupil = pupils.find(p => String(p.id) === String(pupilId));
  const name = pupil ? pupil.name : `Unknown (${pupilId})`;
  const dayBoxes = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    .map(d => `
      <div class="size-6 ${statusColor(days[d])} text-white rounded flex items-center justify-center text-xs">
        ${d[0]}
      </div>
    `).join("");

  return `
    <div class="shadow p-4 rounded flex flex-col gap-2 dark:bg-[#1f1f1f]">
      <h2 class="uid font-semibold pupil-name" data-name="${name.toLowerCase()}">
        ${name}
      </h2>
      <p class="text-xs">Present: ${countPresent(days)} day(s)</p>
      <div class="flex gap-2">${dayBoxes}</div>
    </div>
  `;
}

function renderWeek(weekKey, pupilsData, pupils) {
  const cards = Object.keys(pupilsData)
    .sort((a, b) => {
      const na = pupils.find(p => p.id == a)?.name || a;
      const nb = pupils.find(p => p.id == b)?.name || b;
      return na.localeCompare(nb);
    })
    .map(id => renderPupilCard(id, pupilsData[id], pupils))
    .join("");

  const [, , label, no] = weekKey.split("_");

  return `
    <section class="report-week flex flex-col gap-4 py-4 border-t rounded-t border-gray-300 dark:border-[#1f1f1f]"
      data-week="${label.toUpperCase()}_${no}">
      <p class="text-sm text-center font-semibold">${label} ${no}</p>
      ${cards}
    </section>
  `;
}


/* =============================== BUILD ATTENDANCE ================================ */
export async function buildAttendance(termName, begin, end) {
  if (!profile?.schoolId || !profile?.classId) return null;

  const records = [];
  const today = getToday();
  const validPupilIds = new Set(pupilsCache.map(p => p.id));

  const monthData = loadAttendanceMonth() || [];
  const days = monthData.records || [];

  days.forEach(day => {
    if (parseDDMMYYYY(day.date) >= parseDDMMYYYY(begin) &&
        parseDDMMYYYY(day.date) <= parseDDMMYYYY(end)) {
      records.push(filterDayByPupils(day, validPupilIds));
    }
  });

  records.sort((a, b) => a.date.localeCompare(b.date));
  return { termName, begin, end, records };
}


/* =============================== MAIN RENDER ================================ */
export default async function renderReports() {
  if (!profile) return "";

  const isDeactivated = localStorage.getItem("isDeactivated") === "true";
  if (isDeactivated) {
    return `
      <div class="max-w-sm mx-auto mt-20 p-6 flex flex-col gap-4 text-center">
        <p class="text-2xl uppercase font-bold dark:text-white">Access Restricted</p>
        <h2 class="text-sm text-gray-400 uppercase">
          Your account is temporarily inactive because your payment is due.
        </h2>
        <p class="text-xs text-gray-400 font-light mt-2">Call or message:</p>
        <ul class="mt-2 text-xs text-gray-700 dark:text-gray-300 space-y-1">
          <li><span class="font-semibold">Email:</span> genzlewis@gmail.com</li>
          <li><span class="font-semibold">Phone:</span> +260 962 063 468</li>
          <li><span class="font-semibold">WhatsApp:</span> +260 962 063 468</li>
        </ul>
      </div>
    `;
  }

  const teacherName = profile.name;
  const pupils = pupilsCache;
  const monthName = getMonthName(getToday());

  const termName = await getActiveTerm(profile);
  const localTermData = JSON.parse(localStorage.getItem("termData"));

  if (!termName && !localTermData) {
    showToast("No Active Term.");
    return `
      <div class="pt-24 text-center uppercase">
        ${teacherName} please visit the <strong class="text-green-500">DASHBOARD</strong><br>
        To add new term
      </div>
    `;
  }

  const attendance = await buildAttendance(termName, localTermData.begin, localTermData.end);
  if (!attendance) return `<p class="py-8 text-center">NO AVAILABLE ATTENDANCE</p>`;

  const futureTerm = parseDate(getToday()) < parseDate(attendance.begin);

  if (termName && futureTerm) {
    const msg = teacherMessages[Math.floor(Math.random() * teacherMessages.length)]
      .replace("{name}", teacherName);
    return `
      <p class="mt-10 mx-6 shadow p-4 rounded text-center text-sm dark:bg-[#1f1f1f] teacher-message">
        ${msg}
      </p>
    `;
  }

  const weeklyData = getWeeklyAttendance(attendance, termName, attendance.begin);
  const validPupilIds = new Set(pupils.map(p => p.id));

  const filteredWeeklyData = {};
  for (const weekKey in weeklyData) {
    const filtered = {};
    for (const pid in weeklyData[weekKey]) {
      if (validPupilIds.has(pid)) filtered[pid] = weeklyData[weekKey][pid];
    }
    if (Object.keys(filtered).length) filteredWeeklyData[weekKey] = filtered;
  }
  
  function getFormalGreeting() {
  const hour = new Date().getHours();

  const morning = [
    "Good morning",
    "Welcome",
    "Greetings",
    "Morning greetings",
    "Warm morning",
    "Hello",
    "Best wishes",
    "Morning regards",
    "Pleasant morning",
    "Bright morning"
  ];

  const afternoon = [
    "Good afternoon",
    "Welcome",
    "Greetings",
    "Afternoon greetings",
    "Warm afternoon",
    "Hello",
    "Best wishes",
    "Afternoon regards",
    "Pleasant afternoon",
    "Bright afternoon"
  ];

  const evening = [
    "Good evening",
    "Welcome",
    "Greetings",
    "Evening greetings",
    "Warm evening",
    "Hello",
    "Best wishes",
    "Evening regards",
    "Pleasant evening",
    "Bright evening"
  ];

  let list;
  if (hour < 12) list = morning;
  else if (hour < 17) list = afternoon;
  else list = evening;

  return list[Math.floor(Math.random() * list.length)];
}
  
  const weeksHTML = Object.keys(filteredWeeklyData)
    .sort((a, b) => a.split("*").pop() - b.split("*").pop())
    .map(w => renderWeek(w, filteredWeeklyData[w], pupils))
    .join("");

  const [y, t] = termName.split("_");

  return `
    <div class="pt-6 px-4 flex flex-col gap-4">
      <div class="text-center">
        <h2 class="text-xl font-bold">${getFormalGreeting()}, ${teacherName} 👋</h2>
        <p class="text-sm text-gray-400 uppercase">
          Reports for ${monthName} | ${y} ${t.replace("T", "Term ")}
        </p>
      </div>

      <div class="w-full shadow p-4 rounded flex flex-col gap-2 dark:bg-[#1f1f1f]">
        <p class="text-xs">Search Report</p>
        <div class="flex gap-2 border border-gray-300 dark:border-[#121212] px-2 py-2 rounded">
          <i class="mdi-o text-md text-gray-400">search</i>
          <input id="week-search" class="flex-1 text-sm bg-transparent focus:outline-none"
            placeholder="Search by week or pupil name">
        </div>
      </div>

      <div id="reports-container">
        ${weeksHTML || `<p class="text-center text-red-500">Mark attendance to see reports ✨</p>`}
      </div>
    </div>
  `;
}


/* =============================== SEARCH FUNCTIONALITY ================================ */
document.addEventListener("input", e => {
  const input = e.target;
  if (!input.matches("#week-search")) return;

  const query = input.value.toLowerCase().trim();
  const weeks = document.querySelectorAll(".report-week");
  let found = false;

  weeks.forEach(week => {
    const weekLabel = week.dataset.week.toLowerCase();
    const cards = week.querySelectorAll(".shadow");
    let weekHasMatch = false;

    cards.forEach(card => {
      const nameEl = card.querySelector(".pupil-name");
      const pupilName = nameEl?.dataset.name || "";

      const match = !query ||
        weekLabel.split("_").join(" ").includes(query) ||
        pupilName.includes(query);

      card.style.display = match ? "flex" : "none";
      if (match) weekHasMatch = true;
    });

    week.style.display = weekHasMatch ? "flex" : "none";
    if (weekHasMatch) found = true;
  });

  let msg = document.getElementById("no-report-msg");
  if (!found && query) {
    if (!msg) {
      msg = document.createElement("p");
      msg.id = "no-report-msg";
      msg.className = "text-center text-red-500 font-semibold mt-6";
      msg.textContent = `No data found for "${input.value}"`;
      document.getElementById("reports-container").appendChild(msg);
    }
  } else if (msg) msg.remove();
});


/* =============================== TEACHER MESSAGE ROTATION ================================ */
const teacherMessageElement = () => document.querySelector(".teacher-message");
setInterval(() => {
  const el = teacherMessageElement();
  if (!el) return;
  const msg = teacherMessages[
    Math.floor(Math.random() * teacherMessages.length)
  ].replace("{name}", profile?.name || "Teacher");
  el.textContent = msg;
}, 5000);