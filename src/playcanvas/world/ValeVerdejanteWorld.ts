import { Entity, GraphicsDevice, MeshInstance } from 'playcanvas';
import { PlayCanvasAssets } from '../assets/PlayCanvasAssets';
import { createPixelQuadMesh } from '../rendering/PixelQuadMesh';
import { createPixelMaterial } from '../rendering/GraphicsBackend';
import { CollisionSystem } from '../systems/CollisionSystem';
import {
  TreeEntity,
  RockEntity,
  RockSmallEntity,
  WaterLilyEntity,
  BushEntity,
  FlowerTuftEntity,
  FallenLogEntity,
  WoodenBridgeEntity,
  WoodSignEntity,
  AncientCrystalEntity,
  RiverStonesEntity,
  MushroomClusterEntity,
} from '../entities/EnvironmentEntities';
import { WaterSystem } from '../environment/WaterSystem';
import { ScenarioSpatialMap } from './ScenarioSpatialMap';

// =============================================================================
// ELDRIM: ECOS DO PASSADO - VALE VERDEJANTE WORLD (PLAYCANVAS ENGINE V2)
// =============================================================================
// Composição rica, orgânica e exuberante do Vale Verdejante:
// - Terreno base: Grama HD com microdetalhes e trilhas bifurcadas de terra batida
// - Rio dinâmico no flanco leste transponível por Ponte de Madeira rústica
// - Bosques densos no norte e sopé sul com ordenação 2.5D natural
// - Clareiras acolhedoras com pedras facetadas, troncos caídos com musgo,
//   cogumelos, tufos de flores silvestres e juncos ribeirinhos
// - Todos os elementos vegetais respondem ao vento com fases e frequências distintas
// =============================================================================

export class ValeVerdejanteWorld {
  public rootEntity: Entity;
  public readonly worldWidth = 768;
  public readonly worldHeight = 512;

  public trees: TreeEntity[] = [];
  public rocks: RockEntity[] = [];
  public rocksSmall: RockSmallEntity[] = [];
  public bushes: BushEntity[] = [];
  public flowers: FlowerTuftEntity[] = [];
  public mushrooms: MushroomClusterEntity[] = [];
  public logs: FallenLogEntity[] = [];
  public signs: WoodSignEntity[] = [];
  public crystals: AncientCrystalEntity[] = [];
  public riverStones: RiverStonesEntity[] = [];
  public waterLilies: WaterLilyEntity[] = [];
  public bridge: WoodenBridgeEntity;
  public waterSystem: WaterSystem;
  public godrayEntities: Entity[] = [];

