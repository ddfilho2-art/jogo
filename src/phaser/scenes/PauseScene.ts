import Phaser from 'phaser';
import { eventBus } from '../eventBus';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';

// =============================================================================
// SCENE: PauseScene (DIRETIVA V3)
// =============================================================================
// Executada em overlay por cima da scene ativa (OverworldScene / DungeonScene).
// Permite despausar retomando a cena sem recarregar o estado do mundo.
// =============================================================================

export class PauseScene extends Phaser.Scene {
  private parentSceneKey: string = 'OverworldScene';
  private opcaoIndex: number = 0;
  private textos: Phaser.GameObjects.Text[] = [];

  constructor() {
    super({ key: 'PauseScene' });
  }

  init(data: { parentSceneKey?: string }): void {
    if (data?.parentSceneKey) {
      this.parentSceneKey = data.parentSceneKey;
    }
  }

  create(): void {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    // 1. Fundo escurecido semitransparente em tela cheia (384x216)
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.7);
    overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // 2. Caixa de Diálogo / Menu de Pausa
    const boxW = 180;
    const boxH = 140;
    const box = this.add.graphics();
    box.fillStyle(0x0f172a, 0.95);
    box.fillRoundedRect(cx - boxW / 2, cy - boxH / 2, boxW, boxH, 4);
    box.lineStyle(1.5, 0x38bdf8, 0.8);
    box.strokeRoundedRect(cx - boxW / 2, cy - boxH / 2, boxW, boxH, 4);

    // Título
    this.add.text(cx, cy - 48, '— PAUSA —', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#fbbf24',
      align: 'center',
    }).setOrigin(0.5);

    // Opções
    const opcoes = ['CONTINUAR', 'MAPA', 'INVENTÁRIO', 'TELA DE TÍTULO'];
    this.textos = opcoes.map((op, i) => {
      return this.add.text(cx, cy - 18 + i * 20, op, {
        fontFamily: 'monospace',
        fontSize: '9px',
        color: i === 0 ? '#38bdf8' : '#64748b',
        align: 'center',
      }).setOrigin(0.5);
    });

    this.add.text(cx, cy + 54, '[ Z / ENTER: Confirmar ]', {
      fontFamily: 'monospace',
      fontSize: '7px',
      color: '#94a3b8',
    }).setOrigin(0.5);

    const atualizarVisual = () => {
      this.textos.forEach((t, i) => {
        if (i === this.opcaoIndex) {
          t.setColor('#38bdf8');
          t.setText(`> ${opcoes[i]} <`);
        } else {
          t.setColor('#64748b');
          t.setText(opcoes[i]);
        }
      });
    };

    const keyUp = this.input.keyboard?.addKey('UP');
    const keyDown = this.input.keyboard?.addKey('DOWN');
    const keyW = this.input.keyboard?.addKey('W');
    const keyS = this.input.keyboard?.addKey('S');
    const keyZ = this.input.keyboard?.addKey('Z');
    const keyEnter = this.input.keyboard?.addKey('ENTER');

    keyUp?.on('down', () => {
      this.opcaoIndex = (this.opcaoIndex - 1 + opcoes.length) % opcoes.length;
      atualizarVisual();
    });
    keyW?.on('down', () => {
      this.opcaoIndex = (this.opcaoIndex - 1 + opcoes.length) % opcoes.length;
      atualizarVisual();
    });
    keyDown?.on('down', () => {
      this.opcaoIndex = (this.opcaoIndex + 1) % opcoes.length;
      atualizarVisual();
    });
    keyS?.on('down', () => {
      this.opcaoIndex = (this.opcaoIndex + 1) % opcoes.length;
      atualizarVisual();
    });

    const despausar = () => {
      eventBus.emit('pausaAlterada', false);
      this.scene.stop('PauseScene');
      this.scene.resume(this.parentSceneKey);
    };

    const confirmar = () => {
      if (this.opcaoIndex === 0) {
        despausar();
      } else if (this.opcaoIndex === 1) {
        eventBus.emit('notificacao', 'Cartografia em desenvolvimento');
        despausar();
      } else if (this.opcaoIndex === 2) {
        eventBus.emit('notificacao', 'Inventário em desenvolvimento');
        despausar();
      } else if (this.opcaoIndex === 3) {
        this.scene.stop('PauseScene');
        this.scene.stop(this.parentSceneKey);
        this.scene.start('TituloScene');
      }
    };

    keyZ?.on('down', confirmar);
    keyEnter?.on('down', confirmar);

    atualizarVisual();
    eventBus.emit('pausaAlterada', true);
  }
}
