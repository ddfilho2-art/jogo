import {
  Entity,
  GraphicsDevice,
  Mesh,
  MeshInstance,
  StandardMaterial,
  Color,
  Vec3,
  Texture,
} from 'playcanvas';
import { createPixelMaterial, createPixelTexture } from '../rendering/GraphicsBackend';
import { Direction } from '../systems/InputSystem';
import { HeroPrototypeId, HeroState, IHeroVisual } from './HeroVisualTypes';

// =============================================================================
// ELDRIM: ECOS DO PASSADO - HERO WARRIOR 3D (PLAYCANVAS ENGINE V2)
// =============================================================================
// Reconstrução visual definitiva do Herói jogável (PROTÓTIPO A):
// - Baseado na referência artística: RPG Character Warrior (Free3D 4054)
// - Arquitetura de múltiplas partes 3D articuladas:
//   Hero (Root)
//    └── Body
//         ├── Head
//         │    └── Hair
//         ├── Torso
//         │    ├── Shoulder_L -> Arm_L -> Forearm_L -> Hand_L
//         │    └── Shoulder_R -> Arm_R -> Forearm_R -> Hand_R -> Equipment (Espada)
//         ├── Leg_L -> Boot_L
//         └── Leg_R -> Boot_R
// - Geometrias 3D com chanfros (bevels), superfícies inclinadas, variação de espessura e volumes
// - Proporção heroica moderada (cabeça ~1/7.5 da altura total, ombros largos, cintura cônica)
// - Paleta autêntica de Eldrim: Aço envelhecido, couro rústico, verde-musgo e latão
// - Animações completas: IDLE (respiração/pose de guarda), WALK (marcha com transferência de peso),
//   ATTACK (antecipação, golpe e recuperação), CHARGED (giro 360°), DODGE (rolamento), HURT (reação)
// - PIVOT estrito nas solas das botas (Y = 0)
// =============================================================================

export class HeroWarrior3D implements IHeroVisual {
  public rootEntity: Entity;
  public bodyEntity: Entity;

  // Hierarquia de peças conforme especificação obrigatória
  public headEntity: Entity;
  public hairEntity: Entity;
  public torsoEntity: Entity;
  public shoulderLEntity: Entity;
  public shoulderREntity: Entity;
  public armLEntity: Entity;
  public armREntity: Entity;
  public forearmLEntity: Entity;
  public forearmREntity: Entity;
  public handLEntity: Entity;
  public handREntity: Entity;
  public legLEntity: Entity;
  public legREntity: Entity;
  public bootLEntity: Entity;
  public bootREntity: Entity;
  public equipmentEntity: Entity; // Espada do guerreiro

  private material: StandardMaterial;
  private atlasTexture: Texture;

  // Estados de animação interna
  private walkPhase = 0;
  private idleTime = 0;
  private attackPhase = 0;
  private dodgePhase = 0;
  private hurtPhase = 0;
  private currentFacing: Direction = 'down';

