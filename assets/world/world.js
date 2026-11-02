import * as THREE from 'three';
import { RoundedBoxGeometry } from './vendor/RoundedBoxGeometry.js';

const root = document.getElementById('inicio');


await document.fonts.load('700 30px Sora').catch(() => {});
await document.fonts.load('500 30px Sora').catch(() => {});
const IMG = {};
await Promise.all(['hero', 'tokyo', 'denver', 'sinaloa', 'kiev'].map(n => new Promise(res => { const im = new Image(); im.onload = im.onerror = () => res(); im.src = new URL(`./img/${n}.jpg`, import.meta.url).href; IMG[n] = im; })));
const MOBILE = matchMedia('(max-width: 860px), (pointer: coarse)').matches;
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

const C = { bg: 0x070B1F, navy: 0x0C1849, deep: 0x111C55, blue: 0x2B4BE0, peri: 0x8FA3FF, light: 0xF4F6FF, mint: 0x3DDC97, warm: 0xFFC98A };

// ---------- renderer ----------
const canvas = document.getElementById('sw-gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, MOBILE ? 1.5 : 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = !MOBILE;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(C.bg);
scene.fog = new THREE.Fog(C.bg, 38, 80);
const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 200);

// ---------- lights ----------
const hemi = new THREE.HemisphereLight(0xB9C6FF, 0x0A0F28, 1.1);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xDCE3FF, 1.6);
sun.position.set(10, 18, 12);
sun.castShadow = !MOBILE;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -18, right: 18, top: 18, bottom: -18, near: 1, far: 60 });
sun.shadow.bias = -0.0004; sun.shadow.radius = 4;
scene.add(sun);
const rim = new THREE.DirectionalLight(C.blue, 1.2); rim.position.set(-14, 6, -10); scene.add(rim);

// ---------- helpers ----------
const mats = {};
function mat(color, opts = {}) {
  const k = color + JSON.stringify(opts);
  if (!mats[k]) mats[k] = new THREE.MeshStandardMaterial({ color, roughness: .82, metalness: 0, flatShading: false, ...opts });
  return mats[k];
}
function box(w, h, d, color, r = 0.08, opts) {
  const g = r > 0 ? new RoundedBoxGeometry(w, h, d, 2, r) : new THREE.BoxGeometry(w, h, d);
  const m = new THREE.Mesh(g, opts instanceof THREE.Material ? opts : mat(color, opts));
  m.castShadow = m.receiveShadow = true;
  return m;
}
function at(o, x, y, z, parent = scene) { o.position.set(x, y, z); parent.add(o); return o; }

// ---------- island ----------
const island = new THREE.Group(); scene.add(island);
at(box(30, 1.2, 18, C.deep, 0.4), 0, -0.6, 0, island);
at(box(28.6, 0.4, 16.6, 0x1A2766, 0.18), 0, -1.35, 0, island).castShadow = false;
// glow under island
const glowTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
  const gr = g.createRadialGradient(128,128,0,128,128,128); gr.addColorStop(0,'rgba(43,75,224,.55)'); gr.addColorStop(1,'rgba(43,75,224,0)');
  g.fillStyle = gr; g.fillRect(0,0,256,256); return new THREE.CanvasTexture(c); })();
const glow = new THREE.Mesh(new THREE.PlaneGeometry(52, 34), new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, depthWrite: false }));
glow.rotation.x = -Math.PI / 2; glow.position.y = -2.4; scene.add(glow);

// street + sidewalk
at(box(30, 0.08, 5.2, 0x0E1538, 0), 0, 0.04, 6.0, island).receiveShadow = true;
for (let x = -13; x <= 13; x += 3) at(box(1.4, 0.03, 0.18, 0x5C6BB0, 0), x, 0.1, 6.0, island);
at(box(30, 0.22, 2.4, 0x3B4A99, 0.06), 0, 0.11, 2.4, island);
at(box(30, 0.22, 1.6, 0x3B4A99, 0.06), 0, 0.11, 8.6, island);

// ---------- buildings ----------
const windowsMat = new THREE.MeshStandardMaterial({ color: 0x1A2460, emissive: C.warm, emissiveIntensity: 0, roughness: .5 });
function building(x, w, h, d, color, roofColor) {
  const g = new THREE.Group();
  at(box(w, h, d, color, 0.12), 0, h / 2 + 0.22, 0, g);
  at(box(w + 0.2, 0.25, d + 0.2, roofColor, 0.08), 0, h + 0.34, 0, g);
  const rows = Math.max(1, Math.floor((h - 1.4) / 1.3)), cols = Math.max(1, Math.floor(w / 1.3));
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const wx = -w / 2 + (c + 0.5) * (w / cols), wy = 1.8 + r * 1.3;
    if (wy > h - 0.4) continue;
    const win = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.78, 0.06), windowsMat);
    win.position.set(wx, wy + 0.22, d / 2 + 0.02); g.add(win);
  }
  g.position.set(x, 0, -1.5); island.add(g); return g;
}
building(-11.2, 4.4, 6.2, 5, 0x22318A, C.navy);
building(-6.6, 4.2, 4.4, 5, 0x5B73E6, 0x2A3FB8);
building(6.6, 4.2, 5.4, 5, 0x9AACFF, 0x5B73E6);
building(11.2, 4.4, 3.8, 5, 0x2B4BE0, 0x1B2E9A);

