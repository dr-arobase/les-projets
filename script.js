/* ================================================
   @dr.arobase — un site construit avec de la
   souffrance, du café, et trop d anime
   ================================================ */

'use strict';

/* ── Shared mouse position ─────────────────────── */
let MX = -300, MY = -300;
document.addEventListener('mousemove', e => { MX = e.clientX; MY = e.clientY; });

/* ================================================
   CURSEUR DEUX PARTIES  (ring lent + dot précis)
   ================================================ */
const ring = document.querySelector('.custom-cursor');
const dot  = document.querySelector('.cursor-dot');

if (ring && dot) {
  let rx = -300, ry = -300;

  (function loop() {
    rx += (MX - rx) * 0.13;
    ry += (MY - ry) * 0.13;
    ring.style.left = rx + 'px';
    ring.style.top  = ry + 'px';
    dot.style.left  = MX + 'px';
    dot.style.top   = MY + 'px';
    requestAnimationFrame(loop);
  })();

  document.querySelectorAll('a, button, .project-card').forEach(el => {
    el.addEventListener('mouseenter', () => { ring.classList.add('active'); dot.classList.add('active'); });
    el.addEventListener('mouseleave', () => { ring.classList.remove('active'); dot.classList.remove('active'); });
  });

  document.addEventListener('mouseleave', () => { ring.style.opacity = '0'; dot.style.opacity = '0'; });
  document.addEventListener('mouseenter', () => { ring.style.opacity = '1'; dot.style.opacity = '1'; });
}

/* ================================================
   BARRE DE PROGRESSION DE SCROLL
   ================================================ */
const progressBar = document.querySelector('.scroll-progress');
window.addEventListener('scroll', () => {
  if (!progressBar) return;
  const pct = window.scrollY / (document.body.scrollHeight - window.innerHeight) * 100;
  progressBar.style.width = Math.min(pct, 100) + '%';
}, { passive: true });

/* ================================================
   PARTICULES INTELLIGENTES  (répulsion + lignes)
   ================================================ */
