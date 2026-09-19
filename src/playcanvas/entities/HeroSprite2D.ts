// =============================================================================
// ELDRIM: ECOS DO PASSADO - HERO SPRITE 2D (PROTÓTIPO B - SPRITE 2D TRADICIONAL)
// =============================================================================
// Implementação de tecnologia puramente 2D para o Herói Guerreiro:
// - Carrega a folha de sprites chibi completa (8 linhas × 4 colunas = 32 quadros)
// - Renderização com filtro LINEAR (estilo chibi/cel-shading suave, sem pixelização)
// - Animações frame-a-frame de alta fidelidade para todas as ações:
//   * Linha 0: IDLE de frente (4 quadros de respiração)
//   * Linha 1: CAMINHADA de frente (4 quadros)
//   * Linha 2: CAMINHADA de costas (4 quadros)
//   * Linha 3: CAMINHADA de perfil (4 quadros)
//   * Linha 4: PULO (3 quadros: impulso, subindo, caindo)
//   * Linha 5: ATAQUE de frente (3 quadros: preparar, golpe, recuperar)
//   * Linha 6: ATAQUE de perfil (3 quadros: preparar, golpe, recuperar)
//   * Linha 7: MAGIA/ARCANO (3 quadros: concentrar, carga plena, liberar)
// - Conformidade estrita com a Regra 29 (createPixelMaterial unlit emissiveMap)
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

const ROW_URLS = [
  row0Url,
  row1Url,
  row2Url,
  row3Url,
  row4Url,
  row5Url,
  row6Url,
  row7Url,
];

export class HeroSprite2D implements IHeroVisual {
  public readonly rootEntity: Entity;
  private spriteEntity: Entity;
  private mesh: Mesh;
  private material: StandardMaterial;
  private texture: Texture | null = null;

  private currentCol = -1;
  private currentRow = -1;
  private currentFlipX = false;

  private readonly COLS = 4;
  private readonly ROWS = 8;
  private readonly width = 36;
  private readonly height = 58;

