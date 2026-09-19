import { AppBase, Color, Entity, GraphicsDevice } from 'playcanvas';
import { ValeVerdejanteWorld } from '../world/ValeVerdejanteWorld';
import { RenEntity } from '../entities/RenEntity';
import { CombatTargetEntity } from '../entities/CombatTargetEntity';
import { InputSystem } from '../systems/InputSystem';
import { CollisionSystem } from '../systems/CollisionSystem';
import { CombatSystem } from '../combat/CombatSystem';
import { CameraFollowSystem } from '../systems/CameraFollowSystem';
import { DepthSortSystem } from '../systems/DepthSortSystem';
import { PlayCanvasParticles } from '../environment/PlayCanvasParticles';
import { LightingEnvironment } from '../environment/LightingEnvironment';
import { PlayCanvasAssets } from '../assets/PlayCanvasAssets';
import { ScenarioSpatialMap } from '../world/ScenarioSpatialMap';
import { eventBus } from '../../phaser/eventBus';

// =============================================================================
// ELDRIM: ECOS DO PASSADO - MAIN SCENE (PLAYCANVAS ENGINE V2)
// =============================================================================
// Cena principal que orquestra a Vertical Slice do Eldrim:
// - Câmera ortográfica 640×360 com aspect ratio 16:9
// - Mundo do Vale Verdejante com árvores, rochas, leito de rio e trilha
// - Ren com spritesheet V8 (160 frames), movimento e combate
// - Monólito rúnico para testes de acerto, dano e knockback
// - Ciclo de vida com 60 FPS garantidos
// =============================================================================

export class MainScene {
  public app: AppBase;
  public device: GraphicsDevice;

  public cameraEntity: Entity;
  public cameraSystem: CameraFollowSystem;

  public inputSystem: InputSystem;
  public collisionSystem: CollisionSystem;
  public combatSystem: CombatSystem;
  public depthSortSystem: DepthSortSystem;

  public world: ValeVerdejanteWorld;
  public ren: RenEntity;
  public combatTarget: CombatTargetEntity;
  public particles: PlayCanvasParticles;
  public lighting: LightingEnvironment;

  private totalTime = 0;
  public isDiagnosticModeActive = false;

  constructor(app: AppBase) {
    this.app = app;
    this.device = app.graphicsDevice;

    // Listener para alternância do modo de diagnóstico F8
    eventBus.on('f8DiagnosticToggle', () => {
      this.toggleDiagnosticMode();
    });

    // 1. Inicializa biblioteca de assets
    PlayCanvasAssets.init(this.device);

    // 2. Sistemas
    this.inputSystem = new InputSystem();
    this.collisionSystem = new CollisionSystem();
    this.combatSystem = new CombatSystem();
    this.depthSortSystem = new DepthSortSystem();

    // 3. Câmera Ortográfica (640×360)
    this.cameraEntity = new Entity('MainCamera');
    this.cameraEntity.addComponent('camera', {
      clearColor: new Color(0.08, 0.12, 0.16),
      projection: 1, // PROJECTION_ORTHOGRAPHIC
      orthoHeight: 180, // Metade de 360 no sistema PlayCanvas (de -180 a +180)
      nearClip: 0.1,
      farClip: 1000,
    });
    this.cameraEntity.setPosition(320, 220, 100);
    this.app.root.addChild(this.cameraEntity);

    this.cameraSystem = new CameraFollowSystem(this.cameraEntity);
    this.cameraSystem.setBounds(320, 448, 180, 332);

    // 4. Constrói o Mundo
    this.world = new ValeVerdejanteWorld(this.device, this.collisionSystem);
    this.app.root.addChild(this.world.rootEntity);

    // 5. Ren (Herói) em posição inicial desimpedida na trilha
    this.ren = new RenEntity(this.device, 260, 220);
    this.app.root.addChild(this.ren.rootEntity);
    this.cameraSystem.setTarget(this.ren);

    // 6. Monólito Alvo de Combate (posicionado na clareira norte de treinamento)
    this.combatTarget = new CombatTargetEntity(this.device, 460, 260, this.collisionSystem);
    this.app.root.addChild(this.combatTarget.rootEntity);

    // 7. Partículas e Atmosfera
    this.particles = new PlayCanvasParticles(this.device);
    this.app.root.addChild(this.particles.rootEntity);

    // 8. Iluminação Solar e Rúnica
    this.lighting = new LightingEnvironment();
    this.app.root.addChild(this.lighting.rootEntity);

    // 9. Registra entidades para Depth Sorting (Z-sorting no espaço 2.5D)
    // DEPTH POSITION = FEET POSITION = COLLIDER BASE
    this.depthSortSystem.register({
      entity: this.ren.rootEntity,
      getY: () => this.ren.getFeetY(),
      baseLayer: 10,
    });

    this.depthSortSystem.register({
      entity: this.combatTarget.rootEntity,
      getY: () => this.combatTarget.y,
      baseLayer: 10,
    });

    // Registra todas as entidades botânicas, geográficas e decorativas do Vale
    const worldEntities = this.world.getSortableEntities();
    for (let i = 0; i < worldEntities.length; i++) {
      this.depthSortSystem.register(worldEntities[i]);
    }

    // 10. Diagnóstico detalhado da Cena Vale Verdejante
    const countEntities = (entity: Entity): number => {
      let count = 1;
      for (const child of entity.children) {
        if (child instanceof Entity) {
          count += countEntities(child);
        }
      }
      return count;
    };

    const totalEntities = countEntities(this.app.root as Entity);
    const assetsSummary = PlayCanvasAssets.getLoadedSummary();

    console.log('[Eldrim Diagnostic - Vale Verdejante] Inicialização Concluída:', {
      rootChildrenCount: this.app.root.children.length,
      totalEntitiesInGraph: totalEntities,
      camera: {
        name: this.cameraEntity.name,
        projection: 'ORTHOGRAPHIC (1)',
        orthoHeight: 180,
        position: this.cameraEntity.getPosition(),
        clearColor: 'Color(0.08, 0.12, 0.16)',
      },
      world: {
        treesCount: this.world.trees.length,
        rocksCount: this.world.rocks.length,
        waterLiliesCount: this.world.waterLilies.length,
      },
      assets: assetsSummary,
    });
  }