  constructor(device: GraphicsDevice) {
    this.rootEntity = new Entity('Hero_Root');
    this.bodyEntity = new Entity('Body');
    this.rootEntity.addChild(this.bodyEntity);

    // 1. Gera textura atlas com texturização de armadura de guerreiro RPG
    this.atlasTexture = this.generateWarriorTextureAtlas(device);

    // 2. Material unlit pixel-art padronizado
    this.material = createPixelMaterial({
      diffuseMap: this.atlasTexture,
      transparent: true,
      alphaTest: 0.1,
      depthWrite: true,
    });

    // 3. Constrói e vincula a árvore hierárquica completa
    // Dimensões calibradas para altura total do herói ≈ 44 unidades (cabeça ~6u = 1/7.3)
    // Pivot nos pés: Y=0 é o chão

    // --- LEGS & BOOTS ---
    // Perna Esquerda (X = -3.2, Y = 7 até 18)
    this.legLEntity = new Entity('Leg_L');
    this.legLEntity.setLocalPosition(-3.2, 16, 0);
    const legLMesh = this.createTaperedLimbMesh(device, 3.4, 3.4, 2.8, 2.8, 8.5, {
      u0: 0.5, v0: 0.5, u1: 0.65, v1: 0.75,
    });
    this.legLEntity.addComponent('render', {
      meshInstances: [new MeshInstance(legLMesh, this.material)],
    });
    this.bodyEntity.addChild(this.legLEntity);

    // Bota Esquerda (robusta com dobra superior e sola grossa)
    this.bootLEntity = new Entity('Boot_L');
    this.bootLEntity.setLocalPosition(0, -8.5, 0);
    const bootLMesh = this.createChunkyBootMesh(device, 3.8, 8.5, 5.2, {
      u0: 0.65, v0: 0.5, u1: 0.85, v1: 0.75,
    });
    this.bootLEntity.addComponent('render', {
      meshInstances: [new MeshInstance(bootLMesh, this.material)],
    });
    this.legLEntity.addChild(this.bootLEntity);

    // Perna Direita (X = +3.2)
    this.legREntity = new Entity('Leg_R');
    this.legREntity.setLocalPosition(3.2, 16, 0);
    const legRMesh = this.createTaperedLimbMesh(device, 3.4, 3.4, 2.8, 2.8, 8.5, {
      u0: 0.5, v0: 0.5, u1: 0.65, v1: 0.75,
    });
    this.legREntity.addComponent('render', {
      meshInstances: [new MeshInstance(legRMesh, this.material)],
    });
    this.bodyEntity.addChild(this.legREntity);

    // Bota Direita
    this.bootREntity = new Entity('Boot_R');
    this.bootREntity.setLocalPosition(0, -8.5, 0);
    const bootRMesh = this.createChunkyBootMesh(device, 3.8, 8.5, 5.2, {
      u0: 0.65, v0: 0.5, u1: 0.85, v1: 0.75,
    });
    this.bootREntity.addComponent('render', {
      meshInstances: [new MeshInstance(bootRMesh, this.material)],
    });
    this.legREntity.addChild(this.bootREntity);

    // --- TORSO (Peitoral em V, cinto de couro, túnica verde-musgo) ---
    this.torsoEntity = new Entity('Torso');
    this.torsoEntity.setLocalPosition(0, 17.5, 0);
    const torsoMesh = this.createBeveledTorsoMesh(device, 13.5, 13.5, 7.5, {
      u0: 0.0, v0: 0.0, u1: 0.45, v1: 0.45,
    });
    this.torsoEntity.addComponent('render', {
      meshInstances: [new MeshInstance(torsoMesh, this.material)],
    });
    this.bodyEntity.addChild(this.torsoEntity);

    // --- HEAD & HAIR ---
    this.headEntity = new Entity('Head');
    this.headEntity.setLocalPosition(0, 13.5, 0.4);
    const headMesh = this.createSculptedHeadMesh(device, 6.4, 6.8, 6.2, {
      u0: 0.45, v0: 0.0, u1: 0.75, v1: 0.35,
    });
    this.headEntity.addComponent('render', {
      meshInstances: [new MeshInstance(headMesh, this.material)],
    });
    this.torsoEntity.addChild(this.headEntity);

    // Cabelo estilizado com mechas volumosas
    this.hairEntity = new Entity('Hair');
    this.hairEntity.setLocalPosition(0, 1.2, -0.2);
    const hairMesh = this.createLayeredHairMesh(device, 7.2, 6.2, 7.0, {
      u0: 0.75, v0: 0.0, u1: 1.0, v1: 0.35,
    });
    this.hairEntity.addComponent('render', {
      meshInstances: [new MeshInstance(hairMesh, this.material)],
    });
    this.headEntity.addChild(this.hairEntity);

    // --- BRAÇO ESQUERDO (Escudo/Guarda) ---
    // Ombreira Esquerda (curva chanfrada de metal laminado)
    this.shoulderLEntity = new Entity('Shoulder_L');
    this.shoulderLEntity.setLocalPosition(-7.6, 11.5, 0);
    const pauldronLMesh = this.createLayeredPauldronMesh(device, 5.5, 4.8, 5.0, {
      u0: 0.0, v0: 0.45, u1: 0.25, v1: 0.7,
    });
    this.shoulderLEntity.addComponent('render', {
      meshInstances: [new MeshInstance(pauldronLMesh, this.material)],
    });
    this.torsoEntity.addChild(this.shoulderLEntity);

    // Braço Esquerdo (superior - manga com dobras de tecido)
    this.armLEntity = new Entity('Arm_L');
    this.armLEntity.setLocalPosition(0, -1.8, 0);
    const armLMesh = this.createTaperedLimbMesh(device, 3.2, 3.2, 2.6, 2.6, 6.0, {
      u0: 0.25, v0: 0.45, u1: 0.45, v1: 0.65,
    });
    this.armLEntity.addComponent('render', {
      meshInstances: [new MeshInstance(armLMesh, this.material)],
    });
    this.shoulderLEntity.addChild(this.armLEntity);

    // Antebraço Esquerdo (braçadeira de couro com fivelas)
    this.forearmLEntity = new Entity('Forearm_L');
    this.forearmLEntity.setLocalPosition(0, -5.8, 0);
    const forearmLMesh = this.createTaperedLimbMesh(device, 2.9, 2.9, 2.4, 2.4, 5.8, {
      u0: 0.25, v0: 0.65, u1: 0.45, v1: 0.85,
    });
    this.forearmLEntity.addComponent('render', {
      meshInstances: [new MeshInstance(forearmLMesh, this.material)],
    });
    this.armLEntity.addChild(this.forearmLEntity);

    // Mão Esquerda (luva de combate fechada)
    this.handLEntity = new Entity('Hand_L');
    this.handLEntity.setLocalPosition(0, -5.6, 0);
    const handLMesh = this.createBeveledHandMesh(device, 2.6, 2.8, 2.6, {
      u0: 0.45, v0: 0.35, u1: 0.6, v1: 0.5,
    });
    this.handLEntity.addComponent('render', {
      meshInstances: [new MeshInstance(handLMesh, this.material)],
    });
    this.forearmLEntity.addChild(this.handLEntity);

    // --- BRAÇO DIREITO & ARMA (Espada de aço de Eldrim) ---
    // Ombreira Direita
    this.shoulderREntity = new Entity('Shoulder_R');
    this.shoulderREntity.setLocalPosition(7.6, 11.5, 0);
    const pauldronRMesh = this.createLayeredPauldronMesh(device, 5.5, 4.8, 5.0, {
      u0: 0.0, v0: 0.45, u1: 0.25, v1: 0.7,
    });
    this.shoulderREntity.addComponent('render', {
      meshInstances: [new MeshInstance(pauldronRMesh, this.material)],
    });
    this.torsoEntity.addChild(this.shoulderREntity);

    // Braço Direito
    this.armREntity = new Entity('Arm_R');
    this.armREntity.setLocalPosition(0, -1.8, 0);
    const armRMesh = this.createTaperedLimbMesh(device, 3.2, 3.2, 2.6, 2.6, 6.0, {
      u0: 0.25, v0: 0.45, u1: 0.45, v1: 0.65,
    });
    this.armREntity.addComponent('render', {
      meshInstances: [new MeshInstance(armRMesh, this.material)],
    });
    this.shoulderREntity.addChild(this.armREntity);

    // Antebraço Direito
    this.forearmREntity = new Entity('Forearm_R');
    this.forearmREntity.setLocalPosition(0, -5.8, 0);
    const forearmRMesh = this.createTaperedLimbMesh(device, 2.9, 2.9, 2.4, 2.4, 5.8, {
      u0: 0.25, v0: 0.65, u1: 0.45, v1: 0.85,
    });
    this.forearmREntity.addComponent('render', {
      meshInstances: [new MeshInstance(forearmRMesh, this.material)],
    });
    this.armREntity.addChild(this.forearmREntity);

    // Mão Direita empunhando arma
    this.handREntity = new Entity('Hand_R');
    this.handREntity.setLocalPosition(0, -5.6, 0);
    const handRMesh = this.createBeveledHandMesh(device, 2.6, 2.8, 2.6, {
      u0: 0.45, v0: 0.35, u1: 0.6, v1: 0.5,
    });
    this.handREntity.addComponent('render', {
      meshInstances: [new MeshInstance(handRMesh, this.material)],
    });
    this.forearmREntity.addChild(this.handREntity);

    // Espada do Guerreiro (Lâmina chanfrada com vinco central, guarda e pomo de latão)
    this.equipmentEntity = new Entity('Equipment');
    this.equipmentEntity.setLocalPosition(0, -2.0, 1.2);
    const swordMesh = this.createMedievalSwordMesh(device, {
      u0: 0.85, v0: 0.35, u1: 1.0, v1: 1.0,
    });
    this.equipmentEntity.addComponent('render', {
      meshInstances: [new MeshInstance(swordMesh, this.material)],
    });
    this.handREntity.addChild(this.equipmentEntity);

    // Ajusta inclinação natural da espada na mão
    this.equipmentEntity.setLocalEulerAngles(65, 15, -25);

    // Inicializa pose
    this.applyIdlePose(0);
    this.setFacing('down');
  }

  public setVisible(visible: boolean): void {
    this.rootEntity.enabled = visible;
  }

  public destroy(): void {
    this.rootEntity.destroy();
  }

