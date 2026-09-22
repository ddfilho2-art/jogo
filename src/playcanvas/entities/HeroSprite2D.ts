// =============================================================================
// ELDRIM: ECOS DO PASSADO - HERO SPRITE 2D
// =============================================================================
// Sprite 2D tradicional com atlas dinâmico.
//
// Correções desta versão:
// 1. Flip horizontal padronizado:
//      facing === 'left'  -> flipX = true
//      facing === 'right' -> flipX = false
// 2. Animações de locomoção com loop explícito.
// 3. Pixel Art usando createPixelTexture():
//      - FILTER_NEAREST
//      - mipmaps desativados
//      - RGBA8
//      - clamp nas bordas
// 4. Quad não participa de sombras.
// 5. AlphaMap mantido sincronizado com a textura.
// =============================================================================

import {
  BLEND_NORMAL,
  Color,
  Entity,
  GraphicsDevice,
  Mesh,
  MeshInstance,
  StandardMaterial,
  Texture,
} from 'playcanvas';

import { Direction } from '../systems/InputSystem';
import { HeroState, IHeroVisual } from './HeroVisualTypes';
import {
  createPixelMaterial,
  createPixelTexture,
} from '../rendering/GraphicsBackend';

import row0Url from '../../assets/images/ren_chibi_row0_idle.png';
import row1Url from '../../assets/images/ren_chibi_row1_walk_down_1789858720240.jpg';
import row2Url from '../../assets/images/ren_chibi_row2_walk_up_1789858788226.jpg';
import row3Url from '../../assets/images/ren_chibi_row3_walk_side.png';
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

// -----------------------------------------------------------------------------
// Durações dos estados temporários
// -----------------------------------------------------------------------------

const ATTACK_DURATION = 0.35;
const HEAVY_ATTACK_DURATION = 0.55;
const ARCANE_DURATION = 0.6;

// -----------------------------------------------------------------------------
// Configuração das animações
// -----------------------------------------------------------------------------

interface AnimationDefinition {
  row: number;
  frames: number[];
  fps: number;
  loop: boolean;
}

// -----------------------------------------------------------------------------
// Estrutura de Coordenadas UV por Frame
// -----------------------------------------------------------------------------

/**
 * Coordenadas UV explícitas no atlas heterogêneo de alta fidelidade (1408 x 5888).
 * Elimina completamente divisões presumidas (col / 4, row / 8) e garante que
 * cada frame aponte rigorosamente para seus pixels nativos.
 */
interface FrameUV {
  u0: number;
  u1: number;
  v0: number;
  v1: number;
}

/**
 * Dimensões físicas totais do atlas nativo unificado:
 * Largura: 1408 px
 * Altura:  5888 px (512 px na Linha 0 + 7 * 768 px nas Linhas 1 a 7)
 */
const ATLAS_WIDTH = 1408;
const ATLAS_HEIGHT = 5888;

/**
 * Especificações físicas nativas de cada linha no atlas.
 * ROW0: 1024 x 512 nativo (4 frames de 256 x 512), desenhado em (0, 0) sem distorção.
 * ROW1 a 7: 1408 x 768 nativo (4 frames de 352 x 768), desenhados em (0, yOffset) 1:1 sem distorção.
 */
interface RowLayoutSpec {
  yOffset: number;
  frameWidth: number;
  frameHeight: number;
  imageWidth: number;
  imageHeight: number;
}

const ROW_LAYOUTS: RowLayoutSpec[] = [
  { yOffset: 0, frameWidth: 256, frameHeight: 512, imageWidth: 1024, imageHeight: 512 },      // ROW 0: Idle
  { yOffset: 512, frameWidth: 352, frameHeight: 768, imageWidth: 1408, imageHeight: 768 },    // ROW 1: Walk Down
  { yOffset: 1280, frameWidth: 352, frameHeight: 768, imageWidth: 1408, imageHeight: 768 },   // ROW 2: Walk Up
  { yOffset: 2048, frameWidth: 352, frameHeight: 768, imageWidth: 1408, imageHeight: 768 },   // ROW 3: Walk Side
  { yOffset: 2816, frameWidth: 352, frameHeight: 768, imageWidth: 1408, imageHeight: 768 },   // ROW 4: Jump / Fall
  { yOffset: 3584, frameWidth: 352, frameHeight: 768, imageWidth: 1408, imageHeight: 768 },   // ROW 5: Attack Down
  { yOffset: 4352, frameWidth: 352, frameHeight: 768, imageWidth: 1408, imageHeight: 768 },   // ROW 6: Attack Side
  { yOffset: 5120, frameWidth: 352, frameHeight: 768, imageWidth: 1408, imageHeight: 768 },   // ROW 7: Magic Arcane
];

