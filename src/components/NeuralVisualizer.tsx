'use client';

import React from 'react';
import { Car } from '@/simulation/Car';
import { CONFIG } from '@/simulation/config';

interface NeuralVisualizerProps {
    car: Car | null;
}

export function NeuralVisualizer({ car }: NeuralVisualizerProps) {
    if (!car) {
        return (
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 h-full flex items-center justify-center">
                <span className="text-gray-400">No car selected</span>
            </div>
        );
    }

    const topology = CONFIG.NN_TOPOLOGY;
    const network = car.brain;

    // Canvas dimensions
    const width = 280;
    const height = 250;
    const padding = 30;

    // Calculate positions for each neuron
    const neurons: { x: number; y: number; layer: number; index: number; value: number }[] = [];
    const layerSpacing = (width - padding * 2) / (topology.length - 1);

    for (let l = 0; l < topology.length; l++) {
        const layerSize = topology[l];
        const layerHeight = height - padding * 2;
        const neuronSpacing = layerHeight / (layerSize + 1);

        for (let n = 0; n < layerSize; n++) {
            neurons.push({
                x: padding + l * layerSpacing,
                y: padding + (n + 1) * neuronSpacing,
                layer: l,
                index: n,
                value: l === 0 ? car.sensors[n]?.output ?? 0 : 0.5,
            });
        }
    }

    // Get weights for connections
    const connections: { from: number; to: number; weight: number }[] = [];
    let neuronOffset = 0;

    for (let l = 0; l < network.layers.length; l++) {
        const layer = network.layers[l];
        const fromNeurons = topology[l];
        const toNeurons = topology[l + 1];
        const fromOffset = neuronOffset;
        const toOffset = neuronOffset + fromNeurons;

        for (let i = 0; i < fromNeurons; i++) {
            for (let j = 0; j < toNeurons; j++) {
                connections.push({
                    from: fromOffset + i,
                    to: toOffset + j,
                    weight: layer.weights[i]?.[j] ?? 0,
                });
            }
        }

        neuronOffset += fromNeurons;
    }

    return (
        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                Neural Network
            </h3>
            <svg width={width} height={height} className="mx-auto">
                {/* Connections */}
                {connections.map((conn, i) => {
                    const from = neurons[conn.from];
                    const to = neurons[conn.to];
                    if (!from || !to) return null;

                    const weight = conn.weight;
                    const absWeight = Math.min(Math.abs(weight), 2);
                    const strokeWidth = 0.5 + absWeight * 1.5;
                    const color = weight >= 0 ? '#22c55e' : '#ef4444';
                    const opacity = 0.3 + absWeight * 0.3;

                    return (
                        <line
                            key={i}
                            x1={from.x}
                            y1={from.y}
                            x2={to.x}
                            y2={to.y}
                            stroke={color}
                            strokeWidth={strokeWidth}
                            opacity={opacity}
                        />
                    );
                })}

                {/* Neurons */}
                {neurons.map((neuron, i) => {
                    const isInput = neuron.layer === 0;
                    const isOutput = neuron.layer === topology.length - 1;
                    const radius = isInput || isOutput ? 10 : 8;

                    return (
                        <g key={i}>
                            <circle
                                cx={neuron.x}
                                cy={neuron.y}
                                r={radius}
                                fill="#3b82f6"
                                stroke="#1d4ed8"
                                strokeWidth={1}
                            />
                            {isInput && (
                                <text
                                    x={neuron.x - 20}
                                    y={neuron.y + 4}
                                    fontSize={8}
                                    fill="#6b7280"
                                    textAnchor="end"
                                >
                                    S{neuron.index + 1}
                                </text>
                            )}
                            {isOutput && (
                                <text
                                    x={neuron.x + 18}
                                    y={neuron.y + 4}
                                    fontSize={8}
                                    fill="#6b7280"
                                    textAnchor="start"
                                >
                                    {neuron.index === 0 ? 'Acc' : 'Str'}
                                </text>
                            )}
                        </g>
                    );
                })}
            </svg>

            {/* Output values */}
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 bg-white rounded-lg border border-gray-200">
                    <span className="text-gray-500">Acceleration:</span>
                    <span className="ml-2 text-blue-600 font-mono">
                        {car.brain.processInputs(car.sensors.map(s => s.output))[0]?.toFixed(2) ?? 'N/A'}
                    </span>
                </div>
                <div className="p-2 bg-white rounded-lg border border-gray-200">
                    <span className="text-gray-500">Steering:</span>
                    <span className="ml-2 text-blue-600 font-mono">
                        {car.brain.processInputs(car.sensors.map(s => s.output))[1]?.toFixed(2) ?? 'N/A'}
                    </span>
                </div>
            </div>
        </div>
    );
}
