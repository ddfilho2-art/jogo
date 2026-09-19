// ============================================================================
// CRIPTA DO GUARDIÃO ADORMECIDO - DUNGEON SECRETA OPCIONAL (VALE VERDEJANTE)
// ============================================================================
// Dungeon de exploração ancestral contendo 3 salas interconectadas:
// - Sala 1: Puzzle de 2 blocos de pedra empurráveis até marcas rúnicas no chão.
// - Sala 2: Desafio de combate com 4 Espinhos Rastejantes e 2 Vagalumes Sombrios.
// - Sala 3: Relicário solene com a Estátua do Guardião e baú de +1 Vida Máxima.
// ============================================================================

import {
  GameState,
  HeroState,
  Retangulo,
  InimigoEntidade,
} from './types';
import { soundManager } from './soundEffects';
import {
  checkAABB,
  atualizarInimigos,
  renderizarInimigos,
  gerarExplosaoParticulas,
} from './combat';

export interface BlocoEmpurravel {
  id: string;
  x: number;
  y: number;
  w: number; // 16px
  h: number; // 16px
  targetX: number;
  targetY: number;
  encaixado: boolean;
}

export interface MarcaSlot {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface PortaCripta {
  direcao: 'norte' | 'sul';
  x: number;
  y: number;
  w: number;
  h: number;
  estado: 'aberta' | 'trancada';
  destinoSalaId: string;
}

export interface SalaCripta {
  id: string;
  nome: string;
  subtitulo: string;
  portas: PortaCripta[];
  paredes: Retangulo[];
  blocos?: BlocoEmpurravel[];
  marcas?: MarcaSlot[];
  inimigos?: InimigoEntidade[];
  combateConcluido?: boolean;
  bauAberto?: boolean;
  bauX?: number;
  bauY?: number;
  bauW?: number;
  bauH?: number;
}

export interface CriptaState {
  salaAtualId: string;
  salas: Record<string, SalaCripta>;
  transicaoTimer: number; // 0.15s ao cruzar portas
  puzzleConcluido: boolean;
  combateConcluido: boolean;
  recompensaColetada: boolean;
  timerSomArrasto: number;
}

// ----------------------------------------------------------------------------
// CRIAÇÃO E INICIALIZAÇÃO DA CRIPTA
// ----------------------------------------------------------------------------
export function criarCriptaGuardiao(): CriptaState {
  // Paredes externas padrão (borda de 16px ao redor da tela 256x224)
  const paredesPadrao = (temPortaNorte: boolean, temPortaSul: boolean): Retangulo[] => {
    const list: Retangulo[] = [
      // Parede Oeste
      { x: 0, y: 0, w: 16, h: 224, cor: '#1e293b' },
      // Parede Leste
      { x: 240, y: 0, w: 16, h: 224, cor: '#1e293b' },
    ];

    // Parede Norte (com vão de 32px se tiver porta)
    if (temPortaNorte) {
      list.push({ x: 16, y: 0, w: 96, h: 16, cor: '#1e293b' });
      list.push({ x: 144, y: 0, w: 96, h: 16, cor: '#1e293b' });
    } else {
      list.push({ x: 16, y: 0, w: 224, h: 16, cor: '#1e293b' });
    }

    // Parede Sul (com vão de 32px se tiver porta)
    if (temPortaSul) {
      list.push({ x: 16, y: 208, w: 96, h: 16, cor: '#1e293b' });
      list.push({ x: 144, y: 208, w: 96, h: 16, cor: '#1e293b' });
    } else {
      list.push({ x: 16, y: 208, w: 224, h: 16, cor: '#1e293b' });
    }

    return list;
  };

  // SALA 1: PUZZLE DOS 2 BLOCOS DE PEDRA
  const sala1: SalaCripta = {
    id: 'cripta_sala_1_puzzle',
    nome: 'CÂMARA DOS SELOS',
    subtitulo: 'Puzzle dos Blocos Ancestrais',
    portas: [
      // Porta Sul: volta para o Vale Verdejante
      {
        direcao: 'sul',
        x: 112,
        y: 208,
        w: 32,
        h: 16,
        estado: 'aberta',
        destinoSalaId: 'OVERWORLD_VALE',
      },
      // Porta Norte: trancada até encaixar os 2 blocos
      {
        direcao: 'norte',
        x: 112,
        y: 0,
        w: 32,
        h: 16,
        estado: 'trancada',
        destinoSalaId: 'cripta_sala_2_combate',
      },
    ],
    paredes: [
      ...paredesPadrao(true, true),
      // Pilares de sustentação decorativos/sólidos
      { x: 48, y: 48, w: 16, h: 16, cor: '#334155' },
      { x: 192, y: 48, w: 16, h: 16, cor: '#334155' },
      { x: 48, y: 160, w: 16, h: 16, cor: '#334155' },
      { x: 192, y: 160, w: 16, h: 16, cor: '#334155' },
    ],
    // 2 Marcas rúnicas de pressão no chão
    marcas: [
      { id: 'slot_1', x: 80, y: 64, w: 16, h: 16 },
      { id: 'slot_2', x: 160, y: 64, w: 16, h: 16 },
    ],
    // 2 Blocos de pedra empurráveis
    blocos: [
      {
        id: 'bloco_1',
        x: 80,
        y: 128,
        w: 16,
        h: 16,
        targetX: 80,
        targetY: 64,
        encaixado: false,
      },
      {
        id: 'bloco_2',
        x: 160,
        y: 128,
        w: 16,
        h: 16,
        targetX: 160,
        targetY: 64,
        encaixado: false,
      },
    ],
  };

  // SALA 2: ARENA DE COMBATE (4 ESPINHOS + 2 VAGALUMES)
  const sala2: SalaCripta = {
    id: 'cripta_sala_2_combate',
    nome: 'GALERIA DAS SOMBRAS',
    subtitulo: 'Desafio de Combate',
    portas: [
      // Porta Sul: volta para a Sala 1
      {
        direcao: 'sul',
        x: 112,
        y: 208,
        w: 32,
        h: 16,
        estado: 'aberta',
        destinoSalaId: 'cripta_sala_1_puzzle',
      },
      // Porta Norte: trancada até derrotar os 6 inimigos
      {
        direcao: 'norte',
        x: 112,
        y: 0,
        w: 32,
        h: 16,
        estado: 'trancada',
        destinoSalaId: 'cripta_sala_3_relicario',
      },
    ],
    paredes: [
      ...paredesPadrao(true, true),
      // Muretas decorativas que canalizam o combate
      { x: 32, y: 96, w: 24, h: 32, cor: '#334155' },
      { x: 200, y: 96, w: 24, h: 32, cor: '#334155' },
    ],
    combateConcluido: false,
    inimigos: [
      // 4 Espinhos Rastejantes
      {
        id: 'cripta_esp_1',
        tipo: 'espinho_rastejante',
        x: 64,
        y: 48,
        w: 12,
        h: 12,
        hp: 2,
        hpMax: 2,
        direcao: 'direita',
        velocidade: 42,
        iframeTimer: 0,
        vivo: true,
        timerTrocaDirecao: 1.5,
      },
      {
        id: 'cripta_esp_2',
        tipo: 'espinho_rastejante',
        x: 180,
        y: 48,
        w: 12,
        h: 12,
        hp: 2,
        hpMax: 2,
        direcao: 'esquerda',
        velocidade: 42,
        iframeTimer: 0,
        vivo: true,
        timerTrocaDirecao: 1.8,
      },
      {
        id: 'cripta_esp_3',
        tipo: 'espinho_rastejante',
        x: 64,
        y: 160,
        w: 12,
        h: 12,
        hp: 2,
        hpMax: 2,
        direcao: 'cima',
        velocidade: 42,
        iframeTimer: 0,
        vivo: true,
        timerTrocaDirecao: 2.0,
      },
      {
        id: 'cripta_esp_4',
        tipo: 'espinho_rastejante',
        x: 180,
        y: 160,
        w: 12,
        h: 12,
        hp: 2,
        hpMax: 2,
        direcao: 'baixo',
        velocidade: 42,
        iframeTimer: 0,
        vivo: true,
        timerTrocaDirecao: 1.6,
      },
      // 2 Vagalumes Sombrios
      {
        id: 'cripta_vag_1',
        tipo: 'vagalume_sombrio',
        x: 96,
        y: 104,
        w: 12,
        h: 12,
        hp: 1,
        hpMax: 1,
        direcao: 'direita',
        velocidade: 48,
        iframeTimer: 0,
        vivo: true,
        baseX: 96,
        baseY: 104,
        tempoSeno: 0,
      },
      {
        id: 'cripta_vag_2',
        tipo: 'vagalume_sombrio',
        x: 148,
        y: 104,
        w: 12,
        h: 12,
        hp: 1,
        hpMax: 1,
        direcao: 'esquerda',
        velocidade: 48,
        iframeTimer: 0,
        vivo: true,
        baseX: 148,
        baseY: 104,
        tempoSeno: Math.PI,
      },
    ],
  };

  // SALA 3: CÂMARA DO GUARDIÃO ADORMECIDO (RECOMPENSA DE EXPLORAÇÃO)
  const sala3: SalaCripta = {
    id: 'cripta_sala_3_relicario',
    nome: 'CÂMARA DO GUARDIÃO',
    subtitulo: 'Santuário da Bênção Ancestral',
    portas: [
      // Porta Sul: volta para a Sala 2
      {
        direcao: 'sul',
        x: 112,
        y: 208,
        w: 32,
        h: 16,
        estado: 'aberta',
        destinoSalaId: 'cripta_sala_2_combate',
      },
    ],
    paredes: [
      ...paredesPadrao(false, true),
      // Altar solene ao norte onde repousa a estátua do Guardião
      { x: 96, y: 16, w: 64, h: 36, cor: '#334155' },
    ],
    bauAberto: false,
    bauX: 120,
    bauY: 96,
    bauW: 16,
    bauH: 14,
  };

  return {
    salaAtualId: 'cripta_sala_1_puzzle',
    salas: {
      cripta_sala_1_puzzle: sala1,
      cripta_sala_2_combate: sala2,
      cripta_sala_3_relicario: sala3,
    },
    transicaoTimer: 0,
    puzzleConcluido: false,
    combateConcluido: false,
    recompensaColetada: false,
    timerSomArrasto: 0,
  };
}

// ----------------------------------------------------------------------------
// FÍSICA E ATUALIZAÇÃO DA CRIPTA (GAME LOOP)
// ----------------------------------------------------------------------------
export function atualizarCripta(
  cripta: CriptaState,
  state: GameState,
  dt: number,
  onSairParaVale: () => void
) {
  const sala = cripta.salas[cripta.salaAtualId];
  if (!sala) return;

  const heroi = state.heroi;

  // Temporizador de fade de transição
  if (cripta.transicaoTimer > 0) {
    cripta.transicaoTimer = Math.max(0, cripta.transicaoTimer - dt);
  }
  if (cripta.timerSomArrasto > 0) {
    cripta.timerSomArrasto = Math.max(0, cripta.timerSomArrasto - dt);
  }

  // 1. FÍSICA DA SALA 1: EMPURRÃO DE BLOCOS DE PEDRA
  if (sala.blocos && sala.blocos.length > 0) {
    let todosEncaixados = true;

    for (const bloco of sala.blocos) {
      if (!bloco.encaixado) {
        todosEncaixados = false;

        // Verifica se Ren está encostando e caminhando na direção do bloco
        const colideComHeroi = checkAABB(
          { x: heroi.x - 1, y: heroi.y - 1, w: heroi.w + 2, h: heroi.h + 2 },
          bloco
        );

        if (colideComHeroi) {
          const velEmpurrao = 36 * dt; // velocidade suave de pedra sendo empurrada
          let moveuX = 0;
          let moveuY = 0;

          if (heroi.direcao === 'cima' && heroi.y >= bloco.y + bloco.h - 4) {
            moveuY = -velEmpurrao;
          } else if (heroi.direcao === 'baixo' && heroi.y + heroi.h <= bloco.y + 4) {
            moveuY = velEmpurrao;
          } else if (heroi.direcao === 'esquerda' && heroi.x >= bloco.x + bloco.w - 4) {
            moveuX = -velEmpurrao;
          } else if (heroi.direcao === 'direita' && heroi.x + heroi.w <= bloco.x + 4) {
            moveuX = velEmpurrao;
          }

          if (moveuX !== 0 || moveuY !== 0) {
            const novoX = bloco.x + moveuX;
            const novoY = bloco.y + moveuY;

            // Testa colisão do bloco contra paredes
            const testeBloco: Retangulo = { x: novoX, y: novoY, w: bloco.w, h: bloco.h };
            let colidiuParede = false;
            for (const p of sala.paredes) {
              if (checkAABB(testeBloco, p)) {
                colidiuParede = true;
                break;
              }
            }

            // Testa colisão contra o outro bloco
            for (const outro of sala.blocos) {
              if (outro.id !== bloco.id && checkAABB(testeBloco, outro)) {
                colidiuParede = true;
                break;
              }
            }

            if (!colidiuParede) {
              bloco.x = novoX;
              bloco.y = novoY;

              if (cripta.timerSomArrasto <= 0) {
                soundManager.playBlockPush();
                cripta.timerSomArrasto = 0.18;
              }

              // Checa se atingiu o targetSlot (tolerância de 5px)
              const distSlot = Math.hypot(bloco.x - bloco.targetX, bloco.y - bloco.targetY);
              if (distSlot <= 5) {
                bloco.x = bloco.targetX;
                bloco.y = bloco.targetY;
                bloco.encaixado = true;
                soundManager.playBlockSlot();

                // Gera explosão de partículas douradas no encaixe
                gerarExplosaoParticulas(
                  state.particulas,
                  bloco.x + bloco.w / 2,
                  bloco.y + bloco.h / 2,
                  '#fbbf24',
                  6
                );
              }
            }
          }
        }
      }

      // Bloco é sólido para o herói quando não está se movendo livremente
      if (checkAABB(heroi, bloco)) {
        empurrarParaFora(heroi, bloco);
      }
    }

    // Se todos os blocos foram encaixados e o puzzle ainda não estava concluído
    if (todosEncaixados && !cripta.puzzleConcluido) {
      cripta.puzzleConcluido = true;
      const portaNorte = sala.portas.find((p) => p.direcao === 'norte');
      if (portaNorte) {
        portaNorte.estado = 'aberta';
      }
      soundManager.playDoorOpen();
      state.notificacaoTexto = 'SELOS DE PEDRA ENCAIXADOS! PORTA ABERTA!';
      state.notificacaoTimer = 2.5;
    }
  }

  // 2. FÍSICA DA SALA 2: COMBATE COM 4 ESPINHOS E 2 VAGALUMES
  if (sala.inimigos && sala.inimigos.length > 0) {
    // Obstáculos da sala para navegação da IA
    const obstaculosSala: Retangulo[] = [...sala.paredes];
    const limitesSala = { minX: 24, maxX: 232, minY: 32, maxY: 196 };
    atualizarInimigos(sala.inimigos, heroi, obstaculosSala, limitesSala, state, dt);

    // Checa se todos os inimigos foram derrotados
    const todosDerrotados = sala.inimigos.every((i) => !i.vivo);
    if (todosDerrotados && !cripta.combateConcluido) {
      cripta.combateConcluido = true;
      sala.combateConcluido = true;
      const portaNorte = sala.portas.find((p) => p.direcao === 'norte');
      if (portaNorte) {
        portaNorte.estado = 'aberta';
      }
      soundManager.playDoorOpen();
      state.notificacaoTexto = 'GUARDIÕES DAS SOMBRAS DERROTADOS!';
      state.notificacaoTimer = 2.5;
    }
  }

  // 3. FÍSICA DA SALA 3: INTERAÇÃO COM O BAÚ DA BÊNÇÃO
  if (sala.bauX !== undefined && sala.bauY !== undefined) {
    const bauRect: Retangulo = {
      x: sala.bauX,
      y: sala.bauY,
      w: sala.bauW || 16,
      h: sala.bauH || 14,
    };

    // Baú é sólido
    if (checkAABB(heroi, bauRect)) {
      empurrarParaFora(heroi, bauRect);
    }
  }

  // 4. COLISÃO DO HERÓI COM AS PAREDES
  for (const parede of sala.paredes) {
    if (checkAABB(heroi, parede)) {
      empurrarParaFora(heroi, parede);
    }
  }

  // 5. COLISÃO E TRANSIÇÃO COM AS PORTAS
  for (const porta of sala.portas) {
    if (porta.estado === 'trancada') {
      if (checkAABB(heroi, porta)) {
        empurrarParaFora(heroi, porta);
        if (!state.notificacaoTimer || state.notificacaoTimer <= 0) {
          if (sala.id === 'cripta_sala_1_puzzle') {
            state.notificacaoTexto = 'Selada por runas. Encaixe os 2 blocos!';
          } else if (sala.id === 'cripta_sala_2_combate') {
            state.notificacaoTexto = 'Derrote todos os inimigos da sala!';
          }
          state.notificacaoTimer = 1.5;
        }
      }
    } else if (porta.estado === 'aberta') {
      let cruzou = false;
      if (porta.direcao === 'norte' && heroi.y <= 2) {
        cruzou = true;
      } else if (porta.direcao === 'sul' && heroi.y + heroi.h >= 222) {
        cruzou = true;
      }

      if (cruzou) {
        if (porta.destinoSalaId === 'OVERWORLD_VALE') {
          // Saída para o Vale Verdejante
          onSairParaVale();
          return;
        }

        const salaDestino = cripta.salas[porta.destinoSalaId];
        if (salaDestino) {
          soundManager.playRoomTransition();
          cripta.salaAtualId = porta.destinoSalaId;
          cripta.transicaoTimer = 0.15;

          // Reposiciona Ren na borda oposta
          if (porta.direcao === 'norte') {
            heroi.y = 196;
            heroi.x = 120;
            heroi.direcao = 'cima';
          } else if (porta.direcao === 'sul') {
            heroi.y = 20;
            heroi.x = 120;
            heroi.direcao = 'baixo';
          }
          return;
        }
      }
    }
  }
}

// Interação Z na Cripta (abrir o baú da bênção na Sala 3)
export function interagirAcaoCripta(cripta: CriptaState, state: GameState): boolean {
  const sala = cripta.salas[cripta.salaAtualId];
  if (!sala) return false;

  const heroi = state.heroi;
  const rangeInteracao: Retangulo = {
    x: heroi.x - 4,
    y: heroi.y - 4,
    w: heroi.w + 8,
    h: heroi.h + 8,
  };

  // Abrir baú da Sala 3
  if (
    sala.id === 'cripta_sala_3_relicario' &&
    sala.bauX !== undefined &&
    sala.bauY !== undefined &&
    !sala.bauAberto &&
    !cripta.recompensaColetada
  ) {
    const bauRect: Retangulo = {
      x: sala.bauX,
      y: sala.bauY,
      w: sala.bauW || 16,
      h: sala.bauH || 14,
    };

    if (checkAABB(rangeInteracao, bauRect)) {
      sala.bauAberto = true;
      cripta.recompensaColetada = true;
      state.criptaUpgradeColetado = true;

      // Recompensa permanente: +1 Fragmento de Vida Máximo!
      state.vidaMax += 1;
      state.vidaAtual = state.vidaMax; // Restaura a vida por completo

      soundManager.playChestOpen();
      soundManager.playItemGet();

      state.dungeonItemObtido = {
        nome: 'BÊNÇÃO DO GUARDIÃO ADORMECIDO',
        subtitulo: '+1 Fragmento de Vida Máximo Permanente!',
        iconeTipo: 'fragmento_vida',
        timer: 1.5,
      };

      state.notificacaoTexto = '★ +1 FRAGMENTO DE VIDA MÁXIMO! ★';
      state.notificacaoTimer = 3.0;

      gerarExplosaoParticulas(
        state.particulas,
        sala.bauX + 8,
        sala.bauY + 7,
        '#ef4444',
        10
      );
      return true;
    }
  }

  return false;
}

// ----------------------------------------------------------------------------
// RENDERIZAÇÃO RETRÔ 16-BIT DA CRIPTA DO GUARDIÃO
// ----------------------------------------------------------------------------
export function renderizarCripta(
  ctx: CanvasRenderingContext2D,
  cripta: CriptaState,
  state: GameState,
  tempoAnim: number = 0
) {
  const sala = cripta.salas[cripta.salaAtualId];
  if (!sala) return;

  // 1. Chão em lajes de pedra talhada ancestral
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, 256, 224);

