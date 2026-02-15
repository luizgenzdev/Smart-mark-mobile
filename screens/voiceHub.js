import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  deleteDoc,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { db } from "../firebase/db.js";
import { showToast } from "../helpers/toast.js";
import { usersViewCache } from '../services/voiceHubListener.js';
import { isOnline } from '../firebase/helpers.js';

/* ===================== VOICE HUB PROMPTS ===================== */
const voiceHubPrompts = [
  "💡 Got a cool idea for Smart Mark? Share it below!",
  "🚀 Your suggestion can make Smart Mark even better!",
  "✨ Drop your feature wish here – we’re all ears!",
  "📝 Have a thought? Let’s hear it!",
  "🔥 What should we build next? Tell us!",
  "🎯 Your idea = our next upgrade!",
  "🌟 Suggest a feature and be part of Smart Mark!",
  "😎 Don’t be shy – your input matters!",
  "💬 Speak your mind! What should we add?",
  "🎉 Got feedback? We’re ready to listen!",
  "📢 Voice your idea – we take action!",
  "🧠 Think smart? Think Smart Mark – share now!",
  "🎈 Drop any feature or tip that comes to mind!",
  "📌 Your suggestion could help everyone!",
  "✨ Make Smart Mark shine – suggest something!",
  "🚨 Alert: Your idea is wanted here!",
  "🎶 Sing your suggestion in words here 😉",
  "🌈 Ideas wanted: bright, bold, or fun!",
  "🛠️ Help us build something amazing – type away!",
  "🎤 Mic’s open – what’s your idea?"
];

/* ===================== RENDER VOICE HUB ===================== */
const renderVoiceHub = async () => {
  const profile = JSON.parse(localStorage.getItem("userProfile"));
  const randomPrompt = voiceHubPrompts[Math.floor(Math.random() * voiceHubPrompts.length)];

  const online = await isOnline();
  const views = online
    ? (usersViewCache || JSON.parse(localStorage.getItem("announcementsData")) || [])
    : (JSON.parse(localStorage.getItem("announcementsData")) || []);

  const recentHTML = views
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
    .map(view => {
      let sender = view.userId === profile?.uid ? "You" : view.userName || "Unknown";
      let schoolInfo = "";

      if (view.userId !== profile?.uid) {
        schoolInfo = view.schoolId === profile.schoolId ? "Same School" : view.schoolName || "Unknown School";
      }

      const showDelete = view.userId === profile?.uid
        ? `<button class="delete-btn size-6 bg-red-500 text-white rounded flex items-center justify-center text-lg mdi-o" data-doc-id="${view.id}">cancel</button>`
        : "";

      return `
        <div class="shadow p-4 rounded bg-white dark:bg-[#1f1f1f] text-sm flex justify-between items-start">
          <div>
            <strong>${sender}</strong> ${schoolInfo ? `<span class="text-gray-400 text-xs">(${schoolInfo})</span>` : ""}
            <div class="text-gray-600">${view.message}</div>
          </div>
          ${showDelete}
        </div>
      `;
    }).join("");

  return `
    <div class="pt-6 px-4 flex flex-col gap-4">
      <div class="intro flex justify-center">
        <h2 class="text-lg font-bold">VOICE HUB</h2>
      </div>

      <div class="w-full shadow p-4 rounded flex flex-col gap-3 dark:bg-[#1f1f1f]">
        <p class="text-sm">${randomPrompt}</p>

        <div class="flex gap-2 border border-gray-300 dark:border-[#121212] px-2 py-2 rounded">
          <i class="mdi-o text-md text-gray-400">record_voice_over</i>
          <input
            id="voice-hub-input"
            class="flex-1 text-sm bg-transparent focus:outline-none"
            placeholder="Type your idea here"
          />
        </div>

        <button
          id="submitVoiceHub"
          class="mt-2 bg-green-500 hover:bg-blue-600 active:bg-blue-400 text-white py-2 rounded flex items-center justify-center gap-2"
        >
          <i class="mdi-o text-sm">send</i>
          <span class="text-sm">Submit Idea</span>
        </button>
      </div>

      <p class="text-xs text-gray-500 dark:text-gray-400 text-center">
        Suggest features, report issues, give feedback, or share any ideas to help improve Smart Mark.
      </p>

      <div
        id="voice-hub-thankyou"
        class="hidden mt-4 p-4 rounded bg-green-500 text-white text-center text-sm shadow"
      >
        Thanks! Your idea has been sent 🚀
      </div>

      <div class="mt-6">
        <p class="text-xs text-gray-400 dark:text-gray-300">Recent submissions:</p>
        <div id="voice-hub-list" class="flex flex-col gap-2 mt-2">
          ${recentHTML}
        </div>
      </div>
    </div>
  `;
};

/* ===================== VOICE HUB LOGIC ===================== */
document.addEventListener("click", async (e) => {
  const target = e.target.closest("#submitVoiceHub, .delete-btn");

  if (!target) return;

  const profile = JSON.parse(localStorage.getItem("userProfile"));
  if (!profile?.uid || !profile?.schoolId) return showToast("User or school not found");

  // Handle Delete
  if (target.classList.contains("delete-btn")) {
    const docId = target.dataset.docId;
    if (!docId) return showToast("Cannot find message ID");
    
    try {
      const docRef = doc(db, "userViews", docId);
      await deleteDoc(docRef);
      target.closest("div").remove();
      showToast("Message deleted successfully", { color: 'green'});
    } catch (err) {
      console.error("Failed to delete message:", err);
      showToast("Failed to delete message.", { color: 'red'});
    }
    return;
  }

  // Handle submit
  const input = document.getElementById("voice-hub-input");
  const message = input.value.trim();
  if (!message) return showToast("Please type an idea 😅");

  // ---------- Instant UI feedback ----------
  const list = document.getElementById("voice-hub-list");
  const ideaEl = document.createElement("div");
  ideaEl.className = "shadow p-4 rounded bg-white dark:bg-[#1f1f1f] text-sm flex justify-between items-start";
  ideaEl.innerHTML = `<div><strong>You</strong> <div>${message}</div></div>`;
  list.prepend(ideaEl);

  input.value = "";

  const thankYou = document.getElementById("voice-hub-thankyou");
  thankYou.classList.remove("hidden");
  setTimeout(() => thankYou.classList.add("hidden"), 3000);

  /* ---------- Firestore write ---------- */
  try {
    
    const usersViewRef = collection(db, "userViews");
    
    const docRef = await addDoc(usersViewRef, {
      type: "voiceHub",
      message,
      userId: profile.uid,
      userName: profile.name || "Unknown",
      role: profile.role || "user",
      schoolId: profile.schoolId,
      schoolName: profile.schoolName || "Unknown School",
      createdAt: serverTimestamp()
    });

    // Attach Firestore docId to element for deletion
    ideaEl.querySelector("div").insertAdjacentHTML("afterend", `<button class="delete-btn ml-2 text-red-500 text-xs font-bold" data-doc-id="${docRef.id}">Delete</button>`);

  } catch (err) {
    console.error("Voice Hub submit failed:", err);
    showToast("Failed to send idea. Try again.");
  }
});

export default renderVoiceHub;