import Phaser from 'phaser';
import { AnimationManager, DirecaoHeroi, EstadoHeroi } from './AnimationManager';
import { ParticleSystem } from './ParticleSystem';
import { LightingSystem } from './LightingSystem';
import { soundManager } from '../../soundEffects';
import { eventBus } from '../eventBus';

// =============================================================================
// ELDRIM: ECOS DO PASSADO - HERO CONTROLLER & COMBATE 2.0 (FASE 10 DEFINITIVA)
// =============================================================================
// Controla integralmente o herói Ren:
// - Movimento top-down fluido com normalização diagonal e sombra elíptica
// - Arcane Flow conectado ao HUD (arcanoAtual, arcanoMax, regeneração, custos)
// - Ataque Normal com antecipação, pose, arco de espada, impacto, hit stop, recuperação
// - Ataque Carregado em 4 Fases (preparação, carregamento, carga forte, carga máxima)
// - Onda de Choque independente com expansão, brilho, rotação, partículas e fade
// - Hit Stop não acumulativo (30-45ms normal, 50-70ms carregado)
// - Cancelamento estrito e imediato por dano (HURT), esquiva (DODGE) ou morte (DEATH)
// - Totalmente compartilhado entre OverworldScene e DungeonScene (zero duplicação)
// =============================================================================

export interface HeroControllerConfig {
  spawnX: number;
  spawnY: number;
  particleSystem: ParticleSystem;
  lightingSystem?: LightingSystem;
  layerParedes?: Phaser.Tilemaps.TilemapLayer;
  grupoCenario?: Phaser.GameObjects.Group;
  vidaInicial?: number;
  vidaMax?: number;
  arcanoInicial?: number;
  arcanoMax?: number;
}

export interface InimigoAlvo {
  sprite: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  hp: number;
  hpMax: number;
  nome?: string;
  iframeTimer: number;
  onDano?: (dano: number, atacanteX: number, atacanteY: number) => void;
  onMorte?: () => void;
}

export class HeroController {
  public scene: Phaser.Scene;
  public heroi!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  public sombraHeroi!: Phaser.GameObjects.Image;
  public hitboxAtaque!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;

  // Sistemas auxiliares
  public particleSystem: ParticleSystem;
  public lightingSystem?: LightingSystem;

  // Estado físico e de animação
  public direcaoAtual: DirecaoHeroi = 'down';
  public estadoAtual: EstadoHeroi = 'idle';
  public velocidadeBase: number = 100;
  public emIframe: boolean = false;
  public estaMorto: boolean = false;

  // Estado de Combate
  public atacando: boolean = false;
  public esquivando: boolean = false;
  public carregandoAtaque: boolean = false;
  public tempoInicioCarga: number = 0;
  public faseCargaAtual: number = 0; // 0..4
  private tocouSomChargeReady: boolean = false;
  private hitStopAtivo: boolean = false;

  // Arcane Flow (Energia de Eldrim)
  public arcanoAtual: number = 20;
  public arcanoMax: number = 20;
  public taxaRegeneracao: number = 1.0; // 5% por segundo (1 ponto/s)
  private ultimoArcanoEmitido: number = -1;

  // Vida
  public vidaAtual: number = 4;
  public vidaMax: number = 4;

  // Geração única de ação (Token de cancelamento estrito)
  private actionGeneration: number = 0;

  // Referências diretas a timers ativos para cancelamento imediato
  private timerAtaque: Phaser.Time.TimerEvent | null = null;
  private timerHitbox: Phaser.Time.TimerEvent | null = null;
  private timerCarga: Phaser.Time.TimerEvent | null = null;
  private timerRecuperacao: Phaser.Time.TimerEvent | null = null;
  private timerEsquiva: Phaser.Time.TimerEvent | null = null;
  private timerHurt: Phaser.Time.TimerEvent | null = null;
  private timerHitStop: Phaser.Time.TimerEvent | null = null;

  // Efeitos visuais dedicados
  private graphicsEspada!: Phaser.GameObjects.Graphics;
  private listaOndasDeChoque: Phaser.GameObjects.Graphics[] = [];

  // Lista de inimigos registrados para combate
  private inimigosRegistrados: InimigoAlvo[] = [];

  // Teclado
  private keyW?: Phaser.Input.Keyboard.Key;
  private keyA?: Phaser.Input.Keyboard.Key;
  private keyS?: Phaser.Input.Keyboard.Key;
  private keyD?: Phaser.Input.Keyboard.Key;
  private keyUp?: Phaser.Input.Keyboard.Key;
  private keyLeft?: Phaser.Input.Keyboard.Key;
  private keyDown?: Phaser.Input.Keyboard.Key;
  private keyRight?: Phaser.Input.Keyboard.Key;
  private keyZ?: Phaser.Input.Keyboard.Key;
  private keyX?: Phaser.Input.Keyboard.Key;
  private keyC?: Phaser.Input.Keyboard.Key;
  private keySpace?: Phaser.Input.Keyboard.Key;
  private keyEnter?: Phaser.Input.Keyboard.Key;

