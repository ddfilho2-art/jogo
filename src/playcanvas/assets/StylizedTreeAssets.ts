import { GraphicsDevice, Texture } from 'playcanvas';
import { createPixelTexture } from '../rendering/GraphicsBackend';
import treeLargeUrl from '../../assets/images/stylized_tree_large_1789337534402.jpg';
import treeAncientUrl from '../../assets/images/stylized_tree_ancient_1789337546317.jpg';
import treeMedUrl from '../../assets/images/stylized_tree_med_1789337557613.jpg';
import treeSmallUrl from '../../assets/images/stylized_tree_small_1789337568877.jpg';

// =============================================================================
// ELDRIM: ECOS DO PASSADO - STYLIZED TREE ASSETS PIPELINE (85%+ COMPATIBILIDADE)
// =============================================================================
// Pipeline de texturas de alta fidelidade estilizada hand-painted para árvores:
// - Tronco orgânico, retorcido, com casca texturizada, fissuras e raízes expostas
// - Copa volumétrica com múltiplos clusters de folhas estilizadas e sobreposição
// - Iluminação direcional (top-left) e oclusão de sombras profundas sob cada tufo
// - Extração de canal alfa com desocultação de preto (un-premultiply) para bordas perfeitas
// - Sombras projetadas no solo com gradiente de oclusão
// =============================================================================

export interface ProcessedTreeAsset {
  texture: Texture;
  shadowTexture: Texture;
  width: number;
  height: number;
  shadowWidth: number;
  shadowHeight: number;
  pivotX: number;
  pivotY: number;
}

export class StylizedTreeAssets {
  private static imagesLoaded = false;
  private static loadPromise: Promise<void> | null = null;

  private static imgLarge: HTMLImageElement | null = null;
  private static imgAncient: HTMLImageElement | null = null;
  private static imgMed: HTMLImageElement | null = null;
  private static imgSmall: HTMLImageElement | null = null;

  public static preload(): Promise<void> {
    if (this.loadPromise) return this.loadPromise;

    this.loadPromise = new Promise((resolve) => {
      const urls = [
        { key: 'large', url: treeLargeUrl },
        { key: 'ancient', url: treeAncientUrl },
        { key: 'med', url: treeMedUrl },
        { key: 'small', url: treeSmallUrl },
      ];

      let remaining = urls.length;
      const checkDone = () => {
        remaining--;
        if (remaining <= 0) {
          this.imagesLoaded = true;
          console.log('[StylizedTreeAssets] Todas as referências de árvores estilizadas foram pré-carregadas.');
          resolve();
        }
      };

      this.imgLarge = new Image();
      this.imgLarge.crossOrigin = 'anonymous';
      this.imgLarge.onload = checkDone;
      this.imgLarge.onerror = checkDone;
      this.imgLarge.src = treeLargeUrl;

      this.imgAncient = new Image();
      this.imgAncient.crossOrigin = 'anonymous';
      this.imgAncient.onload = checkDone;
      this.imgAncient.onerror = checkDone;
      this.imgAncient.src = treeAncientUrl;

      this.imgMed = new Image();
      this.imgMed.crossOrigin = 'anonymous';
      this.imgMed.onload = checkDone;
      this.imgMed.onerror = checkDone;
      this.imgMed.src = treeMedUrl;

      this.imgSmall = new Image();
      this.imgSmall.crossOrigin = 'anonymous';
      this.imgSmall.onload = checkDone;
      this.imgSmall.onerror = checkDone;
      this.imgSmall.src = treeSmallUrl;
    });

    return this.loadPromise;
  }

  /**
   * Processa a imagem bruta com remoção de fundo por conectividade (Flood Fill / BFS),
   * preservação estrita de highlights internos e suavização de bordas sem halo.
   */
  public static processTreeImage(
    img: HTMLImageElement | null,
    targetWidth: number,
    targetHeight: number,
    name: string
  ): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = true;

