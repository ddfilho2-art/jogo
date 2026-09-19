import { Direcao, EstadoJogo, GameState, HeroState, InimigoEntidade, Retangulo } from './types';
import { soundManager } from './soundEffects';
import { checkAABB } from './combat';
import { renderizarHeroiRen } from './heroSprite';

// =============================================================================
// ELDRIM: ECOS DO PASSADO - CATACONBA OPCIONAL 3: CAVERNA DE CRISTAL
// =============================================================================
// Região 3 (Terras Geladas). 3 Salas, sem chefe.
// Requer / Introduz as Botas de Passo Glacial para atravessar o corredor de gelo fino.

export interface BlocoGeloFinoCaverna {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  quebrado?: boolean;
}

export interface SalaCristal {
  id: string;
  nome: string;
  obstaculos: Retangulo[];
  geloLiso?: boolean;
  geloFino?: BlocoGeloFinoCaverna[];
  portas: {
    direcao: Direcao;
    destinoId: string;
    trancada?: boolean;
  }[];
  inimigos: InimigoEntidade[];
  combateConcluido?: boolean;
  bau?: { x: number; y: number; w: number; h: number; aberto: boolean };
}

export interface CavernaCristalState {
  salaAtualId: string;
  transicaoTimer?: number;
  salas: Record<string, SalaCristal>;
}

export function criarCavernaCristalInicial(): CavernaCristalState {
  return {
    salaAtualId: 'cristal_sala_1',
    transicaoTimer: 0,
    salas: {
      cristal_sala_1: {
        id: 'cristal_sala_1',
        nome: 'Corredor do Gelo Traiçoeiro',
        obstaculos: [
          // Paredes da sala (256x224px)
          { x: 0, y: 0, w: 256, h: 16 }, // Norte topo
          { x: 0, y: 0, w: 16, h: 224 }, // Oeste
          { x: 240, y: 0, w: 16, h: 224 }, // Leste
          { x: 0, y: 208, w: 96, h: 16 }, // Sul esq
          { x: 160, y: 208, w: 96, h: 16 }, // Sul dir
          // Paredes laterais estreitando o corredor no fosso central de gelo fino (x: 104 a 152 = 48px)
          { x: 16, y: 80, w: 88, h: 64 },
          { x: 152, y: 80, w: 88, h: 64 },
        ],
        // Três tiles de gelo fino no corredor central (3 tiles x 16px = 48px de fosso)
        geloFino: [
          { id: 'gf_c1_1', x: 104, y: 104, w: 16, h: 16 },
          { id: 'gf_c1_2', x: 120, y: 104, w: 16, h: 16 },
          { id: 'gf_c1_3', x: 136, y: 104, w: 16, h: 16 },
        ],
        portas: [
          { direcao: 'baixo', destinoId: 'overworld' },
          { direcao: 'cima', destinoId: 'cristal_sala_2' },
        ],
        inimigos: [],
      },
      cristal_sala_2: {
        id: 'cristal_sala_2',
        nome: 'Galeria dos Cristais Glaciais',
        geloLiso: true, // Arena inteira com piso de gelo liso e deslizante
        obstaculos: [
          { x: 0, y: 0, w: 96, h: 16 },
          { x: 160, y: 0, w: 96, h: 16 },
          { x: 0, y: 208, w: 96, h: 16 },
          { x: 160, y: 208, w: 96, h: 16 },
          { x: 0, y: 0, w: 16, h: 224 },
          { x: 240, y: 0, w: 16, h: 224 },
          // Colunas de cristal decorativas/bloqueadoras na arena
          { x: 48, y: 64, w: 16, h: 32, rotulo: 'cristal_coluna' },
          { x: 192, y: 64, w: 16, h: 32, rotulo: 'cristal_coluna' },
          { x: 48, y: 144, w: 16, h: 32, rotulo: 'cristal_coluna' },
          { x: 192, y: 144, w: 16, h: 32, rotulo: 'cristal_coluna' },
        ],
        portas: [
          { direcao: 'baixo', destinoId: 'cristal_sala_1' },
          { direcao: 'cima', destinoId: 'cristal_sala_3', trancada: true },
        ],
        combateConcluido: false,
        inimigos: [
          {
            id: 'coruja_cristal_1',
            tipo: 'coruja_glacial',
            x: 60,
            y: 80,
            w: 16,
            h: 16,
            hp: 3,
            hpMax: 3,
            direcao: 'baixo',
            velocidade: 65,
            iframeTimer: 0,
            vivo: true,
            origX: 60,
            origY: 80,
            estadoCoruja: 'rondando',
            timerMergulho: 1.8,
          },
          {
            id: 'coruja_cristal_2',
            tipo: 'coruja_glacial',
            x: 180,
            y: 80,
            w: 16,
            h: 16,
            hp: 3,
            hpMax: 3,
            direcao: 'baixo',
            velocidade: 65,
            iframeTimer: 0,
            vivo: true,
            origX: 180,
            origY: 80,
            estadoCoruja: 'rondando',
            timerMergulho: 2.6,
          },
          {
            id: 'rastejante_cristal_1',
            tipo: 'rastejante_gelo',
            x: 120,
            y: 120,
            w: 16,
            h: 14,
            hp: 4,
            hpMax: 4,
            direcao: 'baixo',
            velocidade: 38,
            iframeTimer: 0,
            vivo: true,
            submerso: false,
            submersoTimer: 0,
            reaparecerTimer: 3.0,
          },
        ],
      },
      cristal_sala_3: {
        id: 'cristal_sala_3',
        nome: 'Câmara do Relicário de Cristal',
        obstaculos: [
          { x: 0, y: 0, w: 256, h: 16 },
          { x: 0, y: 0, w: 16, h: 224 },
          { x: 240, y: 0, w: 16, h: 224 },
          { x: 0, y: 208, w: 96, h: 16 },
          { x: 160, y: 208, w: 96, h: 16 },
          // Formações cristalinas de adorno
          { x: 32, y: 32, w: 32, h: 32 },
          { x: 192, y: 32, w: 32, h: 32 },
        ],
        portas: [{ direcao: 'baixo', destinoId: 'cristal_sala_2' }],
        inimigos: [],
        bau: { x: 116, y: 64, w: 24, h: 20, aberto: false },
      },
    },
  };
}

