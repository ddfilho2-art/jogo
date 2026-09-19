import Phaser from 'phaser';
import { criarSalaTilemap } from '../tilemapHelper';
import { eventBus } from '../eventBus';
import { soundManager } from '../../soundEffects';
import { AnimationManager, DirecaoHeroi, EstadoHeroi } from '../systems/AnimationManager';
import { ParticleSystem } from '../systems/ParticleSystem';
import { LightingSystem } from '../systems/LightingSystem';
import { EnvironmentalLifeSystem } from '../systems/EnvironmentalLifeSystem';
import { GeographicEcosystem } from '../systems/GeographicEcosystem';
import { HeroController } from '../systems/HeroController';
import { TILE_SIZE, GAME_WIDTH, GAME_HEIGHT } from '../config';

// =============================================================================
// SCENE: OverworldScene (DIRETIVA V7 & V10: COMBATE DO REN 2.0)
// =============================================================================
// Resolução 640×360, tiles 32×32, herói Ren 2.0 (48×64px, 160 frames V8).
// Integrado com HeroController para combate de alta fidelidade:
// - Arcane Flow conectado ao HUD (arcanoAtual, arcanoMax, regeneração, custos)
// - Ataque Normal com antecipação, pose, arco de corte e recuperação
// - Ataque Carregado em 4 fases com iluminação dinâmica e shockwave independente
// - Hit Stop (35ms normal, 60ms carregado) sem acumulação
// - Cancelamento estrito e imediato por dano (HURT), esquiva (DODGE) ou morte
// =============================================================================

export interface OverworldData {
  regiao?: string;
  spawnX?: number;
  spawnY?: number;
}

export class OverworldScene extends Phaser.Scene {
  private regiao: string = 'valeVerdejante';
  public heroController!: HeroController;
  public heroi!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private sombraHeroi!: Phaser.GameObjects.Image;
  private layerParedes!: Phaser.Tilemaps.TilemapLayer;

  // Objetos do cenário com Y-Sort e colisão
  private grupoCenario!: Phaser.Physics.Arcade.StaticGroup;
  private arvoresLista: Phaser.GameObjects.GameObject[] = [];

  // Hitbox de ataque separada
  private hitboxAtaque!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;

  // Sistemas visuais e ecológicos V7
  private particleSystem!: ParticleSystem;
  private lightingSystem!: LightingSystem;
  private lifeSystem!: EnvironmentalLifeSystem;

  // Alvos de teste de combate
  private perigoTeste!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private espinhoInimigo!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;

  constructor() {
    super({ key: 'OverworldScene' });
  }

  init(data: OverworldData): void {
    if (data?.regiao) {
      this.regiao = data.regiao;
    }
  }

