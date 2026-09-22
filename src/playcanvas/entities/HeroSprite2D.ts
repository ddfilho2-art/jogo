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
      '[HeroSprite2D] Iniciando montagem do atlas com',
      images.length,
      'imagens'
    );

    const rowWidth =
      images[0].naturalWidth ||
      images[0].width ||
      1024;

    const rowHeight =
      images[0].naturalHeight ||
      images[0].height ||
      256;

    console.log(
      '[HeroSprite2D] Dimensão de cada linha:',
      rowWidth,
      'x',
      rowHeight
    );

    // -------------------------------------------------------------------------
    // Canvas final:
    //
    // largura  = largura de uma linha
    // altura   = altura da linha x 8
    //
    // Cada linha contém 4 frames.
    // -------------------------------------------------------------------------

    const atlasCanvas = document.createElement('canvas');

    atlasCanvas.width = rowWidth;
    atlasCanvas.height = rowHeight * this.ROWS;

    const ctx = atlasCanvas.getContext('2d');

    if (!ctx) {
      console.error(
        '[HeroSprite2D] Sem contexto 2D do canvas!'
      );

      return;
    }

    // -------------------------------------------------------------------------
    // Desenha todas as linhas no atlas.
    // -------------------------------------------------------------------------

    for (let row = 0; row < this.ROWS; row++) {
      const img = images[row] || images[0];

      ctx.drawImage(
        img,
        0,
        row * rowHeight,
        rowWidth,
        rowHeight
      );
    }

    console.log(
      '[HeroSprite2D] 8 linhas desenhadas no canvas do atlas'
    );

    // =========================================================================
    // REMOÇÃO DO FUNDO BRANCO
    // =========================================================================
    //
    // As imagens atuais são JPEG, portanto não possuem canal alpha.
    //
    // Mantemos a remoção do fundo por flood-fill, mas somente para regiões
    // brancas conectadas às bordas.
    //
    // Isso evita transformar branco existente dentro do personagem em alpha.
    // =========================================================================

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
    // Sementes nas bordas
    // -------------------------------------------------------------------------

    for (let x = 0; x < w; x++) {
      if (isWhite(x, 0)) {
        isBackground[x] = 1;
        queue.push(x, 0);
      }

      if (isWhite(x, h - 1)) {
        isBackground[(h - 1) * w + x] = 1;
        queue.push(x, h - 1);
      }
    }

    for (let y = 0; y < h; y++) {
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
    // Flood-fill
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
          ny >= 0 &&
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
    // Aplica alpha = 0 ao fundo detectado.
    // -------------------------------------------------------------------------

    let transparentCount = 0;

    for (let i = 0; i < isBackground.length; i++) {
      if (isBackground[i]) {
        data[i * 4 + 3] = 0;
        transparentCount++;
      }
    }

    console.log(
      '[HeroSprite2D] Pixels tornados transparentes:',
      transparentCount,
      'de',
      isBackground.length,
      `(${(
        (transparentCount / isBackground.length) *
        100
      ).toFixed(1)}%)`
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

    this.material.opacityMap = texture;
    this.material.opacityMapChannel = 'a';

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
    let u0 = col / this.COLS;
    let u1 = (col + 1) / this.COLS;

    const v0 = row / this.ROWS;
    const v1 = (row + 1) / this.ROWS;

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