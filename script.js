'use strict';

// Evita que otra web muestre esta página dentro de un iframe (clickjacking)
if (window.top !== window.self) {
  try { window.top.location.replace(window.self.location.href); }
  catch { document.documentElement.hidden = true; }
}

// Completá estos datos y se actualizan en toda la página.
const CONFIG = {
  email: 'avanth.studio@gmail.com',
  whatsapp: '5491160342441',          // solo números con código de país
  whatsappLabel: '+54 9 11 6034-2441',
  whatsappMessage: 'Hola Avanth! Quiero consultar por un proyecto.',
  social: {
    instagram: 'https://www.instagram.com/avanth.studio/',
    linkedin: '',
    github: ''
  },
  // Estadísticas del panel admin (admin.html): se configuran en analytics-config.js
  analytics: window.AVANTH_ANALYTICS || {},
  // Reels automáticos: link del feed JSON de Behold (behold.so → conectar Instagram → JSON feed).
  // Con el feed configurado, los reels nuevos aparecen solos en la página.
  instagramFeed: '',
  instagramMaxReels: 12,
  // Reels manuales (se usan si no hay feed o si el feed falla).
  // Pegá el link de cada reel (Instagram → reel → ··· → Copiar enlace), el más nuevo primero.
  instagramReels: [
    'https://www.instagram.com/p/De2gIWYgSE-/',
    'https://www.instagram.com/p/DfFv43_Jvxt/',
    'https://www.instagram.com/p/DfFnDv7pjLL/',
    'https://www.instagram.com/p/DfA7-6VJ1JX/',
    'https://www.instagram.com/p/De-n9ucJ2j6/',
    'https://www.instagram.com/p/De7Vl7fJjk7/',
    'https://www.instagram.com/p/De7JRmgpWrA/',
    'https://www.instagram.com/p/De5Qca5pcmD/',
    'https://www.instagram.com/p/De5Cnx8Jp64/',
  ]
};

