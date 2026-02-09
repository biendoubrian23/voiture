import { CONFIG, Vector2, LineSegment, vec2, lineIntersection } from './config';

/**
 * Sensor - A ray from the car detecting distance to walls
 */
export class Sensor {
    public output: number = 1; // Normalized distance (0 = touching, 1 = max range)
    public angle: number; // Relative angle to car
    public endpoint: Vector2 = { x: 0, y: 0 };

    constructor(angle: number) {
        this.angle = angle;
    }

    /**
     * Cast ray from position in direction and check against walls
     */
    cast(position: Vector2, carAngle: number, walls: LineSegment[]): void {
        const direction = vec2.rotate({ x: 1, y: 0 }, carAngle + this.angle);
        const rayEnd = vec2.add(position, vec2.scale(direction, CONFIG.SENSOR_LENGTH));

        const ray: LineSegment = { start: position, end: rayEnd };

        let closestDist = CONFIG.SENSOR_LENGTH;
        let closestPoint = rayEnd;

        for (const wall of walls) {
            const intersection = lineIntersection(ray, wall);
            if (intersection) {
                const dist = vec2.distance(position, intersection);
                if (dist < closestDist) {
                    closestDist = dist;
                    closestPoint = intersection;
                }
            }
        }

        this.endpoint = closestPoint;
        this.output = closestDist / CONFIG.SENSOR_LENGTH; // Normalize to 0-1
    }
}
