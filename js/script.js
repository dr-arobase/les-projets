/* ================================================
   @dr.arobase — un site construit avec de la
   souffrance, du café, et trop d anime
   ================================================ */

'use strict';

/* ── Position de la souris (partagée par tout le fichier) ─ */
// On stock la position X/Y de la souris dans deux variables globales.
// Elles changent à chaque déplacement de souris.
let MX = -300, MY = -300;  // -300 = hors écran au départ (curseur caché)
document.addEventListener('mousemove', e => { MX = e.clientX; MY = e.clientY; });

/* ================================================
   CURSEUR DEUX PARTIES  (ring lent + dot précis)
   — .custom-cursor = anneau qui suit la souris avec
     un léger retard (lerp = interpolation linéaire).
   — .cursor-dot     = point collé immédiatement.
   ================================================ */
const ring = document.querySelector('.custom-cursor');
const dot  = document.querySelector('.cursor-dot');

if (ring && dot) {
  // Position actuelle du ring (commence hors écran)
  let rx = -300, ry = -300;

  (function loop() {
    // Lerp : on avance de 13 % de la distance restante chaque frame.
    // Plus c'est petit (ex. 0.05), plus le ring est lent.
    rx += (MX - rx) * 0.13;
    ry += (MY - ry) * 0.13;
    ring.style.left = rx + 'px';
    ring.style.top  = ry + 'px';
    // Le dot suit immédiatement (pas de lerp)
    dot.style.left  = MX + 'px';
    dot.style.top   = MY + 'px';
    // requestAnimationFrame appelle la fonction à chaque frame (~60 fps)
    requestAnimationFrame(loop);
  })();

  // Agrandit le ring au survol de liens/boutons/cartes
  document.querySelectorAll('a, button, .project-card').forEach(el => {
    el.addEventListener('mouseenter', () => { ring.classList.add('active'); dot.classList.add('active'); });
    el.addEventListener('mouseleave', () => { ring.classList.remove('active'); dot.classList.remove('active'); });
  });

  // Cache le curseur quand la souris quitte la fenêtre
  document.addEventListener('mouseleave', () => { ring.style.opacity = '0'; dot.style.opacity = '0'; });
  document.addEventListener('mouseenter', () => { ring.style.opacity = '1'; dot.style.opacity = '1'; });
}

/* ================================================
   BARRE DE PROGRESSION DE SCROLL
   — Calcule le % de page défilé et applique width.
   ================================================ */
const progressBar = document.querySelector('.scroll-progress');
globalThis.addEventListener('scroll', () => {
  if (!progressBar) return;
  // scrollY = pixels défilés | scrollHeight - innerHeight = max scrollable
  const pct = globalThis.scrollY / (document.body.scrollHeight - globalThis.innerHeight) * 100;
  progressBar.style.width = Math.min(pct, 100) + '%';
}, { passive: true }); // passive: true = ne bloque pas le scroll (perf)

/* ================================================
   PARTICULES INTELLIGENTES  (répulsion + lignes)
   — On dessine sur un <canvas> plein écran.
   — Chaque particule fuit la souris à moins de 130 px.
   — Les particules proches sont reliées par des lignes.
   ================================================ */