  create(): void {
    // 1. Inicializar sistemas de partículas, iluminação 2D e vida ambiental V7
    this.particleSystem = new ParticleSystem(this);
    this.lightingSystem = new LightingSystem(this);
    this.lightingSystem.configurarRegiao(this.regiao);
    this.lifeSystem = new EnvironmentalLifeSystem(this);

    // 2. Notificar HUD do carregamento da região
    eventBus.emit('regiaoCarregada', {
      regiao: this.regiao,
      nomeFormatado: this.formatarNomeRegiao(this.regiao),
    });

    // 3. Matriz 2D de 24x16 tiles de 32x32 (768x512 px)
    const cols = 24;
    const rows = 16;
    const mapWidthPx = cols * TILE_SIZE;  // 768px
    const mapHeightPx = rows * TILE_SIZE; // 512px

    // Master Benchmark V6 Backdrop em alta fidelidade orgânica
    if (this.textures.exists('terrain_benchmark_v6_raw') && this.regiao === 'valeVerdejante') {
      const bg = this.add.image(0, 0, 'terrain_benchmark_v6_raw');
      bg.setOrigin(0, 0);
      bg.setDisplaySize(mapWidthPx, mapHeightPx);
      bg.setDepth(0);
    }

    const dadosGrid = this.gerarGridSala(this.regiao, cols, rows);

    // 4. Tilemap dinâmico com colisão
    this.layerParedes = criarSalaTilemap(this, dadosGrid);
    this.layerParedes.setDepth(2);

    // 5. Configurar limites do mundo e da câmera
    this.physics.world.setBounds(0, 0, mapWidthPx, mapHeightPx);
    this.cameras.main.setBounds(0, 0, mapWidthPx, mapHeightPx);

    // 6. Efeitos atmosféricos por região
    if (this.regiao === 'valeVerdejante') {
      this.particleSystem.criarChuvaDeFolhas(mapWidthPx, mapHeightPx);
    } else if (this.regiao === 'terrasGeladas') {
      this.particleSystem.criarNevasca(mapWidthPx, mapHeightPx);
    } else if (this.regiao === 'desertoKaal') {
      this.particleSystem.criarTempestadeAreia(mapWidthPx, mapHeightPx);
    }

    // 7. Grupo de elementos de cenário com profundidade Y-Sort (Árvores orgânicas, Rochas 3D, Tochas)
    this.grupoCenario = this.physics.add.staticGroup();
    this.criarElementosCenario(cols, rows);

    // 8. Inicializar HeroController (Combate 2.0 unificado)
    const spawnX = 384;
    const spawnY = 256;
    this.heroController = new HeroController(this, {
      spawnX,
      spawnY,
      particleSystem: this.particleSystem,
      lightingSystem: this.lightingSystem,
      layerParedes: this.layerParedes,
      grupoCenario: this.grupoCenario,
      vidaInicial: 4,
      vidaMax: 4,
      arcanoInicial: 20,
      arcanoMax: 20,
    });

    this.heroi = this.heroController.heroi;
    this.sombraHeroi = this.heroController.sombraHeroi;
    this.hitboxAtaque = this.heroController.hitboxAtaque;

    // 9. Câmera seguindo Ren com lerp suave (0.08)
    this.cameras.main.startFollow(this.heroi, true, 0.08, 0.08);

    // 10. Cristal Corrompido para teste de combate e dano
    if (!this.textures.exists('perigo_cristal_v5')) {
      const canvas = document.createElement('canvas');
      canvas.width = 32;
      canvas.height = 32;
      const ctx = canvas.getContext('2d')!;
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = 'rgba(8, 12, 18, 0.45)';
      ctx.fillRect(6, 22, 20, 8);
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.moveTo(16, 2);
      ctx.lineTo(26, 24);
      ctx.lineTo(6, 24);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#f87171';
      ctx.fillRect(13, 8, 6, 12);
      ctx.fillStyle = '#fef2f2';
      ctx.fillRect(15, 6, 2, 8);
      this.textures.addCanvas('perigo_cristal_v5', canvas);
    }
    this.perigoTeste = this.physics.add.sprite(480, 256, 'perigo_cristal_v5');
    this.perigoTeste.body.setImmovable(true);
    this.perigoTeste.body.setSize(22, 18);
    this.perigoTeste.body.setOffset(5, 10);
    this.perigoTeste.setDepth(256);

    // Registra Cristal Corrompido como alvo de combate com HP e resposta ao corte
    this.heroController.registrarInimigo(this.perigoTeste, {
      hp: 6,
      hpMax: 6,
      nome: 'Cristal Corrompido',
      onDano: (dano) => {
        // Feedback adicional de tremor no cristal
        this.tweens.add({
          targets: this.perigoTeste,
          x: this.perigoTeste.x + 3,
          duration: 40,
          yoyo: true,
          repeat: 2,
        });
      },
      onMorte: () => {
        soundManager.playClank();
        this.particleSystem.emitirMagiaCarregada(this.perigoTeste.x, this.perigoTeste.y);
      },
    });

    // Se Ren encostar no cristal, toma 1 de dano com cancelamento estrito de ataque
    this.physics.add.overlap(this.heroi, this.perigoTeste, () => {
      this.heroController.aplicarDano(1, this.perigoTeste.x, this.perigoTeste.y);
    });

    // 11. Segundo alvo: Espinho Rastejante de Treino (para testar múltiplos inimigos)
    if (!this.textures.exists('espinho_rastejante_v5')) {
      const canvas = document.createElement('canvas');
      canvas.width = 28;
      canvas.height = 24;
      const ctx = canvas.getContext('2d')!;
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = 'rgba(8, 12, 18, 0.45)';
      ctx.fillRect(4, 16, 20, 6);
      ctx.fillStyle = '#854d0e';
      ctx.fillRect(6, 6, 16, 12);
      ctx.fillStyle = '#ea580c';
      ctx.fillRect(8, 8, 12, 8);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(10, 10, 3, 3);
      ctx.fillRect(15, 10, 3, 3);
      this.textures.addCanvas('espinho_rastejante_v5', canvas);
    }
    this.espinhoInimigo = this.physics.add.sprite(520, 200, 'espinho_rastejante_v5');
    this.espinhoInimigo.body.setCollideWorldBounds(true);
    this.espinhoInimigo.body.setSize(20, 16);
    this.espinhoInimigo.setDepth(200);

    // Registra o segundo inimigo para testes de repetição e shockwave múltiplo
    this.heroController.registrarInimigo(this.espinhoInimigo, {
      hp: 4,
      hpMax: 4,
      nome: 'Espinho Rastejante',
      onDano: () => {},
      onMorte: () => {
        this.particleSystem.emitirImpacto(this.espinhoInimigo.x, this.espinhoInimigo.y);
      },
    });
    this.physics.add.overlap(this.heroi, this.espinhoInimigo, () => {
      this.heroController.aplicarDano(1, this.espinhoInimigo.x, this.espinhoInimigo.y);
    });

    // 12. Ouvinte de simulação de dano externo do botão do HUD
    const handleSimularDano = () => {
      this.heroController.aplicarDano(1);
    };
    eventBus.on('simularDano', handleSimularDano);
    this.events.on('shutdown', () => {
      eventBus.off('simularDano', handleSimularDano);
      this.heroController.destroy();
      this.lightingSystem.destruir();
    });

    eventBus.emit('overworldPronto', {
      regiao: this.regiao,
      status: 'Pronto V10 Combat 2.0',
      posicaoHeroi: { x: spawnX, y: spawnY },
    });
  }

