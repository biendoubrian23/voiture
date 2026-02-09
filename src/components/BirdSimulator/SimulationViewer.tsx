
'use client';

import React, { useRef, useEffect, useState } from 'react';
import { PhysicsEngine } from './PhysicsEngine';

interface SimulationViewerProps {
    engine: PhysicsEngine;
    width: number;
    height: number;
    title: string;
    showForces?: boolean;
    onUpdate?: () => void;
    speed?: number; // Simulation speed multiplier
}

export const SimulationViewer: React.FC<SimulationViewerProps> = ({
    engine,
    width,
    height,
    title,
    showForces = false,
    onUpdate,
    speed = 1
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number>(0);

    const drawArrow = (ctx: CanvasRenderingContext2D, fromX: number, fromY: number, toX: number, toY: number, color: string) => {
        const headlen = 5; // length of head in pixels
        const dx = toX - fromX;
        const dy = toY - fromY;
        const angle = Math.atan2(dy, dx);

        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.moveTo(fromX, fromY);
        ctx.lineTo(toX, toY);
        ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
        ctx.moveTo(toX, toY);
        ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
        ctx.stroke();
    };

    const draw = (ctx: CanvasRenderingContext2D) => {
        // Clear canvas
        ctx.fillStyle = '#1a1a1a'; // Dark background
        ctx.fillRect(0, 0, width, height);

        // Draw sticks
        ctx.lineWidth = 2;
        // Optimization: if speed is very high (>10), maybe simplify drawing or skip some frames?
        // But for <50 sticks it's fine. 
        // With 100 creatures * ~5 sticks = 500 lines. Canvas can handle 10k lines easily. 

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

        // Draw Forces if enabled
        if (showForces) {
            ctx.lineWidth = 1;
            const forceScale = 200; // Scale up for visibility

            for (const s of engine.sticks) {
                const mx = (s.p0.x + s.p1.x) / 2;
                const my = (s.p0.y + s.p1.y) / 2;

                // Lift (Green)
                if (Math.abs(s.liftForce.x) > 0.0001 || Math.abs(s.liftForce.y) > 0.0001) {
                    drawArrow(
                        ctx,
                        mx,
                        my,
                        mx + s.liftForce.x * forceScale,
                        my + s.liftForce.y * forceScale,
                        '#00ff00'
                    );
                }

                // Drag (Red)
                if (Math.abs(s.dragForce.x) > 0.0001 || Math.abs(s.dragForce.y) > 0.0001) {
                    drawArrow(
                        ctx,
                        mx,
                        my,
                        mx + s.dragForce.x * forceScale,
                        my + s.dragForce.y * forceScale,
                        '#ff0055'
                    );
                }
            }
        }
    };

    const animate = () => {
        // Run physics loop multiple times based on speed
        // If speed is 1, runs once. If 10, runs 10 times per frame.
        for (let i = 0; i < speed; i++) {
            engine.update();
            if (onUpdate) onUpdate();
        }

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
        // Cancel previous loop when speed or engine changes
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
        requestRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(requestRef.current);
    }, [engine, speed, onUpdate]); // Re-bind if speed changes

    return (
        <div className="flex flex-col items-center gap-4 p-4 border rounded-xl bg-neutral-900 border-neutral-700 shadow-2xl">
            <div className="flex justify-between w-full items-center">
                <h2 className="text-xl font-bold text-white mb-2">{title}</h2>
                <div className="flex gap-4 items-center">
                    {speed > 1 && <span className="text-xs font-bold text-orange-400 animate-pulse">TURBO x{speed}</span>}
                    {showForces && <div className="text-xs flex gap-2">
                        <span className="text-green-500">Lift</span>
                        <span className="text-red-500">Drag</span>
                    </div>}
                </div>
            </div>
            <canvas
                ref={canvasRef}
                width={width}
                height={height}
                className="border border-neutral-600 rounded-lg shadow-inner bg-black"
            />
        </div>
    );
};
