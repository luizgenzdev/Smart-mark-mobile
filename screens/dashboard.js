import { getToday, getMonthName, formatDate, isWeekend } from "../helpers/helpers.js";
import { loadAttendanceToday } from "../helpers/localMarking.js";
import { pupilsCache } from "../components/pupils.js";
import { mark, markAll } from "../components/attendance.js";
import { submitData } from "../components/upload.js";
import { createTerm, getActiveTerm,deactivateTerm } from "../services/termService.js";
import { showToast } from "../helpers/toast.js";

/* ================= HELPERS ================= */

let count = 0;
const monthName = getMonthName(getToday());

function findPupil(data, pupil) {
  return data.find(x => String(x.pupilId) === String(pupil.id));
}

function parseDMY(dmy) {
  const [d, m, y] = dmy.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/* ================= PROFILE ================= */
const profile = JSON.parse(localStorage.getItem("userProfile"));

const syncKey = `isAllSync_${getToday()}`;
if (!profile ) {
  localStorage.removeItem("userProfile");
  localStorage.removeItem("activeTerm");
  localStorage.removeItem("termData");
  localStorage.removeItem(syncKey)
  localStorage.removeItem("att_today");
  localStorage.removeItem("att_month");
}

const teacherName = profile?.name || "Teacher";

const weekendQuotes = [
  `Dear ${teacherName}, the Genz team is on weekend mode 🛌. Feel free to review pupil reports at your convenience 📊.`,
  `Weekend pause for the Genz innovators 🧘. ${teacherName}, you may manage class records and monitor pupils while we recharge.`,
  `A restful weekend for our team 🎵. ${teacherName}, you are encouraged to check progress reports and plan ahead 📋.`,
  `The Genz squad is offline this weekend 🌿. Kindly take this time, ${teacherName}, to update pupil records and review their progress.`,
  `While the Genz team rests 🛡️, your attention to pupil reports and classroom management is appreciated, ${teacherName} 💡.`,
  `Genz weekend mode activated 🌸. ${teacherName}, you can use this opportunity to analyze reports and track pupils' achievements.`,
  `Our creative cores are recharging 🔋. Please review attendance and assessment reports at your convenience, ${teacherName}.`,
  `The team is taking a brief respite 🎶. Feel free, ${teacherName}, to manage pupils' data and monitor their growth.`,
  `Weekend recharge in progress ✨. ${teacherName}, you are welcome to plan lessons and update pupil reports.`,
  `While Genz rests, your guidance matters 📚. ${teacherName}, review pupil performance and update records as needed.`,
  `A peaceful interlude for the Genz squad 🌿. ${teacherName}, kindly use this time to view reports and manage pupils.`,
  `Genz team is offline this weekend 🧘‍♂️. Please ensure pupil records are up-to-date and reports are checked, ${teacherName}.`,
  `As our innovators recharge ⚡, ${teacherName}, you are encouraged to oversee pupil progress and manage classroom data.`,
  `The team enjoys their weekend break 🎵. Your careful review of pupil performance is welcomed and appreciated, ${teacherName}.`,
  `Weekend serenity for the Genz crew 🌸. ${teacherName}, you may review reports and ensure all pupil information is current.`
];

const futureTermQuotes = [
  "Patience 🌱 — this term is preparing to begin.",
  "Good things take time ⏳. The term hasn't started yet.",
  "The journey hasn't begun 🚦. Get ready!",
  "Almost there 📅 — the term will start soon.",
  "Planning mode 🧠. Classes begin shortly."
];

/* ================= RENDER DASHBOARD ================= */
const renderDashboard = async () => {
  
  const today = getToday();
  const todayDate = parseDMY(today);
  const profile = JSON.parse(localStorage.getItem("userProfile"));
  
  if (!profile) {
    return `<p class="flex flex-col items-center px-6 gap-4 pt-20>Error: Teacher profile missing</p>`;
  }
  
  const isDeactivated = localStorage.getItem("isDeactivated") === "true";
 
  if(isDeactivated) {
    return `
    <div class="max-w-sm mx-auto mt-20 p-6 flex flex-col gap-4 text-center">
      <p class="text-2xl uppercase font-bold dark:text-white">
        Access Restricted
      </p>
      
      <h2 class="text-sm text-gray-400 uppercase">
        Your account is temporarily inactive because your payment is due.
      </h2>
      
      <p class="text-xs text-gray-400 font-light mt-2">
        Call or message:
      </p>
      
      <ul class="mt-2 text-xs text-gray-700 dark:text-gray-300 space-y-1">
        <li><span class="font-semibold">Email:</span> genzlewis@gmail.com</li>
        <li><span class="font-semibold">Phone:</span> +260 962 063 468</li>
        <li><span class="font-semibold">WhatsApp:</span> +260 962 063 468</li>
      </ul>
    </div>
    `;
  }

  const pupils = JSON.parse(localStorage.getItem("pupils")) || pupilsCache;
  let todayRecord = loadAttendanceToday();
  
  let termName = await getActiveTerm(profile);
  let term = JSON.parse(localStorage.getItem("termData"));

  // ================= NO ACTIVE TERM =================
  if (!termName || !term) {
    const html = `
      <div class="flex flex-col items-center px-6 gap-4 pt-20">
        <h2 class="text-lg font-bold text-red-500">No Active Term</h2>

        <div class="mt-4 flex w-full flex-col gap-2">
          <div class="flex gap-2 border border-gray-300 dark:border-gray-700 px-2 py-2 rounded">
            <i class="mdi-o text-md text-gray-400">edit</i>
            <input id="term-name" class="flex-1 text-sm bg-transparent focus:outline-none"
              placeholder="Enter Term Name e.g 2026_T1">
          </div>

          <div class="flex gap-2 border border-gray-300 dark:border-gray-700 px-2 py-2 rounded">
            <i class="mdi-o text-md text-gray-400">event</i>
            <input id="term-begin" type="date"
              class="flex-1 text-sm bg-transparent focus:outline-none">
          </div>

          <div class="flex gap-2 border border-gray-300 dark:border-gray-700 px-2 py-2 rounded">
            <i class="mdi-o text-md text-gray-400">event</i>
            <input id="term-end" type="date"
              class="flex-1 text-sm bg-transparent focus:outline-none">
          </div>

          <button id="create-term-btn"
            class="w-full py-2 bg-green-500 active:bg-green-400 text-white rounded font-bold mt-2">
            Create Term
          </button>
        </div>
      </div>
    `;
    return html;
  }

  // ================= FUTURE TERM =================
  const termBeginDate = parseDMY(term.begin);

  if (todayDate < termBeginDate) {
    const quote = futureTermQuotes[
      Math.floor(Math.random() * futureTermQuotes.length)
    ];

    const html = `
      <div class="pt-10 px-6 flex flex-col mb-6 gap-4 items-center text-center">
        
        <p class="w-full shadow p-4 rounded text-sm dark:bg-[#1f1f1f] future-term-quote">
          ${quote}
        </p>

        <div class="text-xs text-gray-400 flex flex-col gap-1">
          <p class="font-semibold text-gray-500">Upcoming Term</p>
          <p>
            Starts on
            <span class="font-bold text-[#000081] dark:text-white">
              ${formatDate(term.begin)}
            </span>
          </p>
        </div>
      </div>
    `;
    return html;
  }

  // ================= WEEKEND MODE =================
  if (isWeekend()) {
    const quote = weekendQuotes[
      Math.floor(Math.random() * weekendQuotes.length)
    ];

    const html = `
      <div class="pt-6 px-4 flex flex-col gap-4">
        <p class="w-full shadow p-4 rounded text-center text-sm dark:bg-[#1f1f1f] weekend-quote">
          ${quote}
        </p>
      </div>
    `;
    return html;
  }

  const lockBtns = todayRecord?.data?.some(p => p.isSync);
  const hideBtns = pupils.length === 0;
  const presentPupils = todayRecord.data.filter(p => p.status === "present");
  
  // ================= MAIN DASHBOARD =================
  const pupilListHTML = pupils.length === 0
    ? `<p class="text-center text-gray-500 font-semibold mt-4">
         No pupils yet 😅
       </p>`
    : pupils.map(p => {
        const record = findPupil(todayRecord?.data || [], p);
        const locked = record?.isSync || false;
        const status = record?.status || "Not marked";

        return `
          <div class="attendance-card w-full shadow p-4 rounded flex flex-col gap-2 dark:bg-[#1f1f1f]">
            <div class="flex flex-col gap-1">
              <h2 class=" font-semibold tracking-wider">${p.name}</h2>
              <p class="text-blue-800 dark:text-white text-xs">Status: <span class="status-text">${status}</span></p>
            </div>
            <div class="flex text-white gap-2">
              <button ${locked ? "disabled" : ""} data-id="${p.id}" data-status="present" class="attendance-btn px-4 py-[6px] bg-green-500 active:bg-green-400 text-sm flex items-center gap-2 rounded disabled:bg-green-200">
                <i class="mdi-o text-lg">check_circle</i><p class="text-xs">Present</p>
              </button>
              <button ${locked ? "disabled" : ""} data-id="${p.id}" data-status="absent" class="attendance-btn px-4 py-[6px] bg-red-500 active:bg-red-400 text-sm flex items-center gap-2 rounded disabled:bg-red-200">
                <i class="mdi-o text-lg">cancel</i><p class="text-xs">Absent</p>
              </button>
              <button ${locked ? "disabled" : ""} data-id="${p.id}" data-status="sick" class="attendance-btn px-4 py-[6px] bg-orange-500 active:bg-orange-400 text-sm flex items-center gap-2 rounded disabled:bg-orange-200">
                <i class="mdi-o text-lg">local_hospital</i><p class="text-xs">Sick</p>
              </button>
            </div>
          </div>
        `;
      }).join("");

  const html = `
    <div class="pt-6 px-4 flex flex-col gap-4">
      <div class="intro flex flex-col items-center justify-center">
        <h2 class="text-sm text-gray-400 uppercase text-center">
          ATTENDANCE FOR
        </h2>
        <p class="text-xl uppercase font-bold">
          ${formatDate(today)}
        </p>
        <p class="text-xs text-gray-400 font-light">
          Term Ends ${formatDate(term.end)}
        </p>
      </div>

      <div class="w-full shadow p-4 rounded flex flex-col gap-2 dark:bg-[#1f1f1f]">
        <p class="text-xs">Search Pupil</p>
        <div class="flex gap-2 border border-gray-300 dark:border-[#121212] px-2 py-2 rounded">
          <i class="mdi-o text-md text-gray-400">search</i>
          <input id="pupil-search"
            class="flex-1 text-sm bg-transparent focus:outline-none"
            placeholder="Search pupil by name">
        </div>
      </div>

      <div class="flex flex-col gap-4 w-full py-4 border-t border-gray-300 dark:border-[#1f1f1f] rounded-t">
        <p id="pupil-count-display" class="text-sm text-center">Pupils (${pupils.length})</p>

        <div id="pupil-list" class="flex flex-col gap-4 w-full py-2">
          ${pupilListHTML}
        </div>
  
        <div class="${ hideBtns ? "hidden" : "flex"} w-full shadow py-2 rounded  flex-col items-center justify-center gap-1 dark:bg-[#1f1f1f]">
           <p class="text-center text-xs">Pupils Present</p>
           <p id="present-count-display" class="text-center text-sm font-semibold">${presentPupils.length} out of ${pupils.length} Pupils</p>
        </div>
  
        <div class="gap-4 mt-2 ${lockBtns || hideBtns ? "hidden" : "flex"}">
          <button id="mark-all"
            class="w-full py-2 active:bg-green-400 bg-green-500 font-bold rounded text-white">
            All Present
          </button>

          <button id="holiday"
            class="w-full py-2 active:bg-green-400 bg-green-500 font-bold rounded text-white">
            Holiday Mark
          </button>
        </div>

        <button id="submit-btn"
          class="w-full py-3 active:bg-green-400 bg-green-500 font-bold rounded text-white mt-2 uppercase">
          Upload Attendance
        </button>
      </div>
    </div>
  `;
  
  return html;
};

export default renderDashboard;

/* ================= SEARCH ================= */
document.addEventListener("input", e => {
  const search = e.target.closest("#pupil-search");
  if (!search) return;

  const q = search.value.toLowerCase();
  const list = document.querySelector("#pupil-list");
  if (!list) return;

  let visible = false;
  count = 0; // reset count before recalculating
  let presentCount = 0;

  list.querySelectorAll(".attendance-card").forEach(card => {
    const name = card.querySelector("h2")?.textContent.toLowerCase() || "";
    const match = name.includes(q);
    card.style.display = match ? "flex" : "none";
    if (match) {
      count++;
      const status = card.querySelector(".status-text")?.textContent;
      if (status === "present") presentCount++;
      visible = true;
    }
  });

  // Update the pupils count display
  const countEl = document.querySelector("#pupil-count-display");
  if (countEl) countEl.textContent = `Pupils (${count})`;

  // Update the present count display
  const presentEl = document.querySelector("#present-count-display");
  if (presentEl) presentEl.textContent = `${presentCount} of ${count} Pupils`;

  let msg = document.querySelector("#no-data-msg");
  if (!visible) {
    if (!msg) {
      msg = document.createElement("p");
      msg.id = "no-data-msg";
      msg.className = "text-center text-red-500 font-semibold mt-4";
      msg.textContent = "No pupils found for your search 😅";
      list.appendChild(msg);
    }
  } else if (msg) {
    msg.remove();
  }
});

/* ================= EVENTS ================= */
document.addEventListener("click", async e => {
  // Mark single pupil
  const btn = e.target.closest(".attendance-btn");
  if (btn) {
    const pupilId = btn.dataset.id;
    const newStatus = btn.dataset.status;

    const card = btn.closest(".attendance-card");
    const statusText = card?.querySelector(".status-text");
    if (statusText) statusText.textContent = newStatus;

    await mark(pupilId, newStatus);

    // Update present count dynamically
    const presentEl = document.querySelector("#present-count-display");
    const list = document.querySelectorAll(".attendance-card");
    let presentCount = 0;
    list.forEach(c => {
      if (c.style.display !== "none" && c.querySelector(".status-text")?.textContent === "present") {
        presentCount++;
      }
    });
    const countEl = document.querySelector("#pupil-count-display");
    const visibleCount = Array.from(list).filter(c => c.style.display !== "none").length;
    if (presentEl) presentEl.textContent = `${presentCount} of ${visibleCount} Pupils`;
  }

  // Submit attendance
  if (e.target.closest("#submit-btn")) {
    await submitData();
  }

  // Mark all present
  if (e.target.closest("#mark-all")) {
    await markAll("present");

    document.querySelectorAll(".attendance-card .status-text")
      .forEach(el => (el.textContent = "present"));

    // Update present count dynamically
    const list = document.querySelectorAll(".attendance-card");
    const presentEl = document.querySelector("#present-count-display");
    const visibleCount = Array.from(list).filter(c => c.style.display !== "none").length;
    if (presentEl) presentEl.textContent = `${visibleCount} of ${visibleCount} Pupils`;
  }

  // Holiday mark
  if (e.target.closest("#holiday")) {
    await markAll("holiday");

    document.querySelectorAll(".attendance-card .status-text")
      .forEach(el => (el.textContent = "holiday"));

    // Update present count dynamically
    const list = document.querySelectorAll(".attendance-card");
    const presentEl = document.querySelector("#present-count-display");
    const visibleCount = Array.from(list).filter(c => c.style.display !== "none").length;
    if (presentEl) presentEl.textContent = `0 of ${visibleCount} Pupils`;
  }

  // Create term
  if (e.target.closest("#create-term-btn")) {
    const name = document.getElementById("term-name").value.trim();
    const begin = document.getElementById("term-begin").value;
    const end = document.getElementById("term-end").value;

    if (!name || !begin || !end) return;

    const fmt = d => d.split("-").reverse().join("-");
    await createTerm(name, fmt(begin), fmt(end));
    location.reload();
  }
});

/* ================= QUOTE ROTATION ================= */
/* ================= QUOTE ROTATION ================= */
const futureQuoteElement = () => document.querySelector(".future-term-quote");
setInterval(() => {
  const el = futureQuoteElement();
  if (!el) return;
  const randomQuote = futureTermQuotes[Math.floor(Math.random() * futureTermQuotes.length)];
  el.textContent = randomQuote;
}, 10000);

const weekendQuoteElement = () => document.querySelector(".weekend-quote");
setInterval(() => {
  const el = weekendQuoteElement();
  if (!el) return;
  const randomQuote = weekendQuotes[Math.floor(Math.random() * weekendQuotes.length)];
  el.textContent = randomQuote;
}, 10000);