  // Padrão de ladrilhos 16x16 com musgo e ranhuras
  for (let ty = 1; ty < 13; ty++) {
    for (let tx = 1; tx < 15; tx++) {
      const px = tx * 16;
      const py = ty * 16;
      const isAlt = (tx + ty) % 2 === 0;
      ctx.fillStyle = isAlt ? '#131f37' : '#0f172a';
      ctx.fillRect(px, py, 16, 16);

      // Linhas de rejunte sutil
      ctx.fillStyle = '#090d16';
      ctx.fillRect(px, py, 16, 1);
      ctx.fillRect(px, py, 1, 16);

      // Manchas de musgo antigo
      if ((tx * 7 + ty * 11) % 5 === 0) {
        ctx.fillStyle = '#14532d';
        ctx.fillRect(px + 3, py + 4, 3, 2);
        ctx.fillRect(px + 4, py + 6, 2, 2);
      }
    }
  }

  // 2. Marcas rúnicas de pressão no chão (Sala 1)
  if (sala.marcas) {
    for (const marca of sala.marcas) {
      // Verifica se há bloco encaixado nessa marca
      const encaixado = sala.blocos?.some(
        (b) => b.encaixado && b.targetX === marca.x && b.targetY === marca.y
      );

      ctx.fillStyle = '#020617';
      ctx.fillRect(marca.x - 1, marca.y - 1, marca.w + 2, marca.h + 2);

      // Borda da cavidade de pedra
      ctx.strokeStyle = encaixado ? '#fbbf24' : '#38bdf8';
      ctx.lineWidth = 1;
      ctx.strokeRect(marca.x + 0.5, marca.y + 0.5, marca.w - 1, marca.h - 1);

      // Símbolo rúnico de ativação
      if (encaixado) {
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(marca.x + 4, marca.y + 4, 8, 8);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(marca.x + 6, marca.y + 6, 4, 4);
      } else {
        const pulso = Math.sin(tempoAnim * 4) * 0.2 + 0.5;
        ctx.fillStyle = `rgba(56, 189, 248, ${pulso})`;
        ctx.fillRect(marca.x + 5, marca.y + 5, 6, 6);
      }
    }
  }

