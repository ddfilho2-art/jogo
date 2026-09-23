// =============================================================================
// ELDRIM: ECOS DO PASSADO - WORLD SECTOR MANAGER (PLAYCANVAS ENGINE V2)
// =============================================================================
// Gerenciador formal de setores do overworld para MUNDO CONTÍNUO.
//
// Princípios Arquiteturais Inegociáveis:
// 1. CÂMERA GLOBAL CONTÍNUA:
//    - A câmera ortográfica (640×360) compreende as dimensões TOTAIS do mundo conectado.
//    - cameraMinX = VIEW_HALF_WIDTH (320)
//    - cameraMaxX = totalWorldMaxX - VIEW_HALF_WIDTH (e.g. 1536 - 320 = 1216, 2304 - 320 = 1984, etc.)
//    - cameraMinY = VIEW_HALF_HEIGHT (180)
//    - cameraMaxY = totalWorldMaxY - VIEW_HALF_HEIGHT (332 para altura 512)
//    - A câmera desliza suavemente acompanhando Ren pelo mundo todo.
//    - NENHUM salto, teleporte ou reinicialização de câmera ao cruzar fronteiras entre setores!
//
// 2. IDENTIFICAÇÃO SEMÂNTICA DE SETOR:
//    - O WorldSectorManager apenas IDENTIFICA em qual setor Ren está.
//    - Setor NÃO reconfigura a câmera para mini-janelas locais.
//
// 3. ZERO PAREDES ENTRE SETORES:
//    - A fronteira (X = 768, X = 1536, etc.) é puramente lógica.
//    - Paredes físicas só existem no perímetro externo do mundo contínuo.
// =============================================================================

import { CameraFollowSystem } from '../systems/CameraFollowSystem';
import { CollisionSystem } from '../systems/CollisionSystem';
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
}

export class WorldSectorManager {
  public static readonly SECTOR_WIDTH = 768;
  public static readonly SECTOR_HEIGHT = 512;

  // Viewport ortográfico (640×360, orthoHeight = 180)
  public static readonly VIEW_HALF_WIDTH = 320;
  public static readonly VIEW_HALF_HEIGHT = 180;

  // Identificadores de setores canônicos
  public static readonly SECTOR_CENTRO_ID = 'vale_verdejante_centro';
  public static readonly SECTOR_LESTE_ID = 'vale_verdejante_leste';
  public static readonly SECTOR_TESTE_EXTENSAO_ID = 'setor_teste_extensao';

  private sectors = new Map<string, WorldSectorInfo>();
  private activeSectorId: string = WorldSectorManager.SECTOR_CENTRO_ID;
  private cameraSystem: CameraFollowSystem;
  private collisionSystem: CollisionSystem | null = null;

  // Dimensões do mundo contínuo total agregadas dinamicamente
  private totalWorldMinX = 0;
  private totalWorldMaxX = 1376;
  private totalWorldMinY = 0;
  private totalWorldMaxY = 768;

  constructor(cameraSystem: CameraFollowSystem, collisionSystem?: CollisionSystem) {
    this.cameraSystem = cameraSystem;
    if (collisionSystem) {
      this.collisionSystem = collisionSystem;
    }

    // Território Mestre Unificado do Vale Verdejante (1376×768)
    this.registerSector({
      id: WorldSectorManager.SECTOR_CENTRO_ID,
      name: 'Vale Verdejante - Território Mestre',
      region: 'Vale Verdejante',
      description: 'Grande território contínuo de floresta temperada, clareira central e rio natural',
      worldBounds: {
        minX: 0,
        maxX: 1376,
        minY: 0,
        maxY: 768,
      },
    });

    // Recalcula e aplica imediatamente os limites de câmera globais
    this.recalculateWorldBounds();
  }

  public setCollisionSystem(collision: CollisionSystem): void {
    this.collisionSystem = collision;
    this.updatePerimeterColliders();
  }

  /**
   * Registra um novo setor no mundo contínuo e recalcula limites globais.
   */
  public registerSector(sector: WorldSectorInfo): void {
    this.sectors.set(sector.id, sector);
    this.recalculateWorldBounds();
  }

  /**
   * Remove um setor do mundo contínuo e recalcula limites globais.
   */
  public removeSector(id: string): void {
    this.sectors.delete(id);
    this.recalculateWorldBounds();
  }

