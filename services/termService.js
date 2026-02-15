import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteField,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getToday, getMonthName,parseDDMMYYYY, compareDates } from "../helpers/helpers.js";

import { db } from "../firebase/db.js";
import { showToast } from "../helpers/toast.js";

const syncKey = `isAllSync_${getToday()}`;
const isAllSync = localStorage.getItem(syncKey) === "true";






/* ---------------- GET ACTIVE TERM FROM FIREBASE ---------------- */
export async function getActiveTerm(profile) {
  // ---------- SAFETY ----------
  if (!profile?.schoolId) {
    showToast("Teacher profile missing schoolId");
    return null;
  }

  /* =====================================================
     1️⃣ TRY LOCAL CACHE FIRST
  ===================================================== */
  const cachedTerm = localStorage.getItem("activeTerm");
  const cachedTermData = localStorage.getItem("termData");
  let parse = JSON.parse(cachedTermData);
  
  if ((cachedTerm && cachedTermData) && cachedTerm == parse.termName) {
    const termData = JSON.parse(cachedTermData);
    const checkTerm = compareDates(termData.end, getToday());
    // ---------- TERM EXPIRED ----------
    if (checkTerm) {
      showToast("Term ended......");
      deactivateTerm();
      localStorage.removeItem("activeTerm");
      localStorage.removeItem("termData");
      localStorage.removeItem("att_today");
      localStorage.removeItem(syncKey)
      localStorage.removeItem("att_month");

      return null;
    }
      return cachedTerm;
  }

  /* =====================================================
     2️⃣ ONLINE → FETCH FROM FIREBASE
  ===================================================== */
  try {
    
    const activeTermRef = doc(
      db,
      "schools",
      profile.schoolId,
      "config",
      "activeTerm"
    );

    const snap = await getDoc(activeTermRef);
    if (!snap.exists()) return null;

    const { activeTerm } = snap.data();
    
    
    const termRef = doc(
      db,
      "schools",
      profile.schoolId,
      "terms",
      activeTerm
    );

    const termSnap = await getDoc(termRef);
    if (!termSnap.exists()) return null;

    const termData = termSnap.data();
    const checkTerm = compareDates(termData.end, getToday());
    
    // ---------- TERM EXPIRED ----------
    if (checkTerm) {
      showToast("Term ended 2222");
      await deactivateTerm();
      localStorage.removeItem("activeTerm");
      localStorage.removeItem("termData");
      localStorage.removeItem("att_today");
      localStorage.removeItem(syncKey)
      localStorage.removeItem("att_month");

      return null;
    }

    // ---------- SAVE TO LOCAL ----------
    localStorage.setItem("activeTerm", activeTerm);
    localStorage.setItem("termData", JSON.stringify(termData));
    return activeTerm;

  } catch (err) {
    console.warn("Firestore unavailable, falling back to cache", err);

    /* =====================================================
       3️⃣ FALLBACK TO LOCAL
    ===================================================== */
    let parsed = JSON.parse(cachedTermData);
    
    if ((cachedTerm && cachedTermData) && cachedTerm == parsed.termName) {
      const termData = JSON.parse(cachedTermData);

      if (termData.end < getToday()) {
        showToast("Term ended");

        localStorage.removeItem("activeTerm");
        localStorage.removeItem("termData");
      localStorage.removeItem("att_today");
      localStorage.removeItem(syncKey)
      localStorage.removeItem("att_month");
        return null;
      }

      return cachedTerm;
    }

    return null;
  }
}

/* ---------------- CREATE TERM ---------------- */

export async function createTerm(termName, begin, end) {
  try {
    const profile = JSON.parse(localStorage.getItem("userProfile"));
    if (!profile?.schoolId || !profile?.classId) {
      showToast("Teacher profile missing schoolId or classId");
      return;
    }
    
    // ----------------- 1️⃣ School-level activeTerm -----------------
    const activeTermRef = doc(db, "schools", profile.schoolId, "config", "activeTerm");
    const snap = await getDoc(activeTermRef);
    
    if (!snap.exists()) {
      await setDoc(activeTermRef, { activeTerm: null });
    } else if (snap.data().activeTerm) {
      showToast("A term is already active");
      return;
    }
    
    // ----------------- 4️⃣ School-level term registry -----------------
    await setDoc(
      doc(db, "schools", profile.schoolId, "terms", termName),
      { termName, begin, end }
    );

    // ----------------- 5️⃣ Activate term -----------------
    alert(5)
    await updateDoc(activeTermRef, { activeTerm: termName });
    localStorage.removeItem(syncKey);
    localStorage.setItem("activeTerm", termName);
    showToast(`Term "${termName}" created & activated`);

  } catch (err) {
    console.error("createTerm error:", err);
    showToast("Failed to create term");
  }
}
/* ---------------- DEACTIVATE TERM ---------------- */

export async function deactivateTerm() {
  try {
    const profile = JSON.parse(localStorage.getItem("userProfile"));

    if (!profile?.schoolId) {
      showToast("Teacher profile missing schoolId");
      return;
    }
     localStorage.removeItem(syncKey);
    const activeTermRef = doc(
      db,
      "schools",
      profile.schoolId,
      "config",
      "activeTerm"
    );

    // remove activeTerm completely
    await updateDoc(activeTermRef, {
      activeTerm: deleteField()
    });

    // clear local cache
    localStorage.removeItem("activeTerm");
    localStorage.removeItem("termData");
    localStorage.removeItem("att_today");
      localStorage.removeItem("att_today");
      localStorage.removeItem(syncKey)
      localStorage.removeItem("att_month");
    showToast("Active term deactivated");
    location.reload();
    
  } catch (err) {
    console.error("deactivateTerm error:", err);
    showToast("❌ Failed to deactivate term");
  }
}