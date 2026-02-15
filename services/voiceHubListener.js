import {
  collection,
  query,
  orderBy,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { db } from "../firebase/db.js";
import renderMainApp from "../main.js";
import { isOnline } from "../firebase/helpers.js";

/* ================= CACHE SETUP ================= */
const USERS_VIEW_CACHE_KEY = "usersViewCache";

// in-memory cache
export let usersViewCache = [];

/* ================= LOAD FROM CACHE ================= */
function loadUsersViewFromCache() {
  try {
    const cached = localStorage.getItem(USERS_VIEW_CACHE_KEY);
    if (cached) {
      usersViewCache = JSON.parse(cached);
      const profile = JSON.parse(localStorage.getItem("userProfile"));
      renderMainApp(profile);
    }
  } catch (err) {
    console.error("Failed to load usersView from cache:", err);
  }
}

/* ================= SAVE TO CACHE ================= */
function saveUsersViewToCache() {
  try {
    localStorage.setItem(
      USERS_VIEW_CACHE_KEY,
      JSON.stringify(usersViewCache)
    );
  } catch (err) {
    console.error("Failed to save usersView cache:", err);
  }
}

/* ================= REAL-TIME USERS VIEW LISTENER ================= */
export async function listenToUsersView() {
  const profile = JSON.parse(localStorage.getItem("userProfile"));

  if (!profile?.schoolId) {
    console.error("Profile missing schoolId");
    loadUsersViewFromCache();
    return null;
  }

  // Always load cached data first (offline-first)
  loadUsersViewFromCache();
console.log("Lis usrs")
  const online = await isOnline();
  if (!online) return null;

  const usersViewRef = collection(
    db,
    "userViews"
  );

  const usersViewQuery = query(
    usersViewRef,
    orderBy("createdAt", "desc")
  );

  const unsubscribe = onSnapshot(
    usersViewQuery,
    (snap) => {
      
      if (snap.empty) {
        usersViewCache = [];
        saveUsersViewToCache();
        renderMainApp(profile);
        return;
      }

      usersViewCache = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      saveUsersViewToCache();
      renderMainApp(profile);
    },
    (err) => {
      console.warn(
        "Failed to get live usersView, falling back to cache:",
        err
      );
      loadUsersViewFromCache();
    }
  );
  
  console.log('worked')

  return unsubscribe;
}
