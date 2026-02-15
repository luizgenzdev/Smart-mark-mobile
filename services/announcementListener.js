import {
  collection,
  query,
  orderBy,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { db } from "../firebase/db.js";
import { showToast } from "../helpers/toast.js";
import renderMainApp from "../main.js";
import { isOnline } from '../firebase/helpers.js';

// Cache key in localStorage
const ANNOUNCEMENTS_CACHE_KEY = "announcementsCache";

// Cache for announcements (in-memory)
export let announcementsCache = [];

/* ---------------- LOAD FROM CACHE ---------------- */
function loadFromCache() {
  try {
    const cached = localStorage.getItem(ANNOUNCEMENTS_CACHE_KEY);
    if (cached) {
      announcementsCache = JSON.parse(cached);
      const profile = JSON.parse(localStorage.getItem("userProfile"));
      renderMainApp(profile);
    }
  } catch (err) {
    console.error("Failed to load announcements from cache:", err);
  }
}

/* ---------------- SAVE TO CACHE ---------------- */
function saveToCache() {
  try {
    localStorage.setItem(ANNOUNCEMENTS_CACHE_KEY, JSON.stringify(announcementsCache));
  } catch (err) {
    console.error("Failed to save announcements to cache:", err);
  }
}

/* ---------------- REAL-TIME LISTENER FOR ANNOUNCEMENTS ---------------- */
export async function listenToAnnouncements() {
  const profile = JSON.parse(localStorage.getItem("userProfile"));
  if (!profile?.schoolId) {
    console.error("Teacher profile missing schoolId");
    loadFromCache();
    return null;
  }

  // Load cache immediately for offline fallback
  loadFromCache();
  const online = await isOnline();
  if(!online) return;
  
  const announcementsRef = collection(db, "announcements");
  const announcementsQuery = query(announcementsRef, orderBy("createdAt", "desc"));

  const unsubscribe = onSnapshot(
    announcementsQuery,
    (snap) => {
      if (snap.empty) {
        announcementsCache = [];
        saveToCache();
        renderMainApp(profile);
        return;
      }

      // Update cache from Firebase
      announcementsCache = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      saveToCache();

      // Optional: Notify new announcement if not seen
      const lastNotified = localStorage.getItem("lastAnnouncementNotifiedAt");
      const newest = announcementsCache[0];
      if (newest?.createdAt && newest.createdAt.toMillis) {
        const newestTime = newest.createdAt.toMillis();
        if (!lastNotified || newestTime > Number(lastNotified)) {
          showToast(`New Announcement: ${newest.title || newest.msg}`);
          localStorage.setItem("lastAnnouncementNotifiedAt", String(newestTime));
        }
      }

      renderMainApp(profile);
    },
    (err) => {
      console.warn("Failed to get live announcements, using cache:", err);
      loadFromCache();
    }
  );

  return unsubscribe;
}