  public getTotalWorldWidth(): number {
    return this.totalWorldMaxX - this.totalWorldMinX;
  }

  public getTotalWorldHeight(): number {
    return this.totalWorldMaxY - this.totalWorldMinY;
  }

  public getWorldMinX(): number {
    return this.totalWorldMinX;
  }

  public getWorldMaxX(): number {
    return this.totalWorldMaxX;
  }

  public getWorldMinY(): number {
    return this.totalWorldMinY;
  }

  public getWorldMaxY(): number {
    return this.totalWorldMaxY;
  }

  public getActiveSector(): WorldSectorInfo {
    return this.sectors.get(this.activeSectorId) || {
      id: this.activeSectorId,
      name: 'Vale Verdejante',
      region: 'Vale Verdejante',
      description: 'Região do Vale Verdejante',
      worldBounds: { minX: 0, maxX: 1536, minY: 0, maxY: 512 },
    };
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
   * Recalcula a extensão total do mundo contínuo e aplica os limites da CÂMERA GLOBAL.
   * A câmera segue Ren com suavização do início ao fim do mapa sem nenhum corte.
   */
  public recalculateWorldBounds(): void {
    if (this.sectors.size === 0) return;

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    for (const sector of this.sectors.values()) {
      minX = Math.min(minX, sector.worldBounds.minX);
      maxX = Math.max(maxX, sector.worldBounds.maxX);
      minY = Math.min(minY, sector.worldBounds.minY);
      maxY = Math.max(maxY, sector.worldBounds.maxY);
    }

    this.totalWorldMinX = minX;
    this.totalWorldMaxX = maxX;
    this.totalWorldMinY = minY;
    this.totalWorldMaxY = maxY;

    // Regra da Câmera Global Contínua:
    // cameraMinX = minX + larguraVisivel / 2
    // cameraMaxX = maxX - larguraVisivel / 2
    // cameraMinY = minY + alturaVisivel / 2
    // cameraMaxY = maxY - alturaVisivel / 2
    const cameraMinX = this.totalWorldMinX + WorldSectorManager.VIEW_HALF_WIDTH;
    const cameraMaxX = Math.max(cameraMinX, this.totalWorldMaxX - WorldSectorManager.VIEW_HALF_WIDTH);
    const cameraMinY = this.totalWorldMinY + WorldSectorManager.VIEW_HALF_HEIGHT;
    const cameraMaxY = Math.max(cameraMinY, this.totalWorldMaxY - WorldSectorManager.VIEW_HALF_HEIGHT);

    this.cameraSystem.setBounds(cameraMinX, cameraMaxX, cameraMinY, cameraMaxY);

    if (this.collisionSystem) {
      this.updatePerimeterColliders();
    }

    console.log('[WorldSectorManager] Câmera Global Contínua recalculada:', {
      totalSectors: this.sectors.size,
      worldWidth: this.getTotalWorldWidth(),
      worldHeight: this.getTotalWorldHeight(),
      cameraBounds: { cameraMinX, cameraMaxX, cameraMinY, cameraMaxY },
    });
  }

  /**
   * Configura exclusivamente as paredes perimetrais externas do mundo contínuo.
   * NENHUMA parede interna é colocada entre os setores.
   */
  public updatePerimeterColliders(): void {
    if (!this.collisionSystem) return;

    // Remove paredes antigas e paredes internas legadas
    this.collisionSystem.removeCollider('bound_left');
    this.collisionSystem.removeCollider('bound_right');
    this.collisionSystem.removeCollider('bound_top');
    this.collisionSystem.removeCollider('bound_bottom');
    this.collisionSystem.removeCollider('bound_centro_right_north');
    this.collisionSystem.removeCollider('bound_centro_right_south');
    this.collisionSystem.removeCollider('bound_leste_left_north');
    this.collisionSystem.removeCollider('bound_leste_left_south');
    this.collisionSystem.removeCollider('bound_leste_top');
    this.collisionSystem.removeCollider('bound_leste_bottom');
    this.collisionSystem.removeCollider('bound_leste_right');

    const totalWidth = this.getTotalWorldWidth();
    const totalHeight = this.getTotalWorldHeight();
    const centerX = this.totalWorldMinX + totalWidth * 0.5;
    const centerY = this.totalWorldMinY + totalHeight * 0.5;

    // 1. Parede Oeste (Início do mundo contínuo)
    this.collisionSystem.addCollider({
      id: 'bound_left',
      x: this.totalWorldMinX + 10,
      y: centerY,
      width: 20,
      height: totalHeight,
    });

    // 2. Parede Leste (Extremo do último setor carregado)
    this.collisionSystem.addCollider({
      id: 'bound_right',
      x: this.totalWorldMaxX - 10,
      y: centerY,
      width: 20,
      height: totalHeight,
    });

    // 3. Parede Norte (Topo contínuo de todo o mapa)
    this.collisionSystem.addCollider({
      id: 'bound_top',
      x: centerX,
      y: this.totalWorldMaxY - 10,
      width: totalWidth,
      height: 20,
    });

    // 4. Parede Sul (Base contínua de todo o mapa)
    this.collisionSystem.addCollider({
      id: 'bound_bottom',
      x: centerX,
      y: this.totalWorldMinY + 10,
      width: totalWidth,
      height: 20,
    });

    console.log('[WorldSectorManager] Colisores perimetrais atualizados:', {
      west: this.totalWorldMinX + 10,
      east: this.totalWorldMaxX - 10,
      north: this.totalWorldMaxY - 10,
      south: this.totalWorldMinY + 10,
      totalWidth,
    });
  }

  /**
   * Monitora a posição de Ren e identifica o setor atual.
   * Não altera a câmera nem teletransporta o jogador.
   */
  public update(renX: number, renY: number): void {
    let matchedSectorId: string | null = null;

    for (const [id, sector] of this.sectors) {
      const b = sector.worldBounds;
      // Histerese leve (+-8px) no setor ativo para evitar oscilação rápida na fronteira exata
      const margin = id === this.activeSectorId ? 8 : 0;
      if (
        renX >= b.minX - margin &&
        renX < b.maxX + margin &&
        renY >= b.minY &&
        renY <= b.maxY
      ) {
        matchedSectorId = id;
        break;
      }
    }

    if (matchedSectorId && matchedSectorId !== this.activeSectorId) {
      const previousId = this.activeSectorId;
      this.activeSectorId = matchedSectorId;
      const targetSector = this.sectors.get(matchedSectorId)!;

      console.log(`[WorldSectorManager] Transição semântica de setor: ${previousId} -> ${matchedSectorId}`, {
        sector: targetSector.name,
        renX: Math.round(renX),
        renY: Math.round(renY),
      });

      // Emite evento para HUD / telemetria React (NENHUM ajuste ou corte de câmera aqui!)
      eventBus.emit('setorMudou', {
        sectorId: targetSector.id,
        sectorName: targetSector.name,
        region: targetSector.region,
        description: targetSector.description,
      });
    }
  }

  /**
   * Suporte ao Teste de Extensibilidade:
   * Permite simular dinamicamente um terceiro setor (X = 1536..2304) para demonstrar
   * que a câmera e a física continuam sem muros em X=1536 e sem salto de câmera.
   */
  public enableExtensibilityTestSector(enable: boolean = true): void {
    if (enable) {
      this.registerSector({
        id: WorldSectorManager.SECTOR_TESTE_EXTENSAO_ID,
        name: 'Fronteira Aberta (Setor 3 - Teste Técnico)',
        region: 'Vale Verdejante - Além da Fronteira',
        description: 'Setor de teste de extensibilidade provando a navegação contínua além de X=1536',
        worldBounds: {
          minX: 1536,
          maxX: 2304,
          minY: 0,
          maxY: 512,
        },
      });
      console.log('[WorldSectorManager] Setor 3 de Teste Ativado (X = 1536..2304). Largura total:', this.getTotalWorldWidth());
    } else {
      this.removeSector(WorldSectorManager.SECTOR_TESTE_EXTENSAO_ID);
      console.log('[WorldSectorManager] Setor 3 de Teste Desativado. Largura total:', this.getTotalWorldWidth());
    }
  }

  public isExtensibilityTestEnabled(): boolean {
    return this.sectors.has(WorldSectorManager.SECTOR_TESTE_EXTENSAO_ID);
  }
}
