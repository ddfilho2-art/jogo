// =============================================================================
// ELDRIM: ECOS DO PASSADO - SCENARIO SPATIAL OCCUPATION & SEMANTIC MAP
// =============================================================================
// Autoridade Única para Interpretação Semântica do Cenário Artístico Estático.
// O cenário é uma composição artística e fonte de verdade do mundo.
// Os assets dinâmicos existem SOMENTE para complementar e nunca competir.
//
// O sistema é estruturado em 3 camadas limpas:
// 1. MAPA SEMÂNTICO (Classificação de Biomas e Áreas Especiais do Cenário)
// 2. MOTOR DE REGRAS (Hierarquia Absoluta: Cenário > Bioma > Áreas Especiais > Objetos Fixos > Circulação > Assets)
// 3. AUTORIDADE DE POSICIONAMENTO (canPlaceTree, canPlaceRock, canPlaceFlora)
// =============================================================================

export enum BiomeType {
  FOREST = 'FOREST',
  FIELD = 'FIELD',
  RIVERBANK = 'RIVERBANK',
  CLIFF = 'CLIFF',
  DESERT = 'DESERT',
  SWAMP = 'SWAMP',
  MOUNTAIN = 'MOUNTAIN',
}

export enum SpecialZoneType {
  FIXED_OBJECT = 'FIXED_OBJECT',
  FIXED_TREE = 'FIXED_TREE',
  FIXED_ROCK = 'FIXED_ROCK',
  FORBIDDEN_AREA = 'FORBIDDEN_AREA',
  RIVER = 'RIVER',
  PATH = 'PATH',
  PLAYABLE_AREA = 'PLAYABLE_AREA',
  DECORATION_ALLOWED = 'DECORATION_ALLOWED',
}

export interface SemanticTerrainInfo {
  biome: BiomeType;
  specialZone: SpecialZoneType;
  priorityLevel: number;
  priorityName: string;
  decorationAllowed: boolean;
  canPlaceTree: boolean;
  canPlaceRock: boolean;
  description: string;
}

export interface FixedScenarioObject {
  id: string;
  x: number;
  y: number;
  radius: number;
  type: string;
}

export interface Point2D {
  x: number;
  y: number;
}

export interface SemanticRegionDefinition {
  id: string;
  name: string;
  biome: BiomeType;
  specialZone?: SpecialZoneType;
  description: string;
  contains: (x: number, y: number) => boolean;
}

export class ScenarioSpatialMap {
  public static readonly SECTOR_WIDTH = 768;
  public static readonly SECTOR_HEIGHT = 512;
  public static readonly TOTAL_WORLD_WIDTH = 1536;
  public static readonly WORLD_WIDTH = 768; // Mantido para compatibilidade
  public static readonly WORLD_HEIGHT = 512;

  // ===========================================================================
  // 1. MAPA SEMÂNTICO — ELEMENTOS FIXOS ORIGINAIS DA IMAGEM
  // ===========================================================================
  public static readonly FIXED_OBJECTS: FixedScenarioObject[] = [
    { id: 'bridge', x: 585, y: 254.5, radius: 45, type: 'bridge' },
    { id: 'crystal_ancient', x: 340, y: 340, radius: 45, type: 'crystal' },
    { id: 'combat_monolith', x: 460, y: 260, radius: 40, type: 'monolith' },
    { id: 'wood_sign', x: 190, y: 260, radius: 25, type: 'sign' },
    { id: 'fallen_log', x: 240, y: 130, radius: 35, type: 'log' },
  ];

  // ===========================================================================
  // 1. MAPA SEMÂNTICO — TABELA DE LEITO E MARGENS REAIS DO RIO (0..512)
  // ===========================================================================
  private static readonly RIVER_SAMPLES = [
    { y: 0, left: 481, right: 670 },
    { y: 32, left: 486, right: 668 },
    { y: 64, left: 488, right: 665 },
    { y: 96, left: 510, right: 676 },
    { y: 128, left: 523, right: 676 },
    { y: 160, left: 520, right: 665 },
    { y: 192, left: 517, right: 668 },
    { y: 224, left: 507, right: 672 },
    { y: 256, left: 503, right: 671 },
    { y: 288, left: 506, right: 666 },
    { y: 320, left: 511, right: 662 },
    { y: 352, left: 524, right: 666 },
    { y: 384, left: 522, right: 668 },
    { y: 416, left: 529, right: 670 },
    { y: 448, left: 532, right: 651 },
    { y: 480, left: 532, right: 665 },
    { y: 512, left: 534, right: 625 },
  ];

