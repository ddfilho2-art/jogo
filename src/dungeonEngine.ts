// Motor de Dungeon Reutilizável de Eldrim (Santuários)
// Resolução 256x224px, grid 16x16 (16 colunas x 14 linhas), sem scroll dentro da sala

import { soundManager } from './soundEffects';
import { GameState, HeroState, InimigoEntidade, ItemSecundarioId, Retangulo, PontoGancho } from './types';
import { renderizarPontoGancho } from './hookEngine';
import { renderizarHeroiRen } from './heroSprite';
import {
  atualizarChefeRaizarca,
  atualizarHeroiCombate,
  atualizarInimigos,
  atualizarParticulas,
  atualizarProjeteis,
  criarInimigosDungeonSala,
  renderizarChefeRaizarca,
  renderizarCutscenePurificacao,
  renderizarEspada,
  renderizarInimigos,
  renderizarParticulas,
  renderizarProjeteis,
} from './combat';

export type DirecaoPorta = 'norte' | 'sul' | 'leste' | 'oeste';

export type EstadoPorta =
  | 'aberta'
  | 'trancada_comum'
  | 'trancada_chefe'
  | 'fechada_alavanca';

export interface PortaDungeon {
  direcao: DirecaoPorta;
  destinoRoomId: string;
  destinoPorta: DirecaoPorta;
  estado: EstadoPorta;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ChaveDungeon {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  tipo: 'pequena' | 'chefe';
  coletada: boolean;
}

export interface BauDungeon {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  aberto: boolean;
  conteudo: {
    tipo: 'item' | 'chave_chefe' | 'chave_pequena' | 'fragmento_vida' | 'selos';
    itemId?: ItemSecundarioId;
    nome: string;
    subtitulo: string;
    qtd?: number;
  };
}

export interface AlavancaDungeon {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  ativada: boolean;
  efeitoId: string;
}

export interface PonteRetratil {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  ativa: boolean;
  leverId: string;
}

export type InimigoDungeon = InimigoEntidade;

export interface Room {
  id: string;
  nome: string;
  subtitulo?: string;
  mapaGridX: number; // 0..2
  mapaGridY: number; // 0..2
  // Grid de 14 linhas x 16 colunas:
  // 0: Chao de lajota de pedra
  // 1: Parede de pedra solida
  // 2: Fosso / Abismo profundo (bloqueia passagem se nao houver ponte ativa)
  // 3: Pilar de pedra / Tocha ornamental
  grid: number[][];
  portas: PortaDungeon[];
  chaves: ChaveDungeon[];
  baus: BauDungeon[];
  alavancas: AlavancaDungeon[];
  pontesRetrateis: PonteRetratil[];
  inimigos: InimigoDungeon[];
  pontosGancho?: PontoGancho[];
}

export interface Dungeon {
  id: string;
  nome: string;
  regiao: string;
  salas: Record<string, Room>;
  salaInicialId: string;
  efeitosAlavanca: Record<
    string,
    (dungeon: Dungeon, ativada: boolean, state: GameState) => void
  >;
}

// Helper para colisão AABB
function checkAABB(
  a: { x: number; y: number; w: number; h: number },
  b: { x: number; y: number; w: number; h: number }
): boolean {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

// ==========================================
// FÁBRICA DA DUNGEON COMPLETA: SANTUÁRIO DA RAIZ ANTIGA (GRID 3x3)
// ==========================================
export function criarDungeonTesteSantuario(): Dungeon {
  // Matriz padrão de paredes nas bordas (14 linhas x 16 colunas de 16x16px)
  const criarGridBase = (): number[][] => {
    const grid: number[][] = [];
    for (let r = 0; r < 14; r++) {
      const linha: number[] = [];
      for (let c = 0; c < 16; c++) {
        if (r === 0 || r === 13 || c === 0 || c === 15) {
          linha.push(1); // Parede sólida perimetral
        } else {
          linha.push(0); // Chão de lajota de pedra
        }
      }
      grid.push(linha);
    }
    return grid;
  };

  // ----------------------------------------------------
  // SALA [1, 2]: Átrio das Raízes Primordiais (Entrada Sul)
  // ----------------------------------------------------
  const grid_1_2 = criarGridBase();
  grid_1_2[3][4] = 3;
  grid_1_2[3][11] = 3;
  grid_1_2[10][4] = 3;
  grid_1_2[10][11] = 3;

  const sala_1_2: Room = {
    id: 'sala_1_2_atrio',
    nome: 'Átrio da Raiz Primordial',
    subtitulo: 'Santuário da Raiz Antiga • Entrada',
    mapaGridX: 1,
    mapaGridY: 2,
    grid: grid_1_2,
    portas: [
      {
        direcao: 'sul',
        destinoRoomId: 'OVERWORLD_VALE',
        destinoPorta: 'sul',
        estado: 'aberta',
        x: 112,
        y: 208,
        w: 32,
        h: 16,
      },
      {
        direcao: 'norte',
        destinoRoomId: 'sala_1_1_centro',
        destinoPorta: 'sul',
        estado: 'aberta',
        x: 112,
        y: 0,
        w: 32,
        h: 16,
      },
      {
        direcao: 'leste',
        destinoRoomId: 'sala_2_2_cripta',
        destinoPorta: 'oeste',
        estado: 'aberta',
        x: 240,
        y: 96,
        w: 16,
        h: 32,
      },
      {
        direcao: 'oeste',
        destinoRoomId: 'sala_0_2_jardim',
        destinoPorta: 'leste',
        estado: 'trancada_comum', // Requer Chave Pequena
        x: 0,
        y: 96,
        w: 16,
        h: 32,
      },
    ],
    chaves: [],
    baus: [],
    alavancas: [],
    pontesRetrateis: [],
    inimigos: [],
  };

  // ----------------------------------------------------
  // SALA [2, 2]: Cripta das Raízes Gêmeas (Sudeste)
  // ----------------------------------------------------
  const grid_2_2 = criarGridBase();
  grid_2_2[5][6] = 3;
  grid_2_2[5][9] = 3;
  grid_2_2[8][6] = 3;
  grid_2_2[8][9] = 3;

  const sala_2_2: Room = {
    id: 'sala_2_2_cripta',
    nome: 'Cripta das Raízes Gêmeas',
    subtitulo: 'Ala Sudeste • Chave dos Monges',
    mapaGridX: 2,
    mapaGridY: 2,
    grid: grid_2_2,
    portas: [
      {
        direcao: 'oeste',
        destinoRoomId: 'sala_1_2_atrio',
        destinoPorta: 'leste',
        estado: 'aberta',
        x: 0,
        y: 96,
        w: 16,
        h: 32,
      },
      {
        direcao: 'norte',
        destinoRoomId: 'sala_2_1_fosso',
        destinoPorta: 'sul',
        estado: 'aberta',
        x: 112,
        y: 0,
        w: 32,
        h: 16,
      },
    ],
    chaves: [
      {
        id: 'chave_pequena_cripta_2_2',
        x: 122,
        y: 104,
        w: 12,
        h: 12,
        tipo: 'pequena',
        coletada: false,
      },
    ],
    baus: [
      {
        id: 'bau_cripta_selos',
        x: 196,
        y: 44,
        w: 16,
        h: 16,
        aberto: false,
        conteudo: {
          tipo: 'selos',
          nome: '40 Selos Antigos',
          subtitulo: 'Moeda Sagrada de Eldrim',
          qtd: 40,
        },
      },
    ],
    alavancas: [],
    pontesRetrateis: [],
    inimigos: [],
  };

  // ----------------------------------------------------
  // SALA [0, 2]: Jardim Petrificado dos Esporos (Sudoeste)
  // ----------------------------------------------------
  const grid_0_2 = criarGridBase();
  grid_0_2[4][4] = 3;
  grid_0_2[4][11] = 3;
  grid_0_2[9][4] = 3;
  grid_0_2[9][11] = 3;

  const sala_0_2: Room = {
    id: 'sala_0_2_jardim',
    nome: 'Jardim Petrificado dos Esporos',
    subtitulo: 'Ala Sudoeste • Bosque Silencioso',
    mapaGridX: 0,
    mapaGridY: 2,
    grid: grid_0_2,
    portas: [
      {
        direcao: 'leste',
        destinoRoomId: 'sala_1_2_atrio',
        destinoPorta: 'oeste',
        estado: 'trancada_comum',
        x: 240,
        y: 96,
        w: 16,
        h: 32,
      },
      {
        direcao: 'norte',
        destinoRoomId: 'sala_0_1_tesouro',
        destinoPorta: 'sul',
        estado: 'aberta',
        x: 112,
        y: 0,
        w: 32,
        h: 16,
      },
    ],
    chaves: [],
    baus: [
      {
        id: 'bau_jardim_vida',
        x: 52,
        y: 50,
        w: 16,
        h: 16,
        aberto: false,
        conteudo: {
          tipo: 'fragmento_vida',
          nome: 'Fragmento de Vida',
          subtitulo: '+1 Vida Máxima Permanente',
        },
      },
    ],
    alavancas: [],
    pontesRetrateis: [],
    inimigos: criarInimigosDungeonSala('sala_0_2_jardim'),
  };

  // ----------------------------------------------------
  // SALA [1, 1]: Átrio Central dos Quatro Pilares (Centro)
  // ----------------------------------------------------
  const grid_1_1 = criarGridBase();
  grid_1_1[4][4] = 3;
  grid_1_1[4][11] = 3;
  grid_1_1[9][4] = 3;
  grid_1_1[9][11] = 3;

  const sala_1_1: Room = {
    id: 'sala_1_1_centro',
    nome: 'Átrio Central dos Quatro Pilares',
    subtitulo: 'Coração do Santuário • Cruzamento',
    mapaGridX: 1,
    mapaGridY: 1,
    grid: grid_1_1,
    portas: [
      {
        direcao: 'sul',
        destinoRoomId: 'sala_1_2_atrio',
        destinoPorta: 'norte',
        estado: 'aberta',
        x: 112,
        y: 208,
        w: 32,
        h: 16,
      },
      {
        direcao: 'oeste',
        destinoRoomId: 'sala_0_1_tesouro',
        destinoPorta: 'leste',
        estado: 'aberta',
        x: 0,
        y: 96,
        w: 16,
        h: 32,
      },
      {
        direcao: 'leste',
        destinoRoomId: 'sala_2_1_fosso',
        destinoPorta: 'oeste',
        estado: 'fechada_alavanca', // Grade aberta por alavanca na sala [2,1]
        x: 240,
        y: 96,
        w: 16,
        h: 32,
      },
      {
        direcao: 'norte',
        destinoRoomId: 'sala_1_0_chefe',
        destinoPorta: 'sul',
        estado: 'trancada_chefe', // Selo de Raizarca (Requer Chave do Chefe)
        x: 112,
        y: 0,
        w: 32,
        h: 16,
      },
    ],
    chaves: [],
    baus: [],
    alavancas: [],
    pontesRetrateis: [],
    inimigos: criarInimigosDungeonSala('sala_1_1_centro'),
  };

  // ----------------------------------------------------
  // SALA [2, 1]: Salão do Fosso Abissal & Alavanca (Leste)
  // ----------------------------------------------------
  const grid_2_1 = criarGridBase();
  for (let r = 2; r <= 11; r++) {
    grid_2_1[r][7] = 2;
    grid_2_1[r][8] = 2;
  }

  const sala_2_1: Room = {
    id: 'sala_2_1_fosso',
    nome: 'Salão do Fosso Abissal',
    subtitulo: 'Mecanismo da Ponte de Pedra',
    mapaGridX: 2,
    mapaGridY: 1,
    grid: grid_2_1,
    portas: [
      {
        direcao: 'sul',
        destinoRoomId: 'sala_2_2_cripta',
        destinoPorta: 'norte',
        estado: 'aberta',
        x: 112,
        y: 208,
        w: 32,
        h: 16,
      },
      {
        direcao: 'oeste',
        destinoRoomId: 'sala_1_1_centro',
        destinoPorta: 'leste',
        estado: 'fechada_alavanca', // Atalho para a sala central
        x: 0,
        y: 96,
        w: 16,
        h: 32,
      },
    ],
    chaves: [],
    alavancas: [
      {
        id: 'alavanca_ponte_2_1',
        x: 48,
        y: 36,
        w: 16,
        h: 16,
        ativada: false,
        efeitoId: 'mecanismo_ponte_2_1',
      },
    ],
    pontesRetrateis: [
      {
        id: 'ponte_sala_2_1',
        x: 112, // colunas 7 e 8
        y: 96,
        w: 32,
        h: 32,
        ativa: false,
        leverId: 'alavanca_ponte_2_1',
      },
    ],
    baus: [
      {
        id: 'bau_chave_chefe',
        x: 196,
        y: 104,
        w: 16,
        h: 16,
        aberto: false,
        conteudo: {
          tipo: 'chave_chefe',
          nome: 'Chave do Santuário',
          subtitulo: 'Abre o Selo de Raizarca',
        },
      },
    ],
    inimigos: criarInimigosDungeonSala('sala_2_2_cripta'),
    pontosGancho: [
      {
        id: 'pg_fosso_oeste',
        x: 80,
        y: 104,
        w: 16,
        h: 16,
        rotulo: 'Argola Oeste do Fosso',
      },
      {
        id: 'pg_fosso_leste',
        x: 160,
        y: 104,
        w: 16,
        h: 16,
        rotulo: 'Argola Leste do Fosso',
      },
    ],
  };

  // ----------------------------------------------------
  // SALA [0, 1]: Galeria dos Cipós & Gancho de Vinha (Oeste)
  // ----------------------------------------------------
  const grid_0_1 = criarGridBase();
  grid_0_1[3][7] = 3;
  grid_0_1[3][8] = 3;
  grid_0_1[10][7] = 3;
  grid_0_1[10][8] = 3;

  const sala_0_1: Room = {
    id: 'sala_0_1_tesouro',
    nome: 'Galeria dos Cipós Ancestrais',
    subtitulo: 'Câmara do Item Sagrado',
    mapaGridX: 0,
    mapaGridY: 1,
    grid: grid_0_1,
    portas: [
      {
        direcao: 'sul',
        destinoRoomId: 'sala_0_2_jardim',
        destinoPorta: 'norte',
        estado: 'aberta',
        x: 112,
        y: 208,
        w: 32,
        h: 16,
      },
      {
        direcao: 'leste',
        destinoRoomId: 'sala_1_1_centro',
        destinoPorta: 'oeste',
        estado: 'aberta',
        x: 240,
        y: 96,
        w: 16,
        h: 32,
      },
      {
        direcao: 'norte',
        destinoRoomId: 'sala_0_0_cripta',
        destinoPorta: 'sul',
        estado: 'trancada_comum', // Requer Chave Pequena
        x: 112,
        y: 0,
        w: 32,
        h: 16,
      },
    ],
    chaves: [],
    baus: [
      {
        id: 'bau_gancho_vinha',
        x: 120,
        y: 96,
        w: 16,
        h: 16,
        aberto: false,
        conteudo: {
          tipo: 'item',
          itemId: 'gancho_vinha',
          nome: 'Gancho de Vinha',
          subtitulo: 'Item de Progressão da Região 1',
        },
      },
    ],
    alavancas: [],
    pontesRetrateis: [],
    inimigos: [],
    pontosGancho: [
      {
        id: 'pg_tesouro_pedestal',
        x: 120,
        y: 48,
        w: 16,
        h: 16,
        rotulo: 'Argola Ancestral dos Cipós',
      },
    ],
  };

  // ----------------------------------------------------
  // SALA [0, 0]: Cripta Oculta da Seiva (Noroeste)
  // ----------------------------------------------------
  const grid_0_0 = criarGridBase();
  grid_0_0[3][3] = 3;
  grid_0_0[3][12] = 3;
  grid_0_0[10][3] = 3;
  grid_0_0[10][12] = 3;

  const sala_0_0: Room = {
    id: 'sala_0_0_cripta',
    nome: 'Cripta Oculta da Seiva',
    subtitulo: 'Santuário Secreto dos Monges',
    mapaGridX: 0,
    mapaGridY: 0,
    grid: grid_0_0,
    portas: [
      {
        direcao: 'sul',
        destinoRoomId: 'sala_0_1_tesouro',
        destinoPorta: 'norte',
        estado: 'trancada_comum',
        x: 112,
        y: 208,
        w: 32,
        h: 16,
      },
      {
        direcao: 'leste',
        destinoRoomId: 'sala_1_0_chefe',
        destinoPorta: 'oeste',
        estado: 'fechada_alavanca', // Atalho secreto lateral para a câmara do chefe
        x: 240,
        y: 96,
        w: 16,
        h: 32,
      },
    ],
    chaves: [
      {
        id: 'chave_pequena_0_0',
        x: 48,
        y: 64,
        w: 12,
        h: 12,
        tipo: 'pequena',
        coletada: false,
      },
    ],
    alavancas: [
      {
        id: 'alavanca_atalho_chefe',
        x: 200,
        y: 36,
        w: 16,
        h: 16,
        ativada: false,
        efeitoId: 'atalho_secreto_chefe',
      },
    ],
    pontesRetrateis: [],
    baus: [
      {
        id: 'bau_cripta_0_0_selos',
        x: 120,
        y: 44,
        w: 16,
        h: 16,
        aberto: false,
        conteudo: {
          tipo: 'selos',
          nome: '60 Selos Sagrados',
          subtitulo: 'Moeda Nobre de Eldrim',
          qtd: 60,
        },
      },
    ],
    inimigos: [],
  };

  // ----------------------------------------------------
  // SALA [1, 0]: Covil de Raizarca (Câmara do Chefe)
  // ----------------------------------------------------
  const grid_1_0 = criarGridBase();
  // Pedestal ancestral de Raizarca no centro
  grid_1_0[4][7] = 3;
  grid_1_0[4][8] = 3;
  grid_1_0[5][7] = 3;
  grid_1_0[5][8] = 3;

  const sala_1_0: Room = {
    id: 'sala_1_0_chefe',
    nome: 'Covil de Raizarca, o Titã da Raiz',
    subtitulo: 'Arena do Chefe • Região 1',
    mapaGridX: 1,
    mapaGridY: 0,
    grid: grid_1_0,
    portas: [
      {
        direcao: 'sul',
        destinoRoomId: 'sala_1_1_centro',
        destinoPorta: 'norte',
        estado: 'trancada_chefe',
        x: 112,
        y: 208,
        w: 32,
        h: 16,
      },
      {
        direcao: 'oeste',
        destinoRoomId: 'sala_0_0_cripta',
        destinoPorta: 'leste',
        estado: 'fechada_alavanca',
        x: 0,
        y: 96,
        w: 16,
        h: 32,
      },
      {
        direcao: 'leste',
        destinoRoomId: 'sala_2_0_altar',
        destinoPorta: 'oeste',
        estado: 'fechada_alavanca', // Abre após purificar Raizarca
        x: 240,
        y: 96,
        w: 16,
        h: 32,
      },
    ],
    chaves: [],
    baus: [],
    alavancas: [],
    pontesRetrateis: [],
    inimigos: [],
  };

  // ----------------------------------------------------
  // SALA [2, 0]: Santuário Interior da Raiz (Nordeste)
  // ----------------------------------------------------
  const grid_2_0 = criarGridBase();
  grid_2_0[3][5] = 3;
  grid_2_0[3][10] = 3;
  grid_2_0[10][5] = 3;
  grid_2_0[10][10] = 3;

  const sala_2_0: Room = {
    id: 'sala_2_0_altar',
    nome: 'Santuário Interior da Raiz',
    subtitulo: 'Altar do Relicário da Vida',
    mapaGridX: 2,
    mapaGridY: 0,
    grid: grid_2_0,
    portas: [
      {
        direcao: 'oeste',
        destinoRoomId: 'sala_1_0_chefe',
        destinoPorta: 'leste',
        estado: 'aberta',
        x: 0,
        y: 96,
        w: 16,
        h: 32,
      },
    ],
    chaves: [],
    baus: [
      {
        id: 'bau_relicario_raiz',
        x: 120,
        y: 60,
        w: 16,
        h: 16,
        aberto: false,
        conteudo: {
          tipo: 'fragmento_vida',
          nome: 'Relicário da Raiz Antiga',
          subtitulo: '1º Relicário Estacional Restaurado!',
        },
      },
    ],
    alavancas: [],
    pontesRetrateis: [],
    inimigos: [],
  };

  // Mapa de efeitos das alavancas
  const efeitosAlavanca: Record<
    string,
    (dungeon: Dungeon, ativada: boolean, state: GameState) => void
  > = {
    mecanismo_ponte_2_1: (dungeon, ativada, state) => {
      // 1. Estende a ponte na sala [2,1]
      const rFosso = dungeon.salas['sala_2_1_fosso'];
      if (rFosso) {
        rFosso.pontesRetrateis.forEach((p) => {
          if (p.leverId === 'alavanca_ponte_2_1') p.ativa = ativada;
        });

        // 2. Destranca o atalho oeste para a sala central [1,1]
        const portaOeste = rFosso.portas.find((p) => p.direcao === 'oeste');
        if (portaOeste) portaOeste.estado = ativada ? 'aberta' : 'fechada_alavanca';
      }

      // 3. Atualiza porta leste na sala central [1,1]
      const rCentro = dungeon.salas['sala_1_1_centro'];
      if (rCentro) {
        const portaLeste = rCentro.portas.find((p) => p.direcao === 'leste');
        if (portaLeste) portaLeste.estado = ativada ? 'aberta' : 'fechada_alavanca';
      }

      state.notificacaoTexto = ativada
        ? 'PONTE ESTENDIDA & ATALHO ABERTO!'
        : 'MECANISMO RETRAÍDO';
      state.notificacaoTimer = 2.5;
    },

    atalho_secreto_chefe: (dungeon, ativada, state) => {
      // Abre a passagem secreta entre [0,0] e [1,0]
      const rCripta = dungeon.salas['sala_0_0_cripta'];
      if (rCripta) {
        const portaLeste = rCripta.portas.find((p) => p.direcao === 'leste');
        if (portaLeste) portaLeste.estado = ativada ? 'aberta' : 'fechada_alavanca';
      }

      const rChefe = dungeon.salas['sala_1_0_chefe'];
      if (rChefe) {
        const portaOeste = rChefe.portas.find((p) => p.direcao === 'oeste');
        if (portaOeste) portaOeste.estado = ativada ? 'aberta' : 'fechada_alavanca';
      }

      state.notificacaoTexto = ativada
        ? 'PASSAGEM SECRETA DESBLOQUEADA!'
        : 'PASSAGEM FECHADA';
      state.notificacaoTimer = 2.5;
    },
  };

  const salas: Record<string, Room> = {
    sala_1_2_atrio: sala_1_2,
    sala_2_2_cripta: sala_2_2,
    sala_0_2_jardim: sala_0_2,
    sala_1_1_centro: sala_1_1,
    sala_2_1_fosso: sala_2_1,
    sala_0_1_tesouro: sala_0_1,
    sala_0_0_cripta: sala_0_0,
    sala_1_0_chefe: sala_1_0,
    sala_2_0_altar: sala_2_0,
    // Alias para compatibilidade
    sala_1_atrio: sala_1_2,
  };

  return {
    id: 'santuario_raiz_antiga',
    nome: 'Santuário da Raiz Antiga',
    regiao: 'Vale Verdejante',
    salas,
    salaInicialId: 'sala_1_2_atrio',
    efeitosAlavanca,
  };
}

// ==========================================
// LÓGICA DE INTERAÇÃO (AÇÃO 'Z': BAÚS E ALAVANCAS)
// ==========================================
export function interagirAcaoDungeon(dungeon: Dungeon, state: GameState): boolean {
  const sala = dungeon.salas[state.dungeonSalaAtualId];
  if (!sala) return false;

  const heroi = state.heroi;
  // Hitbox de alcance de interação frontal (área ~16x16 à frente ou em volta de Ren)
  const rangeInteracao: Retangulo = {
    x: heroi.x - 4,
    y: heroi.y - 4,
    w: heroi.w + 8,
    h: heroi.h + 8,
  };

  // 1. Interagir com Baús (encostar + Z)
  for (const bau of sala.baus) {
    if (!bau.aberto && checkAABB(rangeInteracao, bau)) {
      bau.aberto = true;
      soundManager.playChestOpen();

      // Aplicar conteúdo do baú no inventário/estado de Ren
      const c = bau.conteudo;
      if (c.tipo === 'item' && c.itemId) {
        state.itemEquipado = c.itemId;
      } else if (c.tipo === 'chave_chefe') {
        state.dungeonTemChaveChefe = true;
      } else if (c.tipo === 'chave_pequena') {
        state.dungeonChavesPequenas += 1;
      } else if (c.tipo === 'fragmento_vida') {
        state.vidaMax += 1;
        state.vidaAtual = Math.min(state.vidaMax, state.vidaAtual + 1);
      } else if (c.tipo === 'selos') {
        state.selos += c.qtd || 20;
      }

      // Exibe banner/overlay do item por 1.0s
      state.dungeonItemObtido = {
        nome: c.nome,
        subtitulo: c.subtitulo,
        iconeTipo: c.tipo,
        timer: 1.0,
      };

      state.notificacaoTexto = `OBTEVE: ${c.nome.toUpperCase()}!`;
      state.notificacaoTimer = 2.5;
      return true;
    }
  }

  // 2. Interagir com Alavancas (encostar + Z)
  for (const alavanca of sala.alavancas) {
    if (checkAABB(rangeInteracao, alavanca)) {
      alavanca.ativada = !alavanca.ativada;
      soundManager.playLeverSwitch();

      // Acionar efeito genérico associado à alavanca
      const efeito = dungeon.efeitosAlavanca[alavanca.efeitoId];
      if (efeito) {
        efeito(dungeon, alavanca.ativada, state);
      }
      return true;
    }
  }

  return false;
}

// ==========================================
// FÍSICA E ATUALIZAÇÃO DA DUNGEON (GAME LOOP)
// ==========================================
export function atualizarFisicaDungeon(
  dungeon: Dungeon,
  state: GameState,
  dt: number,
  onSairParaOverworld: () => void
) {
  const sala = dungeon.salas[state.dungeonSalaAtualId];
  if (!sala) return;

  const heroi = state.heroi;

  // Temporizador do overlay de item obtido (1.0s)
  if (state.dungeonItemObtido && state.dungeonItemObtido.timer > 0) {
    state.dungeonItemObtido.timer = Math.max(
      0,
      state.dungeonItemObtido.timer - dt
    );
    if (state.dungeonItemObtido.timer <= 0) {
      state.dungeonItemObtido = undefined;
    }
  }

  // Temporizador de fade de transição entre salas (0.15s)
  if (state.dungeonTransicaoTimer > 0) {
    state.dungeonTransicaoTimer = Math.max(0, state.dungeonTransicaoTimer - dt);
  }

  // 1. Contato com Chaves Pequenas no chão (coleta instantânea ao encostar)
  for (const chave of sala.chaves) {
    if (!chave.coletada && checkAABB(heroi, chave)) {
      chave.coletada = true;
      if (chave.tipo === 'pequena') {
        state.dungeonChavesPequenas += 1;
        state.notificacaoTexto = '+1 CHAVE PEQUENA!';
        state.notificacaoTimer = 2.0;
      } else {
        state.dungeonTemChaveChefe = true;
        state.notificacaoTexto = '★ CHAVE DO SANTUÁRIO OBTIDA! ★';
        state.notificacaoTimer = 2.5;
      }
      soundManager.playKeyPickup();
    }
  }

  // 2. Colisão e interação com Portas
  for (const porta of sala.portas) {
    // Área de colisão da porta
    if (checkAABB(heroi, porta)) {
      if (porta.estado === 'trancada_comum') {
        if (state.dungeonChavesPequenas > 0) {
          state.dungeonChavesPequenas -= 1;
          porta.estado = 'aberta';
          // Se a sala de destino existir, abre a porta oposta também
          const salaDest = dungeon.salas[porta.destinoRoomId];
          if (salaDest) {
            const portaOposta = salaDest.portas.find(
              (p) => p.destinoRoomId === sala.id
            );
            if (portaOposta) portaOposta.estado = 'aberta';
          }
          soundManager.playDoorUnlock();
          state.notificacaoTexto = 'PORTA DESTRANCADA!';
          state.notificacaoTimer = 2.0;
        } else {
          // Bloquear herói como obstáculo sólido
          empurrarHeroiParaFora(heroi, porta);
          if (!state.notificacaoTimer || state.notificacaoTimer <= 0) {
            state.notificacaoTexto = 'Trancada. Requer Chave Pequena!';
            state.notificacaoTimer = 1.5;
          }
        }
      } else if (porta.estado === 'trancada_chefe') {
        if (state.dungeonTemChaveChefe) {
          porta.estado = 'aberta';
          const salaDest = dungeon.salas[porta.destinoRoomId];
          if (salaDest) {
            const portaOposta = salaDest.portas.find(
              (p) => p.destinoRoomId === sala.id
            );
            if (portaOposta) portaOposta.estado = 'aberta';
          }
          soundManager.playDoorUnlock();
          state.notificacaoTexto = 'SELO DO CHEFE DESFEITO!';
          state.notificacaoTimer = 2.5;
        } else {
          empurrarHeroiParaFora(heroi, porta);
          if (!state.notificacaoTimer || state.notificacaoTimer <= 0) {
            state.notificacaoTexto = 'Trancada por Selo de Chefe!';
            state.notificacaoTimer = 1.5;
          }
        }
      } else if (porta.estado === 'fechada_alavanca') {
        empurrarHeroiParaFora(heroi, porta);
      }
    }
  }

  // 3. Transição de tela / corte para sala vizinha ao atravessar borda com porta aberta
  // Sem scroll dentro da sala; corte direto (fade de 0.15s) reposicionando Ren na borda oposta
  for (const porta of sala.portas) {
    if (porta.estado === 'aberta') {
      let cruzouBorda = false;

      if (porta.direcao === 'norte' && heroi.y <= 2) {
        cruzouBorda = true;
      } else if (porta.direcao === 'sul' && heroi.y + heroi.h >= 222) {
        cruzouBorda = true;
      } else if (porta.direcao === 'oeste' && heroi.x <= 2) {
        cruzouBorda = true;
      } else if (porta.direcao === 'leste' && heroi.x + heroi.w >= 254) {
        cruzouBorda = true;
      }

      if (cruzouBorda) {
        if (porta.destinoRoomId === 'OVERWORLD_VALE' || porta.destinoRoomId === 'overworld') {
          // Retornar ao Overworld (Vale ou Charco)
          onSairParaOverworld();
          return;
        }

        const salaDestino = dungeon.salas[porta.destinoRoomId];
        if (salaDestino) {
          soundManager.playRoomTransition();
          state.dungeonSalaAtualId = porta.destinoRoomId;
          state.dungeonTransicaoTimer = 0.15; // Fade de 0.15s

          // Reposiciona na borda oposta
          if (porta.direcao === 'norte') {
            heroi.x = 120;
            heroi.y = 192;
            heroi.direcao = 'cima';
          } else if (porta.direcao === 'sul') {
            heroi.x = 120;
            heroi.y = 18;
            heroi.direcao = 'baixo';
          } else if (porta.direcao === 'leste') {
            heroi.x = 20;
            heroi.y = 104;
            heroi.direcao = 'direita';
          } else if (porta.direcao === 'oeste') {
            heroi.x = 220;
            heroi.y = 104;
            heroi.direcao = 'esquerda';
          }
          return;
        }
      }
    }
  }

  // 4. Colisão com o Grid de Tiles (Paredes, Abismos e Pilares)
  // Grid 14 linhas x 16 colunas de 16x16px
  for (let r = 0; r < 14; r++) {
    for (let c = 0; c < 16; c++) {
      const tile = sala.grid[r][c];
      const tileRect: Retangulo = {
        x: c * 16,
        y: r * 16,
        w: 16,
        h: 16,
      };

      // Se for Parede (1) ou Pilar (3)
      if (tile === 1) {
        // Se houver uma porta aberta na parede, não bloqueia o vão de passagem da porta
        let ehVaoDePortaAberta = false;
        for (const p of sala.portas) {
          if (p.estado === 'aberta' && checkAABB(tileRect, p)) {
            ehVaoDePortaAberta = true;
            break;
          }
        }
        if (!ehVaoDePortaAberta && checkAABB(heroi, tileRect)) {
          empurrarHeroiParaFora(heroi, tileRect);
        }
      } else if (tile === 3) {
        // Pilar de pedra decorativo
        if (checkAABB(heroi, tileRect)) {
          empurrarHeroiParaFora(heroi, tileRect);
        }
      } else if (tile === 2) {
        // Abismo / Fosso profundo: bloqueia a menos que haja uma ponte retrátil ativa no local ou plataforma que não afundou
        let temPonteAtiva = false;
        for (const ponte of sala.pontesRetrateis) {
          if (ponte.ativa && checkAABB(tileRect, ponte)) {
            temPonteAtiva = true;
            break;
          }
        }
        let temPlatAtiva = false;
        if (state.plataformasDungeon) {
          for (const plat of state.plataformasDungeon) {
            if (plat.estado !== 'submersa' && checkAABB(tileRect, plat)) {
              temPlatAtiva = true;
              break;
            }
          }
        }
        if (!temPonteAtiva && !temPlatAtiva && checkAABB(heroi, tileRect)) {
          empurrarHeroiParaFora(heroi, tileRect);
        }
      }
    }
  }

  // 5. Colisão com Baús fechados ou abertos (obstáculo sólido para não passar por cima)
  for (const bau of sala.baus) {
    if (checkAABB(heroi, bau)) {
      empurrarHeroiParaFora(heroi, bau);
    }
  }

  // 6. Colisão com Alavancas (obstáculo físico na base)
  for (const alavanca of sala.alavancas) {
    const hitboxAlavanca: Retangulo = {
      x: alavanca.x + 2,
      y: alavanca.y + 6,
      w: alavanca.w - 4,
      h: alavanca.h - 6,
    };
    if (checkAABB(heroi, hitboxAlavanca)) {
      empurrarHeroiParaFora(heroi, hitboxAlavanca);
    }
  }

  // 6b. Colisão com Pontos de Gancho (poste fixo)
  if (sala.pontosGancho) {
    for (const pg of sala.pontosGancho) {
      const hitboxPg: Retangulo = {
        x: pg.x + 3,
        y: pg.y + 6,
        w: 10,
        h: 9,
      };
      if (checkAABB(heroi, hitboxPg)) {
        empurrarHeroiParaFora(heroi, hitboxPg);
      }
    }
  }

  // Limite estrito da tela 256x224
  heroi.x = Math.max(0, Math.min(256 - heroi.w, heroi.x));
  heroi.y = Math.max(0, Math.min(224 - heroi.h, heroi.y));

  // 7. Sistema de Combate, Inimigos e Chefe Raizarca
  const obstaculosSala: Retangulo[] = [];
  for (let r = 0; r < 14; r++) {
    for (let c = 0; c < 16; c++) {
      const tile = sala.grid[r][c];
      if (tile === 1 || tile === 3) {
        obstaculosSala.push({ x: c * 16, y: r * 16, w: 16, h: 16 });
      } else if (tile === 2) {
        const tileRect = { x: c * 16, y: r * 16, w: 16, h: 16 };
        const temPonte = sala.pontesRetrateis.some(
          (p) => p.ativa && checkAABB(tileRect, p)
        );
        const temPlat = state.plataformasDungeon && state.plataformasDungeon.some(
          (plat) => plat.estado !== 'submersa' && checkAABB(tileRect, plat)
        );
        if (!temPonte && !temPlat) {
          obstaculosSala.push(tileRect);
        }
      }
    }
  }
  for (const b of sala.baus) obstaculosSala.push(b);
  for (const a of sala.alavancas) obstaculosSala.push(a);

  const limitesSala = { minX: 16, maxX: 240, minY: 16, maxY: 208 };

  // Atualiza combate do herói (ataque, iframes, knockback)
  atualizarHeroiCombate(heroi, dt, obstaculosSala, limitesSala);

  // Atualiza inimigos da sala
  if (sala.inimigos && sala.inimigos.length > 0) {
    atualizarInimigos(sala.inimigos, heroi, obstaculosSala, limitesSala, state, dt);
  }

  // Lógica da Câmara do Chefe Raizarca (sala_1_0_chefe)
  if (sala.id === 'sala_1_0_chefe') {
    atualizarChefeRaizarca(state.chefeRaizarca, heroi, state, dt);
    atualizarProjeteis(state.projeteis, heroi, state, dt, limitesSala);

    // Quando Raizarca é derrotado, destranca a porta para o Altar da Vida (sala_2_0_altar)
    if (state.chefeRaizarca.derrotado) {
      const portaLeste = sala.portas.find((p) => p.direcao === 'leste');
      if (portaLeste && portaLeste.estado !== 'aberta') {
        portaLeste.estado = 'aberta';
      }

      // Coleta do Gancho de Vinha no pedestal
      if (
        state.chefeRaizarca.ganchoLiberado &&
        state.itemEquipado !== 'gancho_vinha'
      ) {
        const pedestalGancho: Retangulo = { x: 116, y: 112, w: 24, h: 20 };
        if (checkAABB(heroi, pedestalGancho)) {
          state.itemEquipado = 'gancho_vinha';
          state.dungeonItemObtido = {
            nome: 'Gancho de Vinha',
            subtitulo: 'Item de Progressão Sagrado da Região 1',
            iconeTipo: 'item',
            timer: 1.5,
          };
          state.notificacaoTexto = '★ GANCHO DE VINHA OBTIDO! ★';
          state.notificacaoTimer = 3.5;
          soundManager.playItemGet();
        }
      }
    }
  }

  // Atualiza partículas
  atualizarParticulas(state.particulas, dt);
}

// Empurra o herói para fora de um obstáculo sólido retangular
function empurrarHeroiParaFora(heroi: HeroState, obs: Retangulo) {
  const dxEsq = heroi.x + heroi.w - obs.x;
  const dxDir = obs.x + obs.w - heroi.x;
  const dyCima = heroi.y + heroi.h - obs.y;
  const dyBaixo = obs.y + obs.h - heroi.y;

  const minVal = Math.min(dxEsq, dxDir, dyCima, dyBaixo);

  if (minVal === dxEsq) {
    heroi.x = obs.x - heroi.w;
  } else if (minVal === dxDir) {
    heroi.x = obs.x + obs.w;
  } else if (minVal === dyCima) {
    heroi.y = obs.y - heroi.h;
  } else if (minVal === dyBaixo) {
    heroi.y = obs.y + obs.h;
  }
}

// ==========================================
// RENDERIZAÇÃO DA DUNGEON (256x224px, 16-BIT)
// ==========================================
export function renderDungeon(
  ctx: CanvasRenderingContext2D,
  dungeon: Dungeon,
  state: GameState,
  animTime: number
) {
  const sala = dungeon.salas[state.dungeonSalaAtualId];
  if (!sala) return;

  // 1. Chão e Paredes do Grid (14x16)
  for (let r = 0; r < 14; r++) {
    for (let c = 0; c < 16; c++) {
      const tile = sala.grid[r][c];
      const tx = c * 16;
      const ty = r * 16;

      if (tile === 0 || tile === 2) {
        // Chão de lajota de pedra do Santuário da Raiz
        const alt = (r + c) % 2 === 0;
        ctx.fillStyle = alt ? '#26292b' : '#212426';
        ctx.fillRect(tx, ty, 16, 16);

        // Textura sutil de rejunte de lajotas de pedra
        ctx.strokeStyle = '#181a1b';
        ctx.lineWidth = 1;
        ctx.strokeRect(tx + 0.5, ty + 0.5, 15, 15);

        // Raiz ou musgo ocasional decorativo
        if ((r * 11 + c * 7) % 13 === 0) {
          ctx.fillStyle = '#3e5c46';
          ctx.fillRect(tx + 4, ty + 6, 3, 2);
          ctx.fillRect(tx + 6, ty + 8, 4, 1);
        }
      }

      // Abismo / Fosso profundo
      if (tile === 2) {
        ctx.fillStyle = '#080a0c';
        ctx.fillRect(tx, ty, 16, 16);
        // Borda de profundidade
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(tx, ty, 16, 3);
        ctx.fillRect(tx, ty, 3, 16);
      }

      // Parede de Pedra Sólida
      if (tile === 1) {
        ctx.fillStyle = '#3a3f45';
        ctx.fillRect(tx, ty, 16, 16);

        // Relevo da parede 16-bit
        ctx.fillStyle = '#4c535c';
        ctx.fillRect(tx + 1, ty + 1, 14, 2);
        ctx.fillStyle = '#22262a';
        ctx.fillRect(tx + 1, ty + 14, 14, 2);

        // Tijolos gravados
        ctx.strokeStyle = '#292d33';
        ctx.lineWidth = 1;
        ctx.strokeRect(tx + 0.5, ty + 0.5, 15, 15);
      }

      // Pilar cerimonial com Tocha
      if (tile === 3) {
        // Base do pilar
        ctx.fillStyle = '#4b5563';
        ctx.fillRect(tx + 2, ty + 2, 12, 12);
        ctx.strokeStyle = '#1f2937';
        ctx.strokeRect(tx + 2.5, ty + 2.5, 11, 11);

        // Chama da tocha animada
        const flicker = Math.sin(animTime * 12 + c * 5) * 1.5;
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(tx + 8, ty + 8 + flicker * 0.5, 3.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(tx + 8, ty + 8, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // 2. Pontes Retráteis Ativadas
  for (const ponte of sala.pontesRetrateis) {
    if (ponte.ativa) {
      // Ponte de lajotas de pedra maciça estendida sobre o abismo
      ctx.fillStyle = '#525b66';
      ctx.fillRect(ponte.x, ponte.y, ponte.w, ponte.h);

      ctx.strokeStyle = '#32373e';
      ctx.lineWidth = 1;
      ctx.strokeRect(ponte.x + 0.5, ponte.y + 0.5, ponte.w - 1, ponte.h - 1);

      // Vigas de madeira/ferro da ponte
      ctx.fillStyle = '#b45309';
      ctx.fillRect(ponte.x, ponte.y, 4, ponte.h);
      ctx.fillRect(ponte.x + ponte.w - 4, ponte.y, 4, ponte.h);

      // Tábuas horizontais
      for (let py = ponte.y + 6; py < ponte.y + ponte.h; py += 8) {
        ctx.fillStyle = '#1c1917';
        ctx.fillRect(ponte.x + 4, py, ponte.w - 8, 1);
      }
    }
  }

  // 3. Decorações Atmosféricas Especiais de Cada Câmara
  renderizarDecoracoesEspeciais(ctx, sala, animTime);

  // 4. Portas da Sala
  for (const porta of sala.portas) {
    renderizarPorta(ctx, porta);
  }

  // 5. Chaves no Chão
  for (const chave of sala.chaves) {
    if (!chave.coletada) {
      renderizarChave(ctx, chave, animTime);
    }
  }

  // 6. Alavancas
  for (const alavanca of sala.alavancas) {
    renderizarAlavanca(ctx, alavanca);
  }

  // 7. Baús
  for (const bau of sala.baus) {
    renderizarBau(ctx, bau, animTime);
  }

  // 7b. Pontos de Gancho (#c9a24b)
  if (sala.pontosGancho) {
    for (const pg of sala.pontosGancho) {
      renderizarPontoGancho(ctx, pg, 0, 0, animTime);
    }
  }

  // 8. Chefe Raizarca (Câmara [1, 0])
  if (sala.id === 'sala_1_0_chefe') {
    renderizarChefeRaizarca(ctx, state.chefeRaizarca, animTime);
    renderizarProjeteis(ctx, state.projeteis);
  }

  // 9. Inimigos da Sala
  if (sala.inimigos && sala.inimigos.length > 0) {
    renderizarInimigos(ctx, sala.inimigos, 0, 0, animTime);
  }

  // 10. Renderizar Herói (Ren) e Golpe da Lâmina de Eldrim
  renderizarHeroi(ctx, state.heroi);
  renderizarEspada(ctx, state.heroi);

  // 11. Partículas de Combate
  renderizarParticulas(ctx, state.particulas);

  // 12. Cutscene do Santuário se iluminando (2s após derrotar Raizarca)
  if (state.chefeRaizarca.cutsceneLuzTimer > 0) {
    renderizarCutscenePurificacao(ctx, state.chefeRaizarca.cutsceneLuzTimer);
  }

  // 13. Efeito de Fade na Transição entre Salas (0.15s)
  if (state.dungeonTransicaoTimer > 0) {
    const prog = 1 - state.dungeonTransicaoTimer / 0.15; // 0 -> 1
    const alpha = Math.sin(prog * Math.PI) * 0.95;
    ctx.fillStyle = `rgba(0, 0, 0, ${alpha.toFixed(3)})`;
    ctx.fillRect(0, 0, 256, 224);
  }

  // 14. Overlay do Item Obtido (1.0s com "tec-tec" e animação flutuante)
  if (state.dungeonItemObtido && state.dungeonItemObtido.timer > 0) {
    renderizarModalItemObtido(ctx, state.dungeonItemObtido);
  }

  // 15. HUD Superior da Sala da Dungeon (Nome da Sala + Subtítulo elegante)
  ctx.font = 'bold 7px "Courier New", monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText(sala.nome, 12, 4);
}

// Renderiza elementos visuais únicos de câmaras especiais
function renderizarDecoracoesEspeciais(
  ctx: CanvasRenderingContext2D,
  sala: Room,
  animTime: number
) {
  // A. Covil de Raizarca (sala_1_0_chefe)
  if (sala.id === 'sala_1_0_chefe') {
    const pulse = 0.5 + Math.sin(animTime * 3) * 0.2;
    // Círculo cerimonial no centro
    ctx.strokeStyle = `rgba(34, 197, 94, ${pulse.toFixed(2)})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(128, 112, 42, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = `rgba(74, 222, 128, ${(pulse * 0.6).toFixed(2)})`;
    ctx.beginPath();
    ctx.arc(128, 112, 28, 0, Math.PI * 2);
    ctx.stroke();

    // Raízes monumentais projetadas da parede norte
    ctx.fillStyle = '#451a03';
    ctx.fillRect(112, 16, 32, 28);
    ctx.fillStyle = '#2d5a3d';
    ctx.fillRect(116, 20, 24, 20);

    ctx.font = '6px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#4ade80';
    ctx.fillText('SELO ANCESTRAL DE RAIZARCA', 128, 98);
  }

  // B. Santuário Interior / Altar da Vida (sala_2_0_altar)
  if (sala.id === 'sala_2_0_altar') {
    // Feixe de luz sagrada descendo do teto
    const beamPulse = 0.15 + Math.sin(animTime * 2) * 0.05;
    const grad = ctx.createLinearGradient(128, 0, 128, 160);
    grad.addColorStop(0, `rgba(250, 204, 21, ${beamPulse + 0.1})`);
    grad.addColorStop(1, 'rgba(250, 204, 21, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(116, 16);
    ctx.lineTo(140, 16);
    ctx.lineTo(156, 140);
    ctx.lineTo(100, 140);
    ctx.closePath();
    ctx.fill();

    // Pedestal do Relicário
    ctx.fillStyle = '#065f46';
    ctx.fillRect(112, 76, 32, 8);
    ctx.strokeStyle = '#34d399';
    ctx.lineWidth = 1;
    ctx.strokeRect(112.5, 76.5, 31, 7);

    // Partículas místicas ascendentes
    for (let i = 0; i < 4; i++) {
      const px = 114 + ((i * 37 + Math.floor(animTime * 20)) % 28);
      const py = 120 - ((Math.floor(animTime * 30) + i * 25) % 80);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(px, py, 2, 2);
    }
  }

  // C. Galeria dos Cipós (sala_0_1_tesouro)
  if (sala.id === 'sala_0_1_tesouro') {
    // Pedestal sagrado de pedra
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(114, 110, 28, 8);
    ctx.strokeStyle = '#4ade80';
    ctx.lineWidth = 1;
    ctx.strokeRect(114.5, 110.5, 27, 7);

    // Vinhas decorativas nos pilares
    ctx.fillStyle = '#15803d';
    ctx.fillRect(118, 112, 4, 4);
    ctx.fillRect(126, 112, 4, 4);
    ctx.fillRect(134, 112, 4, 4);
  }

  // D. Salão do Fosso Abissal (sala_2_1_fosso)
  if (sala.id === 'sala_2_1_fosso') {
    // Efeito de vapor/névoa abissal subindo do fosso (colunas 7 e 8: x=112..144)
    ctx.fillStyle = 'rgba(15, 23, 42, 0.4)';
    const mistY = 32 + Math.sin(animTime * 1.5) * 8;
    ctx.fillRect(112, mistY, 32, 24);
  }
}

// Renderiza portas (abertas, trancadas por chave pequena, de chefe ou por alavanca)
function renderizarPorta(ctx: CanvasRenderingContext2D, porta: PortaDungeon) {
  if (porta.estado === 'aberta') {
    // Vão aberto de passagem
    ctx.fillStyle = '#111315';
    ctx.fillRect(porta.x, porta.y, porta.w, porta.h);

    // Soleira de pedra
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 1;
    ctx.strokeRect(porta.x + 0.5, porta.y + 0.5, porta.w - 1, porta.h - 1);
    return;
  }

  // Portas Fechadas / Trancadas
  ctx.fillStyle = '#475569';
  ctx.fillRect(porta.x, porta.y, porta.w, porta.h);
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1;
  ctx.strokeRect(porta.x + 0.5, porta.y + 0.5, porta.w - 1, porta.h - 1);

  const cx = porta.x + porta.w / 2;
  const cy = porta.y + porta.h / 2;

  if (porta.estado === 'trancada_comum') {
    // Grade de ferro com Cadeado de Bronze
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(porta.x + 4, porta.y + 2, porta.w - 8, porta.h - 4);

    // Cadeado
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(cx - 3, cy - 2, 6, 5);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(cx - 1, cy - 1, 2, 2);
  } else if (porta.estado === 'trancada_chefe') {
    // Porta monumental com insígnia dourada de Raizarca
    ctx.fillStyle = '#854d0e';
    ctx.fillRect(porta.x + 2, porta.y + 2, porta.w - 4, porta.h - 4);

    // Selo Dourado
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#78350f';
    ctx.stroke();

    ctx.fillStyle = '#ef4444';
    ctx.fillRect(cx - 1, cy - 1, 2, 2);
  } else if (porta.estado === 'fechada_alavanca') {
    // Grade de ferro cerrada
    ctx.fillStyle = '#334155';
    for (let gx = porta.x + 4; gx < porta.x + porta.w - 4; gx += 4) {
      ctx.fillRect(gx, porta.y + 2, 2, porta.h - 4);
    }
  }
}

// Renderiza chave no chão
function renderizarChave(
  ctx: CanvasRenderingContext2D,
  chave: ChaveDungeon,
  animTime: number
) {
  const bobbing = Math.sin(animTime * 6) * 1.5;
  const cx = chave.x + chave.w / 2;
  const cy = chave.y + chave.h / 2 + bobbing;

  if (chave.tipo === 'pequena') {
    // Chave Pequena Prateada/Bronze
    ctx.fillStyle = '#fef08a';
    // Aro da chave
    ctx.beginPath();
    ctx.arc(cx - 2, cy, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(cx - 2, cy, 1.2, 0, Math.PI * 2);
    ctx.fill();

    // Haste e dentes
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(cx, cy - 1, 5, 2);
    ctx.fillRect(cx + 3, cy + 1, 2, 2);

    // Brilho pulsante
    ctx.fillStyle = 'rgba(254, 240, 138, 0.4)';
    ctx.beginPath();
    ctx.arc(cx, cy, 6, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Renderiza alavanca na parede ou chão
function renderizarAlavanca(
  ctx: CanvasRenderingContext2D,
  alavanca: AlavancaDungeon
) {
  // Base da alavanca
  ctx.fillStyle = '#334155';
  ctx.fillRect(alavanca.x + 2, alavanca.y + 10, 12, 6);
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1;
  ctx.strokeRect(alavanca.x + 2.5, alavanca.y + 10.5, 11, 5);

  const cx = alavanca.x + 8;
  const cy = alavanca.y + 12;

  // Haste inclinada (esquerda = desativada, direita = ativada)
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = alavanca.ativada ? '#38bdf8' : '#94a3b8';
  ctx.beginPath();
  ctx.moveTo(cx, cy);

  if (alavanca.ativada) {
    ctx.lineTo(cx + 5, cy - 9);
  } else {
    ctx.lineTo(cx - 5, cy - 9);
  }
  ctx.stroke();

  // Manopla esférica da alavanca
  ctx.fillStyle = alavanca.ativada ? '#0284c7' : '#e2e8f0';
  ctx.beginPath();
  const knobX = alavanca.ativada ? cx + 5 : cx - 5;
  const knobY = cy - 9;
  ctx.arc(knobX, knobY, 3, 0, Math.PI * 2);
  ctx.fill();
}

// Renderiza baú de tesouro (aberto ou fechado)
function renderizarBau(
  ctx: CanvasRenderingContext2D,
  bau: BauDungeon,
  animTime: number
) {
  const x = bau.x;
  const y = bau.y;

  if (!bau.aberto) {
    // Baú fechado
    // Corpo de madeira escurecida
    ctx.fillStyle = '#78350f';
    ctx.fillRect(x + 1, y + 5, 14, 10);

    // Cantoneiras de ferro
    ctx.fillStyle = '#b45309';
    ctx.fillRect(x + 1, y + 5, 2, 10);
    ctx.fillRect(x + 13, y + 5, 2, 10);

    // Tampa arqueada
    ctx.fillStyle = '#92400e';
    ctx.fillRect(x + 1, y + 2, 14, 4);

    // Fecho dourado reluzente
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(x + 6, y + 6, 4, 4);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(x + 7, y + 7, 2, 2);

    // Brilho dourado se o baú for importante
    const glow = Math.sin(animTime * 4) * 0.2 + 0.2;
    ctx.fillStyle = `rgba(251, 191, 36, ${glow.toFixed(2)})`;
    ctx.fillRect(x, y + 1, 16, 15);
  } else {
    // Baú aberto com tampa levantada
    ctx.fillStyle = '#451a03';
    ctx.fillRect(x + 1, y + 7, 14, 8); // fundo escuro interior

    // Tampa levantada para trás
    ctx.fillStyle = '#78350f';
    ctx.fillRect(x + 2, y + 1, 12, 5);

    // Cantoneiras
    ctx.fillStyle = '#b45309';
    ctx.fillRect(x + 1, y + 7, 2, 8);
    ctx.fillRect(x + 13, y + 7, 2, 8);

    // Brilho interior esmaecido
    ctx.fillStyle = 'rgba(251, 191, 36, 0.25)';
    ctx.fillRect(x + 3, y + 7, 10, 4);
  }

  // Borda 16-bit
  ctx.strokeStyle = '#1c1917';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 1.5, 15, 13);
}

// Renderiza o Herói (Ren)
function renderizarHeroi(ctx: CanvasRenderingContext2D, heroi: HeroState) {
  renderizarHeroiRen(ctx, heroi, !!heroi.andando);
}

// Modal flutuante de Item Obtido (exibido por 1.0s com "tec-tec" e animação)
function renderizarModalItemObtido(
  ctx: CanvasRenderingContext2D,
  item: {
    nome: string;
    subtitulo: string;
    iconeTipo: string;
    timer: number;
  }
) {
  const boxW = 168;
  const boxH = 46;
  const boxX = Math.round((256 - boxW) / 2);
  const boxY = 76;

  // Caixa de diálogo com moldura ornamental dourada
  ctx.fillStyle = 'rgba(15, 23, 42, 0.96)';
  ctx.fillRect(boxX, boxY, boxW, boxH);

  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(boxX + 0.5, boxY + 0.5, boxW - 1, boxH - 1);

  // Cantos ornamentais
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(boxX, boxY, 3, 3);
  ctx.fillRect(boxX + boxW - 3, boxY, 3, 3);
  ctx.fillRect(boxX, boxY + boxH - 3, 3, 3);
  ctx.fillRect(boxX + boxW - 3, boxY + boxH - 3, 3, 3);

  // Ícone 16x16 em destaque
  const iconX = boxX + 12;
  const iconY = boxY + 14;
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(iconX, iconY, 18, 18);
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 1;
  ctx.strokeRect(iconX + 0.5, iconY + 0.5, 17, 17);

  if (item.iconeTipo === 'item') {
    // Ícone do Gancho de Vinha
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.arc(iconX + 9, iconY + 9, 5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillRect(iconX + 7, iconY + 7, 4, 4);
  } else if (item.iconeTipo === 'chave_chefe') {
    // Chave dourada ornamental
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(iconX + 7, iconY + 9, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(iconX + 9, iconY + 8, 6, 2);
    ctx.fillRect(iconX + 13, iconY + 10, 2, 2);
  } else if (item.iconeTipo === 'chave_pequena') {
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(iconX + 7, iconY + 9, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(iconX + 9, iconY + 8, 5, 2);
  }

  // Textos
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  ctx.font = 'bold 8px "Courier New", monospace';
  ctx.fillStyle = '#fef08a';
  ctx.fillText(item.nome, iconX + 24, boxY + 12);

  ctx.font = '6px "Courier New", monospace';
  ctx.fillStyle = '#cbd5e1';
  ctx.fillText(item.subtitulo, iconX + 24, boxY + 24);
}
