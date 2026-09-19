import Phaser from 'phaser';
import { TILE_SIZE } from '../config';

// =============================================================================
// ELDRIM: ECOS DO PASSADO - ENVIRONMENT ATLAS V5
// =============================================================================
// Reconstrução visual definitiva de todos os elementos ambientais:
// - Árvores orgânicas sem primitivas geométricas (tronco nodoso, raízes, galhos,
//   copas volumosas assimétricas, sombra no solo). Variantes: Small, Medium,
//   Large, Old e Dead.
// - Pedras com relevo 3D, arestas vivas, fissuras, musgo e sombra (6 variantes).
// - Gramado vivo e variado (sem efeito de grade, tufos, flores, folhas, terra).
// - Água com ondas e margens orgânicas.
// - Estradas com cantos, bordas irregulares e pedras incrustadas.
// - Tilesets temáticos para as 7 regiões do reino de Eldrim.
// =============================================================================

export class EnvironmentAtlas {
  /**
   * Registra todos os assets de ambiente no TextureManager do Phaser
   */
  static gerarTexturasAmbiente(scene: Phaser.Scene): void {
    this.gerarSombras(scene);
    this.gerarArvores(scene);
    this.gerarPedras(scene);
    this.gerarTilesetPrincipal(scene);
    this.gerarDecoresEFloresta(scene);
  }

  // ===========================================================================
  // 1. SOMBRAS COERENTES E PROJETADAS
  // ===========================================================================
  private static gerarSombras(scene: Phaser.Scene): void {
    // Sombra pequena para personagens (32x14)
    if (!scene.textures.exists('sombra_heroi')) {
      const canvas = document.createElement('canvas');
      canvas.width = 32;
      canvas.height = 14;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const grad = ctx.createRadialGradient(16, 7, 2, 16, 7, 14);
        grad.addColorStop(0, 'rgba(10, 16, 26, 0.60)');
        grad.addColorStop(0.7, 'rgba(10, 16, 26, 0.25)');
        grad.addColorStop(1, 'rgba(10, 16, 26, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 32, 14);
      }
      scene.textures.addCanvas('sombra_heroi', canvas);
    }

    // Sombra média para pedras e arbustos (48x20)
    if (!scene.textures.exists('sombra_media')) {
      const canvas = document.createElement('canvas');
      canvas.width = 48;
      canvas.height = 20;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const grad = ctx.createRadialGradient(24, 10, 4, 24, 10, 22);
        grad.addColorStop(0, 'rgba(8, 14, 20, 0.55)');
        grad.addColorStop(0.8, 'rgba(8, 14, 20, 0.18)');
        grad.addColorStop(1, 'rgba(8, 14, 20, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 48, 20);
      }
      scene.textures.addCanvas('sombra_media', canvas);
    }
  }

