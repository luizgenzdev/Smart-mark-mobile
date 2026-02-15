import { getFirestore } from
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { app } from "./config.js";

export const db = getFirestore(app);


