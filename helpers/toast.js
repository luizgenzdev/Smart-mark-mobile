export function showToast(message, options = {}) {
  // Remove existing toast
  const oldToast = document.getElementById("attendance-toast");
  if (oldToast) oldToast.remove();

  const {
    color = "default",
    icon = "check_circle"
  } = options;

  const colorClasses = {
    green: "bg-green-500 text-white",
    red: "bg-red-500 text-white",
    yellow: "bg-yellow-500 text-black",
    blue: "bg-blue-500 text-white",
    orange: "bg-orange-500 text-white",
    default: "bg-white text-black"
  };

  const toast = document.createElement("div");
  toast.id = "attendance-toast";

  toast.className = `
    fixed top-12 left-0 right-0
    z-[9999]
    px-2
    flex justify-center
    pointer-events-none
  `;

  toast.innerHTML = `
    <div class="
      flex items-center ga
      px-4 py-2 rounded-full shadow-lg
      overflow-hidden
      ${colorClasses[color]}
    ">
      <!-- ICON -->
      <span
        id="toast-icon"
        class="mdi-o ml-2 text-base transform translate-x-0 transition-transform duration-300"
      >
        ${icon}
      </span>

      <!-- MESSAGE -->
      <span
        id="toast-message"
        class="text-xs whitespace-nowrap
               opacity-0 translate-x-4
               transition-all duration-300"
      >
        ${message}
      </span>
    </div>
  `;

  document.body.appendChild(toast);

  const iconEl = document.getElementById("toast-icon");
  const msgEl = document.getElementById("toast-message");

  // Step 1: show icon only
  requestAnimationFrame(() => {
    iconEl.classList.add("-translate-x-1");
  });

  // Step 2: slide in message
  setTimeout(() => {
    msgEl.classList.remove("opacity-0", "translate-x-4");
    iconEl.classList.add("-translate-x-2");
  }, 250);

  // Auto hide
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transition = "opacity 300ms";
    setTimeout(() => toast.remove(), 300);
  }, 2200);
}