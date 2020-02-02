import Actor, { HEADINGS } from 'main/Actor';
import display from 'display/Display';
import { getAngleTowards, circleCollides, pt } from 'utils';
import { isInWall } from '../pathfinding';
import theme from 'main/theme';

class RoomActor extends Actor {
  constructor(room, template, camera, props) {
    super(room, template.spriteBase || '');
    const { heading } = props || {};
    const { name, width, height } = template;
    this.camera = camera;

    this.shouldAnimUseHeading = !!heading;
    this.heading = HEADINGS.DOWN;
    this.name = name;
    this.width = width || room.baseSize;
    this.height = height || room.baseSize;
    this.walkPath = null;
    this.walkSpeedX = 100; // pixels per second
    this.walkSpeedY = 55;
    this.walkRadius = 2;
    this.angle = 180;
    this.rotateSpeed = 600; // degrees per second
    this.nextRotationPoint = null;
    this.isRotating = false;
    this.onWalkComplete = () => {};
    this.onRotateComplete = () => {};
    this.animationState = null;
    this.subtitleTextColor = template.textColor || theme.palette.white;

    this.setAnimationState(); // sets default animation
  }

  setAngle(angle) {
    if (angle < 0) {
      angle = angle + 360;
    } else if (angle > 360) {
      angle = angle - 360;
    }
    this.angle = angle;
  }

  setHeadingFromAngle(angle) {
    if ((angle >= 0 && angle < 45) || angle > 315) {
      this.heading = HEADINGS.UP;
    } else if (angle >= 45 && angle < 135) {
      this.heading = HEADINGS.RIGHT;
    } else if (angle >= 135 && angle < 225) {
      this.heading = HEADINGS.DOWN;
    } else {
      this.heading = HEADINGS.LEFT;
    }
    this.setAnimationState(this.animationState);
    return angle;
  }

  setHeading(h) {
    super.setHeading(h);
    switch (h) {
      case HEADINGS.UP:
        this.setAngle(0);
        break;
      case HEADINGS.DOWN:
        this.setAngle(180);
        break;
      case HEADINGS.RIGHT:
        this.setAngle(90);
        break;
      case HEADINGS.LEFT:
        this.setAngle(270);
        break;
      default:
        this.setAngle(180);
    }
    this.setAnimationState(this.animationState);
  }

  turn(direction, targetAngle) {
    const { delta_t_ms } = display.getCurrentTime();
    const rotateSpeedPerMS = this.rotateSpeed / 1000;
    const vr = rotateSpeedPerMS * delta_t_ms;
    let isAtTarget = false;
    let newAngle = 0;
    if (direction === 'l') {
      newAngle = this.angle - vr;
      if (newAngle <= targetAngle) {
        this.setAngle(targetAngle);
        this.isAtTarget = true;
      } else {
        this.setAngle(newAngle);
      }
    } else {
      this.setAngle(this.angle + vr);
      if (this.angle >= targetAngle) {
        this.setAngle(targetAngle);
        this.isAtTarget = true;
      }
    }
    this.setHeadingFromAngle(this.angle);
    return isAtTarget;
  }

  turnTowards(position) {
    const h = getAngleTowards(this.getWalkPosition(), position);
    let isAtTarget = false;

    if (this.angle <= h) {
      if (Math.abs(this.angle - h) < 180) {
        isAtTarget = this.turn('r', h);
      } else {
        isAtTarget = this.turn('l', h - 360);
      }
    } else {
      if (Math.abs(this.angle - h) < 180) {
        isAtTarget = this.turn('l', h);
      } else {
        isAtTarget = this.turn('r', h + 360);
      }
    }
    if (this.angle === h) {
      return true;
    }
    return isAtTarget;
  }

  setPositionToTurnTowards(position, onRotateComplete) {
    this.nextRotationPoint = position;
    this.isRotating = true;
    this.onRotateComplete = onRotateComplete || function() {};
  }

  setWalkPath(walkPath, onWalkComplete) {
    this.stopWalking(false);
    this.setHeadingFromAngle(this.angle);
    this.setPositionToTurnTowards(walkPath[0], () => {
      this.setAnimationState('walk');
      display.setTimeout(() => {
        this.walkPath = walkPath;
        this.onWalkComplete = onWalkComplete || function() {};
      }, 50);
    });
  }

