'use client';

import React, { useEffect, useState, useRef } from 'react';
import { PhysicsEngine } from '@/components/BirdSimulator/PhysicsEngine';
import { SimulationViewer } from '@/components/BirdSimulator/SimulationViewer';
import { EvolutionManager } from '@/components/BirdSimulator/EvolutionManager';

export default function BirdSimulationPage() {
    const [engine, setEngine] = useState<PhysicsEngine | null>(null);
    const [mode, setMode] = useState<'point' | 'line' | 'triangle' | 'box' | 'muscle' | 'creature' | 'air' | 'evolution'>('point');
    const [showForces, setShowForces] = useState<boolean>(true);
    const [airDensity, setAirDensity] = useState<number>(0.02);
    const [simSpeed, setSimSpeed] = useState<number>(1);

    // Evolution State
    const [evoManager, setEvoManager] = useState<EvolutionManager | null>(null);
    const [gen, setGen] = useState(0);
    const [bestFit, setBestFit] = useState(0);
    const [popSize, setPopSize] = useState(0);
    const evoRef = useRef<EvolutionManager | null>(null); // Ref to access inside closures if needed

    useEffect(() => {
        const newEngine = new PhysicsEngine(800, 500);
        // Start with a single point falling
        newEngine.addPoint(400, 100);
        setEngine(newEngine);
    }, []);

    // Update engine air density when state changes
    useEffect(() => {
        if (engine) {
            engine.airDensity = airDensity;
        }
    }, [airDensity, engine]);

    const resetSimulation = (newMode: 'point' | 'line' | 'triangle' | 'box' | 'muscle' | 'creature' | 'air' | 'evolution') => {
        if (!engine) return;
        setMode(newMode);
        engine.reset();
        engine.airDensity = airDensity;
        setSimSpeed(1); // Reset speed on mode change

        // Stop evolution if we switch away (or restart it)
        if (evoRef.current) {
            evoRef.current.stopEvolution();
            setEvoManager(null);
            evoRef.current = null;
        }

        const cx = engine.width / 2;
        const cy = 200;

        if (newMode === 'point') {
            engine.addPoint(cx, cy);
        } else if (newMode === 'line') {
            const p1 = engine.addPoint(cx - 50, cy);
            const p2 = engine.addPoint(cx + 50, cy);
            engine.addStick(p1, p2);
        } else if (newMode === 'triangle') {
            const p1 = engine.addPoint(cx, cy);
            const p2 = engine.addPoint(cx - 50, cy + 86);
            const p3 = engine.addPoint(cx + 50, cy + 86);
            engine.addStick(p1, p2);
            engine.addStick(p2, p3);
            engine.addStick(p3, p1);
        } else if (newMode === 'box') {
            const p1 = engine.addPoint(cx - 40, cy - 40);
            const p2 = engine.addPoint(cx + 40, cy - 40);
            const p3 = engine.addPoint(cx + 40, cy + 40);
            const p4 = engine.addPoint(cx - 40, cy + 40);
            engine.addStick(p1, p2);
            engine.addStick(p2, p3);
            engine.addStick(p3, p4);
            engine.addStick(p4, p1);
            engine.addStick(p1, p3);
        } else if (newMode === 'muscle') {
            const p1 = engine.addPoint(cx - 50, cy, true); // Pinned
            const p2 = engine.addPoint(cx + 50, cy);
            // Add a muscle
            const m = engine.addStick(p1, p2, true);
            m.frequency = 0.1;
            // Add a weight at the end
            engine.addPoint(cx + 50, cy + 50).pinned = false;
        } else if (newMode === 'creature') {
            const p1 = engine.addPoint(cx, cy);
            const p2 = engine.addPoint(cx - 60, cy + 80);
            const p3 = engine.addPoint(cx + 60, cy + 80);
            const p4 = engine.addPoint(cx, cy + 50);
            engine.addStick(p1, p2, true).phase = Math.random() * 10;
            engine.addStick(p2, p3, true).phase = Math.random() * 10;
            engine.addStick(p3, p1, true).phase = Math.random() * 10;
            engine.addStick(p1, p4, true).phase = Math.random() * 10;
            engine.addStick(p2, p4, true).phase = Math.random() * 10;
            engine.addStick(p3, p4, true).phase = Math.random() * 10;
        } else if (newMode === 'air') {
            const p1 = engine.addPoint(cx - 100, 100);
            const p2 = engine.addPoint(cx + 100, 80);
            engine.addStick(p1, p2);
            const p3 = engine.addPoint(cx - 100, 300);
            const p4 = engine.addPoint(cx + 100, 300);
            engine.addStick(p3, p4);
        } else if (newMode === 'evolution') {
            const manager = new EvolutionManager(engine);
            manager.startEvolution();
            setEvoManager(manager);
            setPopSize(manager.popSize);
            evoRef.current = manager;
        }
    };

    const handleUpdate = () => {
        if (mode === 'evolution' && evoRef.current) {
            evoRef.current.update();

            if (evoRef.current.timer % 10 === 0) {
                setGen(evoRef.current.generation);
                setBestFit(Math.floor(evoRef.current.globalBestFitness));
            }
        }
    };

    return (
        <div className="min-h-screen bg-black text-white p-8 font-sans">
            <header className="max-w-4xl mx-auto mb-12 text-center">
                <h1 className="text-5xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
                    Bird Evolution Simulator
                </h1>
                <p className="text-neutral-400 text-lg">
                    Phase 4: Diversity & Selection
                </p>
            </header>

            <main className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">

                {/* Control Panel */}
                <div className="md:col-span-1 space-y-6">
                    <div className="bg-neutral-900 p-6 rounded-2xl border border-neutral-800 shadow-lg">
                        <h3 className="text-xl font-bold mb-4 text-emerald-400">Controls</h3>

                        <div className="space-y-3">
                            <button onClick={() => resetSimulation('point')} className={`w-full p-2 text-sm rounded-lg font-semibold transition-all ${mode === 'point' ? 'bg-blue-600' : 'bg-neutral-800 hover:bg-neutral-700'}`}>1. The Point</button>
                            <button onClick={() => resetSimulation('line')} className={`w-full p-2 text-sm rounded-lg font-semibold transition-all ${mode === 'line' ? 'bg-blue-600' : 'bg-neutral-800 hover:bg-neutral-700'}`}>2. The Stick</button>
                            <button onClick={() => resetSimulation('triangle')} className={`w-full p-2 text-sm rounded-lg font-semibold transition-all ${mode === 'triangle' ? 'bg-blue-600' : 'bg-neutral-800 hover:bg-neutral-700'}`}>3. The Triangle</button>
                            <button onClick={() => resetSimulation('box')} className={`w-full p-2 text-sm rounded-lg font-semibold transition-all ${mode === 'box' ? 'bg-blue-600' : 'bg-neutral-800 hover:bg-neutral-700'}`}>4. The Box</button>
                            <div className="h-px bg-neutral-700 my-2"></div>
                            <button onClick={() => resetSimulation('muscle')} className={`w-full p-2 text-sm rounded-lg font-semibold transition-all ${mode === 'muscle' ? 'bg-emerald-600' : 'bg-neutral-800 hover:bg-neutral-700'}`}>5. SINGLE MUSCLE</button>
                            <button onClick={() => resetSimulation('creature')} className={`w-full p-2 text-sm rounded-lg font-semibold transition-all ${mode === 'creature' ? 'bg-purple-600' : 'bg-neutral-800 hover:bg-neutral-700'}`}>6. THE CREATURE</button>
                            <div className="h-px bg-neutral-700 my-2"></div>
                            <button onClick={() => resetSimulation('air')} className={`w-full p-2 text-sm rounded-lg font-semibold transition-all ${mode === 'air' ? 'bg-sky-500' : 'bg-neutral-800 hover:bg-neutral-700'}`}>7. THE AIR</button>
                            <button onClick={() => resetSimulation('evolution')} className={`w-full p-3 rounded-lg font-bold transition-all ${mode === 'evolution' ? 'bg-orange-500 text-white' : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'}`}>8. EVOLUTION (Gliders)</button>
                        </div>

                        {/* Speed Controls */}
                        {mode === 'evolution' && (
                            <div className="mt-6 pt-4 border-t border-neutral-800">
                                <h4 className="text-xs font-bold text-neutral-500 mb-2 uppercase tracking-wide">Simulation Speed</h4>
                                <div className="grid grid-cols-3 gap-2">
                                    {[1, 2, 5, 10, 20, 50].map((s) => (
                                        <button
                                            key={s}
                                            onClick={() => setSimSpeed(s)}
                                            className={`p-1 rounded text-xs font-mono font-bold transition-colors ${simSpeed === s ? 'bg-emerald-500 text-black' : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'}`}
                                        >
                                            x{s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Air Settings */}
                        <div className="mt-6 pt-4 border-t border-neutral-800 space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wide">Aerodynamics</h4>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => setShowForces(!showForces)} className={`w-8 h-4 rounded-full p-0.5 transition-colors ${showForces ? 'bg-emerald-500' : 'bg-neutral-700'}`}>
                                        <div className={`w-3 h-3 rounded-full bg-white transform transition-transform ${showForces ? 'translate-x-4' : 'translate-x-0'}`} />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <div className="flex justify-between text-xs">
                                    <label className="text-neutral-400">Air Density</label>
                                    <span className="text-emerald-400 font-mono">{airDensity.toFixed(3)}</span>
                                </div>
                                <input type="range" min="0" max="0.2" step="0.001" value={airDensity} onChange={(e) => setAirDensity(parseFloat(e.target.value))} className="w-full h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-emerald-500" />
                            </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-neutral-800">
                            {mode === 'evolution' ? (
                                <div className="space-y-1 text-center text-orange-400">
                                    <h3 className="text-3xl font-black">{gen}</h3>
                                    <p className="text-xs text-neutral-500 uppercase tracking-widest">GENERATION</p>
                                    <div className="py-2 border-y border-neutral-800 my-2">
                                        <p className="text-lg font-bold text-white">{bestFit}</p>
                                        <p className="text-xs text-neutral-500">BEST TIME (Frames)</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-emerald-400">Survivors: 10 / {popSize || 100}</p>
                                        <p className="text-xs text-neutral-600 italic mt-2">"Only the best spread their genes."</p>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-xs text-neutral-500 italic font-mono">
                                    System Ready.
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Simulation Display */}
                <div className="md:col-span-2">
                    {engine && (
                        <SimulationViewer
                            engine={engine}
                            width={800}
                            height={500}
                            title={`Mode: ${mode.toUpperCase()}`}
                            showForces={showForces}
                            onUpdate={handleUpdate}
                            speed={simSpeed}
                        />
                    )}
                </div>

            </main>
        </div>
    );
}
