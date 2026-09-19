import { GraphicsDevice, Texture, StandardMaterial } from 'playcanvas';
import { createPixelTexture, createPixelMaterial } from '../rendering/GraphicsBackend';
import { RenV8Atlas } from '../../phaser/assets/RenV8Atlas';
import { ScenicValeBackground } from '../world/ScenicValeBackground';
import { StylizedTreeAssets } from './StylizedTreeAssets';
import { StylizedRockAssets } from './StylizedRockAssets';
import { RenWarriorAssets } from './RenWarriorAssets';

// =============================================================================
// ELDRIM: ECOS DO PASSADO - ASSETS MANAGER (PLAYCANVAS ENGINE V2)
// =============================================================================
// Centraliza geração e cache de texturas e materiais Pixel Art HD para PlayCanvas.
// Mantém fidelidade estrita ao projeto com filtragem NEAREST e alpha transparency.
// =============================================================================

export class PlayCanvasAssets {
  private static textures = new Map<string, Texture>();
  private static materials = new Map<string, StandardMaterial>();

  /**
   * Limpa e destrói todas as texturas e materiais cacheados para liberar recursos do GraphicsDevice
   */
  static clear(): void {
    for (const tex of this.textures.values()) {
      try {
        tex.destroy();
      } catch {
        // Ignora erros se a textura já tiver sido desalocada pelo contexto
      }
    }
    this.textures.clear();

    for (const mat of this.materials.values()) {
      try {
        mat.destroy();
      } catch {
        // Ignora erros se o material já tiver sido desalocado
      }
    }
    this.materials.clear();
  }

  /**
   * Inicializa e pré-carrega todas as texturas e materiais da Vertical Slice
   */
  static init(device: GraphicsDevice): void {
    // Garante limpeza estrita de recursos estáticos antes de criar novas texturas
    this.clear();

    // 1. Novo Guerreiro Heroico Ren (Spritesheet e Sombra) - Baseado em Free3D RPG Warrior 4054
    console.log('[PlayCanvasAssets.init] Registrando texturas do novo Guerreiro Heroico Ren...');
    RenWarriorAssets.registerWarriorTextures(device, this.textures);

    // 2. Árvores e Sombras Projetadas
    this.gerarArvoresESombras(device);

    // 3. Rochas e Detalhes
    this.gerarRochas(device);

    // 4. Terreno (Grama e Trilha)
    this.gerarTilesTerreno(device);

    // 5. Água e Vegetação Ribeirinha
    this.gerarAguaEVegetacao(device);

    // 6. Alvo de Combate (Monólito Rúnico Corrompido)
    this.gerarAlvoCombate(device);

    // 7. VFX de Ataque e Partículas
    this.gerarEfeitosVFX(device);

    // 8. Elementos Ricos e Vida do Vale Verdejante (Flores, Troncos, Ponte, Cogumelos, Vagalumes)
    this.gerarElementosDoVale(device);

    // 9. Cenário Pré-Composto HD do Vale Verdejante (Camada Base de Fundo)
    console.log('[PlayCanvasAssets.init] Gerando composição pictórica HD do Vale Verdejante (768×512)...');
    this.textures.set('valeverdejante_master_bg', ScenicValeBackground.generateMasterBackground(device));
  }

  static registerMaterial(mat: StandardMaterial): StandardMaterial {
    const key = `mat_${this.materials.size}_${Date.now()}_${Math.random()}`;
    this.materials.set(key, mat);
    return mat;
  }

  static getLoadedSummary(): { texturesCount: number; textureNames: string[]; materialsCount: number; materialNames: string[] } {
    return {
      texturesCount: this.textures.size,
      textureNames: Array.from(this.textures.keys()),
      materialsCount: this.materials.size,
      materialNames: Array.from(this.materials.keys()),
    };
  }

  static getTexture(name: string): Texture {
    const tex = this.textures.get(name);
    if (!tex) throw new Error(`[PlayCanvasAssets] Textura não encontrada: ${name}`);
    return tex;
  }

  static getMaterial(name: string, createIfMissing?: () => StandardMaterial): StandardMaterial {
    let mat = this.materials.get(name);
    if (!mat && createIfMissing) {
      mat = createIfMissing();
      this.materials.set(name, mat);
    }
    if (!mat) throw new Error(`[PlayCanvasAssets] Material não encontrado: ${name}`);
    return mat;
  }

  // ===========================================================================
  // GERADORES DE PROCEDURAL PIXEL ART HD
  // ===========================================================================

  private static gerarArvoresESombras(device: GraphicsDevice): void {
    StylizedTreeAssets.registerStylizedTrees(device, this.textures);
  }

