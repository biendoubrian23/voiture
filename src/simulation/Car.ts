import { CONFIG, Vector2, vec2, LineSegment } from './config';
import { Sensor } from './Sensor';
import { NeuralNetwork } from '../ai/NeuralNetwork';
import { Genotype } from '../ai/Genotype';

/**
 * Car - A vehicle controlled by a neural network
 */
export class Car {
    // Position and physics
    public position: Vector2;
    public velocity: Vector2 = { x: 0, y: 0 };
    public angle: number;
    public speed: number = 0;

    // State
    public isAlive: boolean = true;
    public currentCheckpoint: number = 0;
    public timeSinceCheckpoint: number = 0;
    public fitness: number = 0;

    // AI
    public brain: NeuralNetwork;
    public genotype: Genotype;
    public sensors: Sensor[] = [];

    // Visualization
    public isBest: boolean = false;
    public color: string = '#4ade80'; // Default green

    constructor(startPosition: Vector2, startAngle: number, genotype: Genotype) {
        this.position = { ...startPosition };
        this.angle = startAngle;
        this.genotype = genotype;

        // Create neural network from genotype
        this.brain = new NeuralNetwork(CONFIG.NN_TOPOLOGY);
        this.brain.setWeights(genotype.parameters);

        // Create sensors
        const angleStep = CONFIG.SENSOR_SPREAD / (CONFIG.SENSOR_COUNT - 1);
        const startSensorAngle = -CONFIG.SENSOR_SPREAD / 2;
        for (let i = 0; i < CONFIG.SENSOR_COUNT; i++) {
            this.sensors.push(new Sensor(startSensorAngle + angleStep * i));
        }
    }

    /**
     * Update car physics and AI
     */
    update(dt: number, walls: LineSegment[]): void {
        if (!this.isAlive) return;

        // Update sensors
        for (const sensor of this.sensors) {
            sensor.cast(this.position, this.angle, walls);
        }

        // Get neural network inputs from sensors
        const inputs = this.sensors.map(s => s.output);

        // Process through brain
        const outputs = this.brain.processInputs(inputs);

        // Apply outputs: [0] = acceleration/brake, [1] = steering
        const acceleration = outputs[0] * 2 - 1; // Map 0-1 to -1 to 1
        const steering = outputs[1] * 2 - 1; // Map 0-1 to -1 to 1

        // Update physics
        this.speed += acceleration * CONFIG.ACCELERATION;
        this.speed = Math.max(-CONFIG.MAX_SPEED * 0.3, Math.min(CONFIG.MAX_SPEED, this.speed));
        this.speed *= CONFIG.FRICTION;

        this.angle += steering * CONFIG.ROTATION_SPEED * Math.sign(this.speed);

        // Update position
        const direction = vec2.rotate({ x: 1, y: 0 }, this.angle);
        this.velocity = vec2.scale(direction, this.speed);
        this.position = vec2.add(this.position, this.velocity);

        // Update time since last checkpoint
        this.timeSinceCheckpoint += dt;
    }

    /**
     * Check if car should die
     */
    checkDeath(walls: LineSegment[]): boolean {
        if (!this.isAlive) return true;

        // Check wall collision (using car corners)
        const halfWidth = CONFIG.CAR_WIDTH / 2;
        const halfHeight = CONFIG.CAR_HEIGHT / 2;
        const corners = [
            { x: halfWidth, y: halfHeight },
            { x: halfWidth, y: -halfHeight },
            { x: -halfWidth, y: halfHeight },
            { x: -halfWidth, y: -halfHeight },
        ];

        for (const corner of corners) {
            const rotated = vec2.rotate(corner, this.angle);
            const worldPos = vec2.add(this.position, rotated);

            // Check distance to each wall
            for (const wall of walls) {
                const dist = this.distanceToLine(worldPos, wall);
                if (dist < 2) {
                    this.die();
                    return true;
                }
            }
        }

        // Check timeout
        if (this.timeSinceCheckpoint > CONFIG.MAX_CHECKPOINT_TIME) {
            this.die();
            return true;
        }

        return false;
    }

    /**
     * Distance from point to line segment
     */
    private distanceToLine(point: Vector2, line: LineSegment): number {
        const { start, end } = line;
        const lineVec = vec2.sub(end, start);
        const pointVec = vec2.sub(point, start);
        const lineLen = vec2.length(lineVec);

        if (lineLen === 0) return vec2.distance(point, start);

        const t = Math.max(0, Math.min(1, vec2.dot(pointVec, lineVec) / (lineLen * lineLen)));
        const projection = vec2.add(start, vec2.scale(lineVec, t));
        return vec2.distance(point, projection);
    }

    /**
     * Called when checkpoint is captured
     */
    captureCheckpoint(): void {
        this.currentCheckpoint++;
        this.timeSinceCheckpoint = 0;
    }

    /**
     * Kill the car
     */
    die(): void {
        this.isAlive = false;
        this.genotype.evaluation = this.fitness;
    }

    /**
     * Reset car to starting position
     */
    reset(startPosition: Vector2, startAngle: number): void {
        this.position = { ...startPosition };
        this.angle = startAngle;
        this.velocity = { x: 0, y: 0 };
        this.speed = 0;
        this.isAlive = true;
        this.currentCheckpoint = 0;
        this.timeSinceCheckpoint = 0;
        this.fitness = 0;
        this.isBest = false;
    }
}
