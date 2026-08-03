// Shared Firebase setup for the whole master-life-app.
// Every page imports { db } from this file instead of initializing Firebase itself,
// so there is exactly one place to update if the project config ever changes.
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.17.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBsx0Ped0p6Wq3ehD22bh0zx6EO5m9L1t8",
  authDomain: "master-life-app.firebaseapp.com",
  projectId: "master-life-app",
  storageBucket: "master-life-app.firebasestorage.app",
  messagingSenderId: "851741741444",
  appId: "1:851741741444:web:c7ff5dfc288a9d9820cdd1"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
