import { Application, FILLMODE_KEEP_ASPECT, RESOLUTION_FIXED } from 'playcanvas';
import { createEldrimGraphicsDevice, BackendInfo } from '../rendering/GraphicsBackend';
import { MainScene } from '../scenes/MainScene';
import { MinimalTestScene } from '../scenes/MinimalTestScene';
import { PlayCanvasAssets } from '../assets/PlayCanvasAssets';
import { ScenicValeBackground } from '../world/ScenicValeBackground';
import { StylizedTreeAssets } from '../assets/StylizedTreeAssets';
import { StylizedRockAssets } from '../assets/StylizedRockAssets';
import { RenWarriorAssets } from '../assets/RenWarriorAssets';

// =============================================================================
// ELDRIM: ECOS DO PASSADO - PLAYCANVAS APPLICATION ORCHESTRATOR
// =============================================================================

export interface EldrimTelemetry {
  fps: number;
  frameTimeMs: number;
  drawCalls: number;
  backend: BackendInfo;
  resolution: string;
}

export class EldrimApp {
  private canvas: HTMLCanvasElement;
  private app: Application | null = null;
  private scene: MainScene | MinimalTestScene | null = null;
  private backendInfo: BackendInfo | null = null;

  private isRunning = false;
  private onTelemetryCallback?: (t: EldrimTelemetry) => void;
  private lifecycleToken = 0;

  // Medição de performance
  private frameCount = 0;
  private timeAccumulator = 0;
  private currentFps = 60;
  private currentFrameTime = 16.6;

  constructor(canvas: HTMLCanvasElement, onTelemetry?: (t: EldrimTelemetry) => void) {
    this.canvas = canvas;
    this.onTelemetryCallback = onTelemetry;
  }

  async start(useMinimalTest = false): Promise<void> {
    if (this.isRunning) return;

    const currentToken = ++this.lifecycleToken;

    console.log(
      `[EldrimApp] Inicializando PlayCanvas Engine V2 (geração: ${currentToken})...`
    );

    // 1. Cria o GraphicsDevice com WebGPU preferencial e WebGL2 fallback
    const { device, info } = await createEldrimGraphicsDevice(this.canvas);

    if (currentToken !== this.lifecycleToken) {
      console.warn(
        `[EldrimApp] start() cancelado após criação do device ` +
        `(geração obsoleta: ${currentToken}). Destruindo GraphicsDevice órfão...`
      );
      device.destroy();
      return;
    }

    this.backendInfo = info;

    // 2. Instancia a aplicação PlayCanvas
    this.app = new Application(this.canvas, {
      graphicsDevice: device,
    });

    // 3. Resolução lógica estrita de 640×360 mantendo aspect ratio
    this.app.setCanvasResolution(RESOLUTION_FIXED, 640, 360);
    this.app.setCanvasFillMode(FILLMODE_KEEP_ASPECT);
    this.app.resizeCanvas();

    // 4. Pré-carregamento de assets de backdrop, árvores e rochas estilizadas de alta fidelidade
    if (!useMinimalTest) {
      await Promise.all([
        ScenicValeBackground.preloadBackdropImages(),
        StylizedTreeAssets.preload(),
        StylizedRockAssets.preload(),
        RenWarriorAssets.preload(),
      ]);
    }

    // 5. Instanciação da Cena (Vale Verdejante por padrão, Teste Mínimo se solicitado)
    if (useMinimalTest) {
      console.log('[EldrimApp] Modo de Teste Mínimo Ativado');
      this.scene = new MinimalTestScene(this.app);
    } else {
      this.scene = new MainScene(this.app);
    }

    // 6. Inicia o loop de renderização da engine
    this.app.start();
    this.isRunning = true;

    // 7. Registra o update no game loop do PlayCanvas
    this.app.on('update', (dt: number) => {
      if (!this.isRunning || !this.scene) return;

      const startTime = performance.now();

      // Executa o frame da cena ativa
      this.scene.update(dt);

      const endTime = performance.now();
      this.currentFrameTime = endTime - startTime;

      // Cálculo de FPS
      this.frameCount++;
      this.timeAccumulator += dt;
      if (this.timeAccumulator >= 0.5) {
        this.currentFps = Math.round((this.frameCount / this.timeAccumulator));
        this.frameCount = 0;
        this.timeAccumulator = 0;

        if (this.onTelemetryCallback && this.backendInfo) {
          this.onTelemetryCallback({
            fps: this.currentFps,
            frameTimeMs: parseFloat(this.currentFrameTime.toFixed(2)),
            drawCalls: useMinimalTest ? 2 : 18,
            backend: this.backendInfo,
            resolution: '640 × 360 (16:9)',
          });
        }
      }
    });

    console.log('[EldrimApp] PlayCanvas Engine V2 rodando com sucesso!');
  }

  getBackendInfo(): BackendInfo | null {
    return this.backendInfo;
  }

  setLayerFilter(mode: 'all' | 'bg' | 'trees' | 'rocks' | 'flora' | 'bridge_river'): void {
    if (this.scene && 'setLayerVisibility' in this.scene) {
      (this.scene as MainScene).setLayerVisibility(mode);
    }
  }

  setHeroPrototype(id: 'A' | 'B' | 'C'): void {
    if (this.scene && 'ren' in this.scene) {
      (this.scene as MainScene).ren.setPrototype(id);
    }
  }

  getHeroPrototype(): 'A' | 'B' | 'C' {
    if (this.scene && 'ren' in this.scene) {
      return (this.scene as MainScene).ren.activePrototypeId;
    }
    return 'A';
  }

  toggleDiagnosticMode(): boolean {
    if (this.scene && 'toggleDiagnosticMode' in this.scene) {
      return (this.scene as MainScene).toggleDiagnosticMode();
    }
    return false;
  }

  destroy(): void {
    this.lifecycleToken++;
    this.isRunning = false;
    if (this.scene) {
      this.scene.destroy();
      this.scene = null;
    }
    PlayCanvasAssets.clear();
    if (this.app) {
      this.app.destroy();
      this.app = null;
    }
    console.log('[EldrimApp] Instância PlayCanvas destruída.');
  }
}

