// =============================================================================
// ELDRIM: ECOS DO PASSADO - VALE VERDEJANTE VISUAL PROFILE (BÍBLIA VISUAL)
// =============================================================================
// Fonte de Verdade Visual: src/assets/images/terrain_benchmark_v6_1788973236244.jpg
// e src/assets/images/trees_rocks_v6_1788973221539.jpg
// =============================================================================

export interface VisualPalette {
  grassBase: string;
  grassDark: string;
  grassShadow: string;
  grassLight: string;

  foliageBase: string;
  foliageDark: string;
  foliageShadow: string;
  foliageLight: string;
  foliageHighlight: string;

  trunkBase: string;
  trunkDark: string;
  trunkShadow: string;
  trunkLight: string;

  branchBase: string;
  branchDark: string;
  branchLight: string;

  rootBase: string;
  rootDark: string;

  rockBase: string;
  rockDark: string;
  rockShadow: string;
  rockLight: string;
  rockHighlight: string;
  mossBase: string;

  dirtBase: string;
  dirtDark: string;
  dirtLight: string;

  waterBase: string;
  waterDark: string;
  waterShadow: string;
  waterLight: string;
  waterHighlight: string;

  woodBase: string;
  woodDark: string;
  woodLight: string;
  woodHighlight: string;

  flowerAccent1: string;
  flowerAccent2: string;
  flowerAccent3: string;
}

export const VALE_VERDEJANTE_PALETTE: VisualPalette = {
  // Grama e Solo
  grassBase: '#244e30',
  grassDark: '#1b3b24',
  grassShadow: '#132819',
  grassLight: '#356d44',

  // Folhagem e Copas (Massas Orgânicas Multicamadas)
  foliageShadow: '#142C0E',
  foliageDark: '#193813',
  foliageBase: '#31541F',
  foliageLight: '#477120',
  foliageHighlight: '#6E9345',

  // Troncos de Carvalho / Freixo
  trunkShadow: '#140c06',
  trunkDark: '#1c130d',
  trunkBase: '#3d281a',
  trunkLight: '#63442e',

  // Galhos e Bifurcações
  branchDark: '#1c130d',
  branchBase: '#271910',
  branchLight: '#543924',

  // Raízes
  rootDark: '#140c06',
  rootBase: '#271910',

  // Rochas Facetadas (Ardósia e Granito)
  rockShadow: '#0f172a',
  rockDark: '#1e293b',
  rockBase: '#334155',
  rockLight: '#475569',
  rockHighlight: '#64748b',
  mossBase: '#31541F',

  // Trilha de Terra Batida
  dirtDark: '#302013',
  dirtBase: '#4a3525',
  dirtLight: '#6e523b',

  // Rio e Correnteza Cristalina
  waterShadow: '#092231',
  waterDark: '#0c364c',
  waterBase: '#175373',
  waterLight: '#26769e',
  waterHighlight: '#8ee3f5',

  // Madeira da Ponte Rústica
  woodDark: '#1e130a',
  woodBase: '#3d2514',
  woodLight: '#654328',
  woodHighlight: '#8b623d',

  // Flores Silvestres e Detalhes
  flowerAccent1: '#38bdf8', // Centáurea azul
  flowerAccent2: '#fbbf24', // Dente-de-leão dourado
  flowerAccent3: '#f472b6', // Lótus silvestre
};

export interface VisualStyleConfig {
  name: string;
  description: string;
  palette: VisualPalette;
  treeStyle: {
    organicCanopyLayers: number;
    branchesExposed: boolean;
    rootFlaring: boolean;
    windSwayIntensity: number;
    shadowType: 'directional_soft' | 'elliptical';
  };
  rockStyle: {
    facesCountMin: number;
    facesCountMax: number;
    mossCoverage: number;
    riverWetness: boolean;
  };
  bridgeStyle: {
    fullSpan: boolean;
    plankCount: number;
    railings: boolean;
    supportPillars: boolean;
  };
  waterStyle: {
    blendMode: 'overlay_dynamic';
    opacity: number;
    currentSpeed: number;
    rippleWaveFrequency: number;
  };
  lightingStyle: {
    sunDirection: [number, number, number]; // X, Y, Z
    sunColor: [number, number, number];
    ambientColor: [number, number, number];
  };
  densities: {
    treeDensity: number;
    rockDensity: number;
    vegetationDensity: number;
    waterEffectIntensity: number;
    foregroundCanopyDensity: number;
  };
}

export const VALE_VERDEJANTE_VISUAL_PROFILE: VisualStyleConfig = {
  name: 'Vale Verdejante HD Hand-Crafted 2.5D',
  description:
    'Reconstrução 2.5D de alta fidelidade visual do Vale Verdejante derivada de terrain_benchmark_v6 e trees_rocks_v6.',
  palette: VALE_VERDEJANTE_PALETTE,
  treeStyle: {
    organicCanopyLayers: 5,
    branchesExposed: true,
    rootFlaring: true,
    windSwayIntensity: 0.8,
    shadowType: 'directional_soft',
  },
  rockStyle: {
    facesCountMin: 6,
    facesCountMax: 14,
    mossCoverage: 0.35,
    riverWetness: true,
  },
  bridgeStyle: {
    fullSpan: true,
    plankCount: 14,
    railings: true,
    supportPillars: true,
  },
  waterStyle: {
    blendMode: 'overlay_dynamic',
    opacity: 0.55,
    currentSpeed: 1.2,
    rippleWaveFrequency: 2.4,
  },
  lightingStyle: {
    sunDirection: [-0.4, -0.6, 0.7], // Luz vinda de Noroeste/Cima
    sunColor: [1.0, 0.96, 0.88], // Luz solar morna
    ambientColor: [0.18, 0.28, 0.22], // Verde florestal ambiente
  },
  densities: {
    treeDensity: 0.7,
    rockDensity: 0.5,
    vegetationDensity: 0.6,
    waterEffectIntensity: 0.45,
    foregroundCanopyDensity: 0.5,
  },
};
