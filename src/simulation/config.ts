/**
 * Simulation configuration constants
 */
export const CONFIG = {
    // Canvas
    CANVAS_WIDTH: 1200,
    CANVAS_HEIGHT: 700,

    // Car physics
    CAR_WIDTH: 30,
    CAR_HEIGHT: 15,
    MAX_SPEED: 5,
    ACCELERATION: 0.15,
    FRICTION: 0.98,
    ROTATION_SPEED: 0.05,

    // Sensors (7 for better lateral perception)
    SENSOR_COUNT: 7,
    SENSOR_LENGTH: 150,
    SENSOR_SPREAD: Math.PI * 0.75, // 135 degrees total spread for wider vision

    // Neural Network topology (deeper network for complex decisions)
    NN_TOPOLOGY: [7, 8, 6, 2], // 7 inputs (sensors), 2 hidden layers, 2 outputs

    // Genetic Algorithm (larger population, more elitism)
    POPULATION_SIZE: 100,
    CROSSOVER_RATE: 0.6,
    MUTATION_RATE: 0.2,
    MUTATION_AMOUNT: 0.5,
    ELITISM_COUNT: 2,

    // Simulation
    MAX_CHECKPOINT_TIME: 5000, // ms before car dies if no progress
    TIME_STEP: 1000 / 60, // 60 FPS target
};

/**
 * 2D Vector helper
 */
export interface Vector2 {
    x: number;
    y: number;
}

export const vec2 = {
    create: (x: number = 0, y: number = 0): Vector2 => ({ x, y }),
    add: (a: Vector2, b: Vector2): Vector2 => ({ x: a.x + b.x, y: a.y + b.y }),
    sub: (a: Vector2, b: Vector2): Vector2 => ({ x: a.x - b.x, y: a.y - b.y }),
    scale: (v: Vector2, s: number): Vector2 => ({ x: v.x * s, y: v.y * s }),
    length: (v: Vector2): number => Math.sqrt(v.x * v.x + v.y * v.y),
    normalize: (v: Vector2): Vector2 => {
        const len = vec2.length(v);
        return len > 0 ? vec2.scale(v, 1 / len) : { x: 0, y: 0 };
    },
    rotate: (v: Vector2, angle: number): Vector2 => ({
        x: v.x * Math.cos(angle) - v.y * Math.sin(angle),
        y: v.x * Math.sin(angle) + v.y * Math.cos(angle),
    }),
    dot: (a: Vector2, b: Vector2): number => a.x * b.x + a.y * b.y,
    distance: (a: Vector2, b: Vector2): number => vec2.length(vec2.sub(b, a)),
};

/**
 * Line segment for walls and rays
 */
export interface LineSegment {
    start: Vector2;
    end: Vector2;
}

/**
 * Check intersection between two line segments
 * Returns intersection point or null
 */
export function lineIntersection(line1: LineSegment, line2: LineSegment): Vector2 | null {
    const x1 = line1.start.x, y1 = line1.start.y;
    const x2 = line1.end.x, y2 = line1.end.y;
    const x3 = line2.start.x, y3 = line2.start.y;
    const x4 = line2.end.x, y4 = line2.end.y;

    const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    if (Math.abs(denom) < 0.0001) return null;

    const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
    const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;

    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
        return {
            x: x1 + t * (x2 - x1),
            y: y1 + t * (y2 - y1),
        };
    }

    return null;
}