  constructor(device: GraphicsDevice, collision: CollisionSystem) {
    this.rootEntity = new Entity('ValeVerdejanteRoot');

    // 1. Terreno Base: Cenário Pré-Composto HD do Vale Verdejante (768×512)
    // Contém gramado com variações de luz, trilha orgânica, leito profundo do rio,
    // ponte rústica com sombra, pedras e botânica do solo em pintura unificada
    const groundEntity = new Entity('Ground_ScenicMaster');
    groundEntity.setPosition(this.worldWidth * 0.5, this.worldHeight * 0.5, 0);
    const groundMesh = createPixelQuadMesh(device, {
      width: this.worldWidth,
      height: this.worldHeight,
      pivotX: 0.5,
      pivotY: 0.5,
    });
    const groundMat = createPixelMaterial({
      diffuseMap: PlayCanvasAssets.getTexture('valeverdejante_master_bg'),
      transparent: false,
    });
    groundEntity.addComponent('render', {
      meshInstances: [new MeshInstance(groundMesh, groundMat)],
    });
    this.rootEntity.addChild(groundEntity);

    // 1b. Terreno Base: Cenário Pré-Composto HD do Setor Leste (768×512 em X = 768..1536)
    // Continuação da floresta aberta além do rio, trilha leste e bacia meandrada
    const groundLesteEntity = new Entity('Ground_ScenicMaster_Leste');
    groundLesteEntity.setPosition(this.worldWidth + this.worldWidth * 0.5, this.worldHeight * 0.5, 0); // (1152, 256, 0)
    const groundLesteMesh = createPixelQuadMesh(device, {
      width: this.worldWidth,
      height: this.worldHeight,
      pivotX: 0.5,
      pivotY: 0.5,
    });
    const groundLesteMat = createPixelMaterial({
      diffuseMap: PlayCanvasAssets.getTexture('valeverdejante_leste_master_bg'),
      transparent: false,
    });
    groundLesteEntity.addComponent('render', {
      meshInstances: [new MeshInstance(groundLesteMesh, groundLesteMat)],
    });
    this.rootEntity.addChild(groundLesteEntity);

    // 2. Leito do Rio (X = 585) com fluxo dinâmico de água e ondulações cobrindo o canal (wX ~ 480..670)
    this.waterSystem = new WaterSystem(device, 585, 256, 175, 512);
    this.rootEntity.addChild(this.waterSystem.rootEntity);

    // 4. Ponte de Madeira Transponível (X = 585, Y = 254.5)
    this.bridge = new WoodenBridgeEntity(device, 585, 254.5);
    this.rootEntity.addChild(this.bridge.rootEntity);

    // Colisores do Rio: Bloqueiam a água profunda ao Norte e ao Sul da Ponte
    // Deixando o vão da ponte (Y = 236..273) livre para travessia oeste-leste!
    collision.addCollider({
      id: 'river_deep_north',
      x: 595,
      y: 393,
      width: 170,
      height: 238,
    });
    collision.addCollider({
      id: 'river_deep_south',
      x: 580,
      y: 117.5,
      width: 180,
      height: 235,
    });

    // Guarda-corpos físicos da ponte (impedem queda do herói na água norte/sul)
    collision.addCollider({
      id: 'bridge_rail_north',
      x: 585,
      y: 276,
      width: 170,
      height: 8,
    });
    collision.addCollider({
      id: 'bridge_rail_south',
      x: 585,
      y: 233,
      width: 170,
      height: 8,
    });

    // 5. Vitórias-Régias com flutuação procedural nas águas calmas
    const liliesData = [
      { x: 570, y: 130 },
      { x: 600, y: 310 },
      { x: 580, y: 440 },
      { x: 590, y: 80 },
    ];
    liliesData.forEach((l, idx) => {
      const lily = new WaterLilyEntity(device, l.x, l.y, `WaterLily_${idx}`);
      this.waterLilies.push(lily);
      this.rootEntity.addChild(lily.rootEntity);
    });

    // 6. Pedras de Leito e Margem com reflexo úmido e espuma
    const riverStonesData = [
      { x: 495, y: 140 },
      { x: 505, y: 320 },
      { x: 515, y: 420 },
      { x: 670, y: 110 },
      { x: 665, y: 380 },
    ];
    riverStonesData.forEach((s, idx) => {
      const stones = new RiverStonesEntity(device, s.x, s.y, `RiverStones_${idx}`);
      this.riverStones.push(stones);
      this.rootEntity.addChild(stones.rootEntity);
    });

    // 7. Juncos Ribeirinhos Densos ao longo das margens
    const reedsData = [
      { x: 490, y: 80 },
      { x: 500, y: 170 },
      { x: 495, y: 340 },
      { x: 515, y: 460 },
      { x: 675, y: 160 },
      { x: 670, y: 330 },
      { x: 655, y: 450 },
    ];
    reedsData.forEach((r) => this.criarJuncos(device, r.x, r.y));

    // 8. Bosque de Árvores Orgânicas (Ancient, Large, Med, Small com ordenação e oscilação)
    const treesData: Array<{ x: number; y: number; type: import('../entities/EnvironmentEntities').TreeType; id: string }> = [
      // Dossel Profundo do Norte (camada de fundo imersiva)
      { x: 60, y: 475, type: 'ancient', id: 'Tree_N_Back_1' },
      { x: 150, y: 485, type: 'med', id: 'Tree_N_Back_2' },
      { x: 240, y: 475, type: 'large', id: 'Tree_N_Back_3' },
      { x: 340, y: 485, type: 'small', id: 'Tree_N_Back_4' },
      { x: 440, y: 475, type: 'ancient', id: 'Tree_N_Back_5' },
      { x: 540, y: 470, type: 'large', id: 'Tree_N_Back_6' },

      // Bosque Noroeste
      { x: 100, y: 430, type: 'large', id: 'Tree_NW_1' },
      { x: 190, y: 450, type: 'ancient', id: 'Tree_NW_2' },
      { x: 280, y: 435, type: 'med', id: 'Tree_NW_3' },
      { x: 60, y: 360, type: 'small', id: 'Tree_NW_4' },
      { x: 45, y: 290, type: 'large', id: 'Tree_W_Edge_1' },

      // Bosque Norte-Centro (ao redor da clareira do monólito)
      { x: 390, y: 450, type: 'large', id: 'Tree_NC_1' },
      { x: 490, y: 430, type: 'ancient', id: 'Tree_NC_2' },
      { x: 560, y: 390, type: 'med', id: 'Tree_NC_3' },

      // Bosque Sudoeste
      { x: 45, y: 180, type: 'large', id: 'Tree_W_Edge_2' },
      { x: 80, y: 130, type: 'ancient', id: 'Tree_SW_1' },
      { x: 160, y: 80, type: 'med', id: 'Tree_SW_2' },
      { x: 120, y: 50, type: 'large', id: 'Tree_S_Back_1' },
      { x: 50, y: 240, type: 'small', id: 'Tree_SW_3' },

      // Sopé Sul
      { x: 290, y: 60, type: 'med', id: 'Tree_S_Back_2' },
      { x: 380, y: 55, type: 'ancient', id: 'Tree_S_Back_3' },

      // Bosque Sudeste (próximo à margem do rio)
      { x: 540, y: 110, type: 'large', id: 'Tree_SE_1' },
      { x: 470, y: 75, type: 'med', id: 'Tree_SE_2' },
      { x: 525, y: 50, type: 'small', id: 'Tree_S_Back_4' },

      // Margem Leste (além do rio)
      { x: 720, y: 450, type: 'ancient', id: 'Tree_E_Back' },
      { x: 720, y: 370, type: 'med', id: 'Tree_E_1' },
      { x: 725, y: 120, type: 'small', id: 'Tree_E_2' },
      { x: 720, y: 55, type: 'large', id: 'Tree_E_S' },

      // Setor Leste: Bosque mais aberto e clareiras amplas (X = 768..1536)
      { x: 860, y: 430, type: 'med', id: 'Tree_Leste_N1' },
      { x: 1040, y: 440, type: 'ancient', id: 'Tree_Leste_N2' },
      { x: 1260, y: 420, type: 'med', id: 'Tree_Leste_N3' },
      { x: 1440, y: 400, type: 'large', id: 'Tree_Leste_N4' },
      { x: 920, y: 80, type: 'small', id: 'Tree_Leste_S1' },
      { x: 1140, y: 70, type: 'med', id: 'Tree_Leste_S2' },
      { x: 1380, y: 75, type: 'small', id: 'Tree_Leste_S3' },
    ];

    // 8. Bosque de Árvores Orgânicas (Validado estritamente por ScenarioSpatialMap)
    const placedTrees: Array<{ x: number; y: number; radius: number }> = [];
    treesData.forEach((t) => {
      const radius = t.type === 'ancient' ? 38 : t.type === 'large' ? 32 : t.type === 'med' ? 24 : 18;
      const validation = ScenarioSpatialMap.canPlaceTree(t.x, t.y, radius, placedTrees);
      if (validation.allowed) {
        const tree = new TreeEntity(device, t.x, t.y, t.type, collision, t.id);
        this.trees.push(tree);
        this.rootEntity.addChild(tree.rootEntity);
        placedTrees.push({ x: t.x, y: t.y, radius });
      }
    });

    // 9. Tronco Caído de Carvalho com Musgo (ponto de interesse na clareira sul)
    const log1 = new FallenLogEntity(device, 240, 130, collision, 'FallenLog_South');
    this.logs.push(log1);
    this.rootEntity.addChild(log1.rootEntity);

    // 10. Rochas Facetadas (Grandes, Médias e Agrupadas - Validadas por ScenarioSpatialMap)
    const placedRocks: Array<{ x: number; y: number; radius: number }> = [];
    const rocksData: Array<{ x: number; y: number; id: string; type: import('../entities/EnvironmentEntities').RockType }> = [
      { x: 200, y: 175, id: 'Rock_SW', type: 'large' },
      { x: 510, y: 310, id: 'Rock_NE', type: 'large' },
      { x: 120, y: 320, id: 'Rock_Med_1', type: 'med' },
      { x: 420, y: 120, id: 'Rock_Cluster_1', type: 'cluster' },
      { x: 570, y: 140, id: 'Rock_Med_2', type: 'med' },
      // Setor Leste
      { x: 920, y: 340, id: 'Rock_Leste_1', type: 'large' },
      { x: 1180, y: 160, id: 'Rock_Leste_2', type: 'cluster' },
      { x: 1400, y: 330, id: 'Rock_Leste_3', type: 'med' },
    ];
    rocksData.forEach((r) => {
      const radius = r.type === 'large' ? 24 : r.type === 'cluster' ? 26 : 18;
      const validation = ScenarioSpatialMap.canPlaceRock(r.x, r.y, radius, placedRocks, placedTrees);
      if (validation.allowed) {
        const rock = new RockEntity(device, r.x, r.y, collision, r.id, r.type);
        this.rocks.push(rock);
        this.rootEntity.addChild(rock.rootEntity);
        placedRocks.push({ x: r.x, y: r.y, radius });
      }
    });

    const smallRocks = [
      { x: 140, y: 280, id: 'Rock_Small_1' },
      { x: 330, y: 150, id: 'Rock_Small_2' },
      { x: 550, y: 270, id: 'Rock_Small_3' },
      { x: 720, y: 220, id: 'Rock_Small_4' },
      // Setor Leste
      { x: 880, y: 350, id: 'Rock_Small_L1' },
      { x: 1120, y: 140, id: 'Rock_Small_L2' },
      { x: 1330, y: 310, id: 'Rock_Small_L3' },
    ];
    smallRocks.forEach((r) => {
      const validation = ScenarioSpatialMap.canPlaceRock(r.x, r.y, 10, placedRocks, placedTrees, true);
      if (validation.allowed) {
        const rockSmall = new RockSmallEntity(device, r.x, r.y, collision, r.id);
        this.rocksSmall.push(rockSmall);
        this.rootEntity.addChild(rockSmall.rootEntity);
        placedRocks.push({ x: r.x, y: r.y, radius: 10 });
      }
    });

    // 11. Placa de Sinalização de Madeira na bifurcação
    const sign = new WoodSignEntity(device, 190, 260, collision, 'Sign_Crossroad');
    this.signs.push(sign);
    this.rootEntity.addChild(sign.rootEntity);

    // 12. Cristal Rúnico Antigo na clareira mística
    const crystal = new AncientCrystalEntity(device, 340, 340, collision, 'Crystal_Ancient');
    this.crystals.push(crystal);
    this.rootEntity.addChild(crystal.rootEntity);

    // 13. Arbustos com oscilação natural ao vento (Validados por ScenarioSpatialMap)
    const placedFlora: Array<{ x: number; y: number; radius: number }> = [];
    const bushesData = [
      { x: 70, y: 300 },
      { x: 140, y: 370 },
      { x: 220, y: 280 },
      { x: 300, y: 370 },
      { x: 380, y: 140 },
      { x: 460, y: 340 },
      { x: 520, y: 170 },
      { x: 570, y: 330 },
      // Setor Leste
      { x: 840, y: 320 },
      { x: 1000, y: 175 },
      { x: 1160, y: 345 },
      { x: 1320, y: 180 },
    ];
    bushesData.forEach((b, idx) => {
      const validation = ScenarioSpatialMap.canPlaceFlora(b.x, b.y, 16, placedFlora);
      if (validation.allowed) {
        const bush = new BushEntity(device, b.x, b.y, `Bush_${idx}`);
        this.bushes.push(bush);
        this.rootEntity.addChild(bush.rootEntity);
        placedFlora.push({ x: b.x, y: b.y, radius: 16 });
      }
    });

    // 14. Tufos de Flores Silvestres (Coloridas: azuis, douradas, brancas)
    const flowersData = [
      { x: 120, y: 200 },
      { x: 170, y: 185 },
      { x: 210, y: 255 },
      { x: 260, y: 265 },
      { x: 310, y: 175 },
      { x: 360, y: 270 },
      { x: 410, y: 255 },
      { x: 430, y: 170 },
      { x: 480, y: 265 },
      { x: 490, y: 180 },
      { x: 560, y: 260 },
      { x: 600, y: 200 },
      { x: 610, y: 270 },
      { x: 720, y: 250 },
      // Setor Leste
      { x: 960, y: 295 },
      { x: 1080, y: 205 },
      { x: 1220, y: 220 },
      { x: 1360, y: 290 },
    ];
    flowersData.forEach((f, idx) => {
      const flower = new FlowerTuftEntity(device, f.x, f.y, `Flower_${idx}`);
      this.flowers.push(flower);
      this.rootEntity.addChild(flower.rootEntity);
    });

    // 15. Cogumelos da Floresta em clareiras úmidas e sopés de árvores
    const mushroomsData = [
      { x: 90, y: 390 },
      { x: 130, y: 410 },
      { x: 180, y: 415 },
      { x: 250, y: 105 },
      { x: 320, y: 95 },
      { x: 380, y: 415 },
      { x: 460, y: 410 },
      { x: 530, y: 80 },
      // Setor Leste
      { x: 1010, y: 405 },
      { x: 1070, y: 415 },
      { x: 1280, y: 110 },
    ];
    mushroomsData.forEach((m, idx) => {
      const shroom = new MushroomClusterEntity(device, m.x, m.y, `Mushroom_${idx}`);
      this.mushrooms.push(shroom);
      this.rootEntity.addChild(shroom.rootEntity);
    });

    // 16. Feixes de Luz Solar / Godrays Filtrados pelas Copas
    const godrayLocations = [
      { x: 160, y: 360, rot: -18 },
      { x: 310, y: 380, rot: -15 },
      { x: 470, y: 360, rot: -12 },
    ];
    for (const g of godrayLocations) {
      const gEnt = new Entity(`Godray_${g.x}_${g.y}`);
      gEnt.setPosition(g.x, g.y, 22);
      const gMesh = createPixelQuadMesh(device, { width: 84, height: 220, pivotX: 0.5, pivotY: 0.95 });
      const gMat = createPixelMaterial({
        diffuseMap: PlayCanvasAssets.getTexture('godray_beam'),
        transparent: true,
        opacity: 0.65,
      });
      gEnt.addComponent('render', {
        meshInstances: [new MeshInstance(gMesh, gMat)],
      });
      gEnt.setLocalEulerAngles(0, 0, g.rot);
      this.rootEntity.addChild(gEnt);
      this.godrayEntities.push(gEnt);
    }

    // 17. Paredes Perimetrais do Mundo e Limites de Navegação dos Setores
    // SETOR CENTRO:
    // Limite Oeste, Norte e Sul
    collision.addCollider({ id: 'bound_left', x: 10, y: 256, width: 20, height: 512 });
    collision.addCollider({ id: 'bound_bottom', x: 384, y: 10, width: 768, height: 20 });
    collision.addCollider({ id: 'bound_top', x: 384, y: 502, width: 768, height: 20 });

    // Limite Leste do Setor Centro: Dividido para deixar a trilha (Y = 226..284) totalmente LIVRE!
    collision.addCollider({ id: 'bound_centro_right_north', x: 758, y: 398, width: 20, height: 228 });
    collision.addCollider({ id: 'bound_centro_right_south', x: 758, y: 113, width: 20, height: 226 });

    // SETOR LESTE:
    // Limite Oeste do Setor Leste: Espelha a abertura da trilha (Y = 226..284) para passagem contínua
    collision.addCollider({ id: 'bound_leste_left_north', x: 778, y: 398, width: 20, height: 228 });
    collision.addCollider({ id: 'bound_leste_left_south', x: 778, y: 113, width: 20, height: 226 });

    // Limites Perimetrais Norte, Sul e Leste do Setor Leste
    collision.addCollider({ id: 'bound_leste_bottom', x: 1152, y: 10, width: 768, height: 20 });
    collision.addCollider({ id: 'bound_leste_top', x: 1152, y: 502, width: 768, height: 20 });
    collision.addCollider({ id: 'bound_leste_right', x: 1526, y: 256, width: 20, height: 512 });
  }