  update(time: number, delta: number): void {
    if (!this.heroController || !this.heroi || !this.heroi.body) return;

    // 1. Atualizar HeroController integralmente (movimento, arcano, carga, espada, hit stop)
    this.heroController.update(time, delta);

    // 2. Y-Sort nos elementos de cenário dinâmicos
    for (const item of this.arvoresLista) {
      const go = item as Phaser.GameObjects.Sprite;
      go.setDepth(go.y + (go.height ? go.height / 2 - 8 : 0));
    }

    // 3. Atualizar ecossistema de vida ambiental (vento, copas, insetos, fluxo e respingos)
    const emMovimento = this.heroController.estadoAtual === 'walk';
    this.lifeSystem?.update(time, delta, this.heroi.x, this.heroi.y, emMovimento);
  }

  /**
   * Encaminha solicitação de dano para o HeroController unificado
   */
  public aplicarDano(quantidade: number = 1): void {
    if (this.heroController) {
      this.heroController.aplicarDano(quantidade);
    }
  }

  private pausarJogo(): void {
    this.scene.launch('PauseScene', { parentSceneKey: 'OverworldScene' });
    this.scene.pause();
  }

  private formatarNomeRegiao(regiao: string): string {
    const mapaNomes: Record<string, string> = {
      valeVerdejante: 'Vale Verdejante / Pedraverde',
      charcoSombrio: 'Charco Sombrio / Juncoturvo',
      terrasGeladas: 'Terras Geladas / Gélida',
      desertoKaal: 'Deserto de Kaal / Oásis de Kaal',
      penhascosPedra: 'Penhascos de Pedra / Rochalta',
      ruinasSubmersas: 'Ruínas Submersas / Último Refúgio',
      cidadelaCinzenta: 'Cidadela Cinzenta / Trono Antigo',
    };
    return mapaNomes[regiao] || regiao;
  }