// -----------------------------------------------------------------------------
// ATUALIZAÇÃO DA CAVERNA DE CRISTAL
// -----------------------------------------------------------------------------

export function atualizarCavernaCristal(
  caverna: CavernaCristalState,
  state: GameState,
  dt: number,
  onSairOverworld: () => void
) {
  if (caverna.transicaoTimer && caverna.transicaoTimer > 0) {
    caverna.transicaoTimer -= dt;
  }

  const sala = caverna.salas[caverna.salaAtualId];
  if (!sala) return;

  const heroi = state.heroi;

  // 1. Checagem de Gelo Fino na Sala 1
  if (sala.geloFino && (!state.botasDashTimer || state.botasDashTimer <= 0)) {
    const heroBox = { x: heroi.x + 2, y: heroi.y + 8, w: heroi.w - 4, h: heroi.h - 8 };
    for (const gf of sala.geloFino) {
      if (checkAABB(heroBox, gf)) {
        gf.quebrado = true;
        soundManager.playObstacleBreak();
        state.notificacaoTexto = 'O Gelo Fino cedeu! Use o Dash das Botas (Slot X)!';
        state.notificacaoTimer = 2.5;
        // Retorna o herói para o início seguro da sala
        heroi.x = 120;
        heroi.y = 180;
        heroi.direcao = 'cima';
        break;
      }
    }
  }

  // Restore gelo fino after a short delay if broken
  if (sala.geloFino) {
    sala.geloFino.forEach((gf) => {
      if (gf.quebrado) {
        setTimeout(() => {
          gf.quebrado = false;
        }, 1500);
      }
    });
  }

  // 2. Combate e Inimigos na Sala 2
  if (sala.inimigos && sala.inimigos.length > 0) {
    let todosMortos = true;

    sala.inimigos.forEach((inimigo) => {
      if (!inimigo.vivo) return;
      todosMortos = false;

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
            inimigo.submerso = true;
            inimigo.submersoTimer = 1.5;
          }
        }
      }

      // IA: Rastejante de Gelo
      if (inimigo.tipo === 'rastejante_gelo') {
        if (inimigo.submerso) {
          inimigo.submersoTimer = (inimigo.submersoTimer || 0) - dt;
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

      // IA: Coruja Glacial (rondando, mergulhando em rasante, retornando)
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

    // Se todos os inimigos foram derrotados na sala 2, destranca a porta norte!
    if (todosMortos && !sala.combateConcluido) {
      sala.combateConcluido = true;
      const portaNorte = sala.portas.find((p) => p.direcao === 'cima');
      if (portaNorte) {
        portaNorte.trancada = false;
      }
      soundManager.playDoorOpen();
      state.notificacaoTexto = 'SALA PURIFICADA! PORTA NORTE DESTRANCADA!';
      state.notificacaoTimer = 2.5;
    }
  }

  // 3. Interação com Baú da Sala 3 (+1 Fragmento de Vida Máx e +10 Fluxo Arcano Máx)
  if (
    sala.id === 'cristal_sala_3' &&
    sala.bau &&
    !sala.bau.aberto &&
    !state.cavernaCristalUpgradeColetado
  ) {
    const heroCenter = { x: heroi.x + 8, y: heroi.y + 12 };
    const distBau = Math.hypot(heroCenter.x - (sala.bau.x + 12), heroCenter.y - (sala.bau.y + 10));
    if (distBau <= 28) {
      sala.bau.aberto = true;
      state.cavernaCristalUpgradeColetado = true;
      state.vidaMax += 1;
      state.vidaAtual = Math.min(state.vidaMax, state.vidaAtual + 1);
      state.arcanoMax += 10;
      state.arcanoAtual = state.arcanoMax;
      soundManager.playChestOpen();
      soundManager.playItemGet();
      state.notificacaoTexto = '★ ESSÊNCIA DE CRISTAL! (+1 VIDA MÁX & +10 ARCANO)';
      state.notificacaoTimer = 4.0;
    }
  }

  // 4. Checagem de Transição de Portas
  for (const porta of sala.portas) {
    if (porta.trancada) continue;

    let entrou = false;
    if (porta.direcao === 'cima' && heroi.y <= 16 && heroi.x >= 104 && heroi.x <= 152) {
      entrou = true;
    } else if (porta.direcao === 'baixo' && heroi.y >= 192 && heroi.x >= 104 && heroi.x <= 152) {
      entrou = true;
    }

    if (entrou) {
      if (porta.destinoId === 'overworld') {
        onSairOverworld();
        return;
      }

      const proxSala = caverna.salas[porta.destinoId];
      if (proxSala) {
        caverna.salaAtualId = porta.destinoId;
        caverna.transicaoTimer = 0.2;
        soundManager.playDoorOpen();

        if (porta.direcao === 'cima') {
          heroi.x = 120;
          heroi.y = 180;
          heroi.direcao = 'cima';
        } else if (porta.direcao === 'baixo') {
          heroi.x = 120;
          heroi.y = 28;
          heroi.direcao = 'baixo';
        }
        break;
      }
    }
  }
}

// -----------------------------------------------------------------------------
// RENDERIZAÇÃO DA CAVERNA DE CRISTAL
// -----------------------------------------------------------------------------

export function renderizarCavernaCristal(
  ctx: CanvasRenderingContext2D,
  caverna: CavernaCristalState,
  state: GameState,
  gameTime: number
) {
  const sala = caverna.salas[caverna.salaAtualId];
  if (!sala) return;

  // Fundo Ciano/Gelo Escuro
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, 256, 224);

  // Piso de Gelo Liso ou Rocha Congelada
  ctx.fillStyle = sala.geloLiso ? '#1e293b' : '#111827';
  ctx.fillRect(16, 16, 224, 192);

  // Detalhes brilhantes de cristal no chão
  ctx.fillStyle = '#38bdf8';
  ctx.globalAlpha = 0.25;
  for (let i = 0; i < 6; i++) {
    const px = 30 + ((i * 37) % 180);
    const py = 30 + ((i * 53) % 150);
    ctx.fillRect(px, py, 4, 4);
  }
  ctx.globalAlpha = 1.0;

  // Gelo Fino na Sala 1
  if (sala.geloFino) {
    sala.geloFino.forEach((gf) => {
      if (gf.quebrado) {
        ctx.fillStyle = '#020617';
        ctx.fillRect(gf.x, gf.y, gf.w, gf.h);
      } else {
        ctx.fillStyle = '#7dd3fc';
        ctx.fillRect(gf.x, gf.y, gf.w, gf.h);
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 1;
        ctx.strokeRect(gf.x + 0.5, gf.y + 0.5, gf.w - 1, gf.h - 1);

        // Rachaduras
        ctx.strokeStyle = '#e0f2fe';
        ctx.beginPath();
        ctx.moveTo(gf.x + 4, gf.y + 4);
        ctx.lineTo(gf.x + 12, gf.y + 12);
        ctx.stroke();
      }
    });
  }

  // Obstáculos e Paredes de Cristal
  for (const obs of sala.obstaculos) {
    if (obs.rotulo === 'cristal_coluna') {
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(obs.x + 2, obs.y + 2, obs.w - 4, obs.h - 6);
      ctx.fillStyle = '#e0f2fe';
      ctx.fillRect(obs.x + 4, obs.y + 4, 2, obs.h - 10);
    } else {
      ctx.fillStyle = '#334155';
      ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      ctx.strokeRect(obs.x + 0.5, obs.y + 0.5, obs.w - 1, obs.h - 1);
    }
  }

  // Renderização de Inimigos (Sala 2)
  if (sala.inimigos) {
    sala.inimigos.forEach((inimigo) => {
      if (!inimigo.vivo) return;

      if (inimigo.tipo === 'rastejante_gelo') {
        if (inimigo.submerso) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.beginPath();
          ctx.arc(inimigo.x + 8, inimigo.y + 7, 6, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(inimigo.x + 2, inimigo.y + 2, 12, 10);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(inimigo.x + 4, inimigo.y, 8, 4);
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(inimigo.x + 5, inimigo.y + 2, 2, 2);
          ctx.fillRect(inimigo.x + 9, inimigo.y + 2, 2, 2);
        }
      } else if (inimigo.tipo === 'coruja_glacial') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.ellipse(inimigo.x + 8, inimigo.y + 15, 6, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(inimigo.x + 3, inimigo.y + 2, 10, 10);
        ctx.fillStyle = '#a8c8e0';
        ctx.fillRect(inimigo.x, inimigo.y + 4, 3, 6);
        ctx.fillRect(inimigo.x + 13, inimigo.y + 4, 3, 6);
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(inimigo.x + 5, inimigo.y + 4, 2, 2);
        ctx.fillRect(inimigo.x + 9, inimigo.y + 4, 2, 2);
      }
    });
  }

  // Baú na Sala 3
  if (sala.bau) {
    const b = sala.bau;
    ctx.fillStyle = b.aberto ? '#475569' : '#c9a24b';
    ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.strokeRect(b.x + 0.5, b.y + 0.5, b.w - 1, b.h - 1);

    if (!b.aberto) {
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(b.x + b.w / 2 - 2, b.y + b.h / 2 - 2, 4, 4);
    }
  }

  // Portas
  for (const porta of sala.portas) {
    if (porta.direcao === 'baixo') {
      ctx.fillStyle = '#020617';
      ctx.fillRect(104, 208, 48, 16);
    } else if (porta.direcao === 'cima') {
      if (porta.trancada) {
        // Grade trancada com barras de cristal
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(104, 0, 48, 16);
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        for (let bx = 110; bx < 150; bx += 8) {
          ctx.beginPath();
          ctx.moveTo(bx, 0);
          ctx.lineTo(bx, 16);
          ctx.stroke();
        }
      } else {
        ctx.fillStyle = '#020617';
        ctx.fillRect(104, 0, 48, 16);
      }
    }
  }

  // Título da Sala na Caverna
  ctx.fillStyle = '#e0f2fe';
  ctx.font = '8px monospace';
  ctx.fillText(sala.nome.toUpperCase(), 24, 12);
}
