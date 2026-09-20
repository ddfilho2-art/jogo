// =============================================================================
// ELDRIM: ECOS DO PASSADO - HERO SPRITE 2D (PROTÓTIPO B - SPRITE 2D TRADICIONAL)
// =============================================================================

import {
  Entity,
  FILTER_LINEAR,
  GraphicsDevice,
  Mesh,
  MeshInstance,
  StandardMaterial,
  Texture,
} from 'playcanvas';
import { Direction } from '../systems/InputSystem';
import { HeroState, IHeroVisual } from './HeroVisualTypes';
import { createPixelMaterial } from '../rendering/GraphicsBackend';

import row0Url from '../../assets/images/ren_chibi_row0_idle_1789858442413.jpg';
import row1Url from '../../assets/images/ren_chibi_row1_walk_down_1789858720240.jpg';
import row2Url from '../../assets/images/ren_chibi_row2_walk_up_1789858788226.jpg';
import row3Url from '../../assets/images/ren_chibi_row3_walk_side_1789858832575.jpg';
import row4Url from '../../assets/images/ren_chibi_row4_jump_1789859798672.jpg';
import row5Url from '../../assets/images/ren_chibi_row5_attack_down_1789859809465.jpg';
import row6Url from '../../assets/images/ren_chibi_row6_attack_side_1789859821420.jpg';
import row7Url from '../../assets/images/ren_chibi_row7_magic_arcane_1789859832827.jpg';

const ROW_URLS = [row0Url, row1Url, row2Url, row3Url, row4Url, row5Url, row6Url, row7Url];

// Durações reais dos estados temporários, copiadas de RenEntity.ts (contagem regressiva)
const ATTACK_DURATION = 0.35;
const HEAVY_ATTACK_DURATION = 0.55;
const ARCANE_DURATION = 0.6;

export class HeroSprite2D implements IHeroVisual {
  public readonly rootEntity: Entity;
  private spriteEntity: Entity;
  private mesh: Mesh;
  private material: StandardMaterial;
  private texture: Texture | null = null;

  private currentCol = -1;
  private currentRow = -1;
  private currentFlipX = false;

  // Relógio PRÓPRIO de animação — avança a cada frame, independente do
  // stateTimer do RenEntity (que é contagem regressiva só de ações temporárias).
  private animClock = 0;

  private readonly COLS = 4;
  private readonly ROWS = 8;
  private readonly width = 36;
  private readonly height = 58;

  constructor(device: GraphicsDevice) {
    this.rootEntity = new Entity('Hero_PrototypeB_Root');
    this.spriteEntity = new Entity('Hero_Sprite2D_Quad');
    this.rootEntity.addChild(this.spriteEntity);

    this.mesh = this.createDynamicQuadMesh(device);

    this.material = createPixelMaterial({
      transparent: true,
      alphaTest: 0.05,
    });

    this.spriteEntity.addComponent('render', {
      meshInstances: [new MeshInstance(this.mesh, this.material)],
    });

    this.spriteEntity.setLocalPosition(0, 0, 0.1);

    this.carregarFolhaMestre(device);
    this.setFrame(0, 0, false);
  }

  private carregarFolhaMestre(device: GraphicsDevice): void {
    let loadedCount = 0;
    const images: HTMLImageElement[] = [];

    ROW_URLS.forEach((url, index) => {
      const img = new Image();
      images[index] = img;
      img.onload = () => {
        loadedCount++;
        console.log(`[HeroSprite2D] Linha ${index} carregada (${loadedCount}/${ROW_URLS.length})`);
        if (loadedCount === ROW_URLS.length) {
          try {
            this.montarAtlas(device, images);
          } catch (e) {
            console.error('[HeroSprite2D] ERRO ao montar atlas:', e);
          }
        }
      };
      img.onerror = (err) => {
        console.error(`[HeroSprite2D] Erro ao carregar linha ${index} (${url}):`, err);
      };
      img.src = url;
    });
  }

