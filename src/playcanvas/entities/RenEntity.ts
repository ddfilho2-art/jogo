import { Entity, GraphicsDevice, MeshInstance, StandardMaterial, Vec3 } from 'playcanvas';
import { PlayCanvasAssets } from '../assets/PlayCanvasAssets';
import { createPixelQuadMesh } from '../rendering/PixelQuadMesh';
import { createPixelMaterial } from '../rendering/GraphicsBackend';
import { Direction, InputState } from '../systems/InputSystem';
import { CollisionSystem } from '../systems/CollisionSystem';
import { CombatSystem, Hitbox2D } from '../combat/CombatSystem';
import { eventBus } from '../../phaser/eventBus';
import { HeroWarrior3D } from './HeroWarrior3D';
import { HeroSprite2D } from './HeroSprite2D';
import { HeroSkeletal2D } from './HeroSkeletal2D';
import { HeroPrototypeId, HeroState, IHeroVisual } from './HeroVisualTypes';

// =============================================================================
// ELDRIM: ECOS DO PASSADO - REN ENTITY (PLAYCANVAS ENGINE V2)
// =============================================================================
// HeroController unificado com sistema comparativo de 3 tecnologias:
// - Protótipo A: 3D Procedural Articulado (HeroWarrior3D)
// - Protótipo B: 2D Sprite Tradicional com Frame Animation (HeroSprite2D)
// - Protótipo C: 2D Skeletal Hierárquico Articulado (HeroSkeletal2D)
//
// Regras obrigatórias:
// 1. Troca em tempo real pelas teclas 1, 2, 3 sem recarregar a aplicação.
// 2. Somente um protótipo ativo/visível por vez.
// 3. Mesma posição física, mesma escala lógica, mesmo collider nos pés (16×12 px).
// 4. Compartilham estritamente o mesmo sistema de movimento, combate e colisão.
// =============================================================================

export class RenEntity {
  public rootEntity: Entity;

  // As 3 tecnologias de renderização visual
  public prototypeA: HeroWarrior3D;
  public prototypeB: HeroSprite2D;
  public prototypeC: HeroSkeletal2D;

  public activePrototypeId: HeroPrototypeId = 'B';
  private visuals: Record<HeroPrototypeId, IHeroVisual>;

  private shadowEntity: Entity;
  private slashEntity: Entity;
  private slashMaterial: StandardMaterial;

  public x: number;
  public y: number;
  public facing: Direction = 'down';
  public state: HeroState = 'idle';

  // Parâmetros de movimentação e combate
  private readonly WALK_SPEED = 110;
  private readonly RUN_SPEED = 168;
  private readonly DODGE_SPEED = 195;
  private stateTimer = 0;
  private iframesTimer = 0;

  // Física de pulo 2.5D
  public jumpHeight = 0;
  private jumpVelocity = 0;
  private isGrounded = true;
  private readonly GRAVITY = 520;
  private readonly JUMP_IMPULSE = 150;

  // Vida do herói (4 fragmentos de Eldrim)
  private vida = 4;
  private readonly vidaMax = 4;

  // Collider nos pés (16×12 px)
  public readonly colliderW = 16;
  public readonly colliderH = 12;

  // VFX de ataque ativo
  public currentHitbox: Hitbox2D | null = null;

