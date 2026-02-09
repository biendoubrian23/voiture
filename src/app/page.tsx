'use client';

import React, { useEffect, useRef, useState } from 'react';
import { SimulationEngine, SimulationState } from '@/simulation';
import { SimulationCanvas, ControlPanel, StatsPanel, NeuralVisualizer, TrackEditor } from '@/components';
import { Car } from '@/simulation/Car';

interface Vector2 {
  x: number;
  y: number;
}

export default function Home() {
  const engineRef = useRef<SimulationEngine | null>(null);
  const [state, setState] = useState<SimulationState>({
    generation: 1,
    bestFitness: 0,
    averageFitness: 0,
    aliveCount: 0,
    totalCount: 0,
    isRunning: false,
    speedMultiplier: 1,
  });
  const [bestCar, setBestCar] = useState<Car | null>(null);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [customTracks, setCustomTracks] = useState<Vector2[][]>([]);

  // Total tracks = 4 default + custom tracks
  const totalTracks = 4 + customTracks.length;

  useEffect(() => {
    setIsClient(true);

    // Create simulation engine
    const engine = new SimulationEngine(0);
    engineRef.current = engine;

    // Set up state updates
    engine.setOnStateChange((newState) => {
      setState(newState);
      setBestCar(engine.getBestCar());
    });

    // Initial state
    setState(engine.getState());

    return () => {
      engine.pause();
    };
  }, []);

  const handleToggle = () => {
    engineRef.current?.toggle();
  };

  const handleReset = () => {
    engineRef.current?.reset();
  };

  const handleSpeedChange = (speed: number) => {
    engineRef.current?.setSpeed(speed);
  };

  const handleTrackChange = (trackIndex: number) => {
    setCurrentTrack(trackIndex);

    // Check if it's a custom track
    if (trackIndex >= 4) {
      const customIndex = trackIndex - 4;
      const customPath = customTracks[customIndex];
      engineRef.current?.setCustomTrack(customPath);
    } else {
      engineRef.current?.changeTrack(trackIndex);
    }
  };

  const handleEditTrack = () => {
    setIsEditorOpen(true);
    engineRef.current?.pause();
  };

  const handleCloseEditor = () => {
    setIsEditorOpen(false);
  };

  const handleSaveTrack = (path: Vector2[]) => {
    // Add to custom tracks
    setCustomTracks(prev => [...prev, path]);

    // Close editor
    setIsEditorOpen(false);

    // Switch to the new track
    const newTrackIndex = 4 + customTracks.length;
    setCurrentTrack(newTrackIndex);
    engineRef.current?.setCustomTrack(path);
  };

  // State for saved brain weights
  const [savedBrains, setSavedBrains] = useState<number[][] | null>(null);

  const handleSaveBest = () => {
    if (engineRef.current) {
      const brains = engineRef.current.saveBestGenotypes(10);
      setSavedBrains(brains);
      alert(`✅ Sauvegardé les 10 meilleurs cerveaux ! (Gen ${state.generation})`);
    }
  };

  const handleLoadBest = () => {
    if (engineRef.current && savedBrains) {
      engineRef.current.loadGenotypes(savedBrains);
      alert('✅ Cerveaux chargés ! Regardez comment ils performent sur ce nouveau circuit.');
    }
  };

  if (!isClient) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-600">Loading simulation...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-white text-gray-900">
      {/* Track Editor Modal */}
      <TrackEditor
        isOpen={isEditorOpen}
        onClose={handleCloseEditor}
        onSave={handleSaveTrack}
      />

      {/* Header */}
      <header className="py-6 px-8 border-b border-gray-200">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Neural Network Car Simulation
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Evolutionary AI learns to drive using genetic algorithms
            </p>
          </div>
          <a
            href="https://github.com/ArztSamuel/Applying_EANNs"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors flex items-center gap-2"
          >
            <span>Original Unity Project</span>
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
          </a>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Stats */}
        <div className="mb-6">
          <StatsPanel state={state} />
        </div>

        {/* Controls */}
        <div className="mb-6">
          <ControlPanel
            state={state}
            onToggle={handleToggle}
            onReset={handleReset}
            onSpeedChange={handleSpeedChange}
            onTrackChange={handleTrackChange}
            onEditTrack={handleEditTrack}
            onSaveBest={handleSaveBest}
            onLoadBest={handleLoadBest}
            hasSavedBrains={savedBrains !== null}
            currentTrack={currentTrack}
            totalTracks={totalTracks}
          />
        </div>

        {/* Simulation Area */}
        <div className="flex gap-6">
          {/* Canvas */}
          <div className="flex-1">
            {engineRef.current && (
              <SimulationCanvas engine={engineRef.current} />
            )}
          </div>

          {/* Neural Network Visualizer */}
          <div className="w-80 flex-shrink-0">
            <NeuralVisualizer car={bestCar} />

            {/* Legend */}
            <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                Legend
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded bg-emerald-500 border border-black"></div>
                  <span className="text-gray-600">Best / Alive Cars</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded bg-red-500"></div>
                  <span className="text-gray-600">Dead Cars</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-1 bg-gray-500 rounded"></div>
                  <span className="text-gray-600">Track Walls</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-0.5 bg-blue-500"></div>
                  <span className="text-gray-600">Sensors</span>
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                How It Works
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Each car has a neural network &quot;brain&quot; that takes 5 sensor readings as input
                and outputs acceleration and steering values. The best performers of each
                generation reproduce to create the next, gradually evolving better driving behavior.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

