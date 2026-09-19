// =============================================================================
// ELDRIM: ECOS DO PASSADO - HERO SPRITE 2D (PROTÓTIPO B - SPRITE 2D TRADICIONAL)
// =============================================================================
// Implementação de tecnologia puramente 2D para o Herói Guerreiro:
// - Carrega a textura real aprovada (ren_hero_master.jpg)
// - Renderização com filtro NEAREST sem borrões (alta fidelidade pixel art)
// - Suporte a 4 direções e animações responsivas de estado (Idle, Walk, Run, Attack, Dodge, etc.)
// - Conformidade estrita com a Regra 29 (createPixelMaterial unlit emissiveMap)
// =============================================================================

import {
  Entity,
  FILTER_NEAREST,
  GraphicsDevice,
  Mesh,
  MeshInstance,
  StandardMaterial,
  Texture,
} from 'playcanvas';
import { Direction } from '../systems/InputSystem';
import { HeroState, IHeroVisual } from './HeroVisualTypes';
import { createPixelMaterial } from '../rendering/GraphicsBackend';
import renHeroMasterUrl from '../../assets/images/ren_hero_master.jpg';

export class HeroSprite2D implements IHeroVisual {
  public readonly rootEntity: Entity;
  private spriteEntity: Entity;
  private mesh: Mesh;
  private material: StandardMaterial;
  private texture: Texture | null = null;

  private currentFlipX = false;
  private readonly width = 34;
  private readonly height = 62;

  constructor(device: GraphicsDevice) {
    this.rootEntity = new Entity('Hero_PrototypeB_Root');

    this.spriteEntity = new Entity('Hero_Sprite2D_Quad');
    this.rootEntity.addChild(this.spriteEntity);

    // Cria malha Quad dedicada com pivô na base dos pés (pivotX: 0.5, pivotY: 0.06)
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

    // Carregamento da textura real do Protótipo B conforme padrão obrigatório
    this.carregarTexturaMestre(device);

    this.setFlip(false);
  }

  private carregarTexturaMestre(device: GraphicsDevice): void {
    const image = new Image();
    image.onload = () => {
      // Cria canvas offscreen para remoção do fundo branco externo da imagem do guerreiro
      const canvas = document.createElement('canvas');
      canvas.width = image.width;
      canvas.height = image.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(image, 0, 0);

      const imgData = ctx.getImageData(0, 0, image.width, image.height);
      const data = imgData.data;
      const w = image.width;
      const h = image.height;

      // Flood fill externo para remoção limpa do fundo branco
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

      for (let i = 0; i < isBg.length; i++) {
        if (isBg[i]) {
          data[i * 4 + 3] = 0;
        }
      }
      ctx.putImageData(imgData, 0, 0);

      const texture = new Texture(device, {
        width: canvas.width,
        height: canvas.height,
        mipmaps: true,
      });
      texture.setSource(canvas);
      texture.minFilter = FILTER_NEAREST;
      texture.magFilter = FILTER_NEAREST;

      this.texture = texture;
      this.material.diffuseMap = texture;
      this.material.emissiveMap = texture;
      this.material.update();
      console.log('[HeroSprite2D] Textura real do Protótipo B carregada com sucesso a partir de ren_hero_master.jpg');
    };

    image.onerror = (err) => {
      console.error('[HeroSprite2D] Erro ao carregar imagem mestre do herói:', err);
    };

    image.src = renHeroMasterUrl;
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
    const shouldFlip = facing === 'left';
    if (shouldFlip !== this.currentFlipX) {
      this.setFlip(shouldFlip);
    }

    // Feedback dinâmico de pose e locomoção do guerreiro
    let offsetX = 0;
    let offsetY = jumpHeight;
    let rotZ = 0;
    let scaleX = 1;
    let scaleY = 1;

    switch (state) {
      case 'idle':
        // Respiração sutil
        scaleY = 1 + Math.sin(stateTimer * 3.5) * 0.02;
        scaleX = 1 - Math.sin(stateTimer * 3.5) * 0.01;
        break;

      case 'walk':
        // Passo rítmico
        offsetY += Math.abs(Math.sin(stateTimer * 12)) * 2;
        rotZ = Math.sin(stateTimer * 12) * (facing === 'left' ? -3 : 3);
        break;

      case 'run':
        // Corrida ágil e inclinação
        offsetY += Math.abs(Math.sin(stateTimer * 18)) * 3.5;
        rotZ = facing === 'left' ? -6 : 6;
        break;

      case 'attack':
        // Lunge e arco de ataque com a espada
        {
          const progress = Math.min(1, Math.max(0, 1 - stateTimer / 0.35));
          offsetX = (facing === 'left' ? -1 : 1) * Math.sin(progress * Math.PI) * 4;
          rotZ = (facing === 'left' ? -1 : 1) * (15 - progress * 25);
          scaleX = 1.05;
          scaleY = 1.05;
        }
        break;

      case 'heavy_attack':
        // Golpe pesado
        {
          const progress = Math.min(1, Math.max(0, 1 - stateTimer / 0.55));
          offsetX = (facing === 'left' ? -1 : 1) * Math.sin(progress * Math.PI) * 7;
          rotZ = (facing === 'left' ? -1 : 1) * (20 - progress * 32);
          scaleX = 1.1;
          scaleY = 1.1;
        }
        break;

      case 'dodge':
        // Esquiva em rolamento / slide
        {
          const progress = Math.min(1, Math.max(0, 1 - stateTimer / 0.3));
          scaleY = 0.75 + Math.sin(progress * Math.PI) * 0.15;
          scaleX = 1.15;
          rotZ = (facing === 'left' ? -1 : 1) * (progress * -20);
        }
        break;

      case 'arcane_flow':
        // Carga arcana pulsante
        {
          const pulse = 1.08 + Math.sin(stateTimer * 20) * 0.06;
          scaleX = pulse;
          scaleY = pulse;
        }
        break;

      case 'hurt':
        // Tremor de impacto
        offsetX = Math.sin(stateTimer * 45) * 3;
        break;
    }

    this.spriteEntity.setLocalPosition(offsetX, offsetY, 0.1);
    this.spriteEntity.setLocalEulerAngles(0, 0, rotZ);
    this.spriteEntity.setLocalScale(scaleX, scaleY, 1);
  }

  private setFlip(flipX: boolean): void {
    this.currentFlipX = flipX;

    const u0 = flipX ? 1 : 0;
    const u1 = flipX ? 0 : 1;

    // UVs para Quad: BL, BR, TR, TL (alinhado com createPixelQuadMesh)
    const uvs = [
      u0, 1, // Bottom-Left
      u1, 1, // Bottom-Right
      u1, 0, // Top-Right
      u0, 0, // Top-Left
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