  /**
   * Cria os elementos do cenário de acordo com a região.
   * No Vale Verdejante, estabelece a Cena de Benchmark V6 definitiva.
   */
  private criarElementosCenario(cols: number, rows: number): void {
    if (this.regiao === 'valeVerdejante') {
      this.criarBenchmarkV6(cols, rows);
      return;
    }

    // Configuração para outras regiões
    const configsArvores = [
      { x: 5 * TILE_SIZE, y: 4 * TILE_SIZE, textura: 'tree_large_1', w: 36, h: 16, offX: 30, offY: 104 },
      { x: 19 * TILE_SIZE, y: 4 * TILE_SIZE, textura: 'tree_large_1', w: 36, h: 16, offX: 30, offY: 104 },
      { x: 4 * TILE_SIZE, y: 11 * TILE_SIZE, textura: 'tree_medium_1', w: 24, h: 14, offX: 20, offY: 70 },
      { x: 20 * TILE_SIZE, y: 11 * TILE_SIZE, textura: 'tree_old', w: 38, h: 18, offX: 29, offY: 104 },
      { x: 10 * TILE_SIZE, y: 3 * TILE_SIZE, textura: 'tree_small_1', w: 18, h: 12, offX: 15, offY: 48 },
      { x: 15 * TILE_SIZE, y: 3 * TILE_SIZE, textura: 'tree_small_1', w: 18, h: 12, offX: 15, offY: 48 },
    ];

    for (const pos of configsArvores) {
      const arvore = this.grupoCenario.create(pos.x, pos.y, pos.textura) as Phaser.Physics.Arcade.Sprite;
      arvore.setOrigin(0.5, 0.5);
      arvore.body.setSize(pos.w, pos.h);
      arvore.body.setOffset(pos.offX, pos.offY);
      this.arvoresLista.push(arvore);
    }
  }

