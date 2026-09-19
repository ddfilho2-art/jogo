import Phaser from 'phaser';

// =============================================================================
// ELDRIM: ECOS DO PASSADO - 2D LIGHTING SYSTEM (DIRETIVA V5)
// =============================================================================
// Implementa iluminação 2D atmosférica e sutil para o reino de Eldrim:
// - Luz ambiente regional (dia claro no Vale, névoa escura no Charco, etc.)
// - Luzes pontuais com pulso suave (flicker de tochas, runas de cristais,
//   luz divina de santuários e brilho da Lâmina de Eldrim)
// - Preserva total nitidez e legibilidade do pixel art
// =============================================================================

export interface PontoDeLuz {
  x: number;
  y: number;
  raio: number;
  cor: number;
  intensidade: number;
  pulso?: boolean;
}

export class LightingSystem {
  private scene: Phaser.Scene;
  private luzes: PontoDeLuz[] = [];
  private graphicsOverlay?: Phaser.GameObjects.Graphics;
  private corAmbiente: number = 0x000000;
  private alphaAmbiente: number = 0.0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Configura a atmosfera luminosa da região atual
   */
  configurarRegiao(regiao: string): void {
    const configs: Record<string, { cor: number; alpha: number }> = {
      valeVerdejante: { cor: 0xfef9c3, alpha: 0.05 }, // Tarde dourada aconchegante
      charcoSombrio: { cor: 0x0f172a, alpha: 0.40 },  // Pântano sombrio e nebuloso
      terrasGeladas: { cor: 0x38bdf8, alpha: 0.15 },  // Brilho frio azulado
      desertoKaal: { cor: 0xfbbf24, alpha: 0.10 },    // Claridade solar intensa
      penhascosPedra: { cor: 0x1e293b, alpha: 0.18 }, // Sombra de montanhas
      ruinasSubmersas: { cor: 0x0284c7, alpha: 0.35 },// Penumbra aquática misteriosa
      cidadelaCinzenta: { cor: 0x09090b, alpha: 0.45 },// Claustrofobia sombria
    };

    const cfg = configs[regiao] || { cor: 0x000000, alpha: 0.0 };
    this.corAmbiente = cfg.cor;
    this.alphaAmbiente = cfg.alpha;

    if (!this.graphicsOverlay) {
      this.graphicsOverlay = this.scene.add.graphics();
      this.graphicsOverlay.setDepth(9990);
    }
  }

  adicionarPontoDeLuz(luz: PontoDeLuz): void {
    this.luzes.push(luz);
  }

  limparLuzes(): void {
    this.luzes = [];
  }

  /**
   * Atualiza a renderização de luzes e pulsação a cada frame
   */
  renderizar(larguraTela: number, alturaTela: number, heroiX: number, heroiY: number, carga: boolean | number): void {
    if (!this.graphicsOverlay) return;

    this.graphicsOverlay.clear();

    const fase = typeof carga === 'number' ? carga : (carga ? 2 : 0);

    // Se a escuridão ambiente for nula e não houver efeitos especiais, não desenha overlay
    if (this.alphaAmbiente <= 0.02 && fase <= 0) return;

    // 1. Tonalidade ambiente
    const cam = this.scene.cameras.main;
    const viewX = cam.worldView.x;
    const viewY = cam.worldView.y;
    const viewW = cam.worldView.width;
    const viewH = cam.worldView.height;

    this.graphicsOverlay.fillStyle(this.corAmbiente, this.alphaAmbiente);
    this.graphicsOverlay.fillRect(viewX, viewY, viewW, viewH);

    // 2. Luz emanando de Ren com 4 Fases Progressivas de Carga
    if (fase > 0) {
      let raioBase = 28;
      let corLuz = 0xbae6fd;
      let alphaLuz = 0.16;

      if (fase === 1) {
        raioBase = 28;
        corLuz = 0xbae6fd;
        alphaLuz = 0.16;
      } else if (fase === 2) {
        raioBase = 46;
        corLuz = 0x38bdf8;
        alphaLuz = 0.28;
      } else if (fase === 3) {
        raioBase = 68;
        corLuz = 0x0284c7;
        alphaLuz = 0.40;
      } else if (fase >= 4) {
        raioBase = 92;
        corLuz = 0x67e8f9;
        alphaLuz = 0.55;
      }

      const pulso = Math.sin(this.scene.time.now * 0.02) * (fase * 2.2);
      const r = raioBase + pulso;
      this.graphicsOverlay.fillStyle(corLuz, alphaLuz);
      this.graphicsOverlay.fillCircle(heroiX, heroiY, r);
      this.graphicsOverlay.fillStyle(0xffffff, Math.min(0.8, alphaLuz + 0.2));
      this.graphicsOverlay.fillCircle(heroiX, heroiY, r * 0.42);

      if (fase >= 4) {
        // Halo celestial dourado extra para Carga Máxima
        this.graphicsOverlay.fillStyle(0xfef08a, 0.3);
        this.graphicsOverlay.fillCircle(heroiX, heroiY, r * 0.7);
      }
    }

    // 3. Pontos de luz locais (tochas, santuários)
    const agora = this.scene.time.now;
    for (const luz of this.luzes) {
      let r = luz.raio;
      if (luz.pulso) {
        r += Math.sin(agora * 0.008 + luz.x) * 3;
      }
      this.graphicsOverlay.fillStyle(luz.cor, luz.intensidade * 0.25);
      this.graphicsOverlay.fillCircle(luz.x, luz.y, r);
      this.graphicsOverlay.fillStyle(luz.cor, luz.intensidade * 0.50);
      this.graphicsOverlay.fillCircle(luz.x, luz.y, r * 0.4);
    }
  }

  destruir(): void {
    this.graphicsOverlay?.destroy();
  }
}