/**
 * Tabela de coordenadas UV pré-calculadas a partir dos pixels físicos reais do atlas.
 */
const FRAME_UVS: FrameUV[][] = ROW_LAYOUTS.map((spec) => {
  const rowUVs: FrameUV[] = [];
  for (let col = 0; col < 4; col++) {
    const px0 = col * spec.frameWidth;
    const px1 = px0 + spec.frameWidth;
    const py0 = spec.yOffset;
    const py1 = py0 + spec.frameHeight;

    rowUVs.push({
      u0: px0 / ATLAS_WIDTH,
      u1: px1 / ATLAS_WIDTH,
      v0: py0 / ATLAS_HEIGHT,
      v1: py1 / ATLAS_HEIGHT,
    });
  }
  return rowUVs;
});

// -----------------------------------------------------------------------------
// Estrutura de Normalização Visual por Frame
// -----------------------------------------------------------------------------

/**
 * Normalização visual por frame / linha baseada nos bounds reais da arte nativa.
 *
 * Garante:
 * 1. Mesma escala corporal do herói em todas as direções (referência: Idle Row 0);
 * 2. Apoio dos pés no mesmo Y do mundo (-3.026875), eliminando saltos ou flutuação;
 * 3. Centro de massa horizontal alinhado com o eixo do herói e da sombra (X = 0);
 * 4. Preservação do flip horizontal sem deslocamentos ou distorções.
 */
interface FrameMetrics {
  visualWidth: number;
  visualHeight: number;
  pivotX: number;
  pivotY: number;
  feetOffsetY: number;
}

/**
 * Ponto de apoio fundamental dos pés no mundo 2.5D (definido pelo Idle de referência).
 */
const REF_GROUND_Y = -3.026875;

/**
 * Tabela explícita de métricas visuais normalizadas para todas as 8 linhas e 4 frames.
 * Valores derivados da medição analítica dos bounds reais do personagem em seus frames nativos:
 * - ROW 0 (Idle): frame 256x512, visualWidth 36.0, visualHeight 58.0.
 * - ROW 1 a 7: frame 352x768 nativo.
 *   Com as proporções nativas preservadas, visualHeight = 72.64 e visualWidth = 43.40 (para ROW 1, 2 e 4-7)
 *   e visualHeight = 76.50 e visualWidth = 45.70 (para ROW 3) igualam perfeitamente a escala do herói ao Idle.
 */