const canvas = document.getElementById('particles');
if (canvas) {
  const ctx = canvas.getContext('2d'); // '2d' = dessin 2D classique
  let W, H; // largeur et hauteur du canvas

  // Redimensionne le canvas si la fenêtre change de taille
  const resize = () => { W = canvas.width = globalThis.innerWidth; H = canvas.height = globalThis.innerHeight; };
  resize();
  globalThis.addEventListener('resize', resize, { passive: true });

  const HUES = [180, 300, 270]; // teintes HSL : cyan, rose, violet

  // Génère 100 particules avec des propriétés aléatoires
  const particles = Array.from({ length: 100 }, () => ({
    x:  Math.random() * globalThis.innerWidth,   // position X
    y:  Math.random() * globalThis.innerHeight,  // position Y
    vx: (Math.random() - 0.5) * 0.35,           // vitesse X (-0.175 à +0.175)
    vy: (Math.random() - 0.5) * 0.35,           // vitesse Y
    r:  Math.random() * 1.6 + 0.3,              // rayon (0.3 à 1.9 px)
    a:  Math.random() * 0.55 + 0.15,            // opacité
    hue: HUES[Math.floor(Math.random() * HUES.length)], // couleur aléatoire
  }));

  const REPEL_R = 130; // rayon de répulsion en pixels

  (function draw() {
    ctx.clearRect(0, 0, W, H); // efface le frame précédent

    particles.forEach(p => {
      // — Répulsion souris —
      const dx = p.x - MX, dy = p.y - MY;
      const d2 = dx * dx + dy * dy; // distance² (plus rapide que Math.sqrt)
      if (d2 < REPEL_R * REPEL_R) { // particule trop proche
        const d = Math.sqrt(d2);
        const force = (REPEL_R - d) / REPEL_R; // force 0→1 selon la distance
        p.vx += (dx / d) * force * 0.65; // pousse vers l'extérieur
        p.vy += (dy / d) * force * 0.65;
      }

      // Friction douce (0.97) pour éviter l'accélération infinie
      p.vx *= 0.97; p.vy *= 0.97;

      // Déplacement + boucle sur les bords (wrapping)
      p.x = (p.x + p.vx + W) % W;
      p.y = (p.y + p.vy + H) % H;

      // Dessine la particule
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.shadowBlur  = 8;
      ctx.shadowColor = `hsla(${p.hue},100%,70%,0.7)`;
      ctx.fillStyle   = `hsla(${p.hue},100%,70%,${p.a})`;
      ctx.fill();
    });
    ctx.shadowBlur = 0; // réinitialise l'ombre pour les lignes

    // Relie les particules proches par des lignes semi-transparentes
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const d  = Math.sqrt(dx * dx + dy * dy);
        if (d < 95) { // seulement si moins de 95 px
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          // Opacité décroissante selon la distance
          ctx.strokeStyle = `rgba(0,255,220,${0.09 * (1 - d / 95)})`;
          ctx.lineWidth   = 0.5;
          ctx.stroke();
        }
      }
    }
    requestAnimationFrame(draw); // boucle infinie
  })();
}

/* ================================================
   TYPING — rotation de phrases
   — Machine à états simple :
     del=false → on tape   |  del=true → on efface.
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
  let pi  = 0,     // index de la phrase courante
      ci  = 0,     // nombre de caractères affichés
      del = false; // true = on efface

  (function type() {
    const ph = phrases[pi]; // phrase courante
    if (!del) {
      // Mode frappe : ajoute un caractère
      typingEl.textContent = ph.slice(0, ++ci);
      if (ci === ph.length) { del = true; setTimeout(type, 2400); return; } // pause avant d'effacer
      setTimeout(type, 55);
    } else {
      // Mode effacement : retire un caractère
      typingEl.textContent = ph.slice(0, --ci);
      if (ci === 0) { del = false; pi = (pi + 1) % phrases.length; setTimeout(type, 450); return; }
      setTimeout(type, 28); // effacement plus rapide que la frappe
    }
  })();
}

/* ================================================
   REVEAL AU SCROLL
   — IntersectionObserver observe quand un élément
     entre dans le viewport. threshold: 0.1 = dès
     que 10 % de l'élément est visible, on l'anime.
   ================================================ */
const io = new IntersectionObserver(entries => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      // Délai progressif si plusieurs éléments arrivent ensemble
      setTimeout(() => entry.target.classList.add('revealed'), i * 75);
      io.unobserve(entry.target); // arrêt de l'observation (animation unique)
    }
  });
}, { threshold: 0.1 });
document.querySelectorAll('[data-reveal]').forEach(el => io.observe(el));

/* ================================================
   TILT 3D + SHEEN sur les cartes
   — x/y = position de la souris relative à la carte,
     normalisée de -0.5 (bord gauche) à +0.5 (droit).
   — On applique rotateX/Y proportionnellement.
   ================================================ */
