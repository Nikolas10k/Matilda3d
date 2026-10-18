import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

export { THREE };

// Paleta da marca (cores das peças impressas)
export const C = {
  nevoa: 0xf4f3f1, branco: 0xffffff, perola: 0xe6e4e0, concreto: 0xa8a5a0,
  pedra: 0x6b6964, grafite: 0x2f2f31, areia: 0xd9d4cc,
};

let FONT;
export async function loadFont() {
  FONT = await new FontLoader().loadAsync('node_modules/three/examples/fonts/helvetiker_bold.typeface.json');
}

// PLA fosco com linhas de camada (bump procedural pela altura no mundo)
export function pla(color, { layer = 0.045, amp = 0.012, rough = 0.62 } = {}) {
  const m = new THREE.MeshPhysicalMaterial({ color, roughness: rough, metalness: 0, sheen: 0.25, sheenRoughness: 0.6, sheenColor: new THREE.Color(0xffffff) });
  m.onBeforeCompile = (s) => {
    s.uniforms.uLayer = { value: layer };
    s.uniforms.uAmp = { value: amp };
    s.vertexShader = s.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWPos;')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    s.fragmentShader = s.fragmentShader
      .replace('#include <common>', `#include <common>
varying vec3 vWPos; uniform float uLayer; uniform float uAmp;
vec3 m3perturb(vec3 sp, vec3 sn, vec2 dH, float fd){
  vec3 sx = normalize(dFdx(sp)); vec3 sy = normalize(dFdy(sp));
  vec3 r1 = cross(sy, sn); vec3 r2 = cross(sn, sx);
  float det = dot(sx, r1) * fd;
  vec3 g = sign(det) * (dH.x * r1 + dH.y * r2);
  return normalize(abs(det) * sn - g);
}`)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
{
  float ph = vWPos.y / uLayer * 6.2831853;
  float fw = fwidth(ph);
  float a = uAmp * clamp(1.0 - fw / 2.5, 0.0, 1.0);
  float h = a * pow(abs(sin(ph * 0.5)), 0.6) * 40.0;
  vec2 dH = vec2(dFdx(h), dFdy(h));
  normal = m3perturb(-vViewPosition, normal, dH, faceDirection);
}`);
  };
  return m;
}

export const fosco = (color, rough = 0.9) => new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: 0 });
export const metal = () => new THREE.MeshStandardMaterial({ color: 0xc9c7c2, roughness: 0.28, metalness: 1 });

export function mesh(geo, mat, cast = true) {
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = cast; m.receiveShadow = true;
  return m;
}

function roundedRectShape(w, h, r) {
  const s = new THREE.Shape();
  const x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return s;
}
function holePath(cx, cy, r) {
  const p = new THREE.Path(); p.absarc(cx, cy, r, 0, Math.PI * 2, true); return p;
}
const ext = (shape, depth, bevel = 0.04) => {
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 3, curveSegments: 32 });
  return g;
};

function textGeo(text, size, depth) {
  const g = new TextGeometry(text, { font: FONT, size, depth, curveSegments: 10, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.015, bevelSegments: 2 });
  g.computeBoundingBox();
  const b = g.boundingBox;
  g.translate(-(b.max.x + b.min.x) / 2, -(b.max.y + b.min.y) / 2, 0);
  return g;
}

// Argola e elo metálicos
function ring(r = 0.55) {
  const g = new THREE.Group();
  const t = mesh(new THREE.TorusGeometry(r, 0.055, 16, 64), metal());
  g.add(t);
  return g;
}

// Chaveiro com nome (placa arredondada + letras em relevo, duas cores)
export function keychainName(text, base, top, { size = 1.0 } = {}) {
  const g = new THREE.Group();
  const tg = textGeo(text, size, 0.18);
  const tw = tg.boundingBox.max.x - tg.boundingBox.min.x;
  const w = tw + 1.5, h = size + 0.75;
  const shape = roundedRectShape(w, h, h / 2);
  shape.holes.push(holePath(-w / 2 + 0.5, 0, 0.2));
  const plate = mesh(ext(shape, 0.22, 0.05), pla(base));
  g.add(plate);
  const t = mesh(tg, pla(top));
  t.position.set(0.3, 0, 0.27);
  g.add(t);
  const rg = ring(0.62);
  rg.position.set(-w / 2 - 0.1, 0, 0.12);
  rg.rotation.y = 0.15;
  g.add(rg);
  g.rotation.x = -Math.PI / 2;
  const holder = new THREE.Group(); holder.add(g); holder.userData.w = w;
  return holder;
}

// Chaveiro com inicial (disco + letra em relevo)
export function keychainInitial(letter, base, top) {
  const g = new THREE.Group();
  const s = new THREE.Shape(); s.absarc(0, 0, 1.25, 0, Math.PI * 2, false);
  const tab = roundedRectShape(0.9, 0.9, 0.45);
  const plate = mesh(ext(s, 0.24, 0.05), pla(base));
  g.add(plate);
  const tabShape = new THREE.Shape(); tabShape.absarc(0, 1.35, 0.42, 0, Math.PI * 2, false);
  tabShape.holes.push(holePath(0, 1.38, 0.18));
  const tabM = mesh(ext(tabShape, 0.24, 0.05), pla(base));
  g.add(tabM);
  const t = mesh(textGeo(letter, 1.25, 0.2), pla(top));
  t.position.z = 0.29;
  g.add(t);
  const rg = ring(0.6);
  rg.position.set(0, 1.95, 0.12); rg.rotation.y = Math.PI / 2 - 0.3;
  g.add(rg);
  g.rotation.x = -Math.PI / 2;
  const holder = new THREE.Group(); holder.add(g);
  return holder;
}

// Chaveiro de pet: placa em forma de osso + nome + patinha
export function keychainPet(name, base, top) {
  const g = new THREE.Group();
  const mat = pla(base);
  const L = 3.4, H = 1.0, R = 0.55;
  const body = roundedRectShape(L, H, 0.1);
  g.add(mesh(ext(body, 0.22, 0.05), mat));
  for (const [x, y] of [[-L / 2, 0.42], [-L / 2, -0.42], [L / 2, 0.42], [L / 2, -0.42]]) {
    const c = new THREE.Shape(); c.absarc(x, y, R, 0, Math.PI * 2, false);
    if (x < 0 && y > 0) c.holes.push(holePath(x - 0.08, y + 0.05, 0.17));
    g.add(mesh(ext(c, 0.22, 0.05), mat));
  }
  const t = mesh(textGeo(name, 0.62, 0.18), pla(top));
  t.position.set(-0.15, 0, 0.27);
  g.add(t);
  // patinha
  const paw = new THREE.Group();
  const pm = pla(top);
  const pad = new THREE.Shape(); pad.absellipse(0, 0, 0.17, 0.14, 0, Math.PI * 2, false, 0);
  paw.add(mesh(ext(pad, 0.12, 0.02), pm));
  for (const [x, y] of [[-0.17, 0.17], [-0.06, 0.25], [0.06, 0.25], [0.17, 0.17]]) {
    const tsh = new THREE.Shape(); tsh.absarc(x, y, 0.06, 0, Math.PI * 2, false);
    paw.add(mesh(ext(tsh, 0.12, 0.02), pm));
  }
  paw.position.set(1.2, -0.05, 0.27);
  g.add(paw);
  const rg = ring(0.6);
  rg.position.set(-L / 2 - 0.65, 0.75, 0.12); rg.rotation.y = 0.2;
  g.add(rg);
  g.rotation.x = -Math.PI / 2;
  const holder = new THREE.Group(); holder.add(g);
  return holder;
}

// Cruz decorativa com base
export function cross(color, { h = 5.2, w = 3.1, t = 0.62, d = 0.5 } = {}) {
  const g = new THREE.Group();
  const s = new THREE.Shape();
  const a = t / 2, arm = h * 0.66;
  s.moveTo(-a, 0); s.lineTo(a, 0); s.lineTo(a, arm - a); s.lineTo(w / 2, arm - a); s.lineTo(w / 2, arm + a);
  s.lineTo(a, arm + a); s.lineTo(a, h); s.lineTo(-a, h); s.lineTo(-a, arm + a); s.lineTo(-w / 2, arm + a);
  s.lineTo(-w / 2, arm - a); s.lineTo(-a, arm - a); s.lineTo(-a, 0);
  const m = mesh(ext(s, d, 0.06), pla(color));
  m.position.set(0, 0.55, -d / 2);
  g.add(m);
  const base = mesh(new RoundedBoxGeometry(1.9, 0.5, 1.3, 4, 0.12), pla(color));
  base.position.y = 0.25;
  g.add(base);
  const step = mesh(new RoundedBoxGeometry(1.3, 0.2, 0.95, 4, 0.08), pla(color));
  step.position.y = 0.6;
  g.add(step);
  return g;
}

// Imagem religiosa estilizada (figura com manto, mãos postas e auréola)
export function figure(color, { scale = 1 } = {}) {
  const g = new THREE.Group();
  const mat = pla(color, { layer: 0.04, amp: 0.01 });
  const prof = [
    [0, 0], [1.15, 0], [1.2, 0.07], [1.12, 0.35], [1.0, 1.2], [0.86, 2.4], [0.78, 3.3], [0.8, 3.85],
    [0.7, 4.2], [0.55, 4.48], [0.5, 4.75], [0.46, 5.0], [0.37, 5.22], [0.2, 5.37], [0, 5.4],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const curve = new THREE.SplineCurve(prof);
  const pts = curve.getPoints(140);
  pts[0].set(0, 0); pts[pts.length - 1].x = 0;
  const body = mesh(new THREE.LatheGeometry(pts, 128), mat);
  g.add(body);
  // rosto (recorte suave do véu)
  const face = mesh(new THREE.SphereGeometry(0.34, 48, 32), mat);
  face.scale.set(0.9, 1.15, 0.6); face.position.set(0, 4.78, 0.26);
  g.add(face);
  // mãos postas
  const hands = mesh(new THREE.CapsuleGeometry(0.13, 0.36, 8, 24), mat);
  hands.position.set(0, 3.35, 0.8); hands.rotation.x = -0.3;
  g.add(hands);
  // abertura do manto
  for (const sx of [-1, 1]) {
    const f = mesh(new THREE.CapsuleGeometry(0.045, 3.0, 6, 16), mat);
    f.position.set(sx * 0.42, 2.25, 0.9 - 0.02); f.rotation.set(0.07, 0, sx * 0.16);
    g.add(f);
  }
  // auréola
  const halo = mesh(new THREE.TorusGeometry(0.68, 0.04, 16, 96), pla(color));
  halo.position.set(0, 4.9, -0.42);
  g.add(halo);
  g.scale.setScalar(scale);
  return g;
}

// Porta-terço: caixinha redonda com cruz em relevo na tampa + terço
export function rosaryBox(color, beadColor) {
  const g = new THREE.Group();
  const mat = pla(color, { layer: 0.04, amp: 0.012 });
  const prof = [[0, 0], [1.55, 0], [1.6, 0.05], [1.6, 0.85], [1.45, 0.85], [1.45, 0.15], [0, 0.15]].map(([x, y]) => new THREE.Vector2(x, y));
  g.add(mesh(new THREE.LatheGeometry(prof, 96), mat));
  // tampa apoiada ao lado
  const lid = new THREE.Group();
  const lprof = [[0, 0.25], [1.62, 0.25], [1.68, 0.2], [1.68, 0], [1.5, 0], [1.5, 0.12], [0, 0.12]].map(([x, y]) => new THREE.Vector2(x, y));
  lid.add(mesh(new THREE.LatheGeometry(lprof, 96), mat));
  const cs = new THREE.Shape();
  const a = 0.09;
  cs.moveTo(-a, -0.75); cs.lineTo(a, -0.75); cs.lineTo(a, 0.2); cs.lineTo(0.42, 0.2); cs.lineTo(0.42, 0.38); cs.lineTo(a, 0.38);
  cs.lineTo(a, 0.75); cs.lineTo(-a, 0.75); cs.lineTo(-a, 0.38); cs.lineTo(-0.42, 0.38); cs.lineTo(-0.42, 0.2); cs.lineTo(-a, 0.2);
  const cm = mesh(ext(cs, 0.06, 0.02), mat);
  cm.rotation.x = -Math.PI / 2; cm.position.y = 0.25;
  lid.add(cm);
  lid.position.set(2.6, 0, 1.2);
  g.add(lid);
  // terço saindo da caixa
  const bm = new THREE.MeshPhysicalMaterial({ color: beadColor, roughness: 0.35, clearcoat: 0.4 });
  const path = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.6, 0.75, 0.2), new THREE.Vector3(0.4, 0.9, 0.9), new THREE.Vector3(1.4, 0.4, 1.5),
    new THREE.Vector3(1.9, 0.12, 2.6), new THREE.Vector3(1.2, 0.12, 3.4), new THREE.Vector3(0.1, 0.12, 3.3),
    new THREE.Vector3(-0.5, 0.12, 2.6),
  ]);
  const n = 34;
  for (let i = 0; i < n; i++) {
    const p = path.getPointAt(i / (n - 1));
    const big = i % 11 === 5;
    const b = mesh(new THREE.SphereGeometry(big ? 0.15 : 0.11, 24, 16), bm);
    b.position.copy(p); b.position.y = Math.max(p.y, big ? 0.15 : 0.11);
    g.add(b);
  }
  const chain = mesh(new THREE.TubeGeometry(path, 200, 0.02, 6), metal(), false);
  g.add(chain);
  // crucifixo do terço
  const cr = mesh(ext(cs, 0.06, 0.02), pla(beadColor));
  cr.scale.setScalar(0.55); cr.rotation.x = -Math.PI / 2; cr.rotation.z = 0.5;
  cr.position.set(-1.0, 0.03, 2.2);
  g.add(cr);
  return g;
}

// Vaso com nervuras em espiral (impressão em modo vaso)
export function vase(color, { h = 6, ribs = 28, twist = 0.5, amp = 0.07 } = {}) {
  const prof = [];
  const N = 120;
  for (let i = 0; i <= N; i++) {
    const t = i / N, y = t * h;
    const r = 1.05 + 0.85 * Math.sin(Math.PI * (0.15 + 0.7 * t)) - 0.35 * t;
    prof.push(new THREE.Vector2(r, y));
  }
  // borda e interior
  const top = prof[prof.length - 1];
  prof.push(new THREE.Vector2(top.x - 0.08, h));
  prof.push(new THREE.Vector2(top.x - 0.08, h - 0.6));
  prof.unshift(new THREE.Vector2(0, 0));
  let geo = new THREE.LatheGeometry(prof, 256);
  geo.deleteAttribute('normal'); geo.deleteAttribute('uv');
  geo = mergeVertices(geo, 1e-4);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const r = Math.hypot(x, z); if (r < 0.01 || y > h - 0.62 && y < h - 0.001 && r < top.x - 0.05) continue;
    const ang = Math.atan2(z, x);
    const k = Math.min(1, y / 0.25);
    const nr = r + amp * k * Math.cos(ribs * ang + twist * y * Math.PI);
    p.setXYZ(i, x / r * nr, y, z / r * nr);
  }
  geo.computeVertexNormals();
  return mesh(geo, pla(color, { layer: 0.04, amp: 0.008 }));
}

// Galhos secos para o vaso
export function stems(color, { h = 6 } = {}) {
  const g = new THREE.Group();
  const mat = fosco(color, 0.95);
  const defs = [[-0.1, 0.25, 1], [0.15, -0.3, 0.9], [0.05, 0.05, 1.1]];
  defs.forEach(([dx, lean, len], k) => {
    const pts = [new THREE.Vector3(0, h * 0.4, 0), new THREE.Vector3(dx, h * 0.95, lean * 0.3), new THREE.Vector3(dx * 2 + lean, h * (1 + 0.55 * len), lean * 0.8)];
    const c = new THREE.CatmullRomCurve3(pts);
    g.add(mesh(new THREE.TubeGeometry(c, 40, 0.025, 6), mat));
    for (let i = 0; i < 14; i++) {
      const t = 0.55 + i * 0.032;
      const q = c.getPointAt(Math.min(t, 1));
      const leaf = mesh(new THREE.SphereGeometry(0.13, 12, 8), mat);
      leaf.scale.set(1, 0.35, 0.6);
      const side = i % 2 ? 1 : -1;
      leaf.position.set(q.x + side * 0.13, q.y, q.z);
      leaf.rotation.z = side * 0.6 + k;
      g.add(leaf);
    }
  });
  return g;
}

// Porta-lápis sextavado com lápis
export function penCup(color, { h = 3.6, r = 1.2 } = {}) {
  const g = new THREE.Group();
  const prof = [[0, 0], [r, 0], [r * 1.08, h], [r * 1.08 - 0.12, h], [r - 0.12, 0.2], [0, 0.2]].map(([x, y]) => new THREE.Vector2(x, y));
  const geo = new THREE.LatheGeometry(prof, 6);
  const m = mesh(geo, pla(color));
  m.material.flatShading = true;
  g.add(m);
  const cols = [0x2f2f31, 0xd9b48a, 0x6b6964];
  [[0.3, 0.2, 0.12], [-0.35, 0.1, -0.1], [0.05, -0.35, 0.05]].forEach(([x, z, tilt], i) => {
    const p = new THREE.Group();
    const body = mesh(new THREE.CylinderGeometry(0.11, 0.11, 4.6, 6), fosco(cols[i], 0.6));
    p.add(body);
    const tip = mesh(new THREE.ConeGeometry(0.11, 0.35, 6), fosco(0xe2c7a3, 0.8));
    tip.position.y = 2.47; p.add(tip);
    p.position.set(x, 2.5, z); p.rotation.set(tilt, 0, -x * 0.25);
    g.add(p);
  });
  return g;
}

// Organizador com divisórias
export function tray(color, { w = 5, d = 3.2, h = 0.9 } = {}) {
  const g = new THREE.Group();
  const mat = pla(color);
  const t = 0.16;
  const add = (sx, sy, sz, x, y, z) => { const m = mesh(new RoundedBoxGeometry(sx, sy, sz, 3, 0.05), mat); m.position.set(x, y, z); g.add(m); };
  add(w, 0.2, d, 0, 0.1, 0);
  add(w, h, t, 0, h / 2, d / 2 - t / 2); add(w, h, t, 0, h / 2, -d / 2 + t / 2);
  add(t, h, d, w / 2 - t / 2, h / 2, 0); add(t, h, d, -w / 2 + t / 2, h / 2, 0);
  add(t, h * 0.85, d, -w / 2 + w * 0.36, h * 0.425, 0);
  add(w * 0.64, h * 0.85, t, w * 0.18, h * 0.425, 0);
  return g;
}

// Casinhas decorativas (eco do símbolo da marca)
export function house(color, { w = 1.4, h = 2.2, d = 1.1 } = {}) {
  const s = new THREE.Shape();
  const roof = w * 0.5;
  s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(w / 2, h - roof); s.lineTo(0, h); s.lineTo(-w / 2, h - roof); s.lineTo(-w / 2, 0);
  const g = new THREE.Group();
  const m = mesh(ext(s, d, 0.05), pla(color));
  m.position.z = -d / 2; m.position.y = 0.05;
  g.add(m);
  return g;
}

export function pedestal(color, { r = 2, h = 1, box = false, w = 4, d = 3 } = {}) {
  const geo = box ? new RoundedBoxGeometry(w, h, d, 4, 0.08) : new THREE.CylinderGeometry(r, r, h, 96);
  const m = mesh(geo, fosco(color, 0.85));
  m.position.y = h / 2;
  const g = new THREE.Group(); g.add(m);
  return g;
}

// Cena base: fundo infinito, luz suave, sombras macias
export function stage({ bg = C.nevoa, canvas, w, h, cam, target, fov = 30, light = [6, 12, 8], lightI = 3.0, env = 0.4, exposure = 1.0, shadowBox = 8, shift = 0 }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(2);
  renderer.setSize(w, h, false);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.VSMShadowMap;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = exposure;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(bg);
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = env;

  // fundo infinito (piso + curva + parede)
  const sweepShape = [];
  const R = 14;
  sweepShape.push(new THREE.Vector2(-80, 0));
  for (let i = 0; i <= 24; i++) { const a = -Math.PI / 2 + (i / 24) * (Math.PI / 2); sweepShape.push(new THREE.Vector2(Math.cos(a) * R - 20 + R - R, R + Math.sin(a) * R)); }
  const sweepMat = fosco(bg, 1);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), sweepMat);
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true;
  scene.add(floor);
  const wallCurve = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 200, 48, 1, true, Math.PI, Math.PI / 2), sweepMat);
  wallCurve.rotation.z = Math.PI / 2; wallCurve.position.set(0, R, -22 + R); wallCurve.receiveShadow = true;
  wallCurve.material.side = THREE.DoubleSide;
  scene.add(wallCurve);
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), sweepMat);
  wall.position.set(0, R + 100, -22); wall.receiveShadow = true;
  scene.add(wall);
  // remove piso atrás da curva
  floor.geometry = new THREE.PlaneGeometry(200, 100); floor.position.z = -22 + R + 50;

  const hemi = new THREE.HemisphereLight(0xffffff, 0xe8e4de, 0.35);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff8f0, lightI);
  sun.position.set(...light);
  sun.castShadow = true;
  sun.shadow.mapSize.set(4096, 4096);
  const sc = sun.shadow.camera; sc.left = -shadowBox; sc.right = shadowBox; sc.top = shadowBox; sc.bottom = -shadowBox; sc.near = 0.5; sc.far = 60;
  sun.shadow.radius = 7; sun.shadow.blurSamples = 25; sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02;
  scene.add(sun);
  sun.target.position.set(...(target || [0, 0, 0])); scene.add(sun.target);
  const fill = new THREE.DirectionalLight(0xf0f2ff, 0.35);
  fill.position.set(-8, 5, 6); scene.add(fill);

  const camera = new THREE.PerspectiveCamera(fov, w / h, 0.1, 300);
  camera.position.set(...cam);
  camera.lookAt(...(target || [0, 0, 0]));
  if (shift) camera.setViewOffset(w, h, 0, -shift * h, w, h);
  return { renderer, scene, camera, render: () => renderer.render(scene, camera) };
}
