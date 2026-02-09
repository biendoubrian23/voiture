import { CONFIG } from './config';
import { Car } from './Car';
import { Track } from './Track';
import { GeneticAlgorithm, GAConfig } from '../ai/GeneticAlgorithm';
import { NeuralNetwork } from '../ai/NeuralNetwork';

/**
 * Simulation state for UI
 */
export interface SimulationState {
    generation: number;
    bestFitness: number;
    averageFitness: number;
    aliveCount: number;
    totalCount: number;
    isRunning: boolean;
    speedMultiplier: number;
}

/**
 * SimulationEngine - Main controller for the simulation
 */
export class SimulationEngine {
    public cars: Car[] = [];
    public track: Track;
    public ga: GeneticAlgorithm;
    public currentTrackIndex: number = 0;

    public isRunning: boolean = false;
    public speedMultiplier: number = 1;

    private animationId: number | null = null;
    private lastTime: number = 0;
    private onStateChange?: (state: SimulationState) => void;

    constructor(trackIndex: number = 0) {
        this.currentTrackIndex = trackIndex;
        this.track = new Track(trackIndex);

        // Calculate weight count from topology
        const tempNN = new NeuralNetwork(CONFIG.NN_TOPOLOGY);

        const gaConfig: Partial<GAConfig> = {
            populationSize: CONFIG.POPULATION_SIZE,
            parameterCount: tempNN.weightCount,
            crossoverRate: CONFIG.CROSSOVER_RATE,
            mutationRate: CONFIG.MUTATION_RATE,
            mutationAmount: CONFIG.MUTATION_AMOUNT,
            elitismCount: CONFIG.ELITISM_COUNT,
        };

        this.ga = new GeneticAlgorithm(gaConfig);
        this.createCars();
    }

    /**
     * Set callback for state changes
     */
    setOnStateChange(callback: (state: SimulationState) => void): void {
        this.onStateChange = callback;
    }

    /**
     * Change the track
     */
    changeTrack(trackIndex: number): void {
        this.currentTrackIndex = trackIndex;
        this.track = new Track(trackIndex);
        this.ga.restart();
        this.createCars();
        this.notifyStateChange();
    }

    /**
     * Set a custom track from a path drawn by the user
     */
    setCustomTrack(path: { x: number; y: number }[]): void {
        this.currentTrackIndex = -1; // Custom track indicator
        this.track = Track.fromCustomPath(path);
        this.ga.restart();
        this.createCars();
        this.notifyStateChange();
    }

    /**
     * Create cars from current population
     */
    private createCars(): void {
        this.cars = [];
        for (const genotype of this.ga.population) {
            const car = new Car(
                this.track.startPosition,
                this.track.startAngle,
                genotype
            );
            this.cars.push(car);
        }
        this.updateBestCar();
    }

    /**
     * Start the simulation
     */
    start(): void {
        if (this.isRunning) return;
        this.isRunning = true;
        this.lastTime = performance.now();
        this.loop();
    }

