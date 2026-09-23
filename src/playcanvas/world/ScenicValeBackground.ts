import { GraphicsDevice, Texture } from 'playcanvas';
import { createPixelTexture } from '../rendering/GraphicsBackend';
import valeVerdejanteMasterUrl from '../../assets/images/vale_verdejante_master_1790161308513.jpg';

// =============================================================================
// ELDRIM: ECOS DO PASSADO - SCENIC VALE BACKGROUND (PLAYCANVAS ENGINE V2)
// =============================================================================
// NOVO MAPA-MESTRE UNIFICADO DO VALE VERDEJANTE:
// - Fonte visual única e integral de verdade para todo o território (2048×1152)
// - Pintura artística completa sem fatiamento, sem stitching, sem módulos separados
// - Renderizada diretamente na GPU sem interpolação destrutiva ou crop arbitrário
// =============================================================================

export class ScenicValeBackground {
  public static readonly WORLD_WIDTH = 2048;
  public static readonly WORLD_HEIGHT = 1152;

  private static masterImg: HTMLImageElement | null = null;
  private static preloadingPromise: Promise<void> | null = null;

  /**
   * Pré-carrega a nova imagem-mestre unificada do Vale Verdejante (2048×1152)
   */
  public static preloadBackdropImages(): Promise<void> {
    if (this.preloadingPromise) {
      return this.preloadingPromise;
    }

    this.preloadingPromise = new Promise((resolve) => {
      this.masterImg = new Image();
      this.masterImg.crossOrigin = 'anonymous';

      const done = () => {
        console.log('[ScenicValeBackground] Nova Imagem-Mestre carregada com sucesso (2048×1152).');
        resolve();
      };

      this.masterImg.onload = done;
      this.masterImg.onerror = (e) => {
        console.warn('[ScenicValeBackground] Aviso ao carregar vale_verdejante_master:', e);
        done();
      };

      this.masterImg.src = valeVerdejanteMasterUrl;
      if (this.masterImg.complete && this.masterImg.naturalWidth > 0) {
        done();
      }
    });

    return this.preloadingPromise;
  }

  /**
   * Gera a textura GPU para a nova imagem-mestre unificada do Vale Verdejante (2048×1152).
   * Sem crop, sem distorção e sem mosaicos procedurais sobrepostos.
   */
  public static generateUnifiedMasterBackground(device: GraphicsDevice): Texture {
    const W = this.WORLD_WIDTH;
    const H = this.WORLD_HEIGHT;

    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = true;

    const drawBackdrop = () => {
      if (this.masterImg && this.masterImg.complete && this.masterImg.naturalWidth > 0) {
        console.log('[ScenicValeBackground] Renderizando nova Imagem-Mestre real (2048×1152)...');
        ctx.drawImage(this.masterImg, 0, 0, W, H);
      } else {
        // Fallback transitório de cor do solo do vale enquanto carrega
        ctx.fillStyle = '#2c452e';
        ctx.fillRect(0, 0, W, H);
      }
    };

    drawBackdrop();

    const texture = createPixelTexture(device, canvas, false, 'valeverdejante_novo_master_map_bg');

    if (this.masterImg && !this.masterImg.complete) {
      this.masterImg.addEventListener('load', () => {
        console.log('[ScenicValeBackground] Nova Imagem-Mestre pronta assincronamente. Atualizando textura GPU...');
        ctx.clearRect(0, 0, W, H);
        ctx.drawImage(this.masterImg!, 0, 0, W, H);
        (texture as any)._levels[0] = canvas;
        texture.upload();
      });
    }

    return texture;
  }

  /**
   * Mantido para compatibilidade temporária com código legado sem ser chamado em runtime.
   */
  public static generateMasterBackground(device: GraphicsDevice): Texture {
    return this.generateUnifiedMasterBackground(device);
  }

  public static generateLesteBackground(device: GraphicsDevice): Texture {
    return this.generateUnifiedMasterBackground(device);
  }

