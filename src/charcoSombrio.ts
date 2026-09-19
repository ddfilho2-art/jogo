import { Retangulo, DialogoState, LojaState } from './types';
import {
  ALAVANCA_CHARCO_REMOTE,
  PONTE_CHARCO_OVERWORLD,
  ENTRADA_COVIL_AFOGADO_OVERWORLD,
} from './bumerangueEngine';
import {
  PALETA_CHARCO,
  TILE_SIZE,
  MAP_WIDTH,
  MAP_HEIGHT,
  LOGICAL_WIDTH,
  LOGICAL_HEIGHT,
} from './constants';

export interface JuncoInfo {
  x: number;
  y: number;
  altura: number;
  variacao: number;
}

export interface PedraCharcoInfo {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface CasaInfo {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  nome: string;
  tipo: 'escriba' | 'loja' | 'cabana';
}

export interface DocaInfo {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface BarcoInfo {
  x: number;
  y: number;
  w: number;
  h: number;
}

// ============================================================================
// VILAREJO JUNCOTURVO (Localizado na tela central [1, 1], y: 224..448, x: 256..512)
// ============================================================================

export const JUNCOTURVO_CASAS: CasaInfo[] = [
  // 1. Casa do Escriba Ivo (à esquerda)
  {
    id: 'casa_escriba',
    x: 292,
    y: 260,
    w: 52,
    h: 42,
    nome: 'Estudo do Escriba Ivo',
    tipo: 'escriba',
  },
  // 2. Loja de Juncoturvo (à direita)
  {
    id: 'casa_loja',
    x: 412,
    y: 260,
    w: 54,
    h: 42,
    nome: 'Empório de Juncoturvo',
    tipo: 'loja',
  },
  // 3. Cabana do Barqueiro dos Juncos (mais ao sul, perto da doca)
  {
    id: 'casa_pescador',
    x: 284,
    y: 348,
    w: 46,
    h: 38,
    nome: 'Cabana do Barqueiro',
    tipo: 'cabana',
  },
];

// 1 Doca de madeira (pier com tábuas sobre estacas que avança na água turva)
export const JUNCOTURVO_DOCA: DocaInfo = {
  x: 356,
  y: 344,
  w: 76,
  h: 28,
};

// Pequeno barco de madeira rústica atracado ao lado da doca
export const JUNCOTURVO_BARCO: BarcoInfo = {
  x: 436,
  y: 350,
  w: 22,
  h: 14,
};

// NPC Escriba Ivo: em frente à sua casa/mesa de pergaminhos
export const NPC_ESCRIBA_IVO = {
  nome: 'Escriba Ivo',
  cargo: 'Historiador de Eldrim',
  x: 348,
  y: 292,
  w: 14,
  h: 16,
  falas: [
    'Saudações, Ren. Reconheço o fulgor primordial da Lâmina de Eldrim... Há eras, antes do Arauto Cinzento amaldiçoar nosso reino, o equilíbrio sagrado era sustentado por 6 Relicários Elementais.',
    'Cada uma das seis regiões abriga um Santuário sagrado: o da Raiz no Vale Verdejante, o das Marés aqui nas profundezas do Charco, e outros no Gelo, Chamas, Pedra e Sombras.',
    'Os antigos anais revelam que somente aquele que libertar os 6 Relicários e reforjar a Lâmina em três fragmentos de forja poderá romper os portões da Cidadela Cinzenta e banir Thorne para sempre.',
  ],
};

// Balcão e Mercador da Loja de Juncoturvo (mesmos 2 itens essenciais)
export const NPC_MERCADOR_JUNCO = {
  nome: 'Mercador Gorren',
  x: 432,
  y: 294,
  w: 14,
  h: 16,
};

// Hitbox de interação da loja (em frente ao balcão da loja)
export const LOJA_JUNCO_HITBOX: Retangulo = {
  x: 422,
  y: 290,
  w: 32,
  h: 24,
  rotulo: 'Balcão da Loja de Juncoturvo',
};

// Configuração dos 2 itens da Loja (mesmos de Pedraverde)
export const LOJA_JUNCO_ITENS = [
  {
    id: 'frasco_seiva',
    nome: 'Frasco de Seiva da Vida',
    descricao: 'Restaura até 3 Fragmentos de Vida feridos.',
    preco: 20,
    icone: 'cura' as const,
  },
  {
    id: 'pacote_bombas',
    nome: 'Pacote de Bombas (+5)',
    descricao: 'Abastece 5 bombas de impacto para seu arsenal.',
    preco: 30,
    icone: 'bomba' as const,
  },
];

// ============================================================================
// TERRENO: ÁGUA RASA (~40% DO MAPA - 768x672px)
// Reduz a velocidade do herói para 50px/s ao pisar nela
// ============================================================================

export const CHARCO_AGUA_RASA: Retangulo[] = [
  // 1. Grande Bacia Pantanosa Noroeste (Tela [0, 0])
  { x: 24, y: 24, w: 192, h: 160, rotulo: 'Charco Noroeste' },
  { x: 192, y: 64, w: 64, h: 96, rotulo: 'Braço Noroeste' },

  // 2. Lagoa de Águas Turvas Norte (Tela [1, 0] - arredores do Santuário das Marés)
  { x: 288, y: 32, w: 180, h: 140, rotulo: 'Lagoa das Marés' },
  { x: 500, y: 48, w: 140, h: 120, rotulo: 'Canal Norte-Nordeste' },

  // 3. Pântano Fundo Nordeste (Tela [2, 0])
  { x: 620, y: 32, w: 128, h: 160, rotulo: 'Pântano Nordeste' },
  { x: 580, y: 152, w: 160, h: 64, rotulo: 'Canal Meandro Leste' },

  // 4. Meandros e Lagoa Central da Doca (Tela [0, 1] e [1, 1])
  { x: 32, y: 240, w: 180, h: 160, rotulo: 'Remanso Ocidental' },
  // Água circundando a Doca de Juncoturvo (a doca flutua sobre este trecho)
  { x: 340, y: 336, w: 180, h: 96, rotulo: 'Água Rasa da Doca' },
  { x: 520, y: 260, w: 220, h: 150, rotulo: 'Lagoa Oriental de Juncos' },

  // 5. Canais Pantanosos do Sul (Tela [0, 2], [1, 2], [2, 2])
  // Conectam com a borda de transição do Vale Verdejante
  { x: 48, y: 460, w: 200, h: 160, rotulo: 'Brejo Sudoeste' },
  // Deixa trilha de terra firme central em x: 350..420, com água rasa nas margens
  { x: 240, y: 480, w: 100, h: 150, rotulo: 'Margem Rasa Sul-Oeste' },
  { x: 430, y: 480, w: 120, h: 150, rotulo: 'Margem Rasa Sul-Leste' },
  { x: 560, y: 450, w: 180, h: 180, rotulo: 'Brejo Sudeste' },
];

// Checa se o herói está com os pés na água rasa (reduz velocidade para 50px/s)
export function isHeroiNaAguaRasa(heroiX: number, heroiY: number): boolean {
  // Ponto de teste nos pés do herói (centro inferior)
  const px = heroiX + 8;
  const py = heroiY + 14;

  // Se estiver sobre a doca de madeira firme, NÃO reduz a velocidade
  if (
    px >= JUNCOTURVO_DOCA.x &&
    px <= JUNCOTURVO_DOCA.x + JUNCOTURVO_DOCA.w &&
    py >= JUNCOTURVO_DOCA.y &&
    py <= JUNCOTURVO_DOCA.y + JUNCOTURVO_DOCA.h
  ) {
    return false;
  }

  // Verifica cada polígono/retângulo de água rasa
  for (const r of CHARCO_AGUA_RASA) {
    if (px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h) {
      return true;
    }
  }

  return false;
}

// ============================================================================
// PEDRAS PANTANOSAS E ROCHEDOS SÓLIDOS (COM COLISÃO)
// ============================================================================

export const CHARCO_PEDRAS: PedraCharcoInfo[] = [
  // Pedras espalhadas no brejo
  { x: 80, y: 70, w: 28, h: 22 },
  { x: 140, y: 120, w: 22, h: 20 },
  { x: 320, y: 80, w: 32, h: 24 },
  { x: 440, y: 70, w: 24, h: 20 },
  { x: 660, y: 42, w: 36, h: 26 }, // Margem norte do canal profundo
  { x: 620, y: 160, w: 26, h: 22 },

  // Pedras decorativas em Juncoturvo
  { x: 240, y: 280, w: 24, h: 20 },
  { x: 490, y: 270, w: 28, h: 22 },
  { x: 330, y: 390, w: 22, h: 18 },
  { x: 500, y: 380, w: 32, h: 24 },

  // Pedras do pântano sul
  { x: 110, y: 510, w: 32, h: 26 },
  { x: 180, y: 560, w: 24, h: 20 },
  { x: 610, y: 520, w: 34, h: 26 },
  { x: 670, y: 580, w: 26, h: 20 },
];

// ============================================================================
// JUNCOS DECORATIVOS (SEM COLISÃO)
// ============================================================================

function gerarJuncosCharco(): JuncoInfo[] {
  const juncos: JuncoInfo[] = [];

  // Posições com base na proximidade das margens e águas rasas
  const clusters = [
    // Cluster 1: Margens da doca de Juncoturvo
    { cx: 345, cy: 370, qtd: 14, raio: 30 },
    { cx: 445, cy: 375, qtd: 12, raio: 25 },
    { cx: 390, cy: 385, qtd: 16, raio: 32 },

    // Cluster 2: Pântano Noroeste
    { cx: 50, cy: 50, qtd: 15, raio: 35 },
    { cx: 120, cy: 90, qtd: 18, raio: 40 },
    { cx: 180, cy: 150, qtd: 12, raio: 30 },

    // Cluster 3: Lagoa das Marés (Norte)
    { cx: 300, cy: 50, qtd: 14, raio: 30 },
    { cx: 460, cy: 60, qtd: 15, raio: 35 },
    { cx: 520, cy: 110, qtd: 12, raio: 28 },

    // Cluster 4: Pântano Nordeste
    { cx: 650, cy: 60, qtd: 16, raio: 32 },
    { cx: 700, cy: 120, qtd: 14, raio: 30 },

    // Cluster 5: Brejo Ocidental
    { cx: 60, cy: 280, qtd: 15, raio: 30 },
    { cx: 140, cy: 340, qtd: 16, raio: 32 },

    // Cluster 6: Lagoa Oriental
    { cx: 550, cy: 290, qtd: 14, raio: 30 },
    { cx: 640, cy: 340, qtd: 18, raio: 40 },
    { cx: 710, cy: 280, qtd: 12, raio: 25 },

    // Cluster 7: Pântano Sul
    { cx: 70, cy: 520, qtd: 15, raio: 32 },
    { cx: 150, cy: 580, qtd: 16, raio: 35 },
    { cx: 270, cy: 540, qtd: 14, raio: 30 },
    { cx: 470, cy: 550, qtd: 14, raio: 30 },
    { cx: 630, cy: 560, qtd: 16, raio: 35 },
  ];

  clusters.forEach((c) => {
    for (let i = 0; i < c.qtd; i++) {
      const ang = (i / c.qtd) * Math.PI * 2 + (i % 3) * 0.4;
      const dist = 6 + ((i * 7) % Math.max(10, c.raio));
      const jx = Math.round(c.cx + Math.cos(ang) * dist);
      const jy = Math.round(c.cy + Math.sin(ang) * dist);

      if (jx >= 8 && jx <= MAP_WIDTH - 8 && jy >= 8 && jy <= MAP_HEIGHT - 8) {
        juncos.push({
          x: jx,
          y: jy,
          altura: 10 + (i % 5) * 2, // 10 a 18px
          variacao: i % 4,
        });
      }
    }
  });

  return juncos;
}

export const CHARCO_JUNCOS: JuncoInfo[] = gerarJuncosCharco();

// ============================================================================
// ÁRVORES PANTANOSAS (Salgueiros e Ciprestes Retorcidos)
// ============================================================================

export interface ArvorePantanoInfo {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

function gerarArvoresCharco(): ArvorePantanoInfo[] {
  const arvores: ArvorePantanoInfo[] = [];
  let id = 1;

  // Bordas Norte, Oeste e Leste com árvores densas
  // Borda Norte (deixa passagem em x: 352..416 para o Santuário das Marés)
  for (let x = 0; x <= MAP_WIDTH - 32; x += 32) {
    if (x >= 352 && x <= 416) continue;
    arvores.push({ id: `p_tree_n_${id++}`, x, y: 0, w: 32, h: 32 });
  }

  // Borda Sul: Deixa passagens largas abertas para a transição conectando com o Vale Verdejante!
  // No Vale, a trilha é em x: 352..416, mas toda a passagem sul de Charco é acessível
  for (let x = 0; x <= MAP_WIDTH - 32; x += 32) {
    // Mantém aberta a trilha central e laterais
    if (x >= 320 && x <= 448) continue;
    if (x % 64 === 0) {
      arvores.push({ id: `p_tree_s_${id++}`, x, y: MAP_HEIGHT - 32, w: 32, h: 32 });
    }
  }

  // Borda Oeste
  for (let y = 32; y < MAP_HEIGHT - 32; y += 32) {
    arvores.push({ id: `p_tree_w_${id++}`, x: 0, y, w: 32, h: 32 });
  }

  // Borda Leste (deixa aberta a clareira para a Ilhota e Entrada do Covil Afogado: y: 48..112)
  for (let y = 32; y < MAP_HEIGHT - 32; y += 32) {
    if (y >= 48 && y <= 112) continue;
    arvores.push({ id: `p_tree_e_${id++}`, x: MAP_WIDTH - 32, y, w: 32, h: 32 });
  }

  // Árvores de pântano no interior
  const internas = [
    [160, 48], [220, 80],
    [540, 64], [600, 96],
    [180, 260], [200, 320],
    [500, 220], [530, 270],
    [240, 480], [260, 540],
    [480, 490], [520, 560],
  ];
  internas.forEach(([x, y]) => {
    arvores.push({ id: `p_tree_in_${id++}`, x, y, w: 32, h: 32 });
  });

  return arvores;
}

export const CHARCO_ARVORES: ArvorePantanoInfo[] = gerarArvoresCharco();

// ============================================================================
// OBSTÁCULOS SÓLIDOS DE CHARCO SOMBRIO
// ============================================================================

export function getCharcoObstaculos(ponteAberta: boolean = false): Retangulo[] {
  const obstaculos: Retangulo[] = [];

  // 1. Tronco inferior sólido de cada árvore de pântano (8x8px)
  CHARCO_ARVORES.forEach((t) => {
    obstaculos.push({
      x: t.x + 12,
      y: t.y + 24,
      w: 8,
      h: 8,
      cor: '#2a1e17',
      rotulo: 'Tronco Pantanoso',
    });
  });

  // 2. Pedras e rochedos pantanosos sólidos
  CHARCO_PEDRAS.forEach((p) => {
    obstaculos.push({
      x: p.x,
      y: p.y,
      w: p.w,
      h: p.h,
      cor: PALETA_CHARCO.pedraMusgosa,
      rotulo: 'Pedra Pantanosa',
    });
  });

  // 3. Canal Profundo Nordeste (Tela [2,0]) - Requer Bumerangue para ativar a alavanca remota!
  if (!ponteAberta) {
    // Bloqueio completo da travessia pelo canal profundo (> 3 tiles de água intransponível)
    obstaculos.push({
      x: 648,
      y: 64,
      w: 56,
      h: 96,
      cor: '#0a161c',
      rotulo: 'Canal Profundo Nordeste',
    });
  } else {
    // Com a ponte estendida (y: 96..128 livre), apenas as margens profundas acima e abaixo continuam sólidas
    obstaculos.push(
      { x: 648, y: 64, w: 56, h: 32, cor: '#0a161c', rotulo: 'Canal Profundo Norte' },
      { x: 648, y: 128, w: 56, h: 32, cor: '#0a161c', rotulo: 'Canal Profundo Sul' }
    );
  }

  // 4. Base de pedra da Alavanca Remota do Bumerangue (X: 712, Y: 104)
  obstaculos.push({
    x: 712,
    y: 104,
    w: 16,
    h: 16,
    cor: '#1e293b',
    rotulo: 'Alavanca Remota',
  });

  // 3. Casas do Vilarejo Juncoturvo (estruturas sólidas com portas acessíveis)
  JUNCOTURVO_CASAS.forEach((c) => {
    obstaculos.push({
      x: c.x,
      y: c.y + 10,
      w: c.w,
      h: c.h - 10,
      cor: PALETA_CHARCO.madeiraDoca,
      rotulo: c.nome,
    });
  });

  // 4. Balcão e Mercador da Loja (bloqueio de colisão frontal)
  obstaculos.push({
    x: 426,
    y: 292,
    w: 26,
    h: 12,
    cor: '#3d281a',
    rotulo: 'Balcão da Loja',
  });

  // 5. Barco atracado (bloqueio sólido onde está amarrado)
  obstaculos.push({
    x: JUNCOTURVO_BARCO.x,
    y: JUNCOTURVO_BARCO.y,
    w: JUNCOTURVO_BARCO.w,
    h: JUNCOTURVO_BARCO.h,
    cor: '#3a2416',
    rotulo: 'Barco Atracado',
  });

  // 6. Colisores dos limites laterais e extremidades do mapa
  obstaculos.push(
    { x: -16, y: 0, w: 16, h: MAP_HEIGHT, rotulo: 'Limite Oeste' },
    { x: MAP_WIDTH, y: 0, w: 16, h: MAP_HEIGHT, rotulo: 'Limite Leste' },
    { x: 0, y: -16, w: MAP_WIDTH, h: 16, rotulo: 'Limite Norte' }
  );

  return obstaculos;
}

// ============================================================================
// RENDERIZADOR DO TERRENO E CHARCO SOMBRIO
// ============================================================================

export function renderTerrenoCharco(
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

  // 1. Grade de base: lama e solo escuro pantanoso (#3a4a3a) com vegetação úmida (#5c6b47)
  for (let r = startRow; r < endRow; r++) {
    for (let c = startCol; c < endCol; c++) {
      const x = c * TILE_SIZE;
      const y = r * TILE_SIZE;
      const isAlt = (r + c) % 2 === 0;

      ctx.fillStyle = isAlt ? PALETA_CHARCO.soloLama : '#344334';
      ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

      // Manchas de musgo e líquen pantanoso (#5c6b47)
      if ((r * 13 + c * 19) % 5 === 0) {
        ctx.fillStyle = PALETA_CHARCO.vegetacao;
        ctx.fillRect(x + 3, y + 4, 3, 2);
        ctx.fillRect(x + 5, y + 3, 2, 2);
      } else if ((r * 7 + c * 11) % 7 === 0) {
        ctx.fillStyle = '#4c5c3c';
        ctx.fillRect(x + 8, y + 8, 3, 3);
      }
    }
  }

  // 2. Trilhas de terra batida e tábuas conectando o Vilarejo Juncoturvo
  const trilhaSulX = 368;
  if (camX <= trilhaSulX + 50 && camX + viewportW >= trilhaSulX) {
    ctx.fillStyle = 'rgba(74, 55, 40, 0.45)';
    ctx.fillRect(trilhaSulX, Math.max(260, camY), 32, viewportH + 64);
    // Travessas de madeira sobre a lama na trilha
    ctx.fillStyle = '#4a3728';
    for (let y = Math.max(260, Math.floor(camY / 24) * 24); y < camY + viewportH + 24; y += 20) {
      ctx.fillRect(trilhaSulX + 4, y, 24, 3);
    }
  }

  // 3. Renderizar Água Rasa (~40% do mapa em #1f2f3a com ondulações e reflexos)
  CHARCO_AGUA_RASA.forEach((agua) => {
    // Checagem de visibilidade
    if (
      agua.x + agua.w < camX ||
      agua.x > camX + viewportW ||
      agua.y + agua.h < camY ||
      agua.y > camY + viewportH
    ) {
      return;
    }

    // Leito da água turva (#1f2f3a)
    ctx.fillStyle = PALETA_CHARCO.aguaTurva;
    ctx.fillRect(agua.x, agua.y, agua.w, agua.h);

    // Margens lamacentas degradê
    ctx.fillStyle = '#2d3a33';
    ctx.fillRect(agua.x, agua.y, agua.w, 2);
    ctx.fillRect(agua.x, agua.y + agua.h - 2, agua.w, 2);
    ctx.fillRect(agua.x, agua.y, 2, agua.h);
    ctx.fillRect(agua.x + agua.w - 2, agua.y, 2, agua.h);

    // Ondulações lentas da água estagnada do charco
    ctx.fillStyle = PALETA_CHARCO.aguaTurvaReflexo;
    const waveOff = Math.floor((animTime * 10) % 18);
    for (let wy = agua.y + waveOff; wy < agua.y + agua.h - 4; wy += 18) {
      ctx.fillRect(agua.x + 8, wy, Math.min(18, agua.w - 16), 1);
      ctx.fillRect(agua.x + agua.w - 26, wy + 9, Math.min(16, agua.w - 16), 1);
    }

    // Bolhas de gás do pântano subindo ocasionalmente
    if (Math.floor(animTime * 3) % 2 === 0) {
      ctx.fillStyle = '#3a505e';
      ctx.fillRect(agua.x + 24, agua.y + 16, 2, 2);
      ctx.fillRect(agua.x + agua.w - 32, agua.y + 36, 1, 1);
    }
  });

  // 4. Renderizar a Doca de Madeira de Juncoturvo (pier sobre estacas)
  const d = JUNCOTURVO_DOCA;
  if (
    d.x + d.w >= camX &&
    d.x <= camX + viewportW &&
    d.y + d.h >= camY &&
    d.y <= camY + viewportH
  ) {
    // Estacas fincadas na água turva
    ctx.fillStyle = '#2a1a10';
    for (let px = d.x + 4; px < d.x + d.w; px += 16) {
      ctx.fillRect(px, d.y + d.h - 2, 4, 10);
    }

    // Plataforma de tábuas de madeira da doca
    ctx.fillStyle = PALETA_CHARCO.madeiraDoca;
    ctx.fillRect(d.x, d.y, d.w, d.h);

    // Linhas das tábuas horizontais
    for (let py = d.y; py < d.y + d.h; py += 4) {
      const isAlt = (py / 4) % 2 === 0;
      ctx.fillStyle = isAlt ? PALETA_CHARCO.madeiraDocaClara : '#543b2a';
      ctx.fillRect(d.x, py, d.w, 3);
      // Pregos de ferro
      ctx.fillStyle = '#1e1e1e';
      ctx.fillRect(d.x + 2, py + 1, 1, 1);
      ctx.fillRect(d.x + d.w - 3, py + 1, 1, 1);
    }

    // Corrimãos / postes com cordas de amarração
    ctx.fillStyle = '#362214';
    ctx.fillRect(d.x - 2, d.y - 2, 4, 6);
    ctx.fillRect(d.x + d.w - 2, d.y - 2, 4, 6);
    ctx.fillRect(d.x + d.w - 2, d.y + d.h - 4, 4, 6);

    // Amarras de corda amarelada (#a38050)
    ctx.fillStyle = '#a38050';
    ctx.fillRect(d.x + d.w - 1, d.y + d.h - 2, 2, 2);
    ctx.fillRect(d.x + d.w, d.y + d.h, 6, 1); // Linha que vai até o barco
  }

  // 5. Renderizar o Barco Atracado
  const b = JUNCOTURVO_BARCO;
  if (
    b.x + b.w >= camX &&
    b.x <= camX + viewportW &&
    b.y + b.h >= camY &&
    b.y <= camY + viewportH
  ) {
    const bobBarco = Math.sin(animTime * 2.5) * 1.5;
    const by = b.y + bobBarco;

    // Sombra do barco na água
    ctx.fillStyle = 'rgba(15, 25, 30, 0.6)';
    ctx.beginPath();
    ctx.ellipse(b.x + 11, by + 10, 12, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Casco de madeira curvada
    ctx.fillStyle = '#4a2c16';
    ctx.beginPath();
    ctx.moveTo(b.x, by + 4);
    ctx.lineTo(b.x + 4, by + 12);
    ctx.lineTo(b.x + 18, by + 12);
    ctx.lineTo(b.x + b.w, by + 4);
    ctx.closePath();
    ctx.fill();

    // Interior do barco
    ctx.fillStyle = '#2c1808';
    ctx.fillRect(b.x + 3, by + 4, b.w - 6, 6);

    // Assento central de madeira
    ctx.fillStyle = '#6d4323';
    ctx.fillRect(b.x + 9, by + 5, 4, 4);

    // Remos de madeira cruzados
    ctx.fillStyle = '#8c5930';
    ctx.fillRect(b.x + 4, by + 2, 14, 1);
  }

  // 6. Renderizar Pedras Pantanosas Sólidas
  CHARCO_PEDRAS.forEach((p) => {
    if (
      p.x + p.w < camX ||
      p.x > camX + viewportW ||
      p.y + p.h < camY ||
      p.y > camY + viewportH
    ) {
      return;
    }

    // Sombra da pedra
    ctx.fillStyle = 'rgba(10, 15, 20, 0.4)';
    ctx.beginPath();
    ctx.ellipse(p.x + p.w / 2, p.y + p.h - 2, p.w / 2 + 1, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Rocha de base (#2a3530)
    ctx.fillStyle = PALETA_CHARCO.pedraMusgosa;
    ctx.fillRect(p.x, p.y, p.w, p.h);

    // Volume e facetas da rocha
    ctx.fillStyle = PALETA_CHARCO.pedraLuz;
    ctx.fillRect(p.x + 2, p.y + 2, p.w - 4, p.h / 2);

    // Manchas de musgo do charco (#5c6b47)
    ctx.fillStyle = PALETA_CHARCO.vegetacao;
    ctx.fillRect(p.x + 3, p.y + 3, 4, 3);
    ctx.fillRect(p.x + p.w - 7, p.y + 4, 4, 2);

    // Borda inferior escura
    ctx.fillStyle = '#19201c';
    ctx.fillRect(p.x, p.y + p.h - 2, p.w, 2);
  });

  // 7. Renderizar Juncos Decorativos (sem colisão, ondulando levemente ao vento)
  CHARCO_JUNCOS.forEach((j) => {
    if (
      j.x + 10 < camX ||
      j.x - 10 > camX + viewportW ||
      j.y + 10 < camY ||
      j.y - 20 > camY + viewportH
    ) {
      return;
    }

    // Ondulação ao vento (seno leve)
    const vento = Math.sin(animTime * 3 + j.x * 0.05 + j.variacao) * 1.5;

    // 3 hastes em leque
    const hastes = [
      { dx: -2, h: j.altura - 2, curvo: -1 },
      { dx: 0, h: j.altura, curvo: 0 },
      { dx: 2, h: j.altura - 3, curvo: 1 },
    ];

    hastes.forEach((h) => {
      const topX = j.x + h.dx + vento + h.curvo;
      const topY = j.y - h.h;

      // Haste verde-oliva (#5c6b47)
      ctx.strokeStyle = PALETA_CHARCO.juncoVerde;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(j.x + h.dx, j.y);
      ctx.lineTo(topX, topY);
      ctx.stroke();

      // Espiga de junco aveludada no topo (#8c7b50)
      ctx.fillStyle = PALETA_CHARCO.juncoSeco;
      ctx.fillRect(topX - 0.5, topY, 2, 4);

      // Ponta fina
      ctx.fillStyle = '#b59e68';
      ctx.fillRect(topX, topY - 1, 1, 1);
    });
  });
}

// ============================================================================
// RENDERIZADOR DA ÁREA DO COVIL AFOGADO (CANAL, PONTE, ALAVANCA & RUÍNAS)
// ============================================================================

export function renderAreaCovilAfogado(
  ctx: CanvasRenderingContext2D,
  camX: number,
  camY: number,
  animTime: number,
  ponteAberta: boolean,
  heroiX: number,
  heroiY: number
) {
  // Apenas renderiza se a área nordeste estiver dentro do viewport (Tela [2,0])
  if (camX + LOGICAL_WIDTH < 620 || camX > 768 || camY + LOGICAL_HEIGHT < 30 || camY > 224) {
    return;
  }

  // 1. Canal Profundo (Fosso de Água Negra Intransponível)
  const canalX = 648;
  const canalY = 64;
  const canalW = 56;
  const canalH = 96;

  ctx.fillStyle = '#060e12';
  ctx.fillRect(canalX, canalY, canalW, canalH);

  // Redemoinhos e correnteza escura do canal
  const swirl = Math.sin(animTime * 3) * 2;
  ctx.fillStyle = 'rgba(45, 212, 191, 0.15)';
  ctx.fillRect(canalX + 6 + swirl, canalY + 12, canalW - 12, 2);
  ctx.fillRect(canalX + 12 - swirl, canalY + 44, canalW - 20, 2);
  ctx.fillRect(canalX + 8 + swirl, canalY + 76, canalW - 16, 2);

  // Margens de pedra encharcada delimitando o canal
  ctx.fillStyle = '#1c2d33';
  ctx.fillRect(canalX - 2, canalY, 2, canalH);
  ctx.fillRect(canalX + canalW, canalY, 2, canalH);

  // 2. Ponte de Madeira Rústica sobre o Canal
  const p = PONTE_CHARCO_OVERWORLD;
  if (!ponteAberta) {
    // Ponte submersa / recolhida sob as águas profundas: apenas estacas visíveis sob a água
    ctx.fillStyle = 'rgba(30, 41, 59, 0.6)';
    ctx.fillRect(p.x, p.y + 4, p.w, p.h - 8);
    ctx.fillStyle = '#1a242d';
    for (let px = p.x + 8; px < p.x + p.w; px += 16) {
      ctx.fillRect(px, p.y + 2, 4, p.h - 4);
    }
  } else {
    // Ponte Erguida e Firme!
    // Sombra da ponte na água
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(p.x, p.y + p.h - 3, p.w, 4);

    // Pranchas de madeira rústica do pântano
    ctx.fillStyle = '#543d2b';
    ctx.fillRect(p.x, p.y, p.w, p.h);

    // Tábuas verticais da ponte
    for (let px = p.x; px < p.x + p.w; px += 6) {
      const isAlt = (px / 6) % 2 === 0;
      ctx.fillStyle = isAlt ? '#6e513a' : '#453122';
      ctx.fillRect(px, p.y, 5, p.h);
      ctx.fillStyle = '#1e1610';
      ctx.fillRect(px, p.y, 1, p.h);
      // Pregos de ferro
      ctx.fillStyle = '#18181b';
      ctx.fillRect(px + 2, p.y + 2, 1, 1);
      ctx.fillRect(px + 2, p.y + p.h - 3, 1, 1);
    }

    // Corrimão com amarras de junco
    ctx.fillStyle = '#3a2718';
    ctx.fillRect(p.x, p.y, p.w, 2);
    ctx.fillRect(p.x, p.y + p.h - 2, p.w, 2);

    ctx.fillStyle = '#fbbf24';
    for (let px = p.x + 4; px < p.x + p.w; px += 14) {
      ctx.fillRect(px, p.y, 2, 2);
      ctx.fillRect(px, p.y + p.h - 2, 2, 2);
    }
  }

  // 3. Ilhota Isolada da Alavanca e Ruínas
  ctx.fillStyle = '#1f3128';
  ctx.fillRect(704, 48, 56, 116);
  ctx.fillStyle = '#2d4438';
  ctx.fillRect(706, 50, 52, 112);

  // Manchas de musgo encharcado
  ctx.fillStyle = '#3f5d4e';
  ctx.fillRect(710, 58, 20, 16);
  ctx.fillRect(720, 94, 24, 20);

  // 4. Alavanca Remota do Bumerangue das Marés
  const alv = ALAVANCA_CHARCO_REMOTE;
  // Pedestal de pedra talhada
  ctx.fillStyle = '#182428';
  ctx.fillRect(alv.x - 3, alv.y - 3, alv.w + 6, alv.h + 6);
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 0.8;
  ctx.strokeRect(alv.x - 2.5, alv.y - 2.5, alv.w + 5, alv.h + 5);

  // Base mecânica
  ctx.fillStyle = '#475569';
  ctx.fillRect(alv.x + 2, alv.y + 8, 12, 6);

  // Haste da alavanca
  ctx.strokeStyle = ponteAberta ? '#38bdf8' : '#94a3b8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(alv.x + 8, alv.y + 11);
  if (ponteAberta) {
    ctx.lineTo(alv.x + 13, alv.y + 3);
  } else {
    ctx.lineTo(alv.x + 3, alv.y + 3);
  }
  ctx.stroke();

  // Safira das Marés no topo
  const glow = Math.sin(animTime * 4) * 0.2 + 0.8;
  ctx.fillStyle = ponteAberta ? `rgba(56, 189, 248, ${glow})` : '#0284c7';
  ctx.beginPath();
  ctx.arc(ponteAberta ? alv.x + 13 : alv.x + 3, alv.y + 3, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // 5. Entrada da Catacumba "Covil Afogado" (Arco em Ruínas Submersas)
  const ent = ENTRADA_COVIL_AFOGADO_OVERWORLD;
  // Sombra e base de pedra
  ctx.fillStyle = '#081116';
  ctx.fillRect(ent.x - 2, ent.y - 2, ent.w + 4, ent.h + 4);

  // Pilares do arco antigo
  ctx.fillStyle = '#1e333b';
  ctx.fillRect(ent.x - 2, ent.y, 4, ent.h);
  ctx.fillRect(ent.x + ent.w - 2, ent.y, 4, ent.h);

  // Viga superior do portal
  ctx.fillStyle = '#2a4550';
  ctx.fillRect(ent.x - 4, ent.y - 4, ent.w + 8, 5);

  // Interior submerso com escadas descendo para a água
  ctx.fillStyle = '#050c10';
  ctx.fillRect(ent.x + 2, ent.y + 1, ent.w - 4, ent.h - 1);

  // Degraus inundados
  ctx.fillStyle = '#10222a';
  ctx.fillRect(ent.x + 3, ent.y + 5, ent.w - 6, 3);
  ctx.fillStyle = '#162e38';
  ctx.fillRect(ent.x + 4, ent.y + 10, ent.w - 8, 3);
  ctx.fillStyle = '#1e3b47';
  ctx.fillRect(ent.x + 5, ent.y + 15, ent.w - 10, 3);

  // Reflexo místico azul-turquesa subindo das profundezas
  const portalGlow = 0.3 + Math.sin(animTime * 3) * 0.15;
  ctx.fillStyle = `rgba(56, 189, 248, ${portalGlow.toFixed(2)})`;
  ctx.fillRect(ent.x + 4, ent.y + 8, ent.w - 8, ent.h - 10);

  // Rótulo se o herói estiver próximo
  const distHero = Math.hypot(heroiX - (ent.x + ent.w / 2), heroiY - (ent.y + ent.h / 2));
  if (distHero <= 26 && ponteAberta) {
    ctx.font = 'bold 7px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('▼ [Z] Covil Afogado', ent.x + ent.w / 2, ent.y - 8);
  }
}

// ============================================================================
// RENDERIZADOR DAS CASAS E NPCS DE JUNCOTURVO
// ============================================================================

export function renderCasasJuncoturvo(
  ctx: CanvasRenderingContext2D,
  camX: number,
  camY: number,
  animTime: number
) {
  JUNCOTURVO_CASAS.forEach((casa) => {
    if (
      casa.x + casa.w < camX ||
      casa.x > camX + LOGICAL_WIDTH ||
      casa.y + casa.h < camY ||
      casa.y > camY + LOGICAL_HEIGHT
    ) {
      return;
    }

    // Sombra da casa no solo
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(casa.x + 2, casa.y + casa.h - 3, casa.w - 4, 6);

    // Paredes de estacas de madeira rústica (#4a3728)
    ctx.fillStyle = PALETA_CHARCO.madeiraDoca;
    ctx.fillRect(casa.x + 3, casa.y + 16, casa.w - 6, casa.h - 16);

    // Textura de tábuas verticais
    ctx.fillStyle = '#3a271a';
    for (let px = casa.x + 7; px < casa.x + casa.w - 6; px += 6) {
      ctx.fillRect(px, casa.y + 16, 1, casa.h - 16);
    }

    // Telhado de sapê pantanoso (#8c7b50 e #5c6b47 em camadas)
    // Beiral inferior do telhado
    ctx.fillStyle = PALETA_CHARCO.juncoSeco;
    ctx.fillRect(casa.x, casa.y + 12, casa.w, 6);
    // Franja de palha do beiral
    for (let fx = casa.x; fx < casa.x + casa.w; fx += 3) {
      ctx.fillStyle = fx % 2 === 0 ? '#6d5a36' : '#9c8b5e';
      ctx.fillRect(fx, casa.y + 17, 2, 2);
    }

    // Pirâmide/inclinação do telhado
    ctx.fillStyle = '#7a6942';
    ctx.beginPath();
    ctx.moveTo(casa.x - 2, casa.y + 13);
    ctx.lineTo(casa.x + casa.w / 2, casa.y);
    ctx.lineTo(casa.x + casa.w + 2, casa.y + 13);
    ctx.closePath();
    ctx.fill();

    // Musgo sobre o telhado (#5c6b47)
    ctx.fillStyle = PALETA_CHARCO.vegetacao;
    ctx.fillRect(casa.x + 6, casa.y + 8, 8, 3);
    ctx.fillRect(casa.x + casa.w - 14, casa.y + 6, 6, 3);

    // Cume do telhado
    ctx.fillStyle = '#9c8b5e';
    ctx.fillRect(casa.x + casa.w / 2 - 4, casa.y, 8, 2);

    // Detalhes específicos por tipo de casa:
    if (casa.tipo === 'escriba') {
      // Porta de madeira com arco
      ctx.fillStyle = '#22140a';
      ctx.fillRect(casa.x + casa.w / 2 - 6, casa.y + casa.h - 16, 12, 16);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(casa.x + casa.w / 2 + 3, casa.y + casa.h - 8, 1, 1); // Maçaneta

      // Janela com luz âmbar acesa
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(casa.x + 8, casa.y + 22, 8, 8);
      ctx.strokeStyle = '#3a271a';
      ctx.lineWidth = 1;
      ctx.strokeRect(casa.x + 8.5, casa.y + 22.5, 7, 7);
      // Cruz da janela
      ctx.fillStyle = '#3a271a';
      ctx.fillRect(casa.x + 12, casa.y + 22, 1, 8);
      ctx.fillRect(casa.x + 8, casa.y + 26, 8, 1);

      // Placa com pena de escriba entalhada
      ctx.fillStyle = '#3a271a';
      ctx.fillRect(casa.x + casa.w - 14, casa.y + 20, 8, 6);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(casa.x + casa.w - 11, casa.y + 21, 2, 4); // Pena
    } else if (casa.tipo === 'loja') {
      // Balcão aberto com toldo de lona verde e bege
      ctx.fillStyle = '#5c6b47';
      ctx.fillRect(casa.x + 6, casa.y + 14, casa.w - 12, 4);
      // Listras
      for (let tx = casa.x + 6; tx < casa.x + casa.w - 12; tx += 6) {
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(tx, casa.y + 14, 3, 4);
      }

      // Janela de atendimento
      ctx.fillStyle = '#1c1208';
      ctx.fillRect(casa.x + 8, casa.y + 19, casa.w - 16, 12);

      // Mostruário com poção e bombas
      ctx.fillStyle = '#f87171'; // Frasco de Seiva
      ctx.fillRect(casa.x + 12, casa.y + 24, 4, 5);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(casa.x + 13, casa.y + 23, 2, 2);

      ctx.fillStyle = '#475569'; // Bomba redonda
      ctx.beginPath();
      ctx.arc(casa.x + 24, casa.y + 26, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fbbf24'; // Pavio aceso
      ctx.fillRect(casa.x + 24, casa.y + 22, 1, 2);

      // Porta lateral
      ctx.fillStyle = '#22140a';
      ctx.fillRect(casa.x + casa.w - 14, casa.y + casa.h - 15, 10, 15);
    } else {
      // Cabana do pescador
      ctx.fillStyle = '#22140a';
      ctx.fillRect(casa.x + 10, casa.y + casa.h - 15, 10, 15);

      // Janela redonda
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(casa.x + casa.w - 12, casa.y + 25, 4, 0, Math.PI * 2);
      ctx.fill();

      // Rede de pesca pendurada
      ctx.strokeStyle = '#8c7b50';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(casa.x + casa.w - 18, casa.y + 28, 12, 6);
    }
  });

  // Renderizar NPC Escriba Ivo
  renderNpcEscribaIvo(ctx, animTime);

  // Renderizar NPC Mercador de Juncoturvo
  renderNpcMercador(ctx, animTime);
}

// Renderiza o Escriba Ivo em pixel art 16-bit
function renderNpcEscribaIvo(ctx: CanvasRenderingContext2D, animTime: number) {
  const { x, y } = NPC_ESCRIBA_IVO;

  // Sombra suave sob os pés
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.beginPath();
  ctx.ellipse(x + 7, y + 15, 6, 2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Túnica longa de estudioso verde-oliva escuro (#3b4a3c)
  ctx.fillStyle = '#2d3d2e';
  ctx.fillRect(x + 2, y + 6, 10, 9);
  ctx.fillStyle = '#4c624e';
  ctx.fillRect(x + 3, y + 6, 8, 8);

  // Estola cerimonial dourada nos ombros
  ctx.fillStyle = '#d97706';
  ctx.fillRect(x + 4, y + 6, 6, 2);
  ctx.fillRect(x + 5, y + 8, 4, 5);

  // Cabeça e rosto
  ctx.fillStyle = '#fed7aa';
  ctx.fillRect(x + 4, y + 2, 6, 5);

  // Cabelo grisalho de sábio
  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(x + 3, y + 1, 8, 2);
  ctx.fillRect(x + 3, y + 3, 1, 3);
  ctx.fillRect(x + 10, y + 3, 1, 3);

  // Óculos de bronze redondos
  ctx.fillStyle = '#b45309';
  ctx.fillRect(x + 5, y + 3, 2, 2);
  ctx.fillRect(x + 8, y + 3, 2, 2);
  ctx.fillStyle = '#38bdf8'; // Lente de vidro
  ctx.fillRect(x + 5, y + 3, 1, 1);
  ctx.fillRect(x + 8, y + 3, 1, 1);

  // Pergaminho na mão
  ctx.fillStyle = '#fef08a';
  ctx.fillRect(x + 1, y + 8, 3, 5);
  ctx.fillStyle = '#b45309';
  ctx.fillRect(x + 1, y + 9, 3, 1);

  // Pena de escrever
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x + 11, y + 6, 2, 4);

  // Indicador de fala / interação flutuante "!" sutil se o herói estiver perto
  const pulsoBalão = Math.sin(animTime * 4) * 2;
  ctx.fillStyle = '#fef08a';
  ctx.font = 'bold 7px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('Ivo [Z]', x + 7, y - 4 + pulsoBalão);
}

// Renderiza o Mercador de Juncoturvo
function renderNpcMercador(ctx: CanvasRenderingContext2D, animTime: number) {
  const { x, y } = NPC_MERCADOR_JUNCO;

  // Sombra
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.beginPath();
  ctx.ellipse(x + 7, y + 15, 6, 2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Colete de comerciante marrom
  ctx.fillStyle = '#78350f';
  ctx.fillRect(x + 2, y + 6, 10, 8);
  ctx.fillStyle = '#b45309';
  ctx.fillRect(x + 4, y + 7, 6, 6);

  // Cabeça e chapéu de mercador
  ctx.fillStyle = '#fcd34d'; // Chapéu
  ctx.fillRect(x + 3, y + 1, 8, 3);
  ctx.fillStyle = '#fed7aa'; // Rosto
  ctx.fillRect(x + 4, y + 3, 6, 4);

  // Bigode de comerciante
  ctx.fillStyle = '#451a03';
  ctx.fillRect(x + 5, y + 6, 4, 1);

  // Bolsa de moedas / selos
  ctx.fillStyle = '#fbbf24';
  ctx.fillRect(x + 11, y + 9, 3, 3);

  // Indicador de loja flutuante
  const pulsoLoja = Math.sin(animTime * 4 + 1) * 2;
  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 7px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('Loja [Z]', x + 7, y - 4 + pulsoLoja);
}

// ============================================================================
// RENDERIZADOR DE ÁRVORES PANTANOSAS (Salgueiros / Ciprestes com Musgo)
// ============================================================================

export function renderArvorePantano(
  ctx: CanvasRenderingContext2D,
  arvore: ArvorePantanoInfo,
  animTime: number
) {
  const { x, y } = arvore;

  // 1. Sombra na base úmida
  ctx.fillStyle = 'rgba(10, 20, 15, 0.45)';
  ctx.beginPath();
  ctx.ellipse(x + 16, y + 29, 14, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // 2. Tronco retorcido de cipreste/salgueiro do pântano (#1e261f e #2c382e)
  ctx.fillStyle = '#1e261f';
  ctx.fillRect(x + 11, y + 16, 10, 14);

  // Raízes aéreas expostas no lodo
  ctx.fillRect(x + 8, y + 25, 4, 5);
  ctx.fillRect(x + 20, y + 26, 4, 4);

  // Destaque de casca úmida
  ctx.fillStyle = '#344537';
  ctx.fillRect(x + 13, y + 17, 3, 11);

  // 3. Copa densa e cavernosa de salgueiro (#223324)
  ctx.fillStyle = '#1b2a1d';
  ctx.beginPath();
  ctx.ellipse(x + 16, y + 12, 14, 11, 0, 0, Math.PI * 2);
  ctx.fill();

  // Volume intermediário verde-oliva (#2e4030)
  ctx.fillStyle = '#2e4030';
  ctx.beginPath();
  ctx.ellipse(x + 16, y + 10, 12, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  // Iluminação na copa superior (#3a4a3a e #5c6b47)
  ctx.fillStyle = '#3a4a3a';
  ctx.beginPath();
  ctx.ellipse(x + 15, y + 8, 9, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#5c6b47';
  ctx.fillRect(x + 12, y + 6, 4, 3);
  ctx.fillRect(x + 18, y + 8, 3, 2);

  // 4. Barba de bode / Musgo suspenso pendurado oscilando ao vento
  const balanco = Math.sin(animTime * 2.5 + x * 0.1) * 1.5;
  ctx.strokeStyle = '#4a593d';
  ctx.lineWidth = 1;

  ctx.beginPath();
  ctx.moveTo(x + 8, y + 16);
  ctx.lineTo(x + 7 + balanco, y + 24);
  ctx.moveTo(x + 14, y + 18);
  ctx.lineTo(x + 14 + balanco * 0.8, y + 27);
  ctx.moveTo(x + 22, y + 17);
  ctx.lineTo(x + 23 + balanco * 1.2, y + 25);
  ctx.stroke();
}

// ============================================================================
// OVERLAY DE NÉVOA EM LOOP (Overlay #cccccc a 15% com deslocamento contínuo)
// ============================================================================

export function renderNevoaCharco(
  ctx: CanvasRenderingContext2D,
  fogOffset: number,
  animTime: number
) {
  ctx.save();

  // Overlay geral de base #cccccc com 15% de opacidade
  ctx.fillStyle = 'rgba(204, 204, 204, 0.15)';
  ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

  // Faixas suaves de bruma em movimento horizontal ondulante
  const fogX = Math.round(fogOffset) % LOGICAL_WIDTH;

  ctx.fillStyle = 'rgba(220, 220, 220, 0.08)';

  // Faixa 1 (terço superior)
  const y1 = 20 + Math.sin(animTime * 0.8) * 8;
  ctx.beginPath();
  ctx.ellipse(fogX, y1, 80, 24, 0, 0, Math.PI * 2);
  ctx.ellipse(fogX - LOGICAL_WIDTH, y1, 80, 24, 0, 0, Math.PI * 2);
  ctx.ellipse(fogX + LOGICAL_WIDTH, y1, 80, 24, 0, 0, Math.PI * 2);
  ctx.fill();

  // Faixa 2 (meio da tela, velocidade diferente)
  const fogX2 = Math.round(fogOffset * 1.4) % LOGICAL_WIDTH;
  const y2 = 110 + Math.cos(animTime * 0.6) * 10;
  ctx.beginPath();
  ctx.ellipse(fogX2, y2, 100, 30, 0, 0, Math.PI * 2);
  ctx.ellipse(fogX2 - LOGICAL_WIDTH, y2, 100, 30, 0, 0, Math.PI * 2);
  ctx.ellipse(fogX2 + LOGICAL_WIDTH, y2, 100, 30, 0, 0, Math.PI * 2);
  ctx.fill();

  // Faixa 3 (terço inferior sobre os pântanos)
  const fogX3 = Math.round(fogOffset * 0.8) % LOGICAL_WIDTH;
  const y3 = 180 + Math.sin(animTime * 1.1) * 6;
  ctx.beginPath();
  ctx.ellipse(fogX3, y3, 90, 26, 0, 0, Math.PI * 2);
  ctx.ellipse(fogX3 - LOGICAL_WIDTH, y3, 90, 26, 0, 0, Math.PI * 2);
  ctx.ellipse(fogX3 + LOGICAL_WIDTH, y3, 90, 26, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// ============================================================================
// RENDERIZADOR DA CAIXA DE DIÁLOGO 16-BIT (Escriba Ivo & Lore dos 6 Relicários)
// ============================================================================

export function renderCaixaDialogo(
  ctx: CanvasRenderingContext2D,
  dialogo: DialogoState,
  animTime: number
) {
  if (!dialogo || !dialogo.ativo) return;

  const boxW = 236;
  const boxH = 68;
  const boxX = Math.round((LOGICAL_WIDTH - boxW) / 2); // 10
  const boxY = LOGICAL_HEIGHT - boxH - 10; // 146

  // Sombra preta da caixa
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(boxX + 2, boxY + 2, boxW, boxH);

  // Fundo escuro azul-ardósia 16-bit
  ctx.fillStyle = '#0a111a';
  ctx.fillRect(boxX, boxY, boxW, boxH);

  // Borda dupla clássica dourada
  ctx.strokeStyle = '#d97706';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(boxX + 0.5, boxY + 0.5, boxW - 1, boxH - 1);
  ctx.strokeStyle = '#1e3a5f';
  ctx.lineWidth = 1;
  ctx.strokeRect(boxX + 2.5, boxY + 2.5, boxW - 5, boxH - 5);

  // Cantos decorados dourados
  ctx.fillStyle = '#fbbf24';
  ctx.fillRect(boxX, boxY, 2, 2);
  ctx.fillRect(boxX + boxW - 2, boxY, 2, 2);
  ctx.fillRect(boxX, boxY + boxH - 2, 2, 2);
  ctx.fillRect(boxX + boxW - 2, boxY + boxH - 2, 2, 2);

  // Retrato pixel art 16-bit do Escriba Ivo no canto esquerdo da caixa
  const portraitX = boxX + 6;
  const portraitY = boxY + 6;
  const portraitSize = 26;

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(portraitX, portraitY, portraitSize, portraitSize);
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 1;
  ctx.strokeRect(portraitX + 0.5, portraitY + 0.5, portraitSize - 1, portraitSize - 1);

  // Rosto em miniatura do Escriba
  ctx.fillStyle = '#fed7aa';
  ctx.fillRect(portraitX + 7, portraitY + 7, 12, 10);
  ctx.fillStyle = '#94a3b8'; // Cabelo grisalho
  ctx.fillRect(portraitX + 5, portraitY + 4, 16, 4);
  ctx.fillStyle = '#b45309'; // Óculos redondos
  ctx.fillRect(portraitX + 8, portraitY + 9, 4, 3);
  ctx.fillRect(portraitX + 14, portraitY + 9, 4, 3);
  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(portraitX + 9, portraitY + 10, 2, 1);
  ctx.fillRect(portraitX + 15, portraitY + 10, 2, 1);
  ctx.fillStyle = '#4c624e'; // Túnica
  ctx.fillRect(portraitX + 4, portraitY + 17, 18, 8);

  // Nome e Cargo do NPC no cabeçalho
  ctx.font = 'bold 7px "Courier New", monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#fbbf24';
  ctx.fillText(dialogo.npcNome, boxX + 36, boxY + 6);

  if (dialogo.npcCargo) {
    ctx.font = '6px "Courier New", monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(`• ${dialogo.npcCargo}`, boxX + 36 + ctx.measureText(dialogo.npcNome).width + 6, boxY + 7);
  }

  // Indicador de página (ex: "1/3")
  ctx.font = '6px "Courier New", monospace';
  ctx.fillStyle = '#64748b';
  ctx.textAlign = 'right';
  ctx.fillText(
    `${dialogo.falaAtualIndex + 1} / ${dialogo.falas.length}`,
    boxX + boxW - 8,
    boxY + 6
  );

  // Texto da fala com efeito Typewriter (fatiado até caracteresVisiveis)
  const textoCompleto = dialogo.falas[dialogo.falaAtualIndex] || '';
  const textoVisivel = textoCompleto.slice(0, dialogo.caracteresVisiveis);

  // Quebra de linha simples para acomodar na caixa (até 42 caracteres por linha)
  ctx.font = '7px "Courier New", monospace';
  ctx.fillStyle = '#f8fafc';
  ctx.textAlign = 'left';

  const maxCharsPerLine = 38;
  const words = textoVisivel.split(' ');
  let currentLine = '';
  let lineY = boxY + 18;

  for (const word of words) {
    if ((currentLine + word).length > maxCharsPerLine) {
      ctx.fillText(currentLine, boxX + 36, lineY);
      currentLine = word + ' ';
      lineY += 10;
    } else {
      currentLine += word + ' ';
    }
  }
  if (currentLine) {
    ctx.fillText(currentLine, boxX + 36, lineY);
  }

  // Indicador piscante de avanço com [Z]
  const piscarSeta = Math.floor(animTime * 4) % 2 === 0;
  ctx.font = 'bold 6px "Courier New", monospace';
  ctx.textAlign = 'right';
  if (dialogo.falaConcluida) {
    ctx.fillStyle = piscarSeta ? '#fbbf24' : '#f59e0b';
    const isUltimaFala = dialogo.falaAtualIndex >= dialogo.falas.length - 1;
    ctx.fillText(
      isUltimaFala ? '[Z] Concluir' : '▼ [Z] Avançar',
      boxX + boxW - 8,
      boxY + boxH - 7
    );
  } else {
    ctx.fillStyle = '#64748b';
    ctx.fillText('[Z] Pular texto', boxX + boxW - 8, boxY + boxH - 7);
  }
}

// ============================================================================
// RENDERIZADOR DA INTERFACE DE LOJA DE JUNCOTURVO (2 Itens Essenciais)
// ============================================================================

export function renderInterfaceLoja(
  ctx: CanvasRenderingContext2D,
  loja: LojaState,
  selosHeroi: number,
  animTime: number
) {
  if (!loja || !loja.ativa) return;

  const winW = 210;
  const winH = 130;
  const winX = Math.round((LOGICAL_WIDTH - winW) / 2); // 23
  const winY = Math.round((LOGICAL_HEIGHT - winH) / 2); // 47

  // Sombra preta
  ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
  ctx.fillRect(winX + 2, winY + 2, winW, winH);

  // Fundo de madeira e ardósia
  ctx.fillStyle = '#0c1017';
  ctx.fillRect(winX, winY, winW, winH);

  // Moldura dourada
  ctx.strokeStyle = '#d97706';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(winX + 0.5, winY + 0.5, winW - 1, winH - 1);

  // Cantos decorados
  ctx.fillStyle = '#fbbf24';
  ctx.fillRect(winX, winY, 2, 2);
  ctx.fillRect(winX + winW - 2, winY, 2, 2);
  ctx.fillRect(winX, winY + winH - 2, 2, 2);
  ctx.fillRect(winX + winW - 2, winY + winH - 2, 2, 2);

  // Título da Loja
  ctx.font = 'bold 8px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#fbbf24';
  ctx.fillText(`— ${loja.nomeLoja.toUpperCase()} —`, winX + winW / 2, winY + 7);

  // Mostrador de Selos do Herói
  ctx.font = '7px "Courier New", monospace';
  ctx.textAlign = 'right';
  ctx.fillStyle = '#fef08a';
  ctx.fillText(`Seus Selos: ${selosHeroi} ⬡`, winX + winW - 10, winY + 8);

  // Linha divisória
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(winX + 8, winY + 20);
  ctx.lineTo(winX + winW - 8, winY + 20);
  ctx.stroke();

  // Opções da loja (2 itens + opção de sair)
  const opcoes = [
    ...loja.itens,
    { id: 'sair', nome: 'Sair da Loja', descricao: 'Fechar negociação e voltar ao vilarejo.', preco: 0, icone: 'cura' as const },
  ];

  opcoes.forEach((item, idx) => {
    const isSelected = loja.itemSelecionadoIndex === idx;
    const itemY = winY + 26 + idx * 24;

    // Fundo do item selecionado
    if (isSelected) {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(winX + 8, itemY, winW - 16, 20);
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 1;
      ctx.strokeRect(winX + 8.5, itemY + 0.5, winW - 17, 19);

      // Cursor piscante
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 7px "Courier New", monospace';
      ctx.textAlign = 'left';
      ctx.fillText('▶', winX + 12, itemY + 6);
    } else {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(winX + 8, itemY, winW - 16, 20);
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(winX + 8.5, itemY + 0.5, winW - 17, 19);
    }

    // Ícone do item
    const iconX = winX + 24;
    const iconY = itemY + 4;
    if (item.id === 'frasco_seiva') {
      // Frasco de poção vermelha
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(iconX + 2, iconY + 3, 8, 9);
      ctx.fillStyle = '#fca5a5';
      ctx.fillRect(iconX + 3, iconY + 4, 2, 2);
      ctx.fillStyle = '#78350f'; // Rolha
      ctx.fillRect(iconX + 4, iconY + 1, 4, 2);
    } else if (item.id === 'pacote_bombas') {
      // Bomba preta com pavio dourado
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.arc(iconX + 6, iconY + 7, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(iconX + 6, iconY + 1, 2, 2);
    } else {
      // Ícone de porta/sair
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(iconX + 3, iconY + 2, 6, 9);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(iconX + 5, iconY + 4, 3, 6);
    }

    // Nome do Item
    ctx.font = 'bold 7px "Courier New", monospace';
    ctx.textAlign = 'left';
    ctx.fillStyle = isSelected ? '#ffffff' : '#cbd5e1';
    ctx.fillText(item.nome, winX + 38, itemY + 4);

    // Descrição curta
    ctx.font = '6px "Courier New", monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(item.descricao, winX + 38, itemY + 12);

    // Preço em Selos à direita
    if (item.preco > 0) {
      const podePagar = selosHeroi >= item.preco;
      ctx.font = 'bold 7px "Courier New", monospace';
      ctx.textAlign = 'right';
      ctx.fillStyle = podePagar ? '#fef08a' : '#ef4444';
      ctx.fillText(`${item.preco} ⬡`, winX + winW - 14, itemY + 7);
    }
  });

  // Mensagem de feedback (ex: "Compra realizada!", "Selos insuficientes!")
  if (loja.mensagemFeedback && loja.mensagemFeedbackTimer && loja.mensagemFeedbackTimer > 0) {
    ctx.font = 'bold 7px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = loja.mensagemFeedback.includes('insuficientes') ? '#f87171' : '#4ade80';
    ctx.fillText(loja.mensagemFeedback, winX + winW / 2, winY + winH - 18);
  }

  // Rodapé de instruções
  ctx.font = '6px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#64748b';
  ctx.fillText('[▲/▼] Navegar  •  [Z] Comprar / Selecionar  •  [X] Voltar', winX + winW / 2, winY + winH - 8);
}
