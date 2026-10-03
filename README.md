# 🚚 SmartSync – Logistics Management Platform

> A modern, full-featured logistics dashboard built with HTML, CSS, Vanilla JavaScript & Firebase.

![SmartSync Banner](https://img.shields.io/badge/SmartSync-Logistics%20Platform-6366f1?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48dGV4dCB5PSIuOWVtIiBmb250LXNpemU9IjkwIj7wn5qUPC90ZXh0Pjwvc3ZnPg==)
![Firebase](https://img.shields.io/badge/Firebase-Integrated-FF6D00?style=for-the-badge&logo=firebase)
![Vanilla JS](https://img.shields.io/badge/Vanilla-JavaScript-F7DF1E?style=for-the-badge&logo=javascript)

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔐 Authentication | Firebase Auth + localStorage demo mode |
| 📊 Dashboard | Live stats, delivery overview, recent activity |
| 📦 Shipment Management | Create, view, and manage shipments with Firestore |
| 🔍 Live Tracking | Visual 5-stage shipment progress tracker |
| 🗺️ Route Planning | Distance estimation + Google Maps integration |
| 🏭 Warehouse Booking | Calendar-based slot booking system |
| 💬 Chat Support | AI-powered logistics support chatbot |
| 🔔 Notifications | Toast notifications for all actions |

---

## 🚀 Quick Start

### Option 1: Try with Demo Account (No Firebase needed)

1. Open `login.html` in your browser (use a local server — see below)
2. Click **"🚀 Try Demo Account"**
3. You're in! The app works entirely from `localStorage`

### Option 2: Run with Firebase

1. Clone / download this project
2. Set up Firebase (see below)
3. Start a local development server

```bash
# Using Python (recommended)
python -m http.server 8080

# Or using Node.js / npx
npx serve .

# Or using VS Code
# Install "Live Server" extension → right-click index.html → Open with Live Server
```

4. Open `http://localhost:8080` in your browser

---

## 🔥 Firebase Setup

### Step 1: Create a Firebase Project

1. Go to [https://console.firebase.google.com](https://console.firebase.google.com)
2. Click **"Add Project"** → give it a name (e.g., `smartsync-app`)
3. Disable Google Analytics (optional) → **Create Project**

### Step 2: Enable Authentication

1. In your project → **Build → Authentication**
2. Click **Get Started**
3. Under **Sign-in method** → Enable **Email/Password**

### Step 3: Enable Firestore

1. **Build → Firestore Database**
2. Click **Create Database** → Choose **Start in test mode** → Select your region → **Enable**

### Step 4: Get Your Config

1. **Project Settings** (⚙️ gear icon) → **Your apps** → Click `</>` (Web)
2. Register the app (name it anything)
3. Copy the `firebaseConfig` object

### Step 5: Add Config to the App

Open `js/firebase.js` and replace the placeholder values:

```javascript
const firebaseConfig = {
  apiKey:            "AIzaSy...",           // ← Replace
  authDomain:        "your-app.firebaseapp.com",  // ← Replace
  projectId:         "your-app",            // ← Replace
  storageBucket:     "your-app.appspot.com",// ← Replace
  messagingSenderId: "1234567890",          // ← Replace
  appId:             "1:1234...:web:abc..."  // ← Replace
};
```

### Step 6: Set Firestore Security Rules

In Firebase Console → Firestore → **Rules**, paste:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /shipments/{shipmentId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null;
    }
    match /bookings/{bookingId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null;
    }
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## 📁 Project Structure

```
SmartSync/
├── index.html          # Sign-up page
├── login.html          # Login page
├── dashboard.html      # Main dashboard (all features)
├── css/
│   └── style.css       # Complete design system & styles
├── js/
│   ├── firebase.js     # Firebase config & initialization
│   ├── auth.js         # Authentication module (sign up/in/out, guards)
│   └── dashboard.js    # Dashboard logic (shipments, tracking, bookings, chat)
└── README.md           # This file
```

---

## 🎨 Tech Stack

- **HTML5** — Semantic structure
- **CSS3** — Custom dark theme, animations, responsive design
- **Vanilla JavaScript** — ES Modules, async/await
- **Firebase v10** — Auth + Firestore (CDN)
- **Google Fonts** — Inter + JetBrains Mono
- **localStorage** — Demo mode fallback + warehouse bookings

---

## 💡 How It Works

### Demo Mode (No Firebase)
When Firebase credentials are not configured (still showing `YOUR_API_KEY`), the app automatically falls back to **localStorage** for all data. Perfect for demos without internet or Firebase setup.

### Data Flow
```
User Action → auth.js / dashboard.js
     ↓
Is Firebase configured? 
  YES → Firestore read/write
  NO  → localStorage read/write
     ↓
Update UI components
     ↓
Toast notification
```

### Shipment Tracking Stages
```
📋 Order Placed → 📦 Picked Up → 🚚 In Transit → 🛵 Out for Delivery → ✅ Delivered
```
Click **"▶ Advance Status"** in the tracking modal to simulate progress.

---

## 📱 Responsive Design

| Breakpoint | Layout |
|-----------|--------|
| Desktop (> 768px) | Full sidebar + split content panels |
| Tablet (640–768px) | Collapsed sidebar (hamburger menu) |
| Mobile (< 640px) | Single column, full-screen sidebar overlay |

---

## 🧑‍💻 For College / Hackathon Use

This project demonstrates:
- ✅ Firebase Authentication integration
- ✅ Cloud Firestore CRUD operations
- ✅ Modular JavaScript (ES Modules)
- ✅ Responsive SaaS UI design
- ✅ State management (localStorage + cloud sync)
- ✅ Real-world UX patterns (toasts, modals, loaders)
- ✅ Progressive enhancement (works without Firebase)

---

## 🔧 Customization

| What | Where |
|------|-------|
| Colors & theme | `css/style.css` → `:root` variables |
| Bot responses | `js/dashboard.js` → `BOT_RESPONSES` |
| Time slots | `js/dashboard.js` → `TIME_SLOTS` |
| Tracking stages | `js/dashboard.js` → `TRACKING_STAGES` |
| Firebase config | `js/firebase.js` → `firebaseConfig` |

---

## 📄 License

MIT License — Free to use for educational, portfolio, and hackathon purposes.

---

<div align="center">
  Built with ❤️ using HTML, CSS, JavaScript & Firebase
</div>
