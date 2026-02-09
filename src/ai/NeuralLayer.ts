/**
 * NeuralLayer - A single layer in a feedforward neural network
 */
export type ActivationFunction = (x: number) => number;

// Activation functions
export const sigmoid: ActivationFunction = (x) => 1 / (1 + Math.exp(-x));
export const softSign: ActivationFunction = (x) => x / (1 + Math.abs(x));
export const tanh: ActivationFunction = (x) => Math.tanh(x);
export const relu: ActivationFunction = (x) => Math.max(0, x);

export class NeuralLayer {
  public weights: number[][]; // [inputCount + 1 (bias)][outputCount]
  public neuronCount: number;
  public outputCount: number;
  public activationFunction: ActivationFunction;

  constructor(neuronCount: number, outputCount: number, activation: ActivationFunction = softSign) {
    this.neuronCount = neuronCount;
    this.outputCount = outputCount;
    this.activationFunction = activation;

    // Initialize weights matrix (includes bias node)
    this.weights = [];
    for (let i = 0; i <= neuronCount; i++) { // +1 for bias
      this.weights[i] = new Array(outputCount).fill(0);
    }
  }

  /**
   * Set weights from a flat array
   */
  setWeights(flatWeights: number[]): void {
    let index = 0;
    for (let i = 0; i < this.weights.length; i++) {
      for (let j = 0; j < this.outputCount; j++) {
        this.weights[i][j] = flatWeights[index++];
      }
    }
  }

  /**
   * Get weight count for this layer
   */
  getWeightCount(): number {
    return (this.neuronCount + 1) * this.outputCount;
  }

  /**
   * Process inputs through this layer
   */
  processInputs(inputs: number[]): number[] {
    if (inputs.length !== this.neuronCount) {
      throw new Error(`Input count mismatch: expected ${this.neuronCount}, got ${inputs.length}`);
    }

    // Add bias input (always 1.0)
    const biasedInputs = [...inputs, 1.0];
    const outputs: number[] = new Array(this.outputCount).fill(0);

    // Calculate weighted sums
    for (let j = 0; j < this.outputCount; j++) {
      let sum = 0;
      for (let i = 0; i < biasedInputs.length; i++) {
        sum += biasedInputs[i] * this.weights[i][j];
      }
      outputs[j] = this.activationFunction(sum);
    }

    return outputs;
  }

  /**
   * Deep copy this layer
   */
  clone(): NeuralLayer {
    const copy = new NeuralLayer(this.neuronCount, this.outputCount, this.activationFunction);
    for (let i = 0; i < this.weights.length; i++) {
      copy.weights[i] = [...this.weights[i]];
    }
    return copy;
  }
}