  // ===========================================================================
  // 2. ÁRVORES ORGÂNICAS EM PIXEL ART (Zero círculos primitivos)
  // ===========================================================================
  private static gerarArvores(scene: Phaser.Scene): void {
    // -------------------------------------------------------------------------
    // A. TREE_SMALL (48x64 px)
    // -------------------------------------------------------------------------
    if (!scene.textures.exists('tree_small_1')) {
      const canvas = document.createElement('canvas');
      canvas.width = 48;
      canvas.height = 64;
      const ctx = canvas.getContext('2d')!;
      ctx.imageSmoothingEnabled = false;

      // Sombra projetada no solo
      const grad = ctx.createRadialGradient(24, 58, 2, 24, 58, 18);
      grad.addColorStop(0, 'rgba(8, 16, 12, 0.55)');
      grad.addColorStop(1, 'rgba(8, 16, 12, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(6, 50, 36, 14);

      // Tronco com casca texturizada e raízes
      ctx.fillStyle = '#3a2012';
      ctx.fillRect(20, 36, 8, 22);
      ctx.fillStyle = '#54301a';
      ctx.fillRect(21, 37, 5, 20);
      ctx.fillStyle = '#24140a';
      ctx.fillRect(20, 44, 2, 14);
      // Raízes laterais
      ctx.fillStyle = '#3a2012';
      ctx.fillRect(17, 54, 4, 4);
      ctx.fillRect(27, 54, 4, 4);

      // Agrupamentos de folhas (clusters assimétricos)
      this.desenharClusterFolhas(ctx, 16, 12, 28, 26, '#184c28', '#27703e', '#3da05b', '#6ee7b7');
      this.desenharClusterFolhas(ctx, 8, 20, 22, 20, '#133e20', '#1f5931', '#2f8549', '#52c97c');
      this.desenharClusterFolhas(ctx, 22, 18, 20, 22, '#154424', '#246537', '#389454', '#60d388');

      scene.textures.addCanvas('tree_small_1', canvas);
    }

    // -------------------------------------------------------------------------
    // B. TREE_MEDIUM (64x88 px)
    // -------------------------------------------------------------------------
    if (!scene.textures.exists('tree_medium_1')) {
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 88;
      const ctx = canvas.getContext('2d')!;
      ctx.imageSmoothingEnabled = false;

      // Sombra projetada
      const grad = ctx.createRadialGradient(32, 80, 4, 32, 80, 26);
      grad.addColorStop(0, 'rgba(8, 16, 12, 0.60)');
      grad.addColorStop(1, 'rgba(8, 16, 12, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(8, 70, 48, 18);

      // Tronco bifurcado com galhos visíveis
      ctx.fillStyle = '#3a2012';
      ctx.fillRect(27, 52, 11, 28);
      ctx.fillStyle = '#54301a';
      ctx.fillRect(29, 52, 6, 26);
      ctx.fillStyle = '#23130a';
      ctx.fillRect(27, 60, 2, 20);

      // Raízes musgosas
      ctx.fillStyle = '#3a2012';
      ctx.fillRect(23, 76, 5, 4);
      ctx.fillRect(37, 76, 5, 4);
      ctx.fillStyle = '#166534';
      ctx.fillRect(26, 74, 4, 3);

      // Galhos saindo do tronco
      ctx.fillStyle = '#3a2012';
      ctx.fillRect(22, 42, 8, 12);
      ctx.fillRect(36, 40, 8, 14);

      // Copa densa em 4 clusters volumosos
      this.desenharClusterFolhas(ctx, 18, 8, 30, 32, '#143d20', '#205c33', '#338c4f', '#4ade80');
      this.desenharClusterFolhas(ctx, 8, 24, 26, 28, '#10331a', '#1a4f2b', '#297542', '#3ec774');
      this.desenharClusterFolhas(ctx, 32, 22, 26, 28, '#12391d', '#1d552f', '#2f814a', '#44d47c');
      this.desenharClusterFolhas(ctx, 20, 32, 28, 22, '#164424', '#246b3b', '#399e5a', '#5ee593');

      scene.textures.addCanvas('tree_medium_1', canvas);
    }

    // -------------------------------------------------------------------------
    // C. TREE_LARGE (96x128 px) - Árvore Grande Majestosa
    // -------------------------------------------------------------------------
    if (!scene.textures.exists('tree_large_1')) {
      const canvas = document.createElement('canvas');
      canvas.width = 96;
      canvas.height = 128;
      const ctx = canvas.getContext('2d')!;
      ctx.imageSmoothingEnabled = false;

      // Sombra robusta alongada
      const grad = ctx.createRadialGradient(48, 118, 6, 48, 118, 40);
      grad.addColorStop(0, 'rgba(6, 14, 10, 0.65)');
      grad.addColorStop(1, 'rgba(6, 14, 10, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(10, 106, 76, 22);

      // Tronco ancestral espesso com ranhuras e nós na madeira
      ctx.fillStyle = '#321c0f';
      ctx.fillRect(40, 74, 18, 44);
      ctx.fillStyle = '#4c2b17';
      ctx.fillRect(43, 75, 11, 40);
      ctx.fillStyle = '#1c0f08';
      ctx.fillRect(40, 84, 3, 32);
      ctx.fillRect(52, 90, 2, 24);

      // Raízes estendidas cravadas no solo
      ctx.fillStyle = '#321c0f';
      ctx.fillRect(32, 112, 10, 6);
      ctx.fillRect(56, 112, 10, 6);
      ctx.fillStyle = '#15803d'; // Musgo de raízes
      ctx.fillRect(38, 110, 6, 4);

      // Grandes galhos divergentes
      ctx.fillStyle = '#321c0f';
      ctx.fillRect(28, 54, 14, 22);
      ctx.fillRect(54, 50, 16, 26);
      ctx.fillRect(42, 44, 12, 28);

      // Agrupamentos de folhagem em camadas profundas
      // Camada traseira/sombra profunda
      this.desenharClusterFolhas(ctx, 12, 34, 36, 40, '#0c2614', '#154122', '#206334', '#349954');
      this.desenharClusterFolhas(ctx, 50, 30, 38, 42, '#0f2c17', '#174726', '#246d3a', '#3aa95e');

      // Camada superior iluminada
      this.desenharClusterFolhas(ctx, 28, 12, 44, 46, '#133a1e', '#1e5a31', '#2f8b4d', '#48d379');
      this.desenharClusterFolhas(ctx, 24, 44, 48, 36, '#174424', '#23693a', '#359956', '#59e18b');

      scene.textures.addCanvas('tree_large_1', canvas);
    }

    // -------------------------------------------------------------------------
    // D. TREE_OLD (96x128 px) - Árvore Centenária com Cavidade e Musgo
    // -------------------------------------------------------------------------
    if (!scene.textures.exists('tree_old')) {
      const canvas = document.createElement('canvas');
      canvas.width = 96;
      canvas.height = 128;
      const ctx = canvas.getContext('2d')!;
      ctx.imageSmoothingEnabled = false;

      // Sombra
      const grad = ctx.createRadialGradient(48, 118, 6, 48, 118, 42);
      grad.addColorStop(0, 'rgba(6, 14, 10, 0.65)');
      grad.addColorStop(1, 'rgba(6, 14, 10, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(8, 106, 80, 22);

      // Tronco tortuoso retorcido
      ctx.fillStyle = '#2c180e';
      ctx.fillRect(38, 70, 22, 48);
      ctx.fillStyle = '#442616';
      ctx.fillRect(41, 72, 14, 42);

      // Oco / Cavidade na árvore
      ctx.fillStyle = '#0f0805';
      ctx.fillRect(46, 88, 6, 10);

      // Musgo e trepadeiras
      ctx.fillStyle = '#166534';
      ctx.fillRect(36, 108, 10, 8);
      ctx.fillRect(52, 106, 12, 8);
      ctx.fillRect(40, 78, 4, 14);

      // Copa retorcida mais escura com folhas pendentes
      this.desenharClusterFolhas(ctx, 16, 16, 40, 44, '#0e2b17', '#174425', '#246739', '#389a57');
      this.desenharClusterFolhas(ctx, 44, 20, 40, 42, '#0c2715', '#143f22', '#216135', '#339452');
      this.desenharClusterFolhas(ctx, 26, 46, 46, 34, '#133a1e', '#1d572f', '#2d8448', '#42be6a');

      scene.textures.addCanvas('tree_old', canvas);
    }

    // -------------------------------------------------------------------------
    // E. TREE_DEAD (64x88 px) - Árvore Seca/Retorcida (Charco e Kaal)
    // -------------------------------------------------------------------------
    if (!scene.textures.exists('tree_dead_1')) {
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 88;
      const ctx = canvas.getContext('2d')!;
      ctx.imageSmoothingEnabled = false;

      // Sombra fina desbotada
      const grad = ctx.createRadialGradient(32, 80, 2, 32, 80, 20);
      grad.addColorStop(0, 'rgba(15, 10, 8, 0.45)');
      grad.addColorStop(1, 'rgba(15, 10, 8, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(14, 72, 36, 14);

      // Tronco cinzento seco com lascas e galhos pontiagudos
      ctx.fillStyle = '#26201b';
      ctx.fillRect(29, 46, 7, 34);
      ctx.fillStyle = '#3d342d';
      ctx.fillRect(30, 48, 4, 30);
      ctx.fillStyle = '#54473e';
      ctx.fillRect(31, 48, 2, 28);

      // Galhos secos angulares
      ctx.fillStyle = '#26201b';
      ctx.fillRect(20, 36, 10, 4);
      ctx.fillRect(16, 26, 6, 12);
      ctx.fillRect(12, 20, 6, 6);

      ctx.fillRect(34, 38, 12, 4);
      ctx.fillRect(44, 28, 4, 12);
      ctx.fillRect(46, 22, 6, 6);

      ctx.fillRect(28, 24, 6, 22);
      ctx.fillRect(26, 14, 5, 10);
      ctx.fillRect(30, 8, 3, 6);

      scene.textures.addCanvas('tree_dead_1', canvas);
    }
  }

  /**
   * Renderiza um agrupamento orgânico de folhagem com arestas pixel-art,
   * sombras profundas, tons intermediários e destaques de luz solar.
   */
  private static desenharClusterFolhas(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    cEscuro: string,
    cMedio: string,
    cClaro: string,
    cLuz: string
  ): void {
    // 1. Base / Sombra recortada
    ctx.fillStyle = cEscuro;
    ctx.fillRect(x + 4, y, w - 8, h);
    ctx.fillRect(x, y + 4, w, h - 8);
    ctx.fillRect(x + 2, y + 2, w - 4, h - 4);

    // 2. Volume intermediário
    ctx.fillStyle = cMedio;
    ctx.fillRect(x + 3, y + 2, w - 6, h - 6);
    ctx.fillRect(x + 5, y + 1, w - 10, h - 3);

    // 3. Área iluminada (lado superior e esquerdo)
    ctx.fillStyle = cClaro;
    ctx.fillRect(x + 4, y + 3, Math.floor(w * 0.65), Math.floor(h * 0.6));
    ctx.fillRect(x + 7, y + 2, Math.floor(w * 0.45), Math.floor(h * 0.4));

    // 4. Destaques de folhas solares (highlights)
    ctx.fillStyle = cLuz;
    ctx.fillRect(x + 6, y + 4, 5, 2);
    ctx.fillRect(x + 14, y + 3, 6, 2);
    ctx.fillRect(x + 8, y + 8, 4, 2);
    ctx.fillRect(x + 18, y + 9, 5, 2);

    // 5. Folhas salientes nas bordas (quebram silhueta quadrada)
    ctx.fillStyle = cMedio;
    ctx.fillRect(x - 2, y + Math.floor(h * 0.4), 3, 3);
    ctx.fillRect(x + w - 1, y + Math.floor(h * 0.5), 3, 3);
    ctx.fillRect(x + Math.floor(w * 0.5), y - 2, 4, 3);
  }

  // ===========================================================================
  // 3. PEDRAS E FORMAÇÕES ROCHOSAS (6 Variantes com Volume e Fissuras)
  // ===========================================================================
  private static gerarPedras(scene: Phaser.Scene): void {
    // -------------------------------------------------------------------------
    // 1. Rocha Grande Granito (48x36 px)
    // -------------------------------------------------------------------------
    if (!scene.textures.exists('rock_large_1')) {
      const canvas = document.createElement('canvas');
      canvas.width = 48;
      canvas.height = 36;
      const ctx = canvas.getContext('2d')!;
      ctx.imageSmoothingEnabled = false;

      // Sombra projetada
      const grad = ctx.createRadialGradient(24, 28, 4, 24, 28, 20);
      grad.addColorStop(0, 'rgba(8, 12, 18, 0.6)');
      grad.addColorStop(1, 'rgba(8, 12, 18, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(4, 20, 40, 16);

      // Base escura
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(6, 8, 36, 22);
      ctx.fillRect(4, 12, 40, 16);

      // Corpo de granito cinza azulado
      ctx.fillStyle = '#334155';
      ctx.fillRect(7, 9, 34, 18);

      // Facetas iluminadas (superior / esquerda)
      ctx.fillStyle = '#475569';
      ctx.fillRect(8, 9, 26, 12);
      ctx.fillStyle = '#64748b';
      ctx.fillRect(10, 10, 18, 6);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(12, 11, 8, 3);

      // Fissuras e fendas
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(18, 12, 2, 12);
      ctx.fillRect(20, 18, 4, 2);
      ctx.fillRect(28, 14, 2, 10);

      // Musgo nas fendas
      ctx.fillStyle = '#15803d';
      ctx.fillRect(6, 22, 6, 4);
      ctx.fillRect(32, 20, 5, 3);

      scene.textures.addCanvas('rock_large_1', canvas);
    }

    // -------------------------------------------------------------------------
    // 2. Formação Estratificada de Ardósia (40x32 px)
    // -------------------------------------------------------------------------
    if (!scene.textures.exists('rock_large_2')) {
      const canvas = document.createElement('canvas');
      canvas.width = 40;
      canvas.height = 32;
      const ctx = canvas.getContext('2d')!;
      ctx.imageSmoothingEnabled = false;

      // Sombra
      const grad = ctx.createRadialGradient(20, 24, 3, 20, 24, 16);
      grad.addColorStop(0, 'rgba(8, 12, 18, 0.55)');
      grad.addColorStop(1, 'rgba(8, 12, 18, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(4, 18, 32, 14);

      // Camadas geológicas
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(6, 8, 28, 18);
      ctx.fillStyle = '#334155';
      ctx.fillRect(7, 9, 26, 8);
      ctx.fillRect(8, 17, 24, 7);

      ctx.fillStyle = '#64748b';
      ctx.fillRect(9, 9, 20, 3);
      ctx.fillRect(10, 17, 18, 2);

      scene.textures.addCanvas('rock_large_2', canvas);
    }

    // -------------------------------------------------------------------------
    // 3. Rocha Média com Musgo (32x24 px)
    // -------------------------------------------------------------------------
    if (!scene.textures.exists('rock_med_1')) {
      const canvas = document.createElement('canvas');
      canvas.width = 32;
      canvas.height = 24;
      const ctx = canvas.getContext('2d')!;
      ctx.imageSmoothingEnabled = false;

      ctx.fillStyle = 'rgba(8, 12, 18, 0.5)';
      ctx.fillRect(3, 14, 26, 8);

      ctx.fillStyle = '#222d3d';
      ctx.fillRect(5, 5, 22, 14);
      ctx.fillStyle = '#3a4b61';
      ctx.fillRect(6, 6, 19, 10);
      ctx.fillStyle = '#60738a';
      ctx.fillRect(8, 7, 12, 4);

      // Musgo
      ctx.fillStyle = '#166534';
      ctx.fillRect(6, 12, 6, 4);

      scene.textures.addCanvas('rock_med_1', canvas);
    }

    // -------------------------------------------------------------------------
    // 4. Rocha Média Pontiaguda (30x22 px)
    // -------------------------------------------------------------------------
    if (!scene.textures.exists('rock_med_2')) {
      const canvas = document.createElement('canvas');
      canvas.width = 30;
      canvas.height = 22;
      const ctx = canvas.getContext('2d')!;
      ctx.imageSmoothingEnabled = false;

      ctx.fillStyle = 'rgba(8, 12, 18, 0.45)';
      ctx.fillRect(4, 13, 22, 8);

      ctx.fillStyle = '#26303d';
      ctx.fillRect(6, 4, 18, 14);
      ctx.fillStyle = '#425164';
      ctx.fillRect(8, 5, 14, 10);
      ctx.fillStyle = '#73869c';
      ctx.fillRect(10, 6, 8, 4);

      scene.textures.addCanvas('rock_med_2', canvas);
    }

    // -------------------------------------------------------------------------
    // 5. Rocha Pequena de Campo (20x16 px)
    // -------------------------------------------------------------------------
    if (!scene.textures.exists('rock_small_1')) {
      const canvas = document.createElement('canvas');
      canvas.width = 20;
      canvas.height = 16;
      const ctx = canvas.getContext('2d')!;
      ctx.imageSmoothingEnabled = false;

      ctx.fillStyle = 'rgba(8, 12, 18, 0.4)';
      ctx.fillRect(3, 9, 14, 6);

      ctx.fillStyle = '#2b3644';
      ctx.fillRect(4, 4, 12, 9);
      ctx.fillStyle = '#4c5c70';
      ctx.fillRect(5, 5, 9, 6);
      ctx.fillStyle = '#8293a8';
      ctx.fillRect(6, 5, 5, 2);

      scene.textures.addCanvas('rock_small_1', canvas);
    }

    // -------------------------------------------------------------------------
    // 6. Seixos e Pedregulhos (16x12 px)
    // -------------------------------------------------------------------------
    if (!scene.textures.exists('rock_small_2')) {
      const canvas = document.createElement('canvas');
      canvas.width = 16;
      canvas.height = 12;
      const ctx = canvas.getContext('2d')!;
      ctx.imageSmoothingEnabled = false;

      ctx.fillStyle = '#26313d';
      ctx.fillRect(2, 4, 6, 5);
      ctx.fillRect(9, 6, 5, 4);

      ctx.fillStyle = '#56677d';
      ctx.fillRect(3, 4, 4, 3);
      ctx.fillRect(10, 6, 3, 2);

      scene.textures.addCanvas('rock_small_2', canvas);
    }
  }

  // ===========================================================================
  // 4. TILESET PRINCIPAL 32x32 (Grama Orgânica, Flores, Água com Ondas, Estradas)
  // ===========================================================================
  private static gerarTilesetPrincipal(scene: Phaser.Scene): void {
    if (scene.textures.exists('tileset_v5')) {
      return;
    }

    // 16 tiles de 32x32 = 512x32 px
    // [0]: Grama Base Esmeralda A
    // [1]: Grama Base B (textura e mechas)
    // [2]: Grama Floral Branca & Amarela
    // [3]: Grama Floral Azul Arcano
    // [4]: Grama com Manchas Terrosas
    // [5]: Estrada Centro (terra batida e seixos)
    // [6]: Estrada Borda Superior com Grama
    // [7]: Estrada Borda Inferior com Grama
    // [8]: Estrada Borda Esquerda
    // [9]: Estrada Borda Direita
    // [10]: Muralha de Pedra Talhada com Musgo (sólido)
    // [11]: Água Cristalina Profunda (Frame 1)
    // [12]: Água com Ondas e Espuma (Frame 2)
    // [13]: Margem d'água com areia e pedras
    // [14]: Duna de Areia de Kaal
    // [15]: Piso de Pedra Ancestral / Santuário
    const canvas = document.createElement('canvas');
    canvas.width = TILE_SIZE * 16; // 512px
    canvas.height = TILE_SIZE;     // 32px
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;

    // --- Tile 0: Grama Base Esmeralda A ---
    let ox = 0;
    this.desenharTileGrama(ctx, ox, '#27633e', '#1f5333', '#337a4e', '#459962');

    // --- Tile 1: Grama Base B (com mechas naturais) ---
    ox = 32;
    this.desenharTileGrama(ctx, ox, '#27633e', '#1f5333', '#337a4e', '#459962');
    ctx.fillStyle = '#3ea66b';
    ctx.fillRect(ox + 6, 8, 3, 2);
    ctx.fillRect(ox + 18, 16, 4, 2);
    ctx.fillRect(ox + 10, 24, 3, 2);

    // --- Tile 2: Grama Floral Branca & Amarela ---
    ox = 64;
    this.desenharTileGrama(ctx, ox, '#27633e', '#1f5333', '#337a4e', '#459962');
    // Margarida 1
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(ox + 8, 10, 4, 4);
    ctx.fillStyle = '#facc15';
    ctx.fillRect(ox + 9, 11, 2, 2);
    // Margarida 2
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(ox + 22, 18, 4, 4);
    ctx.fillStyle = '#facc15';
    ctx.fillRect(ox + 23, 19, 2, 2);

    // --- Tile 3: Grama Floral Azul Arcano ---
    ox = 96;
    this.desenharTileGrama(ctx, ox, '#27633e', '#1f5333', '#337a4e', '#459962');
    // Flores silvestres azul celeste
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(ox + 12, 8, 3, 3);
    ctx.fillStyle = '#e0f2fe';
    ctx.fillRect(ox + 13, 9, 1, 1);
    ctx.fillStyle = '#818cf8';
    ctx.fillRect(ox + 20, 22, 3, 3);

    // --- Tile 4: Grama com Terra Batida ---
    ox = 128;
    this.desenharTileGrama(ctx, ox, '#27633e', '#1f5333', '#337a4e', '#459962');
    ctx.fillStyle = '#4d3725';
    ctx.fillRect(ox + 8, 12, 14, 10);
    ctx.fillStyle = '#6b4c32';
    ctx.fillRect(ox + 10, 13, 10, 6);
    ctx.fillStyle = '#322215';
    ctx.fillRect(ox + 12, 15, 6, 3);
    // Folha seca caída
    ctx.fillStyle = '#ea580c';
    ctx.fillRect(ox + 24, 8, 2, 2);

    // --- Tile 5: Estrada Centro (Terra e Seixos) ---
    ox = 160;
    ctx.fillStyle = '#6e5037';
    ctx.fillRect(ox, 0, 32, 32);
    ctx.fillStyle = '#805f42';
    ctx.fillRect(ox + 4, 4, 24, 24);
    // Ranhuras orgânicas e seixos
    ctx.fillStyle = '#573d28';
    ctx.fillRect(ox + 2, 10, 28, 2);
    ctx.fillRect(ox + 2, 22, 28, 2);
    ctx.fillStyle = '#a89c8d'; // Seixos claros
    ctx.fillRect(ox + 8, 6, 3, 2);
    ctx.fillRect(ox + 22, 14, 3, 2);
    ctx.fillRect(ox + 14, 26, 3, 2);

    // --- Tile 6: Estrada Borda Superior (transição para grama) ---
    ox = 192;
    ctx.fillStyle = '#6e5037';
    ctx.fillRect(ox, 0, 32, 32);
    ctx.fillStyle = '#27633e';
    ctx.fillRect(ox, 0, 32, 10);
    // Dentes de grama sobre a estrada
    ctx.fillStyle = '#1f5333';
    ctx.fillRect(ox + 4, 10, 3, 3);
    ctx.fillRect(ox + 12, 10, 4, 4);
    ctx.fillRect(ox + 22, 10, 3, 3);

    // --- Tile 7: Estrada Borda Inferior ---
    ox = 224;
    ctx.fillStyle = '#6e5037';
    ctx.fillRect(ox, 0, 32, 32);
    ctx.fillStyle = '#27633e';
    ctx.fillRect(ox, 22, 32, 10);
    ctx.fillStyle = '#1f5333';
    ctx.fillRect(ox + 6, 19, 4, 3);
    ctx.fillRect(ox + 16, 18, 4, 4);

    // --- Tile 8: Estrada Borda Esquerda ---
    ox = 256;
    ctx.fillStyle = '#6e5037';
    ctx.fillRect(ox, 0, 32, 32);
    ctx.fillStyle = '#27633e';
    ctx.fillRect(ox, 0, 10, 32);
    ctx.fillStyle = '#1f5333';
    ctx.fillRect(ox + 10, 6, 3, 4);
    ctx.fillRect(ox + 10, 18, 3, 4);

    // --- Tile 9: Estrada Borda Direita ---
    ox = 288;
    ctx.fillStyle = '#6e5037';
    ctx.fillRect(ox, 0, 32, 32);
    ctx.fillStyle = '#27633e';
    ctx.fillRect(ox + 22, 0, 10, 32);
    ctx.fillStyle = '#1f5333';
    ctx.fillRect(ox + 19, 8, 3, 4);
    ctx.fillRect(ox + 19, 20, 3, 4);

    // --- Tile 10: Muralha de Pedra Talhada Ancestral com Musgo (Sólido) ---
    ox = 320;
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(ox, 0, 32, 32);
    // Blocos talhados com argamassa
    ctx.fillStyle = '#334155';
    ctx.fillRect(ox + 1, 1, 30, 13);
    ctx.fillRect(ox + 1, 16, 14, 15);
    ctx.fillRect(ox + 17, 16, 14, 15);
    // Relevo biselado (luz no topo dos blocos)
    ctx.fillStyle = '#64748b';
    ctx.fillRect(ox + 2, 2, 28, 2);
    ctx.fillRect(ox + 2, 17, 12, 2);
    ctx.fillRect(ox + 18, 17, 12, 2);
    // Musgo verdejante nos sulcos
    ctx.fillStyle = '#15803d';
    ctx.fillRect(ox + 6, 12, 8, 3);
    ctx.fillRect(ox + 15, 26, 6, 4);

    // --- Tile 11: Água Cristalina Profunda (Frame 1) ---
    ox = 352;
    ctx.fillStyle = '#1e3a8a';
    ctx.fillRect(ox, 0, 32, 32);
    ctx.fillStyle = '#2563eb';
    ctx.fillRect(ox + 4, 6, 14, 5);
    ctx.fillRect(ox + 14, 18, 14, 5);
    ctx.fillStyle = '#60a5fa';
    ctx.fillRect(ox + 6, 7, 8, 2);
    ctx.fillRect(ox + 16, 19, 8, 2);

    // --- Tile 12: Água com Ondas e Espuma (Frame 2) ---
    ox = 384;
    ctx.fillStyle = '#1e3a8a';
    ctx.fillRect(ox, 0, 32, 32);
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(ox + 2, 10, 20, 4);
    ctx.fillRect(ox + 10, 22, 18, 4);
    ctx.fillStyle = '#93c5fd';
    ctx.fillRect(ox + 4, 11, 14, 2);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(ox + 8, 11, 6, 1);

    // --- Tile 13: Margem da Água / Praia ---
    ox = 416;
    ctx.fillStyle = '#1e3a8a';
    ctx.fillRect(ox, 0, 32, 32);
    ctx.fillStyle = '#b45309'; // Areia úmida
    ctx.fillRect(ox, 0, 32, 12);
    ctx.fillStyle = '#d97706';
    ctx.fillRect(ox, 0, 32, 8);
    // Espuma quebrando
    ctx.fillStyle = '#e0f2fe';
    ctx.fillRect(ox, 11, 32, 3);

    // --- Tile 14: Dunas de Areia de Kaal ---
    ox = 448;
    ctx.fillStyle = '#d97706';
    ctx.fillRect(ox, 0, 32, 32);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(ox + 2, 4, 28, 10);
    ctx.fillRect(ox + 2, 18, 28, 10);
    ctx.fillStyle = '#b45309';
    ctx.fillRect(ox, 14, 32, 2);
    ctx.fillRect(ox, 28, 32, 2);

    // --- Tile 15: Piso de Pedra Sagrado (Santuário) ---
    ox = 480;
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(ox, 0, 32, 32);
    ctx.fillStyle = '#334155';
    ctx.fillRect(ox + 2, 2, 28, 28);
    // Runa esculpida central
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(ox + 14, 6, 4, 20);
    ctx.fillRect(ox + 8, 12, 16, 4);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(ox + 15, 13, 2, 2);

    scene.textures.addCanvas('tileset_v5', canvas);
  }

  /**
   * Helper para gerar a trama de grama rica sem repetição geométrica
   */
  private static desenharTileGrama(
    ctx: CanvasRenderingContext2D,
    ox: number,
    cBase: string,
    cEscuro: string,
    cClaro: string,
    cLuz: string
  ): void {
    ctx.fillStyle = cBase;
    ctx.fillRect(ox, 0, 32, 32);

    // Textura orgânica estocástica
    ctx.fillStyle = cEscuro;
    ctx.fillRect(ox + 4, 6, 4, 3);
    ctx.fillRect(ox + 16, 12, 5, 3);
    ctx.fillRect(ox + 8, 22, 5, 3);
    ctx.fillRect(ox + 24, 24, 4, 3);

    ctx.fillStyle = cClaro;
    ctx.fillRect(ox + 5, 4, 4, 2);
    ctx.fillRect(ox + 17, 10, 4, 2);
    ctx.fillRect(ox + 9, 20, 4, 2);

    ctx.fillStyle = cLuz;
    ctx.fillRect(ox + 6, 4, 2, 1);
    ctx.fillRect(ox + 18, 10, 2, 1);
    ctx.fillRect(ox + 10, 20, 2, 1);
  }

  // ===========================================================================
  // 5. ELEMENTOS DECORATIVOS E ARBUSTOS
  // ===========================================================================
  private static gerarDecoresEFloresta(scene: Phaser.Scene): void {
    // Arbusto florido do Vale (32x28 px)
    if (!scene.textures.exists('decor_arbusto_vale')) {
      const canvas = document.createElement('canvas');
      canvas.width = 32;
      canvas.height = 28;
      const ctx = canvas.getContext('2d')!;
      ctx.imageSmoothingEnabled = false;

      ctx.fillStyle = 'rgba(8, 16, 12, 0.45)';
      ctx.fillRect(4, 18, 24, 8);

      this.desenharClusterFolhas(ctx, 4, 4, 24, 20, '#143e20', '#226335', '#359353', '#5ae088');

      // Frutinhas vermelhas / bagas
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(10, 10, 3, 3);
      ctx.fillRect(18, 12, 3, 3);
      ctx.fillRect(14, 16, 3, 3);

      scene.textures.addCanvas('decor_arbusto_vale', canvas);
    }

    // Tocha com pedestal de pedra para santuários e masmorras (24x36 px)
    if (!scene.textures.exists('decor_tocha')) {
      const canvas = document.createElement('canvas');
      canvas.width = 24;
      canvas.height = 36;
      const ctx = canvas.getContext('2d')!;
      ctx.imageSmoothingEnabled = false;

      // Pedestal de ferro e pedra
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(8, 16, 8, 18);
      ctx.fillStyle = '#475569';
      ctx.fillRect(9, 17, 6, 16);
      ctx.fillStyle = '#64748b';
      ctx.fillRect(6, 14, 12, 3);

      // Fogo flamejante
      ctx.fillStyle = '#ea580c';
      ctx.fillRect(8, 6, 8, 8);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(9, 4, 6, 8);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(10, 2, 4, 6);

      scene.textures.addCanvas('decor_tocha', canvas);
    }

    // =========================================================================
    // FASE 9: ASSETS GEOGRÁFICOS E ECOLÓGICOS (ÁGUA, MARGEM, TRANSIÇÃO, FLORESTA)
    // =========================================================================

    // 1. Juncos e Taboas Ribeirinhas (24x32 px) para RIVER_BANK
    if (!scene.textures.exists('decor_juncos_v6')) {
      const canvas = document.createElement('canvas');
      canvas.width = 24;
      canvas.height = 32;
      const ctx = canvas.getContext('2d')!;
      ctx.imageSmoothingEnabled = false;

      // Sombra na base úmida
      ctx.fillStyle = 'rgba(8, 16, 12, 0.40)';
      ctx.fillRect(4, 26, 16, 5);

      // Hastes de juncos verdes esguias
      ctx.fillStyle = '#166534';
      ctx.fillRect(7, 8, 2, 22);
      ctx.fillRect(11, 4, 2, 26);
      ctx.fillRect(15, 6, 2, 24);
      ctx.fillRect(18, 10, 2, 20);

      // Folhas laterais pontiagudas
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(5, 14, 2, 8);
      ctx.fillRect(13, 10, 2, 10);
      ctx.fillRect(17, 12, 2, 8);

      // Espigas aveludadas marrons (cattail heads)
      ctx.fillStyle = '#54301a';
      ctx.fillRect(6, 6, 4, 10);
      ctx.fillRect(10, 2, 4, 11);
      ctx.fillRect(14, 4, 4, 10);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(7, 7, 2, 8);
      ctx.fillRect(11, 3, 2, 9);
      ctx.fillRect(15, 5, 2, 8);

      scene.textures.addCanvas('decor_juncos_v6', canvas);
    }

    // 2. Vitória-Régia / Lírio d'Água com Flor (28x20 px) para SHALLOW_WATER / RIVER
    if (!scene.textures.exists('decor_vitoria_regia_v6')) {
      const canvas = document.createElement('canvas');
      canvas.width = 28;
      canvas.height = 20;
      const ctx = canvas.getContext('2d')!;
      ctx.imageSmoothingEnabled = false;

      // Sombra na água sob a folha flutuante
      ctx.fillStyle = 'rgba(10, 25, 45, 0.45)';
      ctx.beginPath();
      ctx.ellipse(14, 12, 12, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Folha flutuante verde redonda com chanfro natural (fenda)
      ctx.fillStyle = '#15803d';
      ctx.beginPath();
      ctx.ellipse(14, 10, 12, 6.5, 0, 0.2, Math.PI * 1.85);
      ctx.lineTo(14, 10);
      ctx.closePath();
      ctx.fill();

      // Borda clara iluminada
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.ellipse(13, 9, 10, 5, 0, 0.3, Math.PI * 1.8);
      ctx.fill();

      ctx.fillStyle = '#4ade80';
      ctx.fillRect(9, 7, 6, 2);

      // Flor aquática no centro (pétalas brancas/rosadas e miolo amarelo)
      ctx.fillStyle = '#fce7f3';
      ctx.fillRect(12, 6, 5, 4);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(13, 5, 3, 3);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(14, 6, 2, 2);

      scene.textures.addCanvas('decor_vitoria_regia_v6', canvas);
    }

    // 3. Seixos Rolados Lisos de Margem (28x16 px) para RIVER_BANK
    if (!scene.textures.exists('decor_pedras_margem_v6')) {
      const canvas = document.createElement('canvas');
      canvas.width = 28;
      canvas.height = 16;
      const ctx = canvas.getContext('2d')!;
      ctx.imageSmoothingEnabled = false;

      // Sombra úmida na areia
      ctx.fillStyle = 'rgba(15, 20, 25, 0.50)';
      ctx.fillRect(2, 8, 24, 7);

      // Seixo maior esquerdo (ardósia polida pela água)
      ctx.fillStyle = '#334155';
      ctx.fillRect(4, 4, 12, 8);
      ctx.fillRect(5, 3, 10, 10);
      ctx.fillStyle = '#64748b';
      ctx.fillRect(5, 3, 8, 4);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(6, 4, 4, 2);

      // Seixo menor direito
      ctx.fillStyle = '#475569';
      ctx.fillRect(16, 6, 9, 7);
      ctx.fillStyle = '#64748b';
      ctx.fillRect(17, 5, 7, 4);
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(18, 5, 3, 1);

      // Fresta com areia molhada
      ctx.fillStyle = '#5c432d';
      ctx.fillRect(13, 8, 3, 4);

      scene.textures.addCanvas('decor_pedras_margem_v6', canvas);
    }

    // 4. Pedra Submersa na Água Rasa (22x14 px) para SHALLOW_WATER
    if (!scene.textures.exists('decor_pedra_submersa_v6')) {
      const canvas = document.createElement('canvas');
      canvas.width = 22;
      canvas.height = 14;
      const ctx = canvas.getContext('2d')!;
      ctx.imageSmoothingEnabled = false;

      // Pedra arredondada com filtro azulado translúcido da água
      ctx.fillStyle = '#1e3a5f';
      ctx.fillRect(3, 3, 16, 8);
      ctx.fillStyle = '#2d537d';
      ctx.fillRect(4, 2, 14, 7);
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(6, 3, 8, 3);
      // Reflexo ondulado de luz aquática
      ctx.fillStyle = '#93c5fd';
      ctx.fillRect(7, 3, 4, 1);

      scene.textures.addCanvas('decor_pedra_submersa_v6', canvas);
    }

    // 5. Faixa de Solo Úmido e Transição Ribeirinha (36x24 px) para RIVER_BANK
    if (!scene.textures.exists('decor_borda_solo_umido_v6')) {
      const canvas = document.createElement('canvas');
      canvas.width = 36;
      canvas.height = 24;
      const ctx = canvas.getContext('2d')!;
      ctx.imageSmoothingEnabled = false;

      // Solo encharcado / areia escura
      ctx.fillStyle = '#3f2d1d';
      ctx.fillRect(2, 4, 32, 16);
      ctx.fillStyle = '#543c27';
      ctx.fillRect(4, 6, 28, 12);
      ctx.fillStyle = '#2b1d12';
      ctx.fillRect(6, 12, 20, 6);

      // Pequenas irregularidades e cascalho
      ctx.fillStyle = '#785638';
      ctx.fillRect(8, 7, 4, 2);
      ctx.fillRect(20, 9, 5, 2);
      ctx.fillStyle = '#8e8273';
      ctx.fillRect(10, 14, 2, 2);
      ctx.fillRect(24, 15, 3, 2);

      // Dentes de grama na transição
      ctx.fillStyle = '#1e5433';
      ctx.fillRect(2, 2, 6, 4);
      ctx.fillRect(16, 2, 8, 3);
      ctx.fillRect(28, 3, 5, 3);

      scene.textures.addCanvas('decor_borda_solo_umido_v6', canvas);
    }

    // 6. Cogumelos Silvestres de Base de Árvore (18x14 px) para FOREST
    if (!scene.textures.exists('decor_cogumelos_floresta_v6')) {
      const canvas = document.createElement('canvas');
      canvas.width = 18;
      canvas.height = 14;
      const ctx = canvas.getContext('2d')!;
      ctx.imageSmoothingEnabled = false;

      // Sombra
      ctx.fillStyle = 'rgba(8, 14, 10, 0.45)';
      ctx.fillRect(2, 9, 14, 4);

      // Cogumelo 1 (maior, vermelho com pintas brancas)
      // Talo
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(5, 6, 3, 6);
      // Chapéu
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(2, 2, 9, 5);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(3, 1, 7, 3);
      // Pontos brancos
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(4, 2, 2, 1);
      ctx.fillRect(8, 3, 1, 1);

      // Cogumelo 2 (menor, marrom terroso)
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(13, 8, 2, 4);
      ctx.fillStyle = '#b45309';
      ctx.fillRect(11, 5, 6, 4);
      ctx.fillStyle = '#d97706';
      ctx.fillRect(12, 5, 4, 2);

      scene.textures.addCanvas('decor_cogumelos_floresta_v6', canvas);
    }

    // 7. Seixos Planos da Trilha (20x12 px) para PATH
    if (!scene.textures.exists('decor_seixos_trilha_v6')) {
      const canvas = document.createElement('canvas');
      canvas.width = 20;
      canvas.height = 12;
      const ctx = canvas.getContext('2d')!;
      ctx.imageSmoothingEnabled = false;

      ctx.fillStyle = 'rgba(20, 15, 10, 0.35)';
      ctx.fillRect(2, 4, 16, 6);

      ctx.fillStyle = '#786854';
      ctx.fillRect(3, 3, 6, 4);
      ctx.fillStyle = '#9e8c75';
      ctx.fillRect(4, 2, 4, 2);

      ctx.fillStyle = '#6b5c4b';
      ctx.fillRect(12, 4, 5, 4);
      ctx.fillStyle = '#8a7761';
      ctx.fillRect(13, 3, 3, 2);

      scene.textures.addCanvas('decor_seixos_trilha_v6', canvas);
    }

    // 8. Arbustos Densos de Orla de Floresta (40x26 px) para TRANSITION
    if (!scene.textures.exists('decor_borda_mata_v6')) {
      const canvas = document.createElement('canvas');
      canvas.width = 40;
      canvas.height = 26;
      const ctx = canvas.getContext('2d')!;
      ctx.imageSmoothingEnabled = false;

      ctx.fillStyle = 'rgba(8, 16, 12, 0.45)';
      ctx.fillRect(4, 18, 32, 7);

      this.desenharClusterFolhas(ctx, 4, 4, 32, 18, '#0f3818', '#1a5929', '#2d8c43', '#52e078');

      // Bagas silvestres esparsas
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(10, 10, 2, 2);
      ctx.fillRect(22, 8, 2, 2);
      ctx.fillRect(28, 14, 2, 2);

      scene.textures.addCanvas('decor_borda_mata_v6', canvas);
    }

    // 9. Dossel de Floresta Densa para o Limite Norte do Mapa (192x64 px)
    // Permite justificar ecologicamente a fronteira norte com copas impenetráveis
    if (!scene.textures.exists('canopy_dense_north')) {
      const canvas = document.createElement('canvas');
      canvas.width = 192;
      canvas.height = 64;
      const ctx = canvas.getContext('2d')!;
      ctx.imageSmoothingEnabled = false;

      // Base escura de folhagem profunda
      ctx.fillStyle = '#0a2312';
      ctx.fillRect(0, 0, 192, 42);

      // Múltiplos domos de copa sobrepostos
      for (let i = 0; i < 6; i++) {
        const cx = 16 + i * 32;
        this.desenharClusterFolhas(ctx, cx - 18, 2, 38, 56, '#0d2d17', '#174f26', '#267d3d', '#4ade80');
      }

      scene.textures.addCanvas('canopy_dense_north', canvas);
    }
  }
}
