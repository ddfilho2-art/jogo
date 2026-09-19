import Phaser from 'phaser';

// =============================================================================
// ELDRIM: ECOS DO PASSADO - EVENT BUS PHASER <-> REACT
// =============================================================================
// Ponte de eventos para desacoplar a simulação do mundo (Phaser 3)
// e a casca de UI / HUD reativo em React.
// =============================================================================

export interface EventoHUD {
  vida?: number;
  vidaMax?: number;
  energia?: number;
  energiaMax?: number;
  selos?: number;
  regiao?: string;
  subtitulo?: string;
  teclaTeste?: string;
  mensagem?: string;
}

export const eventBus = new Phaser.Events.EventEmitter();
