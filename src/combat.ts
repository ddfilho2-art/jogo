// Sistema de Combate, Inimigos e Chefe Raizarca de Eldrim
// Resolução 256x224px, 16-bit pixel art, controles rápidos e responsivos

import { soundManager } from './soundEffects';
import {
  Direcao,
  GameState,
  HeroState,
  InimigoEntidade,
  NucleoRaizarca,
  ParticulaQuadrada,
  ProjetilEspinho,
  RaizarcaBossState,
  Retangulo,
} from './types';

// Helper de colisão AABB
export function checkAABB(a: Retangulo, b: Retangulo): boolean {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

// ------------------------------------------------------------------
// FÁBRICAS DE ESTADO INICIAL
// ------------------------------------------------------------------

export function criarChefeRaizarcaInicial(): RaizarcaBossState {
  const nucleoSup: NucleoRaizarca = {
    id: 'nucleo_superior',
    posicao: 'superior',
    x: 128 - 7,
    y: 44,
    w: 14,
    h: 14,
    hp: 3,
    hpMax: 3,
    destruido: false,
    iframeTimer: 0,
  };

  const nucleoEsq: NucleoRaizarca = {
    id: 'nucleo_inferior_esquerda',
    posicao: 'inferior_esquerda',
    x: 76,
    y: 92,
    w: 14,
    h: 14,
    hp: 3,
    hpMax: 3,
    destruido: false,
    iframeTimer: 0,
  };

  const nucleoDir: NucleoRaizarca = {
    id: 'nucleo_inferior_direita',
    posicao: 'inferior_direita',
    x: 166,
    y: 92,
    w: 14,
    h: 14,
    hp: 3,
    hpMax: 3,
    destruido: false,
    iframeTimer: 0,
  };

  return {
    ativo: false,
    derrotado: false,
    nucleos: [nucleoSup, nucleoEsq, nucleoDir],
    nucleoAtivoIndex: 0,
    rotacaoTimer: 4.0,
    telegraphTimer: 0,
    telegraphPendenteDisparo: false,
    telegraphDisparosQtd: 0,
    timerDisparoPeriodico: 4.5,
    desmoronarTimer: 0,
    cutsceneLuzTimer: 0,
    ganchoLiberado: false,
    screenshakeTimer: 0,
  };
}

export function criarInimigosValeIniciais(): InimigoEntidade[] {
  return [
    // Tela [1, 2] (Entrada Sul)
    {
      id: 'espinho_vale_1',
      tipo: 'espinho_rastejante',
      x: 320,
      y: 520,
      w: 14,
      h: 14,
      hp: 2,
      hpMax: 2,
      direcao: 'esquerda',
      velocidade: 40,
      iframeTimer: 0,
      vivo: true,
      timerTrocaDirecao: 2.0,
    },
    {
      id: 'vagalume_vale_1',
      tipo: 'vagalume_sombrio',
      x: 430,
      y: 500,
      w: 12,
      h: 12,
      hp: 1,
      hpMax: 1,
      direcao: 'cima',
      velocidade: 50,
      iframeTimer: 0,
      vivo: true,
      tempoSeno: 0,
      baseX: 430,
      baseY: 500,
    },
    // Tela [1, 1] (Caminho da Ponte)
    {
      id: 'espinho_vale_2',
      tipo: 'espinho_rastejante',
      x: 320,
      y: 290,
      w: 14,
      h: 14,
      hp: 2,
      hpMax: 2,
      direcao: 'direita',
      velocidade: 40,
      iframeTimer: 0,
      vivo: true,
      timerTrocaDirecao: 1.8,
    },
    {
      id: 'vagalume_vale_2',
      tipo: 'vagalume_sombrio',
      x: 420,
      y: 320,
      w: 12,
      h: 12,
      hp: 1,
      hpMax: 1,
      direcao: 'esquerda',
      velocidade: 50,
      iframeTimer: 0,
      vivo: true,
      tempoSeno: 1.5,
      baseX: 420,
      baseY: 320,
    },
    // Tela [0, 1] (Floresta Densa)
    {
      id: 'espinho_vale_3',
      tipo: 'espinho_rastejante',
      x: 100,
      y: 300,
      w: 14,
      h: 14,
      hp: 2,
      hpMax: 2,
      direcao: 'baixo',
      velocidade: 40,
      iframeTimer: 0,
      vivo: true,
      timerTrocaDirecao: 2.5,
    },
    {
      id: 'vagalume_vale_3',
      tipo: 'vagalume_sombrio',
      x: 140,
      y: 260,
      w: 12,
      h: 12,
      hp: 1,
      hpMax: 1,
      direcao: 'direita',
      velocidade: 50,
      iframeTimer: 0,
      vivo: true,
      tempoSeno: 3.0,
      baseX: 140,
      baseY: 260,
    },
    // Tela [2, 1] (Clareira Sagrada)
    {
      id: 'espinho_vale_4',
      tipo: 'espinho_rastejante',
      x: 620,
      y: 310,
      w: 14,
      h: 14,
      hp: 2,
      hpMax: 2,
      direcao: 'esquerda',
      velocidade: 40,
      iframeTimer: 0,
      vivo: true,
      timerTrocaDirecao: 1.6,
    },
    {
      id: 'vagalume_vale_4',
      tipo: 'vagalume_sombrio',
      x: 640,
      y: 350,
      w: 12,
      h: 12,
      hp: 1,
      hpMax: 1,
      direcao: 'cima',
      velocidade: 50,
      iframeTimer: 0,
      vivo: true,
      tempoSeno: 0.8,
      baseX: 640,
      baseY: 350,
    },
  ];
}

export function criarInimigosDungeonSala(roomId: string): InimigoEntidade[] {
  if (roomId === 'sala_0_2_jardim') {
    return [
      {
        id: 'espinho_dungeon_0_2_1',
        tipo: 'espinho_rastejante',
        x: 60,
        y: 60,
        w: 14,
        h: 14,
        hp: 2,
        hpMax: 2,
        direcao: 'direita',
        velocidade: 40,
        iframeTimer: 0,
        vivo: true,
        timerTrocaDirecao: 2.0,
      },
      {
        id: 'vagalume_dungeon_0_2_1',
        tipo: 'vagalume_sombrio',
        x: 180,
        y: 80,
        w: 12,
        h: 12,
        hp: 1,
        hpMax: 1,
        direcao: 'esquerda',
        velocidade: 50,
        iframeTimer: 0,
        vivo: true,
        tempoSeno: 0,
        baseX: 180,
        baseY: 80,
      },
    ];
  }

  if (roomId === 'sala_2_2_cripta') {
    return [
      {
        id: 'espinho_dungeon_2_2_1',
        tipo: 'espinho_rastejante',
        x: 70,
        y: 140,
        w: 14,
        h: 14,
        hp: 2,
        hpMax: 2,
        direcao: 'cima',
        velocidade: 40,
        iframeTimer: 0,
        vivo: true,
        timerTrocaDirecao: 2.2,
      },
      {
        id: 'espinho_dungeon_2_2_2',
        tipo: 'espinho_rastejante',
        x: 170,
        y: 70,
        w: 14,
        h: 14,
        hp: 2,
        hpMax: 2,
        direcao: 'baixo',
        velocidade: 40,
        iframeTimer: 0,
        vivo: true,
        timerTrocaDirecao: 2.0,
      },
    ];
  }

  if (roomId === 'sala_1_1_centro') {
    return [
      {
        id: 'vagalume_dungeon_1_1_1',
        tipo: 'vagalume_sombrio',
        x: 60,
        y: 60,
        w: 12,
        h: 12,
        hp: 1,
        hpMax: 1,
        direcao: 'direita',
        velocidade: 50,
        iframeTimer: 0,
        vivo: true,
        tempoSeno: 0.5,
        baseX: 60,
        baseY: 60,
      },
      {
        id: 'vagalume_dungeon_1_1_2',
        tipo: 'vagalume_sombrio',
        x: 180,
        y: 150,
        w: 12,
        h: 12,
        hp: 1,
        hpMax: 1,
        direcao: 'esquerda',
        velocidade: 50,
        iframeTimer: 0,
        vivo: true,
        tempoSeno: 2.0,
        baseX: 180,
        baseY: 150,
      },
    ];
  }

  return [];
}

// ------------------------------------------------------------------
// GOLPE DE ESPADA E COMBATE DO HERÓI (LÂMINA DE ELDRIM)
// ------------------------------------------------------------------

// Hitbox de espada = retângulo ~10x10px (normal) ou ~14x14px (carregado) à frente do herói
export function dispararGolpeEspada(
  heroi: HeroState,
  carregado: boolean = false
): boolean {
  if (heroi.ataqueTimer && heroi.ataqueTimer > 0) {
    return false; // já está desferindo um golpe
  }

  heroi.atacando = true;
  heroi.ataqueCarregado = carregado;
  heroi.ataqueTimer = carregado ? 0.25 : 0.2; // 250ms se carregado, 200ms se normal

  const hx = heroi.x;
  const hy = heroi.y;
  const hw = heroi.w;
  const hh = heroi.h;

  let bx = hx;
  let by = hy;
  // Hitbox expandida para golpe carregado
  const bw = carregado ? 14 : 10;
  const bh = carregado ? 14 : 10;

  if (heroi.direcao === 'cima') {
    bx = hx + (hw - bw) / 2;
    by = hy - bh + 1;
  } else if (heroi.direcao === 'baixo') {
    bx = hx + (hw - bw) / 2;
    by = hy + hh - 1;
  } else if (heroi.direcao === 'esquerda') {
    bx = hx - bw + 1;
    by = hy + (hh - bh) / 2;
  } else if (heroi.direcao === 'direita') {
    bx = hx + hw - 1;
    by = hy + (hh - bh) / 2;
  }

  heroi.ataqueHitbox = {
    x: bx,
    y: by,
    w: bw,
    h: bh,
  };

  if (carregado) {
    soundManager.playChargedSlash();
  } else {
    soundManager.playSwordSlash();
  }
  return true;
}

// Atualização de timers de combate e knockback do herói
export function atualizarHeroiCombate(
  heroi: HeroState,
  dt: number,
  obstaculos: Retangulo[],
  limites: { minX: number; maxX: number; minY: number; maxY: number }
) {
  // Timer de ataque (200ms)
  if (heroi.ataqueTimer && heroi.ataqueTimer > 0) {
    heroi.ataqueTimer -= dt;
    if (heroi.ataqueTimer <= 0) {
      heroi.ataqueTimer = 0;
      heroi.atacando = false;
      heroi.ataqueHitbox = null;
    } else {
      // Atualiza posição da hitbox conforme o herói
      const hx = heroi.x;
      const hy = heroi.y;
      const hw = heroi.w;
      const hh = heroi.h;
      const bw = 10;
      const bh = 10;

      let bx = hx;
      let by = hy;
      if (heroi.direcao === 'cima') {
        bx = hx + (hw - bw) / 2;
        by = hy - bh + 1;
      } else if (heroi.direcao === 'baixo') {
        bx = hx + (hw - bw) / 2;
        by = hy + hh - 1;
      } else if (heroi.direcao === 'esquerda') {
        bx = hx - bw + 1;
        by = hy + (hh - bh) / 2;
      } else if (heroi.direcao === 'direita') {
        bx = hx + hw - 1;
        by = hy + (hh - bh) / 2;
      }

      heroi.ataqueHitbox = { x: bx, y: by, w: bw, h: bh };
    }
  }

  // Timer de Iframes (800ms)
  if (heroi.iframes && heroi.iframes > 0) {
    heroi.iframes = Math.max(0, heroi.iframes - dt);
  }

  // Knockback de 24px com velocidade decadente
  if (heroi.knockbackTimer && heroi.knockbackTimer > 0) {
    const moveX = (heroi.knockbackVx || 0) * dt;
    const moveY = (heroi.knockbackVy || 0) * dt;

    if (moveX !== 0) {
      const targetX = Math.max(
        limites.minX,
        Math.min(heroi.x + moveX, limites.maxX - heroi.w)
      );
      const testBoxX: Retangulo = {
        x: targetX,
        y: heroi.y,
        w: heroi.w,
        h: heroi.h,
      };
      if (!obstaculos.some((obs) => checkAABB(testBoxX, obs))) {
        heroi.x = targetX;
      }
    }

    if (moveY !== 0) {
      const targetY = Math.max(
        limites.minY,
        Math.min(heroi.y + moveY, limites.maxY - heroi.h)
      );
      const testBoxY: Retangulo = {
        x: heroi.x,
        y: targetY,
        w: heroi.w,
        h: heroi.h,
      };
      if (!obstaculos.some((obs) => checkAABB(testBoxY, obs))) {
        heroi.y = targetY;
      }
    }

    heroi.knockbackTimer = Math.max(0, heroi.knockbackTimer - dt);
    if (heroi.knockbackTimer <= 0) {
      heroi.knockbackVx = 0;
      heroi.knockbackVy = 0;
    }
  }
}

// Aplica dano ao herói: -1 Fragmento de Vida, 800ms iframes, knockback de 24px na direção oposta
export function aplicarDanoAoHeroi(
  state: GameState,
  origemDanoX: number,
  origemDanoY: number
) {
  const heroi = state.heroi;
  if (heroi.iframes && heroi.iframes > 0) {
    return; // Invulnerável
  }

  // Perde 1 Fragmento de Vida
  state.vidaAtual = Math.max(0, state.vidaAtual - 1);
  heroi.iframes = 0.8; // 800ms

  // Vetor de knockback de 24px na direção oposta ao golpe
  const dx = heroi.x + heroi.w / 2 - origemDanoX;
  const dy = heroi.y + heroi.h / 2 - origemDanoY;
  const dist = Math.sqrt(dx * dx + dy * dy) || 1;
  const knockbackDistanciaTotal = 24; // 24px
  const knockbackDuracao = 0.15; // 150ms
  const vel = knockbackDistanciaTotal / knockbackDuracao; // px/s

  heroi.knockbackVx = (dx / dist) * vel;
  heroi.knockbackVy = (dy / dist) * vel;
  heroi.knockbackTimer = knockbackDuracao;

  soundManager.playHeroHurt();
}

// ------------------------------------------------------------------
// EXPLOSÕES DE PARTÍCULAS
// ------------------------------------------------------------------

// Gera 4-6 partículas quadradas ao derrotar inimigo ou impactar
export function gerarExplosaoParticulas(
  particulas: ParticulaQuadrada[],
  centroX: number,
  centroY: number,
  cor: string = '#86efac',
  quantidade: number = 5
) {
  for (let i = 0; i < quantidade; i++) {
    const angulo = (Math.PI * 2 * i) / quantidade + (Math.random() - 0.5) * 0.5;
    const vel = 35 + Math.random() * 45;
    particulas.push({
      x: centroX + (Math.random() - 0.5) * 4,
      y: centroY + (Math.random() - 0.5) * 4,
      vx: Math.cos(angulo) * vel,
      vy: Math.sin(angulo) * vel,
      tamanho: Math.random() > 0.5 ? 3 : 2,
      cor,
      tempoRestante: 0.35 + Math.random() * 0.15,
      tempoTotal: 0.5,
    });
  }
}

export function atualizarParticulas(
  particulas: ParticulaQuadrada[],
  dt: number
) {
  for (let i = particulas.length - 1; i >= 0; i--) {
    const p = particulas[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.tempoRestante -= dt;
    if (p.tempoRestante <= 0) {
      particulas.splice(i, 1);
    }
  }
}

// ------------------------------------------------------------------
// ATUALIZAÇÃO DE INIMIGOS (VALE VERDEJANTE & DUNGEON)
// ------------------------------------------------------------------

export function atualizarInimigos(
  inimigos: InimigoEntidade[],
  heroi: HeroState,
  obstaculos: Retangulo[],
  limites: { minX: number; maxX: number; minY: number; maxY: number },
  state: GameState,
  dt: number
) {
  const direcoes: Direcao[] = ['cima', 'baixo', 'esquerda', 'direita'];

  for (const ini of inimigos) {
    if (!ini.vivo) continue;

    // Atualiza iframes de 300ms do inimigo
    if (ini.iframeTimer > 0) {
      ini.iframeTimer = Math.max(0, ini.iframeTimer - dt);
    }

    // 1. Movimentação específica de cada inimigo
    if (ini.tipo === 'espinho_rastejante') {
      // Espinho Rastejante: 40px/s, anda reto, vira ao colidir com parede/obstáculo
      let moveX = 0;
      let moveY = 0;

      if (ini.direcao === 'cima') moveY -= ini.velocidade * dt;
      else if (ini.direcao === 'baixo') moveY += ini.velocidade * dt;
      else if (ini.direcao === 'esquerda') moveX -= ini.velocidade * dt;
      else if (ini.direcao === 'direita') moveX += ini.velocidade * dt;

      const targetX = Math.max(
        limites.minX,
        Math.min(ini.x + moveX, limites.maxX - ini.w)
      );
      const targetY = Math.max(
        limites.minY,
        Math.min(ini.y + moveY, limites.maxY - ini.h)
      );

      const hitX = targetX !== ini.x + moveX;
      const hitY = targetY !== ini.y + moveY;

      const testBox: Retangulo = {
        x: targetX,
        y: targetY,
        w: ini.w,
        h: ini.h,
      };

      const colidiuObstaculo = obstaculos.some((obs) => checkAABB(testBox, obs));

      if (hitX || hitY || colidiuObstaculo) {
        // Vira para uma nova direção aleatória ou inverte
        const outras = direcoes.filter((d) => d !== ini.direcao);
        ini.direcao = outras[Math.floor(Math.random() * outras.length)];
      } else {
        ini.x = targetX;
        ini.y = targetY;
      }

      // Timer opcional para virar periodicamente
      if (ini.timerTrocaDirecao !== undefined) {
        ini.timerTrocaDirecao -= dt;
        if (ini.timerTrocaDirecao <= 0) {
          ini.timerTrocaDirecao = 2.0 + Math.random() * 2.0;
          ini.direcao = direcoes[Math.floor(Math.random() * direcoes.length)];
        }
      }
    } else if (ini.tipo === 'vagalume_sombrio') {
      // Vagalume Sombrio: 50px/s, movimento senoidal suave
      ini.tempoSeno = (ini.tempoSeno || 0) + dt * 4;

      let moveX = 0;
      let moveY = 0;

      if (ini.direcao === 'cima') moveY -= ini.velocidade * dt;
      else if (ini.direcao === 'baixo') moveY += ini.velocidade * dt;
      else if (ini.direcao === 'esquerda') moveX -= ini.velocidade * dt;
      else if (ini.direcao === 'direita') moveX += ini.velocidade * dt;

      // Deslocamento senoidal perpendicular à direção
      const senoOffset = Math.sin(ini.tempoSeno) * 1.8;
      if (ini.direcao === 'cima' || ini.direcao === 'baixo') {
        moveX += senoOffset;
      } else {
        moveY += senoOffset;
      }

      const targetX = Math.max(
        limites.minX,
        Math.min(ini.x + moveX, limites.maxX - ini.w)
      );
      const targetY = Math.max(
        limites.minY,
        Math.min(ini.y + moveY, limites.maxY - ini.h)
      );

      const hitLimites =
        targetX !== ini.x + moveX || targetY !== ini.y + moveY;

      const testBox: Retangulo = {
        x: targetX,
        y: targetY,
        w: ini.w,
        h: ini.h,
      };

      const colidiuObstaculo = obstaculos.some((obs) => checkAABB(testBox, obs));

      if (hitLimites || colidiuObstaculo) {
        const outras = direcoes.filter((d) => d !== ini.direcao);
        ini.direcao = outras[Math.floor(Math.random() * outras.length)];
      } else {
        ini.x = targetX;
        ini.y = targetY;
      }
    }

    // 2. Colisão com o golpe de espada ativo de Ren
    if (
      heroi.atacando &&
      heroi.ataqueHitbox &&
      ini.iframeTimer <= 0 &&
      checkAABB(heroi.ataqueHitbox, ini)
    ) {
      const dano = heroi.ataqueCarregado ? 2 : 1;
      ini.hp -= dano;
      ini.iframeTimer = 0.3; // 300ms de iframes
      soundManager.playEnemyHit();

      // Recuo proporcional ao golpe (16px se carregado, 8px se normal)
      const impulso = heroi.ataqueCarregado ? 16 : 8;
      const dx = ini.x + ini.w / 2 - (heroi.x + heroi.w / 2);
      const dy = ini.y + ini.h / 2 - (heroi.y + heroi.h / 2);
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      ini.x += (dx / dist) * impulso;
      ini.y += (dy / dist) * impulso;

      if (ini.hp <= 0) {
        ini.vivo = false;
        soundManager.playEnemyDeath();
        gerarExplosaoParticulas(
          state.particulas,
          ini.x + ini.w / 2,
          ini.y + ini.h / 2,
          ini.tipo === 'espinho_rastejante' ? '#4ade80' : '#a855f7',
          heroi.ataqueCarregado ? 8 : 5
        );
        // Recompensa em Selos (moeda de Eldrim)
        state.selos += Math.random() > 0.4 ? 2 : 5;
      }
    }

    // 3. Colisão com o corpo do herói (dano a Ren se não estiver atacando com sucesso ou iframes)
    if (ini.vivo && (!heroi.iframes || heroi.iframes <= 0)) {
      if (checkAABB(heroi, ini)) {
        aplicarDanoAoHeroi(state, ini.x + ini.w / 2, ini.y + ini.h / 2);
      }
    }
  }
}

// ------------------------------------------------------------------
// PROJÉTEIS (ESPINHOS DO CHEFE RAIZARCA)
// ------------------------------------------------------------------

export function dispararEspinho(
  projeteis: ProjetilEspinho[],
  origemX: number,
  origemY: number,
  alvoX: number,
  alvoY: number,
  offsetAngulo: number = 0
) {
  const dx = alvoX - origemX;
  const dy = alvoY - origemY;
  const dist = Math.sqrt(dx * dx + dy * dy) || 1;
  const anguloBase = Math.atan2(dy, dx) + offsetAngulo;
  const velocidade = 120; // 120px/s conforme especificação

  projeteis.push({
    id: `espinho_${Date.now()}_${Math.random()}`,
    x: origemX,
    y: origemY,
    vx: Math.cos(anguloBase) * velocidade,
    vy: Math.sin(anguloBase) * velocidade,
    raio: 3,
    ativo: true,
    tempoVida: 3.0,
  });

  soundManager.playSpikeShoot();
}

export function atualizarProjeteis(
  projeteis: ProjetilEspinho[],
  heroi: HeroState,
  state: GameState,
  dt: number,
  limites: { minX: number; maxX: number; minY: number; maxY: number }
) {
  for (let i = projeteis.length - 1; i >= 0; i--) {
    const p = projeteis[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.tempoVida -= dt;

    // Saiu dos limites da sala ou tempo esgotado
    if (
      p.tempoVida <= 0 ||
      p.x < limites.minX ||
      p.x > limites.maxX ||
      p.y < limites.minY ||
      p.y > limites.maxY
    ) {
      projeteis.splice(i, 1);
      continue;
    }

    // Colisão com o herói
    const projBox: Retangulo = {
      x: p.x - p.raio,
      y: p.y - p.raio,
      w: p.raio * 2,
      h: p.raio * 2,
    };

    if (checkAABB(heroi, projBox)) {
      aplicarDanoAoHeroi(state, p.x, p.y);
      gerarExplosaoParticulas(state.particulas, p.x, p.y, '#f59e0b', 3);
      projeteis.splice(i, 1);
    }
  }
}

// ------------------------------------------------------------------
// CHEFE: RAIZARCA, O GUARDIÃO CORROMPIDO (SALA [1, 0])
// ------------------------------------------------------------------

export function atualizarChefeRaizarca(
  chefe: RaizarcaBossState,
  heroi: HeroState,
  state: GameState,
  dt: number
) {
  if (chefe.derrotado) {
    return;
  }

  // Ativa a luta assim que Ren se aproxima do centro da arena
  if (!chefe.ativo) {
    if (heroi.y < 190) {
      chefe.ativo = true;
      state.notificacaoTexto = 'RAIZARCA, O GUARDIÃO CORROMPIDO';
      state.notificacaoTimer = 3.0;
    }
    return;
  }

  // 1. Screenshake / tremor
  if (chefe.screenshakeTimer > 0) {
    chefe.screenshakeTimer = Math.max(0, chefe.screenshakeTimer - dt);
  }

  // 2. Animação de desmoronar (1.5s) e cutscene do santuário (2.0s)
  if (chefe.desmoronarTimer > 0) {
    chefe.desmoronarTimer = Math.max(0, chefe.desmoronarTimer - dt);

    // Chuva contínua de partículas marrons/madeira durante o desmoronar
    if (Math.random() < 0.4) {
      const rx = 60 + Math.random() * 136;
      const ry = 40 + Math.random() * 80;
      gerarExplosaoParticulas(state.particulas, rx, ry, '#78350f', 3);
    }

    if (chefe.desmoronarTimer <= 0) {
      // Inicia a cutscene curta (2s) do Santuário se iluminando
      chefe.cutsceneLuzTimer = 2.0;
      soundManager.playSanctuaryPurified();
    }
    return;
  }

  if (chefe.cutsceneLuzTimer > 0) {
    chefe.cutsceneLuzTimer = Math.max(0, chefe.cutsceneLuzTimer - dt);
    if (chefe.cutsceneLuzTimer <= 0) {
      chefe.derrotado = true;
      chefe.ganchoLiberado = true;
      state.notificacaoTexto = 'SANTUÁRIO PURIFICADO! GANCHO DISPONÍVEL!';
      state.notificacaoTimer = 3.5;
      soundManager.playItemGet();
    }
    return;
  }

  // 3. Telegraph de disparo de espinhos (0.5s de tremor antes de disparar)
  if (chefe.telegraphTimer > 0) {
    chefe.telegraphTimer = Math.max(0, chefe.telegraphTimer - dt);
    chefe.screenshakeTimer = 0.1; // tremor visual

    if (chefe.telegraphTimer <= 0 && chefe.telegraphPendenteDisparo) {
      chefe.telegraphPendenteDisparo = false;
      // Dispara 2-3 espinhos na direção do herói a 120px/s
      const nAtivo = chefe.nucleos[chefe.nucleoAtivoIndex] || chefe.nucleos[0];
      const ox = nAtivo.x + nAtivo.w / 2;
      const oy = nAtivo.y + nAtivo.h / 2;
      const hx = heroi.x + heroi.w / 2;
      const hy = heroi.y + heroi.h / 2;

      const qtd = chefe.telegraphDisparosQtd || 3;
      if (qtd === 2) {
        dispararEspinho(state.projeteis, ox, oy, hx, hy, -0.2);
        dispararEspinho(state.projeteis, ox, oy, hx, hy, 0.2);
      } else {
        dispararEspinho(state.projeteis, ox, oy, hx, hy, -0.25);
        dispararEspinho(state.projeteis, ox, oy, hx, hy, 0);
        dispararEspinho(state.projeteis, ox, oy, hx, hy, 0.25);
      }
    }
  }

  // 4. Disparos periódicos a cada 4.5s para manter o combate ativo
  chefe.timerDisparoPeriodico -= dt;
  if (chefe.timerDisparoPeriodico <= 0) {
    chefe.timerDisparoPeriodico = 5.0;
    chefe.telegraphTimer = 0.5;
    chefe.telegraphPendenteDisparo = true;
    chefe.telegraphDisparosQtd = 2;
  }

  // 5. Rotação do Núcleo Ativo a cada 4 segundos
  // Apenas 1 núcleo fica exposto (brilhando) por vez; os outros ficam "fechados" (sem hitbox)
  chefe.rotacaoTimer -= dt;
  if (chefe.rotacaoTimer <= 0) {
    chefe.rotacaoTimer = 4.0;
    // Avança para o próximo núcleo que ainda NÃO foi destruído
    const vivos = chefe.nucleos.filter((n) => !n.destruido);
    if (vivos.length > 0) {
      let nextIdx = (chefe.nucleoAtivoIndex + 1) % 3;
      while (chefe.nucleos[nextIdx].destruido) {
        nextIdx = (nextIdx + 1) % 3;
      }
      chefe.nucleoAtivoIndex = nextIdx;
    }
  }

  // Atualiza iframes dos 3 núcleos
  for (const n of chefe.nucleos) {
    if (n.iframeTimer > 0) {
      n.iframeTimer = Math.max(0, n.iframeTimer - dt);
    }
  }

  // 6. Colisão com o golpe de espada ativo de Ren no núcleo exposto
  const nucleoAtivo = chefe.nucleos[chefe.nucleoAtivoIndex];
  if (
    nucleoAtivo &&
    !nucleoAtivo.destruido &&
    heroi.atacando &&
    heroi.ataqueHitbox &&
    nucleoAtivo.iframeTimer <= 0
  ) {
    if (checkAABB(heroi.ataqueHitbox, nucleoAtivo)) {
      const dano = heroi.ataqueCarregado ? 2 : 1;
      nucleoAtivo.hp -= dano;
      nucleoAtivo.iframeTimer = 0.3; // 300ms iframes
      soundManager.playEnemyHit();

      gerarExplosaoParticulas(
        state.particulas,
        nucleoAtivo.x + nucleoAtivo.w / 2,
        nucleoAtivo.y + nucleoAtivo.h / 2,
        '#22c55e',
        heroi.ataqueCarregado ? 7 : 4
      );

      // Núcleo destruído!
      if (nucleoAtivo.hp <= 0) {
        nucleoAtivo.destruido = true;
        soundManager.playEnemyDeath();

        gerarExplosaoParticulas(
          state.particulas,
          nucleoAtivo.x + nucleoAtivo.w / 2,
          nucleoAtivo.y + nucleoAtivo.h / 2,
          '#eab308',
          8
        );

        // A cada núcleo destruído, Raizarca lança 2-3 espinhos (120px/s)
        // com 0.5s de telegraph (tremor visual) antes de disparar
        chefe.telegraphTimer = 0.5;
        chefe.telegraphPendenteDisparo = true;
        chefe.telegraphDisparosQtd = 3;

        // Verifica se os 3 núcleos foram destruídos
        const todosDestruidos = chefe.nucleos.every((n) => n.destruido);
        if (todosDestruidos) {
          // Inicia desmoronamento de 1.5s
          chefe.desmoronarTimer = 1.5;
          chefe.screenshakeTimer = 1.5;
          soundManager.playBossDefeat();
          state.notificacaoTexto = 'RAIZARCA DESMORONOU!';
          state.notificacaoTimer = 2.0;
        } else {
          // Rotaciona imediatamente para outro núcleo vivo
          let nextIdx = (chefe.nucleoAtivoIndex + 1) % 3;
          while (chefe.nucleos[nextIdx].destruido) {
            nextIdx = (nextIdx + 1) % 3;
          }
          chefe.nucleoAtivoIndex = nextIdx;
          chefe.rotacaoTimer = 4.0;
        }
      }
    }
  }

  // 7. Colisão física de Ren contra a carapaça de raízes de Raizarca
  // A enorme carapaça do guardião é sólida e causa dano se o herói colidir
  const corpoRaizarca: Retangulo = {
    x: 64,
    y: 36,
    w: 128,
    h: 70,
  };

  if (checkAABB(heroi, corpoRaizarca)) {
    aplicarDanoAoHeroi(
      state,
      corpoRaizarca.x + corpoRaizarca.w / 2,
      corpoRaizarca.y + corpoRaizarca.h / 2
    );
  }
}

// ------------------------------------------------------------------
// RENDERIZAÇÃO RETRÔ 16-BIT DE COMBATE E ENTIDADES
// ------------------------------------------------------------------

// Renderiza a Lâmina de Eldrim desferida por Ren
export function renderizarEspada(
  ctx: CanvasRenderingContext2D,
  heroi: HeroState
) {
  if (!heroi.atacando || !heroi.ataqueHitbox) return;

  const box = heroi.ataqueHitbox;
  const hx = heroi.x;
  const hy = heroi.y;
  const isCarregado = !!heroi.ataqueCarregado;

  ctx.save();

  if (isCarregado) {
    // Efeito visual poderoso do Golpe Carregado: onda de choque expansiva
    // 1. Halo místico de impacto
    ctx.fillStyle = 'rgba(56, 189, 248, 0.6)';
    ctx.fillRect(box.x - 2, box.y - 2, box.w + 4, box.h + 4);

    // 2. Núcleo incandescente de energia estacional
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillRect(box.x, box.y, box.w, box.h);

    // 3. Lâmina reforçada com contorno de luz pura
    ctx.fillStyle = '#ffffff';
    if (heroi.direcao === 'cima') {
      ctx.fillRect(hx + 6, hy - 12, 4, 12);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(hx + 3, hy - 2, 10, 3);
      // Estrias de onda cortante em leque
      ctx.fillStyle = '#bae6fd';
      ctx.fillRect(box.x - 3, box.y - 4, box.w + 6, 2);
      ctx.fillRect(box.x - 1, box.y - 2, box.w + 2, 2);
    } else if (heroi.direcao === 'baixo') {
      ctx.fillRect(hx + 6, hy + 16, 4, 12);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(hx + 3, hy + 15, 10, 3);
      ctx.fillStyle = '#bae6fd';
      ctx.fillRect(box.x - 3, box.y + box.h + 2, box.w + 6, 2);
      ctx.fillRect(box.x - 1, box.y + box.h, box.w + 2, 2);
    } else if (heroi.direcao === 'esquerda') {
      ctx.fillRect(hx - 12, hy + 6, 12, 4);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(hx - 2, hy + 3, 3, 10);
      ctx.fillStyle = '#bae6fd';
      ctx.fillRect(box.x - 4, box.y - 3, 2, box.h + 6);
      ctx.fillRect(box.x - 2, box.y - 1, 2, box.h + 2);
    } else if (heroi.direcao === 'direita') {
      ctx.fillRect(hx + 16, hy + 6, 12, 4);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(hx + 15, hy + 3, 3, 10);
      ctx.fillStyle = '#bae6fd';
      ctx.fillRect(box.x + box.w + 2, box.y - 3, 2, box.h + 6);
      ctx.fillRect(box.x + box.w, box.y - 1, 2, box.h + 2);
    }
  } else {
    // Arco de energia azulada da Lâmina de Eldrim normal
    ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.fillRect(box.x - 1, box.y - 1, box.w + 2, box.h + 2);

    // Lâmina prateada
    ctx.fillStyle = '#f8fafc';
    if (heroi.direcao === 'cima') {
      ctx.fillRect(hx + 7, hy - 8, 2, 8);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(hx + 5, hy - 2, 6, 2);
    } else if (heroi.direcao === 'baixo') {
      ctx.fillRect(hx + 7, hy + 16, 2, 8);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(hx + 5, hy + 16, 6, 2);
    } else if (heroi.direcao === 'esquerda') {
      ctx.fillRect(hx - 8, hy + 7, 8, 2);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(hx - 2, hy + 5, 2, 6);
    } else if (heroi.direcao === 'direita') {
      ctx.fillRect(hx + 16, hy + 7, 8, 2);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(hx + 16, hy + 5, 2, 6);
    }
  }

  ctx.restore();
}

// Renderiza o efeito visual de brilho crescente na espada ao segurar Z por 1s
export function renderizarCargaEspada(
  ctx: CanvasRenderingContext2D,
  heroi: HeroState,
  tempoAnim: number = 0
) {
  if (!heroi.carregandoGolpe || !heroi.cargaGolpeTimer || heroi.cargaGolpeTimer <= 0) {
    return;
  }

  const hx = heroi.x;
  const hy = heroi.y;
  const timer = heroi.cargaGolpeTimer;
  const pronto = !!heroi.golpePronto || timer >= 1.0;
  const ratio = Math.min(1.0, timer / 1.0); // 0.0 a 1.0

  // Ponto focal da lâmina de Ren
  let fx = hx + 8;
  let fy = hy + 8;
  if (heroi.direcao === 'cima') {
    fx = hx + 8;
    fy = hy + 2;
  } else if (heroi.direcao === 'baixo') {
    fx = hx + 8;
    fy = hy + 14;
  } else if (heroi.direcao === 'esquerda') {
    fx = hx + 2;
    fy = hy + 8;
  } else if (heroi.direcao === 'direita') {
    fx = hx + 14;
    fy = hy + 8;
  }

  ctx.save();

  if (pronto) {
    // GOLPE TOTALMENTE CARREGADO (1s+): pulsação radiante intensa e faíscas arcanas
    const pulso = Math.sin(tempoAnim * 15) * 0.2 + 0.8;
    const raio = 8 * pulso;

    // Aura celestial no corpo do herói
    ctx.fillStyle = 'rgba(56, 189, 248, 0.18)';
    ctx.fillRect(hx - 2, hy - 2, heroi.w + 4, heroi.h + 4);

    // Resplendor externo ciano
    ctx.fillStyle = 'rgba(56, 189, 248, 0.45)';
    ctx.beginPath();
    ctx.arc(fx, fy, raio + 3, 0, Math.PI * 2);
    ctx.fill();

    // Núcleo brilhante branco/dourado
    ctx.fillStyle = Math.sin(tempoAnim * 20) > 0 ? '#ffffff' : '#fef08a';
    ctx.beginPath();
    ctx.arc(fx, fy, raio * 0.6, 0, Math.PI * 2);
    ctx.fill();

    // 4 partículas orbitantes em alta velocidade
    for (let i = 0; i < 4; i++) {
      const angulo = tempoAnim * 8 + (i * Math.PI) / 2;
      const dist = 7 + Math.sin(tempoAnim * 10 + i) * 2;
      const px = fx + Math.cos(angulo) * dist;
      const py = fy + Math.sin(angulo) * dist;
      ctx.fillStyle = i % 2 === 0 ? '#38bdf8' : '#ffffff';
      ctx.fillRect(Math.round(px) - 1, Math.round(py) - 1, 2, 2);
    }
  } else {
    // CARREGANDO (0.0s a 1.0s): brilho crescente na lâmina
    const raio = 2 + ratio * 5;
    const alpha = 0.2 + ratio * 0.5;

    // Brilho crescente
    ctx.fillStyle = `rgba(56, 189, 248, ${alpha})`;
    ctx.beginPath();
    ctx.arc(fx, fy, raio, 0, Math.PI * 2);
    ctx.fill();

    // Faíscas que convergem gradualmente
    const numFaiscas = Math.floor(ratio * 3) + 1;
    for (let i = 0; i < numFaiscas; i++) {
      const angulo = tempoAnim * 5 + (i * (Math.PI * 2)) / 3;
      const dist = 10 * (1.0 - ratio * 0.4);
      const px = fx + Math.cos(angulo) * dist;
      const py = fy + Math.sin(angulo) * dist;
      ctx.fillStyle = `rgba(224, 242, 254, ${alpha + 0.2})`;
      ctx.fillRect(Math.round(px), Math.round(py), 1, 1);
    }
  }

  ctx.restore();
}

// Renderiza inimigos com animação de movimento e flash de dano
export function renderizarInimigos(
  ctx: CanvasRenderingContext2D,
  inimigos: InimigoEntidade[],
  offsetX: number = 0,
  offsetY: number = 0,
  animTime: number = 0
) {
  for (const ini of inimigos) {
    if (!ini.vivo) continue;

    const ix = Math.round(ini.x - offsetX);
    const iy = Math.round(ini.y - offsetY);

    // Se estiver em iframe (300ms após golpe), pisca em branco
    const emIframe = ini.iframeTimer > 0 && Math.floor(ini.iframeTimer * 20) % 2 === 0;

    ctx.save();

    // Sombra pixelada no chão
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(ix + 2, iy + ini.h - 1, ini.w - 4, 3);

    if (ini.tipo === 'espinho_rastejante') {
      // Espinho Rastejante: criatura espinhosa verde-oliva com carapaça
      const corCorpo = emIframe ? '#ffffff' : '#2d5a27';
      const corEspinho = emIframe ? '#ffffff' : '#4ade80';

      ctx.fillStyle = corCorpo;
      ctx.fillRect(ix + 2, iy + 3, 10, 8);

      // Espinhos pontiagudos nas costas
      ctx.fillStyle = corEspinho;
      ctx.fillRect(ix + 4, iy + 1, 2, 2);
      ctx.fillRect(ix + 8, iy + 1, 2, 2);
      ctx.fillRect(ix + 1, iy + 4, 2, 2);
      ctx.fillRect(ix + 11, iy + 4, 2, 2);

      // Patas rastejantes que alternam com o tempo
      const passo = Math.floor(animTime * 8) % 2 === 0 ? 1 : 0;
      ctx.fillStyle = emIframe ? '#ffffff' : '#143811';
      ctx.fillRect(ix + 2 + passo, iy + 11, 2, 2);
      ctx.fillRect(ix + 9 - passo, iy + 11, 2, 2);

      // Olhos brilhantes amarelos
      ctx.fillStyle = emIframe ? '#ffffff' : '#fde047';
      if (ini.direcao === 'direita') {
        ctx.fillRect(ix + 9, iy + 5, 2, 2);
      } else if (ini.direcao === 'esquerda') {
        ctx.fillRect(ix + 3, iy + 5, 2, 2);
      } else {
        ctx.fillRect(ix + 4, iy + 5, 2, 2);
        ctx.fillRect(ix + 8, iy + 5, 2, 2);
      }
    } else if (ini.tipo === 'vagalume_sombrio') {
      // Vagalume Sombrio: corpo violeta/sombrio com abdômen brilhante e asas
      const corCorpo = emIframe ? '#ffffff' : '#4c1d95';
      const corAsa = 'rgba(192, 132, 252, 0.7)';
      const pulso = 0.7 + Math.sin(animTime * 8) * 0.3;

      // Asas pulsando
      ctx.fillStyle = corAsa;
      const flap = Math.sin(animTime * 18) * 2;
      ctx.fillRect(ix + 1, iy + 1 + flap, 4, 3);
      ctx.fillRect(ix + 7, iy + 1 - flap, 4, 3);

      // Corpo
      ctx.fillStyle = corCorpo;
      ctx.fillRect(ix + 3, iy + 3, 6, 6);

      // Abdômen bioluminescente pulsante (esmeralda/violeta)
      ctx.fillStyle = emIframe
        ? '#ffffff'
        : `rgba(168, 85, 247, ${pulso.toFixed(2)})`;
      ctx.fillRect(ix + 4, iy + 8, 4, 3);
      ctx.fillStyle = '#a855f7';
      ctx.fillRect(ix + 5, iy + 9, 2, 2);

      // Olhos vermelhos sombrios
      ctx.fillStyle = emIframe ? '#ffffff' : '#ef4444';
      ctx.fillRect(ix + 4, iy + 4, 1, 1);
      ctx.fillRect(ix + 7, iy + 4, 1, 1);
    }

    ctx.restore();
  }
}

// Renderiza projéteis espinho do chefe
export function renderizarProjeteis(
  ctx: CanvasRenderingContext2D,
  projeteis: ProjetilEspinho[],
  offsetX: number = 0,
  offsetY: number = 0
) {
  for (const p of projeteis) {
    const px = Math.round(p.x - offsetX);
    const py = Math.round(p.y - offsetY);

    ctx.save();
    // Brilho dourado/esmeralda
    ctx.fillStyle = 'rgba(234, 179, 8, 0.4)';
    ctx.fillRect(px - 3, py - 3, 6, 6);

    // Núcleo do espinho pontiagudo
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(px - 1, py - 1, 3, 3);

    ctx.fillStyle = '#b45309';
    ctx.fillRect(px, py, 1, 1);
    ctx.restore();
  }
}

// Renderiza partículas quadradas
export function renderizarParticulas(
  ctx: CanvasRenderingContext2D,
  particulas: ParticulaQuadrada[],
  offsetX: number = 0,
  offsetY: number = 0
) {
  for (const p of particulas) {
    const px = Math.round(p.x - offsetX);
    const py = Math.round(p.y - offsetY);
    const alpha = Math.max(0, p.tempoRestante / p.tempoTotal);

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.cor;
    ctx.fillRect(px, py, p.tamanho, p.tamanho);
    ctx.restore();
  }
}

// Renderiza Raizarca e seus 3 núcleos na Sala [1, 0]
export function renderizarChefeRaizarca(
  ctx: CanvasRenderingContext2D,
  chefe: RaizarcaBossState,
  animTime: number
) {
  if (chefe.derrotado) {
    // Tronco derrotado, purificado com musgo calmo
    ctx.save();
    ctx.fillStyle = '#14532d';
    ctx.fillRect(80, 48, 96, 48);
    ctx.fillStyle = '#166534';
    ctx.fillRect(92, 54, 72, 36);

    // Flor sagrada desabrochada no centro
    ctx.fillStyle = '#4ade80';
    ctx.fillRect(124, 68, 8, 8);
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(126, 70, 4, 4);

    // Pedestal sagrado com o Gancho de Vinha
    if (chefe.ganchoLiberado) {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(116, 120, 24, 12);
      ctx.strokeStyle = '#38bdf8';
      ctx.strokeRect(116.5, 120.5, 23, 11);

      // Ícone do Gancho de Vinha flutuando com brilho
      const floatY = 108 + Math.sin(animTime * 3) * 2;
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(124, floatY, 8, 8);
      ctx.fillStyle = '#86efac';
      ctx.fillRect(126, floatY + 2, 4, 4);

      ctx.font = '6px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#38bdf8';
      ctx.fillText('GANCHO DE VINHA', 128, floatY - 4);
    }
    ctx.restore();
    return;
  }

  // Tremor visual se screenshake ativo
  let shakeX = 0;
  let shakeY = 0;
  if (chefe.screenshakeTimer > 0) {
    shakeX = (Math.random() - 0.5) * 4;
    shakeY = (Math.random() - 0.5) * 4;
  }

  ctx.save();
  ctx.translate(shakeX, shakeY);

  // 1. Corpo massivo de raízes ancestrais corrompidas (~70% da sala)
  ctx.fillStyle = '#271206';
  ctx.fillRect(60, 32, 136, 80);

  // Ramificações secundárias
  ctx.fillStyle = '#451a03';
  ctx.fillRect(44, 44, 20, 50);
  ctx.fillRect(192, 44, 20, 50);
  ctx.fillRect(72, 24, 112, 16);

  // Casca e ranhuras de seiva escura
  ctx.fillStyle = '#78350f';
  ctx.fillRect(68, 40, 120, 64);
  ctx.fillStyle = '#14532d';
  ctx.fillRect(80, 50, 96, 44);

  // Efeito de respiração / tremor lento
  const breath = Math.sin(animTime * 2) * 2;
  ctx.fillStyle = '#052e16';
  ctx.fillRect(96, 60 + breath, 64, 24);

  // Olho ancestral central corrompido (Thorne)
  ctx.fillStyle = '#991b1b';
  ctx.fillRect(122, 66 + breath, 12, 10);
  ctx.fillStyle = '#f87171';
  ctx.fillRect(126, 69 + breath, 4, 4);

  // 2. Renderização dos 3 NÚCLEOS
  chefe.nucleos.forEach((n, idx) => {
    const ehAtivo = idx === chefe.nucleoAtivoIndex && !n.destruido;
    const nx = Math.round(n.x);
    const ny = Math.round(n.y);

    if (n.destruido) {
      // Núcleo destruído: cratera de madeira estilhaçada escura
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(nx - 2, ny - 2, n.w + 4, n.h + 4);
      ctx.strokeStyle = '#44403c';
      ctx.strokeRect(nx - 1.5, ny - 1.5, n.w + 3, n.h + 3);
      ctx.fillStyle = '#292524';
      ctx.fillRect(nx + 3, ny + 3, n.w - 6, n.h - 6);
      return;
    }

    // Se estiver em iframes, pisca em branco
    const emIframe = n.iframeTimer > 0 && Math.floor(n.iframeTimer * 20) % 2 === 0;

    if (ehAtivo) {
      // NÚCLEO EXPOSTO (BRILHANDO):
      const pulse = 0.7 + Math.sin(animTime * 6) * 0.3;

      // Aura de energia esmeralda pulsante
      ctx.fillStyle = `rgba(34, 197, 94, ${(pulse * 0.5).toFixed(2)})`;
      ctx.fillRect(nx - 3, ny - 3, n.w + 6, n.h + 6);

      // Casca aberta
      ctx.fillStyle = emIframe ? '#ffffff' : '#15803d';
      ctx.fillRect(nx - 1, ny - 1, n.w + 2, n.h + 2);

      // Cristal da seiva exposto
      ctx.fillStyle = emIframe ? '#ffffff' : '#4ade80';
      ctx.fillRect(nx, ny, n.w, n.h);

      // Ponto focal dourado
      ctx.fillStyle = emIframe ? '#ffffff' : '#fef08a';
      ctx.fillRect(nx + 3, ny + 3, n.w - 6, n.h - 6);

      // Mini barra de vida do núcleo (3 acertos)
      const barW = 16;
      const barX = nx + (n.w - barW) / 2;
      const barY = ny - 6;
      ctx.fillStyle = '#000000';
      ctx.fillRect(barX - 1, barY - 1, barW + 2, 4);
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(barX, barY, Math.round((barW * n.hp) / n.hpMax), 2);
    } else {
      // NÚCLEO FECHADO (CASCA IMPENETRÁVEL):
      ctx.fillStyle = '#451a03';
      ctx.fillRect(nx - 1, ny - 1, n.w + 2, n.h + 2);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(nx, ny, n.w, n.h);
      ctx.strokeStyle = '#271206';
      ctx.strokeRect(nx + 0.5, ny + 0.5, n.w - 1, n.h - 1);
      // Ranhura fechada
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(nx + 2, ny + n.h / 2 - 1, n.w - 4, 2);
    }
  });

  // 3. Barra Superior de Vida do Chefe
  const totalHpRestante = chefe.nucleos.reduce(
    (acc, n) => acc + (n.destruido ? 0 : n.hp),
    0
  );
  const totalHpMax = 9;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(48, 12, 160, 10);
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 1;
  ctx.strokeRect(48.5, 12.5, 159, 9);

  // Preenchimento verde-esmeralda
  const progHp = Math.max(0, totalHpRestante / totalHpMax);
  ctx.fillStyle = '#22c55e';
  ctx.fillRect(50, 14, Math.round(156 * progHp), 6);

  ctx.font = '6px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#f8fafc';
  ctx.fillText(
    `RAIZARCA: ${totalHpRestante}/9 ACERTOS`,
    128,
    19
  );

  ctx.restore();
}

// Renderiza a cutscene curta (2s) do Santuário se iluminando
export function renderizarCutscenePurificacao(
  ctx: CanvasRenderingContext2D,
  timer: number
) {
  if (timer <= 0) return;
  // Fade para branco-esverdeado e volta (duração total: 2.0s)
  const progresso = 1 - timer / 2.0; // 0 -> 1
  const alpha = Math.sin(progresso * Math.PI) * 0.92;

  ctx.save();
  ctx.fillStyle = `rgba(220, 252, 231, ${alpha.toFixed(3)})`;
  ctx.fillRect(0, 0, 256, 224);

  if (alpha > 0.4) {
    ctx.font = 'bold 8px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#065f46';
    ctx.fillText('O SANTUÁRIO DA RAIZ ANTIGA FOI PURIFICADO', 128, 108);
    ctx.font = '7px "Courier New", monospace';
    ctx.fillStyle = '#047857';
    ctx.fillText('A Corrupção de Thorne se dissipa...', 128, 120);
  }
  ctx.restore();
}
