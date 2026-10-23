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
  }
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

if (projectVideos.length && 'IntersectionObserver' in window) {
  const vio = new IntersectionObserver((entries) => {
    entries.forEach(({ target, isIntersecting }) => {
      if (isIntersecting) target.play().catch(() => {});
      else target.pause();
    });
  }, { threshold: 0.25 });
  projectVideos.forEach((v) => vio.observe(v));
}

document.getElementById('year').textContent = new Date().getFullYear();
