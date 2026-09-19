import { Entity, GraphicsDevice, MeshInstance } from 'playcanvas';
import { PlayCanvasAssets } from '../assets/PlayCanvasAssets';
import { createPixelQuadMesh } from '../rendering/PixelQuadMesh';
import { createPixelMaterial } from '../rendering/GraphicsBackend';
import { CollisionSystem } from '../systems/CollisionSystem';

// =============================================================================
// ELDRIM: ECOS DO PASSADO - ENVIRONMENT ENTITIES (PLAYCANVAS ENGINE V2)
// =============================================================================
// Entidades ambientais do Vale Verdejante:
// - Árvores orgânicas grandes e médias com sombras e oscilação orgânica de vento
// - Rochas facetadas 3D com musgo e base de colisão desacoplada
// - Vegetação ribeirinha e vitória-régia com flutuação procedural
// =============================================================================

export type TreeType = 'ancient' | 'large' | 'med' | 'small';
export type RockType = 'large' | 'med' | 'small' | 'cluster';

export class TreeEntity {
  public rootEntity: Entity;
  private trunkEntity: Entity;
  private shadowEntity: Entity;
  private windPhase: number;

  public readonly x: number;
  public readonly y: number;

  constructor(
    device: GraphicsDevice,
    x: number,
    y: number,
    treeTypeOrIsLarge: TreeType | boolean,
    collision: CollisionSystem,
    id: string
  ) {
    this.x = x;
    this.y = y;
    this.windPhase = Math.random() * Math.PI * 2;
    this.rootEntity = new Entity(id);
    this.rootEntity.setPosition(x, y, 10);

    let type: TreeType = 'large';
    if (typeof treeTypeOrIsLarge === 'boolean') {
      type = treeTypeOrIsLarge ? 'large' : 'med';
    } else {
      type = treeTypeOrIsLarge;
    }

    let width = 160;
    let height = 176;
    let shadowW = 168;
    let shadowH = 72;
    let texName = 'tree_large';
    let shadowTex = 'sombra_tree_large';
    let colW = 32;
    let colH = 18;

    switch (type) {
      case 'ancient':
        width = 192;
        height = 208;
        shadowW = 200;
        shadowH = 84;
        texName = 'tree_ancient';
        shadowTex = 'sombra_tree_ancient';
        colW = 42;
        colH = 22;
        break;
      case 'large':
        width = 160;
        height = 176;
        shadowW = 168;
        shadowH = 72;
        texName = 'tree_large';
        shadowTex = 'sombra_tree_large';
        colW = 32;
        colH = 18;
        break;
      case 'med':
        width = 112;
        height = 128;
        shadowW = 120;
        shadowH = 52;
        texName = 'tree_med';
        shadowTex = 'sombra_tree_med';
        colW = 22;
        colH = 14;
        break;
      case 'small':
        width = 72;
        height = 88;
        shadowW = 76;
        shadowH = 36;
        texName = 'tree_small';
        shadowTex = 'sombra_tree_small';
        colW = 16;
        colH = 10;
        break;
    }

    // 1. Sombra projetada no solo
    this.shadowEntity = new Entity(`${id}_Shadow`);
    const sMesh = createPixelQuadMesh(device, { width: shadowW, height: shadowH, pivotX: 0.5, pivotY: 0.5 });
    const sMat = createPixelMaterial({
      diffuseMap: PlayCanvasAssets.getTexture(shadowTex),
      transparent: true,
      opacity: 0.82,
    });
    this.shadowEntity.addComponent('render', {
      meshInstances: [new MeshInstance(sMesh, sMat)],
    });
    this.shadowEntity.setLocalPosition(0, -6, -0.05);
    this.rootEntity.addChild(this.shadowEntity);

    // 2. Copa e tronco (âncora na base da raiz para ordenação de profundidade Y)
    this.trunkEntity = new Entity(`${id}_Visual`);
    const tMesh = createPixelQuadMesh(device, { width, height, pivotX: 0.5, pivotY: 0.09 });
    const tMat = createPixelMaterial({
      diffuseMap: PlayCanvasAssets.getTexture(texName),
      transparent: true,
      alphaTest: 0.1,
      depthWrite: false,
    });
    this.trunkEntity.addComponent('render', {
      meshInstances: [new MeshInstance(tMesh, tMat)],
    });
    this.trunkEntity.setLocalPosition(0, 0, 0);
    this.rootEntity.addChild(this.trunkEntity);

    // 3. Colisor na base do tronco (apenas na raiz, permitindo andar atrás da copa)
    collision.addCollider({
      id,
      x,
      y: y + 4,
      width: colW,
      height: colH,
    });
  }

