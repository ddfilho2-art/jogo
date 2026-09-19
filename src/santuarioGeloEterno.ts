import { soundManager } from './soundEffects';
import {
  Direcao,
  EstadoJogo,
  GameState,
  GlaciusBossState,
  HeroState,
  InimigoEntidade,
  ProjetilEstilhacoGelo,
  Retangulo,
} from './types';
import { checkAABB } from './combat';

// =============================================================================
// ELDRIM: ECOS DO PASSADO - SANTUÁRIO DO GELO ETERNO (REGIÃO 3: TERRAS GELADAS)
// =============================================================================
// Paleta Oficial: Paredes #c8e8f0 (70% opacidade) sobre fundo #0f1e2e
// Resolução Lógica: 256x224px (16 colunas x 14 linhas de tiles 16x16px)
// =============================================================================

export interface BlocoGeloFinoDungeon {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  quebrado: boolean;
  timerSobre: number; // 1s parado ou 2 passos para quebrar
}

export interface PortaGeloDungeon {
  direcao: 'norte' | 'sul' | 'leste' | 'oeste';
  destinoSalaId: string;
  estado: 'aberta' | 'trancada_inimigos' | 'trancada_chefe';
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface BauGeloDungeon {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  aberto: boolean;
  conteudo: 'botas_glaciais' | 'chave_chefe' | 'fragmento_vida';
}

export interface SalaGeloEterno {
  id: string;
  nome: string;
  subtitulo: string;
  portas: PortaGeloDungeon[];
  paredes: Retangulo[];
  geloLiso?: Retangulo[];
  geloFino?: BlocoGeloFinoDungeon[];
  inimigos?: InimigoEntidade[];
  baus?: BauGeloDungeon[];
  combateConcluido?: boolean;
}

export interface GeloEternoDungeonState {
  salaAtualId: string;
  salas: Record<string, SalaGeloEterno>;
  transicaoTimer: number;
  temChaveChefe: boolean;
  upgradeColetado: boolean;
}

// -----------------------------------------------------------------------------
// FÁBRICAS DE INICIALIZAÇÃO DO CHEFE GLACIUS
// -----------------------------------------------------------------------------

export function criarChefeGlaciusInicial(): GlaciusBossState {
  return {
    ativo: false,
    derrotado: false,
    x: 128 - 18,
    y: 60,
    w: 36,
    h: 36,
    hp: 10,
    hpMax: 10,
    estado: 'preparando',
    direcaoInvestida: null,
    vx: 0,
    vy: 0,
    atordoadoTimer: 0,
    acertosNoAtordoamentoAtual: 0,
    investidasAtordoadasAcertadas: 0,
    prepTimer: 1.0,
    estilhacosDisparados: false,
    iframeTimer: 0,
    cutsceneVitoriaTimer: 0,
    botasGlaciaisLiberadas: false,
    relicarioLiberado: false,
    particulasGelo: [],
  };
}

// -----------------------------------------------------------------------------
// FÁBRICA DO SANTUÁRIO DO GELO ETERNO (6 SALAS)
// -----------------------------------------------------------------------------

export function criarDungeonGeloEternoInicial(): GeloEternoDungeonState {
  const paredesBordaComum = (norte: boolean, sul: boolean, leste: boolean, oeste: boolean): Retangulo[] => {
    const list: Retangulo[] = [];
    // Norte
    if (norte) {
      list.push({ x: 0, y: 0, w: 104, h: 16 });
      list.push({ x: 152, y: 0, w: 104, h: 16 });
    } else {
      list.push({ x: 0, y: 0, w: 256, h: 16 });
    }
    // Sul
    if (sul) {
      list.push({ x: 0, y: 208, w: 104, h: 16 });
      list.push({ x: 152, y: 208, w: 104, h: 16 });
    } else {
      list.push({ x: 0, y: 208, w: 256, h: 16 });
    }
    // Oeste
    if (oeste) {
      list.push({ x: 0, y: 0, w: 16, h: 88 });
      list.push({ x: 0, y: 136, w: 16, h: 88 });
    } else {
      list.push({ x: 0, y: 0, w: 16, h: 224 });
    }
    // Leste
    if (leste) {
      list.push({ x: 240, y: 0, w: 16, h: 88 });
      list.push({ x: 240, y: 136, w: 16, h: 88 });
    } else {
      list.push({ x: 240, y: 0, w: 16, h: 224 });
    }
    return list;
  };

  const salas: Record<string, SalaGeloEterno> = {
    // 1. SALA DE ENTRADA
    sala_1_entrada: {
      id: 'sala_1_entrada',
      nome: 'Santuário do Gelo Eterno',
      subtitulo: 'Hall da Geada Ancestral',
      portas: [
        { direcao: 'norte', destinoSalaId: 'sala_2_escorregadia', estado: 'aberta', x: 104, y: 0, w: 48, h: 16 },
        { direcao: 'sul', destinoSalaId: 'overworld', estado: 'aberta', x: 104, y: 208, w: 48, h: 16 },
      ],
      paredes: [
        ...paredesBordaComum(true, true, false, false),
        { x: 64, y: 64, w: 32, h: 32 },
        { x: 160, y: 64, w: 32, h: 32 },
      ],
      geloLiso: [
        { x: 32, y: 32, w: 192, h: 160 },
      ],
      combateConcluido: true,
    },

    // 2. SALA PISO ESCORREGADIO (INIMIGOS: RASTEJANIE E CORUJA)
    sala_2_escorregadia: {
      id: 'sala_2_escorregadia',
      nome: 'Pátio Congelado',
      subtitulo: 'Ameaças do Vento Glacial',
      portas: [
        { direcao: 'sul', destinoSalaId: 'sala_1_entrada', estado: 'aberta', x: 104, y: 208, w: 48, h: 16 },
        { direcao: 'norte', destinoSalaId: 'sala_3_gelo_fino', estado: 'trancada_inimigos', x: 104, y: 0, w: 48, h: 16 },
      ],
      paredes: [
        ...paredesBordaComum(true, true, false, false),
        { x: 48, y: 96, w: 32, h: 32 },
        { x: 176, y: 96, w: 32, h: 32 },
      ],
      geloLiso: [
        { x: 16, y: 16, w: 224, h: 192 },
      ],
      inimigos: [
        criarRastejanteGelo('rastejante_1', 60, 60),
        criarRastejanteGelo('rastejante_2', 180, 140),
        criarCorujaGlacial('coruja_1', 128, 40),
        criarCorujaGlacial('coruja_2', 70, 160),
      ],
      combateConcluido: false,
    },

    // 3. SALA PUZZLE DE GELO FINO
    sala_3_gelo_fino: {
      id: 'sala_3_gelo_fino',
      nome: 'Câmara do Gelo Quebradiço',
      subtitulo: 'Puzzle da Rota Segura',
      portas: [
        { direcao: 'sul', destinoSalaId: 'sala_2_escorregadia', estado: 'aberta', x: 104, y: 208, w: 48, h: 16 },
        { direcao: 'oeste', destinoSalaId: 'sala_4_tesouro', estado: 'aberta', x: 0, y: 88, w: 16, h: 48 },
        { direcao: 'norte', destinoSalaId: 'sala_5_antechamber', estado: 'aberta', x: 104, y: 0, w: 48, h: 16 },
      ],
      paredes: [
        ...paredesBordaComum(true, true, false, true),
      ],
      geloLiso: [
        { x: 16, y: 16, w: 224, h: 192 },
      ],
      geloFino: [
        // Grade de blocos perigosos de gelo fino com caminho seguro de lajota no centro
        { id: 'gf_0', x: 32, y: 32, w: 64, h: 64, quebrado: false, timerSobre: 0 },
        { id: 'gf_1', x: 160, y: 32, w: 64, h: 64, quebrado: false, timerSobre: 0 },
        { id: 'gf_2', x: 32, y: 128, w: 64, h: 64, quebrado: false, timerSobre: 0 },
        { id: 'gf_3', x: 160, y: 128, w: 64, h: 64, quebrado: false, timerSobre: 0 },
      ],
      combateConcluido: true,
    },

    // 4. SALA DO TESOURO (BOTAS GLACIAIS & CHAVE DO CHEFE)
    sala_4_tesouro: {
      id: 'sala_4_tesouro',
      nome: 'Relicário dos Botas Glaciais',
      subtitulo: 'Câmara dos Tesouros Congelados',
      portas: [
        { direcao: 'leste', destinoSalaId: 'sala_3_gelo_fino', estado: 'aberta', x: 240, y: 88, w: 16, h: 48 },
      ],
      paredes: [
        ...paredesBordaComum(false, false, true, false),
        { x: 80, y: 48, w: 96, h: 16 },
      ],
      geloLiso: [
        { x: 16, y: 16, w: 224, h: 192 },
      ],
      baus: [
        { id: 'bau_botas', x: 80, y: 100, w: 24, h: 20, aberto: false, conteudo: 'botas_glaciais' },
        { id: 'bau_chave_chefe', x: 152, y: 100, w: 24, h: 20, aberto: false, conteudo: 'chave_chefe' },
      ],
      combateConcluido: true,
    },

    // 5. ANTECÂMARA DO CHEFE
    sala_5_antechamber: {
      id: 'sala_5_antechamber',
      nome: 'Antecâmara do Arauto',
      subtitulo: 'Portão da Neve Eterna',
      portas: [
        { direcao: 'sul', destinoSalaId: 'sala_3_gelo_fino', estado: 'aberta', x: 104, y: 208, w: 48, h: 16 },
        { direcao: 'norte', destinoSalaId: 'sala_6_chefe', estado: 'trancada_chefe', x: 104, y: 0, w: 48, h: 16 },
      ],
      paredes: [
        ...paredesBordaComum(true, true, false, false),
        { x: 48, y: 64, w: 32, h: 96 },
        { x: 176, y: 64, w: 32, h: 96 },
      ],
      geloLiso: [
        { x: 80, y: 16, w: 96, h: 192 },
      ],
      combateConcluido: true,
    },

    // 6. ARENA DO CHEFE GLACIUS
    sala_6_chefe: {
      id: 'sala_6_chefe',
      nome: 'Arena de Glacius',
      subtitulo: 'O Guardião do Vento Glacial',
      portas: [
        { direcao: 'sul', destinoSalaId: 'sala_5_antechamber', estado: 'aberta', x: 104, y: 208, w: 48, h: 16 },
      ],
      paredes: [
        ...paredesBordaComum(false, true, false, false),
      ],
      geloLiso: [
        { x: 16, y: 16, w: 224, h: 192 },
      ],
      combateConcluido: false,
    },
  };

  return {
    salaAtualId: 'sala_1_entrada',
    salas,
    transicaoTimer: 0,
    temChaveChefe: false,
    upgradeColetado: false,
  };
}

// -----------------------------------------------------------------------------
// FÁBRICAS DE INIMIGOS (RASTEJANTE DE GELO & CORUJA GLACIAL)
// -----------------------------------------------------------------------------

export function criarRastejanteGelo(id: string, x: number, y: number): InimigoEntidade {
  return {
    id,
    tipo: 'rastejante_gelo',
    x,
    y,
    w: 16,
    h: 14,
    hp: 3,
    hpMax: 3,
    direcao: 'baixo',
    velocidade: 35, // 35px/s
    iframeTimer: 0,
    vivo: true,
    submerso: false,
    submersoTimer: 0,
    reaparecerTimer: 3.5, // Fica visível por 3.5s antes de sumir na neve
  };
}

export function criarCorujaGlacial(id: string, x: number, y: number): InimigoEntidade {
  return {
    id,
    tipo: 'coruja_glacial',
    x,
    y,
    w: 16,
    h: 16,
    hp: 2,
    hpMax: 2,
    direcao: 'baixo',
    velocidade: 70, // 70px/s
    iframeTimer: 0,
    vivo: true,
    estadoCoruja: 'rondando',
    timerMergulho: 2.0, // Ronda por 2.0s antes de mergulhar em rasante
    origX: x,
    origY: y,
    targetX: x,
    targetY: y,
  };
}

// -----------------------------------------------------------------------------
// ATUALIZAÇÃO DA LÓGICA DO SANTUÁRIO DO GELO ETERNO E SEUS INIMIGOS/CHEFE
// -----------------------------------------------------------------------------

export function atualizarSantuarioGeloEterno(state: GameState, dt: number) {
  if (state.estadoAtual !== EstadoJogo.DUNGEON || state.dungeonTipoAtivo !== 'gelo_eterno') {
    return;
  }

  const dungeon = state.salasVisitadasGeloEterno
    ? (state as any).dungeonGeloState || criarDungeonGeloEternoInicial()
    : criarDungeonGeloEternoInicial();
  (state as any).dungeonGeloState = dungeon;

  const sala = dungeon.salas[dungeon.salaAtualId];
  if (!sala) return;

  const heroi = state.heroi;

  // Registrar sala nas salas visitadas para a cartografia do menu
  if (!state.salasVisitadasGeloEterno) {
    state.salasVisitadasGeloEterno = {};
  }
  state.salasVisitadasGeloEterno[sala.id] = true;

  // 1. APLICAR FÍSICA DE GELO LISO (0.7s de deslize pronunciado)
  if (heroi.deslizamentoTimer !== undefined && heroi.deslizamentoTimer > 0) {
    heroi.deslizamentoTimer -= dt;
  } else {
    heroi.deslizamentoTimer = 0.7; // Pronunciado no Santuário
  }

  // 2. LÓGICA DE PUZZLE DE GELO FINO (SALA 3)
  if (sala.geloFino && (!state.itemEquipado || state.itemEquipado !== 'botas_glaciais') && !state.itensSecundariosObtidos?.botas_glaciais) {
    const heroBox = { x: heroi.x + 2, y: heroi.y + 8, w: heroi.w - 4, h: heroi.h - 8 };

    sala.geloFino.forEach((gf) => {
      if (checkAABB(heroBox, gf)) {
        if (!gf.quebrado) {
          gf.timerSobre += dt;
          if (gf.timerSobre >= 1.0) {
            gf.quebrado = true;
            soundManager.playWaterSplash();
            state.vidaAtual = Math.max(0, state.vidaAtual - 1);
            heroi.iframes = 1.0;
            // Respawn no início da sala
            heroi.x = 120;
            heroi.y = 180;
            state.notificacaoTexto = 'O GELO QUEBROU! EXIGE BOTAS GLACIAIS!';
            state.notificacaoTimer = 2.5;
          }
        } else {
          // Já está quebrado -> Dano se pisar no buraco
          if (!heroi.iframes || heroi.iframes <= 0) {
            soundManager.playHeroHurt();
            state.vidaAtual = Math.max(0, state.vidaAtual - 1);
            heroi.iframes = 1.0;
            heroi.x = 120;
            heroi.y = 180;
          }
        }
      } else {
        gf.timerSobre = Math.max(0, gf.timerSobre - dt * 2);
      }
    });
  }

  // 3. ATUALIZAÇÃO DOS INIMIGOS (RASTEJANTE DE GELO & CORUJA GLACIAL)
  if (sala.inimigos && sala.inimigos.length > 0) {
    let todosMortos = true;

    sala.inimigos.forEach((inimigo) => {
      if (!inimigo.vivo) return;
      todosMortos = false;

      // Decremento de iframes do inimigo
      if (inimigo.iframeTimer > 0) {
        inimigo.iframeTimer -= dt;
      }

      // Colisão de ataque da espada do Herói
      if (heroi.atacando && inimigo.iframeTimer <= 0 && !inimigo.submerso) {
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
          } else if (inimigo.tipo === 'rastejante_gelo') {
            // Golpe faz o rastejante submergir na neve/gelo imediatamente
            inimigo.submerso = true;
            inimigo.submersoTimer = 1.5;
          }
        }
      }

      // Comportamento do Rastejante de Gelo (35px/s, some sob neve e reaparece)
      if (inimigo.tipo === 'rastejante_gelo') {
        if (inimigo.submerso) {
          inimigo.submersoTimer = (inimigo.submersoTimer || 0) - dt;
          // Move-se sob a neve em direção a Ren
          const dx = heroi.x - inimigo.x;
          const dy = heroi.y - inimigo.y;
          const dist = Math.hypot(dx, dy);
          if (dist > 2) {
            inimigo.x += (dx / dist) * inimigo.velocidade * dt;
            inimigo.y += (dy / dist) * inimigo.velocidade * dt;
          }

          if (inimigo.submersoTimer <= 0) {
            inimigo.submerso = false;
            inimigo.reaparecerTimer = 3.5;
          }
        } else {
          inimigo.reaparecerTimer = (inimigo.reaparecerTimer || 0) - dt;
          const dx = heroi.x - inimigo.x;
          const dy = heroi.y - inimigo.y;
          const dist = Math.hypot(dx, dy);
          if (dist > 2) {
            inimigo.x += (dx / dist) * (inimigo.velocidade * 0.7) * dt;
            inimigo.y += (dy / dist) * (inimigo.velocidade * 0.7) * dt;
          }

          if (inimigo.reaparecerTimer <= 0) {
            inimigo.submerso = true;
            inimigo.submersoTimer = 1.5;
          }

          // Dano no herói se visível
          if (!heroi.iframes || heroi.iframes <= 0) {
            if (checkAABB(heroi, inimigo)) {
              soundManager.playHeroHurt();
              state.vidaAtual = Math.max(0, state.vidaAtual - 1);
              heroi.iframes = 0.8;
            }
          }
        }
      }

      // Comportamento da Coruja Glacial (70px/s, mergulha em rasante e recua)
      if (inimigo.tipo === 'coruja_glacial') {
        if (inimigo.estadoCoruja === 'rondando') {
          inimigo.timerMergulho = (inimigo.timerMergulho || 2.0) - dt;
          if (inimigo.timerMergulho <= 0) {
            inimigo.estadoCoruja = 'rasante';
            inimigo.targetX = heroi.x;
            inimigo.targetY = heroi.y;
          }
        } else if (inimigo.estadoCoruja === 'rasante') {
          const dx = (inimigo.targetX || heroi.x) - inimigo.x;
          const dy = (inimigo.targetY || heroi.y) - inimigo.y;
          const dist = Math.hypot(dx, dy);
          if (dist > 4) {
            inimigo.x += (dx / dist) * inimigo.velocidade * dt;
            inimigo.y += (dy / dist) * inimigo.velocidade * dt;
          } else {
            inimigo.estadoCoruja = 'retornando';
          }

          // Dano no herói durante o rasante
          if (!heroi.iframes || heroi.iframes <= 0) {
            if (checkAABB(heroi, inimigo)) {
              soundManager.playHeroHurt();
              state.vidaAtual = Math.max(0, state.vidaAtual - 1);
              heroi.iframes = 0.8;
            }
          }
        } else if (inimigo.estadoCoruja === 'retornando') {
          const dx = (inimigo.origX || inimigo.x) - inimigo.x;
          const dy = (inimigo.origY || inimigo.y) - inimigo.y;
          const dist = Math.hypot(dx, dy);
          if (dist > 4) {
            inimigo.x += (dx / dist) * (inimigo.velocidade * 0.8) * dt;
            inimigo.y += (dy / dist) * (inimigo.velocidade * 0.8) * dt;
          } else {
            inimigo.estadoCoruja = 'rondando';
            inimigo.timerMergulho = 2.5;
          }
        }
      }
    });

