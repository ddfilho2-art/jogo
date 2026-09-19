// Módulo do Santuário das Águas Turvas — Eldrim: Ecos do Passado
// Resolução lógica 256x224px, 16-bit pixel art, pedra encharcada (#2a3a2a) com poças reflexivas.
// Mecânica de plataformas que afundam (1s toque, 3s afunda, 2s vazia reaparece),
// alavanca remota com Bumerangue das Marés, Sapo-Lodo, Libélula Turva e Chefe Marejante.

import { soundManager } from './soundEffects';
import {
  BumerangueVooState,
  Direcao,
  GameState,
  HeroState,
  InimigoEntidade,
  MarejanteBossState,
  PlataformaAfundando,
  ProjetilAgua,
  Retangulo,
} from './types';
import {
  AlavancaDungeon,
  BauDungeon,
  ChaveDungeon,
  Dungeon,
  PortaDungeon,
  Room,
} from './dungeonEngine';
import { HERO_SWAMP_SPEED, HERO_BASE_SPEED } from './constants';
import { renderizarEspada, renderizarParticulas } from './combat';
import { renderizarHeroiRen } from './heroSprite';

// Helper de colisão AABB
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

// ------------------------------------------------------------------
// FÁBRICAS DE ESTADO INICIAL DO CHEFE MAREJANTE E ITENS
// ------------------------------------------------------------------

export function criarChefeMarejanteInicial(): MarejanteBossState {
  return {
    ativo: false,
    derrotado: false,
    x: 128 - 18,
    y: 90,
    w: 36,
    h: 36,
    hp: 12,
    hpMax: 12,
    acertosEmersaoAtual: 0,
    emersoesVencidas: 0,
    estado: 'submerso',
    cicloTimer: 4.0, // Fica submerso por 4s
    disparoTimer: 0,
    alvoSombraX: 128,
    alvoSombraY: 96,
    salaInundada: false,
    inundacaoTimer: 0,
    cutsceneClarearAguaTimer: 0,
    bumerangueLiberado: false,
    relicarioLiberado: false,
    iframeTimer: 0,
    ondulacaoAnim: 0,
  };
}

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
    maxDist: 96, // 6 tiles
    fase: 'indo',
    angulo: 0,
  };
}

// ------------------------------------------------------------------
// INIMIGOS ESPECÍFICOS DO SANTUÁRIO DAS ÁGUAS TURVAS
// ------------------------------------------------------------------

export function criarSapoLodo(id: string, x: number, y: number): InimigoEntidade {
  return {
    id,
    tipo: 'sapo_lodo',
    x,
    y,
    w: 16,
    h: 14,
    hp: 3, // 3 acertos
    hpMax: 3,
    direcao: 'baixo',
    velocidade: 30, // 30px/s durante salto
    iframeTimer: 0,
    vivo: true,
    timerPulo: 1.5, // Pula a cada 1.5s
    saltando: false,
    alturaSalto: 0,
    puloVx: 0,
    puloVy: 0,
  };
}

export function criarLibelulaTurva(id: string, x: number, y: number): InimigoEntidade {
  return {
    id,
    tipo: 'libelula_turva',
    x,
    y,
    w: 14,
    h: 14,
    hp: 2, // 2 acertos
    hpMax: 2,
    direcao: 'direita',
    velocidade: 60, // 60px/s
    iframeTimer: 0,
    vivo: true,
    zigueZagueTimer: Math.random() * Math.PI * 2,
    voando: true, // Voa sobre água e plataformas sem ser afetada
  };
}

// ------------------------------------------------------------------
// FÁBRICA DA DUNGEON: SANTUÁRIO DAS ÁGUAS TURVAS
// ------------------------------------------------------------------

