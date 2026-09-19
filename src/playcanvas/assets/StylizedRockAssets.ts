import { GraphicsDevice, Texture } from 'playcanvas';
import { createPixelTexture } from '../rendering/GraphicsBackend';
import rockLargeUrl from '../../assets/images/stylized_rock_large_1789384074972.jpg';
import rockMedUrl from '../../assets/images/rock_med_concept_1789385324127.jpg';
import rockSmallUrl from '../../assets/images/rock_small_concept_1789385339838.jpg';
import rockTinyUrl from '../../assets/images/rock_tiny_concept_1789385352705.jpg';

// =============================================================================
// ELDRIM: ECOS DO PASSADO - STYLIZED ROCK ASSETS PIPELINE (ROCK FAMILY)
// =============================================================================
// Pipeline de texturas de alta fidelidade estilizada hand-painted para a família de rochas:
// - Fonte de verdade visual absoluta: ROCK LARGE APROVADA
// - ROCK MED, ROCK SMALL e ROCK TINY mantêm rigorosamente a mesma linguagem:
//   * Mesma paleta (#0f172a, #1e293b, #334155, #475569, #64748b)
//   * Mesma iluminação estilizada superior-esquerda (Top-Left)
//   * Mesmo tratamento de superfícies geológicas facetadas com chanfros nítidos
//   * Mesmo padrão e cor de musgo orgânico (#193813, #31541F, #4E7C28, #6E9345)
//   * Remoção de fundo por conectividade (Flood Fill / BFS) e anti-halo de-fringing
//   * Sombras projetadas no solo com gradiente de oclusão radial correspondente
// =============================================================================

export class StylizedRockAssets {
  private static loadPromise: Promise<void> | null = null;
  private static imgRockLarge: HTMLImageElement | null = null;
  private static imgRockMed: HTMLImageElement | null = null;
  private static imgRockSmall: HTMLImageElement | null = null;
  private static imgRockTiny: HTMLImageElement | null = null;

