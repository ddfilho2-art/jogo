import { GraphicsDevice, Mesh } from 'playcanvas';

// =============================================================================
// ELDRIM: ECOS DO PASSADO - PIXEL QUAD MESH (PLAYCANVAS ENGINE V2)
// =============================================================================
// Malhas planas 2D no plano XY (olhando para +Z), com âncoras/pivôs configuráveis
// (0.5, 0) para personagens e árvores (âncora nos pés/raiz)
// (0.5, 0.5) para partículas e projéteis
// (0, 0) para tiles de terreno
// =============================================================================

export interface QuadMeshOptions {
  width?: number;
  height?: number;
  pivotX?: number; // 0 = esquerda, 0.5 = centro, 1 = direita
  pivotY?: number; // 0 = base/pés, 0.5 = centro, 1 = topo
  uMin?: number;
  vMin?: number;
  uMax?: number;
  vMax?: number;
}

/**
 * Cria uma malha de quad 2D no plano XY, ideal para top-down 2D/2.5D
 */
export function createPixelQuadMesh(
  device: GraphicsDevice,
  options: QuadMeshOptions = {}
): Mesh {
  const w = options.width ?? 1;
  const h = options.height ?? 1;
  const px = options.pivotX ?? 0.5;
  const py = options.pivotY ?? 0.5;

  const left = -w * px;
  const right = w * (1 - px);
  const bottom = -h * py;
  const top = h * (1 - py);

  const u0 = options.uMin ?? 0;
  const v0 = options.vMin ?? 0;
  const u1 = options.uMax ?? 1;
  const v1 = options.vMax ?? 1;

  // 4 vértices no plano XY (Z=0), voltados para +Z (câmera)
  // Ordem: BL, BR, TR, TL
  const positions = [
    left,  bottom, 0,
    right, bottom, 0,
    right, top,    0,
    left,  top,    0,
  ];

  const normals = [
    0, 0, 1,
    0, 0, 1,
    0, 0, 1,
    0, 0, 1,
  ];

  // UVs para Quad 2D no plano XY voltado para +Z (câmera ortográfica):
  // No PlayCanvas/WebGL com texturas de canvas/imagem:
  // V=0 corresponde ao topo da imagem original (Y=0)
  // V=1 corresponde à base da imagem original (Y=height)
  // Vértices do quad:
  // 0: BL (Bottom-Left)  -> u0, v1 (base da textura)
  // 1: BR (Bottom-Right) -> u1, v1 (base da textura)
  // 2: TR (Top-Right)    -> u1, v0 (topo da textura)
  // 3: TL (Top-Left)     -> u0, v0 (topo da textura)
  const uvs = [
    u0, v1,
    u1, v1,
    u1, v0,
    u0, v0,
  ];

  const indices = [0, 1, 2, 0, 2, 3];

  const mesh = new Mesh(device);
  mesh.setPositions(positions);
  mesh.setNormals(normals);
  mesh.setUvs(0, uvs);
  mesh.setIndices(indices);
  mesh.update();

  return mesh;
}
