import { Direcao, EstadoJogo, GameState, HeroState, InimigoEntidade, Retangulo } from './types';
import { soundManager } from './soundEffects';
import { checkAABB } from './combat';
import { OBSTACULOS_DESERTO_KAAL } from './desertoKaal';

// =============================================================================
// ELDRIM: ECOS DO PASSADO - CATACONBA OPCIONAL 4: TUMBA ENTERRADA
// =============================================================================

export interface CamaraTumba {
  id: string;
  nome: string;
  obstaculos: Retangulo[];
  portas: {
    direcao: Direcao;
    destinoId: string;
    trancada?: boolean;
  }[];
  inimigos: InimigoEntidade[];
  bau?: { x: number; y: number; aberto: boolean };
}

export interface TumbaEnterradaState {
  salaAtualId: string;
  salas: Record<string, CamaraTumba>;
}

export function criarTumbaEnterradaInicial(): TumbaEnterradaState {
  return {
    salaAtualId: 'camara_1',
    salas: {
      camara_1: {
        id: 'camara_1',
        nome: 'Vestíbulo de Pedra Vulcânica',
        obstaculos: [
          { x: 0, y: 0, w: 256, h: 16 },
          { x: 0, y: 0, w: 16, h: 224 },
          { x: 240, y: 0, w: 16, h: 224 },
          { x: 0, y: 208, w: 96, h: 16 },
          { x: 160, y: 208, w: 96, h: 16 },
        ],
        portas: [
          { direcao: 'baixo', destinoId: 'overworld' },
          { direcao: 'cima', destinoId: 'camara_2' },
        ],
        inimigos: [],
      },
      camara_2: {
        id: 'camara_2',
        nome: 'Santuário do Faraó Cinzento',
        obstaculos: [
          { x: 0, y: 0, w: 96, h: 16 },
          { x: 160, y: 0, w: 96, h: 16 },
          { x: 0, y: 208, w: 96, h: 16 },
          { x: 160, y: 208, w: 96, h: 16 },
          { x: 0, y: 0, w: 16, h: 224 },
          { x: 240, y: 0, w: 16, h: 224 },
        ],
        portas: [
          { direcao: 'baixo', destinoId: 'camara_1' },
          { direcao: 'cima', destinoId: 'camara_3' },
        ],
        inimigos: [
          {
            id: 'mumia_tumba_1',
            tipo: 'mumia_fogo',
            x: 80,
            y: 100,
            w: 16,
            h: 18,
            hp: 4,
            hpMax: 4,
            direcao: 'baixo',
            velocidade: 45,
            iframeTimer: 0,
            vivo: true,
          },
          {
            id: 'mumia_tumba_2',
            tipo: 'mumia_fogo',
            x: 160,
            y: 100,
            w: 16,
            h: 18,
            hp: 4,
            hpMax: 4,
            direcao: 'baixo',
            velocidade: 45,
            iframeTimer: 0,
            vivo: true,
          },
        ],
      },
      camara_3: {
        id: 'camara_3',
        nome: 'Relicário do Faraó',
        obstaculos: [
          { x: 0, y: 0, w: 256, h: 16 },
          { x: 0, y: 0, w: 16, h: 224 },
          { x: 240, y: 0, w: 16, h: 224 },
          { x: 0, y: 208, w: 96, h: 16 },
          { x: 160, y: 208, w: 96, h: 16 },
        ],
        portas: [{ direcao: 'baixo', destinoId: 'camara_2' }],
        bau: { x: 116, y: 60, aberto: false },
        inimigos: [],
      },
    },
  };
}

