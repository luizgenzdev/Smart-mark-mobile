/* ================= FAQ DATA ================= */
const smartMarkFAQs = [
  {
    id: 1,
    question: "What is Smart Mark?",
    answer:
      "Smart Mark is a school management app that helps track pupil performance, attendance, and academic results digitally."
  },
  {
    id: 2,
    question: "How do I log in?",
    answer:
      "Open the Smart Mark app, enter your registered email and password, then tap the Log In button."
  },
  {
    id: 3,
    question: "How do I sign up?",
    answer:
      "Tap the Sign Up option, fill in your details, and follow the instructions provided by your school or administrator."
  },
  {
    id: 4,
    question: "Why can’t I see data on some screens?",
    answer:
      "If some data is not showing, log out and log in again to refresh your session and sync the latest data."
  },
  {
    id: 6,
    question: "Can Smart Mark work without internet?",
    answer:
      "Yes. Smart Mark can show cached data when offline and will sync automatically when internet is available."
  },
  {
    id: 9,
    question: "Who can upload or edit results?",
    answer:
      "Only authorized teachers or school administrators are allowed to upload or edit results."
  },
  {
    id: 10,
    question: "What should I do if the app is slow?",
    answer:
      "Close other running apps, check your internet connection, or restart Smart Mark."
  },
  {
    id: 11,
    question: "Will I be logged out automatically?",
    answer:
      "Yes. For security reasons, Smart Mark may log you out when your session expires."
  },
  {
    id: 12,
    question: "Which devices support Smart Mark?",
    answer:
      "Smart Mark works on Android devices and web browsers."
  },
  {
    id: 13,
    question: "How do I contact support?",
    answer:
      "Use the Contact Support option in the app menu or contact your school administrator."
  }
];

/* ================= RENDER FAQ ================= */
const renderFaq = () => {
  return `
    <div class="pt-6 px-4 flex flex-col gap-4">
      <div class="intro flex justify-center">
        <h2 class="text-lg font-bold uppercase">
          Frequently Asked Questions
        </h2>
      </div>

      <div class="flex flex-col gap-4">
        ${smartMarkFAQs
          .map(
            faq => `
              <div class="w-full dark:bg-[#1f1f1f] shadow p-4 rounded flex flex-col justfiy-center">
                
                <button
                  class="faq-btn w-full flex justify-between items-center font-semibold text-left"
                  data-faq-id="${faq.id}"
                >
                  ${faq.question}
                  <i
                    id="icon-${faq.id}"
                    class="mdi-r text-xl transition-transform duration-300"
                  >
                    keyboard_arrow_down
                  </i>
                </button>

                <div
                  id="faq-${faq.id}" style="max-height: 0"
                  class="overflow-hidden transition-[max-height] duration-300"
                  aria-hidden="true"
                >
                  <p class="py-3 text-gray-600">
                    ${faq.answer}
                  </p>
                </div>

              </div>
            `
          )
          .join("")}
      </div>
    </div>
  `;
};

export default renderFaq;

/* ================= EVENT HANDLING ================= */
document.addEventListener("click", e => {
  const faqBtn = e.target.closest(".faq-btn");
  if (!faqBtn) return;

  const id = faqBtn.dataset.faqId;
  toggleFAQ(id);
});

/* ================= FAQ TOGGLE LOGIC ================= */
function toggleFAQ(id) {
  const panel = document.getElementById(`faq-${id}`);
  const icon = document.getElementById(`icon-${id}`);
  const isOpen = panel.getAttribute("aria-hidden") === "false";

  console.log(isOpen)
  // CLOSE ALL OTHER PANELS
  document.querySelectorAll('[id^="faq-"]').forEach(el => {
    if (el.id !== `faq-${id}`) {
      el.style.maxHeight = 0;
      el.setAttribute("aria-hidden", "true");
    }
  });

  // RESET ALL OTHER ICONS
  document.querySelectorAll('[id^="icon-"]').forEach(ic => {
    if (ic.id !== `icon-${id}`) {
      ic.classList.remove("rotate-180");
    }
  });

  // TOGGLE CURRENT PANEL
  if (isOpen) {
    // If currently open → close it
    panel.style.maxHeight = "0";
    panel.setAttribute("aria-hidden", "true");
    icon.style.transform = "rotate(0)";
  } else {
    // If currently closed → open it
  /*  panel.style.maxHeight = "0px";  // reset
    panel.offsetHeight;   */          // force repaint
    panel.style.maxHeight = panel.scrollHeight + "px"; // open
    panel.setAttribute("aria-hidden", "false");
    icon.style.transform = "rotate(180deg)";
  }
}