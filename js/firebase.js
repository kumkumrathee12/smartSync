// ============================================================
// SmartSync - Firebase Configuration
// ============================================================
// 🔥 IMPORTANT: Replace the values below with your own Firebase
// project credentials. Get them from:
// https://console.firebase.google.com → Your Project → Project Settings → Your Apps → Firebase SDK snippet
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ─── PASTE YOUR FIREBASE CONFIG HERE ───────────────────────
const firebaseConfig = {
  apiKey:            "YOUR_API_KEY",
  authDomain:        "YOUR_PROJECT_ID.firebaseapp.com",
  projectId:         "YOUR_PROJECT_ID",
  storageBucket:     "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId:             "YOUR_APP_ID"
};
// ──────────────────────────────────────────────────────────

// Initialize Firebase
const app  = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db   = getFirestore(app);

// Helper: detect if Firebase is using real credentials
export const isFirebaseConfigured = () =>
  firebaseConfig.apiKey !== "YOUR_API_KEY";
