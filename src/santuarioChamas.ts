import {
  AshraBossState,
  Direcao,
  EstadoJogo,
  GameState,
  HeroState,
  InimigoEntidade,
  ProjetilBolaFogo,
  Retangulo,
} from './types';
import { soundManager } from './soundEffects';
import { checkAABB } from './combat';
import { OBSTACULOS_DESERTO_KAAL } from './desertoKaal';

// =============================================================================
// ELDRIM: ECOS DO PASSADO - REGIÃO 4: SANTUÁRIO DAS CHAMAS & CHEFE ASHRA
// =============================================================================
// Paleta Oficial: #78350f (Rocha Vulcânica) / #b91c1c (Magma) / #f59e0b (Brilho Flamejante)
// Resolução da Sala: 256x224px
// =============================================================================

export interface SalaDungeonChamas {
  id: string;
  nome: string;
  largura: number;
  altura: number;
  portas: {
    direcao: Direcao;
    destinoSalaId: string;
    trancada?: boolean;
    requerChaveChefe?: boolean;
    estado: 'aberta' | 'trancada';
  }[];
  obstaculos: Retangulo[];
  pilaresEmpurraveis?: { id: string; x: number; y: number; w: number; h: number; deslocado?: boolean }[];
  bau?: { x: number; y: number; aberto: boolean; tipo: 'manopla' | 'chave_chefe' | 'relicario' };
  inimigos: InimigoEntidade[];
}

export interface DungeonChamasState {
  salaAtualId: string;
  salas: Record<string, SalaDungeonChamas>;
}

export function criarChefeAshraInicial(): AshraBossState {
  return {
    ativo: true,
    derrotado: false,
    x: 120,
    y: 60,
    w: 24,
    h: 28,
    hp: 12,
    hpMax: 12,
    estado: 'teleportando',
    posicaoPlataformaIndex: 0,
    teleportTimer: 1.5,
    canalizarTimer: 0,
    atordoadoTimer: 0,
    disparoTimer: 0,
    escudoChamas: true,
    iframeTimer: 0,
    cutsceneVitoriaTimer: 0,
    manoplaIgneaLiberada: false,
    relicarioLiberado: false,
  };
}

// -----------------------------------------------------------------------------
// CRIAÇÃO DA ESTRUTURA DO SANTUÁRIO DAS CHAMAS (6 SALAS)
// -----------------------------------------------------------------------------