export function atualizarTumbaEnterrada(state: GameState, dt: number) {
  if (state.estadoAtual !== EstadoJogo.DUNGEON || state.dungeonTipoAtivo !== 'tumba_enterrada') {
    return;
  }

  const tumba = (state as any).tumbaEnterradaState as TumbaEnterradaState;
  if (!tumba) return;

  const sala = tumba.salas[tumba.salaAtualId];
  if (!sala) return;

  const heroi = state.heroi;

  if (!state.salasVisitadasTumbaEnterrada) state.salasVisitadasTumbaEnterrada = {};
  state.salasVisitadasTumbaEnterrada[tumba.salaAtualId] = true;

  // Inimigos
  sala.inimigos.forEach((inimigo) => {
    if (!inimigo.vivo) return;

    if (inimigo.iframeTimer > 0) inimigo.iframeTimer -= dt;

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
          state.selos += 6;
        }
      }
    }

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

  // Baú de Recompensa
  if (sala.bau && !sala.bau.aberto) {
    const distBau = Math.hypot(heroi.x + 8 - sala.bau.x, heroi.y + 8 - sala.bau.y);
    if (distBau < 20) {
      sala.bau.aberto = true;
      soundManager.playChestOpen();

      state.arcanoMax += 10;
      state.arcanoAtual = state.arcanoMax;
      state.tumbaEnterradaUpgradeColetado = true;

      state.notificacaoTexto = '+10 FLUXO ARCANO MÁXIMO!';
      state.notificacaoTimer = 3.0;
    }
  }

  // Transição de Portas
  sala.portas.forEach((porta) => {
    let pRect: Retangulo = { x: 0, y: 0, w: 0, h: 0 };
    if (porta.direcao === 'cima') pRect = { x: 104, y: 0, w: 48, h: 16 };
    else if (porta.direcao === 'baixo') pRect = { x: 104, y: 208, w: 48, h: 16 };

    if (checkAABB(heroi, pRect)) {
      if (porta.destinoId === 'overworld') {
        state.estadoAtual = EstadoJogo.OVERWORLD;
        state.regiaoAtual = 'kaal';
        state.obstaculos = OBSTACULOS_DESERTO_KAAL;
        state.telaAtualX = 0;
        state.telaAtualY = 2;
        heroi.x = 80;
        heroi.y = 520;
        heroi.direcao = 'baixo';
        soundManager.playDoorOpen();
      } else if (tumba.salas[porta.destinoId]) {
        tumba.salaAtualId = porta.destinoId;
        soundManager.playDoorOpen();
        if (porta.direcao === 'cima') heroi.y = 180;
        else if (porta.direcao === 'baixo') heroi.y = 20;
      }
    }
  });
}

export function renderizarTumbaEnterrada(ctx: CanvasRenderingContext2D, state: GameState) {
  const tumba = (state as any).tumbaEnterradaState as TumbaEnterradaState;
  if (!tumba) return;

  const sala = tumba.salas[tumba.salaAtualId];
  if (!sala) return;

  ctx.fillStyle = '#451a03';
  ctx.fillRect(0, 0, 256, 224);

  sala.obstaculos.forEach((o) => {
    ctx.fillStyle = '#78350f';
    ctx.fillRect(o.x, o.y, o.w, o.h);
    ctx.strokeStyle = '#d97706';
    ctx.strokeRect(o.x, o.y, o.w, o.h);
  });

  if (sala.bau) {
    ctx.fillStyle = sala.bau.aberto ? '#78350f' : '#f59e0b';
    ctx.fillRect(sala.bau.x, sala.bau.y, 24, 16);
    ctx.strokeStyle = '#ffffff';
    ctx.strokeRect(sala.bau.x, sala.bau.y, 24, 16);
    ctx.fillStyle = '#ffffff';
    ctx.font = '8px monospace';
    ctx.fillText(sala.bau.aberto ? 'VAZIO' : '🔮 ARCANO', sala.bau.x + 2, sala.bau.y + 11);
  }

  sala.inimigos.forEach((inimigo) => {
    if (!inimigo.vivo) return;
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(inimigo.x, inimigo.y, inimigo.w, inimigo.h);
  });
}
