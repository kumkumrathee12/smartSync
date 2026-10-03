// ============================================================
// SmartSync - Dashboard Module
// ============================================================
// Handles all dashboard interactions: shipments, tracking,
// warehouse bookings, chat, notifications, and route planning.
// Uses Firestore when configured, localStorage otherwise.
// ============================================================

import { db, isFirebaseConfigured } from "./firebase.js";
import { requireAuth, logOut, showToast } from "./auth.js";
import {
  collection, addDoc, getDocs, query, where, orderBy, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ─── Global State ─────────────────────────────────────────
let currentUser = null;
let shipments   = [];
let bookings    = [];
let selectedDate = null;

// ─── INIT ─────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  requireAuth(async (user) => {
    currentUser = user;
    initUI(user);
    await loadShipments();
    loadBookings();
    renderBookingsList();
    renderCalendar();
    initChat();
    initNavigation();
    initRouteMap();
    updateDashboardStats();
  });
});

// ─── UI INITIALIZATION ────────────────────────────────────
function initUI(user) {
  // Set user info
  document.querySelectorAll(".user-name").forEach(el => {
    el.textContent = user.displayName || user.email;
  });
  document.querySelectorAll(".user-email").forEach(el => {
    el.textContent = user.email;
  });
  // Greet user
  const greet = document.getElementById("greeting");
  if (greet) {
    const hour = new Date().getHours();
    const timeGreet = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
    greet.textContent = `${timeGreet}, ${user.displayName?.split(" ")[0] || "User"}! 👋`;
  }
  // Logout button
  document.getElementById("logout-btn")?.addEventListener("click", async () => {
    await logOut();
  });
  showToast("Welcome back! Dashboard loaded.", "success");
}

// ─── NAVIGATION ───────────────────────────────────────────
function initNavigation() {
  const navLinks = document.querySelectorAll(".nav-link");
  const sections = document.querySelectorAll(".page-section");
  const menuToggle = document.getElementById("menu-toggle");
  const sidebar    = document.getElementById("sidebar");
  const overlay    = document.getElementById("sidebar-overlay");

  navLinks.forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const target = link.dataset.section;
      navLinks.forEach(l => l.classList.remove("active"));
      link.classList.add("active");
      sections.forEach(s => s.classList.remove("active-section"));
      const section = document.getElementById(`section-${target}`);
      if (section) section.classList.add("active-section");
      // Close sidebar on mobile
      sidebar?.classList.remove("open");
      overlay?.classList.remove("show");
    });
  });

  menuToggle?.addEventListener("click", () => {
    sidebar?.classList.toggle("open");
    overlay?.classList.toggle("show");
  });
  overlay?.addEventListener("click", () => {
    sidebar?.classList.remove("open");
    overlay?.classList.remove("show");
  });

  // Show dashboard by default
  document.querySelector('.nav-link[data-section="dashboard"]')?.click();
}

// ─── SHIPMENT MANAGEMENT ──────────────────────────────────
async function loadShipments() {
  if (isFirebaseConfigured()) {
    try {
      const q = query(
        collection(db, "shipments"),
        where("userId", "==", currentUser.uid),
        orderBy("createdAt", "desc")
      );
      const snap = await getDocs(q);
      shipments = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
      shipments = getLocalShipments();
    }
  } else {
    shipments = getLocalShipments();
  }
  renderShipments();
  updateDashboardStats();
}

function getLocalShipments() {
  return JSON.parse(localStorage.getItem("ss_shipments") || "[]")
    .filter(s => s.userId === (currentUser.email));
}

function saveLocalShipment(shipment) {
  const all = JSON.parse(localStorage.getItem("ss_shipments") || "[]");
  all.unshift(shipment);
  localStorage.setItem("ss_shipments", JSON.stringify(all));
}