export function criarDungeonAguasTurvas(): Dungeon {
  const criarGridBase = (): number[][] => {
    const grid: number[][] = [];
    for (let r = 0; r < 14; r++) {
      const linha: number[] = [];
      for (let c = 0; c < 16; c++) {
        if (r === 0 || r === 13 || c === 0 || c === 15) {
          linha.push(1); // Parede sólida
        } else {
          linha.push(0); // Chão de lajota de pedra encharcada
        }
      }
      grid.push(linha);
    }
    return grid;
  };

  const salas: Record<string, Room> = {};
  const efeitosAlavanca: Record<
    string,
    (dungeon: Dungeon, ativada: boolean, state: GameState) => void
  > = {};

  // ==========================================
  // SALA 1: ENTRADA / ÁTRIO DAS ÁGUAS (aguas_entrada)
  // Grid [1, 2]. Sul: Saída para Charco. Norte: Porta trancada comum (precisa chave pequena).
  // Leste: Porta aberta para o Ramal Secundário da Chave Pequena.
  // ==========================================
  const gridEntrada = criarGridBase();
  // Poças de água decorativas nos cantos
  gridEntrada[3][3] = 0;
  gridEntrada[3][4] = 0;
  gridEntrada[4][3] = 0;
  gridEntrada[9][11] = 0;
  gridEntrada[9][12] = 0;
  // Pilares cerimonial com tochas azuis
  gridEntrada[3][6] = 3;
  gridEntrada[3][9] = 3;
  gridEntrada[10][6] = 3;
  gridEntrada[10][9] = 3;

  const salaEntrada: Room = {
    id: 'aguas_entrada',
    nome: 'Santuário das Águas • Átrio Inundado',
    subtitulo: 'A água escura sussurra segredos ancestrais',
    mapaGridX: 1,
    mapaGridY: 2,
    grid: gridEntrada,
    portas: [
      {
        direcao: 'sul',
        destinoRoomId: 'overworld',
        destinoPorta: 'sul',
        estado: 'aberta',
        x: 128 - 14,
        y: 208,
        w: 28,
        h: 16,
      },
      {
        direcao: 'norte',
        destinoRoomId: 'aguas_puzzle_1',
        destinoPorta: 'sul',
        estado: 'trancada_comum', // Precisa da Chave Pequena encontrada no Ramal Secundário
        x: 128 - 14,
        y: 0,
        w: 28,
        h: 16,
      },
      {
        direcao: 'leste',
        destinoRoomId: 'aguas_ramal_chave',
        destinoPorta: 'oeste',
        estado: 'aberta',
        x: 240,
        y: 112 - 14,
        w: 16,
        h: 28,
      },
    ],
    chaves: [],
    baus: [],
    alavancas: [],
    pontesRetrateis: [],
    inimigos: [
      criarSapoLodo('sapo_entrada_1', 64, 80),
      criarLibelulaTurva('libelula_entrada_1', 180, 80),
    ],
  };

  // ==========================================
  // SALA 2: RAMAL SECUNDÁRIO DA CHAVE PEQUENA (aguas_ramal_chave)
  // Grid [2, 2]. Guardada por 2 Sapos-Lodo e 1 Libélula Turva.
  // Contém o baú com a Chave Pequena para destrancar o Puzzle 1.
  // ==========================================
  const gridRamal = criarGridBase();
  // Canal d'água dividindo parcialmente
  for (let r = 2; r <= 11; r++) {
    gridRamal[r][7] = 2; // Fosso d'água profunda
    gridRamal[r][8] = 2;
  }
  // Passagem de pedra no centro do fosso
  gridRamal[6][7] = 0;
  gridRamal[6][8] = 0;
  gridRamal[7][7] = 0;
  gridRamal[7][8] = 0;

  const salaRamal: Room = {
    id: 'aguas_ramal_chave',
    nome: 'Ramal Alagado • Câmara da Sentinela',
    subtitulo: 'Inimigos do lodo guardam o caminho sagrado',
    mapaGridX: 2,
    mapaGridY: 2,
    grid: gridRamal,
    portas: [
      {
        direcao: 'oeste',
        destinoRoomId: 'aguas_entrada',
        destinoPorta: 'leste',
        estado: 'aberta',
        x: 0,
        y: 112 - 14,
        w: 16,
        h: 28,
      },
    ],
    chaves: [],
    baus: [
      {
        id: 'bau_chave_pequena_aguas',
        x: 200,
        y: 104,
        w: 16,
        h: 16,
        aberto: false,
        conteudo: {
          tipo: 'chave_pequena',
          nome: 'Chave Pequena',
          subtitulo: 'Destranca as portas comuns do Santuário',
        },
      },
      {
        id: 'bau_selos_ramal',
        x: 200,
        y: 48,
        w: 16,
        h: 16,
        aberto: false,
        conteudo: {
          tipo: 'selos',
          nome: 'Bolsa de Selos',
          subtitulo: '25 Selos recolhidos da água',
          qtd: 25,
        },
      },
    ],
    alavancas: [],
    pontesRetrateis: [],
    inimigos: [
      criarSapoLodo('sapo_ramal_1', 64, 60),
      criarSapoLodo('sapo_ramal_2', 70, 140),
      criarLibelulaTurva('libelula_ramal_1', 170, 112),
    ],
  };

  // ==========================================
  // SALA 3: PUZZLE 1 COM PLATAFORMAS QUE AFUNDAM (aguas_puzzle_1)
  // Grid [1, 1]. Abismo/Água profunda em 50% da sala.
  // Plataformas que afundam ligam o sul ao norte.
  // Libélulas turvas sobrevoam a água sem afundar!
  // ==========================================
  const gridPuzzle1 = criarGridBase();
  // Vasto abismo/água profunda entre linha 4 e 9
  for (let r = 4; r <= 9; r++) {
    for (let c = 2; c <= 13; c++) {
      gridPuzzle1[r][c] = 2; // Água profunda / Fosso intransponível a pé sem plataforma
    }
  }

  const salaPuzzle1: Room = {
    id: 'aguas_puzzle_1',
    nome: 'Câmara do Lótus • Plataformas Efêmeras',
    subtitulo: 'As pedras afundam sob passos hesitantes',
    mapaGridX: 1,
    mapaGridY: 1,
    grid: gridPuzzle1,
    portas: [
      {
        direcao: 'sul',
        destinoRoomId: 'aguas_entrada',
        destinoPorta: 'norte',
        estado: 'aberta',
        x: 128 - 14,
        y: 208,
        w: 28,
        h: 16,
      },
      {
        direcao: 'norte',
        destinoRoomId: 'aguas_puzzle_2',
        destinoPorta: 'sul',
        estado: 'aberta',
        x: 128 - 14,
        y: 0,
        w: 28,
        h: 16,
      },
    ],
    chaves: [],
    baus: [],
    alavancas: [],
    pontesRetrateis: [],
    inimigos: [
      criarLibelulaTurva('libelula_puz1_1', 80, 88),
      criarLibelulaTurva('libelula_puz1_2', 170, 120),
    ],
  };

  // ==========================================
  // SALA 4: PUZZLE 2 COM ALAVANCA REMOTA (aguas_puzzle_2)
  // Grid [1, 0]. Plataformas que afundam e alavanca isolada em uma ilha no canto nordeste.
  // Alavanca ativável apenas pelo BUMERANGUE DAS MARÉS!
  // Ao ser atingida, abre a passagem norte para a Sala do Tesouro e caminho do Chefe.
  // ==========================================
  const gridPuzzle2 = criarGridBase();
  // Fosso de água profunda no meio e nordeste
  for (let r = 3; r <= 10; r++) {
    for (let c = 3; c <= 12; c++) {
      gridPuzzle2[r][c] = 2;
    }
  }
  // Ilha de pedra isolada no nordeste contendo a alavanca (colunas 10-11, linhas 4-5)
  gridPuzzle2[4][10] = 0;
  gridPuzzle2[4][11] = 0;
  gridPuzzle2[5][10] = 0;
  gridPuzzle2[5][11] = 0;

  const salaPuzzle2: Room = {
    id: 'aguas_puzzle_2',
    nome: 'Mecanismo da Eclusa • Alavanca Remota',
    subtitulo: 'O vento e as marés alcançam onde os pés não pisam',
    mapaGridX: 1,
    mapaGridY: 0,
    grid: gridPuzzle2,
    portas: [
      {
        direcao: 'sul',
        destinoRoomId: 'aguas_puzzle_1',
        destinoPorta: 'norte',
        estado: 'aberta',
        x: 128 - 14,
        y: 208,
        w: 28,
        h: 16,
      },
      {
        direcao: 'oeste',
        destinoRoomId: 'aguas_sala_tesouro',
        destinoPorta: 'leste',
        estado: 'aberta', // Conduz à sala de tesouro da chave grande
        x: 0,
        y: 112 - 14,
        w: 16,
        h: 28,
      },
      {
        direcao: 'norte',
        destinoRoomId: 'aguas_antechefe',
        destinoPorta: 'sul',
        estado: 'fechada_alavanca', // Bloqueada por comporta até a alavanca ser ativada!
        x: 128 - 14,
        y: 0,
        w: 28,
        h: 16,
      },
    ],
    chaves: [],
    baus: [],
    alavancas: [
      {
        id: 'alavanca_remota_aguas',
        x: 10 * 16 + 4,
        y: 4 * 16 + 4,
        w: 12,
        h: 12,
        ativada: false,
        efeitoId: 'abrir_eclusa_chefe',
      },
    ],
    pontesRetrateis: [
      {
        id: 'ponte_eclusa_norte',
        x: 128 - 16,
        y: 3 * 16,
        w: 32,
        h: 2 * 16,
        ativa: false,
        leverId: 'alavanca_remota_aguas',
      },
    ],
    inimigos: [
      criarSapoLodo('sapo_puz2_1', 40, 160),
      criarLibelulaTurva('libelula_puz2_1', 128, 90),
    ],
  };

  // Efeito da Alavanca Remota: Abre a porta norte e estende a ponte para a antecâmara do chefe
  efeitosAlavanca['abrir_eclusa_chefe'] = (dungeon, ativada, state) => {
    const puz2 = dungeon.salas['aguas_puzzle_2'];
    if (puz2) {
      const portaNorte = puz2.portas.find((p) => p.direcao === 'norte');
      if (portaNorte) {
        portaNorte.estado = ativada ? 'aberta' : 'fechada_alavanca';
      }
      for (const ponte of puz2.pontesRetrateis) {
        ponte.ativa = ativada;
      }
    }
    if (ativada) {
      soundManager.playDoorUnlock();
      state.notificacaoTexto = 'COMPORTA DO CHEFE DESBLOQUEADA!';
      state.notificacaoTimer = 2.5;
    }
  };

  // ==========================================
  // SALA 5: SALA DO TESOURO DA CHAVE GRANDE (aguas_sala_tesouro)
  // Grid [0, 0]. Contém a Chave Grande / Chave de Chefe e o Bumerangue das Marés!
  // ==========================================
  const gridTesouro = criarGridBase();
  // Pedestais decorativos
  gridTesouro[3][3] = 3;
  gridTesouro[3][12] = 3;
  gridTesouro[10][3] = 3;
  gridTesouro[10][12] = 3;

  const salaTesouro: Room = {
    id: 'aguas_sala_tesouro',
    nome: 'Câmara do Tesouro • Relíquia das Marés',
    subtitulo: 'O Bumerangue das Marés corta o vento e as correntes',
    mapaGridX: 0,
    mapaGridY: 0,
    grid: gridTesouro,
    portas: [
      {
        direcao: 'leste',
        destinoRoomId: 'aguas_puzzle_2',
        destinoPorta: 'oeste',
        estado: 'aberta',
        x: 240,
        y: 112 - 14,
        w: 16,
        h: 28,
      },
    ],
    chaves: [],
    baus: [
      {
        id: 'bau_chave_chefe_aguas',
        x: 128 - 18,
        y: 72,
        w: 16,
        h: 16,
        aberto: false,
        conteudo: {
          tipo: 'chave_chefe',
          nome: 'Chave do Marejante',
          subtitulo: 'Abre o portal do Covil Submerso',
        },
      },
      {
        id: 'bau_bumerangue_mares',
        x: 128 + 2,
        y: 72,
        w: 16,
        h: 16,
        aberto: false,
        conteudo: {
          tipo: 'item',
          itemId: 'bumerangue_mares',
          nome: 'Bumerangue das Marés',
          subtitulo: 'Item secundário [X]. Aciona alavancas e atordoa inimigos!',
        },
      },
    ],
    alavancas: [],
    pontesRetrateis: [],
    inimigos: [
      criarSapoLodo('sapo_tesouro_1', 64, 140),
      criarSapoLodo('sapo_tesouro_2', 190, 140),
    ],
  };

  // ==========================================
  // SALA 6: ANTECÂMARA DO CHEFE (aguas_antechefe)
  // Grid [2, 0]. Porta cerimonial trancada pela Chave Grande.
  // ==========================================
  const gridAntechefe = criarGridBase();
  // Tochas cerimonias azuis ladeando o portal do chefe
  gridAntechefe[2][6] = 3;
  gridAntechefe[2][9] = 3;

  const salaAntechefe: Room = {
    id: 'aguas_antechefe',
    nome: 'Antecâmara do Abismo • Selo Aquático',
    subtitulo: 'Apenas a Chave do Marejante rompe o selo das profundezas',
    mapaGridX: 2,
    mapaGridY: 0,
    grid: gridAntechefe,
    portas: [
      {
        direcao: 'sul',
        destinoRoomId: 'aguas_puzzle_2',
        destinoPorta: 'norte',
        estado: 'aberta',
        x: 128 - 14,
        y: 208,
        w: 28,
        h: 16,
      },
      {
        direcao: 'norte',
        destinoRoomId: 'aguas_chefe_marejante',
        destinoPorta: 'sul',
        estado: 'trancada_chefe', // Requer Chave Grande / Chave de Chefe!
        x: 128 - 14,
        y: 0,
        w: 28,
        h: 16,
      },
    ],
    chaves: [],
    baus: [],
    alavancas: [],
    pontesRetrateis: [],
    inimigos: [
      criarLibelulaTurva('libelula_ante_1', 64, 100),
      criarLibelulaTurva('libelula_ante_2', 180, 100),
    ],
  };

  // ==========================================
  // SALA 7: SALA-CHEFE: COVIL DO MAREJANTE (aguas_chefe_marejante)
  // Grid [2, -1] / lógica de chefe. Arena cercada por água profunda.
  // ==========================================
  const gridChefe = criarGridBase();
  // Água profunda circulando a arena central (linhas 2 e 11, colunas 2 e 13)
  for (let c = 1; c <= 14; c++) {
    gridChefe[1][c] = 2;
    gridChefe[2][c] = 2;
  }
  for (let r = 3; r <= 10; r++) {
    gridChefe[r][1] = 2;
    gridChefe[r][2] = 2;
    gridChefe[r][13] = 2;
    gridChefe[r][14] = 2;
  }

  const salaChefe: Room = {
    id: 'aguas_chefe_marejante',
    nome: 'Covil das Profundezas • Marejante',
    subtitulo: 'Guardião corrompido do Relicário das Marés',
    mapaGridX: 2,
    mapaGridY: 1, // Exibição limpa no minimapa
    grid: gridChefe,
    portas: [
      {
        direcao: 'sul',
        destinoRoomId: 'aguas_antechefe',
        destinoPorta: 'norte',
        estado: 'aberta',
        x: 128 - 14,
        y: 208,
        w: 28,
        h: 16,
      },
    ],
    chaves: [],
    baus: [],
    alavancas: [],
    pontesRetrateis: [],
    inimigos: [],
  };

  salas['aguas_entrada'] = salaEntrada;
  salas['aguas_ramal_chave'] = salaRamal;
  salas['aguas_puzzle_1'] = salaPuzzle1;
  salas['aguas_puzzle_2'] = salaPuzzle2;
  salas['aguas_sala_tesouro'] = salaTesouro;
  salas['aguas_antechefe'] = salaAntechefe;
  salas['aguas_chefe_marejante'] = salaChefe;

  return {
    id: 'santuario_aguas_turvas',
    nome: 'Santuário das Águas Turvas',
    regiao: 'Charco Sombrio',
    salas,
    salaInicialId: 'aguas_entrada',
    efeitosAlavanca,
  };
}

