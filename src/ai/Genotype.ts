/**
 * Genotype - Represents the DNA of an agent (neural network weights)
 */
export class Genotype {
    public parameters: number[];
    public evaluation: number = 0;
    public fitness: number = 0;

    constructor(parameterCount: number) {
        this.parameters = new Array(parameterCount).fill(0);
    }

    /**
     * Initialize with random values in range [min, max]
     */
    setRandomParameters(min: number = -1, max: number = 1): void {
        const range = max - min;
        for (let i = 0; i < this.parameters.length; i++) {
            this.parameters[i] = min + Math.random() * range;
        }
    }

    /**
     * Get a copy of parameters
     */
    getParameterCopy(): number[] {
        return [...this.parameters];
    }

    /**
     * Compare genotypes by fitness (for sorting, higher fitness first)
     */
    compareTo(other: Genotype): number {
        return other.fitness - this.fitness;
    }

    /**
     * Create a copy of this genotype
     */
    clone(): Genotype {
        const copy = new Genotype(this.parameters.length);
        copy.parameters = [...this.parameters];
        copy.evaluation = this.evaluation;
        copy.fitness = this.fitness;
        return copy;
    }

    /**
     * Generate a random genotype
     */
    static generateRandom(parameterCount: number, min: number = -1, max: number = 1): Genotype {
        const genotype = new Genotype(parameterCount);
        genotype.setRandomParameters(min, max);
        return genotype;
    }
}
