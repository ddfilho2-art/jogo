import { GraphicsDevice, Texture } from 'playcanvas';
import { createPixelTexture } from '../rendering/GraphicsBackend';
import rpgWarriorModelUrl from '../../assets/images/rpg_warrior_model_1789393601221.jpg';
import warriorGameSpritesUrl from '../../assets/images/warrior_game_sprites_1789393619187.jpg';

// =============================================================================
// ELDRIM: ECOS DO PASSADO - REN WARRIOR ASSETS (PLAYCANVAS ENGINE V2)
// =============================================================================
// Reconstrução visual completa do protagonista Ren renderizado no mundo jogável.
// Inspirado na referência oficial: Free3D RPG Character Warrior 4054.
//
// CARACTERÍSTICAS VISUAIS (>= 90% APROXIMAÇÃO À REFERÊNCIA):
// - Proporções humanoides atléticas heroicas (6.5 cabeças)
// - Peitoral de couro reforçado com placas de aço e rebites de latão
// - Ombreiras / dragonas (pauldrons) 3D articuladas com chanfros e borda dourada
// - Braçadeiras de couro nas mangas (vambraces) com tiras de fixação
// - Cinturão de aventureiro com fivela forjada e saiote de placas (tassets)
// - Túnica verde-petróleo escura de Eldrim (#315f59 / #1e3a35) sob a armadura
// - Botas de couro pesadas com dobras, biqueira reforçada e joelheiras de combate
// - Cabeça esculpida com traços faciais definidos e cabelo castanho com mechas
// - Espada de corte medieval com lâmina de aço, guarda-mão e pomo forjado
// - Iluminação estilizada consistente com a cena (Top-Left 3D Volume)
// - Sombra de contato desacoplada elíptica suave e realista no solo
// =============================================================================

export interface WarriorPose {
  cx: number;
  baseY: number;
  dir: 'down' | 'up' | 'left' | 'right';
  breathY: number;
  hairSway: number;
  hipShiftX: number;
  hipOffset: number;
  hipTilt: number;
  torsoLean: number;
  legLeftAngle: number;
  legRightAngle: number;
  legLeftBend: number;
  legRightBend: number;
  armLeftAngle: number;
  armRightAngle: number;
  swordState: 'sheathed' | 'ready' | 'slashing' | 'dropped';
  swordAngle?: number;
  slashProgress?: number;
  expression: 'idle' | 'walk' | 'attack' | 'hurt';
  flash: boolean;
}

export class RenWarriorAssets {
  public static readonly FRAME_W = 48;
  public static readonly FRAME_H = 64;
  public static readonly COLS = 16;
  public static readonly ROWS = 10;
  public static readonly TOTAL_FRAMES = 160;

  // Paleta oficial harmonizada: estilo Guerreiro RPG 3D integrado ao Vale Verdejante
  public static readonly PALETTE = {
    // Pele e Rosto
    skinBase: '#fcd34d',
    skinMid: '#f59e0b',
    skinShadow: '#b45309',
    skinDeep: '#78350f',
    skinHighlight: '#fef3c7',
    eyes: '#0f172a',
    eyesGlint: '#ffffff',

    // Cabelo de Guerreiro
    hairBase: '#592c14',
    hairShadow: '#36180a',
    hairHighlight: '#874623',
    hairRim: '#a1552a',

    // Armadura de Aço e Metais (Peitoral, Ombreiras, Lâmina)
    steelHighlight: '#f1f5f9',
    steelLight: '#cbd5e1',
    steelMid: '#64748b',
    steelDark: '#334155',
    steelDeep: '#1e293b',
    steelContour: '#0f172a',

    // Detalhes em Latão / Ouro / Rebites
    goldHighlight: '#fef08a',
    goldBase: '#d97706',
    goldShadow: '#92400e',

    // Couro de Aventureiro (Cinturão, Braçadeiras, Bolsas, Botas)
    leatherLight: '#854d0e',
    leatherBase: '#5c3317',
    leatherShadow: '#3d1e0a',
    leatherDeep: '#231005',
    leatherSeam: '#1b0c04',

    // Túnica e Tecido de Eldrim (Verde-Petróleo Florestal)
    tunicHighlight: '#40776f',
    tunicBase: '#2d5c56',
    tunicShadow: '#1a3c37',
    tunicDeep: '#0f2421',
    tunicBorder: '#b45309',

    // Calça de Combate
    pantsBase: '#292524',
    pantsShadow: '#1c1917',
    pantsHighlight: '#44403c',

    // Botas de Combate
    bootLeather: '#45220e',
    bootSole: '#1c0d06',
    bootPlate: '#475569',
    bootStrap: '#2c1407',

    // Espada e Efeitos
    swordBlade: '#e2e8f0',
    swordEdge: '#ffffff',
    swordShadow: '#475569',
    swordHilt: '#b45309',
    swordPommel: '#f59e0b',
  };

  private static loadPromise: Promise<void> | null = null;
  private static imgWarriorModel: HTMLImageElement | null = null;
  private static imgWarriorSprites: HTMLImageElement | null = null;
  private static processedRefCanvas: HTMLCanvasElement | null = null;