    // Se todos os inimigos foram derrotados, destranca as portas trancadas por inimigos
    if (todosMortos && !sala.combateConcluido) {
      sala.combateConcluido = true;
      soundManager.playDoorOpen();
      sala.portas.forEach((p) => {
        if (p.estado === 'trancada_inimigos') {
          p.estado = 'aberta';
        }
      });
      state.notificacaoTexto = 'SALA PURIFICADA! PORTAS ABERTAS!';
      state.notificacaoTimer = 2.0;
    }
  }

  // 4. LÓGICA DE BAÚS DA SALA 4 (BOTAS GLACIAIS & CHAVE DO CHEFE)
  if (sala.baus) {
    sala.baus.forEach((bau) => {
      if (!bau.aberto) {
        const heroHitBox = { x: heroi.x - 4, y: heroi.y - 4, w: heroi.w + 8, h: heroi.h + 8 };
        if (checkAABB(heroHitBox, bau)) {
          bau.aberto = true;
          soundManager.playChestOpen();

          if (bau.conteudo === 'botas_glaciais') {
            state.itemEquipado = 'botas_glaciais';
            state.itensSecundariosObtidos.botas_glaciais = true;
            state.dungeonItemObtido = {
              nome: 'BOTAS DE PASSO GLACIAL',
              subtitulo: 'Permite caminhar sobre gelo fino sem quebrá-lo!',
              iconeTipo: 'botas_glaciais',
              timer: 3.5,
            };
          } else if (bau.conteudo === 'chave_chefe') {
            dungeon.temChaveChefe = true;
            state.dungeonTemChaveChefe = true;
            state.notificacaoTexto = 'ENCONTROU A CHAVE GRANDE DO CHEFE!';
            state.notificacaoTimer = 3.0;
          }
        }
      }
    });
  }

  // 5. CHEFE GLACIUS (ARENA SALA 6)
  if (sala.id === 'sala_6_chefe') {
    if (!state.chefeGlacius) {
      state.chefeGlacius = criarChefeGlaciusInicial();
    }
    const boss = state.chefeGlacius;
    boss.ativo = true;

    if (!boss.derrotado) {
      // Decremento do iframe do chefe
      if (boss.iframeTimer > 0) boss.iframeTimer -= dt;

      // ESTADO 1: PREPARANDO (Targeting axis, 1.0s)
      if (boss.estado === 'preparando') {
        boss.prepTimer -= dt;

        // Mira na linha de alinhamento do herói (x ou y)
        const dx = heroi.x - boss.x;
        const dy = heroi.y - boss.y;
        if (Math.abs(dx) > Math.abs(dy)) {
          boss.direcaoInvestida = dx > 0 ? 'leste' : 'oeste';
        } else {
          boss.direcaoInvestida = dy > 0 ? 'sul' : 'norte';
        }

        if (boss.prepTimer <= 0) {
          boss.estado = 'investida';
          if (boss.direcaoInvestida === 'leste') { boss.vx = 160; boss.vy = 0; }
          else if (boss.direcaoInvestida === 'oeste') { boss.vx = -160; boss.vy = 0; }
          else if (boss.direcaoInvestida === 'sul') { boss.vx = 0; boss.vy = 160; }
          else if (boss.direcaoInvestida === 'norte') { boss.vx = 0; boss.vy = -160; }
        }
      }

      // ESTADO 2: INVESTIDA (Desliza até colidir com parede)
      else if (boss.estado === 'investida') {
        boss.x += boss.vx * dt;
        boss.y += boss.vy * dt;

        // Dano no Herói se encostar no boss deslizando
        if (!heroi.iframes || heroi.iframes <= 0) {
          if (checkAABB(heroi, boss)) {
            soundManager.playHeroHurt();
            state.vidaAtual = Math.max(0, state.vidaAtual - 1);
            heroi.iframes = 1.0;
          }
        }

        // Colisão com as paredes da arena
        if (boss.x <= 16 || boss.x + boss.w >= 240 || boss.y <= 16 || boss.y + boss.h >= 208) {
          boss.x = Math.max(16, Math.min(240 - boss.w, boss.x));
          boss.y = Math.max(16, Math.min(208 - boss.h, boss.y));

          // Entra em Atordoamento (2.0s com estrelinhas)
          boss.estado = 'atordoado';
          boss.atordoadoTimer = 2.0;
          boss.acertosNoAtordoamentoAtual = 0;
          soundManager.playClank();
        }
      }

      // ESTADO 3: ATORDOADO (2.0s, VULNERÁVEL A MÁXIMO 2 ACERTOS DE ESPADA)
      else if (boss.estado === 'atordoado') {
        boss.atordoadoTimer -= dt;

        // Checar ataque da espada do herói
        if (heroi.atacando && boss.iframeTimer <= 0) {
          let hitArea: Retangulo = { x: 0, y: 0, w: 0, h: 0 };
          if (heroi.direcao === 'cima') hitArea = { x: heroi.x - 4, y: heroi.y - 14, w: 24, h: 16 };
          else if (heroi.direcao === 'baixo') hitArea = { x: heroi.x - 4, y: heroi.y + 16, w: 24, h: 16 };
          else if (heroi.direcao === 'esquerda') hitArea = { x: heroi.x - 14, y: heroi.y - 4, w: 16, h: 24 };
          else if (heroi.direcao === 'direita') hitArea = { x: heroi.x + 16, y: heroi.y - 4, w: 16, h: 24 };

          if (checkAABB(hitArea, boss)) {
            boss.hp -= 1;
            boss.acertosNoAtordoamentoAtual += 1;
            boss.iframeTimer = 0.3;
            soundManager.playEnemyHit();

            if (boss.hp <= 0) {
              boss.derrotado = true;
              boss.estado = 'derrotado';
              boss.cutsceneVitoriaTimer = 3.0;
              soundManager.playBossDefeat();

              // Concede vitória, relicário e botas
              state.relicariosObtidos.gelo = true;
              state.itemEquipado = 'botas_glaciais';
              state.itensSecundariosObtidos.botas_glaciais = true;
              state.notificacaoTexto = 'PURIFICADO! RELICÁRIO DO GELO ETERNO OBTIDO!';
              state.notificacaoTimer = 4.0;
            } else if (boss.acertosNoAtordoamentoAtual >= 2) {
              // Recupera-se do atordoamento e vai para o leque de estilhaços
              boss.investidasAtordoadasAcertadas += 1;
              boss.estado = 'leque_estilhaços';
              boss.estilhacosDisparados = false;
            }
          }
        }

        if (boss.atordoadoTimer <= 0 && boss.estado === 'atordoado') {
          boss.estado = 'leque_estilhaços';
          boss.estilhacosDisparados = false;
        }
      }

      // ESTADO 4: LEQUE DE ESTILHAÇOS DE GELO (DISPARA 3 A 5 PROJECTEIS)
      else if (boss.estado === 'leque_estilhaços') {
        if (!boss.estilhacosDisparados) {
          boss.estilhacosDisparados = true;
          soundManager.playSpikeShoot();

          if (!state.projeteisEstilhacoGelo) state.projeteisEstilhacoGelo = [];

          // Dispara 4 estilhaços em leque a 110px/s
          const anguloBase = Math.atan2(heroi.y - boss.y, heroi.x - boss.x);
          const deltas = [-0.35, -0.12, 0.12, 0.35];

          deltas.forEach((d, idx) => {
            const ang = anguloBase + d;
            state.projeteisEstilhacoGelo!.push({
              id: `estilhaco_${Date.now()}_${idx}`,
              x: boss.x + boss.w / 2,
              y: boss.y + boss.h / 2,
              vx: Math.cos(ang) * 110,
              vy: Math.sin(ang) * 110,
              raio: 4,
              ativo: true,
              tempoVida: 2.5,
            });
          });
        }

        boss.prepTimer = 1.2;
        boss.estado = 'preparando';
      }
    }
  }

  // 6. ATUALIZAÇÃO DOS PROJÉTEIS DE ESTILHAÇO DE GELO
  if (state.projeteisEstilhacoGelo && state.projeteisEstilhacoGelo.length > 0) {
    state.projeteisEstilhacoGelo.forEach((p) => {
      if (!p.ativo) return;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.tempoVida -= dt;

      if (p.tempoVida <= 0 || p.x <= 16 || p.x >= 240 || p.y <= 16 || p.y >= 208) {
        p.ativo = false;
        return;
      }

      // Dano ao herói
      if (!heroi.iframes || heroi.iframes <= 0) {
        const dist = Math.hypot(heroi.x + 8 - p.x, heroi.y + 8 - p.y);
        if (dist < 10) {
          soundManager.playHeroHurt();
          state.vidaAtual = Math.max(0, state.vidaAtual - 1);
          heroi.iframes = 0.8;
          p.ativo = false;
        }
      }
    });

    state.projeteisEstilhacoGelo = state.projeteisEstilhacoGelo.filter((p) => p.ativo);
  }

  // 7. COLISÃO E TRANSIÇÃO ENTRE SALAS
  sala.portas.forEach((porta) => {
    const pBox = { x: porta.x, y: porta.y, w: porta.w, h: porta.h };
    if (checkAABB(heroi, pBox)) {
      if (porta.estado === 'aberta') {
        if (porta.destinoSalaId === 'overworld') {
          // Retorna ao Overworld de Terras Geladas
          state.estadoAtual = EstadoJogo.OVERWORLD;
          state.regiaoAtual = 'geladas';
          heroi.x = 384;
          heroi.y = 120;
          state.notificacaoTexto = 'TERRAS GELADAS • VILAREJO GÉLIDA';
          state.notificacaoTimer = 2.5;
          soundManager.playDoorOpen();
        } else {
          dungeon.salaAtualId = porta.destinoSalaId;
          dungeon.transicaoTimer = 0.2;
          soundManager.playDoorOpen();

          // Posiciona o Herói na entrada da nova sala
          if (porta.direcao === 'norte') { heroi.x = 120; heroi.y = 180; }
          else if (porta.direcao === 'sul') { heroi.x = 120; heroi.y = 30; }
          else if (porta.direcao === 'oeste') { heroi.x = 216; heroi.y = 104; }
          else if (porta.direcao === 'leste') { heroi.x = 24; heroi.y = 104; }
        }
      } else if (porta.estado === 'trancada_chefe' && (dungeon.temChaveChefe || state.dungeonTemChaveChefe)) {
        porta.estado = 'aberta';
        soundManager.playDoorOpen();
        state.notificacaoTexto = 'USOU A CHAVE GRANDE! PORTA DO CHEFE ABERTA!';
        state.notificacaoTimer = 2.5;
      }
    }
  });
}

