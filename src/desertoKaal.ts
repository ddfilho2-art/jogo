import { EstadoJogo, GameState, InimigoEntidade, Retangulo } from './types';
import { soundManager } from './soundEffects';
import { checkAABB } from './combat';

// =============================================================================
// ELDRIM: ECOS DO PASSADO - REGIÃO 4: DESERTO DE KAAL & VILAREJO OÁSIS DE KAAL
// =============================================================================
// Paleta Oficial Exigida:
//   #d4a55a (Areia principal)
//   #e8c07d (Dunas e tons claros)
//   #7a2e12 (Rochas, desfiladeiros e relevo escuro)
// Complementares:
//   Lava: #ef4444 / #f97316 / #fef08a
//   Água do Oásis: #06b6d4 / #0891b2 / #22d3ee
//   Cactos/Vegetação: #2d6a4f / #1b4332 / #f97316
// Dimensões: Grade 3x3 de telas 256x224px = 768x672px
// =============================================================================

export const PALETA_KAAL = {
  areia: '#d4a55a',
  areiaSombra: '#c49348',
  duna: '#e8c07d',
  dunaBorda: '#d8b06d',
  dunaLuz: '#f2d49b',
  rocha: '#7a2e12',
  rochaClara: '#943818',
  rochaSombra: '#561e0c',
  oasisAgua: '#06b6d4',
  oasisAguaProfunda: '#0891b2',
  oasisAguaBorda: '#22d3ee',
  oasisPedra: '#e8c07d',
  cactoCorpo: '#2d6a4f',
  cactoEscuro: '#1b4332',
  cactoFlor: '#f97316',
  palmeiraTronco: '#5c3a21',
  palmeiraFolha: '#15803d',
  palmeiraFolhaClara: '#22c55e',
  lavaBase: '#7a2e12',
  lavaMagma: '#ef4444',
  lavaBrilho: '#f97316',
  lavaCentro: '#fef08a',
};

// -----------------------------------------------------------------------------
// DEFINIÇÃO DE DUNAS DECORATIVAS (Variação de Tom #e8c07d)
// -----------------------------------------------------------------------------

export interface DunaDecorativa {
  x: number;
  y: number;
  w: number;
  h: number;
  pontosCrista: [number, number][]; // Pontos normalizados de curva da crista
}

export const DUNAS_DECORATIVAS: DunaDecorativa[] = [
  // Tela [0,0] - Dunas do Noroeste
  {
    x: 24, y: 32, w: 200, h: 72,
    pontosCrista: [[0, 0.4], [0.3, 0.2], [0.7, 0.35], [1, 0.25]],
  },
  {
    x: 48, y: 128, w: 176, h: 64,
    pontosCrista: [[0, 0.5], [0.4, 0.3], [0.8, 0.45], [1, 0.35]],
  },

  // Tela [1,0] - Caminho do Vulcão / Santuário das Chamas
  {
    x: 272, y: 96, w: 76, h: 96,
    pontosCrista: [[0, 0.3], [0.5, 0.5], [1, 0.4]],
  },
  {
    x: 420, y: 96, w: 76, h: 96,
    pontosCrista: [[0, 0.4], [0.5, 0.3], [1, 0.5]],
  },

  // Tela [2,0] - Platô Flamejante do Nordeste
  {
    x: 528, y: 32, w: 208, h: 80,
    pontosCrista: [[0, 0.35], [0.4, 0.2], [0.8, 0.4], [1, 0.3]],
  },
  {
    x: 544, y: 136, w: 192, h: 64,
    pontosCrista: [[0, 0.4], [0.5, 0.25], [1, 0.45]],
  },

  // Tela [0,1] - Corredor das Serpentes Ocidental
  {
    x: 32, y: 248, w: 192, h: 76,
    pontosCrista: [[0, 0.45], [0.4, 0.3], [0.8, 0.4], [1, 0.3]],
  },
  {
    x: 40, y: 344, w: 184, h: 72,
    pontosCrista: [[0, 0.3], [0.5, 0.45], [1, 0.35]],
  },

  // Tela [1,1] - Oásis de Kaal (Dunas suaves em torno das palmeiras)
  {
    x: 272, y: 380, w: 84, h: 48,
    pontosCrista: [[0, 0.4], [0.5, 0.3], [1, 0.45]],
  },
  {
    x: 412, y: 380, w: 84, h: 48,
    pontosCrista: [[0, 0.35], [0.5, 0.45], [1, 0.3]],
  },

  // Tela [2,1] - Mar de Dunas Oriental
  {
    x: 528, y: 248, w: 208, h: 84,
    pontosCrista: [[0, 0.3], [0.35, 0.45], [0.75, 0.25], [1, 0.4]],
  },
  {
    x: 540, y: 348, w: 196, h: 72,
    pontosCrista: [[0, 0.45], [0.5, 0.25], [1, 0.4]],
  },

  // Tela [0,2] - Dunas da Tumba Enterrada
  {
    x: 32, y: 472, w: 192, h: 80,
    pontosCrista: [[0, 0.35], [0.5, 0.45], [1, 0.3]],
  },
  {
    x: 48, y: 568, w: 176, h: 68,
    pontosCrista: [[0, 0.4], [0.4, 0.25], [1, 0.45]],
  },

  // Tela [1,2] - Dunas do Sul
  {
    x: 272, y: 472, w: 208, h: 72,
    pontosCrista: [[0, 0.3], [0.4, 0.45], [0.8, 0.3], [1, 0.4]],
  },
  {
    x: 288, y: 560, w: 192, h: 76,
    pontosCrista: [[0, 0.45], [0.5, 0.3], [1, 0.4]],
  },

  // Tela [2,2] - Platô dos Ventos Ardentes
  {
    x: 528, y: 472, w: 208, h: 80,
    pontosCrista: [[0, 0.4], [0.35, 0.25], [0.75, 0.45], [1, 0.3]],
  },
  {
    x: 544, y: 568, w: 192, h: 68,
    pontosCrista: [[0, 0.35], [0.5, 0.45], [1, 0.3]],
  },
];

// -----------------------------------------------------------------------------
// DEFINIÇÃO DE POÇOS DE LAVA PEQUENOS NO OVERWORLD
// Instant-damage de 1 ao encostar, empurra o herói para trás 16px.
// -----------------------------------------------------------------------------

