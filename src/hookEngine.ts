// Motor e Física do Gancho de Vinha — Eldrim: Ecos do Passado
// Equipável no slot secundário [X], alcance de até 4 tiles (64px), puxa Ren em 300ms (lerp)
// e aciona alavancas à distância.

import { Direcao, GameState, EstadoJogo, PontoGancho, GanchoAnimState } from './types';
import { Dungeon, AlavancaDungeon } from './dungeonEngine';
import { VALE_PONTOS_GANCHO } from './valeVerdejante';
import { soundManager } from './soundEffects';

export const MAX_HOOK_DIST = 64; // 4 tiles de 16px
export const HOOK_PULL_DURATION = 0.3; // 300ms de interpolação linear

export function criarGanchoAnimInicial(): GanchoAnimState {
  return {
    ativo: false,
    fase: 'puxando',
    startX: 0,
    startY: 0,
    destX: 0,
    destY: 0,
    alvoX: 0,
    alvoY: 0,
    progresso: 0,
    tempoTotal: HOOK_PULL_DURATION,
    timer: 0,
    direcao: 'baixo',
    alvoTipo: 'nenhum',
  };
}

interface AlvoGanchoDetectado {
  tipo: 'ponto_gancho' | 'alavanca';
  x: number;
  y: number;
  w: number;
  h: number;
  distancia: number;
  pontoRef?: PontoGancho;
  alavancaRef?: AlavancaDungeon;
}

// Verifica se um alvo está na linha reta à frente do herói de acordo com a direção
function checarAlvoNaLinha(
  hx: number,
  hy: number,
  hw: number,
  hh: number,
  direcao: Direcao,
  alvo: { x: number; y: number; w: number; h: number }
): { naLinha: boolean; distancia: number } {
  const TOLERANCIA_BEAM = 6; // Tolerância em pixels para facilidade de mira

  if (direcao === 'cima') {
    // Alvo deve estar acima do centro do herói
    if (alvo.y + alvo.h > hy + 4) return { naLinha: false, distancia: 999 };
    // Verificação de alinhamento horizontal
    const overlapX =
      alvo.x < hx + hw + TOLERANCIA_BEAM && alvo.x + alvo.w > hx - TOLERANCIA_BEAM;
    if (!overlapX) return { naLinha: false, distancia: 999 };
    const dist = hy - (alvo.y + alvo.h);
    return { naLinha: dist >= 0 && dist <= MAX_HOOK_DIST, distancia: Math.max(0, dist) };
  }

  if (direcao === 'baixo') {
    // Alvo deve estar abaixo do pé do herói
    if (alvo.y < hy + hh - 4) return { naLinha: false, distancia: 999 };
    const overlapX =
      alvo.x < hx + hw + TOLERANCIA_BEAM && alvo.x + alvo.w > hx - TOLERANCIA_BEAM;
    if (!overlapX) return { naLinha: false, distancia: 999 };
    const dist = alvo.y - (hy + hh);
    return { naLinha: dist >= 0 && dist <= MAX_HOOK_DIST, distancia: Math.max(0, dist) };
  }

  if (direcao === 'esquerda') {
    // Alvo deve estar à esquerda do centro do herói
    if (alvo.x + alvo.w > hx + 4) return { naLinha: false, distancia: 999 };
    const overlapY =
      alvo.y < hy + hh + TOLERANCIA_BEAM && alvo.y + alvo.h > hy - TOLERANCIA_BEAM;
    if (!overlapY) return { naLinha: false, distancia: 999 };
    const dist = hx - (alvo.x + alvo.w);
    return { naLinha: dist >= 0 && dist <= MAX_HOOK_DIST, distancia: Math.max(0, dist) };
  }

  if (direcao === 'direita') {
    // Alvo deve estar à direita do herói
    if (alvo.x < hx + hw - 4) return { naLinha: false, distancia: 999 };
    const overlapY =
      alvo.y < hy + hh + TOLERANCIA_BEAM && alvo.y + alvo.h > hy - TOLERANCIA_BEAM;
    if (!overlapY) return { naLinha: false, distancia: 999 };
    const dist = alvo.x - (hx + hw);
    return { naLinha: dist >= 0 && dist <= MAX_HOOK_DIST, distancia: Math.max(0, dist) };
  }

  return { naLinha: false, distancia: 999 };
}

