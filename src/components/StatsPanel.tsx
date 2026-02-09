'use client';

import React from 'react';
import { SimulationState } from '@/simulation';

interface StatsPanelProps {
    state: SimulationState;
}

export function StatsPanel({ state }: StatsPanelProps) {
    return (
        <div className="grid grid-cols-4 gap-4">
            {/* Generation */}
            <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                <div className="text-xs text-purple-600 uppercase tracking-wide mb-1">Generation</div>
                <div className="text-3xl font-bold text-purple-900">{state.generation}</div>
            </div>

            {/* Best Fitness */}
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                <div className="text-xs text-amber-600 uppercase tracking-wide mb-1">Best Fitness</div>
                <div className="text-3xl font-bold text-amber-900">{state.bestFitness}%</div>
                <div className="mt-2 h-1.5 bg-amber-100 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-amber-500 transition-all duration-300"
                        style={{ width: `${state.bestFitness}%` }}
                    />
                </div>
            </div>

            {/* Average Fitness */}
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                <div className="text-xs text-blue-600 uppercase tracking-wide mb-1">Avg Fitness</div>
                <div className="text-3xl font-bold text-blue-900">{state.averageFitness}%</div>
                <div className="mt-2 h-1.5 bg-blue-100 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-blue-500 transition-all duration-300"
                        style={{ width: `${state.averageFitness}%` }}
                    />
                </div>
            </div>

            {/* Cars Alive */}
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                <div className="text-xs text-emerald-600 uppercase tracking-wide mb-1">Cars Alive</div>
                <div className="text-3xl font-bold text-emerald-900">
                    {state.aliveCount}
                    <span className="text-lg text-emerald-500">/{state.totalCount}</span>
                </div>
                <div className="mt-2 h-1.5 bg-emerald-100 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-emerald-500 transition-all duration-300"
                        style={{ width: `${(state.aliveCount / state.totalCount) * 100}%` }}
                    />
                </div>
            </div>
        </div>
    );
}