  /**
   * Atualiza a animação do guerreiro 3D respeitando os estados de gameplay:
   * IDLE, WALK, RUN, ATTACK, HEAVY_ATTACK, DODGE, JUMP, FALL, HURT, DEATH, ARCANE_FLOW
   */
  public update(
    dt: number,
    state: HeroState,
    facing: Direction,
    stateTimer: number,
    isMoving: boolean = false,
    jumpHeight: number = 0,
    isGrounded: boolean = true
  ): void {
    this.rootEntity.setLocalPosition(0, jumpHeight, 0);

    if (this.currentFacing !== facing) {
      this.currentFacing = facing;
      this.setFacing(facing);
    }

    switch (state) {
      case 'idle':
        this.idleTime += dt;
        this.applyIdlePose(this.idleTime);
        break;

      case 'walk':
        this.walkPhase += dt * 9.5;
        this.applyWalkPose(this.walkPhase);
        break;

      case 'run':
        this.walkPhase += dt * 14.5;
        this.applyWalkPose(this.walkPhase);
        break;

      case 'attack':
        this.attackPhase = 1.0 - Math.max(0, stateTimer / 0.38);
        this.applyAttackPose(this.attackPhase);
        break;

      case 'heavy_attack':
      case 'arcane_flow':
        this.applyChargedPose(dt);
        break;

      case 'dodge':
        this.dodgePhase = 1.0 - Math.max(0, stateTimer / 0.45);
        this.applyDodgePose(this.dodgePhase);
        break;

      case 'jump':
      case 'fall':
        this.legLEntity.setLocalEulerAngles(25, 0, 0);
        this.legREntity.setLocalEulerAngles(15, 0, 0);
        this.armREntity.setLocalEulerAngles(-40, 0, 0);
        break;

      case 'hurt':
        this.hurtPhase = 1.0 - Math.max(0, stateTimer / 0.3);
        this.applyHurtPose(this.hurtPhase);
        break;

      case 'death':
        this.bodyEntity.setLocalEulerAngles(85, 0, 0);
        this.bodyEntity.setLocalPosition(0, 3, 0);
        break;
    }
  }

  /**
   * Aplica rotação e perspectiva ao corpo dependendo da direção do olhar (WASD / Setas)
   */
  private setFacing(facing: Direction): void {
    switch (facing) {
      case 'down':
        // Vista frontal 3/4 ligeiramente inclinada para câmera ortográfica
        this.bodyEntity.setLocalEulerAngles(14, 0, 0);
        break;
      case 'up':
        // Vista posterior (costas do guerreiro)
        this.bodyEntity.setLocalEulerAngles(-12, 180, 0);
        break;
      case 'left':
        // Perfil esquerdo
        this.bodyEntity.setLocalEulerAngles(10, -82, 0);
        break;
      case 'right':
        // Perfil direito
        this.bodyEntity.setLocalEulerAngles(10, 82, 0);
        break;
    }
  }

  /**
   * ANIMAÇÃO IDLE:
   * Respiração suave no torso, leve movimento compensatório na cabeça e braços relaxados prontos para ação
   */
  private applyIdlePose(time: number): void {
    const breath = Math.sin(time * 2.6);
    const sway = Math.cos(time * 1.3);

    // Torso eleva sutilmente na inalação
    this.torsoEntity.setLocalPosition(0, 17.5 + breath * 0.35, 0);
    this.torsoEntity.setLocalEulerAngles(breath * 1.2, sway * 1.5, 0);

    // Cabeça compensa
    this.headEntity.setLocalEulerAngles(-breath * 1.8, -sway * 1.2, 0);

    // Pernas estáveis firmes no solo
    this.legLEntity.setLocalEulerAngles(0, 0, 0);
    this.legREntity.setLocalEulerAngles(0, 0, 0);
    this.bootLEntity.setLocalEulerAngles(0, 0, 0);
    this.bootREntity.setLocalEulerAngles(0, 0, 0);

    // Braço esquerdo levemente dobrado em prontidão
    this.armLEntity.setLocalEulerAngles(12 + breath * 2.0, 0, -8);
    this.forearmLEntity.setLocalEulerAngles(22 + breath * 1.5, 0, 0);

    // Braço direito segurando a espada na cintura
    this.armREntity.setLocalEulerAngles(15 - breath * 1.5, 0, 8);
    this.forearmREntity.setLocalEulerAngles(28, 0, 0);
    this.equipmentEntity.setLocalEulerAngles(55 + breath * 2.0, 15, -20);
  }

  /**
   * ANIMAÇÃO WALK:
   * Marcha articulada com alternância das pernas, flexão dos joelhos, oscilação de braços em oposição
   * e bobbing no eixo vertical (sem deslizamento).
   */
  private applyWalkPose(phase: number): void {
    const sin = Math.sin(phase);
    const cos = Math.cos(phase);

    // Bobbing vertical do torso com impacto no solo
    const bobY = Math.abs(sin) * 0.95;
    this.torsoEntity.setLocalPosition(0, 17.5 - bobY, 0);
    this.torsoEntity.setLocalEulerAngles(sin * 3.5, cos * 4.0, -sin * 2.0);

    // Cabeça contrabalança
    this.headEntity.setLocalEulerAngles(-sin * 2.0, -cos * 2.5, 0);

    // Perna Esquerda e Bota Esquerda
    const legLAngle = sin * 32;
    this.legLEntity.setLocalEulerAngles(legLAngle, 0, 0);
    // Dobra o joelho ao erguer a perna para frente
    const bootLAngle = sin < 0 ? -sin * 28 : 0;
    this.bootLEntity.setLocalEulerAngles(bootLAngle, 0, 0);

    // Perna Direita e Bota Direita (em oposição exata de 180°)
    const legRAngle = -sin * 32;
    this.legREntity.setLocalEulerAngles(legRAngle, 0, 0);
    const bootRAngle = sin > 0 ? sin * 28 : 0;
    this.bootREntity.setLocalEulerAngles(bootRAngle, 0, 0);

    // Braços em oposição natural às pernas
    // Braço Esquerdo avança quando perna direita avança
    this.armLEntity.setLocalEulerAngles(-sin * 26 + 10, 0, -6);
    this.forearmLEntity.setLocalEulerAngles(25 + Math.abs(sin) * 15, 0, 0);

    // Braço Direito (com a espada) acompanha com peso controlado
    this.armREntity.setLocalEulerAngles(sin * 22 + 12, 0, 6);
    this.forearmREntity.setLocalEulerAngles(30 - sin * 10, 0, 0);
    this.equipmentEntity.setLocalEulerAngles(60 + sin * 15, 15, -20);
  }

  /**
   * ANIMAÇÃO ATTACK:
   * 3 fases cinemáticas:
   * 0.00..0.30 - Antecipação (preparação, torso gira para trás, espada erguida)
   * 0.30..0.65 - Golpe veloz (estocada/corte descendente potente com avanço)
   * 0.65..1.00 - Recuperação suave
   */
  private applyAttackPose(progress: number): void {
    if (progress < 0.3) {
      // 1. Antecipação
      const t = progress / 0.3;
      this.torsoEntity.setLocalEulerAngles(-6 * t, -28 * t, -4 * t);
      this.headEntity.setLocalEulerAngles(4 * t, 20 * t, 0);

      this.armREntity.setLocalEulerAngles(-60 * t, -15 * t, 25 * t);
      this.forearmREntity.setLocalEulerAngles(70 * t, 0, 0);
      this.equipmentEntity.setLocalEulerAngles(-30 * t, 30 * t, -10);

      this.armLEntity.setLocalEulerAngles(25 * t, 15 * t, -20 * t);
    } else if (progress < 0.65) {
      // 2. Golpe (Swing potente)
      const t = (progress - 0.3) / 0.35;
      const swingEased = Math.sin(t * Math.PI * 0.5);

      this.torsoEntity.setLocalEulerAngles(8 * swingEased, 35 * swingEased, 5 * swingEased);
      this.headEntity.setLocalEulerAngles(-5, -25 * swingEased, 0);

      // Braço direito corta diagonalmente para frente e para baixo
      this.armREntity.setLocalEulerAngles(75 * swingEased, 20 * swingEased, -20 * swingEased);
      this.forearmREntity.setLocalEulerAngles(20, 0, 0);
      this.equipmentEntity.setLocalEulerAngles(110 * swingEased, -10, 15);

      this.armLEntity.setLocalEulerAngles(-30 * swingEased, 0, -25);
    } else {
      // 3. Recuperação
      const t = (progress - 0.65) / 0.35;
      const rec = 1.0 - t;

      this.torsoEntity.setLocalEulerAngles(8 * rec, 35 * rec, 5 * rec);
      this.armREntity.setLocalEulerAngles(75 * rec + 15 * t, 20 * rec, 0);
      this.equipmentEntity.setLocalEulerAngles(110 * rec + 55 * t, 15, -20);
    }
  }

