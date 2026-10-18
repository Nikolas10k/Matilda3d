const aviao = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"><path d="M21.5 2.5 10.5 13.5"/><path d="M21.5 2.5 14.5 21.5 10.5 13.5 2.5 9.5Z"/></svg>`;
const nota = '<span class="nota">Imagens ilustrativas</span>';

const rodape = (dir) => `<div class="rodape"><div class="marca"><img src="simbolo.svg" alt="">@matildaimpressao3d</div><div class="dir">${dir}</div></div>`;
const contador = (n) => `${nota}<span class="contador">${n} / 05</span>`;

// foto: [arquivo, posição do recorte], altura da foto
function foto(arq, pos, h) {
  return `<div class="foto" data-src="fotos/${arq}" style="height:${h}px;background-image:url(fotos/${arq});background-position:${pos}"></div>`;
}
function painel(h, rotulo, titulo, sub, extra = '') {
  return `<div class="painel" style="top:${h}px"><div class="rotulo"><i></i>${rotulo}</div><h1>${titulo}</h1><p class="sub">${sub}</p>${extra}</div>`;
}

export const ARTES = {
  s1: foto('capa.jpg', '58% 60%', 830)
    + painel(830, 'Matilda Impressão 3D', 'Sua ideia merece<br>ganhar forma.', 'Chaveiros, artigos religiosos e produtos para casa.')
    + rodape(`${nota}<span class="contador">Deslize → &nbsp;01 / 05</span>`),

  s2: foto('inicial.jpg', '45% 50%', 830)
    + painel(830, 'Chaveiros', 'Pequenos detalhes.<br>Grandes significados.', 'Chaveiros personalizados para carregar o que importa.')
    + rodape(contador('02')),

  s3: foto('imagem.jpg', '50% 8%', 830)
    + painel(830, 'Artigos religiosos', 'Sua fé em<br>cada detalhe.', 'Peças especiais para presentear, decorar e celebrar.')
    + rodape(contador('03')),

  s4: foto('pampas.jpg', '50% 90%', 830)
    + painel(830, 'Para casa', 'Mais personalidade<br>para o seu lar.', 'Decoração e utilidade com criatividade.')
    + rodape(contador('04')),

  s5: `<div class="centro">
      <img src="logo-principal.svg" alt="Matilda Impressão 3D" style="height:140px">
      <h1 style="margin-top:50px">Vamos dar forma<br>à sua ideia?</h1>
      <p class="sub" style="max-width:800px">Escolha o que deseja, conte sua ideia e consulte as possibilidades de personalização.</p>
      <div class="cta">${aviao}Encomende pelo Direct ou WhatsApp</div>
      <div class="tira">
        <div data-src="fotos/dragoes.jpg" style="background-image:url(fotos/dragoes.jpg);background-position:50% 45%"></div>
        <div data-src="fotos/terco.jpg" style="background-image:url(fotos/terco.jpg);background-position:40% 50%"></div>
        <div data-src="fotos/vaso-donut.jpg" style="background-image:url(fotos/vaso-donut.jpg);background-position:50% 50%"></div>
      </div>
    </div>` + rodape(contador('05')),

  p2: foto('dragoes.jpg', '50% 42%', 720)
    + painel(720, 'Chaveiros personalizados', 'Não é só um chaveiro.<br><b>É algo seu.</b>', 'Personalize, presenteie e surpreenda.',
      `<div class="cta">${aviao}Peça o seu pelo Direct</div>`)
    + rodape(nota),

  p3: `<div class="duas" style="height:720px">
      <div data-src="fotos/terco.jpg" style="background-image:url(fotos/terco.jpg);background-position:38% 50%"></div>
      <div data-src="fotos/vaso-donut.jpg" style="background-image:url(fotos/vaso-donut.jpg);background-position:50% 55%"></div>
    </div>`
    + painel(720, 'Fé e lar', 'Detalhes que tornam<br>tudo mais especial.', 'Peças para sua fé, sua casa e seus momentos.',
      `<div class="cta">${aviao}Conheça as possibilidades. Chame no Direct.</div>`)
    + rodape(nota),
};
