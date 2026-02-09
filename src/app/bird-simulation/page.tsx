
'use client';

import React, { useEffect, useState } from 'react';
import { PhysicsEngine } from '@/components/BirdSimulator/PhysicsEngine';
import { SimulationViewer } from '@/components/BirdSimulator/SimulationViewer';

export default function BirdSimulationPage() {
    const [engine, setEngine] = useState<PhysicsEngine | null>(null);
    const [mode, setMode] = useState<'point' | 'line' | 'triangle' | 'box'>('point');

    useEffect(() => {
        const newEngine = new PhysicsEngine(800, 500);
        // Start with a single point falling
        newEngine.addPoint(400, 100);
        setEngine(newEngine);
    }, []);

    const resetSimulation = (newMode: 'point' | 'line' | 'triangle' | 'box') => {
        if (!engine) return;
        setMode(newMode);
        engine.reset();

        const cx = engine.width / 2;
        const cy = 100;

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
            // Cross brace for stability
            engine.addStick(p1, p3);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white p-8 font-sans">
            <header className="max-w-4xl mx-auto mb-12 text-center">
                <h1 className="text-5xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
                    Bird Evolution Simulator
                </h1>
                <p className="text-neutral-400 text-lg">
                    Phase 1: The Physics Engine (Skeleton)
                </p>
            </header>

            <main className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">

                {/* Control Panel */}
                <div className="md:col-span-1 space-y-6">
                    <div className="bg-neutral-900 p-6 rounded-2xl border border-neutral-800 shadow-lg">
                        <h3 className="text-xl font-bold mb-4 text-emerald-400">Experiment Controls</h3>
                        <p className="text-sm text-neutral-400 mb-6">
                            Select a structure to see how the physics engine handles points and constraints.
                        </p>

                        <div className="space-y-3">
                            <button
                                onClick={() => resetSimulation('point')}
                                className={`w-full p-3 rounded-lg font-semibold transition-all ${mode === 'point' ? 'bg-blue-600 text-white' : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'}`}
                            >
                                1. The Point (Gravity)
                            </button>
                            <button
                                onClick={() => resetSimulation('line')}
                                className={`w-full p-3 rounded-lg font-semibold transition-all ${mode === 'line' ? 'bg-blue-600 text-white' : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'}`}
                            >
                                2. The Stick (Constraint)
                            </button>
                            <button
                                onClick={() => resetSimulation('triangle')}
                                className={`w-full p-3 rounded-lg font-semibold transition-all ${mode === 'triangle' ? 'bg-blue-600 text-white' : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'}`}
                            >
                                3. The Triangle (Rigid)
                            </button>
                            <button
                                onClick={() => resetSimulation('box')}
                                className={`w-full p-3 rounded-lg font-semibold transition-all ${mode === 'box' ? 'bg-blue-600 text-white' : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'}`}
                            >
                                4. The Box (Structure)
                            </button>
                        </div>

                        <div className="mt-8 pt-6 border-t border-neutral-800">
                            <p className="text-xs text-neutral-500 italic">
                                "Au commencement, il y avait le point. Il tombe (gravité). C'est nul."
                            </p>
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
                            title={`Simulation Mode: ${mode.toUpperCase()}`}
                        />
                    )}
                </div>

            </main>
        </div>
    );
}