  /**
   * ANIMAÇÃO CHARGED ATTACK (Fluxo Arcano):
   * Giro de 360° em alta velocidade com lâmina em riste
   */
  private applyChargedPose(dt: number): void {
    this.bodyEntity.rotateLocal(0, 0, 920 * dt);

    // Braço direito estendido horizontalmente com espada apontada para fora
    this.armREntity.setLocalEulerAngles(0, 0, 85);
    this.forearmREntity.setLocalEulerAngles(0, 0, 0);
    this.equipmentEntity.setLocalEulerAngles(0, 90, 0);

    // Braço esquerdo aberto para equilíbrio
    this.armLEntity.setLocalEulerAngles(0, 0, -75);
    this.forearmLEntity.setLocalEulerAngles(0, 0, 0);
  }

  /**
   * ANIMAÇÃO DODGE:
   * Esquiva rasteira com inclinação aerodinâmica para frente e pernas impulsionadas
   */
  private applyDodgePose(progress: number): void {
    const arc = Math.sin(progress * Math.PI);
    this.torsoEntity.setLocalPosition(0, 17.5 - arc * 4.5, arc * 2.0);
    this.torsoEntity.setLocalEulerAngles(38 * arc, 0, 0);

    this.legLEntity.setLocalEulerAngles(45 * arc, 0, 0);
    this.bootLEntity.setLocalEulerAngles(30 * arc, 0, 0);
    this.legREntity.setLocalEulerAngles(-25 * arc, 0, 0);
    this.bootREntity.setLocalEulerAngles(50 * arc, 0, 0);

    this.armLEntity.setLocalEulerAngles(-40 * arc, 0, -20);
    this.armREntity.setLocalEulerAngles(-45 * arc, 0, 20);
  }

  /**
   * ANIMAÇÃO HURT:
   * Recuo de tronco em reação ao impacto
   */
  private applyHurtPose(progress: number): void {
    const flinch = Math.sin(progress * Math.PI);
    this.torsoEntity.setLocalPosition(0, 17.5, -flinch * 2.5);
    this.torsoEntity.setLocalEulerAngles(-24 * flinch, 0, 0);
    this.headEntity.setLocalEulerAngles(18 * flinch, 0, 0);

    this.armLEntity.setLocalEulerAngles(-30 * flinch, 0, -35 * flinch);
    this.armREntity.setLocalEulerAngles(-35 * flinch, 0, 35 * flinch);
  }

  // ===========================================================================
  // GERADORES DE MALHAS 3D FACETADAS COM BEVELS, CHANFROS E VOLUMES
  // ===========================================================================

  /**
   * Torso chanfrado 3D (Peitoral Peascod + Túnica + Cinto)
   * Possui crista central saliente, faces inclinadas nos ombros e cintura cônica
   */
  private createBeveledTorsoMesh(
    device: GraphicsDevice,
    width: number,
    height: number,
    depth: number,
    uv: { u0: number; v0: number; u1: number; v1: number }
  ): Mesh {
    const hw = width * 0.5;
    const hh = height * 0.5;
    const hd = depth * 0.5;
    const taperW = hw * 0.72; // Cintura mais estreita que os ombros

    // 14 vértices definindo peitoral facetado, cinto e costas
    const positions = [
      // Frente Superior (Ombros)
      -hw, hh, hd * 0.6,    // 0: TL
      hw, hh, hd * 0.6,     // 1: TR
      0, hh, hd,            // 2: TC (Crista central alta)
      // Frente Meio (Peitoral)
      -hw * 1.05, 0, hd * 0.7, // 3: ML
      hw * 1.05, 0, hd * 0.7,  // 4: MR
      0, 0, hd * 1.2,          // 5: MC (Ponta de proa do peitoral)
      // Frente Base (Cintura/Cinto)
      -taperW, -hh, hd * 0.5,  // 6: BL
      taperW, -hh, hd * 0.5,   // 7: BR
      0, -hh, hd * 0.7,        // 8: BC (Fivela de cinto)
      // Costas
      -hw, hh, -hd,            // 9: Back TL
      hw, hh, -hd,             // 10: Back TR
      -taperW, -hh, -hd,       // 11: Back BL
      taperW, -hh, -hd,        // 12: Back BR
      0, 0, -hd * 1.05,        // 13: Back Mid
    ];

    const normals = [
      -0.5, 0.5, 0.7,   0.5, 0.5, 0.7,   0, 0.6, 0.8,
      -0.7, 0, 0.7,     0.7, 0, 0.7,     0, 0, 1.0,
      -0.6, -0.6, 0.5,  0.6, -0.6, 0.5,  0, -0.7, 0.7,
      -0.5, 0.5, -0.7,  0.5, 0.5, -0.7,
      -0.6, -0.6, -0.5, 0.6, -0.6, -0.5,
      0, 0, -1.0,
    ];

    const uvs = [
      uv.u0, uv.v0,                  uv.u1, uv.v0,                  (uv.u0 + uv.u1) * 0.5, uv.v0,
      uv.u0, (uv.v0 + uv.v1) * 0.5,  uv.u1, (uv.v0 + uv.v1) * 0.5, (uv.u0 + uv.u1) * 0.5, (uv.v0 + uv.v1) * 0.45,
      uv.u0, uv.v1,                  uv.u1, uv.v1,                  (uv.u0 + uv.u1) * 0.5, uv.v1,
      uv.u1, uv.v0,                  uv.u0, uv.v0,
      uv.u1, uv.v1,                  uv.u0, uv.v1,
      (uv.u0 + uv.u1) * 0.5, (uv.v0 + uv.v1) * 0.5,
    ];

    const indices = [
      // Peitoral Frontal Superior (facetas chanfradas esquerda e direita)
      0, 3, 5,   0, 5, 2,
      2, 5, 4,   2, 4, 1,
      // Peitoral Frontal Inferior / Abdômen
      3, 6, 8,   3, 8, 5,
      5, 8, 7,   5, 7, 4,
      // Laterais
      0, 9, 11,   0, 11, 6,
      1, 7, 12,   1, 12, 10,
      // Costas
      9, 10, 13,  9, 13, 11,
      10, 12, 13, 11, 13, 12,
      // Topo (Pescoço e Ombros)
      0, 2, 9,    2, 10, 9,
      2, 1, 10,
      // Base
      6, 11, 8,   8, 11, 12,
      8, 12, 7,
    ];

    const mesh = new Mesh(device);
    mesh.setPositions(positions);
    mesh.setNormals(normals);
    mesh.setUvs(0, uvs);
    mesh.setIndices(indices);
    mesh.update();
    return mesh;
  }

