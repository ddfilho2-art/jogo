import Phaser from 'phaser';

// =============================================================================
// ELDRIM: ECOS DO PASSADO - SPRITESHEET E ANIMAÇÕES DE REN (DIRETIVA V3)
// =============================================================================
// Escala visual profissional de 28x36 px por frame (corpo 24x32 + swing de espada).
// Paleta canônica de Eldrim:
// - Cabelos volumosos castanhos escuros com mechas de luz (#2c1810 / #4a2818)
// - Pele clara levemente dourada (#f5c7a9 / #dfa07d)
// - Túnica nobre terracota com gola dobrada e dobras de tecido (#b93822 / #8c2514)
// - Cinto de couro resistente com fivela dourada trabalhada (#3e2723 / #d4af37)
// - Calça marrom rústica e botas de aventureiro dobradas (#271911 / #1a0f0a)
// - Lâmina de Eldrim: aço prateado puro com guarda de ouro e cabo reforçado (#e2e8f0 / #f59e0b)
// =============================================================================

export const REN_FRAME_WIDTH = 28;
export const REN_FRAME_HEIGHT = 36;

export function gerarSpritesheetHeroi(scene: Phaser.Scene): void {
  if (scene.textures.exists('ren_spritesheet')) {
    return;
  }

  const TOTAL_FRAMES = 54;
  const canvas = document.createElement('canvas');
  canvas.width = REN_FRAME_WIDTH * TOTAL_FRAMES;
  canvas.height = REN_FRAME_HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Desativa interpolação do 2D context para pixel art cirúrgico
  ctx.imageSmoothingEnabled = false;

  // Renderiza os 54 frames
  for (let f = 0; f < TOTAL_FRAMES; f++) {
    const ox = f * REN_FRAME_WIDTH;
    desenharFrameRen(ctx, ox, 0, f);
  }

  scene.textures.addSpriteSheet('ren_spritesheet', canvas as unknown as HTMLImageElement, {
    frameWidth: REN_FRAME_WIDTH,
    frameHeight: REN_FRAME_HEIGHT,
  });
}

/**
 * Desenha um frame específico de Ren com proporção 24x32 dentro da caixa de 28x36
 */
