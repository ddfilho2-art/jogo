import { GameState, Retangulo } from './types';
import { soundManager } from './soundEffects';
import { checkAABB } from './combat';

// =============================================================================
// ELDRIM: ECOS DO PASSADO - BOTAS DE PASSO GLACIAL (ITEM SECUNDÁRIO)
// =============================================================================
// Item equipável no Slot [X].
// - Recarga: 1.2s (medidor radial / overlay no ícone do HUD).
// - Dash instantâneo de 3 tiles (48px) na direção atual.
// - Atravessa gelo fino (gelo_fino) sem quebrá-lo durante o dash.
// - Ignora até 1 tile de obstáculo baixo (ex: moitas / moita).
// - Efeito sobre Água Rasa (agua_rasa): Congela um caminho de 3 tiles por 2.0s!

export function dispararBotasPassoGlacial(state: GameState) {
  if ((state.botasCooldownTimer || 0) > 0) {
    soundManager.playHookError();
    return;
  }

  const heroi = state.heroi;
  state.botasCooldownTimer = 1.2;
  state.botasDashTimer = 0.2;

  // Direção do Dash
  let stepX = 0;
  let stepY = 0;

  if (heroi.direcao === 'baixo') stepY = 16;
  else if (heroi.direcao === 'cima') stepY = -16;
  else if (heroi.direcao === 'esquerda') stepX = -16;
  else if (heroi.direcao === 'direita') stepX = 16;

  // Iniciar lista de tiles congelados se ainda não existir
  if (!state.aguaCongeladaTiles) {
    state.aguaCongeladaTiles = [];
  }

  let lowObstacleBypassed = false;

  // Executa os 3 passos de 16px (total 48px = 3 tiles)
  for (let i = 0; i < 3; i++) {
    const targetX = heroi.x + stepX;
    const targetY = heroi.y + stepY;

    const testHitbox: Retangulo = {
      x: targetX,
      y: targetY,
      w: heroi.w,
      h: heroi.h,
    };

    // Checar colisão contra obstáculos da sala / overworld
    let colidiuComSolido = false;
    if (state.obstaculos) {
      for (const obs of state.obstaculos) {
        if (checkAABB(testHitbox, obs)) {
          // Checa se é um obstáculo baixo (ex: moita / arbusto)
          const ehObstaculoBaixo =
            obs.rotulo === 'moita' ||
            obs.rotulo === 'arbusto' ||
            (obs.w <= 16 && obs.h <= 16 && obs.rotulo?.includes('baixo'));

          if (ehObstaculoBaixo && !lowObstacleBypassed) {
            lowObstacleBypassed = true;
            // Ignora a colisão e pula por cima do obstáculo baixo!
          } else {
            colidiuComSolido = true;
            break;
          }
        }
      }
    }

    if (colidiuComSolido) {
      // Para o dash antes do obstáculo sólido
      break;
    }

    // Congelar água rasa no tile percorrido (2.0s de travessia segura)
    state.aguaCongeladaTiles.push({
      x: Math.round(targetX),
      y: Math.round(targetY),
      w: 16,
      h: 16,
      timer: 2.0,
    });

    // Mover o herói
    heroi.x = targetX;
    heroi.y = targetY;
  }

  soundManager.playHookGrapple(); // Som de travessia veloz
}

// -----------------------------------------------------------------------------
// ATUALIZAÇÃO DE TIMERS E EFEITOS DAS BOTAS
// -----------------------------------------------------------------------------

export function atualizarBotasEEfeitoAgua(state: GameState, dt: number) {
  // Recarga das Botas
  if (state.botasCooldownTimer && state.botasCooldownTimer > 0) {
    state.botasCooldownTimer = Math.max(0, state.botasCooldownTimer - dt);
  }

  // Duração visual do rastro de dash
  if (state.botasDashTimer && state.botasDashTimer > 0) {
    state.botasDashTimer = Math.max(0, state.botasDashTimer - dt);
  }

  // Degradação e descongelamento do gelo na água (2.0s)
  if (state.aguaCongeladaTiles && state.aguaCongeladaTiles.length > 0) {
    state.aguaCongeladaTiles.forEach((tile) => {
      tile.timer -= dt;
    });
    // Remove tiles expirados
    state.aguaCongeladaTiles = state.aguaCongeladaTiles.filter((t) => t.timer > 0);
  }
}

// -----------------------------------------------------------------------------
// RENDERIZAÇÃO DOS SLABS DE GELO NA ÁGUA CONGELADA
// -----------------------------------------------------------------------------

export function renderizarEfeitoGeloAgua(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  camX: number = 0,
  camY: number = 0
) {
  if (!state.aguaCongeladaTiles || state.aguaCongeladaTiles.length === 0) return;

  state.aguaCongeladaTiles.forEach((tile) => {
    const rx = Math.round(tile.x - camX);
    const ry = Math.round(tile.y - camY);

    ctx.save();
    // Efeito de piscar nos últimos 0.5s de descongelamento
    if (tile.timer < 0.5 && Math.floor(tile.timer * 10) % 2 === 0) {
      ctx.globalAlpha = 0.5;
    } else {
      ctx.globalAlpha = 0.85;
    }

    // Slab de gelo congelado cristalino
    ctx.fillStyle = '#7dd3fc';
    ctx.fillRect(rx, ry, tile.w, tile.h);

    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 1;
    ctx.strokeRect(rx + 0.5, ry + 0.5, tile.w - 1, tile.h - 1);

    // Brilho de gelo
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(rx + 2, ry + 2, 4, 2);

    ctx.restore();
  });
}
