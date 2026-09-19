import Phaser from 'phaser';

// =============================================================================
// ELDRIM: ECOS DO PASSADO - REN ATLAS V5
// =============================================================================
// Reconstrução visual completa e definitiva do herói Ren:
// Dimensões do frame: 48×64 pixels (corpo ~36x52 px).
// Total de 72 frames em spritesheet:
// - IDLE: 4 direções (0..3)
// - WALK: 4 direções × 4 frames (4..19)
// - ATTACK: 4 direções × 4 frames (20..35)
// - CHARGED_ATTACK: 6 frames (36..41)
// - DODGE: 4 direções × 4 frames (42..57)
// - HURT: 4 direções × 2 frames (58..65)
// - DEATH: 6 frames (66..71)
//
// Paleta canônica de Eldrim:
// - Cabelo: castanho escuro volumoso com mechas de luz (#24130b, #452616, #693c24)
// - Pele: tom claro levemente bronzeado com sombras (#f7d5bd, #dc9f7e, #b87556)
// - Túnica: terracota nobre com dobras e broche dourado (#b93822, #db482e, #791e10, #facc15)
// - Cinto: couro marrom escuro com fivela dourada trabalhada (#382116, #eab308, #fef08a)
// - Calça: marrom rústico (#261a13)
// - Botas: couro dobrado com solado (#1b110a, #352115)
// - Lâmina de Eldrim: guarda dourada de asas e aço prateado puro com fio brilhante
//   (#e2e8f0, #ffffff, #94a3b8, #d97706)
// =============================================================================

export const REN_V5_FRAME_WIDTH = 48;
export const REN_V5_FRAME_HEIGHT = 64;

export class RenAtlas {
  static gerarSpritesheetRen(scene: Phaser.Scene): void {
    if (scene.textures.exists('ren_spritesheet_v5')) {
      return;
    }

    const TOTAL_FRAMES = 72;
    const canvas = document.createElement('canvas');
    canvas.width = REN_V5_FRAME_WIDTH * TOTAL_FRAMES;
    canvas.height = REN_V5_FRAME_HEIGHT;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;

    for (let f = 0; f < TOTAL_FRAMES; f++) {
      const ox = f * REN_V5_FRAME_WIDTH;
      this.renderizarFrameRen(ctx, ox, 0, f);
    }

    scene.textures.addSpriteSheet('ren_spritesheet_v5', canvas as unknown as HTMLImageElement, {
      frameWidth: REN_V5_FRAME_WIDTH,
      frameHeight: REN_V5_FRAME_HEIGHT,
    });
  }