  constructor(device: GraphicsDevice, startX: number, startY: number) {
    this.x = startX;
    this.y = startY;

    this.rootEntity = new Entity('Ren');
    this.rootEntity.setPosition(startX, startY, 15);

    // 1. Sombra desacoplada elíptica no solo
    this.shadowEntity = new Entity('Ren_Shadow');
    const shadowMesh = createPixelQuadMesh(device, { width: 44, height: 20, pivotX: 0.5, pivotY: 0.5 });
    const shadowMat = createPixelMaterial({
      diffuseMap: PlayCanvasAssets.getTexture('sombra_ren'),
      transparent: true,
      opacity: 0.85,
    });
    this.shadowEntity.addComponent('render', {
      meshInstances: [new MeshInstance(shadowMesh, shadowMat)],
    });
    this.shadowEntity.setLocalPosition(0, 0, -0.05);
    this.rootEntity.addChild(this.shadowEntity);

    // 2. Instanciação dos 3 Protótipos Tecnológicos
    this.prototypeA = new HeroWarrior3D(device);
    this.prototypeB = new HeroSprite2D(device);
    this.prototypeC = new HeroSkeletal2D(device);

    this.rootEntity.addChild(this.prototypeA.rootEntity);
    this.rootEntity.addChild(this.prototypeB.rootEntity);
    this.rootEntity.addChild(this.prototypeC.rootEntity);

    this.visuals = {
      A: this.prototypeA,
      B: this.prototypeB,
      C: this.prototypeC,
    };

    // Ativa Protótipo B por padrão
    this.setPrototype('B');

    // 3. Efeito de Arco Rúnico (Slash Arc)
    this.slashEntity = new Entity('Ren_SlashArc');
    const slashMesh = createPixelQuadMesh(device, { width: 48, height: 48, pivotX: 0.5, pivotY: 0.5 });
    this.slashMaterial = createPixelMaterial({
      diffuseMap: PlayCanvasAssets.getTexture('vfx_slash_arc'),
      transparent: true,
      additive: true,
    });
    this.slashEntity.addComponent('render', {
      meshInstances: [new MeshInstance(slashMesh, this.slashMaterial)],
    });
    this.slashEntity.enabled = false;
    this.rootEntity.addChild(this.slashEntity);

    // Emite status inicial para HUD
    eventBus.emit('vidaMudou', this.vida);
    eventBus.emit('prototipoMudou', this.activePrototypeId);
  }

  /**
   * Alterna a tecnologia ativa sem recarregar a cena
   */
  public setPrototype(id: HeroPrototypeId): void {
    this.activePrototypeId = id;

    this.visuals.A.setVisible(id === 'A');
    this.visuals.B.setVisible(id === 'B');
    this.visuals.C.setVisible(id === 'C');

    eventBus.emit('prototipoMudou', id);
  }

  /**
   * Ponto de referência de profundidade (Depth Sorting 2.5D):
   * DEPTH POSITION = FEET POSITION = COLLIDER BASE
   * O ponto de contato dos pés com o solo no plano 2.5D.
   */
  public getFeetY(): number {
    return this.y - this.colliderH * 0.5;
  }

  /**
   * Indica se o corpo visual ativo do herói está visível.
   */
  public isVisualVisible(): boolean {
    return this.rootEntity.enabled && this.visuals[this.activePrototypeId].rootEntity.enabled;
  }

  public isShadowEnabled(): boolean {
    return this.shadowEntity.enabled;
  }

  public isRootEnabled(): boolean {
    return this.rootEntity.enabled;
  }

  update(
    dt: number,
    input: InputState,
    collision: CollisionSystem,
    combat: CombatSystem
  ): void {
    // 0. Alternância dinâmica de tecnologia pelo teclado (1, 2, 3)
    if (input.switchPrototype && input.switchPrototype !== this.activePrototypeId) {
      this.setPrototype(input.switchPrototype);
    }

    // 1. Gerencia i-frames (imunidade e piscar visual)
    const activeVisual = this.visuals[this.activePrototypeId];
    if (this.iframesTimer > 0) {
      this.iframesTimer -= dt;
      const flash = Math.floor(this.iframesTimer * 20) % 2 === 0;
      activeVisual.setVisible(flash);
    } else {
      activeVisual.setVisible(true);
    }

    // 2. Física de salto 2.5D
    if (!this.isGrounded) {
      this.jumpHeight += this.jumpVelocity * dt;
      this.jumpVelocity -= this.GRAVITY * dt;

      if (this.jumpHeight <= 0) {
        this.jumpHeight = 0;
        this.jumpVelocity = 0;
        this.isGrounded = true;
        if (this.state === 'jump' || this.state === 'fall') {
          this.state = input.isMoving ? (input.isRunning ? 'run' : 'walk') : 'idle';
        }
      } else if (this.jumpVelocity < 0 && this.state === 'jump') {
        this.state = 'fall';
      }

      // Efeito óptico na sombra: diminui suavemente conforme o herói sobe
      const shadowScale = Math.max(0.65, 1 - this.jumpHeight * 0.008);
      this.shadowEntity.setLocalScale(shadowScale, shadowScale, 1);
    } else {
      this.shadowEntity.setLocalScale(1, 1, 1);
    }

    // 3. Máquina de estados unificada
    switch (this.state) {
      case 'idle':
      case 'walk':
      case 'run':
        this.handleLocomotionState(dt, input, collision, combat);
        break;

      case 'jump':
      case 'fall':
        this.handleAirborneState(dt, input, collision);
        break;

      case 'attack':
      case 'heavy_attack':
        this.handleAttackState(dt, combat);
        break;

      case 'arcane_flow':
        this.handleChargedState(dt);
        break;

      case 'dodge':
        this.handleDodgeState(dt, collision);
        break;

      case 'hurt':
        this.handleHurtState(dt);
        break;
    }

    // 4. Atualiza o visual ativo com os parâmetros universais de pose
    activeVisual.update(
      dt,
      this.state,
      this.facing,
      this.stateTimer,
      input.isMoving,
      this.jumpHeight,
      this.isGrounded
    );

    // Garante estabilidade de rotação no container raiz
    this.rootEntity.setLocalEulerAngles(0, 0, 0);

    // Sincroniza coordenadas com o mundo 2.5D
    const pos = this.rootEntity.getPosition();
    this.rootEntity.setPosition(this.x, this.y, pos.z);
  }