  update(dt: number, time: number): void {
    // Balanço sutil de vento na copa (independente e assimétrico)
    const swayAngle = Math.sin(time * 1.6 + this.windPhase) * 1.0;
    this.trunkEntity.setLocalEulerAngles(0, 0, swayAngle);
  }

  /**
   * Ponto de referência de profundidade (Depth Sorting 2.5D):
   * A referência deve ser: BASE DO TRONCO / PONTO DE CONTATO DA ÁRVORE COM O SOLO.
   */
  public getBaseY(): number {
    return this.y;
  }
}

export class RockEntity {
  public rootEntity: Entity;

  constructor(
    device: GraphicsDevice,
    x: number,
    y: number,
    collision: CollisionSystem,
    id: string,
    rockType: RockType = 'large'
  ) {
    this.rootEntity = new Entity(id);
    this.rootEntity.setPosition(x, y, 10);

    let width = 64;
    let height = 48;
    let shadowW = 72;
    let shadowH = 28;
    let texName = 'rock_large';
    let shadowTex = 'sombra_rock';
    let colW = 44;
    let colH = 20;

    switch (rockType) {
      case 'large':
        width = 64;
        height = 48;
        shadowW = 72;
        shadowH = 28;
        texName = 'rock_large';
        shadowTex = 'sombra_rock';
        colW = 44;
        colH = 20;
        break;
      case 'med':
        width = 48;
        height = 36;
        shadowW = 54;
        shadowH = 22;
        texName = 'rock_med';
        shadowTex = 'sombra_rock_med';
        colW = 34;
        colH = 16;
        break;
      case 'small':
        width = 24;
        height = 18;
        shadowW = 30;
        shadowH = 12;
        texName = 'rock_small';
        shadowTex = 'sombra_rock_small';
        colW = 16;
        colH = 10;
        break;
      case 'cluster':
        width = 54;
        height = 28;
        shadowW = 58;
        shadowH = 18;
        texName = 'rock_cluster';
        shadowTex = 'sombra_rock_cluster';
        colW = 40;
        colH = 14;
        break;
    }

    // 1. Sombra da rocha
    const sEntity = new Entity(`${id}_Shadow`);
    const sMesh = createPixelQuadMesh(device, { width: shadowW, height: shadowH, pivotX: 0.5, pivotY: 0.5 });
    const sMat = createPixelMaterial({
      diffuseMap: PlayCanvasAssets.getTexture(shadowTex),
      transparent: true,
      opacity: 0.8,
    });
    sEntity.addComponent('render', {
      meshInstances: [new MeshInstance(sMesh, sMat)],
    });
    sEntity.setLocalPosition(0, -4, -0.05);
    this.rootEntity.addChild(sEntity);

    // 2. Rocha visual
    const rEntity = new Entity(`${id}_Visual`);
    const rMesh = createPixelQuadMesh(device, { width, height, pivotX: 0.5, pivotY: 0.15 });
    const rMat = createPixelMaterial({
      diffuseMap: PlayCanvasAssets.getTexture(texName),
      transparent: true,
      alphaTest: 0.1,
      depthWrite: false,
    });
    rEntity.addComponent('render', {
      meshInstances: [new MeshInstance(rMesh, rMat)],
    });
    rEntity.setLocalPosition(0, 0, 0);
    this.rootEntity.addChild(rEntity);

    // 3. Colisor na base da rocha
    collision.addCollider({
      id,
      x,
      y: y + 6,
      width: colW,
      height: colH,
    });
  }

