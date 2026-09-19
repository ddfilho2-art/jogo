import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { criarConfiguracaoPhaser } from '../phaser/config';
import { eventBus } from '../phaser/eventBus';
import { DEBUG_MODE } from '../phaser/debug';
import { Shield, Sparkles, Coins, Compass, Gamepad2, Info } from 'lucide-react';
import renPortrait from '../assets/images/ren_pixel_art_1788915175087.jpg';

// =============================================================================
// ELDRIM: ECOS DO PASSADO - COMPONENTE PHASER GAME (CASCA REACT + MOTOR PHASER 3)
// =============================================================================

export const PhaserGame: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  // Estados reativos do HUD React (atualizados exclusivamente via eventBus)
  const [vida, setVida] = useState<number>(4);
  const [vidaMax] = useState<number>(4);
  const [energia, setEnergia] = useState<number>(100);
  const [arcanoInfo, setArcanoInfo] = useState<{ atual: number; max: number }>({ atual: 20, max: 20 });
  const [selos, setSelos] = useState<number>(45);
  const [regiaoNome, setRegiaoNome] = useState<string>('Vale Verdejante / Pedraverde');
  const [emPausa, setEmPausa] = useState<boolean>(false);
  const [ultimoEvento, setUltimoEvento] = useState<{
    tipo: string;
    detalhes: string;
    timestamp: number;
  }>({
    tipo: 'Sistema',
    detalhes: 'Aguardando inicialização do Phaser 3...',
    timestamp: Date.now(),
  });

  // 1. Ciclo de Vida do Phaser.Game dentro do useEffect (Requisito 1)
  useEffect(() => {
    if (!containerRef.current) return;

    // Instancia o jogo com a configuração 256x224 pixelArt
    const game = new Phaser.Game(criarConfiguracaoPhaser(containerRef.current));
    gameRef.current = game;

    // Cleanup: Destrói a instância do Phaser no unmount
    return () => {
      game.destroy(true);
      gameRef.current = null;
    };
  }, []);

  // 2. Ponte de Eventos Phaser -> React via EventEmitter (Requisito 7)
  useEffect(() => {
    const handleVidaMudou = (novaVida: number) => {
      setVida(novaVida);
      setUltimoEvento({
        tipo: 'vidaMudou',
        detalhes: `Vida atualizada para ${novaVida} fragmentos`,
        timestamp: Date.now(),
      });
    };

    const handleEnergiaMudou = (novaEnergia: number) => {
      setEnergia(novaEnergia);
      setUltimoEvento({
        tipo: 'energiaMudou',
        detalhes: `Fluxo Arcano: ${novaEnergia}%`,
        timestamp: Date.now(),
      });
    };

    const handleFluxoArcano = (dados: { atual: number; max: number; porcentagem: number }) => {
      setArcanoInfo({ atual: dados.atual, max: dados.max });
      setEnergia(dados.porcentagem);
    };

    const handleSelosMudou = (novosSelos: number) => {
      setSelos(novosSelos);
      setUltimoEvento({
        tipo: 'selosMudou',
        detalhes: `Selos: ${novosSelos}`,
        timestamp: Date.now(),
      });
    };

    const handleRegiaoCarregada = (dados: { regiao: string; nomeFormatado: string }) => {
      setRegiaoNome(dados.nomeFormatado);
      setUltimoEvento({
        tipo: 'regiaoCarregada',
        detalhes: `Região ativa: ${dados.nomeFormatado}`,
        timestamp: Date.now(),
      });
    };

    const handleTeclaPressionada = (dados: { tecla: string; posicaoHeroi: { x: number; y: number } }) => {
      setUltimoEvento({
        tipo: 'teclaPressionada',
        detalhes: `Tecla [${dados.tecla}] em (${dados.posicaoHeroi.x}, ${dados.posicaoHeroi.y})`,
        timestamp: Date.now(),
      });
    };

    const handleOverworldPronto = (dados: { regiao: string; status: string }) => {
      setUltimoEvento({
        tipo: 'overworldPronto',
        detalhes: `Overworld pronto [${dados.regiao}]`,
        timestamp: Date.now(),
      });
    };

    const handlePausaAlterada = (pausado: boolean) => {
      setEmPausa(pausado);
      setUltimoEvento({
        tipo: 'pausaAlterada',
        detalhes: pausado ? 'Jogo pausado' : 'Jogo despausado',
        timestamp: Date.now(),
      });
    };

    eventBus.on('vidaMudou', handleVidaMudou);
    eventBus.on('energiaMudou', handleEnergiaMudou);
    eventBus.on('fluxoArcano', handleFluxoArcano);
    eventBus.on('selosMudou', handleSelosMudou);
    eventBus.on('regiaoCarregada', handleRegiaoCarregada);
    eventBus.on('teclaPressionada', handleTeclaPressionada);
    eventBus.on('overworldPronto', handleOverworldPronto);
    eventBus.on('pausaAlterada', handlePausaAlterada);

    return () => {
      eventBus.off('vidaMudou', handleVidaMudou);
      eventBus.off('energiaMudou', handleEnergiaMudou);
      eventBus.off('fluxoArcano', handleFluxoArcano);
      eventBus.off('selosMudou', handleSelosMudou);
      eventBus.off('regiaoCarregada', handleRegiaoCarregada);
      eventBus.off('teclaPressionada', handleTeclaPressionada);
      eventBus.off('overworldPronto', handleOverworldPronto);
      eventBus.off('pausaAlterada', handlePausaAlterada);
    };
  }, []);

  // Troca de região para testar o parâmetro init(data) do OverworldScene
  const mudarRegiao = (chaveRegiao: string) => {
    if (!gameRef.current) return;
    const sceneManager = gameRef.current.scene;
    sceneManager.stop('PauseScene');
    sceneManager.start('OverworldScene', { regiao: chaveRegiao });
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center select-none overflow-hidden bg-[#07090e]">
      {/* 1. HUD SUPERIOR (Casca React posicionada sobre o jogo) */}
      <header className="absolute top-2 left-2 right-2 z-20 flex items-center justify-between pointer-events-none px-3 py-2 rounded bg-black/60 backdrop-blur-xs border border-white/10 text-xs font-mono text-slate-200">
        {/* Fragmentos de Vida (Losangos de Eldrim) */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 mr-1">
            <div className="w-6 h-6 rounded-xs overflow-hidden border border-amber-500/70 bg-stone-900 flex items-center justify-center shadow-xs">
              <img
                src={renPortrait}
                alt="Ren"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <span className="text-[11px] font-bold text-amber-200">REN</span>
          </div>

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

          {/* Barra de Fluxo Arcano (Regra 1: Conectado ao Phaser) */}
          <div className="ml-3 hidden sm:flex items-center gap-1.5" title="Fluxo Arcano de Eldrim">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <div className="flex flex-col">
              <div className="flex items-center justify-between text-[9px] font-mono text-cyan-300">
                <span className="font-semibold tracking-wider">ARCANO</span>
                <span>{Math.round(arcanoInfo.atual)}/{arcanoInfo.max}</span>
              </div>
              <div className="w-24 h-2 bg-slate-900 border border-cyan-700/80 rounded-xs overflow-hidden shadow-[0_0_8px_rgba(6,182,212,0.25)]">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 via-cyan-400 to-sky-200 transition-all duration-200"
                  style={{ width: `${energia}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Região Ativa e Selos */}
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-1.5 text-emerald-400">
            <Compass className="w-3.5 h-3.5" />
            <span className="text-[11px] font-bold">{regiaoNome}</span>
          </div>

          <div className="flex items-center gap-1 text-amber-300 font-bold">
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            <span>{selos}</span>
          </div>
        </div>
      </header>

      {/* 2. ÁREA DO CANVAS DO PHASER 3 (16:9 Widescreen Nativo 384x216) */}
      <div className="relative flex items-center justify-center w-full h-full p-2">
        <div
          id="phaser-game-container"
          ref={containerRef}
          className="relative flex items-center justify-center shadow-2xl rounded-sm overflow-hidden border border-amber-500/20 max-w-[960px] max-h-[540px] w-full aspect-video"
          style={{
            imageRendering: 'pixelated',
          }}
        />
      </div>

      {/* 3. PAINEL INFERIOR: GUIA DE CONTROLES OU DEBUG (DIRETIVA V8) */}
      <footer className="absolute bottom-2 left-2 right-2 z-20 flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 rounded bg-black/75 backdrop-blur-xs border border-white/10 text-[11px] font-mono text-slate-300">
        {DEBUG_MODE ? (
          <>
            {/* Feedback da Ponte EventEmitter */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-sky-400">
                <Gamepad2 className="w-3.5 h-3.5" />
                <span className="font-semibold">EventBus:</span>
              </div>
              <span className="px-1.5 py-0.5 rounded bg-sky-950/80 border border-sky-600/40 text-sky-200">
                {ultimoEvento.tipo}
              </span>
              <span className="text-slate-400 truncate max-w-[200px] sm:max-w-xs md:max-w-md">
                {ultimoEvento.detalhes}
              </span>
            </div>

            {/* Seleção rápida de Região e Teste de Dano/Ataque */}
            <div className="flex items-center gap-1.5">
              <button
                id="btn-testar-dano"
                onClick={() => eventBus.emit('simularDano')}
                className="px-2 py-0.5 rounded bg-rose-900/70 hover:bg-rose-800 border border-rose-600/60 text-[10px] text-rose-200 cursor-pointer font-semibold shadow-xs"
                title="Simular dano: animação hurt + partículas + screen shake + iframes"
              >
                Dano (Teste)
              </button>
              <span className="text-slate-500 text-[10px] hidden lg:inline">Região:</span>
              <button
                id="btn-regiao-verde"
                onClick={() => mudarRegiao('valeVerdejante')}
                className="px-2 py-0.5 rounded bg-emerald-900/60 hover:bg-emerald-800 border border-emerald-600/50 text-[10px] text-emerald-200 cursor-pointer"
              >
                Vale
              </button>
              <button
                id="btn-regiao-kaal"
                onClick={() => mudarRegiao('desertoKaal')}
                className="px-2 py-0.5 rounded bg-amber-900/60 hover:bg-amber-800 border border-amber-600/50 text-[10px] text-amber-200 cursor-pointer"
              >
                Kaal
              </button>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2 text-amber-200/80 font-medium">
            <span className="text-amber-400 font-bold">⚔️ ELDRIM: ECOS DO PASSADO</span>
            <span className="text-slate-500 text-[10px] hidden sm:inline">•</span>
            <span className="text-slate-400 text-[10px] hidden sm:inline">Aventura em Tempo Real</span>
          </div>
        )}

        {/* Teclas de Atalho */}
        <div className="flex items-center gap-2 text-[10px] text-slate-400 ml-auto">
          <span><b className="text-slate-200">WASD/Setas</b>: Mover</span>
          <span><b className="text-slate-200">Z</b>: Ataque (Segurar: Carregado)</span>
          <span><b className="text-slate-200">C/Espaço</b>: Esquiva</span>
          <span><b className="text-slate-200">ENTER</b>: Pausa</span>
        </div>
      </footer>
    </div>
  );
};
