// ============================================================================
// COVIL AFOGADO - CATACUMBA SECRETA OPCIONAL (CHARCO SOMBRIO / REGIÃO 2)
// ============================================================================
// Dungeon ancestral submersa contendo 3 salas interconectadas (sem chefe):
// - Entrada: Submersa, travessia longa de água rasa (nado contínuo, sem limite de fôlego).
// - Sala 1: Puzzle combinando plataforma-que-afunda (3s) + Bumerangue das Marés
//           para ativar 2 alavancas remotas em sequência antes da plataforma afundar.
// - Sala 2: Desafio de combate com 3 Libélulas Turvas + 1 Sapo-Lodo.
// - Sala 3: Relicário das Profundezas com baú de +10 Fluxo Arcano Máximo.
// ============================================================================

import {
  GameState,
  HeroState,
  Retangulo,
  InimigoEntidade,
  PlataformaAfundando,
} from './types';
import { soundManager } from './soundEffects';
import { checkAABB } from './combat';
import {
  atualizarInimigosAguasTurvas,
  renderizarInimigosAguasTurvas,
} from './santuarioAguasTurvas';

export interface AlavancaCovil {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  ativada: boolean;
}

export interface PortaCovil {
  direcao: 'norte' | 'sul';
  x: number;
  y: number;
  w: number;
  h: number;
  estado: 'aberta' | 'trancada';
  destinoSalaId: string;
}

export interface SalaCovil {
  id: string;
  nome: string;
  subtitulo: string;
  portas: PortaCovil[];
  paredes: Retangulo[];
  aguaRasa?: Retangulo[];
  aguaProfunda?: Retangulo[];
  alavancas?: AlavancaCovil[];
  inimigos?: InimigoEntidade[];
  plataformas?: PlataformaAfundando[];
  ponteLevantada?: boolean;
  combateConcluido?: boolean;
  bauAberto?: boolean;
  bauX?: number;
  bauY?: number;
  bauW?: number;
  bauH?: number;
}

export interface CovilAfogadoState {
  salaAtualId: string;
  salas: Record<string, SalaCovil>;
  transicaoTimer: number;
  upgradeColetado: boolean;
}

