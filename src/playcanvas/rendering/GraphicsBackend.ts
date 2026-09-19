import {
  createGraphicsDevice,
  DEVICETYPE_WEBGPU,
  DEVICETYPE_WEBGL2,
  GraphicsDevice,
  Texture,
  FILTER_NEAREST,
  ADDRESS_CLAMP_TO_EDGE,
  PIXELFORMAT_RGBA8,
  StandardMaterial,
  BLEND_NONE,
  BLEND_NORMAL,
  BLEND_ADDITIVE,
  CULLFACE_NONE,
  Color,
} from 'playcanvas';

// =============================================================================
// ELDRIM: ECOS DO PASSADO - GRAPHICS BACKEND (PLAYCANVAS ENGINE V2)
// =============================================================================
// Gerencia a inicialização do pipeline gráfico:
// 1. WebGPU como backend preferencial de última geração
// 2. WebGL 2 como fallback automático transparente
// 3. Configurações de filtragem NEAREST para preservação estrita de Pixel Art HD
// =============================================================================

export interface BackendInfo {
  deviceType: 'webgpu' | 'webgl2' | 'unknown';
  type: 'webgpu' | 'webgl2' | 'unknown';
  isWebGPU: boolean;
  isWebGL2: boolean;
  vendor?: string;
  renderer?: string;
  description: string;
}

let cachedBackendInfo: BackendInfo | null = null;

/**
 * Teste não-intrusivo para verificar se a API de WebGPU possui adaptador
 * de hardware válido antes de instanciar WebgpuGraphicsDevice no canvas.
 */
