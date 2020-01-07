import display from 'display/Display';
import { normalizeEaseOutClamp } from 'utils';

class Camera {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.target = null;
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
  setTarget(x, y) {
    this.target = {
      x,
      y,
    };
  }

  setAt(x, y) {
    this.x = x;
    this.y = y;
  }

  moveTo(x, y, ms) {
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