  constructor(scene: Phaser.Scene, config: HeroControllerConfig) {
    this.scene = scene;
    this.particleSystem = config.particleSystem;
    this.lightingSystem = config.lightingSystem;

    if (config.vidaInicial !== undefined) this.vidaAtual = config.vidaInicial;
    if (config.vidaMax !== undefined) this.vidaMax = config.vidaMax;
    if (config.arcanoInicial !== undefined) this.arcanoAtual = config.arcanoInicial;
    if (config.arcanoMax !== undefined) this.arcanoMax = config.arcanoMax;

    this.criarHeroi(config.spawnX, config.spawnY);
    this.configurarColisoes(config.layerParedes, config.grupoCenario);
    this.configurarTeclado();
    this.configurarEfeitosVisuais();
    this.emitirEstadoInicialHUD();
  }

  /**
   * Inicializa o sprite de Ren com física, tamanho anatômico e sombra elíptica
   */
  private criarHeroi(x: number, y: number): void {
    // 1. Sombra elíptica sob os pés
    this.sombraHeroi = this.scene.add.image(x, y + 26, 'sombra_elipse');
    this.sombraHeroi.setAlpha(0.65);
    this.sombraHeroi.setDepth(y - 1);

    // 2. Sprite principal de Ren (usa atlas V8 de 160 frames ou fallback)
    const textureKey = this.scene.textures.exists('ren_spritesheet_v8')
      ? 'ren_spritesheet_v8'
      : this.scene.textures.exists('ren_spritesheet_v7')
      ? 'ren_spritesheet_v7'
      : 'ren_spritesheet';

    this.heroi = this.scene.physics.add.sprite(x, y, textureKey);
    this.heroi.setCollideWorldBounds(true);
    this.heroi.setDisplaySize(38, 54);

    // Hitbox física precisa no torso/pés
    this.heroi.body.setSize(16, 12);
    this.heroi.body.setOffset(16, 44);

    // 3. Hitbox de Ataque física
    this.hitboxAtaque = this.scene.physics.add.sprite(x, y, 'heroi_hud');
    this.hitboxAtaque.setVisible(false);
    this.hitboxAtaque.body.setSize(24, 24);
    this.hitboxAtaque.body.enable = false;

    // Inicializa animação idle para baixo
    AnimationManager.atualizarAnimacao(this.heroi, 'idle', this.direcaoAtual);
  }

  private configurarColisoes(
    layerParedes?: Phaser.Tilemaps.TilemapLayer,
    grupoCenario?: Phaser.GameObjects.Group
  ): void {
    if (layerParedes) {
      this.scene.physics.add.collider(this.heroi, layerParedes);
    }
    if (grupoCenario) {
      this.scene.physics.add.collider(this.heroi, grupoCenario);
    }
  }