// ------------------------------------------------------------------
// PLATAFORMAS QUE AFUNDAM (Mecânica Única)
// Começam a afundar 1s após o herói pisar, desaparecem totalmente aos 3s,
// e reaparecem 2s depois de vazias.
// ------------------------------------------------------------------

export function criarPlataformasIniciaisDungeon(): PlataformaAfundando[] {
  return [
    // Plataformas da Sala aguas_puzzle_1 (conectando sul ao norte pelo fosso central)
    {
      id: 'plat_puz1_1',
      x: 128 - 10,
      y: 138,
      w: 20,
      h: 20,
      estado: 'firme',
      timerPiso: 0,
      timerVazia: 0,
      profundidade: 0,
      heroiSobre: false,
    },
    {
      id: 'plat_puz1_2',
      x: 104,
      y: 110,
      w: 20,
      h: 20,
      estado: 'firme',
      timerPiso: 0,
      timerVazia: 0,
      profundidade: 0,
      heroiSobre: false,
    },
    {
      id: 'plat_puz1_3',
      x: 132,
      y: 84,
      w: 20,
      h: 20,
      estado: 'firme',
      timerPiso: 0,
      timerVazia: 0,
      profundidade: 0,
      heroiSobre: false,
    },
    {
      id: 'plat_puz1_4',
      x: 128 - 10,
      y: 56,
      w: 20,
      h: 20,
      estado: 'firme',
      timerPiso: 0,
      timerVazia: 0,
      profundidade: 0,
      heroiSobre: false,
    },

    // Plataformas da Sala aguas_puzzle_2 (permitindo travessia e alcance para a ilha da alavanca)
    {
      id: 'plat_puz2_1',
      x: 128 - 10,
      y: 140,
      w: 20,
      h: 20,
      estado: 'firme',
      timerPiso: 0,
      timerVazia: 0,
      profundidade: 0,
      heroiSobre: false,
    },
    {
      id: 'plat_puz2_2',
      x: 80,
      y: 112,
      w: 20,
      h: 20,
      estado: 'firme',
      timerPiso: 0,
      timerVazia: 0,
      profundidade: 0,
      heroiSobre: false,
    },
    {
      id: 'plat_puz2_3',
      x: 110,
      y: 84,
      w: 20,
      h: 20,
      estado: 'firme',
      timerPiso: 0,
      timerVazia: 0,
      profundidade: 0,
      heroiSobre: false,
    },
  ];
}

export function atualizarPlataformasAfundando(
  plataformas: PlataformaAfundando[],
  heroi: HeroState,
  dt: number,
  salaId: string,
  onHeroiCaiuNaAgua: () => void
) {
  // Filtra as plataformas da sala ativa
  const prefix =
    salaId === 'aguas_puzzle_1'
      ? 'plat_puz1'
      : salaId === 'aguas_puzzle_2'
      ? 'plat_puz2'
      : '';
  if (!prefix) return;

  const heroFootHitbox: Retangulo = {
    x: heroi.x + 3,
    y: heroi.y + heroi.h - 6,
    w: heroi.w - 6,
    h: 5,
  };

  for (const plat of plataformas) {
    if (!plat.id.startsWith(prefix)) continue;

    const sobre = checkAABB(heroFootHitbox, plat);
    plat.heroiSobre = sobre;

    if (sobre) {
      plat.timerVazia = 0;
      plat.timerPiso += dt;

      if (plat.timerPiso < 1.0) {
        plat.estado = 'firme';
        plat.profundidade = 0;
      } else if (plat.timerPiso >= 1.0 && plat.timerPiso < 3.0) {
        if (plat.estado === 'firme') {
          soundManager.playPlatformSink();
        }
        plat.estado = 'afundando';
        plat.profundidade = Math.min(1.0, (plat.timerPiso - 1.0) / 2.0); // 0 a 1 em 2s
      } else {
        // timerPiso >= 3.0: Totalmente submersa!
        plat.estado = 'submersa';
        plat.profundidade = 1.0;
        // Herói caiu na água profunda!
        onHeroiCaiuNaAgua();
      }
    } else {
      // Herói não está sobre a plataforma
      if (plat.estado === 'submersa' || plat.estado === 'afundando') {
        plat.timerVazia += dt;
        if (plat.timerVazia >= 2.0) {
          // Reaparece 2s depois de vazia
          plat.estado = 'firme';
          plat.timerPiso = 0;
          plat.profundidade = 0;
          plat.timerVazia = 0;
        }
      } else {
        plat.timerPiso = Math.max(0, plat.timerPiso - dt * 2);
        plat.profundidade = 0;
        plat.estado = 'firme';
      }
    }
  }
}

// ------------------------------------------------------------------
// FÍSICA E ATUALIZAÇÃO DO BUMERANGUE DAS MARÉS
// ------------------------------------------------------------------

export function dispararBumerangue(state: GameState) {
  if (state.bumerangueAnim && state.bumerangueAnim.ativo) return; // Já há um em voo
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
    maxDist: 96, // 6 tiles (96px)
    fase: 'indo',
    angulo: 0,
    inimigosAtingidosIds: [],
    inimigosAtingidosQtd: 0,
  };

  // Cancela qualquer golpe de espada em preparação
  heroi.carregandoGolpe = false;
  heroi.cargaGolpeTimer = 0;
  heroi.golpePronto = false;

  soundManager.playBoomerang();
}

