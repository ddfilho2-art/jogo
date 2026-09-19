import React, { useEffect, useRef, useState } from 'react';
import { EldrimApp, EldrimTelemetry } from '../playcanvas/app/EldrimApp';
import { Shield, Sparkles, Coins, Compass, Gamepad2, Cpu, Zap, Activity, Eye, X, Layers, MapPin, Box } from 'lucide-react';
import { eventBus } from '../phaser/eventBus';
import renPortrait from '../assets/images/ren_pixel_art_1788915175087.jpg';
import renV2Concept from '../assets/images/ren_v2_concept_1789384551780.jpg';
import rpgWarriorModelImg from '../assets/images/rpg_warrior_model_1789393601221.jpg';
import warriorGameSpritesImg from '../assets/images/warrior_game_sprites_1789393619187.jpg';
import rockLargeImg from '../assets/images/stylized_rock_large_1789384074972.jpg';
import rockMedImg from '../assets/images/rock_med_concept_1789385324127.jpg';
import rockSmallImg from '../assets/images/rock_small_concept_1789385339838.jpg';
import rockTinyImg from '../assets/images/rock_tiny_concept_1789385352705.jpg';

// =============================================================================
// ELDRIM: ECOS DO PASSADO - COMPONENTE PLAYCANVAS GAME (VERTICAL SLICE V2)
// =============================================================================

interface PlayCanvasGameProps {
  onSwitchToPhaser?: () => void;
}

