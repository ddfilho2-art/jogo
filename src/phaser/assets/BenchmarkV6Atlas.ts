import Phaser from 'phaser';

// =============================================================================
// ELDRIM: ECOS DO PASSADO - BENCHMARK V6 ATLAS (DIRETIVA V6 DEFINITIVA)
// =============================================================================
// Gera e processa os assets visuais de alta densidade em Pixel Art HD:
// - Spritesheet de Ren V6 com anatomia orgânica, roupa em camadas, espada e acessórios
// - 2 Árvores grandes orgânicas com troncos retorcidos, raízes expostas e copa multicamadas
// - 3 Árvores médias com formas assimétricas naturais
// - Rochas 3D facetadas com fendas e musgo (grandes e pequenas)
// - Arbustos volumosos com folhagem pontilhada e bagas
// - Vegetação rasteira, flores silvestres e folhas caídas
// - Sombras projetadas direcionais suaves e sombra elíptica de contato
// - Elementos de primeiro plano (foreground canopy)
// - Raios de sol volumétricos (sunbeams) e reflexos animados de água
// =============================================================================

export class BenchmarkV6Atlas {
  /**
   * Processa e registra todas as texturas do benchmark V6
   */
  static gerarAssetsBenchmark(scene: Phaser.Scene): void {
    this.gerarSpritesheetRenV6(scene);
    this.gerarSombrasDirecionais(scene);
    this.gerarArvoresOrganicas(scene);
    this.gerarRochas3D(scene);
    this.gerarVegetacaoEDetalhes(scene);
    this.gerarAguaEReflexos(scene);
    this.gerarElementosPrimeiroPlano(scene);
    this.gerarEfeitosAtmosfericos(scene);
  }

  // ===========================================================================
  // 1. REN V6 - SPRITESHEET COM ANATOMIA ORGÂNICA E ANIMAÇÃO FLUIDA
  // ===========================================================================
  // Dimensões do frame: 48×64 pixels.
  // Frames:
  // - 0..3: Idle (Down, Up, Left, Right) com respiração e ondulação de cabelo
  // - 4..7: Walk Down (4 frames com passo, braços, balanço de espada)
  // - 8..11: Walk Up (4 frames)
  // - 12..15: Walk Left (4 frames)
  // - 16..19: Walk Right (4 frames)
  // - 20..23: Attack Down (4 frames com antecipação, arco de corte e recuperação)
  // - 24..27: Attack Up (4 frames)
  // - 28..31: Attack Left (4 frames)
  // - 32..35: Attack Right (4 frames)
  // - 36..41: Charged Spin Attack (6 frames)
  // - 42..45: Dodge Down (4 frames de rolamento tático)
  // - 46..49: Dodge Up
  // - 50..53: Dodge Left
  // - 54..57: Dodge Right
  // - 58..65: Hurt (4 direções × 2 frames com recuo)
  // - 66..71: Death (6 frames)
  // ===========================================================================
  private static gerarSpritesheetRenV6(scene: Phaser.Scene): void {
    if (scene.textures.exists('ren_spritesheet_v6')) return;

    const FRAME_W = 48;
    const FRAME_H = 64;
    const TOTAL_FRAMES = 72;

    const canvas = document.createElement('canvas');
    canvas.width = FRAME_W * TOTAL_FRAMES;
    canvas.height = FRAME_H;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;

    for (let f = 0; f < TOTAL_FRAMES; f++) {
      const ox = f * FRAME_W;
      this.desenharFrameRenV6(ctx, ox, 0, f);
    }

    scene.textures.addSpriteSheet('ren_spritesheet_v6', canvas as unknown as HTMLImageElement, {
      frameWidth: FRAME_W,
      frameHeight: FRAME_H,
    });
  }