const FRAME_METRICS: FrameMetrics[][] = [
  // ROW 0: Idle (Referência mestra - ren_chibi_row0_idle.png, frame 256x512)
  [
    { visualWidth: 36.0, visualHeight: 58.0, pivotX: 128.0 / 256, pivotY: 508 / 512, feetOffsetY: 0 },
    { visualWidth: 36.0, visualHeight: 58.0, pivotX: 128.0 / 256, pivotY: 508 / 512, feetOffsetY: 0 },
    { visualWidth: 36.0, visualHeight: 58.0, pivotX: 128.0 / 256, pivotY: 508 / 512, feetOffsetY: 0 },
    { visualWidth: 36.0, visualHeight: 58.0, pivotX: 128.0 / 256, pivotY: 508 / 512, feetOffsetY: 0 },
  ],
  // ROW 1: Walk Down (ren_chibi_row1_walk_down, frame 352x768 nativo)
  [
    { visualWidth: 43.40, visualHeight: 72.64, pivotX: 190.0 / 352, pivotY: 684 / 768, feetOffsetY: 0 },
    { visualWidth: 43.40, visualHeight: 72.64, pivotX: 174.8 / 352, pivotY: 684 / 768, feetOffsetY: 0 },
    { visualWidth: 43.40, visualHeight: 72.64, pivotX: 156.4 / 352, pivotY: 684 / 768, feetOffsetY: 0 },
    { visualWidth: 43.40, visualHeight: 72.64, pivotX: 143.8 / 352, pivotY: 684 / 768, feetOffsetY: 0 },
  ],
  // ROW 2: Walk Up (ren_chibi_row2_walk_up, frame 352x768 nativo)
  [
    { visualWidth: 43.40, visualHeight: 72.64, pivotX: 198.2 / 352, pivotY: 691 / 768, feetOffsetY: 0 },
    { visualWidth: 43.40, visualHeight: 72.64, pivotX: 178.9 / 352, pivotY: 691 / 768, feetOffsetY: 0 },
    { visualWidth: 43.40, visualHeight: 72.64, pivotX: 168.2 / 352, pivotY: 691 / 768, feetOffsetY: 0 },
    { visualWidth: 43.40, visualHeight: 72.64, pivotX: 155.5 / 352, pivotY: 691 / 768, feetOffsetY: 0 },
  ],
  // ROW 3: Walk Side (ren_chibi_row3_walk_side.png, frame 352x768 nativo)
  [
    { visualWidth: 45.70, visualHeight: 76.50, pivotX: 176.0 / 352, pivotY: 668 / 768, feetOffsetY: 0 },
    { visualWidth: 45.70, visualHeight: 76.50, pivotX: 176.0 / 352, pivotY: 668 / 768, feetOffsetY: 0 },
    { visualWidth: 45.70, visualHeight: 76.50, pivotX: 176.0 / 352, pivotY: 668 / 768, feetOffsetY: 0 },
    { visualWidth: 45.70, visualHeight: 76.50, pivotX: 176.0 / 352, pivotY: 668 / 768, feetOffsetY: 0 },
  ],
  // ROW 4: Jump / Fall (ren_chibi_row4_jump, frame 352x768 nativo)
  [
    { visualWidth: 43.40, visualHeight: 72.64, pivotX: 204.7 / 352, pivotY: 646 / 768, feetOffsetY: 0 },
    { visualWidth: 43.40, visualHeight: 72.64, pivotX: 186.5 / 352, pivotY: 646 / 768, feetOffsetY: 0 },
    { visualWidth: 43.40, visualHeight: 72.64, pivotX: 187.6 / 352, pivotY: 646 / 768, feetOffsetY: 0 },
    { visualWidth: 43.40, visualHeight: 72.64, pivotX: 176.0 / 352, pivotY: 646 / 768, feetOffsetY: 0 },
  ],
  // ROW 5: Attack Down (ren_chibi_row5_attack_down, frame 352x768 nativo)
  [
    { visualWidth: 43.40, visualHeight: 72.64, pivotX: 222.8 / 352, pivotY: 635 / 768, feetOffsetY: 0 },
    { visualWidth: 43.40, visualHeight: 72.64, pivotX: 188.3 / 352, pivotY: 635 / 768, feetOffsetY: 0 },
    { visualWidth: 43.40, visualHeight: 72.64, pivotX: 166.8 / 352, pivotY: 635 / 768, feetOffsetY: 0 },
    { visualWidth: 43.40, visualHeight: 72.64, pivotX: 176.0 / 352, pivotY: 635 / 768, feetOffsetY: 0 },
  ],
  // ROW 6: Attack Side (ren_chibi_row6_attack_side, frame 352x768 nativo)
  [
    { visualWidth: 43.40, visualHeight: 72.64, pivotX: 215.2 / 352, pivotY: 587 / 768, feetOffsetY: 0 },
    { visualWidth: 43.40, visualHeight: 72.64, pivotX: 211.2 / 352, pivotY: 587 / 768, feetOffsetY: 0 },
    { visualWidth: 43.40, visualHeight: 72.64, pivotX: 167.7 / 352, pivotY: 587 / 768, feetOffsetY: 0 },
    { visualWidth: 43.40, visualHeight: 72.64, pivotX: 176.0 / 352, pivotY: 587 / 768, feetOffsetY: 0 },
  ],
  // ROW 7: Magic Arcane (ren_chibi_row7_magic_arcane, frame 352x768 nativo)
  [
    { visualWidth: 43.40, visualHeight: 72.64, pivotX: 200.4 / 352, pivotY: 653 / 768, feetOffsetY: 0 },
    { visualWidth: 43.40, visualHeight: 72.64, pivotX: 177.9 / 352, pivotY: 653 / 768, feetOffsetY: 0 },
    { visualWidth: 43.40, visualHeight: 72.64, pivotX: 164.8 / 352, pivotY: 653 / 768, feetOffsetY: 0 },
    { visualWidth: 43.40, visualHeight: 72.64, pivotX: 176.0 / 352, pivotY: 653 / 768, feetOffsetY: 0 },
  ],
];