  private handleLocomotionState(
    dt: number,
    input: InputState,
    collision: CollisionSystem,
    combat: CombatSystem
  ): void {
    // Transição: Pulo (Espaço)
    if (input.jumpPressed && this.isGrounded) {
      this.isGrounded = false;
      this.jumpVelocity = this.JUMP_IMPULSE;
      this.state = 'jump';
      eventBus.emit('teclaPressionada', {
        tecla: 'Espaço (Pulo)',
        posicaoHeroi: { x: Math.round(this.x), y: Math.round(this.y) },
      });
      return;
    }

    // Transição: Arcane Flow direto (tecla L) ou carregado ao soltar ataque após 550ms
    if (input.arcaneFlowPressed || (input.attackReleased && input.holdDuration >= 550)) {
      if (combat.consumeArcanoForCharged()) {
        this.startChargedAttack(combat);
        return;
      }
    }

    // Transição: Ataque Forte (tecla K)
    if (input.heavyAttackPressed) {
      this.startHeavyAttack(combat);
      return;
    }

    // Transição: Ataque básico (tecla J ou Z)
    if (input.attackPressed) {
      this.startNormalAttack(combat);
      return;
    }

    // Transição: Esquiva (tecla R, C ou Alt)
    if (input.dodgePressed) {
      this.startDodge();
      return;
    }

    // Locomoção padrão (Caminhada ou Corrida com Shift)
    if (input.isMoving) {
      this.facing = input.facing;
      this.state = input.isRunning ? 'run' : 'walk';

      const currentSpeed = input.isRunning ? this.RUN_SPEED : this.WALK_SPEED;
      const targetX = this.x + input.dx * currentSpeed * dt;
      const targetY = this.y + input.dy * currentSpeed * dt;

      const res = collision.resolveMovement(
        this.x,
        this.y,
        targetX,
        targetY,
        this.colliderW,
        this.colliderH,
        'ren'
      );
      this.x = res.x;
      this.y = res.y;
    } else {
      this.state = 'idle';
    }
  }

  private handleAirborneState(dt: number, input: InputState, collision: CollisionSystem): void {
    // No ar, o herói ainda possui controle parcial de trajetória horizontal
    if (input.isMoving) {
      this.facing = input.facing;
      const targetX = this.x + input.dx * (this.WALK_SPEED * 0.85) * dt;
      const targetY = this.y + input.dy * (this.WALK_SPEED * 0.85) * dt;

      const res = collision.resolveMovement(
        this.x,
        this.y,
        targetX,
        targetY,
        this.colliderW,
        this.colliderH,
        'ren'
      );
      this.x = res.x;
      this.y = res.y;
    }
  }

  private startNormalAttack(combat: CombatSystem): void {
    this.state = 'attack';
    this.stateTimer = 0.35;

    // Gera hitbox precisa
    this.currentHitbox = combat.createNormalAttackHitbox(this.x, this.y, this.facing);

    // Posiciona e exibe arco rúnico
    this.positionSlashArc();
    this.slashEntity.enabled = true;

    eventBus.emit('teclaPressionada', {
      tecla: 'J / Z (Ataque Básico)',
      posicaoHeroi: { x: Math.round(this.x), y: Math.round(this.y) },
    });
  }

