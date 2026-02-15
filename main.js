let renderMainApp = null;
let currentScreen = "auth";
let currentProfile = null;
let unsubscribeAttendance = null;
let unsubscribePupil = null;
let unsubscribeAnnouncements = null;
let unsubscribeUsersView = null;

/* ===================== SCREEN TRACKER ===================== */
window.__activeScreen = () => currentScreen;
/* ========================================================== */

/* ===================== UI HELPERS ===================== */
function getGlobalUI() {
  return {
    diaBtn: document.querySelector("#showBox"),
    footer: document.querySelector(".footer"),
    header: document.querySelector(".header"),
    sideBar: document.querySelector("#drawer"),
  };
}

function hideGlobalUI() {
  const { diaBtn, footer, header, sideBar } = getGlobalUI();
  [diaBtn, footer, header, sideBar].forEach(el => el?.classList.add("hidden"));
}

function showGlobalUI() {
  const { diaBtn, footer, header, sideBar } = getGlobalUI();
  [diaBtn, footer, header, sideBar].forEach(el => el?.classList.remove("hidden"));
}
/* ========================================================== */

async function startApp() {
  try {
    const { renderOnboarding } = await import("./screens/onboarding.js");
    const seen = localStorage.getItem("onboardingSeen");

    if (!seen) {
      hideGlobalUI();
      renderOnboarding(() => {
        localStorage.setItem("onboardingSeen", "true");
        startAuth();
      });
      return;
    }

    startAuth();
  } catch (e) {
    console.error("startApp error:", e);
  }
}

