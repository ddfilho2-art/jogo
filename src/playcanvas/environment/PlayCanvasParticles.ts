import { Entity, GraphicsDevice, Mesh, MeshInstance, StandardMaterial } from 'playcanvas';
import { PlayCanvasAssets } from '../assets/PlayCanvasAssets';
import { createPixelQuadMesh } from '../rendering/PixelQuadMesh';
import { createPixelMaterial } from '../rendering/GraphicsBackend';

// =============================================================================
// ELDRIM: ECOS DO PASSADO - PARTICLES SYSTEM (PLAYCANVAS ENGINE V2)
// =============================================================================
// Partículas 2.5D no PlayCanvas:
// 1. Folhas de carvalho caindo e levadas pela brisa da floresta
// 2. Poeira de rolamento/impacto no solo
// =============================================================================

interface Particle {
  entity: Entity;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  rot: number;
  rotSpeed: number;
  life: number;
  maxLife: number;
  type: 'leaf' | 'dust' | 'firefly' | 'butterfly';
  customPhase?: number;
}

export class PlayCanvasParticles {
  public rootEntity: Entity;
  private particles: Particle[] = [];
  private leafMesh: Mesh;
  private leafMat: StandardMaterial;
  private dustMesh: Mesh;
  private dustMat: StandardMaterial;
  private fireflyMesh: Mesh;
  private fireflyMat: StandardMaterial;
  private butterflyMesh: Mesh;
  private butterflyMat: StandardMaterial;
  private butterflyGoldMat: StandardMaterial;
  private globalTime = 0;

  constructor(device: GraphicsDevice) {
    this.rootEntity = new Entity('ParticleContainer');
    this.rootEntity.setPosition(0, 0, 25); // Camada superior de atmosfera

    this.leafMesh = createPixelQuadMesh(device, { width: 8, height: 8, pivotX: 0.5, pivotY: 0.5 });
    this.leafMat = createPixelMaterial({
      diffuseMap: PlayCanvasAssets.getTexture('particle_leaf'),
      transparent: true,
    });

    this.dustMesh = createPixelQuadMesh(device, { width: 8, height: 8, pivotX: 0.5, pivotY: 0.5 });
    this.dustMat = createPixelMaterial({
      diffuseMap: PlayCanvasAssets.getTexture('particle_dust'),
      transparent: true,
      opacity: 0.7,
    });

    this.fireflyMesh = createPixelQuadMesh(device, { width: 10, height: 10, pivotX: 0.5, pivotY: 0.5 });
    this.fireflyMat = createPixelMaterial({
      diffuseMap: PlayCanvasAssets.getTexture('firefly_glow'),
      transparent: true,
      opacity: 0.85,
    });

    this.butterflyMesh = createPixelQuadMesh(device, { width: 14, height: 14, pivotX: 0.5, pivotY: 0.5 });
    this.butterflyMat = createPixelMaterial({
      diffuseMap: PlayCanvasAssets.getTexture('butterfly_azure'),
      transparent: true,
    });
    this.butterflyGoldMat = createPixelMaterial({
      diffuseMap: PlayCanvasAssets.getTexture('butterfly_gold'),
      transparent: true,
    });

    // Efeitos ambientais desativados conforme diretriz da fase crítica de restauração estática.
    // As funções de spawn sob demanda (poeira de esquiva, impactos) permanecem disponíveis.
  }

  spawnLeaf(x: number, y: number): void {
    const ent = new Entity(`Leaf_${this.particles.length}`);
    ent.addComponent('render', {
      meshInstances: [new MeshInstance(this.leafMesh, this.leafMat)],
    });
    this.rootEntity.addChild(ent);

    this.particles.push({
      entity: ent,
      x,
      y,
      z: 22,
      vx: -22 - Math.random() * 16, // Vento sopra para sudoeste
      vy: -14 - Math.random() * 10,
      rot: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 80,
      life: 8 + Math.random() * 6,
      maxLife: 14,
      type: 'leaf',
    });
  }

  spawnFirefly(x: number, y: number): void {
    const ent = new Entity(`Firefly_${this.particles.length}`);
    ent.addComponent('render', {
      meshInstances: [new MeshInstance(this.fireflyMesh, this.fireflyMat)],
    });
    this.rootEntity.addChild(ent);

    this.particles.push({
      entity: ent,
      x,
      y,
      z: 18,
      vx: (Math.random() - 0.5) * 12,
      vy: (Math.random() - 0.5) * 10,
      rot: 0,
      rotSpeed: 0,
      life: 999999,
      maxLife: 999999,
      type: 'firefly',
      customPhase: Math.random() * Math.PI * 2,
    });
  }