  /**
   * Pintura procedural de cenário caso a imagem ainda não esteja carregada
   */
  private static renderProceduralPainterlyScenery(ctx: CanvasRenderingContext2D, W: number, H: number): void {
    ctx.fillStyle = '#1b3b24';
    ctx.fillRect(0, 0, W, H);

    const northGrad = ctx.createLinearGradient(0, 0, 0, 200);
    northGrad.addColorStop(0, '#132819');
    northGrad.addColorStop(1, '#1b3b24');
    ctx.fillStyle = northGrad;
    ctx.fillRect(0, 0, W, 220);

    const gladeGrad = ctx.createRadialGradient(340, 260, 40, 340, 260, 280);
    gladeGrad.addColorStop(0, '#2e633d');
    gladeGrad.addColorStop(0.6, '#244e30');
    gladeGrad.addColorStop(1, '#1b3b24');
    ctx.fillStyle = gladeGrad;
    ctx.fillRect(0, 80, W, 360);

    const sacredGlade = ctx.createRadialGradient(420, 160, 20, 420, 160, 140);
    sacredGlade.addColorStop(0, '#356d44');
    sacredGlade.addColorStop(0.7, '#244e30');
    sacredGlade.addColorStop(1, '#1b3b24');
    ctx.fillStyle = sacredGlade;
    ctx.beginPath();
    ctx.arc(420, 160, 140, 0, Math.PI * 2);
    ctx.fill();

    this.drawOrganicGrassPatches(ctx, W, H);
    this.drawOrganicTrails(ctx, W, H);
    this.drawOrganicRiver(ctx, W, H);
    this.drawWoodenBridge(ctx, 646, 292);
    this.drawGroundFloraAndRocks(ctx, W, H);
  }



  // ===========================================================================
  // MÉTODOS AUXILIARES DE PINTURA PICTÓRICA
  // ===========================================================================