  update(dt: number): void {
    this.totalTime += dt;

    // 1. Captura entrada do jogador
    const input = this.inputSystem.update();

    // Spawn de poeira durante esquiva
    if (input.dodgePressed) {
      this.particles.spawnDust(this.ren.x, this.ren.y);
    }

    // 2. Atualiza Ren
    this.ren.update(dt, input, this.collisionSystem, this.combatSystem);

    // 3. Combate e acerto de hitboxes
    const isAttacking = this.ren.state === 'attack' || this.ren.state === 'heavy_attack';
    this.combatSystem.update(dt, isAttacking);

    if (this.ren.currentHitbox) {
      const hit = this.combatTarget.checkHit(this.ren.currentHitbox);
      if (hit) {
        // Efeito de impacto: poeira e tremor de câmera
        this.particles.spawnDust(this.combatTarget.x, this.combatTarget.y + 16);
        this.cameraSystem.triggerShake(
          this.ren.currentHitbox.isCharged ? 5.5 : 2.5,
          this.ren.currentHitbox.isCharged ? 0.35 : 0.18
        );
      }
    }

    // 4. Atualiza Alvo de Combate
    this.combatTarget.update(dt, this.totalTime);

    // 5. Atualiza Ambiente e Mundo
    this.world.update(dt, this.totalTime);

    // 6. Atualiza Partículas
    this.particles.update(dt);

    // 7. Atualiza Iluminação
    this.lighting.update(this.ren.x, this.ren.y, this.ren.state === 'heavy_attack' || this.ren.state === 'arcane_flow');

    // 8. Câmera acompanha Ren suavemente
    this.cameraSystem.update(dt);

    // 9. Ordenação 2.5D de profundidade
    this.depthSortSystem.update();

    // 10. Emite telemetria semântica espacial, protótipo e dados de diagnóstico para o HUD React
    const pos = this.ren.rootEntity.getPosition();
    const sem = ScenarioSpatialMap.getSemanticInfo(this.ren.x, this.ren.y);
    eventBus.emit('infoEspacialMudou', {
      x: Math.round(this.ren.x),
      y: Math.round(this.ren.y),
      z: Number(pos.z.toFixed(3)),
      depthZ: Number(pos.z.toFixed(3)),
      biome: sem.biome,
      zone: sem.specialZone,
      priorityLevel: sem.priorityLevel,
      priorityName: sem.priorityName,
      description: sem.description,
      prototype: this.ren.activePrototypeId,
      visible: this.ren.isVisualVisible(),
      rootEnabled: this.ren.isRootEnabled(),
      shadowEnabled: this.ren.isShadowEnabled(),
      jumpHeight: Math.round(this.ren.jumpHeight),
      state: this.ren.state,
      diagnosticMode: this.isDiagnosticModeActive,
    });
  }

  public toggleDiagnosticMode(): boolean {
    this.isDiagnosticModeActive = !this.isDiagnosticModeActive;
    this.world.setDiagnosticMode(this.isDiagnosticModeActive);
    console.log(`[Diagnostic F8] Modo de Auditoria Visual: ${this.isDiagnosticModeActive ? 'ATIVADO' : 'DESATIVADO'}`);
    return this.isDiagnosticModeActive;
  }

  setLayerVisibility(mode: 'all' | 'bg' | 'trees' | 'rocks' | 'flora' | 'bridge_river'): void {
    this.world.setLayerVisibility(mode);
  }

  destroy(): void {
    this.inputSystem.destroy();
  }
}
