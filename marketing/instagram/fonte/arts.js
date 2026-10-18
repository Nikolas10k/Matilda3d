import * as L from './lib.js';
const { THREE, C } = L;
const W = 1080, H = 1350;

const aviao = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"><path d="M21.5 2.5 10.5 13.5"/><path d="M21.5 2.5 14.5 21.5 10.5 13.5 2.5 9.5Z"/></svg>`;

const rodape = (dir) => `<div class="rodape"><div class="marca"><img src="simbolo.svg" alt="">@matildaimpressao3d</div>${dir}</div>`;
const nota = '<span class="nota">Imagens ilustrativas</span>';
const contador = (n) => `<span class="contador">${n} / 05</span>`;

function topo(rotulo, titulo, sub, extra = '') {
  return `<div class="rotulo"><i></i>${rotulo}</div><h1>${titulo}</h1><p class="sub">${sub}</p>${extra}`;
}

function add(scene, obj, x, y, z, ry = 0) { obj.position.set(x, y, z); obj.rotation.y += ry; scene.add(obj); return obj; }

export const ARTS = {
  // ---------- CARROSSEL ----------
  s1: {
    html: topo('Matilda Impressão 3D', 'Sua ideia merece<br>ganhar forma.', 'Chaveiros, artigos religiosos e produtos para casa.')
      + rodape(`<span class="contador">Deslize &nbsp;→&nbsp;&nbsp; 01 / 05</span>`),
    build(canvas) {
      const s = L.stage({ canvas, w: W, h: H, cam: [0, 10, 27], target: [0, 5.2, 0], fov: 29, light: [7, 14, 9] });
      add(s.scene, L.pedestal(C.perola, { r: 1.9, h: 1.6 }), -0.4, 0, -1.2);
      add(s.scene, L.figure(C.branco, { scale: 0.78 }), -0.4, 1.6, -1.2, 0);
      add(s.scene, L.vase(C.perola, { h: 4.6 }), 3.5, 0, -0.8);
      add(s.scene, L.keychainName('Sofia', C.branco, C.grafite, { size: 0.8 }), -2.0, 0.14, 2.2, 0.3);
      add(s.scene, L.house(C.grafite, { w: 0.9, h: 1.4, d: 0.8 }), 1.3, 0, 1.6, -0.3);
      add(s.scene, L.house(C.concreto, { w: 0.75, h: 1.1, d: 0.7 }), 2.1, 0, 1.9, -0.3);
      return s;
    },
  },
  s2: {
    html: topo('Chaveiros', 'Pequenos detalhes.<br>Grandes significados.', 'Chaveiros personalizados para carregar o que importa.')
      + rodape(contador('02')),
    build(canvas) {
      const s = L.stage({ canvas, w: W, h: H, cam: [0, 15, 21], target: [0.3, 0.4, 0.7], fov: 31, light: [5, 14, 7], shadowBox: 7, shift: 0.2 });
      add(s.scene, L.pedestal(C.perola, { box: true, w: 13, h: 0.5, d: 7 }), 0.3, 0, 0.4);
      add(s.scene, L.keychainName('Sofia', C.branco, C.grafite), -1.3, 0.62, -0.6, 0.12);
      add(s.scene, L.keychainInitial('L', C.grafite, C.branco), 3.3, 0.62, 1.2, -0.25);
      add(s.scene, L.keychainPet('Thor', C.concreto, C.grafite), -1.2, 0.62, 2.0, -0.08);
      return s;
    },
  },
  s3: {
    html: topo('Artigos religiosos', 'Sua fé em<br>cada detalhe.', 'Peças especiais para presentear, decorar e celebrar.')
      + rodape(contador('03')),
    build(canvas) {
      const s = L.stage({ canvas, w: W, h: H, cam: [0, 9.5, 27], target: [0, 2.6, 0.4], fov: 30, light: [-6, 13, 8], shift: 0.17 });
      add(s.scene, L.pedestal(C.perola, { r: 1.7, h: 2.2 }), 0.2, 0, -1.6);
      add(s.scene, L.figure(C.branco, { scale: 0.8 }), 0.2, 2.2, -1.6);
      add(s.scene, L.cross(C.perola, { h: 4.6, w: 2.7, t: 0.55, d: 0.45 }), -3.4, 0, -0.4, 0.25);
      add(s.scene, L.rosaryBox(C.branco, C.concreto), 1.6, 0, 0.2, -0.4);
      return s;
    },
  },
  s4: {
    html: topo('Para casa', 'Mais personalidade<br>para o seu lar.', 'Decoração e utilidade com criatividade.')
      + rodape(contador('04')),
    build(canvas) {
      const s = L.stage({ canvas, w: W, h: H, cam: [0, 10, 29], target: [0.6, 2.4, 0], fov: 30, light: [7, 13, 8], shift: 0.17 });
      add(s.scene, L.vase(C.branco, { h: 6.2 }), -2.6, 0, -1.4);
      add(s.scene, L.penCup(C.grafite), 1.3, 0, -1.8, 0.3);
      add(s.scene, L.tray(C.perola), 1.6, 0, 1.6, -0.25);
      add(s.scene, L.house(C.branco, { w: 1.2, h: 1.9, d: 1.0 }), 4.3, 0, -0.4, -0.4);
      add(s.scene, L.house(C.concreto, { w: 0.95, h: 1.45, d: 0.9 }), 5.0, 0, 0.5, -0.4);
      return s;
    },
  },
  s5: {
    html: `<div style="display:flex;flex-direction:column;align-items:center;text-align:center">
        <img src="logo-principal.svg" alt="Matilda Impressão 3D" style="height:150px;margin-top:-6px">
        <h1 style="margin-top:56px">Vamos dar forma<br>à sua ideia?</h1>
        <p class="sub" style="max-width:780px">Escolha o que deseja, conte sua ideia e consulte as possibilidades de personalização.</p>
        <div class="cta" style="margin-top:44px">${aviao}Encomende pelo Direct ou WhatsApp</div>
      </div>` + `<div class="rodape" style="justify-content:center"><span class="contador">@MATILDAIMPRESSAO3D &nbsp;·&nbsp; 05 / 05</span></div>`,
    build(canvas) {
      const s = L.stage({ canvas, w: W, h: H, cam: [0, 6.5, 25], target: [0, 1.2, 0.8], fov: 30, light: [6, 12, 9], shadowBox: 7, shift: 0.31 });
      add(s.scene, L.keychainInitial('M', C.branco, C.grafite), -3.2, 0.14, 1.6, 0.3);
      add(s.scene, L.cross(C.perola, { h: 2.6, w: 1.6, t: 0.36, d: 0.32 }), 0, 0, 0.6, 0.1);
      add(s.scene, L.vase(C.concreto, { h: 2.6, amp: 0.05 }), 3.3, 0, 1.0);
      return s;
    },
  },

  // ---------- POST 2: CHAVEIROS ----------
  p2: {
    html: topo('Chaveiros personalizados', 'Não é só um chaveiro.<br><b>É algo seu.</b>', 'Personalize, presenteie e surpreenda.',
      `<div class="cta" style="margin-top:38px">${aviao}Peça o seu pelo Direct</div>`) + rodape(nota),
    build(canvas) {
      const s = L.stage({ canvas, w: W, h: H, cam: [1, 15, 18.5], target: [0.6, 0.2, 1.0], fov: 30, shift: 0.2, light: [8, 9, 5], lightI: 2.6, shadowBox: 7, exposure: 1.02 });
      s.scene.children.filter((o) => o.isDirectionalLight && o.castShadow).forEach((l) => l.color.set(0xfff6ee));
      add(s.scene, L.keychainName('Helena', C.branco, C.grafite), -0.3, 0.14, -0.6, 0.1);
      add(s.scene, L.keychainInitial('A', C.grafite, C.perola), 3.4, 0.14, 2.3, -0.35);
      add(s.scene, L.keychainPet('Thor', C.perola, C.grafite), -0.7, 0.14, 2.4, -0.12);
      return s;
    },
  },

  // ---------- POST 3: FÉ E LAR ----------
  p3: {
    html: topo('Fé e lar', 'Detalhes que tornam<br>tudo mais especial.', 'Peças para sua fé, sua casa e seus momentos.',
      `<div class="cta" style="margin-top:38px">${aviao}Conheça as possibilidades. Chame no Direct.</div>`) + rodape(nota),
    build(canvas) {
      const s = L.stage({ canvas, w: W, h: H, cam: [0, 9.5, 26], target: [0, 2.6, 0.2], fov: 30, light: [-7, 13, 9], shift: 0.19 });
      add(s.scene, L.pedestal(C.perola, { box: true, w: 4.4, h: 1.4, d: 3 }), -2.4, 0, -1.2);
      add(s.scene, L.figure(C.branco, { scale: 0.72 }), -3.0, 1.4, -1.4);
      add(s.scene, L.cross(C.concreto, { h: 3.4, w: 2.0, t: 0.42, d: 0.36 }), -1.2, 1.4, -0.6, 0.2);
      add(s.scene, L.vase(C.perola, { h: 5.0 }), 2.6, 0, -1.6);
      add(s.scene, L.tray(C.branco, { w: 4, d: 2.6, h: 0.8 }), 1.6, 0, 2.2, -0.2);
      return s;
    },
  },
};
