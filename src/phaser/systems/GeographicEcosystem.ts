import Phaser from 'phaser';

// =============================================================================
// ELDRIM: ECOS DO PASSADO - SISTEMA GEOGRÁFICO E ECOLÓGICO (FASE 9)
// =============================================================================
// Princípios Fundamentais:
// 1. TERRENO -> RELEVO -> NAVEGAÇÃO -> CAMINHOS -> ÁGUA -> TRANSIÇÕES -> DECORAÇÃO -> VIDA AMBIENTAL
// 2. O Corredor de Navegação Principal do Ren tem prioridade máxima (LIVRE DE OBSTÁCULOS).
// 3. Separação semântica estrita: Árvores terrestres NUNCA aparecem em água.
// 4. Margens orgânicas: zona intermediária entre terra e água com pedras, juncos e solo úmido.
// 5. Transições graduais (nunca linhas retas abruptas).
// 6. Limite do mapa justificado pelo ambiente natural (sem muralhas de tijolos de debug).
// =============================================================================

export type ZonaSemantica =
  | 'PATH'          // Corredor navegável prioritário (Ren transita livremente)
  | 'GRASS'         // Pradaria aberta, clareiras, flores silvestres, borboletas, abelhas
  | 'FOREST'        // Bosque denso, copas de árvores, sombra profunda, cogumelos
  | 'RIVER_BANK'    // Margem de transição (areia úmida, seixos rolados, juncos/canas)
  | 'SHALLOW_WATER' // Água rasa (reflexos, vitórias-régias, lírios d'água, pedras submersas)
  | 'RIVER'         // Leito do rio corrente (ondas, correnteza, vórtices, espuma)
  | 'DEEP_WATER'    // Água profunda
  | 'CLIFF'         // Encosta rochosa natural com musgo e cascalho
  | 'TRANSITION';   // Faixa intermediária de borda entre biomas e relevo

export interface CorredorNavegacao {
  // Caixa delimitadora do caminho prioritário
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

export class GeographicEcosystem {
  // Limites geográficos do leito do rio no Vale Verdejante
  public static readonly RIO_X_MIN = 490;
  public static readonly RIO_X_MAX = 768;
  public static readonly RIO_Y_MIN = 180;
  public static readonly RIO_Y_MAX = 512;

  // Corredor da Trilha Principal no Vale Verdejante:
  // Eixo Norte-Sul (passagem central)
  public static readonly CORREDOR_NS: CorredorNavegacao = {
    xMin: 348,
    xMax: 420,
    yMin: 0,
    yMax: 512,
  };

  // Eixo Leste-Oeste (travessia até a orla)
  public static readonly CORREDOR_EO: CorredorNavegacao = {
    xMin: 0,
    xMax: 470,
    yMin: 226,
    yMax: 286,
  };

  /**
   * Determina a zona semântica exata para coordenadas (x, y) no Vale Verdejante
   */
  public static obterZonaSemantica(x: number, y: number): ZonaSemantica {
    // 1. Trilha Principal de Navegação (Prioridade Máxima)
    if (this.estaNoCorredorNavegacao(x, y)) {
      return 'PATH';
    }

    // 2. Rio e Áreas Aquáticas
    if (x >= this.RIO_X_MIN && y >= this.RIO_Y_MIN) {
      // Borda aquática rasa (transição imediata)
      if (x < this.RIO_X_MIN + 30) {
        return 'SHALLOW_WATER';
      }
      return 'RIVER';
    }

    // 3. Margem Ribeirinha (Faixa de transição úmida antes da água)
    if (x >= this.RIO_X_MIN - 40 && x < this.RIO_X_MIN && y >= this.RIO_Y_MIN - 20) {
      return 'RIVER_BANK';
    }

    // 4. Encosta do Penhasco ao Nordeste (Acima da Cachoeira)
    if (x >= 600 && y < 190) {
      return 'CLIFF';
    }

    // 5. Floresta Densa Noroeste e Dossel Norte
    if ((x < 220 && y < 220) || y < 90) {
      return 'FOREST';
    }

    // 6. Bosque Sudoeste
    if (x < 200 && y > 340) {
      return 'FOREST';
    }

    // 7. Zonas de transição entre clareira e matas
    if ((x >= 220 && x <= 260 && y < 220) || (x >= 200 && x <= 240 && y > 340)) {
      return 'TRANSITION';
    }

    // 8. Gramado Aberto / Clareira Central
    return 'GRASS';
  }

  /**
   * Verifica se um ponto está dentro do corredor principal navegável do herói
   */
  public static estaNoCorredorNavegacao(x: number, y: number): boolean {
    const noNS = x >= this.CORREDOR_NS.xMin && x <= this.CORREDOR_NS.xMax &&
                 y >= this.CORREDOR_NS.yMin && y <= this.CORREDOR_NS.yMax;

    const noEO = x >= this.CORREDOR_EO.xMin && x <= this.CORREDOR_EO.xMax &&
                 y >= this.CORREDOR_EO.yMin && y <= this.CORREDOR_EO.yMax;

    return noNS || noEO;
  }

  /**
   * Verifica se um ponto está dentro da água (onde árvores terrestres são ESTRITAMENTE PROIBIDAS)
   */
  public static estaNaAgua(x: number, y: number): boolean {
    return x >= this.RIO_X_MIN && y >= this.RIO_Y_MIN;
  }

  /**
   * Valida se um elemento pode ser colocado na posição dada respeitando a ecologia
   */
  public static validarPosicionamento(
    tipo: 'arvore_terrestre' | 'rocha_bloqueadora' | 'arbusto_denso' | 'vegetacao_aquatica' | 'seixo_trilha',
    x: number,
    y: number
  ): boolean {
    const zona = this.obterZonaSemantica(x, y);

    // REGRA 2: Trilha principal livre de bloqueios
    if (this.estaNoCorredorNavegacao(x, y)) {
      if (tipo === 'arvore_terrestre' || tipo === 'rocha_bloqueadora' || tipo === 'arbusto_denso') {
        return false; // Proibido bloquear a trilha principal!
      }
    }

    // REGRA 3: Árvores terrestres e arbustos terrestres densos NUNCA na água
    if (this.estaNaAgua(x, y)) {
      if (tipo === 'arvore_terrestre' || tipo === 'arbusto_denso') {
        return false; // Proibido colocar árvores comuns dentro do rio!
      }
    }

    // Vegetação aquática só em água rasa, margem ou rio
    if (tipo === 'vegetacao_aquatica') {
      return zona === 'RIVER' || zona === 'SHALLOW_WATER' || zona === 'RIVER_BANK';
    }

    return true;
  }
}
