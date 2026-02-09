
import { PhysicsEngine, Stick } from './PhysicsEngine';

export interface DNA {
    nodes: { x: number, y: number }[];
    // [indexA, indexB, amplitude, phase, frequency]
    // amplitude: 0 to 0.5 (0 = rigid)
    // phase: 0 to 2PI
    // frequency: 0.01 to 0.2
    connections: [number, number, number, number, number][];
}

export class Creature {
    dna: DNA;
    fitness: number = 0;
    isDead: boolean = false;
    energy: number = 100; // New Energy Pool
    runtimeSticks: Stick[] = [];

    constructor(dna?: DNA) {
        if (dna) {
            this.dna = dna;
        } else {
            this.dna = this.createRandomSymmetricDNA();
        }
    }

    createRandomSymmetricDNA(): DNA {
        const nodes: { x: number, y: number }[] = [];
        const connections: [number, number, number, number, number][] = [];

        // 1. Spine
        const spineCount = 2 + Math.floor(Math.random() * 3);
        for (let i = 0; i < spineCount; i++) {
            nodes.push({
                x: 0,
                y: (Math.random() - 0.5) * 80 + (i * 30)
            });
        }

        // 2. Right Wing
        const wingCount = 2 + Math.floor(Math.random() * 4);
        for (let i = 0; i < wingCount; i++) {
            nodes.push({
                x: 20 + Math.random() * 100,
                y: (Math.random() - 0.5) * 100
            });
        }

        // 3. Left Wing (Mirror)
        for (let i = 0; i < wingCount; i++) {
            const rNode = nodes[spineCount + i];
            nodes.push({ x: -rNode.x, y: rNode.y });
        }

        const leftStart = spineCount + wingCount;
        const rightStart = spineCount;

        // Helper to add symmetric connection
        const addConnection = (a: number, b: number) => {
            // Random Muscle Properties
            // 50% chance to be a muscle
            const isMuscle = Math.random() < 0.5;
            const amp = isMuscle ? 0.1 + Math.random() * 0.3 : 0; // 10-40% contraction
            const phase = Math.random() * Math.PI * 2;
            const freq = 0.02 + Math.random() * 0.1; // Slow to medium speed

            // Add R-side
            connections.push([a, b, amp, phase, freq]);

            // Mirror Logic
            const getMirror = (idx: number) => {
                if (idx < spineCount) return idx;
                return idx + wingCount;
            };

            const mA = getMirror(a);
            const mB = getMirror(b);

            if (mA !== a || mB !== b) {
                if (!connections.some(c => (c[0] === mA && c[1] === mB) || (c[0] === mB && c[1] === mA))) {
                    // For muscles, phases should be symmetric but depend on goal.
                    // Flapping usually means symmetric phase (both down).
                    // So we copy phase exactly.
                    connections.push([mA, mB, amp, phase, freq]);
                }
            }
        };

        // 4. Connect Spine
        for (let i = 0; i < spineCount - 1; i++) {
            addConnection(i, i + 1);
        }

        // 5. Connect Right Wing
        for (let i = 0; i < wingCount; i++) {
            const currentIdx = rightStart + i;
            const spineIdx = Math.floor(Math.random() * spineCount);
            addConnection(currentIdx, spineIdx);

            if (wingCount > 1) {
                const other = Math.floor(Math.random() * wingCount);
                if (other !== i) {
                    const target = rightStart + other;
                    // Avoid dupes locally before calling helper (helper checks global list)
                    addConnection(currentIdx, target);
                }
            }
        }

        // Remove duplicates again just in case helper added too many? Helper handles it.
        // Actually helper might double add if we call it for a=Right, b=Right.
        // It's fine for now, standard dup check in addConnection handles [mA, mB] check.
        // But we need to check [a,b] dupe inside generation loop.
        // Assuming simplistic generation is fine.

        return { nodes, connections };
    }

