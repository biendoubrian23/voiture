import { CONFIG, Vector2, LineSegment, vec2 } from './config';

/**
 * Checkpoint for measuring progress on the track
 */
export interface Checkpoint {
    position: Vector2;
    radius: number;
    rewardValue: number;
    accumulatedReward: number;
}

/**
 * Track - Simple racing circuits that don't self-intersect
 */
export class Track {
    public walls: LineSegment[] = [];
    public checkpoints: Checkpoint[] = [];
    public startPosition: Vector2 = { x: 0, y: 0 };
    public startAngle: number = 0;
    public trackWidth: number = 55;

    constructor(trackIndex: number = 0) {
        this.createTrack(trackIndex);
    }

    /**
     * Create a track from a custom path drawn by the user
     */
    static fromCustomPath(path: Vector2[]): Track {
        const track = new Track(0); // Create with default
        track.walls = [];
        track.checkpoints = [];

        // Build walls from the custom path
        const halfWidth = track.trackWidth / 2;
        const outer: Vector2[] = [];
        const inner: Vector2[] = [];

        for (let i = 0; i < path.length; i++) {
            const prev = path[Math.max(i - 1, 0)];
            const next = path[Math.min(i + 1, path.length - 1)];
            const curr = path[i];

            const dir = vec2.normalize(vec2.sub(next, prev));
            const normal = { x: -dir.y, y: dir.x };

            outer.push({
                x: curr.x + normal.x * halfWidth,
                y: curr.y + normal.y * halfWidth,
            });

            inner.push({
                x: curr.x - normal.x * halfWidth,
                y: curr.y - normal.y * halfWidth,
            });
        }

        // Create wall segments
        for (let i = 0; i < outer.length - 1; i++) {
            track.walls.push({ start: outer[i], end: outer[i + 1] });
            track.walls.push({ start: inner[i], end: inner[i + 1] });
        }

        // Close the track at the end
        if (outer.length > 0) {
            const lastOuter = outer[outer.length - 1];
            const lastInner = inner[inner.length - 1];
            track.walls.push({ start: lastOuter, end: lastInner });
        }

        // Create checkpoints
        const checkpointCount = Math.min(20, path.length);
        for (let i = 0; i < checkpointCount; i++) {
            const idx = Math.floor((i / checkpointCount) * path.length);
            track.checkpoints.push({
                position: { ...path[idx] },
                radius: track.trackWidth * 0.8,
                rewardValue: 1 / checkpointCount,
                accumulatedReward: (i + 1) / checkpointCount,
            });
        }

        // Set start position
        track.startPosition = { ...path[0] };

        // Calculate start angle from first two points
        if (path.length >= 2) {
            const dx = path[1].x - path[0].x;
            const dy = path[1].y - path[0].y;
            track.startAngle = Math.atan2(dy, dx);
        } else {
            track.startAngle = 0;
        }

        return track;
    }

    private createTrack(index: number): void {
        switch (index % 4) {
            case 0:
                this.createTrack1();
                break;
            case 1:
                this.createTrack2();
                break;
            case 2:
                this.createTrack3();
                break;
            case 3:
                this.createTrack4();
                break;
        }
    }

    /**
     * Track 1: Closed oval circuit - car starts inside
     */
    private createTrack1(): void {
        const path: Vector2[] = [
            // Start on left side, going UP (car faces upward)
            { x: 160, y: 450 },
            { x: 160, y: 350 },
            { x: 160, y: 280 },
            // Top left curve
            { x: 200, y: 220 },
            { x: 280, y: 180 },
            { x: 380, y: 160 },
            // Top straight
            { x: 500, y: 160 },
            { x: 620, y: 160 },
            // Top right curve
            { x: 720, y: 180 },
            { x: 800, y: 240 },
            { x: 840, y: 320 },
            // Right side down
            { x: 850, y: 420 },
            { x: 840, y: 520 },
            // Bottom right curve
            { x: 800, y: 600 },
            { x: 720, y: 660 },
            { x: 620, y: 680 },
            // Bottom straight
            { x: 500, y: 680 },
            { x: 380, y: 680 },
            // Bottom left curve
            { x: 280, y: 660 },
            { x: 200, y: 600 },
            { x: 160, y: 520 },
            // Back to start (closes the loop)
        ];

        this.buildFromCenterPath(path);

        // Start position: middle of left side, facing UP
        this.startPosition = { x: 160, y: 450 };
        this.startAngle = -Math.PI / 2; // Pointing UP
    }

