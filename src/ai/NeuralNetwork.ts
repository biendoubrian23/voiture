import { NeuralLayer, ActivationFunction, softSign } from './NeuralLayer';

/**
 * NeuralNetwork - A fully connected feedforward neural network
 */
export class NeuralNetwork {
    public layers: NeuralLayer[];
    public topology: number[];
    public weightCount: number;

    constructor(topology: number[], activation: ActivationFunction = softSign) {
        if (topology.length < 2) {
            throw new Error('Network must have at least input and output layers');
        }

        this.topology = topology;
        this.layers = [];
        this.weightCount = 0;

        // Create layers
        for (let i = 0; i < topology.length - 1; i++) {
            const layer = new NeuralLayer(topology[i], topology[i + 1], activation);
            this.layers.push(layer);
            this.weightCount += layer.getWeightCount();
        }
    }

    /**
     * Set all weights from a flat array (genotype)
     */
    setWeights(flatWeights: number[]): void {
        if (flatWeights.length !== this.weightCount) {
            throw new Error(`Weight count mismatch: expected ${this.weightCount}, got ${flatWeights.length}`);
        }

        let offset = 0;
        for (const layer of this.layers) {
            const count = layer.getWeightCount();
            layer.setWeights(flatWeights.slice(offset, offset + count));
            offset += count;
        }
    }

    /**
     * Process inputs through the network
     */
    processInputs(inputs: number[]): number[] {
        if (inputs.length !== this.topology[0]) {
            throw new Error(`Input count mismatch: expected ${this.topology[0]}, got ${inputs.length}`);
        }

        let outputs = inputs;
        for (const layer of this.layers) {
            outputs = layer.processInputs(outputs);
        }
        return outputs;
    }

    /**
     * Get all weights as flat array
     */
    getWeights(): number[] {
        const weights: number[] = [];
        for (const layer of this.layers) {
            for (let i = 0; i < layer.weights.length; i++) {
                for (let j = 0; j < layer.outputCount; j++) {
                    weights.push(layer.weights[i][j]);
                }
            }
        }
        return weights;
    }

    /**
     * Deep copy this network
     */
    clone(): NeuralNetwork {
        const copy = new NeuralNetwork(this.topology, this.layers[0].activationFunction);
        copy.setWeights(this.getWeights());
        return copy;
    }
}