  private static drawOrganicGrassPatches(ctx: CanvasRenderingContext2D, W: number, H: number): void {
    // Gerador determinístico pseudo-randômico
    let seed = 42;
    const rand = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    // 1. Manchas de relevo e musgo (elipses suaves sobrepostas)
    const mossColors = ['#1e4429', '#245232', '#2a5e3a', '#326c42', '#3d7e4e', '#48905a'];
    for (let i = 0; i < 350; i++) {
      const rx = rand() * W;
      const ry = rand() * H;
      // Evita o leito do rio (X = 580..720)
      if (rx > 575 && rx < 725) continue;

      const rw = 12 + rand() * 32;
      const rh = 8 + rand() * 20;
      const c = mossColors[Math.floor(rand() * mossColors.length)];

      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.ellipse(rx, ry, rw, rh, rand() * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Micro-lâminas de grama individuais e tufos rasteiros
    const bladeColors = ['#418854', '#4e9b63', '#5cae72', '#6ec184', '#7cd393'];
    for (let i = 0; i < 2400; i++) {
      const bx = Math.floor(rand() * W);
      const by = Math.floor(rand() * H);
      if (bx > 580 && bx < 720) continue;

      const bh = 2 + Math.floor(rand() * 4);
      ctx.fillStyle = bladeColors[Math.floor(rand() * bladeColors.length)];
      ctx.fillRect(bx, by, 1, bh);
      if (rand() > 0.5) {
        ctx.fillRect(bx + 1, by + 1, 1, bh - 1);
      }
    }

    // 3. Folhas caídas de outono no sopé de árvores e clareiras
    const leafColors = ['#ca8a04', '#d97706', '#ea580c', '#84cc16', '#65a30d'];
    for (let i = 0; i < 280; i++) {
      const lx = Math.floor(rand() * W);
      const ly = Math.floor(rand() * H);
      if (lx > 585 && lx < 715) continue;

      ctx.fillStyle = leafColors[Math.floor(rand() * leafColors.length)];
      ctx.fillRect(lx, ly, 2, 2);
      ctx.fillRect(lx + 1, ly + 1, 2, 1);
    }
  }

  private static drawOrganicTrails(ctx: CanvasRenderingContext2D, W: number, H: number): void {
    // A trilha principal vai de X=0, Y=292 (no canvas) até a ponte em X=646, Y=292
    // Com curvas orgânicas, espessura variável, bordas quebradas e terra texturizada

    // Função de centro da trilha principal:
    const getPathCenterY = (x: number) => {
      // Curvatura suave: desce ligeiramente no centro e sobe em direção à ponte
      return 292 + Math.sin(x * 0.008) * 14 + Math.cos(x * 0.015) * 8;
    };

    // 1. Faixa de terra profunda e sombra de borda
    for (let x = 0; x < 610; x += 2) {
      const cy = getPathCenterY(x);
      const halfW = 28 + Math.sin(x * 0.02) * 6 + Math.cos(x * 0.05) * 4;

      // Camada de solo escuro (bordas)
      ctx.fillStyle = '#26160d';
      ctx.fillRect(x, Math.floor(cy - halfW - 4), 3, Math.floor((halfW + 4) * 2));

      // Camada de terra batida rica (miolo)
      ctx.fillStyle = '#482a17';
      ctx.fillRect(x, Math.floor(cy - halfW), 3, Math.floor(halfW * 2));

      // Centro da trilha (mais compactada e iluminada)
      ctx.fillStyle = '#6e4428';
      ctx.fillRect(x, Math.floor(cy - halfW * 0.65), 3, Math.floor(halfW * 1.3));

      ctx.fillStyle = '#8f5c38';
      ctx.fillRect(x, Math.floor(cy - halfW * 0.35), 3, Math.floor(halfW * 0.7));

      ctx.fillStyle = '#ad754c';
      ctx.fillRect(x + 1, Math.floor(cy - 2), 2, 4);
    }

    // 2. Trilha Secundária / Ramificação Norte (em direção ao Monólito Rúnico)
    for (let y = 140; y < 300; y += 2) {
      const t = (y - 140) / 160;
      const cx = 350 + Math.sin(y * 0.03) * 12 + (1 - t) * 40;
      const halfW = 18 + Math.sin(y * 0.04) * 4;

      ctx.fillStyle = '#26160d';
      ctx.fillRect(Math.floor(cx - halfW - 3), y, Math.floor((halfW + 3) * 2), 3);

      ctx.fillStyle = '#482a17';
      ctx.fillRect(Math.floor(cx - halfW), y, Math.floor(halfW * 2), 3);

      ctx.fillStyle = '#6e4428';
      ctx.fillRect(Math.floor(cx - halfW * 0.6), y, Math.floor(halfW * 1.2), 3);

      ctx.fillStyle = '#8f5c38';
      ctx.fillRect(Math.floor(cx - halfW * 0.25), y, Math.floor(halfW * 0.5), 3);
    }

    // 3. Erosão, pedrinhas embutidas na terra e tufos invasores
    let seed = 101;
    const rand = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    // Pedrinhas cinzentas embutidas
    const pebbleColors = ['#475569', '#64748b', '#94a3b8', '#cbd5e1', '#334155'];
    for (let i = 0; i < 260; i++) {
      const px = rand() * 600;
      const cy = getPathCenterY(px);
      const py = cy + (rand() - 0.5) * 40;

      ctx.fillStyle = pebbleColors[Math.floor(rand() * pebbleColors.length)];
      ctx.fillRect(Math.floor(px), Math.floor(py), 2, 2);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(Math.floor(px), Math.floor(py + 2), 2, 1);
    }

    // Grama invadindo as bordas da trilha
    for (let i = 0; i < 400; i++) {
      const gx = rand() * 600;
      const cy = getPathCenterY(gx);
      const side = rand() > 0.5 ? 1 : -1;
      const gy = cy + side * (20 + rand() * 14);

      ctx.fillStyle = '#2a5e3a';
      ctx.fillRect(Math.floor(gx), Math.floor(gy), 2, 3);
      ctx.fillStyle = '#48905a';
      ctx.fillRect(Math.floor(gx + 1), Math.floor(gy), 1, 2);
    }
  }

  private static drawOrganicRiver(ctx: CanvasRenderingContext2D, W: number, H: number): void {
    // O rio corre verticalmente no flanco leste (X entre 590 e 710)
    // com meandros orgânicos, leito profundo, margens pedregosas e espuma

    const getRiverCenter = (y: number) => {
      return 650 + Math.sin(y * 0.012) * 18 + Math.cos(y * 0.025) * 10;
    };
    const getRiverWidth = (y: number) => {
      return 96 + Math.sin(y * 0.018) * 14;
    };

    // 1. Escavação do leito e margem úmida (terra escura e areia ribeirinha)
    for (let y = 0; y < H; y++) {
      const rc = getRiverCenter(y);
      const rw = getRiverWidth(y);
      const halfW = rw * 0.5;

      // Margem de terra encharcada / lama escura
      ctx.fillStyle = '#18100a';
      ctx.fillRect(Math.floor(rc - halfW - 10), y, Math.floor(rw + 20), 1);

      // Faixa de seixos e areia úmida
      ctx.fillStyle = '#453221';
      ctx.fillRect(Math.floor(rc - halfW - 5), y, Math.floor(rw + 10), 1);

      ctx.fillStyle = '#6b4e33';
      ctx.fillRect(Math.floor(rc - halfW - 2), y, Math.floor(rw + 4), 1);
    }

    // 2. Pintura da Água em Camadas de Profundidade
    for (let y = 0; y < H; y++) {
      const rc = getRiverCenter(y);
      const rw = getRiverWidth(y);
      const halfW = rw * 0.5;

      // Água rasa / bordas cristalinas turquesa
      ctx.fillStyle = '#0891b2';
      ctx.fillRect(Math.floor(rc - halfW), y, Math.floor(rw), 1);

      // Água média (azul cobalto)
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(Math.floor(rc - halfW * 0.8), y, Math.floor(rw * 0.8), 1);

      // Água profunda (azul safira / oceano)
      ctx.fillStyle = '#0369a1';
      ctx.fillRect(Math.floor(rc - halfW * 0.6), y, Math.floor(rw * 0.6), 1);

      // Núcleo mais fundo do canal do rio
      ctx.fillStyle = '#075985';
      ctx.fillRect(Math.floor(rc - halfW * 0.35), y, Math.floor(rw * 0.35), 1);
      ctx.fillStyle = '#0c4a6e';
      ctx.fillRect(Math.floor(rc - halfW * 0.18), y, Math.floor(rw * 0.18), 1);
    }

    // 3. Linhas de correnteza e reflexos de água cristalina
    let seed = 777;
    const rand = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    for (let y = 4; y < H - 4; y += 6) {
      const rc = getRiverCenter(y);
      const rw = getRiverWidth(y);

      // Correntes brilhantes
      const numRipples = 3 + Math.floor(rand() * 3);
      for (let r = 0; r < numRipples; r++) {
        const rx = rc - rw * 0.4 + rand() * rw * 0.8;
        const len = 8 + rand() * 22;

        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(Math.floor(rx), y, Math.floor(len), 1);

        ctx.fillStyle = '#e0f2fe';
        ctx.fillRect(Math.floor(rx + len * 0.3), y, Math.floor(len * 0.4), 1);
      }

      // Espuma batendo nas margens
      const leftEdge = rc - rw * 0.5;
      const rightEdge = rc + rw * 0.5;

      ctx.fillStyle = '#cffafe';
      ctx.fillRect(Math.floor(leftEdge), y, 3 + Math.floor(rand() * 4), 1);
      ctx.fillRect(Math.floor(rightEdge - 4), y, 3 + Math.floor(rand() * 4), 1);
    }

    // 4. Pedras e Seixos fixos no leito do rio com espuma
    const fixedRiverStones = [
      { x: 620, y: 70, r: 8 },
      { x: 675, y: 130, r: 10 },
      { x: 630, y: 380, r: 11 },
      { x: 680, y: 440, r: 9 },
      { x: 615, y: 490, r: 7 },
    ];

    for (const st of fixedRiverStones) {
      // Sombra submersa
      ctx.fillStyle = 'rgba(6, 20, 36, 0.7)';
      ctx.beginPath();
      ctx.ellipse(st.x, st.y + 4, st.r + 2, st.r * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Corpo da pedra úmida
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.ellipse(st.x, st.y, st.r, st.r * 0.7, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.ellipse(st.x, st.y - 2, st.r * 0.75, st.r * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Reflexo superior de água molhada
      ctx.fillStyle = '#64748b';
      ctx.fillRect(st.x - 3, st.y - st.r * 0.4, 6, 2);

      // Espuma branca ao redor da pedra
      ctx.fillStyle = '#f0f9ff';
      ctx.fillRect(st.x - st.r - 2, st.y + 1, 3, 2);
      ctx.fillRect(st.x + st.r, st.y + 1, 3, 2);
      ctx.fillRect(st.x - st.r * 0.5, st.y + st.r * 0.6, st.r, 1);
    }
  }

  private static drawWoodenBridge(ctx: CanvasRenderingContext2D, bx: number, by: number): void {
    // Ponte sólida de madeira (96 px de largura, 56 px de altura)
    // Sombra projetada na água abaixo da ponte
    ctx.fillStyle = 'rgba(3, 14, 26, 0.6)';
    ctx.fillRect(bx - 46, by - 24, 96, 52);

    // Vigas mestras de sustentação horizontais
    ctx.fillStyle = '#1c1008';
    ctx.fillRect(bx - 48, by - 22, 100, 6);
    ctx.fillRect(bx - 48, by + 18, 100, 6);

    ctx.fillStyle = '#362114';
    ctx.fillRect(bx - 48, by - 20, 100, 4);
    ctx.fillRect(bx - 48, by + 19, 100, 4);

    // Tablado de pranchas transversais de carvalho rústico
    for (let x = bx - 44; x < bx + 48; x += 8) {
      // Fresta entre tábuas
      ctx.fillStyle = '#140c06';
      ctx.fillRect(x - 1, by - 18, 1, 38);

      // Tábua principal
      ctx.fillStyle = (x % 16 === 0) ? '#5c3a1e' : '#6e4524';
      ctx.fillRect(x, by - 18, 7, 38);

      // Textura de veios de madeira
      ctx.fillStyle = '#82532c';
      ctx.fillRect(x + 1, by - 14, 5, 2);
      ctx.fillRect(x + 2, by, 3, 2);
      ctx.fillRect(x + 1, by + 10, 5, 2);

      // Cravos de ferro forjado
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(x + 2, by - 16, 2, 2);
      ctx.fillRect(x + 2, by + 18, 2, 2);
    }

    // Corrimão rústico de postes e cordas
    ctx.fillStyle = '#7c4d28';
    ctx.fillRect(bx - 48, by - 24, 100, 3);
    ctx.fillRect(bx - 48, by + 23, 100, 3);

    for (let px = bx - 44; px < bx + 48; px += 16) {
      ctx.fillStyle = '#3d2413';
      ctx.fillRect(px, by - 27, 4, 7);
      ctx.fillRect(px, by + 22, 4, 7);

      ctx.fillStyle = '#a16207';
      ctx.fillRect(px + 1, by - 26, 2, 5);
      ctx.fillRect(px + 1, by + 23, 2, 5);
    }

    // Musgo verde nas bordas úmidas da ponte
    ctx.fillStyle = '#22543d';
    ctx.fillRect(bx - 36, by - 19, 16, 3);
    ctx.fillRect(bx + 18, by + 17, 18, 3);
  }

  private static drawGroundFloraAndRocks(ctx: CanvasRenderingContext2D, W: number, H: number): void {
    let seed = 999;
    const rand = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    // 1. Tufos de Flores Silvestres (Azuis, Amarelas, Carmesins, Lavandas e Brancas)
    for (let i = 0; i < 90; i++) {
      const fx = Math.floor(rand() * W);
      const fy = Math.floor(rand() * H);
      if (fx > 580 && fx < 720) continue; // Fora do rio

      // Haste verde
      ctx.fillStyle = '#166534';
      ctx.fillRect(fx, fy + 2, 1, 4);
      ctx.fillRect(fx + 2, fy + 3, 1, 3);

      // Pétalas coloridas
      const flowerType = Math.floor(rand() * 5);
      if (flowerType === 0) {
        // Flor Azul Celeste
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(fx - 1, fy, 3, 3);
        ctx.fillStyle = '#7dd3fc';
        ctx.fillRect(fx, fy + 1, 1, 1);
      } else if (flowerType === 1) {
        // Flor Amarela / Dourada
        ctx.fillStyle = '#d97706';
        ctx.fillRect(fx - 1, fy, 3, 3);
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(fx, fy + 1, 1, 1);
      } else if (flowerType === 2) {
        // Flor Carmesim
        ctx.fillStyle = '#e11d48';
        ctx.fillRect(fx - 1, fy, 3, 3);
        ctx.fillStyle = '#fda4af';
        ctx.fillRect(fx, fy + 1, 1, 1);
      } else if (flowerType === 3) {
        // Lavanda Rúnica
        ctx.fillStyle = '#7c3aed';
        ctx.fillRect(fx, fy - 2, 2, 5);
        ctx.fillStyle = '#c4b5fd';
        ctx.fillRect(fx, fy - 1, 1, 2);
      } else {
        // Margarida Branca
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(fx - 1, fy, 3, 3);
        ctx.fillStyle = '#eab308';
        ctx.fillRect(fx, fy + 1, 1, 1);
      }
    }

    // 2. Colônias de Cogumelos da Floresta em áreas sombreadas
    for (let i = 0; i < 35; i++) {
      const mx = Math.floor(rand() * W);
      const my = Math.floor(rand() * H);
      if (mx > 580 && mx < 720) continue;

      // Haste
      ctx.fillStyle = '#d6d3d1';
      ctx.fillRect(mx + 1, my + 3, 2, 3);
      // Chapéu vermelho com pontinhos brancos
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(mx - 1, my, 6, 3);
      ctx.fillRect(mx, my - 1, 4, 1);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(mx, my + 1, 1, 1);
      ctx.fillRect(mx + 3, my, 1, 1);
    }

    // 3. Rochas Naturais Embutidas no relevo (com musgo no topo)
    const naturalRocks = [
      { x: 120, y: 160, w: 24, h: 16 },
      { x: 260, y: 80, w: 28, h: 18 },
      { x: 490, y: 120, w: 32, h: 20 },
      { x: 180, y: 380, w: 26, h: 16 },
      { x: 390, y: 440, w: 30, h: 18 },
      { x: 530, y: 360, w: 24, h: 15 },
    ];

    for (const r of naturalRocks) {
      // Sombra
      ctx.fillStyle = 'rgba(10, 20, 15, 0.65)';
      ctx.beginPath();
      ctx.ellipse(r.x, r.y + r.h * 0.4, r.w * 0.6, r.h * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();

      // Rocha facetada
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.moveTo(r.x - r.w * 0.5, r.y + r.h * 0.3);
      ctx.lineTo(r.x - r.w * 0.3, r.y - r.h * 0.4);
      ctx.lineTo(r.x + r.w * 0.2, r.y - r.h * 0.5);
      ctx.lineTo(r.x + r.w * 0.5, r.y + r.h * 0.2);
      ctx.lineTo(r.x + r.w * 0.2, r.y + r.h * 0.5);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.moveTo(r.x - r.w * 0.3, r.y + r.h * 0.2);
      ctx.lineTo(r.x - r.w * 0.2, r.y - r.h * 0.3);
      ctx.lineTo(r.x + r.w * 0.2, r.y - r.h * 0.4);
      ctx.lineTo(r.x + r.w * 0.35, r.y + r.h * 0.1);
      ctx.closePath();
      ctx.fill();

      // Musgo no topo da rocha
      ctx.fillStyle = '#22543d';
      ctx.fillRect(r.x - r.w * 0.2, r.y - r.h * 0.4, r.w * 0.4, 3);
      ctx.fillStyle = '#38a169';
      ctx.fillRect(r.x - r.w * 0.1, r.y - r.h * 0.45, r.w * 0.25, 2);
    }
  }
}
