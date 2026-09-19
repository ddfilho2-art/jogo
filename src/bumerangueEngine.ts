// ============================================================================
// BUMERANGUE DAS MARÉS - MOTOR & FÍSICA GLOBAL
// ============================================================================
// Item secundário obtido no Santuário das Águas Turvas (Slot X):
// - Lançamento em linha reta na direção do herói a 180px/s
// - Atinge até 3 inimigos na trajetória (1 de dano cada, sem invalidar o item)
// - Ativa alavancas remotas que encostar (Overworld do Charco, Santuário, Covil)
// - Retorna ao herói após 96px de alcance ou ao bater em paredes sólidas
// - Enquanto o bumerangue está no ar, o herói se move mas não ataca com a espada
// ============================================================================

import {
  GameState,
  HeroState,
  Retangulo,
  InimigoEntidade,
  BumerangueVooState,
  EstadoJogo,
} from './types';
import { soundManager } from './soundEffects';
import { checkAABB } from './combat';

// Posição da Alavanca Remota do Overworld no Charco Sombrio (Tela [2,0])
// Localizada a mais de 2 tiles de distância (> 48px) de qualquer margem a pé
export const ALAVANCA_CHARCO_REMOTE: Retangulo = {
  x: 712,
  y: 104,
  w: 16,
  h: 16,
};

// Ponte de madeira rústica que se ergue sobre o canal ao ativar a alavanca
export const PONTE_CHARCO_OVERWORLD: Retangulo = {
  x: 648,
  y: 96,
  w: 56,
  h: 32,
};

// Entrada da Catacumba "Covil Afogado" no Charco Sombrio (Área revelada pela ponte)
export const ENTRADA_COVIL_AFOGADO_OVERWORLD: Retangulo = {
  x: 716,
  y: 56,
  w: 24,
  h: 24,
};

export function criarBumerangueAnimInicial(): BumerangueVooState {
  return {
    ativo: false,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    startX: 0,
    startY: 0,
    distPercorrida: 0,
    maxDist: 96, // 6 tiles (96px)
    fase: 'indo',
    angulo: 0,
    inimigosAtingidosIds: [],
    inimigosAtingidosQtd: 0,
  };
}

// ----------------------------------------------------------------------------
// DISPARO DO BUMERANGUE DAS MARÉS
// ----------------------------------------------------------------------------
export function dispararBumerangue(state: GameState) {
  if (state.bumerangueAnim && state.bumerangueAnim.ativo) return; // Já está em voo
  const heroi = state.heroi;

  let vx = 0;
  let vy = 0;
  const SPEED = 180; // 180px/s conforme especificação

  if (heroi.direcao === 'cima') vy = -SPEED;
  else if (heroi.direcao === 'baixo') vy = SPEED;
  else if (heroi.direcao === 'esquerda') vx = -SPEED;
  else if (heroi.direcao === 'direita') vx = SPEED;

  state.bumerangueAnim = {
    ativo: true,
    x: heroi.x + heroi.w / 2,
    y: heroi.y + heroi.h / 2,
    vx,
    vy,
    startX: heroi.x + heroi.w / 2,
    startY: heroi.y + heroi.h / 2,
    distPercorrida: 0,
    maxDist: 96, // 96px de alcance máx
    fase: 'indo',
    angulo: 0,
    inimigosAtingidosIds: [],
    inimigosAtingidosQtd: 0,
  };

  // Cancela qualquer golpe de espada preparado
  heroi.carregandoGolpe = false;
  heroi.cargaGolpeTimer = 0;
  heroi.golpePronto = false;

  soundManager.playBoomerang();
}