document.querySelectorAll('.project-card:not(.project-card--soon)').forEach(card => {
  card.addEventListener('mousemove', e => {
    const r = card.getBoundingClientRect(); // taille et position de la carte
    const x = (e.clientX - r.left) / r.width  - 0.5; // -0.5 à +0.5
    const y = (e.clientY - r.top)  / r.height - 0.5;
    // Rotation max 9° sur chaque axe
    card.style.transform = `perspective(700px) rotateX(${-y * 9}deg) rotateY(${x * 9}deg) translateY(-4px) scale(1.02)`;
    // Coordonnées du reflet (utilisées par --sheen-x/--sheen-y en CSS)
    const px = ((e.clientX - r.left) / r.width  * 100).toFixed(1);
    const py = ((e.clientY - r.top)  / r.height * 100).toFixed(1);
    card.style.setProperty('--sheen-x', px + '%');
    card.style.setProperty('--sheen-y', py + '%');
  });
  card.addEventListener('mouseleave', () => { card.style.transform = ''; }); // réinitialise
});

/* ================================================
   RIPPLE AU CLIC
   — Crée un <span class="ripple"> centré sur le clic.
   — L'animation CSS le fait s'étendre puis disparaître.
   ================================================ */
document.querySelectorAll('.project-card:not(.project-card--soon)').forEach(card => {
  card.addEventListener('click', e => {
    const r   = card.getBoundingClientRect();
    const sz  = Math.max(r.width, r.height); // taille du cercle
    const rip = document.createElement('span');
    rip.className = 'ripple';
    // Centre le span sur la position du clic
    rip.style.cssText = `width:${sz}px;height:${sz}px;left:${e.clientX-r.left-sz/2}px;top:${e.clientY-r.top-sz/2}px`;
    card.appendChild(rip);
    rip.addEventListener('animationend', () => rip.remove()); // nettoyage auto après animation
  });
});

/* ================================================
   ICÔNES SOCIALES — MAGNÉTISME
   — L'icône attire légèrement vers la souris (40 %),
     puis revient avec une transition "rebond" fluide.
   ================================================ */
document.querySelectorAll('.socials a').forEach(icon => {
  icon.addEventListener('mousemove', e => {
    const r = icon.getBoundingClientRect();
    // Décalage = (souris - centre de l'icône) * 40 %
    const x = (e.clientX - r.left - r.width  / 2) * 0.4;
    const y = (e.clientY - r.top  - r.height / 2) * 0.4;
    icon.style.transform = `translate(${x}px,${y}px) scale(1.35)`;
  });
  icon.addEventListener('mouseleave', () => {
    icon.style.transition = 'transform 0.4s cubic-bezier(0.23,1,0.32,1)'; // retour "rebond"
    icon.style.transform  = 'translate(0,0) scale(1)';
    setTimeout(() => icon.style.transition = '', 400); // réinitialise la transition
  });
});

/* ================================================
   PARALLAXE — orbes suivent la souris
   — cx/cy valent de -0.5 à +0.5 selon la position
     de la souris dans la fenêtre.
   — Chaque orbe se décale d'un montant différent
     pour créer un effet de profondeur.
   ================================================ */
const orbs = document.querySelectorAll('.orb');
document.addEventListener('mousemove', e => {
  const cx = e.clientX / globalThis.innerWidth  - 0.5; // -0.5 à +0.5
  const cy = e.clientY / globalThis.innerHeight - 0.5;
  orbs.forEach((orb, i) => {
    const d = (i + 1) * 22; // décalage : 22px, 44px, 66px (profondeur)
    orb.style.transform = `translate(${cx * d}px, ${cy * d}px)`;
  });
}, { passive: true });

/* ================================================
   BOUTONS MORTAL KOMBAT
   — Chaque bouton joue un son unique (data-audio).
   — Cliquer sur un bouton déjà actif l'arrête.
   — La couleur du ripple dépend de la variante CSS.
   ================================================ */
// Table de correspondance : classe CSS → couleur de ripple
const MK_RIPPLE_COLORS = {
  'mk-btn--green':    'rgba(0,200,80,0.35)',
  'mk-btn--gold':     'rgba(255,200,0,0.35)',
  'mk-btn--blue':     'rgba(0,150,255,0.35)',
  'mk-btn--welcome':  'rgba(123,47,255,0.35)',
  'mk-btn--welcome21':'rgba(255,130,0,0.35)',
  'mk-btn--copa':     'rgba(255,50,180,0.35)',
};