  /**
   * CENA DE BENCHMARK V6 (VALE VERDEJANTE):
   * Composição cinematográfica em múltiplos planos:
   * - BACKGROUND: Master terrain orgânico, caminho de terra irregular, água, elevação de rochas
   * - MIDGROUND: Sombras projetadas direcionais, pedras 3D, arbustos, flores e folhas caídas
   * - PLAYABLE AREA: 2 Árvores grandes, 3 médias, Ren V6, colisão no solo e Y-sorting
   * - FOREGROUND: Copas penduradas (canopy) e raios volumétricos de sol (sunbeams)
   */
  private criarBenchmarkV6(cols: number, rows: number): void {
    const mapWidthPx = cols * TILE_SIZE;
    const mapHeightPx = rows * TILE_SIZE;

    // =========================================================================
    // 1. FRONTEIRA ECOLÓGICA NORTE (Substitui o antigo muro de tijolos)
    // =========================================================================
    // Canópio massivo da floresta antiga ao norte
    this.add.image(mapWidthPx / 2, 0, 'canopy_dense_north')
      .setOrigin(0.5, 0)
      .setDepth(10000);

    // Árvores antigas densas ao longo da borda norte (limite natural intransponível)
    const arvoresBordaNorte = [
      { x: 110, y: 75, tex: 'tree_large_v6_1', w: 44, h: 20, offX: 42, offY: 122, sombraKey: 'sombra_arvore_v6_grande', sOffX: 16, sOffY: 58 },
      { x: 260, y: 65, tex: 'tree_large_v6_2', w: 42, h: 18, offX: 39, offY: 118, sombraKey: 'sombra_arvore_v6_grande', sOffX: 16, sOffY: 58 },
      { x: 470, y: 70, tex: 'tree_large_v6_1', w: 44, h: 20, offX: 42, offY: 122, sombraKey: 'sombra_arvore_v6_grande', sOffX: 16, sOffY: 58 },
    ];

    for (const an of arvoresBordaNorte) {
      this.add.image(an.x + an.sOffX, an.y + an.sOffY, an.sombraKey)
        .setDepth(15)
        .setAlpha(0.65);

      const sp = this.grupoCenario.create(an.x, an.y, an.tex) as Phaser.Physics.Arcade.Sprite;
      sp.setOrigin(0.5, 0.5);
      sp.body.setSize(an.w, an.h);
      sp.body.setOffset(an.offX, an.offY);
      this.arvoresLista.push(sp);
      this.lifeSystem?.registrarArvore(sp);
    }

    // =========================================================================
    // 2. ÁRVORES DE BOSQUE E CLAREIRA (Posicionamento ecológico estrito)
    // =========================================================================
    // Árvores adicionais distribuídas respeitando os limites da trilha e do rio
    const configsArvoresCenario = [
      // Bosque Sudoeste (Carvalho Ancestral fora da trilha)
      { x: 140, y: 390, tex: 'tree_large_v6_1', w: 44, h: 20, offX: 42, offY: 122, sombra: 'sombra_arvore_v6_grande', sOffX: 16, sOffY: 58 },
      // Margem Elevada Leste além do rio
      { x: 640, y: 380, tex: 'tree_large_v6_2', w: 42, h: 18, offX: 39, offY: 118, sombra: 'sombra_arvore_v6_grande', sOffX: 16, sOffY: 58 },
      // Bosque Noroeste
      { x: 160, y: 160, tex: 'tree_med_v6_1', w: 26, h: 14, offX: 27, offY: 90, sombra: 'sombra_arvore_v6_media', sOffX: 10, sOffY: 44 },
      // Bosque Nordeste (próximo ao penhasco, fora do rio)
      { x: 620, y: 160, tex: 'tree_med_v6_2', w: 28, h: 16, offX: 29, offY: 94, sombra: 'sombra_arvore_v6_media', sOffX: 10, sOffY: 44 },
    ];

    for (const a of configsArvoresCenario) {
      // Validação ecológica preventiva
      GeographicEcosystem.validarPosicionamento('arvore_terrestre', a.x, a.y);

      this.add.image(a.x + a.sOffX, a.y + a.sOffY, a.sombra)
        .setDepth(15)
        .setAlpha(0.60);

      const arvore = this.grupoCenario.create(a.x, a.y, a.tex) as Phaser.Physics.Arcade.Sprite;
      arvore.setOrigin(0.5, 0.5);
      arvore.body.setSize(a.w, a.h);
      arvore.body.setOffset(a.offX, a.offY);
      this.arvoresLista.push(arvore);
      this.lifeSystem?.registrarArvore(arvore);
    }

    // =========================================================================
    // 3. RELEVO E ROCHAS 3D (Desimpedindo a Trilha Principal)
    // =========================================================================
    const configsRochas = [
      // Rocha Grande Noroeste (clareira, y=180 fora da trilha y=230-270)
      { x: 210, y: 180, tex: 'rock_large_v6_1', w: 48, h: 22, offX: 4, offY: 10, sOffX: 6, sOffY: 14, scale: 1 },
      // Rocha Grande na base da elevação da cachoeira (nordeste)
      { x: 510, y: 210, tex: 'rock_large_v6_2', w: 42, h: 18, offX: 3, offY: 10, sOffX: 6, sOffY: 14, scale: 1 },
      // Rocha Pequena no bosque sul
      { x: 170, y: 330, tex: 'rock_small_v6_1', w: 18, h: 10, offX: 3, offY: 4, sOffX: 3, sOffY: 8, scale: 0.8 },
      // Rocha Pequena na colina sul
      { x: 430, y: 420, tex: 'rock_small_v6_2', w: 16, h: 8, offX: 2, offY: 4, sOffX: 3, sOffY: 8, scale: 0.8 },
      // Rocha além do rio no leste
      { x: 630, y: 240, tex: 'rock_small_v6_1', w: 18, h: 10, offX: 3, offY: 4, sOffX: 3, sOffY: 8, scale: 1 },
    ];

    for (const r of configsRochas) {
      GeographicEcosystem.validarPosicionamento('rocha_bloqueadora', r.x, r.y);

      this.add.image(r.x + r.sOffX, r.y + r.sOffY, 'sombra_rocha_v6')
        .setDisplaySize(38 * r.scale, 16 * r.scale)
        .setDepth(15)
        .setAlpha(0.50);

      const rocha = this.grupoCenario.create(r.x, r.y, r.tex) as Phaser.Physics.Arcade.Sprite;
      rocha.setOrigin(0.5, 0.5);
      rocha.body.setSize(r.w, r.h);
      rocha.body.setOffset(r.offX, r.offY);
      this.arvoresLista.push(rocha);
    }

    // =========================================================================
    // 4. TRILHA PRINCIPAL E NAVEGAÇÃO DESIMPEDIDA (Apenas seixos na borda)
    // =========================================================================
    // Pequenos seixos nas bordas da trilha para guiar o olhar sem bloquear Ren
    const seixosTrilha = [
      { x: 180, y: 275 },
      { x: 290, y: 235 },
      { x: 390, y: 320 },
      { x: 370, y: 180 },
    ];
    for (const s of seixosTrilha) {
      this.add.image(s.x, s.y, 'decor_seixos_trilha_v6').setDepth(16);
    }

    // Folhas secas rasteiras em clareiras
    const folhasChao = [
      { x: 340, y: 260 },
      { x: 420, y: 250 },
      { x: 230, y: 310 },
      { x: 340, y: 180 },
    ];
    for (const f of folhasChao) {
      const sp = this.add.image(f.x, f.y, 'folhas_chao_v6').setDepth(17);
      this.lifeSystem?.registrarVegetacao(sp, 'folhas');
    }

    // =========================================================================
    // 5. ECOSSISTEMA RIPÁRIO E VEGETAÇÃO AQUÁTICA (Margens e Rio)
    // =========================================================================
    // Solo úmido e musgo nas margens
    const solosUmidas = [
      { x: 495, y: 275 },
      { x: 510, y: 340 },
      { x: 525, y: 410 },
    ];
    for (const su of solosUmidas) {
      this.add.image(su.x, su.y, 'decor_borda_solo_umido_v6').setDepth(16);
    }

    // Juncos e taboas semiaquáticas enraizadas na beira d'água
    const juncos = [
      { x: 498, y: 290 },
      { x: 515, y: 360 },
      { x: 528, y: 425 },
      { x: 485, y: 240 },
    ];
    for (const j of juncos) {
      const sp = this.add.image(j.x, j.y, 'decor_juncos_v6').setDepth(j.y + 10);
      this.lifeSystem?.registrarVegetacao(sp, 'arbusto');
    }

    // Pedras roladas úmidas na margem do rio
    const pedrasMargem = [
      { x: 505, y: 315 },
      { x: 535, y: 385 },
    ];
    for (const pm of pedrasMargem) {
      this.add.image(pm.x, pm.y, 'decor_pedras_margem_v6').setDepth(18);
    }

    // Vitórias-régias flutuando nos remansos calmos do rio
    const vitorias = [
      { x: 550, y: 305 },
      { x: 580, y: 350 },
    ];
    for (const vr of vitorias) {
      const sp = this.add.image(vr.x, vr.y, 'decor_vitoria_regia_v6').setDepth(17);
      // Leve flutuação de deriva aquática
      this.tweens.add({
        targets: sp,
        x: vr.x + 3,
        y: vr.y + 2,
        rotation: 0.05,
        duration: 2800,
        yoyo: true,
        repeat: -1,
      });
    }

    // Pedras submersas com refração sob a correnteza
    const pedrasSubmersas = [
      { x: 530, y: 295 },
      { x: 565, y: 340 },
    ];
    for (const ps of pedrasSubmersas) {
      this.add.image(ps.x, ps.y, 'decor_pedra_submersa_v6').setDepth(16);
    }

    // Ondulações e reflexos dinâmicos na água
    const ripple1 = this.add.image(530, 310, 'water_ripple_v6').setDepth(18).setAlpha(0.75);
    this.tweens.add({
      targets: ripple1,
      scaleX: { from: 0.7, to: 1.35 },
      scaleY: { from: 0.7, to: 1.35 },
      alpha: { from: 0.8, to: 0 },
      duration: 2600,
      repeat: -1,
    });

    const ripple2 = this.add.image(560, 340, 'water_ripple_v6').setDepth(18).setAlpha(0.75);
    this.tweens.add({
      targets: ripple2,
      scaleX: { from: 0.8, to: 1.4 },
      scaleY: { from: 0.8, to: 1.4 },
      alpha: { from: 0.75, to: 0 },
      duration: 3200,
      delay: 1200,
      repeat: -1,
    });

    // =========================================================================
    // 6. BORDA DA MATA, COGUMELOS E TRANSIÇÃO FLORESTAL
    // =========================================================================
    // Borda de folhagem/arbustos de bosque
    const bordasMata = [
      { x: 120, y: 110 },
      { x: 300, y: 85 },
      { x: 560, y: 95 },
    ];
    for (const bm of bordasMata) {
      this.add.image(bm.x, bm.y, 'decor_borda_mata_v6').setDepth(bm.y + 5);
    }

    // Cogumelos silvestres na umidade das raízes dos carvalhos
    const cogumelos = [
      { x: 185, y: 175 },
      { x: 580, y: 185 },
      { x: 150, y: 410 },
    ];
    for (const c of cogumelos) {
      this.add.image(c.x, c.y, 'decor_cogumelos_floresta_v6').setDepth(20);
    }

    // Arbustos com bagas silvestres e flores brancas
    const arbustos = [
      { x: 260, y: 135, tex: 'bush_v6_1' },
      { x: 550, y: 350, tex: 'bush_v6_1' },
      { x: 210, y: 370, tex: 'bush_v6_2' },
      { x: 470, y: 120, tex: 'bush_v6_2' },
    ];
    for (const arb of arbustos) {
      const sp = this.add.image(arb.x, arb.y, arb.tex);
      sp.setOrigin(0.5, 0.5);
      this.arvoresLista.push(sp);
      this.lifeSystem?.registrarVegetacao(sp, 'arbusto');
    }

    // Flores silvestres campestres
    const flores = [
      { x: 270, y: 295 },
      { x: 390, y: 205 },
      { x: 330, y: 390 },
    ];
    for (const fl of flores) {
      const sp = this.add.image(fl.x, fl.y, 'decor_flores_v6').setDepth(20);
      this.lifeSystem?.registrarVegetacao(sp, 'flor');
    }

    // =========================================================================
    // 7. SISTEMA DE VIDA ECOLÓGICA DINÂMICA (Fauna, Insetos, Abelhas, Pássaros)
    // =========================================================================
    this.lifeSystem?.configurarRegiao(this.regiao, mapWidthPx, mapHeightPx);

    // =========================================================================
    // 8. PRIMEIRO PLANO E ATMOSFERA (Canopy & Raios Volumétricos)
    // =========================================================================
    const fgLeft = this.add.image(0, 0, 'canopy_foreground_left_v6').setOrigin(0, 0).setDepth(10000);
    const fgRight = this.add.image(mapWidthPx, 0, 'canopy_foreground_right_v6').setOrigin(1, 0).setDepth(10000);

    const sunbeam = this.add.image(220, 80, 'sunbeam_v6')
      .setOrigin(0.5, 0.2)
      .setDepth(9900)
      .setAlpha(0.65)
      .setBlendMode(Phaser.BlendModes.ADD);

    this.tweens.add({
      targets: sunbeam,
      alpha: { from: 0.50, to: 0.85 },
      duration: 3600,
      yoyo: true,
      repeat: -1,
    });
  }