  private static gerarRochas(device: GraphicsDevice): void {
    console.log('[PlayCanvasAssets.gerarRochas] Gerando variações de rochas e vegetação...');

    // =========================================================================
    // ROCHAS ESTILIZADAS HAND-PAINTED - FAMÍLIA ROCK (LARGE, MED, SMALL, TINY, CLUSTER)
    // =========================================================================
    StylizedRockAssets.registerStylizedRocks(device, this.textures);

    // Arbusto denso (40×32)
    const bushCanvas = document.createElement('canvas');
    bushCanvas.width = 40;
    bushCanvas.height = 32;
    const ctxB = bushCanvas.getContext('2d')!;
    ctxB.fillStyle = '#142C0E';
    ctxB.beginPath();
    ctxB.moveTo(4, 28);
    ctxB.lineTo(12, 10);
    ctxB.lineTo(28, 8);
    ctxB.lineTo(36, 20);
    ctxB.lineTo(34, 28);
    ctxB.closePath();
    ctxB.fill();

    ctxB.fillStyle = '#193813';
    ctxB.beginPath();
    ctxB.moveTo(8, 26);
    ctxB.lineTo(16, 12);
    ctxB.lineTo(26, 10);
    ctxB.lineTo(32, 24);
    ctxB.closePath();
    ctxB.fill();

    ctxB.fillStyle = '#31541F';
    ctxB.fillRect(14, 12, 12, 10);
    ctxB.fillStyle = '#6E9345';
    ctxB.fillRect(16, 10, 8, 4);

    // Bagas azuis
    ctxB.fillStyle = '#38bdf8';
    ctxB.fillRect(14, 14, 2, 2);
    ctxB.fillRect(22, 12, 2, 2);
    ctxB.fillRect(26, 18, 2, 2);
    this.textures.set('bush', createPixelTexture(device, bushCanvas, false, 'bush'));
  }

  private static gerarTilesTerreno(device: GraphicsDevice): void {
    console.log('[PlayCanvasAssets.gerarTilesTerreno] Gerando texturas de grama e trilhas...');
    // Grama Base (64×64 repetível)
    const grassCanvas = document.createElement('canvas');
    grassCanvas.width = 64;
    grassCanvas.height = 64;
    const ctxG = grassCanvas.getContext('2d')!;

    // Fundo verde natural rico
    ctxG.fillStyle = '#234928';
    ctxG.fillRect(0, 0, 64, 64);

    // Variação de tons sutis
    ctxG.fillStyle = '#1b3b20';
    for (let i = 0; i < 64; i += 8) {
      for (let j = 0; j < 64; j += 8) {
        if ((i + j) % 16 === 0) {
          ctxG.fillRect(i, j, 4, 4);
        }
      }
    }

    // Lâminas de grama vivas
    ctxG.fillStyle = '#316938';
    for (let n = 0; n < 30; n++) {
      const rx = (n * 17) % 60;
      const ry = (n * 29) % 60;
      ctxG.fillRect(rx, ry, 2, 3);
      ctxG.fillRect(rx + 1, ry - 1, 1, 2);
    }

    // Destaque solar em pontilhado
    ctxG.fillStyle = '#4a8e52';
    for (let n = 0; n < 12; n++) {
      const rx = (n * 37) % 62;
      const ry = (n * 43) % 62;
      ctxG.fillRect(rx, ry, 1, 2);
    }

    this.textures.set('terrain_grass', createPixelTexture(device, grassCanvas, false, 'terrain_grass'));

    // Trilha de Terra com Cascalho (64×64)
    const pathCanvas = document.createElement('canvas');
    pathCanvas.width = 64;
    pathCanvas.height = 64;
    const ctxP = pathCanvas.getContext('2d')!;

    ctxP.fillStyle = '#785338';
    ctxP.fillRect(0, 0, 64, 64);

    ctxP.fillStyle = '#5c3e29';
    for (let i = 0; i < 64; i += 8) {
      for (let j = 0; j < 64; j += 8) {
        if ((i * 3 + j * 7) % 11 === 0) {
          ctxP.fillRect(i, j, 3, 3);
        }
      }
    }

    // Pedrinhas e cascalho claro
    ctxP.fillStyle = '#9c7352';
    for (let n = 0; n < 24; n++) {
      const px = (n * 23) % 60;
      const py = (n * 31) % 60;
      ctxP.fillRect(px, py, 2, 2);
    }
    ctxP.fillStyle = '#c49a74';
    ctxP.fillRect(12, 18, 2, 1);
    ctxP.fillRect(36, 44, 2, 1);
    ctxP.fillRect(50, 10, 2, 1);

    this.textures.set('terrain_path', createPixelTexture(device, pathCanvas, false, 'terrain_path'));
  }

