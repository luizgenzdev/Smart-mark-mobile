/* ================= ANNOUNCEMENTS DATA ================= */  
import { announcementsCache } from '../services/announcementListener.js';
import { isOnline } from '../firebase/helpers.js';

/* ================= RENDER ANNOUNCEMENTS ================= */
const renderAnnouncements = async () => {
  const online =  await isOnline();
  let announcements = online ? (announcementsCache || JSON.parse(localStorage.getItem("announcementsData"))) : JSON.parse(localStorage.getItem("announcementsData"));
 
  return `
    <div class="pt-6 px-4 flex flex-col gap-4">

      <!-- Title -->
      <div class="flex justify-center">
        <h2 class="text-lg font-bold uppercase dark:text-gray-200">
          Announcements
        </h2>
      </div>

      <div class="flex flex-col gap-3">
        ${announcements.map(item => {
          const wordCount = item.msg.trim().split(/\s+/).length;
          const hasMore = wordCount > 20;

          return `
          <div class="announcement-card bg-white dark:bg-[#1f1f1f] shadow p-4 rounded">

            <!-- Header (clickable only if expandable) -->
            <button
              class="announcement-btn w-full flex justify-between items-start gap-3 text-left"
              data-ann-id="${item.id}"
              ${!hasMore ? "disabled" : ""}
            >
              <div class="flex-1 min-w-0">
                <p class="font-semibold text-sm text-gray-800 dark:text-gray-100">
                  ${item.from}
                </p>

                <p
                  class="announcement-message text-sm text-gray-600 dark:text-gray-400
                         overflow-hidden transition-[max-height] duration-300 ease-in-out"
                  style="max-height: 2rem"
                  data-open="false"
                >
                  ${item.msg}
                </p>
              </div>

              <div class="text-right text-xs text-gray-500 flex flex-col items-end">
                <p>${item.time}</p>
                <p>${item.date}</p>

                ${
                  hasMore
                    ? `<i id="ann-icon-${item.id}" class="mdi-r transition-transform duration-300">
                        keyboard_arrow_down
                      </i>`
                    : ``
                }
              </div>
            </button>

          </div>
          `;
        }).join("")}
      </div>
    </div>
  `;
};

export default renderAnnouncements;

/* ================= EVENT HANDLING ================= */
document.addEventListener("click", e => {
  const btn = e.target.closest(".announcement-btn");
  if (!btn || btn.disabled) return;

  toggleAnnouncement(btn.dataset.annId);
});

/* ================= TOGGLE LOGIC (ONE OPEN AT A TIME) ================= */
function toggleAnnouncement(id) {
  const currentBtn = document.querySelector(`[data-ann-id="${id}"]`);
  const currentMsg = currentBtn.querySelector(".announcement-message");
  const currentIcon = document.getElementById(`ann-icon-${id}`);
  const isOpen = currentMsg.dataset.open === "true";

  // Collapse ALL
  document.querySelectorAll(".announcement-message").forEach(msg => {
    if (!msg.dataset.originalText) {
      msg.dataset.originalText = msg.innerText.trim();
    }

    const words = msg.dataset.originalText.split(/\s+/);
    const needsEllipsis = words.length > 20;

    msg.style.maxHeight = "2rem";
    msg.dataset.open = "false";

    
  });

  // Reset icons
  document.querySelectorAll(".mdi-r").forEach(icon => {
    icon.style.transform = "rotate(0deg)";
  });

  // Expand selected
  if (!isOpen) {
    currentMsg.innerText = currentMsg.dataset.originalText;
    currentMsg.style.maxHeight = currentMsg.scrollHeight + "px";
    currentMsg.dataset.open = "true";

    if (currentIcon) {
      currentIcon.style.transform = "rotate(180deg)";
    }
  }
}