  // 3. Paredes sólidas externas e pilares
  for (const parede of sala.paredes) {
    ctx.fillStyle = parede.cor || '#1e293b';
    ctx.fillRect(parede.x, parede.y, parede.w, parede.h);

    // Borda chanfrada de pedra
    ctx.fillStyle = '#334155';
    ctx.fillRect(parede.x, parede.y, parede.w, 2);
    ctx.fillRect(parede.x, parede.y, 2, parede.h);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(parede.x, parede.y + parede.h - 2, parede.w, 2);
    ctx.fillRect(parede.x + parede.w - 2, parede.y, 2, parede.h);
  }

  // 4. Tochas místicas de ardósia nas paredes
  const tochas = [
    { x: 32, y: 14 },
    { x: 224, y: 14 },
    { x: 32, y: 206 },
    { x: 224, y: 206 },
  ];
  for (const t of tochas) {
    // Suporte de ferro
    ctx.fillStyle = '#475569';
    ctx.fillRect(t.x - 2, t.y, 4, 4);
    // Chama esmeralda com pulso
    const chamaPulso = Math.sin(tempoAnim * 12 + t.x) * 2;
    ctx.fillStyle = '#10b981';
    ctx.fillRect(t.x - 1, t.y - 3 + chamaPulso, 2, 3);
    ctx.fillStyle = '#34d399';
    ctx.fillRect(t.x, t.y - 2 + chamaPulso, 1, 2);
    // Luz ambiente circular sutil
    ctx.fillStyle = 'rgba(16, 185, 129, 0.08)';
    ctx.beginPath();
    ctx.arc(t.x, t.y - 1, 14, 0, Math.PI * 2);
    ctx.fill();
  }