  private static renderizarFrameRen(
    ctx: CanvasRenderingContext2D,
    ox: number,
    oy: number,
    frameIndex: number
  ): void {
    // Decodificar estado, direção e sub-frame
    let modo: 'idle' | 'walk' | 'attack' | 'charged' | 'dodge' | 'hurt' | 'death' = 'idle';
    let dir: 'down' | 'up' | 'left' | 'right' = 'down';
    let subFrame = 0;

    if (frameIndex >= 0 && frameIndex <= 3) {
      modo = 'idle';
      dir = frameIndex === 0 ? 'down' : frameIndex === 1 ? 'up' : frameIndex === 2 ? 'left' : 'right';
      subFrame = 0;
    } else if (frameIndex >= 4 && frameIndex <= 19) {
      modo = 'walk';
      const offset = frameIndex - 4;
      const dirs: Array<'down' | 'up' | 'left' | 'right'> = ['down', 'up', 'left', 'right'];
      dir = dirs[Math.floor(offset / 4)];
      subFrame = offset % 4;
    } else if (frameIndex >= 20 && frameIndex <= 35) {
      modo = 'attack';
      const offset = frameIndex - 20;
      const dirs: Array<'down' | 'up' | 'left' | 'right'> = ['down', 'up', 'left', 'right'];
      dir = dirs[Math.floor(offset / 4)];
      subFrame = offset % 4;
    } else if (frameIndex >= 36 && frameIndex <= 41) {
      modo = 'charged';
      dir = 'down';
      subFrame = frameIndex - 36;
    } else if (frameIndex >= 42 && frameIndex <= 57) {
      modo = 'dodge';
      const offset = frameIndex - 42;
      const dirs: Array<'down' | 'up' | 'left' | 'right'> = ['down', 'up', 'left', 'right'];
      dir = dirs[Math.floor(offset / 4)];
      subFrame = offset % 4;
    } else if (frameIndex >= 58 && frameIndex <= 65) {
      modo = 'hurt';
      const offset = frameIndex - 58;
      const dirs: Array<'down' | 'up' | 'left' | 'right'> = ['down', 'up', 'left', 'right'];
      dir = dirs[Math.floor(offset / 2)];
      subFrame = offset % 2;
    } else if (frameIndex >= 66 && frameIndex <= 71) {
      modo = 'death';
      dir = 'down';
      subFrame = frameIndex - 66;
    }

    // Cores de Paleta
    const C_PELE = '#f7d5bd';
    const C_PELE_SOMBRA = '#dc9f7e';
    const C_CABELO = '#24130b';
    const C_CABELO_MEIO = '#452616';
    const C_CABELO_LUZ = '#693c24';
    const C_OLHO = '#150c07';
    const C_TUNICA = '#b93822';
    const C_TUNICA_LUZ = '#db482e';
    const C_TUNICA_SOMBRA = '#791e10';
    const C_BROCHE = '#facc15';
    const C_CINTO = '#382116';
    const C_FIVELA = '#eab308';
    const C_FIVELA_LUZ = '#fef08a';
    const C_CALCA = '#261a13';
    const C_BOTA = '#1b110a';
    const C_BOTA_LUZ = '#352115';
    const C_ESPADA = '#e2e8f0';
    const C_ESPADA_LUZ = '#ffffff';
    const C_ESPADA_SOMBRA = '#94a3b8';
    const C_ESPADA_GUARDA = '#d97706';

    // Centro do corpo dentro do frame de 48x64:
    // x central = 24, base nos pés y = 58.
    const cx = ox + 24;
    let cy = oy + 6;

    // Bobbing / oscilação natural de caminhada e combate
    if (modo === 'walk') {
      if (subFrame === 1 || subFrame === 3) cy += 1;
    } else if (modo === 'dodge') {
      cy += subFrame === 1 || subFrame === 2 ? 6 : 2;
    } else if (modo === 'hurt') {
      cy += subFrame === 0 ? -2 : 1;
    } else if (modo === 'death') {
      cy += subFrame * 3;
    }

    // Efeito de fade-out na morte
    if (modo === 'death' && subFrame >= 3) {
      ctx.globalAlpha = Math.max(0.15, 1 - (subFrame - 2) * 0.3);
    } else {
      ctx.globalAlpha = 1.0;
    }

    // =========================================================================
    // 1. PERNAS E BOTAS DE COURO
    // =========================================================================
    let pEsqX = cx - 9;
    let pDirX = cx + 2;
    let pEsqY = cy + 34;
    let pDirY = cy + 34;

    if (modo === 'walk') {
      if (dir === 'down' || dir === 'up') {
        if (subFrame === 0) { pEsqY -= 3; pDirY += 1; }
        else if (subFrame === 2) { pEsqY += 1; pDirY -= 3; }
      } else {
        if (subFrame === 0) { pEsqX -= 4; pDirX += 2; }
        else if (subFrame === 2) { pEsqX += 2; pDirX -= 4; }
      }
    } else if (modo === 'dodge') {
      // Posição recolhida de rolamento
      pEsqX = cx - 7; pDirX = cx + 1;
      pEsqY = cy + 24; pDirY = cy + 24;
    }

    // Calças rústicas
    ctx.fillStyle = C_CALCA;
    ctx.fillRect(pEsqX, pEsqY, 7, 9);
    ctx.fillRect(pDirX, pDirY, 7, 9);

    // Botas de aventureiro com dobras
    ctx.fillStyle = C_BOTA;
    ctx.fillRect(pEsqX, pEsqY + 8, 7, 10);
    ctx.fillRect(pDirX, pDirY + 8, 7, 10);
    ctx.fillStyle = C_BOTA_LUZ;
    ctx.fillRect(pEsqX + 1, pEsqY + 8, 5, 2);
    ctx.fillRect(pDirX + 1, pDirY + 8, 5, 2);

    // =========================================================================
    // 2. TÚNICA TERRACOTA EM CAMADAS COM CINTO E BROCHE DOURADO
    // =========================================================================
    const tX = cx - 12;
    const tY = cy + 16;
    const tW = 24;
    const tH = 20;

    // Camada base da túnica
    ctx.fillStyle = C_TUNICA;
    ctx.fillRect(tX, tY, tW, tH);

    // Sombra nas laterais e na barra inferior
    ctx.fillStyle = C_TUNICA_SOMBRA;
    ctx.fillRect(tX, tY + tH - 4, tW, 4);
    ctx.fillRect(tX, tY, 3, tH);
    ctx.fillRect(tX + tW - 3, tY, 3, tH);

    // Destaque de luz nas dobras centrais
    ctx.fillStyle = C_TUNICA_LUZ;
    ctx.fillRect(tX + 4, tY + 2, tW - 8, 3);
    ctx.fillRect(tX + 7, tY + 5, 3, 10);

    // Cinto largo de couro resistente
    ctx.fillStyle = C_CINTO;
    ctx.fillRect(tX, tY + 12, tW, 5);

    // Fivela dourada detalhada
    ctx.fillStyle = C_FIVELA;
    ctx.fillRect(cx - 4, tY + 11, 8, 7);
    ctx.fillStyle = C_FIVELA_LUZ;
    ctx.fillRect(cx - 2, tY + 13, 4, 3);
    ctx.fillStyle = '#0f0a06';
    ctx.fillRect(cx - 1, tY + 14, 2, 1);

    // Broche dourado em formato de losango no peito
    if (dir === 'down' || dir === 'left' || dir === 'right') {
      ctx.fillStyle = C_BROCHE;
      const bx = dir === 'right' ? cx + 2 : dir === 'left' ? cx - 6 : cx - 2;
      ctx.fillRect(bx + 1, tY + 4, 2, 4);
      ctx.fillRect(bx, tY + 5, 4, 2);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(bx + 1, tY + 5, 2, 2);
    }

    // =========================================================================
    // 3. CABEÇA, ROSTO EXPRESSIVO E CABELOS VOLUMOSOS
    // =========================================================================
    const headX = cx - 10;
    const headY = cy;

    if (dir === 'down') {
      // Rosto
      ctx.fillStyle = C_PELE;
      ctx.fillRect(headX + 2, headY + 5, 16, 12);
      ctx.fillStyle = C_PELE_SOMBRA;
      ctx.fillRect(headX + 2, headY + 14, 16, 3); // Queixo

      // Olhos expressivos
      if (modo === 'hurt') {
        // Olhos cerrados com dor
        ctx.fillStyle = C_OLHO;
        ctx.fillRect(headX + 4, headY + 9, 4, 1);
        ctx.fillRect(headX + 12, headY + 9, 4, 1);
      } else if (modo === 'death') {
        ctx.fillStyle = C_OLHO;
        ctx.fillRect(headX + 4, headY + 10, 4, 1);
        ctx.fillRect(headX + 12, headY + 10, 4, 1);
      } else {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(headX + 4, headY + 8, 4, 3);
        ctx.fillRect(headX + 12, headY + 8, 4, 3);
        ctx.fillStyle = C_OLHO;
        ctx.fillRect(headX + 5, headY + 8, 2, 3);
        ctx.fillRect(headX + 13, headY + 8, 2, 3);
      }

      // Cabelos volumosos com mechas
      ctx.fillStyle = C_CABELO;
      ctx.fillRect(headX, headY, 20, 7);
      ctx.fillRect(headX - 1, headY + 4, 4, 9);
      ctx.fillRect(headX + 17, headY + 4, 4, 9);
      // Franja desalinhada
      ctx.fillRect(headX + 5, headY + 6, 4, 3);
      ctx.fillRect(headX + 11, headY + 6, 4, 4);
      // Mechas de luz
      ctx.fillStyle = C_CABELO_MEIO;
      ctx.fillRect(headX + 3, headY + 1, 14, 3);
      ctx.fillStyle = C_CABELO_LUZ;
      ctx.fillRect(headX + 6, headY + 1, 8, 2);
    } else if (dir === 'up') {
      // Costas da cabeça e cabelo denso
      ctx.fillStyle = C_CABELO;
      ctx.fillRect(headX, headY, 20, 16);
      ctx.fillRect(headX + 2, headY + 15, 16, 3);
      ctx.fillStyle = C_CABELO_MEIO;
      ctx.fillRect(headX + 4, headY + 2, 12, 8);
      ctx.fillStyle = C_CABELO_LUZ;
      ctx.fillRect(headX + 6, headY + 2, 8, 4);

      // Espada nas costas na bainha
      if (modo !== 'attack' && modo !== 'charged') {
        ctx.fillStyle = C_ESPADA_GUARDA;
        ctx.fillRect(cx + 4, cy + 8, 7, 3);
        ctx.fillStyle = C_ESPADA;
        ctx.fillRect(cx + 6, cy + 11, 3, 16);
      }
    } else if (dir === 'left' || dir === 'right') {
      const isRight = dir === 'right';
      const fx = isRight ? headX + 6 : headX;

      // Perfil da pele
      ctx.fillStyle = C_PELE;
      ctx.fillRect(fx + 2, headY + 5, 12, 12);
      ctx.fillStyle = C_PELE_SOMBRA;
      ctx.fillRect(fx + 2, headY + 14, 12, 3);

      // Olho de perfil
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(isRight ? fx + 9 : fx + 3, headY + 8, 3, 3);
      ctx.fillStyle = C_OLHO;
      ctx.fillRect(isRight ? fx + 10 : fx + 3, headY + 8, 2, 3);

      // Cabelo lateral volumoso
      ctx.fillStyle = C_CABELO;
      ctx.fillRect(headX, headY, 20, 7);
      ctx.fillRect(isRight ? headX : headX + 12, headY + 4, 8, 12);
      ctx.fillStyle = C_CABELO_MEIO;
      ctx.fillRect(headX + 4, headY + 1, 12, 4);
    }

    // =========================================================================
    // 4. BRAÇOS, MÃOS E LÂMINA DE ELDRIM EM COMBATE E GOLPES
    // =========================================================================
    if (modo === 'attack') {
      this.desenharAtaqueEspada(ctx, cx, cy, dir, subFrame, {
        tunica: C_TUNICA,
        pele: C_PELE,
        espada: C_ESPADA,
        espadaLuz: C_ESPADA_LUZ,
        espadaSombra: C_ESPADA_SOMBRA,
        guarda: C_ESPADA_GUARDA,
      });
    } else if (modo === 'charged') {
      this.desenharAtaqueCarregadoGiro(ctx, cx, cy, subFrame, {
        tunica: C_TUNICA,
        pele: C_PELE,
        espada: C_ESPADA,
        espadaLuz: C_ESPADA_LUZ,
        guarda: C_ESPADA_GUARDA,
      });
    } else {
      // Braços em repouso ou caminhada
      let bracoEsqX = cx - 14;
      let bracoDirX = cx + 10;
      let bracoY = cy + 18;

      if (modo === 'walk') {
        if (subFrame === 0) { bracoEsqX -= 2; bracoDirX += 2; }
        else if (subFrame === 2) { bracoEsqX += 2; bracoDirX -= 2; }
      }

      ctx.fillStyle = C_TUNICA;
      ctx.fillRect(bracoEsqX, bracoY, 4, 10);
      ctx.fillRect(bracoDirX, bracoY, 4, 10);
      // Mãos visíveis
      ctx.fillStyle = C_PELE;
      ctx.fillRect(bracoEsqX, bracoY + 9, 4, 4);
      ctx.fillRect(bracoDirX, bracoY + 9, 4, 4);
    }
  }

