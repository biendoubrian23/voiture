'use client';

import React from 'react';
import { SimulationState } from '@/simulation';

interface ControlPanelProps {
    state: SimulationState;
    onToggle: () => void;
    onReset: () => void;
    onSpeedChange: (speed: number) => void;
    onTrackChange: (trackIndex: number) => void;
    onEditTrack: () => void;
    onSaveBest: () => void;
    onLoadBest: () => void;
    hasSavedBrains: boolean;
    currentTrack: number;
    totalTracks: number;
}

export function ControlPanel({ state, onToggle, onReset, onSpeedChange, onTrackChange, onEditTrack, onSaveBest, onLoadBest, hasSavedBrains, currentTrack, totalTracks }: ControlPanelProps) {
    return (
        <div className="flex flex-wrap items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
            {/* Play/Pause Button */}
            <button
                onClick={onToggle}
                className={`
          px-6 py-3 rounded-lg font-semibold text-sm uppercase tracking-wide
          transition-all duration-200 flex items-center gap-2
          ${state.isRunning
                        ? 'bg-amber-100 text-amber-700 hover:bg-amber-200 border border-amber-300'
                        : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border border-emerald-300'
                    }
        `}
            >
                {state.isRunning ? (
                    <>
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <rect x="6" y="4" width="4" height="16" rx="1" />
                            <rect x="14" y="4" width="4" height="16" rx="1" />
                        </svg>
                        Pause
                    </>
                ) : (
                    <>
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <polygon points="5,3 19,12 5,21" />
                        </svg>
                        Start
                    </>
                )}
            </button>

            {/* Reset Button */}
            <button
                onClick={onReset}
                className="px-6 py-3 rounded-lg font-semibold text-sm uppercase tracking-wide
          bg-rose-100 text-rose-700 hover:bg-rose-200 border border-rose-300
          transition-all duration-200 flex items-center gap-2"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Reset
            </button>

            {/* Edit Track Button */}
            <button
                onClick={onEditTrack}
                className="px-6 py-3 rounded-lg font-semibold text-sm uppercase tracking-wide
          bg-purple-100 text-purple-700 hover:bg-purple-200 border border-purple-300
          transition-all duration-200 flex items-center gap-2"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                Edit
            </button>

            {/* Save Best Brains Button */}
            <button
                onClick={onSaveBest}
                className="px-4 py-3 rounded-lg font-semibold text-sm uppercase tracking-wide
          bg-amber-100 text-amber-700 hover:bg-amber-200 border border-amber-300
          transition-all duration-200 flex items-center gap-2"
                title="Sauvegarder les meilleurs cerveaux"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                Save
            </button>

            {/* Load Best Brains Button */}
            <button
                onClick={onLoadBest}
                disabled={!hasSavedBrains}
                className={`px-4 py-3 rounded-lg font-semibold text-sm uppercase tracking-wide
          transition-all duration-200 flex items-center gap-2
          ${hasSavedBrains
                        ? 'bg-cyan-100 text-cyan-700 hover:bg-cyan-200 border border-cyan-300'
                        : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                    }`}
                title="Charger les cerveaux sauvegardés"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Load
            </button>

            {/* Track Selector */}
            <div className="flex items-center gap-3 ml-4 px-4 py-2 bg-white rounded-lg border border-gray-200">
                <span className="text-xs text-gray-500 uppercase tracking-wide">Track</span>
                <div className="flex gap-1">
                    {Array.from({ length: totalTracks }, (_, i) => i + 1).map((track) => (
                        <button
                            key={track}
                            onClick={() => onTrackChange(track - 1)}
                            className={`
                px-3 py-1 rounded text-sm font-medium transition-all
                ${currentTrack === track - 1
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }
              `}
                        >
                            {track}
                        </button>
                    ))}
                </div>
            </div>

            {/* Speed Control */}
            <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-lg border border-gray-200">
                <span className="text-xs text-gray-500 uppercase tracking-wide">Speed</span>
                <div className="flex gap-1">
                    {[1, 2, 5, 10, 20, 50].map((speed) => (
                        <button
                            key={speed}
                            onClick={() => onSpeedChange(speed)}
                            className={`
                px-3 py-1 rounded text-sm font-medium transition-all
                ${state.speedMultiplier === speed
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }
              `}
                        >
                            {speed}x
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