// ---------- the shop ----------
const shop = new THREE.Group(); island.add(shop); shop.position.set(0, 0.22, -1.5);
const SW = 8.2, SH = 4.6, SD = 7; // width, height, depth
const wallC = C.light;
at(box(SW, SH, 0.3, wallC, 0.05), 0, SH / 2, -SD / 2, shop);              // back
at(box(0.3, SH, SD, wallC, 0.05), -SW / 2, SH / 2, 0, shop);              // left
at(box(0.3, SH, SD, wallC, 0.05), SW / 2, SH / 2, 0, shop);               // right
at(box(SW + 0.5, 0.35, SD + 0.5, 0x2B4BE0, 0.1), 0, SH + 0.17, 0, shop);  // roof
at(box(SW, 0.12, SD, 0xDCE2FF, 0.02), 0, 0.06, 0, shop);                  // floor
// front facade: pillars + top band, big opening
at(box(1.4, SH, 0.35, wallC, 0.05), -SW / 2 + 0.7, SH / 2, SD / 2, shop);
at(box(1.4, SH, 0.35, wallC, 0.05), SW / 2 - 0.7, SH / 2, SD / 2, shop);
at(box(SW, 1.1, 0.35, wallC, 0.05), 0, SH - 0.55, SD / 2, shop);
// sign band (no text, glows at the end)
const signMat = new THREE.MeshStandardMaterial({ color: C.blue, emissive: C.peri, emissiveIntensity: 0, roughness: .4 });
at(new THREE.Mesh(new RoundedBoxGeometry(4.2, 0.55, 0.12, 2, 0.06), signMat), 0, SH - 0.55, SD / 2 + 0.22, shop);
// awning (stripes)
const awning = new THREE.Group(); at(awning, 0, SH - 1.25, SD / 2 + 0.75, shop);
for (let i = 0; i < 9; i++) {
  const s = box(0.6, 0.08, 1.5, i % 2 ? C.light : C.blue, 0.02);
  s.position.set(-2.4 + i * 0.6, 0, 0); awning.add(s);
}
awning.rotation.x = 0.35;
// shutter (persiana), opening height 3.5
const OPEN_H = SH - 1.1;
const shutterTex = (() => { const c = document.createElement('canvas'); c.width = 64; c.height = 256; const g = c.getContext('2d');
  for (let y = 0; y < 256; y += 16) { g.fillStyle = '#7C88B8'; g.fillRect(0, y, 64, 16); g.fillStyle = '#5A6596'; g.fillRect(0, y + 13, 64, 3); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(6, 3); t.colorSpace = THREE.SRGBColorSpace; return t; })();
const shutter = new THREE.Mesh(new THREE.BoxGeometry(SW - 2.8, OPEN_H, 0.08), new THREE.MeshStandardMaterial({ map: shutterTex, roughness: .6, metalness: .2 }));
shutter.castShadow = true;
const shutterPivot = new THREE.Group(); at(shutterPivot, 0, OPEN_H, SD / 2 + 0.05, shop);
shutterPivot.add(shutter);
function setShutter(closed) { // closed 0..1 (fraction of opening covered)
  const h = Math.max(0.001, closed) * OPEN_H;
  shutter.scale.y = Math.max(0.001, closed); shutter.position.y = -h / 2;
  shutter.visible = closed > 0.01;
}
// interior: hamburguesería
function burger(s = 1) { const g = new THREE.Group(); const bun = mat(0xE3A25A);
  at(new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.19, 0.07, 16), bun), 0, 0.035, 0, g);
  at(new THREE.Mesh(new THREE.CylinderGeometry(0.215, 0.215, 0.06, 16), mat(0x5A3220)), 0, 0.1, 0, g);
  const ch = new THREE.Mesh(new THREE.BoxGeometry(0.33, 0.02, 0.33), mat(0xFFC43D)); ch.rotation.y = 0.6; at(ch, 0, 0.14, 0, g);
  at(new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), bun), 0, 0.15, 0, g).scale.y = 0.75;
  g.scale.setScalar(s); g.traverse(o => { if (o.isMesh) o.castShadow = true; }); return g; }
const tileTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { g.fillStyle = (x + y) % 2 ? '#DCE2FF' : '#33428F'; g.fillRect(x * 16, y * 16, 16, 16); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2.4, 2.0); t.colorSpace = THREE.SRGBColorSpace; return t; })();
const tiles = new THREE.Mesh(new THREE.BoxGeometry(SW - 0.32, 0.02, SD - 0.32), new THREE.MeshStandardMaterial({ map: tileTex, roughness: .6 }));
tiles.receiveShadow = true; at(tiles, 0, 0.13, 0, shop);
at(box(SW - 0.32, 1.3, 0.06, C.blue, 0.02), 0, 0.78, -SD / 2 + 0.18, shop);
// kitchen counter along the back
at(box(5.6, 1.1, 0.95, 0x22318A, 0.06), -0.7, 0.68, -SD / 2 + 0.75, shop);
at(box(5.8, 0.1, 1.05, C.light, 0.03), -0.7, 1.28, -SD / 2 + 0.75, shop);
// grill + hood + patties
at(box(1.5, 0.22, 0.75, 0x2A2F45, 0.04, { metalness: .6, roughness: .35 }), 1.15, 1.44, -SD / 2 + 0.75, shop);
for (let i = 0; i < 4; i++) at(new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.06, 16), mat(0x6B3A22)), 0.65 + i * 0.33, 1.58, -SD / 2 + 0.75, shop);
at(box(1.9, 0.5, 0.95, 0xB8C0DA, 0.04, { metalness: .5, roughness: .3 }), 1.15, 3.45, -SD / 2 + 0.65, shop);
at(box(0.4, 0.9, 0.4, 0xB8C0DA, 0.02, { metalness: .5, roughness: .3 }), 1.15, 4.1, -SD / 2 + 0.5, shop);
// burgers ready on the counter + register
for (let i = 0; i < 3; i++) at(burger(1.1), -1.4 + i * 0.5, 1.33, -SD / 2 + 0.7, shop);
at(box(0.6, 0.32, 0.45, 0x0C1849, 0.06), -2.75, 1.5, -SD / 2 + 0.8, shop);
at(box(0.5, 0.36, 0.05, C.mint, 0.02, { emissive: C.mint, emissiveIntensity: .4 }), -2.75, 1.85, -SD / 2 + 0.65, shop);
// menu board with the real burgers
const mb = document.createElement('canvas'); mb.width = 1024; mb.height = 380;
{ const g = mb.getContext('2d'); g.fillStyle = '#0C1849'; g.fillRect(0, 0, 1024, 380);
  g.fillStyle = '#FFC43D'; g.font = '800 40px Sora'; g.fillText('SMASH', 40, 60); g.fillStyle = '#F4F6FF'; g.fillText('MENÚ', 200, 60);
  ['tokyo', 'denver', 'sinaloa', 'kiev'].forEach((n, i) => { const x = 40 + i * 246; g.save(); g.beginPath(); g.roundRect(x, 86, 220, 210, 18); g.clip(); g.drawImage(IMG[n], x - 15, 76, 250, 250); g.restore();
    g.fillStyle = '#F4F6FF'; g.font = '700 32px Sora'; g.fillText(n[0].toUpperCase() + n.slice(1), x + 4, 340); }); }
const mbTex = new THREE.CanvasTexture(mb); mbTex.colorSpace = THREE.SRGBColorSpace; mbTex.anisotropy = 4;
const menuMat = new THREE.MeshStandardMaterial({ map: mbTex, emissive: 0xffffff, emissiveMap: mbTex, emissiveIntensity: 0.05, roughness: .5 });
at(new THREE.Mesh(new THREE.PlaneGeometry(3.4, 1.26), menuMat), -1.75, 3.35, -SD / 2 + 0.17, shop);
// neon burger on the left wall
const neonMat = new THREE.MeshStandardMaterial({ color: 0xFFD27A, emissive: 0xFFB35C, emissiveIntensity: 0.2 });
const neon = new THREE.Group(); at(neon, -SW / 2 + 0.2, 3.2, 0.4, shop); neon.rotation.y = Math.PI / 2;
neon.add(new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.045, 8, 32, Math.PI), neonMat));
for (const y of [-0.12, -0.3, -0.48]) { const l = new THREE.Mesh(new THREE.CapsuleGeometry(0.045, 0.92, 4, 8), neonMat); l.rotation.z = Math.PI / 2; l.position.y = y; neon.add(l); }
// drinks fridge on the right wall
const fridge = new THREE.Group(); at(fridge, SW / 2 - 0.7, 0.13, -1.4, shop); fridge.rotation.y = -Math.PI / 2;
at(box(1.0, 2.5, 0.9, C.light, 0.06), 0, 1.25, 0, fridge);
const cans = [0xE23B2E, C.mint, 0xFFC43D, C.blue, 0xFF8FA3];
for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) at(new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.24, 10), mat(cans[(r + c) % 5])), -0.3 + c * 0.2, 0.5 + r * 0.52, 0.36, fridge);
const glassMat = new THREE.MeshStandardMaterial({ color: 0xBFCBFF, emissive: 0x8FA3FF, emissiveIntensity: 0.1, transparent: true, opacity: .35, roughness: .1 });
at(new THREE.Mesh(new THREE.BoxGeometry(0.84, 2.2, 0.02), glassMat), 0, 1.25, 0.46, fridge);
// tables with stools and burgers
function table(x, z) { const t = new THREE.Group(); at(t, x, 0.13, z, shop);
  at(new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.08, 24), mat(C.light)), 0, 1.0, 0, t).castShadow = true;
  at(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.0, 8), mat(0x22318A)), 0, 0.5, 0, t);
  at(new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.04, 16), mat(0x22318A)), 0, 0.02, 0, t);
  for (const sx of [-0.95, 0.95]) { at(new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.08, 16), mat(C.blue)), sx, 0.62, 0, t); at(new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.6, 6), mat(0x22318A)), sx, 0.3, 0, t); }
  at(burger(), -0.22, 1.04, 0.1, t); at(burger(), 0.25, 1.04, -0.12, t);
  at(new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.26, 10), mat(0xE23B2E)), 0.05, 1.17, 0.3, t);
  return t; }
