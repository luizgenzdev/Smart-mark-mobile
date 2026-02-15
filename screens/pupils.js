import { pupilsCache } from "../components/pupils.js";
import { updatePupilName, deletePupil } from "../firebase/helpers.js";
import { showToast } from "../helpers/toast.js";
let count = 0;
/* ===================== RENDER ===================== */
const renderPupils = () => {
  const profile = JSON.parse(localStorage.getItem("userProfile"));
  if (!profile) return `<p>Error: Teacher profile missing</p>`;
  
  const isDeactivated = localStorage.getItem("isDeactivated") === "true";
  if(isDeactivated) {
    return `
    <div class="max-w-sm mx-auto mt-20 p-6 flex flex-col gap-4 text-center">
  <p class="text-2xl uppercase font-bold dark:text-white">
    Access Restricted
  </p>
  
  <h2 class="text-sm text-gray-400 uppercase">
    Your account is temporarily inactive because your payment is due.
  </h2>
  
  <p class="text-xs text-gray-400 font-light mt-2">
    Call or message:
  </p>
  
  <ul class="mt-2 text-xs text-gray-700 dark:text-gray-300 space-y-1">
    <li><span class="font-semibold">Email:</span> genzlewis@gmail.com</li>
    <li><span class="font-semibold">Phone:</span> +260 962 063 468</li>
    <li><span class="font-semibold">WhatsApp:</span> +260 962 063 468</li>
  </ul>
</div>
    `;
    
  }
  
  
  // 🔥 Filter pupils by teacher's class
  const pupils = pupilsCache || JSON.stringify(localStorage.getItem("pupils"));
  return `
    <div class="pt-6 px-4 flex flex-col gap-4">
      <div class="intro flex justify-center">
        <h2 class="text-lg font-bold">PUPIL MANAGEMENT</h2>
      </div>
  
   <div class="w-full shadow p-4 rounded flex flex-col gap-2 dark:bg-[#1f1f1f]">
        <p class="text-xs">Search Pupil</p>
        <div class="flex gap-2 border border-gray-300 dark:border-[#121212] px-2 py-2 rounded">
          <i class="mdi-o text-md text-gray-400">search</i>
          <input id="week-pupil-search"
            class="flex-1 text-sm bg-transparent focus:outline-none"
            placeholder="Search pupil by name">
        </div>
      </div>
  
      <div class="border-t border-gray-300 dark:border-[#1f1f1f] rounded-t" my-4></div>
         <div class="w-full shadow py-2 rounded flex flex-col items-center justify-center gap-1 dark:bg-[#1f1f1f]">
           <p class="text-center text-xs">Total Pupils</p>
           <p id="week-pupil-count-display" class="text-center text-sm font-semibold">${pupils.length} Pupils</p>
        </div>
  
      <div id="week-pupil-list" class="flex flex-col gap-4">
        ${
          pupils.length === 0
            ? `<p class="text-center text-gray-400">No pupils yet 😅</p>`
            : pupils.map(p => {
                const [f, l] = p.name.split(" ");
                return `
                  <div class="pupil-card w-full dark:bg-[#1f1f1f] shadow p-4 rounded flex justify-between gap-2 items-center">
                    <div class="flex flex-col">
                      <p class="text-xs">${f}</p>
                      <h2 class="font-semibold">${l || ""}</h2>
                    </div>
                    <div class="flex gap-2">
                      <button data-id="${p.id}" class="edit flex gap-2 items-center px-4 py-3 bg-green-500 text-white rounded hover:bg-green-600 active:bg-green-400 transition-colors">
                        <i class="mdi-o text-xs">edit</i>
                        <p class="text-xs">Edit</p>
                      </button>
                      <button data-id="${p.id}" class="delete flex gap-2 items-center px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 active:bg-red-400 disabled:bg-red-200 transition-colors">
                        <i class="mdi-o text-xs">cancel</i>
                        <p class="text-xs">Delete</p>
                      </button>
                    </div>
                  </div>
                `;
              }).join("")
        }
      </div>
    </div>

    <!-- UPDATE MODAL -->
    <div id="updatePupilWrapper" class="fixed hidden inset-0 bg-black/40 flex items-center justify-center z-50">
      <div class="w-[80%] p-4 rounded shadow-lg bg-white dark:bg-[#1f1f1f] flex flex-col gap-3">
        <p class="text-sm">Update Pupil Name</p>
        <div class="flex gap-2 border border-gray-300 dark:border-[#121212] px-2 py-2 rounded">
          <i class="mdi text-md text-gray-400">person</i>
          <input id="pupil-update" class="flex-1 text-sm bg-transparent focus:outline-none" placeholder="Enter pupil name">
        </div>
        <div class="flex gap-2">
          <button id="closeUpdateBox" class="flex-1 bg-red-500 text-white py-2 rounded">Cancel</button>
          <button id="updatePupil" class="flex-1 bg-green-500 text-white py-2 rounded">Update</button>
        </div>
      </div>
    </div>

    <!-- DELETE MODAL -->
    <div id="deletePupilWrapper" class="fixed hidden inset-0 bg-black/40 flex items-center justify-center z-50">
      <div class="w-[80%] p-4 rounded shadow-lg bg-white dark:bg-[#1f1f1f] flex flex-col gap-3">
        <p id="delete-msg" class="text-sm"></p>
        <div class="flex gap-2">
          <button id="closeDeleteBox" class="flex-1 bg-gray-500 text-white py-2 rounded">Cancel</button>
          <button id="confirmDelete" class="flex-1 bg-red-500 text-white py-2 rounded">Delete</button>
        </div>
      </div>
    </div>
  `;
};

