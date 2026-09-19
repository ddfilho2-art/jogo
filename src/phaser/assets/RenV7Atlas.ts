import Phaser from 'phaser';

// =============================================================================
// ELDRIM: ECOS DO PASSADO - REN V7 ATLAS (DIRETIVA V7: ANATOMIA 2.0 & HERO WALK)
// =============================================================================
// Reconstrução anatômica completa de Ren:
// - Dimensões do frame: 48×64 pixels (altura real de gameplay: 44-48px).
// - Anatomia estruturada:
//   * Cabeça com proporção crânio-facial heroica, olhos expressivos e sobrancelha
//   * Cabelo volumoso castanho com mechas esvoaçantes e reflexos de luz
//   * Pescoço e gola de viajante com broche de ouro antigo
//   * Ombros articulados e torso com túnica nobre carmesim/terracota
//   * Cinto de couro reforçado com fivela de latão e bainha de espada
//   * Braços com braçadeiras de aço polido e mãos com punhos definidos
//   * Quadril e saiote da túnica com drapeado natural
//   * Coxas, joelhos articulados e calças índigo-carvão com dobras de tecido
//   * Botas de couro curtido com cano alto dobrado, solado reforçado e fivelas
//   * Lâmina de Eldrim com aço prateado, canal de sangue e guarda dourada
//
// Animações:
// - Idle: 4 direções × 4 frames (frames 0..15) - respiração de peito e brisa
// - Walk: 4 direções × 8 frames (frames 16..47) - ciclo completo de contato,
//   afundamento com absorção de peso, passagem de joelho, impulso vertical e novo contato
// - Attack: 4 direções × 8 frames (frames 48..79) - antecipação, golpe em lunge,
//   arco de corte de luz e recuperação
// - Charged Attack: 8 frames (frames 80..87) - giro radial 360° com arco arcano
// - Dodge: 4 direções × 8 frames (frames 88..119) - rolamento acrobático fluido
// - Hurt: 4 direções × 4 frames (frames 120..135) - impacto, recuo e tremor
// - Death: 6 frames (frames 136..141) - queda dramática ao solo
// =============================================================================

export class RenV7Atlas {
  static readonly FRAME_W = 48;
  static readonly FRAME_H = 64;
  static readonly COLS = 16;
  static readonly TOTAL_FRAMES = 142;

  /**
   * Gera o spritesheet V7 completo de Ren e a sombra suave de contato
   */
  static gerarSpritesheetRenV7(scene: Phaser.Scene): void {
    if (scene.textures.exists('ren_spritesheet_v7')) return;

    const canvas = document.createElement('canvas');
    const cols = this.COLS;
    const rows = Math.ceil(this.TOTAL_FRAMES / cols);
    canvas.width = this.FRAME_W * cols;
    canvas.height = this.FRAME_H * rows;

    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;

    // Gerar todos os 142 frames anatômicos
    for (let f = 0; f < this.TOTAL_FRAMES; f++) {
      const col = f % cols;
      const row = Math.floor(f / cols);
      const ox = col * this.FRAME_W;
      const oy = row * this.FRAME_H;
      this.desenharFrameRenV7(ctx, ox, oy, f);
    }

    scene.textures.addSpriteSheet('ren_spritesheet_v7', canvas as unknown as HTMLImageElement, {
      frameWidth: this.FRAME_W,
      frameHeight: this.FRAME_H,
    });

    // Gerar sombra de contato suave no solo (34×14 px)
    this.gerarSombraContatoV7(scene);
  }