table(-2.4, 1.5); table(2.5, 1.8);
const pot = at(box(0.6, 0.6, 0.6, C.light, 0.1), -SW / 2 + 0.65, 0.42, 3.0, shop);
at(new THREE.Mesh(new THREE.IcosahedronGeometry(0.62, 0), mat(C.mint, { flatShading: true })), -SW / 2 + 0.65, 1.2, 3.0, shop).castShadow = true;
const interior = new THREE.PointLight(C.warm, 0, 14, 1.6); at(interior, 0, SH - 0.8, 0.5, shop);
const lampMat = new THREE.MeshStandardMaterial({ color: C.light, emissive: C.warm, emissiveIntensity: 0 });
for (const x of [-2, 2]) { at(new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.7), mat(0x333B66)), x, SH - 0.55, 0, shop);
  at(new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 12), lampMat), x, SH - 1.0, 0, shop); }

// ---------- the giant phone ----------
const phone = new THREE.Group(); at(phone, 0.6, 2.35, -0.6, shop);
const PW = 1.7, PH = 3.4;
const body = new THREE.Mesh(new RoundedBoxGeometry(PW, PH, 0.16, 4, 0.16), new THREE.MeshStandardMaterial({ color: 0x0B1030, roughness: .35, metalness: .4 }));
body.castShadow = true; phone.add(body);
const scr = document.createElement('canvas'); scr.width = 540; scr.height = 1100;
const scrTex = new THREE.CanvasTexture(scr); scrTex.colorSpace = THREE.SRGBColorSpace; scrTex.anisotropy = 4;
const screen = new THREE.Mesh(new THREE.PlaneGeometry(PW - 0.14, PH - 0.14), new THREE.MeshBasicMaterial({ map: scrTex, toneMapped: false }));
screen.position.z = 0.085; phone.add(screen);
const phoneLight = new THREE.PointLight(C.peri, 0, 6, 1.5); phoneLight.position.set(0, 0, 1.2); phone.add(phoneLight);
phone.scale.setScalar(0.001);