// Dispara o Gancho de Vinha se o item equipado for 'gancho_vinha'
export function dispararGanchoDeVinha(
  state: GameState,
  dungeon?: Dungeon
): boolean {
  // Se já estiver no meio de uma animação de gancho, ignora
  if (state.ganchoAnim && state.ganchoAnim.ativo) {
    return false;
  }

  // Verifica se o item equipado é o Gancho de Vinha
  if (state.itemEquipado !== 'gancho_vinha') {
    soundManager.playHookError();
    state.notificacaoTexto = state.itemEquipado
      ? 'ITEM EQUIPADO NÃO É O GANCHO!'
      : 'NENHUM ITEM EQUIPADO NO SLOT [X]!';
    state.notificacaoTimer = 1.5;
    return false;
  }

  const heroi = state.heroi;
  const alvosPossiveis: AlvoGanchoDetectado[] = [];

  // 1. Coleta alvos na Dungeon
  if (state.estadoAtual === EstadoJogo.DUNGEON && dungeon) {
    const sala = dungeon.salas[state.dungeonSalaAtualId];
    if (sala) {
      // Pontos de gancho da sala
      if (sala.pontosGancho) {
        for (const pg of sala.pontosGancho) {
          const res = checarAlvoNaLinha(heroi.x, heroi.y, heroi.w, heroi.h, heroi.direcao, pg);
          if (res.naLinha) {
            alvosPossiveis.push({
              tipo: 'ponto_gancho',
              x: pg.x,
              y: pg.y,
              w: pg.w,
              h: pg.h,
              distancia: res.distancia,
              pontoRef: pg,
            });
          }
        }
      }

      // Alavancas da sala
      if (sala.alavancas) {
        for (const alavanca of sala.alavancas) {
          const res = checarAlvoNaLinha(
            heroi.x,
            heroi.y,
            heroi.w,
            heroi.h,
            heroi.direcao,
            alavanca
          );
          if (res.naLinha) {
            alvosPossiveis.push({
              tipo: 'alavanca',
              x: alavanca.x,
              y: alavanca.y,
              w: alavanca.w,
              h: alavanca.h,
              distancia: res.distancia,
              alavancaRef: alavanca,
            });
          }
        }
      }
    }
  }

  // 2. Coleta alvos no Overworld (Vale Verdejante)
  if (state.estadoAtual === EstadoJogo.OVERWORLD) {
    for (const pg of VALE_PONTOS_GANCHO) {
      const res = checarAlvoNaLinha(heroi.x, heroi.y, heroi.w, heroi.h, heroi.direcao, pg);
      if (res.naLinha) {
        alvosPossiveis.push({
          tipo: 'ponto_gancho',
          x: pg.x,
          y: pg.y,
          w: pg.w,
          h: pg.h,
          distancia: res.distancia,
          pontoRef: pg,
        });
      }
    }
  }

  // Se nenhum alvo na linha ou todos fora de alcance (> 64px):
  if (alvosPossiveis.length === 0) {
    // Feedback: pequeno "clique" sonoro de erro e animação rápida de recuo
    soundManager.playHookError();

    let dx = 0;
    let dy = 0;
    if (heroi.direcao === 'cima') dy = -24;
    else if (heroi.direcao === 'baixo') dy = 24;
    else if (heroi.direcao === 'esquerda') dx = -24;
    else if (heroi.direcao === 'direita') dx = 24;

    state.ganchoAnim = {
      ativo: true,
      fase: 'erro_recuo',
      startX: heroi.x,
      startY: heroi.y,
      destX: heroi.x,
      destY: heroi.y,
      alvoX: heroi.x + 8 + dx,
      alvoY: heroi.y + 8 + dy,
      progresso: 0,
      tempoTotal: 0.12,
      timer: 0.12,
      direcao: heroi.direcao,
      alvoTipo: 'nenhum',
    };
    return false;
  }

  // Ordena pelo mais próximo
  alvosPossiveis.sort((a, b) => a.distancia - b.distancia);
  const alvo = alvosPossiveis[0];

  // CASO 1: Ponto de Gancho (argola #c9a24b) -> Puxa Ren em 300ms com interpolação linear
  if (alvo.tipo === 'ponto_gancho') {
    let destX = heroi.x;
    let destY = heroi.y;

    if (heroi.direcao === 'cima') {
      destX = alvo.x + (alvo.w - heroi.w) / 2;
      destY = alvo.y + alvo.h;
    } else if (heroi.direcao === 'baixo') {
      destX = alvo.x + (alvo.w - heroi.w) / 2;
      destY = alvo.y - heroi.h;
    } else if (heroi.direcao === 'esquerda') {
      destX = alvo.x + alvo.w;
      destY = alvo.y + (alvo.h - heroi.h) / 2;
    } else if (heroi.direcao === 'direita') {
      destX = alvo.x - heroi.w;
      destY = alvo.y + (alvo.h - heroi.h) / 2;
    }

    soundManager.playHookShoot();
    soundManager.playHookGrapple();

    state.ganchoAnim = {
      ativo: true,
      fase: 'puxando',
      startX: heroi.x,
      startY: heroi.y,
      destX,
      destY,
      alvoX: alvo.x + alvo.w / 2,
      alvoY: alvo.y + alvo.h / 2,
      progresso: 0,
      tempoTotal: HOOK_PULL_DURATION, // 0.3s (300ms)
      timer: HOOK_PULL_DURATION,
      direcao: heroi.direcao,
      alvoTipo: 'ponto_gancho',
    };
    return true;
  }

  // CASO 2: Alavanca à distância -> Ativa alavanca e retrai o cipó
  if (alvo.tipo === 'alavanca' && alvo.alavancaRef && dungeon) {
    const alavanca = alvo.alavancaRef;

    soundManager.playHookShoot();

    // Ativa a alavanca (reaproveitando o mesmo efeito de encostar + Z)
    alavanca.ativada = !alavanca.ativada;
    soundManager.playLeverSwitch();

    const efeito = dungeon.efeitosAlavanca[alavanca.efeitoId];
    if (efeito) {
      efeito(dungeon, alavanca.ativada, state);
    }

    state.ganchoAnim = {
      ativo: true,
      fase: 'ativando_alavanca',
      startX: heroi.x,
      startY: heroi.y,
      destX: heroi.x,
      destY: heroi.y,
      alvoX: alavanca.x + alavanca.w / 2,
      alvoY: alavanca.y + alavanca.h / 2,
      progresso: 0,
      tempoTotal: 0.18,
      timer: 0.18,
      direcao: heroi.direcao,
      alvoTipo: 'alavanca',
    };
    return true;
  }

  return false;
}

