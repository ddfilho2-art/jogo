// =============================================================================
// ELDRIM: ECOS DO PASSADO - HERO VISUAL PROTOTYPES ARCHITECTURE
// =============================================================================
// Interface unificada para teste comparativo de tecnologias:
// - Protótipo A: 3D Procedural Articulado (HeroWarrior3D)
// - Protótipo B: 2D Sprite Tradicional com Frame Animation (HeroSprite2D)
// - Protótipo C: 2D Skeletal Hierárquico Articulado (HeroSkeletal2D)
//
// Todas as 3 tecnologias compartilham exatamente:
// - Mesma posição (X, Y)
// - Mesmo collider nos pés (16×12 px)
// - Mesmo HeroController e física
// - Mesmo sistema de combate, dano, knockback, esquiva e Arcane Flow
// =============================================================================

import { Entity } from 'playcanvas';
import { Direction } from '../systems/InputSystem';

export type HeroPrototypeId = 'A' | 'B' | 'C';

export type HeroState =
  | 'idle'
  | 'walk'
  | 'run'
  | 'attack'
  | 'heavy_attack'
  | 'dodge'
  | 'jump'
  | 'fall'
  | 'hurt'
  | 'death'
  | 'arcane_flow';

export interface IHeroVisual {
  readonly rootEntity: Entity;
  setVisible(visible: boolean): void;
  update(
    dt: number,
    state: HeroState,
    facing: Direction,
    stateTimer: number,
    isMoving: boolean,
    jumpHeight: number,
    isGrounded: boolean
  ): void;
  destroy(): void;
}