function rr(g, x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, r); }
const page = document.createElement('canvas'); page.width = 540; page.height = 2030;
const CREAM = '#F4E6CC', INK = '#2B1A12', RED = '#E23B2E', YEL = '#FFC43D';
function pill(g, x, y, w, h, fill, stroke) { rr(g, x, y, w, h, h / 2); if (fill) { g.fillStyle = fill; g.fill(); } if (stroke) { g.lineWidth = 3; g.strokeStyle = stroke; g.stroke(); } }
function cover(g, img, x, y, w, h, r) { g.save(); rr(g, x, y, w, h, r); g.clip(); const s = Math.max(w / img.width, h / img.height); g.drawImage(img, x + (w - img.width * s) / 2, y + (h - img.height * s) / 2, img.width * s, img.height * s); g.restore(); }
let lastB = -1, lastKey = '';
function drawPage(b) {
  const g = page.getContext('2d'), W = page.width;
  g.fillStyle = CREAM; g.fillRect(0, 0, W, page.height);
  const step = i => Math.min(1, Math.max(0, b * 7.5 - i)); const ease = t => 1 - Math.pow(1 - t, 3);
  const block = (i, fn) => { const t = ease(step(i)); if (t <= 0) return; g.save(); g.globalAlpha = t; g.translate(0, (1 - t) * 50); fn(); g.restore(); };
  block(0, () => { g.fillStyle = RED; g.font = '800 34px Sora'; g.fillText('SMASH', 30, 118); const sw = g.measureText('SMASH').width;
    pill(g, 38 + sw, 92, 100, 34, YEL); g.fillStyle = INK; g.font = '800 17px Sora'; g.fillText('BURGER', 50 + sw, 116);
    pill(g, W - 170, 86, 140, 46, RED); g.fillStyle = '#fff'; g.font = '700 19px Sora'; g.fillText('Pedí ahora', W - 152, 116); });
  block(1, () => { pill(g, 30, 170, 372, 38, '#fff', INK); g.fillStyle = RED; g.font = '700 15px Sora'; g.fillText('100% CARNE VACUNA · PAN BRIOCHE', 48, 195);
    g.fillStyle = INK; g.font = '800 54px Sora'; g.fillText('Smasheadas a', 30, 272); g.fillText('mano, directo', 30, 334); g.fillText('a la ', 30, 396);
    const x0 = 30 + g.measureText('a la ').width, pw = g.measureText('plancha').width; g.fillStyle = YEL; g.fillRect(x0, 402, pw, 10); g.fillStyle = RED; g.fillText('plancha', x0, 396); });
  block(2, () => { const gr = g.createRadialGradient(W / 2, 650, 60, W / 2, 650, 260); gr.addColorStop(0, 'rgba(255,196,61,.5)'); gr.addColorStop(1, 'rgba(255,196,61,0)'); g.fillStyle = gr; g.fillRect(0, 400, W, 500);
    cover(g, IMG.hero, 70, 440, 400, 400, 200);
    pill(g, W - 200, 450, 172, 66, '#fff', INK); g.fillStyle = INK; g.font = '800 22px Sora'; g.fillText('4,8 ★', W - 176, 480); g.font = '500 15px Sora'; g.fillText('+2.000 pedidos', W - 180, 503); });
  block(3, () => { pill(g, 30, 880, 190, 62, RED); g.fillStyle = '#fff'; g.font = '700 22px Sora'; g.fillText('Ver menú', 74, 919);
    pill(g, 236, 880, 210, 62, null, INK); g.fillStyle = INK; g.fillText('Cómo llegar', 270, 919);
    [['+8', 'años en la plancha'], ['100%', 'carne fresca'], ['4,8★', 'pedidos online']].forEach(([a, t], i) => { g.fillStyle = RED; g.font = '800 30px Sora'; g.fillText(a, 30 + i * 170, 1004); g.fillStyle = '#6B5646'; g.font = '500 15px Sora'; g.fillText(t, 30 + i * 170, 1030); }); });
  block(4, () => { g.fillStyle = INK; g.font = '800 36px Sora'; g.textAlign = 'center'; g.fillText('Elegí tu smash favorita', W / 2, 1118);
    g.fillStyle = '#6B5646'; g.font = '500 17px Sora'; g.fillText('Se arman al momento, recién smasheadas.', W / 2, 1152); g.textAlign = 'left'; });
  [['tokyo', 'Tokyo', 'LA ORIGINAL'], ['denver', 'Denver', 'DOBLE'], ['sinaloa', 'Sinaloa', 'DOBLE'], ['kiev', 'Kiev', 'EXPLOSIÓN DE QUESO']].forEach(([im, name, tag], k) =>
    block(5 + Math.floor(k / 2) + (k % 2) * 0.4, () => { const x = 30 + (k % 2) * 250, y = 1190 + Math.floor(k / 2) * 400, w = 230;
      g.fillStyle = '#FFF7E8'; rr(g, x, y, w, 370, 22); g.fill(); g.lineWidth = 3; g.strokeStyle = INK; g.stroke();
      cover(g, IMG[im], x + 10, y + 10, w - 20, 210, 16);
      g.fillStyle = INK; g.font = '800 26px Sora'; g.fillText(name, x + 16, y + 262);
      g.fillStyle = '#B8A48F'; g.fillRect(x + 16, y + 282, w - 40, 9); g.fillRect(x + 16, y + 300, w - 80, 9);
      g.font = '700 12px Sora'; pill(g, x + 16, y + 322, 26 + g.measureText(tag).width, 30, INK); g.fillStyle = '#fff'; g.fillText(tag, x + 29, y + 342); }));
}
function drawScreen(b, sc) {
  b = Math.round(b * 90) / 90; sc = Math.round(sc * 300) / 300; const key = b + '|' + sc; if (key === lastKey) return; lastKey = key;
  const sg = scr.getContext('2d'), W = scr.width, H = scr.height;
  if (b <= 0) { sg.fillStyle = '#05081A'; sg.fillRect(0, 0, W, H); scrTex.needsUpdate = true; return; }
  if (b !== lastB) { drawPage(b); lastB = b; }
  sg.fillStyle = CREAM; sg.fillRect(0, 0, W, H);
  sg.drawImage(page, 0, -sc * (page.height - H));
  sg.fillStyle = CREAM; sg.fillRect(0, 0, W, 62); sg.fillStyle = INK; sg.font = '600 22px Sora'; sg.fillText('9:41', 36, 44); rr(sg, W - 86, 28, 50, 20, 6); sg.fill();
  const wa = Math.min(1, Math.max(0, (b - 0.5) * 4));
  if (wa > 0) { sg.globalAlpha = wa; sg.fillStyle = '#25D366'; sg.beginPath(); sg.arc(W - 72, H - 82, 42, 0, 7); sg.fill();
    sg.strokeStyle = '#fff'; sg.lineWidth = 6; sg.beginPath(); sg.arc(W - 72, H - 82, 19, 0, 7); sg.stroke(); sg.globalAlpha = 1; }
  scrTex.needsUpdate = true;
}

// ---------- notifications ----------
function notifTexture(title, sub, color, icon) {
  const c = document.createElement('canvas'); c.width = 620; c.height = 170; const g = c.getContext('2d');
  g.shadowColor = 'rgba(0,0,0,.35)'; g.shadowBlur = 18; g.shadowOffsetY = 6;
  g.fillStyle = '#F4F6FF'; rr(g, 10, 10, 600, 146, 34); g.fill(); g.shadowColor = 'transparent';
  g.fillStyle = color; g.beginPath(); g.arc(88, 83, 44, 0, 7); g.fill();
  g.fillStyle = '#fff'; g.font = '700 44px Sora'; g.textAlign = 'center'; g.fillText(icon, 88, 99); g.textAlign = 'left';
  g.fillStyle = '#0C1849'; g.font = '700 34px Sora'; g.fillText(title, 152, 74);
  g.fillStyle = '#4A5380'; g.font = '500 28px Sora'; g.fillText(sub, 152, 116);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
const NOTIFS = [
  ['Nuevo pedido', '2 Tokyo + papas', '#2B4BE0', '+', MOBILE ? [-0.3, 1.25, 0.7] : [0.4, 1.25, 0.5]],
  ['Turno confirmado', 'Jueves 17 h', '#3DDC97', '✓', MOBILE ? [0.3, 0.55, 0.8] : [0.75, 0.55, 0.6]],
  ['Mensaje nuevo', '¿Hacen envíos?', '#8FA3FF', '…', MOBILE ? [-0.3, -0.15, 0.9] : [0.4, -0.15, 0.7]],
  ['Pago recibido', 'Pedido #128', '#FFB35C', '$', MOBILE ? [0.3, -0.85, 1.0] : [0.75, -0.85, 0.8]],
];
const notifs = NOTIFS.map(([t, s, col, ic, to]) => {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1.95, 0.535), new THREE.MeshBasicMaterial({ map: notifTexture(t, s, col, ic), transparent: true, toneMapped: false, depthWrite: false }));
  m.userData.to = new THREE.Vector3(...to); m.renderOrder = 5; phone.add(m); m.visible = false; return m;
});

