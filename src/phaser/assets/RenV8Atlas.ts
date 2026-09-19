import Phaser from 'phaser';

// =============================================================================
// ELDRIM: ECOS DO PASSADO - REN 2.1 ATLAS (CORREÇÃO ANATÔMICA E INTEGRAÇÃO CORPORAL)
// =============================================================================
// REGRAS FUNDAMENTAIS REN 2.1:
// 1. CORPO ÚNICO E INTEGRADO:
//    - Ren NUNCA é uma coleção de retângulos ou peças flutuantes.
//    - Continuidade anatômica estrita:
//      CABEÇA -> PESCOÇO -> OMBROS -> TRONCO -> QUADRIL -> COXAS -> JOELHOS ->
//      PANTURRILHAS -> TORNOZELOS -> PÉS
//      OMBRO -> BRAÇO SUPERIOR -> COTOVELO -> ANTEBRAÇO -> MÃO
// 2. ZERO GAPS / ZERO PEÇAS FLUTUANTES:
//    - Cada junta (ombro, cotovelo, punho, quadril, joelho, tornozelo, pescoço)
//      possui sobreposição geométrica mútua de pelo menos 2 a 4 pixels.
//    - Pescoço visível e robusto ancorando a cabeça no tronco.
// 3. VOLUME CORPORAL:
//    - Tronco com formato atlético em V (ombros, tórax, cintura, quadril e saiote).
//    - Braços com volume de bíceps, braçadeiras de couro e mãos fechadas/empunhadas.
//    - Pernas com volume muscular real (coxas largas, joelhos articulados,
//      panturrilhas com curva e botas com solado plano de contato firme no solo).
// 4. TRANSFERÊNCIA DE PESO NO WALK CYCLE (8 FRAMES):
//    - Passo 0: Contato (calcanhar)
//    - Passo 1: Absorção/Down (joelho flexiona, quadril desce 2px e desloca lateralmente sobre o pé de apoio)
//    - Passo 2: Passagem (perna oposta dobra o joelho e passa sob o quadril)
//    - Passo 3: Impulso/Up (pé de apoio estende, quadril sobe ao ápice)
//    - Passos 4..7: Repetição espelhada com transferência total para o outro lado.
// =============================================================================

export interface PoseCorpoRen {
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
  swordState: 'sheathed' | 'carrying' | 'slashing' | 'dropped';
  swordAngle?: number;
  slashArcProgress?: number;
  expression: 'idle' | 'walk' | 'attack' | 'hurt';
  flash: boolean;
}

export class RenV8Atlas {
  static readonly FRAME_W = 48;
  static readonly FRAME_H = 64;
  static readonly COLS = 16;
  static readonly TOTAL_FRAMES = 160;

  // Paleta nobre e harmoniosa com alto contraste e saturação natural
  static readonly PALETA = {
    // Pele e Sombras
    peleBase: '#fed7aa',
    peleSombra: '#ea580c',
    peleProfunda: '#c2410c',
    peleDestaque: '#fff7ed',
    olhos: '#0f172a',
    olhosBrilho: '#ffffff',

    // Cabelo
    cabeloBase: '#78350f',
    cabeloSombra: '#451a03',
    cabeloDestaque: '#b45309',
    cabeloBrilho: '#d97706',

    // Túnica e Tecido Nobre
    tunicaBase: '#0f766e',      // Azul-petróleo profundo
    tunicaSombra: '#115e59',
    tunicaProfunda: '#042f2e',
    tunicaDestaque: '#14b8a6',
    tunicaBordaOuro: '#f59e0b',
    golaLinho: '#fef3c7',

    // Couros e Metais
    cintoCouro: '#451a03',
    cintoFivela: '#facc15',
    ombreiraCouro: '#78350f',
    ombreiraMetal: '#d97706',
    bracadeiraCouro: '#542308',

    // Calças e Pernas
    calcaBase: '#1e293b',
    calcaSombra: '#0f172a',
    calcaDestaque: '#334155',

    // Botas e Solado de Contato
    botaBase: '#451a03',
    botaSombra: '#291003',
    botaDestaque: '#78350f',
    botaDobra: '#5c2406',
    botaSolado: '#0a0502',

    // A Lâmina de Eldrim
    espadaAco: '#f8fafc',
    espadaSombra: '#94a3b8',
    espadaRuna: '#38bdf8',
    espadaGuarda: '#fbbf24',
    espadaArco: 'rgba(56, 189, 248, 0.75)',
  };

  /**
   * Cria o canvas contendo o spritesheet V8 completo de Ren com 160 frames anatômicos
   */
  static criarCanvasSpritesheetV8(): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    const cols = this.COLS;
    const rows = Math.ceil(this.TOTAL_FRAMES / cols);
    canvas.width = this.FRAME_W * cols;
    canvas.height = this.FRAME_H * rows;

    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;

    for (let f = 0; f < this.TOTAL_FRAMES; f++) {
      const col = f % cols;
      const row = Math.floor(f / cols);
      const ox = col * this.FRAME_W;
      const oy = row * this.FRAME_H;
      this.desenharFrameRenV8(ctx, ox, oy, f);
    }

