// =============================================================================
// ELDRIM: ECOS DO PASSADO - HERO SKELETAL 2D (PROTÓTIPO C - 2D SKELETAL)
// =============================================================================
// Implementação de tecnologia 2D Esquelética Articulada (Hierarchical Paper-Doll Rig):
// - Grafo hierárquico de transformações:
//   Pelvis -> Torso -> Head / Shoulders -> Arms -> Forearms -> Weapon
//          -> Thighs -> Shins
// - Pivots anatômicos naturais que garantem continuidade e impedem separação de membros
// - Forward Kinematics procedural para ciclos de animação orgânicos:
//   IDLE, WALK, RUN, ATTACK, HEAVY_ATTACK, DODGE, JUMP, FALL, HURT, DEATH, ARCANE_FLOW
// - Conformidade estrita com Regra 29 (StandardMaterial unlit)
// =============================================================================

import {
  Entity,
  GraphicsDevice,
  Mesh,
  MeshInstance,
  StandardMaterial,
  Vec3,
} from 'playcanvas';
import { Direction } from '../systems/InputSystem';
import { HeroPrototypeId, HeroState, IHeroVisual } from './HeroVisualTypes';
import { HeroSkeletalAtlas, SkeletalPartUV } from '../assets/HeroSkeletalAtlas';
import { createPixelMaterial } from '../rendering/GraphicsBackend';

export class HeroSkeletal2D implements IHeroVisual {
  public readonly rootEntity: Entity;

  // Bones hierárquicos
  private pelvisEntity: Entity;
  private torsoEntity: Entity;
  private headEntity: Entity;
  private shoulderLEntity: Entity;
  private armLEntity: Entity;
  private forearmLEntity: Entity;
  private shoulderREntity: Entity;
  private armREntity: Entity;
  private forearmREntity: Entity;
  private weaponEntity: Entity;
  private thighLEntity: Entity;
  private shinLEntity: Entity;
  private thighREntity: Entity;
  private shinREntity: Entity;

  private material: StandardMaterial;