function desenharFrameRen(ctx: CanvasRenderingContext2D, ox: number, oy: number, frameIndex: number): void {
  // Identificação do grupo de animação
  // 0..3: Idle (down, up, left, right)
  // 4..7: Walk Down (4 frames)
  // 8..11: Walk Up (4 frames)
  // 12..15: Walk Left (4 frames)
  // 16..19: Walk Right (4 frames)
  // 20..23: Attack Down (4 frames)
  // 24..27: Attack Up (4 frames)
  // 28..31: Attack Left (4 frames)
  // 32..35: Attack Right (4 frames)
  // 36..37: Hurt Down (2 frames)
  // 38..39: Hurt Up (2 frames)
  // 40..41: Hurt Left (2 frames)
  // 42..43: Hurt Right (2 frames)
  // 44..48: Death (5 frames)
  // 49..53: Charged Attack (5 frames)

  let dir: 'down' | 'up' | 'left' | 'right' = 'down';
  let modo: 'idle' | 'walk' | 'attack' | 'hurt' | 'death' | 'charged' = 'idle';
  let subFrame = 0;

  if (frameIndex >= 0 && frameIndex <= 3) {
    modo = 'idle';
    dir = frameIndex === 0 ? 'down' : frameIndex === 1 ? 'up' : frameIndex === 2 ? 'left' : 'right';
    subFrame = 0;
  } else if (frameIndex >= 4 && frameIndex <= 7) {
    modo = 'walk'; dir = 'down'; subFrame = frameIndex - 4;
  } else if (frameIndex >= 8 && frameIndex <= 11) {
    modo = 'walk'; dir = 'up'; subFrame = frameIndex - 8;
  } else if (frameIndex >= 12 && frameIndex <= 15) {
    modo = 'walk'; dir = 'left'; subFrame = frameIndex - 12;
  } else if (frameIndex >= 16 && frameIndex <= 19) {
    modo = 'walk'; dir = 'right'; subFrame = frameIndex - 16;
  } else if (frameIndex >= 20 && frameIndex <= 23) {
    modo = 'attack'; dir = 'down'; subFrame = frameIndex - 20;
  } else if (frameIndex >= 24 && frameIndex <= 27) {
    modo = 'attack'; dir = 'up'; subFrame = frameIndex - 24;
  } else if (frameIndex >= 28 && frameIndex <= 31) {
    modo = 'attack'; dir = 'left'; subFrame = frameIndex - 28;
  } else if (frameIndex >= 32 && frameIndex <= 35) {
    modo = 'attack'; dir = 'right'; subFrame = frameIndex - 32;
  } else if (frameIndex >= 36 && frameIndex <= 37) {
    modo = 'hurt'; dir = 'down'; subFrame = frameIndex - 36;
  } else if (frameIndex >= 38 && frameIndex <= 39) {
    modo = 'hurt'; dir = 'up'; subFrame = frameIndex - 38;
  } else if (frameIndex >= 40 && frameIndex <= 41) {
    modo = 'hurt'; dir = 'left'; subFrame = frameIndex - 40;
  } else if (frameIndex >= 42 && frameIndex <= 43) {
    modo = 'hurt'; dir = 'right'; subFrame = frameIndex - 42;
  } else if (frameIndex >= 44 && frameIndex <= 48) {
    modo = 'death'; dir = 'down'; subFrame = frameIndex - 44;
  } else if (frameIndex >= 49 && frameIndex <= 53) {
    modo = 'charged'; dir = 'down'; subFrame = frameIndex - 49;
  }

  // Paleta de Cores
  const P_PELE = '#f6cbb0';
  const P_PELE_SOMBRA = '#dc9a7c';
  const P_CABELO = '#24140c';
  const P_CABELO_LUZ = '#452919';
  const P_OLHO = '#140c06';
  const P_TUNICA = '#b8331d';
  const P_TUNICA_LUZ = '#dc462d';
  const P_TUNICA_SOMBRA = '#7e1e10';
  const P_CINTO = '#362116';
  const P_FIVELA = '#f59e0b';
  const P_CALCA = '#251b14';
  const P_BOTA = '#19110c';
  const P_BOTA_LUZ = '#332319';
  const P_ESPADA = '#e2e8f0';
  const P_ESPADA_LUZ = '#ffffff';
  const P_ESPADA_GUARDA = '#d97706';

  // Offset do corpo dentro do quadro de 28x36:
  // Centro horizontal = 14. O corpo tem 16px de largura (x: 6..21), altura de 28px (y: 4..32).
  const bx = ox + 6;
  let by = oy + 4;

  // Efeito de bobbing na caminhada (oscilação vertical suave)
  if (modo === 'walk') {
    if (subFrame === 1 || subFrame === 3) by += 1;
  } else if (modo === 'hurt') {
    by += subFrame === 0 ? -1 : 1;
  } else if (modo === 'death') {
    by += subFrame * 2;
  }

  // Se modo morte adiantado, fade out
  if (modo === 'death' && subFrame >= 3) {
    ctx.globalAlpha = Math.max(0.2, 1 - (subFrame - 2) * 0.35);
  } else {
    ctx.globalAlpha = 1.0;
  }

  // 1. Pernas e Botas
  ctx.fillStyle = P_CALCA;
  let pernaEsqX = bx + 3;
  let pernaDirX = bx + 9;
  let pernaEsqY = by + 20;
  let pernaDirY = by + 20;

  if (modo === 'walk') {
    if (dir === 'down' || dir === 'up') {
      if (subFrame === 0) { pernaEsqY -= 1; pernaDirY += 1; }
      else if (subFrame === 2) { pernaEsqY += 1; pernaDirY -= 1; }
    } else {
      if (subFrame === 0) { pernaEsqX -= 2; pernaDirX += 1; }
      else if (subFrame === 2) { pernaEsqX += 2; pernaDirX -= 1; }
    }
  }

  // Calças
  ctx.fillRect(pernaEsqX, pernaEsqY, 4, 4);
  ctx.fillRect(pernaDirX, pernaDirY, 4, 4);

  // Botas de couro
  ctx.fillStyle = P_BOTA;
  ctx.fillRect(pernaEsqX, pernaEsqY + 4, 4, 5);
  ctx.fillRect(pernaDirX, pernaDirY + 4, 4, 5);
  ctx.fillStyle = P_BOTA_LUZ;
  ctx.fillRect(pernaEsqX + 1, pernaEsqY + 4, 2, 1);
  ctx.fillRect(pernaDirX + 1, pernaDirY + 4, 2, 1);

  // 2. Tronco / Túnica nobre terracota
  ctx.fillStyle = P_TUNICA;
  ctx.fillRect(bx + 2, by + 10, 12, 10);
  ctx.fillStyle = P_TUNICA_SOMBRA;
  ctx.fillRect(bx + 2, by + 17, 12, 3);
  ctx.fillStyle = P_TUNICA_LUZ;
  ctx.fillRect(bx + 3, by + 10, 10, 2);

  // Cinto de couro com fivela dourada
  ctx.fillStyle = P_CINTO;
  ctx.fillRect(bx + 2, by + 15, 12, 3);
  ctx.fillStyle = P_FIVELA;
  ctx.fillRect(bx + 6, by + 15, 4, 3);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(bx + 7, by + 16, 2, 1);

  // 3. Cabeça, Rosto e Cabelos volumosos
  if (dir === 'down') {
    // Rosto
    ctx.fillStyle = P_PELE;
    ctx.fillRect(bx + 3, by + 4, 10, 7);
    ctx.fillStyle = P_PELE_SOMBRA;
    ctx.fillRect(bx + 3, by + 9, 10, 2);

    // Olhos
    if (modo !== 'hurt' && modo !== 'death') {
      ctx.fillStyle = P_OLHO;
      ctx.fillRect(bx + 5, by + 6, 2, 2);
      ctx.fillRect(bx + 9, by + 6, 2, 2);
    } else {
      // Olhos cerrados no dano
      ctx.fillStyle = P_OLHO;
      ctx.fillRect(bx + 5, by + 7, 2, 1);
      ctx.fillRect(bx + 9, by + 7, 2, 1);
    }

    // Cabelo volumoso com franja
    ctx.fillStyle = P_CABELO;
    ctx.fillRect(bx + 2, by + 1, 12, 4);
    ctx.fillRect(bx + 1, by + 3, 2, 5);
    ctx.fillRect(bx + 13, by + 3, 2, 5);
    ctx.fillRect(bx + 3, by + 4, 3, 2); // mecha esquerda
    ctx.fillRect(bx + 10, by + 4, 3, 2); // mecha direita
    ctx.fillStyle = P_CABELO_LUZ;
    ctx.fillRect(bx + 4, by + 2, 8, 1);
  } else if (dir === 'up') {
    // Visto de costas (cabelo cobre a cabeça e costas)
    ctx.fillStyle = P_CABELO;
    ctx.fillRect(bx + 2, by + 1, 12, 9);
    ctx.fillRect(bx + 3, by + 10, 10, 2);
    ctx.fillStyle = P_CABELO_LUZ;
    ctx.fillRect(bx + 4, by + 2, 8, 2);
  } else if (dir === 'left') {
    // Perfil Esquerdo
    ctx.fillStyle = P_PELE;
    ctx.fillRect(bx + 3, by + 4, 8, 7);
    ctx.fillStyle = P_PELE_SOMBRA;
    ctx.fillRect(bx + 3, by + 9, 8, 2);

    // Olho esquerdo
    ctx.fillStyle = P_OLHO;
    ctx.fillRect(bx + 4, by + 6, 2, 2);

    // Cabelo lateral
    ctx.fillStyle = P_CABELO;
    ctx.fillRect(bx + 3, by + 1, 11, 4);
    ctx.fillRect(bx + 10, by + 4, 4, 6);
    ctx.fillRect(bx + 4, by + 4, 3, 2);
    ctx.fillStyle = P_CABELO_LUZ;
    ctx.fillRect(bx + 5, by + 2, 7, 1);
  } else if (dir === 'right') {
    // Perfil Direito
    ctx.fillStyle = P_PELE;
    ctx.fillRect(bx + 5, by + 4, 8, 7);
    ctx.fillStyle = P_PELE_SOMBRA;
    ctx.fillRect(bx + 5, by + 9, 8, 2);

    // Olho direito
    ctx.fillStyle = P_OLHO;
    ctx.fillRect(bx + 10, by + 6, 2, 2);

    // Cabelo lateral
    ctx.fillStyle = P_CABELO;
    ctx.fillRect(bx + 2, by + 1, 11, 4);
    ctx.fillRect(bx + 2, by + 4, 4, 6);
    ctx.fillRect(bx + 9, by + 4, 3, 2);
    ctx.fillStyle = P_CABELO_LUZ;
    ctx.fillRect(bx + 4, by + 2, 7, 1);
  }

  // 4. Braços e Lâmina de Eldrim
  if (modo === 'attack') {
    desenharAtaqueEspada(ctx, bx, by, dir, subFrame, P_ESPADA, P_ESPADA_LUZ, P_ESPADA_GUARDA, P_PELE);
  } else if (modo === 'charged') {
    desenharAtaqueCarregado(ctx, bx, by, subFrame, P_ESPADA, P_ESPADA_LUZ, P_ESPADA_GUARDA, P_PELE);
  } else {
    // Espada guardada ou na mão em repouso
    if (dir === 'down' || dir === 'right') {
      // Espada embainhada no quadril
      ctx.fillStyle = P_ESPADA_GUARDA;
      ctx.fillRect(bx + 13, by + 13, 2, 2);
      ctx.fillStyle = P_ESPADA;
      ctx.fillRect(bx + 14, by + 15, 2, 8);
    } else if (dir === 'left') {
      ctx.fillStyle = P_ESPADA_GUARDA;
      ctx.fillRect(bx + 1, by + 13, 2, 2);
      ctx.fillStyle = P_ESPADA;
      ctx.fillRect(bx, by + 15, 2, 8);
    } else if (dir === 'up') {
      ctx.fillStyle = P_ESPADA_GUARDA;
      ctx.fillRect(bx + 12, by + 11, 2, 2);
      ctx.fillStyle = P_ESPADA;
      ctx.fillRect(bx + 13, by + 13, 2, 9);
    }
  }

  ctx.globalAlpha = 1.0;
}