// Create Shipment Form Submit
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("shipment-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector("button[type=submit]");
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Creating...';

    const shipment = {
      trackingId:     generateTrackingId(),
      customerName:   document.getElementById("customer-name").value.trim(),
      pickupLocation: document.getElementById("pickup-location").value.trim(),
      deliveryLocation: document.getElementById("delivery-location").value.trim(),
      packageDetails: document.getElementById("package-details").value.trim(),
      deliveryDate:   document.getElementById("delivery-date").value,
      status:         "Order Placed",
      statusIndex:    0,
      userId:         isFirebaseConfigured() ? currentUser.uid : currentUser.email,
      createdAt:      new Date().toISOString()
    };

    try {
      if (isFirebaseConfigured()) {
        const ref = await addDoc(collection(db, "shipments"), {
          ...shipment, createdAt: serverTimestamp()
        });
        shipment.id = ref.id;
      } else {
        shipment.id = "ls_" + Date.now();
        saveLocalShipment(shipment);
      }
      shipments.unshift(shipment);
      renderShipments();
      updateDashboardStats();
      e.target.reset();
      showToast(`Shipment ${shipment.trackingId} created successfully! 🚚`, "success");
      // Auto navigate to tracking
      setTimeout(() => openTracking(shipment), 800);
    } catch (err) {
      showToast("Error creating shipment: " + err.message, "error");
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<i class="icon">🚀</i> Create Shipment';
    }
  });
});

function generateTrackingId() {
  return "SS" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2,5).toUpperCase();
}

function renderShipments() {
  // Dispatch event so dashboard can update overview counters
  document.dispatchEvent(new CustomEvent("shipmentsLoaded", { detail: shipments }));

  const list = document.getElementById("shipments-list");
  const recentList = document.getElementById("recent-shipments");
  if (!list) return;

  if (shipments.length === 0) {
    list.innerHTML = `<div class="empty-state">
      <div class="empty-icon">📦</div>
      <h3>No shipments yet</h3>
      <p>Create your first shipment to get started.</p>
    </div>`;
    if (recentList) recentList.innerHTML = `<div class="empty-state small"><p>No recent activity</p></div>`;
    return;
  }

  list.innerHTML = shipments.map(s => `
    <div class="shipment-card" onclick="openTracking(${JSON.stringify(s).replace(/"/g, '&quot;')})">
      <div class="shipment-card-header">
        <span class="tracking-id">📦 ${s.trackingId}</span>
        <span class="status-badge status-${s.status.toLowerCase().replace(/ /g,'-')}">${s.status}</span>
      </div>
      <div class="shipment-card-body">
        <div class="route-info">
          <span class="location pickup"><i>📍</i>${s.pickupLocation}</span>
          <span class="route-arrow">→</span>
          <span class="location delivery"><i>🏁</i>${s.deliveryLocation}</span>
        </div>
        <div class="shipment-meta">
          <span><i>👤</i> ${s.customerName}</span>
          <span><i>📅</i> ${s.deliveryDate}</span>
        </div>
      </div>
      <div class="shipment-card-footer">
        <button class="btn-sm btn-track" onclick="event.stopPropagation(); openTracking(${JSON.stringify(s).replace(/"/g, '&quot;')})">Track</button>
        <button class="btn-sm btn-route" onclick="event.stopPropagation(); openRoute(${JSON.stringify(s).replace(/"/g, '&quot;')})">View Route</button>
      </div>
    </div>
  `).join("");

  // Recent activity (last 5)
  if (recentList) {
    recentList.innerHTML = shipments.slice(0, 5).map(s => `
      <div class="recent-item" onclick="openTracking(${JSON.stringify(s).replace(/"/g, '&quot;')})">
        <div class="recent-icon status-dot-${s.status.toLowerCase().replace(/ /g,'-')}">🚚</div>
        <div class="recent-info">
          <span class="recent-title">${s.trackingId}</span>
          <span class="recent-sub">${s.pickupLocation} → ${s.deliveryLocation}</span>
        </div>
        <span class="recent-status">${s.status}</span>
      </div>
    `).join("");
  }
}

