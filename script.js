// Completá estos datos y se actualizan en toda la página.
const CONFIG = {
  email: '',          // ej: 'hola@avanth.studio'
  whatsapp: '',       // solo números con código de país, ej: '5491112345678'
  whatsappLabel: '',  // cómo se muestra, ej: '+54 9 11 1234-5678'
  whatsappMessage: 'Hola Avanth! Quiero consultar por un proyecto.',
  social: {
    instagram: '',    // ej: 'https://instagram.com/avanth.studio'
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
    a.href = '#contacto';
    a.removeAttribute('target');
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

// Animación al hacer scroll
const revealEls = document.querySelectorAll('.reveal');

if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  revealEls.forEach((el) => io.observe(el));
} else {
  revealEls.forEach((el) => el.classList.add('visible'));
}

document.getElementById('year').textContent = new Date().getFullYear();