export function atualizarBumerangue(
  bumerangue: BumerangueVooState,
  heroi: HeroState,
  dungeon: Dungeon,
  salaId: string,
  state: GameState,
  dt: number
) {
  if (!bumerangue.ativo) return;

  // Rotação visual rápida 16-bit
  bumerangue.angulo += 22 * dt;

  const sala = dungeon.salas[salaId];

  if (bumerangue.fase === 'indo') {
    bumerangue.x += bumerangue.vx * dt;
    bumerangue.y += bumerangue.vy * dt;

    const dx = bumerangue.x - bumerangue.startX;
    const dy = bumerangue.y - bumerangue.startY;
    bumerangue.distPercorrida = Math.sqrt(dx * dx + dy * dy);

    // Checar colisão com paredes ou distância máxima atingida
    const atingiuLimite =
      bumerangue.distPercorrida >= bumerangue.maxDist ||
      bumerangue.x <= 16 ||
      bumerangue.x >= 240 ||
      bumerangue.y <= 16 ||
      bumerangue.y >= 208;

    if (atingiuLimite) {
      bumerangue.fase = 'voltando';
      soundManager.playBoomerang();
    }
  } else {
    // Fase 'voltando': persegue a posição atual de Ren
    const hx = heroi.x + heroi.w / 2;
    const hy = heroi.y + heroi.h / 2;
    const dx = hx - bumerangue.x;
    const dy = hy - bumerangue.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist <= 12) {
      // Retornou ao herói com sucesso!
      bumerangue.ativo = false;
      return;
    }

    const RETURN_SPEED = 200;
    bumerangue.vx = (dx / dist) * RETURN_SPEED;
    bumerangue.vy = (dy / dist) * RETURN_SPEED;
    bumerangue.x += bumerangue.vx * dt;
    bumerangue.y += bumerangue.vy * dt;
  }

  // Colisão com Alavancas da Sala (Acionamento remoto pelo Bumerangue das Marés!)
  if (sala && sala.alavancas) {
    const bHit: Retangulo = {
      x: bumerangue.x - 5,
      y: bumerangue.y - 5,
      w: 10,
      h: 10,
    };
    for (const alavanca of sala.alavancas) {
      if (checkAABB(bHit, alavanca)) {
        alavanca.ativada = !alavanca.ativada;
        soundManager.playLeverSwitch();

        const efeito = dungeon.efeitosAlavanca[alavanca.efeitoId];
        if (efeito) {
          efeito(dungeon, alavanca.ativada, state);
        }

        // Bumerangue ricocheteia e volta
        if (bumerangue.fase === 'indo') {
          bumerangue.fase = 'voltando';
        }
        break;
      }
    }
  }

  // Colisão com Inimigos da Sala (Até 3 inimigos atingidos na trajetória, 1 dano cada, sem invalidar o item)
  if (sala && sala.inimigos) {
    if (!bumerangue.inimigosAtingidosIds) bumerangue.inimigosAtingidosIds = [];
    if (!bumerangue.inimigosAtingidosQtd) bumerangue.inimigosAtingidosQtd = 0;

    const bHit: Retangulo = {
      x: bumerangue.x - 5,
      y: bumerangue.y - 5,
      w: 10,
      h: 10,
    };
    for (const inimigo of sala.inimigos) {
      if (
        inimigo.vivo &&
        inimigo.iframeTimer <= 0 &&
        !bumerangue.inimigosAtingidosIds.includes(inimigo.id) &&
        bumerangue.inimigosAtingidosQtd < 3 &&
        checkAABB(bHit, inimigo)
      ) {
        inimigo.hp -= 1;
        inimigo.iframeTimer = 0.3;
        bumerangue.inimigosAtingidosIds.push(inimigo.id);
        bumerangue.inimigosAtingidosQtd += 1;
        soundManager.playEnemyHit();

        if (inimigo.hp <= 0) {
          inimigo.vivo = false;
          soundManager.playEnemyDeath();
        }

        // Se atingiu o 3º inimigo e estava na fase 'indo', inicia o retorno
        if (bumerangue.inimigosAtingidosQtd >= 3 && bumerangue.fase === 'indo') {
          bumerangue.fase = 'voltando';
        }
      }
    }
  }

  // Colisão com Chefe Marejante (se estiver emerso e vulnerável)
  if (
    salaId === 'aguas_chefe_marejante' &&
    state.chefeMarejante.ativo &&
    !state.chefeMarejante.derrotado &&
    state.chefeMarejante.estado === 'emerso' &&
    state.chefeMarejante.iframeTimer <= 0
  ) {
    const chefeHit: Retangulo = {
      x: state.chefeMarejante.x,
      y: state.chefeMarejante.y,
      w: state.chefeMarejante.w,
      h: state.chefeMarejante.h,
    };
    const bHit: Retangulo = {
      x: bumerangue.x - 5,
      y: bumerangue.y - 5,
      w: 10,
      h: 10,
    };
    if (checkAABB(bHit, chefeHit)) {
      aplicarDanoChefeMarejante(state);
      if (bumerangue.fase === 'indo') {
        bumerangue.fase = 'voltando';
      }
    }
  }
}

// ------------------------------------------------------------------
// IA E COMBATE DOS INIMIGOS (Sapo-Lodo e Libélula Turva)
// ------------------------------------------------------------------

export function atualizarInimigosAguasTurvas(
  inimigos: InimigoEntidade[],
  heroi: HeroState,
  dt: number,
  state: GameState
) {
  for (const ini of inimigos) {
    if (!ini.vivo) continue;

    if (ini.iframeTimer > 0) {
      ini.iframeTimer -= dt;
    }

    if (ini.tipo === 'sapo_lodo') {
      // Sapo-Lodo: pula a cada 1.5s com velocidade 30px/s na direção de Ren
      ini.timerPulo = (ini.timerPulo || 1.5) - dt;

      if (ini.saltando) {
        // Em salto (duração 0.5s)
        ini.x += (ini.puloVx || 0) * dt;
        ini.y += (ini.puloVy || 0) * dt;
        // Limites de sala
        ini.x = Math.max(20, Math.min(220, ini.x));
        ini.y = Math.max(20, Math.min(188, ini.y));

        if (ini.timerPulo && ini.timerPulo <= 0) {
          // Pousou
          ini.saltando = false;
          ini.timerPulo = 1.5; // Espera 1.5s para o próximo pulo
          ini.alturaSalto = 0;
        } else {
          // Arco senoidal de altura
          const prog = 1 - (ini.timerPulo || 0) / 0.5;
          ini.alturaSalto = Math.sin(prog * Math.PI) * 9;
        }
      } else {
        ini.alturaSalto = 0;
        if (ini.timerPulo && ini.timerPulo <= 0) {
          // Iniciar novo salto na direção de Ren
          const dx = heroi.x - ini.x;
          const dy = heroi.y - ini.y;
          const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
          const speed = ini.velocidade || 30;
          ini.puloVx = (dx / dist) * speed;
          ini.puloVy = (dy / dist) * speed;
          ini.saltando = true;
          ini.timerPulo = 0.5; // Duração do voo
          ini.direcao = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'direita' : 'esquerda') : dy > 0 ? 'baixo' : 'cima';
        }
      }
    } else if (ini.tipo === 'libelula_turva') {
      // Libélula Turva: zigue-zague a 60px/s, voa sobre água e plataformas
      ini.zigueZagueTimer = (ini.zigueZagueTimer || 0) + dt * 4;

      const dx = heroi.x - ini.x;
      const dy = heroi.y - ini.y;
      const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));

      const dirBaseX = dx / dist;
      const dirBaseY = dy / dist;

      // Movimento perpendicular senoidal (zigue-zague)
      const perpX = -dirBaseY * Math.sin(ini.zigueZagueTimer) * 0.8;
      const perpY = dirBaseX * Math.sin(ini.zigueZagueTimer) * 0.8;

      const speed = ini.velocidade || 60;
      ini.x += (dirBaseX + perpX) * speed * dt;
      ini.y += (dirBaseY + perpY) * speed * dt;

      ini.x = Math.max(20, Math.min(224, ini.x));
      ini.y = Math.max(20, Math.min(192, ini.y));
      ini.direcao = dx > 0 ? 'direita' : 'esquerda';
    }

    // Dano ao Herói por toque
    const heroHitbox: Retangulo = {
      x: heroi.x,
      y: heroi.y,
      w: heroi.w,
      h: heroi.h,
    };
    const iniHitbox: Retangulo = {
      x: ini.x,
      y: ini.y - (ini.alturaSalto || 0),
      w: ini.w,
      h: ini.h,
    };

    if (
      (!heroi.iframes || heroi.iframes <= 0) &&
      checkAABB(heroHitbox, iniHitbox)
    ) {
      heroi.iframes = 0.8; // 800ms iframes
      state.vidaAtual = Math.max(0, state.vidaAtual - 1);
      soundManager.playHeroHurt();

      // Knockback de 24px
      const kdx = heroi.x - ini.x;
      const kdy = heroi.y - ini.y;
      const kdist = Math.max(1, Math.sqrt(kdx * kdx + kdy * kdy));
      heroi.x += (kdx / kdist) * 24;
      heroi.y += (kdy / kdist) * 24;
    }
  }
}