  /**
   * Cabeça 3D esculpida com queixo viril, maçãs do rosto e nariz
   */
  private createSculptedHeadMesh(
    device: GraphicsDevice,
    w: number,
    h: number,
    d: number,
    uv: { u0: number; v0: number; u1: number; v1: number }
  ): Mesh {
    const hw = w * 0.5;
    const hh = h * 0.5;
    const hd = d * 0.5;

    const positions = [
      // Rosto frontal (testa, maçãs, queixo cônico)
      -hw * 0.85, hh, hd * 0.7,   // 0: Testa L
      hw * 0.85, hh, hd * 0.7,    // 1: Testa R
      -hw, 0, hd * 0.8,           // 2: Bochecha L
      hw, 0, hd * 0.8,            // 3: Bochecha R
      0, 0, hd * 1.15,            // 4: Nariz/Ponte frontal
      -hw * 0.5, -hh, hd * 0.6,   // 5: Mandíbula L
      hw * 0.5, -hh, hd * 0.6,    // 6: Mandíbula R
      0, -hh * 1.1, hd * 0.7,     // 7: Queixo esculpido
      // Costas
      -hw * 0.8, hh, -hd,         // 8: Back TL
      hw * 0.8, hh, -hd,          // 9: Back TR
      -hw * 0.7, -hh, -hd * 0.8,  // 10: Back BL
      hw * 0.7, -hh, -hd * 0.8,   // 11: Back BR
    ];

    const normals = [
      -0.4, 0.6, 0.7,   0.4, 0.6, 0.7,
      -0.8, 0, 0.6,     0.8, 0, 0.6,
      0, 0, 1.0,
      -0.6, -0.6, 0.5,  0.6, -0.6, 0.5,
      0, -0.8, 0.6,
      -0.5, 0.5, -0.7,  0.5, 0.5, -0.7,
      -0.5, -0.5, -0.7, 0.5, -0.5, -0.7,
    ];

    const uvs = [
      uv.u0, uv.v0,                  uv.u1, uv.v0,
      uv.u0, (uv.v0 + uv.v1) * 0.5,  uv.u1, (uv.v0 + uv.v1) * 0.5,
      (uv.u0 + uv.u1) * 0.5, (uv.v0 + uv.v1) * 0.45,
      uv.u0, uv.v1,                  uv.u1, uv.v1,
      (uv.u0 + uv.u1) * 0.5, uv.v1,
      uv.u1, uv.v0,                  uv.u0, uv.v0,
      uv.u1, uv.v1,                  uv.u0, uv.v1,
    ];

    const indices = [
      // Fronte e nariz
      0, 2, 4,   0, 4, 1,
      1, 4, 3,
      // Bochechas e queixo
      2, 5, 7,   2, 7, 4,
      4, 7, 6,   4, 6, 3,
      // Laterais
      0, 8, 10,  0, 10, 2,
      1, 3, 11,  1, 11, 9,
      // Costas
      8, 9, 11,  8, 11, 10,
      // Topo
      0, 1, 9,   0, 9, 8,
      // Base
      5, 10, 11, 5, 11, 6,
      5, 6, 7,
    ];

    const mesh = new Mesh(device);
    mesh.setPositions(positions);
    mesh.setNormals(normals);
    mesh.setUvs(0, uvs);
    mesh.setIndices(indices);
    mesh.update();
    return mesh;
  }

  /**
   * Cabelo volumoso em camadas 3D (franja, costeletas e volume traseiro)
   */
  private createLayeredHairMesh(
    device: GraphicsDevice,
    w: number,
    h: number,
    d: number,
    uv: { u0: number; v0: number; u1: number; v1: number }
  ): Mesh {
    const hw = w * 0.5;
    const hh = h * 0.5;
    const hd = d * 0.5;

    const positions = [
      -hw, hh * 1.2, 0,          // 0: Topo L
      hw, hh * 1.2, 0,           // 1: Topo R
      0, hh * 1.4, 0,            // 2: Crista superior
      -hw * 1.05, 0, hd * 0.4,   // 3: Franja L
      hw * 1.05, 0, hd * 0.4,    // 4: Franja R
      0, hh * 0.2, hd * 0.9,     // 5: Mecha central
      -hw * 1.1, -hh * 0.5, -hd * 0.2, // 6: Lateral L
      hw * 1.1, -hh * 0.5, -hd * 0.2,  // 7: Lateral R
      0, -hh * 0.8, -hd * 1.1,   // 8: Nuca traseira baixa
      0, hh, -hd * 1.2,          // 9: Volume traseiro
    ];

    const normals = [
      -0.5, 0.7, 0.5,   0.5, 0.7, 0.5,   0, 1.0, 0,
      -0.7, 0.3, 0.6,   0.7, 0.3, 0.6,   0, 0.5, 0.8,
      -0.8, -0.2, 0,    0.8, -0.2, 0,
      0, -0.5, -0.8,    0, 0.6, -0.8,
    ];

    const uvs = [
      uv.u0, uv.v0,                  uv.u1, uv.v0,                  (uv.u0 + uv.u1) * 0.5, uv.v0,
      uv.u0, (uv.v0 + uv.v1) * 0.4,  uv.u1, (uv.v0 + uv.v1) * 0.4, (uv.u0 + uv.u1) * 0.5, (uv.v0 + uv.v1) * 0.5,
      uv.u0, uv.v1,                  uv.u1, uv.v1,
      (uv.u0 + uv.u1) * 0.5, uv.v1,  (uv.u0 + uv.u1) * 0.5, uv.v0,
    ];

    const indices = [
      // Topo e franjas
      0, 2, 5,   0, 5, 3,
      2, 1, 4,   2, 4, 5,
      // Laterais
      3, 5, 6,   4, 7, 5,
      0, 9, 2,   2, 9, 1,
      // Costas e nuca
      9, 8, 6,   9, 7, 8,
      0, 6, 9,   1, 9, 7,
    ];

    const mesh = new Mesh(device);
    mesh.setPositions(positions);
    mesh.setNormals(normals);
    mesh.setUvs(0, uvs);
    mesh.setIndices(indices);
    mesh.update();
    return mesh;
  }