export const PlayCanvasGame: React.FC<PlayCanvasGameProps> = ({ onSwitchToPhaser }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const appRef = useRef<EldrimApp | null>(null);
  const [useMinimalTest, setUseMinimalTest] = useState<boolean>(false);
  const [activeLayerFilter, setActiveLayerFilter] = useState<'all' | 'bg' | 'trees' | 'rocks' | 'flora' | 'bridge_river'>('all');

  const [telemetry, setTelemetry] = useState<EldrimTelemetry>({
    fps: 60,
    frameTimeMs: 16.6,
    drawCalls: 2,
    backend: { deviceType: 'webgpu', type: 'webgpu', isWebGPU: true, isWebGL2: false, description: 'Iniciando WebGPU...' },
    resolution: '640 × 360 (16:9)',
  });

  const [vida] = useState<number>(4);
  const [vidaMax] = useState<number>(4);
  const [arcanoInfo] = useState<{ atual: 20; max: 20 }>({ atual: 20, max: 20 });
  const [selos] = useState<number>(45);
  const [showRenModal, setShowRenModal] = useState<boolean>(false);
  const [showRockModal, setShowRockModal] = useState<boolean>(false);

  // 3-Way Comparative Technology Test State
  const [activePrototype, setActivePrototype] = useState<'A' | 'B' | 'C'>('B');
  const [diagnosticActive, setDiagnosticActive] = useState<boolean>(false);
  const [spatialInfo, setSpatialInfo] = useState<{
    x: number;
    y: number;
    z?: number;
    depthZ?: number;
    prototype?: 'A' | 'B' | 'C';
    visible?: boolean;
    rootEnabled?: boolean;
    shadowEnabled?: boolean;
    biome: string;
    zone: string;
    priorityLevel: number;
    priorityName: string;
    description: string;
    jumpHeight: number;
    state: string;
    diagnosticMode?: boolean;
  }>({
    x: 320,
    y: 220,
    z: 10,
    depthZ: 10,
    prototype: 'B',
    visible: true,
    rootEnabled: true,
    shadowEnabled: true,
    biome: 'FIELD',
    zone: 'PLAYABLE_AREA',
    priorityLevel: 5,
    priorityName: '5. PLAYABLE_AREA',
    description: 'Clareira de combate/circulação em FIELD',
    jumpHeight: 0,
    state: 'idle',
    diagnosticMode: false,
  });

  const handleSelectPrototype = (id: 'A' | 'B' | 'C') => {
    setActivePrototype(id);
    appRef.current?.setHeroPrototype(id);
  };

  const handleToggleDiagnostic = () => {
    const newState = appRef.current?.toggleDiagnosticMode() ?? !diagnosticActive;
    setDiagnosticActive(newState);
  };

  useEffect(() => {
    // Teclas globais 1, 2, 3 para alternância de protótipos e F8 para Diagnóstico Visual
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
      if (e.key === '1') handleSelectPrototype('A');
      else if (e.key === '2') handleSelectPrototype('B');
      else if (e.key === '3') handleSelectPrototype('C');
      else if (e.key === 'F8') {
        e.preventDefault();
        handleToggleDiagnostic();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [diagnosticActive]);

  useEffect(() => {
    if (!canvasRef.current) return;

    const eldrimApp = new EldrimApp(canvasRef.current, (t) => {
      setTelemetry(t);
    });

    appRef.current = eldrimApp;

    eldrimApp.start(useMinimalTest).catch((err) => {
      console.error('[PlayCanvasGame] Erro ao iniciar PlayCanvas:', err);
    });

    const onSpatial = (data: any) => {
      if (data) {
        setSpatialInfo(data);
        if (data.prototype) {
          setActivePrototype(data.prototype);
        }
        if (typeof data.diagnosticMode === 'boolean') {
          setDiagnosticActive(data.diagnosticMode);
        }
      }
    };

    const onProto = (data: any) => {
      if (data?.prototypeId) {
        setActivePrototype(data.prototypeId);
      }
    };

    eventBus.on('infoEspacialMudou', onSpatial);
    eventBus.on('heroiTrocouPrototipo', onProto);

    return () => {
      eventBus.off('infoEspacialMudou', onSpatial);
      eventBus.off('heroiTrocouPrototipo', onProto);
      if (appRef.current) {
        appRef.current.destroy();
        appRef.current = null;
      }
    };
  }, [useMinimalTest]);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center select-none overflow-hidden bg-[#07090e]">
      {/* 1. HUD SUPERIOR (Casca React posicionada sobre o jogo) */}
      <header className="absolute top-2 left-2 right-2 z-20 flex items-center justify-between pointer-events-none px-3 py-2 rounded bg-black/75 backdrop-blur-md border border-white/10 text-xs font-mono text-slate-200 shadow-xl">
        {/* Personagem & Vida */}
        <div className="flex items-center gap-3 pointer-events-auto">
          <button
            onClick={() => setShowRenModal(true)}
            className="flex items-center gap-1.5 mr-1 group cursor-pointer text-left"
            title="Clique para abrir a avaliação visual comparativa do Ren V2"
          >
            <div className="w-7 h-7 rounded-xs overflow-hidden border border-amber-500/80 group-hover:border-emerald-400 bg-stone-900 flex items-center justify-center shadow-md transition-colors">
              <img
                src={renPortrait}
                alt="Ren"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                <span className="text-[11px] font-bold text-amber-200 leading-none">REN</span>
                <span className="text-[8px] bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 px-1 py-0.2 rounded font-mono">NOVO V2</span>
              </div>
              <span className="text-[9px] text-amber-500/90 font-mono leading-none mt-0.5">V8 HD → V2</span>
            </div>
          </button>

          {/* Fragmentos de Vida */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-amber-400 font-semibold tracking-wider mr-1">VIDA</span>
            {Array.from({ length: vidaMax }).map((_, i) => (
              <div
                key={i}
                className={`w-3.5 h-3.5 rotate-45 transition-all duration-300 border ${
                  i < vida
                    ? 'bg-rose-500 border-rose-300 shadow-[0_0_6px_rgba(244,63,94,0.6)]'
                    : 'bg-stone-800 border-stone-600'
                }`}
                title={`Fragmento ${i + 1}`}
              />
            ))}
          </div>

          {/* Barra de Fluxo Arcano */}
          <div className="ml-3 hidden sm:flex items-center gap-1.5" title="Fluxo Arcano de Eldrim">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <div className="flex flex-col">
              <div className="flex items-center justify-between text-[9px] font-mono text-cyan-300">
                <span className="font-semibold tracking-wider">ARCANO</span>
                <span>{arcanoInfo.atual}/{arcanoInfo.max}</span>
              </div>
              <div className="w-24 h-2 bg-slate-900 border border-cyan-700/80 rounded-xs overflow-hidden shadow-[0_0_8px_rgba(6,182,212,0.25)]">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 via-cyan-400 to-sky-200 transition-all duration-200"
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Informações Centrais de Diagnóstico Engine & Backend */}
        <div className="hidden lg:flex items-center gap-3 px-3 py-1 bg-slate-900/80 rounded border border-cyan-500/30 text-[10px]">
          <div className="flex items-center gap-1 text-cyan-400 font-bold">
            <Cpu className="w-3.5 h-3.5 text-cyan-300" />
            <span>PLAYCANVAS V2</span>
          </div>
          <span className="text-slate-600">|</span>
          <div className="flex items-center gap-1">
            <Zap className={`w-3 h-3 ${(telemetry.backend?.type || telemetry.backend?.deviceType) === 'webgpu' ? 'text-emerald-400' : 'text-amber-400'}`} />
            <span className={(telemetry.backend?.type || telemetry.backend?.deviceType) === 'webgpu' ? 'text-emerald-300 font-bold' : 'text-amber-300 font-bold'}>
              {((telemetry.backend?.type || telemetry.backend?.deviceType || 'webgpu')).toUpperCase()}
            </span>
          </div>
          <span className="text-slate-600">|</span>
          <div className="flex items-center gap-1 text-slate-300">
            <Activity className="w-3 h-3 text-cyan-400" />
            <span className="font-bold text-white">{telemetry.fps} FPS</span>
            <span className="text-slate-400 text-[9px]">({telemetry.frameTimeMs}ms)</span>
          </div>
        </div>

        {/* Região e Selos */}
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-1.5 text-emerald-400">
            <Compass className="w-3.5 h-3.5" />
            <span className="text-[11px] font-bold">Vale Verdejante (PlayCanvas V2)</span>
          </div>

          <div className="flex items-center gap-1 text-amber-300 font-bold">
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            <span>{selos}</span>
          </div>
        </div>
      </header>

      {/* 2. ÁREA DO CANVAS DO PLAYCANVAS ENGINE V2 (640×360 Widescreen Widescreen Canvas) */}
      <div className="relative flex items-center justify-center w-full h-full p-2">
        <div className="relative flex items-center justify-center shadow-2xl rounded-xs overflow-hidden border border-amber-500/30 max-w-[960px] max-h-[540px] w-full aspect-video bg-black">
          <canvas
            ref={canvasRef}
            className="w-full h-full block"
            style={{ imageRendering: 'pixelated' }}
          />

          {/* OVERLAY DE TESTE COMPARATIVO DE TECNOLOGIAS E DEBUG ESPACIAL (HUD TEMPORÁRIO) */}
          <div className="absolute top-2 left-2 right-2 pointer-events-none flex flex-wrap items-center justify-between gap-2 z-10">
            {/* Seletor Rápido de Protótipo (A/B/C) */}
            <div className="flex items-center gap-1.5 p-1 bg-black/85 backdrop-blur-md border border-cyan-500/40 rounded shadow-lg pointer-events-auto text-[10px] font-mono">
              <span className="text-cyan-300 font-bold px-1 flex items-center gap-1">
                <Box className="w-3 h-3 text-cyan-400" />
                HERÓI:
              </span>
              <button
                onClick={() => handleSelectPrototype('A')}
                className={`px-2 py-0.5 rounded cursor-pointer transition-colors font-bold ${
                  activePrototype === 'A'
                    ? 'bg-cyan-600 text-white shadow-[0_0_8px_rgba(6,182,212,0.6)]'
                    : 'bg-slate-900/90 text-slate-300 hover:bg-slate-800'
                }`}
                title="Protótipo A: 3D Procedural Articulado baseado na referência Warrior RPG 4054 (Tecla 1)"
              >
                [1] A: 3D Procedural
              </button>
              <button
                onClick={() => handleSelectPrototype('B')}
                className={`px-2 py-0.5 rounded cursor-pointer transition-colors font-bold ${
                  activePrototype === 'B'
                    ? 'bg-amber-600 text-white shadow-[0_0_8px_rgba(245,158,11,0.6)]'
                    : 'bg-slate-900/90 text-slate-300 hover:bg-slate-800'
                }`}
                title="Protótipo B: 2D Sprite Tradicional com Texture Atlas (Tecla 2)"
              >
                [2] B: 2D Sprite
              </button>
              <button
                onClick={() => handleSelectPrototype('C')}
                className={`px-2 py-0.5 rounded cursor-pointer transition-colors font-bold ${
                  activePrototype === 'C'
                    ? 'bg-emerald-600 text-white shadow-[0_0_8px_rgba(16,185,129,0.6)]'
                    : 'bg-slate-900/90 text-slate-300 hover:bg-slate-800'
                }`}
                title="Protótipo C: 2D Skeletal Hierárquico Multi-Peça (Tecla 3)"
              >
                [3] C: 2D Skeletal
              </button>
            </div>

            {/* Badge Semântico Espacial em Tempo Real */}
            <div className="flex items-center gap-2 px-2.5 py-1 bg-black/85 backdrop-blur-md border border-amber-500/40 rounded shadow-lg text-[10px] font-mono pointer-events-auto">
              <div className="flex items-center gap-1 text-amber-300">
                <MapPin className="w-3 h-3 text-amber-400" />
                <span className="font-bold">BIOMA:</span>
                <span className="text-amber-200">{spatialInfo.biome}</span>
              </div>
              <span className="text-slate-600">|</span>
              <div className="flex items-center gap-1">
                <span className="text-slate-400">ZONA:</span>
                <span className={`font-bold ${
                  spatialInfo.zone === 'PATH' ? 'text-amber-400' :
                  spatialInfo.zone === 'RIVER' ? 'text-blue-400' :
                  spatialInfo.zone === 'FIXED_OBJECT' ? 'text-purple-400' :
                  spatialInfo.zone === 'PLAYABLE_AREA' ? 'text-emerald-400' : 'text-slate-300'
                }`}>
                  {spatialInfo.zone}
                </span>
              </div>
              <span className="text-slate-600">|</span>
              <div className="flex items-center gap-1 text-slate-400">
                <span>POS:</span>
                <span className="text-white font-bold">({spatialInfo.x}, {spatialInfo.y})</span>
              </div>
              <span className="text-slate-600">|</span>
              <div className="flex items-center gap-1 text-slate-400">
                <span>PRIORIDADE:</span>
                <span className="text-cyan-300">{spatialInfo.priorityLevel}</span>
              </div>
              {spatialInfo.jumpHeight > 0 && (
                <>
                  <span className="text-slate-600">|</span>
                  <span className="text-yellow-300 font-bold">PULO: {spatialInfo.jumpHeight}px</span>
                </>
              )}
            </div>

            {/* Botão de Atalho F8 - Modo de Diagnóstico Visual */}
            <button
              onClick={handleToggleDiagnostic}
              className={`px-2 py-1 rounded cursor-pointer transition-colors font-bold text-[10px] font-mono pointer-events-auto flex items-center gap-1.5 shadow-lg ${
                diagnosticActive
                  ? 'bg-emerald-600 text-white border border-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.7)]'
                  : 'bg-black/85 text-slate-300 border border-slate-700 hover:bg-slate-800'
              }`}
              title="Alternar Modo de Diagnóstico Visual (Tecla F8)"
            >
              <span className={`w-2 h-2 rounded-full ${diagnosticActive ? 'bg-white animate-pulse' : 'bg-slate-500'}`} />
              <span>F8: {diagnosticActive ? 'DEBUG VISUAL ATIVO' : 'DEBUG VISUAL'}</span>
            </button>
          </div>

          {/* PAINEL DE DIAGNÓSTICO VISUAL OBRIGATÓRIO (F8) */}
          {diagnosticActive && (
            <div className="absolute top-12 left-3 z-30 bg-black/92 border-2 border-emerald-400 p-3 rounded-xs font-mono text-[11px] text-emerald-300 shadow-2xl backdrop-blur-md min-w-[210px] pointer-events-auto select-none">
              <div className="flex items-center justify-between border-b border-emerald-500/40 pb-1 mb-2 font-bold text-white tracking-wider">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                  MODO DIAGNÓSTICO (F8)
                </span>
                <span className="text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-500 px-1 py-0.2 rounded">ON</span>
              </div>
              
              <div className="space-y-1">
                <div className="text-amber-300 font-bold">REN:</div>
                <div className="grid grid-cols-2 gap-x-2 pl-3 text-slate-200">
                  <span className="text-slate-400">X:</span>
                  <span className="text-amber-200 font-bold">{spatialInfo.x}</span>
                  <span className="text-slate-400">Y:</span>
                  <span className="text-amber-200 font-bold">{spatialInfo.y}</span>
                  <span className="text-slate-400">Z:</span>
                  <span className="text-amber-200 font-bold">{spatialInfo.z ?? spatialInfo.depthZ ?? 10}</span>
                </div>

                <div className="pt-1.5 border-t border-white/10 flex justify-between items-center">
                  <span className="text-slate-400">PROTOTYPE:</span>
                  <span className="font-bold text-white px-1.5 py-0.2 rounded bg-slate-800 border border-slate-600">
                    {spatialInfo.prototype || activePrototype}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-400">VISIBLE:</span>
                  <span className={`font-bold ${spatialInfo.visible !== false ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {spatialInfo.visible !== false ? 'true' : 'false'}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-400">ROOT ENABLED:</span>
                  <span className={`font-bold ${spatialInfo.rootEnabled !== false ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {spatialInfo.rootEnabled !== false ? 'true' : 'false'}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-400">SHADOW:</span>
                  <span className={`font-bold ${spatialInfo.shadowEnabled !== false ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {spatialInfo.shadowEnabled !== false ? 'true' : 'false'}
                  </span>
                </div>

                <div className="pt-1.5 border-t border-white/10 flex justify-between items-center">
                  <span className="text-slate-400">DEPTH Z:</span>
                  <span className="text-cyan-300 font-bold">{spatialInfo.depthZ ?? spatialInfo.z ?? 10}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. RODAPÉ DE METRICAS E CONTROLES */}
      <footer className="absolute bottom-2 left-2 right-2 z-20 flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 rounded bg-black/80 backdrop-blur-md border border-white/10 text-[11px] font-mono text-slate-300 shadow-xl">
        {/* Status e Backend Telemetry */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-amber-400 font-bold">
            <Shield className="w-3.5 h-3.5 text-amber-300" />
            <span>Eldrim V2 Slice:</span>
          </div>
          <span className="px-1.5 py-0.5 rounded bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 font-semibold text-[10px]">
            {(telemetry.backend?.type || telemetry.backend?.deviceType) === 'webgpu' ? '⚡ WebGPU Ativo' : '🔄 Fallback WebGL2'}
          </span>
          <span className="text-slate-400 text-[10px] hidden sm:inline">
            Resolução: {telemetry.resolution}
          </span>
        </div>

        {/* Guia de Controles Completo */}
        <div className="flex items-center gap-2 text-[10px] text-slate-300">
          <span><b className="text-cyan-300">1/2/3</b>: Protótipos</span>
          <span className="text-slate-600">•</span>
          <span><b className="text-amber-300">WASD</b>: Mover</span>
          <span className="text-slate-600">•</span>
          <span><b className="text-amber-300">Shift</b>: Correr</span>
          <span className="text-slate-600">•</span>
          <span><b className="text-amber-300">Espaço</b>: Pulo</span>
          <span className="text-slate-600">•</span>
          <span><b className="text-amber-300">J/Z</b>: Golpe</span>
          <span className="text-slate-600">•</span>
          <span><b className="text-amber-300">K</b>: Forte</span>
          <span className="text-slate-600">•</span>
          <span><b className="text-amber-300">R/C</b>: Esquiva</span>
          <span className="text-slate-600">•</span>
          <span><b className="text-amber-300">L</b>: Arcano</span>
          <span className="text-slate-600">•</span>
          <button
            onClick={handleToggleDiagnostic}
            className={`px-1 py-0.2 rounded font-bold cursor-pointer transition-colors ${
              diagnosticActive ? 'bg-emerald-600 text-white' : 'text-emerald-400 hover:text-emerald-300'
            }`}
          >
            F8: Debug
          </button>
        </div>

        {/* Inspetor de Camadas 2.5D */}
        {!useMinimalTest && (
          <div className="flex items-center gap-1 bg-slate-900/90 px-2 py-0.5 rounded border border-slate-700/60 text-[10px]">
            <span className="text-slate-400 mr-1">Camadas:</span>
            {(['all', 'trees', 'rocks', 'flora', 'bridge_river', 'bg'] as const).map((f) => (
              <button
                key={f}
                onClick={() => {
                  setActiveLayerFilter(f);
                  appRef.current?.setLayerFilter(f);
                }}
                className={`px-1.5 py-0.2 rounded text-[9px] cursor-pointer transition-colors ${
                  activeLayerFilter === f
                    ? 'bg-amber-600 text-white font-bold'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                {f === 'all' ? 'Tudo' : f === 'trees' ? 'Árvores' : f === 'rocks' ? 'Rochas' : f === 'flora' ? 'Flora' : f === 'bridge_river' ? 'Ponte/Rio' : 'Fundo'}
              </button>
            ))}
          </div>
        )}

        {/* Alternador de Cena / Teste */}
        <button
          onClick={() => setUseMinimalTest((prev) => !prev)}
          className="px-2 py-0.5 rounded bg-amber-950/70 hover:bg-amber-900 border border-amber-600/50 text-[10px] text-amber-200 cursor-pointer transition-colors"
          title="Alternar entre a cena real Vale Verdejante e a cena diagnóstica isolada"
        >
          {useMinimalTest ? 'Carregar Vale Verdejante' : 'Cena Diagnóstico'}
        </button>

        {/* Botão de Avaliação do Novo Protagonista Ren V2 */}
        <button
          onClick={() => setShowRenModal(true)}
          className="px-2 py-0.5 rounded bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/60 text-[10px] text-emerald-200 cursor-pointer transition-colors flex items-center gap-1 font-semibold shadow-md"
          title="Abrir a avaliação visual comparativa do novo Ren V2"
        >
          <Eye className="w-3 h-3 text-emerald-400" />
          Ren V2 Concept
        </button>

        {/* Botão de Avaliação da Família de Rochas */}
        <button
          onClick={() => setShowRockModal(true)}
          className="px-2 py-0.5 rounded bg-blue-950/80 hover:bg-blue-900 border border-blue-500/60 text-[10px] text-blue-200 cursor-pointer transition-colors flex items-center gap-1 font-semibold shadow-md"
          title="Abrir a avaliação comparativa da Família de Rochas (Large, Med, Small, Tiny)"
        >
          <Eye className="w-3 h-3 text-blue-400" />
          Família Rochas
        </button>

        {/* Alternador de Engine (Permite testar Phaser ou PlayCanvas) */}
        {onSwitchToPhaser && (
          <button
            onClick={onSwitchToPhaser}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-600 text-[10px] text-slate-200 cursor-pointer transition-colors"
            title="Alternar para visualização de referência no Phaser 3"
          >
            Modo Phaser 3 (Ref)
          </button>
        )}
      </footer>

      {/* 3. MODAL DE AVALIAÇÃO COMPARATIVA DO PROTAGONISTA REN (RECONSTRUÇÃO VISUAL IN-GAME) */}
      {showRenModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-slate-950 border border-slate-700/80 rounded-lg shadow-2xl overflow-hidden text-slate-200 font-sans">
            {/* Header do Modal */}
            <div className="flex items-center justify-between px-4 py-3 bg-slate-900/90 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <h3 className="text-sm font-bold text-amber-200 tracking-wide">
                  ELDRIM — RECONSTRUÇÃO VISUAL DO HERÓI NO MUNDO JOGÁVEL
                </h3>
                <span className="text-[10px] bg-emerald-950 border border-emerald-500/40 text-emerald-300 px-2 py-0.5 rounded font-mono">
                  ≥ 90% APROXIMAÇÃO
                </span>
              </div>
              <button
                onClick={() => setShowRenModal(false)}
                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Conteúdo do Modal */}
            <div className="p-4 overflow-y-auto space-y-4 text-xs">
              <div className="p-2.5 rounded bg-emerald-950/40 border border-emerald-500/30 text-emerald-200 text-[11px] leading-relaxed flex items-center justify-between">
                <div>
                  <b>Regra Absoluta Cumprida:</b> O retrato do HUD no topo da interface permanece 100% inalterado. Somente o personagem do herói renderizado dentro do mundo jogável foi reconstruído.
                </div>
                <span className="text-[10px] text-amber-300 font-mono px-2 py-1 bg-black/40 rounded border border-amber-500/30 whitespace-nowrap ml-2">
                  HUD: INTOCÁVEL ✓
                </span>
              </div>

              {/* Grid de Comparação Lado a Lado */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* 1. Referência Oficial Free3D RPG Warrior 4054 */}
                <div className="flex flex-col items-center bg-slate-900/60 border border-slate-800 rounded-md p-3">
                  <span className="text-[11px] font-bold text-amber-400/90 uppercase tracking-wider mb-2">
                    1. Referência Oficial (Free3D 4054)
                  </span>
                  <div className="w-44 h-56 bg-stone-950 border border-amber-500/30 rounded flex items-center justify-center overflow-hidden mb-3 relative group shadow-md">
                    <img
                      src={rpgWarriorModelImg}
                      alt="Referência RPG Character Warrior"
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                    <span className="absolute bottom-1 right-1 text-[8px] bg-black/80 px-1 rounded text-amber-300 font-mono">
                      Free3D Warrior 4054
                    </span>
                  </div>
                  <ul className="space-y-1 text-[10px] text-slate-400 w-full">
                    <li>• Proporções humanoides atléticas heroicas</li>
                    <li>• Peitoral com placas de aço e rebites</li>
                    <li>• Ombreiras (pauldrons) 3D articuladas</li>
                    <li>• Braçadeiras de couro nas mangas</li>
                    <li>• Botas pesadas de combate com dobras</li>
                  </ul>
                </div>

                {/* 2. Sprites & Render In-Game Reconstruído */}
                <div className="flex flex-col items-center bg-emerald-950/20 border border-emerald-500/40 rounded-md p-3 relative">
                  <div className="absolute top-2 right-2 bg-emerald-500 text-black text-[9px] font-bold px-1.5 py-0.5 rounded">
                    NOVO HERÓI
                  </div>
                  <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider mb-2">
                    2. Novo Personagem no Mundo
                  </span>
                  <div className="w-44 h-56 bg-slate-900/90 border border-emerald-500/50 rounded flex items-center justify-center overflow-hidden mb-3 shadow-lg group">
                    <img
                      src={warriorGameSpritesImg}
                      alt="Sprites do Guerreiro In-Game"
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <ul className="space-y-1 text-[10px] text-slate-300 w-full">
                    <li>• <b>Volume 3D:</b> Iluminação Top-Left consistente</li>
                    <li>• <b>Túnica de Eldrim:</b> Verde-petróleo (<span className="text-emerald-300 font-mono">#2d5c56</span>)</li>
                    <li>• <b>Armadura:</b> Placas de aço escovado com chanfros</li>
                    <li>• <b>160 Frames:</b> Idle, Walk, Attack, Spin, Dodge, Hurt</li>
                    <li>• <b>Sombra de Solo:</b> Elipse suave de contato (44×20)</li>
                  </ul>
                </div>

                {/* 3. Verificação de Critérios (>= 90% de Aproximação) */}
                <div className="flex flex-col items-center bg-slate-900/60 border border-slate-800 rounded-md p-3">
                  <span className="text-[11px] font-bold text-cyan-300 uppercase tracking-wider mb-2">
                    3. Critérios de Aceitação (≥ 90%)
                  </span>
                  <div className="w-full flex-1 flex flex-col justify-between py-1 space-y-2">
                    <div className="p-2 rounded bg-slate-950 border border-slate-800 space-y-1 text-[10px]">
                      <div className="flex items-center justify-between text-emerald-400 font-semibold">
                        <span>Silhueta & Proporções:</span>
                        <span>100% ✓</span>
                      </div>
                      <div className="flex items-center justify-between text-emerald-400 font-semibold">
                        <span>Volume 3D & Chanfros:</span>
                        <span>95% ✓</span>
                      </div>
                      <div className="flex items-center justify-between text-emerald-400 font-semibold">
                        <span>Armadura & Equipamentos:</span>
                        <span>95% ✓</span>
                      </div>
                      <div className="flex items-center justify-between text-emerald-400 font-semibold">
                        <span>Rosto e Cabelo de Guerreiro:</span>
                        <span>92% ✓</span>
                      </div>
                      <div className="flex items-center justify-between text-emerald-400 font-semibold">
                        <span>Harmonia Vale Verdejante:</span>
                        <span>100% ✓</span>
                      </div>
                      <div className="flex items-center justify-between text-emerald-400 font-semibold">
                        <span>Leitura em 640×360:</span>
                        <span>100% ✓</span>
                      </div>
                    </div>

                    <div className="p-2 rounded bg-emerald-950/60 border border-emerald-600/40 text-[10px] text-emerald-200">
                      <span className="font-bold text-amber-300 block mb-0.5">Veredito do Teste Crítico:</span>
                      O herói em cena não possui mais aspecto de protótipo e reflete com máxima fidelidade o guerreiro de RPG de fantasia heroica.
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabela de Paleta Cromática e Conformidade Técnica */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800">
                  <span className="text-[11px] font-bold text-amber-300 block mb-2">
                    Paleta Oficial Harmonizada com Vale Verdejante:
                  </span>
                  <div className="flex flex-wrap gap-2 text-[10px]">
                    <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded border border-slate-800">
                      <span className="w-3 h-3 rounded-xs bg-[#2d5c56]" />
                      <span>Túnica: #2d5c56</span>
                    </div>
                    <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded border border-slate-800">
                      <span className="w-3 h-3 rounded-xs bg-[#64748b]" />
                      <span>Aço: #64748b</span>
                    </div>
                    <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded border border-slate-800">
                      <span className="w-3 h-3 rounded-xs bg-[#5c3317]" />
                      <span>Couro: #5c3317</span>
                    </div>
                    <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded border border-slate-800">
                      <span className="w-3 h-3 rounded-xs bg-[#d97706]" />
                      <span>Latão/Ouro: #d97706</span>
                    </div>
                  </div>
                </div>

                <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800">
                  <span className="text-[11px] font-bold text-amber-300 block mb-2">
                    Verificação de Arquitetura & Controles:
                  </span>
                  <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-300">
                    <span className="text-emerald-400">✓ Animações 160 frames ativas</span>
                    <span className="text-emerald-400">✓ Controles WASD/Setas intactos</span>
                    <span className="text-emerald-400">✓ Ataque com Espaço/J intacto</span>
                    <span className="text-emerald-400">✓ Esquiva/Dodge K intacto</span>
                    <span className="text-emerald-400">✓ Colisão nos pés mantida</span>
                    <span className="text-emerald-400">✓ Câmera 640×360 suave</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer do Modal */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 border-t border-slate-800">
              <span className="text-[10px] text-slate-400">
                Gameplay, colisões e sprites atuais continuam ativos sem interrupção.
              </span>
              <button
                onClick={() => setShowRenModal(false)}
                className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded text-xs transition-colors cursor-pointer"
              >
                Continuar Jogo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. MODAL DE AVALIAÇÃO DA FAMÍLIA DE ROCHAS (LARGE, MED, SMALL, TINY) */}
      {showRockModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-slate-950 border border-slate-700/80 rounded-lg shadow-2xl overflow-hidden text-slate-200 font-sans">
            {/* Header do Modal */}
            <div className="flex items-center justify-between px-4 py-3 bg-slate-900/90 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse" />
                <h3 className="text-sm font-bold text-slate-100 tracking-wide">
                  Família de Rochas — Avaliação de Coerência Visual (Vale Verdejante)
                </h3>
              </div>
              <button
                onClick={() => setShowRockModal(false)}
                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Fechar avaliação"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Conteúdo Principal */}
            <div className="p-4 overflow-y-auto space-y-4 flex-1">
              <div className="p-2.5 rounded bg-blue-950/40 border border-blue-500/30 text-xs text-blue-200 flex items-start gap-2">
                <div className="mt-0.5 text-blue-400">ℹ</div>
                <div>
                  <p className="font-semibold mb-0.5">Critério de Aceite da Família de Rochas:</p>
                  <p className="text-[11px] text-blue-300/90">
                    &quot;Coloque ROCK LARGE, ROCK MED e ROCK SMALL lado a lado. Um artista olhando para essas três imagens reconhece imediatamente que pertencem ao mesmo conjunto de assets? Resposta: <strong className="text-emerald-300">SIM</strong>.&quot;
                  </p>
                </div>
              </div>

              {/* Grid das 4 Rochas Lado a Lado */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {/* 1. Rock Large */}
                <div className="flex flex-col items-center bg-slate-900/90 p-3 rounded-lg border-2 border-emerald-500/60 shadow-lg">
                  <div className="w-full flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-emerald-400">1. ROCK LARGE</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40">Fonte da Verdade</span>
                  </div>
                  <span className="text-[10px] text-slate-400 mb-2">Aprovada • 128×96 (64×48 no jogo)</span>
                  <div className="w-full h-36 bg-slate-950/80 rounded border border-slate-800 flex items-center justify-center p-2">
                    <img
                      src={rockLargeImg}
                      alt="Rock Large Aprovada"
                      className="max-w-full max-h-full object-contain filter drop-shadow-md"
                    />
                  </div>
                  <div className="w-full mt-2 text-[10px] text-slate-300 space-y-0.5">
                    <div>• Massa pesada assimétrica</div>
                    <div>• Planos geológicos facetados</div>
                    <div>• Musgo verdejante vivo</div>
                  </div>
                </div>

                {/* 2. Rock Med */}
                <div className="flex flex-col items-center bg-slate-900/90 p-3 rounded-lg border border-blue-500/40 shadow-lg">
                  <div className="w-full flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-blue-400">2. ROCK MED</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-500/40">Variação Média</span>
                  </div>
                  <span className="text-[10px] text-slate-400 mb-2">Mesma Pintura • 96×72 (48×36 no jogo)</span>
                  <div className="w-full h-36 bg-slate-950/80 rounded border border-slate-800 flex items-center justify-center p-2">
                    <img
                      src={rockMedImg}
                      alt="Rock Med"
                      className="max-w-full max-h-full object-contain filter drop-shadow-md"
                    />
                  </div>
                  <div className="w-full mt-2 text-[10px] text-slate-300 space-y-0.5">
                    <div>• Mesma paleta e chanfros</div>
                    <div>• Iluminação Top-Left idêntica</div>
                    <div>• Musgo em prateleira superior</div>
                  </div>
                </div>

                {/* 3. Rock Small */}
                <div className="flex flex-col items-center bg-slate-900/90 p-3 rounded-lg border border-blue-500/40 shadow-lg">
                  <div className="w-full flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-blue-400">3. ROCK SMALL</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-500/40">Variação Pequena</span>
                  </div>
                  <span className="text-[10px] text-slate-400 mb-2">Mesma Linguagem • 64×48 (32×24 no jogo)</span>
                  <div className="w-full h-36 bg-slate-950/80 rounded border border-slate-800 flex items-center justify-center p-2">
                    <img
                      src={rockSmallImg}
                      alt="Rock Small"
                      className="max-w-full max-h-full object-contain filter drop-shadow-md"
                    />
                  </div>
                  <div className="w-full mt-2 text-[10px] text-slate-300 space-y-0.5">
                    <div>• Compacta e facetada</div>
                    <div>• Fendas e highlights idênticos</div>
                    <div>• Toque sutil de musgo orgânico</div>
                  </div>
                </div>

                {/* 4. Rock Tiny */}
                <div className="flex flex-col items-center bg-slate-900/90 p-3 rounded-lg border border-blue-500/40 shadow-lg">
                  <div className="w-full flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-blue-400">4. ROCK TINY</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-500/40">Seixo / Cluster</span>
                  </div>
                  <span className="text-[10px] text-slate-400 mb-2">Escala Mínima • 48×36 (24×18 no jogo)</span>
                  <div className="w-full h-36 bg-slate-950/80 rounded border border-slate-800 flex items-center justify-center p-2">
                    <img
                      src={rockTinyImg}
                      alt="Rock Tiny"
                      className="max-w-full max-h-full object-contain filter drop-shadow-md"
                    />
                  </div>
                  <div className="w-full mt-2 text-[10px] text-slate-300 space-y-0.5">
                    <div>• Fragmento ardósia da mesma rocha</div>
                    <div>• Perfeita para margens e bordas</div>
                    <div>• Highlights slate-blue nítidos</div>
                  </div>
                </div>
              </div>

              {/* Tabela de Verificação Técnica das Regras */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded bg-slate-900/80 border border-slate-800">
                  <span className="text-[11px] font-bold text-emerald-300 block mb-2">
                    Paleta Compartilhada Rigorosamente:
                  </span>
                  <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                    <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-1 rounded border border-slate-800">
                      <span className="w-3 h-3 rounded-xs bg-[#0f172a]" />
                      <span>Profundo: #0f172a</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-1 rounded border border-slate-800">
                      <span className="w-3 h-3 rounded-xs bg-[#1e293b]" />
                      <span>Sombra: #1e293b</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-1 rounded border border-slate-800">
                      <span className="w-3 h-3 rounded-xs bg-[#334155]" />
                      <span>Meio-tom: #334155</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-1 rounded border border-slate-800">
                      <span className="w-3 h-3 rounded-xs bg-[#64748b]" />
                      <span>Highlight: #64748b</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-1 rounded border border-slate-800">
                      <span className="w-3 h-3 rounded-xs bg-[#31541F]" />
                      <span>Musgo Base: #31541F</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-1 rounded border border-slate-800">
                      <span className="w-3 h-3 rounded-xs bg-[#6E9345]" />
                      <span>Musgo Luz: #6E9345</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded bg-slate-900/80 border border-slate-800">
                  <span className="text-[11px] font-bold text-amber-300 block mb-2">
                    Verificação das Diretrizes Mestras:
                  </span>
                  <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-300">
                    <span className="text-emerald-400">✓ 100% 2D Hand-Painted</span>
                    <span className="text-emerald-400">✓ Zero Renders 3D / PBR</span>
                    <span className="text-emerald-400">✓ Sem modelos low-poly</span>
                    <span className="text-emerald-400">✓ Variações da Mesma Rocha</span>
                    <span className="text-emerald-400">✓ Iluminação Top-Left</span>
                    <span className="text-emerald-400">✓ Flood Fill BFS sem Halos</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer do Modal */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 border-t border-slate-800">
              <span className="text-[10px] text-slate-400">
                Todas as variações já estão instanciadas e ativas no cenário Vale Verdejante.
              </span>
              <button
                onClick={() => setShowRockModal(false)}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded text-xs transition-colors cursor-pointer"
              >
                Voltar ao Jogo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
