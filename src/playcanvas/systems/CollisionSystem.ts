// =============================================================================
// ELDRIM: ECOS DO PASSADO - COLLISION SYSTEM (PLAYCANVAS ENGINE V2)
// =============================================================================
// Sistema físico 2D top-down desacoplado da arte, conforme Diretiva Mestra.
// Ren possui hitbox nos pés (16×12 px), garantindo estabilidade e navegação fluida.
// =============================================================================

export interface BoxCollider {
  id: string;
  x: number;      // Centro X
  y: number;      // Centro Y
  width: number;
  height: number;
  isTrigger?: boolean;
}

export class CollisionSystem {
  private colliders = new Map<string, BoxCollider>();

  addCollider(col: BoxCollider): void {
    this.colliders.set(col.id, col);
  }

  removeCollider(id: string): void {
    this.colliders.delete(id);
  }

  clear(): void {
    this.colliders.clear();
  }

  /**
   * Resolve colisão com deslizamento (slide) em eixos X e Y independentes
   */
  resolveMovement(
    currentX: number,
    currentY: number,
    targetX: number,
    targetY: number,
    width: number,
    height: number,
    ignoreId?: string
  ): { x: number; y: number; collidedX: boolean; collidedY: boolean } {
    let finalX = targetX;
    let finalY = targetY;
    let collidedX = false;
    let collidedY = false;

    // 1. Tenta movimento em X
    const boxX = {
      x: finalX,
      y: currentY,
      width,
      height,
    };

    for (const [id, col] of this.colliders) {
      if (id === ignoreId || col.isTrigger) continue;
      if (this.checkOverlap(boxX, col)) {
        collidedX = true;
        // Reverte X para posição segura anterior
        finalX = currentX;
        break;
      }
    }

    // 2. Tenta movimento em Y (com o X já decidido)
    const boxY = {
      x: finalX,
      y: finalY,
      width,
      height,
    };

    for (const [id, col] of this.colliders) {
      if (id === ignoreId || col.isTrigger) continue;
      if (this.checkOverlap(boxY, col)) {
        collidedY = true;
        // Reverte Y para posição segura anterior
        finalY = currentY;
        break;
      }
    }

    return { x: finalX, y: finalY, collidedX, collidedY };
  }

  checkOverlap(a: { x: number; y: number; width: number; height: number }, b: BoxCollider): boolean {
    const halfAW = a.width * 0.5;
    const halfAH = a.height * 0.5;
    const halfBW = b.width * 0.5;
    const halfBH = b.height * 0.5;

    return (
      Math.abs(a.x - b.x) < halfAW + halfBW &&
      Math.abs(a.y - b.y) < halfAH + halfBH
    );
  }

  getOverlappingColliders(box: { x: number; y: number; width: number; height: number }, ignoreId?: string): BoxCollider[] {
    const results: BoxCollider[] = [];
    for (const [id, col] of this.colliders) {
      if (id === ignoreId) continue;
      if (this.checkOverlap(box, col)) {
        results.push(col);
      }
    }
    return results;
  }
}