document.querySelectorAll('.mk-btn').forEach(btn => {
  const audioId = btn.dataset.audio; // récupère l'id depuis data-audio="..."
  const audio   = document.getElementById(audioId);
  if (!audio) return; // pas d'audio = on saute

  // Agrandit le curseur au survol
  btn.addEventListener('mouseenter', () => { ring?.classList.add('active'); dot?.classList.add('active'); });
  btn.addEventListener('mouseleave', () => { ring?.classList.remove('active'); dot?.classList.remove('active'); });

  btn.addEventListener('click', () => {
    if (!audio.paused) {
      // Déjà en lecture → on arrête
      audio.pause();
      audio.currentTime = 0;
      btn.classList.remove('playing');
      return;
    }

    // Stoppe tous les autres sons avant de jouer celui-ci
    document.querySelectorAll('.mk-btn').forEach(b => {
      const a = document.getElementById(b.dataset.audio);
      if (a && !a.paused) { a.pause(); a.currentTime = 0; }
      b.classList.remove('playing');
    });

    audio.currentTime = 0;
    audio.play().catch(() => {}); // .catch() évite une erreur si l'audio est bloqué
    btn.classList.add('playing'); // déclenche l'animation mkPulse en CSS

    // Ripple coloré centré sur le bouton
    const variant    = [...btn.classList].find(c => c.startsWith('mk-btn--'));
    const rippleColor = MK_RIPPLE_COLORS[variant] || 'rgba(220,0,0,0.35)';
    const r   = btn.getBoundingClientRect();
    const sz  = Math.max(r.width, r.height);
    const rip = document.createElement('span');
    rip.className = 'ripple';
    rip.style.cssText = `width:${sz}px;height:${sz}px;left:${sz/-2+r.width/2}px;top:${sz/-2+r.height/2}px;background:${rippleColor}`;
    btn.appendChild(rip);
    rip.addEventListener('animationend', () => rip.remove());
  });

  // Retire .playing quand la piste se termine naturellement
  audio.addEventListener('ended', () => { btn.classList.remove('playing'); });
});

/* ================================================
   AUDIO - débloque à la première interaction (bg)
   ================================================ */
// L'audio de fond n'est plus auto-lancé — contrôlé par le bouton MK

/* ================================================
   KONAMI CODE — easter egg
   — Secrètement, tape ↑↑↓↓←→←→ B A pour activer !
   — kpos suit ton avancement dans la séquence.
   ================================================ */
const KONAMI = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
let kpos = 0; // 0 = début de la séquence

document.addEventListener('keydown', e => {
  // Bonne touche → avance. Mauvaise touche → repart à 0.
  kpos = (e.key === KONAMI[kpos]) ? kpos + 1 : 0;
  if (kpos === KONAMI.length) { kpos = 0; triggerKonami(); } // séquence complète !
});

function triggerKonami() {
  // Flash "ULTRA INSTINCT" au centre de l'écran
  const flash = document.createElement('div');
  flash.className = 'konami-flash';
  flash.textContent = 'ULTRA INSTINCT ACTIVATED';
  document.body.appendChild(flash);
  setTimeout(() => flash.remove(), 3500); // disparait après 3.5 s

  // 55 étincelles colorées à des positions aléatoires
  for (let i = 0; i < 55; i++) {
    const sp = document.createElement('div');
    sp.className = 'konami-spark';
    // --hue est une propriété CSS personnalisée utilisée par @keyframes sparkFly
    sp.style.cssText = `left:${Math.random()*100}vw;top:${Math.random()*100}vh;--hue:${Math.floor(Math.random()*360)};animation-delay:${(Math.random()*0.6).toFixed(2)}s`;
    document.body.appendChild(sp);
    setTimeout(() => sp.remove(), 1800);
  }

  // Avatar arc-en-ciel 3 secondes puis retour à l'animation normale
  const av = document.querySelector('.avatar');
  if (av) {
    av.style.animation = 'rainbowBorder 0.5s linear 6, avatarPulse 3s ease-in-out infinite';
    setTimeout(() => { av.style.animation = 'avatarPulse 3s ease-in-out infinite'; }, 3100);
  }
}

/* ================================================
   BOUTON AIZEN — Kyōka Suigetsu
   — Fond noir total + texte lettre par lettre + chroma key canvas.
   — Vidéo fond vert : le vert est rendu transparent, le noir de l'overlay s'affiche derrière.
   — Esc ou le bouton ✕ ferment l'overlay.
   ================================================ */