  private static gerarAguaEVegetacao(device: GraphicsDevice): void {
    console.log('[PlayCanvasAssets.gerarAguaEVegetacao] Gerando texturas de água, vitórias-régias e juncos...');
    // Água Base com Translucidez e Ondas (64×64)
    const waterCanvas = document.createElement('canvas');
    waterCanvas.width = 64;
    waterCanvas.height = 64;
    const ctxW = waterCanvas.getContext('2d')!;

    // Fundo azul ciano profundo
    ctxW.fillStyle = '#0e4366';
    ctxW.fillRect(0, 0, 64, 64);

    // Correnteza e ondas horizontais
    ctxW.fillStyle = '#166ba3';
    for (let y = 4; y < 64; y += 12) {
      ctxW.fillRect(0, y, 64, 4);
    }

    // Cristas de espuma reluzente
    ctxW.fillStyle = '#38bdf8';
    ctxW.fillRect(8, 5, 16, 2);
    ctxW.fillRect(36, 17, 20, 2);
    ctxW.fillRect(12, 29, 24, 2);
    ctxW.fillRect(40, 41, 14, 2);
    ctxW.fillRect(4, 53, 22, 2);

    // Espuma branca cintilante
    ctxW.fillStyle = '#f0f9ff';
    ctxW.fillRect(14, 5, 6, 1);
    ctxW.fillRect(42, 17, 8, 1);
    ctxW.fillRect(18, 29, 10, 1);

    this.textures.set('water_stream', createPixelTexture(device, waterCanvas, false, 'water_stream'));

    // Vitória-Régia / Folha d'água (28×28)
    const lilyCanvas = document.createElement('canvas');
    lilyCanvas.width = 28;
    lilyCanvas.height = 28;
    const ctxL = lilyCanvas.getContext('2d')!;
    ctxL.fillStyle = '#15803d';
    ctxL.beginPath();
    ctxL.arc(14, 14, 11, 0.25 * Math.PI, 1.95 * Math.PI);
    ctxL.lineTo(14, 14);
    ctxL.closePath();
    ctxL.fill();
    ctxL.fillStyle = '#4ade80';
    ctxL.fillRect(13, 5, 2, 4);
    // Flor de lótus rosa suave
    ctxL.fillStyle = '#f472b6';
    ctxL.fillRect(13, 13, 3, 3);
    ctxL.fillStyle = '#ffffff';
    ctxL.fillRect(14, 14, 1, 1);
    this.textures.set('water_lily', createPixelTexture(device, lilyCanvas, false, 'water_lily'));

    // Juncos da margem (16×28)
    const reedsCanvas = document.createElement('canvas');
    reedsCanvas.width = 16;
    reedsCanvas.height = 28;
    const ctxRD = reedsCanvas.getContext('2d')!;
    ctxRD.fillStyle = '#3f6212';
    ctxRD.fillRect(4, 6, 2, 22);
    ctxRD.fillRect(8, 2, 2, 26);
    ctxRD.fillRect(12, 10, 2, 18);
    // Espigas marrons
    ctxRD.fillStyle = '#713f12';
    ctxRD.fillRect(3, 4, 4, 8);
    ctxRD.fillRect(7, 1, 4, 9);
    ctxRD.fillRect(11, 8, 4, 7);
    this.textures.set('reeds', createPixelTexture(device, reedsCanvas, false, 'reeds'));
  }

  private static gerarAlvoCombate(device: GraphicsDevice): void {
    console.log('[PlayCanvasAssets.gerarAlvoCombate] Gerando textura de monólito rúnico corrompido...');
    // Monólito de Cristal Rúnico Corrompido (48×64)
    const crystalCanvas = document.createElement('canvas');
    crystalCanvas.width = 48;
    crystalCanvas.height = 64;
    const ctxC = crystalCanvas.getContext('2d')!;

    // Sombra de sustentação
    ctxC.fillStyle = 'rgba(10, 5, 20, 0.6)';
    ctxC.beginPath();
    ctxC.ellipse(24, 58, 18, 6, 0, 0, Math.PI * 2);
    ctxC.fill();

    // Pedestal de pedra escura
    ctxC.fillStyle = '#1e1b4b';
    ctxC.beginPath();
    ctxC.moveTo(10, 58);
    ctxC.lineTo(24, 48);
    ctxC.lineTo(38, 58);
    ctxC.lineTo(24, 62);
    ctxC.closePath();
    ctxC.fill();

    // Cristal prismático violeta/púrpura
    ctxC.fillStyle = '#581c87';
    ctxC.beginPath();
    ctxC.moveTo(24, 6);
    ctxC.lineTo(38, 32);
    ctxC.lineTo(24, 52);
    ctxC.lineTo(10, 32);
    ctxC.closePath();
    ctxC.fill();

    // Faceta iluminada
    ctxC.fillStyle = '#9333ea';
    ctxC.beginPath();
    ctxC.moveTo(24, 6);
    ctxC.lineTo(38, 32);
    ctxC.lineTo(24, 52);
    ctxC.closePath();
    ctxC.fill();

    // Núcleo rúnico pulsante
    ctxC.fillStyle = '#c084fc';
    ctxC.beginPath();
    ctxC.moveTo(24, 18);
    ctxC.lineTo(32, 32);
    ctxC.lineTo(24, 42);
    ctxC.lineTo(16, 32);
    ctxC.closePath();
    ctxC.fill();

    ctxC.fillStyle = '#ffffff';
    ctxC.fillRect(23, 28, 2, 8);
    ctxC.fillRect(20, 31, 8, 2);

    this.textures.set('combat_target', createPixelTexture(device, crystalCanvas, false, 'combat_target'));
  }