// Solo se aceptan datos con formato válido, por si alguien edita CONFIG por error
const isPhone = (v) => /^\d{8,15}$/.test(v);
const isEmail = (v) => /^[^\s@<>"']+@[^\s@<>"']+\.[a-z]{2,}$/i.test(v);
const isSafeUrl = (v) => {
  try { return new URL(v).protocol === 'https:'; } catch { return false; }
};
if (!isPhone(CONFIG.whatsapp)) CONFIG.whatsapp = '';
if (!isEmail(CONFIG.email)) CONFIG.email = '';

// Links de contacto
const waUrl = CONFIG.whatsapp
  ? `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(CONFIG.whatsappMessage)}`
  : '#contacto';

document.querySelectorAll('[data-whatsapp]').forEach((a) => {
  a.href = waUrl;
  a.dataset.track = 'WhatsApp';
  if (CONFIG.whatsapp) {
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
  }
});
document.querySelectorAll('[data-whatsapp-text]').forEach((el) => {
  if (CONFIG.whatsappLabel) el.textContent = CONFIG.whatsappLabel;
});

document.querySelectorAll('[data-email]').forEach((a) => {
  a.dataset.track = 'Email';
  a.href = CONFIG.email ? `mailto:${CONFIG.email}` : '#contacto';
});
document.querySelectorAll('[data-email-text]').forEach((el) => {
  if (CONFIG.email) el.textContent = CONFIG.email;
});

document.querySelectorAll('[data-social]').forEach((a) => {
  const url = CONFIG.social[a.dataset.social];
  if (url && isSafeUrl(url)) {
    a.href = url;
  } else {
    a.remove();
  }
});

// Reels de Instagram: usa el embed oficial de Instagram
const reelRows = document.getElementById('reel-rows');
const cleanReelUrl = (url) => url.trim().split('?')[0].replace(/\/?$/, '/');
const isReelUrl = (url) => /^https:\/\/(www\.)?instagram\.com\/(reel|reels|p)\/[\w-]+\/$/.test(url);

function makeReel(url) {
  const reel = document.createElement('div');
  reel.className = 'reel';
  const embed = document.createElement('blockquote');
  embed.className = 'instagram-media';
  embed.dataset.instgrmPermalink = url;
  embed.dataset.instgrmVersion = '14';
  const link = document.createElement('a');
  link.href = url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.textContent = 'Ver este reel en Instagram';
  embed.append(link);
  reel.append(embed);
  return reel;
}

// Dos filas que corren en sentidos opuestos; cada fila se duplica para que el loop no tenga cortes
function renderReels(urls) {
  reelRows.textContent = '';
  if (!urls.length) {
    reelRows.innerHTML = `<div class="container"><div class="reel-empty">Mirá todos nuestros reels en
      <a href="${CONFIG.social.instagram}" target="_blank" rel="noopener noreferrer">@avanth.studio</a></div></div>`;
    return;
  }
  const rows = urls.length >= 4
    ? [urls.filter((_, i) => i % 2 === 0), urls.filter((_, i) => i % 2 === 1)]
    : [urls];
  rows.forEach((rowUrls, r) => {
    // Con pocos reels se repiten, así la fila siempre es más ancha que la pantalla
    let items = rowUrls;
    while (items.length < 5) items = items.concat(rowUrls);

    const row = document.createElement('div');
    row.className = r % 2 ? 'reel-row reverse' : 'reel-row';
    const track = document.createElement('div');
    track.className = 'reel-track';
    track.style.setProperty('--reel-duration', `${items.length * 9}s`);
    [false, true].forEach((clone) => {
      const group = document.createElement('div');
      group.className = 'reel-group';
      if (clone) group.setAttribute('aria-hidden', 'true');
      items.forEach((url) => group.append(makeReel(url)));
      track.append(group);
    });
    row.append(track);
    reelRows.append(row);
  });
  if (window.instgrm) {
    window.instgrm.Embeds.process();
  } else {
    const igScript = document.createElement('script');
    igScript.src = 'https://www.instagram.com/embed.js';
    igScript.async = true;
    document.body.append(igScript);
  }
}

const manualReels = CONFIG.instagramReels.map(cleanReelUrl).filter(isReelUrl);

async function loadFeedReels() {
  const res = await fetch(CONFIG.instagramFeed);
  if (!res.ok) throw new Error(`Feed de Instagram: ${res.status}`);
  const data = await res.json();
  const posts = Array.isArray(data) ? data : data.posts || [];
  return posts
    .filter((post) => post.mediaType === 'VIDEO' || /\/reels?\//.test(post.permalink || ''))
    .map((post) => cleanReelUrl(post.permalink || ''))
    .filter(isReelUrl);
}

if (CONFIG.instagramFeed) {
  loadFeedReels()
    .then((urls) => renderReels((urls.length ? urls : manualReels).slice(0, CONFIG.instagramMaxReels)))
    .catch(() => renderReels(manualReels.slice(0, CONFIG.instagramMaxReels)));
} else {
  renderReels(manualReels.slice(0, CONFIG.instagramMaxReels));
}

// Menú mobile
const toggle = document.querySelector('.nav-toggle');
const links = document.getElementById('nav-links');

toggle.addEventListener('click', () => {
  const open = links.classList.toggle('open');
  toggle.setAttribute('aria-expanded', String(open));
  toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
});
links.querySelectorAll('a').forEach((a) => {
  a.addEventListener('click', () => {
    links.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Abrir menú');
  });
});

// Formulario: arma el mensaje y lo abre en WhatsApp o en el mail
const form = document.getElementById('contact-form');
const SERVICIOS = [...form.elements.servicio.options].map((o) => o.value);
const SEND_COOLDOWN = 30000; // ms entre envíos, para frenar spam
let lastSent = 0;

// Quita caracteres de control e invisibles, espacios de más, y corta al largo máximo
const clean = (v, max) => String(v || '')
  .replace(/[\u0000-\u0008\u000B-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E\u2066-\u2069]/g, '')
  .replace(/[ \t]+$/gm, '')
  .trim()
  .slice(0, max);

form.addEventListener('submit', (e) => {
  e.preventDefault();
  if (!form.reportValidity()) return;

  const data = new FormData(form);
  // Si el campo trampa vino completo, es un bot: no se envía nada
  if (data.get('website')) return;

  const now = Date.now();
  if (now - lastSent < SEND_COOLDOWN) {
    alert('Ya enviaste un mensaje. Esperá unos segundos antes de volver a intentar.');
    return;
  }

  const nombre = clean(data.get('nombre'), 80).replace(/\s+/g, ' ');
  const email = clean(data.get('email'), 120);
  const servicio = SERVICIOS.includes(data.get('servicio')) ? data.get('servicio') : 'Otro';
  const mensaje = clean(data.get('mensaje'), 2000);

  if (!nombre || !isEmail(email) || !mensaje) {
    alert('Revisá los datos del formulario.');
    return;
  }
  lastSent = now;

  const text =
    `Hola! Soy ${nombre} (${email}).\n` +
    `Me interesa: ${servicio}.\n\n` +
    `${mensaje}`;

  if (CONFIG.whatsapp) {
    window.open(`https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  } else if (CONFIG.email) {
    const subject = `Consulta: ${servicio}`;
    window.location.href = `mailto:${CONFIG.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
  } else {
    alert('Configurá tu email o WhatsApp en script.js para recibir mensajes.');
  }
});

// Tarjetas de servicios: cada fila entra desde un lado distinto
const slideCards = [...document.querySelectorAll('.card.slide')];

function assignSlideDirections() {
  const rows = [];
  slideCards.forEach((card) => {
    let row = rows.find((r) => Math.abs(r.top - card.offsetTop) < 4);
    if (!row) {
      row = { top: card.offsetTop, cards: [] };
      rows.push(row);
    }
    row.cards.push(card);
  });
  rows.sort((a, b) => a.top - b.top).forEach((row, i) => {
    const fromRight = i % 2 === 0;
    // La primera tarjeta en moverse es la más cercana al lado de entrada
    const ordered = fromRight ? [...row.cards].reverse() : row.cards;
    ordered.forEach((card, j) => {
      card.classList.toggle('from-right', fromRight);
      card.classList.toggle('from-left', !fromRight);
      card.style.transitionDelay = card.classList.contains('visible') ? '' : `${j * 0.12}s`;
    });
  });
}

assignSlideDirections();
window.addEventListener('resize', assignSlideDirections);

// "Ideas que avanzan": selecciona la palabra, la borra y escribe un sinónimo
const swap = document.querySelector('.word-swap');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (swap && !reduceMotion) {
  const textEl = swap.querySelector('.word-swap-text');
  const words = swap.dataset.words.split(',');
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  let i = 0;

  (async function loop() {
    for (;;) {
      await sleep(2200);              // la palabra queda visible
      swap.classList.add('selected'); // se selecciona en azul
      await sleep(900);
      textEl.textContent = '';        // se borra
      swap.classList.remove('selected');
      swap.classList.add('typing');
      await sleep(250);

      i = (i + 1) % words.length;
      for (const ch of words[i]) {    // se escribe el sinónimo
        textEl.textContent += ch;
        await sleep(90);
      }
      swap.classList.remove('typing');
    }
  })();
}

// Portada: el navegador muestra proyectos reales y el flujo de un lead se anima en loop
const heroVisual = document.querySelector('.hero-visual');

if (heroVisual && getComputedStyle(heroVisual).display !== 'none') {
  const screens = [...heroVisual.querySelectorAll('.browser-screen')];
  const urlText = heroVisual.querySelector('.browser-url-text');
  const lead = heroVisual.querySelector('.flow-lead');
  const steps = heroVisual.querySelectorAll('.flow-step');
  const flowLinks = heroVisual.querySelectorAll('.flow-link');
  const termCmd = heroVisual.querySelector('.term-cmd');
  const termLines = heroVisual.querySelectorAll('.term-line');
  const notif = heroVisual.querySelector('.notif');
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  let screenIndex = 0;

  const showScreen = (i) => {
    screens.forEach((v, j) => {
      v.classList.toggle('active', j === i);
      if (j === i) { v.currentTime = 0; v.play().catch(() => {}); } else { v.pause(); }
    });
    urlText.style.opacity = 0;
    setTimeout(() => { urlText.textContent = screens[i].dataset.url; urlText.style.opacity = 1; }, 300);
  };

  const finalState = () => {
    lead.classList.add('on');
    steps.forEach((s) => s.classList.add('done'));
    flowLinks.forEach((l) => l.classList.add('on'));
    termCmd.textContent = 'deploy --prod';
    termLines.forEach((l) => l.classList.add('on'));
    notif.classList.add('on');
  };

  if (reduceMotion) {
    finalState();
  } else {
    showScreen(0);
    (async function heroLoop() {
      for (;;) {
        lead.classList.remove('on');
        notif.classList.remove('on');
        steps.forEach((s) => s.classList.remove('active', 'done'));
        flowLinks.forEach((l) => l.classList.remove('on'));
        termCmd.textContent = '';
        termLines.forEach((l) => l.classList.remove('on'));
        await wait(600);

        lead.classList.add('on');                       // llega un lead nuevo
        for (const ch of 'deploy --prod') { termCmd.textContent += ch; await wait(55); }
        for (let i = 0; i < steps.length; i++) {        // recorre el flujo paso a paso
          steps[i].classList.add('active');
          await wait(800);
          steps[i].classList.replace('active', 'done');
          termLines[i]?.classList.add('on');
          if (flowLinks[i]) { flowLinks[i].classList.add('on'); await wait(500); }
        }
        notif.classList.add('on');                      // respuesta enviada
        await wait(3800);

        screenIndex = (screenIndex + 1) % screens.length;
        showScreen(screenIndex);
      }
    })();

    // Las tarjetas siguen un poco al mouse
    const layers = heroVisual.querySelectorAll('.hv-layer');
    document.querySelector('.hero').addEventListener('pointermove', (e) => {
      const x = e.clientX / window.innerWidth - 0.5;
      const y = e.clientY / window.innerHeight - 0.5;
      layers.forEach((l) => {
        const d = Number(l.dataset.depth);
        l.style.transform = `translate(${-x * d}px, ${-y * d}px)`;
      });
    });
  }
}

// Animación al hacer scroll
const revealEls = document.querySelectorAll('.reveal, .card.slide');

if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const el = entry.target;
        el.classList.add('visible');
        io.unobserve(el);
        // Sin demora después de entrar, así el hover responde al instante
        if (el.classList.contains('slide')) {
          el.addEventListener('transitionend', () => { el.style.transitionDelay = ''; }, { once: true });
        }
      }
    });
  }, { threshold: 0.12 });
  revealEls.forEach((el) => io.observe(el));
} else {
  revealEls.forEach((el) => el.classList.add('visible'));
}