  /**
   * Ombreira laminada em camadas (pauldron) curva com rebordo reforçado
   */
  private createLayeredPauldronMesh(
    device: GraphicsDevice,
    w: number,
    h: number,
    d: number,
    uv: { u0: number; v0: number; u1: number; v1: number }
  ): Mesh {
    const hw = w * 0.5;
    const hh = h * 0.5;
    const hd = d * 0.5;

    const positions = [
      // Placa superior abaulada
      -hw * 0.8, hh, 0,          // 0: Inner Top
      hw * 1.1, hh * 0.8, 0,     // 1: Outer Top
      0, hh * 1.25, hd * 0.6,    // 2: Ridge Top
      // Placa intermediária
      -hw * 0.9, 0, hd * 0.7,    // 3: Inner Mid
      hw * 1.2, -hh * 0.2, hd * 0.7, // 4: Outer Mid
      0, 0, hd * 1.1,            // 5: Ridge Mid
      // Rebordo inferior
      -hw * 0.7, -hh, hd * 0.4,  // 6: Inner Bot
      hw * 1.0, -hh, hd * 0.4,   // 7: Outer Bot
      0, -hh * 1.1, hd * 0.8,    // 8: Ridge Bot
      // Lado posterior
      0, 0, -hd * 0.8,           // 9: Back Center
    ];

    const normals = [
      -0.4, 0.7, 0.5,   0.7, 0.5, 0.5,   0, 0.8, 0.6,
      -0.6, 0, 0.8,     0.8, 0, 0.6,     0, 0.2, 0.9,
      -0.5, -0.6, 0.6,  0.6, -0.6, 0.5,  0, -0.7, 0.7,
      0, 0, -1.0,
    ];

    const uvs = [
      uv.u0, uv.v0,                  uv.u1, uv.v0,                  (uv.u0 + uv.u1) * 0.5, uv.v0,
      uv.u0, (uv.v0 + uv.v1) * 0.5,  uv.u1, (uv.v0 + uv.v1) * 0.5, (uv.u0 + uv.u1) * 0.5, (uv.v0 + uv.v1) * 0.5,
      uv.u0, uv.v1,                  uv.u1, uv.v1,                  (uv.u0 + uv.u1) * 0.5, uv.v1,
      (uv.u0 + uv.u1) * 0.5, (uv.v0 + uv.v1) * 0.5,
    ];

    const indices = [
      // Placa superior
      0, 3, 5,   0, 5, 2,
      2, 5, 4,   2, 4, 1,
      // Placa inferior
      3, 6, 8,   3, 8, 5,
      5, 8, 7,   5, 7, 4,
      // Encaixe posterior
      0, 2, 9,   2, 1, 9,
      1, 4, 9,   4, 7, 9,
      0, 9, 3,   3, 9, 6,
    ];

    const mesh = new Mesh(device);
    mesh.setPositions(positions);
    mesh.setNormals(normals);
    mesh.setUvs(0, uvs);
    mesh.setIndices(indices);
    mesh.update();
    return mesh;
  }

  /**
   * Membro cônico facetado (Braços, Antebraços, Coxas)
   * Prisma hexagonal chanfrado com variação de espessura de topo a base
   */
  private createTaperedLimbMesh(
    device: GraphicsDevice,
    topW: number,
    topD: number,
    botW: number,
    botD: number,
    height: number,
    uv: { u0: number; v0: number; u1: number; v1: number }
  ): Mesh {
    const htw = topW * 0.5;
    const htd = topD * 0.5;
    const hbw = botW * 0.5;
    const hbd = botD * 0.5;

    // Prisma hexagonal (6 lados facetados circulares)
    const positions: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    const segments = 6;
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);

      // Topo
      positions.push(cos * htw, 0, sin * htd);
      normals.push(cos, 0.2, sin);
      uvs.push(uv.u0 + (i / segments) * (uv.u1 - uv.u0), uv.v0);

