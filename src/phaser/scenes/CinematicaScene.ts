import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';

// =============================================================================
// SCENE: CinematicaScene (DIRETIVA V3)
// =============================================================================
// Exibe cutscene/introdução narrativa do universo de Eldrim em 384x216.
// =============================================================================

export class CinematicaScene extends Phaser.Scene {
  constructor() {
    super({ key: 'CinematicaScene' });
  }

  create(): void {
    const cx = GAME_WIDTH / 2;
    this.cameras.main.setBackgroundColor('#05070a');

    this.add.text(cx, 36, 'PRÓLOGO DE ELDRIM', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#fbbf24',
      align: 'center',
    }).setOrigin(0.5);

    const historia = [
      'Antes da Queda, a Lâmina de Eldrim mantinha',
      'o equilíbrio das seis regiões do reino.',
      '',
      'Thorne, o Arauto Cinzento, corrompeu os Santuários',
      'e fragmentou o mundo em caos e névoa.',
      '',
      'Ren desperta no Vale Verdejante...',
      'com os ecos do passado a ecoar em sua lâmina.',
    ].join('\n');

    this.add.text(cx, 110, historia, {
      fontFamily: 'monospace',
      fontSize: '9px',
      color: '#94a3b8',
      align: 'center',
      lineSpacing: 5,
    }).setOrigin(0.5);

    const voltarTxt = this.add.text(cx, 190, '[ Z / ENTER: Começar Jornada ]', {
      fontFamily: 'monospace',
      fontSize: '8px',
      color: '#38bdf8',
    }).setOrigin(0.5);


    this.tweens.add({
      targets: voltarTxt,
      alpha: 0.4,
      duration: 500,
      yoyo: true,
      repeat: -1,
    });

    const avancar = () => {
      this.scene.start('OverworldScene', { regiao: 'valeVerdejante' });
    };

    const keyZ = this.input.keyboard?.addKey('Z');
    const keyEnter = this.input.keyboard?.addKey('ENTER');
    keyZ?.on('down', avancar);
    keyEnter?.on('down', avancar);
  }
}