  // 5. Portas de pedra
  for (const porta of sala.portas) {
    if (porta.estado === 'trancada') {
      // Grade de ferro pesada e runa vermelha/azul trancada
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(porta.x, porta.y, porta.w, porta.h);
      // Barras de ferro
      ctx.fillStyle = '#475569';
      for (let bx = porta.x + 4; bx < porta.x + porta.w - 2; bx += 6) {
        ctx.fillRect(bx, porta.y, 2, porta.h);
      }
      // Selo rúnico pulsante no centro
      const pulsoSelo = Math.sin(tempoAnim * 5) * 0.2 + 0.8;
      ctx.fillStyle = `rgba(239, 68, 68, ${pulsoSelo})`;
      ctx.fillRect(porta.x + 12, porta.y + 4, 8, 8);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(porta.x + 14, porta.y + 6, 4, 4);
    } else {
      // Porta aberta: vão escuro que convida para a próxima sala
      ctx.fillStyle = '#020617';
      ctx.fillRect(porta.x, porta.y, porta.w, porta.h);
      // Degraus ou ombreiras laterais
      ctx.fillStyle = '#334155';
      ctx.fillRect(porta.x - 2, porta.y, 2, porta.h);
      ctx.fillRect(porta.x + porta.w, porta.y, 2, porta.h);
    }
  }