/**
 * Renderiza o ataque com espada em 4 estágios: antecipação -> golpe -> arco luminoso -> recuperação
 */
function desenharAtaqueEspada(
  ctx: CanvasRenderingContext2D,
  bx: number,
  by: number,
  dir: 'down' | 'up' | 'left' | 'right',
  subFrame: number,
  corEspada: string,
  corLuz: string,
  corGuarda: string,
  corPele: string
): void {
  // Braço empunhando
  ctx.fillStyle = corPele;

  if (dir === 'down') {
    if (subFrame === 0) {
      // Antecipação: ergue a espada
      ctx.fillRect(bx + 12, by + 7, 3, 4);
      ctx.fillStyle = corGuarda;
      ctx.fillRect(bx + 13, by + 5, 4, 2);
      ctx.fillStyle = corEspada;
      ctx.fillRect(bx + 14, by - 4, 2, 9);
    } else if (subFrame === 1 || subFrame === 2) {
      // Golpe descendente com arco áureo
      ctx.fillRect(bx + 6, by + 16, 4, 3);
      ctx.fillStyle = corGuarda;
      ctx.fillRect(bx + 6, by + 19, 5, 2);
      ctx.fillStyle = corEspada;
      ctx.fillRect(bx + 7, by + 21, 3, 10);
      ctx.fillStyle = corLuz;
      ctx.fillRect(bx + 8, by + 22, 1, 9);

      // Arco de rastro da lâmina
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(bx - 2, by + 18, 18, 2);
      ctx.fillRect(bx + 14, by + 14, 3, 4);
    } else {
      // Recuperação
      ctx.fillRect(bx + 8, by + 16, 3, 3);
      ctx.fillStyle = corGuarda;
      ctx.fillRect(bx + 8, by + 19, 4, 2);
      ctx.fillStyle = corEspada;
      ctx.fillRect(bx + 9, by + 21, 2, 7);
    }
  } else if (dir === 'up') {
    if (subFrame === 0) {
      ctx.fillRect(bx + 1, by + 14, 3, 4);
      ctx.fillStyle = corEspada;
      ctx.fillRect(bx + 1, by + 18, 2, 8);
    } else if (subFrame === 1 || subFrame === 2) {
      // Golpe para cima com arco
      ctx.fillRect(bx + 6, by + 2, 4, 3);
      ctx.fillStyle = corGuarda;
      ctx.fillRect(bx + 5, by - 1, 6, 2);
      ctx.fillStyle = corEspada;
      ctx.fillRect(bx + 7, by - 11, 3, 10);
      ctx.fillStyle = corLuz;
      ctx.fillRect(bx + 8, by - 11, 1, 9);

      // Arco de corte
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(bx - 2, by - 3, 18, 2);
    } else {
      ctx.fillRect(bx + 6, by + 3, 3, 3);
      ctx.fillStyle = corEspada;
      ctx.fillRect(bx + 7, by - 7, 2, 8);
    }
  } else if (dir === 'left') {
    if (subFrame === 0) {
      ctx.fillRect(bx + 12, by + 8, 3, 4);
      ctx.fillStyle = corEspada;
      ctx.fillRect(bx + 13, by + 1, 2, 8);
    } else if (subFrame === 1 || subFrame === 2) {
      // Estocada e corte para a esquerda
      ctx.fillRect(bx - 2, by + 12, 4, 3);
      ctx.fillStyle = corGuarda;
      ctx.fillRect(bx - 4, by + 11, 2, 5);
      ctx.fillStyle = corEspada;
      ctx.fillRect(bx - 14, by + 12, 10, 3);
      ctx.fillStyle = corLuz;
      ctx.fillRect(bx - 14, by + 13, 9, 1);

      // Rastro brilhante
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(bx - 15, by + 8, 3, 11);
    } else {
      ctx.fillRect(bx - 1, by + 12, 3, 3);
      ctx.fillStyle = corEspada;
      ctx.fillRect(bx - 9, by + 13, 8, 2);
    }
  } else if (dir === 'right') {
    if (subFrame === 0) {
      ctx.fillRect(bx + 1, by + 8, 3, 4);
      ctx.fillStyle = corEspada;
      ctx.fillRect(bx, by + 1, 2, 8);
    } else if (subFrame === 1 || subFrame === 2) {
      // Golpe para a direita
      ctx.fillRect(bx + 14, by + 12, 4, 3);
      ctx.fillStyle = corGuarda;
      ctx.fillRect(bx + 18, by + 11, 2, 5);
      ctx.fillStyle = corEspada;
      ctx.fillRect(bx + 20, by + 12, 10, 3);
      ctx.fillStyle = corLuz;
      ctx.fillRect(bx + 20, by + 13, 9, 1);

      // Rastro luminoso
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(bx + 28, by + 8, 3, 11);
    } else {
      ctx.fillRect(bx + 14, by + 12, 3, 3);
      ctx.fillStyle = corEspada;
      ctx.fillRect(bx + 17, by + 13, 8, 2);
    }
  }
}

/**
 * Renderiza os frames do Ataque Carregado de Eldrim (brilho concentrado -> corte circular 360°)
 */
function desenharAtaqueCarregado(
  ctx: CanvasRenderingContext2D,
  bx: number,
  by: number,
  subFrame: number,
  corEspada: string,
  corLuz: string,
  corGuarda: string,
  corPele: string
): void {
  ctx.fillStyle = corPele;
  ctx.fillRect(bx + 6, by + 14, 4, 4);

  // Aura de energia dourada/celeste circular
  ctx.strokeStyle = subFrame % 2 === 0 ? '#38bdf8' : '#fde047';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(bx + 8, by + 16, 12 + subFrame * 1.5, 0, Math.PI * 2);
  ctx.stroke();

  // Espada em giro
  ctx.fillStyle = corGuarda;
  ctx.fillRect(bx + 6, by + 18, 5, 2);
  ctx.fillStyle = corEspada;
  ctx.fillRect(bx + 7, by + 20, 3, 11);
  ctx.fillStyle = corLuz;
  ctx.fillRect(bx + 8, by + 20, 1, 10);
}