  public getBaseY(): number {
    return this.rootEntity.getPosition().y;
  }
}

export class WaterLilyEntity {
  public rootEntity: Entity;
  private baseY: number;
  private phase: number;

  constructor(device: GraphicsDevice, x: number, y: number, id: string) {
    this.baseY = y;
    this.phase = Math.random() * Math.PI * 2;

    this.rootEntity = new Entity(id);
    this.rootEntity.setPosition(x, y, 2.5); // Acima do leito do rio

    const mesh = createPixelQuadMesh(device, { width: 28, height: 28, pivotX: 0.5, pivotY: 0.5 });
    const mat = createPixelMaterial({
      diffuseMap: PlayCanvasAssets.getTexture('water_lily'),
      transparent: true,
    });
    this.rootEntity.addComponent('render', {
      meshInstances: [new MeshInstance(mesh, mat)],
    });
  }

  update(time: number): void {
    // Flutuação procedural vertical e leve rotação com o rio
    const bobY = Math.sin(time * 2.2 + this.phase) * 1.5;
    const bobRot = Math.cos(time * 1.5 + this.phase) * 2.0;
    this.rootEntity.setPosition(this.rootEntity.getPosition().x, this.baseY + bobY, 2.5);
    this.rootEntity.setLocalEulerAngles(0, 0, bobRot);
  }
}

export class BushEntity {
  public rootEntity: Entity;
  private visualEntity: Entity;
  private windPhase: number;

  constructor(device: GraphicsDevice, x: number, y: number, id: string) {
    this.windPhase = Math.random() * Math.PI * 2;
    this.rootEntity = new Entity(id);
    this.rootEntity.setPosition(x, y, 6);

    this.visualEntity = new Entity(`${id}_Visual`);
    const mesh = createPixelQuadMesh(device, { width: 42, height: 34, pivotX: 0.5, pivotY: 0.15 });
    const mat = createPixelMaterial({
      diffuseMap: PlayCanvasAssets.getTexture('bush'),
      transparent: true,
    });
    this.visualEntity.addComponent('render', {
      meshInstances: [new MeshInstance(mesh, mat)],
    });
    this.rootEntity.addChild(this.visualEntity);
  }

  update(time: number): void {
    const sway = Math.sin(time * 2.0 + this.windPhase) * 1.6;
    this.visualEntity.setLocalEulerAngles(0, 0, sway);
  }

  public getBaseY(): number {
    return this.rootEntity.getPosition().y;
  }
}

export class FlowerTuftEntity {
  public rootEntity: Entity;
  private visualEntity: Entity;
  private windPhase: number;

  constructor(device: GraphicsDevice, x: number, y: number, id: string) {
    this.windPhase = Math.random() * Math.PI * 2;
    this.rootEntity = new Entity(id);
    this.rootEntity.setPosition(x, y, 4);

    this.visualEntity = new Entity(`${id}_Visual`);
    const mesh = createPixelQuadMesh(device, { width: 32, height: 24, pivotX: 0.5, pivotY: 0.1 });
    const mat = createPixelMaterial({
      diffuseMap: PlayCanvasAssets.getTexture('flowers_tuft'),
      transparent: true,
    });
    this.visualEntity.addComponent('render', {
      meshInstances: [new MeshInstance(mesh, mat)],
    });
    this.rootEntity.addChild(this.visualEntity);
  }

  update(time: number): void {
    const sway = Math.sin(time * 2.6 + this.windPhase) * 2.2;
    this.visualEntity.setLocalEulerAngles(0, 0, sway);
  }
}

export class FallenLogEntity {
  public rootEntity: Entity;