  /**
   * Desenha as 4 fases do ataque com a Lâmina de Eldrim:
   * 0: Antecipação (espada levantada e empunhada)
   * 1: Golpe com arco cortante cintilante
   * 2: Extensão máxima da lâmina
   * 3: Recuperação ágil
   */
  private static desenharAtaqueEspada(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    dir: 'down' | 'up' | 'left' | 'right',
    subFrame: number,
    cores: {
      tunica: string;
      pele: string;
      espada: string;
      espadaLuz: string;
      espadaSombra: string;
      guarda: string;
    }
  ): void {
    ctx.fillStyle = cores.tunica;

    if (dir === 'down') {
      if (subFrame === 0) {
        // Antecipação: erguendo espada à direita
        ctx.fillRect(cx + 8, cy + 12, 6, 8);
        ctx.fillStyle = cores.guarda;
        ctx.fillRect(cx + 12, cy + 8, 8, 3);
        ctx.fillStyle = cores.espada;
        ctx.fillRect(cx + 15, cy - 8, 3, 16);
      } else if (subFrame === 1 || subFrame === 2) {
        // Golpe descendo com arco de luz cortante
        ctx.fillStyle = cores.tunica;
        ctx.fillRect(cx - 2, cy + 24, 6, 6);
        ctx.fillStyle = cores.guarda;
        ctx.fillRect(cx - 6, cy + 30, 12, 3);
        // Lâmina prateada
        ctx.fillStyle = cores.espada;
        ctx.fillRect(cx - 2, cy + 33, 4, 20);
        ctx.fillStyle = cores.espadaLuz;
        ctx.fillRect(cx - 1, cy + 33, 2, 20);
        // Arco de corte luminoso
        ctx.fillStyle = 'rgba(240, 249, 255, 0.85)';
        ctx.fillRect(cx - 16, cy + 34, 32, 4);
        ctx.fillRect(cx - 12, cy + 30, 24, 2);
      } else {
        // Recuperação
        ctx.fillStyle = cores.guarda;
        ctx.fillRect(cx - 4, cy + 26, 8, 3);
        ctx.fillStyle = cores.espada;
        ctx.fillRect(cx - 2, cy + 29, 3, 14);
      }
    } else if (dir === 'up') {
      if (subFrame === 0) {
        ctx.fillStyle = cores.guarda;
        ctx.fillRect(cx - 6, cy + 16, 8, 3);
        ctx.fillStyle = cores.espada;
        ctx.fillRect(cx - 4, cy + 8, 3, 12);
      } else if (subFrame === 1 || subFrame === 2) {
        // Golpe vertical para cima
        ctx.fillStyle = cores.guarda;
        ctx.fillRect(cx - 6, cy + 6, 12, 3);
        ctx.fillStyle = cores.espada;
        ctx.fillRect(cx - 2, cy - 14, 4, 20);
        ctx.fillStyle = cores.espadaLuz;
        ctx.fillRect(cx - 1, cy - 14, 2, 20);
        // Arco
        ctx.fillStyle = 'rgba(240, 249, 255, 0.85)';
        ctx.fillRect(cx - 16, cy - 8, 32, 4);
      } else {
        ctx.fillStyle = cores.guarda;
        ctx.fillRect(cx - 4, cy + 8, 8, 3);
        ctx.fillStyle = cores.espada;
        ctx.fillRect(cx - 2, cy - 4, 3, 12);
      }
    } else if (dir === 'right') {
      if (subFrame === 0) {
        ctx.fillStyle = cores.guarda;
        ctx.fillRect(cx - 4, cy + 14, 3, 8);
        ctx.fillStyle = cores.espada;
        ctx.fillRect(cx - 16, cy + 16, 12, 3);
      } else if (subFrame === 1 || subFrame === 2) {
        // Estocada e corte horizontal à direita
        ctx.fillStyle = cores.guarda;
        ctx.fillRect(cx + 12, cy + 20, 3, 10);
        ctx.fillStyle = cores.espada;
        ctx.fillRect(cx + 15, cy + 23, 22, 4);
        ctx.fillStyle = cores.espadaLuz;
        ctx.fillRect(cx + 15, cy + 24, 22, 2);
        // Arco cortante
        ctx.fillStyle = 'rgba(240, 249, 255, 0.85)';
        ctx.fillRect(cx + 20, cy + 10, 16, 28);
      } else {
        ctx.fillStyle = cores.guarda;
        ctx.fillRect(cx + 10, cy + 22, 3, 8);
        ctx.fillStyle = cores.espada;
        ctx.fillRect(cx + 13, cy + 24, 14, 3);
      }
    } else if (dir === 'left') {
      if (subFrame === 0) {
        ctx.fillStyle = cores.guarda;
        ctx.fillRect(cx + 4, cy + 14, 3, 8);
        ctx.fillStyle = cores.espada;
        ctx.fillRect(cx + 7, cy + 16, 12, 3);
      } else if (subFrame === 1 || subFrame === 2) {
        // Corte horizontal à esquerda
        ctx.fillStyle = cores.guarda;
        ctx.fillRect(cx - 15, cy + 20, 3, 10);
        ctx.fillStyle = cores.espada;
        ctx.fillRect(cx - 37, cy + 23, 22, 4);
        ctx.fillStyle = cores.espadaLuz;
        ctx.fillRect(cx - 37, cy + 24, 22, 2);
        // Arco
        ctx.fillStyle = 'rgba(240, 249, 255, 0.85)';
        ctx.fillRect(cx - 36, cy + 10, 16, 28);
      } else {
        ctx.fillStyle = cores.guarda;
        ctx.fillRect(cx - 13, cy + 22, 3, 8);
        ctx.fillStyle = cores.espada;
        ctx.fillRect(cx - 27, cy + 24, 14, 3);
      }
    }
  }

  /**
   * Giro completo de 360 graus com a Lâmina de Eldrim (Ataque Carregado)
   */
  private static desenharAtaqueCarregadoGiro(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    subFrame: number,
    cores: {
      tunica: string;
      pele: string;
      espada: string;
      espadaLuz: string;
      guarda: string;
    }
  ): void {
    // Halo arcano circular expandido
    ctx.fillStyle = 'rgba(56, 189, 248, 0.45)';
    ctx.fillRect(cx - 22, cy + 10, 44, 34);

    // Onda de corte circular da lâmina
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(cx - 20, cy + 18, 40, 6);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(cx - 22, cy + 19, 44, 4);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(cx - 18, cy + 20, 36, 2);

    // Guarda de ouro no centro do giro
    ctx.fillStyle = cores.guarda;
    ctx.fillRect(cx - 5, cy + 18, 10, 6);
  }
}
