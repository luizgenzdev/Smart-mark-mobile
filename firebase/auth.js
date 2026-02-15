import { getAuth, onAuthStateChanged } from
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import { app } from "./config.js";

export const auth = getAuth(app);

export { onAuthStateChanged };
