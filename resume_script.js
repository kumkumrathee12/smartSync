// ── Theme toggle ──────────────────────────────────────────────────────────
const html = document.documentElement;
const themeBtn = document.getElementById('theme-toggle');
const savedTheme = localStorage.getItem('theme') || 'dark';
html.dataset.theme = savedTheme;

themeBtn?.addEventListener('click', () => {
  const next = html.dataset.theme === 'dark' ? 'light' : 'dark';
  html.dataset.theme = next;
  localStorage.setItem('theme', next);
});

// ── Hamburger menu ────────────────────────────────────────────────────────
const hamburger = document.getElementById('hamburger');
const navLinks  = document.getElementById('nav-links');
hamburger?.addEventListener('click', () => navLinks?.classList.toggle('open'));
navLinks?.querySelectorAll('.nav-link').forEach(l => {
  l.addEventListener('click', () => navLinks.classList.remove('open'));
});

// ── Active nav link on scroll ─────────────────────────────────────────────
const sections = document.querySelectorAll('section[id], header[id]');
const navItems = document.querySelectorAll('.nav-link');
const ioNav = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      navItems.forEach(n => n.classList.remove('active'));
      const match = document.querySelector(`.nav-link[href="#${e.target.id}"]`);
      if (match) match.classList.add('active');
    }
  });
}, { rootMargin: '-25% 0px -60% 0px' });
sections.forEach(s => ioNav.observe(s));

// ── Particle stars in Hero ────────────────────────────────────────────────
(function() {
  const wrap = document.getElementById('particles');
  if (!wrap) return;
  for (let i = 0; i < 55; i++) {
    const s = document.createElement('div');
    const size = Math.random() * 2.5 + .6;
    s.style.cssText = `position:absolute;border-radius:50%;
      width:${size}px;height:${size}px;
      background:rgba(255,255,255,${Math.random() * 0.45 + 0.15});
      top:${Math.random() * 100}%;left:${Math.random() * 100}%;
      animation:twinkle ${2 + Math.random() * 4}s ease-in-out ${Math.random() * 4}s infinite alternate`;
    wrap.appendChild(s);
  }
  const style = document.createElement('style');
  style.textContent = '@keyframes twinkle{from{opacity:.1;transform:scale(.8)}to{opacity:1;transform:scale(1)}}';
  document.head.appendChild(style);
})();

// ── Typing animation ──────────────────────────────────────────────────────
(function() {
  const el = document.getElementById('typing-text');
  if (!el) return;
  const phrases = [
    'Full-Stack Web Applications.',
    'Data Structures & Algorithms.',
    'AI & Machine Learning Solutions.',
    'Real-Time Cloud Systems.'
  ];
  let pi = 0, ci = 0, deleting = false;
  function tick() {
    const phrase = phrases[pi];
    if (!deleting) {
      el.textContent = phrase.slice(0, ++ci);
      if (ci === phrase.length) {
        deleting = true;
        setTimeout(tick, 2000);
        return;
      }
    } else {
      el.textContent = phrase.slice(0, --ci);
      if (ci === 0) {
        deleting = false;
        pi = (pi + 1) % phrases.length;
      }
    }
    setTimeout(tick, deleting ? 45 : 75);
  }
  tick();
})();

// ── Counter animation ─────────────────────────────────────────────────────
function animateCounter(el) {
  const target   = parseFloat(el.dataset.target);
  const suffix   = el.dataset.suffix || '';
  const decimals = parseInt(el.dataset.decimal || '0');
  const duration = 1600;
  const start    = performance.now();
  function update(now) {
    const p = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = (target * eased).toFixed(decimals) + suffix;
    if (p < 1) requestAnimationFrame(update);
    else el.textContent = target.toFixed(decimals) + suffix;
  }
  requestAnimationFrame(update);
}

// ── Scroll Reveal IntersectionObserver ────────────────────────────────────
const ioReveal = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('in-view');
      ioReveal.unobserve(e.target);
    }
  });
}, { threshold: 0.08 });

document.querySelectorAll('.reveal').forEach((el, i) => {
  el.style.transitionDelay = `${(i % 3) * 0.08}s`;
  ioReveal.observe(el);
});

const ioStats = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.querySelectorAll('.hstat-num[data-target]').forEach(animateCounter);
      ioStats.unobserve(e.target);
    }
  });
}, { threshold: 0.3 });
const statsRow = document.querySelector('.hero-stats-row');
if (statsRow) ioStats.observe(statsRow);

// ── Contact form handling ─────────────────────────────────────────────────
const form = document.getElementById('contact-form');
const note = document.getElementById('form-note');
if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('.form-submit');
    const originalBtn = btn.innerHTML;
    btn.textContent = 'Sending message…';
    btn.disabled = true;
    try {
      const data = new FormData(form);
      const res = await fetch(form.action, {
        method: 'POST',
        body: data,
        headers: { 'Accept': 'application/json' }
      });
      if (res.ok) {
        note.textContent = '✅ Message sent successfully! I will get back to you soon.';
        note.style.color = 'var(--green)';
        form.reset();
      } else {
        throw new Error();
      }
    } catch {
      note.textContent = '📧 Direct send: Please email kumkumrathee2@gmail.com';
      note.style.color = 'var(--orange)';
    }
    btn.innerHTML = originalBtn;
    btn.disabled = false;
  });
}

// ── Navbar scroll elevation ───────────────────────────────────────────────
window.addEventListener('scroll', () => {
  const nav = document.getElementById('navbar');
  if (nav) {
    nav.style.boxShadow = window.scrollY > 20 ? '0 6px 24px rgba(0,0,0,0.45)' : 'none';
  }
}, { passive: true });