// ---------- people (final) ----------
const people = [];
const skin = [0xF2C9A8, 0xD9A27E, 0xB97A57, 0xF5D7BF, 0x8D5A3C];
const shirts = [C.mint, C.peri, 0xFFC98A, C.light, 0xFF8FA3, C.blue, 0x9AACFF, 0xE23B2E];
function person(i, x, y, z, ry, o = {}) {
  const p = new THREE.Group(), seated = o.seated;
  const bodyM = new THREE.Mesh(new THREE.CapsuleGeometry(0.26, seated ? 0.3 : 0.55, 4, 10), mat(shirts[i % shirts.length]));
  bodyM.position.y = seated ? 0.4 : 0.6; bodyM.castShadow = true; p.add(bodyM);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 12), mat(skin[(i * 3) % skin.length])); head.position.y = seated ? 1.0 : 1.32; head.castShadow = true; p.add(head);
  if (i % 3 === 0) { const hair = new THREE.Mesh(new THREE.SphereGeometry(0.235, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2.2), mat(0x2B1A12)); hair.position.y = head.position.y + 0.02; p.add(hair); }
  if (o.bag) { const bag = box(0.3, 0.34, 0.16, 0xC8874A, 0.03); bag.position.set(0.34, 0.5, 0); p.add(bag); }
  p.position.set(x, y, z); p.rotation.y = ry; p.scale.setScalar(0.001);
  p.userData = { y, d: o.d ?? 0 }; (o.parent || island).add(p); people.push(p); return p;
}
// queue on the sidewalk, facing the door
for (let k = 0; k < 8; k++) person(k, -1.2 - k * 0.95, 0.22, 3.05 + (k % 2 ? 0.18 : -0.08), Math.PI / 2, { d: k * 0.007 });
// leaving with their order
person(8, 1.9, 0.22, 3.2, -Math.PI / 2 + 0.3, { bag: true, d: 0.02 });
person(9, 3.3, 0.22, 2.9, -Math.PI / 2, { bag: true, d: 0.03 });
person(10, 6.2, 0.22, 8.6, -Math.PI / 2, { bag: true, d: 0.04 });
person(11, -9.5, 0.22, 8.4, Math.PI / 2, { bag: true, d: 0.035 });
person(12, 9.4, 0.22, 2.7, 0.4, { bag: true, d: 0.045 });
// inside: seated at the tables and ordering at the counter
person(13, -3.35, 0.79, 1.5, Math.PI / 2, { seated: true, parent: shop, d: 0.01 });
person(14, -1.45, 0.79, 1.5, -Math.PI / 2, { seated: true, parent: shop, d: 0.015 });
person(15, 1.55, 0.79, 1.8, Math.PI / 2, { seated: true, parent: shop, d: 0.02 });
person(16, 3.45, 0.79, 1.8, -Math.PI / 2, { seated: true, parent: shop, d: 0.025 });
person(17, -2.7, 0.13, -1.7, Math.PI, { parent: shop, d: 0.012 });
person(18, -1.8, 0.13, -1.5, Math.PI + 0.3, { parent: shop, d: 0.022 });
// delivery rider arriving
const rider = new THREE.Group(); island.add(rider);
at(box(1.1, 0.35, 0.4, C.mint, .1), 0, 0.5, 0, rider); at(box(0.55, 0.5, 0.5, 0xE23B2E, .08), -0.42, 0.95, 0, rider);
for (const x of [-0.45, 0.45]) at(new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.07, 8, 16), mat(0x111633)), x, 0.25, 0, rider);
const rb = new THREE.Mesh(new THREE.CapsuleGeometry(0.24, 0.35, 4, 10), mat(C.peri)); rb.position.set(0.05, 1.05, 0); rider.add(rb);
const rh = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 12), mat(0xE23B2E)); rh.position.set(0.08, 1.55, 0); rider.add(rh);
rider.traverse(o => { if (o.isMesh) o.castShadow = true; });
rider.rotation.y = Math.PI; rider.visible = false;

// ---------- trees + lamps ----------
function tree(x, z, s = 1) { const g = new THREE.Group();
  at(new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 0.9), mat(0x3B2E5A)), 0, 0.45, 0, g);
  const top = new THREE.Mesh(new THREE.IcosahedronGeometry(0.75, 0), mat(0x3DDC97, { flatShading: true })); top.position.y = 1.35; top.castShadow = true; g.add(top);
  g.scale.setScalar(s); g.position.set(x, 0.22, z); island.add(g); }
