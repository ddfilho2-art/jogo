import { Retangulo, PontoGancho } from './types';
import { PALETA_VALE, TILE_SIZE, MAP_WIDTH, MAP_HEIGHT } from './constants';

export interface ArvoreInfo {
  id: string;
  x: number; // Posição X da árvore (copa 32x32)
  y: number; // Posição Y da árvore
  w: number; // 32px
  h: number; // 32px
}

export interface RioSegmento {
  x: number;
  y: number;
  w: number;
  h: number;
  tipo: 'normal' | 'largo'; // normal: 32px, largo: 48px (local do Fragmento de Forja 1)
}

export interface PonteInfo {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ColetavelVidaInfo {
  x: number;
  y: number;
  w: number;
  h: number;
}

// Baú secundário localizado na ilha secreta do vão de 3 tiles
export const BAU_ILHA_BOSQUE = {
  id: 'bau_secundario_ilha_bosque',
  x: 48,
  y: 312,
  w: 16,
  h: 16,
  selos: 50,
  nome: 'Baú Oculto do Bosque',
  subtitulo: '+50 Selos Ancestrais',
};

// Pontos de Gancho no Vale Verdejante:
// Argolas douradas (#c9a24b) para cruzar o vão de 3 tiles (48px)
export const VALE_PONTOS_GANCHO: PontoGancho[] = [
  // 1. Ponto de Gancho na margem leste (Terra firme)
  {
    id: 'ponto_gancho_vale_terra',
    x: 136,
    y: 328,
    w: 16,
    h: 16,
    rotulo: 'Argola de Vinha (Margem)',
  },
  // 2. Ponto de Gancho na ilha secreta (Ilha do Baú Secundário)
  {
    id: 'ponto_gancho_vale_ilha',
    x: 72,
    y: 328,
    w: 16,
    h: 16,
    rotulo: 'Argola de Vinha (Ilha Secreta)',
  },
];

// Colisores do Vão de 3 Tiles (48px de largura) e fosso ao redor da ilha
export const VAO_ILHA_COLISORES: Retangulo[] = [
  // Vão de 3 tiles (48px de largura entre x: 88 e 136)
  { x: 88, y: 304, w: 48, h: 64, cor: '#0f172a', rotulo: 'Vão de 3 Tiles (Abismo)' },
  // Fosso ao redor para isolar a ilha de caminhada a pé
  { x: 24, y: 288, w: 112, h: 16, cor: '#0f172a', rotulo: 'Abismo Norte da Ilha' },
  { x: 24, y: 368, w: 112, h: 16, cor: '#0f172a', rotulo: 'Abismo Sul da Ilha' },
  { x: 24, y: 304, w: 16, h: 64, cor: '#0f172a', rotulo: 'Penhasco Oeste da Ilha' },
];

// ============================================================================
// CONFIGURAÇÃO GEOMÉTRICA DO VALE VERDEJANTE (768x672px - 3x3 TELAS DE 256x224)
// ============================================================================

// Ponte de madeira de 32px conectando as margens na tela central [1, 1]
export const PONTE_VALE: PonteInfo = {
  x: 464,
  y: 320,
  w: 32,
  h: 32,
};

// Coletável de vida: losango dourado 8x8px localizado na clareira da tela leste [2, 1]
export const COLETAVEL_VIDA: ColetavelVidaInfo = {
  x: 636,
  y: 332,
  w: 8,
  h: 8,
};

// Segmentos visuais do rio atravessando o mapa
export const RIO_SEGMENTOS: RioSegmento[] = [
  // 1. Ponto mais largo do rio: 48px de largura (Tela Nordeste [2, 0])
  // SEM PONTE - local da margem isolada do Fragmento de Forja 1
  { x: 592, y: 0, w: 48, h: 200, tipo: 'largo' },

  // 2. Curva de transição conectando o trecho largo ao trecho central de 32px
  { x: 536, y: 196, w: 68, h: 32, tipo: 'normal' },
  { x: 496, y: 220, w: 48, h: 32, tipo: 'normal' },

  // 3. Trecho central de 32px de largura (Tela [1, 1]), onde fica a ponte em y: 320..352
  { x: 464, y: 248, w: 32, h: 72, tipo: 'normal' },  // Acima da ponte (y: 248..320)
  // [Aqui fica a PONTE de madeira: x: 464..496, y: 320..352]
  { x: 464, y: 352, w: 32, h: 104, tipo: 'normal' }, // Abaixo da ponte (y: 352..456)

  // 4. Trecho sul de 32px descendo até o limite sul do mapa (Telas [1, 2] e [2, 2])
  { x: 472, y: 456, w: 32, h: 80, tipo: 'normal' },
  { x: 496, y: 530, w: 32, h: 74, tipo: 'normal' },
  { x: 520, y: 600, w: 32, h: 72, tipo: 'normal' },
];

// Caixas de colisão sólida do rio (bloqueiam o herói, exceto sobre a ponte de madeira)
export const RIO_COLISORES: Retangulo[] = [
  // Ponto largo (48px) no nordeste - intransponível
  { x: 592, y: 0, w: 48, h: 200, cor: '#1e40af', rotulo: 'Rio Largo (48px)' },
  // Curvas de conexão
  { x: 536, y: 196, w: 68, h: 28, cor: '#1e40af', rotulo: 'Rio' },
  { x: 496, y: 220, w: 44, h: 30, cor: '#1e40af', rotulo: 'Rio' },

  // Trecho central acima da ponte
  { x: 464, y: 248, w: 32, h: 72, cor: '#1e40af', rotulo: 'Rio' },
  // [A ponte em y: 320..352 está livre de colisão]
  // Trecho central abaixo da ponte
  { x: 464, y: 352, w: 32, h: 104, cor: '#1e40af', rotulo: 'Rio' },

  // Trecho sul
  { x: 472, y: 456, w: 32, h: 76, cor: '#1e40af', rotulo: 'Rio' },
  { x: 496, y: 530, w: 32, h: 72, cor: '#1e40af', rotulo: 'Rio' },
  { x: 520, y: 600, w: 32, h: 72, cor: '#1e40af', rotulo: 'Rio' },
];

// Geração orgânica e consistente das árvores no mapa 768x672
function gerarArvoresVale(): ArvoreInfo[] {
  const arvores: ArvoreInfo[] = [];
  let idCount = 1;

  const addTree = (x: number, y: number) => {
    // Garante que não sobreponha a ponte ou o canal do rio
    const treeTrunkBox: Retangulo = { x: x + 12, y: y + 24, w: 8, h: 8 };
    const sobrepoePonte =
      x + 32 > PONTE_VALE.x - 8 &&
      x < PONTE_VALE.x + PONTE_VALE.w + 8 &&
      y + 32 > PONTE_VALE.y - 8 &&
      y < PONTE_VALE.y + PONTE_VALE.h + 8;
    if (sobrepoePonte) return;

    // Evita árvores dentro da água do rio
    for (const r of RIO_COLISORES) {
      if (
        treeTrunkBox.x < r.x + r.w &&
        treeTrunkBox.x + treeTrunkBox.w > r.x &&
        treeTrunkBox.y < r.y + r.h &&
        treeTrunkBox.y + treeTrunkBox.h > r.y
      ) {
        return;
      }
    }

    arvores.push({
      id: `tree_${idCount++}`,
      x,
      y,
      w: 32,
      h: 32,
    });
  };

  // 1. Bordas do mapa (Norte, Oeste, Sul, Leste) deixando aberturas de trilha
  // Borda Norte (deixa passagem em x: 352..416 para Pedraverde)
  for (let x = 0; x <= MAP_WIDTH - 32; x += 32) {
    if (x >= 352 && x <= 416) continue; // Caminho Norte para Vilarejo de Pedraverde
    addTree(x, 0);
  }

  // Borda Sul (deixa passagem em x: 352..416 para a Entrada do Vale)
  for (let x = 0; x <= MAP_WIDTH - 32; x += 32) {
    if (x >= 352 && x <= 416) continue; // Entrada Sul do Vale
    addTree(x, MAP_HEIGHT - 32);
  }

  // Borda Oeste
  for (let y = 32; y < MAP_HEIGHT - 32; y += 32) {
    addTree(0, y);
  }

  // Borda Leste
  for (let y = 32; y < MAP_HEIGHT - 32; y += 32) {
    addTree(MAP_WIDTH - 32, y);
  }

  // 2. Isolamento da margem nordeste do Fragmento de Forja 1 (Tela [2, 0])
  // A margem oposta ao rio largo de 48px fica protegida por árvores densas nas bordas
  for (let y = 32; y <= 160; y += 32) {
    addTree(MAP_WIDTH - 64, y);
  }
  addTree(680, 48);
  addTree(720, 80);
  addTree(696, 128);

  // 3. Bosque Antigo Noroeste (Tela [0, 0])
  const noroestePos = [
    [48, 48], [80, 48], [112, 48],
    [48, 80], [112, 80],
    [48, 112], [80, 144], [128, 144],
    [160, 64], [192, 80], [160, 112],
  ];
  noroestePos.forEach(([x, y]) => addTree(x, y));

  // 4. Bosque Sussurrante Ocidental (Tela [0, 1] e [0, 2])
  // Árvores circundam o bosque secreto do Vão de 3 tiles e da ilha isolada (y: 288..384, x: 24..144)
  const oestePos = [
    [48, 240], [96, 240], [144, 240], [176, 260],
    [188, 300], [188, 350], [176, 390],
    [48, 400], [96, 400], [144, 400],
    [48, 480], [80, 512], [112, 480],
    [64, 560], [128, 576], [160, 520],
  ];
  oestePos.forEach(([x, y]) => addTree(x, y));

  // 5. Arvoredos da Trilha Central (Tela [1, 0], [1, 1], [1, 2])
  const centroPos = [
    [272, 64], [304, 80], [272, 112],
    [288, 240], [320, 256], [288, 304],
    [320, 384], [288, 416], [352, 432],
    [272, 496], [304, 528], [272, 576],
    // Árvores ornamentando as margens do rio
    [416, 224], [416, 384], [416, 448],
    [528, 288], [544, 368], [528, 432],
  ];
  centroPos.forEach(([x, y]) => addTree(x, y));

  // 6. Bosque Oriental e Clareira Sagrada do Coletável (Tela [2, 1] e [2, 2])
  const lestePos = [
    // Clareira do coletável em (636, 332) moldada por árvores
    [592, 272], [656, 272], [688, 288],
    [592, 384], [672, 384],
    [704, 352], [704, 416],
    // Bosque sul-sudeste
    [592, 480], [624, 512], [656, 480],
    [688, 544], [624, 576], [656, 608],
    [576, 560], [576, 608],
  ];
  lestePos.forEach(([x, y]) => addTree(x, y));

  return arvores;
}

export const VALE_ARVORES: ArvoreInfo[] = gerarArvoresVale();

// Árvore Ancestral do Bosque Noroeste que sela a Cripta do Guardião Adormecido
export const ARVORE_CRIPTA = {
  x: 80,
  y: 96,
  w: 32,
  h: 32,
};

// Hitbox de interação da entrada da Cripta (quando revelada)
export const ENTRADA_CRIPTA_HITBOX: Retangulo = {
  x: ARVORE_CRIPTA.x + 4,
  y: ARVORE_CRIPTA.y + 8,
  w: 24,
  h: 20,
  rotulo: 'Entrada da Cripta do Guardião',
};

// Obtém todas as hitboxes sólidas do Vale Verdejante:
// - Tronco inferior de cada árvore (exatamente 8x8px)
// - Colisores do rio (com a ponte de 32px livre)
export function getValeObstaculos(arvoreCriptaDestruida: boolean = false): Retangulo[] {
  const obstaculos: Retangulo[] = [];

  // Hitbox de 8x8px só no tronco inferior de cada árvore comum
  VALE_ARVORES.forEach((arvore) => {
    obstaculos.push({
      x: arvore.x + 12,
      y: arvore.y + 24,
      w: 8,
      h: 8,
      cor: PALETA_VALE.terraTronco,
      rotulo: 'Tronco',
    });
  });

  // Árvore Ancestral da Cripta (só bloqueia se ainda não foi destruída com o golpe carregado)
  if (!arvoreCriptaDestruida) {
    obstaculos.push({
      x: ARVORE_CRIPTA.x + 12,
      y: ARVORE_CRIPTA.y + 24,
      w: 8,
      h: 8,
      cor: PALETA_VALE.terraTronco,
      rotulo: 'Tronco da Árvore Ancestral',
    });
  }

  // Colisores de água do rio
  RIO_COLISORES.forEach((rioCol) => {
    obstaculos.push(rioCol);
  });

  // Colisores do Vão de 3 Tiles (48px) e isolamento da ilha secreta do Gancho
  VAO_ILHA_COLISORES.forEach((col) => {
    obstaculos.push(col);
  });

  // Bases sólidas dos postes de gancho no Vale
  VALE_PONTOS_GANCHO.forEach((pg) => {
    obstaculos.push({
      x: pg.x + 3,
      y: pg.y + 6,
      w: 10,
      h: 9,
      cor: '#334155',
      rotulo: 'Poste de Gancho',
    });
  });

  // Baú secundário na ilha do bosque
  obstaculos.push({
    x: BAU_ILHA_BOSQUE.x,
    y: BAU_ILHA_BOSQUE.y,
    w: BAU_ILHA_BOSQUE.w,
    h: BAU_ILHA_BOSQUE.h,
    cor: '#78350f',
    rotulo: 'Baú do Bosque',
  });

  // Rochedos e ruínas antigas decorativas do Vale
  obstaculos.push(
    { x: 192, y: 192, w: 32, h: 24, cor: '#475569', rotulo: 'Rocha do Vale' },
    { x: 544, y: 128, w: 24, h: 24, cor: '#475569', rotulo: 'Rocha da Margem' },
    { x: 224, y: 448, w: 28, h: 24, cor: '#475569', rotulo: 'Monólito Musgoso' }
  );

  return obstaculos;
}

// ============================================================================
// RENDERIZADORES DE CAMADA EM PIXEL ART DO VALE VERDEJANTE
// ============================================================================

// Renderiza o terreno de base: grama em 2 tons alternados em xadrez sutil
export function renderTerrenoVale(
  ctx: CanvasRenderingContext2D,
  camX: number,
  camY: number,
  viewportW: number,
  viewportH: number,
  animTime: number
) {
  const startCol = Math.max(0, Math.floor(camX / TILE_SIZE));
  const endCol = Math.min(
    Math.ceil(MAP_WIDTH / TILE_SIZE),
    Math.ceil((camX + viewportW) / TILE_SIZE)
  );
  const startRow = Math.max(0, Math.floor(camY / TILE_SIZE));
  const endRow = Math.min(
    Math.ceil(MAP_HEIGHT / TILE_SIZE),
    Math.ceil((camY + viewportH) / TILE_SIZE)
  );

  // 1. Grade de grama com 2 tons alternados em xadrez sutil
  for (let r = startRow; r < endRow; r++) {
    for (let c = startCol; c < endCol; c++) {
      const x = c * TILE_SIZE;
      const y = r * TILE_SIZE;
      const isEven = (r + c) % 2 === 0;

      // Tons sutis de grama em xadrez
      ctx.fillStyle = isEven ? PALETA_VALE.gramaA : PALETA_VALE.gramaB;
      ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

      // Pequenas folhas e tufos de grama sutis
      if ((r * 11 + c * 17) % 7 === 0) {
        ctx.fillStyle = PALETA_VALE.folhagemMedia;
        ctx.fillRect(x + 4, y + 5, 2, 2);
        ctx.fillRect(x + 6, y + 4, 1, 1);
      } else if ((r * 13 + c * 7) % 9 === 0) {
        ctx.fillStyle = PALETA_VALE.folhagemEscura;
        ctx.fillRect(x + 10, y + 8, 2, 2);
      }
    }
  }

  // 2. Trilhas e caminhos de terra sutil (#8b5a2b / tons de terra)
  // Trilha principal norte-sul conectando Pedraverde à entrada do Vale
  const trilhaX = 368;
  if (camX <= trilhaX + 48 && camX + viewportW >= trilhaX) {
    ctx.fillStyle = 'rgba(139, 90, 43, 0.45)';
    ctx.fillRect(trilhaX, Math.max(0, camY), 32, viewportH + 64);
    // Pontilhado e pegadas
    ctx.fillStyle = 'rgba(161, 98, 7, 0.35)';
    for (let y = Math.floor(camY / 24) * 24; y < camY + viewportH + 24; y += 24) {
      ctx.fillRect(trilhaX + 8, y + 4, 4, 2);
      ctx.fillRect(trilhaX + 18, y + 14, 4, 2);
    }
  }

  // Trilha leste-oeste levando até a ponte de madeira
  const trilhaPonteY = 328;
  if (camY <= trilhaPonteY + 32 && camY + viewportH >= trilhaPonteY) {
    ctx.fillStyle = 'rgba(139, 90, 43, 0.4)';
    ctx.fillRect(368, trilhaPonteY, 100, 16);
    ctx.fillRect(496, trilhaPonteY, 120, 16);
  }

  // 3. Renderizar Rio com água animada e margens
  RIO_SEGMENTOS.forEach((seg) => {
    // Verifica visibilidade na câmera
    if (
      seg.x + seg.w < camX ||
      seg.x > camX + viewportW ||
      seg.y + seg.h < camY ||
      seg.y > camY + viewportH
    ) {
      return;
    }

    // Fundo do leito profundo
    ctx.fillStyle = PALETA_VALE.rioAguaProfunda;
    ctx.fillRect(seg.x, seg.y, seg.w, seg.h);

    // Água corrente com reflexos
    ctx.fillStyle = PALETA_VALE.rioAguaSuperficie;
    ctx.fillRect(seg.x + 2, seg.y, seg.w - 4, seg.h);

    // Ondulações e espuma em movimento leve
    ctx.fillStyle = PALETA_VALE.rioEspuma;
    const offsetAnim = Math.floor((animTime * 20) % 16);
    for (let py = seg.y + offsetAnim; py < seg.y + seg.h; py += 16) {
      ctx.fillRect(seg.x + 6, py, Math.min(10, seg.w - 12), 1);
      ctx.fillRect(seg.x + seg.w - 14, py + 8, 8, 1);
    }

    // Margens do rio com grama escura e terra úmida
    ctx.fillStyle = PALETA_VALE.folhagemEscura;
    ctx.fillRect(seg.x, seg.y, 2, seg.h);
    ctx.fillRect(seg.x + seg.w - 2, seg.y, 2, seg.h);
  });

  // Indicador visual no trecho de 48px de largura (Local do Fragmento de Forja 1)
  // Destaca a margem oposta inacessível a leste (Tela [2, 0])
  const forgeIslandX = 648;
  const forgeIslandY = 48;
  if (
    forgeIslandX + 80 >= camX &&
    forgeIslandX <= camX + viewportW &&
    forgeIslandY + 96 >= camY &&
    forgeIslandY <= camY + viewportH
  ) {
    // Altar/platô isolado cercado por água larga
    ctx.fillStyle = '#1e3323';
    ctx.fillRect(forgeIslandX, forgeIslandY, 72, 80);
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 1;
    ctx.strokeRect(forgeIslandX + 0.5, forgeIslandY + 0.5, 71, 79);

    // Pedestal de forja de pedra antiga (aguarda Gancho de Vinha / Fragmento 1)
    ctx.fillStyle = '#334155';
    ctx.fillRect(forgeIslandX + 24, forgeIslandY + 28, 24, 24);
    ctx.strokeStyle = '#64748b';
    ctx.strokeRect(forgeIslandX + 24.5, forgeIslandY + 28.5, 23, 23);

    // Símbolo rúnico de forja gravado no pedestal
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(forgeIslandX + 34, forgeIslandY + 36, 4, 8);
    ctx.fillRect(forgeIslandX + 31, forgeIslandY + 40, 10, 2);

    // Texto sutil no platô indicando a margem misteriosa
    ctx.font = '7px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fbbf24';
    ctx.fillText('Altar da Forja I', forgeIslandX + 36, forgeIslandY + 62);
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('(Margem Inacessível)', forgeIslandX + 36, forgeIslandY + 72);
  }

  // 4. Renderizar a Ponte de Madeira de 32px
  const p = PONTE_VALE;
  if (
    p.x + p.w >= camX &&
    p.x <= camX + viewportW &&
    p.y + p.h >= camY &&
    p.y <= camY + viewportH
  ) {
    // Pilares de sustentação na água
    ctx.fillStyle = '#5c3a1e';
    ctx.fillRect(p.x, p.y - 2, 4, p.h + 4);
    ctx.fillRect(p.x + p.w - 4, p.y - 2, 4, p.h + 4);

    // Tábuas de madeira horizontais (#8b5a2b e #a16207)
    for (let ty = p.y; ty < p.y + p.h; ty += 4) {
      const isAlt = (ty / 4) % 2 === 0;
      ctx.fillStyle = isAlt ? PALETA_VALE.ponteMadeira : PALETA_VALE.ponteMadeiraClara;
      ctx.fillRect(p.x, ty, p.w, 3);
      // Pregos de ferro nas pontas
      ctx.fillStyle = '#334155';
      ctx.fillRect(p.x + 2, ty + 1, 1, 1);
      ctx.fillRect(p.x + p.w - 3, ty + 1, 1, 1);
    }

    // Corrimãos norte e sul da ponte
    ctx.fillStyle = '#78350f';
    ctx.fillRect(p.x - 2, p.y, p.w + 4, 3);
    ctx.fillRect(p.x - 2, p.y + p.h - 3, p.w + 4, 3);

    // Cordas e postes nas 4 pontas
    ctx.fillStyle = '#b45309';
    ctx.fillRect(p.x - 2, p.y - 1, 3, 5);
    ctx.fillRect(p.x + p.w - 1, p.y - 1, 3, 5);
    ctx.fillRect(p.x - 2, p.y + p.h - 4, 3, 5);
    ctx.fillRect(p.x + p.w - 1, p.y + p.h - 4, 3, 5);
  }

  // 5. Renderizar o Vão de 3 Tiles (48px) e a Ilha Secreta no Bosque Ocidental (Tela [0, 1])
  const vaoX = 88;
  const vaoY = 304;
  const vaoW = 48; // Exatamente 3 tiles de 16px = 48px
  const vaoH = 64;
  const ilhaX = 36;
  const ilhaY = 300;
  const ilhaW = 52;
  const ilhaH = 68;

  // Verifica visibilidade na câmera
  if (
    ilhaX + ilhaW + vaoW + 64 >= camX &&
    ilhaX - 32 <= camX + viewportW &&
    ilhaY + ilhaH + 32 >= camY &&
    ilhaY - 32 <= camY + viewportH
  ) {
    // A) Fosso profundo e despenhadeiro rochoso cercando a ilha
    ctx.fillStyle = '#090d16'; // Abismo escuro profundo
    ctx.fillRect(24, 288, 120, 96);

    // Água escura/bruma mística no fundo do fosso
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(26, 290, 116, 92);

    // Ondulações sutis de água profunda
    ctx.fillStyle = '#1e293b';
    const waveOff = Math.floor((animTime * 15) % 12);
    for (let wy = 292 + waveOff; wy < 380; wy += 12) {
      ctx.fillRect(vaoX + 4, wy, vaoW - 8, 1);
      ctx.fillRect(32, wy, 40, 1);
    }

    // B) Margem Continental Leste (onde fica a argola da terra firme)
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(136, vaoY - 4, 24, vaoH + 8);
    ctx.fillStyle = PALETA_VALE.gramaA;
    ctx.fillRect(138, vaoY - 2, 22, vaoH + 4);
    // Bordas de rocha musgosa talhada
    ctx.fillStyle = '#2d5a3d';
    ctx.fillRect(136, vaoY - 4, 2, vaoH + 8);
    ctx.fillRect(138, vaoY, 1, 2);

    // C) Platô da Ilha Secreta (3x4 tiles de terra sagrada e lajotas)
    // Sombra do platô no abismo
    ctx.fillStyle = '#020617';
    ctx.fillRect(ilhaX + 2, ilhaY + ilhaH - 4, ilhaW - 4, 6);

    // Muros de contenção de pedra antiga
    ctx.fillStyle = '#334155';
    ctx.fillRect(ilhaX, ilhaY, ilhaW, ilhaH);
    ctx.fillStyle = '#475569';
    ctx.fillRect(ilhaX + 1, ilhaY + 1, ilhaW - 2, ilhaH - 2);

    // Gramado verdejante isolado da ilha
    ctx.fillStyle = PALETA_VALE.gramaA;
    ctx.fillRect(ilhaX + 3, ilhaY + 3, ilhaW - 6, ilhaH - 6);
    ctx.fillStyle = PALETA_VALE.gramaB;
    ctx.fillRect(ilhaX + 5, ilhaY + 5, ilhaW - 10, ilhaH - 10);

    // Flores silvestres e musgo na ilha
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(ilhaX + 8, ilhaY + 28, 2, 2);
    ctx.fillRect(ilhaX + 26, ilhaY + 44, 2, 2);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(ilhaX + 14, ilhaY + 48, 2, 2);

    // Pedestal de pedra ornamental sob o baú
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(BAU_ILHA_BOSQUE.x - 2, BAU_ILHA_BOSQUE.y + 12, 20, 6);

    // D) Marcador sutil de 3 tiles no abismo
    ctx.fillStyle = 'rgba(201, 162, 75, 0.2)';
    for (let t = 0; t < 3; t++) {
      ctx.strokeRect(vaoX + t * 16 + 0.5, vaoY + 24 + 0.5, 15, 15);
    }
  }
}

// Renderiza o baú secundário da ilha do vão de 3 tiles (aberto ou fechado)
export function renderBauIlha(
  ctx: CanvasRenderingContext2D,
  camX: number,
  camY: number,
  aberto: boolean,
  animTime: number
) {
  const bx = Math.round(BAU_ILHA_BOSQUE.x - camX);
  const by = Math.round(BAU_ILHA_BOSQUE.y - camY);

  // Sombra suave sob o baú
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.fillRect(bx + 1, by + 12, 14, 4);

  if (!aberto) {
    // BAÚ FECHADO
    // Corpo em madeira nobre escura (#5c3a1e)
    ctx.fillStyle = '#451a03';
    ctx.fillRect(bx, by + 4, 16, 11);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(bx + 1, by + 5, 14, 9);

    // Cintas de ferro/bronze dourado (#c9a24b)
    ctx.fillStyle = '#c9a24b';
    ctx.fillRect(bx + 3, by + 4, 2, 11);
    ctx.fillRect(bx + 11, by + 4, 2, 11);
    ctx.fillRect(bx, by + 8, 16, 2);

    // Fechadura central em ouro (#fbbf24)
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(bx + 7, by + 7, 2, 4);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(bx + 7, by + 9, 2, 1);

    // Brilho sutil do baú não coletado
    const shine = Math.sin(animTime * 3) > 0.7;
    if (shine) {
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(bx + 12, by + 5, 1, 1);
    }
  } else {
    // BAÚ ABERTO
    // Tampa inclinada para trás
    ctx.fillStyle = '#451a03';
    ctx.fillRect(bx, by, 16, 5);
    ctx.fillStyle = '#c9a24b';
    ctx.fillRect(bx + 3, by, 2, 5);
    ctx.fillRect(bx + 11, by, 2, 5);

    // Interior com forro e moedas restantes cintilantes (#f59e0b e #fef08a)
    ctx.fillStyle = '#1e1b4b';
    ctx.fillRect(bx + 1, by + 5, 14, 10);
    ctx.fillStyle = '#d97706';
    ctx.fillRect(bx + 3, by + 7, 10, 6);
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(bx + 4, by + 8, 8, 4);
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(bx + 5, by + 8, 2, 2);
    ctx.fillRect(bx + 9, by + 9, 2, 2);
  }
}

// Renderiza uma árvore completa (copa com paleta #2d5a3d e #4a7c59, tronco #8b5a2b)
export function renderArvore(ctx: CanvasRenderingContext2D, arvore: ArvoreInfo) {
  const { x, y } = arvore;

  // 1. Sombra circular sutil sob a árvore
  ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
  ctx.beginPath();
  ctx.ellipse(x + 16, y + 29, 11, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // 2. Tronco inferior (#8b5a2b) - hitbox 8x8px no centro inferior (x+12, y+24)
  ctx.fillStyle = PALETA_VALE.terraTronco;
  ctx.fillRect(x + 12, y + 20, 8, 11);

  // Detalhe de textura da casca de madeira
  ctx.fillStyle = '#5c3a1e';
  ctx.fillRect(x + 12, y + 22, 2, 7);
  ctx.fillStyle = '#a16207';
  ctx.fillRect(x + 17, y + 24, 2, 5);

  // 3. Copa da Árvore: folhagem escura (#2d5a3d) como base e folhagem média (#4a7c59) no topo
  // Camada base da copa (folhagem escura #2d5a3d)
  ctx.fillStyle = PALETA_VALE.folhagemEscura;
  ctx.beginPath();
  ctx.arc(x + 16, y + 14, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(x + 4, y + 10, 24, 12);

  // Camada de volume médio (folhagem média #4a7c59)
  ctx.fillStyle = PALETA_VALE.folhagemMedia;
  ctx.beginPath();
  ctx.arc(x + 16, y + 11, 11, 0, Math.PI * 2);
  ctx.fill();

  // Camada de topo com iluminação (folhagem média clara)
  ctx.fillStyle = '#5c956c';
  ctx.beginPath();
  ctx.arc(x + 14, y + 8, 7, 0, Math.PI * 2);
  ctx.fill();

  // Folhas individuais decorativas em pixel art
  ctx.fillStyle = '#6fa87e';
  ctx.fillRect(x + 12, y + 5, 3, 2);
  ctx.fillRect(x + 17, y + 8, 2, 2);
  ctx.fillRect(x + 9, y + 11, 2, 2);
}

// Renderiza o coletável de vida: losango dourado 8x8px pulsante
export function renderColetavelVida(
  ctx: CanvasRenderingContext2D,
  col: ColetavelVidaInfo,
  animTime: number
) {
  const { x, y } = col;

  // Animação de flutuação vertical de 2px
  const bobY = Math.round(Math.sin(animTime * 4) * 2);
  const cx = x + 4;
  const cy = y + 4 + bobY;

  // Sombra suave no chão
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.beginPath();
  ctx.ellipse(cx, y + 9, 4, 1.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Brilho dourado pulsante no entorno
  const glowAlpha = 0.25 + Math.sin(animTime * 6) * 0.15;
  ctx.fillStyle = `rgba(251, 191, 36, ${glowAlpha.toFixed(2)})`;
  ctx.beginPath();
  ctx.arc(cx, cy, 7, 0, Math.PI * 2);
  ctx.fill();

  // Losango dourado 8x8px: 4 pontas
  ctx.beginPath();
  ctx.moveTo(cx, cy - 4); // topo
  ctx.lineTo(cx + 4, cy); // direita
  ctx.lineTo(cx, cy + 4); // base
  ctx.lineTo(cx - 4, cy); // esquerda
  ctx.closePath();

  // Preenchimento dourado vibrante
  ctx.fillStyle = PALETA_VALE.ouroColetavel;
  ctx.fill();

  // Contorno ambar escuro para alto contraste
  ctx.strokeStyle = '#b45309';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Núcleo brilhante especular 16-bit
  ctx.fillStyle = '#fef08a';
  ctx.fillRect(cx - 1, cy - 1, 2, 2);

  // Faíscas cintilantes ao redor
  if (Math.floor(animTime * 4) % 2 === 0) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(cx - 5, cy - 3, 1, 1);
    ctx.fillRect(cx + 4, cy + 3, 1, 1);
  }
}

// Renderiza a Árvore Ancestral da Cripta (com casca mística e fissura arcana pulsante)
export function renderArvoreCripta(
  ctx: CanvasRenderingContext2D,
  animTime: number
) {
  const { x, y } = ARVORE_CRIPTA;

  // 1. Sombra circular densa no chão
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.beginPath();
  ctx.ellipse(x + 16, y + 28, 16, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // 2. Raízes ancestrais expostas e tronco robusto
  ctx.fillStyle = '#451a03'; // Madeira nobre envelhecida
  ctx.fillRect(x + 9, y + 16, 14, 15);
  ctx.fillRect(x + 6, y + 27, 20, 4); // Raízes laterais
  ctx.fillRect(x + 4, y + 29, 24, 2);

  // Textura escura da casca
  ctx.fillStyle = '#290f02';
  ctx.fillRect(x + 11, y + 18, 2, 10);
  ctx.fillRect(x + 18, y + 20, 2, 8);

  // Fissura arcana que brilha com energia misteriosa (sensível ao golpe carregado)
  const pulsoRuna = Math.sin(animTime * 5) * 0.3 + 0.7;
  ctx.fillStyle = `rgba(56, 189, 248, ${pulsoRuna})`;
  ctx.fillRect(x + 14, y + 20, 3, 7);
  ctx.fillRect(x + 13, y + 22, 5, 2);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x + 15, y + 22, 1, 3);

  // 3. Copa densa monumental com folhagem azul-esmeralda antiga
  ctx.fillStyle = '#064e3b';
  ctx.beginPath();
  ctx.arc(x + 16, y + 14, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(x + 2, y + 8, 28, 14);

  // Camada média de folhagem com runas de musgo
  ctx.fillStyle = '#047857';
  ctx.beginPath();
  ctx.arc(x + 16, y + 10, 12, 0, Math.PI * 2);
  ctx.fill();

  // Topo iluminado
  ctx.fillStyle = '#10b981';
  ctx.beginPath();
  ctx.arc(x + 14, y + 7, 8, 0, Math.PI * 2);
  ctx.fill();

  // Folhas e orbes de pólen místico
  ctx.fillStyle = '#6ee7b7';
  ctx.fillRect(x + 11, y + 5, 3, 2);
  ctx.fillRect(x + 19, y + 8, 2, 2);
  ctx.fillRect(x + 7, y + 11, 2, 2);

  // Partículas místicas que emanam da árvore ancestral
  if (Math.floor(animTime * 6) % 2 === 0) {
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(x + 15 + Math.sin(animTime * 3) * 6, y + 12 - Math.cos(animTime * 4) * 6, 1, 1);
  }
}

// Renderiza a Entrada da Cripta do Guardião Adormecido (quando a árvore é destruída)
export function renderEntradaCripta(
  ctx: CanvasRenderingContext2D,
  animTime: number
) {
  const { x, y } = ARVORE_CRIPTA;

  // 1. Moldura de pedra de ardósia escavada no solo da clareira
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(x + 2, y + 4, 28, 26);

  // Borda chanfrada de granito
  ctx.fillStyle = '#334155';
  ctx.fillRect(x + 2, y + 4, 28, 2);
  ctx.fillRect(x + 2, y + 4, 2, 26);
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(x + 2, y + 28, 28, 2);
  ctx.fillRect(x + 28, y + 4, 2, 26);

  // 2. Degraus de pedra descendo para a cripta subterrânea
  const degraus = [
    { dy: 6, cor: '#475569' },
    { dy: 10, cor: '#334155' },
    { dy: 14, cor: '#1e293b' },
    { dy: 18, cor: '#0f172a' },
    { dy: 22, cor: '#020617' },
  ];
  for (const d of degraus) {
    ctx.fillStyle = d.cor;
    ctx.fillRect(x + 6, y + d.dy, 20, 3);
  }

  // 3. Pilares de tochas esmeralda nas laterais
  // Coluna esquerda
  ctx.fillStyle = '#475569';
  ctx.fillRect(x + 3, y + 10, 2, 8);
  // Coluna direita
  ctx.fillRect(x + 27, y + 10, 2, 8);

  // Chamas místicas nas colunas com pulso
  const chamaPulso = Math.sin(animTime * 10) * 1.5;
  ctx.fillStyle = '#10b981';
  ctx.fillRect(x + 3, y + 7 + chamaPulso, 2, 3);
  ctx.fillRect(x + 27, y + 7 + chamaPulso, 2, 3);
  ctx.fillStyle = '#6ee7b7';
  ctx.fillRect(x + 3, y + 8 + chamaPulso, 1, 2);
  ctx.fillRect(x + 27, y + 8 + chamaPulso, 1, 2);

  // 4. Inscrição em relevo na pedra
  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(x + 10, y + 5, 12, 1);

  // Luz ambiente suave emergindo da escadaria
  const luzAlpha = Math.sin(animTime * 4) * 0.05 + 0.12;
  ctx.fillStyle = `rgba(16, 185, 129, ${luzAlpha})`;
  ctx.beginPath();
  ctx.ellipse(x + 16, y + 18, 10, 6, 0, 0, Math.PI * 2);
  ctx.fill();
}
