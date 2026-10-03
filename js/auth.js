// ============================================================
// SmartSync - Authentication Module
// ============================================================
// Handles sign-up, login, logout, and auth state persistence.
// Works with Firebase Auth. Falls back to localStorage demo mode
// when Firebase is not yet configured.
// ============================================================

import { auth, isFirebaseConfigured } from "./firebase.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// ─── Toast Notification Helper ────────────────────────────
export function showToast(message, type = "success") {
  const container = document.getElementById("toast-container");
  if (!container) return;
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  const iconMap = { success: "✅", error: "❌", info: "ℹ️", warning: "⚠️" };
  toast.innerHTML = `<span class="toast-icon">${iconMap[type] || "ℹ️"}</span><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => toast.classList.add("show"), 10);
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 400);
  }, 3500);
}

// ─── SIGN UP ──────────────────────────────────────────────
export async function signUp(name, email, password) {
  if (isFirebaseConfigured()) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });
    return cred.user;
  } else {
    // Demo mode: store in localStorage
    const users = JSON.parse(localStorage.getItem("ss_users") || "{}");
    if (users[email]) throw new Error("Email already in use.");
    users[email] = { name, email, password };
    localStorage.setItem("ss_users", JSON.stringify(users));
    localStorage.setItem("ss_current_user", JSON.stringify({ name, email }));
    return { displayName: name, email };
  }
}

// ─── SIGN IN ──────────────────────────────────────────────
export async function signIn(email, password) {
  if (isFirebaseConfigured()) {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return cred.user;
  } else {
    // Demo mode
    const users = JSON.parse(localStorage.getItem("ss_users") || "{}");
    const user  = users[email];
    if (!user || user.password !== password) throw new Error("Invalid email or password.");
    localStorage.setItem("ss_current_user", JSON.stringify({ name: user.name, email }));
    return { displayName: user.name, email };
  }
}

// ─── SIGN OUT ─────────────────────────────────────────────
export async function logOut() {
  if (isFirebaseConfigured()) {
    await signOut(auth);
  } else {
    localStorage.removeItem("ss_current_user");
  }
  window.location.href = "login.html";
}

// ─── AUTH GUARD ───────────────────────────────────────────
// Call on protected pages; redirects to login if not authenticated
export function requireAuth(callback) {
  if (isFirebaseConfigured()) {
    onAuthStateChanged(auth, (user) => {
      if (!user) {
        window.location.href = "login.html";
      } else {
        callback(user);
      }
    });
  } else {
    const user = JSON.parse(localStorage.getItem("ss_current_user") || "null");
    if (!user) {
      window.location.href = "login.html";
    } else {
      callback({ displayName: user.name, email: user.email });
    }
  }
}

// ─── REDIRECT IF ALREADY LOGGED IN ───────────────────────
// Call on login/signup pages to skip auth if already signed in
export function redirectIfAuthenticated() {
  if (isFirebaseConfigured()) {
    onAuthStateChanged(auth, (user) => {
      if (user) window.location.href = "dashboard.html";
    });
  } else {
    const user = JSON.parse(localStorage.getItem("ss_current_user") || "null");
    if (user) window.location.href = "dashboard.html";
  }
}