  /**
   * Ativa ou desativa o Modo de Diagnóstico Visual (F8).
   * Desabilita sobreposições volumétricas (godrays) para permitir auditoria limpa.
   */
  public setDiagnosticMode(active: boolean): void {
    for (let i = 0; i < this.godrayEntities.length; i++) {
      this.godrayEntities[i].enabled = !active;
    }
  }

  update(dt: number, time: number): void {
    this.waterSystem.update(dt, time);

    for (let i = 0; i < this.trees.length; i++) {
      this.trees[i].update(dt, time);
    }

    for (let i = 0; i < this.bushes.length; i++) {
      this.bushes[i].update(time);
    }

    for (let i = 0; i < this.flowers.length; i++) {
      this.flowers[i].update(time);
    }

    for (let i = 0; i < this.mushrooms.length; i++) {
      this.mushrooms[i].update(time);
    }

    for (let i = 0; i < this.crystals.length; i++) {
      this.crystals[i].update(time);
    }

    for (let i = 0; i < this.waterLilies.length; i++) {
      this.waterLilies[i].update(time);
    }
  }

  public getSortableEntities(): Array<{ entity: Entity; getY: () => number; baseLayer: number }> {
    const list: Array<{ entity: Entity; getY: () => number; baseLayer: number }> = [];

    // Árvores ordenadas pela BASE DO TRONCO / PONTO DE CONTATO COM O SOLO
    for (const tree of this.trees) {
      list.push({ entity: tree.rootEntity, getY: () => tree.getBaseY(), baseLayer: 10 });
    }
    // Rochas e elementos sólidos ordenados pela base de contato no solo
    for (const rock of this.rocks) {
      list.push({ entity: rock.rootEntity, getY: () => rock.getBaseY(), baseLayer: 10 });
    }
    for (const rock of this.rocksSmall) {
      list.push({ entity: rock.rootEntity, getY: () => rock.getBaseY(), baseLayer: 10 });
    }
    for (const log of this.logs) {
      list.push({ entity: log.rootEntity, getY: () => log.rootEntity.getPosition().y, baseLayer: 10 });
    }
    for (const sign of this.signs) {
      list.push({ entity: sign.rootEntity, getY: () => sign.rootEntity.getPosition().y, baseLayer: 10 });
    }
    for (const crystal of this.crystals) {
      list.push({ entity: crystal.rootEntity, getY: () => crystal.rootEntity.getPosition().y, baseLayer: 10 });
    }
    for (const bush of this.bushes) {
      list.push({ entity: bush.rootEntity, getY: () => bush.getBaseY(), baseLayer: 10 });
    }
    // Elementos rasteiros de solo (permanecem sob os pés dos atores)
    for (const flower of this.flowers) {
      list.push({ entity: flower.rootEntity, getY: () => flower.rootEntity.getPosition().y, baseLayer: 7 });
    }
    for (const mushroom of this.mushrooms) {
      list.push({ entity: mushroom.rootEntity, getY: () => mushroom.rootEntity.getPosition().y, baseLayer: 7 });
    }

    return list;
  }