  constructor(device: GraphicsDevice) {
    this.rootEntity = new Entity('Hero_PrototypeB_Root');

    this.spriteEntity = new Entity('Hero_Sprite2D_Quad');
    this.rootEntity.addChild(this.spriteEntity);

    // Cria malha Quad com pivô na base dos pés (pivotX: 0.5, pivotY: 0.06)
    this.mesh = this.createDynamicQuadMesh(device);

    this.material = createPixelMaterial({
      transparent: true,
      alphaTest: 0.05,
    });

    this.spriteEntity.addComponent('render', {
      meshInstances: [new MeshInstance(this.mesh, this.material)],
    });

    // Posição local Z ligeiramente à frente para não colidir com a sombra
    this.spriteEntity.setLocalPosition(0, 0, 0.1);

    // Carregamento e montagem da folha de sprites completa (8 linhas × 4 colunas)
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
        if (loadedCount === ROW_URLS.length) {
          this.montarAtlas(device, images);
        }
      };
      img.onerror = (err) => {
        console.error(`[HeroSprite2D] Erro ao carregar linha ${index}:`, err);
      };
      img.src = url;
    });
  }

  private montarAtlas(device: GraphicsDevice, images: HTMLImageElement[]): void {
    const rowWidth = images[0].naturalWidth || images[0].width || 1024;
    const rowHeight = images[0].naturalHeight || images[0].height || 256;

    const atlasCanvas = document.createElement('canvas');
    atlasCanvas.width = rowWidth;
    atlasCanvas.height = rowHeight * this.ROWS;
    const ctx = atlasCanvas.getContext('2d');
    if (!ctx) return;

    // Desenha cada uma das 8 linhas na tela unificada
    for (let r = 0; r < this.ROWS; r++) {
      const img = images[r] || images[0];
      ctx.drawImage(img, 0, r * rowHeight, rowWidth, rowHeight);
    }

    // Remoção limpa do fundo branco em toda a folha
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

    // Bordas superior e inferior
    for (let x = 0; x < w; x++) {
      if (isWhite(x, 0)) { isBg[0 * w + x] = 1; queue.push(x, 0); }
      if (isWhite(x, h - 1)) { isBg[(h - 1) * w + x] = 1; queue.push(x, h - 1); }
    }
    // Bordas laterais
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

    for (let i = 0; i < isBg.length; i++) {
      if (isBg[i]) {
        data[i * 4 + 3] = 0;
      }
    }
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
    this.material.update();

    // Atualiza frame inicial
    this.setFrame(this.currentCol >= 0 ? this.currentCol : 0, this.currentRow >= 0 ? this.currentRow : 0, this.currentFlipX);
    console.log('[HeroSprite2D] Folha de sprites completa (8 linhas × 4 colunas) carregada e renderizada com sucesso!');
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
    // 1. Posição vertical por pulo
    this.spriteEntity.setLocalPosition(0, jumpHeight, 0.1);

    // 2. Determinação de Linha e Coluna com base no estado de jogo e direção
    let row = 0;
    let col = 0;
    let flipX = facing === 'left';

    switch (state) {
      case 'idle':
        // Linha 0: IDLE de frente (ciclo de respiração 4 quadros)
        row = 0;
        col = Math.floor((stateTimer * 2.5) % 4);
        flipX = facing === 'left';
        break;

      case 'walk':
      case 'run':
        {
          const speed = state === 'run' ? 12 : 8;
          col = Math.floor((stateTimer * speed) % 4);

          if (facing === 'up') {
            // Linha 2: Caminhada de costas
            row = 2;
            flipX = false;
          } else if (facing === 'down') {
            // Linha 1: Caminhada de frente
            row = 1;
            flipX = false;
          } else {
            // Linha 3: Caminhada de perfil (direita com flip para esquerda)
            row = 3;
            flipX = facing === 'left';
          }
        }
        break;

      case 'jump':
      case 'fall':
        {
          // Linha 4: Pulo (0: impulso, 1: subindo, 2: caindo)
          row = 4;
          if (state === 'jump') {
            col = jumpHeight > 8 ? 1 : 0;
          } else {
            col = 2;
          }
          flipX = facing === 'left';
        }
        break;

      case 'attack':
        {
          // Ataque básico (3 quadros: 0 windup, 1 slash, 2 recover)
          const duration = 0.32;
          const progress = Math.min(0.99, stateTimer / duration);
          col = Math.min(2, Math.floor(progress * 3));

          if (facing === 'up' || facing === 'down') {
            row = 5; // Ataque de frente
            flipX = false;
          } else {
            row = 6; // Ataque de perfil
            flipX = facing === 'left';
          }
        }
        break;

      case 'heavy_attack':
        {
          // Ataque pesado
          const duration = 0.5;
          const progress = Math.min(0.99, stateTimer / duration);
          col = Math.min(2, Math.floor(progress * 3));

          if (facing === 'up' || facing === 'down') {
            row = 5;
            flipX = false;
          } else {
            row = 6;
            flipX = facing === 'left';
          }
        }
        break;

      case 'dodge':
        {
          // Esquiva
          row = 4;
          col = 0; // Pose de impulso/agachamento dinâmico
          flipX = facing === 'left';
        }
        break;

      case 'arcane_flow':
        {
          // Linha 7: Magia / Arcano (3 quadros: 0 canalizar, 1 carga plena, 2 liberar)
          row = 7;
          col = Math.floor((stateTimer * 6) % 3);
          flipX = false;
        }
        break;

      case 'hurt':
      case 'death':
        {
          row = 0;
          col = 0;
          flipX = facing === 'left';
        }
        break;

      default:
        row = 0;
        col = 0;
        flipX = facing === 'left';
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

    // Mapeamento UV: BL, BR, TR, TL
    const uvs = [
      u0, 1 - v1, // Bottom-Left
      u1, 1 - v1, // Bottom-Right
      u1, 1 - v0, // Top-Right
      u0, 1 - v0, // Top-Left
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

    const positions = [
      left,  bottom, 0,
      right, bottom, 0,
      right, top,    0,
      left,  top,    0,
    ];

    const normals = [
      0, 0, 1,
      0, 0, 1,
      0, 0, 1,
      0, 0, 1,
    ];

    const uvs = [
      0, 1,
      1, 1,
      1, 0,
      0, 0,
    ];

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
      try {
        this.texture.destroy();
      } catch {
        // Ignora se já destruído
      }
    }
    this.rootEntity.destroy();
  }
}