  // 6. Blocos de pedra empurráveis (Sala 1)
  if (sala.blocos) {
    for (const bloco of sala.blocos) {
      // Sombra projetada
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fillRect(bloco.x + 1, bloco.y + 2, bloco.w, bloco.h);

      // Bloco de granito talhado
      ctx.fillStyle = bloco.encaixado ? '#0284c7' : '#475569';
      ctx.fillRect(bloco.x, bloco.y, bloco.w, bloco.h);

      // Chanfro superior e esquerdo
      ctx.fillStyle = bloco.encaixado ? '#38bdf8' : '#64748b';
      ctx.fillRect(bloco.x, bloco.y, bloco.w, 2);
      ctx.fillRect(bloco.x, bloco.y, 2, bloco.h);

      // Chanfro inferior e direito
      ctx.fillStyle = bloco.encaixado ? '#0369a1' : '#334155';
      ctx.fillRect(bloco.x, bloco.y + bloco.h - 2, bloco.w, 2);
      ctx.fillRect(bloco.x + bloco.w - 2, bloco.y, 2, bloco.h);

      // Runa no centro do bloco
      ctx.fillStyle = bloco.encaixado ? '#fef08a' : '#94a3b8';
      ctx.fillRect(bloco.x + 6, bloco.y + 4, 4, 8);
      ctx.fillRect(bloco.x + 4, bloco.y + 6, 8, 4);
    }
  }