  spawnButterfly(x: number, y: number, isGold = false): void {
    const ent = new Entity(`Butterfly_${this.particles.length}`);
    const mat = isGold ? this.butterflyGoldMat : this.butterflyMat;
    ent.addComponent('render', {
      meshInstances: [new MeshInstance(this.butterflyMesh, mat)],
    });
    this.rootEntity.addChild(ent);

    this.particles.push({
      entity: ent,
      x,
      y,
      z: 20,
      vx: 18,
      vy: 10,
      rot: 0,
      rotSpeed: 0,
      life: 999999,
      maxLife: 999999,
      type: 'butterfly',
      customPhase: Math.random() * Math.PI * 2,
    });
  }

  spawnDust(x: number, y: number): void {
    const ent = new Entity(`Dust_${Date.now()}_${Math.random()}`);
    ent.addComponent('render', {
      meshInstances: [new MeshInstance(this.dustMesh, this.dustMat)],
    });
    this.rootEntity.addChild(ent);

    this.particles.push({
      entity: ent,
      x,
      y,
      z: 4,
      vx: (Math.random() - 0.5) * 20,
      vy: (Math.random() - 0.5) * 20,
      rot: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 120,
      life: 0.35,
      maxLife: 0.35,
      type: 'dust',
    });
  }

  update(dt: number): void {
    this.globalTime += dt;

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];

      if (p.type === 'dust') {
        p.life -= dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rot += p.rotSpeed * dt;

        p.entity.setPosition(p.x, p.y, p.z);
        p.entity.setLocalEulerAngles(0, 0, p.rot);

        const scale = p.life / p.maxLife;
        p.entity.setLocalScale(scale, scale, 1);
        if (p.life <= 0) {
          p.entity.destroy();
          this.particles.splice(i, 1);
        }
      } else if (p.type === 'leaf') {
        p.life -= dt;
        // Oscilação senoidal adicional para simular leveza do ar
        const flutter = Math.sin(this.globalTime * 3.0 + p.rot) * 8;
        p.x += (p.vx + flutter) * dt;
        p.y += p.vy * dt;
        p.rot += p.rotSpeed * dt;

        p.entity.setPosition(p.x, p.y, p.z);
        p.entity.setLocalEulerAngles(0, 0, p.rot);

        // Recicla ao sair da tela
        if (p.x < -20 || p.y < -20 || p.life <= 0) {
          p.x = 750 + Math.random() * 100;
          p.y = 400 + Math.random() * 150;
          p.life = p.maxLife;
        }
      } else if (p.type === 'firefly') {
        const phase = (p.customPhase || 0) + this.globalTime;
        // Movimento errático e suave
        p.x += Math.cos(phase * 0.8) * 12 * dt;
        p.y += Math.sin(phase * 1.1) * 10 * dt;

        // Pulso suave de brilho e escala
        const pulse = 0.8 + Math.sin(phase * 3.5) * 0.25;
        p.entity.setLocalScale(pulse, pulse, 1);
        p.entity.setPosition(p.x, p.y, p.z);

        // Mantém dentro da área visível do vale
        if (p.x < 40) p.x = 700;
        if (p.x > 720) p.x = 50;
        if (p.y < 30) p.y = 350;
        if (p.y > 370) p.y = 40;
      } else if (p.type === 'butterfly') {
        const phase = (p.customPhase || 0) + this.globalTime;
        // Trajetória em oito / curvas suaves sobre o vale
        p.x += (Math.cos(phase * 0.6) * 22 + 6) * dt;
        p.y += Math.sin(phase * 1.2) * 16 * dt;

        // Batimento rápido de asas via oscilação de escala X
        const flap = Math.cos(this.globalTime * 14.0);
        p.entity.setLocalScale(flap > 0 ? 1 : -1, 1, 1);
        p.entity.setPosition(p.x, p.y, p.z);

        if (p.x > 750) p.x = 50;
        if (p.y > 380) p.y = 40;
        if (p.y < 20) p.y = 360;
      }
    }
  }
}
