import {
  doc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  collection
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import {
  loadAttendanceToday,
  loadAttendanceMonth,
  saveAttendanceToday,
  saveAttendanceMonth
} from "../helpers/localMarking.js";
import { getToday, restrictPupilChanges,compareDates } from "../helpers/helpers.js";
import { showToast } from "../helpers/toast.js";
import { db } from "./db.js";
import { pupilsCache } from "../components/pupils.js";

const currentMonth = new Date().getMonth();
export const dueDate = currentMonth >= 0 && currentMonth <= 3;



const today = getToday();
const syncKey = `isAllSync_${today}`;

/* ---------------- GET TEACHER PROFILE ---------------- */
// Teachers are stored under schools -> classes -> teachers
export const getTeacherProfile = async (uid) => {
  try {
    const globalRef = doc(db, "users", uid);
    const snap = await getDoc(globalRef);

    if (!snap.exists()) throw new Error("Teacher profile not found");
    return snap.data(); // contains name, email, schoolId, classId, signupCode, etc.
  } catch (error) {
    console.error("Error fetching teacher profile:", error);
    localStorage.removeItem("userProfile");
    return null;
  }
};

export async function isOnline(timeout = 4000) {
  
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    await fetch("https://www.googleapis.com/generate_204", {
      method: "GET",
      cache: "no-store",
      signal: controller.signal
    });
    
    console.log("Network avaibel");
    clearTimeout(id);
    return true;
  } catch {
    console.log("Network unavailable");
    return false;
  }
}

const i = await isOnline();

function autoCheckPayment(due) {
  if (!due) return;
   
  return overDue;
}

// Teachers are stored under schools -> classes -> teachers
export const checkAccess = async (profile) => {

  try {
    const globalRef = doc(db, "schools", profile.schoolId);
    const snap = await getDoc(globalRef);

    if (!snap.exists()) throw new Error("School not found");
    localStorage.setItem("isDeactivated", String(snap.data().isDeactivated));
    const data = snap.data();
    const parsed = new Date().toISOString().split("T")[0];
    const today = parsed.split("-").reverse().join("-");
    const dueDate = data.paymentDue.split("-").reverse().join("-");
    const overdue = compareDates(dueDate, today);
    return overdue; 
  } catch (error) {
    return null;
  }
};

/* ---------------- UPDATE PUPIL NAME ---------------- */
export async function updatePupilName(pupilId, newName) {
  const profile = JSON.parse(localStorage.getItem("userProfile"));

  try {
    if (!profile?.schoolId || !profile?.classId) {
      throw new Error("Missing teacher profile with school/class info");
    }
    const isDeactivated = localStorage.getItem("isDeactivated") === "true";
  
    
  
  if (isDeactivated) {
        showToast("School Inactive.Pay to continue");
    return;
  }
    if(!dueDate){
      restrictPupilChanges("edit");
      return;
    }
    
    const isListen = localStorage.getItem("pupilListen") === "true";
    if (!isListen) {
      showToast("Restart listener first", { color: "red", icon: "cancel" });
      return;
    }
    
    if(await !isOnline()){
      showToast(`Cannot update pupil when offline`, {color: "red", icon: "cancel"});
      return;
    }
    const pupilRef = doc(
      db,
      "schools",
      profile.schoolId,
      "classes",
      profile.classId,
      "pupils",
      pupilId
    );

    // Update name in Firestore
    await updateDoc(pupilRef, { name: newName });
    
    showToast(`Pupil updated to ${newName}`);
  } catch (error) {
    console.error("Error updating pupil name:", error);
  }
}

/* ---------------- DELETE PUPIL ---------------- */
export async function deletePupil(pupilId) {
  
const isAllSync = localStorage.getItem(syncKey) === "true";
  const profile = JSON.parse(localStorage.getItem("userProfile"));
  try {
    if (!profile?.schoolId || !profile?.classId) {
      throw new Error("Missing teacher profile with school/class info");
    }
    const isDeactivated = localStorage.getItem("isDeactivated") === "true";
  
    
  
  if (isDeactivated) {
        showToast("School Inactive.Pay to continue");
    return;
  }
    
    if(!dueDate){
      restrictPupilChanges("delete");
      return;
    }
    
    
    let isOnlineState = await isOnline();
    
    
    if(isAllSync || !isOnlineState){
      showToast("Cannot delete pupil when data is submited or offline", {color: "red", icon: "cancel"});
      return;
    }
    const isListen = localStorage.getItem("pupilListen");

    if (!isListen) {
      showToast("Restart listener first", { color: "red", icon: "cancel" });
      return;
    }
    
    const pupilRef = doc(
      db,
      "schools",
      profile.schoolId,
      "classes",
      profile.classId,
      "pupils",
      pupilId
    );

    await deleteDoc(pupilRef);
    
    showToast("Pupil deleted");
  } catch (error) {
    console.error("Error deleting pupil:", error);
  }
}

/* ---------------- GET SCHOOL CLASSES ---------------- */
export const getSchoolClasses = async (schoolId) => {
  try {
    // First, check if the school exists and is active (optional but good practice)
    const schoolRef = doc(db, "schools", schoolId);
    const schoolDoc = await getDoc(schoolRef);
    
    if (!schoolDoc.exists()) {
      console.error("School does not exist");
      return [];
    }
    
    
    // Get classes
    const classesRef = collection(db, "schools", schoolId, "classes");
    const snap = await getDocs(classesRef);

    return snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error fetching classes:", error);
    // Check for specific permission errors
    if (error.code === 'permission-denied') {
      console.error("Permission denied. Check if:");
      console.error("1. User is authenticated");
      console.error("2. School is active (isDeactivated == false)");
      console.error("3. School exists in database");
    }
    return [];
  }
};