export function criarDungeonChamasInicial(): DungeonChamasState {
  const salas: Record<string, SalaDungeonChamas> = {
    sala_1_entrada: {
      id: 'sala_1_entrada',
      nome: 'Portal do Vulcão',
      largura: 256,
      altura: 224,
      portas: [
        { direcao: 'cima', destinoSalaId: 'sala_2_estatuas', estado: 'aberta' },
        { direcao: 'baixo', destinoSalaId: 'overworld', estado: 'aberta' },
      ],
      obstaculos: [
        { x: 0, y: 0, w: 96, h: 16 },
        { x: 160, y: 0, w: 96, h: 16 },
        { x: 0, y: 0, w: 16, h: 224 },
        { x: 240, y: 0, w: 16, h: 224 },
        { x: 0, y: 208, w: 96, h: 16 },
        { x: 160, y: 208, w: 96, h: 16 },
      ],
      inimigos: [],
    },
    sala_2_estatuas: {
      id: 'sala_2_estatuas',
      nome: 'Câmara das Estátuas Flamejantes',
      largura: 256,
      altura: 224,
      portas: [
        { direcao: 'baixo', destinoSalaId: 'sala_1_entrada', estado: 'aberta' },
        { direcao: 'direita', destinoSalaId: 'sala_3_ponte_magma', estado: 'aberta' },
      ],
      obstaculos: [
        { x: 0, y: 0, w: 256, h: 16 },
        { x: 0, y: 208, w: 96, h: 16 },
        { x: 160, y: 208, w: 96, h: 16 },
        { x: 0, y: 0, w: 16, h: 224 },
        { x: 240, y: 0, w: 16, h: 96 },
        { x: 240, y: 160, w: 16, h: 64 },
      ],
      inimigos: [
        {
          id: 'mumia_1',
          tipo: 'mumia_fogo',
          x: 60,
          y: 80,
          w: 16,
          h: 18,
          hp: 4,
          hpMax: 4,
          direcao: 'baixo',
          velocidade: 40,
          iframeTimer: 0,
          vivo: true,
        },
        {
          id: 'mumia_2',
          tipo: 'mumia_fogo',
          x: 180,
          y: 80,
          w: 16,
          h: 18,
          hp: 4,
          hpMax: 4,
          direcao: 'baixo',
          velocidade: 40,
          iframeTimer: 0,
          vivo: true,
        },
      ],
    },
    sala_3_ponte_magma: {
      id: 'sala_3_ponte_magma',
      nome: 'Ponte de Magma & Pilares',
      largura: 256,
      altura: 224,
      portas: [
        { direcao: 'esquerda', destinoSalaId: 'sala_2_estatuas', estado: 'aberta' },
        { direcao: 'cima', destinoSalaId: 'sala_4_relicario_manopla', estado: 'aberta' },
      ],
      obstaculos: [
        { x: 0, y: 0, w: 96, h: 16 },
        { x: 160, y: 0, w: 96, h: 16 },
        { x: 0, y: 208, w: 256, h: 16 },
        { x: 240, y: 0, w: 16, h: 224 },
        { x: 0, y: 0, w: 16, h: 96 },
        { x: 0, y: 160, w: 16, h: 64 },
        // Lava em volta da ponte central
        { x: 16, y: 16, w: 80, h: 192, rotulo: 'lava' },
        { x: 160, y: 16, w: 80, h: 192, rotulo: 'lava' },
      ],
      pilaresEmpurraveis: [
        { id: 'pilar_1', x: 112, y: 100, w: 32, h: 32, deslocado: false },
      ],
      inimigos: [],
    },
    sala_4_relicario_manopla: {
      id: 'sala_4_relicario_manopla',
      nome: 'Câmara da Manopla Ígnea',
      largura: 256,
      altura: 224,
      portas: [
        { direcao: 'baixo', destinoSalaId: 'sala_3_ponte_magma', estado: 'aberta' },
        { direcao: 'esquerda', destinoSalaId: 'sala_5_antecamara', estado: 'aberta' },
      ],
      bau: { x: 116, y: 60, aberto: false, tipo: 'manopla' },
      obstaculos: [
        { x: 0, y: 0, w: 256, h: 16 },
        { x: 0, y: 208, w: 96, h: 16 },
        { x: 160, y: 208, w: 96, h: 16 },
        { x: 240, y: 0, w: 16, h: 224 },
        { x: 0, y: 0, w: 16, h: 96 },
        { x: 0, y: 160, w: 16, h: 64 },
      ],
      inimigos: [],
    },
    sala_5_antecamara: {
      id: 'sala_5_antecamara',
      nome: 'Antecâmara do Templo',
      largura: 256,
      altura: 224,
      portas: [
        { direcao: 'direita', destinoSalaId: 'sala_4_relicario_manopla', estado: 'aberta' },
        { direcao: 'cima', destinoSalaId: 'sala_6_chefe', estado: 'trancada', requerChaveChefe: true },
      ],
      obstaculos: [
        { x: 0, y: 0, w: 96, h: 16 },
        { x: 160, y: 0, w: 96, h: 16 },
        { x: 0, y: 208, w: 256, h: 16 },
        { x: 0, y: 0, w: 16, h: 224 },
        { x: 240, y: 0, w: 16, h: 96 },
        { x: 240, y: 160, w: 16, h: 64 },
      ],
      inimigos: [
        {
          id: 'mumia_3',
          tipo: 'mumia_fogo',
          x: 120,
          y: 120,
          w: 16,
          h: 18,
          hp: 4,
          hpMax: 4,
          direcao: 'baixo',
          velocidade: 40,
          iframeTimer: 0,
          vivo: true,
        },
      ],
    },
    sala_6_chefe: {
      id: 'sala_6_chefe',
      nome: 'Arena de Ashra, Rainha das Chamas',
      largura: 256,
      altura: 224,
      portas: [
        { direcao: 'baixo', destinoSalaId: 'sala_5_antecamara', estado: 'aberta' },
      ],
      obstaculos: [
        { x: 0, y: 0, w: 256, h: 16 },
        { x: 0, y: 0, w: 16, h: 224 },
        { x: 240, y: 0, w: 16, h: 224 },
        { x: 0, y: 208, w: 96, h: 16 },
        { x: 160, y: 208, w: 96, h: 16 },
      ],
      inimigos: [],
    },
  };

  return {
    salaAtualId: 'sala_1_entrada',
    salas,
  };
}