async function isWebGpuAdapterAvailable(): Promise<boolean> {
  const nav = typeof window !== 'undefined' ? (navigator as any) : null;
  if (!nav || !nav.gpu) {
    return false;
  }
  try {
    const adapter = await nav.gpu.requestAdapter({
      powerPreference: 'high-performance',
    });
    if (!adapter) {
      console.warn('[Eldrim PlayCanvas V2] Adaptador WebGPU indisponível no ambiente.');
      return false;
    }
    if (adapter.info?.vendor === 'img-tec') {
      console.warn('[Eldrim PlayCanvas V2] Adaptador img-tec detectado; alternando para WebGL 2.');
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[Eldrim PlayCanvas V2] Falha ao testar adaptador WebGPU:', err);
    return false;
  }
}

export async function createEldrimGraphicsDevice(canvas: HTMLCanvasElement): Promise<{
  device: GraphicsDevice;
  info: BackendInfo;
}> {
  console.log('[Eldrim PlayCanvas V2] Verificando adaptadores gráficos disponíveis...');

  const hasWebGpuAdapter = await isWebGpuAdapterAvailable();
  let device: GraphicsDevice | null = null;

  if (hasWebGpuAdapter) {
    try {
      console.log('[Eldrim PlayCanvas V2] Adaptador WebGPU verificado com sucesso. Inicializando WebGpuGraphicsDevice...');
      device = await createGraphicsDevice(canvas, {
        deviceTypes: [DEVICETYPE_WEBGPU],
        antialias: false,
        depth: true,
        stencil: false,
        powerPreference: 'high-performance',
      });
    } catch (err) {
      console.warn('[Eldrim PlayCanvas V2] Falha na criação do WebGpuGraphicsDevice. Recuando para WebGL 2:', err);
      device = null;
    }
  }

  // Se WebGPU não estiver disponível ou tiver falhado na inicialização:
  if (!device || !device.isWebGPU || device.deviceType !== DEVICETYPE_WEBGPU) {
    console.log('[Eldrim PlayCanvas V2] Inicializando WebglGraphicsDevice (WebGL 2 Fallback Real)...');

    device = await createGraphicsDevice(canvas, {
      deviceTypes: [DEVICETYPE_WEBGL2],
      antialias: false,
      depth: true,
      stencil: false,
      powerPreference: 'high-performance',
    });
  }

  const isWebGPU = device.isWebGPU && device.deviceType === DEVICETYPE_WEBGPU;
  const isWebGL2 = (device.isWebGL2 || device.deviceType === DEVICETYPE_WEBGL2) && !(device as any).isNull;

  if (!isWebGPU && !isWebGL2) {
    throw new Error('[Eldrim PlayCanvas V2] Erro Crítico: Não foi possível obter um contexto WebGL2 ou WebGPU válido no canvas.');
  }

  const info: BackendInfo = {
    deviceType: isWebGPU ? 'webgpu' : 'webgl2',
    type: isWebGPU ? 'webgpu' : 'webgl2',
    isWebGPU,
    isWebGL2,
    description: isWebGPU
      ? 'WebGPU (Próxima Geração - 60 FPS Nativo)'
      : 'WebGL 2 (Fallback Estável - Compatibilidade Total)',
  };

  cachedBackendInfo = info;
  console.log(`[Eldrim PlayCanvas V2] Backend ativo verificado: ${info.description}`);

  return { device, info };
}

export function getActiveBackendInfo(): BackendInfo | null {
  return cachedBackendInfo;
}

const GL_ENUM_MAP: Record<number, string> = {
  // Formatos
  0x1902: 'DEPTH_COMPONENT',
  0x1906: 'ALPHA',
  0x1907: 'RGB',
  0x1908: 'RGBA',
  0x1909: 'LUMINANCE',
  0x190a: 'LUMINANCE_ALPHA',
  0x8227: 'RG',
  0x8228: 'RG_INTEGER',
  0x8d94: 'RED_INTEGER',
  0x8d98: 'RGB_INTEGER',
  0x8d99: 'RGBA_INTEGER',

  // Tipos
  0x1400: 'BYTE',
  0x1401: 'UNSIGNED_BYTE',
  0x1402: 'SHORT',
  0x1403: 'UNSIGNED_SHORT',
  0x1404: 'INT',
  0x1405: 'UNSIGNED_INT',
  0x1406: 'FLOAT',
  0x8363: 'UNSIGNED_SHORT_5_6_5',
  0x8033: 'UNSIGNED_SHORT_4_4_4_4',
  0x8034: 'UNSIGNED_SHORT_5_5_5_1',
  0x8c3e: 'HALF_FLOAT',
  0x8059: 'RGB10_A2',
  0x8368: 'UNSIGNED_INT_2_10_10_10_REV',

  // Formatos Internos
  0x8051: 'RGB8',
  0x8058: 'RGBA8',
  0x8229: 'R8',
  0x822b: 'RG8',
  0x8232: 'R8UI',
  0x8238: 'RG8UI',
  0x8236: 'R16UI',
  0x823c: 'RGBA16UI',
  0x8d70: 'RGBA32UI',
  0x8814: 'RGBA32F',
  0x881a: 'RGBA16F',
  0x8c41: 'SRGB8',
  0x8c43: 'SRGB8_ALPHA8',
};

export function formatGLEnum(gl: any, val: number | undefined): string {
  if (val === undefined || val === null) return 'undefined';
  if (GL_ENUM_MAP[val]) return `${val} (${GL_ENUM_MAP[val]})`;
  if (gl) {
    for (const k in gl) {
      if ((gl as any)[k] === val && typeof (gl as any)[k] === 'number') {
        return `${val} (${k})`;
      }
    }
  }
  return `0x${val.toString(16)} (${val})`;
}

/**
 * Hook no GraphicsDevice para monitorar uploads de QUALQUER textura (usuário e internas da engine)
 */
export function hookDeviceTextureUploads(device: GraphicsDevice): void {
  const dev = device as any;
  if (!dev || dev.__uploadLoggingHooked) return;
  dev.__uploadLoggingHooked = true;

  if (typeof dev.createTextureImpl === 'function') {
    const origCreateTextureImpl = dev.createTextureImpl.bind(dev);
    dev.createTextureImpl = function (tex: any) {
      const impl = origCreateTextureImpl(tex);
      if (impl && typeof impl.upload === 'function') {
        const origUpload = impl.upload.bind(impl);
        impl.upload = function (deviceArg: any, textureArg: any) {
          const gl = deviceArg?.gl || dev.gl;
          const texObj = textureArg || tex;
          const texName = texObj?.name || 'unnamed_texture';
          const w = texObj?._width ?? texObj?.width ?? 0;
          const h = texObj?._height ?? texObj?.height ?? 0;
          const formatVal = impl._glFormat;
          const typeVal = impl._glPixelType;
          const internalFormatVal = impl._glInternalFormat;
          const isSubImage = !!impl._glCreated;

          console.log(
            `%c[GL Texture Upload PRE-CALL]%c "${texName}" -> ` +
            `Op=${isSubImage ? 'glTexSubImage2D' : 'glTexImage2D'} | ` +
            `size=${w}x${h} | ` +
            `format=${formatGLEnum(gl, formatVal)} | ` +
            `type=${formatGLEnum(gl, typeVal)} | ` +
            `internalFormat=${formatGLEnum(gl, internalFormatVal)} | ` +
            `glCreated=${isSubImage}`,
            'color: #38bdf8; font-weight: bold;',
            'color: inherit;'
          );

          const errBefore = gl?.getError ? gl.getError() : 0;
          let res: any;
          try {
            res = origUpload(deviceArg, textureArg);
          } catch (uploadErr) {
            console.error(
              `[GL Texture Upload EXCEPTION] Textura "${texName}" disparou exceção durante upload:`,
              uploadErr
            );
            throw uploadErr;
          }

          const errAfter = gl?.getError ? gl.getError() : 0;
          if (errAfter !== 0 && errAfter !== errBefore) {
            console.error(
              `%c[GL Texture Upload ERRO ANGLE/GL]%c Falha na textura "${texName}"! ` +
              `GL Error Code: ${errAfter} (0x${errAfter.toString(16)}) | ` +
              `Op: ${isSubImage ? 'glTexSubImage2D' : 'glTexImage2D'} | ` +
              `format=${formatGLEnum(gl, formatVal)} | ` +
              `type=${formatGLEnum(gl, typeVal)} | ` +
              `internalFormat=${formatGLEnum(gl, internalFormatVal)}`,
              'color: #ef4444; font-weight: bold;',
              'color: inherit;'
            );
          }

          return res;
        };
      }
      return impl;
    };
  }
}

/**
 * Cria uma textura de Pixel Art no PlayCanvas com filtragem Nearest e sem mipmaps
 */
export function createPixelTexture(
  device: GraphicsDevice,
  source: HTMLCanvasElement | HTMLImageElement,
  flipY = false,
  name = 'pixel_texture'
): Texture {
  // Garante que o hook no device esteja ativo
  hookDeviceTextureUploads(device);

  const texture = new Texture(device, {
    name,
    width: source.width,
    height: source.height,
    format: PIXELFORMAT_RGBA8,
    minFilter: FILTER_NEAREST,
    magFilter: FILTER_NEAREST,
    addressU: ADDRESS_CLAMP_TO_EDGE,
    addressV: ADDRESS_CLAMP_TO_EDGE,
    mipmaps: false,
    flipY,
    levels: [source as any],
  });

  texture.name = name;

  const impl = (texture as any).impl;
  const gl = (device as any).gl;
  const formatVal = impl?._glFormat ?? PIXELFORMAT_RGBA8;
  const typeVal = impl?._glPixelType ?? (gl ? gl.UNSIGNED_BYTE : 5121);
  const internalFormatVal = impl?._glInternalFormat ?? (gl ? gl.RGBA8 : 32856);

  console.log(
    `[createPixelTexture] "${name}" instanciada: ` +
    `size=${source.width}x${source.height} | ` +
    `format=${formatGLEnum(gl, formatVal)} | ` +
    `type=${formatGLEnum(gl, typeVal)} | ` +
    `internalFormat=${formatGLEnum(gl, internalFormatVal)} | ` +
    `levels=[${source.constructor?.name || 'Canvas/Image'}]`
  );

  return texture;
}

import { PlayCanvasAssets } from '../assets/PlayCanvasAssets';

export interface PixelMaterialOptions {
  diffuseMap?: Texture;
  texture?: Texture;
  useLighting?: boolean;
  opacity?: number;
  transparent?: boolean;
  additive?: boolean;
  cull?: number;
  diffuseTint?: Color;
  emissiveTint?: Color;
  alphaTest?: number;
  depthWrite?: boolean;
}

/**
 * Cria um StandardMaterial calibrado para Pixel Art 2D / 2.5D
 * Em estrita conformidade com a Regra 29 (Eldrim Architecture):
 * 
 * Materiais pixel-art unlit (useLighting=false) utilizam:
 *   material.emissiveMap = texture;
 *   material.emissive = new Color(1, 1, 1);
 *   material.useLighting = false;
 * 
 * A textura original permanece como fonte de alpha quando necessário:
 *   material.opacityMap = texture;
 *   material.opacityMapChannel = 'a';
 * 
 * Sincroniza dinamicamente transformações de UV (tiling e offset) e cores (diffuse -> emissive)
 * para preservar a compatibilidade transparente com SpriteAnimation, WaterSystem,
 * ValeVerdejanteWorld e flash de dano em CombatTargetEntity.
 */
export function createPixelMaterial(
  options: PixelMaterialOptions
): StandardMaterial {
  const mat = new StandardMaterial();
  const tex = options.diffuseMap ?? options.texture;
  const useLighting = options.useLighting ?? false;
  mat.useLighting = useLighting;

  if (tex) {
    if (!useLighting) {
      // Regra 29: Unlit pixel-art utiliza emissiveMap como fonte visual principal
      mat.emissiveMap = tex;
      mat.emissive = options.emissiveTint ?? options.diffuseTint ?? new Color(1, 1, 1);
      // Mantém diffuseMap como referência secundária compatível
      mat.diffuseMap = tex;
      if (options.diffuseTint) {
        mat.diffuse = options.diffuseTint;
      }
    } else {
      mat.diffuseMap = tex;
      if (options.diffuseTint) {
        mat.diffuse = options.diffuseTint;
      }
      if (options.emissiveTint) {
        mat.emissive = options.emissiveTint;
      }
    }

    if (options.transparent !== false) {
      mat.opacityMap = tex;
      mat.opacityMapChannel = 'a';
      mat.blendType = options.additive ? BLEND_ADDITIVE : BLEND_NORMAL;
      mat.opacity = options.opacity ?? 1.0;
      // Alpha test para descarte de fragmentos (elimina halos, bordas retangulares e artefatos)
      mat.alphaTest = options.alphaTest ?? 0.08;
      if (options.depthWrite !== undefined) {
        mat.depthWrite = options.depthWrite;
      }
    } else {
      mat.blendType = BLEND_NONE;
      mat.opacity = options.opacity ?? 1.0;
      if (options.depthWrite !== undefined) {
        mat.depthWrite = options.depthWrite;
      }
    }

    if (!useLighting) {
      // Garante alinhamento imediato de tiling e offset
      mat.emissiveMapTiling.copy(mat.diffuseMapTiling);
      mat.emissiveMapOffset.copy(mat.diffuseMapOffset);
      if (mat.opacityMap) {
        mat.opacityMapTiling.copy(mat.diffuseMapTiling);
        mat.opacityMapOffset.copy(mat.diffuseMapOffset);
      }

      // Sincroniza mutações dinâmicas em diffuseMapTiling/Offset com emissiveMap e opacityMap
      const origTilingSet = mat.diffuseMapTiling.set.bind(mat.diffuseMapTiling);
      mat.diffuseMapTiling.set = function (x: number, y: number) {
        origTilingSet(x, y);
        mat.emissiveMapTiling.set(x, y);
        if (mat.opacityMap) mat.opacityMapTiling.set(x, y);
        return this;
      };

      const origTilingCopy = mat.diffuseMapTiling.copy.bind(mat.diffuseMapTiling);
      mat.diffuseMapTiling.copy = function (rhs: any) {
        origTilingCopy(rhs);
        mat.emissiveMapTiling.copy(rhs);
        if (mat.opacityMap) mat.opacityMapTiling.copy(rhs);
        return this;
      };

      const origOffsetSet = mat.diffuseMapOffset.set.bind(mat.diffuseMapOffset);
      mat.diffuseMapOffset.set = function (x: number, y: number) {
        origOffsetSet(x, y);
        mat.emissiveMapOffset.set(x, y);
        if (mat.opacityMap) mat.opacityMapOffset.set(x, y);
        return this;
      };

      const origOffsetCopy = mat.diffuseMapOffset.copy.bind(mat.diffuseMapOffset);
      mat.diffuseMapOffset.copy = function (rhs: any) {
        origOffsetCopy(rhs);
        mat.emissiveMapOffset.copy(rhs);
        if (mat.opacityMap) mat.opacityMapOffset.copy(rhs);
        return this;
      };

      // Sincroniza alterações de cor diffuse -> emissive (ex: flash de dano)
      const origDiffuseSet = mat.diffuse.set.bind(mat.diffuse);
      mat.diffuse.set = function (r: number, g: number, b: number, a?: number) {
        origDiffuseSet(r, g, b, a);
        mat.emissive.set(r, g, b, a);
        return this;
      };

      const origDiffuseCopy = mat.diffuse.copy.bind(mat.diffuse);
      mat.diffuse.copy = function (rhs: any) {
        origDiffuseCopy(rhs);
        mat.emissive.copy(rhs);
        return this;
      };
    }
  } else {
    // Material sem textura (cor sólida)
    if (!useLighting) {
      mat.emissive = options.emissiveTint ?? options.diffuseTint ?? new Color(1, 1, 1);
    }
    if (options.diffuseTint) {
      mat.diffuse = options.diffuseTint;
    }
    if (options.opacity !== undefined) {
      mat.opacity = options.opacity;
    }
    if (options.transparent !== false && options.opacity !== undefined && options.opacity < 1.0) {
      mat.blendType = options.additive ? BLEND_ADDITIVE : BLEND_NORMAL;
    }
  }

  mat.cull = options.cull ?? CULLFACE_NONE;
  mat.update();
  PlayCanvasAssets.registerMaterial(mat);
  return mat;
}
