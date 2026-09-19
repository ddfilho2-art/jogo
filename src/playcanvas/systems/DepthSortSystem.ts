import { Entity } from 'playcanvas';

// =============================================================================
// ELDRIM: ECOS DO PASSADO - DEPTH SORT SYSTEM (PLAYCANVAS ENGINE V2)
// =============================================================================
// Ordenação 2.5D de profundidade no eixo Z para jogos top-down.
// Objetos mais ao sul (menor Y) ficam mais próximos da câmera (+Z), sobrepondo-se
// naturalmente aos objetos mais ao norte (maior Y).
// =============================================================================

export interface DepthSortedEntity {
  entity: Entity;
  getY: () => number;
  baseLayer: number; // Ex: 10 para atores/árvores/props
}

export class DepthSortSystem {
  private items: DepthSortedEntity[] = [];
  private maxY = 1000;

  register(item: DepthSortedEntity): void {
    this.items.push(item);
  }

  unregister(entity: Entity): void {
    this.items = this.items.filter((i) => i.entity !== entity);
  }

  update(): void {
    for (let i = 0; i < this.items.length; i++) {
      const item = this.items[i];
      const y = item.getY();
      const pos = item.entity.getPosition();

      // Menor Y (mais ao sul/frente) = maior Z (mais perto da câmera)
      const sortedZ = item.baseLayer + (this.maxY - y) * 0.002;
      item.entity.setPosition(pos.x, pos.y, sortedZ);
    }
  }
}
