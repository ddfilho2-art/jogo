import Phaser from 'phaser';

// =============================================================================
// ELDRIM: ECOS DO PASSADO - ENVIRONMENTAL LIFE SYSTEM (DIRETIVA V8 DEFINITIVA)
// =============================================================================
// Transforma o mundo de Eldrim em um ecossistema 2D vivo e orgânico:
// 1. SISTEMA DE VENTO MULTI-CAMADA:
//    - Cada árvore possui: windPhase, windStrength, windSpeed.
//    - NUNCA animar todas simultaneamente.
//    - Copas oscilam de forma suave e orgânica enquanto troncos ficam ancorados.
//    - Reação sincronizada em: grama, flores, arbustos e folhas.
// 2. FLUXO CONTÍNUO DE ÁGUA:
//    - Cada trecho de rio possui: direction, speed, intensity.
//    - Ondas, espuma nas margens, reflexos cintilantes, turbulências suaves,
//      partículas de correnteza e folhas carregadas pela corrente.
//    - Cachoeira com fluxo vertical e gotículas de névoa.
// 3. INSETOS AMBIENTAIS:
//    - Borboletas (amarelas e azuis), pequenos insetos e vaga-lumes bioluminescentes.
//    - Trajetórias curvas (acelerar, desacelerar, mudar direção, fazer pequenos círculos).
//    - Desaparecem e reaparecem periodicamente em outros canteiros.
// 4. INTERAÇÃO DINÂMICA COM VEGETAÇÃO:
//    - Ao passar por arbustos ou flores: inclinação elástica, desprendimento de
//      partículas de folhas/pétalas e retorno amortecido à posição original.
// 5. FOLHAS CAINDO DAS COPAS:
//    - Folhas ocasionais desprendendo-se das copas e planando no vento até o solo.
// 6. INTERAÇÃO DO HERÓI COM ÁGUA:
//    - Ondas concêntricas e respingos líquidos ao caminhar no rio/lago.
// =============================================================================

export interface ArvoreViva {
  sprite: Phaser.GameObjects.Sprite | Phaser.Physics.Arcade.Sprite;
  baseY: number;
  windPhase: number;
  windStrength: number;
  windSpeed: number;
}

export interface VegetacaoViva {
  sprite: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite;
  x: number;
  y: number;
  windPhase: number;
  windStrength: number;
  windSpeed: number;
  tipo: 'arbusto' | 'flor' | 'folhas';
  tremor: number;
}

export interface TrechoRio {
  id: string;
  x: number;
  y: number;
  direction: { x: number; y: number };
  speed: number;
  intensity: number;
  tipo: 'rio' | 'cachoeira';
}

export interface InsetoVoador {
  sprite: Phaser.GameObjects.Sprite;
  tipo: 'borboleta' | 'vagalume' | 'mosca';
  x: number;
  y: number;
  vx: number;
  vy: number;
  alvoX: number;
  alvoY: number;
  tempoTrocaAlvo: number;
  faseAsa: number;
  velocidadeAsa: number;
  fazendoCirculo: boolean;
  tempoCirculo: number;
  anguloCirculo: number;
  raioCirculo: number;
  vidaRestante: number;
  vidaTotal: number;
  areaMinX: number;
  areaMaxX: number;
  areaMinY: number;
  areaMaxY: number;
}

export interface FolhaRio {
  sprite: Phaser.GameObjects.Image;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotacaoVel: number;
  startX: number;
  startY: number;
  distMax: number;
  distPercorrida: number;
}

export interface FolhaCopaCaindo {
  sprite: Phaser.GameObjects.Image;
  x: number;
  y: number;
  vx: number;
  vy: number;
  swayFase: number;
  rotacaoVel: number;
  vidaRestante: number;
}

export interface AbelhaViva {
  sprite: Phaser.GameObjects.Sprite;
  x: number;
  y: number;
  vx: number;
  vy: number;
  alvoX: number;
  alvoY: number;
  tempoTroca: number;
  faseAsa: number;
  origemX: number;
  origemY: number;
}

export interface PassaroAlto {
  sprite: Phaser.GameObjects.Image;
  x: number;
  y: number;
  vx: number;
  vy: number;
  faseAsa: number;
  escalaBase: number;
}

export interface ElementoBioma {
  gameObject: Phaser.GameObjects.GameObject;
  tipo: 'particula' | 'nevoa' | 'esporo' | 'bolha' | 'ave_distante';
  x: number;
  y: number;
  vx: number;
  vy: number;
  fase: number;
  vidaRestante?: number;
}

export class EnvironmentalLifeSystem {
  private scene: Phaser.Scene;

  // Dinâmica Global do Vento
  private ventoGlobal: number = 0.75;
  private rajadaVento: number = 0;
  private proximaRajadaTempo: number = 5000;
  private duracaoRajada: number = 0;

  // Coleções de Elementos Vivos
  private arvores: ArvoreViva[] = [];
  private vegetacoes: VegetacaoViva[] = [];
  private insetos: InsetoVoador[] = [];
  private abelhas: AbelhaViva[] = [];
  private passarosAltos: PassaroAlto[] = [];
  private elementosBioma: ElementoBioma[] = [];
  private trechosRio: TrechoRio[] = [];
  private ondasRio: Phaser.GameObjects.Image[] = [];
  private folhasRio: FolhaRio[] = [];
  private folhasCaindo: FolhaCopaCaindo[] = [];
  private turbulencias: Phaser.GameObjects.Image[] = [];
  private particulasCachoeira: Phaser.GameObjects.Image[] = [];

  // Região ecológica ativa
  private regiaoAtiva: string = 'valeVerdejante';

