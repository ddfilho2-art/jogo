import Phaser from 'phaser';

// =============================================================================
// ELDRIM: ECOS DO PASSADO - ANIMATION MANAGER (DIRETIVA V7 DEFINITIVA)
// =============================================================================
// Registra e gerencia as animações nativas do spritesheet V7 de Ren (48x64px).
// Animações:
// - idle: 4 direções × 4 frames (frames 0..15, 3 FPS)
// - walk: 4 direções × 8 frames (frames 16..47, 11 FPS)
// - attack: 4 direções × 8 frames (frames 48..79, 16 FPS)
// - charged: 8 frames (frames 80..87, 14 FPS)
// - dodge: 4 direções × 8 frames (frames 88..119, 16 FPS)
// - hurt: 4 direções × 4 frames (frames 120..135, 10 FPS)
// - death: 6 frames (frames 136..141, 6 FPS)
// =============================================================================

export type EstadoHeroi = 'idle' | 'walk' | 'attack' | 'charged' | 'dodge' | 'hurt' | 'death';
export type DirecaoHeroi = 'down' | 'up' | 'left' | 'right';

export class AnimationManager {
  /**
   * Registra todas as animações obrigatórias no AnimationManager da cena
   */
  static registrarAnimacoes(scene: Phaser.Scene): void {
    const anims = scene.anims;
    const SHEET = scene.textures.exists('ren_spritesheet_v8')
      ? 'ren_spritesheet_v8'
      : scene.textures.exists('ren_spritesheet_v7')
      ? 'ren_spritesheet_v7'
      : scene.textures.exists('ren_spritesheet_v6')
      ? 'ren_spritesheet_v6'
      : 'ren_spritesheet_v5';

    // Se estiver usando V8 (160 frames anatômicos completos)
    if (SHEET === 'ren_spritesheet_v8') {
      // 1. Idle (4 direções × 4 frames: respiração e inércia de cabelo)
      this.recriarAnim(anims, 'ren_idle_down', SHEET, 0, 3, 3, -1);
      this.recriarAnim(anims, 'ren_idle_up', SHEET, 4, 7, 3, -1);
      this.recriarAnim(anims, 'ren_idle_left', SHEET, 8, 11, 3, -1);
      this.recriarAnim(anims, 'ren_idle_right', SHEET, 12, 15, 3, -1);

      // 2. Walk (4 direções × 8 frames com ciclo biomecânico humano)
      this.recriarAnim(anims, 'ren_walk_down', SHEET, 16, 23, 11, -1);
      this.recriarAnim(anims, 'ren_walk_up', SHEET, 24, 31, 11, -1);
      this.recriarAnim(anims, 'ren_walk_left', SHEET, 32, 39, 11, -1);
      this.recriarAnim(anims, 'ren_walk_right', SHEET, 40, 47, 11, -1);

      // 3. Attack (4 direções × 10 frames: antecipação -> torque -> golpe -> arco luminoso -> recuperação)
      this.recriarAnim(anims, 'ren_attack_down', SHEET, 48, 57, 18, 0);
      this.recriarAnim(anims, 'ren_attack_up', SHEET, 58, 67, 18, 0);
      this.recriarAnim(anims, 'ren_attack_left', SHEET, 68, 77, 18, 0);
      this.recriarAnim(anims, 'ren_attack_right', SHEET, 78, 87, 18, 0);

      // 4. Charged Attack (8 frames com giro radial 360°)
      this.recriarAnim(anims, 'ren_charged_attack', SHEET, 88, 95, 14, 0);

      // 5. Dodge / Rolamento Acrobático (4 direções × 8 frames)
      this.recriarAnim(anims, 'ren_dodge_down', SHEET, 96, 103, 16, 0);
      this.recriarAnim(anims, 'ren_dodge_up', SHEET, 104, 111, 16, 0);
      this.recriarAnim(anims, 'ren_dodge_left', SHEET, 112, 119, 16, 0);
      this.recriarAnim(anims, 'ren_dodge_right', SHEET, 120, 127, 16, 0);

      // 6. Hurt (4 direções × 6 frames)
      this.recriarAnim(anims, 'ren_hurt_down', SHEET, 128, 133, 12, 0);
      this.recriarAnim(anims, 'ren_hurt_up', SHEET, 134, 139, 12, 0);
      this.recriarAnim(anims, 'ren_hurt_left', SHEET, 140, 145, 12, 0);
      this.recriarAnim(anims, 'ren_hurt_right', SHEET, 146, 151, 12, 0);

      // 7. Death (8 frames com colapso e descanso no solo)
      this.recriarAnim(anims, 'ren_death', SHEET, 152, 159, 7, 0);
      return;
    }

    // Se estiver usando V7, registrar o conjunto de 142 frames
    if (SHEET === 'ren_spritesheet_v7') {
      // 1. Idle (4 direções × 4 frames)
      this.recriarAnim(anims, 'ren_idle_down', SHEET, 0, 3, 3, -1);
      this.recriarAnim(anims, 'ren_idle_up', SHEET, 4, 7, 3, -1);
      this.recriarAnim(anims, 'ren_idle_left', SHEET, 8, 11, 3, -1);
      this.recriarAnim(anims, 'ren_idle_right', SHEET, 12, 15, 3, -1);

      // 2. Walk (4 direções × 8 frames com ciclo completo de peso, contato e passagem)
      this.recriarAnim(anims, 'ren_walk_down', SHEET, 16, 23, 11, -1);
      this.recriarAnim(anims, 'ren_walk_up', SHEET, 24, 31, 11, -1);
      this.recriarAnim(anims, 'ren_walk_left', SHEET, 32, 39, 11, -1);
      this.recriarAnim(anims, 'ren_walk_right', SHEET, 40, 47, 11, -1);

      // 3. Attack (4 direções × 8 frames: antecipação -> torque -> golpe -> arco -> recuperação)
      this.recriarAnim(anims, 'ren_attack_down', SHEET, 48, 55, 16, 0);
      this.recriarAnim(anims, 'ren_attack_up', SHEET, 56, 63, 16, 0);
      this.recriarAnim(anims, 'ren_attack_left', SHEET, 64, 71, 16, 0);
      this.recriarAnim(anims, 'ren_attack_right', SHEET, 72, 79, 16, 0);

      // 4. Charged Attack (8 frames com giro radial)
      this.recriarAnim(anims, 'ren_charged_attack', SHEET, 80, 87, 14, 0);

      // 5. Dodge / Rolamento Acrobático (4 direções × 8 frames)
      this.recriarAnim(anims, 'ren_dodge_down', SHEET, 88, 95, 16, 0);
      this.recriarAnim(anims, 'ren_dodge_up', SHEET, 96, 103, 16, 0);
      this.recriarAnim(anims, 'ren_dodge_left', SHEET, 104, 111, 16, 0);
      this.recriarAnim(anims, 'ren_dodge_right', SHEET, 112, 119, 16, 0);

      // 6. Hurt (4 direções × 4 frames)
      this.recriarAnim(anims, 'ren_hurt_down', SHEET, 120, 123, 10, 0);
      this.recriarAnim(anims, 'ren_hurt_up', SHEET, 124, 127, 10, 0);
      this.recriarAnim(anims, 'ren_hurt_left', SHEET, 128, 131, 10, 0);
      this.recriarAnim(anims, 'ren_hurt_right', SHEET, 132, 135, 10, 0);

      // 7. Death (6 frames)
      this.recriarAnim(anims, 'ren_death', SHEET, 136, 141, 6, 0);
      return;
    }

    // Fallback legado para V6 / V5
    if (!anims.exists('ren_idle_down')) {
      anims.create({ key: 'ren_idle_down', frames: [{ key: SHEET, frame: 0 }], frameRate: 1, repeat: -1 });
    }
    if (!anims.exists('ren_idle_up')) {
      anims.create({ key: 'ren_idle_up', frames: [{ key: SHEET, frame: 1 }], frameRate: 1, repeat: -1 });
    }
    if (!anims.exists('ren_idle_left')) {
      anims.create({ key: 'ren_idle_left', frames: [{ key: SHEET, frame: 2 }], frameRate: 1, repeat: -1 });
    }
    if (!anims.exists('ren_idle_right')) {
      anims.create({ key: 'ren_idle_right', frames: [{ key: SHEET, frame: 3 }], frameRate: 1, repeat: -1 });
    }

    if (!anims.exists('ren_walk_down')) {
      anims.create({ key: 'ren_walk_down', frames: anims.generateFrameNumbers(SHEET, { start: 4, end: 7 }), frameRate: 10, repeat: -1 });
    }
    if (!anims.exists('ren_walk_up')) {
      anims.create({ key: 'ren_walk_up', frames: anims.generateFrameNumbers(SHEET, { start: 8, end: 11 }), frameRate: 10, repeat: -1 });
    }
    if (!anims.exists('ren_walk_left')) {
      anims.create({ key: 'ren_walk_left', frames: anims.generateFrameNumbers(SHEET, { start: 12, end: 15 }), frameRate: 10, repeat: -1 });
    }
    if (!anims.exists('ren_walk_right')) {
      anims.create({ key: 'ren_walk_right', frames: anims.generateFrameNumbers(SHEET, { start: 16, end: 19 }), frameRate: 10, repeat: -1 });
    }

    if (!anims.exists('ren_attack_down')) {
      anims.create({ key: 'ren_attack_down', frames: anims.generateFrameNumbers(SHEET, { start: 20, end: 23 }), frameRate: 16, repeat: 0 });
    }
    if (!anims.exists('ren_attack_up')) {
      anims.create({ key: 'ren_attack_up', frames: anims.generateFrameNumbers(SHEET, { start: 24, end: 27 }), frameRate: 16, repeat: 0 });
    }
    if (!anims.exists('ren_attack_left')) {
      anims.create({ key: 'ren_attack_left', frames: anims.generateFrameNumbers(SHEET, { start: 28, end: 31 }), frameRate: 16, repeat: 0 });
    }
    if (!anims.exists('ren_attack_right')) {
      anims.create({ key: 'ren_attack_right', frames: anims.generateFrameNumbers(SHEET, { start: 32, end: 35 }), frameRate: 16, repeat: 0 });
    }

    if (!anims.exists('ren_charged_attack')) {
      anims.create({ key: 'ren_charged_attack', frames: anims.generateFrameNumbers(SHEET, { start: 36, end: 41 }), frameRate: 14, repeat: 0 });
    }

    if (!anims.exists('ren_dodge_down')) {
      anims.create({ key: 'ren_dodge_down', frames: anims.generateFrameNumbers(SHEET, { start: 42, end: 45 }), frameRate: 14, repeat: 0 });
    }
    if (!anims.exists('ren_dodge_up')) {
      anims.create({ key: 'ren_dodge_up', frames: anims.generateFrameNumbers(SHEET, { start: 46, end: 49 }), frameRate: 14, repeat: 0 });
    }
    if (!anims.exists('ren_dodge_left')) {
      anims.create({ key: 'ren_dodge_left', frames: anims.generateFrameNumbers(SHEET, { start: 50, end: 53 }), frameRate: 14, repeat: 0 });
    }
    if (!anims.exists('ren_dodge_right')) {
      anims.create({ key: 'ren_dodge_right', frames: anims.generateFrameNumbers(SHEET, { start: 54, end: 57 }), frameRate: 14, repeat: 0 });
    }

    if (!anims.exists('ren_hurt_down')) {
      anims.create({ key: 'ren_hurt_down', frames: anims.generateFrameNumbers(SHEET, { start: 58, end: 59 }), frameRate: 8, repeat: 0 });
    }
    if (!anims.exists('ren_hurt_up')) {
      anims.create({ key: 'ren_hurt_up', frames: anims.generateFrameNumbers(SHEET, { start: 60, end: 61 }), frameRate: 8, repeat: 0 });
    }
    if (!anims.exists('ren_hurt_left')) {
      anims.create({ key: 'ren_hurt_left', frames: anims.generateFrameNumbers(SHEET, { start: 62, end: 63 }), frameRate: 8, repeat: 0 });
    }
    if (!anims.exists('ren_hurt_right')) {
      anims.create({ key: 'ren_hurt_right', frames: anims.generateFrameNumbers(SHEET, { start: 64, end: 65 }), frameRate: 8, repeat: 0 });
    }

    if (!anims.exists('ren_death')) {
      anims.create({ key: 'ren_death', frames: anims.generateFrameNumbers(SHEET, { start: 66, end: 71 }), frameRate: 6, repeat: 0 });
    }
  }

  private static recriarAnim(
    anims: Phaser.Animations.AnimationManager,
    key: string,
    sheet: string,
    start: number,
    end: number,
    frameRate: number,
    repeat: number
  ): void {
    if (anims.exists(key)) {
      anims.remove(key);
    }
    anims.create({
      key,
      frames: anims.generateFrameNumbers(sheet, { start, end }),
      frameRate,
      repeat,
    });
  }

  /**
   * Alterna automaticamente a animação ativa de acordo com o estado e direção do herói
   */
  static atualizarAnimacao(
    sprite: Phaser.GameObjects.Sprite,
    estado: EstadoHeroi,
    direcao: DirecaoHeroi
  ): void {
    if (!sprite || !sprite.anims) return;

    let chaveAnim = `ren_${estado}_${direcao}`;
    if (estado === 'death') {
      chaveAnim = 'ren_death';
    } else if (estado === 'charged') {
      chaveAnim = 'ren_charged_attack';
    }

    if (sprite.anims.currentAnim?.key !== chaveAnim) {
      sprite.anims.play(chaveAnim, true);
    }
  }
}
