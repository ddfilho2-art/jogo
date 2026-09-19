import Phaser from 'phaser';

// =============================================================================
// ELDRIM: ECOS DO PASSADO - GERADOR DE TEXTURAS E TILESET 24x24 (DIRETIVA V3)
// =============================================================================
// Unidade visual principal do grid: 24x24 pixels.
// Inclui tileset com múltiplas variações de terreno, flores, água animada,
// caminhos de terra, além de árvores frondosas (48x64) e rochas detalhadas (36x28).
// =============================================================================

export const TILE_SIZE = 24;

export function gerarTexturasBasicas(scene: Phaser.Scene): void {
  // 1. Textura de Sombra Elíptica Suave para Ren e Criaturas
  if (!scene.textures.exists('sombra_elipse')) {
    const canvas = document.createElement('canvas');
    canvas.width = 20;
    canvas.height = 10;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(10, 5, 1, 10, 5, 9);
      grad.addColorStop(0, 'rgba(10, 15, 25, 0.55)');
      grad.addColorStop(0.7, 'rgba(10, 15, 25, 0.25)');
      grad.addColorStop(1, 'rgba(10, 15, 25, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 20, 10);
    }
    scene.textures.addCanvas('sombra_elipse', canvas);
  }

  // 2. Tileset Unificado de 8 Tiles (192x24 px): 24x24 pixels cada
  // [0]: Grama Base A
  // [1]: Grama Floral B (flores brancas e douradas)
  // [2]: Grama com Detalhes Terrosos C
  // [3]: Caminho de Terra Batida / Pedras Lisas
  // [4]: Muralha / Parede de Pedra com Musgo
  // [5]: Água Cristalina Profunda
  // [6]: Água com Espuma / Margem
  // [7]: Duna de Areia de Kaal
  if (!scene.textures.exists('tileset_basico')) {
    const canvas = document.createElement('canvas');
    canvas.width = TILE_SIZE * 8; // 192px
    canvas.height = TILE_SIZE;     // 24px
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.imageSmoothingEnabled = false;

      // --- Tile 0: Grama Base A (Verde Esmeralda Vivo de Eldrim) ---
      let ox = 0;
      ctx.fillStyle = '#2f6d48';
      ctx.fillRect(ox, 0, 24, 24);
      // Tufos de grama e luz
      ctx.fillStyle = '#3a8357';
      ctx.fillRect(ox + 4, 3, 3, 2);
      ctx.fillRect(ox + 14, 8, 4, 2);
      ctx.fillRect(ox + 7, 16, 3, 2);
      ctx.fillStyle = '#235236';
      ctx.fillRect(ox + 4, 5, 3, 1);
      ctx.fillRect(ox + 14, 10, 4, 1);
      ctx.fillRect(ox + 7, 18, 3, 1);

      // --- Tile 1: Grama Floral B (Flores silvestres do Vale) ---
      ox = 24;
      ctx.fillStyle = '#2f6d48';
      ctx.fillRect(ox, 0, 24, 24);
      ctx.fillStyle = '#3a8357';
      ctx.fillRect(ox + 12, 4, 3, 2);
      // Flor 1 (branca e miolo amarelo)
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(ox + 5, 8, 3, 3);
      ctx.fillStyle = '#fde047';
      ctx.fillRect(ox + 6, 9, 1, 1);
      // Flor 2 (azul suave)
      ctx.fillStyle = '#93c5fd';
      ctx.fillRect(ox + 17, 14, 3, 3);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(ox + 18, 15, 1, 1);

      // --- Tile 2: Grama com Terra C ---
      ox = 48;
      ctx.fillStyle = '#2f6d48';
      ctx.fillRect(ox, 0, 24, 24);
      ctx.fillStyle = '#5c4530';
      ctx.fillRect(ox + 6, 11, 8, 5);
      ctx.fillStyle = '#7a5c40';
      ctx.fillRect(ox + 7, 12, 6, 3);
      ctx.fillStyle = '#3e2e20';
      ctx.fillRect(ox + 8, 14, 4, 2);
      // Folha caída
      ctx.fillStyle = '#ea580c';
      ctx.fillRect(ox + 16, 6, 2, 2);

      // --- Tile 3: Caminho de Terra e Pedregulhos ---
      ox = 72;
      ctx.fillStyle = '#70543c';
      ctx.fillRect(ox, 0, 24, 24);
      ctx.fillStyle = '#87674b';
      ctx.fillRect(ox + 2, 2, 9, 8);
      ctx.fillRect(ox + 13, 11, 8, 9);
      ctx.fillStyle = '#543e2c';
      ctx.fillRect(ox + 1, 10, 22, 2);
      ctx.fillRect(ox + 10, 1, 2, 22);
      // Pedregulhos claros incrustados
      ctx.fillStyle = '#a89f91';
      ctx.fillRect(ox + 5, 5, 3, 2);
      ctx.fillRect(ox + 15, 15, 3, 2);

      // --- Tile 4: Parede/Muralha de Pedra com Musgo ---
      ox = 96;
      ctx.fillStyle = '#374151';
      ctx.fillRect(ox, 0, 24, 24);
      // Blocos de pedra talhados
      ctx.fillStyle = '#4b5563';
      ctx.fillRect(ox + 1, 1, 22, 10);
      ctx.fillRect(ox + 1, 12, 10, 11);
      ctx.fillRect(ox + 12, 12, 11, 11);
      // Linhas de argamassa profunda
      ctx.fillStyle = '#1f2937';
      ctx.fillRect(ox, 11, 24, 1);
      ctx.fillRect(ox + 11, 12, 1, 12);
      // Borda superior iluminada (bevel)
      ctx.fillStyle = '#6b7280';
      ctx.fillRect(ox + 1, 1, 22, 1);
      ctx.fillRect(ox + 1, 12, 10, 1);
      ctx.fillRect(ox + 12, 12, 11, 1);
      // Musgo verdejante nos vãos
      ctx.fillStyle = '#166534';
      ctx.fillRect(ox + 3, 9, 5, 3);
      ctx.fillRect(ox + 14, 20, 6, 3);

      // --- Tile 5: Água Cristalina Profunda ---
      ox = 120;
      ctx.fillStyle = '#1e40af';
      ctx.fillRect(ox, 0, 24, 24);
      ctx.fillStyle = '#2563eb';
      ctx.fillRect(ox + 2, 5, 9, 4);
      ctx.fillRect(ox + 12, 14, 10, 4);
      ctx.fillStyle = '#60a5fa';
      ctx.fillRect(ox + 4, 6, 5, 1);
      ctx.fillRect(ox + 14, 15, 6, 1);

      // --- Tile 6: Água com Margem / Ondas ---
      ox = 144;
      ctx.fillStyle = '#1e3a8a';
      ctx.fillRect(ox, 0, 24, 24);
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(ox + 1, 2, 22, 5);
      ctx.fillStyle = '#93c5fd';
      ctx.fillRect(ox + 3, 3, 18, 2);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(ox + 6, 3, 8, 1);

      // --- Tile 7: Duna de Kaal ---
      ox = 168;
      ctx.fillStyle = '#d97706';
      ctx.fillRect(ox, 0, 24, 24);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(ox + 2, 3, 20, 7);
      ctx.fillRect(ox + 1, 13, 22, 7);
      ctx.fillStyle = '#b45309';
      ctx.fillRect(ox, 10, 24, 2);
      ctx.fillRect(ox, 20, 24, 2);
    }
    scene.textures.addCanvas('tileset_basico', canvas);
  }

  // 3. Árvore Frondosa de Grande Porte (48x64 px) para Y-Sort
  // Copa volumosa em camadas de folhas, tronco com raízes e sombra elíptica
  if (!scene.textures.exists('arvore_grande')) {
    const canvas = document.createElement('canvas');
    canvas.width = 48;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.imageSmoothingEnabled = false;

      // Sombra projetada sob a árvore no chão
      const grad = ctx.createRadialGradient(24, 58, 2, 24, 58, 20);
      grad.addColorStop(0, 'rgba(10, 20, 15, 0.6)');
      grad.addColorStop(1, 'rgba(10, 20, 15, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(4, 50, 40, 14);

      // Tronco de carvalho rústico
      ctx.fillStyle = '#452a19';
      ctx.fillRect(19, 36, 10, 22);
      ctx.fillStyle = '#5c3822';
      ctx.fillRect(20, 36, 7, 20);
      ctx.fillStyle = '#2f1b0f';
      ctx.fillRect(19, 44, 2, 14);
      ctx.fillRect(27, 44, 2, 14);
      // Raízes
      ctx.fillStyle = '#452a19';
      ctx.fillRect(16, 54, 4, 4);
      ctx.fillRect(28, 54, 4, 4);

      // Copa Volumosa em Camadas (Foliage)
      // Camada sombra inferior
      ctx.fillStyle = '#143d25';
      ctx.beginPath();
      ctx.arc(24, 28, 20, 0, Math.PI * 2);
      ctx.fill();

      // Camada intermediária
      ctx.fillStyle = '#1e5433';
      ctx.beginPath();
      ctx.arc(18, 22, 14, 0, Math.PI * 2);
      ctx.arc(30, 22, 14, 0, Math.PI * 2);
      ctx.arc(24, 16, 15, 0, Math.PI * 2);
      ctx.fill();

      // Camada iluminada superior
      ctx.fillStyle = '#2d7a4b';
      ctx.beginPath();
      ctx.arc(20, 18, 12, 0, Math.PI * 2);
      ctx.arc(28, 18, 12, 0, Math.PI * 2);
      ctx.arc(24, 13, 12, 0, Math.PI * 2);
      ctx.fill();

      // Highlight de folhagem brilhante
      ctx.fillStyle = '#4ade80';
      ctx.fillRect(20, 8, 8, 3);
      ctx.fillRect(13, 14, 5, 3);
      ctx.fillRect(29, 14, 6, 3);
    }
    scene.textures.addCanvas('arvore_grande', canvas);
  }

  // 4. Rocha de Vale com Volume (36x28 px)
  if (!scene.textures.exists('rocha_vale')) {
    const canvas = document.createElement('canvas');
    canvas.width = 36;
    canvas.height = 28;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.imageSmoothingEnabled = false;

      // Sombra da rocha
      const grad = ctx.createRadialGradient(18, 22, 2, 18, 22, 14);
      grad.addColorStop(0, 'rgba(10, 15, 20, 0.55)');
      grad.addColorStop(1, 'rgba(10, 15, 20, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(2, 16, 32, 12);

      // Corpo da rocha (cinza azulado montanhoso)
      ctx.fillStyle = '#334155';
      ctx.fillRect(6, 6, 24, 18);
      ctx.fillRect(4, 10, 28, 12);

      // Facetas iluminadas (superior e esquerda)
      ctx.fillStyle = '#64748b';
      ctx.fillRect(6, 6, 20, 5);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(8, 7, 10, 3);

      // Sombra inferior e fendas
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(6, 20, 24, 4);
      ctx.fillRect(16, 11, 2, 8);
      ctx.fillRect(22, 14, 3, 5);

      // Pequeno musgo aderido
      ctx.fillStyle = '#15803d';
      ctx.fillRect(5, 17, 4, 3);
    }
    scene.textures.addCanvas('rocha_vale', canvas);
  }
}