  private static gerarEfeitosVFX(device: GraphicsDevice): void {
    console.log('[PlayCanvasAssets.gerarEfeitosVFX] Gerando texturas de VFX slash e partículas...');
    // Arco Rúnico Translúcido (64×64)
    const arcCanvas = document.createElement('canvas');
    arcCanvas.width = 64;
    arcCanvas.height = 64;
    const ctxA = arcCanvas.getContext('2d')!;

    ctxA.lineWidth = 6;
    ctxA.strokeStyle = 'rgba(56, 189, 248, 0.85)';
    ctxA.beginPath();
    ctxA.arc(32, 32, 24, -0.3 * Math.PI, 0.4 * Math.PI);
    ctxA.stroke();

    ctxA.lineWidth = 2.5;
    ctxA.strokeStyle = '#ffffff';
    ctxA.beginPath();
    ctxA.arc(32, 32, 24, -0.3 * Math.PI, 0.4 * Math.PI);
    ctxA.stroke();

    this.textures.set('vfx_slash_arc', createPixelTexture(device, arcCanvas, false, 'vfx_slash_arc'));

    // Partícula de Folha de Carvalho ao Vento (8×8)
    const leafCanvas = document.createElement('canvas');
    leafCanvas.width = 8;
    leafCanvas.height = 8;
    const ctxLF = leafCanvas.getContext('2d')!;
    ctxLF.fillStyle = '#4ade80';
    ctxLF.fillRect(2, 2, 4, 4);
    ctxLF.fillStyle = '#16a34a';
    ctxLF.fillRect(3, 1, 2, 6);
    this.textures.set('particle_leaf', createPixelTexture(device, leafCanvas, false, 'particle_leaf'));

    // Partícula de Poeira / Impacto (8×8)
    const dustCanvas = document.createElement('canvas');
    dustCanvas.width = 8;
    dustCanvas.height = 8;
    const ctxD = dustCanvas.getContext('2d')!;
    ctxD.fillStyle = 'rgba(240, 240, 245, 0.8)';
    ctxD.beginPath();
    ctxD.arc(4, 4, 3, 0, Math.PI * 2);
    ctxD.fill();
    this.textures.set('particle_dust', createPixelTexture(device, dustCanvas, false, 'particle_dust'));
  }