  private startHeavyAttack(combat: CombatSystem): void {
    this.state = 'heavy_attack';
    this.stateTimer = 0.55;

    // Hitbox com dano dobrado e raio ampliado
    this.currentHitbox = combat.createNormalAttackHitbox(this.x, this.y, this.facing);
    this.currentHitbox.damage = 2;
    this.currentHitbox.width *= 1.35;
    this.currentHitbox.height *= 1.35;

    this.positionSlashArc();
    this.slashEntity.enabled = true;

    eventBus.emit('teclaPressionada', {
      tecla: 'K (Ataque Forte)',
      posicaoHeroi: { x: Math.round(this.x), y: Math.round(this.y) },
    });
  }

  private handleAttackState(dt: number, combat: CombatSystem): void {
    this.stateTimer -= dt;

    if (this.stateTimer <= 0) {
      this.state = 'idle';
      this.currentHitbox = null;
      this.slashEntity.enabled = false;
    }
  }

  private startChargedAttack(combat: CombatSystem): void {
    this.state = 'arcane_flow';
    this.stateTimer = 0.6;

    this.currentHitbox = combat.createChargedAttackHitbox(this.x, this.y);

    // Exibe arco giratório centralizado
    this.slashEntity.setLocalPosition(0, 16, 0.1);
    this.slashEntity.setLocalEulerAngles(0, 0, 0);
    this.slashEntity.enabled = true;

    eventBus.emit('teclaPressionada', {
      tecla: 'L / Arcane Flow (Giro 360°)',
      posicaoHeroi: { x: Math.round(this.x), y: Math.round(this.y) },
    });
  }

  private handleChargedState(dt: number): void {
    this.stateTimer -= dt;
    this.slashEntity.rotateLocal(0, 0, 900 * dt);

    if (this.stateTimer <= 0) {
      this.state = 'idle';
      this.currentHitbox = null;
      this.slashEntity.enabled = false;
    }
  }

  private startDodge(): void {
    this.state = 'dodge';
    this.stateTimer = 0.42;

    eventBus.emit('teclaPressionada', {
      tecla: 'R / C (Esquiva)',
      posicaoHeroi: { x: Math.round(this.x), y: Math.round(this.y) },
    });
  }

  private handleDodgeState(dt: number, collision: CollisionSystem): void {
    this.stateTimer -= dt;

    // Deslocamento ágil na direção em que está olhando
    let dirX = 0;
    let dirY = 0;
    if (this.facing === 'down') dirY = -1;
    else if (this.facing === 'up') dirY = 1;
    else if (this.facing === 'left') dirX = -1;
    else if (this.facing === 'right') dirX = 1;

    const targetX = this.x + dirX * this.DODGE_SPEED * dt;
    const targetY = this.y + dirY * this.DODGE_SPEED * dt;

    const res = collision.resolveMovement(
      this.x,
      this.y,
      targetX,
      targetY,
      this.colliderW,
      this.colliderH,
      'ren'
    );
    this.x = res.x;
    this.y = res.y;

    if (this.stateTimer <= 0) {
      this.state = 'idle';
    }
  }

  takeDamage(amount = 1, fromX?: number, fromY?: number): void {
    if (this.iframesTimer > 0 || this.state === 'dodge') return;

    this.vida = Math.max(0, this.vida - amount);
    this.iframesTimer = 1.0;
    this.state = this.vida <= 0 ? 'death' : 'hurt';
    this.stateTimer = this.vida <= 0 ? 999 : 0.35;

    // Knockback
    if (fromX !== undefined && fromY !== undefined) {
      const angle = Math.atan2(this.y - fromY, this.x - fromX);
      this.x += Math.cos(angle) * 18;
      this.y += Math.sin(angle) * 18;
    }

    eventBus.emit('vidaMudou', this.vida);
  }

  private handleHurtState(dt: number): void {
    this.stateTimer -= dt;
    if (this.stateTimer <= 0) {
      this.state = 'idle';
    }
  }

  private positionSlashArc(): void {
    let ox = 0;
    let oy = 14;
    let rotZ = 0;

    if (this.facing === 'down') {
      oy = -4;
      rotZ = -90;
    } else if (this.facing === 'up') {
      oy = 28;
      rotZ = 90;
    } else if (this.facing === 'left') {
      ox = -18;
      rotZ = 180;
    } else if (this.facing === 'right') {
      ox = 18;
      rotZ = 0;
    }

    this.slashEntity.setLocalPosition(ox, oy, 0.1);
    this.slashEntity.setLocalEulerAngles(0, 0, rotZ);
  }

  public destroy(): void {
    this.prototypeA.destroy();
    this.prototypeB.destroy();
    this.prototypeC.destroy();
    this.rootEntity.destroy();
  }
}
