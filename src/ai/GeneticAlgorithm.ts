import { Genotype } from './Genotype';

/**
 * GeneticAlgorithm - Handles evolution of a population
 */
export interface GAConfig {
    populationSize: number;
    parameterCount: number;
    crossoverRate: number;      // Probability of swapping each gene
    mutationRate: number;       // Probability of mutating each gene
    mutationAmount: number;     // Max amount to mutate by
    elitismCount: number;       // Number of top performers to keep unchanged
}

const DEFAULT_CONFIG: GAConfig = {
    populationSize: 30,
    parameterCount: 0,
    crossoverRate: 0.6,
    mutationRate: 0.3,
    mutationAmount: 0.5,
    elitismCount: 2
};

export class GeneticAlgorithm {
    public population: Genotype[];
    public config: GAConfig;
    public generationCount: number = 1;

    constructor(config: Partial<GAConfig>) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.population = [];
        this.initializePopulation();
    }

    /**
     * Create initial random population
     */
    private initializePopulation(): void {
        this.population = [];
        for (let i = 0; i < this.config.populationSize; i++) {
            this.population.push(Genotype.generateRandom(this.config.parameterCount, -1, 1));
        }
    }

    /**
     * Calculate fitness from evaluation scores
     */
    calculateFitness(): void {
        // Calculate average evaluation
        let totalEvaluation = 0;
        for (const genotype of this.population) {
            totalEvaluation += genotype.evaluation;
        }
        const avgEvaluation = totalEvaluation / this.population.length;

        // Fitness = evaluation / average (relative performance)
        for (const genotype of this.population) {
            genotype.fitness = avgEvaluation > 0 ? genotype.evaluation / avgEvaluation : 0;
        }

        // Sort by fitness (highest first)
        this.population.sort((a, b) => a.compareTo(b));
    }

    /**
     * Evolve to next generation
     */
    evolve(): void {
        this.calculateFitness();

        const newPopulation: Genotype[] = [];

        // ELITISM: Keep the best performers unchanged
        for (let i = 0; i < this.config.elitismCount && i < this.population.length; i++) {
            newPopulation.push(this.population[i].clone());
        }

        // SELECTION & CROSSOVER: Create rest of population
        while (newPopulation.length < this.config.populationSize) {
            // Tournament selection
            const parent1 = this.tournamentSelect();
            const parent2 = this.tournamentSelect();

            // Crossover
            const [child1, child2] = this.crossover(parent1, parent2);

            // Mutation
            this.mutate(child1);
            this.mutate(child2);

            newPopulation.push(child1);
            if (newPopulation.length < this.config.populationSize) {
                newPopulation.push(child2);
            }
        }

        this.population = newPopulation;
        this.generationCount++;

        // Reset evaluations for new generation
        for (const genotype of this.population) {
            genotype.evaluation = 0;
            genotype.fitness = 0;
        }
    }

    /**
     * Tournament selection - pick 3 random, return best
     */
    private tournamentSelect(): Genotype {
        const tournamentSize = 3;
        let best: Genotype | null = null;

        for (let i = 0; i < tournamentSize; i++) {
            const idx = Math.floor(Math.random() * this.population.length);
            const candidate = this.population[idx];
            if (!best || candidate.fitness > best.fitness) {
                best = candidate;
            }
        }

        return best!;
    }

    /**
     * Crossover - uniform crossover between two parents
     */
    private crossover(parent1: Genotype, parent2: Genotype): [Genotype, Genotype] {
        const child1 = new Genotype(parent1.parameters.length);
        const child2 = new Genotype(parent2.parameters.length);

        for (let i = 0; i < parent1.parameters.length; i++) {
            if (Math.random() < this.config.crossoverRate) {
                child1.parameters[i] = parent2.parameters[i];
                child2.parameters[i] = parent1.parameters[i];
            } else {
                child1.parameters[i] = parent1.parameters[i];
                child2.parameters[i] = parent2.parameters[i];
            }
        }

        return [child1, child2];
    }

    /**
     * Mutation - randomly perturb parameters
     */
    private mutate(genotype: Genotype): void {
        for (let i = 0; i < genotype.parameters.length; i++) {
            if (Math.random() < this.config.mutationRate) {
                const mutation = (Math.random() * 2 - 1) * this.config.mutationAmount;
                genotype.parameters[i] += mutation;
            }
        }
    }

    /**
     * Get the best genotype
     */
    getBest(): Genotype | null {
        return this.population.length > 0 ? this.population[0] : null;
    }

    /**
     * Restart with fresh population
     */
    restart(): void {
        this.generationCount = 1;
        this.initializePopulation();
    }
}