  private static desenharFrameRenV6(
    ctx: CanvasRenderingContext2D,
    ox: number,
    oy: number,
    f: number
  ): void {
    // Cores canônicas detalhadas em múltiplos tons
    const C_PELE = '#f6d6bd';
    const C_PELE_SOMBRA = '#db9e7b';
    const C_PELE_LUZ = '#fff0e5';
    const C_CABELO_ESCURO = '#24140b';
    const C_CABELO_MEIO = '#4a2817';
    const C_CABELO_LUZ = '#703e26';
    const C_OLHO_PUPILA = '#150c07';
    const C_OLHO_BRANCO = '#ffffff';

    const C_TUNICA_BASE = '#b93922';
    const C_TUNICA_LUZ = '#dc492e';
    const C_TUNICA_SOMBRA = '#7a1f11';
    const C_TUNICA_DOBRA = '#5c1409';

    const C_BROCHE_OURO = '#facc15';
    const C_BROCHE_LUZ = '#fef08a';
    const C_BROCHE_SOMBRA = '#b45309';

    const C_CINTO_COURO = '#382216';
    const C_CINTO_LUZ = '#573724';
    const C_FIVELA = '#eab308';

    const C_CALCA_BASE = '#251b14';
    const C_CALCA_SOMBRA = '#17100b';

    const C_BOTA_BASE = '#1e140d';
    const C_BOTA_CANO = '#3b2416';
    const C_BOTA_SOLA = '#0f0a06';

    const C_ESPADA_ACO = '#e2e8f0';
    const C_ESPADA_BRILHO = '#ffffff';
    const C_ESPADA_SOMBRA = '#94a3b8';
    const C_GUARDA_OURO = '#d97706';

    // Determinar categoria do frame
    let anim = 'idle';
    let dir: 'down' | 'up' | 'left' | 'right' = 'down';
    let step = 0;

    if (f >= 0 && f <= 3) {
      anim = 'idle';
      dir = f === 0 ? 'down' : f === 1 ? 'up' : f === 2 ? 'left' : 'right';
      step = 0;
    } else if (f >= 4 && f <= 19) {
      anim = 'walk';
      const off = f - 4;
      const dirs: Array<'down' | 'up' | 'left' | 'right'> = ['down', 'up', 'left', 'right'];
      dir = dirs[Math.floor(off / 4)];
      step = off % 4;
    } else if (f >= 20 && f <= 35) {
      anim = 'attack';
      const off = f - 20;
      const dirs: Array<'down' | 'up' | 'left' | 'right'> = ['down', 'up', 'left', 'right'];
      dir = dirs[Math.floor(off / 4)];
      step = off % 4;
    } else if (f >= 36 && f <= 41) {
      anim = 'charged';
      dir = 'down';
      step = f - 36;
    } else if (f >= 42 && f <= 57) {
      anim = 'dodge';
      const off = f - 42;
      const dirs: Array<'down' | 'up' | 'left' | 'right'> = ['down', 'up', 'left', 'right'];
      dir = dirs[Math.floor(off / 4)];
      step = off % 4;
    } else if (f >= 58 && f <= 65) {
      anim = 'hurt';
      const off = f - 58;
      const dirs: Array<'down' | 'up' | 'left' | 'right'> = ['down', 'up', 'left', 'right'];
      dir = dirs[Math.floor(off / 2)];
      step = off % 2;
    } else {
      anim = 'death';
      step = f - 66;
    }

    // Ponto central do frame (24, 38)
    const cx = 24;
    let cy = 34;

    // Deslocamentos dinâmicos de ciclo de caminhada
    let legL_y = 0;
    let legR_y = 0;
    let legL_x = 0;
    let legR_x = 0;
    let armL_y = 0;
    let armR_y = 0;
    let armL_x = 0;
    let armR_x = 0;
    let torsoBob = 0;
    let hairSway = 0;
    let swordTilt = 0;

    if (anim === 'walk') {
      if (step === 0) {
        legL_y = -3; legL_x = -1; legR_y = 2; legR_x = 1;
        armL_y = 2; armR_y = -2;
        torsoBob = 0; hairSway = 1; swordTilt = -1;
      } else if (step === 1) {
        legL_y = 0; legR_y = 0;
        armL_y = 0; armR_y = 0;
        torsoBob = -1; hairSway = 0; swordTilt = 0;
      } else if (step === 2) {
        legL_y = 2; legL_x = 1; legR_y = -3; legR_x = -1;
        armL_y = -2; armR_y = 2;
        torsoBob = 0; hairSway = -1; swordTilt = 1;
      } else if (step === 3) {
        legL_y = 0; legR_y = 0;
        armL_y = 0; armR_y = 0;
        torsoBob = -1; hairSway = 0; swordTilt = 0;
      }
    } else if (anim === 'idle') {
      torsoBob = (f % 2 === 0) ? 0 : -1;
    } else if (anim === 'hurt') {
      torsoBob = step === 0 ? -2 : 1;
    }

    cy += torsoBob;

    // 1. ESPADA NAS COSTAS (desenhada atrás do corpo quando virado para frente/lados)
    if (dir !== 'up' && anim !== 'death') {
      const swX = ox + cx + (dir === 'left' ? 6 : dir === 'right' ? -6 : 5) + swordTilt;
      const swY = oy + cy - 14;

      ctx.fillStyle = C_GUARDA_OURO;
      ctx.fillRect(swX - 3, swY + 14, 7, 2);
      ctx.fillRect(swX - 1, swY + 16, 3, 4);

      ctx.fillStyle = C_ESPADA_ACO;
      ctx.fillRect(swX - 1, swY, 3, 14);
      ctx.fillStyle = C_ESPADA_BRILHO;
      ctx.fillRect(swX, swY, 1, 14);
      ctx.fillStyle = C_ESPADA_SOMBRA;
      ctx.fillRect(swX - 1, swY + 1, 1, 13);
    }

    // 2. PERNAS E BOTAS (Camada de base)
    const pernaY = oy + cy + 12;
    if (anim !== 'death') {
      if (dir === 'down' || dir === 'up') {
        // Perna Esquerda
        ctx.fillStyle = C_CALCA_BASE;
        ctx.fillRect(ox + cx - 6 + legL_x, pernaY + legL_y, 4, 6);
        ctx.fillStyle = C_CALCA_SOMBRA;
        ctx.fillRect(ox + cx - 3 + legL_x, pernaY + legL_y, 1, 6);

        // Bota Esquerda
        ctx.fillStyle = C_BOTA_CANO;
        ctx.fillRect(ox + cx - 7 + legL_x, pernaY + 5 + legL_y, 5, 4);
        ctx.fillStyle = C_BOTA_BASE;
        ctx.fillRect(ox + cx - 7 + legL_x, pernaY + 8 + legL_y, 5, 3);
        ctx.fillStyle = C_BOTA_SOLA;
        ctx.fillRect(ox + cx - 8 + legL_x, pernaY + 10 + legL_y, 6, 2);

        // Perna Direita
        ctx.fillStyle = C_CALCA_BASE;
        ctx.fillRect(ox + cx + 2 + legR_x, pernaY + legR_y, 4, 6);
        ctx.fillStyle = C_CALCA_SOMBRA;
        ctx.fillRect(ox + cx + 2 + legR_x, pernaY + legR_y, 1, 6);

        // Bota Direita
        ctx.fillStyle = C_BOTA_CANO;
        ctx.fillRect(ox + cx + 2 + legR_x, pernaY + 5 + legR_y, 5, 4);
        ctx.fillStyle = C_BOTA_BASE;
        ctx.fillRect(ox + cx + 2 + legR_x, pernaY + 8 + legR_y, 5, 3);
        ctx.fillStyle = C_BOTA_SOLA;
        ctx.fillRect(ox + cx + 2 + legR_x, pernaY + 10 + legR_y, 6, 2);
      } else {
        // Perfil Lateral
        const flip = dir === 'left' ? -1 : 1;
        ctx.fillStyle = C_CALCA_BASE;
        ctx.fillRect(ox + cx - 3, pernaY + legL_y, 6, 6);
        ctx.fillStyle = C_BOTA_CANO;
        ctx.fillRect(ox + cx - 4 + flip * legL_x, pernaY + 5 + legL_y, 7, 4);
        ctx.fillStyle = C_BOTA_BASE;
        ctx.fillRect(ox + cx - 5 + flip * legL_x, pernaY + 8 + legL_y, 8, 3);
        ctx.fillStyle = C_BOTA_SOLA;
        ctx.fillRect(ox + cx - 6 + flip * legL_x, pernaY + 10 + legL_y, 9, 2);
      }
    }

    // 3. TRONCO E TÚNICA TERRICOTA EM CAMADAS
    const troncoY = oy + cy;
    if (anim !== 'death') {
      ctx.fillStyle = C_TUNICA_SOMBRA;
      ctx.fillRect(ox + cx - 7, troncoY, 14, 13);

      ctx.fillStyle = C_TUNICA_BASE;
      ctx.fillRect(ox + cx - 6, troncoY, 12, 12);

      // Dobras e luz da túnica
      ctx.fillStyle = C_TUNICA_LUZ;
      ctx.fillRect(ox + cx - 5, troncoY + 1, 4, 8);
      ctx.fillStyle = C_TUNICA_DOBRA;
      ctx.fillRect(ox + cx + 2, troncoY + 3, 1, 7);

      // Cinto de couro
      ctx.fillStyle = C_CINTO_COURO;
      ctx.fillRect(ox + cx - 7, troncoY + 8, 14, 3);
      ctx.fillStyle = C_CINTO_LUZ;
      ctx.fillRect(ox + cx - 6, troncoY + 8, 12, 1);

      // Fivela de latão e broche de ouro em losango
      if (dir === 'down') {
        ctx.fillStyle = C_FIVELA;
        ctx.fillRect(ox + cx - 2, troncoY + 8, 4, 3);
        ctx.fillStyle = C_BROCHE_OURO;
        ctx.beginPath();
        ctx.moveTo(ox + cx, troncoY + 2);
        ctx.lineTo(ox + cx + 3, troncoY + 5);
        ctx.lineTo(ox + cx, troncoY + 8);
        ctx.lineTo(ox + cx - 3, troncoY + 5);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = C_BROCHE_LUZ;
        ctx.fillRect(ox + cx - 1, troncoY + 4, 2, 2);
      } else if (dir === 'left' || dir === 'right') {
        const fX = dir === 'left' ? -2 : 1;
        ctx.fillStyle = C_FIVELA;
        ctx.fillRect(ox + cx + fX, troncoY + 8, 2, 3);
        ctx.fillStyle = C_BROCHE_OURO;
        ctx.fillRect(ox + cx + fX, troncoY + 4, 2, 3);
      }
    }

    // 4. BRAÇOS E MÃOS
    if (anim !== 'death') {
      const bracoY = oy + cy + 1;
      if (dir === 'down') {
        // Braço Esquerdo
        ctx.fillStyle = C_TUNICA_BASE;
        ctx.fillRect(ox + cx - 9, bracoY + armL_y, 3, 7);
        ctx.fillStyle = C_PELE;
        ctx.fillRect(ox + cx - 9, bracoY + 7 + armL_y, 3, 3);

        // Braço Direito
        ctx.fillStyle = C_TUNICA_BASE;
        ctx.fillRect(ox + cx + 6, bracoY + armR_y, 3, 7);
        ctx.fillStyle = C_PELE;
        ctx.fillRect(ox + cx + 6, bracoY + 7 + armR_y, 3, 3);
      } else if (dir === 'up') {
        ctx.fillStyle = C_TUNICA_SOMBRA;
        ctx.fillRect(ox + cx - 9, bracoY + armR_y, 3, 7);
        ctx.fillRect(ox + cx + 6, bracoY + armL_y, 3, 7);
        // Espada na bainha vista de costas
        ctx.fillStyle = C_GUARDA_OURO;
        ctx.fillRect(ox + cx - 4, troncoY - 3, 8, 2);
        ctx.fillStyle = C_CINTO_COURO;
        ctx.fillRect(ox + cx - 3, troncoY - 1, 6, 12);
      } else {
        // Lateral
        const fBraco = dir === 'left' ? -7 : 4;
        ctx.fillStyle = C_TUNICA_BASE;
        ctx.fillRect(ox + cx + fBraco, bracoY + armL_y, 4, 8);
        ctx.fillStyle = C_PELE;
        ctx.fillRect(ox + cx + fBraco, bracoY + 8 + armL_y, 3, 3);
      }
    }

    // 5. CABEÇA, ROSTO LEGÍVEL E CABELO VOLUMOSO
    const cabecaY = oy + cy - 14;
    if (anim !== 'death') {
      // Pescoço
      ctx.fillStyle = C_PELE_SOMBRA;
      ctx.fillRect(ox + cx - 2, cabecaY + 11, 4, 3);

      // Base do rosto
      ctx.fillStyle = C_PELE;
      ctx.fillRect(ox + cx - 6, cabecaY + 2, 12, 10);
      ctx.fillStyle = C_PELE_SOMBRA;
      ctx.fillRect(ox + cx - 6, cabecaY + 10, 12, 2);

      // Expressão facial e olhos
      if (dir === 'down') {
        // Olho Esquerdo
        ctx.fillStyle = C_OLHO_BRANCO;
        ctx.fillRect(ox + cx - 4, cabecaY + 6, 3, 3);
        ctx.fillStyle = C_OLHO_PUPILA;
        ctx.fillRect(ox + cx - 3, cabecaY + 6, 2, 2);

        // Olho Direito
        ctx.fillStyle = C_OLHO_BRANCO;
        ctx.fillRect(ox + cx + 1, cabecaY + 6, 3, 3);
        ctx.fillStyle = C_OLHO_PUPILA;
        ctx.fillRect(ox + cx + 1, cabecaY + 6, 2, 2);

        // Nariz e boca
        ctx.fillStyle = C_PELE_SOMBRA;
        ctx.fillRect(ox + cx - 1, cabecaY + 8, 2, 1);
        ctx.fillStyle = '#b86650';
        ctx.fillRect(ox + cx - 1, cabecaY + 10, 2, 1);
      } else if (dir === 'left') {
        ctx.fillStyle = C_OLHO_BRANCO;
        ctx.fillRect(ox + cx - 5, cabecaY + 6, 3, 3);
        ctx.fillStyle = C_OLHO_PUPILA;
        ctx.fillRect(ox + cx - 5, cabecaY + 6, 2, 2);
        ctx.fillStyle = C_PELE_SOMBRA;
        ctx.fillRect(ox + cx - 6, cabecaY + 8, 2, 1);
      } else if (dir === 'right') {
        ctx.fillStyle = C_OLHO_BRANCO;
        ctx.fillRect(ox + cx + 2, cabecaY + 6, 3, 3);
        ctx.fillStyle = C_OLHO_PUPILA;
        ctx.fillRect(ox + cx + 3, cabecaY + 6, 2, 2);
        ctx.fillStyle = C_PELE_SOMBRA;
        ctx.fillRect(ox + cx + 4, cabecaY + 8, 2, 1);
      }

      // Cabelo castanho-escuro volumoso e desalinhado com mechas
      const hx = ox + cx + hairSway;
      ctx.fillStyle = C_CABELO_ESCURO;
      ctx.fillRect(hx - 8, cabecaY - 4, 16, 7);
      ctx.fillRect(hx - 9, cabecaY - 1, 18, 5);

      ctx.fillStyle = C_CABELO_MEIO;
      ctx.fillRect(hx - 7, cabecaY - 3, 14, 4);
      // Mechas de franja
      ctx.fillRect(hx - 6, cabecaY + 2, 3, 3);
      ctx.fillRect(hx - 1, cabecaY + 1, 4, 3);
      ctx.fillRect(hx + 3, cabecaY + 2, 3, 2);

      // Brilho specular do cabelo
      ctx.fillStyle = C_CABELO_LUZ;
      ctx.fillRect(hx - 4, cabecaY - 2, 6, 2);
    } else {
      // Animação de colapso no solo (Death)
      ctx.fillStyle = C_TUNICA_SOMBRA;
      ctx.fillRect(ox + cx - 12, oy + cy + 6, 24, 8);
      ctx.fillStyle = C_CABELO_ESCURO;
      ctx.fillRect(ox + cx - 14, oy + cy + 4, 10, 8);
      ctx.fillStyle = C_ESPADA_ACO;
      ctx.fillRect(ox + cx + 8, oy + cy + 8, 12, 3);
    }

    // 6. EFEITO DE CORTE DURANTE ATAQUE (Slash Arc)
    if (anim === 'attack' && step >= 1 && step <= 2) {
      ctx.fillStyle = C_ESPADA_BRILHO;
      if (dir === 'down') {
        ctx.beginPath();
        ctx.arc(ox + cx, oy + cy + 16, 18, 0.2 * Math.PI, 0.8 * Math.PI);
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#f8fafc';
        ctx.stroke();
      } else if (dir === 'right') {
        ctx.beginPath();
        ctx.arc(ox + cx + 12, oy + cy, 18, -0.3 * Math.PI, 0.3 * Math.PI);
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#f8fafc';
        ctx.stroke();
      } else if (dir === 'left') {
        ctx.beginPath();
        ctx.arc(ox + cx - 12, oy + cy, 18, 0.7 * Math.PI, 1.3 * Math.PI);
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#f8fafc';
        ctx.stroke();
      } else if (dir === 'up') {
        ctx.beginPath();
        ctx.arc(ox + cx, oy + cy - 14, 18, 1.2 * Math.PI, 1.8 * Math.PI);
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#f8fafc';
        ctx.stroke();
      }
    }
  }