  /**
   * Retorna as margens esquerda e direita exatas do rio na altura Y do mundo.
   */
  public static getRiverBounds(y: number): { left: number; right: number; center: number } {
    const clampedY = Math.max(0, Math.min(512, y));
    const samples = ScenarioSpatialMap.RIVER_SAMPLES;
    for (let i = 0; i < samples.length - 1; i++) {
      const s0 = samples[i];
      const s1 = samples[i + 1];
      if (clampedY >= s0.y && clampedY <= s1.y) {
        const t = (clampedY - s0.y) / (s1.y - s0.y);
        const left = s0.left + t * (s1.left - s0.left);
        const right = s0.right + t * (s1.right - s0.right);
        return { left, right, center: (left + right) * 0.5 };
      }
    }
    return { left: 505, right: 670, center: 587.5 };
  }

  // ===========================================================================
  // 1. MAPA SEMÂNTICO — REGIÕES IDENTIFICADAS NA COMPOSIÇÃO VISUAL
  // ===========================================================================
  private static readonly SEMANTIC_REGIONS: SemanticRegionDefinition[] = [
    // 1. Vale do Rio ao Leste (RIVERBANK com leito de água visual)
    {
      id: 'east_river_channel',
      name: 'Vale do Rio Leste',
      biome: BiomeType.RIVERBANK,
      specialZone: SpecialZoneType.RIVER,
      description: 'Leito do rio caudaloso e margens úmidas',
      contains: (x, y) => ScenarioSpatialMap.isPointInRiver(x, y, 0),
    },
    // 2. Margens estendidas do Rio
    {
      id: 'east_river_valley',
      name: 'Margem Ribeirinha',
      biome: BiomeType.RIVERBANK,
      description: 'Terreno aluvial e leito com juncos',
      contains: (x, y) => {
        const bounds = ScenarioSpatialMap.getRiverBounds(y);
        return x >= bounds.left - 40 && x <= bounds.right + 40;
      },
    },
    // 3. Dossel e Floresta Ancestral do Norte
    {
      id: 'north_ancient_canopy',
      name: 'Bosque Ancestral Norte',
      biome: BiomeType.FOREST,
      description: 'Floresta densa de carvalhos e vegetação verdejante',
      contains: (_, y) => y >= 375,
    },
    // 4. Bosque e Sombras do Sul
    {
      id: 'south_grove',
      name: 'Bosque do Sul',
      biome: BiomeType.FOREST,
      description: 'Vegetação sombreada ao sul da trilha principal',
      contains: (_, y) => y <= 115,
    },
    // 5. Bosque do Poente Oeste
    {
      id: 'west_dense_grove',
      name: 'Bosque do Poente',
      biome: BiomeType.FOREST,
      description: 'Arbustos e árvores na entrada oeste do vale',
      contains: (x, y) => x <= 180 && y >= 250,
    },
    // 6. Escarpas rochosas perimetrais
    {
      id: 'perimeter_escarpment',
      name: 'Escarpas Rochosas Perimetrais',
      biome: BiomeType.CLIFF,
      description: 'Elevações rochosas nas bordas montanhosas',
      contains: (x, y) => y >= 490 || x <= 22 || (x >= 740 && x <= 768 && y <= 100) || x >= 1515,
    },
    // 7. Bosque Alto Oriental (Setor Leste)
    {
      id: 'leste_north_canopy',
      name: 'Bosque Alto Oriental',
      biome: BiomeType.FOREST,
      description: 'Mata aberta de carvalhos e vegetação ensolarada além do rio',
      contains: (x, y) => x >= 768 && y >= 370,
    },
    // 8. Meandros Baixos do Vale (Setor Leste)
    {
      id: 'leste_south_wetland',
      name: 'Meandros Baixos do Vale',
      biome: BiomeType.RIVERBANK,
      description: 'Solo aluvial e áreas úmidas na bacia de transição do rio',
      contains: (x, y) => x >= 768 && y <= 150,
    },
    // 9. Clareira Oriental do Vale (Setor Leste)
    {
      id: 'leste_central_glade',
      name: 'Clareira Oriental do Vale',
      biome: BiomeType.FIELD,
      description: 'Planície aberta e iluminada além da ponte do rio',
      contains: (x) => x >= 768,
    },
    // 10. Planície Central e Clareiras (Setor Centro)
    {
      id: 'central_glade',
      name: 'Prado Central Ensolarado',
      biome: BiomeType.FIELD,
      description: 'Planície aberta e clareiras para circulação e combate',
      contains: () => true, // Fallback natural de bioma
    },
  ];