  stopWalking(shouldCallOnWalkComplete) {
    if (shouldCallOnWalkComplete) {
      this.onWalkComplete();
    }
    this.walkPath = null;
    this.setAnimationState('default');
  }

  isWalking() {
    return !!this.walkPath;
  }

  isInWall() {
    return isInWall(this.getWalkPosition(), this.room.walls);
  }

  isAtWalkPosition(point) {
    const myRenderCoords = this.room.worldToRenderCoords(this.getWalkPosition());
    const ptRenderCoords = this.room.worldToRenderCoords(point);
    display.drawCircleOutline(
      myRenderCoords.x,
      myRenderCoords.y,
      this.walkRadius * this.scale,
      'lightblue'
    );
    display.drawCircleOutline(
      ptRenderCoords.x,
      ptRenderCoords.y,
      this.walkRadius * this.scale,
      'lightred'
    );

    return circleCollides(
      {
        ...myRenderCoords,
        r: this.walkRadius,
      },
      { ...ptRenderCoords, r: this.walkRadius * this.scale }
    );
  }

  setAtWalkPosition(point) {
    this.x = point.x;
    this.y = point.y - this.height / 3;
  }

  getWalkPosition() {
    return pt(this.x, this.y + this.height / 3);
  }

  setAnimationState(stateName, useHeading) {
    let changed = false;

    if (useHeading !== undefined) {
      this.shouldAnimUseHeading = !!useHeading;
    }
    if (stateName && stateName !== 'default') {
      if (this.shouldAnimUseHeading) {
        changed = this.setAnimation(
          this.spriteBase + '_' + stateName + '_' + this.heading
        );
      } else {
        changed = this.setAnimation(this.spriteBase + '_' + stateName);
      }
    } else {
      if (this.shouldAnimUseHeading) {
        changed = this.setAnimation(this.spriteBase + '_' + this.heading);
      } else {
        changed = this.setAnimation(this.spriteBase);
      }
    }
    if (changed) {
      this.animationState = stateName;
    }
  }

  lookAt(position) {
    const angle = getAngleTowards(this.getWalkPosition(), position);
    this.setAngle(angle);
    this.setHeadingFromAngle(angle);
    return angle;
  }

  setRenderLocation() {
    const { width: stageWidth, height: stageHeight } = this.controller;
    this.renderX =
      this.x * this.scale + display.width / 2 - (stageWidth * this.scale) / 2;
    this.renderY =
      this.y * this.scale + display.height / 2 - (stageHeight * this.scale) / 2;
  }

  update() {
    if (this.walkPath && this.walkPath.length) {
      const firstPoint = this.walkPath[0];
      const angle = (this.lookAt(firstPoint) * Math.PI) / 180;
      const walkSpeedPerMSX = this.walkSpeedX / 1000;
      const walkSpeedPerMSY = this.walkSpeedY / 1000;
      const { delta_t_ms } = display.getCurrentTime();
      const vX = Math.sin(angle) * walkSpeedPerMSX * delta_t_ms;
      const vY = -Math.cos(angle) * walkSpeedPerMSY * delta_t_ms;
      this.x += vX;
      this.y += vY;
      if (this.isInWall()) {
        do {
          this.x -= vX;
          this.y -= vY;
        } while (this.isInWall());
        this.stopWalking(false);
      } else if (this.isAtWalkPosition(firstPoint, 2)) {
        this.setAtWalkPosition(firstPoint);
        this.walkPath.shift();
        if (!this.walkPath.length) {
          this.stopWalking(true);
        }
      }
    } else if (this.isRotating) {
      const isFinishedTurning = this.turnTowards(this.nextRotationPoint);
      if (isFinishedTurning) {
        this.isRotating = false;
        this.onRotateComplete();
        this.nextRotationPoint = null;
      }
    }
    this.setRenderLocation();
  }

  draw() {
    super.draw();

    const { x, y } = this.room.worldToRenderCoords(this.getWalkPosition());
    display.drawCircleOutline(x, y, this.walkRadius, 'lightgreen');
  }
}

export default RoomActor;
