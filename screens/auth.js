import { signup, login, logout } from "../services/authService.js";
import { getSchoolClasses, checkAccess } from "../firebase/helpers.js";
import { showToast } from "../helpers/toast.js";

let isLogin = true;
let classLoadTimeout;

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
  [diaBtn, footer, header, sideBar].forEach(el =>
    el?.classList.add("hidden")
  );
}

/* ---------------- RENDER AUTH TEMPLATE ---------------- */
const renderAuth = async (renderMainApp) => {
 /* await logout();
  localStorage.removeItem("userProfile");*/
  if(isLogin) showToast("SAFE TO SIGN IN");
  hideGlobalUI();
  return `
  <div class="h-screen overflow-y-auto flex items-center flex-col justify-center">
    <div class="logo dark:text-white flex flex-col text-center">
      <h1 class="small-caps font-medium text-3xl text-[#000081] dark:text-blue-500">Smart<span class="text-[red]">Mark</span></h1>
      <p class="text-xs text-center">Marking With Care</p>
    </div>
  
    <div class="dark:text-white form flex flex-col items-center w-full py-4 px-6">
      <p class="text-xs text-green-500 font-semibold text-center mb-4">
        ${isLogin ? "Login" : "Create Account"}
      </p>

      ${!isLogin ? `
        <div class="text-field w-full flex flex-col gap-0.5 mb-2">
          <label class="text-xs">Full Name</label>
          <div class="flex gap-2 border border-gray-300 dark:border-[#555] px-2 py-2 rounded">
            <i class="mdi text-gray-400">person</i>
            <input id="fullname" type="text" class="flex-1 text-sm bg-transparent focus:outline-none" placeholder="Full name"/>
          </div>
        </div>
      ` : ""}

      <div class="text-field w-full flex flex-col gap-0.5">
        <label class="text-xs">Email</label>
        <div class="flex gap-2 border border-gray-300 dark:border-[#555] px-2 py-2 rounded">
          <i class="mdi-o text-gray-400">email</i>
          <input id="email" type="email" class="flex-1 text-sm bg-transparent focus:outline-none" placeholder="Email"/>
        </div>
      </div>

      <div class="mt-2 text-field w-full flex flex-col gap-0.5">
        <label class="text-xs">Password</label>
        <div class="flex gap-2 border border-gray-300 dark:border-[#555] px-2 py-2 rounded">
          <i class="mdi-o text-gray-400">lock</i>
          <input id="password" type="password" class="flex-1 text-sm bg-transparent focus:outline-none" placeholder="Password"/>
          <p id="view" class="mdi-o text-gray-400 cursor-pointer">visibility</p>
        </div>
      </div>

      ${!isLogin ? `
        <div class="mt-2 text-field w-full flex flex-col gap-0.5">
          <label class="text-xs">School Code</label>
          <div class="flex gap-2 border border-gray-300 dark:border-[#555] px-2 py-2 rounded">
            <i class="mdi-o text-gray-400">qr_code</i>
            <input id="schoolCode" type="text" class="flex-1 text-sm bg-transparent focus:outline-none" placeholder="e.g SCH001"/>
          </div>
        </div>

        <div class="mt-2 text-field w-full flex flex-col gap-0.5">
          <label class="text-xs">Class</label>
          <div class="flex gap-2 border border-gray-300 dark:border-[#555] px-2 py-2 rounded">
            <i class="mdi-o text-gray-400">school</i>
            <select id="classSelect" class="flex-1 text-sm bg-transparent focus:outline-none">
              <option value="">Select class</option>
            </select>
          </div>
        </div>

        <div class="mt-2 text-field w-full flex flex-col gap-0.5">
          <label class="text-xs">Go-Ahead Code</label>
          <div class="flex gap-2 border border-gray-300 dark:border-[#555] px-2 py-2 rounded">
            <i class="mdi-o text-gray-400">receipt</i>
            <input id="code" type="text" class="flex-1 text-sm bg-transparent focus:outline-none" placeholder="Go-ahead code"/>
          </div>
        </div>
      ` : ""}

      <button id="submit-auth" class="mt-4 w-full py-3 bg-green-500 active:bg-green-400 font-bold rounded uppercase text-sm text-white">
        ${isLogin ? "Log In" : "Sign Up"}
      </button>

      <p id="authMessage" class="mt-2 text-xs text-center text-red-500"></p>

      <p id="state" class="mt-4 py-2 px-2 text-xs text-center underline cursor-pointer">
        ${isLogin ? "Create an account" : "Already have an account?"}
      </p>
    </div>
  </div>
  `;
};