  // ===========================================================================
  // 2. MOTOR DE REGRAS — TRILHAS (PATH NÃO É BIOMA, É ÁREA DE CIRCULAÇÃO)
  // ===========================================================================
  public static getMainPathCenterY(x: number): number {
    return 245 + Math.sin(x * 0.008) * 10 + Math.cos(x * 0.014) * 5;
  }

  public static getMainPathWidth(x: number): number {
    return 52 + Math.sin(x * 0.02) * 8;
  }

  /**
   * Identifica se a coordenada pertence a uma via de circulação / trilha (PATH)
   */
  public static isPointInPath(x: number, y: number, buffer = 0): boolean {
    // 1. Passagem da Ponte sobre o Rio (X = 480..690, Y = 236..273)
    if (x >= 478 - buffer && x <= 692 + buffer && y >= 234 - buffer && y <= 275 + buffer) {
      return true;
    }

    // 2. Trilha Principal Oeste -> Entrada da Ponte (X = -20..500)
    if (x >= -20 && x <= 500) {
      const centerY = this.getMainPathCenterY(x);
      const halfW = this.getMainPathWidth(x) * 0.5 + buffer;
      if (Math.abs(y - centerY) <= halfW) {
        return true;
      }
    }

    // 3. Ramificação Norte em direção à clareira do monólito/cristal
    if (x >= 170 && x <= 370 && y >= 210 && y <= 360) {
      const t = Math.max(0, Math.min(1, (y - 220) / 120));
      const branchCenterX = 190 + t * 150 + Math.sin(y * 0.04) * 10;
      const branchHalfW = 26 + buffer;
      if (Math.abs(x - branchCenterX) <= branchHalfW) {
        return true;
      }
    }

    // 4. Passagem da Trilha além da Ponte na Margem Leste (X = 680..768)
    if (x >= 680 && x <= 768 && Math.abs(y - 254) <= (30 + buffer)) {
      return true;
    }

    // 5. Continuação da Trilha no Setor Leste (X = 768..1536)
    if (x > 768 && x <= 1536) {
      const offsetX = x - 768;
      const centerY = 254 + Math.sin(offsetX * 0.007) * 12 + Math.cos(offsetX * 0.015) * 5;
      const halfW = 28 + Math.sin(offsetX * 0.02) * 5 + buffer;
      if (Math.abs(y - centerY) <= halfW) {
        return true;
      }
    }

    return false;
  }

  /**
   * Identifica se a coordenada está no leito do rio (RIVER)
   */
  public static isPointInRiver(x: number, y: number, buffer = 0): boolean {
    const { left, right } = this.getRiverBounds(y);
    return x >= left - buffer && x <= right + buffer;
  }