  private montarAtlas(device: GraphicsDevice, images: HTMLImageElement[]): void {
    console.log('[HeroSprite2D] Iniciando montagem do atlas com', images.length, 'imagens');
    const rowWidth = images[0].naturalWidth || images[0].width || 1024;
    const rowHeight = images[0].naturalHeight || images[0].height || 256;
    console.log('[HeroSprite2D] Dimensão de cada linha:', rowWidth, 'x', rowHeight);

    const atlasCanvas = document.createElement('canvas');
    atlasCanvas.width = rowWidth;
    atlasCanvas.height = rowHeight * this.ROWS;
    const ctx = atlasCanvas.getContext('2d');
    if (!ctx) { console.error('[HeroSprite2D] Sem contexto 2D do canvas!'); return; }

    for (let r = 0; r < this.ROWS; r++) {
      const img = images[r] || images[0];
      ctx.drawImage(img, 0, r * rowHeight, rowWidth, rowHeight);
    }
    console.log('[HeroSprite2D] 8 linhas desenhadas no canvas do atlas');

    const imgData = ctx.getImageData(0, 0, atlasCanvas.width, atlasCanvas.height);
    const data = imgData.data;
    const w = atlasCanvas.width;
    const h = atlasCanvas.height;

    const isBg = new Uint8Array(w * h);
    const queue: number[] = [];
    const isWhite = (x: number, y: number) => {
      const idx = (y * w + x) * 4;
      return data[idx] > 238 && data[idx + 1] > 238 && data[idx + 2] > 238;
    };

    for (let x = 0; x < w; x++) {
      if (isWhite(x, 0)) { isBg[0 * w + x] = 1; queue.push(x, 0); }
      if (isWhite(x, h - 1)) { isBg[(h - 1) * w + x] = 1; queue.push(x, h - 1); }
    }
    for (let y = 0; y < h; y++) {
      if (isWhite(0, y)) { isBg[y * w + 0] = 1; queue.push(0, y); }
      if (isWhite(w - 1, y)) { isBg[y * w + (w - 1)] = 1; queue.push(w - 1, y); }
    }

    let head = 0;
    while (head < queue.length) {
      const cx = queue[head++];
      const cy = queue[head++];
      const neighbors = [[cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]];
      for (let i = 0; i < neighbors.length; i++) {
        const [nx, ny] = neighbors[i];
        if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
          const idx = ny * w + nx;
          if (!isBg[idx] && isWhite(nx, ny)) {
            isBg[idx] = 1;
            queue.push(nx, ny);
          }
        }
      }
    }

    let transparentCount = 0;
    for (let i = 0; i < isBg.length; i++) {
      if (isBg[i]) { data[i * 4 + 3] = 0; transparentCount++; }
    }
    console.log('[HeroSprite2D] Pixels tornados transparentes:', transparentCount, 'de', isBg.length, `(${((transparentCount / isBg.length) * 100).toFixed(1)}%)`);
    ctx.putImageData(imgData, 0, 0);

    const texture = new Texture(device, {
      width: atlasCanvas.width,
      height: atlasCanvas.height,
      mipmaps: true,
    });
    texture.setSource(atlasCanvas);
    texture.minFilter = FILTER_LINEAR;
    texture.magFilter = FILTER_LINEAR;

    this.texture = texture;
    this.material.diffuseMap = texture;
    this.material.emissiveMap = texture;
    this.material.opacityMap = texture;
    this.material.opacityMapChannel = 'a';
    this.material.update();
    console.log('[HeroSprite2D] Material atualizado. opacityMap presente?', !!this.material.opacityMap, '| blendType:', this.material.blendType);

