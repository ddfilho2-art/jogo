// =============================================================================
// ELDRIM: ECOS DO PASSADO - HERO SPRITE ATLAS (PROTÓTIPO B - 2D SPRITE)
// =============================================================================
// Gerador e repositório de texturas 2D de alta fidelidade para o Herói Guerreiro:
// - Dimensões de célula: 48×56 px por frame
// - Estados renderizados:
//   IDLE (4 frames), WALK (6 frames), RUN (6 frames), ATTACK (4 frames),
//   HEAVY_ATTACK (4 frames), DODGE (4 frames), JUMP (2 frames),
//   FALL (2 frames), HIT (2 frames), DEATH (4 frames), ARCANE_FLOW (6 frames)
// - 4 Direções: Down (Sul), Up (Norte), Left/Right (Espelhamento horizontal)
// - Anatomia coerente: Cabeça, cabelo ruivo cobreado, peitoral de aço polido,
//   ombreiras pontiagudas, manoplas de couro/ferro, espada rúnica e botas reforçadas
// =============================================================================

import { GraphicsDevice, Texture } from 'playcanvas';
import { createPixelTexture } from '../rendering/GraphicsBackend';
import { Direction } from '../systems/InputSystem';
import { HeroState } from '../entities/HeroVisualTypes';

export class HeroSpriteAtlas {
  private static cachedTexture: Texture | null = null;
  public static readonly FRAME_W = 48;
  public static readonly FRAME_H = 56;
  public static readonly COLS = 12;
  public static readonly ROWS = 8;

  // Mapa de frames por estado e direção
  // Retorna índice do frame na grid [col, row]
  public static getFrameCoord(
    state: HeroState,
    direction: Direction,
    animTime: number
  ): { col: number; row: number; flipX: boolean } {
    const flipX = direction === 'left';
    let row = 0; // 0=Down, 1=Up, 2=Side

    if (direction === 'up') row = 1;
    else if (direction === 'left' || direction === 'right') row = 2;
    else row = 0; // down

    let col = 0;

    switch (state) {
      case 'idle': {
        const f = Math.floor(animTime * 4) % 4;
        col = f; // cols 0..3, row 0..2
        break;
      }

      case 'walk': {
        const f = Math.floor(animTime * 7) % 6;
        col = 4 + f; // cols 4..9, row 0..2
        break;
      }

      case 'run': {
        const f = Math.floor(animTime * 10) % 6;
        col = 4 + f; // cols 4..9 (mais rápido)
        break;
      }

      case 'attack': {
        const progress = Math.min(0.99, animTime / 0.35);
        const f = Math.floor(progress * 4);
        row = row + 3; // rows 3, 4, 5
        col = f; // cols 0..3
        break;
      }

      case 'heavy_attack': {
        const progress = Math.min(0.99, animTime / 0.55);
        const f = Math.floor(progress * 4);
        row = row + 3; // rows 3, 4, 5
        col = 4 + f; // cols 4..7
        break;
      }

      case 'dodge': {
        const progress = Math.min(0.99, animTime / 0.42);
        const f = Math.floor(progress * 4);
        row = 6;
        col = f; // cols 0..3
        break;
      }

      case 'jump': {
        row = 6;
        col = 4;
        break;
      }

      case 'fall': {
        row = 6;
        col = 5;
        break;
      }

      case 'hurt': {
        const f = Math.floor(animTime * 8) % 2;
        row = 6;
        col = 6 + f;
        break;
      }

      case 'arcane_flow': {
        const f = Math.floor(animTime * 12) % 6;
        row = 7;
        col = f;
        break;
      }

      case 'death': {
        const progress = Math.min(0.99, animTime / 0.8);
        const f = Math.floor(progress * 4);
        row = 7;
        col = 6 + f;
        break;
      }
    }

    return { col, row, flipX };
  }

