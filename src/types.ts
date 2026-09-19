export enum EstadoJogo {
  BOOT = 'BOOT',
  SPLASH = 'SPLASH',
  TITULO = 'TITULO',
  CINEMATICA = 'CINEMATICA',
  MENU = 'MENU',
  OVERWORLD = 'OVERWORLD',
  DUNGEON = 'DUNGEON',
  PAUSA = 'PAUSA',
  GAMEOVER = 'GAMEOVER',
  VITORIA = 'VITORIA',
}

export type Direcao = 'cima' | 'baixo' | 'esquerda' | 'direita';

export type ItemSecundarioId =
  | 'gancho_vinha'
  | 'bumerangue_mares'
  | 'botas_glaciais'
  | 'manopla_ignea'
  | 'talisma_terra'
  | 'lanterna_sombras';

export type PausaSubtela = 'menu' | 'mapa' | 'inventario' | 'itens_chave';

export interface Retangulo {
  x: number;
  y: number;
  w: number;
  h: number;
  cor?: string;
  rotulo?: string;
}

export interface HeroState {
  x: number;
  y: number;
  w: number;
  h: number;
  direcao: Direcao;
  velocidade: number; // px/s
  // Combate da Lâmina de Eldrim
  atacando?: boolean;
  ataqueTimer?: number; // ativo por 200ms
  ataqueHitbox?: Retangulo | null; // retângulo ~10x10px à frente
  iframes?: number; // 800ms após dano
  knockbackTimer?: number;
  knockbackVx?: number;
  knockbackVy?: number;
  // Golpe Carregado (segurar Z por 1s)
  carregandoGolpe?: boolean;
  cargaGolpeTimer?: number; // 0 até 1.0s
  golpePronto?: boolean; // true quando cargaGolpeTimer >= 1.0
  ataqueCarregado?: boolean; // true durante o golpe de 200ms desferido
  andando?: boolean;
  // Deslizamento no gelo liso (Terras Geladas)
  deslizamentoTimer?: number; // 0.4s de inércia ao soltar teclas sobre gelo
  deslizamentoVx?: number;
  deslizamentoVy?: number;
}

export type TipoInimigo =
  | 'espinho_rastejante'
  | 'vagalume_sombrio'
  | 'sapo_lodo'
  | 'libelula_turva'
  | 'rastejante_gelo'
  | 'coruja_glacial'
  | 'escorpiao_areia'
  | 'serpente_dunas'
  | 'mumia_fogo';

export interface InimigoEntidade {
  id: string;
  tipo: TipoInimigo;
  x: number;
  y: number;
  w: number;
  h: number;
  hp: number;
  hpMax: number;
  direcao: Direcao;
  velocidade: number; // 40px/s para espinho, 50px/s para vagalume, 30px/s para sapo, 60px/s para libelula, 35px/s rastejante, 70px/s coruja
  iframeTimer: number; // 300ms ao ser atingido
  vivo: boolean;
  // Específico para Espinho Rastejante:
  timerTrocaDirecao?: number;
  // Específico para Vagalume Sombrio:
  tempoSeno?: number;
  baseX?: number;
  baseY?: number;
  angulo?: number;
  // Específico para Sapo-Lodo:
  timerPulo?: number; // Pula a cada 1.5s
  saltando?: boolean;
  alturaSalto?: number;
  puloVx?: number;
  puloVy?: number;
  // Específico para Libélula Turva:
  zigueZagueTimer?: number; // Voo em zigue-zague a 60px/s
  voando?: boolean;
  // Específico para Rastejante de Gelo (3 HP, 35px/s, some sob a neve e reaparece):
  submerso?: boolean;
  submersoTimer?: number;
  reaparecerTimer?: number;
  // Específico para Coruja Glacial (2 HP, 70px/s, mergulha em direção ao herói e recua):
  estadoCoruja?: 'rondando' | 'rasante' | 'retornando';
  timerMergulho?: number;
  origX?: number;
  origY?: number;
  targetX?: number;
  targetY?: number;
}

export interface PlataformaAfundando {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  estado: 'firme' | 'afundando' | 'submersa' | 'reaparecendo';
  timerPiso: number; // 1s depois começa a afundar, 3s afunda totalmente
  timerVazia: number; // 2s vazia reaparece
  profundidade: number; // 0.0 (firme) a 1.0 (totalmente submersa)
  heroiSobre: boolean;
}

export interface ProjetilEstilhacoGelo {
  id: string;
  x: number;
  y: number;
  vx: number; // 110px/s
  vy: number;
  raio: number;
  ativo: boolean;
  tempoVida: number;
}

