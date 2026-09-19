import Phaser from 'phaser';
import { TILE_SIZE } from './config';

// =============================================================================
// ELDRIM: ECOS DO PASSADO - UTILITÁRIO DE TILEMAP DINÂMICO 32x32 (DIRETIVA V5)
// =============================================================================
// Cria o Tilemap da sala a partir de matriz 2D com tiles de 32x32 pixels.
// Configura colisões em índices de paredes e obstáculos sólidos (índices 10, 11, 12).
// =============================================================================

export function criarSalaTilemap(
  scene: Phaser.Scene,
  dadosGrid: number[][]
): Phaser.Tilemaps.TilemapLayer {
  // 1. Criação do Tilemap com tileWidth: 32, tileHeight: 32
  const map = scene.make.tilemap({
    data: dadosGrid,
    tileWidth: TILE_SIZE,
    tileHeight: TILE_SIZE,
  });

  // 2. Adiciona o tileset baseado na textura 'tileset_v5' de 32x32
  const tileset = map.addTilesetImage('tileset_v5', 'tileset_v5', TILE_SIZE, TILE_SIZE, 0, 0);
  if (!tileset) {
    throw new Error('Falha ao instanciar tileset_v5 32x32 em criarSalaTilemap');
  }

  // 3. Cria a camada visual do mapa no ponto (0, 0)
  const layer = map.createLayer(0, tileset, 0, 0);
  if (!layer) {
    throw new Error('Falha ao criar TilemapLayer');
  }

  // 4. Configura colisão no índice 10 (muralha de pedra) e índices 11/12 (água profunda)
  layer.setCollision([10, 11, 12]);

  return layer as Phaser.Tilemaps.TilemapLayer;
}