  public static getTexture(device: GraphicsDevice): Texture {
    if (this.cachedTexture) return this.cachedTexture;

    const atlasCanvas = document.createElement('canvas');
    atlasCanvas.width = this.FRAME_W * this.COLS; // 48 * 12 = 576 px
    atlasCanvas.height = this.FRAME_H * this.ROWS; // 56 * 8 = 448 px
    const ctx = atlasCanvas.getContext('2d')!;

    // Fundo transparente
    ctx.clearRect(0, 0, atlasCanvas.width, atlasCanvas.height);

    // Renderiza cada quadrante do atlas
    for (let r = 0; r < this.ROWS; r++) {
      for (let c = 0; c < this.COLS; c++) {
        const x = c * this.FRAME_W;
        const y = r * this.FRAME_H;
        this.renderFrame(ctx, x, y, c, r);
      }
    }

    this.cachedTexture = createPixelTexture(device, atlasCanvas, false, 'hero_sprite_atlas');
    return this.cachedTexture;
  }

  /**
   * Renderiza um frame específico do guerreiro 2D
   */
  private static renderFrame(
    ctx: CanvasRenderingContext2D,
    bx: number,
    by: number,
    col: number,
    row: number
  ): void {
    ctx.save();
    ctx.translate(bx, by);

    // Determina a direção e ação com base na linha e coluna
    let dir: 'down' | 'up' | 'side' = 'down';
    if (row === 0 || row === 3) dir = 'down';
    else if (row === 1 || row === 4) dir = 'up';
    else if (row === 2 || row === 5) dir = 'side';

    // Base do chão no frame: centro X = 24, pés Y = 50
    const cx = 24;
    const cy = 50;

    // Sombra sutil sob os pés
    ctx.fillStyle = 'rgba(6, 12, 18, 0.45)';
    ctx.beginPath();
    ctx.ellipse(cx, cy - 2, 12, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Paleta oficial de Eldrim
    const cSkin = '#E2B895';
    const cSkinShadow = '#C3926F';
    const cHair = '#A65628';
    const cHairHigh = '#D17C43';
    const cSteel = '#8C98A6';
    const cSteelHigh = '#D3DFE8';
    const cSteelDark = '#4A5568';
    const cGold = '#D4AF37';
    const cLeather = '#5A3825';
    const cLeatherDark = '#3A2012';
    const cCloth = '#2E4C38'; // Túnica verde-musgo de Eldrim
    const cClothHigh = '#42684D';
    const cArcane = '#38BDF8'; // Brilho rúnico

    // Animações de Locomoção (Rows 0, 1, 2)
    if (row <= 2) {
      if (col < 4) {
        // IDLE (cols 0..3) - Respiração sutil
        const breathe = Math.sin((col / 4) * Math.PI * 2) * 1.2;
        this.drawWarriorBody(ctx, cx, cy + breathe, dir, 0, 0, 0, cSkin, cSkinShadow, cHair, cHairHigh, cSteel, cSteelHigh, cSteelDark, cGold, cLeather, cLeatherDark, cCloth, cClothHigh, cArcane);
      } else if (col < 10) {
        // WALK / RUN (cols 4..9) - 6 frames de marcha completa
        const step = (col - 4) / 6;
        const legPhase = Math.sin(step * Math.PI * 2);
        const bob = Math.abs(Math.sin(step * Math.PI * 2)) * -2.2;
        this.drawWarriorBody(ctx, cx, cy + bob, dir, legPhase, -legPhase, legPhase * 0.4, cSkin, cSkinShadow, cHair, cHairHigh, cSteel, cSteelHigh, cSteelDark, cGold, cLeather, cLeatherDark, cCloth, cClothHigh, cArcane);
      } else {
        // Frames neutros / transição
        this.drawWarriorBody(ctx, cx, cy, dir, 0, 0, 0, cSkin, cSkinShadow, cHair, cHairHigh, cSteel, cSteelHigh, cSteelDark, cGold, cLeather, cLeatherDark, cCloth, cClothHigh, cArcane);
      }
    }
    // Ataques (Rows 3, 4, 5)
    else if (row <= 5) {
      if (col < 4) {
        // ATAQUE BÁSICO (cols 0..3): Antecipação, Golpe e Retorno
        const subPhase = col / 3;
        this.drawAttackFrame(ctx, cx, cy, dir, subPhase, false, cSkin, cSkinShadow, cHair, cHairHigh, cSteel, cSteelHigh, cSteelDark, cGold, cLeather, cLeatherDark, cCloth, cClothHigh, cArcane);
      } else if (col < 8) {
        // ATAQUE FORTE (cols 4..7): Golpe com as duas mãos e impacto rúnico
        const subPhase = (col - 4) / 3;
        this.drawAttackFrame(ctx, cx, cy, dir, subPhase, true, cSkin, cSkinShadow, cHair, cHairHigh, cSteel, cSteelHigh, cSteelDark, cGold, cLeather, cLeatherDark, cCloth, cClothHigh, cArcane);
      }
    }
    // Especiais: Dodge, Jump, Fall, Hurt (Row 6)
    else if (row === 6) {
      if (col < 4) {
        // DODGE / ROLAMENTO
        const rollAngle = (col / 4) * Math.PI * 2;
        ctx.save();
        ctx.translate(cx, cy - 14);
        ctx.rotate(rollAngle);
        this.drawWarriorCompactBall(ctx, 0, 0, cCloth, cSteel, cHair, cArcane);
        ctx.restore();
      } else if (col === 4) {
        // JUMP (Subindo)
        this.drawWarriorJump(ctx, cx, cy - 6, true, cSkin, cHair, cSteel, cCloth, cArcane);
      } else if (col === 5) {
        // FALL (Descendo)
        this.drawWarriorJump(ctx, cx, cy - 2, false, cSkin, cHair, cSteel, cCloth, cArcane);
      } else {
        // HURT / FLINCH
        this.drawWarriorFlinch(ctx, cx, cy, col === 6, cSkin, cHair, cSteel, cCloth);
      }
    }
    // Arcane Flow & Death (Row 7)
    else if (row === 7) {
      if (col < 6) {
        // ARCANE FLOW (Torvelinho rúnico 360°)
        const spinAngle = (col / 6) * Math.PI * 2;
        this.drawArcaneSpinFrame(ctx, cx, cy, spinAngle, cSkin, cHair, cSteel, cCloth, cArcane);
      } else {
        // DEATH (Queda e repouso)
        const fallStage = (col - 6) / 3;
        this.drawDeathFrame(ctx, cx, cy, fallStage, cSkin, cHair, cSteel, cCloth);
      }
    }

    ctx.restore();
  }

  /**
   * Desenha corpo completo do guerreiro com anatomia integrada
   */
  private static drawWarriorBody(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    dir: 'down' | 'up' | 'side',
    legL: number,
    legR: number,
    armSwing: number,
    cSkin: string,
    cSkinShadow: string,
    cHair: string,
    cHairHigh: string,
    cSteel: string,
    cSteelHigh: string,
    cSteelDark: string,
    cGold: string,
    cLeather: string,
    cLeatherDark: string,
    cCloth: string,
    cClothHigh: string,
    cArcane: string
  ): void {
    // 1. Pernas e Botas
    const legOffsetL = legL * 5;
    const legOffsetR = legR * 5;

    // Bota Esquerda
    ctx.fillStyle = cLeatherDark;
    ctx.fillRect(cx - 7, cy - 12 + legOffsetL, 5, 11);
    ctx.fillStyle = cSteel;
    ctx.fillRect(cx - 7, cy - 6 + legOffsetL, 5, 5); // biqueira de aço

    // Bota Direita
    ctx.fillStyle = cLeatherDark;
    ctx.fillRect(cx + 2, cy - 12 + legOffsetR, 5, 11);
    ctx.fillStyle = cSteel;
    ctx.fillRect(cx + 2, cy - 6 + legOffsetR, 5, 5);

    // 2. Túnica / Calçote inferior
    ctx.fillStyle = cCloth;
    ctx.fillRect(cx - 8, cy - 18, 16, 7);
    ctx.fillStyle = cClothHigh;
    ctx.fillRect(cx - 7, cy - 17, 14, 2);

    // 3. Cinto de Aventureiro com Fivela dourada
    ctx.fillStyle = cLeather;
    ctx.fillRect(cx - 8, cy - 20, 16, 3);
    ctx.fillStyle = cGold;
    ctx.fillRect(cx - 2, cy - 21, 4, 4);

    // 4. Peitoral de Aço / Armadura do Torso
    ctx.fillStyle = cSteelDark;
    ctx.fillRect(cx - 8, cy - 32, 16, 12);
    ctx.fillStyle = cSteel;
    ctx.fillRect(cx - 7, cy - 31, 14, 10);
    ctx.fillStyle = cSteelHigh;
    ctx.fillRect(cx - 6, cy - 30, 4, 8); // reflexo diagonal

    // Gola / Gorjal
    ctx.fillStyle = cSteelDark;
    ctx.fillRect(cx - 5, cy - 34, 10, 3);

    // 5. Cabeça e Rosto
    if (dir === 'down') {
      // Rosto frontal
      ctx.fillStyle = cSkin;
      ctx.fillRect(cx - 5, cy - 42, 10, 8);
      // Olhos determinantes
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(cx - 3, cy - 38, 2, 2);
      ctx.fillRect(cx + 1, cy - 38, 2, 2);
      // Cabelo ruivo/castanho com franja volumosa
      ctx.fillStyle = cHair;
      ctx.fillRect(cx - 6, cy - 45, 12, 5);
      ctx.fillRect(cx - 7, cy - 42, 2, 6);
      ctx.fillRect(cx + 5, cy - 42, 2, 6);
      ctx.fillStyle = cHairHigh;
      ctx.fillRect(cx - 4, cy - 45, 7, 2);
    } else if (dir === 'up') {
      // Vista traseira (cabelo cobre o rosto)
      ctx.fillStyle = cHair;
      ctx.fillRect(cx - 6, cy - 45, 12, 11);
      ctx.fillStyle = cHairHigh;
      ctx.fillRect(cx - 4, cy - 44, 8, 4);
    } else {
      // Perfil lateral
      ctx.fillStyle = cSkin;
      ctx.fillRect(cx - 4, cy - 42, 9, 8);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(cx + 2, cy - 38, 2, 2); // olho voltado para o lado
      ctx.fillStyle = cHair;
      ctx.fillRect(cx - 5, cy - 45, 11, 5);
      ctx.fillRect(cx - 6, cy - 42, 4, 7);
      ctx.fillStyle = cHairHigh;
      ctx.fillRect(cx - 2, cy - 45, 6, 2);
    }

    // 6. Ombreiras (Pauldrons) de Aço com acabamento dourado
    ctx.fillStyle = cSteel;
    ctx.fillRect(cx - 11, cy - 34, 5, 6);
    ctx.fillRect(cx + 6, cy - 34, 5, 6);
    ctx.fillStyle = cGold;
    ctx.fillRect(cx - 11, cy - 34, 5, 1);
    ctx.fillRect(cx + 6, cy - 34, 5, 1);

    // 7. Braços e Espada embainhada / empunhada
    const armOff = armSwing * 4;
    // Braço esquerdo
    ctx.fillStyle = cLeather;
    ctx.fillRect(cx - 10, cy - 28 + armOff, 3, 8);
    ctx.fillStyle = cSkin;
    ctx.fillRect(cx - 10, cy - 20 + armOff, 3, 3);

    // Braço direito e Espada
    ctx.fillStyle = cLeather;
    ctx.fillRect(cx + 7, cy - 28 - armOff, 3, 8);
    ctx.fillStyle = cSkin;
    ctx.fillRect(cx + 7, cy - 20 - armOff, 3, 3);

    // Espada guardada ou pronta
    if (dir === 'side') {
      // Lâmina inclinada para frente
      ctx.fillStyle = cSteelDark;
      ctx.fillRect(cx + 8, cy - 22 - armOff, 12, 2);
      ctx.fillStyle = cSteelHigh;
      ctx.fillRect(cx + 9, cy - 23 - armOff, 10, 1);
      ctx.fillStyle = cArcane;
      ctx.fillRect(cx + 10, cy - 22 - armOff, 5, 1); // sulco rúnico azul
    } else {
      // Lâmina apontada para o solo
      ctx.fillStyle = cSteelHigh;
      ctx.fillRect(cx + 8, cy - 18 - armOff, 2, 14);
      ctx.fillStyle = cGold;
      ctx.fillRect(cx + 6, cy - 19 - armOff, 6, 2); // guarda-mão
      ctx.fillStyle = cArcane;
      ctx.fillRect(cx + 8, cy - 14 - armOff, 1, 6);
    }
  }

  /**
   * Renderiza frames do golpe de espada (Ataque Normal e Ataque Forte)
   */
  private static drawAttackFrame(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    dir: 'down' | 'up' | 'side',
    progress: number,
    isHeavy: boolean,
    cSkin: string,
    cSkinShadow: string,
    cHair: string,
    cHairHigh: string,
    cSteel: string,
    cSteelHigh: string,
    cSteelDark: string,
    cGold: string,
    cLeather: string,
    cLeatherDark: string,
    cCloth: string,
    cClothHigh: string,
    cArcane: string
  ): void {
    // Postura do guerreiro inclinada para o ataque
    const leanX = dir === 'side' ? 3 : 0;
    this.drawWarriorBody(ctx, cx + leanX, cy, dir, 0.4, -0.4, 0, cSkin, cSkinShadow, cHair, cHairHigh, cSteel, cSteelHigh, cSteelDark, cGold, cLeather, cLeatherDark, cCloth, cClothHigh, cArcane);

    // Efeito de Lâmina e Arco de Corte Rúnico
    ctx.save();
    if (progress < 0.25) {
      // 1. Antecipação: Espada recuada
      ctx.fillStyle = cSteelHigh;
      ctx.fillRect(cx - 12, cy - 38, 14, 3);
      ctx.fillStyle = cGold;
      ctx.fillRect(cx - 2, cy - 39, 3, 5);
    } else if (progress < 0.7) {
      // 2. Corte frontal em arco aberto
      const slashAngle = progress * Math.PI;
      ctx.translate(cx + 6, cy - 24);
      ctx.rotate(slashAngle);

      // Espada
      ctx.fillStyle = cSteelHigh;
      const bladeLen = isHeavy ? 26 : 20;
      ctx.fillRect(0, -2, bladeLen, 4);
      ctx.fillStyle = cArcane;
      ctx.fillRect(2, -1, bladeLen - 4, 2);

      // Arco de energia rúnica translúcida
      ctx.fillStyle = isHeavy ? 'rgba(56, 189, 248, 0.65)' : 'rgba(211, 223, 232, 0.55)';
      ctx.beginPath();
      ctx.arc(0, 0, bladeLen + 4, -Math.PI * 0.4, Math.PI * 0.4);
      ctx.lineWidth = isHeavy ? 4 : 2;
      ctx.strokeStyle = cArcane;
      ctx.stroke();
    } else {
      // 3. Recuperação: Ponta da espada no fim do golpe
      ctx.fillStyle = cSteelHigh;
      ctx.fillRect(cx + 8, cy - 14, 16, 3);
      ctx.fillStyle = cArcane;
      ctx.fillRect(cx + 10, cy - 13, 8, 1);
    }
    ctx.restore();
  }

  /**
   * Postura de rolamento / esquiva
   */
  private static drawWarriorCompactBall(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    cCloth: string,
    cSteel: string,
    cHair: string,
    cArcane: string
  ): void {
    // Corpo enrolado em esfera ágil
    ctx.fillStyle = cCloth;
    ctx.beginPath();
    ctx.arc(x, y, 11, 0, Math.PI * 2);
    ctx.fill();

    // Peitoral e armadura no centro da rotação
    ctx.fillStyle = cSteel;
    ctx.fillRect(x - 6, y - 5, 12, 10);

    // Cabelo ruivo girando
    ctx.fillStyle = cHair;
    ctx.beginPath();
    ctx.arc(x - 3, y - 6, 6, 0, Math.PI);
    ctx.fill();

    // Rastro azul de evasão
    ctx.strokeStyle = cArcane;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 13, 0, Math.PI * 1.5);
    ctx.stroke();
  }

