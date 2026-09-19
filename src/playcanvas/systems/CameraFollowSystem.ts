import { Entity } from 'playcanvas';

// =============================================================================
// ELDRIM: ECOS DO PASSADO - CAMERA FOLLOW SYSTEM (PLAYCANVAS ENGINE V2)
// =============================================================================
// Câmera ortográfica 2D com suavização de seguimento (lerp 0.08) e screen shake.
// Enquadramento de resolução lógica 640×360 com aspect ratio 16:9.
// =============================================================================

export class CameraFollowSystem {
  private cameraEntity: Entity;
  private target: { x: number; y: number } | null = null;
  private lerpSpeed = 0.08;

  // Limites do mundo em coordenadas mundiais
  private minX = 320;
  private maxX = 640;
  private minY = 180;
  private maxY = 400;

  // Screen shake
  private shakeTime = 0;
  private shakeDuration = 0;
  private shakeIntensity = 0;

  constructor(cameraEntity: Entity) {
    this.cameraEntity = cameraEntity;
  }

  setTarget(target: { x: number; y: number }): void {
    this.target = target;
  }

  setBounds(minX: number, maxX: number, minY: number, maxY: number): void {
    this.minX = minX;
    this.maxX = maxX;
    this.minY = minY;
    this.maxY = maxY;
  }

  triggerShake(intensity = 4, duration = 0.25): void {
    this.shakeIntensity = intensity;
    this.shakeDuration = duration;
    this.shakeTime = duration;
  }

  update(dt: number): void {
    if (!this.target) return;

    const currentPos = this.cameraEntity.getPosition();

    // Interpolação suave em direção ao alvo
    const desiredX = Math.max(this.minX, Math.min(this.maxX, this.target.x));
    const desiredY = Math.max(this.minY, Math.min(this.maxY, this.target.y));

    let nextX = currentPos.x + (desiredX - currentPos.x) * this.lerpSpeed;
    let nextY = currentPos.y + (desiredY - currentPos.y) * this.lerpSpeed;

    // Aplica tremor de tela (Screen Shake)
    if (this.shakeTime > 0) {
      this.shakeTime -= dt;
      const progress = this.shakeTime / this.shakeDuration;
      const currentIntensity = this.shakeIntensity * progress;
      const shakeOffsetX = (Math.random() * 2 - 1) * currentIntensity;
      const shakeOffsetY = (Math.random() * 2 - 1) * currentIntensity;
      nextX += shakeOffsetX;
      nextY += shakeOffsetY;
    }

    // A câmera mantém Z = 100 olhando para Z = 0
    this.cameraEntity.setPosition(nextX, nextY, 100);
  }
}