const btnAizen     = document.getElementById('btnAizen');
const aizenOverlay = document.getElementById('aizen-overlay');
const aizenVideo   = document.getElementById('aizenVideo');
const aizenClose   = document.getElementById('aizenClose');

// Canvas pour le chroma key (fond vert → transparent)
const aizenCanvas  = document.getElementById('aizenCanvas');
const aizenCtx     = aizenCanvas
  ? aizenCanvas.getContext('2d', { willReadFrequently: true }) // willReadFrequently = optimise getImageData
  : null;
let   aizenRafId   = 0; // ID de requestAnimationFrame (pour pouvoir l'annuler)

/* startChroma() — démarre la boucle chroma key (fond vert → transparent)
   Nous supprimons le texte et les shards par demande de l'utilisateur. */
const startChroma = () => {
  if (!aizenCtx) return;
  let detectedSrcCrop = null; // { x, y, w, h } in video pixel coords (to remove encoded black bars)

  const detectBlackBars = (vw, vh) => {
    try {
      const dw = 320; // downscale for fast analysis
      const dh = Math.max(8, Math.round(dw * vh / vw));
      const dCanvas = document.createElement('canvas');
      dCanvas.width = dw; dCanvas.height = dh;
      const dCtx = dCanvas.getContext('2d');
      dCtx.drawImage(aizenVideo, 0, 0, dw, dh);

      const rowThreshold = 12; // pixel brightness threshold (0-255)
      const data = dCtx.getImageData(0, 0, dw, dh).data;

      const isRowDark = (ry) => {
        let sum = 0;
        const offset = ry * dw * 4;
        for (let x = 0; x < dw; x++) {
          const i = offset + x * 4;
          sum += (data[i] + data[i + 1] + data[i + 2]) / 3;
        }
        const avg = sum / dw;
        return avg < rowThreshold;
      };

      let top = 0, bottom = dh - 1;
      while (top < dh && isRowDark(top)) top++;
      while (bottom > 0 && isRowDark(bottom)) bottom--;

      // If too small crop, ignore
      if (top === 0 && bottom === dh - 1) return { x: 0, y: 0, w: vw, h: vh };

      const topRatio = top / dh;
      const bottomRatio = (dh - 1 - bottom) / dh;
      const srcY = Math.round(topRatio * vh);
      const srcH = Math.round((1 - topRatio - bottomRatio) * vh);
      return { x: 0, y: srcY, w: vw, h: Math.max(2, srcH) };
    } catch (_err) {
      return { x: 0, y: 0, w: vw, h: vh };
    }
  };

  const startRender = () => {
    // Canvas = résolution de l'écran (pas de la vidéo) pour couvrir tout l'écran
    aizenCanvas.width  = globalThis.innerWidth;
    aizenCanvas.height = globalThis.innerHeight;
    aizenCanvas.classList.add('visible');
    // Overlay interactable + bouton visible seulement quand la vidéo joue
    aizenOverlay.classList.add('video-playing');
    // Chroma key thresholds (agressif pour retirer le maximum de vert)
    const KEY_MIN   = 30;  // valeur minimale du canal vert pour être considéré
    const KEY_RATIO = 1.1; // le vert doit dominer rouge et bleu d'au moins 10 %
    // Detect black bars once when metadata available
    const vw = aizenVideo.videoWidth || 1;
    const vh = aizenVideo.videoHeight || 1;
    detectedSrcCrop = detectBlackBars(vw, vh);

    // Ensure crop is sane
    if (!detectedSrcCrop || detectedSrcCrop.w <= 0 || detectedSrcCrop.h <= 0) {
      detectedSrcCrop = { x: 0, y: 0, w: vw, h: vh };
    }

    const chromaRender = () => {
      if (!aizenVideo.paused && !aizenVideo.ended) {
        // Cover mode : étire la vidéo pour remplir tout le canvas sans barres noires
        const cw = aizenCanvas.width, ch = aizenCanvas.height;
        // Start from detected source crop (removes encoded black bars)
        let sx = detectedSrcCrop.x, sy = detectedSrcCrop.y, sw = detectedSrcCrop.w, sh = detectedSrcCrop.h;

        // Now apply cover logic on the source crop vs canvas aspect ratio
        const srcRatio = sw / sh;
        const canvasRatio = cw / ch;
        if (srcRatio > canvasRatio) {
          // source wider -> crop sides
          const newSw = Math.round(sh * canvasRatio);
          sx = sx + Math.round((sw - newSw) / 2);
          sw = newSw;
        } else if (srcRatio < canvasRatio) {
          // source taller -> crop top/bottom
          const newSh = Math.round(sw / canvasRatio);
          sy = sy + Math.round((sh - newSh) / 2);
          sh = newSh;
        }

        // Draw the selected source rect to fill the canvas (cover)
        aizenCtx.drawImage(aizenVideo, sx, sy, sw, sh, 0, 0, cw, ch);

        const imgData = aizenCtx.getImageData(0, 0, aizenCanvas.width, aizenCanvas.height);
        const d = imgData.data;

        for (let i = 0; i < d.length; i += 4) {
          const r = d[i], g = d[i + 1], b = d[i + 2];

          // Chroma key : vert dominant → transparent
          if (g > KEY_MIN && g > r * KEY_RATIO && g > b * KEY_RATIO) {
            d[i + 3] = 0;
          } else {
            // Spill suppression : pixels légèrement verts → neutraliser sans effacer
            if (g > r && g > b) {
              const avg = (r + b) / 2;
              d[i + 1] = Math.round(avg * 0.85 + g * 0.15);
            }
          }
        }

        aizenCtx.putImageData(imgData, 0, 0);
      }
      if (!aizenVideo.ended) aizenRafId = requestAnimationFrame(chromaRender);
    };

    aizenVideo.currentTime = 0;
    aizenVideo.play().catch(() => {});
    aizenRafId = requestAnimationFrame(chromaRender);
  };
};