  // ===========================================================================
  // 2. SOMBRAS PROJETADAS DIRECIONAIS SUAVES E ELÍPTICAS
  // ===========================================================================
  private static gerarSombrasDirecionais(scene: Phaser.Scene): void {
    // Sombra de Ren (32x16, elipse suave com gradiente)
    if (!scene.textures.exists('sombra_ren_v6')) {
      const c = document.createElement('canvas');
      c.width = 32;
      c.height = 16;
      const ctx = c.getContext('2d')!;
      const grad = ctx.createRadialGradient(16, 8, 2, 16, 8, 14);
      grad.addColorStop(0, 'rgba(8, 14, 20, 0.65)');
      grad.addColorStop(0.6, 'rgba(8, 14, 20, 0.35)');
      grad.addColorStop(1, 'rgba(8, 14, 20, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(16, 8, 14, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      scene.textures.addCanvas('sombra_ren_v6', c);
    }

    // Sombra de Árvore Grande (160x70)
    if (!scene.textures.exists('sombra_arvore_v6_grande')) {
      const c = document.createElement('canvas');
      c.width = 160;
      c.height = 70;
      const ctx = c.getContext('2d')!;
      const grad = ctx.createRadialGradient(80, 35, 10, 80, 35, 75);
      grad.addColorStop(0, 'rgba(6, 12, 18, 0.55)');
      grad.addColorStop(0.5, 'rgba(6, 12, 18, 0.30)');
      grad.addColorStop(1, 'rgba(6, 12, 18, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(80, 35, 75, 30, 0.1, 0, Math.PI * 2);
      ctx.fill();
      scene.textures.addCanvas('sombra_arvore_v6_grande', c);
    }

    // Sombra de Árvore Média (100x46)
    if (!scene.textures.exists('sombra_arvore_v6_media')) {
      const c = document.createElement('canvas');
      c.width = 100;
      c.height = 46;
      const ctx = c.getContext('2d')!;
      const grad = ctx.createRadialGradient(50, 23, 8, 50, 23, 46);
      grad.addColorStop(0, 'rgba(6, 12, 18, 0.50)');
      grad.addColorStop(0.6, 'rgba(6, 12, 18, 0.25)');
      grad.addColorStop(1, 'rgba(6, 12, 18, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(50, 23, 46, 18, 0.1, 0, Math.PI * 2);
      ctx.fill();
      scene.textures.addCanvas('sombra_arvore_v6_media', c);
    }

    // Sombra de Rocha (64x28)
    if (!scene.textures.exists('sombra_rocha_v6')) {
      const c = document.createElement('canvas');
      c.width = 64;
      c.height = 28;
      const ctx = c.getContext('2d')!;
      const grad = ctx.createRadialGradient(32, 14, 4, 32, 14, 30);
      grad.addColorStop(0, 'rgba(8, 14, 20, 0.55)');
      grad.addColorStop(0.7, 'rgba(8, 14, 20, 0.20)');
      grad.addColorStop(1, 'rgba(8, 14, 20, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(32, 14, 28, 11, 0, 0, Math.PI * 2);
      ctx.fill();
      scene.textures.addCanvas('sombra_rocha_v6', c);
    }
  }

  // ===========================================================================
  // 3. ÁRVORES ORGÂNICAS - TRONCOS RETORCIDOS, RAÍZES E COPAS MULTICAMADAS
  // ===========================================================================
  private static gerarArvoresOrganicas(scene: Phaser.Scene): void {
    // Árvore Grande 1 (Carvalho Ancestral 128×150 px)
    if (!scene.textures.exists('tree_large_v6_1')) {
      scene.textures.addCanvas('tree_large_v6_1', this.criarCanvasArvore(128, 150, 'oak'));
    }

    // Árvore Grande 2 (Freixo Silvestre 120×144 px)
    if (!scene.textures.exists('tree_large_v6_2')) {
      scene.textures.addCanvas('tree_large_v6_2', this.criarCanvasArvore(120, 144, 'ash'));
    }

    // Árvore Média 1 (Bétula Densa 80×110 px)
    if (!scene.textures.exists('tree_med_v6_1')) {
      scene.textures.addCanvas('tree_med_v6_1', this.criarCanvasArvore(80, 110, 'birch'));
    }

    // Árvore Média 2 (Salgueiro Jovem 86×116 px)
    if (!scene.textures.exists('tree_med_v6_2')) {
      scene.textures.addCanvas('tree_med_v6_2', this.criarCanvasArvore(86, 116, 'willow'));
    }

    // Árvore Média 3 (Pinheiro da Clareira 76×106 px)
    if (!scene.textures.exists('tree_med_v6_3')) {
      scene.textures.addCanvas('tree_med_v6_3', this.criarCanvasArvore(76, 106, 'pine'));
    }
  }

  private static criarCanvasArvore(w: number, h: number, tipo: string): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;

    const cx = w / 2;
    const troncoH = h * 0.45;
    const baseTrunkY = h - 14;

    // Cores de casca
    const C_CASCA_ESCURA = '#1c130d';
    const C_CASCA_BASE = '#3d281a';
    const C_CASCA_LUZ = '#63442e';
    const C_MUSGO_TRONCO = '#2d5a27';

    // 1. RAÍZES EXPANDIDAS NO CHÃO
    ctx.fillStyle = C_CASCA_ESCURA;
    ctx.beginPath();
    ctx.moveTo(cx - 24, baseTrunkY + 8);
    ctx.quadraticCurveTo(cx - 14, baseTrunkY - 8, cx - 8, baseTrunkY - troncoH * 0.6);
    ctx.lineTo(cx + 8, baseTrunkY - troncoH * 0.6);
    ctx.quadraticCurveTo(cx + 14, baseTrunkY - 8, cx + 24, baseTrunkY + 8);
    ctx.closePath();
    ctx.fill();

    // Tronco retorcido
    ctx.fillStyle = C_CASCA_BASE;
    ctx.beginPath();
    ctx.moveTo(cx - 20, baseTrunkY + 6);
    ctx.quadraticCurveTo(cx - 10, baseTrunkY - 12, cx - 6, baseTrunkY - troncoH);
    ctx.lineTo(cx + 6, baseTrunkY - troncoH);
    ctx.quadraticCurveTo(cx + 10, baseTrunkY - 12, cx + 20, baseTrunkY + 6);
    ctx.closePath();
    ctx.fill();

    // Textura de fendas e casca
    ctx.fillStyle = C_CASCA_LUZ;
    ctx.fillRect(cx - 4, baseTrunkY - troncoH * 0.8, 2, troncoH * 0.6);
    ctx.fillRect(cx + 1, baseTrunkY - troncoH * 0.5, 2, troncoH * 0.4);

    // Manchas de musgo nas raízes
    ctx.fillStyle = C_MUSGO_TRONCO;
    ctx.fillRect(cx - 12, baseTrunkY, 5, 4);
    ctx.fillRect(cx + 8, baseTrunkY + 2, 4, 4);

    // 2. GALHOS VISÍVEIS SOB A COPA
    ctx.fillStyle = C_CASCA_ESCURA;
    ctx.beginPath();
    ctx.moveTo(cx - 6, baseTrunkY - troncoH + 10);
    ctx.lineTo(cx - 26, baseTrunkY - troncoH - 12);
    ctx.lineTo(cx - 20, baseTrunkY - troncoH - 16);
    ctx.lineTo(cx, baseTrunkY - troncoH);
    ctx.lineTo(cx + 20, baseTrunkY - troncoH - 16);
    ctx.lineTo(cx + 26, baseTrunkY - troncoH - 12);
    ctx.lineTo(cx + 6, baseTrunkY - troncoH + 10);
    ctx.closePath();
    ctx.fill();

    // 3. COPA ASSIMÉTRICA MULTICAMADAS COM AGRUPAMENTOS FOLIARES
    // Paleta rica de 5 tons de verde floresta e luz zenital
    const C_FOLHA_SOMBRA_PROFUNDA = '#0a2e16';
    const C_FOLHA_SOMBRA = '#144d27';
    const C_FOLHA_BASE = '#1f7a3f';
    const C_FOLHA_MEIO = '#2fa859';
    const C_FOLHA_LUZ = '#5bd886';
    const C_FOLHA_DESTAQUE = '#a3f3be';

    // Agrupamentos foliares em elipses orgânicas sobrepostas
    const clusters = [
      // Fundo e base da copa
      { x: cx, y: h * 0.38, rx: w * 0.44, ry: h * 0.30, cor: C_FOLHA_SOMBRA_PROFUNDA },
      { x: cx - w * 0.16, y: h * 0.40, rx: w * 0.28, ry: h * 0.24, cor: C_FOLHA_SOMBRA },
      { x: cx + w * 0.18, y: h * 0.42, rx: w * 0.26, ry: h * 0.22, cor: C_FOLHA_SOMBRA },

      // Meio da copa
      { x: cx - w * 0.08, y: h * 0.32, rx: w * 0.38, ry: h * 0.26, cor: C_FOLHA_BASE },
      { x: cx + w * 0.10, y: h * 0.30, rx: w * 0.34, ry: h * 0.24, cor: C_FOLHA_BASE },
      { x: cx, y: h * 0.22, rx: w * 0.32, ry: h * 0.22, cor: C_FOLHA_MEIO },

      // Iluminação zenital superior
      { x: cx - w * 0.12, y: h * 0.20, rx: w * 0.22, ry: h * 0.16, cor: C_FOLHA_LUZ },
      { x: cx + w * 0.06, y: h * 0.18, rx: w * 0.24, ry: h * 0.16, cor: C_FOLHA_LUZ },
      { x: cx - w * 0.04, y: h * 0.14, rx: w * 0.14, ry: h * 0.10, cor: C_FOLHA_DESTAQUE },
    ];

    for (const cl of clusters) {
      ctx.fillStyle = cl.cor;
      ctx.beginPath();
      ctx.ellipse(cl.x, cl.y, cl.rx, cl.ry, 0, 0, Math.PI * 2);
      ctx.fill();

      // Pontilhados de folhagem para textura pixel art na borda
      for (let i = 0; i < 18; i++) {
        const ang = Math.random() * Math.PI * 2;
        const radX = cl.rx * (0.85 + Math.random() * 0.25);
        const radY = cl.ry * (0.85 + Math.random() * 0.25);
        const px = cl.x + Math.cos(ang) * radX;
        const py = cl.y + Math.sin(ang) * radY;
        ctx.fillRect(px, py, 3, 3);
      }
    }

    return canvas;
  }

  // ===========================================================================
  // 4. ROCHAS 3D COM FACETAS ANGULARES, RACHADURAS E MUSGO
  // ===========================================================================
  private static gerarRochas3D(scene: Phaser.Scene): void {
    // Rocha Grande 1 (56×36 px)
    if (!scene.textures.exists('rock_large_v6_1')) {
      const c = document.createElement('canvas');
      c.width = 56; c.height = 36;
      const ctx = c.getContext('2d')!;
      this.desenharRochaFacetada(ctx, 28, 20, 24, 13);
      scene.textures.addCanvas('rock_large_v6_1', c);
    }

    // Rocha Grande 2 (48×32 px)
    if (!scene.textures.exists('rock_large_v6_2')) {
      const c = document.createElement('canvas');
      c.width = 48; c.height = 32;
      const ctx = c.getContext('2d')!;
      this.desenharRochaFacetada(ctx, 24, 18, 20, 11);
      scene.textures.addCanvas('rock_large_v6_2', c);
    }

    // Rocha Pequena 1 (24×16 px)
    if (!scene.textures.exists('rock_small_v6_1')) {
      const c = document.createElement('canvas');
      c.width = 24; c.height = 16;
      const ctx = c.getContext('2d')!;
      this.desenharRochaFacetada(ctx, 12, 9, 10, 5);
      scene.textures.addCanvas('rock_small_v6_1', c);
    }

    // Rocha Pequena 2 (20×14 px)
    if (!scene.textures.exists('rock_small_v6_2')) {
      const c = document.createElement('canvas');
      c.width = 20; c.height = 14;
      const ctx = c.getContext('2d')!;
      this.desenharRochaFacetada(ctx, 10, 8, 8, 4);
      scene.textures.addCanvas('rock_small_v6_2', c);
    }
  }

  private static desenharRochaFacetada(
    ctx: CanvasRenderingContext2D,
    cx: number, cy: number, rx: number, ry: number
  ): void {
    const C_ROCHA_SOMBRA = '#2d333b';
    const C_ROCHA_BASE = '#4a5568';
    const C_ROCHA_LUZ = '#718096';
    const C_ROCHA_BRILHO = '#a0aec0';
    const C_MUSGO = '#3b7a3a';

    // Face de sombra
    ctx.fillStyle = C_ROCHA_SOMBRA;
    ctx.beginPath();
    ctx.moveTo(cx - rx, cy + 2);
    ctx.lineTo(cx - rx * 0.4, cy + ry);
    ctx.lineTo(cx + rx * 0.7, cy + ry);
    ctx.lineTo(cx + rx, cy);
    ctx.lineTo(cx + rx * 0.2, cy - ry * 0.4);
    ctx.lineTo(cx - rx * 0.6, cy - ry * 0.2);
    ctx.closePath();
    ctx.fill();

    // Face iluminada superior
    ctx.fillStyle = C_ROCHA_BASE;
    ctx.beginPath();
    ctx.moveTo(cx - rx * 0.8, cy);
    ctx.lineTo(cx - rx * 0.2, cy - ry * 0.8);
    ctx.lineTo(cx + rx * 0.5, cy - ry * 0.6);
    ctx.lineTo(cx + rx * 0.7, cy);
    ctx.lineTo(cx, cy + ry * 0.3);
    ctx.closePath();
    ctx.fill();

    // Faceta de destaque
    ctx.fillStyle = C_ROCHA_LUZ;
    ctx.beginPath();
    ctx.moveTo(cx - rx * 0.3, cy - ry * 0.7);
    ctx.lineTo(cx + rx * 0.2, cy - ry * 0.5);
    ctx.lineTo(cx - rx * 0.1, cy);
    ctx.closePath();
    ctx.fill();

    // Fenda e aresta afiada
    ctx.strokeStyle = C_ROCHA_BRILHO;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - rx * 0.4, cy - ry * 0.6);
    ctx.lineTo(cx + rx * 0.1, cy - ry * 0.4);
    ctx.stroke();

    // Mancha de musgo
    ctx.fillStyle = C_MUSGO;
    ctx.fillRect(cx - rx * 0.3, cy + 2, 6, 3);
    ctx.fillRect(cx + rx * 0.2, cy - 2, 4, 3);
  }

  // ===========================================================================
  // 5. VEGETAÇÃO, ARBUSTOS COM BAGAS, FLORES E FOLHAS CAÍDAS
  // ===========================================================================
  private static gerarVegetacaoEDetalhes(scene: Phaser.Scene): void {
    // Arbusto com Bagas Vermelhas (40×32 px)
    if (!scene.textures.exists('bush_v6_1')) {
      const c = document.createElement('canvas');
      c.width = 40; c.height = 32;
      const ctx = c.getContext('2d')!;
      ctx.fillStyle = '#164e28';
      ctx.beginPath();
      ctx.ellipse(20, 18, 18, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#228b44';
      ctx.beginPath();
      ctx.ellipse(18, 14, 14, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#4ade80';
      ctx.fillRect(14, 10, 4, 3);
      ctx.fillRect(24, 12, 3, 3);
      // Bagas
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(12, 14, 3, 3);
      ctx.fillRect(22, 16, 3, 3);
      ctx.fillRect(16, 20, 3, 3);
      scene.textures.addCanvas('bush_v6_1', c);
    }

    // Arbusto Floral Branco (36×28 px)
    if (!scene.textures.exists('bush_v6_2')) {
      const c = document.createElement('canvas');
      c.width = 36; c.height = 28;
      const ctx = c.getContext('2d')!;
      ctx.fillStyle = '#15803d';
      ctx.beginPath();
      ctx.ellipse(18, 16, 16, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#34d399';
      ctx.fillRect(12, 10, 8, 4);
      // Flores brancas
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(10, 12, 3, 3);
      ctx.fillRect(20, 14, 3, 3);
      ctx.fillRect(24, 10, 3, 3);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(11, 13, 1, 1);
      ctx.fillRect(21, 15, 1, 1);
      scene.textures.addCanvas('bush_v6_2', c);
    }

    // Tufo de Flores Silvestres (24×20 px)
    if (!scene.textures.exists('decor_flores_v6')) {
      const c = document.createElement('canvas');
      c.width = 24; c.height = 20;
      const ctx = c.getContext('2d')!;
      ctx.fillStyle = '#166534';
      ctx.fillRect(6, 10, 2, 8);
      ctx.fillRect(12, 8, 2, 10);
      ctx.fillRect(18, 12, 2, 6);
      // Pétalas azuis e douradas
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(4, 8, 4, 4);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(10, 6, 5, 5);
      ctx.fillStyle = '#c084fc';
      ctx.fillRect(16, 10, 4, 4);
      scene.textures.addCanvas('decor_flores_v6', c);
    }

    // Folhas Caídas no Chão (28×18 px)
    if (!scene.textures.exists('folhas_chao_v6')) {
      const c = document.createElement('canvas');
      c.width = 28; c.height = 18;
      const ctx = c.getContext('2d')!;
      ctx.fillStyle = '#b45309';
      ctx.fillRect(4, 4, 3, 2);
      ctx.fillRect(16, 6, 3, 2);
      ctx.fillStyle = '#d97706';
      ctx.fillRect(10, 10, 4, 2);
      ctx.fillRect(22, 12, 3, 2);
      ctx.fillStyle = '#15803d';
      ctx.fillRect(6, 12, 3, 2);
      scene.textures.addCanvas('folhas_chao_v6', c);
    }
  }

  // ===========================================================================
  // 6. ÁGUA VIVA - ONDAS ANIMADAS, ESPUMA E REFLEXOS
  // ===========================================================================
  private static gerarAguaEReflexos(scene: Phaser.Scene): void {
    if (!scene.textures.exists('water_ripple_v6')) {
      const c = document.createElement('canvas');
      c.width = 48; c.height = 24;
      const ctx = c.getContext('2d')!;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(24, 12, 20, 8, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
      ctx.beginPath();
      ctx.ellipse(24, 12, 14, 5, 0, 0, Math.PI * 2);
      ctx.stroke();
      scene.textures.addCanvas('water_ripple_v6', c);
    }
  }

  // ===========================================================================
  // 7. ELEMENTOS EM PRIMEIRO PLANO (FOREGROUND CANOPY)
  // ===========================================================================
  private static gerarElementosPrimeiroPlano(scene: Phaser.Scene): void {
    // Galho e folhas do topo esquerdo (180×110 px)
    if (!scene.textures.exists('canopy_foreground_left_v6')) {
      const c = document.createElement('canvas');
      c.width = 180; c.height = 110;
      const ctx = c.getContext('2d')!;
      ctx.fillStyle = '#1c130d';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(80, 20, 150, 45);
      ctx.lineTo(140, 55);
      ctx.quadraticCurveTo(70, 35, 0, 15);
      ctx.closePath();
      ctx.fill();

      // Folhagem pendurada em primeiro plano com transparência suave
      const clusters = [
        { x: 40, y: 35, r: 35 },
        { x: 90, y: 55, r: 42 },
        { x: 145, y: 70, r: 32 },
        { x: 20, y: 65, r: 28 },
      ];
      for (const cl of clusters) {
        ctx.fillStyle = '#0f391b';
        ctx.beginPath();
        ctx.arc(cl.x, cl.y, cl.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#1b5e20';
        ctx.beginPath();
        ctx.arc(cl.x - 4, cl.y - 4, cl.r * 0.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#2e7d32';
        ctx.beginPath();
        ctx.arc(cl.x - 8, cl.y - 8, cl.r * 0.55, 0, Math.PI * 2);
        ctx.fill();
      }
      scene.textures.addCanvas('canopy_foreground_left_v6', c);
    }

    // Galho e folhas do topo direito (180×110 px)
    if (!scene.textures.exists('canopy_foreground_right_v6')) {
      const c = document.createElement('canvas');
      c.width = 180; c.height = 110;
      const ctx = c.getContext('2d')!;
      ctx.fillStyle = '#1c130d';
      ctx.beginPath();
      ctx.moveTo(180, 0);
      ctx.quadraticCurveTo(100, 20, 30, 45);
      ctx.lineTo(40, 55);
      ctx.quadraticCurveTo(110, 35, 180, 15);
      ctx.closePath();
      ctx.fill();

      const clusters = [
        { x: 140, y: 35, r: 35 },
        { x: 90, y: 55, r: 42 },
        { x: 35, y: 70, r: 32 },
        { x: 160, y: 65, r: 28 },
      ];
      for (const cl of clusters) {
        ctx.fillStyle = '#0f391b';
        ctx.beginPath();
        ctx.arc(cl.x, cl.y, cl.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#1b5e20';
        ctx.beginPath();
        ctx.arc(cl.x + 4, cl.y - 4, cl.r * 0.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#2e7d32';
        ctx.beginPath();
        ctx.arc(cl.x + 8, cl.y - 8, cl.r * 0.55, 0, Math.PI * 2);
        ctx.fill();
      }
      scene.textures.addCanvas('canopy_foreground_right_v6', c);
    }
  }

  // ===========================================================================
  // 8. EFEITOS ATMOSFÉRICOS E RAIOS DE SOL (SUNBEAMS)
  // ===========================================================================
  private static gerarEfeitosAtmosfericos(scene: Phaser.Scene): void {
    if (!scene.textures.exists('sunbeam_v6')) {
      const c = document.createElement('canvas');
      c.width = 240; c.height = 360;
      const ctx = c.getContext('2d')!;
      const grad = ctx.createLinearGradient(0, 0, 240, 360);
      grad.addColorStop(0, 'rgba(255, 248, 220, 0.18)');
      grad.addColorStop(0.5, 'rgba(255, 248, 220, 0.08)');
      grad.addColorStop(1, 'rgba(255, 248, 220, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(30, 0);
      ctx.lineTo(110, 0);
      ctx.lineTo(240, 360);
      ctx.lineTo(140, 360);
      ctx.closePath();
      ctx.fill();
      scene.textures.addCanvas('sunbeam_v6', c);
    }
  }
}
