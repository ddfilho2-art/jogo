// =============================================================================
// ELDRIM: ECOS DO PASSADO - WORLD SECTOR MANAGER (PLAYCANVAS ENGINE V2)
// =============================================================================
// Gerenciador formal de setores do overworld para expansão contínua de cenários.
// Suporta setores pictóricos lado a lado com transição suave de câmera ortográfica,
// sem cortes bruscos, sem telas pretas e preservando a física/escala do herói.
// =============================================================================

import { CameraFollowSystem } from '../systems/CameraFollowSystem';
import { eventBus } from '../../phaser/eventBus';

export interface WorldSectorInfo {
  id: string;
  name: string;
  region: string;
  description: string;
  worldBounds: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  };
  cameraBounds: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  };
}

export class WorldSectorManager {
  public static readonly SECTOR_CENTRO_ID = 'vale_verdejante_centro';
  public static readonly SECTOR_LESTE_ID = 'vale_verdejante_leste';

  private sectors = new Map<string, WorldSectorInfo>();
  private activeSectorId: string = WorldSectorManager.SECTOR_CENTRO_ID;
  private cameraSystem: CameraFollowSystem;

  constructor(cameraSystem: CameraFollowSystem) {
    this.cameraSystem = cameraSystem;

    // 1. Setor Centro: Clareira Central, Monólito e Ponte sobre o Rio
    this.sectors.set(WorldSectorManager.SECTOR_CENTRO_ID, {
      id: WorldSectorManager.SECTOR_CENTRO_ID,
      name: 'Vale Verdejante - Clareira Central',
      region: 'Vale Verdejante',
      description: 'Clareira com o monólito rúnico, trilhas de terra e ponte sobre o rio caudaloso',
      worldBounds: {
        minX: 0,
        maxX: 768,
        minY: 0,
        maxY: 512,
      },
      cameraBounds: {
        minX: 320,
        maxX: 448,
        minY: 180,
        maxY: 332,
      },
    });

    // 2. Setor Leste: Extensão além da ponte, floresta mais aberta rumo à transição pantanosa
    this.sectors.set(WorldSectorManager.SECTOR_LESTE_ID, {
      id: WorldSectorManager.SECTOR_LESTE_ID,
      name: 'Vale Verdejante - Extensão Leste',
      region: 'Vale Verdejante',
      description: 'Bosque mais aberto além do rio, com solo aluvial e clareiras amplas',
      worldBounds: {
        minX: 768,
        maxX: 1536,
        minY: 0,
        maxY: 512,
      },
      cameraBounds: {
        minX: 1088,
        maxX: 1216,
        minY: 180,
        maxY: 332,
      },
    });

    // Aplica limites iniciais na câmera para o setor padrão (Centro)
    const initialSector = this.sectors.get(this.activeSectorId)!;
    this.cameraSystem.setBounds(
      initialSector.cameraBounds.minX,
      initialSector.cameraBounds.maxX,
      initialSector.cameraBounds.minY,
      initialSector.cameraBounds.maxY
    );
  }

  public getActiveSector(): WorldSectorInfo {
    return this.sectors.get(this.activeSectorId)!;
  }

  public getActiveSectorId(): string {
    return this.activeSectorId;
  }

  public getActiveSectorName(): string {
    return this.getActiveSector().name;
  }

  public getSector(id: string): WorldSectorInfo | undefined {
    return this.sectors.get(id);
  }

  /**
   * Monitora a posição de Ren e executa a transição suave de setor com histerese
   * para evitar oscilações na linha limítrofe (X = 768).
   */
  public update(renX: number, renY: number): void {
    // Transição Centro -> Leste (cruzando X >= 768 rumo ao Leste)
    if (this.activeSectorId === WorldSectorManager.SECTOR_CENTRO_ID && renX >= 768) {
      this.transitionToSector(WorldSectorManager.SECTOR_LESTE_ID);
    }
    // Transição Leste -> Centro (cruzando X < 764 rumo ao Oeste)
    else if (this.activeSectorId === WorldSectorManager.SECTOR_LESTE_ID && renX < 764) {
      this.transitionToSector(WorldSectorManager.SECTOR_CENTRO_ID);
    }
  }

  /**
   * Aplica a transição para um novo setor atualizando a câmera e emitindo eventos
   */
  public transitionToSector(targetSectorId: string): void {
    const targetSector = this.sectors.get(targetSectorId);
    if (!targetSector) {
      console.warn(`[WorldSectorManager] Setor não encontrado: ${targetSectorId}`);
      return;
    }

    const previousId = this.activeSectorId;
    this.activeSectorId = targetSectorId;

    // Atualiza os limites de câmera de forma suave (o lerp da câmera cuidará do deslizamento panorâmico)
    this.cameraSystem.setBounds(
      targetSector.cameraBounds.minX,
      targetSector.cameraBounds.maxX,
      targetSector.cameraBounds.minY,
      targetSector.cameraBounds.maxY
    );

    console.log(`[WorldSectorManager] Transição de setor executada: ${previousId} -> ${targetSectorId}`, {
      sector: targetSector.name,
      cameraBounds: targetSector.cameraBounds,
    });

    // Emite evento para HUD / telemetria React
    eventBus.emit('setorMudou', {
      sectorId: targetSector.id,
      sectorName: targetSector.name,
      region: targetSector.region,
      description: targetSector.description,
    });
  }
}
