import { Retangulo, GameState } from './types';

// =============================================================================
// ELDRIM: ECOS DO PASSADO - REGIÃO 3: TERRAS GELADAS & VILAREJO GÉLIDA
// =============================================================================
// Paleta Oficial de Cores: #a8c8e0 (Neve base) / #ffffff (Brilho/Topos) / #4a6a8a (Rocha/Sombra)
// Dimensões do Overworld: Grade 3x3 de telas 256x224px = 768x672px
// =============================================================================

export interface SpotNeve {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface PatchGeloLiso {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface BlocoGeloFino {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  quebrado?: boolean;
}

// -----------------------------------------------------------------------------
// DEFINIÇÃO DE TILES DE TERRENO (NEVE, GELO LISO, GELO FINO)
// -----------------------------------------------------------------------------

// Zonas de Neve Fofa (Redução de velocidade para 70px/s)
export const MANCHAS_NEVE: SpotNeve[] = [
  // Tela [0,0] - Caminho da Cordilheira Ocidental
  { x: 16, y: 16, w: 224, h: 192 },
  // Tela [1,0] - Entrada do Santuário do Gelo Eterno
  { x: 272, y: 16, w: 224, h: 100 },
  // Tela [2,0] - Fronteira Leste com Charco Sombrio
  { x: 528, y: 16, w: 224, h: 192 },

  // Tela [0,1] - Vale Glacial Baixo
  { x: 16, y: 240, w: 224, h: 192 },
  // Tela [1,1] - Vilarejo Gélida (Entorno das casas e fogueira)
  { x: 272, y: 240, w: 224, h: 192 },
  // Tela [2,1] - Passagem do Vento Congelante
  { x: 528, y: 240, w: 224, h: 192 },

  // Tela [0,2] - Esconderijo da Lanterna Perdida
  { x: 16, y: 464, w: 224, h: 192 },
  // Tela [1,2] - Lago de Gelo Congelado
  { x: 272, y: 464, w: 80, h: 192 },
  { x: 416, y: 464, w: 80, h: 192 },
  // Tela [2,2] - Platô Glacial do Sul
  { x: 528, y: 464, w: 224, h: 192 },
];

// Zonas de Gelo Liso (Sem redução de velocidade, mas com 0.4s de inércia ao soltar teclas)
export const MANCHAS_GELO_LISO: PatchGeloLiso[] = [
  // Tela [0,1] - Pista Glacial Ocidental
  { x: 60, y: 280, w: 120, h: 80 },
  // Tela [1,2] - Lago Congelado Central (Pista de Deslizamento)
  { x: 336, y: 490, w: 96, h: 130 },
  // Tela [2,1] - Corredor de Gelo para o Charco
  { x: 560, y: 290, w: 140, h: 90 },
];

// Bloco de Gelo Fino (Quebram e viram buraco se pisados sem as Botas de Passo Glacial)
export const BLOCS_GELO_FINO: BlocoGeloFino[] = [
  // Tela [0,2] - Ponte de Gelo Fino para a Lanterna Perdida
  { id: 'gelo_fino_0', x: 100, y: 520, w: 32, h: 32 },
  { id: 'gelo_fino_1', x: 132, y: 520, w: 32, h: 32 },
  // Tela [1,2] - Travessia do Lago Congelado
  { id: 'gelo_fino_2', x: 368, y: 460, w: 32, h: 28 },
  // Tela [2,0] - Atalho no Vão de Neve
  { id: 'gelo_fino_3', x: 620, y: 80, w: 32, h: 32 },
];

// Posição da Lanterna Perdida na Neve (Side-quest do Guarda Kell, Tela [0,2])
export const LANTERNA_PERDIDA_POS: Retangulo = {
  x: 52,
  y: 540,
  w: 16,
  h: 16,
};

// -----------------------------------------------------------------------------
// VERIFICAÇÃO DE FÍSICA E TERRENO
// -----------------------------------------------------------------------------

export function isHeroiNaNeve(x: number, y: number): boolean {
  const cx = x + 8;
  const cy = y + 12;
  return MANCHAS_NEVE.some(
    (m) => cx >= m.x && cx <= m.x + m.w && cy >= m.y && cy <= m.y + m.h
  );
}

export function isHeroiNoGeloLiso(x: number, y: number): boolean {
  const cx = x + 8;
  const cy = y + 12;
  return MANCHAS_GELO_LISO.some(
    (g) => cx >= g.x && cx <= g.x + g.w && cy >= g.y && cy <= g.y + g.h
  );
}

export function isHeroiNoGeloFino(x: number, y: number): BlocoGeloFino | undefined {
  const cx = x + 8;
  const cy = y + 12;
  return BLOCS_GELO_FINO.find(
    (b) => cx >= b.x && cx <= b.x + b.w && cy >= b.y && cy <= b.y + b.h
  );
}

// -----------------------------------------------------------------------------
// OBSTÁCULOS DO OVERWORLD DE TERRAS GELADAS (PAREDES, CASAS, PINHEIROS, ROCHAS)
// -----------------------------------------------------------------------------

export function getGeladasObstaculos(): Retangulo[] {
  const obs: Retangulo[] = [
    // Borda Externa do Overworld (768x672px)
    { x: 0, y: 0, w: 768, h: 12 }, // Norte
    { x: 0, y: 660, w: 768, h: 12 }, // Sul
    { x: 0, y: 0, w: 12, h: 672 }, // Oeste

    // Nota: Borda Leste (x=756..768) na Tela [2,1] fica ABERTA para a passagem com o Charco Sombrio!
    { x: 756, y: 0, w: 12, h: 224 }, // Borda Leste Superior
    { x: 756, y: 448, w: 12, h: 224 }, // Borda Leste Inferior

    // Vantagens de Montanha / Paredes de Gelo Internas
    { x: 240, y: 0, w: 16, h: 200 }, // Divisória Oeste [0,0]-[1,0]
    { x: 500, y: 0, w: 16, h: 200 }, // Divisória Leste [1,0]-[2,0]

    // Vilarejo Gélida (Tela [1,1]) - Estruturas das Casas
    { x: 280, y: 260, w: 48, h: 40, rotulo: 'casa_kell' }, // Casa 1 (Guarda Kell)
    { x: 380, y: 230, w: 52, h: 42, rotulo: 'casa_aldeoes' }, // Casa 2 (Norte)
    { x: 480, y: 260, w: 50, h: 44, rotulo: 'loja_varek' }, // Casa 3 (Loja de Gélida)

    // Fogueira Central de Gélida (384, 320)
    { x: 388, y: 324, w: 16, h: 16, rotulo: 'fogueira' },

    // Pinheiros Nevados Espalhados (Bloqueadores)
    { x: 40, y: 40, w: 20, h: 32 },
    { x: 180, y: 120, w: 20, h: 32 },
    { x: 600, y: 60, w: 20, h: 32 },
    { x: 680, y: 140, w: 20, h: 32 },
    { x: 30, y: 300, w: 20, h: 32 },
    { x: 200, y: 380, w: 20, h: 32 },
    { x: 600, y: 380, w: 20, h: 32 },
    { x: 40, y: 580, w: 20, h: 32 },
    { x: 220, y: 600, w: 20, h: 32 },
    { x: 600, y: 580, w: 20, h: 32 },
  ];

  return obs;
}

// -----------------------------------------------------------------------------
// RENDERIZAÇÃO DO TERRENO, NEVE E MANCHAS DE GELO
// -----------------------------------------------------------------------------

export function renderTerrenoTerrasGeladas(
  ctx: CanvasRenderingContext2D,
  camX: number,
  camY: number,
  timer: number
) {
  // 1. Fundo Geral de Neve Clara (#a8c8e0)
  ctx.fillStyle = '#a8c8e0';
  ctx.fillRect(0, 0, 768 - camX, 672 - camY);

  // Textura suave de flocos/drifts de neve no chão
  ctx.fillStyle = '#ffffff';
  for (let x = 0; x < 768; x += 32) {
    for (let y = 0; y < 672; y += 32) {
      const rx = x - camX;
      const ry = y - camY;
      if (rx < -32 || rx > 256 || ry < -32 || ry > 224) continue;

      if ((x / 32 + y / 32) % 2 === 0) {
        ctx.fillRect(rx + 4, ry + 4, 12, 6);
        ctx.fillRect(rx + 20, ry + 18, 8, 4);
      }
    }
  }

  // 2. Renderizar Manchas de Gelo Liso (#d0e8f8 com detalhes em #ffffff)
  MANCHAS_GELO_LISO.forEach((g) => {
    const rx = g.x - camX;
    const ry = g.y - camY;
    if (rx + g.w < 0 || rx > 256 || ry + g.h < 0 || ry > 224) return;

    // Base de gelo polido
    ctx.fillStyle = '#bce0f8';
    ctx.fillRect(rx, ry, g.w, g.h);

    ctx.strokeStyle = '#4a6a8a';
    ctx.lineWidth = 1;
    ctx.strokeRect(rx, ry, g.w, g.h);

    // Brilho de reflexo diagonal sobre o gelo
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.beginPath();
    ctx.moveTo(rx + 10, ry + 5);
    ctx.lineTo(rx + g.w - 10, ry + 5);
    ctx.moveTo(rx + 5, ry + 15);
    ctx.lineTo(rx + g.w - 20, ry + 15);
    ctx.stroke();
  });

  // 3. Renderizar Blocos de Gelo Fino (#78b4d8 com fissuras)
  BLOCS_GELO_FINO.forEach((b) => {
    const rx = b.x - camX;
    const ry = b.y - camY;
    if (rx + b.w < 0 || rx > 256 || ry + b.h < 0 || ry > 224) return;

    if (b.quebrado) {
      // Buraco de água gelada escura
      ctx.fillStyle = '#1c3042';
      ctx.fillRect(rx, ry, b.w, b.h);
      ctx.strokeStyle = '#38bdf8';
      ctx.strokeRect(rx + 1, ry + 1, b.w - 2, b.h - 2);
    } else {
      // Superfície de gelo fino rachado
      ctx.fillStyle = '#82c0e8';
      ctx.fillRect(rx, ry, b.w, b.h);

      // Borda e ranhuras
      ctx.strokeStyle = '#2e4860';
      ctx.strokeRect(rx, ry, b.w, b.h);

      // Desenhar fissuras em X e zigue-zague
      ctx.strokeStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(rx + 4, ry + 4);
      ctx.lineTo(rx + b.w / 2, ry + b.h / 2);
      ctx.lineTo(rx + b.w - 4, ry + 6);
      ctx.moveTo(rx + b.w / 2, ry + b.h / 2);
      ctx.lineTo(rx + 6, ry + b.h - 4);
      ctx.stroke();
    }
  });

  // 4. Montanhas / Encostas de Rocha Glacial (#4a6a8a com topo de neve #ffffff)
  const paredoes: Retangulo[] = [
    { x: 0, y: 0, w: 768, h: 12 },
    { x: 240, y: 0, w: 16, h: 200 },
    { x: 500, y: 0, w: 16, h: 200 },
  ];

  paredoes.forEach((p) => {
    const rx = p.x - camX;
    const ry = p.y - camY;
    if (rx + p.w < 0 || rx > 256 || ry + p.h < 0 || ry > 224) return;

    ctx.fillStyle = '#4a6a8a';
    ctx.fillRect(rx, ry, p.w, p.h);

    // Neve acumulada no topo das rochas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(rx, ry, p.w, 4);

    // Sombra da rocha
    ctx.fillStyle = '#2e4860';
    ctx.fillRect(rx, ry + p.h - 2, p.w, 2);
  });
}

// -----------------------------------------------------------------------------
// RENDERIZAÇÃO DO VILAREJO GÉLIDA (CASAS, FOGUEIRA, NPCS)
// -----------------------------------------------------------------------------

export function renderCasasGelida(
  ctx: CanvasRenderingContext2D,
  camX: number,
  camY: number,
  timer: number
) {
  // 1. Casa 1: Residência do Guarda Kell (280, 260)
  const c1x = 280 - camX;
  const c1y = 260 - camY;
  if (c1x + 60 >= 0 && c1x <= 256 && c1y + 50 >= 0 && c1y <= 224) {
    // Paredes de Tora
    ctx.fillStyle = '#4a2e18';
    ctx.fillRect(c1x, c1y + 12, 48, 28);

    // Telhado de Madeira Inclinado com Neve Acumulada
    ctx.fillStyle = '#2d1c0e';
    ctx.beginPath();
    ctx.moveTo(c1x - 4, c1y + 12);
    ctx.lineTo(c1x + 24, c1y - 2);
    ctx.lineTo(c1x + 52, c1y + 12);
    ctx.closePath();
    ctx.fill();

    // Manto de Neve no Telhado (#ffffff)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(c1x - 6, c1y + 12);
    ctx.lineTo(c1x + 24, c1y - 4);
    ctx.lineTo(c1x + 54, c1y + 12);
    ctx.lineTo(c1x + 48, c1y + 12);
    ctx.lineTo(c1x + 24, c1y + 2);
    ctx.lineTo(c1x, c1y + 12);
    ctx.closePath();
    ctx.fill();

    // Porta e Janela Iluminada
    ctx.fillStyle = '#a86c3e';
    ctx.fillRect(c1x + 18, c1y + 24, 12, 16); // Porta
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(c1x + 6, c1y + 20, 8, 8); // Janela acesa
    ctx.fillStyle = '#4a2e18';
    ctx.strokeRect(c1x + 6, c1y + 20, 8, 8);
  }

  // 2. Casa 2: Residência dos Aldeões (380, 230)
  const c2x = 380 - camX;
  const c2y = 230 - camY;
  if (c2x + 60 >= 0 && c2x <= 256 && c2y + 50 >= 0 && c2y <= 224) {
    ctx.fillStyle = '#4a2e18';
    ctx.fillRect(c2x, c2y + 14, 52, 28);

    ctx.fillStyle = '#2d1c0e';
    ctx.beginPath();
    ctx.moveTo(c2x - 4, c2y + 14);
    ctx.lineTo(c2x + 26, c2y - 2);
    ctx.lineTo(c2x + 56, c2y + 14);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(c2x - 6, c2y + 14);
    ctx.lineTo(c2x + 26, c2y - 4);
    ctx.lineTo(c2x + 58, c2y + 14);
    ctx.lineTo(c2x + 52, c2y + 14);
    ctx.lineTo(c2x + 26, c2y + 2);
    ctx.lineTo(c2x, c2y + 14);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#a86c3e';
    ctx.fillRect(c2x + 20, c2y + 26, 12, 16);
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(c2x + 36, c2y + 22, 8, 8);
  }

  // 3. Casa 3: Loja de Gélida (Mercador Varek) (480, 260)
  const c3x = 480 - camX;
  const c3y = 260 - camY;
  if (c3x + 60 >= 0 && c3x <= 256 && c3y + 50 >= 0 && c3y <= 224) {
    ctx.fillStyle = '#4a2e18';
    ctx.fillRect(c3x, c3y + 14, 50, 30);

    ctx.fillStyle = '#2d1c0e';
    ctx.beginPath();
    ctx.moveTo(c3x - 4, c3y + 14);
    ctx.lineTo(c3x + 25, c3y - 2);
    ctx.lineTo(c3x + 54, c3y + 14);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(c3x - 6, c3y + 14);
    ctx.lineTo(c3x + 25, c3y - 4);
    ctx.lineTo(c3x + 56, c3y + 14);
    ctx.lineTo(c3x + 50, c3y + 14);
    ctx.lineTo(c3x + 25, c3y + 2);
    ctx.lineTo(c3x, c3y + 14);
    ctx.closePath();
    ctx.fill();

    // Placa de Loja (Ícone de Sacola / Frasco)
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(c3x + 18, c3y + 2, 14, 10);
    ctx.fillStyle = '#ffffff';
    ctx.font = '8px monospace';
    ctx.fillText('⚡', c3x + 22, c3y + 10);

    ctx.fillStyle = '#a86c3e';
    ctx.fillRect(c3x + 19, c3y + 26, 12, 18);
  }
}

// -----------------------------------------------------------------------------
// FOGUEIRA CENTRAL DE GÉLIDA (PARTÍCULAS DE FOGO E CALOR)
// -----------------------------------------------------------------------------

export function renderFogueiraCentral(
  ctx: CanvasRenderingContext2D,
  camX: number,
  camY: number,
  timer: number
) {
  const fx = 388 - camX;
  const fy = 324 - camY;

  if (fx + 24 < 0 || fx > 256 || fy + 24 < 0 || fy > 224) return;

  // 1. Círculo de Pedras ao Redor da Fogueira
  ctx.fillStyle = '#4a6a8a';
  ctx.beginPath();
  ctx.arc(fx + 8, fy + 8, 12, 0, Math.PI * 2);
  ctx.fill();

  // 2. Toras Cruzadas (#2d1c0e)
  ctx.fillStyle = '#2d1c0e';
  ctx.fillRect(fx + 2, fy + 6, 12, 4);
  ctx.fillRect(fx + 6, fy + 2, 4, 12);

  // 3. Brilho Quente Pulsante (#f97316 a 30% opacidade)
  const pulse = Math.sin(timer * 6) * 3;
  const grad = ctx.createRadialGradient(
    fx + 8,
    fy + 8,
    2,
    fx + 8,
    fy + 8,
    24 + pulse
  );
  grad.addColorStop(0, 'rgba(249, 115, 22, 0.8)');
  grad.addColorStop(0.5, 'rgba(251, 191, 36, 0.4)');
  grad.addColorStop(1, 'rgba(239, 68, 68, 0)');

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(fx + 8, fy + 8, 24 + pulse, 0, Math.PI * 2);
  ctx.fill();

  // 4. Labaredas Dinâmicas Pixelated
  ctx.fillStyle = '#ef4444'; // Vermelho
  ctx.fillRect(fx + 5, fy + 4, 6, 8);
  ctx.fillStyle = '#f97316'; // Laranja
  ctx.fillRect(fx + 6, fy + 2 - Math.floor(pulse % 2), 4, 8);
  ctx.fillStyle = '#fef08a'; // Amarelo centro
  ctx.fillRect(fx + 7, fy + 4, 2, 4);

  // 5. Faíscas e Brasas Subindo
  for (let i = 0; i < 4; i++) {
    const sparkX = fx + 4 + ((Math.sin(timer * 8 + i) * 8 + 8) % 12);
    const sparkY = fy - ((timer * 20 + i * 6) % 16);
    ctx.fillStyle = i % 2 === 0 ? '#fbbf24' : '#f97316';
    ctx.fillRect(sparkX, sparkY, 2, 2);
  }
}

// -----------------------------------------------------------------------------
// RENDERIZAÇÃO DA LANTERNA PERDIDA NA NEVE (SIDE-QUEST GUARDA KELL)
// -----------------------------------------------------------------------------

export function renderLanternaPerdida(
  ctx: CanvasRenderingContext2D,
  camX: number,
  camY: number,
  timer: number,
  coletada?: boolean
) {
  if (coletada) return; // Não desenha se já foi recuperada

  const lx = LANTERNA_PERDIDA_POS.x - camX;
  const ly = LANTERNA_PERDIDA_POS.y - camY;

  if (lx + 16 < 0 || lx > 256 || ly + 16 < 0 || ly > 224) return;

  // Monte de Neve acumulada (#ffffff)
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(lx + 8, ly + 10, 8, Math.PI, Math.PI * 2);
  ctx.fill();

  // Lanterna de Latão Dourado com Brilho Quente (#fbbf24)
  const pulse = Math.sin(timer * 5) * 2;
  ctx.fillStyle = '#d97706';
  ctx.fillRect(lx + 5, ly + 2, 6, 8); // Corpo
  ctx.fillStyle = '#fef08a';
  ctx.fillRect(lx + 6, ly + 4, 4, 4); // Vidro aceso

  // Halo Dourado piscando
  ctx.strokeStyle = `rgba(251, 191, 36, ${0.5 + Math.sin(timer * 4) * 0.3})`;
  ctx.strokeRect(lx + 3 - pulse / 2, ly + 1 - pulse / 2, 10 + pulse, 10 + pulse);
}

// -----------------------------------------------------------------------------
// RENDERIZAÇÃO DE NPCS DO VILAREJO GÉLIDA (GUARDA KELL & MERCADOR VAREK)
// -----------------------------------------------------------------------------

export function renderNPCsGelida(
  ctx: CanvasRenderingContext2D,
  camX: number,
  camY: number,
  timer: number,
  questStatus?: 'nao_iniciada' | 'em_andamento' | 'concluida'
) {
  // 1. Guarda Kell (350, 324) - Perto da Fogueira
  const kx = 350 - camX;
  const ky = 324 - camY;

  if (kx + 16 >= 0 && kx <= 256 && ky + 16 >= 0 && ky <= 224) {
    // Sombra
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(kx + 8, ky + 15, 6, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Capa Azul Glacial (#4a6a8a) com Gola de Pelo Branco (#ffffff)
    ctx.fillStyle = '#2e4860';
    ctx.fillRect(kx + 4, ky + 6, 8, 9); // Corpo/Manto
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(kx + 3, ky + 5, 10, 3); // Gola de pelo de urso

    // Cabeça/Yelmo de Aço
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(kx + 5, ky + 1, 6, 5);

    // Lança do Guarda Kell
    ctx.strokeStyle = '#64748b';
    ctx.beginPath();
    ctx.moveTo(kx + 13, ky - 2);
    ctx.lineTo(kx + 13, ky + 16);
    ctx.stroke();
    ctx.fillStyle = '#e2e8f0'; // Ponta de prata
    ctx.fillRect(kx + 12, ky - 4, 3, 4);

    // Balão de Exclamação [!] sobre a cabeça se houver quest pendente
    if (questStatus !== 'concluida') {
      const floatY = Math.sin(timer * 6) * 2;
      ctx.fillStyle = questStatus === 'em_andamento' ? '#38bdf8' : '#fbbf24';
      ctx.fillRect(kx + 6, ky - 12 + floatY, 4, 6);
      ctx.fillRect(kx + 6, ky - 4 + floatY, 4, 2);
    }
  }

  // 2. Mercador Varek (496, 308) - Em frente à Loja
  const vx = 496 - camX;
  const vy = 308 - camY;

  if (vx + 16 >= 0 && vx <= 256 && vy + 16 >= 0 && vy <= 224) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(vx + 8, vy + 15, 6, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Túnica Verde Escuro de Peles (#1e3a29)
    ctx.fillStyle = '#1e3a29';
    ctx.fillRect(vx + 4, vy + 6, 8, 9);
    ctx.fillStyle = '#a86c3e'; // Capuz de couro
    ctx.fillRect(vx + 5, vy + 2, 6, 5);

    // Ícone de Comércio [$] flutuante
    const floatY = Math.sin(timer * 4) * 2;
    ctx.fillStyle = '#38bdf8';
    ctx.font = '8px monospace';
    ctx.fillText('$', vx + 6, vy - 4 + floatY);
  }
}

// -----------------------------------------------------------------------------
// NEVASCA SUAVE CAINDO (EFEITO ATMOSFÉRICO DE AMBIENTE FRIO)
// -----------------------------------------------------------------------------

export function renderNevascaTerrasGeladas(
  ctx: CanvasRenderingContext2D,
  timer: number
) {
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  for (let i = 0; i < 30; i++) {
    const flakeX = (i * 17 + timer * 40 + Math.sin(timer + i) * 10) % 256;
    const flakeY = (i * 23 + timer * 60) % 224;
    const size = i % 3 === 0 ? 2 : 1;
    ctx.fillRect(flakeX, flakeY, size, size);
  }
}

// -----------------------------------------------------------------------------
// ENTRADA DA CATACONBA OPCIONAL: CAVERNA DE CRISTAL (TELA [2,2])
// -----------------------------------------------------------------------------

export const ENTRADA_CAVERNA_CRISTAL_OVERWORLD: Retangulo = {
  x: 640,
  y: 480,
  w: 24,
  h: 20,
  rotulo: 'Entrada da Caverna de Cristal',
};

export function renderEntradaCavernaCristal(
  ctx: CanvasRenderingContext2D,
  camX: number,
  camY: number
) {
  const cx = 636 - camX;
  const cy = 468 - camY;

  if (cx + 32 < 0 || cx > 256 || cy + 32 < 0 || cy > 224) return;

  // Arco de Rocha de Gelo Ciano
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(cx, cy, 32, 28);

  ctx.fillStyle = '#0369a1';
  ctx.fillRect(cx + 2, cy + 2, 28, 24);

  // Abertura da Caverna
  ctx.fillStyle = '#020617';
  ctx.fillRect(cx + 6, cy + 8, 20, 20);

  // Cristais reluzentes na entrada
  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(cx + 2, cy + 4, 4, 8);
  ctx.fillRect(cx + 26, cy + 4, 4, 8);
  ctx.fillStyle = '#e0f2fe';
  ctx.fillRect(cx + 3, cy + 2, 2, 4);
  ctx.fillRect(cx + 27, cy + 2, 2, 4);

  // Placa indicativa
  ctx.fillStyle = '#7dd3fc';
  ctx.font = '6px monospace';
  ctx.fillText('CRISTAL', cx + 2, cy + 32);
}

