import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCJNxHbflrYknqaxwtIarZka-kg06U25nI",
  authDomain: "timecapsule-pro-e350f.firebaseapp.com",
  projectId: "timecapsule-pro-e350f",
  storageBucket: "timecapsule-pro-e350f.firebasestorage.app", // ✅ FIXED
  messagingSenderId: "280866816596",
  appId: "1:280866816596:web:b5fcb295aa4f1ec772e3c1"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);