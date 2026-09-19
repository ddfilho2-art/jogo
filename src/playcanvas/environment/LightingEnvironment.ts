import { Color, Entity } from 'playcanvas';

// =============================================================================
// ELDRIM: ECOS DO PASSADO - LIGHTING ENVIRONMENT (PLAYCANVAS ENGINE V2)
// =============================================================================
// Iluminação híbrida 2D / 2.5D:
// 1. Luz direcional solar suave (dourada matutina)
// 2. Luz pontual arcana que acompanha Ren e pulsa durante o ataque carregado
// =============================================================================

export class LightingEnvironment {
  public rootEntity: Entity;
  private directionalLight: Entity;
  private arcanePointLight: Entity;

  constructor() {
    this.rootEntity = new Entity('LightingRoot');

    // 1. Luz Direcional Solar do Vale Verdejante
    this.directionalLight = new Entity('Sunlight');
    this.directionalLight.addComponent('light', {
      type: 'directional',
      color: new Color(1.0, 0.98, 0.92),
      intensity: 0.9,
      castShadows: false,
    });
    // Inclinada suavemente para dar relevo e profundidade
    this.directionalLight.setEulerAngles(45, 30, 0);
    this.rootEntity.addChild(this.directionalLight);

    // 2. Luz Pontual Arcana em Ren
    // [TESTE TEMPORÁRIO DIAGNÓSTICO: omni desativado para isolar WorldClusters / LightsBuffer / LightsTexture]
    this.arcanePointLight = new Entity('ArcanePointLight');
    /*
    this.arcanePointLight.addComponent('light', {
      type: 'omni',
      color: new Color(0.2, 0.8, 1.0), // Ciano rúnico
      range: 80,
      intensity: 0.4,
      castShadows: false,
    });
    */
    this.arcanePointLight.setPosition(320, 200, 20);
    this.rootEntity.addChild(this.arcanePointLight);
  }

  update(renX: number, renY: number, isCharged: boolean): void {
    // A luz arcana acompanha Ren no espaço 2.5D
    this.arcanePointLight.setPosition(renX, renY + 16, 20);

    const lightComp = this.arcanePointLight.light;
    if (lightComp) {
      if (isCharged) {
        lightComp.intensity = 1.6;
        lightComp.range = 140;
        lightComp.color = new Color(0.4, 0.9, 1.0);
      } else {
        lightComp.intensity = 0.4;
        lightComp.range = 80;
        lightComp.color = new Color(0.2, 0.75, 1.0);
      }
    }
  }
}
