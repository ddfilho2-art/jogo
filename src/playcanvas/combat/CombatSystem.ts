import { eventBus } from '../../phaser/eventBus';

// =============================================================================
// ELDRIM: ECOS DO PASSADO - COMBAT SYSTEM (PLAYCANVAS ENGINE V2)
// =============================================================================
// Mecânica de combate:
// 1. Ataque Normal (Z): golpe frontal direcionado com arco rúnico
// 2. Ataque Carregado (Segurar Z): liberação de corte giratório 360°
// 3. Fluxo Arcano: barra de recurso real (progressão oficial: 20 max inicial)
// 4. Hitboxes físicas separadas dos efeitos visuais (Regra 12)
// =============================================================================

export interface Hitbox2D {
  x: number;
  y: number;
  width: number;
  height: number;
  damage: number;
  knockbackX: number;
  knockbackY: number;
  isCharged: boolean;
}

export class CombatSystem {
  // Fluxo Arcano (Regra 13: 20 inicial)
  private arcanoAtual = 20;
  private readonly arcanoMax = 20;
  private readonly taxaRegeneracao = 3.5; // pontos por segundo

  // Custos de habilidade
  private readonly CUSTO_CARREGADO = 7;

  constructor() {
    this.notificarFluxoArcano();
  }

  update(dt: number, isAttacking: boolean): void {
    // Regeneração gradual do Fluxo Arcano quando não estiver descarregando
    if (!isAttacking && this.arcanoAtual < this.arcanoMax) {
      this.arcanoAtual = Math.min(this.arcanoMax, this.arcanoAtual + this.taxaRegeneracao * dt);
      this.notificarFluxoArcano();
    }
  }

  canPerformChargedAttack(): boolean {
    return this.arcanoAtual >= this.CUSTO_CARREGADO;
  }

  consumeArcanoForCharged(): boolean {
    if (this.arcanoAtual >= this.CUSTO_CARREGADO) {
      this.arcanoAtual -= this.CUSTO_CARREGADO;
      this.notificarFluxoArcano();
      return true;
    }
    return false;
  }

  /**
   * Calcula a hitbox do ataque normal à frente de Ren
   */
  createNormalAttackHitbox(
    x: number,
    y: number,
    facing: 'down' | 'up' | 'left' | 'right'
  ): Hitbox2D {
    const alcance = 28;
    const largura = 36;
    let hitX = x;
    let hitY = y;
    let kbX = 0;
    let kbY = 0;

    if (facing === 'down') {
      hitY = y - alcance * 0.7;
      kbY = -120;
    } else if (facing === 'up') {
      hitY = y + alcance * 0.7;
      kbY = 120;
    } else if (facing === 'left') {
      hitX = x - alcance * 0.7;
      kbX = -120;
    } else if (facing === 'right') {
      hitX = x + alcance * 0.7;
      kbX = 120;
    }

    return {
      x: hitX,
      y: hitY,
      width: largura,
      height: largura,
      damage: 1,
      knockbackX: kbX,
      knockbackY: kbY,
      isCharged: false,
    };
  }

  /**
   * Hitbox radial 360° do ataque carregado
   */
  createChargedAttackHitbox(x: number, y: number): Hitbox2D {
    return {
      x,
      y,
      width: 64,
      height: 64,
      damage: 3,
      knockbackX: 0, // Será calculado em relação ao alvo
      knockbackY: 0,
      isCharged: true,
    };
  }

  private notificarFluxoArcano(): void {
    const porcentagem = Math.round((this.arcanoAtual / this.arcanoMax) * 100);
    eventBus.emit('fluxoArcano', {
      atual: Math.round(this.arcanoAtual),
      max: this.arcanoMax,
      porcentagem,
    });
    eventBus.emit('energiaMudou', porcentagem);
  }
}
