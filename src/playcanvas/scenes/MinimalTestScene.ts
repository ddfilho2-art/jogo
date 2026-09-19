import {
  AppBase,
  Color,
  Entity,
  GraphicsDevice,
  MeshInstance,
} from 'playcanvas';

import { createPixelQuadMesh } from '../rendering/PixelQuadMesh';
import { createPixelMaterial } from '../rendering/GraphicsBackend';
import { PlayCanvasAssets } from '../assets/PlayCanvasAssets';

export class MinimalTestScene {
  private app: AppBase;
  private device: GraphicsDevice;

  private cameraEntity!: Entity;
  private quadEntity!: Entity;

  constructor(app: AppBase) {
    this.app = app;
    this.device = app.graphicsDevice;

    // ============================================================
    // ASSETS REAIS DO ELDRIM
    // ============================================================
    PlayCanvasAssets.init(this.device);

    // ============================================================
    // CÂMERA
    // ============================================================
    this.cameraEntity = new Entity('DiagnosticCamera');

    this.cameraEntity.addComponent('camera', {
      clearColor: new Color(0.1, 0.6, 0.8, 1),
      projection: 0,
      fov: 45,
      nearClip: 0.1,
      farClip: 1000,
    });

    this.cameraEntity.setPosition(0, 0, 5);
    this.cameraEntity.lookAt(0, 0, 0);

    this.app.root.addChild(this.cameraEntity);

    // ============================================================
    // QUAD
    // ============================================================
    this.quadEntity = new Entity('DiagnosticQuad');

    const mesh = createPixelQuadMesh(this.device, {
      width: 4,
      height: 4,
      pivotX: 0.5,
      pivotY: 0.5,
    });

    const texture = PlayCanvasAssets.getTexture('terrain_grass');

    // Regra 29 e Regra 31: Validação através de createPixelMaterial() central
    const material = createPixelMaterial({
      diffuseMap: texture,
      transparent: false,
    });

    this.quadEntity.addComponent('render', {
      meshInstances: [
        new MeshInstance(mesh, material),
      ],
    });

    this.app.root.addChild(this.quadEntity);

    console.log(
      '[DIAGNOSTIC] PixelQuadMesh + terrain_grass + emissiveMap'
    );
  }

  update(_dt: number): void {}

  destroy(): void {
    this.cameraEntity.destroy();
    this.quadEntity.destroy();
    PlayCanvasAssets.clear();
  }
}