  /**
   * Postura de pulo
   */
  private static drawWarriorJump(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    goingUp: boolean,
    cSkin: string,
    cHair: string,
    cSteel: string,
    cCloth: string,
    cArcane: string
  ): void {
    // Pernas recolhidas
    ctx.fillStyle = '#3A2012';
    ctx.fillRect(cx - 6, cy - 8, 4, 6);
    ctx.fillRect(cx + 2, cy - 8, 4, 6);

    // Corpo
    ctx.fillStyle = cCloth;
    ctx.fillRect(cx - 7, cy - 18, 14, 10);
    ctx.fillStyle = cSteel;
    ctx.fillRect(cx - 6, cy - 28, 12, 11);

    // Cabeça
    ctx.fillStyle = cSkin;
    ctx.fillRect(cx - 4, cy - 36, 8, 7);
    ctx.fillStyle = cHair;
    ctx.fillRect(cx - 5, cy - 39, 10, 4);

    // Braços erguidos com espada
    ctx.fillStyle = '#D3DFE8';
    ctx.fillRect(cx + 6, cy - (goingUp ? 38 : 28), 3, 16);
  }

  /**
   * Postura de dano / fllinch
   */
  private static drawWarriorFlinch(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    isFlash: boolean,
    cSkin: string,
    cHair: string,
    cSteel: string,
    cCloth: string
  ): void {
    ctx.save();
    if (isFlash) {
      ctx.filter = 'brightness(1.5) sepia(1) hue-rotate(-50deg)'; // Tom avermelhado de impacto
    }
    // Corpo inclinado para trás
    ctx.fillStyle = cSteel;
    ctx.fillRect(cx - 9, cy - 30, 14, 12);
    ctx.fillStyle = cSkin;
    ctx.fillRect(cx - 8, cy - 40, 8, 8);
    ctx.fillStyle = cHair;
    ctx.fillRect(cx - 10, cy - 43, 11, 5);
    ctx.fillStyle = cCloth;
    ctx.fillRect(cx - 8, cy - 18, 14, 8);
    ctx.restore();
  }

