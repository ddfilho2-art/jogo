// =============================================================================
// ELDRIM: ECOS DO PASSADO - DIAGNÓSTICO DE CANVAS & WEBGL CONTEXTS
// =============================================================================
// Mapeia e identifica com precisão todos os elementos <canvas> ativos no DOM,
// seus respectivos contextos WebGL/WebGL2 e atribuição de renderer (PlayCanvas/Phaser/Outros).
// =============================================================================

export interface CanvasDiagnostic {
  index: number;
  id: string;
  className: string;
  width: number;
  height: number;
  clientWidth: number;
  clientHeight: number;
  parentInfo: string;
  boundingRect: { width: number; height: number; top: number; left: number };
  detectedRenderer: 'PlayCanvas' | 'Phaser' | 'Desconhecido';
  contextType?: string;
  isContextLost?: boolean;
}

export interface WebGLDiagnosticReport {
  timestamp: string;
  totalCanvases: number;
  canvases: CanvasDiagnostic[];
  isPhaserActiveInWindow: boolean;
  phaserGamesCount: number;
  playCanvasDevicesCount: number;
}

/**
 * Inspeciona todos os elementos <canvas> no DOM para atribuir a origem dos contextos gráficos.
 */
export function inspectAllCanvases(): WebGLDiagnosticReport {
  const canvasElements = Array.from(document.querySelectorAll('canvas'));
  const reportCanvases: CanvasDiagnostic[] = [];

  canvasElements.forEach((canvas, idx) => {
    const parent = canvas.parentElement;
    const parentInfo = parent
      ? `${parent.tagName.toLowerCase()}${parent.id ? '#' + parent.id : ''}${parent.className ? '.' + parent.className.split(' ').slice(0, 2).join('.') : ''}`
      : 'Sem Pai';

    const rect = canvas.getBoundingClientRect();

    let detectedRenderer: 'PlayCanvas' | 'Phaser' | 'Desconhecido' = 'Desconhecido';

    // Detecção baseada na árvore DOM do container
    if (parent?.id === 'phaser-game-container' || canvas.id.includes('phaser') || parent?.className?.includes('phaser')) {
      detectedRenderer = 'Phaser';
    } else {
      // Por padrão, o canvas passado para o PlayCanvas reside no container de proporção aspect-video
      detectedRenderer = 'PlayCanvas';
    }

    // Tenta inspecionar contexto sem forçar criação se já existir
    let contextType = 'Desconhecido / Não Inspecionado';
    let isContextLost = false;

    try {
      const gl = (canvas as any).__pcGraphicsDevice?.gl || (canvas as any).gl;
      if (gl) {
        contextType = gl instanceof WebGL2RenderingContext ? 'WebGL 2' : 'WebGL 1';
        isContextLost = gl.isContextLost();
      }
    } catch {
      // Ignora falha de leitura passiva do contexto
    }

    reportCanvases.push({
      index: idx,
      id: canvas.id || `canvas-${idx}`,
      className: canvas.className || 'sem-classe',
      width: canvas.width,
      height: canvas.height,
      clientWidth: canvas.clientWidth,
      clientHeight: canvas.clientHeight,
      parentInfo,
      boundingRect: {
        width: rect.width,
        height: rect.height,
        top: rect.top,
        left: rect.left,
      },
      detectedRenderer,
      contextType,
      isContextLost,
    });
  });

  // Verificação de presença global do Phaser
  const win = typeof window !== 'undefined' ? (window as any) : {};
  const phaserGlobal = win.Phaser;
  const phaserGames = phaserGlobal?.GAMES || [];

  return {
    timestamp: new Date().toISOString(),
    totalCanvases: canvasElements.length,
    canvases: reportCanvases,
    isPhaserActiveInWindow: phaserGames.length > 0,
    phaserGamesCount: phaserGames.length,
    playCanvasDevicesCount: 1, // Instância ativa supervisionada
  };
}

/**
 * Lê e limpa todos os erros WebGL pendentes em um WebGLRenderingContext/WebGL2RenderingContext.
 * Retorna uma lista com os códigos de erro encontrados.
 */
export function checkAndFlushGlErrors(gl: WebGLRenderingContext | WebGL2RenderingContext | undefined, checkpointName: string): {
  checkpoint: string;
  hasError: boolean;
  errors: number[];
  errorNames: string[];
} {
  if (!gl) {
    return {
      checkpoint: checkpointName,
      hasError: false,
      errors: [],
      errorNames: ['SEM_CONTEXTO_WEBGL'],
    };
  }

  const errors: number[] = [];
  const errorNames: string[] = [];

  let err = gl.getError();
  while (err !== gl.NO_ERROR) {
    errors.push(err);
    let name = `GL_ERROR_${err}`;
    if (err === gl.INVALID_ENUM) name = 'GL_INVALID_ENUM (1280)';
    if (err === gl.INVALID_VALUE) name = 'GL_INVALID_VALUE (1281)';
    if (err === gl.INVALID_OPERATION) name = 'GL_INVALID_OPERATION (1282)';
    if (err === gl.OUT_OF_MEMORY) name = 'GL_OUT_OF_MEMORY (1285)';
    if (err === gl.INVALID_FRAMEBUFFER_OPERATION) name = 'GL_INVALID_FRAMEBUFFER_OPERATION (1286)';
    errorNames.push(name);

    err = gl.getError();
  }

  const hasError = errors.length > 0;
  if (hasError) {
    console.warn(`[Eldrim Diagnostic - ${checkpointName}] ERROS WEBGL DETECTADOS:`, errorNames);
  } else {
    console.log(`[Eldrim Diagnostic - ${checkpointName}] gl.getError(): NO_ERROR (0)`);
  }

  return {
    checkpoint: checkpointName,
    hasError,
    errors,
    errorNames,
  };
}