// ------------------------------------------------------------------
// CHEFE MAREJANTE (COVIL DAS PROFUNDEZAS)
// Fica submerso (invulnerável, sombra na água) na maior parte do tempo.
// Emerge a cada 4s por 2s, vulnerável e atacando com jato d'água em leque (5 projéteis a 100px/s).
// 4 acertos por emersão; 3 emersões (12 acertos) o derrotam.
// Ao restar 1 emersão, inunda o chão com água rasa por 3s.
// Ao morrer: libera Bumerangue das Marés + Relicário das Marés + cutscene de 2s clareando a água.
// ------------------------------------------------------------------

export function atualizarChefeMarejante(
  state: GameState,
  dt: number
) {
  const boss = state.chefeMarejante;
  if (!boss.ativo) return;

  boss.ondulacaoAnim += dt * 3;

  if (boss.iframeTimer > 0) {
    boss.iframeTimer -= dt;
  }

  // Cutscene de morte: 2.0s de clareamento da água
  if (boss.derrotado) {
    if (boss.cutsceneClarearAguaTimer > 0) {
      boss.cutsceneClarearAguaTimer -= dt;
      if (boss.cutsceneClarearAguaTimer <= 0) {
        boss.relicarioLiberado = true;
        boss.bumerangueLiberado = true;
        state.relicariosObtidos.mares = true;
        state.itensSecundariosObtidos.bumerangue_mares = true;
        if (!state.itemEquipado) {
          state.itemEquipado = 'bumerangue_mares';
        }
        state.notificacaoTexto = 'RELICÁRIO DAS MARÉS PURIFICADO!';
        state.notificacaoTimer = 3.5;
        soundManager.playSanctuaryPurified();
      }
    }
    return;
  }

  // Se a sala estiver inundada (ao chegar a 1 emersão restante), desacelera herói
  if (boss.salaInundada) {
    boss.inundacaoTimer -= dt;
    state.heroi.velocidade = HERO_SWAMP_SPEED; // 50px/s
    if (boss.inundacaoTimer <= 0) {
      boss.salaInundada = false;
      state.heroi.velocidade = HERO_BASE_SPEED;
    }
  }

  // Ciclo Submerso / Emerso
  boss.cicloTimer -= dt;

  if (boss.estado === 'submerso') {
    // Move a sombra submersa suavemente pela arena
    const hx = state.heroi.x;
    const hy = state.heroi.y;
    const sdx = hx - boss.alvoSombraX;
    const sdy = hy - boss.alvoSombraY;
    const sdist = Math.sqrt(sdx * sdx + sdy * sdy);
    if (sdist > 10) {
      boss.alvoSombraX += (sdx / sdist) * 35 * dt;
      boss.alvoSombraY += (sdy / sdist) * 35 * dt;
    }

    if (boss.cicloTimer <= 0) {
      // Emerge agora!
      boss.estado = 'emerso';
      boss.cicloTimer = 2.0; // Fica vulnerável por 2s
      boss.x = Math.max(32, Math.min(192, boss.alvoSombraX - boss.w / 2));
      boss.y = Math.max(32, Math.min(160, boss.alvoSombraY - boss.h / 2));
      soundManager.playWaterSplash();

      // Disparar jato d'água em leque de 5 projéteis a 100px/s
      dispararJatoAguaLeque(state, boss.x + boss.w / 2, boss.y + boss.h / 2);
    }
  } else if (boss.estado === 'emerso') {
    if (boss.cicloTimer <= 0 || boss.acertosEmersaoAtual >= 4) {
      // Submerge de volta
      boss.estado = 'submerso';
      boss.cicloTimer = 4.0; // Fica submerso por 4s
      boss.acertosEmersaoAtual = 0;
      soundManager.playWaterSplash();

      // Se restou exatamente 1 emersão para vencer (8 acertos de 12 feitos)
      if (boss.emersoesVencidas === 2 && !boss.salaInundada && boss.hp > 0) {
        boss.salaInundada = true;
        boss.inundacaoTimer = 3.0; // Chão vira água rasa por 3s antes da emersão final
        soundManager.playWaterSplash();
      }
    }
  }

  // Dano ao herói por contato direto com Marejante emerso
  if (boss.estado === 'emerso' && (!state.heroi.iframes || state.heroi.iframes <= 0)) {
    const heroHit: Retangulo = {
      x: state.heroi.x,
      y: state.heroi.y,
      w: state.heroi.w,
      h: state.heroi.h,
    };
    const bossHit: Retangulo = {
      x: boss.x + 4,
      y: boss.y + 4,
      w: boss.w - 8,
      h: boss.h - 8,
    };
    if (checkAABB(heroHit, bossHit)) {
      state.heroi.iframes = 0.8;
      state.vidaAtual = Math.max(0, state.vidaAtual - 1);
      soundManager.playHeroHurt();
    }
  }
}

export function aplicarDanoChefeMarejante(state: GameState): boolean {
  const boss = state.chefeMarejante;
  if (
    !boss.ativo ||
    boss.derrotado ||
    boss.estado !== 'emerso' ||
    boss.iframeTimer > 0
  ) {
    return false;
  }

  boss.iframeTimer = 0.25;
  boss.acertosEmersaoAtual += 1;
  boss.hp = Math.max(0, boss.hp - 1);
  soundManager.playEnemyHit();

  if (boss.acertosEmersaoAtual >= 4) {
    boss.emersoesVencidas += 1;
  }

  if (boss.hp <= 0 || boss.emersoesVencidas >= 3) {
    // Marejante derrotado!
    boss.derrotado = true;
    boss.estado = 'derrotado';
    boss.cutsceneClarearAguaTimer = 2.0; // Cutscene de 2s clareando a água
    soundManager.playBossDefeat();
    state.notificacaoTexto = 'MAREJANTE DERROTADO!';
    state.notificacaoTimer = 2.5;
  }

  return true;
}

function dispararJatoAguaLeque(state: GameState, originX: number, originY: number) {
  const hx = state.heroi.x + state.heroi.w / 2;
  const hy = state.heroi.y + state.heroi.h / 2;
  const baseAng = Math.atan2(hy - originY, hx - originX);
  const SPEED = 100; // 100px/s conforme especificado

  // 5 projéteis em leque: -30°, -15°, 0°, +15°, +30° (-0.52, -0.26, 0, +0.26, +0.52 rad)
  const offsets = [-0.48, -0.24, 0, 0.24, 0.48];
  offsets.forEach((off, idx) => {
    const ang = baseAng + off;
    state.projeteisAgua.push({
      id: `agua_${Date.now()}_${idx}`,
      x: originX,
      y: originY,
      vx: Math.cos(ang) * SPEED,
      vy: Math.sin(ang) * SPEED,
      raio: 3.5,
      ativo: true,
      tempoVida: 2.2,
    });
  });
}

export function atualizarProjeteisAgua(
  projeteis: ProjetilAgua[],
  heroi: HeroState,
  state: GameState,
  dt: number
) {
  for (let i = projeteis.length - 1; i >= 0; i--) {
    const p = projeteis[i];
    if (!p.ativo) {
      projeteis.splice(i, 1);
      continue;
    }

    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.tempoVida -= dt;

    if (
      p.tempoVida <= 0 ||
      p.x < 16 ||
      p.x > 240 ||
      p.y < 16 ||
      p.y > 208
    ) {
      p.ativo = false;
      projeteis.splice(i, 1);
      continue;
    }

    // Colisão com o Herói
    const distHero = Math.sqrt(
      Math.pow(p.x - (heroi.x + heroi.w / 2), 2) +
      Math.pow(p.y - (heroi.y + heroi.h / 2), 2)
    );

    if (distHero <= p.raio + 6 && (!heroi.iframes || heroi.iframes <= 0)) {
      p.ativo = false;
      heroi.iframes = 0.8;
      state.vidaAtual = Math.max(0, state.vidaAtual - 1);
      soundManager.playHeroHurt();
      projeteis.splice(i, 1);
    }
  }
}

// ------------------------------------------------------------------
// RENDERIZAÇÃO GRÁFICA DO SANTUÁRIO DAS ÁGUAS TURVAS
// Visual: pedra encharcada (#2a3a2a) com poças refletindo levemente
// ------------------------------------------------------------------

