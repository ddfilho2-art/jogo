import Phaser from 'phaser';
import { criarSalaTilemap } from '../tilemapHelper';
import { eventBus } from '../eventBus';
import { AnimationManager, DirecaoHeroi, EstadoHeroi } from '../systems/AnimationManager';
import { ParticleSystem } from '../systems/ParticleSystem';
import { LightingSystem } from '../systems/LightingSystem';
import { HeroController } from '../systems/HeroController';
import { TILE_SIZE, GAME_WIDTH, GAME_HEIGHT } from '../config';

// =============================================================================
// SCENE: DungeonScene (DIRETIVA V10: COMBATE DO REN 2.0)
// =============================================================================
// Santuários e Catacumbas integrados com HeroController compartilhado:
// - Movimento 2D suave, sombra elíptica e Y-sorting
// - Arcane Flow sincronizado com HUD
// - Ataque normal físico e ataque carregado em 4 fases com ondas de choque
// =============================================================================

export interface DungeonData {
  dungeon?: string;
  salaId?: string;
}

export class DungeonScene extends Phaser.Scene {
  private dungeon: string = 'santuarioRaizAntiga';
  public heroController!: HeroController;
  public heroi!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private sombraHeroi!: Phaser.GameObjects.Image;
  private layerParedes!: Phaser.Tilemaps.TilemapLayer;

  // Sistemas visuais
  private particleSystem!: ParticleSystem;
  private lightingSystem!: LightingSystem;

  constructor() {
    super({ key: 'DungeonScene' });
  }

  init(data: DungeonData): void {
    if (data?.dungeon) {
      this.dungeon = data.dungeon;
    }
  }

  create(): void {
    this.particleSystem = new ParticleSystem(this);
    this.lightingSystem = new LightingSystem(this);
    this.lightingSystem.configurarRegiao('charcoSombrio'); // Iluminação atmosférica cavernosa

    eventBus.emit('dungeonCarregada', {
      dungeon: this.dungeon,
      nomeFormatado: this.formatarNomeDungeon(this.dungeon),
    });

    // 20x14 tiles em 24x24 = 480x336 px
    const cols = 20;
    const rows = 14;
    const dadosGrid = this.gerarGridDungeon(cols, rows);
    this.layerParedes = criarSalaTilemap(this, dadosGrid);

    const mapWidthPx = cols * TILE_SIZE;
    const mapHeightPx = rows * TILE_SIZE;
    this.physics.world.setBounds(0, 0, mapWidthPx, mapHeightPx);
    this.cameras.main.setBounds(0, 0, mapWidthPx, mapHeightPx);

    const spawnX = mapWidthPx / 2;
    const spawnY = mapHeightPx - 3 * TILE_SIZE;

    // Instanciação de HeroController (mesmo sistema e sensação de combate do Overworld)
    this.heroController = new HeroController(this, {
      spawnX,
      spawnY,
      particleSystem: this.particleSystem,
      lightingSystem: this.lightingSystem,
      layerParedes: this.layerParedes,
      vidaInicial: 4,
      vidaMax: 4,
      arcanoInicial: 20,
      arcanoMax: 20,
    });

    this.heroi = this.heroController.heroi;
    this.sombraHeroi = this.heroController.sombraHeroi;

    this.cameras.main.startFollow(this.heroi, true, 0.08, 0.08);

    const handleSimularDano = () => {
      this.heroController.aplicarDano(1);
    };
    eventBus.on('simularDano', handleSimularDano);
    this.events.on('shutdown', () => {
      eventBus.off('simularDano', handleSimularDano);
      this.heroController.destroy();
      this.lightingSystem.destruir();
    });
  }

  update(time: number, delta: number): void {
    if (!this.heroController || !this.heroi || !this.heroi.body) return;

    this.heroController.update(time, delta);
  }

  private formatarNomeDungeon(dungeon: string): string {
    const mapa: Record<string, string> = {
      santuarioRaizAntiga: 'Santuário da Raiz Antiga',
      criptaGuardião: 'Cripta do Guardião Adormecido',
      santuarioAguasTurvas: 'Santuário das Águas Turvas',
      santuarioGeloEterno: 'Santuário do Gelo Eterno',
      santuarioChamas: 'Santuário das Chamas',
      tumbaEnterrada: 'Tumba Enterrada',
      santuarioPedraViva: 'Santuário da Pedra Viva',
      santuarioSombras: 'Santuário das Sombras',
    };
    return mapa[dungeon] || dungeon;
  }

  private gerarGridDungeon(cols: number, rows: number): number[][] {
    const grid: number[][] = [];

    for (let y = 0; y < rows; y++) {
      const linha: number[] = [];
      for (let x = 0; x < cols; x++) {
        // Paredes externas (índice 4: muralha sólida) com portas norte e sul
        if ((y === 0 && (x < 9 || x > 10)) || (y === rows - 1 && (x < 9 || x > 10))) {
          linha.push(4);
        } else if (x === 0 || x === cols - 1) {
          linha.push(4);
        } else if (
          (x === 6 && y === 4) || (x === 13 && y === 4) ||
          (x === 6 && y === 9) || (x === 13 && y === 9)
        ) {
          linha.push(4); // 4 Pilares da masmorra
        } else {
          linha.push(3); // Piso de pedra rústica
        }
      }
      grid.push(linha);
    }

    return grid;
  }
}
