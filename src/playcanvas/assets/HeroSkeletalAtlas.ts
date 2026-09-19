// =============================================================================
// ELDRIM: ECOS DO PASSADO - HERO SKELETAL ATLAS (PROTÓTIPO C - 2D SKELETAL)
// =============================================================================
// Atlas de partes anatômicas 2D para o guerreiro esquelético articulado:
// - Head (Cabeça com feições heroicas e mechas de cabelo cobreado)
// - Torso (Armadura peitoral de aço polido com cinta de couro e fivela de latão)
// - Pelvis (Pelve com saiote verde de Eldrim)
// - ShoulderL & ShoulderR (Ombreiras pontiagudas de aço)
// - ArmL & ArmR (Braço superior com túnica)
// - ForearmL & ForearmR (Antebraço e manopla armada)
// - ThighL & ThighR (Coxa com coxeira metálica)
// - ShinL & ShinR (Canela e bota pesada articulada)
// - Weapon (Espada rúnica de Eldrim)
// =============================================================================

import { GraphicsDevice, Texture } from 'playcanvas';
import { createPixelTexture } from '../rendering/GraphicsBackend';

export interface SkeletalPartUV {
  u0: number;
  v0: number;
  u1: number;
  v1: number;
  width: number;
  height: number;
  pivotX: number;
  pivotY: number;
}

export class HeroSkeletalAtlas {
  private static cachedTexture: Texture | null = null;
  public static parts: Record<string, SkeletalPartUV> = {};