  public setLayerVisibility(mode: 'all' | 'bg' | 'trees' | 'rocks' | 'flora' | 'bridge_river'): void {
    const showTrees = mode === 'all' || mode === 'trees';
    const showRocks = mode === 'all' || mode === 'rocks';
    const showFlora = mode === 'all' || mode === 'flora';
    const showBridgeRiver = mode === 'all' || mode === 'bridge_river';

    for (const t of this.trees) t.rootEntity.enabled = showTrees;
    for (const r of this.rocks) r.rootEntity.enabled = showRocks;
    for (const rs of this.rocksSmall) rs.rootEntity.enabled = showRocks;
    for (const l of this.logs) l.rootEntity.enabled = showRocks;

    for (const b of this.bushes) b.rootEntity.enabled = showFlora;
    for (const f of this.flowers) f.rootEntity.enabled = showFlora;
    for (const m of this.mushrooms) m.rootEntity.enabled = showFlora;
    for (const s of this.signs) s.rootEntity.enabled = showFlora;
    for (const c of this.crystals) c.rootEntity.enabled = showFlora;

    this.bridge.rootEntity.enabled = showBridgeRiver;
    this.waterSystem.rootEntity.enabled = showBridgeRiver;
    for (const wl of this.waterLilies) wl.rootEntity.enabled = showBridgeRiver;
    for (const rs of this.riverStones) rs.rootEntity.enabled = showBridgeRiver;
  }

  private criarJuncos(device: GraphicsDevice, x: number, y: number): void {
    const ent = new Entity(`Reeds_${x}_${y}`);
    ent.setPosition(x, y, 4);
    const mesh = createPixelQuadMesh(device, { width: 16, height: 28, pivotX: 0.5, pivotY: 0.1 });
    const mat = createPixelMaterial({
      diffuseMap: PlayCanvasAssets.getTexture('reeds'),
      transparent: true,
    });
    ent.addComponent('render', {
      meshInstances: [new MeshInstance(mesh, mat)],
    });
    this.rootEntity.addChild(ent);
  }
}

