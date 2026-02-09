
'use client';

import React, { useRef, useEffect, useState } from 'react';
import { PhysicsEngine } from './PhysicsEngine';

interface SimulationViewerProps {
    engine: PhysicsEngine;
    width: number;
    height: number;
    title: string;
}

export const SimulationViewer: React.FC<SimulationViewerProps> = ({ engine, width, height, title }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number>(0);

    const draw = (ctx: CanvasRenderingContext2D) => {
        // Clear canvas
        ctx.fillStyle = '#1a1a1a'; // Dark background
        ctx.fillRect(0, 0, width, height);

        // Draw sticks
        ctx.lineWidth = 2;
        for (const s of engine.sticks) {
            ctx.beginPath();
            ctx.strokeStyle = s.color;
            ctx.lineWidth = s.width;
            ctx.moveTo(s.p0.x, s.p0.y);
            ctx.lineTo(s.p1.x, s.p1.y);
            ctx.stroke();
        }

        // Draw points
        for (const p of engine.points) {
            ctx.beginPath();
            ctx.fillStyle = '#ff0055'; // Vibrant point color
            ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
            ctx.fill();
        }
    };

    const animate = () => {
        engine.update();
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                draw(ctx);
            }
        }
        requestRef.current = requestAnimationFrame(animate);
    };

    useEffect(() => {
        requestRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(requestRef.current);
    }, [engine]);

    return (
        <div className="flex flex-col items-center gap-4 p-4 border rounded-xl bg-neutral-900 border-neutral-700 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-2">{title}</h2>
            <canvas
                ref={canvasRef}
                width={width}
                height={height}
                className="border border-neutral-600 rounded-lg shadow-inner bg-black"
            />
        </div>
    );
};