export interface GlaciusBossState {
  ativo: boolean;
  derrotado: boolean;
  x: number;
  y: number;
  w: number;
  h: number;
  hp: number; // 10 acertos totais (5 fases de atordoamento de 2 acertos)
  hpMax: number; // 10
  estado: 'preparando' | 'investida' | 'atordoado' | 'leque_estilhaços' | 'derrotado';
  direcaoInvestida: 'norte' | 'sul' | 'leste' | 'oeste' | null;
  vx: number;
  vy: number;
  atordoadoTimer: number; // 2.0s de atordoamento ao colidir com parede (estrelinhas)
  acertosNoAtordoamentoAtual: number; // máx 2 acertos por atordoamento
  investidasAtordoadasAcertadas: number; // 5 necessárias
  prepTimer: number; // 1.0s de sinalização antes de deslizar
  estilhacosDisparados: boolean;
  iframeTimer: number; // 0.3s
  cutsceneVitoriaTimer: number;
  botasGlaciaisLiberadas: boolean;
  relicarioLiberado: boolean;
  particulasGelo?: { x: number; y: number; vx: number; vy: number; tamanho: number; cor: string; vida: number }[];
}

export interface BumerangueVooState {
  ativo: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  startX: number;
  startY: number;
  distPercorrida: number;
  maxDist: number; // ~96px (6 tiles)
  fase: 'indo' | 'voltando';
  angulo: number;
  inimigosAtingidosIds?: string[]; // IDs dos inimigos atingidos nesta trajetória
  inimigosAtingidosQtd?: number; // Até 3 inimigos atingidos sem invalidar o item
}

export interface MarejanteBossState {
  ativo: boolean;
  derrotado: boolean;
  x: number;
  y: number;
  w: number;
  h: number;
  hp: number; // 12 total (4 por emersão)
  hpMax: number; // 12
  acertosEmersaoAtual: number; // 0 a 4
  emersoesVencidas: number; // 0 a 3
  estado: 'submerso' | 'emergindo' | 'emerso' | 'submergindo' | 'derrotado';
  cicloTimer: number; // submerso por 4s, emerso por 2s
  disparoTimer: number; // jato em leque de 5 projéteis (100px/s)
  alvoSombraX: number;
  alvoSombraY: number;
  salaInundada: boolean; // Ao restar 1 emersão, inunda chão com água rasa por 3s
  inundacaoTimer: number; // 3.0s
  cutsceneClarearAguaTimer: number; // 2.0s de clareamento do santuário
  bumerangueLiberado: boolean;
  relicarioLiberado: boolean;
  iframeTimer: number;
  ondulacaoAnim: number;
}

export interface ParticulaQuadrada {
  x: number;
  y: number;
  vx: number;
  vy: number;
  tamanho: number; // 2 a 4px
  cor: string;
  tempoRestante: number;
  tempoTotal: number;
}

export interface ProjetilEspinho {
  id: string;
  x: number;
  y: number;
  vx: number; // 120px/s normalizado
  vy: number;
  raio: number;
  ativo: boolean;
  tempoVida: number;
}

export interface ProjetilAgua {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  raio: number;
  ativo: boolean;
  tempoVida: number;
}

export interface ProjetilBolaFogo {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  raio: number;
  ativo: boolean;
  tempoVida: number;
  tipo: 'bola' | 'magma_coluna';
}

export interface AshraBossState {
  ativo: boolean;
  derrotado: boolean;
  x: number;
  y: number;
  w: number;
  h: number;
  hp: number; // 12 HP max
  hpMax: number; // 12
  estado: 'teleportando' | 'canalizando' | 'atordoado' | 'disparando' | 'derrotado';
  posicaoPlataformaIndex: number; // 0: SupEsq, 1: SupDir, 2: InfEsq, 3: InfDir
  teleportTimer: number;
  canalizarTimer: number; // Canaliza tempestade vulcânica -> vulnerável à Manopla Ígnea!
  atordoadoTimer: number; // 2.5s
  disparoTimer: number;
  escudoChamas: boolean;
  iframeTimer: number;
  cutsceneVitoriaTimer: number;
  manoplaIgneaLiberada: boolean;
  relicarioLiberado: boolean;
  particulasFogo?: { x: number; y: number; vx: number; vy: number; tamanho: number; cor: string; vida: number }[];
}

export interface NucleoRaizarca {
  id: string;
  posicao: 'superior' | 'inferior_esquerda' | 'inferior_direita';
  x: number;
  y: number;
  w: number;
  h: number;
  hp: number; // 3 acertos
  hpMax: number; // 3
  destruido: boolean;
  iframeTimer: number; // 300ms
}

