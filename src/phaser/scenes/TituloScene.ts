import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';

// =============================================================================
// SCENE: TituloScene (DIRETIVA V3)
// =============================================================================
// Menu principal de título com seleção de opções (Novo Jogo, etc.).
// =============================================================================

export class TituloScene extends Phaser.Scene {
  private opcaoSelecionada: number = 0;
  private textosOpcoes: Phaser.GameObjects.Text[] = [];

  constructor() {
    super({ key: 'TituloScene' });
  }

  create(): void {
    const cx = GAME_WIDTH / 2;
    this.cameras.main.setBackgroundColor('#07090e');

    // Título Principal
    this.add.text(cx, 54, 'ELDRIM', {
      fontFamily: 'monospace',
      fontSize: '24px',
      color: '#f59e0b',
      align: 'center',
    }).setOrigin(0.5);

    this.add.text(cx, 78, 'Ecos do Passado', {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#cbd5e1',
      align: 'center',
    }).setOrigin(0.5);

    // Opções
    const opcoes = ['NOVO JOGO', 'CINEMÁTICA', 'SOBRE'];
    this.textosOpcoes = opcoes.map((op, idx) => {
      return this.add.text(cx, 126 + idx * 22, op, {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: idx === 0 ? '#fbbf24' : '#64748b',
      }).setOrigin(0.5);
    });


    const keyUp = this.input.keyboard?.addKey('UP');
    const keyDown = this.input.keyboard?.addKey('DOWN');
    const keyW = this.input.keyboard?.addKey('W');
    const keyS = this.input.keyboard?.addKey('S');
    const keyZ = this.input.keyboard?.addKey('Z');
    const keyEnter = this.input.keyboard?.addKey('ENTER');

    const atualizarMenu = () => {
      this.textosOpcoes.forEach((txt, idx) => {
        if (idx === this.opcaoSelecionada) {
          txt.setColor('#fbbf24');
          txt.setText(`> ${opcoes[idx]} <`);
        } else {
          txt.setColor('#64748b');
          txt.setText(opcoes[idx]);
        }
      });
    };

    const moverCima = () => {
      this.opcaoSelecionada = (this.opcaoSelecionada - 1 + opcoes.length) % opcoes.length;
      atualizarMenu();
    };

    const moverBaixo = () => {
      this.opcaoSelecionada = (this.opcaoSelecionada + 1) % opcoes.length;
      atualizarMenu();
    };

    keyUp?.on('down', moverCima);
    keyW?.on('down', moverCima);
    keyDown?.on('down', moverBaixo);
    keyS?.on('down', moverBaixo);

    const confirmar = () => {
      if (this.opcaoSelecionada === 0) {
        this.scene.start('OverworldScene', { regiao: 'valeVerdejante' });
      } else if (this.opcaoSelecionada === 1) {
        this.scene.start('CinematicaScene');
      }
    };

    keyZ?.on('down', confirmar);
    keyEnter?.on('down', confirmar);

    atualizarMenu();
  }
}