// ----------------------------------------------------------------------------
// CRIAÇÃO E INICIALIZAÇÃO DO COVIL AFOGADO
// ----------------------------------------------------------------------------
export function criarCovilAfogado(): CovilAfogadoState {
  // Bordas sólidas padrão da sala 256x224px
  const criarParedesBorda = (temPortaNorte: boolean, temPortaSul: boolean): Retangulo[] => {
    const list: Retangulo[] = [
      // Parede Oeste
      { x: 0, y: 0, w: 16, h: 224, cor: '#16282e' },
      // Parede Leste
      { x: 240, y: 0, w: 16, h: 224, cor: '#16282e' },
    ];

    // Parede Norte
    if (temPortaNorte) {
      list.push({ x: 0, y: 0, w: 104, h: 16, cor: '#16282e' });
      list.push({ x: 152, y: 0, w: 104, h: 16, cor: '#16282e' });
    } else {
      list.push({ x: 0, y: 0, w: 256, h: 16, cor: '#16282e' });
    }

    // Parede Sul
    if (temPortaSul) {
      list.push({ x: 0, y: 208, w: 104, h: 16, cor: '#16282e' });
      list.push({ x: 152, y: 208, w: 104, h: 16, cor: '#16282e' });
    } else {
      list.push({ x: 0, y: 208, w: 256, h: 16, cor: '#16282e' });
    }

    return list;
  };

  // --------------------------------------------------------------------------
  // SALA 0: ENTRADA SUBMERSA (Longa passagem de água rasa e nado contínuo)
  // --------------------------------------------------------------------------
  const paredesEntrada = criarParedesBorda(true, true);
  // Adiciona pilares de sustentação submersos que criam uma galeria sinuosa
  paredesEntrada.push(
    { x: 64, y: 64, w: 24, h: 48, cor: '#16282e' },
    { x: 168, y: 64, w: 24, h: 48, cor: '#16282e' },
    { x: 64, y: 140, w: 24, h: 40, cor: '#16282e' },
    { x: 168, y: 140, w: 24, h: 40, cor: '#16282e' }
  );

  const aguaRasaEntrada: Retangulo[] = [
    // Quase toda a câmara está inundada com água rasa ancestral
    { x: 16, y: 32, w: 224, h: 176, cor: '#10222a' },
  ];

  const salaEntrada: SalaCovil = {
    id: 'covil_entrada',
    nome: 'GALERIA SUBMERSA',
    subtitulo: 'Entrada Inundada do Covil Afogado',
    portas: [
      {
        direcao: 'sul',
        x: 104,
        y: 208,
        w: 48,
        h: 16,
        estado: 'aberta',
        destinoSalaId: 'overworld_charco',
      },
      {
        direcao: 'norte',
        x: 104,
        y: 0,
        w: 48,
        h: 16,
        estado: 'aberta',
        destinoSalaId: 'covil_sala1',
      },
    ],
    paredes: paredesEntrada,
    aguaRasa: aguaRasaEntrada,
  };

  // --------------------------------------------------------------------------
  // SALA 1: PUZZLE PLATAFORMA AFUNDANDO + BUMERANGUE (2 Alavancas)
  // --------------------------------------------------------------------------
  const paredesSala1 = criarParedesBorda(true, true);
  // Pilares de apoio nas laterais
  paredesSala1.push(
    { x: 16, y: 16, w: 32, h: 32, cor: '#16282e' },
    { x: 208, y: 16, w: 32, h: 32, cor: '#16282e' }
  );

  // Fosso central largo de água profunda intransponível separando norte e sul
  const aguaProfundaSala1: Retangulo[] = [
    { x: 16, y: 48, w: 224, h: 128, cor: '#0a161c' },
  ];

  // 1 Plataforma flutuante no centro (112, 96, 32x32px)
  const plataformasSala1: PlataformaAfundando[] = [
    {
      id: 'plat_covil_puz',
      x: 112,
      y: 96,
      w: 32,
      h: 32,
      estado: 'firme',
      timerPiso: 0,
      timerVazia: 0,
      profundidade: 0,
      heroiSobre: false,
    },
  ];

  // 2 Alavancas remotas nas ilhotas laterais sobre a água profunda (> 2 tiles)
  const alavancasSala1: AlavancaCovil[] = [
    { id: 'alavanca_covil_esq', x: 28, y: 96, w: 16, h: 16, ativada: false },
    { id: 'alavanca_covil_dir', x: 212, y: 96, w: 16, h: 16, ativada: false },
  ];

  const sala1: SalaCovil = {
    id: 'covil_sala1',
    nome: 'CÂMARA DAS COMPORTAS',
    subtitulo: 'Puzzle das Alavancas Gêmeas e Plataforma Instável',
    portas: [
      {
        direcao: 'sul',
        x: 104,
        y: 208,
        w: 48,
        h: 16,
        estado: 'aberta',
        destinoSalaId: 'covil_entrada',
      },
      {
        direcao: 'norte',
        x: 104,
        y: 0,
        w: 48,
        h: 16,
        estado: 'trancada', // Abre ao ativar as 2 alavancas
        destinoSalaId: 'covil_sala2',
      },
    ],
    paredes: paredesSala1,
    aguaProfunda: aguaProfundaSala1,
    plataformas: plataformasSala1,
    alavancas: alavancasSala1,
    ponteLevantada: false,
  };

  // --------------------------------------------------------------------------
  // SALA 2: COMBATE AQUÁTICO (3 Libélulas Turvas + 1 Sapo-Lodo)
  // --------------------------------------------------------------------------
  const paredesSala2 = criarParedesBorda(true, true);
  // Rochas centrais no combate
  paredesSala2.push(
    { x: 48, y: 80, w: 24, h: 24, cor: '#16282e' },
    { x: 184, y: 80, w: 24, h: 24, cor: '#16282e' }
  );

  const aguaRasaSala2: Retangulo[] = [
    { x: 24, y: 32, w: 208, h: 160, cor: '#10222a' },
  ];

  const inimigosSala2: InimigoEntidade[] = [
    // 3 Libélulas Turvas (2 HP cada, voo senoidal a 60px/s)
    {
      id: 'libelula_covil_1',
      tipo: 'libelula_turva',
      x: 60,
      y: 60,
      w: 14,
      h: 14,
      hp: 2,
      hpMax: 2,
      vivo: true,
      direcao: 'baixo',
      velocidade: 60,
      iframeTimer: 0,
      zigueZagueTimer: 0,
      voando: true,
    },
    {
      id: 'libelula_covil_2',
      tipo: 'libelula_turva',
      x: 180,
      y: 60,
      w: 14,
      h: 14,
      hp: 2,
      hpMax: 2,
      vivo: true,
      direcao: 'esquerda',
      velocidade: 60,
      iframeTimer: 0,
      zigueZagueTimer: 1.2,
      voando: true,
    },
    {
      id: 'libelula_covil_3',
      tipo: 'libelula_turva',
      x: 120,
      y: 110,
      w: 14,
      h: 14,
      hp: 2,
      hpMax: 2,
      vivo: true,
      direcao: 'direita',
      velocidade: 60,
      iframeTimer: 0,
      zigueZagueTimer: 2.1,
      voando: true,
    },
    // 1 Sapo-Lodo (3 HP, saltos periódicos a cada 1.5s na direção do herói)
    {
      id: 'sapo_covil_1',
      tipo: 'sapo_lodo',
      x: 120,
      y: 140,
      w: 16,
      h: 16,
      hp: 3,
      hpMax: 3,
      vivo: true,
      direcao: 'cima',
      velocidade: 30,
      iframeTimer: 0,
      timerPulo: 0,
      saltando: false,
    },
  ];

  const sala2: SalaCovil = {
    id: 'covil_sala2',
    nome: 'ARENA DOS PÂNTANOS',
    subtitulo: 'Covil dos Vorazes Moradores do Lodo',
    portas: [
      {
        direcao: 'sul',
        x: 104,
        y: 208,
        w: 48,
        h: 16,
        estado: 'aberta',
        destinoSalaId: 'covil_sala1',
      },
      {
        direcao: 'norte',
        x: 104,
        y: 0,
        w: 48,
        h: 16,
        estado: 'trancada', // Abre quando todos os 4 inimigos caírem
        destinoSalaId: 'covil_sala3',
      },
    ],
    paredes: paredesSala2,
    aguaRasa: aguaRasaSala2,
    inimigos: inimigosSala2,
    combateConcluido: false,
  };

  // --------------------------------------------------------------------------
  // SALA 3: RELICÁRIO DAS PROFUNDEZAS (Baú de +10 Fluxo Arcano Máximo)
  // --------------------------------------------------------------------------
  const paredesSala3 = criarParedesBorda(false, true);
  // Colunas majestosas em torno do pedestal
  paredesSala3.push(
    { x: 48, y: 48, w: 20, h: 20, cor: '#16282e' },
    { x: 188, y: 48, w: 20, h: 20, cor: '#16282e' },
    { x: 48, y: 156, w: 20, h: 20, cor: '#16282e' },
    { x: 188, y: 156, w: 20, h: 20, cor: '#16282e' }
  );

  const sala3: SalaCovil = {
    id: 'covil_sala3',
    nome: 'SANTUÁRIO DO ARCANO SUBMERSO',
    subtitulo: 'O Relicário Esquecido das Marés Antigas',
    portas: [
      {
        direcao: 'sul',
        x: 104,
        y: 208,
        w: 48,
        h: 16,
        estado: 'aberta',
        destinoSalaId: 'covil_sala2',
      },
    ],
    paredes: paredesSala3,
    bauAberto: false,
    bauX: 116,
    bauY: 96,
    bauW: 24,
    bauH: 20,
  };

  return {
    salaAtualId: 'covil_entrada',
    salas: {
      covil_entrada: salaEntrada,
      covil_sala1: sala1,
      covil_sala2: sala2,
      covil_sala3: sala3,
    },
    transicaoTimer: 0,
    upgradeColetado: false,
  };
}

