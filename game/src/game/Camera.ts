import display from 'display/Display';
import { Point, normalizeEaseOutClamp } from 'utils';

class Camera {
  x: number;
  y: number;
  projectionMatrix: any;
  moving: boolean;
  prevX: number;
  prevY: number;
  startTimestamp: number;
  movingMs: number;
  nextX: number;
  nextY: number;
  target: Point;
  constructor() {
    this.x = 0;
    this.y = 0;
    this.projectionMatrix = null;
    this.moving = false;
    this.prevX = 0;
    this.prevY = 0;
    this.startTimestamp = 0;
    this.movingMs = 0;
    this.nextX = 0;
    this.nextY = 0;
    this.target = {
      x: 0,
      y: 0,
    };
  }
  setTarget(x: number, y: number) {
    this.target = {
      x,
      y,
    };
  }

  setAt(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  moveTo(x: number, y: number, ms: number) {
    this.prevX = this.x;
    this.prevY = this.y;
    this.nextX = x;
    this.nextY = y;
    this.moving = true;
    this.movingMs = ms;
    this.startTimestamp = display.now;
  }

  getOffsets() {
    return {
      offsetX: -this.x + display.width / 2,
      offsetY: -this.y + display.height / 2,
    };
  }

  update() {
    if (this.moving) {
      const x = normalizeEaseOutClamp(
        display.now,
        this.startTimestamp,
        this.startTimestamp + this.movingMs,
        this.prevX,
        this.nextX
      );
      const y = normalizeEaseOutClamp(
        display.now,
        this.startTimestamp,
        this.startTimestamp + this.movingMs,
        this.prevY,
        this.nextY
      );
      this.setAt(x, y);
      if (display.now > this.startTimestamp + this.movingMs) {
        this.moving = false;
        this.setAt(this.nextX, this.nextY);
      }
    }
  }
}

export default Camera;