    /**
     * Track 2: Figure-8 style without crossing (S-curve)
     */
    private createTrack2(): void {
        const path: Vector2[] = [
            // Start at left
            { x: 100, y: 350 },
            { x: 150, y: 280 },
            { x: 220, y: 220 },
            { x: 320, y: 180 },
            { x: 450, y: 160 },
            // Top right curve
            { x: 580, y: 180 },
            { x: 680, y: 240 },
            { x: 740, y: 320 },
            { x: 760, y: 420 },
            // Down right
            { x: 740, y: 520 },
            { x: 680, y: 600 },
            { x: 580, y: 650 },
            // Bottom middle
            { x: 450, y: 670 },
            { x: 320, y: 650 },
            // Bottom left curve
            { x: 220, y: 600 },
            { x: 150, y: 520 },
            { x: 120, y: 430 },
        ];

        this.buildFromCenterPath(path);
        this.startPosition = { ...path[0] };
        this.startAngle = -Math.PI / 4;
    }

    /**
     * Track 3: Technical track with hairpins - smooth curves
     */
    private createTrack3(): void {
        const path: Vector2[] = [
            // Start straight
            { x: 100, y: 650 },
            { x: 100, y: 550 },
            { x: 100, y: 450 },
            { x: 100, y: 350 },
            // First hairpin (SMOOTHED - wider arc)
            { x: 110, y: 300 },
            { x: 130, y: 250 },
            { x: 170, y: 210 },
            { x: 220, y: 190 },
            { x: 280, y: 200 },
            { x: 330, y: 240 },
            { x: 350, y: 300 },
            { x: 350, y: 380 },
            { x: 340, y: 460 },
            // S-curve section
            { x: 370, y: 530 },
            { x: 430, y: 570 },
            { x: 510, y: 550 },
            { x: 570, y: 490 },
            { x: 590, y: 410 },
            // Second hairpin (smoothed)
            { x: 580, y: 340 },
            { x: 550, y: 280 },
            { x: 520, y: 240 },
            { x: 560, y: 200 },
            { x: 620, y: 180 },
            { x: 700, y: 180 },
            // Long straight
            { x: 780, y: 200 },
            { x: 840, y: 260 },
            { x: 870, y: 350 },
            { x: 870, y: 460 },
            // Final curve
            { x: 840, y: 550 },
            { x: 780, y: 620 },
            { x: 680, y: 660 },
            { x: 550, y: 680 },
            { x: 400, y: 680 },
            { x: 280, y: 660 },
            { x: 180, y: 650 },
        ];

        this.buildFromCenterPath(path);
        this.startPosition = { ...path[0] };
        this.startAngle = -Math.PI / 2;
    }

    /**
     * Track 4: S-shaped circuit with internal loop (middle circuit from reference)
     * Carefully traced to avoid any self-intersection
     */
    private createTrack4(): void {
        // Track width is 55px, so parallel sections must be >110px apart
        const path: Vector2[] = [
            // Start at bottom left, going UP
            { x: 120, y: 650 },
            { x: 120, y: 550 },
            { x: 120, y: 450 },
            { x: 120, y: 350 },
            { x: 120, y: 250 },
            // Top left curve going RIGHT
            { x: 150, y: 180 },
            { x: 220, y: 130 },
            { x: 320, y: 110 },
            { x: 420, y: 110 },
            // Curve down into the S
            { x: 500, y: 130 },
            { x: 560, y: 180 },
            { x: 590, y: 260 },
            { x: 590, y: 360 },
            // S-curve going left
            { x: 560, y: 440 },
            { x: 500, y: 500 },
            { x: 420, y: 530 },
            // Internal loop - going down then right
            { x: 350, y: 520 },
            { x: 300, y: 480 },
            { x: 280, y: 420 },
            { x: 300, y: 360 },
            { x: 360, y: 320 },
            { x: 440, y: 320 },
            { x: 500, y: 360 },
            { x: 520, y: 420 },
            // Exit loop - going right and down
            { x: 560, y: 480 },
            { x: 620, y: 540 },
            { x: 700, y: 580 },
            { x: 780, y: 580 },
            // Right side curve going up then left
            { x: 840, y: 540 },
            { x: 870, y: 470 },
            { x: 870, y: 380 },
            { x: 840, y: 300 },
            { x: 780, y: 240 },
            { x: 700, y: 200 },
            // Top section going left
            { x: 600, y: 180 },
            { x: 500, y: 170 },
            // Connect back - wide arc to avoid crossing
            { x: 420, y: 200 },
            { x: 360, y: 260 },
            { x: 340, y: 340 },
            // Down the middle
            { x: 360, y: 420 },
            { x: 400, y: 480 },
            { x: 440, y: 540 },
            { x: 460, y: 600 },
            // Bottom curve back to start
            { x: 420, y: 660 },
            { x: 340, y: 680 },
            { x: 240, y: 670 },
        ];

        this.buildFromCenterPath(path);
        this.startPosition = { x: 120, y: 650 };
        this.startAngle = -Math.PI / 2; // Pointing UP
    }