// ----------------------------------------------------------------------------
// FÍSICA E ATUALIZAÇÃO DO COVIL AFOGADO
// ----------------------------------------------------------------------------
export function atualizarFisicaCovilAfogado(
  covil: CovilAfogadoState,
  state: GameState,
  dt: number,
  onSairParaOverworld: () => void
) {
  const sala = covil.salas[covil.salaAtualId];
  if (!sala) return;

  const heroi = state.heroi;

  // Marca sala como visitada no mapa
  if (!state.salasVisitadasCovilAfogado) {
    state.salasVisitadasCovilAfogado = {};
  }
  state.salasVisitadasCovilAfogado[sala.id] = true;

  // 1. Redução de velocidade na água rasa da entrada e sala 2
  let estaNaAguaRasa = false;
  if (sala.aguaRasa) {
    const px = heroi.x + heroi.w / 2;
    const py = heroi.y + heroi.h / 2;
    for (const r of sala.aguaRasa) {
      if (px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h) {
        estaNaAguaRasa = true;
        break;
      }
    }
  }
  heroi.velocidade = estaNaAguaRasa ? 72 : 96;

  // 2. Transições de Porta Norte e Sul
  if (covil.transicaoTimer > 0) {
    covil.transicaoTimer -= dt;
    return;
  }

  sala.portas.forEach((porta) => {
    if (porta.estado !== 'aberta') return;

    const heroHit: Retangulo = {
      x: heroi.x + 2,
      y: heroi.y + 4,
      w: heroi.w - 4,
      h: heroi.h - 6,
    };

    if (checkAABB(heroHit, porta)) {
      if (porta.destinoSalaId === 'overworld_charco') {
        // Saída para o Charco Sombrio
        onSairParaOverworld();
      } else if (covil.salas[porta.destinoSalaId]) {
        // Transição entre salas da catacumba
        covil.salaAtualId = porta.destinoSalaId;
        state.dungeonSalaAtualId = porta.destinoSalaId;
        covil.transicaoTimer = 0.2;

        if (porta.direcao === 'norte') {
          heroi.y = 184;
          heroi.direcao = 'cima';
        } else if (porta.direcao === 'sul') {
          heroi.y = 28;
          heroi.direcao = 'baixo';
        }

        soundManager.playDoorOpen();
        state.notificacaoTexto = covil.salas[porta.destinoSalaId].nome;
        state.notificacaoTimer = 2.0;
      }
    }
  });

  // 3. Atualização da Sala 1: Puzzle Plataforma que Afunda + 2 Alavancas
  if (sala.id === 'covil_sala1') {
    // Checagem das alavancas
    const alavancaEsq = sala.alavancas?.find((a) => a.id === 'alavanca_covil_esq');
    const alavancaDir = sala.alavancas?.find((a) => a.id === 'alavanca_covil_dir');

    if (alavancaEsq?.ativada && alavancaDir?.ativada && !sala.ponteLevantada) {
      sala.ponteLevantada = true;
      const portaNorte = sala.portas.find((p) => p.direcao === 'norte');
      if (portaNorte) {
        portaNorte.estado = 'aberta';
      }
      soundManager.playDoorOpen();
      state.notificacaoTexto = 'COMPORTAS ABERTAS! PASSARELA ERGUIDA!';
      state.notificacaoTimer = 3.0;
    }

    // Plataforma central que afunda
    if (sala.plataformas) {
      for (const plat of sala.plataformas) {
        const px = heroi.x + heroi.w / 2;
        const py = heroi.y + heroi.h / 2;
        const sobrePlat =
          px >= plat.x && px <= plat.x + plat.w && py >= plat.y && py <= plat.y + plat.h;

        if (plat.estado === 'firme') {
          if (sobrePlat) {
            plat.timerPiso += dt;
            if (plat.timerPiso >= 1.0) {
              plat.estado = 'afundando';
              soundManager.playWaterSplash();
            }
          } else {
            plat.timerPiso = 0;
          }
        } else if (plat.estado === 'afundando') {
          plat.timerPiso += dt;
          plat.profundidade = Math.min(1.0, (plat.timerPiso - 1.0) / 2.0); // 1.0 a 3.0s

          if (plat.timerPiso >= 3.0) {
            plat.estado = 'submersa';
            plat.timerVazia = 0;
            soundManager.playWaterSplash();

            // Se o herói ainda estiver sobre ela quando afunda completamente, cai na água profunda!
            if (sobrePlat) {
              state.vidaAtual = Math.max(0, state.vidaAtual - 1);
              heroi.iframes = 0.8;
              heroi.x = 120;
              heroi.y = 180;
              soundManager.playHeroHurt();
              state.notificacaoTexto = 'VOCÊ CAIU NA ÁGUA PROFUNDA!';
              state.notificacaoTimer = 2.0;
            }
          }
        } else if (plat.estado === 'submersa') {
          plat.timerVazia += dt;
          if (plat.timerVazia >= 2.0) {
            plat.estado = 'firme';
            plat.timerPiso = 0;
            plat.profundidade = 0;
          }
        }
      }
    }
  }

  // 4. Atualização da Sala 2: Combate (3 Libélulas + 1 Sapo-Lodo)
  if (sala.id === 'covil_sala2') {
    if (!sala.combateConcluido && sala.inimigos) {
      // Atualiza IA dos inimigos do covil
      atualizarInimigosAguasTurvas(sala.inimigos, heroi, dt, state);

      // Checa se todos foram derrotados
      const todosMortos = sala.inimigos.every((ini) => !ini.vivo);
      if (todosMortos) {
        sala.combateConcluido = true;
        const portaNorte = sala.portas.find((p) => p.direcao === 'norte');
        if (portaNorte) {
          portaNorte.estado = 'aberta';
        }
        soundManager.playDoorOpen();
        state.notificacaoTexto = 'MONSTROS DO LODO DERROTADOS! PASSAGEM ABERTA!';
        state.notificacaoTimer = 3.0;
      }
    }
  }
}

