'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import { SimulationEngine, CONFIG } from '@/simulation';
import { Car } from '@/simulation/Car';

interface SimulationCanvasProps {
    engine: SimulationEngine;
}

/**
 * Canvas component for rendering the simulation - WHITE THEME
 */
export function SimulationCanvas({ engine }: SimulationCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number | undefined>(undefined);

    const draw = useCallback((ctx: CanvasRenderingContext2D) => {
        const { track, cars } = engine;

        // Clear canvas with WHITE background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

        // Draw subtle grid
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.lineWidth = 1;
        for (let x = 0; x < CONFIG.CANVAS_WIDTH; x += 50) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, CONFIG.CANVAS_HEIGHT);
            ctx.stroke();
        }
        for (let y = 0; y < CONFIG.CANVAS_HEIGHT; y += 50) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(CONFIG.CANVAS_WIDTH, y);
            ctx.stroke();
        }

        // Draw checkpoints (subtle)
        ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
        for (const checkpoint of track.checkpoints) {
            ctx.beginPath();
            ctx.arc(checkpoint.position.x, checkpoint.position.y, checkpoint.radius * 0.3, 0, Math.PI * 2);
            ctx.fill();
        }

        // Draw track walls - GRAY like the Unity version
        ctx.strokeStyle = '#6b7280';
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        for (const wall of track.walls) {
            ctx.beginPath();
            ctx.moveTo(wall.start.x, wall.start.y);
            ctx.lineTo(wall.end.x, wall.end.y);
            ctx.stroke();
        }

        // Draw cars (dead ones first, then alive, best last)
        const sortedCars = [...cars].sort((a, b) => {
            if (a.isBest) return 1;
            if (b.isBest) return -1;
            if (a.isAlive && !b.isAlive) return 1;
            if (!a.isAlive && b.isAlive) return -1;
            return 0;
        });

        for (const car of sortedCars) {
            drawCar(ctx, car);
        }
    }, [engine]);

    const drawCar = (ctx: CanvasRenderingContext2D, car: Car) => {
        ctx.save();
        ctx.translate(car.position.x, car.position.y);
        ctx.rotate(car.angle);

        const halfWidth = CONFIG.CAR_WIDTH / 2;
        const halfHeight = CONFIG.CAR_HEIGHT / 2;

        // Draw sensors for best car only
        if (car.isBest && car.isAlive) {
            ctx.strokeStyle = 'rgba(59, 130, 246, 0.5)';
            ctx.lineWidth = 1;
            for (const sensor of car.sensors) {
                ctx.beginPath();
                ctx.moveTo(0, 0);
                const localEnd = {
                    x: (sensor.endpoint.x - car.position.x) * Math.cos(-car.angle) -
                        (sensor.endpoint.y - car.position.y) * Math.sin(-car.angle),
                    y: (sensor.endpoint.x - car.position.x) * Math.sin(-car.angle) +
                        (sensor.endpoint.y - car.position.y) * Math.cos(-car.angle),
                };
                ctx.lineTo(localEnd.x, localEnd.y);
                ctx.stroke();

                // Draw sensor endpoint - X marker like Unity
                ctx.strokeStyle = 'rgba(59, 130, 246, 0.8)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(localEnd.x - 4, localEnd.y - 4);
                ctx.lineTo(localEnd.x + 4, localEnd.y + 4);
                ctx.moveTo(localEnd.x + 4, localEnd.y - 4);
                ctx.lineTo(localEnd.x - 4, localEnd.y + 4);
                ctx.stroke();
            }
        }

        // Car body - GREEN like Unity
        if (car.isBest) {
            ctx.fillStyle = '#22c55e'; // Bright green for best
        } else if (car.isAlive) {
            ctx.fillStyle = '#22c55e'; // Green for alive
        } else {
            ctx.fillStyle = '#ef4444'; // Red for dead
        }

        // Draw car rectangle
        ctx.beginPath();
        ctx.rect(-halfWidth, -halfHeight, CONFIG.CAR_WIDTH, CONFIG.CAR_HEIGHT);
        ctx.fill();

        // Car outline
        ctx.strokeStyle = car.isBest ? '#000000' : 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = car.isBest ? 2 : 1;
        ctx.stroke();

        // Draw car details (dots like Unity)
        ctx.fillStyle = 'rgba(0, 150, 150, 0.8)';
        for (let i = 0; i < 4; i++) {
            const dotX = -halfWidth + 6 + (i % 2) * (CONFIG.CAR_WIDTH - 12);
            const dotY = -halfHeight + 4 + Math.floor(i / 2) * (CONFIG.CAR_HEIGHT - 8);
            ctx.beginPath();
            ctx.arc(dotX, dotY, 2, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const render = () => {
            draw(ctx);
            animationRef.current = requestAnimationFrame(render);
        };

        render();

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [draw]);

    return (
        <canvas
            ref={canvasRef}
            width={CONFIG.CANVAS_WIDTH}
            height={CONFIG.CANVAS_HEIGHT}
            className="rounded-xl border border-gray-200 shadow-lg"
            style={{ maxWidth: '100%', height: 'auto' }}
        />
    );
}