const ANIMATIONS: Record<string, AnimationDefinition> = {
  idle: {
    row: 0,
    frames: [0, 1, 2, 3],
    fps: 2.5,
    loop: true,
  },

  walk_down: {
    row: 1,
    frames: [0, 1, 2, 3],
    fps: 8,
    loop: true,
  },

  walk_up: {
    row: 2,
    frames: [0, 1, 2, 3],
    fps: 8,
    loop: true,
  },

  walk_side: {
    row: 3,
    frames: [0, 1, 2, 3],
    fps: 8,
    loop: true,
  },

  run_down: {
    row: 1,
    frames: [0, 1, 2, 3],
    fps: 12,
    loop: true,
  },

  run_up: {
    row: 2,
    frames: [0, 1, 2, 3],
    fps: 12,
    loop: true,
  },

  run_side: {
    row: 3,
    frames: [0, 1, 2, 3],
    fps: 12,
    loop: true,
  },
};

export class HeroSprite2D implements IHeroVisual {
  public readonly rootEntity: Entity;

  private spriteEntity: Entity;
  private mesh: Mesh;
  private material: StandardMaterial;
  private texture: Texture | null = null;

  private meshInstance: MeshInstance;

  private currentCol = -1;
  private currentRow = -1;
  private currentFlipX = false;

  // ---------------------------------------------------------------------------
  // Controle explícito da animação
  // ---------------------------------------------------------------------------