  private static gerarElementosDoVale(device: GraphicsDevice): void {
    console.log('[PlayCanvasAssets.gerarElementosDoVale] Gerando texturas HD de flores, troncos, ponte, cogumelos e fauna do Vale Verdejante...');

    // 1. Tufos de Grama com Flores Silvestres (32×24)
    const flowerCanvas = document.createElement('canvas');
    flowerCanvas.width = 32;
    flowerCanvas.height = 24;
    const ctxF = flowerCanvas.getContext('2d')!;

    // Lâminas de grama densas
    ctxF.fillStyle = '#1c4a32';
    ctxF.fillRect(6, 12, 2, 10);
    ctxF.fillRect(10, 8, 2, 14);
    ctxF.fillRect(14, 10, 2, 12);
    ctxF.fillRect(18, 7, 2, 15);
    ctxF.fillRect(22, 11, 2, 11);
    ctxF.fillRect(26, 14, 2, 8);

    ctxF.fillStyle = '#2d6a45';
    ctxF.fillRect(4, 14, 2, 8);
    ctxF.fillRect(8, 10, 2, 12);
    ctxF.fillRect(12, 6, 2, 16);
    ctxF.fillRect(16, 9, 2, 13);
    ctxF.fillRect(20, 8, 2, 14);
    ctxF.fillRect(24, 12, 2, 10);

    ctxF.fillStyle = '#4e935f';
    ctxF.fillRect(9, 7, 2, 6);
    ctxF.fillRect(13, 5, 2, 8);
    ctxF.fillRect(21, 7, 2, 6);

    // Flores Azuis Celestes
    ctxF.fillStyle = '#38bdf8';
    ctxF.fillRect(7, 6, 3, 3);
    ctxF.fillRect(19, 5, 3, 3);
    ctxF.fillStyle = '#ffffff';
    ctxF.fillRect(8, 7, 1, 1);
    ctxF.fillRect(20, 6, 1, 1);

    // Flor Dourada / Amarela
    ctxF.fillStyle = '#fbbf24';
    ctxF.fillRect(13, 3, 3, 3);
    ctxF.fillStyle = '#f59e0b';
    ctxF.fillRect(14, 4, 1, 1);

    // Pequena flor branca / carmesim
    ctxF.fillStyle = '#f43f5e';
    ctxF.fillRect(24, 10, 2, 2);
    ctxF.fillStyle = '#ffffff';
    ctxF.fillRect(5, 12, 2, 2);

    this.textures.set('flowers_tuft', createPixelTexture(device, flowerCanvas, false, 'flowers_tuft'));

    // 2. Agrupamento de Cogumelos da Floresta (24×20)
    const shroomCanvas = document.createElement('canvas');
    shroomCanvas.width = 24;
    shroomCanvas.height = 20;
    const ctxSh = shroomCanvas.getContext('2d')!;

    // Cogumelo Maior (Centro)
    // Haste
    ctxSh.fillStyle = '#d6d3d1';
    ctxSh.fillRect(10, 10, 4, 8);
    ctxSh.fillStyle = '#a8a29e';
    ctxSh.fillRect(13, 10, 1, 8);
    // Chapéu Vermelho
    ctxSh.fillStyle = '#dc2626';
    ctxSh.beginPath();
    ctxSh.ellipse(12, 9, 8, 6, 0, Math.PI, 0);
    ctxSh.closePath();
    ctxSh.fill();
    // Pontinhos Brancos
    ctxSh.fillStyle = '#ffffff';
    ctxSh.fillRect(8, 7, 2, 2);
    ctxSh.fillRect(12, 5, 2, 2);
    ctxSh.fillRect(15, 8, 2, 2);

    // Cogumelo Menor (Esquerda)
    ctxSh.fillStyle = '#e7e5e4';
    ctxSh.fillRect(4, 13, 3, 5);
    ctxSh.fillStyle = '#ea580c';
    ctxSh.beginPath();
    ctxSh.ellipse(5, 12, 5, 4, -0.2, Math.PI, 0);
    ctxSh.closePath();
    ctxSh.fill();
    ctxSh.fillStyle = '#fef08a';
    ctxSh.fillRect(4, 10, 2, 2);

    // Musgo de base
    ctxSh.fillStyle = '#1c4a32';
    ctxSh.fillRect(2, 17, 20, 2);
    ctxSh.fillStyle = '#365314';
    ctxSh.fillRect(6, 16, 12, 2);

    this.textures.set('mushrooms_cluster', createPixelTexture(device, shroomCanvas, false, 'mushrooms_cluster'));

    // 3. Tronco Caído de Carvalho com Musgo (80×32)
    const logCanvas = document.createElement('canvas');
    logCanvas.width = 80;
    logCanvas.height = 32;
    const ctxLog = logCanvas.getContext('2d')!;

    // Casca de carvalho
    ctxLog.fillStyle = '#271b12';
    ctxLog.beginPath();
    ctxLog.roundRect(8, 12, 64, 16, 4);
    ctxLog.fill();

    ctxLog.fillStyle = '#452b1e';
    ctxLog.fillRect(10, 14, 60, 12);
    ctxLog.fillStyle = '#613d29';
    ctxLog.fillRect(12, 15, 56, 4);

    // Anéis de corte na ponta direita
    ctxLog.fillStyle = '#785338';
    ctxLog.beginPath();
    ctxLog.ellipse(71, 20, 4, 8, 0, 0, Math.PI * 2);
    ctxLog.fill();
    ctxLog.fillStyle = '#a66f48';
    ctxLog.beginPath();
    ctxLog.ellipse(71, 20, 2, 5, 0, 0, Math.PI * 2);
    ctxLog.fill();

    // Ranhuras e fissuras
    ctxLog.fillStyle = '#1c140d';
    ctxLog.fillRect(24, 18, 12, 2);
    ctxLog.fillRect(42, 22, 16, 2);
    ctxLog.fillRect(34, 14, 8, 2);

    // Musgo fresco no topo do tronco
    ctxLog.fillStyle = '#1c4a32';
    ctxLog.fillRect(14, 10, 20, 4);
    ctxLog.fillRect(40, 11, 24, 4);
    ctxLog.fillStyle = '#365314';
    ctxLog.fillRect(16, 8, 14, 3);
    ctxLog.fillRect(44, 9, 18, 3);
    ctxLog.fillStyle = '#4d7c0f';
    ctxLog.fillRect(18, 8, 8, 2);
    ctxLog.fillRect(48, 9, 10, 2);

    this.textures.set('fallen_log', createPixelTexture(device, logCanvas, false, 'fallen_log'));

    // Sombra do tronco caído
    const logShadowCanvas = document.createElement('canvas');
    logShadowCanvas.width = 88;
    logShadowCanvas.height = 24;
    const ctxLS = logShadowCanvas.getContext('2d')!;
    const gradLS = ctxLS.createRadialGradient(44, 12, 6, 44, 12, 40);
    gradLS.addColorStop(0, 'rgba(6, 12, 18, 0.6)');
    gradLS.addColorStop(1, 'rgba(6, 12, 18, 0)');
    ctxLS.fillStyle = gradLS;
    ctxLS.beginPath();
    ctxLS.ellipse(44, 12, 40, 10, 0, 0, Math.PI * 2);
    ctxLS.fill();
    this.textures.set('sombra_log', createPixelTexture(device, logShadowCanvas, false, 'sombra_log'));

    // 4. Rocha Pequena / Seixo da Floresta (32×24)
    const rockSmallCanvas = document.createElement('canvas');
    rockSmallCanvas.width = 32;
    rockSmallCanvas.height = 24;
    const ctxRS = rockSmallCanvas.getContext('2d')!;

    ctxRS.fillStyle = '#1e293b';
    ctxRS.beginPath();
    ctxRS.moveTo(4, 20);
    ctxRS.lineTo(12, 6);
    ctxRS.lineTo(24, 7);
    ctxRS.lineTo(29, 18);
    ctxRS.lineTo(26, 22);
    ctxRS.closePath();
    ctxRS.fill();

    ctxRS.fillStyle = '#334155';
    ctxRS.beginPath();
    ctxRS.moveTo(8, 18);
    ctxRS.lineTo(14, 8);
    ctxRS.lineTo(22, 9);
    ctxRS.lineTo(26, 18);
    ctxRS.closePath();
    ctxRS.fill();

    ctxRS.fillStyle = '#64748b';
    ctxRS.beginPath();
    ctxRS.moveTo(14, 8);
    ctxRS.lineTo(20, 8);
    ctxRS.lineTo(18, 14);
    ctxRS.closePath();
    ctxRS.fill();

    ctxRS.fillStyle = '#365314';
    ctxRS.fillRect(10, 10, 6, 2);
    ctxRS.fillRect(12, 8, 4, 2);

    this.textures.set('rock_small', createPixelTexture(device, rockSmallCanvas, false, 'rock_small'));

    const rockSmallShadow = document.createElement('canvas');
    rockSmallShadow.width = 36;
    rockSmallShadow.height = 16;
    const ctxRSS = rockSmallShadow.getContext('2d')!;
    const gradRSS = ctxRSS.createRadialGradient(18, 8, 3, 18, 8, 16);
    gradRSS.addColorStop(0, 'rgba(6, 12, 18, 0.55)');
    gradRSS.addColorStop(1, 'rgba(6, 12, 18, 0)');
    ctxRSS.fillStyle = gradRSS;
    ctxRSS.beginPath();
    ctxRSS.ellipse(18, 8, 16, 6, 0, 0, Math.PI * 2);
    ctxRSS.fill();
    this.textures.set('sombra_rock_small', createPixelTexture(device, rockSmallShadow, false, 'sombra_rock_small'));

    // 5. Placa de Madeira / Sinalizador de Trilha (28×36)
    const signCanvas = document.createElement('canvas');
    signCanvas.width = 28;
    signCanvas.height = 36;
    const ctxSign = signCanvas.getContext('2d')!;

    // Poste fincado na terra
    ctxSign.fillStyle = '#271b12';
    ctxSign.fillRect(12, 10, 4, 24);
    ctxSign.fillStyle = '#452b1e';
    ctxSign.fillRect(13, 10, 2, 22);

    // Placa de carvalho entalhada
    ctxSign.fillStyle = '#1e140d';
    ctxSign.beginPath();
    ctxSign.roundRect(2, 4, 24, 14, 2);
    ctxSign.fill();

    ctxSign.fillStyle = '#5c3e29';
    ctxSign.fillRect(4, 5, 20, 12);
    ctxSign.fillStyle = '#785338';
    ctxSign.fillRect(5, 6, 18, 4);

    // Pregos de ferro
    ctxSign.fillStyle = '#94a3b8';
    ctxSign.fillRect(13, 8, 2, 2);
    ctxSign.fillRect(13, 13, 2, 2);

    // Runa / símbolo entalhado
    ctxSign.fillStyle = '#fef08a';
    ctxSign.fillRect(7, 9, 4, 2);
    ctxSign.fillRect(8, 11, 2, 3);
    ctxSign.fillRect(17, 9, 4, 4);

    this.textures.set('wood_sign', createPixelTexture(device, signCanvas, false, 'wood_sign'));

    // 6. Cristal Rúnico Menor (24×32)
    const runeCrystalCanvas = document.createElement('canvas');
    runeCrystalCanvas.width = 24;
    runeCrystalCanvas.height = 32;
    const ctxRC = runeCrystalCanvas.getContext('2d')!;

    // Base de pedra
    ctxRC.fillStyle = '#1e293b';
    ctxRC.beginPath();
    ctxRC.ellipse(12, 27, 8, 4, 0, 0, Math.PI * 2);
    ctxRC.fill();

    // Cristal Verde Esmeralda Rúnico
    ctxRC.fillStyle = '#064e3b';
    ctxRC.beginPath();
    ctxRC.moveTo(12, 4);
    ctxRC.lineTo(19, 16);
    ctxRC.lineTo(15, 26);
    ctxRC.lineTo(9, 26);
    ctxRC.lineTo(5, 16);
    ctxRC.closePath();
    ctxRC.fill();

    ctxRC.fillStyle = '#059669';
    ctxRC.beginPath();
    ctxRC.moveTo(12, 4);
    ctxRC.lineTo(19, 16);
    ctxRC.lineTo(12, 24);
    ctxRC.closePath();
    ctxRC.fill();

    ctxRC.fillStyle = '#34d399';
    ctxRC.beginPath();
    ctxRC.moveTo(12, 7);
    ctxRC.lineTo(16, 16);
    ctxRC.lineTo(12, 22);
    ctxRC.closePath();
    ctxRC.fill();

    ctxRC.fillStyle = '#a7f3d0';
    ctxRC.fillRect(11, 12, 2, 6);

    this.textures.set('ancient_crystal_small', createPixelTexture(device, runeCrystalCanvas, false, 'ancient_crystal_small'));

    // 7. Ponte de Madeira sobre o Rio (96×64)
    const bridgeCanvas = document.createElement('canvas');
    bridgeCanvas.width = 96;
    bridgeCanvas.height = 64;
    const ctxBr = bridgeCanvas.getContext('2d')!;

    // Vigas mestras horizontais de sustentação
    ctxBr.fillStyle = '#1e140d';
    ctxBr.fillRect(0, 10, 96, 6);
    ctxBr.fillRect(0, 48, 96, 6);

    ctxBr.fillStyle = '#362114';
    ctxBr.fillRect(0, 11, 96, 4);
    ctxBr.fillRect(0, 49, 96, 4);

    // Tábuas transversais (verticais) formando o tablado da ponte
    for (let x = 4; x < 92; x += 10) {
      // Fissura entre tábuas
      ctxBr.fillStyle = '#180f08';
      ctxBr.fillRect(x - 1, 14, 1, 36);

      // Tábua principal
      ctxBr.fillStyle = (x % 20 === 4) ? '#654321' : '#5a3b1d';
      ctxBr.fillRect(x, 14, 9, 36);

      // Veios da madeira
      ctxBr.fillStyle = '#7a512b';
      ctxBr.fillRect(x + 1, 16, 7, 3);
      ctxBr.fillRect(x + 2, 26, 5, 2);
      ctxBr.fillRect(x + 1, 38, 7, 3);

      // Cravos de ferro nos topos
      ctxBr.fillStyle = '#1e293b';
      ctxBr.fillRect(x + 3, 16, 2, 2);
      ctxBr.fillRect(x + 3, 46, 2, 2);
    }

    // Cordas e corrimão superior/inferior
    ctxBr.fillStyle = '#785338';
    ctxBr.fillRect(0, 6, 96, 4);
    ctxBr.fillRect(0, 54, 96, 4);
    ctxBr.fillStyle = '#a16207';
    for (let x = 8; x < 92; x += 16) {
      ctxBr.fillRect(x, 4, 4, 8);
      ctxBr.fillRect(x, 52, 4, 8);
    }

    // Musgo nas bordas molhadas da ponte
    ctxBr.fillStyle = '#1c4a32';
    ctxBr.fillRect(6, 12, 14, 3);
    ctxBr.fillRect(72, 48, 16, 3);

    this.textures.set('wooden_bridge', createPixelTexture(device, bridgeCanvas, false, 'wooden_bridge'));

    // Sombra da ponte sobre a água
    const bridgeShadowCanvas = document.createElement('canvas');
    bridgeShadowCanvas.width = 96;
    bridgeShadowCanvas.height = 64;
    const ctxBS = bridgeShadowCanvas.getContext('2d')!;
    ctxBS.fillStyle = 'rgba(6, 18, 30, 0.45)';
    ctxBS.fillRect(4, 16, 88, 40);
    this.textures.set('sombra_bridge', createPixelTexture(device, bridgeShadowCanvas, false, 'sombra_bridge'));

    // 8. Pedras de Margem e Leito de Rio (48×24)
    const riverStonesCanvas = document.createElement('canvas');
    riverStonesCanvas.width = 48;
    riverStonesCanvas.height = 24;
    const ctxSt = riverStonesCanvas.getContext('2d')!;

    // Pedra 1 (úmida)
    ctxSt.fillStyle = '#0f172a';
    ctxSt.beginPath();
    ctxSt.ellipse(14, 12, 10, 7, 0.2, 0, Math.PI * 2);
    ctxSt.fill();
    ctxSt.fillStyle = '#1e293b';
    ctxSt.beginPath();
    ctxSt.ellipse(13, 11, 8, 5, 0.2, 0, Math.PI * 2);
    ctxSt.fill();
    ctxSt.fillStyle = '#475569';
    ctxSt.fillRect(10, 8, 4, 2);
    // Espuma de água batendo
    ctxSt.fillStyle = '#e0f2fe';
    ctxSt.fillRect(4, 15, 6, 2);
    ctxSt.fillRect(20, 14, 4, 2);

    // Pedra 2
    ctxSt.fillStyle = '#1e293b';
    ctxSt.beginPath();
    ctxSt.ellipse(34, 14, 7, 5, -0.1, 0, Math.PI * 2);
    ctxSt.fill();
    ctxSt.fillStyle = '#334155';
    ctxSt.beginPath();
    ctxSt.ellipse(33, 13, 5, 3, -0.1, 0, Math.PI * 2);
    ctxSt.fill();
    ctxSt.fillStyle = '#38bdf8';
    ctxSt.fillRect(38, 16, 4, 1);

    this.textures.set('river_stones', createPixelTexture(device, riverStonesCanvas, false, 'river_stones'));

    // 9. Borboleta Azul (16×16)
    const bflyCanvas = document.createElement('canvas');
    bflyCanvas.width = 16;
    bflyCanvas.height = 16;
    const ctxBf = bflyCanvas.getContext('2d')!;
    // Asas azuis
    ctxBf.fillStyle = '#0284c7';
    ctxBf.fillRect(2, 3, 5, 5);
    ctxBf.fillRect(9, 3, 5, 5);
    ctxBf.fillRect(3, 8, 4, 4);
    ctxBf.fillRect(9, 8, 4, 4);
    // Destaque luminoso
    ctxBf.fillStyle = '#7dd3fc';
    ctxBf.fillRect(4, 4, 2, 2);
    ctxBf.fillRect(10, 4, 2, 2);
    // Corpo
    ctxBf.fillStyle = '#0f172a';
    ctxBf.fillRect(7, 3, 2, 9);
    this.textures.set('butterfly_azure', createPixelTexture(device, bflyCanvas, false, 'butterfly_azure'));

    // 10. Vagalume / Partícula Rúnica Fluorescente (12×12)
    const fireflyCanvas = document.createElement('canvas');
    fireflyCanvas.width = 12;
    fireflyCanvas.height = 12;
    const ctxFf = fireflyCanvas.getContext('2d')!;
    const gradFf = ctxFf.createRadialGradient(6, 6, 1, 6, 6, 6);
    gradFf.addColorStop(0, 'rgba(254, 240, 138, 1)');
    gradFf.addColorStop(0.4, 'rgba(163, 230, 53, 0.7)');
    gradFf.addColorStop(1, 'rgba(163, 230, 53, 0)');
    ctxFf.fillStyle = gradFf;
    ctxFf.beginPath();
    ctxFf.arc(6, 6, 6, 0, Math.PI * 2);
    ctxFf.fill();
    ctxFf.fillStyle = '#ffffff';
    ctxFf.fillRect(5, 5, 2, 2);
    this.textures.set('firefly_glow', createPixelTexture(device, fireflyCanvas, false, 'firefly_glow'));

    // 11. Borboleta Dourada / Monarca Rúnica (16×16)
    const bflyGoldCanvas = document.createElement('canvas');
    bflyGoldCanvas.width = 16;
    bflyGoldCanvas.height = 16;
    const ctxBfG = bflyGoldCanvas.getContext('2d')!;
    ctxBfG.fillStyle = '#d97706';
    ctxBfG.fillRect(2, 3, 5, 5);
    ctxBfG.fillRect(9, 3, 5, 5);
    ctxBfG.fillRect(3, 8, 4, 4);
    ctxBfG.fillRect(9, 8, 4, 4);
    ctxBfG.fillStyle = '#fde047';
    ctxBfG.fillRect(4, 4, 2, 2);
    ctxBfG.fillRect(10, 4, 2, 2);
    ctxBfG.fillStyle = '#0f172a';
    ctxBfG.fillRect(7, 3, 2, 9);
    this.textures.set('butterfly_gold', createPixelTexture(device, bflyGoldCanvas, false, 'butterfly_gold'));

    // 12. Feixe de Luz Solar / Godray Volumétrico (96×256)
    const godrayCanvas = document.createElement('canvas');
    godrayCanvas.width = 96;
    godrayCanvas.height = 256;
    const ctxGr = godrayCanvas.getContext('2d')!;
    const gradGr = ctxGr.createLinearGradient(0, 0, 48, 256);
    gradGr.addColorStop(0, 'rgba(255, 250, 220, 0.22)');
    gradGr.addColorStop(0.3, 'rgba(254, 243, 199, 0.16)');
    gradGr.addColorStop(0.7, 'rgba(253, 230, 138, 0.08)');
    gradGr.addColorStop(1, 'rgba(253, 230, 138, 0)');
    ctxGr.fillStyle = gradGr;
    ctxGr.beginPath();
    ctxGr.moveTo(20, 0);
    ctxGr.lineTo(76, 0);
    ctxGr.lineTo(96, 256);
    ctxGr.lineTo(0, 256);
    ctxGr.closePath();
    ctxGr.fill();
    this.textures.set('godray_beam', createPixelTexture(device, godrayCanvas, false, 'godray_beam'));
  }
}