export interface RaizarcaBossState {
  ativo: boolean;
  derrotado: boolean;
  nucleos: [NucleoRaizarca, NucleoRaizarca, NucleoRaizarca];
  nucleoAtivoIndex: number; // 0, 1 ou 2
  rotacaoTimer: number; // Rotação a cada 4.0s
  telegraphTimer: number; // 0.5s de tremor antes de disparar
  telegraphPendenteDisparo: boolean;
  telegraphDisparosQtd: number; // 2 a 3 espinhos
  timerDisparoPeriodico: number; // Ataque a cada 5s
  desmoronarTimer: number; // 1.5s ao derrotar os 3 núcleos
  cutsceneLuzTimer: number; // 2.0s de fade branco-esverdeado
  ganchoLiberado: boolean;
  screenshakeTimer: number;
}

export type TipoRegiao = 'vale' | 'charco' | 'geladas' | 'kaal';

export interface DialogoState {
  ativo: boolean;
  npcNome: string;
  npcCargo?: string;
  falas: string[];
  falaAtualIndex: number;
  caracteresVisiveis: number;
  timerTypewriter: number;
  falaConcluida: boolean;
}

export interface LojaItem {
  id: string;
  nome: string;
  descricao: string;
  preco: number;
  icone: 'cura' | 'bomba';
}

export interface LojaState {
  ativa: boolean;
  nomeLoja: string;
  itemSelecionadoIndex: number; // 0: Frasco de Seiva, 1: Pacote de Bombas, 2: Sair
  itens: LojaItem[];
  mensagemFeedback?: string;
  mensagemFeedbackTimer?: number;
}

export interface CameraState {
  x: number;
  y: number;
}

export interface PontoGancho {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  rotulo?: string;
}

export interface GanchoAnimState {
  ativo: boolean;
  fase: 'puxando' | 'ativando_alavanca' | 'erro_recuo';
  startX: number;
  startY: number;
  destX: number;
  destY: number;
  alvoX: number;
  alvoY: number;
  progresso: number;
  tempoTotal: number;
  timer: number;
  direcao: Direcao;
  alvoTipo: 'ponto_gancho' | 'alavanca' | 'nenhum';
}

export interface GameState {
  estadoAtual: EstadoJogo;
  estadoAnterior: EstadoJogo; // Guarda o estado anterior (OVERWORLD ou DUNGEON) para retorno pós-pausa
  splashTimer: number;
  tituloTimer: number;
  tituloSubmenuAberto: boolean;
  tituloMenuIndex: number; // 0: Novo Jogo, 1: Continuar, 2: Opções
  tituloTelaOpcoes: boolean;
  opcaoSelecionada: number; // 0: Volume, 1: Controles, 2: Voltar
  volume: number; // 0 a 100
  arvoresOffset: number;
  cinematicaTimer: number;
  cinematicaQuadro: number; // 0 a 4 (5 quadros)
  cinematicaQuadroTimer: number; // segundos no quadro atual (para efeito typewriter de 40ms)
  temSave: boolean;
  heroi: HeroState;
  camera: CameraState;
  mapaLargura: number;
  mapaAltura: number;
  obstaculos: Retangulo[];

  // Região Atual do Overworld ('vale' = Vale Verdejante, 'charco' = Charco Sombrio)
  regiaoAtual: TipoRegiao;
  charcoFogOffset: number; // Deslocamento contínuo da névoa em loop

  // Diálogo & Loja Ativos no Overworld
  dialogoAtivo: DialogoState | null;
  lojaAtiva: LojaState | null;

  // Overworld & Navegação 3x3 (768x672px)
  telaAtualX: number; // 0, 1, 2
  telaAtualY: number; // 0, 1, 2
  transicaoFadeTimer: number; // Temporizador do fade de 0.3s ao cruzar telas
  coletavelVidaColetado: boolean; // Persistência do coletável de vida (+1 Vida Máxima)
  bauIlhaBosqueAberto: boolean; // Baú secundário na ilha do vão de 3 tiles
  arvoreCriptaDestruida: boolean; // Árvore ancestral do Bosque Noroeste destruída com golpe carregado
  criptaUpgradeColetado: boolean; // Baú de +1 Vida Máxima da Cripta do Guardião Adormecido coletado
  covilAfogadoUpgradeColetado: boolean; // Baú de +10 Fluxo Arcano Máximo do Covil Afogado coletado
  alavancaCharcoPonteAtivada: boolean; // Alavanca remota que estende a ponte para o Covil Afogado no Charco Sombrio
  santuarioGeloEternoUpgradeColetado?: boolean; // Recompensa/Botas do Santuário do Gelo Eterno
  tumbaEnterradaUpgradeColetado?: boolean; // Recompensa da Tumba Enterrada
  cavernaCristalUpgradeColetado?: boolean; // Recompensa da Caverna de Cristal
  dungeonTipoAtivo: 'santuario' | 'cripta' | 'aguas_turvas' | 'covil_afogado' | 'gelo_eterno' | 'caverna_cristal' | 'santuario_chamas' | 'tumba_enterrada'; // Alterna entre os Santuários e Catacumbas
  botasCooldownTimer?: number; // Recarga das Botas de Passo Glacial (1.2s máx)
  botasDashTimer?: number; // Duração visual do rastro de dash (0.2s)
  aguaCongeladaTiles?: { x: number; y: number; w: number; h: number; timer: number }[]; // Tiles de água congelada pelas Botas (2.0s)
  blocoEmpurrandoTimer?: number; // Controle de som do atrito de blocos empurrados
  notificacaoTexto?: string; // Texto temporário no topo (ex: "+1 FRAGMENTO DE VIDA!")
  notificacaoTimer?: number;