// -----------------------------------------------------------------------------
// LÓGICA DE ATUALIZAÇÃO DO SANTUÁRIO DAS CHAMAS
// -----------------------------------------------------------------------------

export function atualizarSantuarioChamas(state: GameState, dt: number) {
  if (state.estadoAtual !== EstadoJogo.DUNGEON || state.dungeonTipoAtivo !== 'santuario_chamas') {
    return;
  }

  const dung = (state as any).dungeonChamasState as DungeonChamasState;
  if (!dung) return;

  const salaAtual = dung.salas[dung.salaAtualId];
  if (!salaAtual) return;

  const heroi = state.heroi;

  // Marcar sala como visitada
  if (!state.salasVisitadasChamas) state.salasVisitadasChamas = {};
  state.salasVisitadasChamas[dung.salaAtualId] = true;

  // 1. Inimigos da Sala (Múmias de Fogo)
  salaAtual.inimigos.forEach((inimigo) => {
    if (!inimigo.vivo) return;

    if (inimigo.iframeTimer > 0) inimigo.iframeTimer -= dt;

    // Colisão do Ataque do Herói
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
          state.selos += 5;
        }
      }
    }

    // Movimento perseguindo Herói
    const dx = heroi.x - inimigo.x;
    const dy = heroi.y - inimigo.y;
    const dist = Math.hypot(dx, dy);

    if (dist > 4 && dist < 150) {
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
  });

  // 2. Interação com Baú da Manopla Ígnea
  if (salaAtual.bau && !salaAtual.bau.aberto) {
    const distBau = Math.hypot(heroi.x + 8 - salaAtual.bau.x, heroi.y + 8 - salaAtual.bau.y);
    if (distBau < 20) {
      salaAtual.bau.aberto = true;
      soundManager.playChestOpen();

      state.itensSecundariosObtidos.manopla_ignea = true;
      state.itemEquipado = 'manopla_ignea';
      state.dungeonTemChaveChefe = true;

      state.dungeonItemObtido = {
        nome: 'MANOPLA ÍGNEA',
        subtitulo: 'Impacto vulcânico para socar pilares e quebrar escudos de fogo!',
        iconeTipo: 'manopla',
        timer: 4.0,
      };
    }
  }

  // 3. Atualização do Chefe Ashra (Sala 6)
  if (dung.salaAtualId === 'sala_6_chefe') {
    if (!state.chefeAshra) state.chefeAshra = criarChefeAshraInicial();
    const boss = state.chefeAshra;

    if (!boss.derrotado) {
      if (boss.iframeTimer > 0) boss.iframeTimer -= dt;

      // Teletransporte entre 4 Plataformas (SupEsq, SupDir, InfEsq, InfDir)
      const plataformas = [
        { x: 40, y: 40 },
        { x: 190, y: 40 },
        { x: 40, y: 150 },
        { x: 190, y: 150 },
      ];

      if (boss.estado === 'teleportando') {
        boss.teleportTimer -= dt;
        if (boss.teleportTimer <= 0) {
          boss.posicaoPlataformaIndex = (boss.posicaoPlataformaIndex + 1) % 4;
          const pos = plataformas[boss.posicaoPlataformaIndex];
          boss.x = pos.x;
          boss.y = pos.y;

          boss.estado = 'canalizando';
          boss.canalizarTimer = 3.0; // Canalizando com escudo de chamas
          boss.escudoChamas = true;
        }
      } else if (boss.estado === 'canalizando') {
        boss.canalizarTimer -= dt;

        // Dispara esferas flamejantes periodicamente
        boss.disparoTimer += dt;
        if (boss.disparoTimer >= 1.0) {
          boss.disparoTimer = 0;
          soundManager.playSpikeShoot();

          if (!state.projeteisFogo) state.projeteisFogo = [];
          const dx = heroi.x - boss.x;
          const dy = heroi.y - boss.y;
          const dist = Math.hypot(dx, dy) || 1;

          state.projeteisFogo.push({
            id: 'fogo_' + Date.now() + '_' + Math.random(),
            x: boss.x + 12,
            y: boss.y + 14,
            vx: (dx / dist) * 110,
            vy: (dy / dist) * 110,
            raio: 4,
            ativo: true,
            tempoVida: 3.0,
            tipo: 'bola',
          });
        }

        // Se o Herói usar o Soco da MANOPLA ÍGNEA perto de Ashra enquanto canaliza -> Quebra Escudo e Atordoa!
        if (state.itemEquipado === 'manopla_ignea' && (heroi as any).usandoManopla) {
          const distSoco = Math.hypot(heroi.x + 8 - (boss.x + 12), heroi.y + 8 - (boss.y + 14));
          if (distSoco < 28) {
            boss.escudoChamas = false;
            boss.estado = 'atordoado';
            boss.atordoadoTimer = 2.5;
            soundManager.playClank();
            (heroi as any).usandoManopla = false;
          }
        }

        if (boss.canalizarTimer <= 0) {
          boss.estado = 'teleportando';
          boss.teleportTimer = 1.0;
        }
      } else if (boss.estado === 'atordoado') {
        boss.atordoadoTimer -= dt;

        // Dano da Espada de Ren enquanto atordoada
        if (heroi.atacando && boss.iframeTimer <= 0) {
          boss.hp -= 1;
          boss.iframeTimer = 0.3;
          soundManager.playEnemyHit();

          if (boss.hp <= 0) {
            boss.derrotado = true;
            boss.estado = 'derrotado';
            boss.cutsceneVitoriaTimer = 3.0;
            soundManager.playBossDefeat();

            state.relicariosObtidos.chamas = true;
            state.notificacaoTexto = 'SANTUÁRIO DAS CHAMAS PURIFICADO!';
            state.notificacaoTimer = 3.0;
          }
        }

        if (boss.atordoadoTimer <= 0 && !boss.derrotado) {
          boss.estado = 'teleportando';
          boss.teleportTimer = 1.0;
        }
      }
    }
  }

  // 4. Projéteis de Fogo
  if (state.projeteisFogo) {
    state.projeteisFogo.forEach((p) => {
      if (!p.ativo) return;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.tempoVida -= dt;
      if (p.tempoVida <= 0) p.ativo = false;

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
  }

  // 5. Transição de Portas
  salaAtual.portas.forEach((porta) => {
    let portaRect: Retangulo = { x: 0, y: 0, w: 0, h: 0 };
    if (porta.direcao === 'cima') portaRect = { x: 104, y: 0, w: 48, h: 16 };
    else if (porta.direcao === 'baixo') portaRect = { x: 104, y: 208, w: 48, h: 16 };
    else if (porta.direcao === 'esquerda') portaRect = { x: 0, y: 96, w: 16, h: 64 };
    else if (porta.direcao === 'direita') portaRect = { x: 240, y: 96, w: 16, h: 64 };

    if (checkAABB(heroi, portaRect)) {
      if (porta.trancada && porta.requerChaveChefe) {
        if (state.dungeonTemChaveChefe) {
          porta.trancada = false;
          porta.estado = 'aberta';
          soundManager.playDoorUnlock();
        } else {
          soundManager.playHookError();
          return;
        }
      }

      if (porta.destinoSalaId === 'overworld') {
        state.estadoAtual = EstadoJogo.OVERWORLD;
        state.regiaoAtual = 'kaal';
        state.obstaculos = OBSTACULOS_DESERTO_KAAL;
        state.telaAtualX = 1;
        state.telaAtualY = 0;
        heroi.x = 384;
        heroi.y = 70;
        heroi.direcao = 'baixo';
        soundManager.playDoorOpen();
      } else if (dung.salas[porta.destinoSalaId]) {
        dung.salaAtualId = porta.destinoSalaId;
        soundManager.playDoorOpen();

        // Reposicionar herói
        if (porta.direcao === 'cima') heroi.y = 180;
        else if (porta.direcao === 'baixo') heroi.y = 20;
        else if (porta.direcao === 'esquerda') heroi.x = 210;
        else if (porta.direcao === 'direita') heroi.x = 20;
      }
    }
  });
}

// -----------------------------------------------------------------------------
// RENDERIZAÇÃO DO SANTUÁRIO DAS CHAMAS
// -----------------------------------------------------------------------------

export function renderizarSantuarioChamas(ctx: CanvasRenderingContext2D, state: GameState) {
  const dung = (state as any).dungeonChamasState as DungeonChamasState;
  if (!dung) return;

  const sala = dung.salas[dung.salaAtualId];
  if (!sala) return;

  // 1. Fundo Terroso Vulcânico (#78350f)
  ctx.fillStyle = '#78350f';
  ctx.fillRect(0, 0, 256, 224);

  // 2. Obstáculos e Lava (#b91c1c)
  sala.obstaculos.forEach((o) => {
    if (o.rotulo === 'lava') {
      ctx.fillStyle = '#b91c1c';
      ctx.fillRect(o.x, o.y, o.w, o.h);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(o.x + 4, o.y + 4, o.w - 8, 2);
    } else {
      ctx.fillStyle = '#451a03';
      ctx.fillRect(o.x, o.y, o.w, o.h);
      ctx.strokeStyle = '#b91c1c';
      ctx.strokeRect(o.x, o.y, o.w, o.h);
    }
  });

  // 3. Baú da Manopla Ígnea
  if (sala.bau) {
    ctx.fillStyle = sala.bau.aberto ? '#78350f' : '#f59e0b';
    ctx.fillRect(sala.bau.x, sala.bau.y, 24, 16);
    ctx.strokeStyle = '#ffffff';
    ctx.strokeRect(sala.bau.x, sala.bau.y, 24, 16);
    ctx.fillStyle = '#ffffff';
    ctx.font = '8px monospace';
    ctx.fillText(sala.bau.aberto ? '📦 VAZIO' : '🥊 MANOPLA', sala.bau.x + 2, sala.bau.y + 11);
  }

  // 4. Inimigos Múmias
  sala.inimigos.forEach((inimigo) => {
    if (!inimigo.vivo) return;
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(inimigo.x, inimigo.y, inimigo.w, inimigo.h);
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(inimigo.x + 4, inimigo.y + 4, 4, 4);
  });

  // 5. Chefe Ashra (Sala 6)
  if (dung.salaAtualId === 'sala_6_chefe' && state.chefeAshra && !state.chefeAshra.derrotado) {
    const boss = state.chefeAshra;
    ctx.fillStyle = boss.estado === 'atordoado' ? '#38bdf8' : '#dc2626';
    ctx.fillRect(boss.x, boss.y, boss.w, boss.h);

    if (boss.escudoChamas) {
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 3;
      ctx.strokeRect(boss.x - 4, boss.y - 4, boss.w + 8, boss.h + 8);
    }

    // Barra de Vida de Ashra
    ctx.fillStyle = '#000000';
    ctx.fillRect(68, 12, 120, 10);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(70, 14, Math.max(0, (boss.hp / boss.hpMax) * 116), 6);
    ctx.fillStyle = '#ffffff';
    ctx.font = '8px monospace';
    ctx.fillText('ASHRA: QUEEN OF FLAMES', 70, 8);
  }

  // 6. Projéteis de Fogo
  if (state.projeteisFogo) {
    state.projeteisFogo.forEach((p) => {
      if (!p.ativo) return;
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.raio, 0, Math.PI * 2);
      ctx.fill();
    });
  }
}
