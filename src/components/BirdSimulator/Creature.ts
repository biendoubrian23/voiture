
import { PhysicsEngine } from './PhysicsEngine';

export interface DNA {
    nodes: { x: number, y: number }[];
    connections: [number, number][];
}

export class Creature {
    dna: DNA;
    fitness: number = 0;
    isDead: boolean = false;

    constructor(dna?: DNA) {
        if (dna) {
            this.dna = dna;
        } else {
            this.dna = this.createRandomSymmetricDNA();
        }
    }

    createRandomSymmetricDNA(): DNA {
        const nodes: { x: number, y: number }[] = [];
        const connections: [number, number][] = [];

        // 1. Spine (Central Axis)
        const spineCount = 2 + Math.floor(Math.random() * 3); // 2-4
        for (let i = 0; i < spineCount; i++) {
            nodes.push({
                x: 0,
                y: (Math.random() - 0.5) * 80 + (i * 30)
            });
        }

        // 2. Right Wing (Positive X)
        const wingCount = 2 + Math.floor(Math.random() * 4); // 2-5
        for (let i = 0; i < wingCount; i++) {
            nodes.push({
                x: 20 + Math.random() * 100,
                y: (Math.random() - 0.5) * 100
            });
        }

        // 3. Left Wing (Negative X, Placeholder, will form mirror)
        // We add them now so indices align: [Spine..., Right..., Left...]
        for (let i = 0; i < wingCount; i++) {
            const rNode = nodes[spineCount + i];
            nodes.push({ x: -rNode.x, y: rNode.y });
        }

        const leftStart = spineCount + wingCount;

        // 4. Connect Spine
        for (let i = 0; i < spineCount - 1; i++) {
            connections.push([i, i + 1]);
        }

        // 5. Connect Right Wing
        const rightStart = spineCount;
        for (let i = 0; i < wingCount; i++) {
            const currentIdx = rightStart + i;

            // Connect to Spine check
            const spineIdx = Math.floor(Math.random() * spineCount);
            connections.push([currentIdx, spineIdx]);

            // Connect to other Right node check
            if (wingCount > 1) {
                const other = Math.floor(Math.random() * wingCount);
                if (other !== i) {
                    const target = rightStart + other;
                    // Avoid duplicate
                    if (!connections.some(c => (c[0] === currentIdx && c[1] === target) || (c[0] === target && c[1] === currentIdx)))
                        connections.push([currentIdx, target]);
                }
            }
        }

        // 6. Mirror Connections to Left
        // Any connection involving Right Index R needs to be mirrored to Left Index L
        // L = R + wingCount
        // Spine index S maps to itself.

        // We only iterate connections created so far (Spine & Right)
        const initialConnections = [...connections];

        initialConnections.forEach(([a, b]) => {
            let mA = a;
            let mB = b;

            // Map Right -> Left
            if (a >= rightStart && a < leftStart) mA = a + wingCount;
            if (b >= rightStart && b < leftStart) mB = b + wingCount;

            // If connection is different (not spine-spine), add it
            if (mA !== a || mB !== b) {
                if (!connections.some(c => (c[0] === mA && c[1] === mB) || (c[0] === mB && c[1] === mA)))
                    connections.push([mA, mB]);
            }
        });

        return { nodes, connections };
    }

    mutate(rate: number) {
        // GEOMETRY MUTATION (Respect Symmetry)
        // We assume structure [Spine... Right... Left...]
        const numNodes = this.dna.nodes.length;

        // Heuristic to recover counts:
        let spineCount = 0;
        for (const n of this.dna.nodes) { if (Math.abs(n.x) < 0.001) spineCount++; }
        const remaining = numNodes - spineCount;
        const wingCount = remaining / 2;
        const rightStart = spineCount;
        const leftStart = spineCount + wingCount;

        // Mutate Spine & Right
        for (let i = 0; i < leftStart; i++) {
            if (Math.random() < rate) {
                const dx = (Math.random() - 0.5) * 30;
                const dy = (Math.random() - 0.5) * 30;

                this.dna.nodes[i].x += dx;
                this.dna.nodes[i].y += dy;

                // Constraints
                if (i < spineCount) {
                    this.dna.nodes[i].x = 0; // Spine stays center
                } else {
                    if (this.dna.nodes[i].x < 2) this.dna.nodes[i].x = 2; // Right stay positive
                }
            }
        }

        // FORCE MIRROR to Left
        for (let i = 0; i < wingCount; i++) {
            const rIdx = rightStart + i;
            const lIdx = leftStart + i;

            if (this.dna.nodes[rIdx] && this.dna.nodes[lIdx]) {
                this.dna.nodes[lIdx].x = -this.dna.nodes[rIdx].x;
                this.dna.nodes[lIdx].y = this.dna.nodes[rIdx].y;
            }
        }

        // TOPOLOGY MUTATION (Symmetric)
        if (Math.random() < rate * 0.5) {
            // Add Connection: Pick A and B from (Spine + Right)
            const validIndices = leftStart; // 0 to leftStart-1 are Spine+Right
            const idxA = Math.floor(Math.random() * validIndices);
            const idxB = Math.floor(Math.random() * validIndices);

            if (idxA !== idxB) {
                // Check existence
                if (!this.dna.connections.some(c => (c[0] === idxA && c[1] === idxB) || (c[0] === idxB && c[1] === idxA))) {
                    this.dna.connections.push([idxA, idxB]);

                    // Helper map
                    const getMirror = (idx: number) => {
                        if (idx < spineCount) return idx;
                        return idx + wingCount;
                    };

                    const mA = getMirror(idxA);
                    const mB = getMirror(idxB);

                    if (mA !== idxA || mB !== idxB) { // Don't dupe spine-spine
                        this.dna.connections.push([mA, mB]);
                    }
                }
            }
        }
        // Remove Connection? Maybe later.
    }

    spawn(engine: PhysicsEngine, x: number, y: number) {
        if (!this.dna || this.dna.nodes.length === 0) return [];

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
