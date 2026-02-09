
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
  color: string;
  width: number;

  constructor(p0: Point, p1: Point, length?: number) {
    this.p0 = p0;
    this.p1 = p1;
    this.length = length || Math.hypot(p1.x - p0.x, p1.y - p0.y);
    this.color = '#ffffff';
    this.width = 2;
  }

  update() {
    const dx = this.p1.x - this.p0.x;
    const dy = this.p1.y - this.p0.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
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

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  addPoint(x: number, y: number, pinned: boolean = false): Point {
    const p = new Point(x, y, pinned);
    this.points.push(p);
    return p;
  }

  addStick(p0: Point, p1: Point, length?: number): Stick {
    const s = new Stick(p0, p1, length);
    this.sticks.push(s);
    return s;
  }

  update() {
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
      s.update();
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
  }
}