  public static getTexture(device: GraphicsDevice): Texture {
    if (this.cachedTexture) return this.cachedTexture;

    const W = 256;
    const H = 256;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d')!;

    ctx.clearRect(0, 0, W, H);

    // Paleta oficial
    const cSkin = '#E2B895';
    const cHair = '#A65628';
    const cHairHigh = '#D17C43';
    const cSteel = '#8C98A6';
    const cSteelHigh = '#D3DFE8';
    const cSteelDark = '#4A5568';
    const cGold = '#D4AF37';
    const cLeather = '#5A3825';
    const cLeatherDark = '#3A2012';
    const cCloth = '#2E4C38';
    const cClothHigh = '#42684D';
    const cArcane = '#38BDF8';

    const defPart = (
      name: string,
      x: number,
      y: number,
      w: number,
      h: number,
      px: number,
      py: number
    ): SkeletalPartUV => {
      const part: SkeletalPartUV = {
        u0: x / W,
        v0: y / H,
        u1: (x + w) / W,
        v1: (y + h) / H,
        width: w,
        height: h,
        pivotX: px,
        pivotY: py,
      };
      this.parts[name] = part;
      return part;
    };

    // 1. HEAD (18×18) em (0, 0) - Pivô no pescoço (0.5, 0.1)
    defPart('head', 0, 0, 18, 18, 0.5, 0.1);
    ctx.save();
    ctx.translate(0, 0);
    // Face
    ctx.fillStyle = cSkin;
    ctx.fillRect(4, 5, 10, 9);
    // Olhos
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(6, 9, 2, 2);
    ctx.fillRect(10, 9, 2, 2);
    // Cabelo
    ctx.fillStyle = cHair;
    ctx.fillRect(3, 2, 12, 5);
    ctx.fillRect(2, 5, 3, 8);
    ctx.fillRect(13, 5, 3, 8);
    ctx.fillStyle = cHairHigh;
    ctx.fillRect(5, 2, 8, 2);
    ctx.restore();

    // 2. TORSO (22×24) em (24, 0) - Pivô na cintura/quadril (0.5, 0.15)
    defPart('torso', 24, 0, 22, 24, 0.5, 0.15);
    ctx.save();
    ctx.translate(24, 0);
    // Armadura peitoral
    ctx.fillStyle = cSteelDark;
    ctx.fillRect(3, 5, 16, 15);
    ctx.fillStyle = cSteel;
    ctx.fillRect(4, 6, 14, 13);
    ctx.fillStyle = cSteelHigh;
    ctx.fillRect(5, 7, 5, 10);
    // Gorjal / Colarinho
    ctx.fillStyle = cGold;
    ctx.fillRect(7, 4, 8, 2);
    // Túnica nas bordas
    ctx.fillStyle = cCloth;
    ctx.fillRect(2, 18, 18, 4);
    ctx.restore();

    // 3. PELVIS (18×12) em (52, 0) - Pivô no centro (0.5, 0.5)
    defPart('pelvis', 52, 0, 18, 12, 0.5, 0.5);
    ctx.save();
    ctx.translate(52, 0);
    // Cinto com fivela
    ctx.fillStyle = cLeather;
    ctx.fillRect(1, 2, 16, 4);
    ctx.fillStyle = cGold;
    ctx.fillRect(7, 1, 4, 6);
    // Saiote verde de Eldrim
    ctx.fillStyle = cCloth;
    ctx.fillRect(2, 6, 14, 5);
    ctx.fillStyle = cClothHigh;
    ctx.fillRect(4, 7, 10, 2);
    ctx.restore();

    // 4. SHOULDER (12×12) em (76, 0) - Pivô no topo articular (0.5, 0.8)
    defPart('shoulder', 76, 0, 12, 12, 0.5, 0.8);
    ctx.save();
    ctx.translate(76, 0);
    ctx.fillStyle = cSteel;
    ctx.beginPath();
    ctx.moveTo(6, 1);
    ctx.lineTo(11, 6);
    ctx.lineTo(9, 11);
    ctx.lineTo(3, 11);
    ctx.lineTo(1, 6);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = cGold;
    ctx.fillRect(2, 10, 8, 2);
    ctx.restore();

    // 5. UPPER ARM (8×14) em (94, 0) - Pivô no ombro (0.5, 0.85)
    defPart('upper_arm', 94, 0, 8, 14, 0.5, 0.85);
    ctx.save();
    ctx.translate(94, 0);
    ctx.fillStyle = cCloth;
    ctx.fillRect(1, 2, 6, 10);
    ctx.fillStyle = cLeather;
    ctx.fillRect(2, 10, 4, 3);
    ctx.restore();

    // 6. FOREARM & HAND (8×16) em (108, 0) - Pivô no cotovelo (0.5, 0.85)
    defPart('forearm', 108, 0, 8, 16, 0.5, 0.85);
    ctx.save();
    ctx.translate(108, 0);
    ctx.fillStyle = cSteel;
    ctx.fillRect(1, 2, 6, 9);
    ctx.fillStyle = cLeatherDark;
    ctx.fillRect(2, 11, 4, 4); // manopla/luva
    ctx.restore();

    // 7. THIGH (10×16) em (122, 0) - Pivô no quadril (0.5, 0.85)
    defPart('thigh', 122, 0, 10, 16, 0.5, 0.85);
    ctx.save();
    ctx.translate(122, 0);
    ctx.fillStyle = cLeatherDark;
    ctx.fillRect(2, 2, 6, 12);
    ctx.fillStyle = cSteel;
    ctx.fillRect(2, 4, 6, 7); // coxeira de ferro
    ctx.restore();

    // 8. SHIN & BOOT (10×18) em (138, 0) - Pivô no joelho (0.5, 0.85)
    defPart('shin', 138, 0, 10, 18, 0.5, 0.85);
    ctx.save();
    ctx.translate(138, 0);
    ctx.fillStyle = cLeatherDark;
    ctx.fillRect(2, 2, 6, 14);
    ctx.fillStyle = cSteel;
    ctx.fillRect(1, 10, 8, 6); // biqueira e reforço da canela
    ctx.fillStyle = cSteelHigh;
    ctx.fillRect(2, 10, 6, 2);
    ctx.restore();

    // 9. WEAPON (ESPADA) (12×36) em (154, 0) - Pivô no punho da mão (0.5, 0.8)
    defPart('weapon', 154, 0, 12, 36, 0.5, 0.8);
    ctx.save();
    ctx.translate(154, 0);
    // Lâmina
    ctx.fillStyle = cSteelHigh;
    ctx.fillRect(4, 2, 4, 26);
    ctx.fillStyle = cSteelDark;
    ctx.fillRect(4, 2, 1, 26);
    // Sulco rúnico azul
    ctx.fillStyle = cArcane;
    ctx.fillRect(5, 8, 2, 16);
    // Guarda de ouro
    ctx.fillStyle = cGold;
    ctx.fillRect(1, 27, 10, 3);
    // Punho e pomo
    ctx.fillStyle = cLeatherDark;
    ctx.fillRect(5, 30, 2, 4);
    ctx.fillStyle = cGold;
    ctx.beginPath();
    ctx.arc(6, 34, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    this.cachedTexture = createPixelTexture(device, canvas, false, 'hero_skeletal_atlas');
    return this.cachedTexture;
  }
}
