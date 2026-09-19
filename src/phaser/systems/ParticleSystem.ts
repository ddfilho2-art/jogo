import Phaser from 'phaser';

// =============================================================================
// ELDRIM: ECOS DO PASSADO - SISTEMA DE PARTÍCULAS DEFINITIVO (DIRETIVA V5)
// =============================================================================
// Emissores e partículas estilizadas em pixel art autêntico:
// - dust: baforadas terrosas ovais com desaceleração suave
// - leaf: folhas verdes e douradas com rotação e ondulação natural
// - spark: centelhas estelares de corte da Lâmina de Eldrim
// - hit: estilhaços angulares de impacto
// - magic: orbes radiantes de energia de Eldrim
// - water: respingos translúcidos com gota elíptica
// - snow: flocos hexagonais/cruzados de nevasca
// - sand: grãos dourados de areia arrastados pelo vento
// =============================================================================

export class ParticleSystem {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.garantirTexturasParticulas();
  }

  private garantirTexturasParticulas(): void {
    // 1. Partícula de Poeira (Dust): baforada suave 4x4
    if (!this.scene.textures.exists('part_dust')) {
      const g = this.scene.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0xd6c7b2, 0.85);
      g.fillCircle(2, 2, 2);
      g.fillStyle(0xf5ebe0, 0.5);
      g.fillCircle(2, 2, 1);
      g.generateTexture('part_dust', 4, 4);
      g.destroy();
    }

    // 2. Partícula de Folha (Leaf): folha recortada com nervura 6x6
    if (!this.scene.textures.exists('part_leaf')) {
      const g = this.scene.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0x15803d, 0.95);
      g.fillEllipse(3, 3, 3, 1.8);
      g.fillStyle(0x4ade80, 1);
      g.fillRect(2, 2, 2, 2);
      g.generateTexture('part_leaf', 6, 6);
      g.destroy();
    }

    // 3. Faísca Estelar (Spark): centelha em cruz brilhante
    if (!this.scene.textures.exists('part_spark')) {
      const g = this.scene.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0xfde047, 1);
      g.fillRect(2, 0, 1, 5);
      g.fillRect(0, 2, 5, 1);
      g.fillStyle(0xffffff, 1);
      g.fillRect(1, 1, 3, 3);
      g.generateTexture('part_spark', 5, 5);
      g.destroy();
    }

    // 4. Impacto / Hit: estilhaço pontiagudo
    if (!this.scene.textures.exists('part_hit')) {
      const g = this.scene.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0xef4444, 1);
      g.fillCircle(3, 3, 2.5);
      g.fillStyle(0xfef08a, 1);
      g.fillCircle(2, 2, 1.5);
      g.generateTexture('part_hit', 6, 6);
      g.destroy();
    }

    // 5. Magia de Eldrim: orbe ciano cintilante com núcleo de luz
    if (!this.scene.textures.exists('part_magic')) {
      const g = this.scene.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0x0284c7, 0.85);
      g.fillCircle(3, 3, 3);
      g.fillStyle(0x38bdf8, 1);
      g.fillCircle(3, 3, 2);
      g.fillStyle(0xffffff, 1);
      g.fillRect(2, 2, 2, 2);
      g.generateTexture('part_magic', 6, 6);
      g.destroy();
    }

    // 6. Respingos de Água: gotícula azul céu
    if (!this.scene.textures.exists('part_water')) {
      const g = this.scene.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0x38bdf8, 0.9);
      g.fillEllipse(2, 3, 2, 2.5);
      g.fillStyle(0xffffff, 0.7);
      g.fillRect(2, 2, 1, 1);
      g.generateTexture('part_water', 5, 5);
      g.destroy();
    }

    // 7. Neve: floco cristalino para Terras Geladas
    if (!this.scene.textures.exists('part_snow')) {
      const g = this.scene.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0xffffff, 0.95);
      g.fillRect(1, 0, 1, 3);
      g.fillRect(0, 1, 3, 1);
      g.generateTexture('part_snow', 3, 3);
      g.destroy();
    }

    // 8. Areia: grãos finos de Kaal
    if (!this.scene.textures.exists('part_sand')) {
      const g = this.scene.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0xf59e0b, 0.85);
      g.fillRect(0, 0, 2, 2);
      g.generateTexture('part_sand', 2, 2);
      g.destroy();
    }
  }

  emitirPoeira(x: number, y: number, direcao: string): void {
    const offsetX = direcao === 'left' ? 6 : direcao === 'right' ? -6 : 0;
    const offsetY = direcao === 'up' ? 6 : 0;

    const emitter = this.scene.add.particles(x + offsetX, y + offsetY, 'part_dust', {
      speed: { min: 10, max: 32 },
      angle: { min: 0, max: 360 },
      scale: { start: 1.0, end: 0.2 },
      alpha: { start: 0.75, end: 0 },
      lifespan: 280,
      quantity: 2,
    });
    emitter.setDepth(y - 1);
    this.scene.time.delayedCall(300, () => emitter.destroy());
  }

  emitirPoeiraDodge(x: number, y: number): void {
    const emitter = this.scene.add.particles(x, y + 10, 'part_dust', {
      speed: { min: 20, max: 60 },
      angle: { min: 0, max: 360 },
      scale: { start: 1.4, end: 0.3 },
      alpha: { start: 0.85, end: 0 },
      lifespan: 350,
      quantity: 6,
    });
    emitter.setDepth(y - 1);
    this.scene.time.delayedCall(380, () => emitter.destroy());
  }

  criarChuvaDeFolhas(larguraMapa: number, alturaMapa: number): Phaser.GameObjects.Particles.ParticleEmitter {
    const emitter = this.scene.add.particles(0, 0, 'part_leaf', {
      x: { min: 0, max: larguraMapa },
      y: { min: -30, max: 0 },
      speedX: { min: 20, max: 55 },
      speedY: { min: 25, max: 60 },
      rotate: { start: 0, end: 360 },
      scale: { start: 1.0, end: 0.6 },
      alpha: { start: 0.9, end: 0.1 },
      lifespan: { min: 6000, max: 9500 },
      frequency: 700,
      maxParticles: 28,
    });
    emitter.setDepth(9995);
    return emitter;
  }

  criarNevasca(larguraMapa: number, alturaMapa: number): Phaser.GameObjects.Particles.ParticleEmitter {
    const emitter = this.scene.add.particles(0, 0, 'part_snow', {
      x: { min: 0, max: larguraMapa },
      y: { min: -20, max: 0 },
      speedX: { min: -30, max: 10 },
      speedY: { min: 30, max: 80 },
      scale: { start: 1.0, end: 0.4 },
      alpha: { start: 0.9, end: 0.2 },
      lifespan: { min: 4000, max: 7000 },
      frequency: 200,
      maxParticles: 50,
    });
    emitter.setDepth(9995);
    return emitter;
  }

  criarTempestadeAreia(larguraMapa: number, alturaMapa: number): Phaser.GameObjects.Particles.ParticleEmitter {
    const emitter = this.scene.add.particles(0, 0, 'part_sand', {
      x: { min: -20, max: larguraMapa },
      y: { min: 0, max: alturaMapa },
      speedX: { min: 60, max: 140 },
      speedY: { min: -10, max: 20 },
      scale: { start: 1.2, end: 0.5 },
      alpha: { start: 0.7, end: 0.1 },
      lifespan: { min: 2000, max: 3500 },
      frequency: 150,
      maxParticles: 45,
    });
    emitter.setDepth(9995);
    return emitter;
  }

  emitirGolpeEspada(x: number, y: number, direcao: string): void {
    let anguloMin = 0;
    let anguloMax = 360;
    if (direcao === 'right') { anguloMin = -45; anguloMax = 45; }
    else if (direcao === 'left') { anguloMin = 135; anguloMax = 225; }
    else if (direcao === 'up') { anguloMin = -135; anguloMax = -45; }
    else if (direcao === 'down') { anguloMin = 45; anguloMax = 135; }

    const emitter = this.scene.add.particles(x, y, 'part_spark', {
      speed: { min: 50, max: 140 },
      angle: { min: anguloMin, max: anguloMax },
      scale: { start: 1.3, end: 0.2 },
      alpha: { start: 1, end: 0 },
      lifespan: 220,
      quantity: 6,
    });
    emitter.setDepth(y + 20);
    this.scene.time.delayedCall(250, () => emitter.destroy());
  }

  emitirImpacto(x: number, y: number): void {
    const emitter = this.scene.add.particles(x, y, 'part_hit', {
      speed: { min: 40, max: 120 },
      angle: { min: 0, max: 360 },
      scale: { start: 1.2, end: 0.2 },
      alpha: { start: 1, end: 0 },
      lifespan: 240,
      quantity: 8,
    });
    emitter.setDepth(y + 20);
    this.scene.time.delayedCall(270, () => emitter.destroy());
  }

  emitirMagiaCarregada(x: number, y: number): void {
    const emitter = this.scene.add.particles(x, y, 'part_magic', {
      speed: { min: 60, max: 160 },
      angle: { min: 0, max: 360 },
      scale: { start: 1.4, end: 0.1 },
      alpha: { start: 1, end: 0 },
      lifespan: 400,
      quantity: 16,
    });
    emitter.setDepth(y + 20);
    this.scene.time.delayedCall(450, () => emitter.destroy());
  }

  emitirRespingos(x: number, y: number): void {
    const emitter = this.scene.add.particles(x, y, 'part_water', {
      speed: { min: 25, max: 70 },
      angle: { min: -140, max: -40 },
      scale: { start: 1.1, end: 0.2 },
      alpha: { start: 0.85, end: 0 },
      lifespan: 300,
      quantity: 5,
    });
    emitter.setDepth(y + 5);
    this.scene.time.delayedCall(320, () => emitter.destroy());
  }

  emitirAntecipacao(x: number, y: number): void {
    const emitter = this.scene.add.particles(x, y, 'part_spark', {
      speed: { min: 10, max: 25 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.8, end: 0.1 },
      alpha: { start: 1, end: 0 },
      lifespan: 120,
      quantity: 2,
    });
    emitter.setDepth(y + 25);
    this.scene.time.delayedCall(150, () => emitter.destroy());
  }

  emitirCargaFase(x: number, y: number, fase: number): void {
    if (fase <= 0) return;

    if (fase === 1) {
      // Fase 1: Centelha sutil convergindo
      const emitter = this.scene.add.particles(x, y, 'part_spark', {
        speed: { min: 15, max: 35 },
        angle: { min: 0, max: 360 },
        scale: { start: 0.9, end: 0.2 },
        alpha: { start: 0.7, end: 0 },
        lifespan: 180,
        quantity: 1,
      });
      emitter.setDepth(y + 25);
      this.scene.time.delayedCall(200, () => emitter.destroy());
    } else if (fase === 2) {
      // Fase 2: Orbes ciano concentrando
      const emitter = this.scene.add.particles(x, y, 'part_magic', {
        speed: { min: 25, max: 60 },
        angle: { min: 0, max: 360 },
        scale: { start: 1.0, end: 0.2 },
        alpha: { start: 0.85, end: 0 },
        lifespan: 220,
        quantity: 2,
      });
      emitter.setDepth(y + 25);
      this.scene.time.delayedCall(250, () => emitter.destroy());
    } else if (fase === 3) {
      // Fase 3: Centelhas arcanas e poeira vibratória
      const emitter = this.scene.add.particles(x, y, 'part_magic', {
        speed: { min: 40, max: 90 },
        angle: { min: 0, max: 360 },
        scale: { start: 1.2, end: 0.1 },
        alpha: { start: 0.95, end: 0 },
        lifespan: 280,
        quantity: 4,
      });
      emitter.setDepth(y + 25);
      this.scene.time.delayedCall(300, () => emitter.destroy());
    } else if (fase >= 4) {
      // Fase 4: Explosão celestial constante em espiral
      const emitter = this.scene.add.particles(x, y, 'part_spark', {
        speed: { min: 50, max: 120 },
        angle: { min: 0, max: 360 },
        scale: { start: 1.4, end: 0.2 },
        alpha: { start: 1, end: 0 },
        lifespan: 320,
        quantity: 6,
      });
      emitter.setDepth(y + 25);
      this.scene.time.delayedCall(350, () => emitter.destroy());
    }
  }

  emitirOndaDeChoque(x: number, y: number, raio: number, faseMax: boolean = false): void {
    const qtd = faseMax ? 24 : 16;
    const tex = faseMax ? 'part_spark' : 'part_magic';
    const emitter = this.scene.add.particles(x, y, tex, {
      speed: { min: 80, max: faseMax ? 220 : 160 },
      angle: { min: 0, max: 360 },
      scale: { start: faseMax ? 1.5 : 1.2, end: 0.1 },
      alpha: { start: 1, end: 0 },
      lifespan: 380,
      quantity: qtd,
    });
    emitter.setDepth(y + 30);
    this.scene.time.delayedCall(420, () => emitter.destroy());
  }
}