  // 7. Estátua do Guardião Adormecido (Sala 3)
  if (sala.id === 'cripta_sala_3_relicario') {
    renderizarEstatuaGuardiao(ctx, 128, 32, tempoAnim);
  }

  // 8. Baú da Relíquia na Sala 3
  if (sala.bauX !== undefined && sala.bauY !== undefined) {
    const bx = sala.bauX;
    const by = sala.bauY;
    const aberto = !!sala.bauAberto || cripta.recompensaColetada;

    // Sombra do baú
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(bx + 1, by + 4, 16, 12);

    if (aberto) {
      // Baú aberto dourado
      ctx.fillStyle = '#b45309';
      ctx.fillRect(bx + 1, by + 5, 14, 9);
      ctx.fillStyle = '#d97706';
      ctx.fillRect(bx + 1, by + 1, 14, 4);
      // Forro interior de veludo escarlate
      ctx.fillStyle = '#991b1b';
      ctx.fillRect(bx + 3, by + 5, 10, 3);
    } else {
      // Baú dourado sagrado fechado com runas
      ctx.fillStyle = '#d97706';
      ctx.fillRect(bx, by, 16, 14);

      // Bordas de ouro puro
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(bx, by, 16, 2);
      ctx.fillRect(bx, by + 12, 16, 2);
      ctx.fillRect(bx, by, 2, 14);
      ctx.fillRect(bx + 14, by, 2, 14);

      // Fecho com joia rubi/esmeralda
      const pulsoJoia = Math.sin(tempoAnim * 6) > 0 ? '#ef4444' : '#f87171';
      ctx.fillStyle = pulsoJoia;
      ctx.fillRect(bx + 7, by + 6, 2, 4);

      // Brilho místico ao redor do baú
      ctx.fillStyle = 'rgba(251, 191, 36, 0.15)';
      ctx.fillRect(bx - 3, by - 3, 22, 20);
    }
  }