  private animationName = '';
  private animationFrame = 0;
  private animationTimer = 0;

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
      depthWrite: false,
    });

    this.meshInstance = new MeshInstance(
      this.mesh,
      this.material
    );

    // -------------------------------------------------------------------------
    // O sprite 2D não deve criar nem receber sombras.
    // Isso elimina o quad do sistema de sombras como variável de diagnóstico.
    // -------------------------------------------------------------------------

    this.meshInstance.castShadow = false;
    this.meshInstance.receiveShadow = false;

    this.spriteEntity.addComponent('render', {
      meshInstances: [this.meshInstance],
    });

    this.spriteEntity.setLocalPosition(0, 0, 0.1);

    this.carregarFolhaMestre(device);

    this.setFrame(0, 0, false);
  }

  // ===========================================================================
  // CARREGAMENTO DAS LINHAS
  // ===========================================================================

  private carregarFolhaMestre(device: GraphicsDevice): void {
    let loadedCount = 0;

    const images: HTMLImageElement[] = [];

    ROW_URLS.forEach((url, index) => {
      const img = new Image();

      images[index] = img;

      img.onload = () => {
        loadedCount++;

        console.log(
          `[HeroSprite2D] Linha ${index} carregada ` +
          `(${loadedCount}/${ROW_URLS.length})`
        );

        if (loadedCount === ROW_URLS.length) {
          try {
            this.montarAtlas(device, images);
          } catch (error) {
            console.error(
              '[HeroSprite2D] ERRO ao montar atlas:',
              error
            );
          }
        }
      };

      img.onerror = (error) => {
        console.error(
          `[HeroSprite2D] Erro ao carregar linha ${index} (${url}):`,
          error
        );
      };

      img.src = url;
    });
  }

  // ===========================================================================
  // MONTAGEM DO ATLAS
  // ===========================================================================

  private montarAtlas(
    device: GraphicsDevice,
    images: HTMLImageElement[]
  ): void {
    console.log(
      '[HeroSprite2D] Iniciando montagem do atlas nativo unificado com',
      images.length,
      'imagens.'
    );

    // -------------------------------------------------------------------------
    // Canvas final nativo unificado:
    //
    // Largura = 1408 px (largura nativa das linhas de alta resolução 1 a 7)
    // Altura  = 5888 px (512 px na Linha 0 + 7 * 768 px nas Linhas 1 a 7)
    //
    // Cada asset é desenhado em suas dimensões físicas ORIGINAIS 1:1,
    // eliminando qualquer compressão, deformação ou achatamento anisotrópico.
    // -------------------------------------------------------------------------

    const atlasCanvas = document.createElement('canvas');

    atlasCanvas.width = ATLAS_WIDTH;
    atlasCanvas.height = ATLAS_HEIGHT;

    const ctx = atlasCanvas.getContext('2d');

    if (!ctx) {
      console.error(
        '[HeroSprite2D] Sem contexto 2D do canvas!'
      );

      return;
    }

    // -------------------------------------------------------------------------
    // Limpa o canvas com transparência total antes de desenhar.
    // -------------------------------------------------------------------------
    ctx.clearRect(0, 0, ATLAS_WIDTH, ATLAS_HEIGHT);

    // -------------------------------------------------------------------------
    // Desenha cada linha no atlas com suas dimensões físicas nativas 1:1.
    //
    // - Linha 0 (Idle): 1024 x 512 nativo em (0, 0).
    //   Os pixels excedentes à direita (X: 1024 a 1408) permanecem transparentes.
    // - Linhas 1 a 7: 1408 x 768 nativo em (0, yOffset).
    //   Preserva integralmente a proporção nativa de 1408 / 768 = 1.833333...
    // -------------------------------------------------------------------------

    for (let row = 0; row < this.ROWS; row++) {
      const img = images[row] || images[0];
      const layout = ROW_LAYOUTS[row];

      ctx.drawImage(
        img,
        0,
        layout.yOffset,
        layout.imageWidth,
        layout.imageHeight
      );
    }

    console.log(
      `[HeroSprite2D] Atlas 1:1 desenhado com sucesso (${ATLAS_WIDTH}x${ATLAS_HEIGHT} px).`
    );

    // =========================================================================
    // REMOÇÃO DO FUNDO BRANCO (SOMENTE LINHAS 1 A 7 - JPEGs)
    // =========================================================================
    //
    // A Linha 0 utiliza PNG nativo com canal alpha real já embutido.
    // Portando NÃO é aplicado flood-fill ou chroma key na Linha 0 (y < 512).
    //
    // O flood-fill é estritamente restrito às Linhas 1 a 7 (y >= 512),
    // preservando o alpha original do PNG de Idle na íntegra.
    // =========================================================================

    const startY = ROW_LAYOUTS[1].yOffset; // 512 px

    const imgData = ctx.getImageData(
      0,
      0,
      atlasCanvas.width,
      atlasCanvas.height
    );

    const data = imgData.data;

    const w = atlasCanvas.width;
    const h = atlasCanvas.height;

    const isBackground = new Uint8Array(w * h);

    const queue: number[] = [];

    const isWhite = (
      x: number,
      y: number
    ): boolean => {
      const index = (y * w + x) * 4;

      return (
        data[index] > 238 &&
        data[index + 1] > 238 &&
        data[index + 2] > 238
      );
    };

    // -------------------------------------------------------------------------
    // Sementes nas bordas das linhas 1 a 7 (apenas imagens JPEG)
    // -------------------------------------------------------------------------

    for (let x = 0; x < w; x++) {
      if (isWhite(x, startY)) {
        isBackground[startY * w + x] = 1;
        queue.push(x, startY);
      }

      if (isWhite(x, h - 1)) {
        isBackground[(h - 1) * w + x] = 1;
        queue.push(x, h - 1);
      }
    }

    for (let y = startY; y < h; y++) {
      if (isWhite(0, y)) {
        isBackground[y * w] = 1;
        queue.push(0, y);
      }

      if (isWhite(w - 1, y)) {
        isBackground[y * w + (w - 1)] = 1;
        queue.push(w - 1, y);
      }
    }

    // -------------------------------------------------------------------------
    // Flood-fill (restrito a y >= startY)
    // -------------------------------------------------------------------------

    let head = 0;

    while (head < queue.length) {
      const currentX = queue[head++];
      const currentY = queue[head++];

      const neighbors = [
        [currentX + 1, currentY],
        [currentX - 1, currentY],
        [currentX, currentY + 1],
        [currentX, currentY - 1],
      ];

      for (let i = 0; i < neighbors.length; i++) {
        const [nx, ny] = neighbors[i];

        if (
          nx >= 0 &&
          nx < w &&
          ny >= startY &&
          ny < h
        ) {
          const index = ny * w + nx;

          if (
            !isBackground[index] &&
            isWhite(nx, ny)
          ) {
            isBackground[index] = 1;

            queue.push(nx, ny);
          }
        }
      }
    }

    // -------------------------------------------------------------------------
    // Aplica alpha = 0 ao fundo detectado nas linhas 1 a 7.
    // -------------------------------------------------------------------------

    let transparentCount = 0;

    for (let i = startY * w; i < isBackground.length; i++) {
      if (isBackground[i]) {
        data[i * 4 + 3] = 0;
        transparentCount++;
      }
    }

    console.log(
      '[HeroSprite2D] Pixels das linhas 1-7 tornados transparentes:',
      transparentCount,
      'de',
      isBackground.length - startY * w
    );

    ctx.putImageData(imgData, 0, 0);

    // =========================================================================
    // TEXTURA
    // =========================================================================
    //
    // Utilizamos o mesmo helper de Pixel Art do projeto.
    //
    // Isso garante:
    //   - RGBA8
    //   - FILTER_NEAREST
    //   - sem mipmaps
    //   - clamp nas bordas
    // =========================================================================

    const texture = createPixelTexture(
      device,
      atlasCanvas,
      false,
      'eldrim_hero_sprite_atlas'
    );

    this.texture = texture;

    // =========================================================================
    // MATERIAL
    // =========================================================================

    this.material.diffuseMap = texture;
    this.material.emissiveMap = texture;
    this.material.emissive = new Color(1, 1, 1);

    this.material.opacityMap = texture;
    this.material.opacityMapChannel = 'a';
    this.material.blendType = BLEND_NORMAL;
    this.material.alphaTest = 0.05;
    this.material.depthWrite = false;

    // Garantia adicional de que os três mapas utilizem exatamente o mesmo UV.
    this.material.opacityMapTiling.copy(
      this.material.diffuseMapTiling
    );

    this.material.opacityMapOffset.copy(
      this.material.diffuseMapOffset
    );

    this.material.emissiveMapTiling.copy(
      this.material.diffuseMapTiling
    );

    this.material.emissiveMapOffset.copy(
      this.material.diffuseMapOffset
    );

    this.material.update();

    this.meshInstance.material = this.material;

    console.log(
      '[HeroSprite2D] Atlas criado.',
      'opacityMap:',
      !!this.material.opacityMap,
      '| blendType:',
      this.material.blendType,
      '| alphaTest:',
      this.material.alphaTest
    );

    // -------------------------------------------------------------------------
    // Mostra novamente o frame atualmente selecionado.
    // -------------------------------------------------------------------------

    this.setFrame(
      this.currentCol >= 0
        ? this.currentCol
        : 0,

      this.currentRow >= 0
        ? this.currentRow
        : 0,

      this.currentFlipX
    );
  }

  // ===========================================================================
  // VISIBILIDADE
  // ===========================================================================

  public setVisible(visible: boolean): void {
    this.rootEntity.enabled = visible;
  }

  // ===========================================================================
  // UPDATE PRINCIPAL
  // ===========================================================================

  public update(
    dt: number,
    state: HeroState,
    facing: Direction,
    stateTimer: number,
    isMoving: boolean,
    jumpHeight: number = 0,
    isGrounded: boolean = true
  ): void {
    this.spriteEntity.setLocalPosition(
      0,
      jumpHeight,
      0.1
    );

    // -------------------------------------------------------------------------
    // Determina qual animação deve ser utilizada.
    // -------------------------------------------------------------------------

    const animationName =
      this.getAnimationName(
        state,
        facing,
        isMoving
      );

    const animation =
      ANIMATIONS[animationName] ||
      ANIMATIONS.idle;

    // -------------------------------------------------------------------------
    // Quando muda de animação, começa no frame 0.
    // -------------------------------------------------------------------------

    if (animationName !== this.animationName) {
      this.animationName = animationName;
      this.animationFrame = 0;
      this.animationTimer = 0;
    }

    // -------------------------------------------------------------------------
    // Atualização explícita da animação.
    //
    // IMPORTANTE:
    // Não usamos stateTimer para walk/run.
    //
    // stateTimer pertence à máquina de estados das ações.
    // A caminhada precisa possuir seu próprio relógio.
    // -------------------------------------------------------------------------

    this.animationTimer += dt;

    const frameDuration = 1 / animation.fps;

    while (this.animationTimer >= frameDuration) {
      this.animationTimer -= frameDuration;

      this.animationFrame++;

      if (this.animationFrame >= animation.frames.length) {
        if (animation.loop) {
          this.animationFrame = 0;
        } else {
          this.animationFrame =
            animation.frames.length - 1;
        }
      }
    }

    const col =
      animation.frames[this.animationFrame] ?? 0;

    const row = animation.row;

    // -------------------------------------------------------------------------
    // FLIP HORIZONTAL
    //
    // REGRA ÚNICA DO PROJETO:
    //
    // esquerda  -> espelha
    // direita   -> imagem original
    //
    // Cima/baixo não possuem flip.
    // -------------------------------------------------------------------------

    const flipX =
      facing === 'left';

    if (
      col !== this.currentCol ||
      row !== this.currentRow ||
      flipX !== this.currentFlipX
    ) {
      this.currentCol = col;
      this.currentRow = row;
      this.currentFlipX = flipX;

      this.setFrame(
        col,
        row,
        flipX
      );

      console.debug(
        '[HeroSprite2D] frame:',
        {
          animation: animationName,
          row,
          col,
          flipX,
          facing,
        }
      );
    }

    // -------------------------------------------------------------------------
    // Estados especiais.
    //
    // Eles não utilizam o controlador de walk/run porque possuem duração
    // determinada pela máquina de estados.
    // -------------------------------------------------------------------------

    switch (state) {
      case 'jump':
      case 'fall':
        this.updateJumpAnimation(
          state,
          facing,
          jumpHeight
        );
        break;

      case 'attack':
      case 'heavy_attack':
        this.updateAttackAnimation(
          state,
          facing,
          stateTimer
        );
        break;

      case 'dodge':
        this.updateDodgeAnimation(
          facing
        );
        break;

      case 'arcane_flow':
        this.updateArcaneAnimation(
          stateTimer
        );
        break;

      case 'hurt':
      case 'death':
        this.updateHurtDeathAnimation(
          facing
        );
        break;

      default:
        break;
    }
  }

  // ===========================================================================
  // IDENTIFICAÇÃO DA ANIMAÇÃO DE LOCOMOÇÃO
  // ===========================================================================

  private getAnimationName(
    state: HeroState,
    facing: Direction,
    isMoving: boolean
  ): string {
    if (state === 'idle' || !isMoving) {
      return 'idle';
    }

    const prefix =
      state === 'run'
        ? 'run'
        : 'walk';

    switch (facing) {
      case 'up':
        return `${prefix}_up`;

      case 'down':
        return `${prefix}_down`;

      case 'left':
      case 'right':
      default:
        return `${prefix}_side`;
    }
  }

  // ===========================================================================
  // PULO
  // ===========================================================================

  private updateJumpAnimation(
    state: HeroState,
    facing: Direction,
    jumpHeight: number
  ): void {
    const row = 4;

    let col = 0;

    if (state === 'jump') {
      col =
        jumpHeight > 8
          ? 1
          : 0;
    } else {
      col = 2;
    }

    const flipX =
      facing === 'left';

    this.applyFrameIfChanged(
      col,
      row,
      flipX
    );
  }

  // ===========================================================================
  // ATAQUE
  // ===========================================================================

  private updateAttackAnimation(
    state: HeroState,
    facing: Direction,
    stateTimer: number
  ): void {
    const maxDuration =
      state === 'heavy_attack'
        ? HEAVY_ATTACK_DURATION
        : ATTACK_DURATION;

    const progress =
      Math.min(
        0.99,
        Math.max(
          0,
          1 - stateTimer / maxDuration
        )
      );

    const col =
      Math.min(
        2,
        Math.floor(progress * 3)
      );

    let row: number;

    if (
      facing === 'up' ||
      facing === 'down'
    ) {
      row = 5;
    } else {
      row = 6;
    }

    const flipX =
      facing === 'left';

    this.applyFrameIfChanged(
      col,
      row,
      flipX
    );
  }

  // ===========================================================================
  // ESQUIVA
  // ===========================================================================

  private updateDodgeAnimation(
    facing: Direction
  ): void {
    const flipX =
      facing === 'left';

    this.applyFrameIfChanged(
      0,
      4,
      flipX
    );
  }

  // ===========================================================================
  // MAGIA
  // ===========================================================================

  private updateArcaneAnimation(
    stateTimer: number
  ): void {
    const progress =
      Math.min(
        0.99,
        Math.max(
          0,
          1 - stateTimer / ARCANE_DURATION
        )
      );

    const col =
      Math.min(
        2,
        Math.floor(progress * 3)
      );

    this.applyFrameIfChanged(
      col,
      7,
      false
    );
  }

  // ===========================================================================
  // DANO / MORTE
  // ===========================================================================

  private updateHurtDeathAnimation(
    facing: Direction
  ): void {
    const flipX =
      facing === 'left';

    this.applyFrameIfChanged(
      0,
      0,
      flipX
    );
  }

  // ===========================================================================
  // APLICA FRAME SOMENTE QUANDO NECESSÁRIO
  // ===========================================================================

  private applyFrameIfChanged(
    col: number,
    row: number,
    flipX: boolean
  ): void {
    if (
      col === this.currentCol &&
      row === this.currentRow &&
      flipX === this.currentFlipX
    ) {
      return;
    }

    this.currentCol = col;
    this.currentRow = row;
    this.currentFlipX = flipX;

    this.setFrame(
      col,
      row,
      flipX
    );
  }

  // ===========================================================================
  // SELEÇÃO DO FRAME NO ATLAS
  // ===========================================================================

  private setFrame(
    col: number,
    row: number,
    flipX: boolean
  ): void {
    // -------------------------------------------------------------------------
    // Coordenadas UV explícitas baseadas nas dimensões físicas reais do atlas.
    // Preserva a resolução nativa de cada linha sem distorção.
    // -------------------------------------------------------------------------
    const rowUVs = FRAME_UVS[row] || FRAME_UVS[0];
    const frameUV = rowUVs[col] || rowUVs[0];

    let u0 = frameUV.u0;
    let u1 = frameUV.u1;
    const v0 = frameUV.v0;
    const v1 = frameUV.v1;

    // -------------------------------------------------------------------------
    // Espelhamento horizontal.
    //
    // Em vez de alterar a geometria do quad, apenas invertemos U.
    // -------------------------------------------------------------------------

    if (flipX) {
      const temp = u0;

      u0 = u1;
      u1 = temp;
    }

    const uvs = [
      u0, v1, // Bottom-Left
      u1, v1, // Bottom-Right
      u1, v0, // Top-Right
      u0, v0, // Top-Left
    ];

    // -------------------------------------------------------------------------
    // Normalização geométrica do Quad por frame
    //
    // Alinha os pés rigorosamente na linha de apoio do mundo (REF_GROUND_Y),
    // equaliza a escala corporal com o Idle mestre e centraliza o eixo de massa.
    // -------------------------------------------------------------------------
    const rowMetrics = FRAME_METRICS[row] || FRAME_METRICS[0];
    const metrics = rowMetrics[col] || rowMetrics[0];

    const left = flipX
      ? -((1 - metrics.pivotX) * metrics.visualWidth)
      : -(metrics.pivotX * metrics.visualWidth);

    const right = left + metrics.visualWidth;

    const bottom =
      REF_GROUND_Y -
      (1 - metrics.pivotY) * metrics.visualHeight +
      metrics.feetOffsetY;

    const top = bottom + metrics.visualHeight;

    const positions = [
      left, bottom, 0,
      right, bottom, 0,
      right, top, 0,
      left, top, 0,
    ];

    this.mesh.setPositions(positions);
    this.mesh.setUvs(
      0,
      uvs
    );

    this.mesh.update();
  }

  // ===========================================================================
  // CRIAÇÃO DO QUAD
  // ===========================================================================

  private createDynamicQuadMesh(
    device: GraphicsDevice
  ): Mesh {
    const w = this.width;
    const h = this.height;

    const px = 0.5;
    const py = 0.06;

    const left =
      -w * px;

    const right =
      w * (1 - px);

    const bottom =
      -h * py;

    const top =
      h * (1 - py);

    const positions = [
      left, bottom, 0,
      right, bottom, 0,
      right, top, 0,
      left, top, 0,
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

    const indices = [
      0, 1, 2,
      0, 2, 3,
    ];

    const mesh =
      new Mesh(device);

    mesh.setPositions(
      positions
    );

    mesh.setNormals(
      normals
    );

    mesh.setUvs(
      0,
      uvs
    );

    mesh.setIndices(
      indices
    );

    mesh.update();

    return mesh;
  }

  // ===========================================================================
  // DESTRUIÇÃO
  // ===========================================================================

  public destroy(): void {
    if (this.texture) {
      try {
        this.texture.destroy();
      } catch {
        // Textura já destruída.
      }
    }

    this.rootEntity.destroy();
  }
}