const openAizen = () => {
  // Arrête tous les sons MK en cours
  document.querySelectorAll('.mk-btn').forEach(b => {
    const a = document.getElementById(b.dataset.audio);
    if (a && !a.paused) { a.pause(); a.currentTime = 0; }
    b.classList.remove('playing');
  });

  // Active le fond noir
  aizenOverlay.classList.add('active');
  // title removed per user request
  aizenCanvas.classList.remove('visible');
  // Nettoie le canvas de la session précédente
  cancelAnimationFrame(aizenRafId);
  if (aizenCtx) aizenCtx.clearRect(0, 0, aizenCanvas.width, aizenCanvas.height);

  // Start chroma key immediately (no shards, no title)
  startChroma();
};

const closeAizen = () => {
  aizenOverlay.classList.remove('active');
  aizenOverlay.classList.remove('video-playing');
  // Arrête la boucle chroma key
  cancelAnimationFrame(aizenRafId);
  aizenVideo.pause();
  aizenVideo.currentTime = 0;
  aizenCanvas.classList.remove('visible');
  if (aizenCtx) aizenCtx.clearRect(0, 0, aizenCanvas.width, aizenCanvas.height);
  // Nettoie les éclats CSS si visible pendant la fermeture
  const shatterEl = document.getElementById('aizen-shatter');
  if (shatterEl) shatterEl.innerHTML = '';
};

if (btnAizen && aizenOverlay) {
  btnAizen.addEventListener('click', openAizen);
  aizenClose.addEventListener('click', closeAizen);
  if (aizenVideo) aizenVideo.addEventListener('ended', closeAizen);

  // Fermer aussi au clic sur le fond noir (hors vidéo et titre)
  aizenOverlay.addEventListener('click', e => {
    if (e.target === aizenOverlay) closeAizen();
  });

  // Fermer avec Échap
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && aizenOverlay.classList.contains('active')) closeAizen();
  });
}

/* ================================================
   SECTION 21 — COMPTEUR DE VISITES
   — localStorage = mini-stockage dans le navigateur.
   — Il persiste après fermeture (pas de serveur).
   — ATTENTION : c'est local, pas un vrai compteur global.
   ================================================ */
const vc = document.getElementById('visit-count');
if (vc) {
  // Lit le ancien nombre, ajoute 1, sauvegarde, affiche
  const n = (parseInt(localStorage.getItem('visits') || '0') + 1);
  localStorage.setItem('visits', n);
  vc.textContent = n.toLocaleString(); // ex: 1 234 avec séparateur
}
