import Phaser from 'phaser';
import { gerarTexturasBasicas } from '../texturas';
import { EnvironmentAtlas } from '../assets/EnvironmentAtlas';
import { RenAtlas } from '../assets/RenAtlas';
import { BenchmarkV6Atlas } from '../assets/BenchmarkV6Atlas';
import { RenV7Atlas } from '../assets/RenV7Atlas';
import { RenV8Atlas } from '../assets/RenV8Atlas';
import { AnimationManager } from '../systems/AnimationManager';
import renImgUrl from '../../assets/images/ren_pixel_art_1788915175087.jpg';
import renV6SheetUrl from '../../assets/images/ren_v6_spritesheet_1788973209179.jpg';
import treesRocksUrl from '../../assets/images/trees_rocks_v6_1788973221539.jpg';
import terrainBenchmarkUrl from '../../assets/images/terrain_benchmark_v6_1788973236244.jpg';

// =============================================================================
// SCENE: BootScene (DIRETIVA V7: REN 2.0 & VIDA AMBIENTAL)
// =============================================================================
// Inicializa o pipeline visual de alta fidelidade:
// - Carrega assets e imagens geradas de referência
// - Gera catálogo V6 (cenário, rochas 3D, vegetação)
// - Gera Ren 2.0 V7 (anatomia humana, 8 frames por direção de caminhada/ataque)
// - Registra animações no AnimationManager
// - Transiciona para a OverworldScene no Vale Verdejante
// =============================================================================

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    // Carrega arte do herói para o HUD e assets reais de benchmark
    this.load.image('heroi_hud', renImgUrl);
    this.load.image('terrain_benchmark_v6_raw', terrainBenchmarkUrl);
    this.load.image('trees_rocks_v6_raw', treesRocksUrl);
    this.load.image('ren_v6_sheet_raw', renV6SheetUrl);
  }

  create(): void {
    // 1. Gerar catálogo de texturas ambientais V5 (compatibilidade)
    EnvironmentAtlas.gerarTexturasAmbiente(this);

    // 2. Gerar texturas legadas para compatibilidade
    gerarTexturasBasicas(this);

    // 3. Gerar spritesheet de Ren legado
    RenAtlas.gerarSpritesheetRen(this);

    // 4. Gerar assets do Benchmark V6 (HD Pixel Art, rochas 3D, vegetação)
    BenchmarkV6Atlas.gerarAssetsBenchmark(this);

    // 5. Gerar Ren 2.0 V8 definitivo (Anatomia humana completa, ciclo biomecânico de 8 frames, poses corporais)
    RenV8Atlas.gerarSpritesheetRenV8(this);
    RenV7Atlas.gerarSpritesheetRenV7(this);

    // 6. Registrar todas as animações nativas no AnimationManager do Phaser
    AnimationManager.registrarAnimacoes(this);

    // 7. Inicia OverworldScene no Vale Verdejante
    this.scene.start('OverworldScene', { regiao: 'valeVerdejante' });
  }
}