export interface PocoLava {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export const POCOS_LAVA_KAAL: PocoLava[] = [
  // Tela [0,0] - Dunas do Noroeste
  { id: 'lava_00_1', x: 80, y: 64, w: 24, h: 20 },
  { id: 'lava_00_2', x: 176, y: 144, w: 28, h: 22 },

  // Tela [1,0] - Caminho do Santuário das Chamas (Aproximação vulcânica)
  { id: 'lava_10_1', x: 288, y: 72, w: 26, h: 22 },
  { id: 'lava_10_2', x: 454, y: 72, w: 26, h: 22 },
  { id: 'lava_10_3', x: 370, y: 124, w: 28, h: 22 },

  // Tela [2,0] - Platô do Nordeste
  { id: 'lava_20_1', x: 580, y: 84, w: 28, h: 22 },
  { id: 'lava_20_2', x: 672, y: 152, w: 24, h: 20 },

  // Tela [0,1] - Desfiladeiro Ocidental
  { id: 'lava_01_1', x: 156, y: 368, w: 24, h: 20 },

  // Tela [2,1] - Dunas do Leste
  { id: 'lava_21_1', x: 616, y: 380, w: 26, h: 20 },

  // Tela [0,2] - Próximo à Tumba Enterrada
  { id: 'lava_02_1', x: 176, y: 536, w: 26, h: 20 },

  // Tela [1,2] - Fissuras do Sul
  { id: 'lava_12_1', x: 320, y: 552, w: 28, h: 22 },
  { id: 'lava_12_2', x: 428, y: 576, w: 26, h: 20 },

  // Tela [2,2] - Cânion dos Ventos
  { id: 'lava_22_1', x: 596, y: 532, w: 30, h: 24 },
];

// -----------------------------------------------------------------------------
// FONTE DE ÁGUA REAL DO OÁSIS DE KAAL
// -----------------------------------------------------------------------------

export const FONTE_OASIS = {
  x: 376,
  y: 328,
  w: 32,
  h: 32,
  raioToque: 24,
};

// -----------------------------------------------------------------------------
// OBSTÁCULOS E COLISÕES FÍSICAS DO DESERTO DE KAAL
// -----------------------------------------------------------------------------

export const OBSTACULOS_DESERTO_KAAL: Retangulo[] = [
  // Bordas Externas do Mapa 3x3 (768x672px)
  // Borda Norte (deixa vão de 64px em x: 352..416 para entrada do Santuário das Chamas)
  { x: 0, y: 0, w: 352, h: 16 },
  { x: 416, y: 0, w: 352, h: 16 },

  // Borda Sul
  { x: 0, y: 656, w: 768, h: 16 },

  // Borda Oeste (deixa vão em y: 240..432 para transição com Charco Sombrio)
  { x: 0, y: 0, w: 16, h: 240 },
  { x: 0, y: 432, w: 16, h: 240 },

  // Borda Leste
  { x: 752, y: 0, w: 16, h: 672 },

  // ---------------------------------------------------------------------------
  // VILAREJO OÁSIS DE KAAL (Tela [1,1]: x: 256..512, y: 224..448)
  // ---------------------------------------------------------------------------
  // Tenda da Anciã Zira (Oeste do Oásis)
  { x: 296, y: 250, w: 48, h: 36, rotulo: 'tenda_zira' },

  // Tenda do Mercador Tariq (Leste do Oásis - Loja Padrão)
  { x: 424, y: 250, w: 48, h: 36, rotulo: 'mercado_tariq' },

  // Fonte do Oásis (Centro do vilarejo)
  { x: 376, y: 328, w: 32, h: 32, rotulo: 'fonte_oasis' },

  // Palmeiras do Oásis (Colisão do tronco 16x16)
  { x: 344, y: 310, w: 16, h: 16, rotulo: 'palmeira' },
  { x: 424, y: 310, w: 16, h: 16, rotulo: 'palmeira' },
  { x: 340, y: 360, w: 16, h: 16, rotulo: 'palmeira' },
  { x: 428, y: 360, w: 16, h: 16, rotulo: 'palmeira' },

  // ---------------------------------------------------------------------------
  // CACTOS COM COLISÃO (Espalhados pelas dunas)
  // ---------------------------------------------------------------------------
  { x: 64, y: 112, w: 16, h: 20, rotulo: 'cacto' },
  { x: 208, y: 88, w: 16, h: 20, rotulo: 'cacto' },
  { x: 104, y: 272, w: 16, h: 20, rotulo: 'cacto' },
  { x: 88, y: 400, w: 16, h: 20, rotulo: 'cacto' },
  { x: 648, y: 104, w: 16, h: 20, rotulo: 'cacto' },
  { x: 544, y: 320, w: 16, h: 20, rotulo: 'cacto' },
  { x: 688, y: 288, w: 16, h: 20, rotulo: 'cacto' },
  { x: 664, y: 440, w: 16, h: 20, rotulo: 'cacto' },
  { x: 112, y: 592, w: 16, h: 20, rotulo: 'cacto' },
  { x: 496, y: 520, w: 16, h: 20, rotulo: 'cacto' },
  { x: 672, y: 600, w: 16, h: 20, rotulo: 'cacto' },
  { x: 280, y: 496, w: 16, h: 20, rotulo: 'cacto' },

  // ---------------------------------------------------------------------------
  // FORMAÇÕES DE ROCHA VERMELHA (#7a2e12)
  // ---------------------------------------------------------------------------
  { x: 144, y: 48, w: 32, h: 32, rotulo: 'rocha' },
  { x: 592, y: 48, w: 40, h: 32, rotulo: 'rocha' },
  { x: 192, y: 288, w: 32, h: 32, rotulo: 'rocha' },
  { x: 656, y: 176, w: 32, h: 48, rotulo: 'rocha' },
  { x: 592, y: 464, w: 36, h: 32, rotulo: 'rocha' },
  { x: 208, y: 528, w: 32, h: 32, rotulo: 'rocha' },
  { x: 368, y: 608, w: 48, h: 32, rotulo: 'rocha' },

  // ---------------------------------------------------------------------------
  // ENTRADAS DE DUNGEONS & SANTUÁRIOS
  // ---------------------------------------------------------------------------
  // Santuário das Chamas (Norte, Tela [1,0]: x: 352, y: 16)
  { x: 352, y: 16, w: 64, h: 32, rotulo: 'entrada_santuario_chamas' },

  // Tumba Enterrada (Sudoeste, Tela [0,2]: x: 64, y: 480)
  { x: 64, y: 480, w: 48, h: 32, rotulo: 'entrada_tumba_enterrada' },
];

// -----------------------------------------------------------------------------
// FÁBRICAS DE INIMIGOS DO DESERTO DE KAAL
// -----------------------------------------------------------------------------

export function criarEscorpiaoAreia(id: string, x: number, y: number): InimigoEntidade {
  return {
    id,
    tipo: 'escorpiao_areia',
    x,
    y,
    w: 16,
    h: 16,
    hp: 3,
    hpMax: 3,
    direcao: 'baixo',
    velocidade: 40,
    iframeTimer: 0,
    vivo: true,
  };
}

export function criarSerpenteDunas(id: string, x: number, y: number): InimigoEntidade {
  return {
    id,
    tipo: 'serpente_dunas',
    x,
    y,
    w: 16,
    h: 14,
    hp: 2,
    hpMax: 2,
    direcao: 'baixo',
    velocidade: 65,
    iframeTimer: 0,
    vivo: true,
    zigueZagueTimer: 0,
  };
}

export function criarInimigosDesertoInicial(): InimigoEntidade[] {
  return [
    criarEscorpiaoAreia('escorpiao_1', 120, 100),
    criarEscorpiaoAreia('escorpiao_2', 620, 140),
    criarSerpenteDunas('serpente_1', 80, 320),
    criarSerpenteDunas('serpente_2', 600, 300),
    criarEscorpiaoAreia('escorpiao_3', 140, 540),
    criarSerpenteDunas('serpente_3', 640, 520),
  ];
}

// -----------------------------------------------------------------------------
// LÓGICA DE ATUALIZAÇÃO DO DESERTO DE KAAL
// -----------------------------------------------------------------------------

export function atualizarDesertoKaal(state: GameState, dt: number) {
  if (state.estadoAtual !== EstadoJogo.OVERWORLD || state.regiaoAtual !== 'kaal') {
    return;
  }

  const heroi = state.heroi;

  // 1. Terreno: Areia (velocidade normal = 100px/s)
  heroi.velocidade = 100;

  // Registrar mapa de exploração de Kaal (grade 9x8)
  if (!state.areasVisitadasKaal) {
    state.areasVisitadasKaal = Array.from({ length: 9 }, () => Array(8).fill(false));
  }
  const colMap = Math.min(8, Math.max(0, Math.floor((heroi.x / state.mapaLargura) * 9)));
  const rowMap = Math.min(7, Math.max(0, Math.floor((heroi.y / state.mapaAltura) * 8)));
  if (state.areasVisitadasKaal[colMap]) {
    state.areasVisitadasKaal[colMap][rowMap] = true;
  }

  // 2. Poços de Lava: Instant-damage de 1 ao encostar, empurra o herói para trás 16px
  if (!heroi.iframes || heroi.iframes <= 0) {
    for (const poco of POCOS_LAVA_KAAL) {
      if (checkAABB(heroi, poco)) {
        // Aplica dano imediato de 1 Fragmento de Vida
        state.vidaAtual = Math.max(0, state.vidaAtual - 1);
        heroi.iframes = 0.8; // iframes de 800ms
        soundManager.playHeroHurt();

        // Empurra o herói 16px na direção oposta ao centro do poço de lava
        const hCenterX = heroi.x + heroi.w / 2;
        const hCenterY = heroi.y + heroi.h / 2;
        const pCenterX = poco.x + poco.w / 2;
        const pCenterY = poco.y + poco.h / 2;
        let dx = hCenterX - pCenterX;
        let dy = hCenterY - pCenterY;
        const dist = Math.hypot(dx, dy) || 1;
        const pushDist = 16;

        heroi.x = Math.max(16, Math.min(state.mapaLargura - 32, heroi.x + (dx / dist) * pushDist));
        heroi.y = Math.max(16, Math.min(state.mapaAltura - 32, heroi.y + (dy / dist) * pushDist));

        // Partículas de faíscas incandescentes
        for (let i = 0; i < 8; i++) {
          state.particulas.push({
            x: heroi.x + 8,
            y: heroi.y + 8,
            vx: (Math.random() - 0.5) * 60,
            vy: -Math.random() * 50 - 20,
            cor: i % 2 === 0 ? PALETA_KAAL.lavaBrilho : PALETA_KAAL.lavaMagma,
            tempoRestante: 0.4,
            tempoTotal: 0.4,
            tamanho: 2,
          });
        }
        break;
      }
    }
  }

  // 3. Fonte de Água Real do Oásis de Kaal (Centro: 392, 344)
  if (state.fonteOasisCooldownTimer && state.fonteOasisCooldownTimer > 0) {
    state.fonteOasisCooldownTimer = Math.max(0, state.fonteOasisCooldownTimer - dt);
  }

  const distFonte = Math.hypot(heroi.x + 8 - 392, heroi.y + 8 - 344);
  if (distFonte <= FONTE_OASIS.raioToque) {
    if ((!state.fonteOasisCooldownTimer || state.fonteOasisCooldownTimer <= 0)) {
      if (state.vidaAtual < state.vidaMax) {
        // Tocar na fonte recupera 1 Fragmento de Vida
        state.vidaAtual = Math.min(state.vidaMax, state.vidaAtual + 1);
        state.fonteOasisCooldownTimer = 4.0; // Cooldown de recarga entre goles
        soundManager.playFountainHeal();

        state.notificacaoTexto = '❤ ÁGUAS DO OÁSIS: +1 FRAGMENTO DE VIDA RECUPERADO!';
        state.notificacaoTimer = 2.5;

        // Partículas brilhantes de água sagrada do oásis
        for (let i = 0; i < 10; i++) {
          state.particulas.push({
            x: 392 + (Math.random() - 0.5) * 20,
            y: 344 + (Math.random() - 0.5) * 20,
            vx: (Math.random() - 0.5) * 30,
            vy: -Math.random() * 35 - 15,
            cor: i % 2 === 0 ? PALETA_KAAL.oasisAguaBorda : '#ffffff',
            tempoRestante: 0.5,
            tempoTotal: 0.5,
            tamanho: 2,
          });
        }
      }
    }
  }

  // 4. Lógica dos Inimigos do Deserto
  if (!state.inimigosVale || state.inimigosVale.length === 0) {
    state.inimigosVale = criarInimigosDesertoInicial();
  }

  state.inimigosVale.forEach((inimigo) => {
    if (!inimigo.vivo) return;

    if (inimigo.iframeTimer > 0) inimigo.iframeTimer -= dt;

    // Colisão com ataque da espada do Herói
    if (heroi.atacando && inimigo.iframeTimer <= 0) {
      let hitArea: Retangulo = { x: 0, y: 0, w: 0, h: 0 };
      if (heroi.direcao === 'cima') hitArea = { x: heroi.x - 2, y: heroi.y - 12, w: 20, h: 14 };
      else if (heroi.direcao === 'baixo') hitArea = { x: heroi.x - 2, y: heroi.y + 16, w: 20, h: 14 };
      else if (heroi.direcao === 'esquerda') hitArea = { x: heroi.x - 12, y: heroi.y - 2, w: 14, h: 20 };
      else if (heroi.direcao === 'direita') hitArea = { x: heroi.x + 16, y: heroi.y - 2, w: 14, h: 20 };

      if (checkAABB(hitArea, inimigo)) {
        inimigo.hp -= 1;
        inimigo.iframeTimer = 0.3;
        soundManager.playEnemyHit();

        if (inimigo.hp <= 0) {
          inimigo.vivo = false;
          soundManager.playEnemyDeath();
          state.selos += Math.floor(Math.random() * 3) + 2;
        }
      }
    }

    // Comportamento do Escorpião de Areia (40px/s)
    if (inimigo.tipo === 'escorpiao_areia') {
      const dx = heroi.x - inimigo.x;
      const dy = heroi.y - inimigo.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 4 && dist < 140) {
        inimigo.x += (dx / dist) * inimigo.velocidade * dt;
        inimigo.y += (dy / dist) * inimigo.velocidade * dt;
      }

      if (!heroi.iframes || heroi.iframes <= 0) {
        if (checkAABB(heroi, inimigo)) {
          soundManager.playHeroHurt();
          state.vidaAtual = Math.max(0, state.vidaAtual - 1);
          heroi.iframes = 0.8;
        }
      }
    }

    // Comportamento da Serpente das Dunas (65px/s em Zigue-zague)
    if (inimigo.tipo === 'serpente_dunas') {
      inimigo.zigueZagueTimer = (inimigo.zigueZagueTimer || 0) + dt * 4;
      const dx = heroi.x - inimigo.x;
      const dy = heroi.y - inimigo.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 4 && dist < 160) {
        const vx = (dx / dist) * inimigo.velocidade;
        const vy = (dy / dist) * inimigo.velocidade;

        inimigo.x += (vx + Math.sin(inimigo.zigueZagueTimer) * 20) * dt;
        inimigo.y += (vy + Math.cos(inimigo.zigueZagueTimer) * 20) * dt;
      }

      if (!heroi.iframes || heroi.iframes <= 0) {
        if (checkAABB(heroi, inimigo)) {
          soundManager.playHeroHurt();
          state.vidaAtual = Math.max(0, state.vidaAtual - 1);
          heroi.iframes = 0.8;
        }
      }
    }
  });

  // 5. Interações do Vilarejo Oásis de Kaal (Tela [1,1])
  // Sem NPC de side-quest nesta região (para variar o ritmo). Apenas lendas e Loja padrão.
  if (state.telaAtualX === 1 && state.telaAtualY === 1) {
    // Anciã Zira (Líder sábia de Kaal - Diálogo informativo)
    const distZira = Math.hypot(heroi.x + 8 - 320, heroi.y + 8 - 270);
    if (distZira < 22 && !state.dialogoAtivo && !state.lojaAtiva) {
      state.dialogoAtivo = {
        ativo: true,
        npcNome: 'ANCIÃ ZIRA',
        npcCargo: 'Líder das Tribos de Kaal',
        falas: [
          'Bem-vindo ao Oásis de Kaal, guerreiro da Lâmina de Eldrim.',
          'Beba das águas límpidas da nossa fonte sagrada no centro para restaurar seus Fragmentos de Vida.',
          'Ao norte, nas encostas do vulcão, o Santuário das Chamas foi corrompido por Thorne. A Rainha Ashra perdeu a razão.',
          'No interior do templo queima a lendária MANOPLA ÍGNEA, a única relíquia capaz de arremessar as rochas de magma!',
          'Tenha cautela pelas dunas: os poços de lava do overworld queimam ao menor toque e arremessam quem neles pisar.',
        ],
        falaAtualIndex: 0,
        caracteresVisiveis: 0,
        timerTypewriter: 0,
        falaConcluida: false,
      };
    }

    // Mercador Tariq (Loja Padrão do Oásis)
    const distTariq = Math.hypot(heroi.x + 8 - 448, heroi.y + 8 - 270);
    if (distTariq < 22 && !state.lojaAtiva && !state.dialogoAtivo) {
      state.lojaAtiva = {
        ativa: true,
        nomeLoja: 'Mercado do Oásis de Tariq',
        itemSelecionadoIndex: 0,
        itens: [
          { id: 'cura', nome: 'Frasco de Seiva de Cura', descricao: 'Restaura +3 Fragmentos de Vida', preco: 15, icone: 'cura' },
          { id: 'bomba', nome: 'Pacote de 3 Bombas', descricao: 'Bombas para explodir rochas vulcânicas', preco: 25, icone: 'bomba' },
        ],
      };
    }
  }
}

