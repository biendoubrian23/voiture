
export class Point {
    x: number;
    y: number;
    oldX: number;
    oldY: number;
    pinned: boolean; // Is this point fixed in space?
    forceX: number = 0; // Accumulated X force
    forceY: number = 0; // Accumulated Y force

    constructor(x: number, y: number, pinned: boolean = false) {
        this.x = x;
        this.y = y;
        this.oldX = x;
        this.oldY = y;
        this.pinned = pinned;
    }

    applyForce(fx: number, fy: number) {
        if (this.pinned) return;
        this.forceX += fx;
        this.forceY += fy;
    }

    update(gravity: number, friction: number) {
        if (this.pinned) return;

        const vx = (this.x - this.oldX) * friction;
        const vy = (this.y - this.oldY) * friction;

        this.oldX = this.x;
        this.oldY = this.y;

        this.x += vx + this.forceX;
        this.y += vy + gravity + this.forceY;

        // Reset forces
        this.forceX = 0;
        this.forceY = 0;
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

    // Visualization properties
    liftForce: { x: number, y: number } = { x: 0, y: 0 };
    dragForce: { x: number, y: number } = { x: 0, y: 0 };

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

    calculateAeroForces(airDensity: number) {
        // 1. Calculate Stick Velocity (average of points)
        // Note: we use (x - oldX) as velocity approximation
        const vx0 = this.p0.x - this.p0.oldX;
        const vy0 = this.p0.y - this.p0.oldY;
        const vx1 = this.p1.x - this.p1.oldX;
        const vy1 = this.p1.y - this.p1.oldY;

        const velX = (vx0 + vx1) / 2;
        const velY = (vy0 + vy1) / 2;
        const speedSq = velX * velX + velY * velY;
        const speed = Math.sqrt(speedSq);

        // If not moving, no forces
        if (speed < 0.01) {
            this.liftForce = { x: 0, y: 0 };
            this.dragForce = { x: 0, y: 0 };
            return;
        }

        // 2. Calculate Stick Direction
        const dx = this.p1.x - this.p0.x;
        const dy = this.p1.y - this.p0.y;
        // Current length might act as "wing span" or "area"
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len === 0) return;

        // Normalized direction vector of the stick
        const ndx = dx / len;
        const ndy = dy / len;

        // Normalized velocity vector
        const nvx = velX / speed;
        const nvy = velY / speed;

        // 3. Calculate Angle of Attack
        // Cross product in 2D gives the sine of the angle between vectors
        // sin(theta) = v x d 
        const crossProduct = nvx * ndy - nvy * ndx;
        // Dot product gives cosine
        const dotProduct = nvx * ndx + nvy * ndy;

        // Model:
        // Drag coefficient = C_d * sin^2(alpha)
        // Lift coefficient = C_l * sin(alpha) * cos(alpha)

        // Reuse crossProduct which is sin(alpha)
        const sinAlpha = crossProduct;
        const cosAlpha = dotProduct; // cos(alpha)

        // Forces magnitude
        // F = 0.5 * rho * v^2 * A * C
        // We assume A (Area) is proportional to length 'len'
        const dynamicPressure = 0.5 * airDensity * speedSq * len;

        // Drag Factor: resists motion. 
        // Max when plate is perpendicular to flow (sinAlpha = 1). Min when parallel.
        const dragCoeff = Math.abs(sinAlpha * sinAlpha);
        // We add a base drag for wireframes
        const baseDrag = 0.01;
        const dragMag = dynamicPressure * (dragCoeff + baseDrag);

        // Lift Factor: Perpendicular to motion.
        // Max at 45 degrees. sin(2*alpha) / 2 = sin * cos.
        const liftCoeff = sinAlpha * cosAlpha;
        const liftMag = dynamicPressure * liftCoeff;

        // 4. Force Vectors
        // Drag is opposite to velocity (-nvx, -nvy)
        this.dragForce.x = -nvx * dragMag;
        this.dragForce.y = -nvy * dragMag;

        // Lift is perpendicular to velocity.
        // Lift direction depends on angle of attack sign.
        // If we rotate velocity 90 degrees: (-nvy, nvx)
        // We need to check if this vector is "up" relative to the stick or "down".
        // Actually simpler: Lift is perpendicular to Velocity. 
        // Using `liftCoeff` sign (which comes from sinAlpha * cosAlpha), it should handle "up/down" correctly relative to the flow.
        this.liftForce.x = -nvy * liftMag;
        this.liftForce.y = nvx * liftMag;

        // 5. Apply Forces to Points
        // Distribute force evenly?
        // Note: Verlet integration here is simple `x += force`.
        // Our 'Force' here is actually an impulse/displacement adjustment for the frame.
        // Need to calibrate airDensity to values that make sense (0.01 - 0.1 range maybe)
        this.p0.applyForce(this.dragForce.x * 0.5, this.dragForce.y * 0.5);
        this.p0.applyForce(this.liftForce.x * 0.5, this.liftForce.y * 0.5);
        this.p1.applyForce(this.dragForce.x * 0.5, this.dragForce.y * 0.5);
        this.p1.applyForce(this.liftForce.x * 0.5, this.liftForce.y * 0.5);
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
    airDensity: number = 0.05; // Standard air density
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

        // 1. Calculate Aerodynamics (Applied as external forces)
        for (const s of this.sticks) {
            s.calculateAeroForces(this.airDensity);
        }

        // 2. Update Points (Move based on inertia + gravity + forces)
        this.updatePoints();

        // 3. Solve constraints multiple times for stability
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