// ─── DASHBOARD STATS ──────────────────────────────────────
function updateDashboardStats() {
  const total     = shipments.length;
  const active    = shipments.filter(s => !["Delivered"].includes(s.status)).length;
  const completed = shipments.filter(s => s.status === "Delivered").length;
  const pending   = bookings.length;

  animateCounter("stat-total",     total);
  animateCounter("stat-active",    active);
  animateCounter("stat-completed", completed);
  animateCounter("stat-pending",   pending);
}

function animateCounter(id, target) {
  const el = document.getElementById(id);
  if (!el) return;
  let current = 0;
  const step = Math.ceil(target / 30);
  const interval = setInterval(() => {
    current = Math.min(current + step, target);
    el.textContent = current;
    if (current >= target) clearInterval(interval);
  }, 30);
}

// ─── LIVE TRACKING ────────────────────────────────────────
const TRACKING_STAGES = [
  { label: "Order Placed",      icon: "📋", desc: "Your order has been received and confirmed." },
  { label: "Picked Up",         icon: "📦", desc: "Package picked up from sender location." },
  { label: "In Transit",        icon: "🚚", desc: "Package is on the way to delivery hub." },
  { label: "Out for Delivery",  icon: "🛵", desc: "Package is out for final delivery." },
  { label: "Delivered",         icon: "✅", desc: "Package successfully delivered!" }
];

window.openTracking = function(shipment) {
  const modal = document.getElementById("tracking-modal");
  if (!modal) return;

  document.getElementById("tracking-modal-id").textContent   = shipment.trackingId;
  document.getElementById("tracking-customer").textContent   = shipment.customerName;
  document.getElementById("tracking-route").textContent      = `${shipment.pickupLocation} → ${shipment.deliveryLocation}`;
  document.getElementById("tracking-delivery-date").textContent = shipment.deliveryDate;
  document.getElementById("tracking-package").textContent    = shipment.packageDetails;

  const stageIndex = TRACKING_STAGES.findIndex(s => s.label === shipment.status);
  const currentIdx = stageIndex >= 0 ? stageIndex : 0;

  const stepsEl = document.getElementById("tracking-steps");
  stepsEl.innerHTML = TRACKING_STAGES.map((stage, i) => `
    <div class="tracking-step ${i < currentIdx ? 'done' : i === currentIdx ? 'active' : ''}">
      <div class="step-icon">${stage.icon}</div>
      <div class="step-info">
        <div class="step-label">${stage.label}</div>
        <div class="step-desc">${stage.desc}</div>
      </div>
      ${i < TRACKING_STAGES.length - 1 ? '<div class="step-connector"></div>' : ''}
    </div>
  `).join("");

  // Simulate advance button
  const advBtn = document.getElementById("advance-status-btn");
  if (advBtn) {
    advBtn.onclick = () => advanceShipmentStatus(shipment, currentIdx, modal);
    advBtn.style.display = currentIdx < TRACKING_STAGES.length - 1 ? "inline-flex" : "none";
  }

  modal.classList.add("show");
};