/* ---------------- DELEGATED LISTENERS ---------------- */
document.addEventListener("click", async (e) => {
  const authMessage = document.getElementById("authMessage");

  // Toggle password visibility
  if (e.target.closest("#view")) {
    const pass = document.getElementById("password");
    const viewBtn = document.getElementById("view");
    if (!pass || !viewBtn) return;
    pass.type = pass.type === "password" ? "text" : "password";
    viewBtn.textContent = pass.type === "password" ? "visibility" : "visibility_off";
  }

  // Switch login/signup
  if (e.target.closest("#state")) {
    isLogin = !isLogin;
    const container = document.getElementById("body");
    container.innerHTML = await renderAuth(window.renderMainApp);
  }

  // Submit login/signup
  if (e.target.closest("#submit-auth")) {
    authMessage.textContent = "";
    const email = document.getElementById("email")?.value.trim();
    const password = document.getElementById("password")?.value.trim();

    if (!email || !password) {
      authMessage.textContent = "Email and password are required.";
      return;
    }

    try {
      if (isLogin) {
        authMessage.classList.remove("text-red-500");
        authMessage.classList.add("text-green-500");
        authMessage.textContent = "Signing in. Please wait...";
        
        const user = await login(email, password);

        // Load profile
        const profile = JSON.parse(localStorage.getItem("userProfile")) || { uid: user.uid, onboardingComplete: true };
        const isDeactivated = await checkAccess(profile);
        localStorage.setItem("userProfile", JSON.stringify(profile));
        localStorage.setItem("isDeactivated", String(isDeactivated));

       // showToast(`Welcome ${profile.name}`, { icon: "person" });
        if (window.renderMainApp) window.renderMainApp();
      } else {
        const fullname = document.getElementById("fullname")?.value.trim();
        const schoolId = document.getElementById("schoolCode")?.value.trim();
        const classId = document.getElementById("classSelect")?.value;
        const code = document.getElementById("code")?.value.trim();

        if (!fullname || !schoolId || !classId || !code) {
          authMessage.textContent = "All fields are required.";
          return;
        }

        authMessage.classList.remove("text-red-500");
        authMessage.classList.add("text-green-500");
        authMessage.textContent = "Signing up. Please wait...";

        await signup(fullname, email, password, schoolId, classId, code);
        //await logout();   // ensure user is signed out
        isLogin = true;
        console.warn("LOGGED OUT")
        // Set current screen = auth and render SPA main app
        window.currentScreen = "auth";
        if (window.renderMainApp) window.renderMainApp();
      }
    } catch (err) {
      authMessage.classList.remove("text-green-500");
      authMessage.classList.add("text-red-500");
      authMessage.textContent = err.message;
    }
  }
});

/* ---------------- DYNAMIC CLASS LOADING ---------------- */
document.addEventListener("input", async (e) => {
  const schoolInput = e.target.closest("#schoolCode");
  if (!schoolInput) return;

  const classSelect = document.getElementById("classSelect");
  if (!classSelect) return;

  clearTimeout(classLoadTimeout);
  classLoadTimeout = setTimeout(async () => {
    const schoolId = schoolInput.value.trim();
    if (!schoolId) return;

    classSelect.innerHTML = `<option>Loading...</option>`;
    try {
      const classes = await getSchoolClasses(schoolId);
      classSelect.innerHTML = classes.length
        ? `<option value="">Select class</option>${classes
            .map(c => `<option value="${c.id}">${c.name || c.id}</option>`)
            .join("")}`
        : `<option>No classes found</option>`;
    } catch {
      classSelect.innerHTML = `<option>Error loading classes</option>`;
    }
  }, 400);
});

export default renderAuth;