  constructor(device: GraphicsDevice) {
    this.rootEntity = new Entity('Hero_PrototypeC_Root');

    const texture = HeroSkeletalAtlas.getTexture(device);
    this.material = createPixelMaterial({
      diffuseMap: texture,
      transparent: true,
      alphaTest: 0.05,
    });

    // 1. Pelve (Base dos quadris)
    this.pelvisEntity = new Entity('Bone_Pelvis');
    this.attachMesh(device, this.pelvisEntity, 'pelvis');
    this.pelvisEntity.setLocalPosition(0, 16, 0.05);
    this.rootEntity.addChild(this.pelvisEntity);

    // 2. Torso (Tronco e peitoral)
    this.torsoEntity = new Entity('Bone_Torso');
    this.attachMesh(device, this.torsoEntity, 'torso');
    this.torsoEntity.setLocalPosition(0, 4, 0.02);
    this.pelvisEntity.addChild(this.torsoEntity);

    // 3. Cabeça
    this.headEntity = new Entity('Bone_Head');
    this.attachMesh(device, this.headEntity, 'head');
    this.headEntity.setLocalPosition(0, 18, 0.02);
    this.torsoEntity.addChild(this.headEntity);

    // 4. Membro Superior Esquerdo (Braço de apoio)
    this.shoulderLEntity = new Entity('Bone_Shoulder_L');
    this.attachMesh(device, this.shoulderLEntity, 'shoulder');
    this.shoulderLEntity.setLocalPosition(-7, 14, -0.02);
    this.torsoEntity.addChild(this.shoulderLEntity);

    this.armLEntity = new Entity('Bone_Arm_L');
    this.attachMesh(device, this.armLEntity, 'upper_arm');
    this.armLEntity.setLocalPosition(0, -3, 0);
    this.shoulderLEntity.addChild(this.armLEntity);

    this.forearmLEntity = new Entity('Bone_Forearm_L');
    this.attachMesh(device, this.forearmLEntity, 'forearm');
    this.forearmLEntity.setLocalPosition(0, -8, 0.01);
    this.armLEntity.addChild(this.forearmLEntity);

    // 5. Membro Superior Direito (Braço da arma)
    this.shoulderREntity = new Entity('Bone_Shoulder_R');
    this.attachMesh(device, this.shoulderREntity, 'shoulder');
    this.shoulderREntity.setLocalPosition(7, 14, 0.03);
    this.torsoEntity.addChild(this.shoulderREntity);

    this.armREntity = new Entity('Bone_Arm_R');
    this.attachMesh(device, this.armREntity, 'upper_arm');
    this.armREntity.setLocalPosition(0, -3, 0);
    this.shoulderREntity.addChild(this.armREntity);

    this.forearmREntity = new Entity('Bone_Forearm_R');
    this.attachMesh(device, this.forearmREntity, 'forearm');
    this.forearmREntity.setLocalPosition(0, -8, 0.01);
    this.armREntity.addChild(this.forearmREntity);

    // Espada acoplada à mão direita
    this.weaponEntity = new Entity('Bone_Weapon');
    this.attachMesh(device, this.weaponEntity, 'weapon');
    this.weaponEntity.setLocalPosition(0, -10, 0.02);
    this.forearmREntity.addChild(this.weaponEntity);

    // 6. Perna Esquerda
    this.thighLEntity = new Entity('Bone_Thigh_L');
    this.attachMesh(device, this.thighLEntity, 'thigh');
    this.thighLEntity.setLocalPosition(-5, -2, -0.02);
    this.pelvisEntity.addChild(this.thighLEntity);

    this.shinLEntity = new Entity('Bone_Shin_L');
    this.attachMesh(device, this.shinLEntity, 'shin');
    this.shinLEntity.setLocalPosition(0, -10, 0.01);
    this.thighLEntity.addChild(this.shinLEntity);

    // 7. Perna Direita
    this.thighREntity = new Entity('Bone_Thigh_R');
    this.attachMesh(device, this.thighREntity, 'thigh');
    this.thighREntity.setLocalPosition(5, -2, 0.02);
    this.pelvisEntity.addChild(this.thighREntity);

    this.shinREntity = new Entity('Bone_Shin_R');
    this.attachMesh(device, this.shinREntity, 'shin');
    this.shinREntity.setLocalPosition(0, -10, 0.01);
    this.thighREntity.addChild(this.shinREntity);
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
    // 1. Elevação de pulo no root
    this.rootEntity.setLocalPosition(0, jumpHeight, 0.1);

    // 2. Orientação horizontal (Flip X para esquerda)
    const scaleX = facing === 'left' ? -1 : 1;
    this.rootEntity.setLocalScale(scaleX, 1, 1);

    // 3. Ajuste de perspectiva de costas (Up)
    if (facing === 'up') {
      this.shoulderLEntity.setLocalPosition(-7, 14, 0.03);
      this.shoulderREntity.setLocalPosition(7, 14, -0.02);
    } else {
      this.shoulderLEntity.setLocalPosition(-7, 14, -0.02);
      this.shoulderREntity.setLocalPosition(7, 14, 0.03);
    }

    // 4. Cinemática Direta (Forward Kinematics) por estado
    switch (state) {
      case 'idle':
        this.applyIdleKinematics(stateTimer);
        break;
      case 'walk':
        this.applyWalkKinematics(stateTimer, 1.0);
        break;
      case 'run':
        this.applyWalkKinematics(stateTimer, 1.6);
        break;
      case 'attack':
        this.applyAttackKinematics(stateTimer, false);
        break;
      case 'heavy_attack':
        this.applyAttackKinematics(stateTimer, true);
        break;
      case 'dodge':
        this.applyDodgeKinematics(stateTimer);
        break;
      case 'jump':
      case 'fall':
        this.applyJumpKinematics(state === 'jump');
        break;
      case 'hurt':
        this.applyHurtKinematics(stateTimer);
        break;
      case 'arcane_flow':
        this.applyArcaneFlowKinematics(stateTimer);
        break;
      case 'death':
        this.applyDeathKinematics(stateTimer);
        break;
    }
  }

  /**
   * Cinemática IDLE: Respiração sutil, postura de prontidão
   */
  private applyIdleKinematics(time: number): void {
    const breath = Math.sin(time * 3.5);
    const sway = Math.cos(time * 1.8) * 1.5;

    this.pelvisEntity.setLocalPosition(0, 16 + breath * 0.4, 0.05);
    this.pelvisEntity.setLocalEulerAngles(0, 0, sway * 0.5);

    this.torsoEntity.setLocalEulerAngles(0, 0, breath * 1.2);
    this.headEntity.setLocalEulerAngles(0, 0, -breath * 0.8);

    // Braços em guarda relaxada
    this.shoulderLEntity.setLocalEulerAngles(0, 0, 15 + breath * 2);
    this.armLEntity.setLocalEulerAngles(0, 0, 10);
    this.forearmLEntity.setLocalEulerAngles(0, 0, -25);

    this.shoulderREntity.setLocalEulerAngles(0, 0, -15 - breath * 2);
    this.armREntity.setLocalEulerAngles(0, 0, -10);
    this.forearmREntity.setLocalEulerAngles(0, 0, 25);
    this.weaponEntity.setLocalEulerAngles(0, 0, -20);

    // Pernas firmes
    this.thighLEntity.setLocalEulerAngles(0, 0, -4);
    this.shinLEntity.setLocalEulerAngles(0, 0, 4);
    this.thighREntity.setLocalEulerAngles(0, 0, 4);
    this.shinREntity.setLocalEulerAngles(0, 0, -4);
  }