[[-13.8, 2.6], [-8.8, 2.8, .8], [8.8, 2.8], [13.6, 2.6, .9], [-12, 8.8, .8], [12.5, 8.9]].forEach(a => tree(...a));
const bulbs = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, emissive: C.warm, emissiveIntensity: .35 });
for (const x of [-4.6, 4.6, -10, 10]) { at(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 2.4), mat(0x22285A)), x, 1.4, 3.4, island);
  at(new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), bulbs), x, 2.65, 3.4, island); }
// a parked scooter
const scooter = new THREE.Group(); at(scooter, -7.4, 0.3, 6.6, island);
at(box(1.1, 0.35, 0.4, C.mint, .1), 0, 0.35, 0, scooter); at(box(0.5, 0.5, 0.5, C.light, .08), -0.35, 0.75, 0, scooter);
for (const x of [-0.45, 0.45]) at(new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.07, 8, 16), mat(0x111633)), x, 0.18, 0.21, scooter);

// stars / particles
if (!MOBILE) { const pts = new Float32Array(600 * 3); for (let i = 0; i < 600; i++) { pts[i*3] = (Math.random()-.5)*120; pts[i*3+1] = Math.random()*50-10; pts[i*3+2] = (Math.random()-.5)*120 - 20; }
  const gpts = new THREE.BufferGeometry(); gpts.setAttribute('position', new THREE.BufferAttribute(pts, 3));
  scene.add(new THREE.Points(gpts, new THREE.PointsMaterial({ color: C.peri, size: 0.12, transparent: true, opacity: .55, fog: false }))); }

// ---------- camera path ----------
// shop front in world: z = -1.5 + 3.5 = 2.0 ; phone at (0.6, 2.57, -2.1)
const PHONE_W = new THREE.Vector3(0.6, 2.57, -2.1);
const KEYS = [ // [t, pos, target]
  [0.00, [16, 12.5, 24], [0, 1.6, 0]],
  [0.16, [9, 6.5, 14], [0, 2.0, 0]],
  [0.30, [1.5, 2.9, 7.0], [0.4, 2.4, -1]],
  [0.46, [0.6, 2.6, 2.4], [0.6, 2.57, -2.1]],
  [0.62, [1.4, 2.7, 3.2], [0.6, 2.5, -2.1]],
  [0.78, [-0.4, 2.8, 3.6], [0.4, 2.5, -2.1]],
  [0.88, [-8.5, 3.0, 12], [-0.6, 1.4, 2.2]],
  [1.00, [-14, 10, 22], [0, 1.6, 0]],
];
const MKEYS = [ // portrait: further away, lower in frame handled by offset
  [0.00, [20, 17, 34], [0, 2.4, 0]],
  [0.16, [11, 8.5, 19], [0, 2.4, 0]],
  [0.30, [1.6, 3.0, 8.5], [0.5, 2.3, -1]],
  [0.46, [0.6, 2.6, 3.4], [0.6, 2.55, -2.1]],
  [0.62, [1.0, 2.7, 4.6], [0.6, 2.45, -2.1]],
  [0.78, [-0.3, 2.8, 5.0], [0.4, 2.45, -2.1]],
  [0.88, [-9.5, 3.6, 16], [-0.9, 1.9, 2.2]],
  [1.00, [-13.5, 10, 24], [-0.5, 2.0, 0.5]],
];
const K = MOBILE ? MKEYS : KEYS;
const posCurve = new THREE.CatmullRomCurve3(K.map(k => new THREE.Vector3(...k[1])), false, 'centripetal');
const tgtCurve = new THREE.CatmullRomCurve3(K.map(k => new THREE.Vector3(...k[2])), false, 'centripetal');
const sm = t => t * t * (3 - 2 * t);
function pathU(p) { for (let i = 0; i < K.length - 1; i++) { const a = K[i][0], b = K[i + 1][0];
  if (p <= b) { const l = (p - a) / (b - a); return (i + (0.35 * l + 0.65 * sm(l))) / (K.length - 1); } } return 1; }
const range = (p, a, b) => Math.min(1, Math.max(0, (p - a) / (b - a)));
const easeOut = t => 1 - Math.pow(1 - t, 3);
const easeOutBack = t => { const c = 1.6; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };

// ---------- layout ----------
let W = 1, H = 1;
function resize() {
  W = innerWidth; H = innerHeight;
  renderer.setSize(W, H, false);
  camera.aspect = W / H; camera.fov = W / H < 1 ? 50 : 32; camera.updateProjectionMatrix();
}
let lastW = 0; addEventListener('resize', () => { if (MOBILE && innerWidth === lastW) return; lastW = innerWidth; resize(); });
lastW = innerWidth; resize();

// ---------- scroll ----------
const world = root;
const copies = [...root.querySelectorAll('.sw-copy')];
const rail = [...root.querySelectorAll('.sw-rail i')];
const hint = root.querySelector('.sw-hint');
const scrim = root.querySelector('.sw-scrim');
function scrollP() { const r = world.getBoundingClientRect(); const total = world.offsetHeight - innerHeight; return total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 0; }
let target = scrollP(), cur = target;
addEventListener('scroll', () => { target = scrollP(); }, { passive: true });
window.__setP = v => { target = cur = v; }; // for recording

