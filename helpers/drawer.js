// drawer.js
let drawer = document.getElementById('drawer');
let menuBtn = document.getElementById('menuBtn');
let showAddBox = document.getElementById('showBox');
let closeAddBox = document.getElementById('closeBox');
let addBox = document.querySelector('.wrapper');

import { showToast } from "./toast.js";
import { getToday } from "./helpers.js";
import { restartPupilListen } from '../components/pupils.js';

const syncKey = `isAllSync_${getToday()}`;
let startX = 0;
let endX = 0;
let isAddBoxOpen = false;

// ---------------- Drawer Open/Close ----------------
export function openDrawer() {
  drawer.classList.add("left-0");
  drawer.classList.remove("left-[-100%]");
}

export function closeDrawer() {
  drawer.classList.remove("left-0");
  drawer.classList.add("left-[-100%]");
}

menuBtn?.addEventListener('click', () => {
  drawer.classList.contains("left-[-100%]") ? openDrawer() : closeDrawer();
});

document.addEventListener("touchstart", (e) => startX = e.touches[0].clientX);
document.addEventListener("touchend", (e) => {
  endX = e.changedTouches[0].clientX;
  handleSwipe();
});

function handleSwipe() {
  const diff = endX - startX;
  if (diff > 60 && drawer.classList.contains("left-[-100%]")) openDrawer();
  if (diff < -60 && drawer.classList.contains("left-0")) closeDrawer();
}

// ---------------- Add Pupil Box ----------------
export function toggleAddPupilBox() {
  isAddBoxOpen = !isAddBoxOpen;
  addBox.classList.toggle('hidden');
  addBox.classList.toggle('flex');
}

showAddBox?.addEventListener('click', toggleAddPupilBox);
closeAddBox?.addEventListener('click', toggleAddPupilBox);

// ---------------- Theme Toggle ----------------
const toggleThemeBtn = document.getElementById('toggleTheme');
toggleThemeBtn?.addEventListener('click', () => {
  document.body.classList.toggle('dark');
  localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
});

if (localStorage.getItem('theme') === 'dark') document.body.classList.add('dark');

// ---------------- Drawer User Header ----------------
export function updateDrawer(userProfile, renderMainApp) {
  if (!userProfile) return;

  const drawerName = document.getElementById("drawerName");
  const drawerEmail = document.getElementById("drawerEmail");
  const drawerAvatar = document.getElementById("drawerAvatar");
  const drawerSchool = document.getElementById("drawerSchool");
  const drawerClass = document.getElementById("drawerClass");

  drawerName.textContent = userProfile.name || "User Name";
  drawerEmail.textContent = userProfile.email || "user@email.com";
  drawerAvatar.src = userProfile.avatarUrl || "assets/logo.webp";
  drawerSchool.textContent = `School: ${userProfile.schoolName || userProfile.schoolId || "---"}`;
  drawerClass.textContent = `Class: ${userProfile.classId || "---"}`;

  // ---------------- Logout Button ----------------
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.onclick = async () => {
      
      const { isOnline } = await import('../firebase/helpers.js');
      if (await !isOnline()) {
        showToast("Sorry, you are offline", {color: "red", icon: "offline_bolt"});
        return;
      }

      const { logout } = await import('../services/authService.js');

      // Clear all local storage
      localStorage.removeItem("userProfile");
      localStorage.removeItem("activeTerm");
      localStorage.removeItem("isDeactivated");
      localStorage.removeItem("termData");
      localStorage.removeItem("att_today");
      localStorage.removeItem("pupils");
      localStorage.removeItem(syncKey);
      localStorage.removeItem("att_month");
      localStorage.removeItem("listener");
      await logout();
      showToast("User logged out successfully");
      // Hide UI elements
      const footer = document.querySelector(".footer");
      const header = document.querySelector(".header");
      const sideBar = document.getElementById("drawer");
      [footer, header, sideBar].forEach(el => el?.classList.add("hidden"));

      // Switch SPA to auth screen
      if (renderMainApp) {
        window.currentScreen = "auth";
        await renderMainApp();
      }
    };
  }

  // ---------------- Refresh Listener ----------------
  const restartBtn = document.getElementById("refresh");
  if (restartBtn) {
    restartBtn.addEventListener("click", async () => {
      const profile = JSON.parse(localStorage.getItem("userProfile"));
      if (profile?.schoolId && profile?.classId) {
        await restartPupilListen(profile);
      }
    });
  }
}