  // Dados do HUD & Combate/Magia
  vidaAtual: number; // Fragmentos de Vida atuais
  vidaMax: number; // Fragmentos de Vida máximos (N losangos)
  arcanoAtual: number; // Fluxo Arcano atual (enche a 5%/s até arcanoMax)
  arcanoMax: number; // Fluxo Arcano máximo (inicia em 20)
  itemEquipado: ItemSecundarioId | null; // Ícone 16x16 no canto sup. direito (ou tracejado)
  selos: number; // Moeda de Eldrim
  bombas: number; // Contador de bombas
  bombasMax: number; // Capacidade máxima de bombas
  itensSecundariosObtidos: Record<ItemSecundarioId, boolean>;
  relicariosObtidos: {
    raiz: boolean;
    mares: boolean;
    gelo: boolean;
    chamas: boolean;
    terra: boolean;
    sombras: boolean;
  };

  // Região Terras Geladas & Side-quest Guarda Kell
  questLanternaStatus?: 'nao_iniciada' | 'em_andamento' | 'concluida';
  lanternaPerdidaColetada?: boolean;

  // Região Deserto de Kaal & Oásis de Kaal
  fonteOasisCooldownTimer?: number; // Cooldown entre goles na fonte de água real do Oásis

  // Estado do Menu de Pausa & Cartografia
  pausaMenuIndex: number; // 0: Mapa, 1: Inventário, 2: Itens-chave, 3: Voltar
  pausaSubtela: PausaSubtela; // 'menu' | 'mapa' | 'inventario' | 'itens_chave'
  pausaInventarioIndex: number; // Índice 0..5 do item selecionado na grade de inventário
  pausaTimer: number; // Timer de animação de pulsação/piscar do minimapa e cursores
  areasVisitadasVale: boolean[][]; // Grade 9x8 de retângulos 8x8px do Vale Verdejante visitados
  areasVisitadasCharco: boolean[][]; // Grade 9x8 de retângulos 8x8px do Charco Sombrio visitados
  areasVisitadasGeladas?: boolean[][]; // Grade 9x8 de retângulos 8x8px de Terras Geladas visitados
  areasVisitadasKaal?: boolean[][]; // Grade 9x8 de retângulos 8x8px do Deserto de Kaal visitados
  salasVisitadasDungeon: Record<string, boolean>; // Salas visitadas do Santuário
  salasVisitadasCripta: Record<string, boolean>; // Câmaras visitadas da Cripta
  salasVisitadasAguasTurvas: Record<string, boolean>; // Salas visitadas do Santuário das Águas Turvas
  salasVisitadasCovilAfogado: Record<string, boolean>; // Salas visitadas do Covil Afogado
  salasVisitadasGeloEterno?: Record<string, boolean>; // Salas visitadas do Santuário do Gelo Eterno
  salasVisitadasChamas?: Record<string, boolean>; // Salas visitadas do Santuário das Chamas
  salasVisitadasTumbaEnterrada?: Record<string, boolean>; // Câmaras visitadas da Tumba Enterrada

  // Motor de Dungeon (Santuários)
  dungeonSalaAtualId: string;
  dungeonChavesPequenas: number; // Contador de chaves pequenas
  dungeonTemChaveChefe: boolean; // Chave grande para a sala do chefe
  dungeonTransicaoTimer: number; // Fade/corte de 0.15s ao atravessar borda de sala
  dungeonItemObtido?: {
    nome: string;
    subtitulo: string;
    iconeTipo: string;
    timer: number;
  };

  // Plataformas que afundam (Mecânica do Santuário das Águas Turvas)
  plataformasDungeon: PlataformaAfundando[];

  // Combate, Inimigos e Chefes
  inimigosVale: InimigoEntidade[];
  particulas: ParticulaQuadrada[];
  projeteis: ProjetilEspinho[];
  projeteisAgua: ProjetilAgua[];
  projeteisEstilhacoGelo?: ProjetilEstilhacoGelo[];
  projeteisFogo?: ProjetilBolaFogo[];
  chefeRaizarca: RaizarcaBossState;
  chefeMarejante: MarejanteBossState;
  chefeGlacius?: GlaciusBossState;
  chefeAshra?: AshraBossState;

  // Itens Secundários
  ganchoAnim: GanchoAnimState;
  bumerangueAnim: BumerangueVooState;
}