const tmpT = new THREE.Vector3();
function update(p, time) {
  // camera
  const u = pathU(p);
  posCurve.getPoint(u, camera.position); tgtCurve.getPoint(u, tmpT);
  // gentle idle sway
  camera.position.x += Math.sin(time * 0.0004) * 0.15; camera.position.y += Math.sin(time * 0.0005) * 0.08;
  camera.lookAt(tmpT);
  const fovIn = range(p, 0.3, 0.44) * (1 - range(p, 0.8, 0.9));
  camera.fov = (W / H < 1 ? 50 : 32) + fovIn * (W / H < 1 ? 20 : 18); camera.updateProjectionMatrix();
  // frame offset: scene to the right on desktop at the start/end (text on the left), lower on phones
  const side = MOBILE ? 0 : 0.2 + 0.05 * Math.max(1 - range(p, 0.05, 0.22), range(p, 0.84, 0.98));
  const ends = Math.max(1 - range(p, 0.08, 0.26), range(p, MOBILE ? 0.8 : 0.84, MOBILE ? 0.88 : 0.98));
  const down = MOBILE ? ends * 0.17 - (1 - ends) * 0.13 : 0;
  camera.setViewOffset(W, H, -side * W, -down * H, W, H);

  // shutter: half down -> open while approaching
  setShutter(0.55 * (1 - easeOut(range(p, 0.12, 0.27))));
  // interior + phone
  const inside = range(p, 0.2, 0.38);
  interior.intensity = 6 * inside + 10 * range(p, 0.84, 0.95);
  lampMat.emissiveIntensity = 1.4 * inside;
  menuMat.emissiveIntensity = 0.05 + 0.35 * inside;
  neonMat.emissiveIntensity = 0.2 + 1.6 * inside;
  glassMat.emissiveIntensity = 0.1 + 0.6 * inside;
  const ps = easeOutBack(range(p, 0.28, 0.42));
  phone.scale.setScalar(Math.max(0.001, ps));
  phone.rotation.y = -0.18 + Math.sin(time * 0.0006) * 0.03;
  phoneLight.intensity = 4 * ps * (1 - range(p, 0.84, 0.95));
  drawScreen(range(p, 0.34, 0.54), sm(range(p, 0.5, 0.8)));
  // notifications
  notifs.forEach((n, i) => {
    const t = easeOutBack(range(p, 0.6 + i * 0.035, 0.68 + i * 0.035));
    const out = range(p, 0.8, 0.88);
    n.visible = t > 0.001 && out < 1;
    n.position.set(n.userData.to.x * t, n.userData.to.y * t + Math.sin(time * 0.002 + i) * 0.04 * t, 0.15 + n.userData.to.z * t + out * 1.5);
    n.scale.setScalar(Math.max(0.001, t * (1 - out)));
    n.material.opacity = Math.min(1, t * 1.3) * (1 - out);
  });
  // finale: lights on, people
  const fin = range(p, 0.82, 0.96);
  windowsMat.emissiveIntensity = 0.9 * fin;
  signMat.emissiveIntensity = 1.2 * fin;
  bulbs.emissiveIntensity = 0.35 + 1.3 * fin;
  people.forEach((m, i) => { const t = easeOutBack(range(p, 0.83 + m.userData.d, 0.88 + m.userData.d)); m.scale.setScalar(Math.max(0.001, t));
    m.position.y = m.userData.y + Math.abs(Math.sin(time * 0.004 + i)) * 0.05 * t; });
  const rt = range(p, 0.82, 0.95); rider.visible = rt > 0;
  rider.position.set(15 - 12.5 * easeOut(rt), 0.22 + Math.abs(Math.sin(time * 0.01)) * 0.02, 5.0);
  hemi.intensity = 1.1 + 0.25 * fin;

  // copy
  copies.forEach(el => { const a = +el.dataset.in, b = +el.dataset.out, f = 0.06;
    const o = Math.min(range(p, a, a + f), 1 - range(p, b - f, b));
    el.style.opacity = o.toFixed(3); el.style.transform = (MOBILE ? '' : 'translateY(-50%) ') + `translateY(${(1 - o) * 24}px)`;
    el.classList.toggle('on', o > 0.5); });
  scrim.style.opacity = Math.min(range(p, 0.24, 0.3), 1 - range(p, 0.8, 0.85)).toFixed(3);
  hint.style.opacity = (1 - range(p, 0.01, 0.06)).toFixed(3);
  const stage = p < 0.25 ? 0 : p < 0.55 ? 1 : p < 0.82 ? 2 : 3;
  rail.forEach((r, i) => r.classList.toggle('on', i === stage));
}

lastKey = '';
let lastT = 0;
function frame(time) {
  const dt = Math.min(0.25, Math.max(0, (time - lastT) / 1000)); lastT = time;
  cur += (target - cur) * (REDUCED ? 1 : 1 - Math.exp(-dt * 5.5));
  if (Math.abs(target - cur) < 0.0002) cur = target;
  update(cur, window.__freeze ?? time);
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
root.classList.add('sw-live');
target = cur = scrollP();
requestAnimationFrame(frame);
window.__ready = true;
