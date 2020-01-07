import { normalizeEaseOutClamp, normalizeClamp } from 'utils';
import display from 'display/Display';

class Transform {
  constructor(ms) {
    this.ms = ms;
    this.isDone = false;
    this.x = 0;
    this.y = 0;
    this.scale = 0;

    this.nextX = 0;
    this.nextY = 0;
    this.nextScale = 0;

    this.prevX = 0;
    this.prevY = 0;
    this.prevScale = 0;

    this.normalizeXFunc = normalizeClamp;
    this.normalizeYFunc = normalizeClamp;
    this.normalizeScaleFunc = normalizeClamp;

    this.startTimestamp = 0;

    this.anchor = null;
    this.target = null;

    this.animState = null;

    this.sticky = false;

    this.onComplete = () => {};
  }

  setAnimationState(stateName) {
    this.animState = stateName;
  }

  setSticky() {
    this.sticky = true;
  }

  setOnComplete(cb) {
    this.onComplete = cb;
  }

  setEase(ease) {
    if (ease) {
      this.normalizeXFunc = normalizeEaseOutClamp;
      this.normalizeYFunc = normalizeEaseOutClamp;
      this.normalizeScaleFunc = normalizeEaseOutClamp;
    } else {
      this.normalizeXFunc = normalizeClamp;
      this.normalizeYFunc = normalizeClamp;
      this.normalizeScaleFunc = normalizeClamp;
    }
  }

  setNormalizeFunc(variableName, cb) {
    this['normalize' + variableName.toUpperCase() + 'Func'] = cb;
  }
  setAnchorAndTarget(anchor, target) {
    this.anchor = anchor;
    this.target = target;
  }
  setStartAndEnd({ x, y, scale }, { x: x2, y: y2, scale: scale2 }) {
    this.nextX = x2 || 0;
    this.nextY = y2 || 0;
    this.nextScale = scale2 || 0;
    this.prevX = x || 0;
    this.prevY = y || 0;
    this.prevScale = scale || 0;
  }
  setAtLocation({ x, y, scale }) {
    this.setStartAndEnd(
      {
        x,
        y,
        scale,
      },
      {
        x,
        y,
        scale,
      }
    );
  }
  setAtTarget(target) {
    this.anchor = target;
    this.target = target;
  }

  start() {
    this.startTimestamp = display.now;
    this.isDone = false;
  }

  get() {
    return {
      x: this.x,
      y: this.y,
      scale: this.scale,
      animState: this.animState,
    };
  }

  update() {
    if (this.anchor) {
      const { x, y } = this.anchor.getBaseRenderPosition();
      this.prevX = x;
      this.prevY = y;
      this.scale = this.anchor.baseScale;
    }
    if (this.target) {
      const { x, y } = this.target.getBaseRenderPosition();
      this.nextX = x;
      this.nextY = y;
      this.scale = this.target.baseScale;
    }

    this.x = this.normalizeXFunc(
      display.now,
      this.startTimestamp,
      this.startTimestamp + this.ms,
      this.prevX,
      this.nextX
    );
    this.y = this.normalizeYFunc(
      display.now,
      this.startTimestamp,
      this.startTimestamp + this.ms,
      this.prevY,
      this.nextY
    );
    this.scale = this.normalizeScaleFunc(
      display.now,
      this.startTimestamp,
      this.startTimestamp + this.ms,
      this.prevScale,
      this.nextScale
    );
    if (display.now > this.startTimestamp + this.ms) {
      if (!this.sticky) {
        this.isDone = true;
        this.onComplete();
      }
    }
  }
}

export default Transform;