    return canvas;
  }

  /**
   * Sombra elíptica desacoplada suave no solo (38×16 px)
   */
  static criarCanvasSombraV8(): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = 38;
    canvas.height = 16;
    const ctx = canvas.getContext('2d')!;

    const grad = ctx.createRadialGradient(19, 8, 2, 19, 8, 18);
    grad.addColorStop(0, 'rgba(10, 15, 25, 0.78)');
    grad.addColorStop(0.55, 'rgba(10, 15, 25, 0.45)');
    grad.addColorStop(1, 'rgba(10, 15, 25, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(19, 8, 18, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    return canvas;
  }

  /**
   * Gera o spritesheet V8 completo de Ren com 160 frames anatômicos
   */
  static gerarSpritesheetRenV8(scene: Phaser.Scene): void {
    if (scene.textures.exists('ren_spritesheet_v8')) {
      scene.textures.remove('ren_spritesheet_v8');
    }

    const canvas = this.criarCanvasSpritesheetV8();

    scene.textures.addSpriteSheet('ren_spritesheet_v8', canvas as unknown as HTMLImageElement, {
      frameWidth: this.FRAME_W,
      frameHeight: this.FRAME_H,
    });

    this.gerarSombraContatoV8(scene);
  }

  /**
   * Registra sombra elíptica desacoplada suave no solo no Phaser
   */
  private static gerarSombraContatoV8(scene: Phaser.Scene): void {
    if (scene.textures.exists('sombra_ren_v8')) return;
    const canvas = this.criarCanvasSombraV8();
    scene.textures.addCanvas('sombra_ren_v8', canvas);
  }

  /**
   * Roteador de renderização para cada um dos 160 frames anatômicos
   */
  private static desenharFrameRenV8(
    ctx: CanvasRenderingContext2D,
    ox: number,
    oy: number,
    frameIndex: number
  ): void {
    // 1. Idle (frames 0..15: 4 direções × 4 frames)
    if (frameIndex >= 0 && frameIndex <= 15) {
      const dirIndex = Math.floor(frameIndex / 4);
      const subFrame = frameIndex % 4;
      const dir = (['down', 'up', 'left', 'right'] as const)[dirIndex];
      this.desenharIdle(ctx, ox, oy, dir, subFrame);
      return;
    }

    // 2. Walk (frames 16..47: 4 direções × 8 frames com transferência de peso real)
    if (frameIndex >= 16 && frameIndex <= 47) {
      const walkFrame = frameIndex - 16;
      const dirIndex = Math.floor(walkFrame / 8);
      const step = walkFrame % 8;
      const dir = (['down', 'up', 'left', 'right'] as const)[dirIndex];
      this.desenharWalk(ctx, ox, oy, dir, step);
      return;
    }

    // 3. Attack (frames 48..87: 4 direções × 10 frames)
    if (frameIndex >= 48 && frameIndex <= 87) {
      const atkFrame = frameIndex - 48;
      const dirIndex = Math.floor(atkFrame / 10);
      const step = atkFrame % 10;
      const dir = (['down', 'up', 'left', 'right'] as const)[dirIndex];
      this.desenharAttack(ctx, ox, oy, dir, step);
      return;
    }

    // 4. Charged Attack (frames 88..95: 8 frames)
    if (frameIndex >= 88 && frameIndex <= 95) {
      const step = frameIndex - 88;
      this.desenharChargedAttack(ctx, ox, oy, step);
      return;
    }

    // 5. Dodge (frames 96..127: 4 direções × 8 frames)
    if (frameIndex >= 96 && frameIndex <= 127) {
      const dodgeFrame = frameIndex - 96;
      const dirIndex = Math.floor(dodgeFrame / 8);
      const step = dodgeFrame % 8;
      const dir = (['down', 'up', 'left', 'right'] as const)[dirIndex];
      this.desenharDodge(ctx, ox, oy, dir, step);
      return;
    }

    // 6. Hurt (frames 128..151: 4 direções × 6 frames)
    if (frameIndex >= 128 && frameIndex <= 151) {
      const hurtFrame = frameIndex - 128;
      const dirIndex = Math.floor(hurtFrame / 6);
      const step = hurtFrame % 6;
      const dir = (['down', 'up', 'left', 'right'] as const)[dirIndex];
      this.desenharHurt(ctx, ox, oy, dir, step);
      return;
    }

    // 7. Death (frames 152..159: 8 frames)
    if (frameIndex >= 152 && frameIndex <= 159) {
      const step = frameIndex - 152;
      this.desenharDeath(ctx, ox, oy, step);
      return;
    }
  }

  // ===========================================================================
  // 1. IDLE (4 DIREÇÕES × 4 FRAMES)
  // Respiração sincronizada do tórax e leve balanço do cabelo, postura estável
  // ===========================================================================
  private static desenharIdle(
    ctx: CanvasRenderingContext2D,
    ox: number,
    oy: number,
    dir: 'down' | 'up' | 'left' | 'right',
    frame: number
  ): void {
    const cx = ox + 24;
    // Expansão e elevação sutil do tórax: 0, -1, 0, 0 px
    const breathY = frame === 1 ? -1 : 0;
    const hairSway = frame === 2 ? 1 : frame === 3 ? 0 : 0;

    this.renderizarCorpoUnificado(ctx, {
      cx,
      baseY: oy + 58,
      dir,
      breathY,
      hairSway,
      hipShiftX: 0,
      hipOffset: 0,
      hipTilt: 0,
      torsoLean: 0,
      legLeftAngle: 0,
      legRightAngle: 0,
      legLeftBend: 0.05,
      legRightBend: 0.05,
      armLeftAngle: 0.10,
      armRightAngle: -0.10,
      swordState: 'sheathed',
      expression: 'idle',
      flash: false,
    });
  }

  // ===========================================================================
  // 2. WALK (4 DIREÇÕES × 8 FRAMES)
  // CICLO BIOMECÂNICO HUMANO COM TRANSFERÊNCIA REAL DE PESO:
  // F0: CONTATO (Pé esquerdo toca calcanhar na frente, pé direito atrás)
  // F1: ABSORÇÃO / DOWN (Peso transfere para a perna esquerda, joelho amortece,
  //     quadril desce 2px e desloca lateralmente para a esquerda, pé direito sai do solo)
  // F2: PASSAGEM (Perna esquerda sustenta peso total, perna direita flexiona joelho e passa)
  // F3: IMPULSO / UP (Pé esquerdo estende tornozelo, corpo atinge ápice da passada)
  // F4: CONTATO (Pé direito toca calcanhar na frente, pé esquerdo atrás)
  // F5: ABSORÇÃO / DOWN (Peso transfere para perna direita, quadril desce e desloca à direita)
  // F6: PASSAGEM (Perna direita sustenta peso total, perna esquerda passa)
  // F7: IMPULSO / UP (Pé direito estende tornozelo, corpo sobe ao ápice)
  // ===========================================================================
  private static desenharWalk(
    ctx: CanvasRenderingContext2D,
    ox: number,
    oy: number,
    dir: 'down' | 'up' | 'left' | 'right',
    step: number
  ): void {
    const cx = ox + 24;

    // Configuração precisa de transferência de peso e movimentação do centro de gravidade
    const fases = [
      // F0: Contato Esq
      {
        hipY: 0, hipShift: -0.5, hipTilt: -0.04,
        lAng: -0.42, rAng: 0.38, lBend: 0.08, rBend: 0.20,
        lArm: 0.42, rArm: -0.42, torsoLean: 0.02, breathY: 0,
      },
      // F1: Absorção Esq (Peso total no pé esquerdo)
      {
        hipY: 2, hipShift: -1.6, hipTilt: -0.08,
        lAng: -0.25, rAng: 0.20, lBend: 0.38, rBend: 0.45,
        lArm: 0.22, rArm: -0.22, torsoLean: 0.04, breathY: 1,
      },
      // F2: Passagem Dir (Perna direita flexionada cruzando)
      {
        hipY: 0, hipShift: -1.0, hipTilt: -0.02,
        lAng: 0.00, rAng: -0.15, lBend: 0.08, rBend: 0.85,
        lArm: 0.00, rArm: 0.00, torsoLean: 0.03, breathY: 0,
      },
      // F3: Impulso Esq (Ponto alto)
      {
        hipY: -2, hipShift: -0.2, hipTilt: 0.04,
        lAng: 0.22, rAng: -0.38, lBend: 0.02, rBend: 0.25,
        lArm: -0.30, rArm: 0.30, torsoLean: 0.02, breathY: -1,
      },
      // F4: Contato Dir
      {
        hipY: 0, hipShift: 0.5, hipTilt: 0.04,
        lAng: 0.38, rAng: -0.42, lBend: 0.20, rBend: 0.08,
        lArm: -0.42, rArm: 0.42, torsoLean: -0.02, breathY: 0,
      },
      // F5: Absorção Dir (Peso total no pé direito)
      {
        hipY: 2, hipShift: 1.6, hipTilt: 0.08,
        lAng: 0.20, rAng: -0.25, lBend: 0.45, rBend: 0.38,
        lArm: -0.22, rArm: 0.22, torsoLean: -0.04, breathY: 1,
      },
      // F6: Passagem Esq (Perna esquerda flexionada cruzando)
      {
        hipY: 0, hipShift: 1.0, hipTilt: 0.02,
        lAng: -0.15, rAng: 0.00, lBend: 0.85, rBend: 0.08,
        lArm: 0.00, rArm: 0.00, torsoLean: -0.03, breathY: 0,
      },
      // F7: Impulso Dir (Ponto alto)
      {
        hipY: -2, hipShift: 0.2, hipTilt: -0.04,
        lAng: -0.38, rAng: 0.22, lBend: 0.25, rBend: 0.02,
        lArm: 0.30, rArm: -0.30, torsoLean: -0.02, breathY: -1,
      },
    ];

    const p = fases[step];
    const hairSway = step % 2 === 0 ? 1 : -1;
    const dirTorsoLean = dir === 'left' ? -0.08 : dir === 'right' ? 0.08 : p.torsoLean;

    this.renderizarCorpoUnificado(ctx, {
      cx,
      baseY: oy + 58,
      dir,
      breathY: p.breathY,
      hairSway,
      hipShiftX: dir === 'down' || dir === 'up' ? p.hipShift : 0,
      hipOffset: p.hipY,
      hipTilt: p.hipTilt,
      torsoLean: dirTorsoLean,
      legLeftAngle: p.lAng,
      legRightAngle: p.rAng,
      legLeftBend: p.lBend,
      legRightBend: p.rBend,
      armLeftAngle: p.lArm,
      armRightAngle: p.rArm,
      swordState: 'carrying',
      expression: 'walk',
      flash: false,
    });
  }

  // ===========================================================================
  // 3. ATTACK (4 DIREÇÕES × 10 FRAMES)
  // Preparação, lunge explosivo, corte rúnico em arco e recuperação estável
  // ===========================================================================
  private static desenharAttack(
    ctx: CanvasRenderingContext2D,
    ox: number,
    oy: number,
    dir: 'down' | 'up' | 'left' | 'right',
    step: number
  ): void {
    const cx = ox + 24;
    const isLunging = step >= 2 && step <= 5;
    const lungeOffset = isLunging ? (dir === 'down' ? 4 : dir === 'up' ? -4 : dir === 'left' ? -5 : 5) : 0;
    const lungeY = isLunging ? 1 : 0;

    const atkParams = [
      { tLean: -0.10, armR: -0.80, armL: 0.20, swordA: -0.9, arc: 0 },
      { tLean: -0.15, armR: -1.20, armL: 0.40, swordA: -1.4, arc: 0 },
      { tLean: 0.12, armR: -0.20, armL: -0.30, swordA: -0.2, arc: 1 },
      { tLean: 0.22, armR: 0.60, armL: -0.50, swordA: 0.7, arc: 2 },
      { tLean: 0.25, armR: 1.10, armL: -0.60, swordA: 1.4, arc: 3 },
      { tLean: 0.18, armR: 1.25, armL: -0.45, swordA: 1.6, arc: 2 },
      { tLean: 0.10, armR: 1.00, armL: -0.30, swordA: 1.3, arc: 1 },
      { tLean: 0.05, armR: 0.60, armL: -0.15, swordA: 0.9, arc: 0 },
      { tLean: 0.00, armR: 0.30, armL: 0.00, swordA: 0.5, arc: 0 },
      { tLean: 0.00, armR: 0.10, armL: 0.00, swordA: 0.2, arc: 0 },
    ][step];

    this.renderizarCorpoUnificado(ctx, {
      cx: cx + (dir === 'left' || dir === 'right' ? lungeOffset : 0),
      baseY: oy + 58 + (dir === 'down' || dir === 'up' ? lungeOffset : 0) + lungeY,
      dir,
      breathY: 0,
      hairSway: step >= 2 && step <= 5 ? 2 : 0,
      hipShiftX: 0,
      hipOffset: lungeY,
      hipTilt: atkParams.tLean * 0.5,
      torsoLean: atkParams.tLean,
      legLeftAngle: isLunging ? -0.35 : 0,
      legRightAngle: isLunging ? 0.45 : 0,
      legLeftBend: isLunging ? 0.30 : 0.05,
      legRightBend: isLunging ? 0.40 : 0.05,
      armLeftAngle: atkParams.armL,
      armRightAngle: atkParams.armR,
      swordState: 'slashing',
      swordAngle: atkParams.swordA,
      slashArcProgress: atkParams.arc,
      expression: 'attack',
      flash: false,
    });

    if (atkParams.arc > 0) {
      this.desenharArcoLuzRunica(ctx, cx, oy + 32, dir, atkParams.arc);
    }
  }

  // ===========================================================================
  // 4. CHARGED ATTACK (8 FRAMES)
  // Giro radial 360° em alta velocidade com expansão rúnica circular
  // ===========================================================================
  private static desenharChargedAttack(
    ctx: CanvasRenderingContext2D,
    ox: number,
    oy: number,
    step: number
  ): void {
    const cx = ox + 24;
    const dirs: Array<'down' | 'left' | 'up' | 'right'> = ['down', 'left', 'up', 'right'];
    const currentDir = dirs[step % 4];

    this.renderizarCorpoUnificado(ctx, {
      cx,
      baseY: oy + 58,
      dir: currentDir,
      breathY: -1,
      hairSway: 3,
      hipShiftX: 0,
      hipOffset: 0,
      hipTilt: 0,
      torsoLean: 0.15,
      legLeftAngle: -0.25,
      legRightAngle: 0.25,
      legLeftBend: 0.35,
      legRightBend: 0.35,
      armLeftAngle: -0.8,
      armRightAngle: 0.8,
      swordState: 'slashing',
      swordAngle: (step / 8) * Math.PI * 2,
      slashArcProgress: 3,
      expression: 'attack',
      flash: step % 2 === 0,
    });

    const radius = 18 + step * 2.5;
    ctx.strokeStyle = step % 2 === 0 ? 'rgba(254, 240, 138, 0.85)' : 'rgba(56, 189, 248, 0.75)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(cx, oy + 34, radius, 0, Math.PI * 2);
    ctx.stroke();
  }

  // ===========================================================================
  // 5. DODGE / ROLAMENTO ACROBÁTICO (4 DIREÇÕES × 8 FRAMES)
  // Mergulho ágil com rotação e aterrissagem balanceada
  // ===========================================================================
  private static desenharDodge(
    ctx: CanvasRenderingContext2D,
    ox: number,
    oy: number,
    dir: 'down' | 'up' | 'left' | 'right',
    step: number
  ): void {
    const cx = ox + 24;

    if (step >= 2 && step <= 5) {
      // Rotação acrobática no ar
      const angle = ((step - 2) / 4) * Math.PI * 2 * (dir === 'left' ? -1 : 1);
      ctx.save();
      ctx.translate(cx, oy + 36);
      ctx.rotate(angle);

      // Silhueta compactada durante o giro
      ctx.fillStyle = this.PALETA.tunicaBase;
      ctx.beginPath();
      ctx.ellipse(0, 0, 12, 11, 0, 0, Math.PI * 2);
      ctx.fill();

      // Cabeça integrada
      ctx.fillStyle = this.PALETA.cabeloBase;
      ctx.beginPath();
      ctx.arc(0, -8, 7, 0, Math.PI * 2);
      ctx.fill();

      // Pernas flexionadas
      ctx.fillStyle = this.PALETA.botaBase;
      ctx.fillRect(-6, 6, 5, 6);
      ctx.fillRect(1, 6, 5, 6);

      ctx.restore();
      return;
    }

    // Preparação (0..1) e Aterrissagem (6..7)
    const isLanding = step >= 6;
    this.renderizarCorpoUnificado(ctx, {
      cx,
      baseY: oy + 58 + (isLanding ? 2 : 1),
      dir,
      breathY: 0,
      hairSway: 2,
      hipShiftX: 0,
      hipOffset: isLanding ? 3 : 1,
      hipTilt: 0,
      torsoLean: isLanding ? 0.20 : 0.10,
      legLeftAngle: -0.20,
      legRightAngle: 0.20,
      legLeftBend: 0.50,
      legRightBend: 0.50,
      armLeftAngle: 0.30,
      armRightAngle: -0.30,
      swordState: 'carrying',
      expression: 'idle',
      flash: false,
    });
  }

  // ===========================================================================
  // 6. HURT (4 DIREÇÕES × 6 FRAMES)
  // Recuo elástico com impacto no tronco, cabeça acompanha e equilíbrio
  // ===========================================================================
  private static desenharHurt(
    ctx: CanvasRenderingContext2D,
    ox: number,
    oy: number,
    dir: 'down' | 'up' | 'left' | 'right',
    step: number
  ): void {
    const cx = ox + 24;
    const knockbackY = step <= 2 ? -2 : 0;
    const knockbackX = dir === 'left' ? 3 : dir === 'right' ? -3 : 0;
    const flash = step === 0 || step === 1;

    this.renderizarCorpoUnificado(ctx, {
      cx: cx + knockbackX,
      baseY: oy + 58 + knockbackY,
      dir,
      breathY: 0,
      hairSway: -2,
      hipShiftX: 0,
      hipOffset: knockbackY,
      hipTilt: 0.12,
      torsoLean: -0.22, // Tronco curvado para trás pelo impacto
      legLeftAngle: -0.20,
      legRightAngle: 0.35,
      legLeftBend: 0.20,
      legRightBend: 0.35,
      armLeftAngle: -0.50,
      armRightAngle: 0.60,
      swordState: 'carrying',
      expression: 'hurt',
      flash,
    });
  }

  // ===========================================================================
  // 7. DEATH (8 FRAMES)
  // Colapso gradual do corpo com descanso definitivo no solo
  // ===========================================================================
  private static desenharDeath(
    ctx: CanvasRenderingContext2D,
    ox: number,
    oy: number,
    step: number
  ): void {
    const cx = ox + 24;
    const P = this.PALETA;

    if (step <= 3) {
      const fallY = step * 3;
      this.renderizarCorpoUnificado(ctx, {
        cx,
        baseY: oy + 58 + fallY,
        dir: 'down',
        breathY: 0,
        hairSway: 1,
        hipShiftX: 0,
        hipOffset: fallY,
        hipTilt: 0.1,
        torsoLean: 0.15 + step * 0.12,
        legLeftAngle: -0.15,
        legRightAngle: 0.15,
        legLeftBend: 0.3 + step * 0.2,
        legRightBend: 0.3 + step * 0.2,
        armLeftAngle: 0.2,
        armRightAngle: -0.2,
        swordState: 'dropped',
        expression: 'hurt',
        flash: false,
      });
      return;
    }

    // Corpo em repouso no solo
    const settleAlpha = Math.min(1, 0.7 + (step - 4) * 0.1);
    ctx.save();
    ctx.globalAlpha = settleAlpha;

    // Espada caída ao lado
    ctx.fillStyle = P.espadaAco;
    ctx.fillRect(cx - 18, oy + 54, 16, 2);
    ctx.fillStyle = P.espadaGuarda;
    ctx.fillRect(cx - 8, oy + 52, 2, 6);

    // Corpo conectado no solo
    ctx.fillStyle = P.tunicaSombra;
    ctx.beginPath();
    ctx.ellipse(cx, oy + 54, 16, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = P.tunicaBase;
    ctx.beginPath();
    ctx.ellipse(cx - 1, oy + 53, 14, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Cabeça
    ctx.fillStyle = P.cabeloSombra;
    ctx.beginPath();
    ctx.arc(cx - 12, oy + 51, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = P.peleBase;
    ctx.fillRect(cx - 9, oy + 51, 4, 4);

    // Botas no chão
    ctx.fillStyle = P.botaBase;
    ctx.fillRect(cx + 8, oy + 52, 7, 4);
    ctx.fillRect(cx + 10, oy + 55, 6, 3);

    ctx.restore();
  }

  // ===========================================================================
  // MOTOR DE INTEGRAÇÃO CORPORAL: RENDERIZADOR UNIFICADO REN 2.1
  // Garante continuidade 100% contínua sem nenhum gap entre partes.
  // ===========================================================================
  private static renderizarCorpoUnificado(
    ctx: CanvasRenderingContext2D,
    p: PoseCorpoRen
  ): void {
    const P = this.PALETA;
    const { cx, baseY, dir, breathY, hairSway, hipShiftX, hipTilt, torsoLean, flash } = p;

    if (flash) {
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(cx - 12, baseY - 50, 24, 50);
      return;
    }

    // 1. CÁLCULO DA CADEIA CINEMÁTICA CONTÍNUA (SKELETAL ROOT)
    // Hip Center: Raiz do quadril com deslocamento lateral e vertical de peso
    const hipX = cx + hipShiftX;
    const hipY = baseY - 22 + p.hipOffset;

    // Torso / Chest Center: Derivado da inclinação da coluna vertebral
    const spineLength = 11;
    const chestX = hipX + Math.sin(torsoLean) * spineLength;
    const chestY = hipY - Math.cos(torsoLean) * spineLength + breathY;

    // Neck Base: Ancorado 3px acima do peitoral
    const neckBaseX = chestX + Math.sin(torsoLean) * 4;
    const neckBaseY = chestY - 5;

    // Head Center: Ancorado 8px acima do pescoço
    const headX = neckBaseX + Math.sin(torsoLean) * 7;
    const headY = neckBaseY - 8;

    // Articulações dos Ombros (Left & Right): Fixados estruturalmente ao tronco
    const shoulderSpread = 8;
    const shoulderLeftX = chestX - Math.cos(torsoLean) * shoulderSpread;
    const shoulderLeftY = chestY - Math.sin(torsoLean) * shoulderSpread;
    const shoulderRightX = chestX + Math.cos(torsoLean) * shoulderSpread;
    const shoulderRightY = chestY + Math.sin(torsoLean) * shoulderSpread;

    // Articulações do Quadril (Left & Right): Fixados dentro da bacia
    const hipSpread = 5.5;
    const hipJointLeftX = hipX - Math.cos(hipTilt) * hipSpread;
    const hipJointLeftY = hipY - Math.sin(hipTilt) * hipSpread;
    const hipJointRightX = hipX + Math.cos(hipTilt) * hipSpread;
    const hipJointRightY = hipY + Math.sin(hipTilt) * hipSpread;

    // -------------------------------------------------------------------------
    // 2. BRAÇO TRASEIRO (desenhado antes do torso quando em perspectiva)
    // -------------------------------------------------------------------------
    if (dir === 'left' || dir === 'up') {
      this.desenharBracoVolumetrico(ctx, shoulderRightX, shoulderRightY, p.armRightAngle, dir, false, P);
    } else if (dir === 'right') {
      this.desenharBracoVolumetrico(ctx, shoulderLeftX, shoulderLeftY, p.armLeftAngle, dir, true, P);
    }

    // -------------------------------------------------------------------------
    // 3. PERNAS E BOTAS (Coxas, Joelhos, Panturrilhas, Tornozelos e Pés)
    // -------------------------------------------------------------------------
    // Perna Esquerda
    this.desenharPernaVolumetrica(
      ctx,
      hipJointLeftX,
      hipJointLeftY,
      p.legLeftAngle,
      p.legLeftBend,
      baseY,
      dir,
      true,
      P
    );

    // Perna Direita
    this.desenharPernaVolumetrica(
      ctx,
      hipJointRightX,
      hipJointRightY,
      p.legRightAngle,
      p.legRightBend,
      baseY,
      dir,
      false,
      P
    );

    // -------------------------------------------------------------------------
    // 4. QUADRIL, CINTO E SAIOTE DE COBERTURA DAS COXAS
    // Unifica o tronco às pernas sem nenhum espaço vazio
    // -------------------------------------------------------------------------
    ctx.save();
    ctx.translate(hipX, hipY);
    ctx.rotate(hipTilt);

    // Saiote / base da túnica descendo sobre o topo das coxas (sobreposição de 4px)
    ctx.fillStyle = P.tunicaProfunda;
    ctx.fillRect(-8.5, -5, 17, 10);
    ctx.fillStyle = P.tunicaSombra;
    ctx.fillRect(-8, -5, 16, 9);
    ctx.fillStyle = P.tunicaBase;
    ctx.fillRect(-7.5, -5, 15, 8);

    // Borda bordada inferior do saiote
    ctx.fillStyle = P.tunicaBordaOuro;
    ctx.fillRect(-7.5, 2.5, 15, 1.5);

    // Cinto largo de couro de viajante com costura dupla
    ctx.fillStyle = P.cintoCouro;
    ctx.fillRect(-8, -3, 16, 4.5);
    ctx.fillStyle = '#291003';
    ctx.fillRect(-8, 1, 16, 1);

    // Fivela de latão forjado
    if (dir !== 'up') {
      ctx.fillStyle = P.cintoFivela;
      ctx.fillRect(-2.5, -3, 5, 4.5);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(-1.5, -2, 3, 2.5);
      ctx.fillStyle = P.cintoCouro;
      ctx.fillRect(-0.5, -1, 1, 1.5); // Pino da fivela
    }

    ctx.restore();

    // -------------------------------------------------------------------------
    // 5. TRONCO, TÓRAX E OMBROS
    // Formato atlético em V, cobrindo o quadril com volume robusto
    // -------------------------------------------------------------------------
    ctx.save();
    ctx.translate(chestX, chestY);
    ctx.rotate(torsoLean);

    // Base de volume do tórax
    ctx.fillStyle = P.tunicaProfunda;
    ctx.beginPath();
    ctx.moveTo(-9.5, -8);
    ctx.lineTo(9.5, -8);
    ctx.lineTo(8.5, 7);
    ctx.lineTo(-8.5, 7);
    ctx.closePath();
    ctx.fill();

    // Túnica verde-petróleo nobre
    ctx.fillStyle = P.tunicaSombra;
    ctx.beginPath();
    ctx.moveTo(-9, -7.5);
    ctx.lineTo(9, -7.5);
    ctx.lineTo(8, 6.5);
    ctx.lineTo(-8, 6.5);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = P.tunicaBase;
    ctx.beginPath();
    ctx.moveTo(-8, -7);
    ctx.lineTo(8, -7);
    ctx.lineTo(7, 6);
    ctx.lineTo(-7, 6);
    ctx.closePath();
    ctx.fill();

    // Destaque de luz no peitoral
    ctx.fillStyle = P.tunicaDestaque;
    ctx.fillRect(-5, -6, 6, 7);

    // Gola e peitilho conforme a direção
    if (dir === 'down') {
      // Peitilho em V com gola de linho e acabamento dourado
      ctx.fillStyle = P.tunicaBordaOuro;
      ctx.beginPath();
      ctx.moveTo(-3, -7);
      ctx.lineTo(3, -7);
      ctx.lineTo(0, -1);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = P.golaLinho;
      ctx.fillRect(-1.5, -7, 3, 3);
    } else if (dir === 'up') {
      // Costas com capa curta/manto preso nas ombreiras
      ctx.fillStyle = P.tunicaSombra;
      ctx.fillRect(-7, -7, 14, 12);
      ctx.fillStyle = P.tunicaProfunda;
      ctx.fillRect(-1, -7, 2, 12); // Vinco da coluna
    }

    // Ombreiras de couro e latão cobrindo totalmente a inserção dos braços
    ctx.fillStyle = P.ombreiraCouro;
    ctx.fillRect(-10.5, -8, 4.5, 6);
    ctx.fillRect(6, -8, 4.5, 6);
    ctx.fillStyle = P.ombreiraMetal;
    ctx.fillRect(-9.5, -7, 2.5, 2.5);
    ctx.fillRect(7, -7, 2.5, 2.5);

    ctx.restore();

    // -------------------------------------------------------------------------
    // 6. PESCOÇO ROBUSTO (TRANSIÇÃO PERFEITA CABEÇA <-> TRONCO)
    // Não há NENHUM espaço invisível: penetra profundamente no queixo e no colarinho
    // -------------------------------------------------------------------------
    ctx.save();
    // O pescoço tem 7px de largura e cobre desde chestY - 7 até headY + 5
    ctx.fillStyle = P.peleProfunda;
    ctx.fillRect(neckBaseX - 3.5, neckBaseY - 5, 7, 7);
    ctx.fillStyle = P.peleSombra;
    ctx.fillRect(neckBaseX - 3, neckBaseY - 4, 6, 6);
    ctx.fillStyle = P.peleBase;
    ctx.fillRect(neckBaseX - 2, neckBaseY - 3, 4, 4);

    // Gola da túnica abraçando o pescoço
    ctx.fillStyle = P.tunicaBase;
    ctx.fillRect(neckBaseX - 4, neckBaseY - 1, 8, 3);
    ctx.fillStyle = P.tunicaBordaOuro;
    ctx.fillRect(neckBaseX - 3.5, neckBaseY + 1, 7, 1);
    ctx.restore();

    // -------------------------------------------------------------------------
    // 7. CABEÇA, ROSTO E CABELO INTEGRADO
    // -------------------------------------------------------------------------
    ctx.save();
    ctx.translate(headX, headY);

    // Crânio e Queixo (Volume facial unificado)
    ctx.fillStyle = P.peleProfunda;
    ctx.fillRect(-5.5, -6, 11, 11);
    ctx.fillStyle = P.peleSombra;
    ctx.fillRect(-5, -5.5, 10, 10);
    ctx.fillStyle = P.peleBase;
    ctx.fillRect(-4.5, -5, 9, 9);

    // Maxilar inferior e queixo desenhados conectando-se ao pescoço
    ctx.fillStyle = P.peleSombra;
    ctx.fillRect(-4, 3, 8, 2.5);

    // Detalhes faciais
    if (dir === 'down') {
      // Olhos expressivos
      ctx.fillStyle = P.olhosBrilho;
      ctx.fillRect(-4, -1, 3, 2);
      ctx.fillRect(1, -1, 3, 2);
      ctx.fillStyle = P.olhos;
      ctx.fillRect(-3, -1, 2, 2);
      ctx.fillRect(2, -1, 2, 2);

      // Sobrancelhas firmes
      ctx.fillStyle = P.cabeloSombra;
      ctx.fillRect(-4, -3, 3, 1);
      ctx.fillRect(1, -3, 3, 1);

      // Nariz
      ctx.fillStyle = P.peleProfunda;
      ctx.fillRect(-0.5, 1, 1.5, 2);
    } else if (dir === 'left') {
      ctx.fillStyle = P.olhosBrilho;
      ctx.fillRect(-4, -1, 3, 2);
      ctx.fillStyle = P.olhos;
      ctx.fillRect(-4, -1, 2, 2);
      ctx.fillStyle = P.cabeloSombra;
      ctx.fillRect(-4, -3, 3, 1);
      // Nariz em perfil
      ctx.fillStyle = P.peleBase;
      ctx.fillRect(-6, 0, 2, 2);
    } else if (dir === 'right') {
      ctx.fillStyle = P.olhosBrilho;
      ctx.fillRect(1, -1, 3, 2);
      ctx.fillStyle = P.olhos;
      ctx.fillRect(2, -1, 2, 2);
      ctx.fillStyle = P.cabeloSombra;
      ctx.fillRect(1, -3, 3, 1);
      ctx.fillStyle = P.peleBase;
      ctx.fillRect(4, 0, 2, 2);
    }

    // Cabelo volumoso em mechas sobrepostas
    ctx.fillStyle = P.cabeloSombra;
    ctx.fillRect(-6.5 + hairSway, -8, 13, 5);
    ctx.fillStyle = P.cabeloBase;
    ctx.fillRect(-6 + hairSway, -7.5, 12, 4);
    ctx.fillStyle = P.cabeloDestaque;
    ctx.fillRect(-5 + hairSway, -7, 8, 2.5);

    if (dir === 'down') {
      ctx.fillStyle = P.cabeloBase;
      ctx.fillRect(-6.5 + hairSway, -5, 2.5, 7);
      ctx.fillRect(4 + hairSway, -5, 2.5, 7);
      ctx.fillRect(-3 + hairSway, -5, 2.5, 2.5);
    } else if (dir === 'up') {
      ctx.fillStyle = P.cabeloSombra;
      ctx.fillRect(-6.5, -4, 13, 9);
      ctx.fillStyle = P.cabeloBase;
      ctx.fillRect(-5.5, -4, 11, 7);
      ctx.fillStyle = P.cabeloDestaque;
      ctx.fillRect(-3.5, -3, 7, 3.5);
    } else if (dir === 'left') {
      ctx.fillStyle = P.cabeloBase;
      ctx.fillRect(-3 + hairSway, -5, 2.5, 4);
      ctx.fillRect(3 + hairSway, -5, 4.5, 8);
    } else if (dir === 'right') {
      ctx.fillStyle = P.cabeloBase;
      ctx.fillRect(0.5 + hairSway, -5, 2.5, 4);
      ctx.fillRect(-7.5 + hairSway, -5, 4.5, 8);
    }

    ctx.restore();

    // -------------------------------------------------------------------------
    // 8. BRAÇO DIANTEIRO / FRONTAL (em primeiro plano)
    // -------------------------------------------------------------------------
    if (dir === 'down' || dir === 'right') {
      this.desenharBracoVolumetrico(ctx, shoulderRightX, shoulderRightY, p.armRightAngle, dir, false, P);
    } else if (dir === 'left') {
      this.desenharBracoVolumetrico(ctx, shoulderLeftX, shoulderLeftY, p.armLeftAngle, dir, true, P);
    }

    // -------------------------------------------------------------------------
    // 9. A LÂMINA DE ELDRIM
    // -------------------------------------------------------------------------
    if (p.swordState !== 'dropped') {
      this.desenharEspadaEldrim(
        ctx,
        chestX + (dir === 'left' ? -10 : 8),
        chestY + 4,
        p.swordState,
        p.swordAngle || 0,
        dir,
        P
      );
    }
  }

  // ===========================================================================
  // SUB-MÓDULO: PERNA VOLUMÉTRICA COM ARTICULAÇÃO CONTÍNUA E BOTAS DE CONTATO
  // Elimina aparência de palito/graveto.
  // Continuidade: QUADRIL -> COXA -> JOELHO -> PANTURRILHA -> TORNOZELO -> PÉ
  // ===========================================================================
  private static desenharPernaVolumetrica(
    ctx: CanvasRenderingContext2D,
    hipJointX: number,
    hipJointY: number,
    hipAngle: number,
    kneeBend: number,
    groundY: number,
    dir: 'down' | 'up' | 'left' | 'right',
    isLeft: boolean,
    P: typeof RenV8Atlas.PALETA
  ): void {
    ctx.save();
    // Ponto de ancoragem dentro da bacia
    ctx.translate(hipJointX, hipJointY);
    ctx.rotate(hipAngle);

    // 1. COXA (Volume muscular com largura de 8px e vinco de tecido)
    // Inicia em y = -2 para penetrar profundamente sob a túnica (zero gap)
    ctx.fillStyle = P.calcaSombra;
    ctx.beginPath();
    ctx.moveTo(-4.5, -2);
    ctx.lineTo(4.5, -2);
    ctx.lineTo(3.8, 9);
    ctx.lineTo(-3.8, 9);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = P.calcaBase;
    ctx.fillRect(-3.5, -1, 7, 9.5);
    ctx.fillStyle = P.calcaDestaque;
    ctx.fillRect(-2, 0, 3, 7.5);

    // 2. JOELHO ARTICULADO (Cápsula circular de 7.5px de diâmetro)
    // Transladar exatamente para a junta do joelho
    ctx.translate(0, 9);
    ctx.rotate(kneeBend);

    // Patela e dobra do joelho (cobre simultaneamente o fim da coxa e início da canela)
    ctx.fillStyle = P.calcaSombra;
    ctx.beginPath();
    ctx.arc(0, 0, 3.8, 0, Math.PI * 2);
    ctx.fill();

    // 3. PANTURRILHA E CANO DA BOTA (Com volume muscular curvo e dobras de couro)
    // A bota se inicia em y = -1 para sobrepor a junta perfeitamente
    ctx.fillStyle = P.botaSombra;
    ctx.beginPath();
    ctx.moveTo(-4, -1);
    ctx.lineTo(4, -1);
    ctx.lineTo(3.5, 9);
    ctx.lineTo(-3.5, 9);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = P.botaBase;
    ctx.fillRect(-3.2, 0, 6.4, 8.5);
    ctx.fillStyle = P.botaDestaque;
    ctx.fillRect(-1.8, 1, 2.5, 6.5);

    // Dobra superior do cano da bota com costura reforçada
    ctx.fillStyle = P.botaDobra;
    ctx.fillRect(-4.2, 0, 8.4, 2.5);

    // 4. TORNOZELO E PÉ COM ÁREA DE CONTATO FIRME NO SOLO
    // Transladar para o tornozelo (y = 8)
    ctx.translate(0, 8);

    const footFwd = dir === 'left' ? -2.5 : dir === 'right' ? 2.5 : 0;

    // Base de couro da bota (peito do pé e calcanhar)
    ctx.fillStyle = P.botaBase;
    ctx.beginPath();
    ctx.moveTo(-3.5, 0);
    ctx.lineTo(3.5, 0);
    ctx.lineTo(3.5 + footFwd, 4.5);
    ctx.lineTo(-3.5 + footFwd, 4.5);
    ctx.closePath();
    ctx.fill();

    // Solado plano de contato (10px de largura, 2px de espessura)
    ctx.fillStyle = P.botaSolado;
    ctx.fillRect(-4 + footFwd, 3.8, 8, 2);

    // Iluminação do bico da bota
    ctx.fillStyle = P.botaDestaque;
    ctx.fillRect(-2 + footFwd, 1.5, 3.5, 2);

    ctx.restore();
  }

  // ===========================================================================
  // SUB-MÓDULO: BRAÇO VOLUMÉTRICO ARTICULADO (OMBRO -> COTOVELO -> ANTEBRAÇO -> MÃO)
  // Elimina aparência de linha fina; volume consistente de membro superior
  // ===========================================================================
  private static desenharBracoVolumetrico(
    ctx: CanvasRenderingContext2D,
    shoulderX: number,
    shoulderY: number,
    armAngle: number,
    dir: 'down' | 'up' | 'left' | 'right',
    isLeft: boolean,
    P: typeof RenV8Atlas.PALETA
  ): void {
    ctx.save();
    ctx.translate(shoulderX, shoulderY);
    ctx.rotate(armAngle);

    // 1. OMBRO E BRAÇO SUPERIOR / BÍCEPS (Inicia em y = -2 dentro do torso: zero gap)
    ctx.fillStyle = P.tunicaSombra;
    ctx.fillRect(-3.5, -2, 7, 8);
    ctx.fillStyle = P.tunicaBase;
    ctx.fillRect(-3, -1.5, 6, 7);
    ctx.fillStyle = P.tunicaDestaque;
    ctx.fillRect(-1.5, -1, 2.5, 5);

    // 2. COTOVELO ARTICULADO
    ctx.translate(0, 6.5);
    ctx.fillStyle = P.bracadeiraCouro;
    ctx.beginPath();
    ctx.arc(0, 0, 3.2, 0, Math.PI * 2);
    ctx.fill();

    // 3. ANTEBRAÇO COM BRAÇADEIRA DE COURO E METAL
    ctx.fillStyle = P.bracadeiraCouro;
    ctx.fillRect(-3, -0.5, 6, 6.5);
    ctx.fillStyle = P.ombreiraMetal;
    ctx.fillRect(-2, 0.5, 4, 4.5);

    // 4. PUNHO E MÃO FECHADA / EMPUNHADURA (Zero gap com o antebraço)
    ctx.translate(0, 6);
    ctx.fillStyle = P.peleSombra;
    ctx.fillRect(-2.5, 0, 5, 4.5);
    ctx.fillStyle = P.peleBase;
    ctx.fillRect(-2, 0.5, 4, 3.5);
    // Articulações dos dedos
    ctx.fillStyle = P.peleProfunda;
    ctx.fillRect(-1.5, 2.5, 3, 1);

    ctx.restore();
  }

  // ===========================================================================
  // SUB-MÓDULO: A LÂMINA DE ELDRIM
  // ===========================================================================
  private static desenharEspadaEldrim(
    ctx: CanvasRenderingContext2D,
    handX: number,
    handY: number,
    state: 'sheathed' | 'carrying' | 'slashing',
    swordAngle: number,
    dir: 'down' | 'up' | 'left' | 'right',
    P: typeof RenV8Atlas.PALETA
  ): void {
    ctx.save();
    ctx.translate(handX, handY);

    if (state === 'sheathed') {
      ctx.rotate(dir === 'left' ? -0.5 : 0.5);
      ctx.fillStyle = P.cintoCouro;
      ctx.fillRect(-2, -6, 4, 19);
      ctx.fillStyle = P.espadaGuarda;
      ctx.fillRect(-3.5, -7, 7, 2.5);
      ctx.fillStyle = P.espadaAco;
      ctx.fillRect(-1, -11, 2, 4);
      ctx.restore();
      return;
    }

    if (state === 'carrying') {
      ctx.rotate(dir === 'left' ? -0.4 : 0.4);
      ctx.fillStyle = P.espadaAco;
      ctx.fillRect(-1.5, -17, 3, 17);
      ctx.fillStyle = P.espadaRuna;
      ctx.fillRect(-0.5, -15, 1, 11);
      ctx.fillStyle = P.espadaGuarda;
      ctx.fillRect(-4.5, 0, 9, 2.5);
      ctx.fillStyle = P.cintoCouro;
      ctx.fillRect(-1.5, 2, 3, 5);
      ctx.restore();
      return;
    }

    if (state === 'slashing') {
      ctx.rotate(swordAngle);
      ctx.fillStyle = P.espadaAco;
      ctx.fillRect(-2, -25, 4, 25);
      ctx.fillStyle = P.espadaRuna;
      ctx.fillRect(-0.5, -23, 1.5, 19);
      ctx.fillStyle = P.espadaGuarda;
      ctx.fillRect(-5.5, 0, 11, 3);
      ctx.fillStyle = P.cintoCouro;
      ctx.fillRect(-2, 2.5, 4, 6);
      ctx.restore();
      return;
    }

    ctx.restore();
  }

  // ===========================================================================
  // SUB-MÓDULO: ARCO DE CORTE DE LUZ RÚNICA TRANSLÚCIDA
  // ===========================================================================
  private static desenharArcoLuzRunica(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    dir: 'down' | 'up' | 'left' | 'right',
    progress: number
  ): void {
    ctx.save();
    ctx.translate(cx, cy);

    let startAngle = 0;
    let endAngle = Math.PI;

    if (dir === 'down') {
      startAngle = 0.1 * Math.PI;
      endAngle = 0.9 * Math.PI;
    } else if (dir === 'up') {
      startAngle = 1.1 * Math.PI;
      endAngle = 1.9 * Math.PI;
    } else if (dir === 'left') {
      startAngle = 0.6 * Math.PI;
      endAngle = 1.4 * Math.PI;
    } else if (dir === 'right') {
      startAngle = -0.4 * Math.PI;
      endAngle = 0.4 * Math.PI;
    }

    const currentEnd = startAngle + (endAngle - startAngle) * (progress / 3);

    // Rastro luminoso ciano
    ctx.strokeStyle = this.PALETA.espadaArco;
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.arc(0, 0, 22, startAngle, currentEnd);
    ctx.stroke();

    // Núcleo branco reluzente
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 22, startAngle, currentEnd);
    ctx.stroke();

    ctx.restore();
  }
}
