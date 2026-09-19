import { Color, Entity, GraphicsDevice, MeshInstance, StandardMaterial } from 'playcanvas';
import { PlayCanvasAssets } from '../assets/PlayCanvasAssets';
import { createPixelQuadMesh } from '../rendering/PixelQuadMesh';
import { createPixelMaterial } from '../rendering/GraphicsBackend';
import { CollisionSystem } from '../systems/CollisionSystem';
import { Hitbox2D } from '../combat/CombatSystem';
import { eventBus } from '../../phaser/eventBus';

// =============================================================================
// ELDRIM: ECOS DO PASSADO - COMBAT TARGET ENTITY (PLAYCANVAS ENGINE V2)
// =============================================================================
// Monólito Rúnico Corrompido para teste de combate e feedback:
// - HP dinâmico (6 pontos)
// - Feedback de golpe: flash luminoso, knockback físico, tremor e partículas
// - Respawn automático com reconstituição mágica após ser destruído
// =============================================================================

export class CombatTargetEntity {
  public rootEntity: Entity;
  private visualEntity: Entity;
  private material: StandardMaterial;

  public x: number;
  public y: number;
  private startX: number;
  private startY: number;

  private hp = 6;
  private readonly maxHp = 6;
  private flashTimer = 0;
  private respawnTimer = 0;
  private isDead = false;

  private pulsePhase = 0;

  constructor(
    device: GraphicsDevice,
    x: number,
    y: number,
    collision: CollisionSystem,
    id = 'target_crystal'
  ) {
    this.x = x;
    this.y = y;
    this.startX = x;
    this.startY = y;

    this.rootEntity = new Entity(id);
    this.rootEntity.setPosition(x, y, 12);

    this.visualEntity = new Entity(`${id}_Visual`);
    const mesh = createPixelQuadMesh(device, { width: 48, height: 64, pivotX: 0.5, pivotY: 0.1 });
    this.material = createPixelMaterial({
      diffuseMap: PlayCanvasAssets.getTexture('combat_target'),
      transparent: true,
    });
    this.visualEntity.addComponent('render', {
      meshInstances: [new MeshInstance(mesh, this.material)],
    });
    this.rootEntity.addChild(this.visualEntity);

    // Registra colisor estático (24×16 px)
    collision.addCollider({
      id,
      x,
      y: y + 4,
      width: 24,
      height: 16,
    });
  }

  update(dt: number, time: number): void {
    if (this.isDead) {
      this.respawnTimer -= dt;
      if (this.respawnTimer <= 0) {
        this.respawn();
      }
      return;
    }

    // Efeito de pulsação suave mística
    this.pulsePhase += dt * 3;
    const hoverY = Math.sin(this.pulsePhase) * 1.5;
    this.visualEntity.setLocalPosition(0, hoverY, 0);

    // Flash de dano
    if (this.flashTimer > 0) {
      this.flashTimer -= dt;
      this.material.diffuse = new Color(2.5, 2.5, 3.0); // Super brilho
      this.material.update();
    } else {
      this.material.diffuse = new Color(1, 1, 1);
      this.material.update();
    }
  }

  checkHit(hitbox: Hitbox2D): boolean {
    if (this.isDead) return false;

    // Checa colisão com hitbox de Ren
    const targetBox = {
      x: this.x,
      y: this.y + 16,
      width: 32,
      height: 48,
    };

    const halfAW = hitbox.width * 0.5;
    const halfAH = hitbox.height * 0.5;
    const halfBW = targetBox.width * 0.5;
    const halfBH = targetBox.height * 0.5;

    const overlap =
      Math.abs(hitbox.x - targetBox.x) < halfAW + halfBW &&
      Math.abs(hitbox.y - targetBox.y) < halfAH + halfBH;

    if (overlap) {
      this.takeHit(hitbox);
      return true;
    }

    return false;
  }

  private takeHit(hitbox: Hitbox2D): void {
    this.hp -= hitbox.damage;
    this.flashTimer = 0.15;

    // Empurrão (knockback)
    if (hitbox.isCharged) {
      const angle = Math.atan2(this.y - hitbox.y, this.x - hitbox.x);
      this.x += Math.cos(angle) * 16;
      this.y += Math.sin(angle) * 16;
    } else {
      this.x += (hitbox.knockbackX > 0 ? 8 : hitbox.knockbackX < 0 ? -8 : 0);
      this.y += (hitbox.knockbackY > 0 ? 8 : hitbox.knockbackY < 0 ? -8 : 0);
    }
    this.rootEntity.setPosition(this.x, this.y, 12);

    eventBus.emit('teclaPressionada', {
      tecla: hitbox.isCharged ? 'GOLPE CARREGADO NO MONÓLITO!' : 'ACERTO NO MONÓLITO!',
      posicaoHeroi: { x: Math.round(this.x), y: Math.round(this.y) },
    });

    if (this.hp <= 0) {
      this.die();
    }
  }

  private die(): void {
    this.isDead = true;
    this.respawnTimer = 3.5;
    this.visualEntity.enabled = false;
    eventBus.emit('teclaPressionada', {
      tecla: 'MONÓLITO CORROMPIDO DESTRUÍDO!',
      posicaoHeroi: { x: Math.round(this.x), y: Math.round(this.y) },
    });
  }

  private respawn(): void {
    this.isDead = false;
    this.hp = this.maxHp;
    this.x = this.startX;
    this.y = this.startY;
    this.rootEntity.setPosition(this.x, this.y, 12);
    this.visualEntity.enabled = true;
    this.flashTimer = 0.3;
  }
}