const canvas = document.getElementById('particles');
if (canvas) {
  const ctx = canvas.getContext('2d');
  let W, H;
  const resize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; };
  resize();
  window.addEventListener('resize', resize, { passive: true });

  const HUES = [180, 300, 270];
  const particles = Array.from({ length: 100 }, () => ({
    x:  Math.random() * window.innerWidth,
    y:  Math.random() * window.innerHeight,
    vx: (Math.random() - 0.5) * 0.35,
    vy: (Math.random() - 0.5) * 0.35,
    r:  Math.random() * 1.6 + 0.3,
    a:  Math.random() * 0.55 + 0.15,
    hue: HUES[Math.floor(Math.random() * HUES.length)],
  }));

  const REPEL_R = 130;

  (function draw() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => {
      const dx = p.x - MX, dy = p.y - MY;
      const d2 = dx * dx + dy * dy;
      if (d2 < REPEL_R * REPEL_R) {
        const d = Math.sqrt(d2);
        const force = (REPEL_R - d) / REPEL_R;
        p.vx += (dx / d) * force * 0.65;
        p.vy += (dy / d) * force * 0.65;
      }
      p.vx *= 0.97; p.vy *= 0.97;
      p.x = (p.x + p.vx + W) % W;
      p.y = (p.y + p.vy + H) % H;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.shadowBlur = 8;
      ctx.shadowColor = `hsla(${p.hue},100%,70%,0.7)`;
      ctx.fillStyle   = `hsla(${p.hue},100%,70%,${p.a})`;
      ctx.fill();
    });
    ctx.shadowBlur = 0;

    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const d  = Math.sqrt(dx * dx + dy * dy);
        if (d < 95) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(0,255,220,${0.09 * (1 - d / 95)})`;
          ctx.lineWidth   = 0.5;
          ctx.stroke();
        }
      }
    }
    requestAnimationFrame(draw);
  })();
}

/* ================================================
   TYPING — rotation de phrases
   ================================================ */
const typingEl = document.querySelector('.typing');
if (typingEl) {
  const phrases = [
    'projets étranges & CSS absurde',
    'développeur du chaos',
    'css psychopate certifié',
    'anime addict level 999',
    'collectionneur de bugs rares',
    'dormeur professionnel',
    'étudiant en informatique',
    'fait avec trop de café',
  ];
  let pi = 0, ci = 0, del = false;

  (function type() {
    const ph = phrases[pi];
    if (!del) {
      typingEl.textContent = ph.slice(0, ++ci);
      if (ci === ph.length) { del = true; setTimeout(type, 2400); return; }
      setTimeout(type, 55);
    } else {
      typingEl.textContent = ph.slice(0, --ci);
      if (ci === 0) { del = false; pi = (pi + 1) % phrases.length; setTimeout(type, 450); return; }
      setTimeout(type, 28);
    }
  })();
}

/* ================================================
   REVEAL AU SCROLL
   ================================================ */
const io = new IntersectionObserver(entries => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => entry.target.classList.add('revealed'), i * 75);
      io.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });
document.querySelectorAll('[data-reveal]').forEach(el => io.observe(el));

/* ================================================
   TILT 3D + SHEEN sur les cartes
   ================================================ */
document.querySelectorAll('.project-card:not(.project-card--soon)').forEach(card => {
  card.addEventListener('mousemove', e => {
    const r = card.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width  - 0.5;
    const y = (e.clientY - r.top)  / r.height - 0.5;
    card.style.transform = `perspective(700px) rotateX(${-y * 9}deg) rotateY(${x * 9}deg) translateY(-4px) scale(1.02)`;
    const px = ((e.clientX - r.left) / r.width  * 100).toFixed(1);
    const py = ((e.clientY - r.top)  / r.height * 100).toFixed(1);
    card.style.setProperty('--sheen-x', px + '%');
    card.style.setProperty('--sheen-y', py + '%');
  });
  card.addEventListener('mouseleave', () => { card.style.transform = ''; });
});

/* ================================================
   RIPPLE AU CLIC
   ================================================ */
document.querySelectorAll('.project-card:not(.project-card--soon)').forEach(card => {
  card.addEventListener('click', e => {
    const r   = card.getBoundingClientRect();
    const sz  = Math.max(r.width, r.height);
    const rip = document.createElement('span');
    rip.className = 'ripple';
    rip.style.cssText = `width:${sz}px;height:${sz}px;left:${e.clientX-r.left-sz/2}px;top:${e.clientY-r.top-sz/2}px`;
    card.appendChild(rip);
    rip.addEventListener('animationend', () => rip.remove());
  });
});

/* ================================================
   ICÔNES SOCIALES — MAGNÉTISME
   ================================================ */
document.querySelectorAll('.socials a').forEach(icon => {
  icon.addEventListener('mousemove', e => {
    const r = icon.getBoundingClientRect();
    const x = (e.clientX - r.left - r.width  / 2) * 0.4;
    const y = (e.clientY - r.top  - r.height / 2) * 0.4;
    icon.style.transform = `translate(${x}px,${y}px) scale(1.35)`;
  });
  icon.addEventListener('mouseleave', () => {
    icon.style.transition = 'transform 0.4s cubic-bezier(0.23,1,0.32,1)';
    icon.style.transform  = 'translate(0,0) scale(1)';
    setTimeout(() => icon.style.transition = '', 400);
  });
});

/* ================================================
   PARALLAXE — orbes suivent la souris
   ================================================ */
const orbs = document.querySelectorAll('.orb');
document.addEventListener('mousemove', e => {
  const cx = e.clientX / window.innerWidth  - 0.5;
  const cy = e.clientY / window.innerHeight - 0.5;
  orbs.forEach((orb, i) => {
    const d = (i + 1) * 22;
    orb.style.transform = `translate(${cx * d}px, ${cy * d}px)`;
  });
}, { passive: true });

/* ================================================
   BOUTONS MORTAL KOMBAT
   ================================================ */
// Couleurs ripple par variante
const MK_RIPPLE_COLORS = {
  'mk-btn--green':    'rgba(0,200,80,0.35)',
  'mk-btn--gold':     'rgba(255,200,0,0.35)',
  'mk-btn--blue':     'rgba(0,150,255,0.35)',
  'mk-btn--welcome':  'rgba(123,47,255,0.35)',
  'mk-btn--welcome21':'rgba(255,130,0,0.35)',
  'mk-btn--copa':     'rgba(255,50,180,0.35)',
};

document.querySelectorAll('.mk-btn').forEach(btn => {
  const audioId = btn.dataset.audio;
  const audio   = document.getElementById(audioId);
  if (!audio) return;

  btn.addEventListener('mouseenter', () => { ring?.classList.add('active'); dot?.classList.add('active'); });
  btn.addEventListener('mouseleave', () => { ring?.classList.remove('active'); dot?.classList.remove('active'); });

  btn.addEventListener('click', () => {
    if (!audio.paused) {
      audio.pause();
      audio.currentTime = 0;
      btn.classList.remove('playing');
      return;
    }
    // Stopper tous les autres avant
    document.querySelectorAll('.mk-btn').forEach(b => {
      const a = document.getElementById(b.dataset.audio);
      if (a && !a.paused) { a.pause(); a.currentTime = 0; }
      b.classList.remove('playing');
    });
    audio.currentTime = 0;
    audio.play().catch(() => {});
    btn.classList.add('playing');

    // Ripple coloré selon la variante
    const variant = [...btn.classList].find(c => c.startsWith('mk-btn--'));
    const rippleColor = MK_RIPPLE_COLORS[variant] || 'rgba(220,0,0,0.35)';
    const r   = btn.getBoundingClientRect();
    const sz  = Math.max(r.width, r.height);
    const rip = document.createElement('span');
    rip.className = 'ripple';
    rip.style.cssText = `width:${sz}px;height:${sz}px;left:${sz/-2+r.width/2}px;top:${sz/-2+r.height/2}px;background:${rippleColor}`;
    btn.appendChild(rip);
    rip.addEventListener('animationend', () => rip.remove());
  });

  audio.addEventListener('ended', () => { btn.classList.remove('playing'); });
});

/* ================================================
   AUDIO - débloque à la première interaction (bg)
   ================================================ */
// L'audio de fond n'est plus auto-lancé — contrôlé par le bouton MK

/* ================================================
   KONAMI CODE — easter egg
   ================================================ */
const KONAMI = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
let kpos = 0;

document.addEventListener('keydown', e => {
  kpos = (e.key === KONAMI[kpos]) ? kpos + 1 : 0;
  if (kpos === KONAMI.length) { kpos = 0; triggerKonami(); }
});

function triggerKonami() {
  const flash = document.createElement('div');
  flash.className = 'konami-flash';
  flash.textContent = 'ULTRA INSTINCT ACTIVATED';
  document.body.appendChild(flash);
  setTimeout(() => flash.remove(), 3500);

  for (let i = 0; i < 55; i++) {
    const sp = document.createElement('div');
    sp.className = 'konami-spark';
    sp.style.cssText = `left:${Math.random()*100}vw;top:${Math.random()*100}vh;--hue:${Math.floor(Math.random()*360)};animation-delay:${(Math.random()*0.6).toFixed(2)}s`;
    document.body.appendChild(sp);
    setTimeout(() => sp.remove(), 1800);
  }

  const av = document.querySelector('.avatar');
  if (av) {
    av.style.animation = 'rainbowBorder 0.5s linear 6, avatarPulse 3s ease-in-out infinite';
    setTimeout(() => { av.style.animation = 'avatarPulse 3s ease-in-out infinite'; }, 3100);
  }
}

/* ================================================
   COMPTEUR DE VISITES (localStorage)
   ================================================ */
const vc = document.getElementById('visit-count');
if (vc) {
  const n = (parseInt(localStorage.getItem('visits') || '0') + 1);
  localStorage.setItem('visits', n);
  vc.textContent = n.toLocaleString();
}