  // 9. Inimigos na Sala 2
  if (sala.inimigos && sala.inimigos.length > 0) {
    renderizarInimigos(ctx, sala.inimigos, 0, 0, tempoAnim);
  }

  // 10. Legenda sutil da sala no topo
  ctx.fillStyle = 'rgba(2, 6, 23, 0.7)';
  ctx.fillRect(56, 4, 144, 12);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '6px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(sala.nome, 128, 12);
  ctx.textAlign = 'start';

  // Fade de transição entre salas
  if (cripta.transicaoTimer > 0) {
    const alpha = (cripta.transicaoTimer / 0.15);
    ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
    ctx.fillRect(0, 0, 256, 224);
  }
}

// Renderiza a Estátua do Guardião Adormecido na Sala 3 (pedra monumental 16-bit)
function renderizarEstatuaGuardiao(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  tempoAnim: number
) {
  ctx.save();

  // Pedestal de granito
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(cx - 24, cy + 8, 48, 12);
  ctx.fillStyle = '#334155';
  ctx.fillRect(cx - 22, cy + 8, 44, 2);

  // Inscrição rúnica na base
  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(cx - 12, cy + 13, 24, 2);

  // Corpo do Guerreiro em armadura de pedra
  ctx.fillStyle = '#475569';
  ctx.fillRect(cx - 10, cy - 14, 20, 22);

  // Ombreiras e manto estilizado
  ctx.fillStyle = '#64748b';
  ctx.fillRect(cx - 14, cy - 12, 5, 8);
  ctx.fillRect(cx + 9, cy - 12, 5, 8);

  // Elmo clássico com viseira fechada
  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(cx - 6, cy - 24, 12, 10);
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(cx - 4, cy - 19, 8, 2); // Fresta dos olhos adormecidos

  // Espada ancestral fincada no pedestal à frente
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(cx - 1, cy - 10, 2, 20);
  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(cx - 5, cy - 10, 10, 2); // Guarda

  // Asas estilizadas de pedra abertas atrás do Guardião
  ctx.fillStyle = '#334155';
  // Asa esquerda
  ctx.fillRect(cx - 24, cy - 20, 10, 16);
  ctx.fillRect(cx - 20, cy - 24, 6, 6);
  // Asa direita
  ctx.fillRect(cx + 14, cy - 20, 10, 16);
  ctx.fillRect(cx + 14, cy - 24, 6, 6);

  // Luz celestial azulada descendo sobre o relicário
  const luzAlpha = Math.sin(tempoAnim * 3) * 0.05 + 0.12;
  ctx.fillStyle = `rgba(56, 189, 248, ${luzAlpha})`;
  ctx.beginPath();
  ctx.moveTo(cx - 28, 0);
  ctx.lineTo(cx + 28, 0);
  ctx.lineTo(cx + 40, cy + 70);
  ctx.lineTo(cx - 40, cy + 70);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

// Utilitário de separação AABB
function empurrarParaFora(heroi: HeroState, rect: Retangulo) {
  const overlapX1 = heroi.x + heroi.w - rect.x;
  const overlapX2 = rect.x + rect.w - heroi.x;
  const overlapY1 = heroi.y + heroi.h - rect.y;
  const overlapY2 = rect.y + rect.h - heroi.y;

  const minOverlapX = Math.min(overlapX1, overlapX2);
  const minOverlapY = Math.min(overlapY1, overlapY2);

  if (minOverlapX < minOverlapY) {
    if (overlapX1 < overlapX2) {
      heroi.x -= overlapX1;
    } else {
      heroi.x += overlapX2;
    }
  } else {
    if (overlapY1 < overlapY2) {
      heroi.y -= overlapY1;
    } else {
      heroi.y += overlapY2;
    }
  }
}
