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

// Links de contacto
const waUrl = CONFIG.whatsapp
  ? `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(CONFIG.whatsappMessage)}`
  : '#contacto';

document.querySelectorAll('[data-whatsapp]').forEach((a) => {
  a.href = waUrl;
  if (CONFIG.whatsapp) {
    a.target = '_blank';
    a.rel = 'noopener';
  }
});
document.querySelectorAll('[data-whatsapp-text]').forEach((el) => {
  if (CONFIG.whatsappLabel) el.textContent = CONFIG.whatsappLabel;
});

document.querySelectorAll('[data-email]').forEach((a) => {
  a.href = CONFIG.email ? `mailto:${CONFIG.email}` : '#contacto';
});
document.querySelectorAll('[data-email-text]').forEach((el) => {
  if (CONFIG.email) el.textContent = CONFIG.email;
});

document.querySelectorAll('[data-social]').forEach((a) => {
  const url = CONFIG.social[a.dataset.social];
  if (url) {
    a.href = url;
  } else {
    a.remove();
  }
});

// Reels de Instagram: usa el embed oficial de Instagram
const reelGrid = document.getElementById('reel-grid');
const cleanReelUrl = (url) => url.trim().split('?')[0].replace(/\/?$/, '/');
const isReelUrl = (url) => /^https:\/\/(www\.)?instagram\.com\/(reel|reels|p)\/[\w-]+\/$/.test(url);

function renderReels(urls) {
  reelGrid.textContent = '';
  if (!urls.length) {
    reelGrid.innerHTML = `<div class="reel-empty">Mirá todos nuestros reels en
      <a href="${CONFIG.social.instagram}" target="_blank" rel="noopener">@avanth.studio</a></div>`;
    return;
  }
  urls.forEach((url) => {
    const reel = document.createElement('div');
    reel.className = 'reel';
    const embed = document.createElement('blockquote');
    embed.className = 'instagram-media';
    embed.dataset.instgrmPermalink = url;
    embed.dataset.instgrmVersion = '14';
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener';
    link.textContent = 'Ver este reel en Instagram';
    embed.append(link);
    reel.append(embed);
    reelGrid.append(reel);
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

form.addEventListener('submit', (e) => {
  e.preventDefault();
  if (!form.reportValidity()) return;

  const data = new FormData(form);
  const text =
    `Hola! Soy ${data.get('nombre')} (${data.get('email')}).\n` +
    `Me interesa: ${data.get('servicio')}.\n\n` +
    `${data.get('mensaje')}`;

  if (CONFIG.whatsapp) {
    window.open(`https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  } else if (CONFIG.email) {
    const subject = `Consulta: ${data.get('servicio')}`;
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