function advanceShipmentStatus(shipment, currentIdx, modal) {
  const nextIdx    = Math.min(currentIdx + 1, TRACKING_STAGES.length - 1);
  shipment.status  = TRACKING_STAGES[nextIdx].label;
  shipment.statusIndex = nextIdx;

  // Persist locally
  const all = JSON.parse(localStorage.getItem("ss_shipments") || "[]");
  const idx = all.findIndex(s => s.id === shipment.id);
  if (idx >= 0) { all[idx].status = shipment.status; all[idx].statusIndex = nextIdx; }
  localStorage.setItem("ss_shipments", JSON.stringify(all));

  // Update in memory
  const memIdx = shipments.findIndex(s => s.id === shipment.id);
  if (memIdx >= 0) shipments[memIdx] = shipment;

  renderShipments();
  updateDashboardStats();
  modal.classList.remove("show");
  showToast(`Status updated: ${shipment.status} 🚀`, "info");
  setTimeout(() => openTracking(shipment), 300);

  if (shipment.status === "Delivered") {
    setTimeout(() => showToast(`🎉 Shipment ${shipment.trackingId} delivered!`, "success"), 600);
  } else if (shipment.status === "In Transit") {
    setTimeout(() => showToast(`⚠️ Note: Shipment may experience minor delays due to traffic.`, "warning"), 1200);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("close-tracking")?.addEventListener("click", () => {
    document.getElementById("tracking-modal")?.classList.remove("show");
  });
  document.getElementById("tracking-modal")?.addEventListener("click", (e) => {
    if (e.target === e.currentTarget) e.currentTarget.classList.remove("show");
  });
});

// ─── ROUTE PLANNING ───────────────────────────────────────
function initRouteMap() {
  document.getElementById("plan-route-btn")?.addEventListener("click", () => {
    const pickup   = document.getElementById("route-pickup").value.trim();
    const delivery = document.getElementById("route-delivery").value.trim();
    if (!pickup || !delivery) {
      showToast("Please enter both pickup and delivery locations.", "warning");
      return;
    }
    const mapFrame = document.getElementById("route-map-frame");
    const routeInfo = document.getElementById("route-info");
    if (mapFrame) {
      const query = encodeURIComponent(`${pickup} to ${delivery}`);
      mapFrame.src = `https://maps.google.com/maps?q=${encodeURIComponent(pickup)}&output=embed`;
    }
    if (routeInfo) {
      routeInfo.innerHTML = `
        <div class="route-result">
          <div class="route-result-item"><span class="ri-label">📍 From</span><span>${pickup}</span></div>
          <div class="route-result-item"><span class="ri-label">🏁 To</span><span>${delivery}</span></div>
          <div class="route-result-item"><span class="ri-label">📏 Est. Distance</span><span>${Math.floor(Math.random()*400+50)} km</span></div>
          <div class="route-result-item"><span class="ri-label">⏱ Est. Time</span><span>${Math.floor(Math.random()*6+2)} hrs ${Math.floor(Math.random()*50+5)} mins</span></div>
          <div class="route-result-item"><span class="ri-label">🚚 Vehicle</span><span>Medium Truck</span></div>
          <div class="route-result-item"><span class="ri-label">⛽ Est. Fuel</span><span>${Math.floor(Math.random()*40+10)} L</span></div>
        </div>
      `;
    }
    showToast("Route planned successfully! 🗺️", "success");
  });
}

window.openRoute = function(shipment) {
  document.querySelector('.nav-link[data-section="route"]')?.click();
  setTimeout(() => {
    if (document.getElementById("route-pickup"))
      document.getElementById("route-pickup").value = shipment.pickupLocation;
    if (document.getElementById("route-delivery"))
      document.getElementById("route-delivery").value = shipment.deliveryLocation;
    document.getElementById("plan-route-btn")?.click();
  }, 200);
};

// ─── WAREHOUSE BOOKING ────────────────────────────────────
function loadBookings() {
  bookings = JSON.parse(localStorage.getItem("ss_bookings") || "[]")
    .filter(b => b.userId === (currentUser.email || currentUser.uid));
}