  // Efeitos de Interação
  private ultimoSplashTempo: number = 0;
  private ultimaOndaTempo: number = 0;
  private proximaFolhaCopaTempo: number = 2500;
  private proximoPassaroTempo: number = 4000;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.gerarTexturasVida();
    this.configurarTrechosRio();
  }

  /**
   * Gera todas as texturas procedurais necessárias para o mundo vivo
   */
  private gerarTexturasVida(): void {
    const tex = this.scene.textures;

    // 1. Borboleta Amarela (8×8 px)
    if (!tex.exists('borboleta_amarela')) {
      const c = document.createElement('canvas');
      c.width = 8; c.height = 8;
      const ctx = c.getContext('2d')!;
      ctx.fillStyle = '#fde047';
      ctx.fillRect(0, 1, 3, 3);
      ctx.fillRect(5, 1, 3, 3);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(1, 4, 2, 3);
      ctx.fillRect(5, 4, 2, 3);
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(3, 2, 2, 5);
      tex.addCanvas('borboleta_amarela', c);
    }

    // 2. Borboleta Azul (8×8 px)
    if (!tex.exists('borboleta_azul')) {
      const c = document.createElement('canvas');
      c.width = 8; c.height = 8;
      const ctx = c.getContext('2d')!;
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(0, 1, 3, 3);
      ctx.fillRect(5, 1, 3, 3);
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(1, 4, 2, 3);
      ctx.fillRect(5, 4, 2, 3);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(3, 2, 2, 5);
      tex.addCanvas('borboleta_azul', c);
    }

    // 3. Vaga-lume com Halo Glow (12×12 px)
    if (!tex.exists('vagalume_luz')) {
      const c = document.createElement('canvas');
      c.width = 12; c.height = 12;
      const ctx = c.getContext('2d')!;
      const grad = ctx.createRadialGradient(6, 6, 1, 6, 6, 6);
      grad.addColorStop(0, '#fef08a');
      grad.addColorStop(0.4, 'rgba(163, 230, 53, 0.7)');
      grad.addColorStop(1, 'rgba(163, 230, 53, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(6, 6, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(5, 5, 2, 2);
      tex.addCanvas('vagalume_luz', c);
    }

    // 4. Mosca / Inseto Rápido (4×4 px)
    if (!tex.exists('mosca_particula')) {
      const c = document.createElement('canvas');
      c.width = 4; c.height = 4;
      const ctx = c.getContext('2d')!;
      ctx.fillStyle = '#292524';
      ctx.fillRect(1, 1, 2, 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.fillRect(0, 0, 1, 2);
      ctx.fillRect(3, 0, 1, 2);
      tex.addCanvas('mosca_particula', c);
    }

    // 5. Onda de Correnteza Direcional do Rio (24×8 px)
    if (!tex.exists('onda_rio_fluxo')) {
      const c = document.createElement('canvas');
      c.width = 24; c.height = 8;
      const ctx = c.getContext('2d')!;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.90)';
      ctx.fillRect(4, 2, 14, 2);
      ctx.fillStyle = 'rgba(186, 230, 253, 0.70)';
      ctx.fillRect(2, 3, 20, 2);
      ctx.fillStyle = 'rgba(125, 211, 252, 0.40)';
      ctx.fillRect(0, 5, 24, 2);
      tex.addCanvas('onda_rio_fluxo', c);
    }

    // 6. Espuma de Margem do Rio (18×6 px)
    if (!tex.exists('espuma_rio_fluxo')) {
      const c = document.createElement('canvas');
      c.width = 18; c.height = 6;
      const ctx = c.getContext('2d')!;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.fillRect(2, 1, 14, 2);
      ctx.fillStyle = 'rgba(224, 242, 254, 0.60)';
      ctx.fillRect(0, 3, 18, 2);
      tex.addCanvas('espuma_rio_fluxo', c);
    }

    // 7. Reflexo Cintilante do Sol na Água (8×8 px)
    if (!tex.exists('reflexo_rio_cintilante')) {
      const c = document.createElement('canvas');
      c.width = 8; c.height = 8;
      const ctx = c.getContext('2d')!;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(3, 1, 2, 6);
      ctx.fillRect(1, 3, 6, 2);
      ctx.fillStyle = '#e0f2fe';
      ctx.fillRect(2, 2, 4, 4);
      tex.addCanvas('reflexo_rio_cintilante', c);
    }

    // 8. Pequena Turbulência / Vórtice na Correnteza (14×14 px)
    if (!tex.exists('turbulencia_rio')) {
      const c = document.createElement('canvas');
      c.width = 14; c.height = 14;
      const ctx = c.getContext('2d')!;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(7, 7, 5, 0, Math.PI * 1.5);
      ctx.stroke();
      tex.addCanvas('turbulencia_rio', c);
    }

    // 9. Folha Flutuante na Água (8×6 px)
    if (!tex.exists('folha_rio')) {
      const c = document.createElement('canvas');
      c.width = 8; c.height = 6;
      const ctx = c.getContext('2d')!;
      ctx.fillStyle = '#b45309';
      ctx.fillRect(2, 1, 4, 4);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(3, 2, 3, 2);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(1, 2, 2, 1);
      tex.addCanvas('folha_rio', c);
    }

    // 10. Folha Caindo da Copa (6×4 px)
    if (!tex.exists('folha_copa_caindo')) {
      const c = document.createElement('canvas');
      c.width = 6; c.height = 4;
      const ctx = c.getContext('2d')!;
      ctx.fillStyle = '#16a34a';
      ctx.fillRect(1, 1, 4, 2);
      ctx.fillStyle = '#86efac';
      ctx.fillRect(2, 0, 2, 2);
      ctx.fillStyle = '#14532d';
      ctx.fillRect(0, 1, 1, 2);
      tex.addCanvas('folha_copa_caindo', c);
    }

    // 11. Anel de Expansão de Ondas na Água (32×18 px)
    if (!tex.exists('anel_onda_agua')) {
      const c = document.createElement('canvas');
      c.width = 32; c.height = 18;
      const ctx = c.getContext('2d')!;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(16, 9, 14, 7, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(125, 211, 252, 0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(16, 9, 11, 5, 0, 0, Math.PI * 2);
      ctx.stroke();
      tex.addCanvas('anel_onda_agua', c);
    }

    // 12. Gota / Respingo de Água (4×4 px)
    if (!tex.exists('gota_splash_agua')) {
      const c = document.createElement('canvas');
      c.width = 4; c.height = 4;
      const ctx = c.getContext('2d')!;
      ctx.fillStyle = '#e0f2fe';
      ctx.fillRect(1, 0, 2, 3);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(1, 1, 1, 2);
      tex.addCanvas('gota_splash_agua', c);
    }

    // 13. Partícula de Névoa de Cachoeira (6×6 px)
    if (!tex.exists('nevoa_cachoeira')) {
      const c = document.createElement('canvas');
      c.width = 6; c.height = 6;
      const ctx = c.getContext('2d')!;
      const g = ctx.createRadialGradient(3, 3, 1, 3, 3, 3);
      g.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
      g.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 6, 6);
      tex.addCanvas('nevoa_cachoeira', c);
    }

    // 14. Folha de Arbusto ao reagir (Rustle) (6×4 px)
    if (!tex.exists('folha_rustle')) {
      const c = document.createElement('canvas');
      c.width = 6; c.height = 4;
      const ctx = c.getContext('2d')!;
      ctx.fillStyle = '#15803d';
      ctx.fillRect(1, 1, 4, 2);
      ctx.fillStyle = '#86efac';
      ctx.fillRect(2, 1, 2, 1);
      tex.addCanvas('folha_rustle', c);
    }

    // 15. Abelha Silvestre (6×6 px) para Vale Verdejante
    if (!tex.exists('abelha_fauna')) {
      const c = document.createElement('canvas');
      c.width = 6; c.height = 6;
      const ctx = c.getContext('2d')!;
      // Corpo listrado amarelo/preto
      ctx.fillStyle = '#facc15';
      ctx.fillRect(1, 2, 4, 3);
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(2, 2, 1, 3);
      ctx.fillRect(4, 2, 1, 3);
      // Asinhas translúcidas vibrantes
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.fillRect(1, 0, 2, 2);
      ctx.fillRect(3, 0, 2, 2);
      tex.addCanvas('abelha_fauna', c);
    }

    // 16. Pássaro Planando no Céu Alto (12×6 px)
    if (!tex.exists('passaro_alto')) {
      const c = document.createElement('canvas');
      c.width = 12; c.height = 6;
      const ctx = c.getContext('2d')!;
      // Silhueta suave em V com corpo aerodinâmico
      ctx.fillStyle = 'rgba(30, 41, 59, 0.70)';
      ctx.fillRect(5, 2, 2, 3); // corpo central
      // Asa esquerda
      ctx.fillRect(2, 1, 3, 2);
      ctx.fillRect(0, 0, 2, 2);
      // Asa direita
      ctx.fillRect(7, 1, 3, 2);
      ctx.fillRect(10, 0, 2, 2);
      tex.addCanvas('passaro_alto', c);
    }

    // 17. Mosquito / Enxame do Charco (4×4 px)
    if (!tex.exists('mosquito_pantano')) {
      const c = document.createElement('canvas');
      c.width = 4; c.height = 4;
      const ctx = c.getContext('2d')!;
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(1, 1, 2, 2);
      ctx.fillStyle = 'rgba(163, 230, 53, 0.5)';
      ctx.fillRect(0, 0, 1, 1);
      ctx.fillRect(3, 0, 1, 1);
      tex.addCanvas('mosquito_pantano', c);
    }

    // 18. Esporo Fúngico Bioluminescente (6×6 px)
    if (!tex.exists('esporo_pantano')) {
      const c = document.createElement('canvas');
      c.width = 6; c.height = 6;
      const ctx = c.getContext('2d')!;
      const g = ctx.createRadialGradient(3, 3, 1, 3, 3, 3);
      g.addColorStop(0, '#a3e635');
      g.addColorStop(0.5, 'rgba(34, 197, 94, 0.6)');
      g.addColorStop(1, 'rgba(34, 197, 94, 0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 6, 6);
      tex.addCanvas('esporo_pantano', c);
    }

    // 19. Bolha Pantanosa / Subaquática (8×8 px)
    if (!tex.exists('bolha_pantano')) {
      const c = document.createElement('canvas');
      c.width = 8; c.height = 8;
      const ctx = c.getContext('2d')!;
      ctx.strokeStyle = 'rgba(186, 230, 253, 0.75)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(4, 4, 3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(3, 2, 1, 1);
      tex.addCanvas('bolha_pantano', c);
    }

    // 20. Névoa Rasteira de Pântano (64×24 px)
    if (!tex.exists('nevoa_pantano')) {
      const c = document.createElement('canvas');
      c.width = 64; c.height = 24;
      const ctx = c.getContext('2d')!;
      const g = ctx.createRadialGradient(32, 12, 4, 32, 12, 28);
      g.addColorStop(0, 'rgba(74, 107, 85, 0.40)');
      g.addColorStop(0.7, 'rgba(74, 107, 85, 0.20)');
      g.addColorStop(1, 'rgba(74, 107, 85, 0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 64, 24);
      tex.addCanvas('nevoa_pantano', c);
    }

    // 21. Cristal de Gelo Cintilante (6×6 px)
    if (!tex.exists('cristal_gelo')) {
      const c = document.createElement('canvas');
      c.width = 6; c.height = 6;
      const ctx = c.getContext('2d')!;
      ctx.fillStyle = '#bae6fd';
      ctx.fillRect(2, 0, 2, 6);
      ctx.fillRect(0, 2, 6, 2);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(2, 2, 2, 2);
      tex.addCanvas('cristal_gelo', c);
    }

    // 22. Poeira de Areia de Kaal (6×4 px)
    if (!tex.exists('poeira_kaal')) {
      const c = document.createElement('canvas');
      c.width = 6; c.height = 4;
      const ctx = c.getContext('2d')!;
      ctx.fillStyle = 'rgba(217, 119, 6, 0.65)';
      ctx.fillRect(1, 1, 4, 2);
      ctx.fillStyle = 'rgba(245, 158, 11, 0.85)';
      ctx.fillRect(2, 1, 2, 2);
      tex.addCanvas('poeira_kaal', c);
    }

    // 23. Abutre de Kaal Distante (16×8 px)
    if (!tex.exists('abutre_kaal')) {
      const c = document.createElement('canvas');
      c.width = 16; c.height = 8;
      const ctx = c.getContext('2d')!;
      ctx.fillStyle = 'rgba(41, 37, 36, 0.65)';
      ctx.fillRect(7, 3, 2, 4);
      ctx.fillRect(3, 2, 4, 3);
      ctx.fillRect(0, 1, 3, 2);
      ctx.fillRect(9, 2, 4, 3);
      ctx.fillRect(13, 1, 3, 2);
      tex.addCanvas('abutre_kaal', c);
    }

    // 24. Águia / Falcão de Penhasco (14×7 px)
    if (!tex.exists('aguia_penhasco')) {
      const c = document.createElement('canvas');
      c.width = 14; c.height = 7;
      const ctx = c.getContext('2d')!;
      ctx.fillStyle = 'rgba(30, 41, 59, 0.75)';
      ctx.fillRect(6, 2, 2, 4);
      ctx.fillRect(2, 1, 4, 2);
      ctx.fillRect(0, 0, 2, 2);
      ctx.fillRect(8, 1, 4, 2);
      ctx.fillRect(12, 0, 2, 2);
      tex.addCanvas('aguia_penhasco', c);
    }
  }

  /**
   * Configuração de trechos de rio com direção, velocidade e intensidade
   */
  private configurarTrechosRio(): void {
    this.trechosRio = [
      // Trecho 1: Entrada do rio no norte
      {
        id: 'trecho_norte',
        x: 520,
        y: 270,
        direction: { x: 0.8, y: 0.6 },
        speed: 22,
        intensity: 0.85,
        tipo: 'rio',
      },
      // Trecho 2: Meio do rio próximo às rochas
      {
        id: 'trecho_centro',
        x: 550,
        y: 330,
        direction: { x: 0.7, y: 0.7 },
        speed: 28,
        intensity: 1.0,
        tipo: 'rio',
      },
      // Trecho 3: Meandro inferior
      {
        id: 'trecho_sul',
        x: 540,
        y: 400,
        direction: { x: 0.5, y: 0.85 },
        speed: 20,
        intensity: 0.80,
        tipo: 'rio',
      },
      // Trecho 4: Queda d'água / Cachoeira vertical na encosta rochosa
      {
        id: 'cachoeira_rocha',
        x: 620,
        y: 240,
        direction: { x: 0.0, y: 1.0 },
        speed: 55,
        intensity: 1.25,
        tipo: 'cachoeira',
      },
    ];
  }

  // ===========================================================================
  // REGISTRO DE ELEMENTOS VIVOS DO CENÁRIO
  // ===========================================================================

  /**
   * Registra uma árvore no sistema de vento.
   * Cada árvore possui windPhase, windStrength e windSpeed independentes.
   * Nunca animam todas simultaneamente!
   */
  registrarArvore(sprite: Phaser.GameObjects.Sprite | Phaser.Physics.Arcade.Sprite): void {
    const oldOriginY = sprite.originY;
    if (oldOriginY !== 0.94) {
      const diffY = (0.94 - oldOriginY) * sprite.height;
      sprite.y += diffY;
      sprite.setOrigin(0.5, 0.94);
      if ((sprite as any).body) {
        ((sprite as any).body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject?.();
      }
    }

    this.arvores.push({
      sprite,
      baseY: sprite.y,
      windPhase: Math.random() * Math.PI * 2,
      windStrength: 0.022 + Math.random() * 0.018,
      windSpeed: 0.85 + Math.random() * 0.45,
    });
  }

  /**
   * Registra arbustos, flores e folhagens para balanço com o vento e reação elástica a passos
   */
  registrarVegetacao(
    sprite: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite,
    tipo: 'arbusto' | 'flor' | 'folhas'
  ): void {
    const oldOriginY = sprite.originY;
    if (oldOriginY !== 0.90) {
      const diffY = (0.90 - oldOriginY) * sprite.height;
      sprite.y += diffY;
      sprite.setOrigin(0.5, 0.90);
    }

    this.vegetacoes.push({
      sprite,
      x: sprite.x,
      y: sprite.y,
      windPhase: Math.random() * Math.PI * 2,
      windStrength: tipo === 'flor' ? 0.065 : tipo === 'arbusto' ? 0.038 : 0.020,
      windSpeed: 0.9 + Math.random() * 0.35,
      tipo,
      tremor: 0,
    });
  }

  /**
   * Inicializa insetos ambientais com trajetórias curvas e ciclos de vida
   */
  inicializarInsetos(): void {
    // 1. Borboletas nos canteiros florais (trajetórias curvas, aceleração e círculos)
    const posBorboletas = [
      { x: 260, y: 290, cor: 'borboleta_amarela', minX: 190, maxX: 350, minY: 220, maxY: 350 },
      { x: 380, y: 210, cor: 'borboleta_azul', minX: 310, maxX: 460, minY: 150, maxY: 270 },
      { x: 220, y: 380, cor: 'borboleta_amarela', minX: 170, maxX: 310, minY: 310, maxY: 440 },
      { x: 470, y: 130, cor: 'borboleta_azul', minX: 410, maxX: 550, minY: 70, maxY: 190 },
    ];

    for (const b of posBorboletas) {
      const sp = this.scene.add.sprite(b.x, b.y, b.cor);
      sp.setDepth(b.y + 40);
      this.insetos.push({
        sprite: sp,
        tipo: 'borboleta',
        x: b.x,
        y: b.y,
        vx: 0,
        vy: 0,
        alvoX: b.x + (Math.random() - 0.5) * 60,
        alvoY: b.y + (Math.random() - 0.5) * 60,
        tempoTrocaAlvo: 1500 + Math.random() * 2000,
        faseAsa: Math.random() * Math.PI,
        velocidadeAsa: 0.026 + Math.random() * 0.010,
        fazendoCirculo: false,
        tempoCirculo: 0,
        anguloCirculo: 0,
        raioCirculo: 8 + Math.random() * 12,
        vidaRestante: 18000 + Math.random() * 12000,
        vidaTotal: 25000,
        areaMinX: b.minX,
        areaMaxX: b.maxX,
        areaMinY: b.minY,
        areaMaxY: b.maxY,
      });
    }

    // 2. Vaga-lumes brilhantes na beira do rio e sob carvalhos
    const posVagalumes = [
      { x: 520, y: 300, minX: 470, maxX: 610, minY: 250, maxY: 390 },
      { x: 570, y: 350, minX: 510, maxX: 640, minY: 280, maxY: 430 },
      { x: 170, y: 170, minX: 120, maxX: 240, minY: 120, maxY: 240 },
      { x: 610, y: 180, minX: 550, maxX: 690, minY: 130, maxY: 250 },
    ];

    for (const v of posVagalumes) {
      const sp = this.scene.add.sprite(v.x, v.y, 'vagalume_luz');
      sp.setDepth(1500);
      sp.setBlendMode(Phaser.BlendModes.ADD);
      this.insetos.push({
        sprite: sp,
        tipo: 'vagalume',
        x: v.x,
        y: v.y,
        vx: 0,
        vy: 0,
        alvoX: v.x + (Math.random() - 0.5) * 50,
        alvoY: v.y + (Math.random() - 0.5) * 50,
        tempoTrocaAlvo: 2000 + Math.random() * 2500,
        faseAsa: Math.random() * Math.PI,
        velocidadeAsa: 0.005,
        fazendoCirculo: false,
        tempoCirculo: 0,
        anguloCirculo: 0,
        raioCirculo: 6,
        vidaRestante: 22000 + Math.random() * 15000,
        vidaTotal: 30000,
        areaMinX: v.minX,
        areaMaxX: v.maxX,
        areaMinY: v.minY,
        areaMaxY: v.maxY,
      });
    }

    // 3. Pequenos insetos zumbindo em enxame suave
    const posMoscas = [
      { x: 260, y: 145, minX: 235, maxX: 295, minY: 125, maxY: 170 },
      { x: 550, y: 345, minX: 525, maxX: 585, minY: 325, maxY: 375 },
    ];

    for (const m of posMoscas) {
      const sp = this.scene.add.sprite(m.x, m.y, 'mosca_particula');
      sp.setDepth(m.y + 20);
      this.insetos.push({
        sprite: sp,
        tipo: 'mosca',
        x: m.x,
        y: m.y,
        vx: 0,
        vy: 0,
        alvoX: m.x,
        alvoY: m.y,
        tempoTrocaAlvo: 500 + Math.random() * 600,
        faseAsa: 0,
        velocidadeAsa: 0.05,
        fazendoCirculo: true,
        tempoCirculo: 1500,
        anguloCirculo: Math.random() * Math.PI * 2,
        raioCirculo: 4 + Math.random() * 6,
        vidaRestante: 12000,
        vidaTotal: 15000,
        areaMinX: m.minX,
        areaMaxX: m.maxX,
        areaMinY: m.minY,
        areaMaxY: m.maxY,
      });
    }
  }

  /**
   * Inicializa abelhas silvestres zumbindo em torno dos canteiros de flores
   */
  inicializarAbelhas(): void {
    const posFlores = [
      { x: 260, y: 170 },
      { x: 340, y: 220 },
      { x: 220, y: 360 },
      { x: 440, y: 310 },
    ];

    for (const p of posFlores) {
      const sp = this.scene.add.sprite(p.x, p.y, 'abelha_fauna');
      sp.setDepth(p.y + 35);
      this.abelhas.push({
        sprite: sp,
        x: p.x,
        y: p.y,
        vx: 0,
        vy: 0,
        alvoX: p.x + (Math.random() - 0.5) * 30,
        alvoY: p.y + (Math.random() - 0.5) * 30,
        tempoTroca: 1200 + Math.random() * 1500,
        faseAsa: Math.random() * Math.PI,
        origemX: p.x,
        origemY: p.y,
      });
    }
  }

  /**
   * Inicializa pássaros no céu alto planando suavemente sobre a copa das árvores
   */
  inicializarPassarosAltos(): void {
    // 2 a 3 pássaros cruzando o céu em altitude elevada (depth 9998)
    for (let i = 0; i < 2; i++) {
      const startX = -30 - i * 180;
      const startY = 40 + i * 50 + Math.random() * 40;
      const sp = this.scene.add.image(startX, startY, 'passaro_alto');
      sp.setDepth(9998);
      sp.setAlpha(0.65);
      sp.setScale(0.9, 0.9);

      this.passarosAltos.push({
        sprite: sp,
        x: startX,
        y: startY,
        vx: 38 + Math.random() * 14,
        vy: 6 + (Math.random() - 0.5) * 8,
        faseAsa: Math.random() * Math.PI,
        escalaBase: 0.9,
      });
    }
  }

  /**
   * Configura o ecossistema completo de acordo com o bioma atual
   */
  configurarRegiao(regiao: string, mapWidthPx: number = 768, mapHeightPx: number = 512): void {
    this.regiaoAtiva = regiao;

    // 1. Limpar elementos de bioma anteriores se houver
    for (const eb of this.elementosBioma) {
      eb.gameObject.destroy();
    }
    this.elementosBioma = [];

    // 2. Configurar fauna e vida ambiental específica para o bioma
    if (regiao === 'valeVerdejante') {
      this.inicializarInsetos();
      this.inicializarAbelhas();
      this.inicializarPassarosAltos();
      this.inicializarFluxoRio();
    } else if (regiao === 'charcoSombrio') {
      // CHARCO SOMBRIO: mosquitos, névoa, fungos bioluminescentes, bolhas
      for (let i = 0; i < 6; i++) {
        const nx = 60 + i * 110;
        const ny = 100 + Math.random() * 300;
        const nev = this.scene.add.image(nx, ny, 'nevoa_pantano');
        nev.setDepth(15);
        nev.setAlpha(0.40);
        this.elementosBioma.push({
          gameObject: nev,
          tipo: 'nevoa',
          x: nx,
          y: ny,
          vx: 8 + Math.random() * 6,
          vy: 0,
          fase: Math.random() * Math.PI,
        });
      }

      // Esporos brilhantes no pântano
      for (let i = 0; i < 8; i++) {
        const ex = 100 + Math.random() * (mapWidthPx - 200);
        const ey = 100 + Math.random() * (mapHeightPx - 200);
        const esp = this.scene.add.image(ex, ey, 'esporo_pantano');
        esp.setDepth(ey + 20);
        esp.setAlpha(0.7);
        this.elementosBioma.push({
          gameObject: esp,
          tipo: 'esporo',
          x: ex,
          y: ey,
          vx: (Math.random() - 0.5) * 10,
          vy: -8 - Math.random() * 10,
          fase: Math.random() * Math.PI,
        });
      }
    } else if (regiao === 'terrasGeladas') {
      // TERRAS GELADAS: cristais de gelo cintilantes e vento frio
      for (let i = 0; i < 12; i++) {
        const gx = Math.random() * mapWidthPx;
        const gy = Math.random() * mapHeightPx;
        const cg = this.scene.add.image(gx, gy, 'cristal_gelo');
        cg.setDepth(gy + 20);
        cg.setAlpha(0.8);
        this.elementosBioma.push({
          gameObject: cg,
          tipo: 'particula',
          x: gx,
          y: gy,
          vx: -25 - Math.random() * 20,
          vy: 20 + Math.random() * 20,
          fase: Math.random() * Math.PI,
        });
      }
    } else if (regiao === 'desertoKaal') {
      // DESERTO DE KAAL: poeira de areia e abutres distantes
      for (let i = 0; i < 10; i++) {
        const px = Math.random() * mapWidthPx;
        const py = Math.random() * mapHeightPx;
        const part = this.scene.add.image(px, py, 'poeira_kaal');
        part.setDepth(py + 10);
        part.setAlpha(0.65);
        this.elementosBioma.push({
          gameObject: part,
          tipo: 'particula',
          x: px,
          y: py,
          vx: 50 + Math.random() * 40,
          vy: (Math.random() - 0.5) * 12,
          fase: Math.random() * Math.PI,
        });
      }

      // Abutre distante planando em círculos
      const ab = this.scene.add.image(300, 80, 'abutre_kaal');
      ab.setDepth(9998);
      ab.setAlpha(0.6);
      this.elementosBioma.push({
        gameObject: ab,
        tipo: 'ave_distante',
        x: 300,
        y: 80,
        vx: 18,
        vy: 0,
        fase: 0,
      });
    } else if (regiao === 'penhascosPedra') {
      // PENHASCOS: vento forte e águia de penhasco
      const ag = this.scene.add.image(100, 60, 'aguia_penhasco');
      ag.setDepth(9998);
      ag.setAlpha(0.7);
      this.elementosBioma.push({
        gameObject: ag,
        tipo: 'ave_distante',
        x: 100,
        y: 60,
        vx: 45,
        vy: 8,
        fase: 0,
      });
    } else if (regiao === 'ruinasSubmersas') {
      // RUÍNAS SUBMERSAS: bolhas aquáticas subindo continuamente
      for (let i = 0; i < 10; i++) {
        const bx = 80 + Math.random() * (mapWidthPx - 160);
        const by = 150 + Math.random() * (mapHeightPx - 200);
        const bol = this.scene.add.image(bx, by, 'bolha_pantano');
        bol.setDepth(20);
        bol.setAlpha(0.65);
        this.elementosBioma.push({
          gameObject: bol,
          tipo: 'bolha',
          x: bx,
          y: by,
          vx: (Math.random() - 0.5) * 8,
          vy: -22 - Math.random() * 15,
          fase: Math.random() * Math.PI,
        });
      }
    }
  }

  /**
   * Inicializa o fluxo vivo do rio com ondas, espuma, reflexos e correnteza contínua
   */
  inicializarFluxoRio(): void {
    // 1. Ondas de correnteza fluindo ao longo de cada trecho do rio
    const posOndas = [
      { x: 500, y: 280, scale: 0.85, rot: 0.5 },
      { x: 540, y: 310, scale: 1.15, rot: 0.6 },
      { x: 520, y: 350, scale: 0.95, rot: 0.7 },
      { x: 570, y: 370, scale: 1.25, rot: 0.5 },
      { x: 530, y: 410, scale: 0.90, rot: 0.8 },
    ];

    for (const o of posOndas) {
      const onda = this.scene.add.image(o.x, o.y, 'onda_rio_fluxo');
      onda.setDepth(16);
      onda.setScale(o.scale, o.scale);
      onda.setRotation(o.rot);
      onda.setAlpha(0.65);
      this.ondasRio.push(onda);

      // Movimento contínuo de correnteza
      this.scene.tweens.add({
        targets: onda,
        x: o.x + 36,
        y: o.y + 26,
        alpha: { from: 0.25, to: 0.85 },
        duration: 2000 + Math.random() * 700,
        yoyo: true,
        repeat: -1,
      });
    }

    // 2. Espuma nas margens rochosas do rio
    const posEspumas = [
      { x: 485, y: 275 },
      { x: 585, y: 315 },
      { x: 505, y: 360 },
      { x: 605, y: 380 },
    ];
    for (const esp of posEspumas) {
      const sp = this.scene.add.image(esp.x, esp.y, 'espuma_rio_fluxo');
      sp.setDepth(17);
      sp.setAlpha(0.55);
      this.scene.tweens.add({
        targets: sp,
        scaleX: { from: 0.8, to: 1.1 },
        alpha: { from: 0.35, to: 0.75 },
        duration: 1400 + Math.random() * 600,
        yoyo: true,
        repeat: -1,
      });
    }

    // 3. Reflexos cintilantes do sol
    const posReflexos = [
      { x: 515, y: 295 },
      { x: 560, y: 340 },
      { x: 535, y: 385 },
    ];
    for (const ref of posReflexos) {
      const sp = this.scene.add.image(ref.x, ref.y, 'reflexo_rio_cintilante');
      sp.setDepth(18);
      sp.setAlpha(0);
      sp.setBlendMode(Phaser.BlendModes.ADD);
      this.scene.tweens.add({
        targets: sp,
        alpha: { from: 0, to: 0.85 },
        scale: { from: 0.4, to: 1.2 },
        duration: 1100 + Math.random() * 800,
        delay: Math.random() * 1500,
        yoyo: true,
        repeat: -1,
      });
    }

    // 4. Turbulências / Vórtices na água
    const turb1 = this.scene.add.image(530, 325, 'turbulencia_rio');
    turb1.setDepth(17);
    turb1.setAlpha(0.45);
    this.scene.tweens.add({
      targets: turb1,
      rotation: Math.PI * 2,
      duration: 3500,
      repeat: -1,
    });
    this.turbulencias.push(turb1);

    // 5. Folhas flutuantes na água carregadas pela correnteza
    const posFolhas = [
      { startX: 490, startY: 270, distMax: 170 },
      { startX: 520, startY: 300, distMax: 150 },
      { startX: 510, startY: 340, distMax: 160 },
    ];

    for (const f of posFolhas) {
      const sp = this.scene.add.image(f.startX, f.startY, 'folha_rio');
      sp.setDepth(17);
      this.folhasRio.push({
        sprite: sp,
        x: f.startX,
        y: f.startY,
        vx: 16 + Math.random() * 8,
        vy: 12 + Math.random() * 6,
        rotacaoVel: (Math.random() - 0.5) * 0.02,
        startX: f.startX,
        startY: f.startY,
        distMax: f.distMax,
        distPercorrida: Math.random() * f.distMax,
      });
    }

    // 6. Fluxo vertical de cachoeira na encosta rochosa
    for (let i = 0; i < 6; i++) {
      const p = this.scene.add.image(620 + (Math.random() - 0.5) * 8, 225 + i * 5, 'nevoa_cachoeira');
      p.setDepth(25);
      p.setAlpha(0.65);
      this.particulasCachoeira.push(p);

      this.scene.tweens.add({
        targets: p,
        y: p.y + 28,
        alpha: { from: 0.8, to: 0.1 },
        duration: 450 + Math.random() * 200,
        repeat: -1,
      });
    }
  }

  // ===========================================================================
  // UPDATE PRINCIPAL INTEGRADO AO GAME LOOP
  // ===========================================================================

  update(time: number, delta: number, heroiX: number, heroiY: number, heroiEmMovimento: boolean): void {
    // 1. Atualizar dinâmica contínua do vento e rajadas
    this.atualizarVento(time, delta);

    // 2. Atualizar árvores com oscilação assíncrona
    this.atualizarArvores(time);

    // 3. Atualizar vegetação (arbustos, flores, folhas) e reação aos passos de Ren
    this.atualizarVegetacao(time, delta, heroiX, heroiY);

    // 4. Atualizar insetos com trajetórias curvas, círculos e renascimento
    this.atualizarInsetos(time, delta);

    // 5. Atualizar fluxo contínuo do rio e folhas na correnteza
    this.atualizarFluxoRio(delta);

    // 6. Gerar folhas ocasionais caindo das copas das árvores
    this.atualizarFolhasCaindo(time, delta);

    // 7. Atualizar interação de Ren com a água
    this.atualizarInteracaoAgua(time, heroiX, heroiY, heroiEmMovimento);

    // 8. Atualizar abelhas nos canteiros florais (Vale Verdejante)
    this.atualizarAbelhas(time, delta);

    // 9. Atualizar pássaros planando no céu alto
    this.atualizarPassarosAltos(time, delta);

    // 10. Atualizar elementos atmosféricos específicos do bioma
    this.atualizarElementosBioma(time, delta);
  }

  /**
   * Simula a velocidade contínua do vento e rajadas periódicas orgânicas
   */
  private atualizarVento(time: number, delta: number): void {
    // Vento base senoidal composto
    this.ventoGlobal = 0.75 + 0.35 * Math.sin(time * 0.00075) + 0.15 * Math.sin(time * 0.0021);

    // Rajada de vento periódica a cada ~7-11 segundos
    if (time > this.proximaRajadaTempo) {
      this.rajadaVento = 0.85 + Math.random() * 0.65;
      this.duracaoRajada = 2400 + Math.random() * 1500;
      this.proximaRajadaTempo = time + 7500 + Math.random() * 4500;
    }

    if (this.rajadaVento > 0) {
      this.rajadaVento -= (delta / this.duracaoRajada) * 0.85;
      if (this.rajadaVento < 0) this.rajadaVento = 0;
    }
  }

  /**
   * Oscilação das árvores com windPhase, windStrength e windSpeed independentes
   */
  private atualizarArvores(time: number): void {
    const intensidadeVento = this.ventoGlobal + this.rajadaVento;

    for (const arvore of this.arvores) {
      // Cálculo orgânico individual
      const tempoLocal = time * 0.0012 * arvore.windSpeed + arvore.windPhase;
      const osc = Math.sin(tempoLocal);
      const angulo = osc * arvore.windStrength * intensidadeVento;
      arvore.sprite.rotation = angulo;

      // Deformação elástica sutil na copa
      const stretch = Math.cos(tempoLocal * 1.2) * 0.015 * intensidadeVento;
      arvore.sprite.scaleY = 1 + stretch;
      arvore.sprite.scaleX = 1 - stretch * 0.5;
    }
  }

  /**
   * Movimento de arbustos/flores com o vento e reação elástica a passos
   */
  private atualizarVegetacao(time: number, delta: number, heroiX: number, heroiY: number): void {
    const intensidadeVento = this.ventoGlobal + this.rajadaVento;

    for (const item of this.vegetacoes) {
      // 1. Reação física quando Ren passa por cima/próximo
      const dx = heroiX - item.x;
      const dy = heroiY - item.y;
      const dist = Math.hypot(dx, dy);

      if (dist < 26) {
        const forca = (26 - dist) / 26;
        item.tremor = (dx < 0 ? 0.30 : -0.30) * forca;

        // Desprender partículas de folhas/pétalas
        if (Math.random() < 0.09) {
          this.emitirParticulaRustle(item.x + (Math.random() - 0.5) * 14, item.y - 10);
        }
      }

      // Amortecimento do tremor elástico
      if (Math.abs(item.tremor) > 0.005) {
        item.tremor *= 0.88;
      } else {
        item.tremor = 0;
      }

      // 2. Balanço orgânico sincronizado com o vento
      const osc = Math.sin(time * 0.0025 * item.windSpeed + item.windPhase) * item.windStrength * intensidadeVento;
      item.sprite.rotation = osc + item.tremor;
    }
  }

  /**
   * Insetos ambientais: trajetórias curvas, aceleração, círculos e desaparecimento
   */
  private atualizarInsetos(time: number, delta: number): void {
    const dt = delta / 1000;

    for (const ins of this.insetos) {
      ins.vidaRestante -= delta;

      // Se a vida expirar, desvanecer e renascer em outro ponto
      if (ins.vidaRestante <= 0) {
        ins.x = ins.areaMinX + Math.random() * (ins.areaMaxX - ins.areaMinX);
        ins.y = ins.areaMinY + Math.random() * (ins.areaMaxY - ins.areaMinY);
        ins.alvoX = ins.x + (Math.random() - 0.5) * 40;
        ins.alvoY = ins.y + (Math.random() - 0.5) * 40;
        ins.vidaRestante = ins.vidaTotal * (0.8 + Math.random() * 0.4);
        ins.sprite.setAlpha(0.2);
        this.scene.tweens.add({
          targets: ins.sprite,
          alpha: ins.tipo === 'vagalume' ? 0.9 : 1,
          duration: 1200,
        });
        continue;
      }

      // 1. Alternância entre voo direcional curvo e pequenos círculos
      ins.tempoCirculo -= delta;
      if (ins.tempoCirculo <= 0) {
        ins.fazendoCirculo = Math.random() < 0.35; // 35% de chance de fazer loops
        ins.tempoCirculo = ins.fazendoCirculo ? 1200 + Math.random() * 1500 : 2500 + Math.random() * 3000;
      }

      if (ins.fazendoCirculo) {
        // Voo em pequenos círculos
        ins.anguloCirculo += (ins.tipo === 'borboleta' ? 3.5 : 5.0) * dt;
        const circX = Math.cos(ins.anguloCirculo) * ins.raioCirculo;
        const circY = Math.sin(ins.anguloCirculo) * ins.raioCirculo * 0.7;
        ins.x += circX * dt * 2.5;
        ins.y += circY * dt * 2.5;
      } else {
        // Voo com curvas suaves e aceleração até o alvo
        ins.tempoTrocaAlvo -= delta;
        if (ins.tempoTrocaAlvo <= 0) {
          ins.alvoX = ins.areaMinX + Math.random() * (ins.areaMaxX - ins.areaMinX);
          ins.alvoY = ins.areaMinY + Math.random() * (ins.areaMaxY - ins.areaMinY);
          ins.tempoTrocaAlvo = ins.tipo === 'borboleta' ? 1600 + Math.random() * 2000 : 800 + Math.random() * 1200;
        }

        const dx = ins.alvoX - ins.x;
        const dy = ins.alvoY - ins.y;
        const dist = Math.hypot(dx, dy);

        const maxVel = ins.tipo === 'borboleta' ? 26 : ins.tipo === 'vagalume' ? 14 : 38;
        const accel = ins.tipo === 'borboleta' ? 42 : ins.tipo === 'vagalume' ? 22 : 85;

        if (dist > 4) {
          ins.vx += (dx / dist) * accel * dt;
          ins.vy += (dy / dist) * accel * dt;
        }

        // Resistência do ar
        ins.vx *= 0.93;
        ins.vy *= 0.93;

        const vel = Math.hypot(ins.vx, ins.vy);
        if (vel > maxVel) {
          ins.vx = (ins.vx / vel) * maxVel;
          ins.vy = (ins.vy / vel) * maxVel;
        }

        ins.x += ins.vx * dt;
        ins.y += ins.vy * dt;
      }

      // Flutuação vertical orgânica
      const floatY = Math.sin(time * 0.005 + ins.faseAsa) * (ins.tipo === 'borboleta' ? 2.2 : 1.2);
      ins.sprite.setPosition(ins.x, ins.y + floatY);

      // 2. Batimento de asas e brilho
      if (ins.tipo === 'borboleta') {
        const flap = Math.sin(time * ins.velocidadeAsa + ins.faseAsa);
        ins.sprite.scaleX = Math.abs(flap) > 0.15 ? flap : 0.15;
      } else if (ins.tipo === 'vagalume') {
        const pulso = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(time * 0.004 + ins.faseAsa));
        ins.sprite.setAlpha(pulso);
      }
    }
  }

  /**
   * Movimenta folhas flutuantes na água ao longo da correnteza
   */
  private atualizarFluxoRio(delta: number): void {
    const dt = delta / 1000;

    for (const f of this.folhasRio) {
      f.x += f.vx * dt;
      f.y += f.vy * dt;
      f.distPercorrida += Math.hypot(f.vx, f.vy) * dt;
      f.sprite.rotation += f.rotacaoVel;

      // Reinicia na nascente quando atinge a distância máxima do leito
      if (f.distPercorrida >= f.distMax) {
        f.x = f.startX;
        f.y = f.startY;
        f.distPercorrida = 0;
      }

      f.sprite.setPosition(f.x, f.y);
    }
  }

  /**
   * Gera e atualiza folhas ocasionais caindo das copas das árvores
   */
  private atualizarFolhasCaindo(time: number, delta: number): void {
    const dt = delta / 1000;

    // Gerar nova folha a cada ~3-5 segundos
    if (time > this.proximaFolhaCopaTempo && this.arvores.length > 0) {
      const arvoreRandom = this.arvores[Math.floor(Math.random() * this.arvores.length)];
      const spawnX = arvoreRandom.sprite.x + (Math.random() - 0.5) * 45;
      const spawnY = arvoreRandom.sprite.y - 85 + Math.random() * 25;

      const sp = this.scene.add.image(spawnX, spawnY, 'folha_copa_caindo');
      sp.setDepth(spawnY + 30);
      sp.setAlpha(0.9);

      this.folhasCaindo.push({
        sprite: sp,
        x: spawnX,
        y: spawnY,
        vx: 12 + (this.ventoGlobal + this.rajadaVento) * 15,
        vy: 18 + Math.random() * 10,
        swayFase: Math.random() * Math.PI,
        rotacaoVel: (Math.random() - 0.5) * 0.04,
        vidaRestante: 3200 + Math.random() * 1000,
      });

      this.proximaFolhaCopaTempo = time + 3000 + Math.random() * 3000;
    }

    // Atualizar folhas caindo
    for (let i = this.folhasCaindo.length - 1; i >= 0; i--) {
      const f = this.folhasCaindo[i];
      f.vidaRestante -= delta;

      // Oscilação lateral suave levada pelo vento
      const sway = Math.sin(time * 0.004 + f.swayFase) * 8;
      f.x += (f.vx + sway) * dt;
      f.y += f.vy * dt;
      f.sprite.rotation += f.rotacaoVel;

      f.sprite.setPosition(f.x, f.y);

      // Ao fim da vida, desvanece e é destruída
      if (f.vidaRestante <= 600) {
        f.sprite.setAlpha(f.vidaRestante / 600);
      }

      if (f.vidaRestante <= 0) {
        f.sprite.destroy();
        this.folhasCaindo.splice(i, 1);
      }
    }
  }

  /**
   * Interação do Herói com a Água: ondas concêntricas e respingos
   */
  private atualizarInteracaoAgua(time: number, heroiX: number, heroiY: number, emMovimento: boolean): void {
    // Zona do lago/rio no Vale Verdejante: x entre 480 e 640, y entre 250 e 440
    const estaNaAgua = heroiX >= 480 && heroiX <= 640 && heroiY >= 250 && heroiY <= 440;
    if (!estaNaAgua) return;

    const intervaloOnda = emMovimento ? 240 : 800;
    if (time - this.ultimaOndaTempo > intervaloOnda) {
      this.emitirOndaAgua(heroiX, heroiY + 18);
      this.ultimaOndaTempo = time;
    }

    if (emMovimento && time - this.ultimoSplashTempo > 180) {
      this.emitirRespingosAgua(heroiX, heroiY + 20);
      this.ultimoSplashTempo = time;
    }
  }

  /**
   * Emite uma onda circular na água
   */
  private emitirOndaAgua(x: number, y: number): void {
    const onda = this.scene.add.image(x, y, 'anel_onda_agua');
    onda.setDepth(18);
    onda.setScale(0.3, 0.3);
    onda.setAlpha(0.85);

    this.scene.tweens.add({
      targets: onda,
      scaleX: 1.25,
      scaleY: 1.15,
      alpha: 0,
      duration: 750,
      onComplete: () => {
        onda.destroy();
      },
    });
  }

  /**
   * Emite gotículas de água espirrando
   */
  private emitirRespingosAgua(x: number, y: number): void {
    for (let i = 0; i < 4; i++) {
      const sp = this.scene.add.image(x + (Math.random() - 0.5) * 16, y, 'gota_splash_agua');
      sp.setDepth(y + 20);

      const vx = (Math.random() - 0.5) * 35;
      const vy = -30 - Math.random() * 25;

      this.scene.tweens.add({
        targets: sp,
        x: sp.x + vx * 0.4,
        y: sp.y + vy * 0.4,
        alpha: 0,
        scaleX: 0.5,
        scaleY: 0.5,
        duration: 350 + Math.random() * 150,
        onComplete: () => {
          sp.destroy();
        },
      });
    }
  }

  /**
   * Desprende partículas de folhas/pétalas ao atravessar vegetação
   */
  private emitirParticulaRustle(x: number, y: number): void {
    const folha = this.scene.add.image(x, y, 'folha_rustle');
    folha.setDepth(y + 25);
    folha.setRotation(Math.random() * Math.PI);

    const dirX = (Math.random() - 0.5) * 28;
    const dirY = -12 - Math.random() * 14;

    this.scene.tweens.add({
      targets: folha,
      x: x + dirX,
      y: y + dirY,
      rotation: folha.rotation + (Math.random() - 0.5) * 2,
      alpha: 0,
      duration: 500,
      onComplete: () => {
        folha.destroy();
      },
    });
  }

  /**
   * Atualiza o voo orgânico das abelhas com flutuação e zumbido entre flores
   */
  private atualizarAbelhas(time: number, delta: number): void {
    const dt = delta / 1000;

    for (const ab of this.abelhas) {
      ab.tempoTroca -= delta;
      if (ab.tempoTroca <= 0) {
        ab.alvoX = ab.origemX + (Math.random() - 0.5) * 45;
        ab.alvoY = ab.origemY + (Math.random() - 0.5) * 35;
        ab.tempoTroca = 1400 + Math.random() * 1800;
      }

      const dx = ab.alvoX - ab.x;
      const dy = ab.alvoY - ab.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 2) {
        ab.vx += (dx / dist) * 35 * dt;
        ab.vy += (dy / dist) * 35 * dt;
      }

      ab.vx *= 0.90;
      ab.vy *= 0.90;

      ab.x += ab.vx * dt;
      ab.y += ab.vy * dt;

      // Micro-vibração rápida das asas (zumbido)
      const buzzY = Math.sin(time * 0.04 + ab.faseAsa) * 1.5;
      const buzzX = Math.cos(time * 0.03 + ab.faseAsa) * 1.0;
      ab.sprite.setPosition(ab.x + buzzX, ab.y + buzzY);

      // Flap de asas
      const flap = Math.sin(time * 0.05);
      ab.sprite.scaleX = flap > 0 ? 1 : -1;
    }
  }

  /**
   * Atualiza a trajetória dos pássaros no céu alto
   */
  private atualizarPassarosAltos(time: number, delta: number): void {
    const dt = delta / 1000;

    // Spawn periódico de novos pássaros se todos saíram da tela
    if (time > this.proximoPassaroTempo && this.passarosAltos.length < 2) {
      const sp = this.scene.add.image(-40, 50 + Math.random() * 100, 'passaro_alto');
      sp.setDepth(9998);
      sp.setAlpha(0.65);
      this.passarosAltos.push({
        sprite: sp,
        x: -40,
        y: 50 + Math.random() * 100,
        vx: 36 + Math.random() * 16,
        vy: 4 + (Math.random() - 0.5) * 6,
        faseAsa: Math.random() * Math.PI,
        escalaBase: 0.9,
      });
      this.proximoPassaroTempo = time + 10000 + Math.random() * 8000;
    }

    for (let i = this.passarosAltos.length - 1; i >= 0; i--) {
      const p = this.passarosAltos[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      // Suave batimento de asas e ondulação de altitude
      const flap = Math.sin(time * 0.008 + p.faseAsa);
      p.sprite.scaleY = p.escalaBase * (0.8 + 0.3 * flap);
      p.sprite.setPosition(p.x, p.y + flap * 2);

      // Remove se saiu da tela pelo leste
      if (p.x > 820) {
        p.sprite.destroy();
        this.passarosAltos.splice(i, 1);
      }
    }
  }

  /**
   * Atualiza elementos específicos dos biomas não-vale (névoa, esporos, cristais, areia, bolhas)
   */
  private atualizarElementosBioma(time: number, delta: number): void {
    const dt = delta / 1000;

    for (const eb of this.elementosBioma) {
      eb.x += eb.vx * dt;
      eb.y += eb.vy * dt;

      if (eb.tipo === 'nevoa') {
        const img = eb.gameObject as Phaser.GameObjects.Image;
        img.x = eb.x;
        // Reinicia a névoa ao sair
        if (eb.x > 840) eb.x = -80;
        img.setAlpha(0.25 + 0.15 * Math.sin(time * 0.001 + eb.fase));
      } else if (eb.tipo === 'esporo') {
        const img = eb.gameObject as Phaser.GameObjects.Image;
        const floatX = Math.sin(time * 0.003 + eb.fase) * 12;
        img.setPosition(eb.x + floatX, eb.y);
        if (eb.y < -20) {
          eb.y = 520;
          eb.x = 100 + Math.random() * 560;
        }
      } else if (eb.tipo === 'particula') {
        const img = eb.gameObject as Phaser.GameObjects.Image;
        img.setPosition(eb.x, eb.y);
        // Regeneração cíclica de areia/gelo
        if (eb.x > 800 || eb.x < -20 || eb.y > 540 || eb.y < -20) {
          eb.x = Math.random() * 768;
          eb.y = Math.random() * 512;
        }
      } else if (eb.tipo === 'bolha') {
        const img = eb.gameObject as Phaser.GameObjects.Image;
        const wobble = Math.sin(time * 0.006 + eb.fase) * 4;
        img.setPosition(eb.x + wobble, eb.y);
        if (eb.y < 120) {
          eb.y = 480;
          eb.x = 80 + Math.random() * 600;
        }
      } else if (eb.tipo === 'ave_distante') {
        const img = eb.gameObject as Phaser.GameObjects.Image;
        // Voo em círculo lento
        eb.fase += 0.8 * dt;
        img.setPosition(eb.x + Math.cos(eb.fase) * 90, eb.y + Math.sin(eb.fase) * 45);
      }
    }
  }
}