    if (img && img.complete && img.naturalWidth > 0) {
      const W = img.naturalWidth;
      const H = img.naturalHeight;

      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = W;
      tempCanvas.height = H;
      const tempCtx = tempCanvas.getContext('2d')!;
      tempCtx.drawImage(img, 0, 0);

      const imgData = tempCtx.getImageData(0, 0, W, H);
      const d = imgData.data;

      // 1. ANALISAR BORDAS PARA DETECTAR A COR E TIPO DO FUNDO (Branco, Quase Branco, Preto, Quase Preto)
      let borderRSum = 0;
      let borderGSum = 0;
      let borderBSum = 0;
      let sampleCount = 0;

      const samplePixel = (x: number, y: number) => {
        const idx = (y * W + x) * 4;
        borderRSum += d[idx];
        borderGSum += d[idx + 1];
        borderBSum += d[idx + 2];
        sampleCount++;
      };

      // Amostra perímetro completo das bordas externas
      for (let x = 0; x < W; x++) {
        samplePixel(x, 0);
        samplePixel(x, H - 1);
        if (H > 2) {
          samplePixel(x, 1);
          samplePixel(x, H - 2);
        }
      }
      for (let y = 0; y < H; y++) {
        samplePixel(0, y);
        samplePixel(W - 1, y);
        if (W > 2) {
          samplePixel(1, y);
          samplePixel(W - 2, y);
        }
      }

      const avgR = borderRSum / Math.max(1, sampleCount);
      const avgG = borderGSum / Math.max(1, sampleCount);
      const avgB = borderBSum / Math.max(1, sampleCount);
      const avgBrightness = (avgR + avgG + avgB) / 3;

      const isLightBg = avgBrightness > 128;

      // 2. REGION GROWING / BFS FLOOD FILL A PARTIR DAS BORDAS EXTERNAS
      // E DETECÇÃO DE LACUNAS E VÃOS INTERNOS ENTRE GALHOS E FOLHAGENS
      const isBg = new Uint8Array(W * H);
      const queue: number[] = [];

      // Função para calcular distância euclidiana de cor ao fundo
      const getColorDiff = (r: number, g: number, b: number): number => {
        const dr = r - avgR;
        const dg = g - avgG;
        const db = b - avgB;
        return Math.sqrt(dr * dr + dg * dg + db * db);
      };

      // Tolerância adaptativa para isolar o fundo (estúdio/branco/preto) das folhas e galhos
      const tolerance = isLightBg ? 58 : 48;
      const featherBand = 16;

      const isBackgroundPixel = (x: number, y: number): boolean => {
        const idx = (y * W + x) * 4;
        const r = d[idx];
        const g = d[idx + 1];
        const b = d[idx + 2];
        const diff = getColorDiff(r, g, b);

        if (isLightBg) {
          const brightness = (r + g + b) / 3;
          const maxVal = Math.max(r, g, b);
          const minVal = Math.min(r, g, b);
          const saturation = maxVal - minVal;
          // Fundo claro: alto brilho e baixa saturação (branco/cinza de estúdio) ou muito próximo à borda
          return diff < tolerance || brightness > 225 || (brightness > 200 && saturation < 28);
        } else {
          const maxVal = Math.max(r, g, b);
          const minVal = Math.min(r, g, b);
          const saturation = maxVal - minVal;
          // Fundo escuro: baixo brilho e baixa saturação ou muito próximo à borda
          return diff < tolerance || maxVal < 32 || (maxVal < 45 && saturation < 20);
        }
      };

      // Inicializa a fila com todos os pixels de borda que pertencem ao fundo externo
      for (let x = 0; x < W; x++) {
        if (isBackgroundPixel(x, 0)) {
          isBg[0 * W + x] = 1;
          queue.push(x, 0);
        }
        if (isBackgroundPixel(x, H - 1)) {
          const idx = (H - 1) * W + x;
          if (!isBg[idx]) {
            isBg[idx] = 1;
            queue.push(x, H - 1);
          }
        }
      }

      for (let y = 0; y < H; y++) {
        if (isBackgroundPixel(0, y)) {
          const idx = y * W + 0;
          if (!isBg[idx]) {
            isBg[idx] = 1;
            queue.push(0, y);
          }
        }
        if (isBackgroundPixel(W - 1, y)) {
          const idx = y * W + (W - 1);
          if (!isBg[idx]) {
            isBg[idx] = 1;
            queue.push(W - 1, y);
          }
        }
      }

      // Executa BFS Flood Fill externo
      let head = 0;
      while (head < queue.length) {
        const cx = queue[head++];
        const cy = queue[head++];

        const neighbors = [
          [cx + 1, cy],
          [cx - 1, cy],
          [cx, cy + 1],
          [cx, cy - 1],
        ];

        for (let n = 0; n < 4; n++) {
          const nx = neighbors[n][0];
          const ny = neighbors[n][1];

          if (nx >= 0 && nx < W && ny >= 0 && ny < H) {
            const nIdx = ny * W + nx;
            if (isBg[nIdx] === 0 && isBackgroundPixel(nx, ny)) {
              isBg[nIdx] = 1;
              queue.push(nx, ny);
            }
          }
        }
      }

      // PASSO CRÍTICO: DETECÇÃO DE LACUNAS INTERNAS (vãos entre galhos e folhagens)
      // Vãos entre folhas não alcançados pelas bordas que possuem características de fundo
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const pIdx = y * W + x;
          if (isBg[pIdx] === 0 && isBackgroundPixel(x, y)) {
            // Esse pixel está no interior da árvore mas é branco/preto de fundo!
            isBg[pIdx] = 1;
          }
        }
      }

      // 3. APLICAÇÃO DE ALPHA, DESCONTAMINAÇÃO DE COR (DE-FRINGING) E REMOÇÃO TOTAL DE HALOS
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const pIdx = y * W + x;
          const bIdx = pIdx * 4;

          if (isBg[pIdx] === 1) {
            // Fundo (externo ou entre galhos): totalmente transparente e zerado
            d[bIdx + 3] = 0;
          } else {
            // Pixel de copa, tronco ou folhagem
            const r = d[bIdx];
            const g = d[bIdx + 1];
            const b = d[bIdx + 2];
            const diff = getColorDiff(r, g, b);

            // Verifica se é um pixel de transição adjacente a qualquer fundo transparente
            let isTransition = false;
            if (
              (x > 0 && isBg[pIdx - 1] === 1) ||
              (x < W - 1 && isBg[pIdx + 1] === 1) ||
              (y > 0 && isBg[pIdx - W] === 1) ||
              (y < H - 1 && isBg[pIdx + W] === 1)
            ) {
              isTransition = true;
            }

            if (isTransition && diff < tolerance + featherBand) {
              // Suavização anti-aliased na borda
              const factor = Math.max(0, Math.min(1, (diff - (tolerance - 10)) / (featherBand + 10)));
              const alpha = Math.floor(factor * 255);
              d[bIdx + 3] = Math.max(0, Math.min(255, alpha));

              // Descontaminação de cor (subtrai contaminação branca ou preta)
              if (alpha > 15 && factor > 0.05) {
                const normA = alpha / 255;
                if (isLightBg) {
                  d[bIdx] = Math.max(0, Math.min(255, Math.floor((r - (1 - normA) * avgR) / normA)));
                  d[bIdx + 1] = Math.max(0, Math.min(255, Math.floor((g - (1 - normA) * avgG) / normA)));
                  d[bIdx + 2] = Math.max(0, Math.min(255, Math.floor((b - (1 - normA) * avgB) / normA)));
                } else {
                  d[bIdx] = Math.max(0, Math.min(255, Math.floor(r / normA)));
                  d[bIdx + 1] = Math.max(0, Math.min(255, Math.floor(g / normA)));
                  d[bIdx + 2] = Math.max(0, Math.min(255, Math.floor(b / normA)));
                }
              }
            } else {
              // Sólido
              d[bIdx + 3] = 255;
            }
          }
        }
      }

      // 4. COLOR DILATION / PADDING PARA BORDAS TRANSPARENTES
      // Copia a cor da folhagem para os pixels transparentes adjacentes (com alpha=0)
      // Assim, a interpolação bilineária da GPU nunca puxará branco ou preto nas bordas
      for (let y = 1; y < H - 1; y++) {
        for (let x = 1; x < W - 1; x++) {
          const pIdx = y * W + x;
          const bIdx = pIdx * 4;
          if (d[bIdx + 3] === 0) {
            // Procura vizinho opaco
            const neighbors = [pIdx - 1, pIdx + 1, pIdx - W, pIdx + W];
            for (let k = 0; k < 4; k++) {
              const nIdx = neighbors[k] * 4;
              if (d[nIdx + 3] > 180) {
                d[bIdx] = d[nIdx];
                d[bIdx + 1] = d[nIdx + 1];
                d[bIdx + 2] = d[nIdx + 2];
                break;
              }
            }
          }
        }
      }

      tempCtx.putImageData(imgData, 0, 0);

      // 4. RECALCULAR AUTOMATICAMENTE A BOUNDING BOX USANDO APENAS PIXELS COM ALPHA SIGNIFICATIVO
      let minX = W;
      let minY = H;
      let maxX = 0;
      let maxY = 0;

      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const idx = (y * W + x) * 4;
          if (d[idx + 3] > 15) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }

      if (maxX >= minX && maxY >= minY) {
        // Margem de segurança de 2px
        minX = Math.max(0, minX - 2);
        minY = Math.max(0, minY - 2);
        maxX = Math.min(W - 1, maxX + 2);
        maxY = Math.min(H - 1, maxY + 2);

        const cropW = Math.max(1, maxX - minX + 1);
        const cropH = Math.max(1, maxY - minY + 1);

        // 5. DESENHA NO CANVAS FINAL COM ENQUADRAMENTO E ESCALA PRECISA
        ctx.drawImage(tempCanvas, minX, minY, cropW, cropH, 0, 0, targetWidth, targetHeight);
      } else {
        ctx.drawImage(tempCanvas, 0, 0, targetWidth, targetHeight);
      }
    } else {
      // Fallback artesanal de alta qualidade caso a imagem ainda não esteja disponível
      this.drawHandcraftedFallbackTree(ctx, targetWidth, targetHeight, name);
    }

    return canvas;
  }

  /**
   * Renderizador artesanal de alta qualidade para fallback procedural
   */
  private static drawHandcraftedFallbackTree(
    ctx: CanvasRenderingContext2D,
    W: number,
    H: number,
    type: string
  ): void {
    ctx.clearRect(0, 0, W, H);

    const trunkBaseX = W * 0.5;
    const trunkBaseY = H * 0.94;
    const trunkTopY = H * 0.45;

    // 1. Raízes e base musgosa
    ctx.fillStyle = '#1c120c';
    ctx.beginPath();
    ctx.moveTo(trunkBaseX - W * 0.16, trunkBaseY);
    ctx.quadraticCurveTo(trunkBaseX - W * 0.06, trunkBaseY - H * 0.1, trunkBaseX - W * 0.05, trunkTopY);
    ctx.lineTo(trunkBaseX + W * 0.05, trunkTopY);
    ctx.quadraticCurveTo(trunkBaseX + W * 0.06, trunkBaseY - H * 0.1, trunkBaseX + W * 0.16, trunkBaseY);
    ctx.closePath();
    ctx.fill();

    // Casca pintada à mão
    const barkGrad = ctx.createLinearGradient(trunkBaseX - W * 0.1, 0, trunkBaseX + W * 0.1, 0);
    barkGrad.addColorStop(0, '#2e1d13');
    barkGrad.addColorStop(0.3, '#4d3221');
    barkGrad.addColorStop(0.7, '#6b4730');
    barkGrad.addColorStop(1, '#2e1d13');
    ctx.fillStyle = barkGrad;
    ctx.fill();

    // Ranhuras da casca
    ctx.strokeStyle = '#180f0a';
    ctx.lineWidth = 2;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(trunkBaseX + i * 6, trunkBaseY - 4);
      ctx.quadraticCurveTo(trunkBaseX + i * 4 + 2, trunkBaseY - H * 0.25, trunkBaseX + i * 3, trunkTopY + 10);
      ctx.stroke();
    }

    // Galhos boughs superiores
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#3d2618';
    ctx.beginPath();
    ctx.moveTo(trunkBaseX - 4, trunkTopY + 15);
    ctx.quadraticCurveTo(trunkBaseX - W * 0.2, trunkTopY - H * 0.08, trunkBaseX - W * 0.28, trunkTopY - H * 0.18);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(trunkBaseX + 4, trunkTopY + 15);
    ctx.quadraticCurveTo(trunkBaseX + W * 0.2, trunkTopY - H * 0.08, trunkBaseX + W * 0.28, trunkTopY - H * 0.18);
    ctx.stroke();

    // 2. Clusters de folhagem com múltiplos lobos e iluminação direcional (top-left)
    const clusters = [
      { x: W * 0.5, y: H * 0.28, r: W * 0.36 },
      { x: W * 0.3, y: H * 0.38, r: W * 0.28 },
      { x: W * 0.7, y: H * 0.38, r: W * 0.28 },
      { x: W * 0.24, y: H * 0.24, r: W * 0.24 },
      { x: W * 0.74, y: H * 0.22, r: W * 0.24 },
      { x: W * 0.5, y: H * 0.16, r: W * 0.26 },
    ];

    // Sombra profunda interna
    ctx.fillStyle = '#0d2212';
    for (const c of clusters) {
      ctx.beginPath();
      ctx.arc(c.x, c.y + 6, c.r * 1.05, 0, Math.PI * 2);
      ctx.fill();
    }

    // Midtone verde esmeralda florestal
    ctx.fillStyle = '#1e5229';
    for (const c of clusters) {
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Luz solar (top-left de cada tufo)
    ctx.fillStyle = '#398446';
    for (const c of clusters) {
      ctx.beginPath();
      ctx.arc(c.x - c.r * 0.2, c.y - c.r * 0.2, c.r * 0.75, 0, Math.PI * 2);
      ctx.fill();
    }

    // Highlights dourados vibrantes
    ctx.fillStyle = '#65b85a';
    for (const c of clusters) {
      ctx.beginPath();
      ctx.arc(c.x - c.r * 0.32, c.y - c.r * 0.32, c.r * 0.45, 0, Math.PI * 2);
      ctx.fill();
    }

    // Pinceladas de micro-folhas
    ctx.fillStyle = '#9ae681';
    for (const c of clusters) {
      for (let a = 0; a < 6; a++) {
        const lx = c.x - c.r * 0.35 + (Math.random() - 0.5) * c.r * 0.5;
        const ly = c.y - c.r * 0.35 + (Math.random() - 0.5) * c.r * 0.4;
        ctx.fillRect(lx, ly, 3, 2);
      }
    }
  }

  /**
   * Gera a textura de sombra suave e direcional para o solo
   */
  public static generateTreeShadow(
    device: GraphicsDevice,
    shadowW: number,
    shadowH: number,
    name: string
  ): Texture {
    const canvas = document.createElement('canvas');
    canvas.width = shadowW;
    canvas.height = shadowH;
    const ctx = canvas.getContext('2d')!;

    const cx = shadowW * 0.52;
    const cy = shadowH * 0.5;
    const rx = shadowW * 0.46;
    const ry = shadowH * 0.38;

    const grad = ctx.createRadialGradient(cx, cy, 4, cx, cy, rx);
    grad.addColorStop(0, 'rgba(6, 12, 18, 0.65)');
    grad.addColorStop(0.5, 'rgba(6, 12, 18, 0.35)');
    grad.addColorStop(0.85, 'rgba(6, 12, 18, 0.12)');
    grad.addColorStop(1, 'rgba(6, 12, 18, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0.08, 0, Math.PI * 2);
    ctx.fill();

    return createPixelTexture(device, canvas, false, name);
  }

  /**
   * Cria o conjunto completo de texturas de árvores estilizadas para a GPU
   */
  public static registerStylizedTrees(
    device: GraphicsDevice,
    texturesMap: Map<string, Texture>
  ): void {
    console.log('[StylizedTreeAssets] Processando e registrando árvores estilizadas hand-painted...');

    // 1. ÁRVORE GRANDE (Tree Large: 160×176 px)
    const canvasLarge = this.processTreeImage(this.imgLarge, 160, 176, 'tree_large');
    texturesMap.set('tree_large', createPixelTexture(device, canvasLarge, false, 'tree_large'));
    texturesMap.set('sombra_tree_large', this.generateTreeShadow(device, 168, 72, 'sombra_tree_large'));

    // 2. ÁRVORE ANCESTRAL (Tree Ancient: 192×208 px)
    const canvasAncient = this.processTreeImage(this.imgAncient, 192, 208, 'tree_ancient');
    texturesMap.set('tree_ancient', createPixelTexture(device, canvasAncient, false, 'tree_ancient'));
    texturesMap.set('sombra_tree_ancient', this.generateTreeShadow(device, 200, 84, 'sombra_tree_ancient'));

    // 3. ÁRVORE MÉDIA (Tree Med: 112×128 px)
    const canvasMed = this.processTreeImage(this.imgMed, 112, 128, 'tree_med');
    texturesMap.set('tree_med', createPixelTexture(device, canvasMed, false, 'tree_med'));
    texturesMap.set('sombra_tree_med', this.generateTreeShadow(device, 120, 52, 'sombra_tree_med'));

    // 4. ÁRVORE PEQUENA (Tree Small: 72×88 px)
    const canvasSmall = this.processTreeImage(this.imgSmall, 72, 88, 'tree_small');
    texturesMap.set('tree_small', createPixelTexture(device, canvasSmall, false, 'tree_small'));
    texturesMap.set('sombra_tree_small', this.generateTreeShadow(device, 76, 36, 'sombra_tree_small'));
  }
}