export default renderPupils;

/* ===================== LOGIC ===================== */
let currentPupilId = null;

/* ---------- EVENT HANDLING ---------- */
document.addEventListener("click",async  e => {

  /* EDIT */
  const editBtn = e.target.closest("button.edit");
  if (editBtn) {
    const card = editBtn.closest(".pupil-card");
    currentPupilId = editBtn.dataset.id;

    const first = card.querySelector("p").textContent;
    const last = card.querySelector("h2").textContent;

    document.getElementById("pupil-update").value = `${first} ${last}`.trim();
    document.getElementById("updatePupilWrapper").classList.remove("hidden");
    return;
  }

  /* DELETE */
  const deleteBtn = e.target.closest("button.delete");
  if (deleteBtn) {
    const card = deleteBtn.closest(".pupil-card");
    currentPupilId = deleteBtn.dataset.id;

    const name = card.querySelector("p").textContent + " " + card.querySelector("h2").textContent;
    document.getElementById("delete-msg").textContent = `Do you want to delete ${name}?`;
    document.getElementById("deletePupilWrapper").classList.remove("hidden");
    return;
  }

  /* CLOSE UPDATE */
  if (e.target.id === "closeUpdateBox") {
    document.getElementById("updatePupilWrapper").classList.add("hidden");
  }

  /* CLOSE DELETE */
  if (e.target.id === "closeDeleteBox") {
    document.getElementById("deletePupilWrapper").classList.add("hidden");
  }

  /* CONFIRM UPDATE */
  if (e.target.id === "updatePupil") {
    
    const newName = document.getElementById("pupil-update").value;
    await updatePupilName(currentPupilId, newName);
    document.getElementById("updatePupilWrapper").classList.add("hidden");
  }

  /* CONFIRM DELETE */
  if (e.target.id === "confirmDelete") {
    await deletePupil(currentPupilId);
    document.getElementById("deletePupilWrapper").classList.add("hidden");
  }
});


/* ================= SEARCH ================= */
document.addEventListener("input", e => {
  const search = e.target.closest("#week-pupil-search");
  if (!search) return;

  const q = search.value.toLowerCase();
  const list = document.querySelector("#week-pupil-list");
  if (!list) return;

  let visible = false;
  count = 0;
  
  list.querySelectorAll(".pupil-card").forEach(card => {
    const first = card.querySelector("p")?.textContent.toLowerCase() || "";
    const last = card.querySelector("h2")?.textContent.toLowerCase() || "";
    const name = first + " " + last; // combine first and last

    card.style.display = name.includes(q) ? "flex" : "none";
    if (name.includes(q)){
      count++;
      visible = true;
      
    }
  });
  
  const countEl = document.querySelector("#week-pupil-count-display");
  if (countEl) countEl.textContent = `${count} Pupils`;


  let msg = document.querySelector("#no-data-msg");
  if (!visible) {
    if (!msg) {
      msg = document.createElement("p");
      msg.id = "no-data-msg";
      msg.className = "text-center text-red-500 font-semibold mt-4";
      msg.textContent = "No pupils found for your search 😅";
      list.appendChild(msg);
    }
  } else if (msg) {
    msg.remove();
  }
});