  /**
   * Giro de Arcane Flow 360°
   */
  private static drawArcaneSpinFrame(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    angle: number,
    cSkin: string,
    cHair: string,
    cSteel: string,
    cCloth: string,
    cArcane: string
  ): void {
    ctx.save();
    ctx.translate(cx, cy - 20);

    // Círculo de corte de energia arcana
    ctx.strokeStyle = cArcane;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 22, angle, angle + Math.PI);
    ctx.stroke();

    // Silhueta do herói
    ctx.fillStyle = cSteel;
    ctx.fillRect(-6, -8, 12, 16);
    ctx.fillStyle = cHair;
    ctx.fillRect(-5, -16, 10, 8);

    // Espada girando
    ctx.rotate(angle);
    ctx.fillStyle = '#D3DFE8';
    ctx.fillRect(0, -2, 22, 4);

    ctx.restore();
  }

  /**
   * Queda e repouso na derrota
   */
  private static drawDeathFrame(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    fallStage: number,
    cSkin: string,
    cHair: string,
    cSteel: string,
    cCloth: string
  ): void {
    ctx.save();
    ctx.translate(cx, cy);

    // Incline progressivo até deitar no chão
    const tilt = fallStage * (Math.PI / 2);
    ctx.rotate(tilt);

    ctx.fillStyle = cSteel;
    ctx.fillRect(-6, -26, 12, 14);
    ctx.fillStyle = cSkin;
    ctx.fillRect(-5, -34, 10, 8);
    ctx.fillStyle = cHair;
    ctx.fillRect(-6, -38, 12, 5);
    ctx.fillStyle = cCloth;
    ctx.fillRect(-6, -12, 12, 10);

    ctx.restore();
  }
}