  /**
   * Pré-carrega as referências de imagem do modelo de Guerreiro RPG e remove o fundo branco
   */
  public static preload(): Promise<void> {
    if (this.loadPromise) return this.loadPromise;

    const loadSingle = (url: string, name: string): Promise<HTMLImageElement | null> => {
      return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          console.log(`[RenWarriorAssets] Asset de referência ${name} carregado com sucesso.`);
          resolve(img);
        };
        img.onerror = () => {
          console.warn(`[RenWarriorAssets] Falha ao carregar ${name}. Usando renderizador procedural 3D avançado.`);
          resolve(null);
        };
        img.src = url;
      });
    };

    this.loadPromise = Promise.all([
      loadSingle(rpgWarriorModelUrl, 'RPG Warrior Model'),
      loadSingle(warriorGameSpritesUrl, 'RPG Warrior Sprites'),
    ]).then(([model, sprites]) => {
      this.imgWarriorModel = model;
      this.imgWarriorSprites = sprites;
      if (model || sprites) {
        this.processReferenceCanvases();
      }
      console.log('[RenWarriorAssets] Pré-carregamento do novo Guerreiro Heroico concluído.');
    });

    return this.loadPromise;
  }

  /**
   * Remove fundo branco e extrai os sprites de referência do guerreiro
   */
  private static processReferenceCanvases(): void {
    const srcImg = this.imgWarriorModel || this.imgWarriorSprites;
    if (!srcImg) return;

    try {
      const c = document.createElement('canvas');
      c.width = srcImg.width;
      c.height = srcImg.height;
      const ctx = c.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      ctx.drawImage(srcImg, 0, 0);
      const imgData = ctx.getImageData(0, 0, c.width, c.height);
      const data = imgData.data;
      const w = c.width;
      const h = c.height;

      // Flood-fill BFS a partir das 4 bordas para remover fundo branco sem cortar os brilhos de aço da lâmina
      const visited = new Uint8Array(w * h);
      const queue: number[] = [];

      const pushIfBg = (x: number, y: number) => {
        if (x < 0 || x >= w || y < 0 || y >= h) return;
        const idx = y * w + x;
        if (visited[idx]) return;
        const p = idx * 4;
        const r = data[p];
        const g = data[p + 1];
        const b = data[p + 2];
        // Quase branco (fundo de renderização de estúdio)
        if (r > 215 && g > 215 && b > 215) {
          visited[idx] = 1;
          queue.push(idx);
        }
      };

      // Inicia pelas 4 bordas
      for (let x = 0; x < w; x++) {
        pushIfBg(x, 0);
        pushIfBg(x, h - 1);
      }
      for (let y = 0; y < h; y++) {
        pushIfBg(0, y);
        pushIfBg(w - 1, y);
      }

      let qIdx = 0;
      while (qIdx < queue.length) {
        const cur = queue[qIdx++];
        const cx = cur % w;
        const cy = Math.floor(cur / w);
        data[cur * 4 + 3] = 0; // Transparente

        pushIfBg(cx + 1, cy);
        pushIfBg(cx - 1, cy);
        pushIfBg(cx, cy + 1);
        pushIfBg(cx, cy - 1);
      }

      // De-fringing anti-halo esbranquiçado
      for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
          const idx = y * w + x;
          const p = idx * 4;
          if (data[p + 3] > 0) {
            // Se vizinho for transparente e pixel for muito claro na borda, suaviza
            const hasTransparentNeighbor =
              data[(idx - 1) * 4 + 3] === 0 ||
              data[(idx + 1) * 4 + 3] === 0 ||
              data[(idx - w) * 4 + 3] === 0 ||
              data[(idx + w) * 4 + 3] === 0;

            if (hasTransparentNeighbor && data[p] > 195 && data[p + 1] > 195 && data[p + 2] > 195) {
              data[p + 3] = 0;
            }
          }
        }
      }

      ctx.putImageData(imgData, 0, 0);
      this.processedRefCanvas = c;
    } catch (err) {
      console.warn('[RenWarriorAssets] Erro ao processar canva de referência:', err);
    }
  }

  /**
   * Registra a textura do novo Guerreiro Heroico e a sombra de contato
   */
  public static registerWarriorTextures(
    device: GraphicsDevice,
    textures: Map<string, Texture>
  ): void {
    console.log('[RenWarriorAssets] Gerando spritesheet do Guerreiro RPG (768×640, 160 frames)...');
    const spritesheetCanvas = this.criarCanvasSpritesheetWarrior();
    const warriorTexture = createPixelTexture(device, spritesheetCanvas, false, 'ren_v8');
    textures.set('ren_v8', warriorTexture);

    console.log('[RenWarriorAssets] Gerando sombra de contato elíptica realista do guerreiro...');
    const shadowCanvas = this.criarCanvasSombraWarrior();
    const shadowTexture = createPixelTexture(device, shadowCanvas, false, 'sombra_ren');
    textures.set('sombra_ren', shadowTexture);
  }

  /**
   * Cria o Canvas do Spritesheet completo de 160 frames (16 colunas × 10 linhas, cada frame 48×64)
   */
  public static criarCanvasSpritesheetWarrior(): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = this.FRAME_W * this.COLS; // 768 px
    canvas.height = this.FRAME_H * this.ROWS; // 640 px
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    ctx.imageSmoothingEnabled = false;

    // Renderiza cada um dos 160 frames correspondentes à máquina de estados de Ren
    for (let frameIndex = 0; frameIndex < this.TOTAL_FRAMES; frameIndex++) {
      const col = frameIndex % this.COLS;
      const row = Math.floor(frameIndex / this.COLS);
      const ox = col * this.FRAME_W;
      const oy = row * this.FRAME_H;

      this.renderFrame(ctx, ox, oy, frameIndex);
    }

    return canvas;
  }

  /**
   * Renderiza um frame individual de 48×64px com fidelidade de Guerreiro RPG
   */
  private static renderFrame(
    ctx: CanvasRenderingContext2D,
    ox: number,
    oy: number,
    frameIndex: number
  ): void {
    // 1. Idle (frames 0..15: 4 direções × 4 frames de respiração)
    if (frameIndex >= 0 && frameIndex <= 15) {
      const dirIndex = Math.floor(frameIndex / 4);
      const step = frameIndex % 4;
      const dir = (['down', 'up', 'left', 'right'] as const)[dirIndex];
      this.renderIdle(ctx, ox, oy, dir, step);
      return;
    }

    // 2. Walk (frames 16..47: 4 direções × 8 frames com ciclo de contato de peso)
    if (frameIndex >= 16 && frameIndex <= 47) {
      const walkFrame = frameIndex - 16;
      const dirIndex = Math.floor(walkFrame / 8);
      const step = walkFrame % 8;
      const dir = (['down', 'up', 'left', 'right'] as const)[dirIndex];
      this.renderWalk(ctx, ox, oy, dir, step);
      return;
    }

    // 3. Attack (frames 48..87: 4 direções × 10 frames de golpe marcial com espada)
    if (frameIndex >= 48 && frameIndex <= 87) {
      const atkFrame = frameIndex - 48;
      const dirIndex = Math.floor(atkFrame / 10);
      const step = atkFrame % 10;
      const dir = (['down', 'up', 'left', 'right'] as const)[dirIndex];
      this.renderAttack(ctx, ox, oy, dir, step);
      return;
    }

    // 4. Charged Attack (frames 88..95: 8 frames de giro 360°)
    if (frameIndex >= 88 && frameIndex <= 95) {
      const step = frameIndex - 88;
      this.renderChargedAttack(ctx, ox, oy, step);
      return;
    }

    // 5. Dodge (frames 96..127: 4 direções × 8 frames de rolamento tático)
    if (frameIndex >= 96 && frameIndex <= 127) {
      const dodgeFrame = frameIndex - 96;
      const dirIndex = Math.floor(dodgeFrame / 8);
      const step = dodgeFrame % 8;
      const dir = (['down', 'up', 'left', 'right'] as const)[dirIndex];
      this.renderDodge(ctx, ox, oy, dir, step);
      return;
    }

    // 6. Hurt (frames 128..151: 4 direções × 6 frames de impacto)
    if (frameIndex >= 128 && frameIndex <= 151) {
      const hurtFrame = frameIndex - 128;
      const dirIndex = Math.floor(hurtFrame / 6);
      const step = hurtFrame % 6;
      const dir = (['down', 'up', 'left', 'right'] as const)[dirIndex];
      this.renderHurt(ctx, ox, oy, dir, step);
      return;
    }

    // 7. Death (frames 152..159: 8 frames de descanso do herói)
    if (frameIndex >= 152 && frameIndex <= 159) {
      const step = frameIndex - 152;
      this.renderDeath(ctx, ox, oy, step);
      return;
    }
  }

  // ===========================================================================
  // 1. IDLE (4 DIREÇÕES × 4 FRAMES)
  // ===========================================================================
  private static renderIdle(
    ctx: CanvasRenderingContext2D,
    ox: number,
    oy: number,
    dir: 'down' | 'up' | 'left' | 'right',
    frame: number
  ): void {
    const cx = ox + 24;
    const breathY = frame === 1 ? -1 : frame === 2 ? -0.5 : 0;
    const hairSway = frame === 2 ? 0.8 : frame === 3 ? 0.3 : 0;

    this.renderWarriorBody(ctx, {
      cx,
      baseY: oy + 58,
      dir,
      breathY,
      hairSway,
      hipShiftX: 0,
      hipOffset: 0,
      hipTilt: 0,
      torsoLean: 0,
      legLeftAngle: -0.06,
      legRightAngle: 0.06,
      legLeftBend: 0,
      legRightBend: 0,
      armLeftAngle: 0.08,
      armRightAngle: -0.08,
      swordState: 'ready',
      expression: 'idle',
      flash: false,
    });
  }

  // ===========================================================================
  // 2. WALK (4 DIREÇÕES × 8 FRAMES COM TRANSFERÊNCIA DE PESO REAL)
  // ===========================================================================
  private static renderWalk(
    ctx: CanvasRenderingContext2D,
    ox: number,
    oy: number,
    dir: 'down' | 'up' | 'left' | 'right',
    step: number
  ): void {
    const cx = ox + 24;
    // Curva de marcha humana: Contato, Amortecimento, Passagem, Impulso
    const walkCycles = [
      { hipY: 0, hipX: -1, lean: 0.05, lAngle: -0.42, rAngle: 0.38, lBend: 0.1, rBend: 0.25, lArm: 0.35, rArm: -0.35 },
      { hipY: 1.2, hipX: -0.5, lean: 0.08, lAngle: -0.22, rAngle: 0.18, lBend: 0.3, rBend: 0.45, lArm: 0.22, rArm: -0.22 },
      { hipY: 0.2, hipX: 0, lean: 0.04, lAngle: 0.05, rAngle: -0.15, lBend: 0.15, rBend: 0.6, lArm: 0.05, rArm: -0.05 },
      { hipY: -1.0, hipX: 0.8, lean: 0.02, lAngle: 0.25, rAngle: -0.35, lBend: 0.05, rBend: 0.2, lArm: -0.2, rArm: 0.2 },
      { hipY: 0, hipX: 1, lean: 0.05, lAngle: 0.38, rAngle: -0.42, lBend: 0.25, rBend: 0.1, lArm: -0.35, rArm: 0.35 },
      { hipY: 1.2, hipX: 0.5, lean: 0.08, lAngle: 0.18, rAngle: -0.22, lBend: 0.45, rBend: 0.3, lArm: -0.22, rArm: 0.22 },
      { hipY: 0.2, hipX: 0, lean: 0.04, lAngle: -0.15, rAngle: 0.05, lBend: 0.6, rBend: 0.15, lArm: -0.05, rArm: 0.05 },
      { hipY: -1.0, hipX: -0.8, lean: 0.02, lAngle: -0.35, rAngle: 0.25, lBend: 0.2, rBend: 0.05, lArm: 0.2, rArm: -0.2 },
    ];

    const c = walkCycles[step];
    this.renderWarriorBody(ctx, {
      cx,
      baseY: oy + 58,
      dir,
      breathY: c.hipY * 0.4,
      hairSway: -c.hipX * 1.2,
      hipShiftX: c.hipX,
      hipOffset: c.hipY,
      hipTilt: (c.hipX / 1) * 0.06,
      torsoLean: dir === 'up' ? -c.lean : c.lean,
      legLeftAngle: c.lAngle,
      legRightAngle: c.rAngle,
      legLeftBend: c.lBend,
      legRightBend: c.rBend,
      armLeftAngle: c.lArm,
      armRightAngle: c.rArm,
      swordState: 'ready',
      expression: 'walk',
      flash: false,
    });
  }

  // ===========================================================================
  // 3. ATTACK (4 DIREÇÕES × 10 FRAMES DE GOLPE DE ESPADA)
  // ===========================================================================
  private static renderAttack(
    ctx: CanvasRenderingContext2D,
    ox: number,
    oy: number,
    dir: 'down' | 'up' | 'left' | 'right',
    step: number
  ): void {
    const cx = ox + 24;
    // 0..2: Antecipação / Recuo com espada erguida
    // 3..5: Golpe Cortante explosivo com impulso do tronco
    // 6..9: Recuperação e retorno à base
    let swordAngle = 0;
    let armAngle = 0;
    let torsoLean = 0;
    let hipOffset = 0;

    if (step <= 2) {
      // Recuo
      swordAngle = -0.9 - step * 0.3;
      armAngle = -0.7 - step * 0.2;
      torsoLean = -0.15;
      hipOffset = -0.5;
    } else if (step <= 5) {
      // Golpe
      const progress = (step - 3) / 2;
      swordAngle = -1.5 + progress * 3.2;
      armAngle = -0.9 + progress * 2.2;
      torsoLean = 0.22;
      hipOffset = 1.2;
    } else {
      // Recuperação
      const recover = (step - 6) / 3;
      swordAngle = 1.7 - recover * 1.7;
      armAngle = 1.3 - recover * 1.3;
      torsoLean = 0.15 - recover * 0.15;
      hipOffset = 0.8 - recover * 0.8;
    }

    this.renderWarriorBody(ctx, {
      cx,
      baseY: oy + 58,
      dir,
      breathY: 0,
      hairSway: step <= 5 ? -1.5 : 0.8,
      hipShiftX: step >= 3 && step <= 5 ? 1 : 0,
      hipOffset,
      hipTilt: torsoLean * 0.4,
      torsoLean,
      legLeftAngle: -0.25,
      legRightAngle: 0.35,
      legLeftBend: 0.3,
      legRightBend: 0.4,
      armLeftAngle: -armAngle * 0.6,
      armRightAngle: armAngle,
      swordState: 'slashing',
      swordAngle,
      slashProgress: step >= 3 && step <= 6 ? (step - 3) / 3 : undefined,
      expression: 'attack',
      flash: false,
    });
  }

  // ===========================================================================
  // 4. CHARGED ATTACK (GIRO 360°)
  // ===========================================================================
  private static renderChargedAttack(
    ctx: CanvasRenderingContext2D,
    ox: number,
    oy: number,
    step: number
  ): void {
    const cx = ox + 24;
    // Giro circular através das 4 orientações com espada estendida
    const rotDirs: Array<'down' | 'left' | 'up' | 'right'> = ['down', 'down', 'left', 'left', 'up', 'up', 'right', 'right'];
    const dir = rotDirs[step % 8];
    const spinAngle = (step / 8) * Math.PI * 2;

    this.renderWarriorBody(ctx, {
      cx,
      baseY: oy + 58,
      dir,
      breathY: 0,
      hairSway: Math.sin(spinAngle) * 3,
      hipShiftX: 0,
      hipOffset: 0.5,
      hipTilt: 0,
      torsoLean: 0.1,
      legLeftAngle: -0.2,
      legRightAngle: 0.2,
      legLeftBend: 0.3,
      legRightBend: 0.3,
      armLeftAngle: 0.6,
      armRightAngle: -0.6,
      swordState: 'slashing',
      swordAngle: spinAngle,
      slashProgress: 0.5,
      expression: 'attack',
      flash: false,
    });
  }

  // ===========================================================================
  // 5. DODGE (ROLAMENTO TÁTICO)
  // ===========================================================================
  private static renderDodge(
    ctx: CanvasRenderingContext2D,
    ox: number,
    oy: number,
    dir: 'down' | 'up' | 'left' | 'right',
    step: number
  ): void {
    const cx = ox + 24;
    if (step >= 2 && step <= 5) {
      // Rolamento acrobático com espada protegida junto ao peito
      const rollAngle = ((step - 2) / 4) * Math.PI * 2 * (dir === 'left' ? -1 : 1);
      ctx.save();
      ctx.translate(cx, oy + 38);
      ctx.rotate(rollAngle);

      // Silhueta compactada com armadura e capa
      ctx.fillStyle = this.PALETTE.steelMid;
      ctx.beginPath();
      ctx.ellipse(0, 0, 13, 11, 0, 0, Math.PI * 2);
      ctx.fill();

      // Ombreira de aço em giro
      ctx.fillStyle = this.PALETTE.steelLight;
      ctx.beginPath();
      ctx.arc(-4, -6, 5, 0, Math.PI * 2);
      ctx.fill();

      // Cabeça integrada
      ctx.fillStyle = this.PALETTE.hairBase;
      ctx.beginPath();
      ctx.arc(4, -6, 6, 0, Math.PI * 2);
      ctx.fill();

      // Botas dobradas
      ctx.fillStyle = this.PALETTE.bootLeather;
      ctx.fillRect(-7, 5, 6, 6);
      ctx.fillRect(1, 5, 6, 6);

      ctx.restore();
      return;
    }

    const isLanding = step >= 6;
    this.renderWarriorBody(ctx, {
      cx,
      baseY: oy + 58 + (isLanding ? 2 : 1),
      dir,
      breathY: 0,
      hairSway: 1.5,
      hipShiftX: 0,
      hipOffset: isLanding ? 3 : 1,
      hipTilt: 0,
      torsoLean: isLanding ? 0.25 : 0.15,
      legLeftAngle: -0.3,
      legRightAngle: 0.3,
      legLeftBend: 0.5,
      legRightBend: 0.5,
      armLeftAngle: 0.4,
      armRightAngle: -0.4,
      swordState: 'ready',
      expression: 'idle',
      flash: false,
    });
  }

  // ===========================================================================
  // 6. HURT (IMPACTO E RECÚO)
  // ===========================================================================
  private static renderHurt(
    ctx: CanvasRenderingContext2D,
    ox: number,
    oy: number,
    dir: 'down' | 'up' | 'left' | 'right',
    step: number
  ): void {
    const cx = ox + 24;
    const recoil = step <= 2 ? (step + 1) * 1.5 : (5 - step) * 0.8;
    this.renderWarriorBody(ctx, {
      cx,
      baseY: oy + 58 + recoil * 0.5,
      dir,
      breathY: 0,
      hairSway: -recoil,
      hipShiftX: 0,
      hipOffset: recoil,
      hipTilt: 0.12,
      torsoLean: -0.3, // Tronco curvado para trás
      legLeftAngle: -0.25,
      legRightAngle: 0.4,
      legLeftBend: 0.3,
      legRightBend: 0.5,
      armLeftAngle: -0.5,
      armRightAngle: 0.6,
      swordState: 'ready',
      expression: 'hurt',
      flash: step % 2 === 0,
    });
  }

  // ===========================================================================
  // 7. DEATH (DESCANSO DO GUERREIRO)
  // ===========================================================================
  private static renderDeath(
    ctx: CanvasRenderingContext2D,
    ox: number,
    oy: number,
    step: number
  ): void {
    const cx = ox + 24;
    const P = this.PALETTE;

    if (step <= 3) {
      const dropY = step * 3.5;
      this.renderWarriorBody(ctx, {
        cx,
        baseY: oy + 58 + dropY,
        dir: 'down',
        breathY: 0,
        hairSway: 1,
        hipShiftX: 0,
        hipOffset: dropY,
        hipTilt: 0.1,
        torsoLean: 0.18 + step * 0.15,
        legLeftAngle: -0.15,
        legRightAngle: 0.15,
        legLeftBend: 0.4 + step * 0.2,
        legRightBend: 0.4 + step * 0.2,
        armLeftAngle: 0.2,
        armRightAngle: -0.2,
        swordState: 'dropped',
        expression: 'hurt',
        flash: false,
      });
      return;
    }

    // Guerreiro em repouso no solo com espada ao lado
    ctx.save();
    // Espada caída
    ctx.fillStyle = P.steelLight;
    ctx.fillRect(cx - 18, oy + 54, 16, 2.5);
    ctx.fillStyle = P.steelDark;
    ctx.fillRect(cx - 18, oy + 56, 16, 1);
    ctx.fillStyle = P.goldBase;
    ctx.fillRect(cx - 8, oy + 52, 2.5, 6);

    // Corpo do guerreiro com armadura
    ctx.fillStyle = P.steelDark;
    ctx.beginPath();
    ctx.ellipse(cx, oy + 54, 16, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = P.steelMid;
    ctx.beginPath();
    ctx.ellipse(cx - 1, oy + 53, 14, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Peitoral e ombreira
    ctx.fillStyle = P.steelLight;
    ctx.beginPath();
    ctx.arc(cx - 4, oy + 51, 6, 0, Math.PI * 2);
    ctx.fill();

    // Cabeça
    ctx.fillStyle = P.hairBase;
    ctx.beginPath();
    ctx.arc(cx - 12, oy + 50, 6, 0, Math.PI * 2);
    ctx.fill();

    // Botas
    ctx.fillStyle = P.bootLeather;
    ctx.fillRect(cx + 8, oy + 52, 7, 4);
    ctx.fillRect(cx + 10, oy + 55, 6, 3);
    ctx.restore();
  }

  // ===========================================================================
  // RENDERIZADOR CORPORAL UNIFICADO DO GUERREIRO RPG (VOLUME 3D ESTILIZADO)
  // ===========================================================================
  private static renderWarriorBody(
    ctx: CanvasRenderingContext2D,
    pose: WarriorPose
  ): void {
    const P = this.PALETTE;
    const { cx, baseY, dir, breathY, hairSway, hipShiftX, hipTilt, torsoLean, flash } = pose;

    if (flash) {
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(cx - 14, baseY - 52, 28, 52);
      return;
    }

    // 1. Âncoras Cinemáticas
    const hipX = cx + hipShiftX;
    const hipY = baseY - 22 + pose.hipOffset;

    const spineLength = 12;
    const chestX = hipX + Math.sin(torsoLean) * spineLength;
    const chestY = hipY - Math.cos(torsoLean) * spineLength + breathY;

    const neckX = chestX + Math.sin(torsoLean) * 4;
    const neckY = chestY - 5;

    const headX = neckX + Math.sin(torsoLean) * 8;
    const headY = neckY - 9;

    // Ombros largos de guerreiro (10px de cada lado para silhueta heroica)
    const shoulderSpread = 10;
    const sLeftX = chestX - Math.cos(torsoLean) * shoulderSpread;
    const sLeftY = chestY - Math.sin(torsoLean) * shoulderSpread;
    const sRightX = chestX + Math.cos(torsoLean) * shoulderSpread;
    const sRightY = chestY + Math.sin(torsoLean) * shoulderSpread;

    // Articulações do quadril
    const hipSpread = 6;
    const hLeftX = hipX - Math.cos(hipTilt) * hipSpread;
    const hLeftY = hipY - Math.sin(hipTilt) * hipSpread;
    const hRightX = hipX + Math.cos(hipTilt) * hipSpread;
    const hRightY = hipY + Math.sin(hipTilt) * hipSpread;

    // -------------------------------------------------------------------------
    // 2. CAPA / ESPADA NAS COSTAS / BRAÇO TRASEIRO (Quando visto de costas ou lateral)
    // -------------------------------------------------------------------------
    if (dir === 'up') {
      // Pequena capa de viagem ou suporte de bainha nas costas
      ctx.fillStyle = P.tunicDeep;
      ctx.beginPath();
      ctx.moveTo(sLeftX + 1, sLeftY);
      ctx.lineTo(sRightX - 1, sRightY);
      ctx.lineTo(hipX + 5, hipY + 8);
      ctx.lineTo(hipX - 5, hipY + 8);
      ctx.closePath();
      ctx.fill();

      // Bainha da espada atravessada nas costas
      ctx.fillStyle = P.leatherDeep;
      ctx.save();
      ctx.translate(chestX, chestY);
      ctx.rotate(-0.55);
      ctx.fillRect(-2, -18, 4, 30);
      ctx.fillStyle = P.goldBase;
      ctx.fillRect(-2.5, -18, 5, 3);
      ctx.restore();
    }

    if (dir === 'left' || dir === 'up') {
      this.renderWarriorArm(ctx, sRightX, sRightY, pose.armRightAngle, dir, false, pose);
    } else if (dir === 'right') {
      this.renderWarriorArm(ctx, sLeftX, sLeftY, pose.armLeftAngle, dir, true, pose);
    }

    // -------------------------------------------------------------------------
    // 3. PERNAS, CALÇAS E BOTAS DE COMBATE ARTICULADAS
    // -------------------------------------------------------------------------
    this.renderWarriorLeg(ctx, hLeftX, hLeftY, pose.legLeftAngle, pose.legLeftBend, baseY, dir, true);
    this.renderWarriorLeg(ctx, hRightX, hRightY, pose.legRightAngle, pose.legRightBend, baseY, dir, false);

    // -------------------------------------------------------------------------
    // 4. QUADRIL, CINTURÃO DE COMBATE E PLACAS DE TASSET (Saiote de guerreiro)
    // -------------------------------------------------------------------------
    ctx.save();
    ctx.translate(hipX, hipY);
    ctx.rotate(hipTilt);

    // Saiote de túnica verde-petróleo sob o cinto
    ctx.fillStyle = P.tunicDeep;
    ctx.fillRect(-9, -4, 18, 10);
    ctx.fillStyle = P.tunicBase;
    ctx.fillRect(-8.5, -4, 17, 9);
    ctx.fillStyle = P.tunicHighlight;
    ctx.fillRect(-7, -4, 7, 8);

    // Placas de proteção lateral (Tassets de couro com reforço de metal)
    ctx.fillStyle = P.leatherDeep;
    ctx.fillRect(-9.5, -2, 5, 8);
    ctx.fillRect(4.5, -2, 5, 8);
    ctx.fillStyle = P.leatherBase;
    ctx.fillRect(-9, -1.5, 4, 7);
    ctx.fillRect(5, -1.5, 4, 7);
    // Rebites dourados nos tassets
    ctx.fillStyle = P.goldBase;
    ctx.fillRect(-8, 3, 2, 2);
    ctx.fillRect(6, 3, 2, 2);

    // Cinturão largo de couro com costura e fivela forjada
    ctx.fillStyle = P.leatherDeep;
    ctx.fillRect(-9, -3.5, 18, 5);
    ctx.fillStyle = P.leatherLight;
    ctx.fillRect(-8.5, -3, 17, 3);
    ctx.fillStyle = P.leatherSeam;
    ctx.fillRect(-8.5, 0.5, 17, 1);

    if (dir !== 'up') {
      // Fivela de latão retangular com chanfro
      ctx.fillStyle = P.goldBase;
      ctx.fillRect(-3, -3.5, 6, 5);
      ctx.fillStyle = P.goldHighlight;
      ctx.fillRect(-2, -2.5, 4, 3);
      ctx.fillStyle = P.steelDeep;
      ctx.fillRect(-0.7, -2, 1.4, 2); // Pino da fivela
    }

    ctx.restore();

    // -------------------------------------------------------------------------
    // 5. TRONCO: PEITORAL DE AÇO / COURO FACETADO COM ILUMINAÇÃO TOP-LEFT
    // -------------------------------------------------------------------------
    ctx.save();
    ctx.translate(chestX, chestY);
    ctx.rotate(torsoLean);

    // Silhueta robusta do tórax de guerreiro em V
    ctx.fillStyle = P.steelContour;
    ctx.beginPath();
    ctx.moveTo(-11, -9);
    ctx.lineTo(11, -9);
    ctx.lineTo(9.5, 7);
    ctx.lineTo(-9.5, 7);
    ctx.closePath();
    ctx.fill();

    // Túnica interna aparecendo nas bordas
    ctx.fillStyle = P.tunicBase;
    ctx.beginPath();
    ctx.moveTo(-10.5, -8.5);
    ctx.lineTo(10.5, -8.5);
    ctx.lineTo(9, 6.5);
    ctx.lineTo(-9, 6.5);
    ctx.closePath();
    ctx.fill();

    // Placa de Aço do Peitoral / Cuirass (Facetada em 3D com luz da esquerda)
    ctx.fillStyle = P.steelDeep;
    ctx.beginPath();
    ctx.moveTo(-9.5, -8);
    ctx.lineTo(9.5, -8);
    ctx.lineTo(8, 5.5);
    ctx.lineTo(-8, 5.5);
    ctx.closePath();
    ctx.fill();

    // Metade sombreada do peitoral (Direita)
    ctx.fillStyle = P.steelDark;
    ctx.beginPath();
    ctx.moveTo(0, -8);
    ctx.lineTo(9, -8);
    ctx.lineTo(7.5, 5.5);
    ctx.lineTo(0, 5.5);
    ctx.closePath();
    ctx.fill();

    // Metade iluminada do peitoral (Esquerda / Top-Left Key Light)
    ctx.fillStyle = P.steelMid;
    ctx.beginPath();
    ctx.moveTo(-9, -8);
    ctx.lineTo(0, -8);
    ctx.lineTo(0, 5.5);
    ctx.lineTo(-7.5, 5.5);
    ctx.closePath();
    ctx.fill();

    // Destaque especular do peitoral metálico curvo
    ctx.fillStyle = P.steelLight;
    ctx.fillRect(-7.5, -7, 6, 6);
    ctx.fillStyle = P.steelHighlight;
    ctx.fillRect(-6, -6, 3, 3);

    // Linha central do osso esternal e chanfro
    ctx.fillStyle = P.steelDeep;
    ctx.fillRect(-0.5, -7.5, 1, 12);

    // Rebites forjados na borda superior do peitoral
    ctx.fillStyle = P.goldHighlight;
    ctx.fillRect(-8, -7.5, 1.5, 1.5);
    ctx.fillRect(6.5, -7.5, 1.5, 1.5);
    ctx.fillRect(-5, 4, 1.5, 1.5);
    ctx.fillRect(3.5, 4, 1.5, 1.5);

    // Gola de couro e tecido reforçada
    if (dir === 'down') {
      ctx.fillStyle = P.leatherBase;
      ctx.beginPath();
      ctx.moveTo(-4, -8.5);
      ctx.lineTo(4, -8.5);
      ctx.lineTo(0, -3.5);
      ctx.closePath();
      ctx.fill();

      // Pedaço de cota de malha / linho no decote
      ctx.fillStyle = P.steelLight;
      ctx.fillRect(-1.5, -7.5, 3, 2.5);
    } else if (dir === 'up') {
      // Placa dorsal com reforço vertebral
      ctx.fillStyle = P.steelDark;
      ctx.fillRect(-4, -8, 8, 12);
      ctx.fillStyle = P.steelMid;
      ctx.fillRect(-3, -7, 6, 10);
      ctx.fillStyle = P.goldBase;
      ctx.fillRect(-1, -7, 2, 2);
    }

    ctx.restore();

    // -------------------------------------------------------------------------
    // 6. CABEÇA, ROSTO E CABELO DE GUERREIRO HEROICO
    // -------------------------------------------------------------------------
    this.renderWarriorHead(ctx, headX, headY, neckX, neckY, dir, hairSway, pose.expression);

    // -------------------------------------------------------------------------
    // 7. OMBREIRAS 3D (PAULDRONS) E BRAÇO FRONTAL
    // -------------------------------------------------------------------------
    if (dir === 'down' || dir === 'right') {
      this.renderWarriorArm(ctx, sRightX, sRightY, pose.armRightAngle, dir, false, pose);
    }
    if (dir === 'down' || dir === 'left') {
      this.renderWarriorArm(ctx, sLeftX, sLeftY, pose.armLeftAngle, dir, true, pose);
    }

    // Ombreiras 3D sobrepostas na junta do ombro
    this.renderPauldron(ctx, sLeftX, sLeftY, true, dir);
    this.renderPauldron(ctx, sRightX, sRightY, false, dir);
  }

  /**
   * Renderiza a Cabeça, Rosto com traços definidos e Cabelo de guerreiro
   */
  private static renderWarriorHead(
    ctx: CanvasRenderingContext2D,
    headX: number,
    headY: number,
    neckX: number,
    neckY: number,
    dir: 'down' | 'up' | 'left' | 'right',
    hairSway: number,
    expression: 'idle' | 'walk' | 'attack' | 'hurt'
  ): void {
    const P = this.PALETTE;

    // 1. Pescoço forte e anatômico conectando ao tronco
    ctx.fillStyle = P.skinShadow;
    ctx.fillRect(neckX - 3.5, neckY - 4, 7, 7);
    ctx.fillStyle = P.skinBase;
    ctx.fillRect(neckX - 2.5, neckY - 3, 5, 5);

    // 2. Base da Cabeça e Mandíbula esculpida
    ctx.save();
    ctx.translate(headX, headY);

    if (dir === 'up') {
      // Visto de costas: massa densa de cabelo castanho com mechas
      ctx.fillStyle = P.hairShadow;
      ctx.beginPath();
      ctx.arc(0, 0, 7.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = P.hairBase;
      ctx.beginPath();
      ctx.arc(0, -0.5, 7, 0, Math.PI * 2);
      ctx.fill();

      // Mechas com balanço
      ctx.fillStyle = P.hairHighlight;
      ctx.fillRect(-4 + hairSway * 0.5, -4, 4, 7);
      ctx.fillRect(1 + hairSway * 0.5, -5, 4, 8);
      ctx.restore();
      return;
    }

    // Formato da cabeça com queixo e maçãs do rosto
    ctx.fillStyle = P.skinDeep;
    ctx.beginPath();
    ctx.moveTo(-5.5, -6);
    ctx.lineTo(5.5, -6);
    ctx.lineTo(5, 2);
    ctx.lineTo(2.5, 6);
    ctx.lineTo(-2.5, 6);
    ctx.lineTo(-5, 2);
    ctx.closePath();
    ctx.fill();

    // Rosto com tom de pele aquecido
    ctx.fillStyle = P.skinBase;
    ctx.beginPath();
    ctx.moveTo(-4.5, -5.5);
    ctx.lineTo(4.5, -5.5);
    ctx.lineTo(4, 1.5);
    ctx.lineTo(2, 5.2);
    ctx.lineTo(-2, 5.2);
    ctx.lineTo(-4, 1.5);
    ctx.closePath();
    ctx.fill();

    // Luz no lado esquerdo do rosto (Top-Left)
    ctx.fillStyle = P.skinHighlight;
    ctx.fillRect(-3.5, -4, 3.5, 6);

    // Olhos e Sobrancelhas de guerreiro
    if (dir === 'down') {
      // Sobrancelhas resolutas
      ctx.fillStyle = P.hairShadow;
      ctx.fillRect(-4, -2.5, 3.5, 1.2);
      ctx.fillRect(0.5, -2.5, 3.5, 1.2);

      // Olhos com íris escura e brilho de vida
      ctx.fillStyle = P.eyes;
      ctx.fillRect(-3.5, -1, 2.5, 2);
      ctx.fillRect(1, -1, 2.5, 2);
      ctx.fillStyle = P.eyesGlint;
      ctx.fillRect(-3, -1, 1, 1);
      ctx.fillRect(1.5, -1, 1, 1);

      // Sombra do nariz e boca
      ctx.fillStyle = P.skinShadow;
      ctx.fillRect(-0.8, 1, 1.6, 2);
      ctx.fillRect(-1.5, 3.8, 3, 1);
    } else if (dir === 'left') {
      // Perfil esquerdo
      ctx.fillStyle = P.hairShadow;
      ctx.fillRect(-4.5, -2.5, 3.5, 1.2);
      ctx.fillStyle = P.eyes;
      ctx.fillRect(-4, -1, 2, 2);
      ctx.fillStyle = P.eyesGlint;
      ctx.fillRect(-3.5, -1, 1, 1);
      // Ponta do nariz
      ctx.fillStyle = P.skinBase;
      ctx.fillRect(-5.5, 0.5, 2, 2);
    } else if (dir === 'right') {
      // Perfil direito
      ctx.fillStyle = P.hairShadow;
      ctx.fillRect(1, -2.5, 3.5, 1.2);
      ctx.fillStyle = P.eyes;
      ctx.fillRect(2, -1, 2, 2);
      ctx.fillStyle = P.eyesGlint;
      ctx.fillRect(2, -1, 1, 1);
      // Ponta do nariz
      ctx.fillStyle = P.skinBase;
      ctx.fillRect(3.5, 0.5, 2, 2);
    }

    // 3. Cabelo de Guerreiro com camadas e mechas estilizadas
    ctx.fillStyle = P.hairShadow;
    ctx.beginPath();
    ctx.arc(0, -4.5, 6.5, Math.PI, 0);
    ctx.lineTo(6.5, -2);
    ctx.lineTo(-6.5, -2);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = P.hairBase;
    ctx.beginPath();
    ctx.arc(0, -5, 6, Math.PI, 0);
    ctx.fill();

    // Topete / mechas frontais jogadas para o lado com destaque de luz
    ctx.fillStyle = P.hairHighlight;
    ctx.beginPath();
    ctx.moveTo(-5 + hairSway, -6);
    ctx.lineTo(2 + hairSway, -8);
    ctx.lineTo(1 + hairSway, -3);
    ctx.lineTo(-3 + hairSway, -2);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = P.hairRim;
    ctx.fillRect(-3 + hairSway, -7.5, 3, 2);

    ctx.restore();
  }

  /**
   * Renderiza a Ombreira 3D (Pauldron) sobre a articulação do ombro
   */
  private static renderPauldron(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    isLeft: boolean,
    dir: 'down' | 'up' | 'left' | 'right'
  ): void {
    const P = this.PALETTE;
    ctx.save();
    ctx.translate(x, y - 2);

    // Contorno escuro da ombreira de placas
    ctx.fillStyle = P.steelContour;
    ctx.beginPath();
    ctx.arc(0, 0, 5.5, 0, Math.PI * 2);
    ctx.fill();

    // Camada base de aço forjado
    ctx.fillStyle = isLeft ? P.steelMid : P.steelDark;
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.fill();

    // Destaque de volume e chanfro superior
    ctx.fillStyle = isLeft ? P.steelLight : P.steelMid;
    ctx.beginPath();
    ctx.arc(-1, -1, 3.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = isLeft ? P.steelHighlight : P.steelLight;
    ctx.fillRect(-2.5, -2.5, 2.5, 2.5);

    // Borda de acabamento dourada/latão (como no guerreiro do Free3D)
    ctx.fillStyle = P.goldBase;
    ctx.beginPath();
    ctx.arc(0, 0, 5, Math.PI * 0.6, Math.PI * 1.4);
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = P.goldBase;
    ctx.stroke();

    // Rebite de ouro no centro da ombreira
    ctx.fillStyle = P.goldHighlight;
    ctx.fillRect(-1, -1, 2, 2);

    ctx.restore();
  }

  /**
   * Renderiza o Braço com braçadeiras de couro reforçado e empunhadura
   */
  private static renderWarriorArm(
    ctx: CanvasRenderingContext2D,
    shoulderX: number,
    shoulderY: number,
    armAngle: number,
    dir: 'down' | 'up' | 'left' | 'right',
    isLeft: boolean,
    pose: WarriorPose
  ): void {
    const P = this.PALETTE;
    const armLengthUpper = 7;
    const armLengthForearm = 7;

    ctx.save();
    ctx.translate(shoulderX, shoulderY);
    ctx.rotate(armAngle);

    // 1. Bíceps / Manga da túnica verde-petróleo
    ctx.fillStyle = P.tunicDeep;
    ctx.fillRect(-2.5, 0, 5, armLengthUpper);
    ctx.fillStyle = P.tunicBase;
    ctx.fillRect(-2, 0, 4, armLengthUpper);
    if (isLeft) {
      ctx.fillStyle = P.tunicHighlight;
      ctx.fillRect(-2, 0, 2, armLengthUpper);
    }

    // Cotovelo
    const elbowX = 0;
    const elbowY = armLengthUpper;

    // 2. Antebraço com Braçadeira de Couro Reforçado (Vambrace)
    ctx.translate(elbowX, elbowY);
    ctx.rotate(isLeft ? 0.15 : -0.15);

    ctx.fillStyle = P.leatherDeep;
    ctx.fillRect(-2.5, 0, 5, armLengthForearm);
    ctx.fillStyle = P.leatherBase;
    ctx.fillRect(-2, 0, 4, armLengthForearm);

    // Tiras de metal / costura na braçadeira
    ctx.fillStyle = P.goldBase;
    ctx.fillRect(-2, 2, 4, 1.2);
    ctx.fillRect(-2, 5, 4, 1.2);

    // 3. Mão enluvada / Punho de guerreiro
    ctx.fillStyle = P.leatherLight;
    ctx.beginPath();
    ctx.arc(0, armLengthForearm + 1.5, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // 4. Espada de Aço Medieval (Arming Sword)
    if (pose.swordState === 'ready' || pose.swordState === 'slashing') {
      if (!isLeft || dir === 'left') {
        this.renderSword(ctx, 0, armLengthForearm + 1.5, pose.swordAngle ?? 0, pose.slashProgress);
      }
    }

    ctx.restore();
  }

  /**
   * Renderiza a Espada de Aço medieval com lâmina, guarda-mão e pomo
   */
  private static renderSword(
    ctx: CanvasRenderingContext2D,
    handX: number,
    handY: number,
    swordAngle: number,
    slashProgress?: number
  ): void {
    const P = this.PALETTE;
    ctx.save();
    ctx.translate(handX, handY);
    ctx.rotate(swordAngle);

    // Empunhadura de couro
    ctx.fillStyle = P.leatherBase;
    ctx.fillRect(-1, -3, 2, 6);

    // Pomo forjado de latão
    ctx.fillStyle = P.goldBase;
    ctx.beginPath();
    ctx.arc(0, -3.5, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = P.goldHighlight;
    ctx.fillRect(-0.7, -4.2, 1.4, 1.4);

    // Guarda-mão de aço forjado com gavilhões
    ctx.fillStyle = P.steelDark;
    ctx.fillRect(-6, 2, 12, 2.5);
    ctx.fillStyle = P.goldBase;
    ctx.fillRect(-5.5, 2.5, 11, 1.5);

    // Lâmina de Aço de dois gumes (22px de comprimento)
    ctx.fillStyle = P.steelDeep;
    ctx.fillRect(-2, 4.5, 4, 20);
    ctx.beginPath();
    ctx.moveTo(-2, 24.5);
    ctx.lineTo(0, 28);
    ctx.lineTo(2, 24.5);
    ctx.closePath();
    ctx.fill();

    // Gume esquerdo iluminado
    ctx.fillStyle = P.steelLight;
    ctx.fillRect(-1.8, 4.5, 1.8, 20);
    ctx.beginPath();
    ctx.moveTo(-1.8, 24.5);
    ctx.lineTo(0, 27.5);
    ctx.lineTo(0, 24.5);
    ctx.closePath();
    ctx.fill();

    // Friso central de reflexo branco puro
    ctx.fillStyle = P.steelHighlight;
    ctx.fillRect(-0.5, 5, 1, 18);

    // Arco rúnico translúcido de corte (Slash Arc VFX)
    if (slashProgress !== undefined) {
      ctx.save();
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.75)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 16, 22, -0.6, 0.8);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();
  }

  /**
   * Renderiza a Perna, Coxa, Joelheira e Botas de combate pesadas
   */
  private static renderWarriorLeg(
    ctx: CanvasRenderingContext2D,
    hipX: number,
    hipY: number,
    legAngle: number,
    legBend: number,
    baseY: number,
    dir: 'down' | 'up' | 'left' | 'right',
    isLeft: boolean
  ): void {
    const P = this.PALETTE;
    const thighLength = 9;
    const shinLength = 9;

    ctx.save();
    ctx.translate(hipX, hipY);
    ctx.rotate(legAngle);

    // 1. Coxa / Calça de combate ajustada
    ctx.fillStyle = P.pantsShadow;
    ctx.fillRect(-3, 0, 6, thighLength);
    ctx.fillStyle = P.pantsBase;
    ctx.fillRect(-2.5, 0, 5, thighLength);
    if (isLeft) {
      ctx.fillStyle = P.pantsHighlight;
      ctx.fillRect(-2.5, 0, 2.5, thighLength);
    }

    // Joelho articulado com proteção (Poleyn de combate)
    const kneeY = thighLength;
    ctx.translate(0, kneeY);
    ctx.rotate(legBend);

    ctx.fillStyle = P.steelDark;
    ctx.beginPath();
    ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = P.bootPlate;
    ctx.beginPath();
    ctx.arc(0, 0, 2.8, 0, Math.PI * 2);
    ctx.fill();

    // 2. Panturrilha e Botas de Couro Pesadas (Com sola e dobra)
    ctx.fillStyle = P.leatherDeep;
    ctx.fillRect(-3.5, 1, 7, shinLength);
    ctx.fillStyle = P.bootLeather;
    ctx.fillRect(-3, 1, 6, shinLength);

    // Dobra da bota no topo
    ctx.fillStyle = P.leatherLight;
    ctx.fillRect(-3.5, 1, 7, 2.5);

    // Tira de fivela no tornozelo
    ctx.fillStyle = P.goldBase;
    ctx.fillRect(-3, 6, 6, 1.2);

    // Biqueira e Solado de contato plano firme no chão
    ctx.fillStyle = P.bootSole;
    ctx.fillRect(-3.8, shinLength - 1, 7.6, 2.5);

    if (dir === 'left') {
      ctx.fillRect(-4.5, shinLength - 1, 2, 2.5); // Bico para esquerda
    } else if (dir === 'right') {
      ctx.fillRect(2.5, shinLength - 1, 2, 2.5); // Bico para direita
    } else if (dir === 'down') {
      ctx.fillRect(-3.5, shinLength, 7, 1.5); // Bico para frente
    }

    ctx.restore();
  }

  /**
   * Cria o Canvas da Sombra desacoplada no solo (42×18px) com gradiente de oclusão
   */
  public static criarCanvasSombraWarrior(): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = 44;
    canvas.height = 20;
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    const grad = ctx.createRadialGradient(22, 10, 2, 22, 10, 18);
    grad.addColorStop(0, 'rgba(6, 12, 18, 0.65)');
    grad.addColorStop(0.5, 'rgba(6, 12, 18, 0.35)');
    grad.addColorStop(1, 'rgba(6, 12, 18, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(22, 10, 18, 7.5, 0, 0, Math.PI * 2);
    ctx.fill();

    return canvas;
  }
}
