import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';

// =============================================================================
// SCENE: SplashScene (DIRETIVA V3)
// =============================================================================
// Exibe o logo/abertura e transiciona para TituloScene ao pressionar tecla ou timeout.
// =============================================================================

export class SplashScene extends Phaser.Scene {
  constructor() {
    super({ key: 'SplashScene' });
  }

  create(): void {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    this.cameras.main.setBackgroundColor('#0a0e17');

    const texto = this.add.text(cx, cy - 20, 'ELDRIM\nECOS DO PASSADO', {
      fontFamily: 'monospace',
      fontSize: '15px',
      color: '#fbbf24',
      align: 'center',
    }).setOrigin(0.5);

    const sub = this.add.text(cx, cy + 32, 'Pressione Z para continuar', {
      fontFamily: 'monospace',
      fontSize: '9px',
      color: '#94a3b8',
    }).setOrigin(0.5);


    this.tweens.add({
      targets: sub,
      alpha: 0.3,
      duration: 600,
      yoyo: true,
      repeat: -1,
    });

    const keyZ = this.input.keyboard?.addKey('Z');
    const keyEnter = this.input.keyboard?.addKey('ENTER');

    const avancar = () => {
      this.scene.start('TituloScene');
    };

    keyZ?.on('down', avancar);
    keyEnter?.on('down', avancar);

    // Timeout automático após 3 segundos
    this.time.delayedCall(3000, () => {
      if (this.scene.isActive('SplashScene')) {
        avancar();
      }
    });
  }
}
