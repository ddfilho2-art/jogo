import { Entity, GraphicsDevice, MeshInstance, StandardMaterial } from 'playcanvas';
import { PlayCanvasAssets } from '../assets/PlayCanvasAssets';
import { createPixelQuadMesh } from '../rendering/PixelQuadMesh';
import { createPixelMaterial } from '../rendering/GraphicsBackend';

// =============================================================================
// ELDRIM: ECOS DO PASSADO - WATER SYSTEM (PLAYCANVAS ENGINE V2)
// =============================================================================
// Demonstração técnica do leito de rio do Vale Verdejante:
// - Deslocamento contínuo de UV no material (fluxo de correnteza)
// - Ondulação e transparência no plano de água
// =============================================================================

export class WaterSystem {
  public rootEntity: Entity;
  private material: StandardMaterial;
  private flowSpeedX = 0.04;
  private flowSpeedY = 0.01;
  private uOffset = 0;
  private vOffset = 0;

  constructor(device: GraphicsDevice, x: number, y: number, width: number, height: number) {
    this.rootEntity = new Entity('RiverStream');
    this.rootEntity.setPosition(x, y, 1.5); // Acima do terreno base

    const mesh = createPixelQuadMesh(device, { width, height, pivotX: 0.5, pivotY: 0.5 });
    this.material = createPixelMaterial({
      diffuseMap: PlayCanvasAssets.getTexture('water_stream'),
      transparent: true,
      opacity: 0.52,
    });

    // Tiling para cobrir o leito do rio repetindo suavemente
    const tilingX = width / 64;
    const tilingY = height / 64;
    this.material.diffuseMapTiling.set(tilingX, tilingY);
    this.material.opacityMapTiling.set(tilingX, tilingY);
    if (this.material.emissiveMap) {
      this.material.emissiveMapTiling.set(tilingX, tilingY);
    }
    this.material.update();

    this.rootEntity.addComponent('render', {
      meshInstances: [new MeshInstance(mesh, this.material)],
    });
  }

  update(dt: number, time: number): void {
    // Fluxo contínuo da correnteza
    this.uOffset += this.flowSpeedX * dt;
    this.vOffset = Math.sin(time * 1.2) * 0.02;

    this.material.diffuseMapOffset.set(this.uOffset, this.vOffset);
    this.material.opacityMapOffset.set(this.uOffset, this.vOffset);
    if (this.material.emissiveMap) {
      this.material.emissiveMapOffset.set(this.uOffset, this.vOffset);
    }
    this.material.update();
  }
}
