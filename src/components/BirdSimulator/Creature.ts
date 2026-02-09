
import { PhysicsEngine } from './PhysicsEngine';

export interface DNA {
    // Relative positions of nodes from a center (0,0)
    nodes: { x: number, y: number }[];
    // Which nodes are connected [index1, index2]
    connections: [number, number][];
}

export class Creature {
    dna: DNA;
    fitness: number = 0;

    constructor(dna?: DNA) {
        if (dna) {
            this.dna = dna;
        } else {
            this.dna = this.createRandomDNA();
        }
    }

    createRandomDNA(): DNA {
        const nodes: { x: number, y: number }[] = [];
        const connections: [number, number][] = [];

        // Much more variance in node count (3 to 8)
        const numNodes = 3 + Math.floor(Math.random() * 6);

        // Create random nodes in a larger space
        for (let i = 0; i < numNodes; i++) {
            nodes.push({
                x: (Math.random() - 0.5) * 150, // Wider range (-75 to 75)
                y: (Math.random() - 0.5) * 150
            });
        }

        // Random Connections
        // Minimum spanning tree + extra connections
        // Simple approach: connect each node to 1-3 random other nodes
        for (let i = 0; i < numNodes; i++) {
            const numConnections = 1 + Math.floor(Math.random() * 2);
            for (let k = 0; k < numConnections; k++) {
                const target = Math.floor(Math.random() * numNodes);
                if (target !== i) {
                    // Avoid duplicates? simple check
                    const exists = connections.some(c => (c[0] === i && c[1] === target) || (c[0] === target && c[1] === i));
                    if (!exists) {
                        connections.push([i, target]);
                    }
                }
            }
        }

        // Ensure at least one connection exists if somehow failed (rare)
        if (connections.length === 0 && numNodes > 1) {
            connections.push([0, 1]);
        }

        return { nodes, connections };
    }

    mutate(rate: number) {
        // 1. Mutate existing node positions (Geometry)
        for (const node of this.dna.nodes) {
            if (Math.random() < rate) {
                node.x += (Math.random() - 0.5) * 30; // Stronger drift
                node.y += (Math.random() - 0.5) * 30;
            }
        }

        // 2. Structural Mutation: Add/Remove Connections
        if (Math.random() < rate) {
            if (Math.random() < 0.5 && this.dna.nodes.length > 1) {
                // Add connection
                const i = Math.floor(Math.random() * this.dna.nodes.length);
                const j = Math.floor(Math.random() * this.dna.nodes.length);
                if (i !== j) {
                    const exists = this.dna.connections.some(c => (c[0] === i && c[1] === j) || (c[0] === j && c[1] === i));
                    if (!exists) this.dna.connections.push([i, j]);
                }
            } else if (this.dna.connections.length > 1) {
                // Remove connection (but keep at least 1)
                const index = Math.floor(Math.random() * this.dna.connections.length);
                this.dna.connections.splice(index, 1);
            }
        }

        // 3. Structural Mutation: Add/Remove Nodes (Rare)
        if (Math.random() < rate * 0.5) {
            if (Math.random() < 0.5) {
                // Add Node
                this.dna.nodes.push({
                    x: (Math.random() - 0.5) * 100,
                    y: (Math.random() - 0.5) * 100
                });
                // Connect it to someone
                const target = Math.floor(Math.random() * (this.dna.nodes.length - 1));
                this.dna.connections.push([this.dna.nodes.length - 1, target]);
            } else if (this.dna.nodes.length > 3) {
                // Remove Node (clean up connections too)
                const index = Math.floor(Math.random() * this.dna.nodes.length);
                this.dna.nodes.splice(index, 1);
                // Remove connections to this node
                // And shift indices > index down
                this.dna.connections = this.dna.connections.filter(c => c[0] !== index && c[1] !== index).map(c => {
                    return [
                        c[0] > index ? c[0] - 1 : c[0],
                        c[1] > index ? c[1] - 1 : c[1]
                    ] as [number, number];
                });
            }
        }
    }

    // Helper to spawn this creature into the world
    spawn(engine: PhysicsEngine, x: number, y: number) {
        const points = this.dna.nodes.map(node => {
            return engine.addPoint(x + node.x, y + node.y);
        });

        this.dna.connections.forEach(([i, j]) => {
            if (points[i] && points[j]) {
                engine.addStick(points[i], points[j]);
            }
        });

        return points;
    }
}