    /**
     * Build track walls from a center path
     */
    private buildFromCenterPath(path: Vector2[]): void {
        this.walls = [];
        this.checkpoints = [];

        const halfWidth = this.trackWidth / 2;
        const outer: Vector2[] = [];
        const inner: Vector2[] = [];

        for (let i = 0; i < path.length; i++) {
            const prev = path[Math.max(i - 1, 0)];
            const next = path[Math.min(i + 1, path.length - 1)];
            const curr = path[i];

            const dir = vec2.normalize(vec2.sub(next, prev));
            const normal = { x: -dir.y, y: dir.x };

            outer.push({
                x: curr.x + normal.x * halfWidth,
                y: curr.y + normal.y * halfWidth,
            });

            inner.push({
                x: curr.x - normal.x * halfWidth,
                y: curr.y - normal.y * halfWidth,
            });
        }

        // Create wall segments
        for (let i = 0; i < outer.length - 1; i++) {
            this.walls.push({ start: outer[i], end: outer[i + 1] });
            this.walls.push({ start: inner[i], end: inner[i + 1] });
        }

        // Close the track - add wall at the END only (behind the car)
        // This prevents the car from going backwards
        const lastOuter = outer[outer.length - 1];
        const lastInner = inner[inner.length - 1];
        this.walls.push({ start: lastOuter, end: lastInner });

        // Create checkpoints
        const checkpointCount = Math.min(20, path.length);
        for (let i = 0; i < checkpointCount; i++) {
            const idx = Math.floor((i / checkpointCount) * path.length);
            this.checkpoints.push({
                position: { ...path[idx] },
                radius: this.trackWidth * 0.8,
                rewardValue: 1 / checkpointCount,
                accumulatedReward: (i + 1) / checkpointCount,
            });
        }
    }

    checkCollision(position: Vector2, radius: number = 5): boolean {
        for (const wall of this.walls) {
            const dist = this.distanceToLine(position, wall);
            if (dist < radius) {
                return true;
            }
        }
        return false;
    }

    private distanceToLine(point: Vector2, line: LineSegment): number {
        const { start, end } = line;
        const lineVec = vec2.sub(end, start);
        const pointVec = vec2.sub(point, start);
        const lineLen = vec2.length(lineVec);

        if (lineLen === 0) return vec2.distance(point, start);

        const t = Math.max(0, Math.min(1, vec2.dot(pointVec, lineVec) / (lineLen * lineLen)));
        const projection = vec2.add(start, vec2.scale(lineVec, t));
        return vec2.distance(point, projection);
    }

    getProgress(position: Vector2, currentCheckpoint: number): { progress: number; newCheckpoint: number } {
        if (currentCheckpoint >= this.checkpoints.length) {
            return { progress: 1, newCheckpoint: currentCheckpoint };
        }

        const checkpoint = this.checkpoints[currentCheckpoint];
        const dist = vec2.distance(position, checkpoint.position);

        if (dist < checkpoint.radius) {
            return {
                progress: checkpoint.accumulatedReward,
                newCheckpoint: currentCheckpoint + 1,
            };
        }

        const prevReward = currentCheckpoint > 0 ? this.checkpoints[currentCheckpoint - 1].accumulatedReward : 0;
        const maxDist = checkpoint.radius * 3;
        const partialProgress = Math.max(0, 1 - dist / maxDist) * checkpoint.rewardValue;

        return {
            progress: prevReward + partialProgress,
            newCheckpoint: currentCheckpoint,
        };
    }
}
