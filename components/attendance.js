import { loadAttendanceToday, saveAttendanceToday } from '../helpers/localMarking.js';

// helper to get today in dd-mm-yyyy
function getToday() {
  const d = new Date();
  return `${String(d.getDate()).padStart(2,'0')}-${String(d.getMonth()+1).padStart(2,'0')}-${d.getFullYear()}`;
}

// load pupils from localStorage
function loadPupils() {
  const pupilsJSON = localStorage.getItem('pupils');
  if (!pupilsJSON) return [];
  try {
    return JSON.parse(pupilsJSON);
  } catch (err) {
    console.error('Failed to parse pupils from localStorage', err);
    return [];
  }
}

// sanitize attendance: keep only pupils that exist in localStorage
function sanitizeAttendance(att) {
  const pupilsList = loadPupils();
  if (!att || !Array.isArray(att.data)) return { data: [], date: getToday() };

  const validIds = new Set(pupilsList.map(p => String(p.id)));
  att.data = att.data.filter(record => validIds.has(String(record.pupilId)));

  return att;
}

// mark single pupil
export const mark = async (pupilId, newStatus) => {
  let att = loadAttendanceToday();

  // sanitize before marking
  att = sanitizeAttendance(att);

  let pupilRecord = att.data.find(p => String(p.pupilId) === String(pupilId));

  if (pupilRecord) {
    pupilRecord.status = newStatus;
  } else {
    att.data.push({ pupilId, status: newStatus, isSync: false });
  }

  saveAttendanceToday(att);
 
  
};

// mark all pupils
export const markAll = async (newStatus) => {
  let att = loadAttendanceToday();
  const pupilsList = JSON.parse(localStorage.getItem('pupils'));

  // sanitize first
  att = sanitizeAttendance(att);

  pupilsList.forEach(pupil => {
    const pupilId = String(pupil.id);

    let pupilRecord = att.data.find(p => String(p.pupilId) === pupilId);
    
    if (pupilRecord) {
      pupilRecord.status = newStatus;
      pupilRecord.isSync = false;
    } else {
      let data = { pupilId, status: newStatus, isSync: false };
      att.data.push(data);
    }
  });

  saveAttendanceToday(att);
  
};