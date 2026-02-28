import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCpf-6mbYspmIb2FYSgJ8cEfaYnjE-uprc",
  authDomain: "academic-platform-3601c.firebaseapp.com",
  projectId: "academic-platform-3601c",
  storageBucket: "academic-platform-3601c.firebasestorage.app",
  messagingSenderId: "473866950888",
  appId: "1:473866950888:web:cb855d90f790f2ed22915d",
  measurementId: "G-8Q815BP9JM"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail
};
export default app;
