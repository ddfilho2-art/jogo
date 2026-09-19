// =============================================================================
// ELDRIM: ECOS DO PASSADO - INPUT SYSTEM (PLAYCANVAS ENGINE V2)
// =============================================================================
// Captura de entrada fluida de teclado:
// - WASD e Teclas de Seta para locomoção com normalização diagonal (1 / √2)
// - Tecla Z: Ataque básico (toque rápido) e Carregado (segurar >= 550ms)
// - Tecla C / Espaço: Esquiva / Rolamento
// =============================================================================

export type Direction = 'down' | 'up' | 'left' | 'right';

export interface InputState {
  dx: number;
  dy: number;
  facing: Direction;
  isMoving: boolean;
  isRunning: boolean;
  jumpPressed: boolean;
  attackPressed: boolean;
  attackHeld: boolean;
  attackReleased: boolean;
  holdDuration: number;
  heavyAttackPressed: boolean;
  dodgePressed: boolean;
  arcaneFlowPressed: boolean;
  skillPressed: boolean;
  interactPressed: boolean;
  specialPressed: boolean;
  pausePressed: boolean;
  switchPrototype: 'A' | 'B' | 'C' | null;
}

export class InputSystem {
  private keys = new Set<string>();
  private facing: Direction = 'down';

  private attackHeld = false;
  private attackStartTime = 0;
  private attackJustPressed = false;
  private attackJustReleased = false;
  private heavyAttackJustPressed = false;
  private dodgeJustPressed = false;
  private jumpJustPressed = false;
  private arcaneFlowJustPressed = false;
  private skillJustPressed = false;
  private interactJustPressed = false;
  private specialJustPressed = false;
  private pauseJustPressed = false;
  private pendingPrototypeSwitch: 'A' | 'B' | 'C' | null = null;

  private onKeyDownBound: (e: KeyboardEvent) => void;
  private onKeyUpBound: (e: KeyboardEvent) => void;

  constructor() {
    this.onKeyDownBound = this.handleKeyDown.bind(this);
    this.onKeyUpBound = this.handleKeyUp.bind(this);
    window.addEventListener('keydown', this.onKeyDownBound);
    window.addEventListener('keyup', this.onKeyUpBound);
  }

  destroy(): void {
    window.removeEventListener('keydown', this.onKeyDownBound);
    window.removeEventListener('keyup', this.onKeyUpBound);
    this.keys.clear();
  }

  private handleKeyDown(e: KeyboardEvent): void {
    const code = e.code;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(code)) {
      e.preventDefault();
    }

    if (!this.keys.has(code)) {
      // 1. Ataque Básico: J ou Z
      if (code === 'KeyJ' || code === 'KeyZ') {
        this.attackJustPressed = true;
        this.attackHeld = true;
        this.attackStartTime = performance.now();
      }

      // 2. Ataque Forte / Carregado: K
      if (code === 'KeyK') {
        this.heavyAttackJustPressed = true;
      }

      // 3. Esquiva / Rolamento: R, C ou Alt
      if (code === 'KeyR' || code === 'KeyC') {
        this.dodgeJustPressed = true;
      }

      // 4. Pulo: Espaço
      if (code === 'Space') {
        this.jumpJustPressed = true;
      }

      // 5. Arcane Flow: L
      if (code === 'KeyL') {
        this.arcaneFlowJustPressed = true;
      }

      // 6. Habilidade: Q
      if (code === 'KeyQ') {
        this.skillJustPressed = true;
      }

      // 7. Interação: E
      if (code === 'KeyE') {
        this.interactJustPressed = true;
      }

      // 8. Especial: F
      if (code === 'KeyF') {
        this.specialJustPressed = true;
      }

      // 9. Pausa: Escape
      if (code === 'Escape') {
        this.pauseJustPressed = true;
      }

      // 10. Seletor de Tecnologia / Protótipos: 1, 2, 3
      if (code === 'Digit1' || code === 'Numpad1') {
        this.pendingPrototypeSwitch = 'A';
      } else if (code === 'Digit2' || code === 'Numpad2') {
        this.pendingPrototypeSwitch = 'B';
      } else if (code === 'Digit3' || code === 'Numpad3') {
        this.pendingPrototypeSwitch = 'C';
      }
    }

    this.keys.add(code);
  }

  private handleKeyUp(e: KeyboardEvent): void {
    const code = e.code;
    this.keys.delete(code);

    if (code === 'KeyJ' || code === 'KeyZ') {
      this.attackHeld = false;
      this.attackJustReleased = true;
    }
  }

  update(): InputState {
    let rawX = 0;
    let rawY = 0;

    // Movimentação horizontal: A / D ou Setas
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) rawX -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) rawX += 1;

    // Movimentação vertical: W / S ou Setas (+Y é norte, -Y é sul)
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) rawY += 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) rawY -= 1;

    // Corrida com SHIFT
    const isRunning = this.keys.has('ShiftLeft') || this.keys.has('ShiftRight');

    // Normalização para evitar velocidade excessiva em diagonais
    let dx = rawX;
    let dy = rawY;
    if (dx !== 0 && dy !== 0) {
      const invLen = 1 / Math.SQRT2;
      dx *= invLen;
      dy *= invLen;
    }

    // Atualiza direção para qual o herói está olhando
    if (rawY < 0) this.facing = 'down';
    else if (rawY > 0) this.facing = 'up';
    else if (rawX < 0) this.facing = 'left';
    else if (rawX > 0) this.facing = 'right';

    const holdDuration = this.attackHeld ? performance.now() - this.attackStartTime : 0;

    const state: InputState = {
      dx,
      dy,
      facing: this.facing,
      isMoving: rawX !== 0 || rawY !== 0,
      isRunning,
      jumpPressed: this.jumpJustPressed,
      attackPressed: this.attackJustPressed,
      attackHeld: this.attackHeld,
      attackReleased: this.attackJustReleased,
      holdDuration,
      heavyAttackPressed: this.heavyAttackJustPressed,
      dodgePressed: this.dodgeJustPressed,
      arcaneFlowPressed: this.arcaneFlowJustPressed,
      skillPressed: this.skillJustPressed,
      interactPressed: this.interactJustPressed,
      specialPressed: this.specialJustPressed,
      pausePressed: this.pauseJustPressed,
      switchPrototype: this.pendingPrototypeSwitch,
    };

    // Reseta flags de frame único
    this.attackJustPressed = false;
    this.attackJustReleased = false;
    this.heavyAttackJustPressed = false;
    this.dodgeJustPressed = false;
    this.jumpJustPressed = false;
    this.arcaneFlowJustPressed = false;
    this.skillJustPressed = false;
    this.interactJustPressed = false;
    this.specialJustPressed = false;
    this.pauseJustPressed = false;
    this.pendingPrototypeSwitch = null;

    return state;
  }
}