// Atualização da física e movimento do Gancho de Vinha durante o Game Loop
export function atualizarGancho(state: GameState, dt: number) {
  const anim = state.ganchoAnim;
  if (!anim || !anim.ativo) return;

  anim.timer -= dt;
  const p = Math.min(1, Math.max(0, 1 - anim.timer / anim.tempoTotal));
  anim.progresso = p;

  if (anim.fase === 'puxando') {
    // Interpolação linear exata (lerp) em 300ms
    state.heroi.x = anim.startX + (anim.destX - anim.startX) * p;
    state.heroi.y = anim.startY + (anim.destY - anim.startY) * p;

    // Atualiza coordenadas da tela no Overworld caso cruze fronteiras
    if (state.estadoAtual === EstadoJogo.OVERWORLD) {
      const novaTelaX = Math.floor(state.heroi.x / 256);
      const novaTelaY = Math.floor(state.heroi.y / 224);
      if (novaTelaX !== state.telaAtualX || novaTelaY !== state.telaAtualY) {
        state.telaAtualX = Math.max(0, Math.min(2, novaTelaX));
        state.telaAtualY = Math.max(0, Math.min(2, novaTelaY));
      }
    }
  }

  if (anim.timer <= 0) {
    if (anim.fase === 'puxando') {
      state.heroi.x = anim.destX;
      state.heroi.y = anim.destY;
    }
    anim.ativo = false;
  }
}

