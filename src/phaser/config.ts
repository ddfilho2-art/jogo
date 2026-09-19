import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { SplashScene } from './scenes/SplashScene';
import { TituloScene } from './scenes/TituloScene';
import { CinematicaScene } from './scenes/CinematicaScene';
import { OverworldScene } from './scenes/OverworldScene';
import { DungeonScene } from './scenes/DungeonScene';
import { PauseScene } from './scenes/PauseScene';

// =============================================================================
// ELDRIM: ECOS DO PASSADO - CONFIGURAÇÃO DO MOTOR PHASER 3 (DIRETIVA V5)
// =============================================================================
// Resolução lógica: 640×360 (16:9 widescreen nativo, 32x32 tiles principais).
// Personagem principal: ~34-36px largura x ~50-54px altura (frame 48x64).
// Renderer: WebGL com fallback automático; pixelArt e roundPixels ativos.
// Física Arcade com gravidade zero para jogabilidade top-down fluida.
// =============================================================================

export const GAME_WIDTH = 640;
export const GAME_HEIGHT = 360;
export const TILE_SIZE = 32;

export function criarConfiguracaoPhaser(parent: HTMLElement): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.WEBGL,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    parent,
    pixelArt: true, // Mantém renderização nítida sem borramento de pixel art
    roundPixels: true,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
    },
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: false,
      },
    },
    audio: {
      noAudio: true, // Áudio orquestrado via soundEffects.ts / soundManager independente
    },
    backgroundColor: '#07090e',
    scene: [
      BootScene,
      SplashScene,
      TituloScene,
      CinematicaScene,
      OverworldScene,
      DungeonScene,
      PauseScene,
    ],
  };
}