  /**
   * Gera o grid 24x16 de 32x32 com estrada central, lago natural e variações de terreno
   */
  private gerarGridSala(regiao: string, cols: number, rows: number): number[][] {
    const grid: number[][] = [];
    const tileAreia = 14;

    for (let y = 0; y < rows; y++) {
      const linha: number[] = [];
      for (let x = 0; x < cols; x++) {
        // No Vale Verdejante, a muralha de tijolos/pedra talhada de contenção de debug é 100% REMOVIDA!
        // As fronteiras são ecológicas: floresta densa e canópios ao norte, bosques e rio ao leste.
        if (regiao === 'valeVerdejante') {
          linha.push(-1);
        }
        // Paredes externas de contorno para masmorras ou áreas fechadas
        else if (x === 0 || x === cols - 1 || y === 0 || y === rows - 1) {
          linha.push(10);
        }
        // Lago natural no quadrante direito inferior para outras regiões
        else if (
          regiao !== 'desertoKaal' &&
          ((x >= 13 && x <= 16 && y >= 9 && y <= 11) || (x === 14 && y === 12))
        ) {
          const wave = (x + y) % 2 === 0 ? 11 : 12;
          linha.push(wave);
        }
        // Caminho central de terra batida (índice 5: estrada centro)
        else if (x === 12 || (y === 8 && x >= 4 && x <= 20)) {
          linha.push(5);
        }
        // Variações de terreno natural
        else {
          if (regiao === 'desertoKaal') {
            linha.push(tileAreia);
          } else {
            linha.push(0);
          }
        }
      }
      grid.push(linha);
    }

    return grid;
  }
}