      // Base
      positions.push(cos * hbw, -height, sin * hbd);
      normals.push(cos, -0.2, sin);
      uvs.push(uv.u0 + (i / segments) * (uv.u1 - uv.u0), uv.v1);
    }

    for (let i = 0; i < segments; i++) {
      const p1 = i * 2;
      const p2 = p1 + 1;
      const p3 = (i + 1) * 2;
      const p4 = p3 + 1;

      indices.push(p1, p2, p4);
      indices.push(p1, p4, p3);
    }

    const mesh = new Mesh(device);
    mesh.setPositions(positions);
    mesh.setNormals(normals);
    mesh.setUvs(0, uvs);
    mesh.setIndices(indices);
    mesh.update();
    return mesh;
  }

  /**
   * Bota medieval robusta com dobra de cano, proteção de calcanhar e sola
   */
  private createChunkyBootMesh(
    device: GraphicsDevice,
    w: number,
    h: number,
    d: number,
    uv: { u0: number; v0: number; u1: number; v1: number }
  ): Mesh {
    const hw = w * 0.5;
    const hd = d * 0.5;

    const positions = [
      // Dobra superior do cano da bota
      -hw * 1.15, 0, hd * 0.8,     // 0: Cuff FL
      hw * 1.15, 0, hd * 0.8,      // 1: Cuff FR
      -hw * 1.15, 0, -hd * 0.8,    // 2: Cuff BL
      hw * 1.15, 0, -hd * 0.8,     // 3: Cuff BR
      // Tornozelo
      -hw, -h * 0.5, hd * 0.7,     // 4: Ankle FL
      hw, -h * 0.5, hd * 0.7,      // 5: Ankle FR
      -hw, -h * 0.5, -hd * 0.7,    // 6: Ankle BL
      hw, -h * 0.5, -hd * 0.7,     // 7: Ankle BR
      // Ponta do pé (projetada para frente)
      -hw * 1.1, -h, hd * 1.35,    // 8: Toe FL
      hw * 1.1, -h, hd * 1.35,     // 9: Toe FR
      // Calcanhar e Sola (Toca o chão em Y = -h)
      -hw * 1.05, -h, -hd * 0.85,  // 10: Heel BL
      hw * 1.05, -h, -hd * 0.85,   // 11: Heel BR
    ];

    const normals = [
      -0.5, 0.3, 0.7,  0.5, 0.3, 0.7,  -0.5, 0.3, -0.7,  0.5, 0.3, -0.7,
      -0.6, 0, 0.7,    0.6, 0, 0.7,    -0.6, 0, -0.7,    0.6, 0, -0.7,
      -0.4, -0.7, 0.8, 0.4, -0.7, 0.8, -0.4, -0.7, -0.8, 0.4, -0.7, -0.8,
    ];

    const uvs = [
      uv.u0, uv.v0,                  uv.u1, uv.v0,                  uv.u0, uv.v0,                  uv.u1, uv.v0,
      uv.u0, (uv.v0 + uv.v1) * 0.5,  uv.u1, (uv.v0 + uv.v1) * 0.5, uv.u0, (uv.v0 + uv.v1) * 0.5, uv.u1, (uv.v0 + uv.v1) * 0.5,
      uv.u0, uv.v1,                  uv.u1, uv.v1,                  uv.u0, uv.v1,                  uv.u1, uv.v1,
    ];

    const indices = [
      // Cano frontal
      0, 4, 5,   0, 5, 1,
      // Cano traseiro
      3, 7, 6,   3, 6, 2,
      // Laterais do cano
      2, 6, 4,   2, 4, 0,
      1, 5, 7,   1, 7, 3,
      // Peito do pé
      4, 8, 9,   4, 9, 5,
      // Laterais do pé
      6, 10, 8,  6, 8, 4,
      5, 9, 11,  5, 11, 7,
      // Calcanhar traseiro
      7, 11, 10, 7, 10, 6,
      // Sola no chão (Y = -h)
      8, 10, 11, 8, 11, 9,
    ];

    const mesh = new Mesh(device);
    mesh.setPositions(positions);
    mesh.setNormals(normals);
    mesh.setUvs(0, uvs);
    mesh.setIndices(indices);
    mesh.update();
    return mesh;
  }

  /**
   * Mão enluvada chanfrada
   */
  private createBeveledHandMesh(
    device: GraphicsDevice,
    w: number,
    h: number,
    d: number,
    uv: { u0: number; v0: number; u1: number; v1: number }
  ): Mesh {
    const hw = w * 0.5;
    const hh = h * 0.5;
    const hd = d * 0.5;

    const positions = [
      -hw, 0, hd,      hw, 0, hd,      -hw, 0, -hd,      hw, 0, -hd,
      -hw * 0.8, -h, hd, hw * 0.8, -h, hd, -hw * 0.8, -h, -hd, hw * 0.8, -h, -hd,
    ];

    const normals = [
      -0.5, 0.5, 0.7,   0.5, 0.5, 0.7,   -0.5, 0.5, -0.7,   0.5, 0.5, -0.7,
      -0.5, -0.5, 0.7,  0.5, -0.5, 0.7,  -0.5, -0.5, -0.7,  0.5, -0.5, -0.7,
    ];

    const uvs = [
      uv.u0, uv.v0, uv.u1, uv.v0, uv.u0, uv.v0, uv.u1, uv.v0,
      uv.u0, uv.v1, uv.u1, uv.v1, uv.u0, uv.v1, uv.u1, uv.v1,
    ];

    const indices = [
      0, 4, 5, 0, 5, 1,
      3, 7, 6, 3, 6, 2,
      2, 6, 4, 2, 4, 0,
      1, 5, 7, 1, 7, 3,
      4, 6, 7, 4, 7, 5,
    ];

    const mesh = new Mesh(device);
    mesh.setPositions(positions);
    mesh.setNormals(normals);
    mesh.setUvs(0, uvs);
    mesh.setIndices(indices);
    mesh.update();
    return mesh;
  }

  /**
   * Espada medieval completa: lâmina com bisel duplo e canaleta de sangue,
   * cruzeta de aço forjado com detalhes e pomo octogonal de latão
   */
  private createMedievalSwordMesh(
    device: GraphicsDevice,
    uv: { u0: number; v0: number; u1: number; v1: number }
  ): Mesh {
    const bladeL = 22.0;
    const bladeW = 3.2;
    const bladeT = 1.1;
    const guardW = 8.5;
    const hiltL = 5.2;

    const positions = [
      // Pomo octogonal (base da empunhadura)
      -1.2, -hiltL - 1.6, 0,   1.2, -hiltL - 1.6, 0,   0, -hiltL - 2.2, 0,
      // Empunhadura
      -0.8, -hiltL, 0.6,       0.8, -hiltL, 0.6,       -0.8, 0, 0.6,        0.8, 0, 0.6,
      // Guarda / Cruzeta
      -guardW * 0.5, 0.5, 1.0, guardW * 0.5, 0.5, 1.0, -guardW * 0.5, -0.8, 1.0, guardW * 0.5, -0.8, 1.0,
      // Lâmina: Base com bisel diamante
      -bladeW * 0.5, 1.2, 0,   bladeW * 0.5, 1.2, 0,   0, 1.2, bladeT * 0.5,
      // Lâmina: Meio
      -bladeW * 0.45, bladeL * 0.6, 0, bladeW * 0.45, bladeL * 0.6, 0, 0, bladeL * 0.6, bladeT * 0.4,
      // Lâmina: Ponta afiada
      0, bladeL, 0,
    ];

    const normals = [
      0, -1, 0, 0, -1, 0, 0, -1, 0,
      -0.8, 0, 0.6, 0.8, 0, 0.6, -0.8, 0, 0.6, 0.8, 0, 0.6,
      0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,
      -0.7, 0, 0.7, 0.7, 0, 0.7, 0, 0, 1,
      -0.7, 0, 0.7, 0.7, 0, 0.7, 0, 0, 1,
      0, 1, 0,
    ];

    const uvs = [
      uv.u0, uv.v1, uv.u1, uv.v1, (uv.u0 + uv.u1) * 0.5, uv.v1,
      uv.u0, uv.v1 * 0.8, uv.u1, uv.v1 * 0.8, uv.u0, uv.v1 * 0.6, uv.u1, uv.v1 * 0.6,
      uv.u0, uv.v0, uv.u1, uv.v0, uv.u0, uv.v0 * 1.5, uv.u1, uv.v0 * 1.5,
      uv.u0, uv.v0 * 2, uv.u1, uv.v0 * 2, (uv.u0 + uv.u1) * 0.5, uv.v0 * 2,
      uv.u0, uv.v0 * 4, uv.u1, uv.v0 * 4, (uv.u0 + uv.u1) * 0.5, uv.v0 * 4,
      (uv.u0 + uv.u1) * 0.5, uv.v0,
    ];

    const indices = [
      // Pomo
      0, 1, 2,
      // Empunhadura
      3, 4, 6,   3, 6, 5,
      // Guarda
      7, 9, 10,  7, 10, 8,
      // Lâmina Base -> Meio (Facetas Esquerda e Direita com crista central)
      11, 14, 16, 11, 16, 13,
      13, 16, 15, 13, 15, 12,
      // Lâmina Meio -> Ponta
      14, 17, 16,
      16, 17, 15,
    ];

    const mesh = new Mesh(device);
    mesh.setPositions(positions);
    mesh.setNormals(normals);
    mesh.setUvs(0, uvs);
    mesh.setIndices(indices);
    mesh.update();
    return mesh;
  }

  // ===========================================================================
  // GERADOR DO ATLAS DE TEXTURA DO GUERREIRO RPG (PALETA DE ELDRIM)
  // ===========================================================================

  /**
   * Cria uma textura atlas estilizada de 512×512 contendo todos os materiais
   * do guerreiro: armadura de aço forjado com rebites, túnica verde-musgo,
   * cinturão de couro cru, cabelo castanho escuro, botas e lâmina runada.
   */
  private generateWarriorTextureAtlas(device: GraphicsDevice): Texture {
    const W = 512;
    const H = 512;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;

    // Fundo neutro
    ctx.fillStyle = '#1c1917';
    ctx.fillRect(0, 0, W, H);

    // 1. REGIÃO: TORSO (0..230, 0..230)
    // Placa peitoral de aço forjado com túnica verde e cinto
    const torsoGrad = ctx.createLinearGradient(0, 0, 230, 230);
    torsoGrad.addColorStop(0, '#5a6578'); // Aço superior iluminado
    torsoGrad.addColorStop(0.4, '#475569'); // Aço médio
    torsoGrad.addColorStop(0.7, '#334155'); // Sombra de aço
    torsoGrad.addColorStop(1, '#1e293b'); // Base de aço
    ctx.fillStyle = torsoGrad;
    ctx.fillRect(10, 10, 210, 210);

    // Túnica verde-musgo de Eldrim nas bordas
    ctx.fillStyle = '#2d5c56';
    ctx.fillRect(10, 10, 40, 210);
    ctx.fillRect(180, 10, 40, 210);
    ctx.fillStyle = '#1f403c';
    ctx.fillRect(10, 10, 15, 210);
    ctx.fillRect(205, 10, 15, 210);

    // Crista central e chanfros de relevo do peitoral
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(108, 15, 6, 150);
    ctx.fillStyle = '#64748b';
    ctx.fillRect(114, 15, 8, 150);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(102, 15, 6, 150);

    // Rebites de latão no peitoral
    ctx.fillStyle = '#d97706';
    for (let ry = 25; ry <= 145; ry += 30) {
      ctx.fillRect(55, ry, 6, 6);
      ctx.fillRect(165, ry, 6, 6);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(56, ry + 1, 3, 3);
      ctx.fillRect(166, ry + 1, 3, 3);
      ctx.fillStyle = '#d97706';
    }

    // Cinto de couro reforçado na base do torso
    ctx.fillStyle = '#45220d';
    ctx.fillRect(10, 175, 210, 45);
    ctx.fillStyle = '#603316';
    ctx.fillRect(10, 180, 210, 15);
    // Fivela de latão envelhecido
    ctx.fillStyle = '#d97706';
    ctx.fillRect(95, 178, 32, 28);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(100, 183, 22, 18);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(102, 185, 6, 14);

    // 2. REGIÃO: HEAD & FACE (230..380, 0..180)
    // Pele natural do guerreiro com traços angulosos
    const skinGrad = ctx.createLinearGradient(230, 0, 380, 180);
    skinGrad.addColorStop(0, '#e8b894');
    skinGrad.addColorStop(0.5, '#d49b72');
    skinGrad.addColorStop(1, '#b87b54');
    ctx.fillStyle = skinGrad;
    ctx.fillRect(235, 10, 140, 160);

    // Olhos determinados, sobrancelha e ponte do nariz
    ctx.fillStyle = '#3d2314'; // Sobrancelhas escuras
    ctx.fillRect(255, 60, 32, 7);
    ctx.fillRect(305, 60, 32, 7);
    // Olhos azuis acinzentados de Eldrim
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(260, 72, 22, 9);
    ctx.fillRect(310, 72, 22, 9);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(268, 72, 10, 9);
    ctx.fillRect(318, 72, 10, 9);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(271, 74, 5, 5);
    ctx.fillRect(321, 74, 5, 5);

    // Sombra do maxilar e boca
    ctx.fillStyle = '#9e623f';
    ctx.fillRect(278, 125, 36, 6);
    ctx.fillStyle = '#c2855d';
    ctx.fillRect(285, 80, 22, 35); // Nariz esculpido

    // 3. REGIÃO: HAIR (380..512, 0..180)
    // Cabelo castanho guerreiro com mechas texturizadas
    ctx.fillStyle = '#26150b';
    ctx.fillRect(385, 10, 120, 165);
    ctx.fillStyle = '#3d2314';
    for (let hx = 390; hx < 495; hx += 12) {
      ctx.fillRect(hx, 15, 8, 155);
    }
    ctx.fillStyle = '#5a351f';
    for (let hx = 394; hx < 490; hx += 24) {
      ctx.fillRect(hx, 25, 4, 110);
    }

    // 4. REGIÃO: PAULDRONS & OMBREIRAS (0..130, 230..360)
    // Placas curvas de aço com rebordo de ouro/latão
    ctx.fillStyle = '#475569';
    ctx.fillRect(10, 235, 115, 120);
    ctx.fillStyle = '#64748b';
    ctx.fillRect(15, 240, 105, 50);
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(20, 245, 95, 20);
    // Rebordo de latão forjado
    ctx.fillStyle = '#d97706';
    ctx.fillRect(10, 235, 115, 8);
    ctx.fillRect(10, 345, 115, 10);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(12, 237, 111, 4);

    // 5. REGIÃO: ARMS & VAMBRACES (130..240, 230..430)
    // Mangas verde-musgo e braçadeiras de couro com fivelas
    ctx.fillStyle = '#2d5c56'; // Manga
    ctx.fillRect(135, 235, 95, 95);
    ctx.fillStyle = '#1f403c';
    ctx.fillRect(135, 235, 95, 20);
    // Braçadeira de couro escuro
    ctx.fillStyle = '#422410';
    ctx.fillRect(135, 335, 95, 90);
    ctx.fillStyle = '#65371a';
    ctx.fillRect(140, 345, 85, 25);
    ctx.fillRect(140, 385, 85, 25);
    // Correias
    ctx.fillStyle = '#d97706';
    ctx.fillRect(175, 345, 12, 25);
    ctx.fillRect(175, 385, 12, 25);

    // 6. REGIÃO: LEGS & CUISSE (250..340, 250..380)
    // Calças escuras de couro e tecido resistente
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(250, 255, 85, 120);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(250, 255, 85, 25);
    ctx.fillRect(250, 350, 85, 25);
    ctx.fillStyle = '#334155';
    ctx.fillRect(275, 275, 35, 75);

    // 7. REGIÃO: BOOTS (340..440, 250..380)
    // Botas robustas com couro resistente, dobra superior e solado reforçado
    ctx.fillStyle = '#351c0e';
    ctx.fillRect(345, 255, 90, 120);
    ctx.fillStyle = '#4a2814';
    ctx.fillRect(345, 255, 90, 35); // Dobra superior do cano
    ctx.fillStyle = '#603316';
    ctx.fillRect(350, 260, 80, 12);
    // Solado e biqueira de couro cru
    ctx.fillStyle = '#1c0f07';
    ctx.fillRect(345, 355, 90, 20);

    // 8. REGIÃO: ESPADA MEDIEVAL (440..512, 180..512)
    // Lâmina de aço brilhante com vinco central e empunhadura
    ctx.fillStyle = '#64748b';
    ctx.fillRect(445, 185, 60, 320);
    // Aço polido
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(455, 190, 40, 260);
    ctx.fillStyle = '#f8fafc'; // Brilho de corte
    ctx.fillRect(470, 190, 10, 260);
    ctx.fillStyle = '#334155'; // Canaleta de sangue central
    ctx.fillRect(473, 210, 4, 210);
    // Cruzeta e Pomo de latão
    ctx.fillStyle = '#d97706';
    ctx.fillRect(445, 455, 60, 22);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(448, 458, 54, 8);
    // Cabo de couro trançado
    ctx.fillStyle = '#422410';
    ctx.fillRect(465, 477, 20, 28);
    ctx.fillStyle = '#d97706'; // Pomo
    ctx.fillRect(463, 502, 24, 8);

    return createPixelTexture(device, canvas, false, 'warrior_3d_atlas');
  }
}