export function renderizarTerrenoAguasTurvas(
  ctx: CanvasRenderingContext2D,
  sala: Room,
  animTime: number
) {
  // 1. Chão de pedra encharcada e poças refletindo
  for (let r = 0; r < 14; r++) {
    for (let c = 0; c < 16; c++) {
      const tile = sala.grid[r][c];
      const tx = c * 16;
      const ty = r * 16;

      if (tile === 0) {
        // Chão de pedra encharcada (#2a3a2a com variações de musgo escuro)
        const check = (r + c) % 2 === 0;
        ctx.fillStyle = check ? '#2a3a2a' : '#233023';
        ctx.fillRect(tx, ty, 16, 16);

        // Textura úmida
        ctx.fillStyle = 'rgba(15, 23, 15, 0.4)';
        ctx.fillRect(tx + 1, ty + 1, 14, 1);
        ctx.fillRect(tx + 1, ty + 14, 14, 1);

        // Poças refletindo levemente a cada poucos tiles
        if ((r * 7 + c * 13) % 9 === 0) {
          const reflectPulse = 0.2 + Math.sin(animTime * 2 + r + c) * 0.08;
          ctx.fillStyle = `rgba(56, 189, 248, ${reflectPulse.toFixed(2)})`;
          ctx.beginPath();
          ctx.ellipse(tx + 8, ty + 8, 5, 3, 0, 0, Math.PI * 2);
          ctx.fill();

          // Ponto de brilho especular
          ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.fillRect(tx + 7, ty + 7, 2, 1);
        }
      } else if (tile === 1) {
        // Parede sólida de pedra pantanosa com limo escuro
        ctx.fillStyle = '#1c281c';
        ctx.fillRect(tx, ty, 16, 16);

        ctx.fillStyle = '#324632';
        ctx.fillRect(tx + 1, ty + 1, 14, 2);
        ctx.fillStyle = '#121a12';
        ctx.fillRect(tx + 1, ty + 14, 14, 2);

        ctx.strokeStyle = '#182218';
        ctx.lineWidth = 1;
        ctx.strokeRect(tx + 0.5, ty + 0.5, 15, 15);
      } else if (tile === 2) {
        // Fosso / Água profunda escura do Santuário com ondulação
        const wave = Math.sin(animTime * 3 + r * 0.8 + c * 0.5) * 1.5;
        ctx.fillStyle = '#0f1d1f';
        ctx.fillRect(tx, ty, 16, 16);

        ctx.fillStyle = '#13282b';
        ctx.fillRect(tx, ty + 3 + wave, 16, 4);

        ctx.fillStyle = 'rgba(45, 212, 191, 0.15)';
        ctx.fillRect(tx + 2, ty + 4 + wave, 8, 1);
      } else if (tile === 3) {
        // Pilar ceremonial de pedra com chama azul mística
        ctx.fillStyle = '#1e2b1e';
        ctx.fillRect(tx + 2, ty + 2, 12, 12);
        ctx.strokeStyle = '#0d150d';
        ctx.strokeRect(tx + 2.5, ty + 2.5, 11, 11);

        // Chama azul ondulante
        const flick = Math.sin(animTime * 10 + c * 3) * 1.2;
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(tx + 8, ty + 8 + flick * 0.5, 3.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#e0f2fe';
        ctx.beginPath();
        ctx.arc(tx + 8, ty + 8, 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

export function renderizarPlataformasAfundando(
  ctx: CanvasRenderingContext2D,
  plataformas: PlataformaAfundando[],
  salaId: string,
  animTime: number
) {
  const prefix =
    salaId === 'aguas_puzzle_1'
      ? 'plat_puz1'
      : salaId === 'aguas_puzzle_2'
      ? 'plat_puz2'
      : '';
  if (!prefix) return;

  for (const plat of plataformas) {
    if (!plat.id.startsWith(prefix)) continue;
    if (plat.estado === 'submersa') {
      // Pequenas bolhas de água onde afundou
      const bub = Math.sin(animTime * 4 + plat.x) * 2;
      ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.beginPath();
      ctx.arc(plat.x + plat.w / 2 + bub, plat.y + plat.h / 2, 2.5, 0, Math.PI * 2);
      ctx.fill();
      continue;
    }

    const alpha = Math.max(0.2, 1.0 - plat.profundidade * 0.8);
    const sinkY = plat.profundidade * 4;

    ctx.save();
    ctx.globalAlpha = alpha;

    // Sombra na água
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.fillRect(plat.x + 1, plat.y + 2 + sinkY, plat.w, plat.h);

    // Plataforma de pedra encharcada com lótus talhado
    ctx.fillStyle = plat.estado === 'afundando' ? '#3d523d' : '#4a634a';
    ctx.fillRect(plat.x, plat.y + sinkY, plat.w, plat.h);

    ctx.strokeStyle = '#223222';
    ctx.lineWidth = 1;
    ctx.strokeRect(plat.x + 0.5, plat.y + 0.5 + sinkY, plat.w - 1, plat.h - 1);

    // Relevo talhado da flor de lótus no centro
    ctx.fillStyle = '#65a30d';
    ctx.fillRect(plat.x + plat.w / 2 - 3, plat.y + plat.h / 2 - 3 + sinkY, 6, 6);
    ctx.fillStyle = '#bef264';
    ctx.fillRect(plat.x + plat.w / 2 - 1, plat.y + plat.h / 2 - 1 + sinkY, 2, 2);

    // Efeito de água invadindo as bordas ao afundar
    if (plat.profundidade > 0.2) {
      ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
      ctx.strokeRect(plat.x + 1.5, plat.y + 1.5 + sinkY, plat.w - 3, plat.h - 3);
    }

    ctx.restore();
  }
}

export function renderizarInimigosAguasTurvas(
  ctx: CanvasRenderingContext2D,
  inimigos: InimigoEntidade[],
  animTime: number
) {
  for (const ini of inimigos) {
    if (!ini.vivo) continue;

    // Pisca em frames se estiver com iframes
    if (ini.iframeTimer > 0 && Math.floor(ini.iframeTimer * 16) % 2 === 0) {
      continue;
    }

    if (ini.tipo === 'sapo_lodo') {
      const rx = Math.round(ini.x);
      const ry = Math.round(ini.y - (ini.alturaSalto || 0));

      // Sombra projetada no chão
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.beginPath();
      ctx.ellipse(rx + 8, ini.y + 12, 7, 3, 0, 0, Math.PI * 2);
      ctx.fill();

      // Corpo do Sapo-Lodo (verde-lodo #3f5e34)
      ctx.fillStyle = '#3f5e34';
      ctx.fillRect(rx + 2, ry + 3, 12, 9);
      ctx.fillStyle = '#5c804c';
      ctx.fillRect(rx + 4, ry + 2, 8, 4);

      // Barriga bege
      ctx.fillStyle = '#c2b280';
      ctx.fillRect(rx + 4, ry + 8, 8, 4);

      // Olhos amarelos proeminentes no topo
      ctx.fillStyle = '#eab308';
      ctx.fillRect(rx + 2, ry + 1, 3, 3);
      ctx.fillRect(rx + 11, ry + 1, 3, 3);
      ctx.fillStyle = '#000000';
      ctx.fillRect(rx + 3, ry + 2, 1, 2);
      ctx.fillRect(rx + 12, ry + 2, 1, 2);

      // Pernas traseiras
      ctx.fillStyle = '#2f4926';
      if (ini.saltando) {
        // Pernas esticadas ao saltar
        ctx.fillRect(rx, ry + 10, 3, 4);
        ctx.fillRect(rx + 13, ry + 10, 3, 4);
      } else {
        // Pernas dobradas em repouso
        ctx.fillRect(rx + 1, ry + 7, 3, 5);
        ctx.fillRect(rx + 12, ry + 7, 3, 5);
      }
    } else if (ini.tipo === 'libelula_turva') {
      const rx = Math.round(ini.x);
      const ry = Math.round(ini.y);

      // Sombra sutil voadora
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.beginPath();
      ctx.ellipse(rx + 7, ry + 14, 5, 2, 0, 0, Math.PI * 2);
      ctx.fill();

      // Corpo comprido fino da libélula (#0284c7)
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(rx + 6, ry + 4, 2, 8);
      ctx.fillStyle = '#0ea5e9';
      ctx.fillRect(rx + 5, ry + 2, 4, 3); // Cabeça

      // Asas duplas translúcidas batendo em alta frequência
      const flap = Math.sin(animTime * 30) * 3;
      ctx.fillStyle = 'rgba(224, 242, 254, 0.75)';
      // Asa superior esquerda e direita
      ctx.fillRect(rx + 1, ry + 4 + flap * 0.4, 5, 2);
      ctx.fillRect(rx + 8, ry + 4 - flap * 0.4, 5, 2);
      // Asa inferior
      ctx.fillRect(rx + 2, ry + 7 - flap * 0.4, 4, 1);
      ctx.fillRect(rx + 8, ry + 7 + flap * 0.4, 4, 1);

      // Olhos pretos da libélula
      ctx.fillStyle = '#000000';
      ctx.fillRect(rx + 5, ry + 2, 1, 1);
      ctx.fillRect(rx + 8, ry + 2, 1, 1);
    }
  }
}

export function renderizarChefeMarejante(
  ctx: CanvasRenderingContext2D,
  boss: MarejanteBossState,
  animTime: number
) {
  if (!boss.ativo) return;

  if (boss.estado === 'submerso') {
    // Sombra escura oval sob a água com ondulações concêntricas
    const sx = Math.round(boss.alvoSombraX);
    const sy = Math.round(boss.alvoSombraY);

    ctx.fillStyle = 'rgba(5, 15, 18, 0.55)';
    ctx.beginPath();
    ctx.ellipse(sx, sy, 22, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    // Ondulações na água da sombra
    const waveR = 20 + Math.sin(animTime * 4) * 4;
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(sx, sy, waveR, waveR * 0.6, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Bolhas subindo
    const bub = Math.sin(animTime * 6) * 3;
    ctx.fillStyle = 'rgba(224, 242, 254, 0.5)';
    ctx.beginPath();
    ctx.arc(sx + bub, sy - 4, 2, 0, Math.PI * 2);
    ctx.arc(sx - bub, sy + 3, 1.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (boss.estado === 'emerso') {
    // Pisca quando sofre golpe
    if (boss.iframeTimer > 0 && Math.floor(boss.iframeTimer * 16) % 2 === 0) {
      return;
    }

    const bx = Math.round(boss.x);
    const by = Math.round(boss.y);

    // Respingos ao redor da base
    ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.beginPath();
    ctx.ellipse(bx + boss.w / 2, by + boss.h - 2, boss.w / 2 + 6, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Corpo do Marejante (Leviatã/Serpente do Lodo encouraçado com barbatanas)
    ctx.fillStyle = '#064e3b';
    ctx.fillRect(bx + 4, by + 4, boss.w - 8, boss.h - 6);

    ctx.fillStyle = '#047857';
    ctx.fillRect(bx + 6, by + 2, boss.w - 12, boss.h - 10);

    // Placas dorsais de concha aquática
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(bx + 8, by + 6, boss.w - 16, 4);
    ctx.fillRect(bx + 10, by + 13, boss.w - 20, 4);
    ctx.fillRect(bx + 12, by + 20, boss.w - 24, 4);

    // Olhos brilhantes dourados corruptos
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(bx + 8, by + 8, 4, 4);
    ctx.fillRect(bx + boss.w - 12, by + 8, 4, 4);
    ctx.fillStyle = '#b45309';
    ctx.fillRect(bx + 10, by + 9, 2, 2);
    ctx.fillRect(bx + boss.w - 10, by + 9, 2, 2);

    // Boca com dentes afiados
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(bx + 12, by + 22, boss.w - 24, 6);
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(bx + 13, by + 22, 2, 3);
    ctx.fillRect(bx + 17, by + 22, 2, 3);
    ctx.fillRect(bx + 21, by + 22, 2, 3);

    // Barbatanas laterais animadas
    const finFlap = Math.sin(animTime * 8) * 2;
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.moveTo(bx + 2, by + 12);
    ctx.lineTo(bx - 6 + finFlap, by + 18);
    ctx.lineTo(bx + 4, by + 22);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(bx + boss.w - 2, by + 12);
    ctx.lineTo(bx + boss.w + 6 - finFlap, by + 18);
    ctx.lineTo(bx + boss.w - 4, by + 22);
    ctx.fill();

    // Barra de Vida do Chefe no topo da tela (12 segmentos de HP)
    renderizarBarraVidaMarejante(ctx, boss);
  }

  // Efeito de sala inundada com água rasa (quando falta 1 emersão)
  if (boss.salaInundada) {
    ctx.fillStyle = 'rgba(14, 116, 144, 0.28)';
    ctx.fillRect(16, 16, 224, 192);

    // Linhas de ondulação da inundação
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
    ctx.lineWidth = 1;
    for (let ly = 32; ly < 200; ly += 24) {
      const off = Math.sin(animTime * 3 + ly) * 6;
      ctx.beginPath();
      ctx.moveTo(20, ly + off);
      ctx.lineTo(236, ly + off);
      ctx.stroke();
    }
  }

  // Cutscene de 2s do Santuário clareando a água
  if (boss.derrotado && boss.cutsceneClarearAguaTimer > 0) {
    const prog = 1 - boss.cutsceneClarearAguaTimer / 2.0; // 0 a 1
    // Clareamento da água com azul celestial
    ctx.fillStyle = `rgba(56, 189, 248, ${(prog * 0.55).toFixed(2)})`;
    ctx.fillRect(0, 0, 256, 224);

    // Feixes de luz verticais divinos
    ctx.fillStyle = `rgba(255, 255, 255, ${(prog * 0.4).toFixed(2)})`;
    ctx.fillRect(60, 0, 28, 224);
    ctx.fillRect(114, 0, 32, 224);
    ctx.fillRect(170, 0, 28, 224);
  }

  // Pedestal do Bumerangue das Marés e Relicário liberados após a vitória
  if (boss.derrotado && boss.bumerangueLiberado) {
    // Pedestal sagrado no centro
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(128 - 14, 104, 28, 16);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1;
    ctx.strokeRect(128 - 13.5, 104.5, 27, 15);

    // Ícone flutuante do Bumerangue das Marés
    const floatY = Math.sin(animTime * 3) * 2;
    renderizarIconeBumerangue(ctx, 128, 92 + floatY, animTime);
  }
}

function renderizarBarraVidaMarejante(ctx: CanvasRenderingContext2D, boss: MarejanteBossState) {
  const barW = 120;
  const barH = 5;
  const barX = 128 - barW / 2;
  const barY = 16;

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(barX - 2, barY - 2, barW + 4, barH + 4);
  ctx.strokeStyle = '#0284c7';
  ctx.lineWidth = 1;
  ctx.strokeRect(barX - 1.5, barY - 1.5, barW + 3, barH + 3);

  // HP preenchido
  const hpRatio = boss.hp / boss.hpMax;
  ctx.fillStyle = '#06b6d4';
  ctx.fillRect(barX, barY, Math.floor(barW * hpRatio), barH);

  // Rótulo
  ctx.font = 'bold 6px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#bae6fd';
  ctx.fillText('MAREJANTE • GUARDIÃO DAS ÁGUAS', 128, barY - 4);
}

export function renderizarProjeteisAgua(
  ctx: CanvasRenderingContext2D,
  projeteis: ProjetilAgua[]
) {
  for (const p of projeteis) {
    if (!p.ativo) continue;

    const px = Math.round(p.x);
    const py = Math.round(p.y);

    // Brilho exterior da gota d'água
    ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.beginPath();
    ctx.arc(px, py, p.raio + 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Núcleo do projétil aquático
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(px, py, p.raio, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#e0f2fe';
    ctx.beginPath();
    ctx.arc(px - 1, py - 1, 1.2, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function renderizarBumerangue(
  ctx: CanvasRenderingContext2D,
  bumerangue: BumerangueVooState
) {
  if (!bumerangue.ativo) return;

  ctx.save();
  ctx.translate(bumerangue.x, bumerangue.y);
  ctx.rotate(bumerangue.angulo);

  // Rastro de vento em arco
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, 7, 0, Math.PI * 1.4);
  ctx.stroke();

  // Bumerangue em V / arco 16-bit (#0284c7 com pontas douradas #fbbf24)
  ctx.strokeStyle = '#0284c7';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-6, -4);
  ctx.lineTo(0, 4);
  ctx.lineTo(6, -4);
  ctx.stroke();

  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-5, -3);
  ctx.lineTo(0, 3);
  ctx.lineTo(5, -3);
  ctx.stroke();

  // Pontas douradas
  ctx.fillStyle = '#fbbf24';
  ctx.fillRect(-7, -5, 2, 2);
  ctx.fillRect(5, -5, 2, 2);

  ctx.restore();
}

function renderizarIconeBumerangue(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  animTime: number
) {
  ctx.save();
  ctx.translate(cx, cy);
  const rot = Math.sin(animTime * 2) * 0.2;
  ctx.rotate(rot);

  // Brilho místico
  ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
  ctx.beginPath();
  ctx.arc(0, 0, 10, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#0284c7';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-7, -4);
  ctx.lineTo(0, 5);
  ctx.lineTo(7, -4);
  ctx.stroke();

  ctx.strokeStyle = '#bae6fd';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-6, -3);
  ctx.lineTo(0, 4);
  ctx.lineTo(6, -3);
  ctx.stroke();

  ctx.fillStyle = '#fbbf24';
  ctx.fillRect(-8, -5, 2, 2);
  ctx.fillRect(6, -5, 2, 2);

  ctx.restore();
}

// ------------------------------------------------------------------
// RENDERIZAÇÃO COMPLETA DA DUNGEON: SANTUÁRIO DAS ÁGUAS TURVAS
// ------------------------------------------------------------------

export function renderizarPortaAguas(ctx: CanvasRenderingContext2D, porta: PortaDungeon) {
  if (porta.estado === 'aberta') {
    ctx.fillStyle = '#111827';
    ctx.fillRect(porta.x, porta.y, porta.w, porta.h);

    // Soleira de pedra encharcada iluminada
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 1;
    ctx.strokeRect(porta.x + 0.5, porta.y + 0.5, porta.w - 1, porta.h - 1);
    return;
  }

  // Porta fechada de pedra encharcada
  ctx.fillStyle = '#1e2d1e';
  ctx.fillRect(porta.x, porta.y, porta.w, porta.h);
  ctx.strokeStyle = '#0d170d';
  ctx.lineWidth = 1;
  ctx.strokeRect(porta.x + 0.5, porta.y + 0.5, porta.w - 1, porta.h - 1);

  const cx = porta.x + porta.w / 2;
  const cy = porta.y + porta.h / 2;

  if (porta.estado === 'trancada_comum') {
    // Grade de ferro com cadeado de bronze antigo
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(porta.x + 3, porta.y + 2, porta.w - 6, porta.h - 4);

    ctx.fillStyle = '#d97706';
    ctx.fillRect(cx - 3, cy - 2, 6, 5);
    ctx.fillStyle = '#451a03';
    ctx.fillRect(cx - 1, cy - 1, 2, 2);
  } else if (porta.estado === 'trancada_chefe') {
    // Portal de água monumental com selo aquático
    ctx.fillStyle = '#0369a1';
    ctx.fillRect(porta.x + 2, porta.y + 2, porta.w - 4, porta.h - 4);

    // Selo das Marés
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#e0f2fe';
    ctx.fillRect(cx - 1, cy - 1, 2, 2);
  } else if (porta.estado === 'fechada_alavanca') {
    // Grade de eclusa submersa
    ctx.fillStyle = '#334155';
    for (let gx = porta.x + 3; gx < porta.x + porta.w - 3; gx += 3) {
      ctx.fillRect(gx, porta.y + 2, 1.5, porta.h - 4);
    }
  }
}

export function renderizarBauAguas(
  ctx: CanvasRenderingContext2D,
  bau: BauDungeon,
  animTime: number
) {
  const x = bau.x;
  const y = bau.y;

  if (!bau.aberto) {
    // Baú fechado com musgo e ferragens de latão
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(x + 1, y + 4, 14, 11);

    ctx.fillStyle = '#0284c7';
    ctx.fillRect(x + 1, y + 4, 2, 11);
    ctx.fillRect(x + 13, y + 4, 2, 11);

    // Tampa
    ctx.fillStyle = '#334155';
    ctx.fillRect(x + 1, y + 2, 14, 4);

    // Fechadura reluzente
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(x + 7, y + 7, 2, 3);

    // Brilho pulsante
    const pulse = 0.2 + Math.sin(animTime * 4) * 0.15;
    ctx.fillStyle = `rgba(56, 189, 248, ${pulse.toFixed(2)})`;
    ctx.fillRect(x + 5, y + 6, 6, 5);
  } else {
    // Baú aberto
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(x + 1, y + 7, 14, 8);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(x + 1, y + 1, 14, 4);
  }

  ctx.strokeStyle = '#020617';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 1.5, 15, 13);
}

export function renderizarAlavancaAguas(
  ctx: CanvasRenderingContext2D,
  alavanca: AlavancaDungeon
) {
  // Base de pedra
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(alavanca.x + 2, alavanca.y + 8, 10, 5);
  ctx.strokeStyle = '#020617';
  ctx.lineWidth = 1;
  ctx.strokeRect(alavanca.x + 2.5, alavanca.y + 8.5, 9, 4);

  const cx = alavanca.x + 7;
  const cy = alavanca.y + 10;

  ctx.lineWidth = 2;
  ctx.strokeStyle = alavanca.ativada ? '#38bdf8' : '#64748b';
  ctx.beginPath();
  ctx.moveTo(cx, cy);

  const knX = alavanca.ativada ? cx + 5 : cx - 5;
  const knY = cy - 8;
  ctx.lineTo(knX, knY);
  ctx.stroke();

  // Manopla
  ctx.fillStyle = alavanca.ativada ? '#0284c7' : '#94a3b8';
  ctx.beginPath();
  ctx.arc(knX, knY, 2.5, 0, Math.PI * 2);
  ctx.fill();
}

function renderHeroiAguas(ctx: CanvasRenderingContext2D, heroi: HeroState) {
  renderizarHeroiRen(ctx, heroi, !!heroi.andando);
}

function renderHUDDungeonSala(ctx: CanvasRenderingContext2D, sala: Room) {
  ctx.fillStyle = 'rgba(15, 23, 15, 0.75)';
  ctx.fillRect(4, 3, 160, 14);
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 0.5;
  ctx.strokeRect(4.5, 3.5, 159, 13);

  ctx.font = 'bold 7px "Courier New", monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#7dd3fc';
  ctx.fillText(sala.nome, 8, 6);
}

export function renderDungeonAguasTurvas(
  ctx: CanvasRenderingContext2D,
  dungeon: Dungeon,
  state: GameState,
  animTime: number
) {
  const sala = dungeon.salas[state.dungeonSalaAtualId];
  if (!sala) return;

  // 1. Terreno de pedra encharcada (#2a3a2a) e poças refletindo levemente
  renderizarTerrenoAguasTurvas(ctx, sala, animTime);

  // 2. Pontes retráteis ativadas
  for (const ponte of sala.pontesRetrateis) {
    if (ponte.ativa) {
      ctx.fillStyle = '#3a4e3a';
      ctx.fillRect(ponte.x, ponte.y, ponte.w, ponte.h);
      ctx.strokeStyle = '#233323';
      ctx.lineWidth = 1;
      ctx.strokeRect(ponte.x + 0.5, ponte.y + 0.5, ponte.w - 1, ponte.h - 1);

      ctx.fillStyle = '#78350f';
      ctx.fillRect(ponte.x, ponte.y, 4, ponte.h);
      ctx.fillRect(ponte.x + ponte.w - 4, ponte.y, 4, ponte.h);
      for (let py = ponte.y + 4; py < ponte.y + ponte.h; py += 6) {
        ctx.fillStyle = '#1c1917';
        ctx.fillRect(ponte.x + 4, py, ponte.w - 8, 1);
      }
    }
  }

  // 3. Plataformas que afundam (mecânica única: 1s pisou, 3s afunda, 2s vazia reaparece)
  renderizarPlataformasAfundando(ctx, state.plataformasDungeon, state.dungeonSalaAtualId, animTime);

  // 4. Portas da Sala
  for (const porta of sala.portas) {
    renderizarPortaAguas(ctx, porta);
  }

  // 5. Baús
  for (const bau of sala.baus) {
    renderizarBauAguas(ctx, bau, animTime);
  }

  // 6. Alavancas (incluindo a alavanca remota do Bumerangue)
  for (const alavanca of sala.alavancas) {
    renderizarAlavancaAguas(ctx, alavanca);
  }

  // 7. Chefe Marejante (na Sala-Chefe: Covil do Marejante)
  if (state.dungeonSalaAtualId === 'aguas_chefe_marejante') {
    renderizarChefeMarejante(ctx, state.chefeMarejante, animTime);
    renderizarProjeteisAgua(ctx, state.projeteisAgua);
  }

  // 8. Inimigos da sala (Sapo-Lodo e Libélula Turva)
  if (sala.inimigos && sala.inimigos.length > 0) {
    renderizarInimigosAguasTurvas(ctx, sala.inimigos, animTime);
  }

  // 9. Herói Ren e Ataque da Lâmina de Eldrim
  renderHeroiAguas(ctx, state.heroi);
  renderizarEspada(ctx, state.heroi);

  // 10. Bumerangue das Marés em voo
  renderizarBumerangue(ctx, state.bumerangueAnim);

  // 11. Partículas de combate
  renderizarParticulas(ctx, state.particulas);

  // 12. Título da câmara no HUD superior
  renderHUDDungeonSala(ctx, sala);
}