  /**
   * Identifica se a coordenada está sobre ou próxima a elemento fixo existente
   */
  public static isNearFixedObject(x: number, y: number, extraBuffer = 0): boolean {
    for (let i = 0; i < this.FIXED_OBJECTS.length; i++) {
      const obj = this.FIXED_OBJECTS[i];
      const dx = x - obj.x;
      const dy = y - obj.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= obj.radius + extraBuffer) {
        return true;
      }
    }
    return false;
  }

  /**
   * Identifica se a coordenada é área aberta de circulação/combate (PLAYABLE_AREA)
   */
  public static isPlayableClearance(x: number, y: number, buffer = 0): boolean {
    // Clareira do Monólito de Treinamento
    if (x >= 410 - buffer && x <= 510 + buffer && y >= 220 - buffer && y <= 300 + buffer) {
      return true;
    }
    // Clareira Rúnica ao redor do Cristal
    if (x >= 300 - buffer && x <= 380 + buffer && y >= 300 - buffer && y <= 380 + buffer) {
      return true;
    }
    // Clareira do Prado Sul
    if (x >= 230 - buffer && x <= 370 + buffer && y >= 140 - buffer && y <= 190 + buffer) {
      return true;
    }
    return false;
  }

  // ===========================================================================
  // 3. CONSULTA DE BIOMA E ÁREA ESPECIAL
  // ===========================================================================

  /**
   * CAMADA A: BIOMA / TERRENO
   * Determina o bioma ambiental predominante da coordenada.
   */
  public static getBiome(x: number, y: number): BiomeType {
    for (let i = 0; i < this.SEMANTIC_REGIONS.length; i++) {
      const reg = this.SEMANTIC_REGIONS[i];
      if (reg.contains(x, y)) {
        return reg.biome;
      }
    }
    return BiomeType.FIELD;
  }

  /**
   * CAMADA B: ÁREA ESPECIAL
   * Avalia a zona especial que restringe o contexto ambiental.
   * Hierarquia: FIXED_OBJECT > FORBIDDEN_AREA > RIVER > PATH > PLAYABLE_AREA > DECORATION_ALLOWED
   */
  public static getSpecialZone(x: number, y: number): SpecialZoneType {
    // 1. Tablado da Ponte Transitável (X = 478..692, Y = 234..275) sobre o Rio
    if (x >= 478 && x <= 692 && y >= 234 && y <= 275) {
      return SpecialZoneType.PATH;
    }

    // Passagem da Fronteira entre Setores (X = 748..788, Y = 226..284)
    if (x >= 748 && x <= 788 && y >= 226 && y <= 284) {
      return SpecialZoneType.PATH;
    }

    // 2. Objetos Fixos Originais da Imagem
    if (this.isNearFixedObject(x, y, 0)) {
      return SpecialZoneType.FIXED_OBJECT;
    }

    // 3. Bordas e limites do mundo (cobrindo a totalidade dos setores conectados)
    if (x < 15 || x > this.TOTAL_WORLD_WIDTH - 15 || y < 15 || y > this.SECTOR_HEIGHT - 15) {
      return SpecialZoneType.FORBIDDEN_AREA;
    }

    // Borda intermediária entre os setores fora da passagem da trilha
    if (x >= 758 && x <= 778 && (y < 226 || y > 284)) {
      return SpecialZoneType.FORBIDDEN_AREA;
    }

    // 4. Rio / Água (vence bioma de floresta ou planície)
    if (this.isPointInRiver(x, y, 0)) {
      return SpecialZoneType.RIVER;
    }

    // 5. Trilha / Caminho de circulação (vence bioma)
    if (this.isPointInPath(x, y, 0)) {
      return SpecialZoneType.PATH;
    }

    // 6. Clareira jogável / combate
    if (this.isPlayableClearance(x, y, 0)) {
      return SpecialZoneType.PLAYABLE_AREA;
    }

    // 7. Área natural onde decoração é permitida
    return SpecialZoneType.DECORATION_ALLOWED;
  }

  /**
   * Avaliação Semântica Integrada e Resolvida pela Hierarquia Absoluta
   */
  public static getSemanticInfo(x: number, y: number): SemanticTerrainInfo {
    const biome = this.getBiome(x, y);
    const specialZone = this.getSpecialZone(x, y);

    let priorityLevel = 6;
    let priorityName = 'DECORAÇÃO';
    let decorationAllowed = true;
    let canPlaceTree = false;
    let canPlaceRock = false;
    let description = `${biome} aberto`;

    if (specialZone === SpecialZoneType.FIXED_OBJECT) {
      priorityLevel = 1;
      priorityName = '1. FIXED_OBJECT';
      decorationAllowed = false;
      canPlaceTree = false;
      canPlaceRock = false;
      description = 'Objeto fixo pertencente à composição original';
    } else if (specialZone === SpecialZoneType.FORBIDDEN_AREA) {
      priorityLevel = 2;
      priorityName = '2. FORBIDDEN_AREA';
      decorationAllowed = false;
      canPlaceTree = false;
      canPlaceRock = false;
      description = 'Borda / Limite externo do mundo';
    } else if (specialZone === SpecialZoneType.RIVER) {
      priorityLevel = 3;
      priorityName = '3. RIVER';
      decorationAllowed = false;
      canPlaceTree = false; // Árvore PROIBIDA dentro do rio!
      canPlaceRock = false; // Grandes rochas proibidas no rio
      description = `Leito da água (${biome} + RIVER)`;
    } else if (specialZone === SpecialZoneType.PATH) {
      priorityLevel = 4;
      priorityName = '4. PATH';
      decorationAllowed = false;
      canPlaceTree = false; // Árvore PROIBIDA na trilha!
      canPlaceRock = false; // Grande pedra PROIBIDA na trilha!
      description = `Área de circulação (${biome} + PATH)`;
    } else if (specialZone === SpecialZoneType.PLAYABLE_AREA) {
      priorityLevel = 5;
      priorityName = '5. PLAYABLE_AREA';
      decorationAllowed = false;
      canPlaceTree = false;
      canPlaceRock = false;
      description = `Clareira de combate/jogabilidade (${biome})`;
    } else {
      // DECORATION_ALLOWED
      priorityLevel = 6;
      priorityName = '6. DECORAÇÃO';
      decorationAllowed = true;
      canPlaceTree = biome === BiomeType.FOREST;
      canPlaceRock = true;
      description = `Espaço natural disponível em ${biome}`;
    }

    return {
      biome,
      specialZone,
      priorityLevel,
      priorityName,
      decorationAllowed,
      canPlaceTree,
      canPlaceRock,
      description,
    };
  }

  public static isCirculationArea(x: number, y: number): boolean {
    const sz = this.getSpecialZone(x, y);
    return sz === SpecialZoneType.PATH || sz === SpecialZoneType.PLAYABLE_AREA;
  }

  public static isForbiddenArea(x: number, y: number): boolean {
    const sz = this.getSpecialZone(x, y);
    return sz === SpecialZoneType.FORBIDDEN_AREA;
  }

  // ===========================================================================
  // 4. AUTORIDADE ÚNICA PARA POSICIONAMENTO DE ASSETS (VALIDAÇÃO DE VOLUME)
  // ===========================================================================

  /**
   * REGRA DE SEGURANÇA PARA ÁRVORES:
   * Valida deterministicamente se uma árvore pode ser posicionada nas coordenadas (x, y).
   * Considera o volume ocupado e não apenas o ponto central:
   * - Proibida dentro do rio
   * - Proibida sobre caminhos/trilhas (PATH)
   * - Proibida sobre elementos fixos
   * - Proibida dentro de clareiras de combate (PLAYABLE_AREA)
   * - Distância mínima em relação a outras árvores
   * - Compatível com bioma de floresta
   */
  public static canPlaceTree(
    x: number,
    y: number,
    treeRadius: number,
    existingTrees: Array<{ x: number; y: number; radius: number }>
  ): { allowed: boolean; reason?: string } {
    // 1. Limites do mapa
    if (x < 30 || x > this.TOTAL_WORLD_WIDTH - 30 || y < 30 || y > this.SECTOR_HEIGHT - 30) {
      return { allowed: false, reason: 'Fora dos limites seguros do mapa' };
    }

    // 2. Não pode estar no leito do rio (com margem de segurança de 26px para copa/tronco)
    if (this.isPointInRiver(x, y, 26)) {
      return { allowed: false, reason: 'Árvores são proibidas dentro e nas margens imediatas do rio' };
    }

    // 3. Não pode estar sobre ou invadir a trilha (com margem de segurança de 24px)
    if (this.isPointInPath(x, y, 24)) {
      return { allowed: false, reason: 'Árvores não podem obstruir a circulação da trilha' };
    }

    // 4. Não pode sobrepor objeto fixo do cenário (margem de 30px)
    if (this.isNearFixedObject(x, y, 30)) {
      return { allowed: false, reason: 'Muito próxima a elemento fixo original do cenário' };
    }

    // 5. Não pode invadir clareiras de combate
    if (this.isPlayableClearance(x, y, 18)) {
      return { allowed: false, reason: 'Invade clareira de combate/jogabilidade' };
    }

    // 6. Deve manter espaçamento natural entre troncos
    const minDistanceBetweenTrunks = 42;
    for (let i = 0; i < existingTrees.length; i++) {
      const other = existingTrees[i];
      const dx = x - other.x;
      const dy = y - other.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const reqDist = Math.max(minDistanceBetweenTrunks, (treeRadius + other.radius) * 0.48);
      if (dist < reqDist) {
        return { allowed: false, reason: `Muito próxima à árvore em (${other.x}, ${other.y})` };
      }
    }

    return { allowed: true };
  }

  /**
   * REGRA DE SEGURANÇA PARA ROCHAS:
   * Valida se uma rocha pode ser posicionada nas coordenadas (x, y).
   */
  public static canPlaceRock(
    x: number,
    y: number,
    rockRadius: number,
    existingRocks: Array<{ x: number; y: number; radius: number }>,
    existingTrees: Array<{ x: number; y: number; radius: number }>,
    isSmall = false
  ): { allowed: boolean; reason?: string } {
    if (x < 25 || x > this.TOTAL_WORLD_WIDTH - 25 || y < 25 || y > this.SECTOR_HEIGHT - 25) {
      return { allowed: false, reason: 'Fora dos limites do mapa' };
    }

    // Grande rocha é proibida no leito do rio; pedras pequenas podem margear
    const riverBuffer = isSmall ? 6 : 18;
    if (this.isPointInRiver(x, y, riverBuffer)) {
      return { allowed: false, reason: 'Rocha dentro do leito do rio' };
    }

    // Grande rocha é proibida sobre a trilha
    const pathBuffer = isSmall ? 8 : 20;
    if (this.isPointInPath(x, y, pathBuffer)) {
      return { allowed: false, reason: 'Rocha bloqueando a circulação na trilha' };
    }

    // Não pode sobrepor objeto fixo
    if (this.isNearFixedObject(x, y, 20)) {
      return { allowed: false, reason: 'Rocha sobre objeto fixo original' };
    }

    // Não pode ficar sobre raiz de árvore
    for (let i = 0; i < existingTrees.length; i++) {
      const t = existingTrees[i];
      const dx = x - t.x;
      const dy = y - t.y;
      if (Math.sqrt(dx * dx + dy * dy) < 28) {
        return { allowed: false, reason: 'Rocha sobre raiz de árvore' };
      }
    }

    // Não pode ficar sobre outra rocha
    for (let i = 0; i < existingRocks.length; i++) {
      const r = existingRocks[i];
      const dx = x - r.x;
      const dy = y - r.y;
      if (Math.sqrt(dx * dx + dy * dy) < Math.max(24, (rockRadius + r.radius) * 0.8)) {
        return { allowed: false, reason: 'Rocha sobre outra rocha existente' };
      }
    }

    return { allowed: true };
  }

  /**
   * REGRA DE SEGURANÇA PARA FLORA E ARBUSTOS:
   * Valida se arbustos ou vegetação podem ser posicionados.
   * Arbustos são proibidos no centro de trilhas e dentro do rio.
   */
  public static canPlaceFlora(
    x: number,
    y: number,
    floraRadius: number,
    existingFlora: Array<{ x: number; y: number; radius: number }>
  ): { allowed: boolean; reason?: string } {
    if (x < 20 || x > this.TOTAL_WORLD_WIDTH - 20 || y < 20 || y > this.SECTOR_HEIGHT - 20) {
      return { allowed: false, reason: 'Fora dos limites do mapa' };
    }

    // Flora terrestre não pode ficar dentro da água
    if (this.isPointInRiver(x, y, 10)) {
      return { allowed: false, reason: 'Flora terrestre dentro do rio' };
    }

    // Arbustos não podem bloquear o centro da trilha
    if (this.isPointInPath(x, y, 8)) {
      return { allowed: false, reason: 'Flora bloqueando a circulação na trilha' };
    }

    // Não pode sobrepor elemento fixo
    if (this.isNearFixedObject(x, y, 16)) {
      return { allowed: false, reason: 'Flora sobre objeto fixo' };
    }

    // Distância mínima entre arbustos
    for (let i = 0; i < existingFlora.length; i++) {
      const f = existingFlora[i];
      const dx = x - f.x;
      const dy = y - f.y;
      if (Math.sqrt(dx * dx + dy * dy) < 18) {
        return { allowed: false, reason: 'Flora sobreposta a outra vegetação' };
      }
    }

    return { allowed: true };
  }
}