// ----------------------------------------------------------------------------
// INTERAÇÃO DO HERÓI NO COVIL AFOGADO COM A TECLA [Z]
// ----------------------------------------------------------------------------
export function interagirAcaoCovilAfogado(
  covil: CovilAfogadoState,
  state: GameState
): boolean {
  const sala = covil.salas[covil.salaAtualId];
  if (!sala) return false;

  const heroi = state.heroi;

  // Interação na Sala 3: Baú do Relicário com +10 Fluxo Arcano Máximo
  if (sala.id === 'covil_sala3' && sala.bauX && sala.bauY && !sala.bauAberto && !state.covilAfogadoUpgradeColetado) {
    const dx = Math.abs(heroi.x + 8 - (sala.bauX + 12));
    const dy = Math.abs(heroi.y + 8 - (sala.bauY + 10));

    if (dx <= 24 && dy <= 24) {
      sala.bauAberto = true;
      state.covilAfogadoUpgradeColetado = true;
      covil.upgradeColetado = true;

      // Efeito permanente: +10 Fluxo Arcano Máximo!
      state.arcanoMax += 10;
      state.arcanoAtual = state.arcanoMax; // Enche completamente o novo fluxo

      soundManager.playChestOpen();
      soundManager.playSanctuaryPurified();

      state.notificacaoTexto = '+10 FLUXO ARCANO MÁXIMO!';
      state.notificacaoTimer = 4.0;
      return true;
    }
  }

  // Interação no Portal de Retorno Místico da Sala 3 (teleporte rápido de volta)
  if (sala.id === 'covil_sala3' && heroi.y <= 40 && heroi.x >= 104 && heroi.x <= 152) {
    // Volta direto para a entrada ou saída
    covil.salaAtualId = 'covil_entrada';
    state.dungeonSalaAtualId = 'covil_entrada';
    heroi.x = 120;
    heroi.y = 160;
    heroi.direcao = 'baixo';
    soundManager.playDoorOpen();
    state.notificacaoTexto = 'CORRENTEZA MÍSTICA: RETORNO À ENTRADA';
    state.notificacaoTimer = 2.5;
    return true;
  }

  return false;
}