// -----------------------------------------------------------------------------
// RENDERIZAÇÃO GRÁFICA DO SANTUÁRIO DO GELO ETERNO (16-BIT CANVAS)
// -----------------------------------------------------------------------------

export function renderizarSantuarioGeloEterno(ctx: CanvasRenderingContext2D, state: GameState) {
  const dungeon = (state as any).dungeonGeloState || criarDungeonGeloEternoInicial();
  const sala = dungeon.salas[dungeon.salaAtualId];
  if (!sala) return;

  const timer = state.tituloTimer;

  // 1. Fundo Azul Escuro (#0f1e2e)
  ctx.fillStyle = '#0f1e2e';
  ctx.fillRect(0, 0, 256, 224);

  // 2. Lajotas de Pedra Congelada (#1e3850) com ranhuras brilhantes
  ctx.fillStyle = '#1e3850';
  ctx.fillRect(16, 16, 224, 192);

  ctx.strokeStyle = 'rgba(168, 200, 224, 0.2)';
  ctx.lineWidth = 1;
  for (let x = 16; x < 240; x += 16) {
    for (let y = 16; y < 208; y += 16) {
      ctx.strokeRect(x, y, 16, 16);
    }
  }

  // 3. Renderizar Zonas de Gelo Liso (#bce0f8 com brilhos brancos)
  if (sala.geloLiso) {
    sala.geloLiso.forEach((g) => {
      ctx.fillStyle = '#a0d8f8';
      ctx.fillRect(g.x, g.y, g.w, g.h);

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.beginPath();
      ctx.moveTo(g.x + 8, g.y + 4);
      ctx.lineTo(g.x + g.w - 12, g.y + 4);
      ctx.stroke();
    });
  }

  // 4. Renderizar Blocos de Gelo Fino (Puzzle da Sala 3)
  if (sala.geloFino) {
    sala.geloFino.forEach((gf) => {
      if (gf.quebrado) {
        ctx.fillStyle = '#081420';
        ctx.fillRect(gf.x, gf.y, gf.w, gf.h);
        ctx.strokeStyle = '#38bdf8';
        ctx.strokeRect(gf.x, gf.y, gf.w, gf.h);
      } else {
        ctx.fillStyle = '#82c0e8';
        ctx.fillRect(gf.x, gf.y, gf.w, gf.h);

        ctx.strokeStyle = '#ffffff';
        ctx.strokeRect(gf.x + 1, gf.y + 1, gf.w - 2, gf.h - 2);

        // Se o herói está em cima prestes a quebrar -> ranhuras piscando
        if (gf.timerSobre > 0.3) {
          ctx.strokeStyle = '#ef4444';
          ctx.beginPath();
          ctx.moveTo(gf.x + 4, gf.y + 4);
          ctx.lineTo(gf.x + gf.w - 4, gf.y + gf.h - 4);
          ctx.stroke();
        }
      }
    });
  }

  // 5. Paredes de Gelo Translúcido (#c8e8f0 com 70% opacidade)
  ctx.save();
  ctx.fillStyle = 'rgba(200, 232, 240, 0.75)';
  sala.paredes.forEach((p) => {
    ctx.fillRect(p.x, p.y, p.w, p.h);

    // Cristais de gelo e quinas
    ctx.strokeStyle = '#ffffff';
    ctx.strokeRect(p.x, p.y, p.w, p.h);
  });
  ctx.restore();

  // 6. Portas do Santuário
  sala.portas.forEach((p) => {
    if (p.estado === 'aberta') {
      ctx.fillStyle = '#0f1e2e';
      ctx.fillRect(p.x, p.y, p.w, p.h);
    } else if (p.estado === 'trancada_chefe') {
      ctx.fillStyle = '#fbbf24'; // Dourado do Chefe
      ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.fillStyle = '#000000';
      ctx.font = '8px monospace';
      ctx.fillText('👑', p.x + 18, p.y + 12);
    } else {
      ctx.fillStyle = '#4a6a8a';
      ctx.fillRect(p.x, p.y, p.w, p.h);
    }
  });

  // 7. Baús de Tesouro (Sala 4)
  if (sala.baus) {
    sala.baus.forEach((bau) => {
      ctx.fillStyle = bau.aberto ? '#4a5568' : '#d97706';
      ctx.fillRect(bau.x, bau.y, bau.w, bau.h);
      ctx.strokeStyle = '#fef08a';
      ctx.strokeRect(bau.x, bau.y, bau.w, bau.h);

      if (!bau.aberto) {
        ctx.fillStyle = '#ffffff';
        ctx.font = '8px monospace';
        ctx.fillText('🎁', bau.x + 6, bau.y + 14);
      }
    });
  }

  // 8. Inimigos (Rastejante de Gelo & Coruja Glacial)
  if (sala.inimigos) {
    sala.inimigos.forEach((inimigo) => {
      if (!inimigo.vivo) return;

      if (inimigo.tipo === 'rastejante_gelo') {
        if (inimigo.submerso) {
          // Rastro na neve
          ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.beginPath();
          ctx.arc(inimigo.x + 8, inimigo.y + 7, 6, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Corpo do Rastejante de Gelo
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(inimigo.x + 2, inimigo.y + 2, 12, 10);
          ctx.fillStyle = '#ffffff'; // Carapaça
          ctx.fillRect(inimigo.x + 4, inimigo.y, 8, 4);
          ctx.fillStyle = '#ef4444'; // Olhos vermelhos
          ctx.fillRect(inimigo.x + 5, inimigo.y + 2, 2, 2);
          ctx.fillRect(inimigo.x + 9, inimigo.y + 2, 2, 2);
        }
      } else if (inimigo.tipo === 'coruja_glacial') {
        // Coruja Glacial
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.ellipse(inimigo.x + 8, inimigo.y + 15, 6, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff'; // Penas brancas
        ctx.fillRect(inimigo.x + 3, inimigo.y + 2, 10, 10);
        ctx.fillStyle = '#a8c8e0'; // Asas
        ctx.fillRect(inimigo.x, inimigo.y + 4, 3, 6);
        ctx.fillRect(inimigo.x + 13, inimigo.y + 4, 3, 6);
        ctx.fillStyle = '#fbbf24'; // Olhos amarelos
        ctx.fillRect(inimigo.x + 5, inimigo.y + 4, 2, 2);
        ctx.fillRect(inimigo.x + 9, inimigo.y + 4, 2, 2);
      }
    });
  }

  // 9. CHEFE GLACIUS (SALA 6)
  if (sala.id === 'sala_6_chefe' && state.chefeGlacius) {
    const boss = state.chefeGlacius;

    if (!boss.derrotado) {
      // Corpo Principal do Golem/Guerreiro Glacius (#38bdf8 / #ffffff)
      ctx.fillStyle = boss.estado === 'atordoado' ? '#93c5fd' : '#0284c7';
      ctx.fillRect(boss.x, boss.y, boss.w, boss.h);

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.strokeRect(boss.x + 1, boss.y + 1, boss.w - 2, boss.h - 2);

      // Yelmo de Gelo & Olhos Glaciais
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(boss.x + 8, boss.y + 6, 20, 8);
      ctx.fillStyle = '#67e8f9';
      ctx.fillRect(boss.x + 10, boss.y + 8, 4, 4);
      ctx.fillRect(boss.x + 22, boss.y + 8, 4, 4);

      // Animação de Estrelinhas se estiver ATORDOADO (Vulnerável!)
      if (boss.estado === 'atordoado') {
        const starAngle = timer * 6;
        for (let i = 0; i < 3; i++) {
          const ang = starAngle + (i * Math.PI * 2) / 3;
          const sx = boss.x + boss.w / 2 + Math.cos(ang) * 22;
          const sy = boss.y - 6 + Math.sin(ang) * 8;
          ctx.fillStyle = '#fbbf24';
          ctx.font = '10px monospace';
          ctx.fillText('⭐', sx, sy);
        }

        // Borda pulsante amarela indicando VULNERABILIDADE
        ctx.strokeStyle = '#fef08a';
        ctx.strokeRect(boss.x - 2, boss.y - 2, boss.w + 4, boss.h + 4);
      }

      // Barra de Vida do Chefe no Topo (10 acertos)
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(48, 12, 160, 10);
      ctx.strokeStyle = '#38bdf8';
      ctx.strokeRect(48, 12, 160, 10);

      const pctHp = Math.max(0, boss.hp / boss.hpMax);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(50, 14, 156 * pctHp, 6);

      ctx.fillStyle = '#ffffff';
      ctx.font = '8px monospace';
      ctx.fillText('GLACIUS, O GUARDIÃO GLACIAL', 52, 10);
    } else {
      // Relicário do Gelo Eterno no centro
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(128, 112, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.font = '10px monospace';
      ctx.fillText('❄', 124, 116);
    }
  }

  // 10. PROJÉTEIS DE ESTILHAÇO DE GELO
  if (state.projeteisEstilhacoGelo) {
    state.projeteisEstilhacoGelo.forEach((p) => {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.raio, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#38bdf8';
      ctx.stroke();
    });
  }
}