// Videos de proyectos: se reproducen solo cuando están en pantalla
const projectVideos = document.querySelectorAll('.project-media video');
const visibleVideos = new Set();

if (projectVideos.length && 'IntersectionObserver' in window) {
  const vio = new IntersectionObserver((entries) => {
    entries.forEach(({ target, isIntersecting }) => {
      if (isIntersecting) { visibleVideos.add(target); target.play().catch(() => {}); }
      else { visibleVideos.delete(target); target.pause(); }
    });
  }, { threshold: 0.25 });
  projectVideos.forEach((v) => vio.observe(v));
}

// "Ver todos" muestra el resto de los proyectos
const projectsToggle = document.querySelector('.projects-toggle');
const extraProjects = document.querySelectorAll('.project-extra');

projectsToggle.addEventListener('click', () => {
  const open = projectsToggle.getAttribute('aria-expanded') !== 'true';
  extraProjects.forEach((el) => { el.hidden = !open; });
  projectsToggle.setAttribute('aria-expanded', open);
  projectsToggle.firstChild.textContent = open ? 'Ver menos ' : 'Ver todos ';
  projectsToggle.querySelector('svg').style.transform = open ? 'rotate(-90deg)' : '';
  if (open) extraProjects[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
});

// Al hacer clic en un video se abre en grande
const videoModal = document.querySelector('.video-modal');
const modalVideo = videoModal.querySelector('video');

const openVideo = (v) => {
  modalVideo.src = v.currentSrc || v.src;
  modalVideo.poster = v.poster;
  modalVideo.setAttribute('aria-label', v.getAttribute('aria-label') || '');
  modalVideo.currentTime = v.currentTime;
  projectVideos.forEach((pv) => pv.pause());
  videoModal.showModal();
  modalVideo.play().catch(() => {});
};

projectVideos.forEach((v) => {
  const media = v.closest('.project-media');
  media.tabIndex = 0;
  media.setAttribute('role', 'button');
  media.setAttribute('aria-label', `Ver en grande: ${v.getAttribute('aria-label') || 'video del proyecto'}`);
  media.addEventListener('click', () => openVideo(v));
  media.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openVideo(v); }
  });
});