async function startAuth() {
  try {
    const { auth, onAuthStateChanged } = await import("./firebase/auth.js");
    const { getToday } = await import("./helpers/helpers.js");

    const { isOnline } = await import("./firebase/helpers.js");
    
    const { stopPupilListen, startPupilListen } = await import("./components/pupils.js");
    const { listenToAttendance } = await import("./services/attendanceListener.js");
    const { listenToAnnouncements } = await import("./services/announcementListener.js");
    const { listenToUsersView } = await import("./services/voiceHubListener.js");
    const { updateDrawer, closeDrawer } = await import("./helpers/drawer.js");
    const { logout } = await import("./services/authService.js");
    const body = document.getElementById("body");

    onAuthStateChanged(auth, async user => {
      if (!body) return;

      /* ===================== NO USER ===================== */
      if (!user) {
        currentScreen = "auth";
        body.classList.remove("pt-16");

        const syncKey = `isAllSync_${getToday()}`;
        [
          "userProfile",
          "listener",
          "activeTerm",
          "termData",
          "att_today",
          "att_month",
          "pupils",
          syncKey,
        ].forEach(k => localStorage.removeItem(k));

        const { default: renderAuth } = await import("./screens/auth.js");
        body.innerHTML = await renderAuth();
        hideGlobalUI();
        return;
      }

      /* ===================== LOAD PROFILE ===================== */
      async function getCachedProfile(uid) {
        const cached = localStorage.getItem("userProfile");
        const { getTeacherProfile, checkAccess } = await import("./firebase/helpers.js");

        if (cached) {
          const parsed = JSON.parse(cached);
          const isDeactivated =
            (await checkAccess(parsed)) ||
            localStorage.getItem("isDeactivated") === "true";
          localStorage.setItem("isDeactivated", String(isDeactivated));
          return parsed;
        }

        let profile = null;
        for (let i = 0; i < 6 && !profile; i++) {
          profile = await getTeacherProfile(uid);
          if (!profile) await new Promise(r => setTimeout(r, 500));
        }

        if (!profile) return null;

        localStorage.setItem("userProfile", JSON.stringify(profile));
        const isDeactivated = await checkAccess(profile);
        localStorage.setItem("isDeactivated", String(isDeactivated));

        return profile;
      }

      currentProfile = await getCachedProfile(user.uid);

      /* ===================== PROFILE GUARD ===================== */
      if (!currentProfile) {
        const { default: renderAuth } = await import("./screens/auth.js");
        await logout();
        currentScreen = "auth";
        body.innerHTML = await renderAuth();
        hideGlobalUI();
        return;
      }

      /* ===================== SKIP ONBOARDING FOR SIGNUP ===================== */
      if (currentProfile.isFromSignup === true) {
        currentProfile.isFromSignup = false;
        localStorage.setItem("userProfile", JSON.stringify(currentProfile));

        const { updateDoc, doc } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");
        const { db } = await import("./firebase/db.js");
        const { default: renderAuth } = await import("./screens/auth.js");

        await Promise.all([
          updateDoc(doc(db, "users", currentProfile.uid), { isFromSignup: false }),
          updateDoc(doc(db, "schools", currentProfile.schoolId, "users", currentProfile.uid), { isFromSignup: false }),
        ]);

        await logout();
        currentScreen = "auth";
        body.innerHTML = await renderAuth();
        hideGlobalUI();
        return;
      }

      currentScreen = "dashboard";
      body.classList.add("pt-16");

      /* ===================== LOAD SCREENS ===================== */
      const [
        { default: renderDashboard },
        { default: renderReports },
        { default: renderAbout },
        { default: renderSupport },
        { default: renderAuth },
        { default: renderFaq },
        { default: renderVoiceHub },
        { default: renderAnnouncements },
      { default: renderPupils },
      ] = await Promise.all([
        import("./screens/dashboard.js"),
        import("./screens/report.js"),
        import("./screens/about.js"),
        import("./screens/support.js"),
        import("./screens/auth.js"),
        import("./screens/faq.js"),
        import("./screens/voiceHub.js"),
        import("./screens/announcements.js"),
        import("./screens/pupils.js"),
      ]);

      /* ===================== RENDER APP ===================== */
      renderMainApp = async () => {
        let html = "";

        switch (currentScreen) {
          case "auth":
            hideGlobalUI();
            html = await renderAuth();
            break;

          case "dashboard":
            showGlobalUI();
            html = await renderDashboard(currentProfile);
            break;

          case "reports":
            showGlobalUI();
            document.querySelector("#showBox")?.classList.add("hidden");
            html = await renderReports();
            break;

          case "pupils":
            showGlobalUI();
            html = await renderPupils(currentProfile);
            break;

          case "faq":
            showGlobalUI();
            html = await renderFaq();
            break;

          case "voiceHub":
            showGlobalUI();
            html = await renderVoiceHub();
            break;

          case "announcements":
            showGlobalUI();
            html = await renderAnnouncements();
            break;

          case "about":
            showGlobalUI();
            document.querySelector("#showBox")?.classList.add("hidden");
            document.querySelector(".footer")?.classList.add("hidden");
            html = await renderAbout();
            break;

          case "support":
            showGlobalUI();
            document.querySelector("#showBox")?.classList.add("hidden");
            document.querySelector(".footer")?.classList.add("hidden");
            html = await renderSupport();
            break;
        }

        if (typeof html === "string") {
          body.innerHTML = html;
          updateDrawer(currentProfile);
        }
      };

      await renderMainApp();

      /* ===================== LISTENERS ===================== */
      const today = getToday();
      const syncKey = `isAllSync_${today}`;
      const isAllSync = localStorage.getItem(syncKey) === "true";
      const isDeactivated = localStorage.getItem("isDeactivated") === "true";

      if (!isDeactivated) {
        unsubscribePupil = await startPupilListen(currentProfile);
        unsubscribeAnnouncements = await listenToAnnouncements(currentProfile);
        unsubscribeUsersView = await listenToUsersView(currentProfile);
      }

      const online = await isOnline();

      if (online && !isAllSync && !isDeactivated) {
        unsubscribeAttendance = await listenToAttendance(currentProfile);
      }

      window.addEventListener("offline", () => {
        stopPupilListen();
        unsubscribeAnnouncements?.();
        listenToUsersView?.();
        unsubscribeAttendance?.();
        unsubscribeAttendance = null;
        unsubscribePupil = null;
        unsubscribeAnnouncements = null;
        listenToUsersView = null;
      });

      window.addEventListener("online", async () => {
        if (!isDeactivated) {
          unsubscribeAnnouncements = await listenToAnnouncements(currentProfile);
        unsubscribeUsersView = await listenToUsersView(currentProfile);
          unsubscribePupil = await startPupilListen(currentProfile);
        }
        if (!isAllSync && !isDeactivated) {
          unsubscribeAttendance = await listenToAttendance(currentProfile);
        }
      });

      /* ===================== NAVIGATION ===================== */
      document.addEventListener("click", async e => {
        const item = e.target.closest(".drawer-menu li[data-screen]");
        if (!item) return;

        currentScreen = item.dataset.screen;
        document.querySelectorAll(".drawer-menu li[data-screen]")
          .forEach(li => li.classList.remove("text-red-500"));

        item.classList.add("text-red-500");

        await renderMainApp();
        closeDrawer();
      });
    });
  } catch (e) {
    console.error("startAuth error:", e);
  }
}

document.addEventListener("DOMContentLoaded", startApp);

/* ===================== EXPORT ===================== */
export default function exportedRenderMainApp() {
  return renderMainApp?.();
}