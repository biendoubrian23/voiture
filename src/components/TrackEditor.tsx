'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';

interface Vector2 {
    x: number;
    y: number;
}

interface TrackEditorProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (path: Vector2[]) => void;
    trackWidth?: number;
}

export function TrackEditor({ isOpen, onClose, onSave, trackWidth = 55 }: TrackEditorProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [points, setPoints] = useState<Vector2[]>([]);
    const [isDrawing, setIsDrawing] = useState(false);

    // Draw the canvas
    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear canvas
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw grid
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        for (let x = 0; x < canvas.width; x += 50) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }
        for (let y = 0; y < canvas.height; y += 50) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }

        if (points.length === 0) return;

        // Generate walls from center path
        const halfWidth = trackWidth / 2;
        const outer: Vector2[] = [];
        const inner: Vector2[] = [];

        for (let i = 0; i < points.length; i++) {
            const prev = points[Math.max(i - 1, 0)];
            const next = points[Math.min(i + 1, points.length - 1)];
            const curr = points[i];

            const dx = next.x - prev.x;
            const dy = next.y - prev.y;
            const len = Math.sqrt(dx * dx + dy * dy) || 1;
            const nx = -dy / len;
            const ny = dx / len;

            outer.push({ x: curr.x + nx * halfWidth, y: curr.y + ny * halfWidth });
            inner.push({ x: curr.x - nx * halfWidth, y: curr.y - ny * halfWidth });
        }

        // Draw track walls (filled)
        if (points.length >= 2) {
            ctx.fillStyle = 'rgba(100, 116, 139, 0.3)';
            ctx.beginPath();
            ctx.moveTo(outer[0].x, outer[0].y);
            for (const p of outer) {
                ctx.lineTo(p.x, p.y);
            }
            for (let i = inner.length - 1; i >= 0; i--) {
                ctx.lineTo(inner[i].x, inner[i].y);
            }
            ctx.closePath();
            ctx.fill();

            // Draw wall lines
            ctx.strokeStyle = '#475569';
            ctx.lineWidth = 3;

            ctx.beginPath();
            ctx.moveTo(outer[0].x, outer[0].y);
            for (const p of outer) {
                ctx.lineTo(p.x, p.y);
            }
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(inner[0].x, inner[0].y);
            for (const p of inner) {
                ctx.lineTo(p.x, p.y);
            }
            ctx.stroke();
        }

        // Draw center line
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (const p of points) {
            ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw points
        for (let i = 0; i < points.length; i++) {
            const p = points[i];
            ctx.beginPath();
            ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
            ctx.fillStyle = i === 0 ? '#22c55e' : '#3b82f6';
            ctx.fill();
            ctx.strokeStyle = '#1e40af';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Point number
            ctx.fillStyle = 'white';
            ctx.font = 'bold 10px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(String(i + 1), p.x, p.y);
        }

        // Draw start indicator
        if (points.length > 0) {
            ctx.fillStyle = '#22c55e';
            ctx.font = 'bold 12px sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText('START', points[0].x + 15, points[0].y);
        }
    }, [points, trackWidth]);

    // Redraw on points change
    useEffect(() => {
        draw();
    }, [draw]);

    // Handle canvas click
    const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        setPoints(prev => [...prev, { x, y }]);
        setIsDrawing(true);
    };

    // Undo last point
    const handleUndo = () => {
        setPoints(prev => prev.slice(0, -1));
    };

    // Clear all
    const handleClear = () => {
        setPoints([]);
        setIsDrawing(false);
    };

    // Save track
    const handleSave = () => {
        if (points.length < 3) {
            alert('Place au moins 3 points pour créer une piste !');
            return;
        }
        onSave(points);
        setPoints([]);
        setIsDrawing(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-[960px] w-full mx-4 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-b border-gray-200">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">🎨 Éditeur de Piste</h2>
                        <p className="text-sm text-gray-500">Clique pour placer les points du chemin central</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Canvas */}
                <div className="p-4 bg-gray-100">
                    <canvas
                        ref={canvasRef}
                        width={900}
                        height={500}
                        onClick={handleCanvasClick}
                        className="w-full bg-white rounded-lg shadow-inner cursor-crosshair border border-gray-300"
                    />
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-200">
                    <div className="flex gap-3">
                        <button
                            onClick={handleUndo}
                            disabled={points.length === 0}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                            </svg>
                            Annuler
                        </button>
                        <button
                            onClick={handleClear}
                            disabled={points.length === 0}
                            className="px-4 py-2 bg-rose-100 text-rose-700 rounded-lg font-medium hover:bg-rose-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Effacer tout
                        </button>
                    </div>

                    <div className="text-sm text-gray-500">
                        {points.length} point{points.length !== 1 ? 's' : ''} placé{points.length !== 1 ? 's' : ''}
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={points.length < 3}
                        className="px-6 py-2 bg-emerald-500 text-white rounded-lg font-semibold hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Sauvegarder
                    </button>
                </div>
            </div>
        </div>
    );
}