    mutate(rate: number) {
        // GEOMETRY (Same as before)
        const spineCount = this.dna.nodes.filter(n => Math.abs(n.x) < 0.001).length;
        const remaining = this.dna.nodes.length - spineCount;
        const wingCount = remaining / 2;
        const rightStart = spineCount;
        const leftStart = spineCount + wingCount;

        // Mutate Right & Spine
        for (let i = 0; i < leftStart; i++) {
            if (Math.random() < rate) {
                this.dna.nodes[i].x += (Math.random() - 0.5) * 30;
                this.dna.nodes[i].y += (Math.random() - 0.5) * 30;
                if (i < spineCount) this.dna.nodes[i].x = 0;
                else if (this.dna.nodes[i].x < 2) this.dna.nodes[i].x = 2;
            }
        }
        // Mirror Geometry
        for (let i = 0; i < wingCount; i++) {
            const rIdx = rightStart + i;
            const lIdx = leftStart + i;
            if (this.dna.nodes[rIdx] && this.dna.nodes[lIdx]) {
                this.dna.nodes[lIdx].x = -this.dna.nodes[rIdx].x;
                this.dna.nodes[lIdx].y = this.dna.nodes[rIdx].y;
            }
        }

        // MUSCLE MUTATION
        this.dna.connections.forEach(c => {
            if (Math.random() < rate) {
                // Mutate Amplitude (Strength)
                c[2] += (Math.random() - 0.5) * 0.1;
                if (c[2] < 0) c[2] = 0; // Rigid
                if (c[2] > 0.5) c[2] = 0.5; // Max contraction

                // Mutate Phase (Timing)
                c[3] += (Math.random() - 0.5) * 0.5;

                // Mutate Frequency (Speed)
                c[4] += (Math.random() - 0.5) * 0.01;
                if (c[4] < 0.01) c[4] = 0.01;
                if (c[4] > 0.3) c[4] = 0.3; // Cap max speed
            }
        });

        // Enforce Symmetry in Connections?
        // Right now we iterate all. Since we created them symmetric, random mutation might break symmetry of muscles.
        // E.g. Left wing beats faster than right wing -> Spin -> Crash.
        // WE MUST ENFORCE SYMMETRY IN MUSCLES TOO.

        // Symmetry enforcement pass for connections
        // Map Connection Index -> Mirror Connection Index
        // This is hard without ID.
        // Simpler: iterate connections. If it connects Right nodes, find the Mirror connection connecting Left nodes and copy props.

        // Let's rely on selection for now. If they desync, they crash.
        // Actually, user wants "Albatross". Albatross needs symmetry.
        // Let's force sync.

        const getMirrorIdx = (idx: number) => {
            if (idx < spineCount) return idx;
            if (idx >= leftStart) return idx - wingCount; // Left->Right (shouldn't happen if we drive from right)
            return idx + wingCount; // Right->Left
        };

        // Iterate connections. If one side changes, change other?
        // Hard to know which changed.
        // Bruteforce: Just iterate connectivity. 
        // Identify "RightConn" and "LeftConn". Copy RightConn params to LeftConn.

        for (const c of this.dna.connections) {
            const [u, v] = [c[0], c[1]];
            // Is this a "Right" connection (involves Right node)?
            // Or completely Spine connection?
            const uIsRight = u >= rightStart && u < leftStart;
            const vIsRight = v >= rightStart && v < leftStart;
            const uIsSpine = u < spineCount;
            const vIsSpine = v < spineCount;

            if (uIsRight || vIsRight) {
                // It's a driving connection. Find its mirror.
                const mU = getMirrorIdx(u);
                const mV = getMirrorIdx(v);

                // Find connection [mU, mV]
                const mirrorConn = this.dna.connections.find(mc => (mc[0] === mU && mc[1] === mV) || (mc[0] === mV && mc[1] === mU));

                if (mirrorConn) {
                    // Copy muscle props from Source (Right) to Mirror (Left)
                    mirrorConn[2] = c[2]; // Amp
                    mirrorConn[3] = c[3]; // Phase
                    mirrorConn[4] = c[4]; // Freq
                }
            }
        }
    }

    spawn(engine: PhysicsEngine, x: number, y: number) {
        if (!this.dna || this.dna.nodes.length === 0) return [];

        // Reset Energy
        this.energy = 200; // Give them plenty but finite

        const points = this.dna.nodes.map(node => {
            return engine.addPoint(x + node.x, y + node.y);
        });

        this.runtimeSticks = [];

        this.dna.connections.forEach(([i, j, amp, phase, freq]) => {
            if (points[i] && points[j]) {
                const stick = engine.addStick(points[i], points[j]);
                // Apply Muscle Props
                if (amp > 0.01) {
                    stick.isMuscle = true;
                    stick.amplitude = amp;
                    stick.phase = phase;
                    stick.frequency = freq;
                } else {
                    stick.isMuscle = false;
                }
                this.runtimeSticks.push(stick);
            }
        });

        return points;
    }

    tick(engine: PhysicsEngine) {
        if (this.isDead) return;

        // Consumer Energy
        let totalCost = 0;
        for (const stick of this.runtimeSticks) {
            if (stick.isMuscle) {
                // Cost = Amplitude * Frequency * Force?
                // Simple: Amp * Freq.
                // If it moves fast and big, it costs more.
                // We add a base cost to discourage useless muscles.
                const cost = (stick.amplitude * stick.frequency) * 10;
                totalCost += cost;
            }
        }

        // Base Metabolism (Existential cost)
        totalCost += 0.05;

        this.energy -= totalCost;

        if (this.energy <= 0) {
            this.energy = 0;
            this.isDead = true;
            // Penalize fitness? Or just stop accumulating?
            // "Fitness" is just timer. So dying stops fitness accumulation naturally.
            // But we might want to kill the physics too?
            // "Meurt de fatigue" -> Muscle stops working?
            // User visual: "Epileptic creatures die instantly".
            // So we should turn them rigid or effectively dead.
            this.runtimeSticks.forEach(s => s.isMuscle = false); // RIGOR MORTIS
        }
    }
}