// ----------------------------------------------------------------------------
// RENDERIZAÇÃO DO COVIL AFOGADO (Estética 16-bit Submersa de Alta Fidelidade)
// ----------------------------------------------------------------------------
export function renderizarCovilAfogado(
  ctx: CanvasRenderingContext2D,
  covil: CovilAfogadoState,
  state: GameState,
  animTime: number
) {
  const sala = covil.salas[covil.salaAtualId];
  if (!sala) return;

  // 1. Chão de lajotas de ardósia submersas (#121e24)
  ctx.fillStyle = '#121e24';
  ctx.fillRect(0, 0, 256, 224);

  // Mosaico de azulejos antigos com limo
  ctx.fillStyle = '#182830';
  for (let x = 16; x < 240; x += 16) {
    for (let y = 16; y < 208; y += 16) {
      if ((x / 16 + y / 16) % 2 === 0) {
        ctx.fillRect(x, y, 16, 16);
      }
      ctx.fillStyle = 'rgba(10, 16, 20, 0.4)';
      ctx.fillRect(x, y, 16, 1);
      ctx.fillRect(x, y, 1, 16);
      ctx.fillStyle = '#182830';
    }
  }

  // 2. Renderizar Água Rasa (com reflexos suaves e ondulação)
  if (sala.aguaRasa) {
    sala.aguaRasa.forEach((ar) => {
      ctx.fillStyle = 'rgba(16, 42, 54, 0.75)';
      ctx.fillRect(ar.x, ar.y, ar.w, ar.h);

      // Reflexos azul-turquesa de água corrente
      const wave = Math.sin(animTime * 2.5 + ar.y * 0.05) * 2;
      ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
      for (let wy = ar.y + 8; wy < ar.y + ar.h; wy += 20) {
        ctx.fillRect(ar.x + 8 + wave, wy, Math.min(24, ar.w - 16), 1.5);
      }
    });
  }

  // 3. Renderizar Fosso de Água Profunda (Sala 1)
  if (sala.aguaProfunda) {
    sala.aguaProfunda.forEach((ap) => {
      ctx.fillStyle = '#060d12';
      ctx.fillRect(ap.x, ap.y, ap.w, ap.h);

      // Bordas do fosso com água escura
      ctx.fillStyle = '#0f222b';
      ctx.fillRect(ap.x, ap.y, ap.w, 4);
      ctx.fillRect(ap.x, ap.y + ap.h - 4, ap.w, 4);

      // Ondulações profundas
      const deepWave = Math.sin(animTime * 3 + ap.x * 0.1) * 2;
      ctx.fillStyle = 'rgba(45, 212, 191, 0.15)';
      for (let wy = ap.y + 16; wy < ap.y + ap.h - 16; wy += 24) {
        ctx.fillRect(ap.x + 16 + deepWave, wy, ap.w - 32, 2);
      }
    });
  }

  // 4. Renderizar Passarela de Pedra Erguida (Sala 1 ao ativar as 2 alavancas)
  if (sala.id === 'covil_sala1' && sala.ponteLevantada) {
    ctx.fillStyle = '#334b54';
    ctx.fillRect(104, 48, 48, 128);

    ctx.strokeStyle = '#1d2c32';
    ctx.lineWidth = 1;
    ctx.strokeRect(104.5, 48.5, 47, 127);

    // Lajes da passarela
    ctx.fillStyle = '#425e69';
    for (let py = 48; py < 176; py += 16) {
      ctx.fillRect(106, py + 2, 44, 12);
      ctx.fillStyle = '#203238';
      ctx.fillRect(104, py, 48, 1);
      ctx.fillStyle = '#425e69';
    }
  }

  // 5. Renderizar Plataformas que Afundam (Sala 1)
  if (sala.plataformas && (!sala.ponteLevantada || sala.plataformas[0].estado !== 'submersa')) {
    for (const plat of sala.plataformas) {
      if (plat.estado === 'submersa') {
        // Bolhas subindo
        const bub = Math.sin(animTime * 5) * 3;
        ctx.fillStyle = 'rgba(56, 189, 248, 0.6)';
        ctx.beginPath();
        ctx.arc(plat.x + plat.w / 2 + bub, plat.y + plat.h / 2, 2.5, 0, Math.PI * 2);
        ctx.fill();
        continue;
      }

      const sinkY = plat.profundidade * 4;
      const alpha = Math.max(0.3, 1.0 - plat.profundidade * 0.7);

      ctx.save();
      ctx.globalAlpha = alpha;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(plat.x + 1, plat.y + 2 + sinkY, plat.w, plat.h);

      ctx.fillStyle = plat.estado === 'afundando' ? '#2f4b52' : '#3f626c';
      ctx.fillRect(plat.x, plat.y + sinkY, plat.w, plat.h);

      ctx.strokeStyle = '#182b30';
      ctx.lineWidth = 1;
      ctx.strokeRect(plat.x + 0.5, plat.y + 0.5 + sinkY, plat.w - 1, plat.h - 1);

      // Emblema rúnico de água
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(plat.x + plat.w / 2, plat.y + plat.h / 2 + sinkY, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  // 6. Renderizar Alavancas (Sala 1)
  if (sala.alavancas) {
    sala.alavancas.forEach((alv) => {
      // Ilhota de pedra sob a alavanca
      ctx.fillStyle = '#263b42';
      ctx.fillRect(alv.x - 4, alv.y - 4, alv.w + 8, alv.h + 8);
      ctx.strokeStyle = '#121f24';
      ctx.strokeRect(alv.x - 3.5, alv.y - 3.5, alv.w + 7, alv.h + 7);

      // Base de ferro da alavanca
      ctx.fillStyle = '#475569';
      ctx.fillRect(alv.x + 2, alv.y + 8, 12, 6);

      // Haste da alavanca (inclinada se ativada)
      ctx.strokeStyle = alv.ativada ? '#38bdf8' : '#94a3b8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(alv.x + 8, alv.y + 11);
      if (alv.ativada) {
        ctx.lineTo(alv.x + 13, alv.y + 3);
      } else {
        ctx.lineTo(alv.x + 3, alv.y + 3);
      }
      ctx.stroke();

      // Esfera de safira no topo da haste
      ctx.fillStyle = alv.ativada ? '#38bdf8' : '#0ea5e9';
      ctx.beginPath();
      ctx.arc(alv.ativada ? alv.x + 13 : alv.x + 3, alv.y + 3, 2.5, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // 7. Renderizar Paredes Sólidas de Ardósia Submersa
  sala.paredes.forEach((p) => {
    ctx.fillStyle = p.cor || '#16282e';
    ctx.fillRect(p.x, p.y, p.w, p.h);

    // Beiral superior e inferior
    ctx.fillStyle = '#29434d';
    ctx.fillRect(p.x + 1, p.y + 1, Math.max(1, p.w - 2), 2);
    ctx.fillStyle = '#0a1417';
    ctx.fillRect(p.x + 1, p.y + p.h - 2, Math.max(1, p.w - 2), 2);

    ctx.strokeStyle = '#0e1c21';
    ctx.lineWidth = 1;
    ctx.strokeRect(p.x + 0.5, p.y + 0.5, p.w - 1, p.h - 1);
  });

  // 8. Renderizar Portas
  sala.portas.forEach((porta) => {
    if (porta.estado === 'aberta') {
      ctx.fillStyle = '#060d10';
      ctx.fillRect(porta.x, porta.y, porta.w, porta.h);

      // Degraus ou arco aberto
      ctx.fillStyle = '#223842';
      ctx.fillRect(porta.x + 2, porta.y + 2, porta.w - 4, 3);
    } else {
      // Grade de ferro trancada
      ctx.fillStyle = '#1a2226';
      ctx.fillRect(porta.x, porta.y, porta.w, porta.h);

      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 2;
      for (let gx = porta.x + 4; gx < porta.x + porta.w; gx += 8) {
        ctx.beginPath();
        ctx.moveTo(gx, porta.y);
        ctx.lineTo(gx, porta.y + porta.h);
        ctx.stroke();
      }
    }
  });

  // 9. Renderizar Inimigos (Sala 2)
  if (sala.inimigos && sala.inimigos.length > 0) {
    renderizarInimigosAguasTurvas(ctx, sala.inimigos, animTime);
  }

  // 10. Renderizar Baú do Relicário (Sala 3)
  if (sala.id === 'covil_sala3' && sala.bauX && sala.bauY) {
    const bx = sala.bauX;
    const by = sala.bauY;
    const bw = sala.bauW || 24;
    const bh = sala.bauH || 20;

    // Pedestal de Mármore e Algas
    ctx.fillStyle = '#1e333d';
    ctx.fillRect(bx - 10, by - 6, bw + 20, bh + 14);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1;
    ctx.strokeRect(bx - 9.5, by - 5.5, bw + 19, bh + 13);

    // Inscrições luminosas no pedestal
    ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.fillRect(bx - 6, by - 3, bw + 12, 1);
    ctx.fillRect(bx - 6, by + bh + 4, bw + 12, 1);

    // Sombra do baú
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(bx + 2, by + bh - 2, bw - 4, 4);

    if (sala.bauAberto) {
      // Baú aberto (tampa levantada, interior dourado/arcano brilhando)
      ctx.fillStyle = '#78350f';
      ctx.fillRect(bx, by + 6, bw, bh - 6);

      // Tampa aberta para cima
      ctx.fillStyle = '#92400e';
      ctx.fillRect(bx, by - 6, bw, 8);

      // Resplendor arcano azul-turquesa saindo do baú aberto
      const glow = Math.sin(animTime * 4) * 0.15 + 0.55;
      ctx.fillStyle = `rgba(56, 189, 248, ${glow.toFixed(2)})`;
      ctx.fillRect(bx + 3, by + 4, bw - 6, 6);

      ctx.fillStyle = '#e0f2fe';
      ctx.fillRect(bx + 8, by + 5, bw - 16, 3);
    } else {
      // Baú fechado com reforço de bronze e safira central
      ctx.fillStyle = '#92400e';
      ctx.fillRect(bx, by, bw, bh);

      // Cantoneiras de bronze
      ctx.fillStyle = '#d97706';
      ctx.fillRect(bx, by, 3, bh);
      ctx.fillRect(bx + bw - 3, by, 3, bh);
      ctx.fillRect(bx, by, bw, 3);
      ctx.fillRect(bx, by + 9, bw, 2);

      // Safira brilhante da fechadura
      const safiraGlow = Math.sin(animTime * 3) * 0.3 + 0.7;
      ctx.fillStyle = `rgba(56, 189, 248, ${safiraGlow.toFixed(2)})`;
      ctx.beginPath();
      ctx.arc(bx + bw / 2, by + 10, 3, 0, Math.PI * 2);
      ctx.fill();

      // Indicador [Z] Abrir se o herói estiver próximo
      const dx = Math.abs(state.heroi.x + 8 - (bx + bw / 2));
      const dy = Math.abs(state.heroi.y + 8 - (by + bh / 2));
      if (dx <= 28 && dy <= 28) {
        ctx.font = 'bold 7px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#38bdf8';
        ctx.fillText('[Z] Abrir Baú', bx + bw / 2, by - 12);
      }
    }

    // Portal místico de retorno no norte da Sala 3
    const portalX = 128;
    const portalY = 24;
    const pRadius = 12 + Math.sin(animTime * 3) * 2;
    ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
    ctx.beginPath();
    ctx.arc(portalX, portalY, pRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(224, 242, 254, 0.7)';
    ctx.beginPath();
    ctx.arc(portalX, portalY, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = '6px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('▲ Portal de Retorno', portalX, portalY + 18);
  }

  // 11. Efeito de vinheta e iluminação aquática submersa do Covil
  const grad = ctx.createRadialGradient(
    state.heroi.x + 8,
    state.heroi.y + 8,
    20,
    state.heroi.x + 8,
    state.heroi.y + 8,
    140
  );
  grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
  grad.addColorStop(0.7, 'rgba(6, 14, 18, 0.35)');
  grad.addColorStop(1, 'rgba(4, 8, 12, 0.7)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 224);
}