  public static preload(): Promise<void> {
    if (this.loadPromise) return this.loadPromise;

    const loadSingle = (url: string, name: string): Promise<HTMLImageElement | null> => {
      return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          console.log(`[StylizedRockAssets] Imagem de referência ${name} carregada com sucesso.`);
          resolve(img);
        };
        img.onerror = () => {
          console.warn(`[StylizedRockAssets] Falha ao carregar imagem externa de ${name}. Usando fallback artesanal.`);
          resolve(null);
        };
        img.src = url;
      });
    };

    this.loadPromise = Promise.all([
      loadSingle(rockLargeUrl, 'Rock Large'),
      loadSingle(rockMedUrl, 'Rock Med'),
      loadSingle(rockSmallUrl, 'Rock Small'),
      loadSingle(rockTinyUrl, 'Rock Tiny'),
    ]).then(([large, med, small, tiny]) => {
      this.imgRockLarge = large;
      this.imgRockMed = med;
      this.imgRockSmall = small;
      this.imgRockTiny = tiny;
      console.log('[StylizedRockAssets] Todas as 4 variações da Família Rock foram pré-carregadas.');
    });

    return this.loadPromise;
  }

  /**
   * Processa a imagem bruta com remoção de fundo por conectividade (Flood Fill / BFS),
   * preservação estrita de highlights internos e suavização de bordas sem halo.
   */
  public static processRockImage(
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

      // 1. ANALISAR BORDAS PARA DETECTAR A COR E TIPO DO FUNDO
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
      const visited = new Uint8Array(W * H);
      const queue: number[] = [];

      const getColorDiff = (r: number, g: number, b: number): number => {
        const dr = r - avgR;
        const dg = g - avgG;
        const db = b - avgB;
        return Math.sqrt(dr * dr + dg * dg + db * db);
      };

      const tolerance = isLightBg ? 55 : 45;
      const featherBand = 18;

      const isBackgroundPixel = (x: number, y: number): boolean => {
        const idx = (y * W + x) * 4;
        const r = d[idx];
        const g = d[idx + 1];
        const b = d[idx + 2];
        const diff = getColorDiff(r, g, b);

        if (isLightBg) {
          const brightness = (r + g + b) / 3;
          return diff < tolerance || brightness > 238;
        } else {
          const maxVal = Math.max(r, g, b);
          return diff < tolerance || maxVal < 26;
        }
      };

      for (let x = 0; x < W; x++) {
        if (isBackgroundPixel(x, 0)) {
          visited[0 * W + x] = 1;
          queue.push(x, 0);
        }
        if (isBackgroundPixel(x, H - 1)) {
          const idx = (H - 1) * W + x;
          if (!visited[idx]) {
            visited[idx] = 1;
            queue.push(x, H - 1);
          }
        }
      }

      for (let y = 0; y < H; y++) {
        if (isBackgroundPixel(0, y)) {
          const idx = y * W + 0;
          if (!visited[idx]) {
            visited[idx] = 1;
            queue.push(0, y);
          }
        }
        if (isBackgroundPixel(W - 1, y)) {
          const idx = y * W + (W - 1);
          if (!visited[idx]) {
            visited[idx] = 1;
            queue.push(W - 1, y);
          }
        }
      }

      // Executa BFS Flood Fill
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
            if (visited[nIdx] === 0 && isBackgroundPixel(nx, ny)) {
              visited[nIdx] = 1;
              queue.push(nx, ny);
            }
          }
        }
      }

      // PASSO CRÍTICO: DETECÇÃO DE LACUNAS E VÃOS INTERNOS
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const pIdx = y * W + x;
          if (visited[pIdx] === 0 && isBackgroundPixel(x, y)) {
            visited[pIdx] = 1;
          }
        }
      }

      // 3. APLICAÇÃO DE ALPHA E DE-FRINGING (REMOVE HALO)
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const pIdx = y * W + x;
          const bIdx = pIdx * 4;

          if (visited[pIdx] === 1) {
            d[bIdx + 3] = 0;
          } else {
            const r = d[bIdx];
            const g = d[bIdx + 1];
            const b = d[bIdx + 2];
            const diff = getColorDiff(r, g, b);

            let isBorderTransition = false;
            if (
              (x > 0 && visited[pIdx - 1] === 1) ||
              (x < W - 1 && visited[pIdx + 1] === 1) ||
              (y > 0 && visited[pIdx - W] === 1) ||
              (y < H - 1 && visited[pIdx + W] === 1)
            ) {
              isBorderTransition = true;
            }

            if (isBorderTransition && diff < tolerance + featherBand) {
              const factor = Math.max(0, Math.min(1, (diff - (tolerance - 12)) / (featherBand + 12)));
              const alpha = Math.floor(factor * 255);
              d[bIdx + 3] = Math.max(0, Math.min(255, alpha));

              if (alpha > 10 && factor > 0.05) {
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
              d[bIdx + 3] = 255;
            }
          }
        }
      }

      // Color dilation para bordas transparentes (anti-halo bilineário)
      for (let y = 1; y < H - 1; y++) {
        for (let x = 1; x < W - 1; x++) {
          const pIdx = y * W + x;
          const bIdx = pIdx * 4;
          if (d[bIdx + 3] === 0) {
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

      // 4. RECALCULAR BOUNDING BOX APENAS COM PIXELS COM ALPHA SIGNIFICATIVO
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
        minX = Math.max(0, minX - 2);
        minY = Math.max(0, minY - 2);
        maxX = Math.min(W - 1, maxX + 2);
        maxY = Math.min(H - 1, maxY + 2);

        const cropW = Math.max(1, maxX - minX + 1);
        const cropH = Math.max(1, maxY - minY + 1);

        ctx.drawImage(tempCanvas, minX, minY, cropW, cropH, 0, 0, targetWidth, targetHeight);
      } else {
        ctx.drawImage(tempCanvas, 0, 0, targetWidth, targetHeight);
      }
    } else {
      this.drawHandcraftedFallbackRock(ctx, targetWidth, targetHeight, name);
    }

    return canvas;
  }

  /**
   * Renderizador artesanal para fallback procedural com geologia facetada e musgo
   */
  private static drawHandcraftedFallbackRock(
    ctx: CanvasRenderingContext2D,
    W: number,
    H: number,
    name: string
  ): void {
    ctx.clearRect(0, 0, W, H);

    // 1. Sombra ambiente de base (#0f172a)
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(W * 0.08, H * 0.90);
    ctx.lineTo(W * 0.18, H * 0.50);
    ctx.lineTo(W * 0.28, H * 0.25);
    ctx.lineTo(W * 0.52, H * 0.15);
    ctx.lineTo(W * 0.78, H * 0.22);
    ctx.lineTo(W * 0.92, H * 0.58);
    ctx.lineTo(W * 0.88, H * 0.92);
    ctx.lineTo(W * 0.50, H * 0.95);
    ctx.closePath();
    ctx.fill();

    // 2. Facetas intermediárias escuras (#1e293b)
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(W * 0.12, H * 0.86);
    ctx.lineTo(W * 0.22, H * 0.48);
    ctx.lineTo(W * 0.32, H * 0.26);
    ctx.lineTo(W * 0.50, H * 0.18);
    ctx.lineTo(W * 0.75, H * 0.25);
    ctx.lineTo(W * 0.88, H * 0.56);
    ctx.lineTo(W * 0.84, H * 0.88);
    ctx.closePath();
    ctx.fill();

    // 3. Faceta lateral esquerda intermediária (#334155)
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.moveTo(W * 0.16, H * 0.82);
    ctx.lineTo(W * 0.24, H * 0.44);
    ctx.lineTo(W * 0.42, H * 0.36);
    ctx.lineTo(W * 0.46, H * 0.75);
    ctx.lineTo(W * 0.25, H * 0.85);
    ctx.closePath();
    ctx.fill();

    // 4. Facetas superiores iluminadas (Top-Left, #475569 e #64748b)
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.moveTo(W * 0.30, H * 0.26);
    ctx.lineTo(W * 0.52, H * 0.18);
    ctx.lineTo(W * 0.65, H * 0.32);
    ctx.lineTo(W * 0.44, H * 0.42);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#64748b';
    ctx.beginPath();
    ctx.moveTo(W * 0.34, H * 0.25);
    ctx.lineTo(W * 0.48, H * 0.19);
    ctx.lineTo(W * 0.55, H * 0.28);
    ctx.lineTo(W * 0.38, H * 0.32);
    ctx.closePath();
    ctx.fill();

    // 5. Faceta direita chanfrada (#283548)
    ctx.fillStyle = '#283548';
    ctx.beginPath();
    ctx.moveTo(W * 0.65, H * 0.32);
    ctx.lineTo(W * 0.76, H * 0.24);
    ctx.lineTo(W * 0.86, H * 0.54);
    ctx.lineTo(W * 0.68, H * 0.65);
    ctx.closePath();
    ctx.fill();

    // 6. Fissuras geológicas profundas (#0a101d)
    ctx.strokeStyle = '#0a101d';
    ctx.lineWidth = Math.max(1, W * 0.015);
    ctx.beginPath();
    ctx.moveTo(W * 0.45, H * 0.38);
    ctx.lineTo(W * 0.48, H * 0.58);
    ctx.lineTo(W * 0.42, H * 0.75);
    ctx.stroke();

    // 7. Musgo Orgânico Hand-Painted (#193813, #31541F, #4E7C28, #6E9345)
    ctx.fillStyle = '#193813';
    ctx.fillRect(W * 0.28, H * 0.26, W * 0.34, H * 0.12);
    ctx.fillStyle = '#31541F';
    ctx.fillRect(W * 0.30, H * 0.24, W * 0.30, H * 0.09);
    ctx.fillStyle = '#4E7C28';
    ctx.fillRect(W * 0.33, H * 0.22, W * 0.22, H * 0.06);
    ctx.fillStyle = '#6E9345';
    ctx.fillRect(W * 0.36, H * 0.21, W * 0.14, H * 0.04);
  }

  /**
   * Gera textura de sombra de contato suave no solo
   */
  public static generateRockShadow(
    device: GraphicsDevice,
    shadowW: number,
    shadowH: number,
    name: string
  ): Texture {
    const canvas = document.createElement('canvas');
    canvas.width = shadowW;
    canvas.height = shadowH;
    const ctx = canvas.getContext('2d')!;

    const cx = shadowW * 0.5;
    const cy = shadowH * 0.5;
    const rx = shadowW * 0.46;
    const ry = shadowH * 0.38;

    const grad = ctx.createRadialGradient(cx, cy, 3, cx, cy, rx);
    grad.addColorStop(0, 'rgba(8, 14, 20, 0.68)');
    grad.addColorStop(0.5, 'rgba(8, 14, 20, 0.35)');
    grad.addColorStop(0.85, 'rgba(8, 14, 20, 0.12)');
    grad.addColorStop(1, 'rgba(8, 14, 20, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();

    return createPixelTexture(device, canvas, false, name);
  }

  /**
   * Registra toda a Família Rock (Large, Med, Small, Tiny, Cluster) e sombras no PlayCanvas
   */
  public static registerStylizedRocks(
    device: GraphicsDevice,
    texturesMap: Map<string, Texture>
  ): void {
    console.log('[StylizedRockAssets] Registrando Família Rock estilizada hand-painted...');

    // =========================================================================
    // 1. ROCK LARGE (APROVADA - REFERÊNCIA-MÃE INTOCADA) - 128×96 px
    // =========================================================================
    const canvasLarge = this.processRockImage(this.imgRockLarge, 128, 96, 'rock_large');
    texturesMap.set('rock_large', createPixelTexture(device, canvasLarge, false, 'rock_large'));
    texturesMap.set('sombra_rock', this.generateRockShadow(device, 136, 56, 'sombra_rock'));

    // =========================================================================
    // 2. ROCK MED (DERIVADA DA MESMA LINGUAGEM) - 96×72 px
    // =========================================================================
    const canvasMed = this.processRockImage(this.imgRockMed, 96, 72, 'rock_med');
    texturesMap.set('rock_med', createPixelTexture(device, canvasMed, false, 'rock_med'));
    texturesMap.set('sombra_rock_med', this.generateRockShadow(device, 104, 44, 'sombra_rock_med'));

    // =========================================================================
    // 3. ROCK SMALL (DERIVADA DA MESMA LINGUAGEM) - 64×48 px
    // =========================================================================
    const canvasSmall = this.processRockImage(this.imgRockSmall, 64, 48, 'rock_small');
    texturesMap.set('rock_small', createPixelTexture(device, canvasSmall, false, 'rock_small'));
    texturesMap.set('sombra_rock_small', this.generateRockShadow(device, 72, 32, 'sombra_rock_small'));

    // =========================================================================
    // 4. ROCK TINY (DERIVADA DA MESMA LINGUAGEM) - 48×36 px
    // =========================================================================
    const canvasTiny = this.processRockImage(this.imgRockTiny, 48, 36, 'rock_tiny');
    texturesMap.set('rock_tiny', createPixelTexture(device, canvasTiny, false, 'rock_tiny'));
    texturesMap.set('sombra_rock_tiny', this.generateRockShadow(device, 52, 24, 'sombra_rock_tiny'));

    // =========================================================================
    // 5. ROCK CLUSTER (COMPOSIÇÃO ORGÂNICA DA MESMA FAMÍLIA) - 108×56 px
    // =========================================================================
    const clusterCanvas = document.createElement('canvas');
    clusterCanvas.width = 108;
    clusterCanvas.height = 56;
    const ctxC = clusterCanvas.getContext('2d')!;
    ctxC.imageSmoothingEnabled = true;

    // Rocha esquerda (Med)
    ctxC.drawImage(canvasMed, 0, 8, 68, 48);
    // Rocha direita (Small)
    ctxC.drawImage(canvasSmall, 52, 14, 52, 40);
    // Tufo de musgo orgânico de união
    ctxC.fillStyle = '#193813';
    ctxC.fillRect(46, 32, 18, 8);
    ctxC.fillStyle = '#31541F';
    ctxC.fillRect(48, 30, 14, 6);
    ctxC.fillStyle = '#4E7C28';
    ctxC.fillRect(50, 29, 8, 4);

    texturesMap.set('rock_cluster', createPixelTexture(device, clusterCanvas, false, 'rock_cluster'));
    texturesMap.set('sombra_rock_cluster', this.generateRockShadow(device, 116, 40, 'sombra_rock_cluster'));
  }
}