    /**
     * Pause the simulation
     */
    pause(): void {
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    /**
     * Toggle pause/play
     */
    toggle(): void {
        if (this.isRunning) {
            this.pause();
        } else {
            this.start();
        }
    }

    /**
     * Reset simulation
     */
    reset(): void {
        this.pause();
        this.ga.restart();
        this.createCars();
        this.notifyStateChange();
    }

    /**
     * Set speed multiplier
     */
    setSpeed(multiplier: number): void {
        this.speedMultiplier = Math.max(1, Math.min(50, multiplier));
    }

    /**
     * Main simulation loop
     */
    private loop = (): void => {
        if (!this.isRunning) return;

        const now = performance.now();
        const dt = Math.min(now - this.lastTime, 100); // Cap delta time
        this.lastTime = now;

        // Run multiple updates per frame for speed multiplier
        for (let i = 0; i < this.speedMultiplier; i++) {
            this.update(CONFIG.TIME_STEP);
        }

        this.notifyStateChange();
        this.animationId = requestAnimationFrame(this.loop);
    };

    /**
     * Update simulation state
     */
    private update(dt: number): void {
        let aliveCount = 0;

        for (const car of this.cars) {
            if (!car.isAlive) continue;

            // Update car physics and AI
            car.update(dt, this.track.walls);

            // Update fitness from track progress
            const { progress, newCheckpoint } = this.track.getProgress(
                car.position,
                car.currentCheckpoint
            );

            if (newCheckpoint > car.currentCheckpoint) {
                car.captureCheckpoint();
            }
            car.fitness = progress;

            // Check death conditions
            car.checkDeath(this.track.walls);

            if (car.isAlive) aliveCount++;
        }

        // Update best car visualization
        this.updateBestCar();

        // If all cars dead, evolve to next generation
        if (aliveCount === 0) {
            this.evolve();
        }
    }

    /**
     * Find and mark the best car
     */
    private updateBestCar(): void {
        let bestCar: Car | null = null;
        let bestFitness = -1;

        for (const car of this.cars) {
            car.isBest = false;
            if (car.isAlive && car.fitness > bestFitness) {
                bestFitness = car.fitness;
                bestCar = car;
            }
        }

        // If no alive cars, find the one with best fitness
        if (!bestCar) {
            for (const car of this.cars) {
                if (car.fitness > bestFitness) {
                    bestFitness = car.fitness;
                    bestCar = car;
                }
            }
        }

        if (bestCar) {
            bestCar.isBest = true;
        }
    }

    /**
     * Evolve to next generation
     */
    private evolve(): void {
        // Sync fitness to genotypes
        for (const car of this.cars) {
            car.genotype.evaluation = car.fitness;
        }

        // Run genetic algorithm
        this.ga.evolve();

        // Create new cars
        this.createCars();
    }

    /**
     * Get current state for UI
     */
    getState(): SimulationState {
        let aliveCount = 0;
        let totalFitness = 0;
        let bestFitness = 0;

        for (const car of this.cars) {
            if (car.isAlive) aliveCount++;
            totalFitness += car.fitness;
            if (car.fitness > bestFitness) bestFitness = car.fitness;
        }

        return {
            generation: this.ga.generationCount,
            bestFitness: Math.round(bestFitness * 100),
            averageFitness: Math.round((totalFitness / this.cars.length) * 100),
            aliveCount,
            totalCount: this.cars.length,
            isRunning: this.isRunning,
            speedMultiplier: this.speedMultiplier,
        };
    }

    /**
     * Notify UI of state change
     */
    private notifyStateChange(): void {
        if (this.onStateChange) {
            this.onStateChange(this.getState());
        }
    }

    /**
     * Get the best car (for neural network visualization)
     */
    getBestCar(): Car | null {
        return this.cars.find(c => c.isBest) || null;
    }

    /**
     * Save the best genotypes (top performers) for later use
     * Returns a serializable array of parameter arrays
     */
    saveBestGenotypes(count: number = 10): number[][] {
        // Sort cars by fitness
        const sortedCars = [...this.cars].sort((a, b) => b.fitness - a.fitness);

        // Get top performers' genotypes
        const bestGenotypes: number[][] = [];
        for (let i = 0; i < Math.min(count, sortedCars.length); i++) {
            bestGenotypes.push([...sortedCars[i].genotype.parameters]);
        }

        return bestGenotypes;
    }

    /**
     * Load saved genotypes into the current population
     * This replaces the current population with the saved ones
     */
    loadGenotypes(savedGenotypes: number[][]): void {
        // Import Genotype
        const { Genotype } = require('../ai/Genotype');

        // Clear current population
        this.ga.population = [];

        // Create genotypes from saved parameters
        for (const params of savedGenotypes) {
            const genotype = new Genotype(params.length);
            genotype.parameters = [...params];
            this.ga.population.push(genotype);
        }

        // Fill remaining population with mutations of the best
        const targetSize = CONFIG.POPULATION_SIZE;
        while (this.ga.population.length < targetSize) {
            // Clone a random saved genotype and mutate it slightly
            const randomIndex = Math.floor(Math.random() * savedGenotypes.length);
            const genotype = new Genotype(savedGenotypes[0].length);
            genotype.parameters = [...savedGenotypes[randomIndex]];

            // Apply small mutation
            for (let i = 0; i < genotype.parameters.length; i++) {
                if (Math.random() < 0.1) {
                    genotype.parameters[i] += (Math.random() * 2 - 1) * 0.2;
                }
            }

            this.ga.population.push(genotype);
        }

        // Reset generation count but keep learned weights
        this.ga.generationCount = 1;

        // Create cars with loaded genotypes
        this.createCars();
        this.notifyStateChange();
    }
}