  /**
   * Cinemática WALK / RUN: Marcha articulada com contra-fase de membros
   */
  private applyWalkKinematics(time: number, speedMultiplier: number): void {
    const freq = 8.5 * speedMultiplier;
    const stride = Math.sin(time * freq);
    const bounce = -Math.abs(Math.sin(time * freq)) * (2.2 * speedMultiplier);
    const lean = speedMultiplier > 1.2 ? 10 : 4;

    this.pelvisEntity.setLocalPosition(0, 16 + bounce, 0.05);
    this.pelvisEntity.setLocalEulerAngles(0, 0, stride * 3);

    this.torsoEntity.setLocalEulerAngles(0, 0, lean + stride * 2);
    this.headEntity.setLocalEulerAngles(0, 0, -lean * 0.5 - stride * 1.5);

    // Pernas oscilam em fase oposta
    const legAngle = stride * (28 * speedMultiplier);
    this.thighLEntity.setLocalEulerAngles(0, 0, legAngle);
    this.shinLEntity.setLocalEulerAngles(0, 0, stride > 0 ? stride * 35 : -10);

    this.thighREntity.setLocalEulerAngles(0, 0, -legAngle);
    this.shinREntity.setLocalEulerAngles(0, 0, stride < 0 ? -stride * 35 : -10);

    // Braços balançam em contra-fase às pernas
    this.shoulderLEntity.setLocalEulerAngles(0, 0, -stride * 25);
    this.forearmLEntity.setLocalEulerAngles(0, 0, -30);

    this.shoulderREntity.setLocalEulerAngles(0, 0, stride * 28);
    this.forearmREntity.setLocalEulerAngles(0, 0, 30);
    this.weaponEntity.setLocalEulerAngles(0, 0, stride * 15 - 15);
  }

  /**
   * Cinemática ATTACK / HEAVY_ATTACK: Corte frontal com arco de espada
   */
  private applyAttackKinematics(time: number, isHeavy: boolean): void {
    const maxDuration = isHeavy ? 0.55 : 0.35;
    const progress = Math.min(0.99, time / maxDuration);

    if (progress < 0.28) {
      // 1. Antecipação (Erguendo a arma)
      const p = progress / 0.28;
      this.torsoEntity.setLocalEulerAngles(0, 0, -15 * p);
      this.shoulderREntity.setLocalEulerAngles(0, 0, -80 * p);
      this.armREntity.setLocalEulerAngles(0, 0, -30 * p);
      this.forearmREntity.setLocalEulerAngles(0, 0, -40 * p);
      this.weaponEntity.setLocalEulerAngles(0, 0, -60 * p);
    } else if (progress < 0.7) {
      // 2. Golpe (Impacto para frente)
      const p = (progress - 0.28) / 0.42;
      this.torsoEntity.setLocalEulerAngles(0, 0, 20 * p);
      this.shoulderREntity.setLocalEulerAngles(0, 0, 75 * p);
      this.armREntity.setLocalEulerAngles(0, 0, 20 * p);
      this.forearmREntity.setLocalEulerAngles(0, 0, 45 * p);
      this.weaponEntity.setLocalEulerAngles(0, 0, 95 * p);
    } else {
      // 3. Recuperação
      const p = (progress - 0.7) / 0.3;
      this.torsoEntity.setLocalEulerAngles(0, 0, 20 * (1 - p));
      this.shoulderREntity.setLocalEulerAngles(0, 0, 75 * (1 - p));
      this.weaponEntity.setLocalEulerAngles(0, 0, 95 * (1 - p) - 20 * p);
    }
  }

  /**
   * Cinemática DODGE: Rolamento ágil
   */
  private applyDodgeKinematics(time: number): void {
    const progress = Math.min(0.99, time / 0.42);
    const roll = progress * 360;

    this.pelvisEntity.setLocalPosition(0, 10, 0.05);
    this.pelvisEntity.setLocalEulerAngles(0, 0, roll);

    // Membros recolhidos no centro de gravidade
    this.thighLEntity.setLocalEulerAngles(0, 0, 70);
    this.shinLEntity.setLocalEulerAngles(0, 0, -90);
    this.thighREntity.setLocalEulerAngles(0, 0, 70);
    this.shinREntity.setLocalEulerAngles(0, 0, -90);

    this.shoulderLEntity.setLocalEulerAngles(0, 0, 60);
    this.shoulderREntity.setLocalEulerAngles(0, 0, -60);
  }

