import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyACIl-k-LDaMLHkmDxFjigWsDRjWkIROwE",
  authDomain: "nameit-c440f.firebaseapp.com",
  projectId: "nameit-c440f",
  storageBucket: "nameit-c440f.firebasestorage.app",
  messagingSenderId: "717959116826",
  appId: "1:717959116826:web:be05dc965592f1866db9a3",
  measurementId: "G-K7KHWCB1XL"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;