// Renderizador do Gancho de Vinha arremessado (cipó orgânico verde + argola/garra dourada)
export function renderizarGancho(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  camX: number,
  camY: number
) {
  const anim = state.ganchoAnim;
  if (!anim || !anim.ativo) return;

  const hx = Math.round(state.heroi.x + 8 - camX);
  const hy = Math.round(state.heroi.y + 8 - camY);

  let tipX = anim.alvoX - camX;
  let tipY = anim.alvoY - camY;

  if (anim.fase === 'ativando_alavanca') {
    const s = Math.sin(anim.progresso * Math.PI);
    tipX = hx + (anim.alvoX - camX - hx) * s;
    tipY = hy + (anim.alvoY - camY - hy) * s;
  } else if (anim.fase === 'erro_recuo') {
    const s = Math.sin(anim.progresso * Math.PI);
    tipX = hx + (anim.alvoX - camX - hx) * s;
    tipY = hy + (anim.alvoY - camY - hy) * s;
  }

  ctx.save();

  // 1. Sombra do cipó no chão
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(hx, hy + 4);
  ctx.lineTo(tipX, tipY + 4);
  ctx.stroke();

  // 2. Cabo do Gancho: Cipó trançado ancestral (#15803d base, #22c55e brilho)
  ctx.strokeStyle = '#14532d';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(hx, hy);
  ctx.lineTo(tipX, tipY);
  ctx.stroke();

  ctx.strokeStyle = '#22c55e';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(hx, hy);
  ctx.lineTo(tipX, tipY);
  ctx.stroke();

  // 3. Folhinhas de cipó ao longo da extensão
  const dx = tipX - hx;
  const dy = tipY - hy;
  const dist = Math.hypot(dx, dy);
  const steps = Math.floor(dist / 12);

  ctx.fillStyle = '#4ade80';
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const lx = hx + dx * t;
    const ly = hy + dy * t;
    const offset = (i % 2 === 0 ? 2 : -2);
    ctx.fillRect(Math.round(lx + offset), Math.round(ly), 2, 2);
  }

  // 4. Ponta do Gancho: Garra metálica curva com acabamento dourado (#c9a24b)
  ctx.fillStyle = '#c9a24b';
  ctx.beginPath();
  ctx.arc(tipX, tipY, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#fef08a';
  ctx.fillRect(Math.round(tipX - 1), Math.round(tipY - 1), 2, 2);

  ctx.restore();
}

// Renderizador do Ponto de Gancho no Tilemap:
// Post de pedra/madeira sólida encimado por uma argola de bronze/ouro (#c9a24b)
export function renderizarPontoGancho(
  ctx: CanvasRenderingContext2D,
  ponto: PontoGancho,
  camX: number,
  camY: number,
  animTime: number,
  heroiMirando: boolean = false
) {
  const px = Math.round(ponto.x - camX);
  const py = Math.round(ponto.y - camY);

  // Sombra circular na base do poste
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.beginPath();
  ctx.ellipse(px + 8, py + 14, 7, 2.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Pilar de sustentação (madeira nobre e pedra runica esculpida)
  ctx.fillStyle = '#334155';
  ctx.fillRect(px + 4, py + 5, 8, 9);
  ctx.fillStyle = '#475569';
  ctx.fillRect(px + 5, py + 5, 6, 8);
  ctx.fillStyle = '#64748b';
  ctx.fillRect(px + 5, py + 5, 2, 7);

  // Anel metálico de retenção no topo do poste
  ctx.fillStyle = '#78350f';
  ctx.fillRect(px + 3, py + 4, 10, 2);

  // Ícone de Argola (#c9a24b): círculo externo dourado com centro oco
  const argolaX = px + 8;
  const argolaY = py + 3;

  // Brilho pulsante sutil se o herói estiver mirando ou em repouso
  const pulse = Math.sin(animTime * 4) * 0.15;
  if (heroiMirando) {
    ctx.fillStyle = `rgba(251, 191, 36, ${(0.4 + pulse).toFixed(2)})`;
    ctx.beginPath();
    ctx.arc(argolaX, argolaY, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  // Borda externa da argola (#c9a24b)
  ctx.fillStyle = '#c9a24b';
  ctx.beginPath();
  ctx.arc(argolaX, argolaY, 4, 0, Math.PI * 2);
  ctx.fill();

  // Centro oco da argola (revela o fundo/madeira)
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.arc(argolaX, argolaY, 2, 0, Math.PI * 2);
  ctx.fill();

  // Ponto de luz especular na argola (#fef08a)
  ctx.fillStyle = heroiMirando ? '#ffffff' : '#fef08a';
  ctx.fillRect(argolaX - 2, argolaY - 3, 1, 1);
  ctx.fillRect(argolaX + 1, argolaY - 2, 1, 1);
}