// ----------------------------------------------------------------------------
// ATUALIZAÇÃO FÍSICA E COLISÕES DO BUMERANGUE
// ----------------------------------------------------------------------------
export function atualizarBumerangueGlobal(
  bumerangue: BumerangueVooState,
  heroi: HeroState,
  inimigos: InimigoEntidade[] | undefined,
  obstaculos: Retangulo[],
  state: GameState,
  dt: number,
  callbacks?: {
    onAtivarAlavanca?: (alavancaId: string) => void;
  }
) {
  if (!bumerangue.ativo) return;

  // Rotação visual contínua 16-bit
  bumerangue.angulo += 24 * dt;

  if (bumerangue.fase === 'indo') {
    bumerangue.x += bumerangue.vx * dt;
    bumerangue.y += bumerangue.vy * dt;

    const dx = bumerangue.x - bumerangue.startX;
    const dy = bumerangue.y - bumerangue.startY;
    bumerangue.distPercorrida = Math.sqrt(dx * dx + dy * dy);

    // Hitbox de detecção de colisões sólidas do bumerangue (8x8)
    const bHitbox: Retangulo = {
      x: bumerangue.x - 4,
      y: bumerangue.y - 4,
      w: 8,
      h: 8,
    };

    // Colisão com obstáculos sólidos (paredes) ou alcance máximo de 96px
    let colidiuParede = false;
    for (const obs of obstaculos) {
      if (checkAABB(bHitbox, obs)) {
        colidiuParede = true;
        break;
      }
    }

    if (bumerangue.distPercorrida >= bumerangue.maxDist || colidiuParede) {
      bumerangue.fase = 'voltando';
      soundManager.playBoomerang();
    }
  } else {
    // Fase 'voltando': rastreia suavemente e persegue o herói Ren
    const hx = heroi.x + heroi.w / 2;
    const hy = heroi.y + heroi.h / 2;
    const dx = hx - bumerangue.x;
    const dy = hy - bumerangue.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist <= 14) {
      // Bumerangue capturado de volta pelo herói
      bumerangue.ativo = false;
      return;
    }

    const RETURN_SPEED = 200;
    bumerangue.vx = (dx / dist) * RETURN_SPEED;
    bumerangue.vy = (dy / dist) * RETURN_SPEED;
    bumerangue.x += bumerangue.vx * dt;
    bumerangue.y += bumerangue.vy * dt;
  }

  // Hitbox de ação do bumerangue (10x10)
  const bBox: Retangulo = {
    x: bumerangue.x - 5,
    y: bumerangue.y - 5,
    w: 10,
    h: 10,
  };

  // 1. DANO A ATÉ 3 INIMIGOS NA TRAJETÓRIA (1 dano cada, sem invalidar o item)
  if (inimigos) {
    if (!bumerangue.inimigosAtingidosIds) bumerangue.inimigosAtingidosIds = [];
    if (!bumerangue.inimigosAtingidosQtd) bumerangue.inimigosAtingidosQtd = 0;

    for (const ini of inimigos) {
      if (!ini.vivo) continue;
      if (bumerangue.inimigosAtingidosIds.includes(ini.id)) continue;
      if (bumerangue.inimigosAtingidosQtd >= 3) break;

      const iniBox: Retangulo = {
        x: ini.x,
        y: ini.y,
        w: ini.w,
        h: ini.h,
      };

      if (checkAABB(bBox, iniBox)) {
        // Atinge o inimigo
        ini.hp -= 1;
        ini.iframeTimer = 0.3;
        bumerangue.inimigosAtingidosIds.push(ini.id);
        bumerangue.inimigosAtingidosQtd += 1;

        soundManager.playEnemyHit();

        if (ini.hp <= 0) {
          ini.vivo = false;
          soundManager.playEnemyDeath();
        }

        // Se atingiu o 3º inimigo e estava na fase de ida, inicia retorno
        if (bumerangue.inimigosAtingidosQtd >= 3 && bumerangue.fase === 'indo') {
          bumerangue.fase = 'voltando';
        }
      }
    }
  }

  // 2. ATIVAÇÃO DE ALAVANCA REMOTA DO OVERWORLD (CHARCO SOMBRIO)
  if (
    state.estadoAtual === EstadoJogo.OVERWORLD &&
    state.regiaoAtual === 'charco' &&
    state.telaAtualX === 2 &&
    state.telaAtualY === 0
  ) {
    if (checkAABB(bBox, ALAVANCA_CHARCO_REMOTE)) {
      if (!state.alavancaCharcoPonteAtivada) {
        state.alavancaCharcoPonteAtivada = true;
        soundManager.playLeverSwitch();
        soundManager.playDoorOpen();
        state.notificacaoTexto = 'ALAVANCA ATIVADA! PONTE SECRETA REVELADA!';
        state.notificacaoTimer = 3.5;
      }
      if (bumerangue.fase === 'indo') {
        bumerangue.fase = 'voltando';
      }
    }
  }

  // 3. Callback customizado para alavancas em Dungeons/Covil
  if (callbacks?.onAtivarAlavanca) {
    callbacks.onAtivarAlavanca(bBox.x + ',' + bBox.y);
  }
}

// ----------------------------------------------------------------------------
// RENDERIZAÇÃO DO BUMERANGUE DAS MARÉS (16-bit com rastro de água mágica)
// ----------------------------------------------------------------------------
export function renderizarBumerangue(
  ctx: CanvasRenderingContext2D,
  bumerangue: BumerangueVooState,
  camX = 0,
  camY = 0
) {
  if (!bumerangue || !bumerangue.ativo) return;

  const bx = Math.round(bumerangue.x - camX);
  const by = Math.round(bumerangue.y - camY);

  ctx.save();
  ctx.translate(bx, by);
  ctx.rotate(bumerangue.angulo);

  // Rastro translúcido de água mágica
  ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
  ctx.beginPath();
  ctx.arc(0, 0, 8, 0, Math.PI * 2);
  ctx.fill();

  // Braço 1 do Bumerangue (Asa curvada)
  ctx.fillStyle = '#38bdf8';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-7, -4);
  ctx.lineTo(-6, -7);
  ctx.lineTo(0, -2);
  ctx.closePath();
  ctx.fill();

  // Braço 2 do Bumerangue
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(7, -4);
  ctx.lineTo(6, -7);
  ctx.lineTo(0, -2);
  ctx.closePath();
  ctx.fill();

  // Braço 3 (Lâmina inferior de equilíbrio das marés)
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-2, 6);
  ctx.lineTo(2, 6);
  ctx.closePath();
  ctx.fill();

  // Núcleo central de prata/platina
  ctx.fillStyle = '#f8fafc';
  ctx.beginPath();
  ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // Pontas cintilantes com reflexo de água
  ctx.fillStyle = '#bae6fd';
  ctx.fillRect(-7, -5, 2, 2);
  ctx.fillRect(5, -5, 2, 2);
  ctx.fillRect(-1, 5, 2, 2);

  ctx.restore();
}