  private configurarTeclado(): void {
    const kb = this.scene.input.keyboard;
    if (!kb) return;

    this.keyW = kb.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.keyA = kb.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyS = kb.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this.keyD = kb.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.keyUp = kb.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
    this.keyLeft = kb.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
    this.keyDown = kb.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
    this.keyRight = kb.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);
    this.keyZ = kb.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
    this.keyX = kb.addKey(Phaser.Input.Keyboard.KeyCodes.X);
    this.keyC = kb.addKey(Phaser.Input.Keyboard.KeyCodes.C);
    this.keySpace = kb.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.keyEnter = kb.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);

    // Início da carga ou ataque ao pressionar Z
    this.keyZ.on('down', () => {
      if (this.estaMorto || this.esquivando || this.atacando) return;
      this.iniciarCarga();
    });

    // Liberação de Z para desferir ataque normal ou carregado
    this.keyZ.on('up', () => {
      if (this.estaMorto || this.esquivando) return;
      if (this.carregandoAtaque) {
        this.liberarAtaquePelaCarga();
      }
    });

    // Esquiva / Rolamento acrobático (C ou Barra de Espaço)
    const dispararEsquiva = () => {
      if (this.estaMorto || this.esquivando || this.atacando) return;
      this.executarEsquiva();
    };
    this.keyC.on('down', dispararEsquiva);
    this.keySpace.on('down', dispararEsquiva);

    // Menu de Pausa
    this.keyEnter.on('down', () => {
      if (this.estaMorto) return;
      this.scene.scene.launch('PauseScene', { parentSceneKey: this.scene.scene.key });
      this.scene.scene.pause();
    });
  }

  private configurarEfeitosVisuais(): void {
    // Objeto gráfico dinâmico para renderizar o arco da espada conectado ao corpo
    this.graphicsEspada = this.scene.add.graphics();
    this.graphicsEspada.setDepth(9992);
  }

  private emitirEstadoInicialHUD(): void {
    eventBus.emit('vidaMudou', this.vidaAtual);
    const porcentagem = Math.round((this.arcanoAtual / this.arcanoMax) * 100);
    eventBus.emit('energiaMudou', porcentagem);
    eventBus.emit('fluxoArcano', {
      atual: this.arcanoAtual,
      max: this.arcanoMax,
      porcentagem,
    });
  }

  // ===========================================================================
  // REGISTRO DE INIMIGOS E COMBATE DINÂMICO
  // ===========================================================================

  /**
   * Registra um inimigo para sofrer detecção de colisão com a espada e shockwave
   */
  public registrarInimigo(
    sprite: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody,
    config: {
      hp: number;
      hpMax: number;
      nome?: string;
      onDano?: (dano: number, atacanteX: number, atacanteY: number) => void;
      onMorte?: () => void;
    }
  ): void {
    const alvo: InimigoAlvo = {
      sprite,
      hp: config.hp,
      hpMax: config.hpMax,
      nome: config.nome,
      iframeTimer: 0,
      onDano: config.onDano,
      onMorte: config.onMorte,
    };
    this.inimigosRegistrados.push(alvo);

    // Adiciona overlap com a hitbox da espada
    this.scene.physics.add.overlap(this.hitboxAtaque, sprite, () => {
      this.processarAcertoEmInimigo(alvo);
    });
  }

  private processarAcertoEmInimigo(alvo: InimigoAlvo): void {
    if (!alvo.sprite.active || alvo.iframeTimer > 0) return;

    // Determina dano e força pelo estado atual do golpe
    const isCarregado = this.estadoAtual === 'charged';
    const isFase4 = isCarregado && this.faseCargaAtual >= 4;
    const dano = isFase4 ? 3 : isCarregado ? 2 : 1;
    const duracaoHitStop = isCarregado ? 60 : 35; // Regra 7: 30-45ms normal, 50-70ms carregado

    alvo.hp = Math.max(0, alvo.hp - dano);
    alvo.iframeTimer = 280;

    // 1. Hit Flash no inimigo (tint branco por 80ms)
    alvo.sprite.setTint(0xffffff);
    this.scene.time.delayedCall(80, () => {
      if (alvo.sprite.active) alvo.sprite.clearTint();
    });

    // 2. Partículas de impacto na posição do inimigo
    this.particleSystem.emitirImpacto(alvo.sprite.x, alvo.sprite.y);

    // 3. Som de impacto
    soundManager.playEnemyHit();

    // 4. Pequeno screen shake
    const shakeForca = isFase4 ? 0.012 : isCarregado ? 0.008 : 0.004;
    this.scene.cameras.main.shake(100, shakeForca);

    // 5. Hit Stop não acumulativo
    this.aplicarHitStop(duracaoHitStop);

    // 6. Knockback no inimigo para longe de Ren
    const angulo = Phaser.Math.Angle.Between(this.heroi.x, this.heroi.y, alvo.sprite.x, alvo.sprite.y);
    const forcaKb = isFase4 ? 220 : isCarregado ? 160 : 100;
    alvo.sprite.setVelocity(Math.cos(angulo) * forcaKb, Math.sin(angulo) * forcaKb);

    this.scene.time.delayedCall(120, () => {
      if (alvo.sprite.active && alvo.sprite.body) {
        alvo.sprite.setVelocity(0, 0);
      }
    });

    // Callback personalizado do inimigo
    if (alvo.onDano) {
      alvo.onDano(dano, this.heroi.x, this.heroi.y);
    }

    // Se o inimigo morreu
    if (alvo.hp <= 0) {
      if (alvo.onMorte) alvo.onMorte();
      this.particleSystem.emitirMagiaCarregada(alvo.sprite.x, alvo.sprite.y);
      this.scene.time.delayedCall(100, () => {
        if (alvo.sprite.active) {
          alvo.sprite.destroy();
        }
      });
    }
  }

  // ===========================================================================
  // SISTEMA DE HIT STOP (REGRA 7)
  // ===========================================================================

  /**
   * Congela temporariamente o combate (30-45ms normal, 50-70ms carregado) sem acumular
   */
  public aplicarHitStop(duracaoMs: number = 35): void {
    if (this.hitStopAtivo) return; // Não acumular múltiplos hit stops simultaneamente
    this.hitStopAtivo = true;

    // Pausa a física e animação de Ren para sensação de travamento no impacto
    this.scene.physics.world.isPaused = true;
    if (this.heroi?.anims) {
      this.heroi.anims.pause();
    }

    const currentAction = this.actionGeneration;
    this.timerHitStop = this.scene.time.delayedCall(duracaoMs, () => {
      this.scene.physics.world.isPaused = false;
      if (this.heroi?.anims && this.heroi.active) {
        this.heroi.anims.resume();
      }
      this.hitStopAtivo = false;
      this.timerHitStop = null;
    });
  }

  // ===========================================================================
  // CANCELAMENTO ESTRITO (REGRA 9)
  // ===========================================================================

  /**
   * Cancela imediatamente toda rotina de ataque, timers e efeitos visuais
   * Chamado obrigatoriamente quando Ren entra em HURT, DODGE ou DEATH.
   */
  public cancelarAcoesDeCombate(motivo: 'hurt' | 'dodge' | 'death'): void {
    // 1. Incrementa token de ação para invalidar callbacks assíncronos anteriores
    this.actionGeneration++;

    // 2. Destruição segura de timers ativos
    if (this.timerAtaque) { this.timerAtaque.destroy(); this.timerAtaque = null; }
    if (this.timerHitbox) { this.timerHitbox.destroy(); this.timerHitbox = null; }
    if (this.timerCarga) { this.timerCarga.destroy(); this.timerCarga = null; }
    if (this.timerRecuperacao) { this.timerRecuperacao.destroy(); this.timerRecuperacao = null; }

    // 3. Desativação imediata da hitbox
    if (this.hitboxAtaque && this.hitboxAtaque.body) {
      this.hitboxAtaque.body.enable = false;
    }

    // 4. Limpeza de artefatos visuais de ataque
    this.limparArcoEspada();
    this.limparOndasDeChoque();

    // 5. Reset do estado de carga e ataque
    this.atacando = false;
    this.carregandoAtaque = false;
    this.faseCargaAtual = 0;
    this.tocouSomChargeReady = false;

    // 6. Reset visual de tint e luz
    if (this.heroi && this.heroi.active) {
      this.heroi.clearTint();
    }
    if (this.lightingSystem) {
      // Força fase 0 na iluminação
    }
  }

  // ===========================================================================
  // ARCANE FLOW (REGRA 1)
  // ===========================================================================

  private atualizarArcaneFlow(delta: number): void {
    // Regenera energia continuamente quando Ren não está canalizando carga
    if (this.arcanoAtual < this.arcanoMax && !this.carregandoAtaque && !this.estaMorto) {
      this.arcanoAtual = Math.min(this.arcanoMax, this.arcanoAtual + this.taxaRegeneracao * (delta / 1000));
      this.sincronizarHUDSeMudou();
    }
  }

  public consumirArcano(qtd: number): boolean {
    if (this.arcanoAtual < qtd) return false;
    this.arcanoAtual = Math.max(0, this.arcanoAtual - qtd);
    this.sincronizarHUDSeMudou();
    return true;
  }

  private sincronizarHUDSeMudou(): void {
    const porcentagem = Math.round((this.arcanoAtual / this.arcanoMax) * 100);
    if (porcentagem !== this.ultimoArcanoEmitido) {
      this.ultimoArcanoEmitido = porcentagem;
      eventBus.emit('energiaMudou', porcentagem);
      eventBus.emit('fluxoArcano', {
        atual: Math.round(this.arcanoAtual * 10) / 10,
        max: this.arcanoMax,
        porcentagem,
      });
    }
  }

  // ===========================================================================
  // ATAQUE NORMAL (REGRAS 2 & 4)
  // Antecipação -> Corte -> Trajetória -> Impacto -> Recuperação
  // ===========================================================================

  public executarAtaqueNormal(): void {
    if (this.atacando || this.esquivando || this.estaMorto) return;

    const actionId = ++this.actionGeneration;
    this.atacando = true;
    this.heroi.setVelocity(0, 0);

    // 1. FASE DE ANTECIPAÇÃO (0 a 40ms)
    // Postura firme, brilho inicial na empunhadura
    AnimationManager.atualizarAnimacao(this.heroi, 'attack', this.direcaoAtual);
    const pivot = this.obterPontoEspada(this.direcaoAtual);
    this.particleSystem.emitirAntecipacao(pivot.x, pivot.y);
    this.desenharGleamAntecipacao(pivot.x, pivot.y);

    // 2. FASE DE CORTE E TRAJETÓRIA (40ms em diante)
    this.timerAtaque = this.scene.time.delayedCall(40, () => {
      if (this.actionGeneration !== actionId) return;

      // Som de corte afiado
      soundManager.playSwordSlash();

      // Screen shake sutil
      this.scene.cameras.main.shake(80, 0.0035);

      // Partículas ao longo da trajetória
      this.particleSystem.emitirGolpeEspada(this.heroi.x, this.heroi.y + 10, this.direcaoAtual);

      // Renderiza arco luminoso da espada conectado ao corpo
      this.animarArcoEspada(this.direcaoAtual, actionId, false);

      // 3. FASE DE IMPACTO (Hitbox ativa de 40ms a 140ms)
      this.posicionarHitbox(this.direcaoAtual, 24, 24, 24);
      this.hitboxAtaque.body.enable = true;

      eventBus.emit('teclaPressionada', {
        tecla: `Z (Ataque Normal ${this.direcaoAtual})`,
        posicaoHeroi: { x: Math.round(this.heroi.x), y: Math.round(this.heroi.y) },
        timestamp: Date.now(),
      });
    });

    // Desativação da hitbox após o ápice do impacto
    this.timerHitbox = this.scene.time.delayedCall(140, () => {
      if (this.actionGeneration !== actionId) return;
      this.hitboxAtaque.body.enable = false;
    });

    // 4. FASE DE RECUPERAÇÃO (140ms a 240ms)
    this.timerRecuperacao = this.scene.time.delayedCall(240, () => {
      if (this.actionGeneration !== actionId) return;
      this.atacando = false;
      this.hitboxAtaque.body.enable = false;
      this.limparArcoEspada();
      AnimationManager.atualizarAnimacao(this.heroi, 'idle', this.direcaoAtual);
    });
  }

  // ===========================================================================
  // ATAQUE CARREGADO COM 4 FASES PROGRESSIVAS (REGRAS 3, 5 & 6)
  // ===========================================================================

  private iniciarCarga(): void {
    this.carregandoAtaque = true;
    this.tempoInicioCarga = this.scene.time.now;
    this.faseCargaAtual = 1;
    this.tocouSomChargeReady = false;
    this.heroi.setVelocity(0, 0);

    eventBus.emit('teclaPressionada', {
      tecla: 'Z (Iniciando Carga de Eldrim)',
      posicaoHeroi: { x: Math.round(this.heroi.x), y: Math.round(this.heroi.y) },
      timestamp: Date.now(),
    });
  }

  private atualizarFasesDeCarga(): void {
    if (!this.carregandoAtaque || this.estaMorto || this.esquivando) return;

    const tempoDecorrido = this.scene.time.now - this.tempoInicioCarga;

    // FASE 1: Preparação (0ms a 300ms) - Custo 0
    if (tempoDecorrido < 300) {
      this.faseCargaAtual = 1;
      this.heroi.setTint(0xf8fafc);
      if (Math.random() < 0.2) {
        this.particleSystem.emitirCargaFase(this.heroi.x, this.heroi.y + 12, 1);
      }
    }
    // FASE 2: Carregamento (300ms a 700ms) - Requer 2 Arcano
    else if (tempoDecorrido < 700) {
      if (this.arcanoAtual >= 2) {
        this.faseCargaAtual = 2;
        this.heroi.setTint(0x93c5fd);
        if (Math.random() < 0.35) {
          this.particleSystem.emitirCargaFase(this.heroi.x, this.heroi.y + 12, 2);
        }
      } else {
        this.faseCargaAtual = 1; // Não consegue avançar por falta de energia
      }
    }
    // FASE 3: Carga Forte (700ms a 1200ms) - Requer 5 Arcano
    else if (tempoDecorrido < 1200) {
      if (this.arcanoAtual >= 5) {
        if (this.faseCargaAtual < 3) {
          // Toca som playChargeReady() UMA VEZ ao atingir a carga forte!
          if (!this.tocouSomChargeReady) {
            soundManager.playChargeReady();
            this.tocouSomChargeReady = true;
          }
        }
        this.faseCargaAtual = 3;
        this.heroi.setTint(0x38bdf8);
        if (Math.random() < 0.5) {
          this.particleSystem.emitirCargaFase(this.heroi.x, this.heroi.y + 12, 3);
        }
      } else {
        this.faseCargaAtual = 2;
      }
    }
    // FASE 4: Carga Máxima (1200ms+) - Requer 8 Arcano
    else {
      if (this.arcanoAtual >= 8) {
        this.faseCargaAtual = 4;
        // Alternância cintilante entre ouro celestial e ciano
        const corTint = Math.floor(this.scene.time.now / 100) % 2 === 0 ? 0x67e8f9 : 0xfef08a;
        this.heroi.setTint(corTint);
        if (Math.random() < 0.75) {
          this.particleSystem.emitirCargaFase(this.heroi.x, this.heroi.y + 12, 4);
        }
      } else {
        this.faseCargaAtual = 3;
      }
    }
  }

  private liberarAtaquePelaCarga(): void {
    const fase = this.faseCargaAtual;
    this.carregandoAtaque = false;
    this.heroi.clearTint();

    if (fase <= 1) {
      // Carga insuficiente: golpe normal físico sem custo de arcano
      this.executarAtaqueNormal();
    } else if (fase === 2) {
      // Golpe Energizado Moderado: consome 2 de arcano
      this.consumirArcano(2);
      this.executarGolpeEnergizado();
    } else {
      // Carga Forte (Fase 3) ou Máxima (Fase 4): Consome 5 ou 8 de arcano
      const custo = fase >= 4 ? 8 : 5;
      this.consumirArcano(custo);
      this.executarAtaqueCarregadoComOnda(fase >= 4);
    }

    this.faseCargaAtual = 0;
    this.tocouSomChargeReady = false;
  }

  private executarGolpeEnergizado(): void {
    if (this.atacando || this.esquivando || this.estaMorto) return;

    const actionId = ++this.actionGeneration;
    this.atacando = true;
    this.heroi.setVelocity(0, 0);

    AnimationManager.atualizarAnimacao(this.heroi, 'attack', this.direcaoAtual);
    soundManager.playSwordSlash();
    this.scene.cameras.main.shake(100, 0.005);
    this.particleSystem.emitirGolpeEspada(this.heroi.x, this.heroi.y + 10, this.direcaoAtual);
    this.animarArcoEspada(this.direcaoAtual, actionId, true);

    // Hitbox com alcance ampliado (30px)
    this.posicionarHitbox(this.direcaoAtual, 30, 28, 28);
    this.hitboxAtaque.body.enable = true;

    this.timerHitbox = this.scene.time.delayedCall(160, () => {
      if (this.actionGeneration !== actionId) return;
      this.hitboxAtaque.body.enable = false;
    });

    this.timerRecuperacao = this.scene.time.delayedCall(260, () => {
      if (this.actionGeneration !== actionId) return;
      this.atacando = false;
      this.hitboxAtaque.body.enable = false;
      this.limparArcoEspada();
      AnimationManager.atualizarAnimacao(this.heroi, 'idle', this.direcaoAtual);
    });
  }

  private executarAtaqueCarregadoComOnda(isFaseMaxima: boolean): void {
    if (this.atacando || this.esquivando || this.estaMorto) return;

    const actionId = ++this.actionGeneration;
    this.atacando = true;
    this.estadoAtual = 'charged';
    this.heroi.setVelocity(0, 0);

    // 1. Áudio obrigatório da Diretiva 5: playChargedSlash()
    soundManager.playChargedSlash();

    // 2. Animação de giro radial 360°
    AnimationManager.atualizarAnimacao(this.heroi, 'charged', this.direcaoAtual);

    // 3. Screen shake impactante
    const shakeForca = isFaseMaxima ? 0.014 : 0.008;
    this.scene.cameras.main.shake(isFaseMaxima ? 220 : 160, shakeForca);

    // 4. Criação da ONDA DE CHOQUE independente (Regra 6)
    const raioFinal = isFaseMaxima ? 74 : 52;
    this.criarOndaDeChoque(this.heroi.x, this.heroi.y + 8, raioFinal, isFaseMaxima, actionId);

    // 5. Hitbox expandida para cobrir o anel de impacto da espada
    this.hitboxAtaque.setPosition(this.heroi.x, this.heroi.y + 8);
    this.hitboxAtaque.body.setSize(raioFinal * 1.5, raioFinal * 1.5);
    this.hitboxAtaque.body.enable = true;

    eventBus.emit('teclaPressionada', {
      tecla: isFaseMaxima ? 'Z (Golpe Carregado MÁXIMO)' : 'Z (Golpe Carregado Forte)',
      posicaoHeroi: { x: Math.round(this.heroi.x), y: Math.round(this.heroi.y) },
      timestamp: Date.now(),
    });

    // 6. Janela ativa da hitbox
    this.timerHitbox = this.scene.time.delayedCall(220, () => {
      if (this.actionGeneration !== actionId) return;
      this.hitboxAtaque.body.enable = false;
      this.hitboxAtaque.body.setSize(24, 24);
    });

    // 7. Recuperação pós-giro (320ms total)
    this.timerRecuperacao = this.scene.time.delayedCall(320, () => {
      if (this.actionGeneration !== actionId) return;
      this.atacando = false;
      this.hitboxAtaque.body.enable = false;
      this.hitboxAtaque.body.setSize(24, 24);
      AnimationManager.atualizarAnimacao(this.heroi, 'idle', this.direcaoAtual);
    });
  }

  // ===========================================================================
  // VISUAIS: ARCO DA ESPADA E ONDA DE CHOQUE (REGRAS 4 & 6)
  // ===========================================================================

  private obterPontoEspada(dir: DirecaoHeroi): { x: number; y: number } {
    let px = this.heroi.x;
    let py = this.heroi.y + 8;
    if (dir === 'down') { px += 10; py += 12; }
    else if (dir === 'up') { px -= 10; py -= 16; }
    else if (dir === 'left') { px -= 14; py += 2; }
    else if (dir === 'right') { px += 14; py += 2; }
    return { x: px, y: py };
  }

  private desenharGleamAntecipacao(x: number, y: number): void {
    this.graphicsEspada.clear();
    this.graphicsEspada.fillStyle(0xffffff, 0.9);
    this.graphicsEspada.fillCircle(x, y, 2.5);
    this.graphicsEspada.fillStyle(0x38bdf8, 0.6);
    this.graphicsEspada.fillCircle(x, y, 4.5);
  }

  private animarArcoEspada(dir: DirecaoHeroi, actionId: number, isEnergizado: boolean): void {
    const duracao = 140;
    const inicio = this.scene.time.now;

    let anguloCentral = 90; // Down
    if (dir === 'up') anguloCentral = 270;
    else if (dir === 'left') anguloCentral = 180;
    else if (dir === 'right') anguloCentral = 0;

    const raio = isEnergizado ? 30 : 24;
    const raioInterno = isEnergizado ? 14 : 10;
    const corAura = isEnergizado ? 0x0284c7 : 0x38bdf8;

    const animarFrame = () => {
      if (this.actionGeneration !== actionId) {
        this.limparArcoEspada();
        return;
      }

      const progresso = Math.min(1, (this.scene.time.now - inicio) / duracao);
      if (progresso >= 1) {
        this.limparArcoEspada();
        return;
      }

      const hx = this.heroi.x;
      const hy = this.heroi.y + 8;

      // Ângulo varrendo de -55° a +55° em torno do centro de direção
      const abertura = 110;
      const angInicio = Phaser.Math.DegToRad(anguloCentral - abertura / 2 + progresso * 20);
      const angFim = Phaser.Math.DegToRad(anguloCentral - abertura / 2 + progresso * abertura);

      this.graphicsEspada.clear();

      // Halo externo luminoso
      this.graphicsEspada.lineStyle(4, corAura, (1 - progresso) * 0.7);
      this.graphicsEspada.beginPath();
      this.graphicsEspada.arc(hx, hy, raio, angInicio, angFim, false);
      this.graphicsEspada.strokePath();

      // Núcleo branco incandescente do corte
      this.graphicsEspada.lineStyle(2, 0xffffff, (1 - progresso) * 0.95);
      this.graphicsEspada.beginPath();
      this.graphicsEspada.arc(hx, hy, (raio + raioInterno) / 2, angInicio, angFim, false);
      this.graphicsEspada.strokePath();

      this.scene.time.delayedCall(16, animarFrame);
    };

    animarFrame();
  }

  private limparArcoEspada(): void {
    if (this.graphicsEspada) {
      this.graphicsEspada.clear();
    }
  }

  /**
   * Onda de Choque independente: nasce da lâmina, expande, brilha, possui distorção e fade
   */
  private criarOndaDeChoque(
    x: number,
    y: number,
    raioMaximo: number,
    isFaseMaxima: boolean,
    actionId: number
  ): void {
    const ondaGfx = this.scene.add.graphics();
    ondaGfx.setDepth(y + 25);
    this.listaOndasDeChoque.push(ondaGfx);

    // Emite partículas radiais na circunferência da onda
    this.particleSystem.emitirOndaDeChoque(x, y, raioMaximo, isFaseMaxima);

    const duracao = 300;
    const startTime = this.scene.time.now;
    const raioInicial = 16;
    const corPrincipal = isFaseMaxima ? 0x67e8f9 : 0x38bdf8;
    const corSecundaria = isFaseMaxima ? 0xfef08a : 0x0284c7;

    const renderizarOnda = () => {
      if (this.actionGeneration !== actionId || !ondaGfx.active) {
        ondaGfx.destroy();
        return;
      }

      const elapsed = this.scene.time.now - startTime;
      const prog = Math.min(1, elapsed / duracao);

      if (prog >= 1) {
        ondaGfx.destroy();
        const idx = this.listaOndasDeChoque.indexOf(ondaGfx);
        if (idx !== -1) this.listaOndasDeChoque.splice(idx, 1);
        return;
      }

      // Expansão suave (EaseOutQuad)
      const easeProg = 1 - (1 - prog) * (1 - prog);
      const raioAtual = raioInicial + (raioMaximo - raioInicial) * easeProg;
      const alpha = (1 - prog);

      ondaGfx.clear();

      // 1. Anel externo luminoso
      ondaGfx.lineStyle(3, corPrincipal, alpha * 0.85);
      ondaGfx.strokeCircle(x, y, raioAtual);

      // 2. Núcleo incandescente
      ondaGfx.lineStyle(1.5, 0xffffff, alpha * 0.95);
      ondaGfx.strokeCircle(x, y, raioAtual - 2);

      // 3. Cristas de choque em espiral acompanhando o giro de Ren
      const rotBase = prog * Math.PI * 2;
      for (let i = 0; i < 4; i++) {
        const ang = rotBase + (i * Math.PI) / 2;
        const cx1 = x + Math.cos(ang) * (raioAtual - 6);
        const cy1 = y + Math.sin(ang) * (raioAtual - 6);
        const cx2 = x + Math.cos(ang + 0.4) * (raioAtual + 2);
        const cy2 = y + Math.sin(ang + 0.4) * (raioAtual + 2);

        ondaGfx.lineStyle(2, corSecundaria, alpha * 0.7);
        ondaGfx.beginPath();
        ondaGfx.moveTo(cx1, cy1);
        ondaGfx.lineTo(cx2, cy2);
        ondaGfx.strokePath();
      }

      this.scene.time.delayedCall(16, renderizarOnda);
    };

    renderizarOnda();
  }

  private limparOndasDeChoque(): void {
    for (const onda of this.listaOndasDeChoque) {
      if (onda && onda.active) onda.destroy();
    }
    this.listaOndasDeChoque = [];
  }

  private posicionarHitbox(dir: DirecaoHeroi, dist: number, w: number, h: number): void {
    let hx = this.heroi.x;
    let hy = this.heroi.y + 8;

    if (dir === 'down') hy += dist;
    else if (dir === 'up') hy -= dist;
    else if (dir === 'left') hx -= dist;
    else if (dir === 'right') hx += dist;

    this.hitboxAtaque.setPosition(hx, hy);
    this.hitboxAtaque.body.setSize(w, h);
  }

  // ===========================================================================
  // ESQUIVA (DODGE)
  // ===========================================================================

  public executarEsquiva(): void {
    if (this.esquivando || this.estaMorto) return;

    // Cancela imediatamente qualquer ataque em curso
    this.cancelarAcoesDeCombate('dodge');

    this.esquivando = true;
    this.emIframe = true;

    // Partículas de poeira acrobática
    this.particleSystem.emitirPoeiraDodge(this.heroi.x, this.heroi.y + 12);

    // Animação de dodge
    AnimationManager.atualizarAnimacao(this.heroi, 'dodge', this.direcaoAtual);

    // Impulso de esquiva (2.2x da velocidade)
    const velDodge = this.velocidadeBase * 2.2;
    let vx = 0;
    let vy = 0;
    if (this.direcaoAtual === 'left') vx = -velDodge;
    else if (this.direcaoAtual === 'right') vx = velDodge;
    else if (this.direcaoAtual === 'up') vy = -velDodge;
    else if (this.direcaoAtual === 'down') vy = velDodge;

    this.heroi.setVelocity(vx, vy);

    const actionId = ++this.actionGeneration;
    this.timerEsquiva = this.scene.time.delayedCall(280, () => {
      if (this.actionGeneration !== actionId) return;
      this.esquivando = false;
      this.emIframe = false;
      this.heroi.setVelocity(0, 0);
      AnimationManager.atualizarAnimacao(this.heroi, 'idle', this.direcaoAtual);
    });
  }

  // ===========================================================================
  // DANO (HURT) E MORTE (DEATH)
  // ===========================================================================

  public aplicarDano(quantidade: number = 1, atacanteX?: number, atacanteY?: number): void {
    if (this.emIframe || this.estaMorto) return;

    // Regra 9: Cancela imediatamente timers de ataque, hitbox e carga!
    this.cancelarAcoesDeCombate('hurt');

    this.emIframe = true;
    this.vidaAtual = Math.max(0, this.vidaAtual - quantidade);
    eventBus.emit('vidaMudou', this.vidaAtual);
    soundManager.playHeroHurt();

    // 1. Hit Stop contundente de 35ms
    this.aplicarHitStop(35);

    // 2. Screen shake de impacto
    this.scene.cameras.main.shake(160, 0.009);

    // 3. Partículas de impacto
    this.particleSystem.emitirImpacto(this.heroi.x, this.heroi.y + 8);

    // Se Ren morreu
    if (this.vidaAtual <= 0) {
      this.morrer();
      return;
    }

    // 4. Animação de Hurt
    this.estadoAtual = 'hurt';
    AnimationManager.atualizarAnimacao(this.heroi, 'hurt', this.direcaoAtual);

    // 5. Knockback para longe da fonte de dano
    if (atacanteX !== undefined && atacanteY !== undefined) {
      const angulo = Phaser.Math.Angle.Between(atacanteX, atacanteY, this.heroi.x, this.heroi.y);
      this.heroi.setVelocity(Math.cos(angulo) * 140, Math.sin(angulo) * 140);
    } else {
      let kx = 0;
      let ky = 0;
      if (this.direcaoAtual === 'down') ky = -100;
      else if (this.direcaoAtual === 'up') ky = 100;
      else if (this.direcaoAtual === 'left') kx = 100;
      else if (this.direcaoAtual === 'right') kx = -100;
      this.heroi.setVelocity(kx, ky);
    }

    // Piscar de invulnerabilidade (iframes)
    this.scene.tweens.add({
      targets: this.heroi,
      alpha: 0.35,
      duration: 75,
      yoyo: true,
      repeat: 5,
      onComplete: () => {
        this.heroi.setAlpha(1.0);
        this.emIframe = false;
      },
    });

    const actionId = ++this.actionGeneration;
    this.timerHurt = this.scene.time.delayedCall(220, () => {
      if (this.actionGeneration !== actionId) return;
      this.heroi.setVelocity(0, 0);
      this.estadoAtual = 'idle';
      AnimationManager.atualizarAnimacao(this.heroi, 'idle', this.direcaoAtual);
    });
  }

  private morrer(): void {
    this.estaMorto = true;
    this.heroi.setVelocity(0, 0);
    this.estadoAtual = 'death';
    AnimationManager.atualizarAnimacao(this.heroi, 'death', this.direcaoAtual);

    eventBus.emit('gameOver', {
      mensagem: 'Ren sucumbiu às sombras de Eldrim.',
    });
  }

  // ===========================================================================
  // GAME LOOP UPDATE (MOVIMENTO, PROFUNDIDADE, ANIMAÇÃO E REGENERAÇÃO)
  // ===========================================================================

  public update(time: number, delta: number): void {
    if (!this.heroi || !this.heroi.body || this.estaMorto) return;

    // Atualiza timers de iframes dos inimigos
    for (const alvo of this.inimigosRegistrados) {
      if (alvo.iframeTimer > 0) {
        alvo.iframeTimer -= delta;
      }
    }

    // Regenera Arcane Flow
    this.atualizarArcaneFlow(delta);

    // Atualiza fases de carga contínuas
    this.atualizarFasesDeCarga();

    // Sincroniza luz ambiente com o herói e fase de carga
    if (this.lightingSystem) {
      this.lightingSystem.renderizar(
        this.scene.cameras.main.width,
        this.scene.cameras.main.height,
        this.heroi.x,
        this.heroi.y,
        this.faseCargaAtual
      );
    }

    // Atualiza sombra elíptica e ordenação de profundidade (Y-sorting)
    this.sombraHeroi.setPosition(this.heroi.x, this.heroi.y + 26);
    this.sombraHeroi.setDepth(this.heroi.y - 1);
    this.heroi.setDepth(this.heroi.y);

    // Se estiver no meio de ataque, esquiva ou dano, não processa input de andar
    if (this.atacando || this.esquivando || this.estadoAtual === 'hurt') {
      return;
    }

    // Se estiver canalizando carga, Ren para ou anda em postura concentrada
    if (this.carregandoAtaque) {
      this.heroi.setVelocity(0, 0);
      return;
    }

    // Leitura das teclas de movimento
    let vx = 0;
    let vy = 0;

    const cima = this.keyW?.isDown || this.keyUp?.isDown;
    const baixo = this.keyS?.isDown || this.keyDown?.isDown;
    const esquerda = this.keyA?.isDown || this.keyLeft?.isDown;
    const direita = this.keyD?.isDown || this.keyRight?.isDown;

    if (esquerda) {
      vx -= this.velocidadeBase;
      this.direcaoAtual = 'left';
    } else if (direita) {
      vx += this.velocidadeBase;
      this.direcaoAtual = 'right';
    }

    if (cima) {
      vy -= this.velocidadeBase;
      if (!esquerda && !direita) this.direcaoAtual = 'up';
    } else if (baixo) {
      vy += this.velocidadeBase;
      if (!esquerda && !direita) this.direcaoAtual = 'down';
    }

    // Normalização diagonal
    if (vx !== 0 && vy !== 0) {
      vx *= 0.7071;
      vy *= 0.7071;
    }

    this.heroi.setVelocity(vx, vy);

    // Emissão de poeira sutil na caminhada
    if (vx !== 0 || vy !== 0) {
      this.estadoAtual = 'walk';
      AnimationManager.atualizarAnimacao(this.heroi, 'walk', this.direcaoAtual);
      if (Math.random() < 0.08) {
        this.particleSystem.emitirPoeira(this.heroi.x, this.heroi.y + 20, this.direcaoAtual);
      }
    } else {
      this.estadoAtual = 'idle';
      AnimationManager.atualizarAnimacao(this.heroi, 'idle', this.direcaoAtual);
    }
  }

  public destroy(): void {
    this.cancelarAcoesDeCombate('death');
    if (this.graphicsEspada) this.graphicsEspada.destroy();
    this.limparOndasDeChoque();
  }
}