videoModal.querySelector('.video-modal-close').addEventListener('click', () => videoModal.close());
// Clic fuera del video cierra
videoModal.addEventListener('click', (e) => { if (e.target === videoModal) videoModal.close(); });
videoModal.addEventListener('close', () => {
  modalVideo.pause();
  visibleVideos.forEach((v) => v.play().catch(() => {}));
});

document.getElementById('year').textContent = new Date().getFullYear();

// Estadísticas: registra visitas, secciones vistas y clics para el panel admin
(function analytics() {
  const { supabaseUrl, supabaseKey } = CONFIG.analytics;
  if (!supabaseUrl || !supabaseKey || location.protocol === 'file:') return;
  let noTrack = false;
  let visitor = '';
  try {
    noTrack = localStorage.getItem('avanth-no-track') === '1';   // el panel lo activa en tu navegador
    visitor = localStorage.getItem('avanth-visitor') || '';
    if (!visitor) {
      visitor = Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem('avanth-visitor', visitor);
    }
  } catch { /* sin localStorage se cuenta igual */ }
  if (noTrack) return;

  const device = window.matchMedia('(max-width: 880px)').matches ? 'mobile' : 'desktop';
  const referrer = (() => {
    try {
      const host = new URL(document.referrer).hostname.replace(/^www\./, '');
      return host === location.hostname.replace(/^www\./, '') ? '' : host;
    } catch { return ''; }
  })();

  const track = (type, extra = {}) => {
    fetch(`${supabaseUrl}/rest/v1/events`, {
      method: 'POST',
      keepalive: true,
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal'
      },
      body: JSON.stringify({ type, path: location.pathname, visitor, device, ...extra })
    }).catch(() => {});
  };

  track('pageview', { referrer });

  // Cada sección cuenta una vez por visita si queda en pantalla (40%) al menos 1 segundo,
  // así no cuentan las que se pasan de largo con un scroll rápido
  const sectionTimers = new Map();
  const sectionIO = new IntersectionObserver((entries) => {
    entries.forEach(({ target, isIntersecting }) => {
      clearTimeout(sectionTimers.get(target));
      if (!isIntersecting) return;
      sectionTimers.set(target, setTimeout(() => {
        sectionIO.unobserve(target);
        track('section', { section: target.id });
      }, 1000));
    });
  }, { threshold: 0.4 });
  document.querySelectorAll('main section[id]').forEach((sec) => sectionIO.observe(sec));

  // Clics en links, botones y videos de proyectos
  document.addEventListener('click', (e) => {
    const el = e.target.closest('a, button, .project-media');
    if (!el) return;
    const label = (el.dataset.track || el.getAttribute('aria-label') || el.textContent)
      .replace(/\s+/g, ' ').trim().slice(0, 120);
    const area = el.closest('section[id], header, footer');
    const section = el.classList.contains('wa-float') ? 'flotante' : area ? area.id || area.tagName.toLowerCase() : '';
    track('click', { label, section });
  }, { capture: true });
})();

// Protección de imágenes y videos: sin clic derecho, arrastrar, descargar ni "Guardar página"
(() => {
  const MEDIA = 'img, video, picture, .project-media, .browser, .about-media';

  document.addEventListener('contextmenu', (e) => {
    if (e.target.closest(MEDIA)) e.preventDefault();
  });
  document.addEventListener('dragstart', (e) => {
    if (e.target.closest(MEDIA)) e.preventDefault();
  });
  // Ctrl/Cmd + S (guardar página) y Ctrl/Cmd + U (ver código)
  document.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    if ((e.ctrlKey || e.metaKey) && (key === 's' || key === 'u')) e.preventDefault();
  });

  const lockVideo = (v) => {
    v.setAttribute('controlslist', 'nodownload noplaybackrate noremoteplayback');
    v.disablePictureInPicture = true;
    v.disableRemotePlayback = true;
  };
  const lockImg = (img) => { img.draggable = false; };
  document.querySelectorAll('video').forEach(lockVideo);
  document.querySelectorAll('img').forEach(lockImg);
})();
