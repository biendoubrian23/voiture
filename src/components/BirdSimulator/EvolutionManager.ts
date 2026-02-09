
import { PhysicsEngine, Point } from './PhysicsEngine';
import { Creature, DNA } from './Creature';

export class EvolutionManager {
    engine: PhysicsEngine;
    population: Creature[] = [];
    generation: number = 0;
    popSize: number = 100;
    globalBestFitness: number = 0;

    // Simulation state
    timer: number = 0;
    maxDuration: number = 800;
    isRunning: boolean = false;

    constructor(engine: PhysicsEngine) {
        this.engine = engine;
    }

    startEvolution() {
        this.generation = 0;
        this.globalBestFitness = 0;
        this.population = [];
        this.engine.reset();

        // Initial Symmetric Population
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
        const startY = 100; // Give them space

        this.population.forEach((creature, index) => {
            creature.fitness = 0;
            creature.isDead = false; // RESET DEAD STATUS

            // Random spread but centered
            const spawnX = startX + (Math.random() - 0.5) * 600;
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
            if (c.isDead) return;

            const points = (c as any).runtimePoints as Point[];
            // Safety Check
            if (!points || points.length === 0) {
                c.isDead = true;
                return;
            }

            let maxY = 0;
            let hitWall = false;

            points.forEach(p => {
                if (p.y > maxY) maxY = p.y;

                // WALL PENALTY CHECK
                if (p.x <= 0 || p.x >= this.engine.width) {
                    hitWall = true;
                }
            });

            if (hitWall) {
                // INSTANT DEATH
                c.isDead = true;
                c.fitness = Math.max(0, this.timer - 50);
            } else if (maxY >= this.engine.height - 10) {
                // Ground Hit
                c.isDead = true;
                if (c.fitness === 0) c.fitness = this.timer;
            } else {
                allDead = false;
                activeCount++;
                c.fitness = this.timer;
            }
        });

        if (allDead || this.timer >= this.maxDuration) {
            this.nextGeneration();
        }
    }

    nextGeneration() {
        this.population.sort((a, b) => b.fitness - a.fitness);

        const best = this.population[0];
        if (best.fitness > this.globalBestFitness) {
            this.globalBestFitness = best.fitness;
        }

        console.log(`Generation ${this.generation} Complete. Best Time: ${best.fitness}. Survivors Copied: 10`);

        const newPop: Creature[] = [];

        // ELITISM: Keep Top 10 (10% of 100)
        // These are the "Rewarded" parents who survive unchanged.
        for (let i = 0; i < 10; i++) {
            const elite = new Creature(JSON.parse(JSON.stringify(this.population[i].dna)));
            newPop.push(elite);
        }

        // REPRODUCTION: Fill the rest (90)
        // Parents are chosen via Tournament from the old population.
        // Better fitness = Higher chance to be picked.
        while (newPop.length < this.popSize) {
            const parent = this.tournamentSelect();
            const childDNA = JSON.parse(JSON.stringify(parent.dna));
            const child = new Creature(childDNA);
            child.mutate(0.1);
            newPop.push(child);
        }

        this.population = newPop;
        this.generation++;
        this.startGeneration();
    }

    tournamentSelect(): Creature {
        // High pressure: pick 6 random, take best.
        const size = 6;
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
