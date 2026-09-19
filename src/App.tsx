/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { PlayCanvasGame } from './components/PlayCanvasGame';
import { PhaserGame } from './components/PhaserGame';

export default function App() {
  const [engineMode, setEngineMode] = useState<'playcanvas' | 'phaser'>('playcanvas');

  return (
    <main id="app-root" className="w-screen h-screen bg-[#07090e] flex flex-col items-center justify-center overflow-hidden relative">
      {engineMode === 'playcanvas' ? (
        <PlayCanvasGame onSwitchToPhaser={() => setEngineMode('phaser')} />
      ) : (
        <div className="relative w-full h-full">
          <button
            onClick={() => setEngineMode('playcanvas')}
            className="absolute top-2 right-2 z-30 px-3 py-1 bg-cyan-900/90 hover:bg-cyan-800 text-cyan-200 text-xs font-mono rounded border border-cyan-500/60 shadow-lg cursor-pointer transition-colors"
          >
            ⚡ Voltar para PlayCanvas Engine V2
          </button>
          <PhaserGame />
        </div>
      )}
    </main>
  );
}


