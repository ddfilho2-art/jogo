import { StandardMaterial } from 'playcanvas';

// =============================================================================
// ELDRIM: ECOS DO PASSADO - SPRITE ANIMATION (PLAYCANVAS ENGINE V2)
// =============================================================================
// Controlador de animação de spritesheets via offset/tiling de UV em StandardMaterial.
// Evita qualquer recriação de geometria por frame, garantindo 60 FPS estáveis.
// =============================================================================

export interface AnimationDefinition {
  name: string;
  startFrame: number;
  endFrame: number;
  frameRate: number;
  loop: boolean;
}

export class SpriteAnimationController {
  private material: StandardMaterial;
  private cols: number;
  private rows: number;
  private clips = new Map<string, AnimationDefinition>();

  private currentClip: AnimationDefinition | null = null;
  private currentFrame = 0;
  private elapsedTime = 0;
  private isFinished = false;

  constructor(material: StandardMaterial, cols: number, rows: number) {
    this.material = material;
    this.cols = cols;
    this.rows = rows;

    // Configura o tiling constante do material (tamanho do frame em UV)
    const uTiling = 1 / cols;
    const vTiling = 1 / rows;
    this.material.diffuseMapTiling.set(uTiling, vTiling);
    this.material.opacityMapTiling.set(uTiling, vTiling);
    if (this.material.emissiveMap) {
      this.material.emissiveMapTiling.set(uTiling, vTiling);
    }
    this.setFrame(0);
  }

  addClip(def: AnimationDefinition): void {
    this.clips.set(def.name, def);
  }

  play(name: string, forceRestart = false): void {
    if (this.currentClip?.name === name && !forceRestart && !this.isFinished) {
      return;
    }

    const clip = this.clips.get(name);
    if (!clip) {
      console.warn(`[SpriteAnimation] Clipe não encontrado: ${name}`);
      return;
    }

    this.currentClip = clip;
    this.currentFrame = clip.startFrame;
    this.elapsedTime = 0;
    this.isFinished = false;
    this.setFrame(this.currentFrame);
  }

  update(dt: number): void {
    if (!this.currentClip || this.isFinished) return;

    this.elapsedTime += dt;
    const frameDuration = 1 / this.currentClip.frameRate;

    if (this.elapsedTime >= frameDuration) {
      const framesToAdvance = Math.floor(this.elapsedTime / frameDuration);
      this.elapsedTime %= frameDuration;

      const totalFrames = this.currentClip.endFrame - this.currentClip.startFrame + 1;
      const nextRelativeFrame = (this.currentFrame - this.currentClip.startFrame) + framesToAdvance;

      if (nextRelativeFrame >= totalFrames) {
        if (this.currentClip.loop) {
          this.currentFrame = this.currentClip.startFrame + (nextRelativeFrame % totalFrames);
        } else {
          this.currentFrame = this.currentClip.endFrame;
          this.isFinished = true;
        }
      } else {
        this.currentFrame = this.currentClip.startFrame + nextRelativeFrame;
      }

      this.setFrame(this.currentFrame);
    }
  }

  getCurrentFrame(): number {
    return this.currentFrame;
  }

  getCurrentClipName(): string | null {
    return this.currentClip?.name ?? null;
  }

  isPlaying(name?: string): boolean {
    if (!name) return !this.isFinished && this.currentClip !== null;
    return this.currentClip?.name === name && !this.isFinished;
  }

  private setFrame(frame: number): void {
    const col = frame % this.cols;
    const row = Math.floor(frame / this.cols);

    const uTiling = 1 / this.cols;
    const vTiling = 1 / this.rows;

    const uOffset = col * uTiling;
    // Com PixelQuadMesh onde TL é (0, 0) e BL é (0, 1) e o shader calcula
    // vUV = uv.y * vTiling + vOffset,
    // para mapear o topo do frame (row * vTiling) no topo do quad e a base do frame ((row+1) * vTiling) na base:
    const vOffset = row * vTiling;

    this.material.diffuseMapOffset.set(uOffset, vOffset);
    this.material.opacityMapOffset.set(uOffset, vOffset);
    if (this.material.emissiveMap) {
      this.material.emissiveMapOffset.set(uOffset, vOffset);
    }
    this.material.update();
  }
}