  /**
   * Cinemática JUMP / FALL
   */
  private applyJumpKinematics(isAscending: boolean): void {
    if (isAscending) {
      this.torsoEntity.setLocalEulerAngles(0, 0, -5);
      this.thighLEntity.setLocalEulerAngles(0, 0, 35);
      this.shinLEntity.setLocalEulerAngles(0, 0, -45);
      this.thighREntity.setLocalEulerAngles(0, 0, 25);
      this.shinREntity.setLocalEulerAngles(0, 0, -35);
      this.shoulderREntity.setLocalEulerAngles(0, 0, -50);
      this.weaponEntity.setLocalEulerAngles(0, 0, -30);
    } else {
      this.torsoEntity.setLocalEulerAngles(0, 0, 8);
      this.thighLEntity.setLocalEulerAngles(0, 0, -15);
      this.shinLEntity.setLocalEulerAngles(0, 0, 10);
      this.thighREntity.setLocalEulerAngles(0, 0, -10);
      this.shinREntity.setLocalEulerAngles(0, 0, 5);
      this.shoulderREntity.setLocalEulerAngles(0, 0, 20);
    }
  }

  /**
   * Cinemática HURT: Recuo com recuo de cabeça
   */
  private applyHurtKinematics(time: number): void {
    const p = Math.sin(time * 25);
    this.torsoEntity.setLocalEulerAngles(0, 0, -18);
    this.headEntity.setLocalEulerAngles(0, 0, 15);
    this.shoulderLEntity.setLocalEulerAngles(0, 0, -45 + p * 10);
    this.shoulderREntity.setLocalEulerAngles(0, 0, 45 - p * 10);
  }

  /**
   * Cinemática ARCANE FLOW: Giro contínuo de 360°
   */
  private applyArcaneFlowKinematics(time: number): void {
    const spin = (time * 12) % (Math.PI * 2);
    this.torsoEntity.setLocalEulerAngles(0, 0, 10);
    this.shoulderREntity.setLocalEulerAngles(0, 0, 85);
    this.weaponEntity.setLocalEulerAngles(0, 0, 90 + Math.sin(spin) * 20);
  }

  /**
   * Cinemática DEATH: Colapso do esqueleto ao solo
   */
  private applyDeathKinematics(time: number): void {
    const progress = Math.min(1.0, time / 0.7);
    this.pelvisEntity.setLocalPosition(0, 16 * (1 - progress * 0.8), 0.05);
    this.pelvisEntity.setLocalEulerAngles(0, 0, progress * 85);
    this.torsoEntity.setLocalEulerAngles(0, 0, progress * 15);
    this.headEntity.setLocalEulerAngles(0, 0, progress * -30);
    this.weaponEntity.setLocalPosition(0, -6 + progress * 4, 0.02);
  }

  private attachMesh(device: GraphicsDevice, entity: Entity, partName: string): void {
    const uv = HeroSkeletalAtlas.parts[partName];
    if (!uv) return;

    const mesh = this.createPartMesh(device, uv);
    entity.addComponent('render', {
      meshInstances: [new MeshInstance(mesh, this.material)],
    });
  }

  private createPartMesh(device: GraphicsDevice, uv: SkeletalPartUV): Mesh {
    const w = uv.width;
    const h = uv.height;
    const px = uv.pivotX;
    const py = uv.pivotY;

    const x0 = -w * px;
    const x1 = w * (1 - px);
    const y0 = -h * py;
    const y1 = h * (1 - py);

    const positions = [
      x0, y0, 0,
      x1, y0, 0,
      x0, y1, 0,
      x1, y1, 0,
    ];

    const normals = [
      0, 0, 1,
      0, 0, 1,
      0, 0, 1,
      0, 0, 1,
    ];

    const uvs = [
      uv.u0, 1 - uv.v1,
      uv.u1, 1 - uv.v1,
      uv.u0, 1 - uv.v0,
      uv.u1, 1 - uv.v0,
    ];

    const indices = [0, 1, 2, 2, 1, 3];

    const mesh = new Mesh(device);
    mesh.setPositions(positions);
    mesh.setNormals(normals);
    mesh.setUvs(0, uvs);
    mesh.setIndices(indices);
    mesh.update();

    return mesh;
  }

  public destroy(): void {
    this.rootEntity.destroy();
  }
}