    this.setFrame(this.currentCol >= 0 ? this.currentCol : 0, this.currentRow >= 0 ? this.currentRow : 0, this.currentFlipX);
  }

  public setVisible(visible: boolean): void {
    this.rootEntity.enabled = visible;
  }

  public update(
    dt: number,
    state: HeroState,
    facing: Direction,
    stateTimer: number,
    isMoving: boolean,
    jumpHeight: number = 0,
    isGrounded: boolean = true
  ): void {
    this.spriteEntity.setLocalPosition(0, jumpHeight, 0.1);
    this.animClock += dt;

    let row = 0;
    let col = 0;
    let flipX = facing === 'left';

    switch (state) {
      case 'idle':
        row = 0;
        col = Math.floor((this.animClock * 2.5) % 4);
        flipX = facing === 'left';
        break;

      case 'walk':
      case 'run': {
        const speed = state === 'run' ? 12 : 8;
        col = Math.floor((this.animClock * speed) % 4);
        if (facing === 'up') { row = 2; flipX = false; }
        else if (facing === 'down') { row = 1; flipX = false; }
        else { row = 3; flipX = facing === 'right'; }
        break;
      }

      case 'jump':
      case 'fall': {
        row = 4;
        col = state === 'jump' ? (jumpHeight > 8 ? 1 : 0) : 2;
        flipX = facing === 'right';
        break;
      }

      case 'attack':
      case 'heavy_attack': {
        const maxDuration = state === 'heavy_attack' ? HEAVY_ATTACK_DURATION : ATTACK_DURATION;
        const progress = Math.min(0.99, Math.max(0, 1 - stateTimer / maxDuration));
        col = Math.min(2, Math.floor(progress * 3));
        if (facing === 'up' || facing === 'down') { row = 5; flipX = false; }
        else { row = 6; flipX = facing === 'right'; }
        break;
      }

      case 'dodge':
        row = 4;
        col = 0;
        flipX = facing === 'right';
        break;

      case 'arcane_flow': {
        const progress = Math.min(0.99, Math.max(0, 1 - stateTimer / ARCANE_DURATION));
        row = 7;
        col = Math.min(2, Math.floor(progress * 3));
        flipX = false;
        break;
      }

      case 'hurt':
      case 'death':
        row = 0;
        col = 0;
        flipX = facing === 'right';
        break;

      default:
        row = 0;
        col = 0;
        break;
    }

    if (col !== this.currentCol || row !== this.currentRow || flipX !== this.currentFlipX) {
      this.currentCol = col;
      this.currentRow = row;
      this.currentFlipX = flipX;
      this.setFrame(col, row, flipX);
    }
  }

  private setFrame(col: number, row: number, flipX: boolean): void {
    let u0 = col / this.COLS;
    let u1 = (col + 1) / this.COLS;
    const v0 = row / this.ROWS;
    const v1 = (row + 1) / this.ROWS;

    if (flipX) {
      const tmp = u0;
      u0 = u1;
      u1 = tmp;
    }

    const uvs = [
      u0, v1, // Bottom-Left
      u1, v1, // Bottom-Right
      u1, v0, // Top-Right
      u0, v0, // Top-Left
    ];

    this.mesh.setUvs(0, uvs);
    this.mesh.update();
  }

  private createDynamicQuadMesh(device: GraphicsDevice): Mesh {
    const w = this.width;
    const h = this.height;
    const px = 0.5;
    const py = 0.06;

    const left = -w * px;
    const right = w * (1 - px);
    const bottom = -h * py;
    const top = h * (1 - py);

    const positions = [left, bottom, 0, right, bottom, 0, right, top, 0, left, top, 0];
    const normals = [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1];
    const uvs = [0, 1, 1, 1, 1, 0, 0, 0];
    const indices = [0, 1, 2, 0, 2, 3];

    const mesh = new Mesh(device);
    mesh.setPositions(positions);
    mesh.setNormals(normals);
    mesh.setUvs(0, uvs);
    mesh.setIndices(indices);
    mesh.update();
    return mesh;
  }

  public destroy(): void {
    if (this.texture) {
      try { this.texture.destroy(); } catch { /* já destruído */ }
    }
    this.rootEntity.destroy();
  }
}