function renderCalendar() {
  const calEl  = document.getElementById("booking-calendar");
  const today  = new Date();
  let viewYear = today.getFullYear();
  let viewMonth = today.getMonth();

  function buildCalendar() {
    if (!calEl) return;
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const monthName = new Date(viewYear, viewMonth).toLocaleString("default", { month: "long" });

    const bookedDates = bookings.map(b => b.date);

    calEl.innerHTML = `
      <div class="cal-header">
        <button id="cal-prev" class="cal-nav">‹</button>
        <span class="cal-title">${monthName} ${viewYear}</span>
        <button id="cal-next" class="cal-nav">›</button>
      </div>
      <div class="cal-grid">
        ${["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => `<div class="cal-day-name">${d}</div>`).join("")}
        ${Array.from({length: firstDay}, () => '<div class="cal-day empty"></div>').join("")}
        ${Array.from({length: daysInMonth}, (_, i) => {
          const day = i + 1;
          const dateStr = `${viewYear}-${String(viewMonth+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
          const isToday = day === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();
          const isPast  = new Date(dateStr) < new Date(today.toDateString());
          const isBooked = bookedDates.includes(dateStr);
          return `<div class="cal-day ${isToday ? 'today' : ''} ${isPast ? 'past' : ''} ${isBooked ? 'booked' : ''} ${!isPast && !isBooked ? 'available' : ''}" 
            data-date="${dateStr}" ${!isPast ? `onclick="selectCalDate('${dateStr}')"` : ''}>${day}</div>`;
        }).join("")}
      </div>
    `;
    document.getElementById("cal-prev")?.addEventListener("click", () => {
      viewMonth--; if (viewMonth < 0) { viewMonth = 11; viewYear--; } buildCalendar();
    });
    document.getElementById("cal-next")?.addEventListener("click", () => {
      viewMonth++; if (viewMonth > 11) { viewMonth = 0; viewYear++; } buildCalendar();
    });
  }
  buildCalendar();
}

window.selectCalDate = function(dateStr) {
  selectedDate = dateStr;
  document.querySelectorAll(".cal-day").forEach(d => d.classList.remove("selected"));
  document.querySelector(`.cal-day[data-date="${dateStr}"]`)?.classList.add("selected");
  document.getElementById("selected-date-display").textContent = `Selected: ${new Date(dateStr).toDateString()}`;
  renderTimeSlots(dateStr);
};

const TIME_SLOTS = ["08:00 AM","10:00 AM","12:00 PM","02:00 PM","04:00 PM","06:00 PM"];

function renderTimeSlots(dateStr) {
  const slotsEl = document.getElementById("time-slots");
  if (!slotsEl) return;
  const bookedSlots = bookings.filter(b => b.date === dateStr).map(b => b.slot);
  slotsEl.innerHTML = TIME_SLOTS.map(slot => {
    const isBooked = bookedSlots.includes(slot);
    return `<button class="slot-btn ${isBooked ? 'slot-booked' : 'slot-available'}" 
      ${isBooked ? 'disabled' : `onclick="bookSlot('${dateStr}','${slot}')"`}>${slot}${isBooked ? " 🔒" : ""}</button>`;
  }).join("");
}

window.bookSlot = function(date, slot) {
  const warehouseEl = document.getElementById("warehouse-select");
  const warehouse   = warehouseEl ? warehouseEl.value : "Warehouse A";
  const booking = {
    id:        "BK" + Date.now(),
    date, slot, warehouse,
    userId:    currentUser.email || currentUser.uid,
    createdAt: new Date().toISOString()
  };
  bookings.push(booking);
  const all = JSON.parse(localStorage.getItem("ss_bookings") || "[]");
  all.push(booking);
  localStorage.setItem("ss_bookings", JSON.stringify(all));
  renderTimeSlots(date);
  updateDashboardStats();
  showToast(`✅ Booked ${warehouse} at ${slot} on ${new Date(date).toDateString()}`, "success");
  renderBookingsList();
};

function renderBookingsList() {
  const listEl = document.getElementById("bookings-list");
  if (!listEl) return;
  const userBookings = bookings.slice().reverse();
  if (userBookings.length === 0) {
    listEl.innerHTML = `<div class="empty-state small"><p>No bookings yet.</p></div>`;
    return;
  }
  listEl.innerHTML = userBookings.map(b => `
    <div class="booking-item">
      <div class="booking-icon">🏭</div>
      <div class="booking-info">
        <span class="booking-title">${b.warehouse}</span>
        <span class="booking-sub">${new Date(b.date).toDateString()} at ${b.slot}</span>
      </div>
      <span class="booking-badge">Confirmed</span>
    </div>
  `).join("");
}

// ─── CHAT SUPPORT ─────────────────────────────────────────
const BOT_RESPONSES = {
  keywords: [
    { keys: ["track","tracking","where","shipment"], reply: "You can track your shipment using the Shipment Management section. Click on any shipment card and select 'Track' to see real-time status updates. 📦" },
    { keys: ["delay","delayed","late"], reply: "We apologize for the inconvenience! Delays can occur due to weather, traffic, or customs. Our team is working to expedite your delivery. Expected resolution within 24 hours. ⚠️" },
    { keys: ["warehouse","booking","book","slot"], reply: "To book a warehouse slot, visit the Warehouse Booking section. Select your preferred date on the calendar, choose an available time slot, and confirm your booking! 🏭" },
    { keys: ["hello","hi","hey","help"], reply: "Hello! Welcome to SmartSync Support 👋 How can I help you today? I can assist with shipment tracking, delivery delays, and warehouse bookings." },
    { keys: ["deliver","delivery","arrive","arriving"], reply: "Delivery timelines depend on the selected delivery date when creating the shipment. You can view estimated delivery in the tracking section. 🚚" },
    { keys: ["cancel","cancellation"], reply: "To cancel a shipment, please contact our operations team. Cancellations are possible before the 'Picked Up' stage. 📞" },
    { keys: ["price","cost","rate","fee"], reply: "Pricing depends on package weight, dimensions, and delivery distance. Please visit the Shipment Management section and use our rate calculator when creating a new shipment. 💰" },
    { keys: ["contact","phone","email","support"], reply: "You can reach SmartSync support at support@smartsync.io or call +1-800-SMARTSYNC (Monday–Friday, 9AM–6PM). 📞" },
  ],
  default: "Thanks for reaching out! Our logistics team will get back to you shortly. For urgent matters, please call +1-800-SMARTSYNC. 🙏"
};

function getBotResponse(message) {
  const lower = message.toLowerCase();
  for (const item of BOT_RESPONSES.keywords) {
    if (item.keys.some(k => lower.includes(k))) return item.reply;
  }
  return BOT_RESPONSES.default;
}

function initChat() {
  const chatInput  = document.getElementById("chat-input");
  const chatSend   = document.getElementById("chat-send");
  const chatBody   = document.getElementById("chat-body");
  if (!chatInput || !chatSend || !chatBody) return;

  function appendMsg(text, sender) {
    const msg = document.createElement("div");
    msg.className = `chat-msg chat-${sender}`;
    msg.innerHTML = `
      <div class="chat-bubble">${text}</div>
      <div class="chat-time">${new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</div>
    `;
    chatBody.appendChild(msg);
    chatBody.scrollTop = chatBody.scrollHeight;
  }

  function appendTyping() {
    const typing = document.createElement("div");
    typing.className = "chat-msg chat-bot typing-indicator";
    typing.id = "typing-indicator";
    typing.innerHTML = `<div class="chat-bubble"><span></span><span></span><span></span></div>`;
    chatBody.appendChild(typing);
    chatBody.scrollTop = chatBody.scrollHeight;
    return typing;
  }

  function sendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;
    appendMsg(text, "user");
    chatInput.value = "";
    const typing = appendTyping();
    setTimeout(() => {
      typing.remove();
      appendMsg(getBotResponse(text), "bot");
    }, 1000 + Math.random() * 800);
  }

  chatSend.addEventListener("click", sendMessage);
  chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  });

  // Initial bot greeting
  setTimeout(() => {
    appendMsg("👋 Hi! I'm SmartSync Assistant. How can I help you today? Ask me about shipment tracking, delivery delays, or warehouse bookings.", "bot");
  }, 500);
}
