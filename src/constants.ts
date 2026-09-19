import { Retangulo } from './types';

export const LOGICAL_WIDTH = 256;
export const LOGICAL_HEIGHT = 224;
export const TILE_SIZE = 16;

export const MAP_WIDTH = 768; // 3 telas de 256px
export const MAP_HEIGHT = 672; // 3 telas de 224px

// Paleta fixa do Vale Verdejante
export const PALETA_VALE = {
  folhagemEscura: '#2d5a3d',
  folhagemMedia: '#4a7c59',
  terraTronco: '#8b5a2b',
  gramaA: '#3a6b47',
  gramaB: '#34623f',
  caminhoTerra: '#78471f',
  rioAguaProfunda: '#1e40af',
  rioAguaSuperficie: '#2563eb',
  rioEspuma: '#60a5fa',
  ponteMadeira: '#8b5a2b',
  ponteMadeiraClara: '#a16207',
  ouroColetavel: '#fbbf24',
};

// Paleta fixa do Charco Sombrio (Região 2)
export const PALETA_CHARCO = {
  soloLama: '#3a4a3a', // Lama e solo escuro pantanoso
  vegetacao: '#5c6b47', // Folhagem de pântano e musgo úmido
  aguaTurva: '#1f2f3a', // Água rasa e canais turvos do charco
  aguaTurvaReflexo: '#283c48',
  madeiraDoca: '#4a3728',
  madeiraDocaClara: '#6d4c3d',
  juncoVerde: '#5c6b47',
  juncoSeco: '#8c7b50',
  pedraMusgosa: '#2a3530',
  pedraLuz: '#475a50',
};

export const HERO_BASE_SPEED = 80; // px/s
export const HERO_SWAMP_SPEED = 50; // px/s (ao pisar em água rasa do Charco Sombrio)
export const HERO_COLOR = '#3a6ea5';

export const TEST_OBSTACLES: Retangulo[] = [
  // 1. Grande ruína de pedra no canto superior esquerdo
  { x: 64, y: 64, w: 96, h: 48, cor: '#4a5568', rotulo: 'Ruína Antiga' },
  // 2. Monólito central de Eldrim
  { x: 224, y: 192, w: 64, h: 64, cor: '#2d3748', rotulo: 'Monólito' },
  // 3. Rochedo comprido a leste
  { x: 352, y: 112, w: 48, h: 128, cor: '#4a5568', rotulo: 'Penhasco' },
  // 4. Formação rochosa ao sul
  { x: 128, y: 320, w: 144, h: 48, cor: '#334155', rotulo: 'Barreira Rochosa' },
];
