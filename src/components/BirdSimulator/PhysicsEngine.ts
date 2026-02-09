
export class Point {
    x: number;
    y: number;
    oldX: number;
    oldY: number;
    pinned: boolean;

    constructor(x: number, y: number, pinned: boolean = false) {
        this.x = x;
        this.y = y;
        this.oldX = x;
        this.oldY = y;
        this.pinned = pinned;
    }

    update(gravity: number, friction: number) {
        if (this.pinned) return;

        const vx = (this.x - this.oldX) * friction;
        const vy = (this.y - this.oldY) * friction;

        this.oldX = this.x;
        this.oldY = this.y;

        this.x += vx;
        this.y += vy + gravity;
    }

    constrain(width: number, height: number, bounce: number = 0.9) {
        if (this.pinned) return;

        if (this.x > width) {
            this.x = width;
            this.oldX = this.x + (this.x - this.oldX) * bounce;
        } else if (this.x < 0) {
            this.x = 0;
            this.oldX = this.x + (this.x - this.oldX) * bounce;
        }

        if (this.y > height) {
            this.y = height;
            this.oldY = this.y + (this.y - this.oldY) * bounce;
        } else if (this.y < 0) {
            this.y = 0;
            this.oldY = this.y + (this.y - this.oldY) * bounce;
        }
    }
}


export class Stick {
    p0: Point;
    p1: Point;
    length: number;
    baseLength: number;
    color: string;
    width: number;
    isMuscle: boolean;
    frequency: number;
    phase: number;
    amplitude: number;

    constructor(p0: Point, p1: Point, length?: number, isMuscle: boolean = false) {
        this.p0 = p0;
        this.p1 = p1;
        this.baseLength = length || Math.hypot(p1.x - p0.x, p1.y - p0.y);
        this.length = this.baseLength;
        this.color = '#ffffff';
        this.width = 2;
        this.isMuscle = isMuscle;

        // Muscle properties
        this.frequency = 0.05; // Speed of contraction
        this.phase = 0; // Offset
        this.amplitude = 0.3; // How much it contracts (30%)
    }

    update(time: number) {
        if (this.isMuscle) {
            // Calculate new length based on sine wave
            // sin(time) goes from -1 to 1.
            // We want length to go from baseLength * (1 - amplitude) to baseLength * (1 + amplitude)
            // actually, muscles usually only contract. So let's say baseLength to baseLength * (1 - amplitude)
            const contraction = Math.sin(time * this.frequency + this.phase);
            // Map -1..1 to 1-amp..1+amp or just use it to scale length
            const scale = 1 + contraction * this.amplitude;
            this.length = this.baseLength * scale;

            // Visual feedback
            // Red when contracting (shorter), White when relaxing/extending
            const redness = Math.floor(((1 - scale) / this.amplitude + 1) * 127);
            // Clamp redness to 0-255
            const r = Math.min(255, Math.max(0, redness + 50));
            const gb = Math.min(255, Math.max(0, 255 - redness * 2));
            this.color = `rgb(${r}, ${gb}, ${gb})`;
            this.width = 3 + (1 - scale) * 5; // Thicker when contracted
        }

        const dx = this.p1.x - this.p0.x;
        const dy = this.p1.y - this.p0.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        // Build in protection against zero distance
        if (dist === 0) return;

        const diff = this.length - dist;
        const percent = diff / dist / 2;
        const offsetX = dx * percent;
        const offsetY = dy * percent;

        if (!this.p0.pinned) {
            this.p0.x -= offsetX;
            this.p0.y -= offsetY;
        }
        if (!this.p1.pinned) {
            this.p1.x += offsetX;
            this.p1.y += offsetY;
        }
    }
}

export class PhysicsEngine {
    points: Point[] = [];
    sticks: Stick[] = [];
    gravity: number = 0.5;
    friction: number = 0.999;
    width: number = 800;
    height: number = 600;
    time: number = 0;

    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
    }

    addPoint(x: number, y: number, pinned: boolean = false): Point {
        const p = new Point(x, y, pinned);
        this.points.push(p);
        return p;
    }

    addStick(p0: Point, p1: Point, isMuscle: boolean = false, length?: number): Stick {
        const s = new Stick(p0, p1, length, isMuscle);
        this.sticks.push(s);
        return s;
    }

    update() {
        this.time++;
        this.updatePoints();
        // Solve constraints multiple times for stability
        for (let i = 0; i < 5; i++) {
            this.updateSticks();
            this.constrainPoints();
        }
    }

    updatePoints() {
        for (const p of this.points) {
            p.update(this.gravity, this.friction);
        }
    }

    updateSticks() {
        for (const s of this.sticks) {
            s.update(this.time);
        }
    }

    constrainPoints() {
        for (const p of this.points) {
            p.constrain(this.width, this.height);
        }
    }

    reset() {
        this.points = [];
        this.sticks = [];
        this.time = 0;
    }
}