// -----------------------------------------------------------------------------
// RENDERIZAÇÃO GRÁFICA DO DESERTO DE KAAL (16-BIT CANVAS EM COORDENADAS MUNDIAIS)
// -----------------------------------------------------------------------------

export function renderizarDesertoKaal(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  camX: number = Math.round(state.camera.x),
  camY: number = Math.round(state.camera.y)
) {
  const timer = state.tituloTimer || 0;
  const viewW = 256;
  const viewH = 224;

  // 1. Fundo Base de Areia (#d4a55a)
  ctx.fillStyle = PALETA_KAAL.areia;
  ctx.fillRect(camX - 16, camY - 16, viewW + 32, viewH + 32);

  // Textura suave de grãos de areia e ondulações do vento
  const startTileX = Math.floor((camX - 16) / 16) * 16;
  const endTileX = camX + viewW + 16;
  const startTileY = Math.floor((camY - 16) / 16) * 16;
  const endTileY = camY + viewH + 16;

  ctx.fillStyle = PALETA_KAAL.areiaSombra;
  for (let x = startTileX; x < endTileX; x += 16) {
    for (let y = startTileY; y < endTileY; y += 16) {
      if ((x * 7 + y * 13) % 19 === 0) {
        ctx.fillRect(x + 3, y + 5, 4, 1);
        ctx.fillRect(x + 10, y + 12, 3, 1);
      }
    }
  }

  // 2. Dunas Decorativas (Leve variação de tom com #e8c07d)
  DUNAS_DECORATIVAS.forEach((duna) => {
    if (
      duna.x + duna.w < camX - 32 ||
      duna.x > camX + viewW + 32 ||
      duna.y + duna.h < camY - 32 ||
      duna.y > camY + viewH + 32
    ) {
      return;
    }

    // Corpo da Duna (#e8c07d)
    ctx.save();
    ctx.fillStyle = PALETA_KAAL.duna;
    ctx.beginPath();
    ctx.moveTo(duna.x, duna.y + duna.h);

    // Linha curva da crista superior
    duna.pontosCrista.forEach((p, idx) => {
      const px = duna.x + p[0] * duna.w;
      const py = duna.y + p[1] * duna.h;
      if (idx === 0) ctx.lineTo(px, py);
      else ctx.lineTo(px, py);
    });

    ctx.lineTo(duna.x + duna.w, duna.y + duna.h);
    ctx.closePath();
    ctx.fill();

    // Crista iluminada da duna (#f2d49b)
    ctx.strokeStyle = PALETA_KAAL.dunaLuz;
    ctx.lineWidth = 1;
    ctx.beginPath();
    duna.pontosCrista.forEach((p, idx) => {
      const px = duna.x + p[0] * duna.w;
      const py = duna.y + p[1] * duna.h;
      if (idx === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.stroke();

    // Sombra sutil sob a base da duna (#c49348)
    ctx.strokeStyle = PALETA_KAAL.areiaSombra;
    ctx.beginPath();
    ctx.moveTo(duna.x + 8, duna.y + duna.h - 1);
    ctx.lineTo(duna.x + duna.w - 8, duna.y + duna.h - 1);
    ctx.stroke();

    ctx.restore();
  });

  // 3. Poços de Lava Pequenos no Overworld
  // Instant-damage de 1, empurrão de 16px, borbulhamento animado
  POCOS_LAVA_KAAL.forEach((poco) => {
    if (
      poco.x + poco.w < camX - 16 ||
      poco.x > camX + viewW + 16 ||
      poco.y + poco.h < camY - 16 ||
      poco.y > camY + viewH + 16
    ) {
      return;
    }

    ctx.save();

    // Borda de pedra vulcânica queimada (#7a2e12)
    ctx.fillStyle = PALETA_KAAL.lavaBase;
    ctx.beginPath();
    ctx.ellipse(poco.x + poco.w / 2, poco.y + poco.h / 2, poco.w / 2 + 2, poco.h / 2 + 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Brilho quente ao redor da borda
    ctx.strokeStyle = PALETA_KAAL.lavaBrilho;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Magma borbulhante (#ef4444)
    ctx.fillStyle = PALETA_KAAL.lavaMagma;
    ctx.beginPath();
    ctx.ellipse(poco.x + poco.w / 2, poco.y + poco.h / 2, poco.w / 2 - 1, poco.h / 2 - 1, 0, 0, Math.PI * 2);
    ctx.fill();

    // Centro incandescente (#fef08a / #f97316)
    const pulsacao = (Math.sin(timer * 6 + poco.x) + 1) * 0.5;
    ctx.fillStyle = PALETA_KAAL.lavaCentro;
    ctx.beginPath();
    ctx.ellipse(
      poco.x + poco.w / 2,
      poco.y + poco.h / 2,
      Math.max(2, poco.w / 4 * (0.8 + pulsacao * 0.3)),
      Math.max(2, poco.h / 4 * (0.8 + pulsacao * 0.3)),
      0, 0, Math.PI * 2
    );
    ctx.fill();

    // Bolha estourando de magma
    const bolhaOffset = (timer * 2 + poco.y * 0.05) % 1;
    if (bolhaOffset < 0.7) {
      const bx = poco.x + poco.w * 0.3 + Math.sin(poco.id.length) * 4;
      const by = poco.y + poco.h * 0.35 + Math.cos(poco.id.length) * 2;
      const br = 1.5 + bolhaOffset * 2;
      ctx.fillStyle = PALETA_KAAL.lavaBrilho;
      ctx.beginPath();
      ctx.arc(bx, by, br, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  });

  // 4. Caminhos de Lajes de Arenito e Praça do Oásis de Kaal (Tela [1,1])
  if (camX <= 512 && camX + viewW >= 256 && camY <= 448 && camY + viewH >= 224) {
    // Canteiro/Piso de arenito polido do Oásis
    ctx.save();
    ctx.fillStyle = '#c8994e';
    ctx.fillRect(360, 316, 64, 56);
    ctx.strokeStyle = PALETA_KAAL.areiaSombra;
    ctx.lineWidth = 1;
    ctx.strokeRect(360, 316, 64, 56);

    // Lajes de pedra conectando às tendas
    ctx.fillStyle = '#dcb068';
    // Caminho para Tenda Zira
    for (let x = 320; x < 360; x += 10) {
      ctx.fillRect(x, 338, 8, 8);
    }
    // Caminho para Mercado Tariq
    for (let x = 424; x < 450; x += 10) {
      ctx.fillRect(x, 338, 8, 8);
    }
    ctx.restore();
  }

  // 5. Fonte de Água Real do Oásis (Centro: 376, 328, w: 32, h: 32)
  if (
    FONTE_OASIS.x + FONTE_OASIS.w >= camX - 16 &&
    FONTE_OASIS.x <= camX + viewW + 16 &&
    FONTE_OASIS.y + FONTE_OASIS.h >= camY - 16 &&
    FONTE_OASIS.y <= camY + viewH + 16
  ) {
    ctx.save();
    const fx = FONTE_OASIS.x;
    const fy = FONTE_OASIS.y;

    // Sombra da bacia da fonte
    ctx.fillStyle = 'rgba(86, 30, 12, 0.4)';
    ctx.beginPath();
    ctx.ellipse(fx + 16, fy + 24, 18, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Borda exterior de pedra esculpida do deserto (#e8c07d e #7a2e12)
    ctx.fillStyle = PALETA_KAAL.rocha;
    ctx.beginPath();
    ctx.arc(fx + 16, fy + 16, 16, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = PALETA_KAAL.duna;
    ctx.beginPath();
    ctx.arc(fx + 16, fy + 16, 14, 0, Math.PI * 2);
    ctx.fill();

    // Água límpida e cristalina do Oásis (#06b6d4 / #0891b2)
    ctx.fillStyle = PALETA_KAAL.oasisAguaProfunda;
    ctx.beginPath();
    ctx.arc(fx + 16, fy + 16, 11, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = PALETA_KAAL.oasisAgua;
    ctx.beginPath();
    ctx.arc(fx + 16, fy + 16, 8, 0, Math.PI * 2);
    ctx.fill();

    // Anéis ondulantes de água brotando da nascente
    const ondaR = ((timer * 12) % 8) + 2;
    ctx.strokeStyle = PALETA_KAAL.oasisAguaBorda;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(fx + 16, fy + 16, ondaR, 0, Math.PI * 2);
    ctx.stroke();

    // Centro da nascente: jato suave de água e reflexos reluzentes
    const brilhoAgua = Math.sin(timer * 5) > 0;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(fx + 15, fy + 15, 2, 2);
    if (brilhoAgua) {
      ctx.fillRect(fx + 12, fy + 13, 2, 1);
      ctx.fillRect(fx + 18, fy + 18, 2, 1);
    }

    // Indicador visual: se a fonte estiver pronta para curar, suave aura azul
    if (!state.fonteOasisCooldownTimer || state.fonteOasisCooldownTimer <= 0) {
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(fx + 16, fy + 16, 15.5 + Math.sin(timer * 4) * 1, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  // 6. Obstáculos do Mapa (Tendas, Palmeiras, Cactos, Rochas)
  OBSTACULOS_DESERTO_KAAL.forEach((o) => {
    if (
      o.x + o.w < camX - 32 ||
      o.x > camX + viewW + 32 ||
      o.y + o.h < camY - 32 ||
      o.y > camY + viewH + 32
    ) {
      return;
    }

    if (o.rotulo === 'tenda_zira') {
      // Tenda Beduína da Anciã Zira (Terracota com listras douradas)
      ctx.save();
      // Sombra
      ctx.fillStyle = 'rgba(86, 30, 12, 0.4)';
      ctx.fillRect(o.x - 2, o.y + o.h - 4, o.w + 4, 8);

      // Tecido principal (#7a2e12)
      ctx.fillStyle = PALETA_KAAL.rocha;
      ctx.beginPath();
      ctx.moveTo(o.x, o.y + o.h);
      ctx.lineTo(o.x + o.w / 2, o.y);
      ctx.lineTo(o.x + o.w, o.y + o.h);
      ctx.closePath();
      ctx.fill();

      // Listras drapeadas em #e8c07d
      ctx.fillStyle = PALETA_KAAL.duna;
      ctx.beginPath();
      ctx.moveTo(o.x + 8, o.y + o.h);
      ctx.lineTo(o.x + o.w / 2 - 4, o.y + 4);
      ctx.lineTo(o.x + o.w / 2, o.y + 4);
      ctx.lineTo(o.x + 14, o.y + o.h);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(o.x + o.w - 14, o.y + o.h);
      ctx.lineTo(o.x + o.w / 2, o.y + 4);
      ctx.lineTo(o.x + o.w / 2 + 4, o.y + 4);
      ctx.lineTo(o.x + o.w - 8, o.y + o.h);
      ctx.closePath();
      ctx.fill();

      // Abertura da tenda
      ctx.fillStyle = '#3a1306';
      ctx.fillRect(o.x + 18, o.y + 14, 12, 22);

      // Anciã Zira sentada em esteira
      ctx.fillStyle = '#b45309'; // Manto
      ctx.fillRect(o.x + 21, o.y + 22, 6, 8);
      ctx.fillStyle = '#fef08a'; // Véu
      ctx.fillRect(o.x + 22, o.y + 19, 4, 4);

      // Placa de lendas
      ctx.fillStyle = PALETA_KAAL.duna;
      ctx.font = '7px monospace';
      ctx.fillText('⛺ ANCIÃ ZIRA', o.x + 1, o.y - 2);
      ctx.restore();
    } else if (o.rotulo === 'mercado_tariq') {
      // Tenda Comercial do Mercador Tariq (Toldo listrado e balcão)
      ctx.save();
      // Sombra
      ctx.fillStyle = 'rgba(86, 30, 12, 0.4)';
      ctx.fillRect(o.x - 2, o.y + o.h - 4, o.w + 4, 8);

      // Toldo listrado (Verde e Creme #2d6a4f / #e8c07d)
      ctx.fillStyle = PALETA_KAAL.cactoCorpo;
      ctx.fillRect(o.x, o.y, o.w, 14);
      ctx.fillStyle = PALETA_KAAL.duna;
      for (let x = o.x + 4; x < o.x + o.w; x += 10) {
        ctx.fillRect(x, o.y, 5, 14);
      }

      // Balcão de madeira do bazar
      ctx.fillStyle = '#451a03';
      ctx.fillRect(o.x + 4, o.y + 14, o.w - 8, 20);

      // Mercador Tariq
      ctx.fillStyle = '#15803d'; // Túnica
      ctx.fillRect(o.x + 20, o.y + 16, 8, 10);
      ctx.fillStyle = '#fde047'; // Turbante
      ctx.fillRect(o.x + 21, o.y + 12, 6, 5);

      // Ânforas e mercadorias
      ctx.fillStyle = '#c2410c'; // Ânfora de barro
      ctx.fillRect(o.x + 6, o.y + 20, 6, 8);
      ctx.fillStyle = '#0284c7'; // Frascos
      ctx.fillRect(o.x + o.w - 14, o.y + 20, 6, 8);

      // Letreiro da Loja Padrão
      ctx.fillStyle = PALETA_KAAL.duna;
      ctx.font = '7px monospace';
      ctx.fillText('🏺 LOJA DE TARIQ', o.x - 4, o.y - 2);
      ctx.restore();
    } else if (o.rotulo === 'palmeira') {
      // Palmeira Tropical do Oásis
      ctx.save();
      // Sombra projetada na areia
      ctx.fillStyle = 'rgba(86, 30, 12, 0.35)';
      ctx.beginPath();
      ctx.ellipse(o.x + 8, o.y + 14, 14, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      // Tronco curvado de madeira (#5c3a21)
      ctx.fillStyle = PALETA_KAAL.palmeiraTronco;
      ctx.fillRect(o.x + 5, o.y - 12, 6, 26);
      // Anéis do tronco
      ctx.fillStyle = '#3e2413';
      ctx.fillRect(o.x + 5, o.y - 8, 6, 2);
      ctx.fillRect(o.x + 5, o.y - 2, 6, 2);
      ctx.fillRect(o.x + 5, o.y + 4, 6, 2);

      // Copa com grandes folhas de palmeira arqueadas
      ctx.fillStyle = PALETA_KAAL.palmeiraFolha;
      // Folha Norte
      ctx.beginPath();
      ctx.ellipse(o.x + 8, o.y - 18, 5, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      // Folha Leste
      ctx.beginPath();
      ctx.ellipse(o.x + 18, o.y - 13, 12, 5, Math.PI / 8, 0, Math.PI * 2);
      ctx.fill();
      // Folha Oeste
      ctx.beginPath();
      ctx.ellipse(o.x - 2, o.y - 13, 12, 5, -Math.PI / 8, 0, Math.PI * 2);
      ctx.fill();

      // Destaques de verde claro (#22c55e)
      ctx.fillStyle = PALETA_KAAL.palmeiraFolhaClara;
      ctx.fillRect(o.x + 7, o.y - 24, 2, 8);
      ctx.fillRect(o.x + 14, o.y - 15, 8, 2);
      ctx.fillRect(o.x - 6, o.y - 15, 8, 2);

      ctx.restore();
    } else if (o.rotulo === 'cacto') {
      // Cacto do Deserto (Sprite 16-bit com colisão física)
      ctx.save();
      // Sombra suave na areia
      ctx.fillStyle = 'rgba(86, 30, 12, 0.35)';
      ctx.beginPath();
      ctx.ellipse(o.x + 8, o.y + o.h - 2, 8, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Tronco central verde escuro (#1b4332 / #2d6a4f)
      ctx.fillStyle = PALETA_KAAL.cactoCorpo;
      ctx.fillRect(o.x + 5, o.y, 6, o.h);

      // Braço esquerdo do cacto
      ctx.fillRect(o.x + 1, o.y + 6, 5, 4);
      ctx.fillRect(o.x + 1, o.y + 2, 4, 6);

      // Braço direito do cacto
      ctx.fillRect(o.x + 10, o.y + 8, 5, 4);
      ctx.fillRect(o.x + 11, o.y + 4, 4, 6);

      // Ranhuras e espinhos (#1b4332)
      ctx.fillStyle = PALETA_KAAL.cactoEscuro;
      ctx.fillRect(o.x + 7, o.y + 2, 2, o.h - 4);
      ctx.fillRect(o.x + 2, o.y + 3, 1, 3);
      ctx.fillRect(o.x + 13, o.y + 5, 1, 3);

      // Flor laranja no topo do cacto
      ctx.fillStyle = PALETA_KAAL.cactoFlor;
      ctx.fillRect(o.x + 7, o.y - 2, 2, 2);

      ctx.restore();
    } else if (o.rotulo === 'rocha') {
      // Paredão de Rocha Vermelha (#7a2e12)
      ctx.save();
      // Sombra
      ctx.fillStyle = 'rgba(86, 30, 12, 0.4)';
      ctx.fillRect(o.x, o.y + o.h - 4, o.w, 6);

      // Bloco de Rocha
      ctx.fillStyle = PALETA_KAAL.rocha;
      ctx.fillRect(o.x, o.y, o.w, o.h);

      // Estratificação geológica horizontal (#943818 / #561e0c)
      ctx.fillStyle = PALETA_KAAL.rochaClara;
      ctx.fillRect(o.x + 2, o.y + 4, o.w - 4, 3);
      ctx.fillRect(o.x + 4, o.y + 14, o.w - 8, 3);

      ctx.fillStyle = PALETA_KAAL.rochaSombra;
      ctx.fillRect(o.x, o.y + o.h - 3, o.w, 3);
      ctx.fillRect(o.x + o.w - 3, o.y, 3, o.h);

      ctx.restore();
    } else if (o.rotulo === 'entrada_santuario_chamas') {
      // Portal Monumental do Santuário das Chamas (Tela [1,0], x: 352, y: 16)
      ctx.save();
      // Pilares de pedra vulcânica negra
      ctx.fillStyle = '#261714';
      ctx.fillRect(o.x, o.y, 16, o.h);
      ctx.fillRect(o.x + o.w - 16, o.y, 16, o.h);

      // Viga superior com runas de fogo
      ctx.fillRect(o.x, o.y, o.w, 10);
      ctx.fillStyle = PALETA_KAAL.lavaBrilho;
      ctx.fillRect(o.x + 18, o.y + 3, o.w - 36, 4);

      // Entrada aberta escura
      ctx.fillStyle = '#0f0a09';
      ctx.fillRect(o.x + 16, o.y + 10, o.w - 32, o.h - 10);

      // Tochas ígneas crepitantes nos pilares
      const tochaFogo = Math.sin(timer * 10) > 0 ? PALETA_KAAL.lavaMagma : PALETA_KAAL.lavaCentro;
      ctx.fillStyle = tochaFogo;
      ctx.fillRect(o.x + 6, o.y + 8, 4, 6);
      ctx.fillRect(o.x + o.w - 10, o.y + 8, 4, 6);

      // Letreiro de entrada
      ctx.fillStyle = PALETA_KAAL.duna;
      ctx.font = '7px monospace';
      ctx.fillText('🔥 SANTUÁRIO DAS CHAMAS', o.x - 16, o.y - 2);
      ctx.restore();
    } else if (o.rotulo === 'entrada_tumba_enterrada') {
      // Entrada da Tumba Enterrada (Catacumba Sudoeste, Tela [0,2], x: 64, y: 480)
      ctx.save();
      ctx.fillStyle = PALETA_KAAL.rocha;
      ctx.fillRect(o.x, o.y, o.w, o.h);
      ctx.fillStyle = '#1c0d06';
      ctx.fillRect(o.x + 12, o.y + 8, o.w - 24, o.h - 8);

      ctx.fillStyle = PALETA_KAAL.duna;
      ctx.font = '7px monospace';
      ctx.fillText('⚰️ TUMBA ENTERRADA', o.x - 8, o.y - 2);
      ctx.restore();
    } else {
      // Paredões de limite do mapa
      ctx.fillStyle = PALETA_KAAL.rocha;
      ctx.fillRect(o.x, o.y, o.w, o.h);
      ctx.fillStyle = PALETA_KAAL.rochaClara;
      ctx.fillRect(o.x + 1, o.y + 1, o.w - 2, 2);
    }
  });

  // 7. Inimigos do Deserto
  if (state.inimigosVale) {
    state.inimigosVale.forEach((inimigo) => {
      if (!inimigo.vivo) return;

      if (
        inimigo.x + inimigo.w < camX - 16 ||
        inimigo.x > camX + viewW + 16 ||
        inimigo.y + inimigo.h < camY - 16 ||
        inimigo.y > camY + viewH + 16
      ) {
        return;
      }

      ctx.save();
      if (inimigo.iframeTimer > 0 && Math.floor(inimigo.iframeTimer * 20) % 2 === 0) {
        ctx.restore();
        return;
      }

      if (inimigo.tipo === 'escorpiao_areia') {
        // Escorpião de Areia (#7a2e12 e ferrão vermelho)
        ctx.fillStyle = PALETA_KAAL.rocha;
        ctx.fillRect(inimigo.x + 2, inimigo.y + 5, 12, 8);

        // Garras frontais
        ctx.fillRect(inimigo.x, inimigo.y + 2, 3, 4);
        ctx.fillRect(inimigo.x + 13, inimigo.y + 2, 3, 4);

        // Cauda curva e ferrão
        ctx.fillStyle = PALETA_KAAL.rochaClara;
        ctx.fillRect(inimigo.x + 6, inimigo.y + 1, 4, 4);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(inimigo.x + 7, inimigo.y - 2, 3, 3);

        // Patas laterais
        ctx.fillStyle = PALETA_KAAL.rochaSombra;
        const pataPasseio = Math.sin(timer * 12) > 0 ? 1 : 0;
        ctx.fillRect(inimigo.x - 1, inimigo.y + 6 + pataPasseio, 3, 1);
        ctx.fillRect(inimigo.x + 14, inimigo.y + 6 - pataPasseio, 3, 1);
      } else if (inimigo.tipo === 'serpente_dunas') {
        // Serpente das Dunas (#dc2626 com anéis dourados)
        ctx.fillStyle = '#b91c1c';
        ctx.fillRect(inimigo.x + 2, inimigo.y + 3, 12, 7);

        // Anéis de escama dourada
        ctx.fillStyle = PALETA_KAAL.duna;
        ctx.fillRect(inimigo.x + 4, inimigo.y + 4, 2, 5);
        ctx.fillRect(inimigo.x + 9, inimigo.y + 4, 2, 5);

        // Olhos amarelos penetrantes
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(inimigo.x + 12, inimigo.y + 4, 2, 2);
      }
      ctx.restore();
    });
  }
}

// -----------------------------------------------------------------------------
// EFEITO DE CALOR ONDULANTE NO TOPO DA TELA (MIRAGEM / SHADER CANVAS 16-BIT)
// -----------------------------------------------------------------------------
// Executado em coordenadas de tela (0..256, 0..224) para criar distorção senoidal
// térmica e shimmer dourado atmosférico no topo da tela do bioma.
// -----------------------------------------------------------------------------

export function renderizarEfeitoCalorDeserto(
  ctx: CanvasRenderingContext2D,
  timer: number
) {
  const canvas = ctx.canvas;
  const topH = 56; // Primeiras 56 linhas verticais da tela 256x224px

  // 1. Distorção senoidal horizontal via fatias do canvas
  const sliceH = 2;
  for (let y = 0; y < topH; y += sliceH) {
    const fade = 1 - (y / topH); // Fade-out em direção ao solo
    const offset = Math.sin((y * 0.18) + timer * 4.5) * (1.5 * fade);

    ctx.drawImage(
      canvas,
      0, y, 256, sliceH,
      offset, y, 256, sliceH
    );
  }

  // 2. Faixas de ar quente e refração subindo suavemente
  ctx.save();
  for (let i = 0; i < 3; i++) {
    const waveY = ((timer * 22 + i * 20) % (topH + 8)) - 4;
    if (waveY >= 0 && waveY < topH) {
      const alpha = (1 - (waveY / topH)) * 0.08;
      ctx.fillStyle = `rgba(232, 192, 125, ${alpha.toFixed(3)})`;
      ctx.fillRect(0, Math.floor(waveY), 256, 2);
    }
  }

  // 3. Gradiente atmosférico de calor radiante (miragem solar dourada/laranja)
  const grad = ctx.createLinearGradient(0, 0, 0, topH);
  grad.addColorStop(0, 'rgba(232, 192, 125, 0.14)');
  grad.addColorStop(0.5, 'rgba(249, 115, 22, 0.06)');
  grad.addColorStop(1, 'rgba(212, 165, 90, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, topH);

  ctx.restore();
}
