import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyCBhrxFnwDDyw9XxYGrO3ITuOzvbgj7Vf8",
    authDomain: "shreshta-2026.firebaseapp.com",
    projectId: "shreshta-2026",
    storageBucket: "shreshta-2026.firebasestorage.app",
    messagingSenderId: "529862847586",
    appId: "1:529862847586:web:0650baa26143c0704db53b"
};

// Initialize Firebase only if not already initialized
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app, "gs://shreshta-2026.firebasestorage.app");
export const googleProvider = new GoogleAuthProvider();

// Google Sheets Web App URL
export const GOOGLE_SHEETS_URL = "https://script.google.com/macros/s/AKfycbxvCdvdq-FbgKBX2Y2bJrCZztZURGxqX-McYzgZhkhqyF7jXAqqIZO4kqTQ0KmHs3Le/exec";

// UPI Configuration
export const UPI_ID = "7760554350@axl";
export const UPI_NAME = "SHRESHTA 2026";

export default app;