  constructor(device: GraphicsDevice, x: number, y: number, collision: CollisionSystem, id: string) {
    this.rootEntity = new Entity(id);
    this.rootEntity.setPosition(x, y, 7);

    // Sombra do tronco no chão
    const shadowEntity = new Entity(`${id}_Shadow`);
    const sMesh = createPixelQuadMesh(device, { width: 88, height: 24, pivotX: 0.5, pivotY: 0.5 });
    const sMat = createPixelMaterial({
      diffuseMap: PlayCanvasAssets.getTexture('sombra_log'),
      transparent: true,
      opacity: 0.75,
    });
    shadowEntity.addComponent('render', {
      meshInstances: [new MeshInstance(sMesh, sMat)],
    });
    shadowEntity.setLocalPosition(0, -3, -0.05);
    this.rootEntity.addChild(shadowEntity);

    // Tronco visual
    const visualEntity = new Entity(`${id}_Visual`);
    const mesh = createPixelQuadMesh(device, { width: 80, height: 32, pivotX: 0.5, pivotY: 0.25 });
    const mat = createPixelMaterial({
      diffuseMap: PlayCanvasAssets.getTexture('fallen_log'),
      transparent: true,
    });
    visualEntity.addComponent('render', {
      meshInstances: [new MeshInstance(mesh, mat)],
    });
    this.rootEntity.addChild(visualEntity);

    // Colisor físico horizontal
    collision.addCollider({
      id,
      x,
      y: y + 4,
      width: 68,
      height: 14,
    });
  }
}

export class WoodenBridgeEntity {
  public rootEntity: Entity;

  constructor(device: GraphicsDevice, x: number, y: number, id = 'Wooden_Bridge') {
    this.rootEntity = new Entity(id);
    this.rootEntity.setPosition(x, y, 3); // Sobre o leito do rio (z=1.5..2.5), abaixo de Ren (z=10..15)

    // Sombra sobre a água
    const shadowEntity = new Entity(`${id}_Shadow`);
    const sMesh = createPixelQuadMesh(device, { width: 204, height: 48, pivotX: 0.5, pivotY: 0.5 });
    const sMat = createPixelMaterial({
      diffuseMap: PlayCanvasAssets.getTexture('sombra_bridge'),
      transparent: true,
      opacity: 0.5,
    });
    shadowEntity.addComponent('render', {
      meshInstances: [new MeshInstance(sMesh, sMat)],
    });
    shadowEntity.setLocalPosition(0, -4, -0.1);
    this.rootEntity.addChild(shadowEntity);

    // Tablado da ponte
    const bridgeEntity = new Entity(`${id}_Deck`);
    const mesh = createPixelQuadMesh(device, { width: 196, height: 42, pivotX: 0.5, pivotY: 0.5 });
    const mat = createPixelMaterial({
      diffuseMap: PlayCanvasAssets.getTexture('wooden_bridge'),
      transparent: true,
    });
    bridgeEntity.addComponent('render', {
      meshInstances: [new MeshInstance(mesh, mat)],
    });
    this.rootEntity.addChild(bridgeEntity);
  }
}

export class WoodSignEntity {
  public rootEntity: Entity;

  constructor(device: GraphicsDevice, x: number, y: number, collision: CollisionSystem, id: string) {
    this.rootEntity = new Entity(id);
    this.rootEntity.setPosition(x, y, 8);

    const visualEntity = new Entity(`${id}_Visual`);
    const mesh = createPixelQuadMesh(device, { width: 28, height: 36, pivotX: 0.5, pivotY: 0.15 });
    const mat = createPixelMaterial({
      diffuseMap: PlayCanvasAssets.getTexture('wood_sign'),
      transparent: true,
    });
    visualEntity.addComponent('render', {
      meshInstances: [new MeshInstance(mesh, mat)],
    });
    this.rootEntity.addChild(visualEntity);

    collision.addCollider({
      id,
      x,
      y: y + 2,
      width: 14,
      height: 10,
    });
  }
}

export class AncientCrystalEntity {
  public rootEntity: Entity;
  private visualEntity: Entity;
  private baseScale = 1.0;

