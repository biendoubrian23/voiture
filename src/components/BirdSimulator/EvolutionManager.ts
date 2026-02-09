
import { PhysicsEngine, Point } from './PhysicsEngine';
import { Creature, DNA } from './Creature';

export class EvolutionManager {
    engine: PhysicsEngine;
    population: Creature[] = [];
    generation: number = 0;
    popSize: number = 100; // Increased population size for more diversity
    globalBestFitness: number = 0;

    // Simulation state
    timer: number = 0;
    maxDuration: number = 800; // Frames (e.g. 13 seconds at 60fps) - longer for gliders
    isRunning: boolean = false;

    constructor(engine: PhysicsEngine) {
        this.engine = engine;
    }

    startEvolution() {
        this.generation = 0;
        this.globalBestFitness = 0;
        this.population = [];
        this.engine.reset();

        // Initial "Cambrian Explosion"
        for (let i = 0; i < this.popSize; i++) {
            this.population.push(new Creature());
        }

        this.isRunning = true;
        this.startGeneration();
    }

    stopEvolution() {
        this.isRunning = false;
        this.engine.reset();
    }

    startGeneration() {
        if (!this.isRunning) return;

        this.engine.reset();
        this.engine.airDensity = 0.05;
        this.timer = 0;

        // Spawn all creatures at top
        const startX = this.engine.width / 2;
        const startY = 50; // Higher up to allow more fall time

        this.population.forEach((creature, index) => {
            creature.fitness = 0;

            // Random spread across the screen width
            // This prevents them all from just stacking on top of each other
            const spawnX = startX + (Math.random() - 0.5) * 700;
            const spawnY = startY + (Math.random() - 0.5) * 50;

            // Spawn
            const points = creature.spawn(this.engine, spawnX, spawnY);
            (creature as any).runtimePoints = points;
        });
    }

    update() {
        if (!this.isRunning) return;

        this.timer++;

        let allDead = true;
        let activeCount = 0;

        this.population.forEach(c => {
            const points = (c as any).runtimePoints as Point[];
            if (!points || points.length === 0) return;

            // Check if hit ground
            let maxY = 0;
            points.forEach(p => {
                if (p.y > maxY) maxY = p.y;
            });

            if (maxY >= this.engine.height - 10) {
                // Dead (hit ground)
                if (c.fitness === 0) c.fitness = this.timer;
            } else {
                allDead = false;
                activeCount++;
                // Still alive
                c.fitness = this.timer;
            }
        });

        if (allDead || this.timer >= this.maxDuration) {
            this.nextGeneration();
        }
    }

    nextGeneration() {
        // 1. Sort by fitness (Descending)
        this.population.sort((a, b) => b.fitness - a.fitness);

        const best = this.population[0];
        if (best.fitness > this.globalBestFitness) {
            this.globalBestFitness = best.fitness;
        }

        // 2. Selection & Reproduction
        const newPop: Creature[] = [];

        // Elitism (Top 5 - Keep the winners)
        for (let i = 0; i < 5; i++) {
            const elite = new Creature(JSON.parse(JSON.stringify(this.population[i].dna)));
            newPop.push(elite);
        }

        // Fill rest
        while (newPop.length < this.popSize) {
            const parent = this.tournamentSelect();
            const childDNA = JSON.parse(JSON.stringify(parent.dna));
            const child = new Creature(childDNA);
            // High mutation rate initially to explore forms
            // In later generations, we might want to lower it, but constant pressure is good for simple sims
            child.mutate(0.15);
            newPop.push(child);
        }

        this.population = newPop;
        this.generation++;
        this.startGeneration();
    }

    tournamentSelect(): Creature {
        // Tournament size controls selection pressure
        // Larger size = stronger selection (fewer weak parents)
        const size = 5;
        let best: Creature | null = null;
        for (let i = 0; i < size; i++) {
            const ind = this.population[Math.floor(Math.random() * this.population.length)];
            if (!best || ind.fitness > best.fitness) {
                best = ind;
            }
        }
        return best!;
    }
}