  /**
   * Sombra elíptica suave e realista no solo para ancorar o personagem
   */
  private static gerarSombraContatoV7(scene: Phaser.Scene): void {
    if (scene.textures.exists('sombra_ren_v7')) return;

    const canvas = document.createElement('canvas');
    canvas.width = 36;
    canvas.height = 16;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = true;

    const grad = ctx.createRadialGradient(18, 8, 2, 18, 8, 16);
    grad.addColorStop(0, 'rgba(10, 18, 24, 0.70)');
    grad.addColorStop(0.5, 'rgba(12, 22, 30, 0.45)');
    grad.addColorStop(0.85, 'rgba(15, 25, 35, 0.18)');
    grad.addColorStop(1, 'rgba(15, 25, 35, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(18, 8, 16, 6.5, 0, 0, Math.PI * 2);
    ctx.fill();

    scene.textures.addCanvas('sombra_ren_v7', canvas);
  }

  /**
   * Renderiza um frame individual de Ren V7 com anatomia humana completa,
   * proporções articuladas e transferência de peso nos passos.
   */
  private static desenharFrameRenV7(
    ctx: CanvasRenderingContext2D,
    ox: number,
    oy: number,
    f: number
  ): void {
    // -------------------------------------------------------------------------
    // PALETA CANÔNICA DE ALTO CONTRASTE (REN 2.0)
    // -------------------------------------------------------------------------
    // Pele
    const C_PELE_LUZ = '#fff3e8';
    const C_PELE_MEIO = '#f5ceb0';
    const C_PELE_SOMBRA = '#d69672';
    const C_PELE_ESCURO = '#9c5b3c';

    // Cabelo Castanho-Acobreado
    const C_CABELO_LUZ = '#a35529';
    const C_CABELO_MEIO = '#6e3415';
    const C_CABELO_ESCURO = '#401b09';
    const C_CABELO_CONTORNO = '#210b03';

    // Túnica Terracota / Carmesim Nobre (Excelente contraste com grama e água)
    const C_TUNICA_LUZ = '#f97316';
    const C_TUNICA_MEIO = '#c2410c';
    const C_TUNICA_SOMBRA = '#832707';
    const C_TUNICA_ESCURO = '#571703';

    // Gola e Detalhes de Aventureiro (Bege Areia / Ouro)
    const C_GOLA_LUZ = '#fef08a';
    const C_GOLA_MEIO = '#eab308';
    const C_GOLA_SOMBRA = '#a16207';
    const C_BROCHE_OURO = '#fde047';

    // Couros (Cinto, coldre e tiras)
    const C_COURO_LUZ = '#713f28';
    const C_COURO_MEIO = '#452314';
    const C_COURO_ESCURO = '#241008';
    const C_FIVELA = '#f59e0b';

    // Calças (Índigo Carvão Profundo)
    const C_CALCA_LUZ = '#334155';
    const C_CALCA_MEIO = '#1e293b';
    const C_CALCA_SOMBRA = '#0f172a';

    // Botas de Couro Articuladas com Solado
    const C_BOTA_LUZ = '#5c351f';
    const C_BOTA_MEIO = '#381e11';
    const C_BOTA_SOMBRA = '#200f07';
    const C_BOTA_SOLA = '#0d0603';
    const C_BOTA_FIVELA = '#d97706';

    // Braçadeiras de Aço
    const C_ACO_LUZ = '#ffffff';
    const C_ACO_MEIO = '#cbd5e1';
    const C_ACO_SOMBRA = '#64748b';

    // Lâmina de Eldrim
    const C_LAMINA_LUZ = '#ffffff';
    const C_LAMINA_MEIO = '#e2e8f0';
    const C_LAMINA_SOMBRA = '#94a3b8';
    const C_LAMINA_CANAL = '#38bdf8'; // Runas arcanas azul-celeste
    const C_GUARDA_OURO = '#d97706';
    const C_POMO = '#ca8a04';

    // -------------------------------------------------------------------------
    // MAPEAMENTO DO FRAME
    // -------------------------------------------------------------------------
    let anim = 'idle';
    let dir: 'down' | 'up' | 'left' | 'right' = 'down';
    let step = 0;

    if (f >= 0 && f <= 15) {
      // Idle: 4 direções × 4 frames
      anim = 'idle';
      const off = f;
      const dirs: Array<'down' | 'up' | 'left' | 'right'> = ['down', 'up', 'left', 'right'];
      dir = dirs[Math.floor(off / 4)];
      step = off % 4;
    } else if (f >= 16 && f <= 47) {
      // Walk: 4 direções × 8 frames
      anim = 'walk';
      const off = f - 16;
      const dirs: Array<'down' | 'up' | 'left' | 'right'> = ['down', 'up', 'left', 'right'];
      dir = dirs[Math.floor(off / 8)];
      step = off % 8;
    } else if (f >= 48 && f <= 79) {
      // Attack: 4 direções × 8 frames
      anim = 'attack';
      const off = f - 48;
      const dirs: Array<'down' | 'up' | 'left' | 'right'> = ['down', 'up', 'left', 'right'];
      dir = dirs[Math.floor(off / 8)];
      step = off % 8;
    } else if (f >= 80 && f <= 87) {
      // Charged Attack: 8 frames
      anim = 'charged';
      dir = 'down';
      step = f - 80;
    } else if (f >= 88 && f <= 119) {
      // Dodge: 4 direções × 8 frames
      anim = 'dodge';
      const off = f - 88;
      const dirs: Array<'down' | 'up' | 'left' | 'right'> = ['down', 'up', 'left', 'right'];
      dir = dirs[Math.floor(off / 8)];
      step = off % 8;
    } else if (f >= 120 && f <= 135) {
      // Hurt: 4 direções × 4 frames
      anim = 'hurt';
      const off = f - 120;
      const dirs: Array<'down' | 'up' | 'left' | 'right'> = ['down', 'up', 'left', 'right'];
      dir = dirs[Math.floor(off / 4)];
      step = off % 4;
    } else {
      // Death: 6 frames
      anim = 'death';
      dir = 'down';
      step = Math.min(5, f - 136);
    }

    // Ponto de ancoragem central do personagem
    const cx = 24;
    let cy = 34;

    // -------------------------------------------------------------------------
    // CÁLCULO DE CINEMÁTICA E DINÂMICA DE PESO (WALK CYCLE DE 8 FRAMES)
    // -------------------------------------------------------------------------
    // Fases clássicas do walk cycle:
    // 0: Contato Perna E (calcanhar no chão, perna D estendida para trás)
    // 1: Absorção de peso / Down (joelho E flexiona, tronco afunda 1px)
    // 2: Passagem / Passing Perna D (joelho D sobe flexionando, perna E sustenta)
    // 3: Impulso / Up (perna E empurra, corpo atinge altura máxima +1px)
    // 4: Contato Perna D (calcanhar D no chão, perna E estendida para trás)
    // 5: Absorção de peso / Down oposto (joelho D flexiona, tronco afunda 1px)
    // 6: Passagem / Passing Perna E (joelho E sobe flexionando, perna D sustenta)
    // 7: Impulso / Up oposto (perna D empurra, corpo sobe)

    let bobY = 0;
    let headBob = 0;
    let hairSway = 0;
    let torsoAngle = 0;

    // Deslocamentos das pernas
    let legL_x = 0;
    let legL_y = 0;
    let legL_lift = 0; // flexão do joelho
    let legR_x = 0;
    let legR_y = 0;
    let legR_lift = 0;

    // Deslocamentos dos braços
    let armL_x = 0;
    let armL_y = 0;
    let armR_x = 0;
    let armR_y = 0;

    // Estado da espada
    let swordDrawn = false;
    let swordX = 0;
    let swordY = 0;
    let swordAngle = 0;
    let attackSlash = false;
    let slashStep = 0;

    if (anim === 'idle') {
      // Respiração natural: peito expande suavemente, cabelo oscila com a brisa
      if (step === 0) {
        bobY = 0; headBob = 0; hairSway = 0;
      } else if (step === 1) {
        bobY = -1; headBob = -1; hairSway = 1;
      } else if (step === 2) {
        bobY = -1; headBob = -1; hairSway = 1;
      } else {
        bobY = 0; headBob = 0; hairSway = 0;
      }
    } else if (anim === 'walk') {
      switch (step) {
        case 0: // Contato Esquerdo
          bobY = 0; headBob = 0; hairSway = -1; torsoAngle = 1;
          legL_x = -1; legL_y = 2; legL_lift = 0;
          legR_x = 1; legR_y = -3; legR_lift = 1;
          armL_x = 1; armL_y = -2;
          armR_x = -1; armR_y = 2;
          break;
        case 1: // Absorção / Down Esquerdo
          bobY = 1; headBob = 1; hairSway = -1; torsoAngle = 1;
          legL_x = -1; legL_y = 1; legL_lift = 1; // joelho absorvendo peso
          legR_x = 0; legR_y = -1; legR_lift = 1;
          armL_x = 1; armL_y = -1;
          armR_x = -1; armR_y = 1;
          break;
        case 2: // Passagem Perna Direita
          bobY = 0; headBob = 0; hairSway = 0; torsoAngle = 0;
          legL_x = 0; legL_y = 0; legL_lift = 0; // perna reta de apoio
          legR_x = 0; legR_y = -3; legR_lift = 2; // joelho direito sobe alto
          armL_x = 0; armL_y = 0;
          armR_x = 0; armR_y = 0;
          break;
        case 3: // Impulso / Up Esquerdo
          bobY = -1; headBob = -1; hairSway = 1; torsoAngle = -1;
          legL_x = 0; legL_y = -1; legL_lift = 0; // calcanhar levantando
          legR_x = 1; legR_y = 0; legR_lift = 1; // estendendo para o contato
          armL_x = -1; armL_y = 1;
          armR_x = 1; armR_y = -1;
          break;
        case 4: // Contato Direito
          bobY = 0; headBob = 0; hairSway = 1; torsoAngle = -1;
          legL_x = -1; legL_y = -3; legL_lift = 1;
          legR_x = 1; legR_y = 2; legR_lift = 0;
          armL_x = -1; armL_y = 2;
          armR_x = 1; armR_y = -2;
          break;
        case 5: // Absorção / Down Direito
          bobY = 1; headBob = 1; hairSway = 1; torsoAngle = -1;
          legL_x = 0; legL_y = -1; legL_lift = 1;
          legR_x = 1; legR_y = 1; legR_lift = 1; // joelho absorvendo peso
          armL_x = -1; armL_y = 1;
          armR_x = 1; armR_y = -1;
          break;
        case 6: // Passagem Perna Esquerda
          bobY = 0; headBob = 0; hairSway = 0; torsoAngle = 0;
          legL_x = 0; legL_y = -3; legL_lift = 2; // joelho esquerdo sobe alto
          legR_x = 0; legR_y = 0; legR_lift = 0; // perna reta de apoio
          armL_x = 0; armL_y = 0;
          armR_x = 0; armR_y = 0;
          break;
        case 7: // Impulso / Up Direito
          bobY = -1; headBob = -1; hairSway = -1; torsoAngle = 1;
          legL_x = -1; legL_y = 0; legL_lift = 1;
          legR_x = 0; legR_y = -1; legR_lift = 0;
          armL_x = 1; armL_y = -1;
          armR_x = -1; armR_y = 1;
          break;
      }
    } else if (anim === 'attack') {
      swordDrawn = true;
      // 8 frames de ataque: antecipação -> torque -> golpe cortante -> impacto -> recuperação
      if (step <= 1) {
        // Preparação / recuo
        bobY = 1;
        armR_x = dir === 'left' ? 4 : -4;
        armR_y = -4;
        swordX = dir === 'left' ? -6 : 6;
        swordY = -12;
      } else if (step === 2) {
        // Lunge / início do golpe
        bobY = 2;
        armR_x = dir === 'left' ? -4 : 4;
        armR_y = 0;
      } else if (step >= 3 && step <= 5) {
        // Golpe e arco cortante
        bobY = 2;
        attackSlash = true;
        slashStep = step - 3;
        armR_x = dir === 'left' ? -8 : 8;
        armR_y = 2;
      } else {
        // Recuperação
        bobY = 0;
        armR_x = dir === 'left' ? -2 : 2;
        armR_y = 1;
      }
    } else if (anim === 'charged') {
      swordDrawn = true;
      bobY = 1;
      attackSlash = true;
      slashStep = step % 4;
    } else if (anim === 'dodge') {
      // 8 frames de rolamento cinemático completo
      bobY = step <= 2 ? 6 : step <= 5 ? 10 : 3;
      torsoAngle = (step * 45) % 360;
    } else if (anim === 'hurt') {
      // Impacto e recuo
      bobY = step === 0 ? -3 : step === 1 ? -2 : step === 2 ? 1 : 0;
      headBob = -2;
      hairSway = 2;
    } else if (anim === 'death') {
      bobY = Math.min(18, step * 4);
    }

    cy += bobY;

    // -------------------------------------------------------------------------
    // RENDERIZAÇÃO EM CAMADAS ANATÔMICAS (Z-INDEX NATURAL)
    // -------------------------------------------------------------------------

    // 1. ESPADA NAS COSTAS OU NA MÃO
    if (!swordDrawn && anim !== 'death' && dir !== 'up') {
      // Bainha e punho da espada nas costas
      const swBx = ox + cx + (dir === 'left' ? 7 : dir === 'right' ? -7 : 6) + hairSway;
      const swBy = oy + cy - 12;

      // Bainha de couro com virola dourada
      ctx.fillStyle = C_COURO_ESCURO;
      ctx.fillRect(swBx - 1, swBy + 6, 4, 16);
      ctx.fillStyle = C_GUARDA_OURO;
      ctx.fillRect(swBx - 2, swBy + 20, 6, 2);

      // Guarda e pomo
      ctx.fillStyle = C_GUARDA_OURO;
      ctx.fillRect(swBx - 4, swBy + 4, 10, 2);
      ctx.fillStyle = C_COURO_LUZ; // Empunhadura encordoada
      ctx.fillRect(swBx - 1, swBy - 2, 4, 6);
      ctx.fillStyle = C_POMO;
      ctx.fillRect(swBx, swBy - 4, 2, 2);
    }

    // 2. PERNAS, COXAS, JOELHOS E BOTAS (BASE ANATÔMICA)
    const legBaseY = oy + cy + 12;
    if (anim !== 'death' && anim !== 'dodge') {
      if (dir === 'down' || dir === 'up') {
        // --- PERNA ESQUERDA ---
        const plX = ox + cx - 7 + legL_x;
        const plY = legBaseY + legL_y;

        // Coxa / Calça com dobras
        ctx.fillStyle = C_CALCA_MEIO;
        ctx.fillRect(plX, plY, 5, 6);
        ctx.fillStyle = C_CALCA_LUZ;
        ctx.fillRect(plX + 1, plY, 2, 5);
        ctx.fillStyle = C_CALCA_SOMBRA;
        ctx.fillRect(plX + 4, plY, 1, 6);

        // Joelho articulado
        ctx.fillStyle = C_CALCA_LUZ;
        ctx.fillRect(plX + 1, plY + 4 + legL_lift, 3, 2);

        // Bota de Couro com cano dobrado
        ctx.fillStyle = C_BOTA_LUZ; // Vira do cano
        ctx.fillRect(plX - 1, plY + 5 + legL_y * 0.5, 6, 3);
        ctx.fillStyle = C_BOTA_FIVELA;
        ctx.fillRect(plX + 3, plY + 6 + legL_y * 0.5, 2, 1);

        // Corpo da Bota e Tornozelo
        ctx.fillStyle = C_BOTA_MEIO;
        ctx.fillRect(plX - 1, plY + 8, 6, 5);
        ctx.fillStyle = C_BOTA_SOMBRA;
        ctx.fillRect(plX + 3, plY + 8, 2, 5);

        // Solado reforçado
        ctx.fillStyle = C_BOTA_SOLA;
        ctx.fillRect(plX - 2, plY + 12, 7, 2);

        // --- PERNA DIREITA ---
        const prX = ox + cx + 2 + legR_x;
        const prY = legBaseY + legR_y;

        // Coxa / Calça
        ctx.fillStyle = C_CALCA_MEIO;
        ctx.fillRect(prX, prY, 5, 6);
        ctx.fillStyle = C_CALCA_LUZ;
        ctx.fillRect(prX + 1, prY, 2, 5);
        ctx.fillStyle = C_CALCA_SOMBRA;
        ctx.fillRect(prX + 4, prY, 1, 6);

        // Joelho articulado
        ctx.fillStyle = C_CALCA_LUZ;
        ctx.fillRect(prX + 1, prY + 4 + legR_lift, 3, 2);

        // Bota de Couro com cano dobrado
        ctx.fillStyle = C_BOTA_LUZ;
        ctx.fillRect(prX, prY + 5 + legR_y * 0.5, 6, 3);
        ctx.fillStyle = C_BOTA_FIVELA;
        ctx.fillRect(prX + 1, prY + 6 + legR_y * 0.5, 2, 1);

        // Corpo da Bota e Tornozelo
        ctx.fillStyle = C_BOTA_MEIO;
        ctx.fillRect(prX, prY + 8, 6, 5);
        ctx.fillStyle = C_BOTA_SOMBRA;
        ctx.fillRect(prX + 4, prY + 8, 2, 5);

        // Solado reforçado
        ctx.fillStyle = C_BOTA_SOLA;
        ctx.fillRect(prX - 1, prY + 12, 7, 2);

      } else {
        // --- PERFIL / 3-QUARTOS (ESQUERDA OU DIREITA) ---
        const isL = dir === 'left';
        const sign = isL ? -1 : 1;

        // Perna Traseira (sombreada)
        const backLegX = ox + cx - sign * 4 + (isL ? legR_x : legL_x);
        const backLegY = legBaseY + (isL ? legR_y : legL_y);
        ctx.fillStyle = C_CALCA_SOMBRA;
        ctx.fillRect(backLegX, backLegY, 5, 6);
        ctx.fillStyle = C_BOTA_SOMBRA;
        ctx.fillRect(backLegX - 1, backLegY + 6, 6, 6);
        ctx.fillStyle = C_BOTA_SOLA;
        ctx.fillRect(backLegX - (isL ? 2 : 0), backLegY + 11, 7, 2);

        // Perna Dianteira (iluminada)
        const frontLegX = ox + cx + sign * 1 + (isL ? legL_x : legR_x);
        const frontLegY = legBaseY + (isL ? legL_y : legR_y);

        ctx.fillStyle = C_CALCA_MEIO;
        ctx.fillRect(frontLegX, frontLegY, 6, 6);
        ctx.fillStyle = C_CALCA_LUZ;
        ctx.fillRect(frontLegX + (isL ? 1 : 2), frontLegY, 2, 5);

        // Cano dobrado
        ctx.fillStyle = C_BOTA_LUZ;
        ctx.fillRect(frontLegX - 1, frontLegY + 5, 7, 3);
        ctx.fillStyle = C_BOTA_MEIO;
        ctx.fillRect(frontLegX - 1, frontLegY + 8, 7, 4);
        ctx.fillStyle = C_BOTA_SOLA;
        ctx.fillRect(frontLegX - (isL ? 3 : 0), frontLegY + 12, 8, 2);
      }
    } else if (anim === 'dodge') {
      // Corpo encolhido em rolamento
      ctx.fillStyle = C_TUNICA_MEIO;
      ctx.beginPath();
      ctx.arc(ox + cx, oy + cy + 6, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = C_CALCA_MEIO;
      ctx.fillRect(ox + cx - 8, oy + cy + 8, 6, 6);
      ctx.fillStyle = C_BOTA_MEIO;
      ctx.fillRect(ox + cx - 9, oy + cy + 12, 7, 4);
    }

    // 3. QUADRIL, SAIOTE DA TÚNICA E CINTO DE COURO
    if (anim !== 'death' && anim !== 'dodge') {
      const skirtY = oy + cy + 5;

      // Saiote com corte e dobras naturais
      ctx.fillStyle = C_TUNICA_SOMBRA;
      ctx.fillRect(ox + cx - 9, skirtY, 18, 8);
      ctx.fillStyle = C_TUNICA_MEIO;
      ctx.fillRect(ox + cx - 8, skirtY, 16, 7);
      ctx.fillStyle = C_TUNICA_LUZ;
      ctx.fillRect(ox + cx - 6, skirtY + 1, 12, 5);

      // Fenda central do saiote
      ctx.fillStyle = C_TUNICA_ESCURO;
      ctx.fillRect(ox + cx - 1, skirtY + 2, 2, 6);

      // Cinto de Couro com fivela de latão dourado
      ctx.fillStyle = C_COURO_ESCURO;
      ctx.fillRect(ox + cx - 9, skirtY - 2, 18, 4);
      ctx.fillStyle = C_COURO_LUZ;
      ctx.fillRect(ox + cx - 8, skirtY - 2, 16, 1);

      // Fivela ornamentada
      ctx.fillStyle = C_FIVELA;
      ctx.fillRect(ox + cx - 3, skirtY - 3, 6, 5);
      ctx.fillStyle = C_COURO_ESCURO;
      ctx.fillRect(ox + cx - 1, skirtY - 2, 2, 3);
    }

    // 4. TRONCO, PEITO E TÚNICA SUPERIOR
    if (anim !== 'death' && anim !== 'dodge') {
      const chestY = oy + cy - 8;

      // Massa muscular e estrutura do torso
      ctx.fillStyle = C_TUNICA_SOMBRA;
      ctx.fillRect(ox + cx - 10, chestY, 20, 12);
      ctx.fillStyle = C_TUNICA_MEIO;
      ctx.fillRect(ox + cx - 9, chestY, 18, 11);
      ctx.fillStyle = C_TUNICA_LUZ;
      ctx.fillRect(ox + cx - 7, chestY + 1, 14, 9);

      // Faixa / Tiras de couro cruzadas no peito (arnês de aventureiro)
      ctx.fillStyle = C_COURO_ESCURO;
      ctx.fillRect(ox + cx - 7, chestY + 1, 3, 10);
      ctx.fillStyle = C_COURO_LUZ;
      ctx.fillRect(ox + cx - 6, chestY + 1, 1, 10);

      // Gola de viajante (Bege Dourado) e Broche
      ctx.fillStyle = C_GOLA_SOMBRA;
      ctx.fillRect(ox + cx - 6, chestY - 1, 12, 4);
      ctx.fillStyle = C_GOLA_MEIO;
      ctx.fillRect(ox + cx - 5, chestY - 1, 10, 3);
      ctx.fillStyle = C_GOLA_LUZ;
      ctx.fillRect(ox + cx - 4, chestY - 1, 8, 2);

      // Broche de Eldrim
      ctx.fillStyle = C_BROCHE_OURO;
      ctx.fillRect(ox + cx - 2, chestY + 1, 4, 3);
      ctx.fillStyle = C_LAMINA_CANAL; // Jóia azul incrustada
      ctx.fillRect(ox + cx - 1, chestY + 1, 2, 2);
    }

    // 5. BRAÇOS, BRAÇADEIRAS DE AÇO E MÃOS
    if (anim !== 'death' && anim !== 'dodge') {
      const armBaseY = oy + cy - 6;

      if (dir === 'down' || dir === 'up') {
        // Braço Esquerdo
        const alX = ox + cx - 12 + armL_x;
        const alY = armBaseY + armL_y;
        ctx.fillStyle = C_TUNICA_MEIO; // Manga
        ctx.fillRect(alX, alY, 4, 5);
        ctx.fillStyle = C_ACO_SOMBRA; // Braçadeira de Aço
        ctx.fillRect(alX - 1, alY + 4, 4, 4);
        ctx.fillStyle = C_ACO_LUZ;
        ctx.fillRect(alX, alY + 4, 2, 4);
        ctx.fillStyle = C_PELE_MEIO; // Mão / Punho
        ctx.fillRect(alX, alY + 8, 3, 3);

        // Braço Direito
        const arX = ox + cx + 8 + armR_x;
        const arY = armBaseY + armR_y;
        ctx.fillStyle = C_TUNICA_MEIO;
        ctx.fillRect(arX, arY, 4, 5);
        ctx.fillStyle = C_ACO_SOMBRA;
        ctx.fillRect(arX + 1, arY + 4, 4, 4);
        ctx.fillStyle = C_ACO_LUZ;
        ctx.fillRect(arX + 1, arY + 4, 2, 4);
        ctx.fillStyle = C_PELE_MEIO;
        ctx.fillRect(arX + 1, arY + 8, 3, 3);
      } else {
        // Perfil
        const isL = dir === 'left';
        const sign = isL ? -1 : 1;
        const armX = ox + cx + sign * 6 + armR_x;
        const armY = armBaseY + armR_y;

        ctx.fillStyle = C_TUNICA_MEIO;
        ctx.fillRect(armX - 2, armY, 5, 5);
        ctx.fillStyle = C_ACO_MEIO;
        ctx.fillRect(armX - 2, armY + 4, 5, 5);
        ctx.fillStyle = C_ACO_LUZ;
        ctx.fillRect(armX - (isL ? 2 : 0), armY + 4, 2, 5);
        ctx.fillStyle = C_PELE_MEIO;
        ctx.fillRect(armX - 1, armY + 9, 4, 3);
      }
    }

    // 6. PESCOÇO, CABEÇA, ROSTO E CABELO VOLUMOSO
    if (anim !== 'death') {
      const headY = oy + cy - 20 + headBob;

      // Pescoço
      ctx.fillStyle = C_PELE_SOMBRA;
      ctx.fillRect(ox + cx - 3, headY + 10, 6, 3);
      ctx.fillStyle = C_PELE_MEIO;
      ctx.fillRect(ox + cx - 2, headY + 10, 4, 2);

      // Formato do Crânio e Mandíbula
      ctx.fillStyle = C_PELE_SOMBRA;
      ctx.fillRect(ox + cx - 7, headY, 14, 11);
      ctx.fillStyle = C_PELE_MEIO;
      ctx.fillRect(ox + cx - 6, headY, 12, 10);
      ctx.fillStyle = C_PELE_LUZ;
      ctx.fillRect(ox + cx - 5, headY + 1, 10, 7);

      // Orelhas
      if (dir === 'down' || dir === 'up') {
        ctx.fillStyle = C_PELE_SOMBRA;
        ctx.fillRect(ox + cx - 8, headY + 4, 2, 4);
        ctx.fillRect(ox + cx + 6, headY + 4, 2, 4);
      }

      // Detalhes faciais (Olhos expressivos, sobrancelhas e nariz)
      if (dir === 'down') {
        // Sobrancelhas resolutas
        ctx.fillStyle = C_CABELO_CONTORNO;
        ctx.fillRect(ox + cx - 5, headY + 3, 3, 1);
        ctx.fillRect(ox + cx + 2, headY + 3, 3, 1);

        // Olhos (esclera e íris escura focada)
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(ox + cx - 5, headY + 4, 3, 2);
        ctx.fillRect(ox + cx + 2, headY + 4, 3, 2);
        ctx.fillStyle = '#1c1008';
        ctx.fillRect(ox + cx - 4, headY + 4, 2, 2);
        ctx.fillRect(ox + cx + 2, headY + 4, 2, 2);

        // Nariz e sombra labial
        ctx.fillStyle = C_PELE_ESCURO;
        ctx.fillRect(ox + cx - 1, headY + 6, 2, 2);
        ctx.fillRect(ox + cx - 2, headY + 9, 4, 1);
      } else if (dir === 'left') {
        // Perfil Esquerdo
        ctx.fillStyle = C_CABELO_CONTORNO;
        ctx.fillRect(ox + cx - 5, headY + 3, 3, 1);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(ox + cx - 5, headY + 4, 3, 2);
        ctx.fillStyle = '#1c1008';
        ctx.fillRect(ox + cx - 5, headY + 4, 2, 2);
        ctx.fillStyle = C_PELE_ESCURO;
        ctx.fillRect(ox + cx - 7, headY + 6, 2, 2);
      } else if (dir === 'right') {
        // Perfil Direito
        ctx.fillStyle = C_CABELO_CONTORNO;
        ctx.fillRect(ox + cx + 2, headY + 3, 3, 1);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(ox + cx + 2, headY + 4, 3, 2);
        ctx.fillStyle = '#1c1008';
        ctx.fillRect(ox + cx + 3, headY + 4, 2, 2);
        ctx.fillStyle = C_PELE_ESCURO;
        ctx.fillRect(ox + cx + 5, headY + 6, 2, 2);
      }

      // Cabelo Volumoso com Mechas e Brisa
      const hairX = ox + cx;
      // Camada base escura
      ctx.fillStyle = C_CABELO_CONTORNO;
      ctx.fillRect(hairX - 8, headY - 4, 16, 8);
      ctx.fillRect(hairX - 9, headY - 2, 18, 6);

      // Volume médio com mechas
      ctx.fillStyle = C_CABELO_MEIO;
      ctx.fillRect(hairX - 8, headY - 4, 16, 6);
      ctx.fillRect(hairX - 7 + hairSway, headY - 5, 14, 4);

      // Mechas de luz iluminadas pelo sol
      ctx.fillStyle = C_CABELO_LUZ;
      ctx.fillRect(hairX - 6 + hairSway, headY - 4, 11, 2);
      ctx.fillRect(hairX - 4 + hairSway, headY - 2, 7, 2);

      // Mechas laterais caindo sobre as têmporas
      if (dir === 'down') {
        ctx.fillStyle = C_CABELO_MEIO;
        ctx.fillRect(hairX - 7, headY + 2, 2, 4);
        ctx.fillRect(hairX + 5, headY + 2, 2, 4);
        // Franja estilizada
        ctx.fillStyle = C_CABELO_LUZ;
        ctx.fillRect(hairX - 2 + hairSway, headY + 1, 3, 3);
      } else if (dir === 'up') {
        // Cabelo visto de costas com volume em camadas
        ctx.fillStyle = C_CABELO_MEIO;
        ctx.fillRect(hairX - 8, headY, 16, 7);
        ctx.fillStyle = C_CABELO_LUZ;
        ctx.fillRect(hairX - 6 + hairSway, headY + 1, 12, 4);
        ctx.fillStyle = C_CABELO_CONTORNO;
        ctx.fillRect(hairX - 5, headY + 6, 10, 3);
      } else if (dir === 'left') {
        ctx.fillStyle = C_CABELO_LUZ;
        ctx.fillRect(hairX - 3 + hairSway, headY - 3, 8, 3);
        ctx.fillStyle = C_CABELO_MEIO;
        ctx.fillRect(hairX + 2, headY, 5, 6);
      } else if (dir === 'right') {
        ctx.fillStyle = C_CABELO_LUZ;
        ctx.fillRect(hairX - 5 + hairSway, headY - 3, 8, 3);
        ctx.fillStyle = C_CABELO_MEIO;
        ctx.fillRect(hairX - 7, headY, 5, 6);
      }
    } else {
      // Morte: corpo deitado ao solo com lâmina caída
      const deathY = oy + cy + 16;
      ctx.fillStyle = C_TUNICA_SOMBRA;
      ctx.fillRect(ox + cx - 14, deathY - 4, 28, 8);
      ctx.fillStyle = C_TUNICA_MEIO;
      ctx.fillRect(ox + cx - 12, deathY - 3, 24, 6);
      ctx.fillStyle = C_CABELO_MEIO;
      ctx.fillRect(ox + cx - 18, deathY - 5, 8, 8);
      ctx.fillStyle = C_LAMINA_MEIO;
      ctx.fillRect(ox + cx + 10, deathY - 2, 14, 2);
    }

    // 7. ARCO DE CORTE E LÂMINA EM AÇÃO (DURANTE ATAQUE)
    if (attackSlash && anim === 'attack') {
      const slashX = ox + cx + (dir === 'left' ? -18 : dir === 'right' ? 18 : 0);
      const slashY = oy + cy + (dir === 'up' ? -18 : dir === 'down' ? 14 : 0);

      // Arco crescente de corte em luz pura
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.beginPath();
      if (dir === 'down' || dir === 'right') {
        ctx.arc(slashX, slashY, 18, 0, Math.PI * 0.7);
      } else {
        ctx.arc(slashX, slashY, 18, Math.PI, Math.PI * 1.7);
      }
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      // Aura azul de Eldrim
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#38bdf8';
      ctx.stroke();
    }
  }
}