  constructor(device: GraphicsDevice, x: number, y: number, collision: CollisionSystem, id: string) {
    this.rootEntity = new Entity(id);
    this.rootEntity.setPosition(x, y, 7);

    this.visualEntity = new Entity(`${id}_Visual`);
    const mesh = createPixelQuadMesh(device, { width: 24, height: 32, pivotX: 0.5, pivotY: 0.18 });
    const mat = createPixelMaterial({
      diffuseMap: PlayCanvasAssets.getTexture('ancient_crystal_small'),
      transparent: true,
    });
    this.visualEntity.addComponent('render', {
      meshInstances: [new MeshInstance(mesh, mat)],
    });
    this.rootEntity.addChild(this.visualEntity);

    collision.addCollider({
      id,
      x,
      y: y + 4,
      width: 16,
      height: 12,
    });
  }

  update(time: number): void {
    // Leve pulsação rúnica esmeralda
    const pulse = 1.0 + Math.sin(time * 3.0) * 0.04;
    this.visualEntity.setLocalScale(pulse, pulse, 1.0);
  }
}

export class RiverStonesEntity {
  public rootEntity: Entity;

  constructor(device: GraphicsDevice, x: number, y: number, id: string) {
    this.rootEntity = new Entity(id);
    this.rootEntity.setPosition(x, y, 2.8); // Na água rente à margem

    const mesh = createPixelQuadMesh(device, { width: 44, height: 22, pivotX: 0.5, pivotY: 0.5 });
    const mat = createPixelMaterial({
      diffuseMap: PlayCanvasAssets.getTexture('river_stones'),
      transparent: true,
      opacity: 0.92,
    });
    this.rootEntity.addComponent('render', {
      meshInstances: [new MeshInstance(mesh, mat)],
    });
  }
}

export class MushroomClusterEntity {
  public rootEntity: Entity;
  private visualEntity: Entity;
  private windPhase: number;

  constructor(device: GraphicsDevice, x: number, y: number, id: string) {
    this.windPhase = Math.random() * Math.PI * 2;
    this.rootEntity = new Entity(id);
    this.rootEntity.setPosition(x, y, 5);

    this.visualEntity = new Entity(`${id}_Visual`);
    const mesh = createPixelQuadMesh(device, { width: 24, height: 20, pivotX: 0.5, pivotY: 0.1 });
    const mat = createPixelMaterial({
      diffuseMap: PlayCanvasAssets.getTexture('mushrooms_cluster'),
      transparent: true,
    });
    this.visualEntity.addComponent('render', {
      meshInstances: [new MeshInstance(mesh, mat)],
    });
    this.rootEntity.addChild(this.visualEntity);
  }

  update(time: number): void {
    const sway = Math.sin(time * 1.8 + this.windPhase) * 1.0;
    this.visualEntity.setLocalEulerAngles(0, 0, sway);
  }
}

export class RockSmallEntity {
  public rootEntity: Entity;

  constructor(device: GraphicsDevice, x: number, y: number, collision: CollisionSystem, id: string) {
    this.rootEntity = new Entity(id);
    this.rootEntity.setPosition(x, y, 7);

    const shadowEntity = new Entity(`${id}_Shadow`);
    const sMesh = createPixelQuadMesh(device, { width: 36, height: 16, pivotX: 0.5, pivotY: 0.5 });
    const sMat = createPixelMaterial({
      diffuseMap: PlayCanvasAssets.getTexture('sombra_rock_small'),
      transparent: true,
      opacity: 0.7,
    });
    shadowEntity.addComponent('render', {
      meshInstances: [new MeshInstance(sMesh, sMat)],
    });
    shadowEntity.setLocalPosition(0, -3, -0.05);
    this.rootEntity.addChild(shadowEntity);

    const visualEntity = new Entity(`${id}_Visual`);
    const mesh = createPixelQuadMesh(device, { width: 32, height: 24, pivotX: 0.5, pivotY: 0.15 });
    const mat = createPixelMaterial({
      diffuseMap: PlayCanvasAssets.getTexture('rock_small'),
      transparent: true,
    });
    visualEntity.addComponent('render', {
      meshInstances: [new MeshInstance(mesh, mat)],
    });
    this.rootEntity.addChild(visualEntity);

    collision.addCollider({
      id,
      x,
      y: y + 4,
      width: 22,
      height: 12,
    });
  }

  public getBaseY(): number {
    return this.rootEntity.getPosition().y;
  }
}
