import Actor from 'game/Actor';
import display from 'display/Display';
import {
  getAngleTowards,
  circleCollides,
  pt,
  Rect,
  Point,
  HEADING,
} from 'utils';
import { isInWall } from '../pathfinding';
import { colors } from 'theme';
import Camera from 'game/Camera';
import Room from 'game/Room';

import { RoomActorTemplate } from 'db/dbTypes';

export interface RoomActorDynamicProps {
  heading?: boolean;
  character?: any;
}
class RoomActor extends Actor {
  camera: Camera;
  isCharacter: boolean;
  isItem: boolean;
  isBackground: boolean;
  zOrdering: number;
  displayName: string;
  hitBox: Rect;
  walkPath: any;
  walkSpeedX: 100;
  walkSpeedY: 55;
  walkRadius: 2;
  isAtTarget: boolean;
  rotateSpeed: 600;
  nextRotationPoint: any;
  isRotating: boolean;
  onWalkComplete: () => void;
  onRotateComplete: () => void;
  talkTrigger: string | null;
  defaultTrigger: string | null;
  shouldDrawHitBox: boolean;

  constructor(
    room: Room,
    template: RoomActorTemplate,
    camera: Camera,
    props?: RoomActorDynamicProps
  ) {
    super(room, template.spriteBase || '');
    const { heading, character } = props || {};
    const {
      name,
      width,
      height,
      animName,
      displayName,
      hitBox,
      talkTrigger,
      defaultTrigger,
      defaultHeading,
      isBackground,
      zOrdering,
      useHeading,
    } = template;
    this.camera = camera;

    this.name = name || template.spriteBase || '';
    this.isCharacter = !!character;
    this.isItem = false;
    this.displayName = displayName || '';
    this.width = room.baseSize;
    this.height = room.baseSize;
    let setSizeBasedOnSprite = this.isCharacter ? false : true;
    if ((width as number) >= 0) {
      setSizeBasedOnSprite = false;
      this.width = width as number;
    }
    if ((height as number) >= 0) {
      setSizeBasedOnSprite = false;
      this.height = height as number;
    }
    if (setSizeBasedOnSprite && template.spriteBase) {
      const { width, height } = display.getSpriteSize(template.spriteBase);
      this.width = width;
      this.height = height;
    }

    this.hitBox = hitBox || {
      x: 0,
      y: 0,
      width: this.width,
      height: this.height,
    };
    this.isBackground = !!isBackground;
    this.zOrdering = zOrdering || 0;
    this.walkPath = null;
    this.walkSpeedX = 100; // pixels per second
    this.walkSpeedY = 55;
    this.walkRadius = 2;
    this.isAtTarget = true;
    this.angle = 180;
    this.rotateSpeed = 600; // degrees per second
    this.nextRotationPoint = null;
    this.isRotating = false;
    this.onWalkComplete = () => {};
    this.onRotateComplete = () => {};
    this.animationState = '';
    this.subtitleTextColor = template.textColor || colors.white;
    this.talkTrigger = talkTrigger || null;
    this.defaultTrigger = defaultTrigger || null;
    this.shouldAnimUseHeading =
      useHeading === undefined ? !!heading : useHeading;
    this.shouldDrawHitBox = true;
    if (animName) {
      this.setAnimation(animName);
    } else {
      this.setAnimationState(); // sets default animation from spriteBase
      this.setHeading(defaultHeading || HEADING.DOWN);
    }
  }

  setAngle(angle: number) {
    if (angle < 0) {
      angle = angle + 360;
    } else if (angle > 360) {
      angle = angle - 360;
    }
    this.angle = angle;
  }

  setHeadingFromAngle(angle: number) {
    if ((angle >= 0 && angle < 45) || angle > 315) {
      this.heading = HEADING.UP;
    } else if (angle >= 45 && angle < 135) {
      this.heading = HEADING.RIGHT;
    } else if (angle >= 135 && angle < 225) {
      this.heading = HEADING.DOWN;
    } else {
      this.heading = HEADING.LEFT;
    }
    this.setAnimationState(this.animationState);
    return angle;
  }

  setHeading(h: HEADING) {
    super.setHeading(h);
    switch (h) {
      case HEADING.UP:
        this.setAngle(0);
        break;
      case HEADING.DOWN:
        this.setAngle(180);
        break;
      case HEADING.RIGHT:
        this.setAngle(90);
        break;
      case HEADING.LEFT:
        this.setAngle(270);
        break;
      default:
        this.setAngle(180);
    }
    this.setAnimationState(this.animationState);
  }

  turn(direction: HEADING, targetAngle: number) {
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

  turnTowards(position: Point) {
    const h = getAngleTowards(this.getWalkPosition(), position);
    let isAtTarget = false;

    if (this.angle <= h) {
      if (Math.abs(this.angle - h) < 180) {
        isAtTarget = this.turn(HEADING.RIGHT, h);
      } else {
        isAtTarget = this.turn(HEADING.LEFT, h - 360);
      }
    } else {
      if (Math.abs(this.angle - h) < 180) {
        isAtTarget = this.turn(HEADING.LEFT, h);
      } else {
        isAtTarget = this.turn(HEADING.RIGHT, h + 360);
      }
    }
    if (this.angle === h) {
      return true;
    }
    return isAtTarget;
  }

  setWalkPath(walkPath: any, onWalkComplete?: () => void) {
    this.stopWalking(false);
    this.setHeadingFromAngle(this.angle);
    this.setPositionToTurnTowards(walkPath[0], () => {
      this.setAnimationState('walk');
      display.setTimeout(() => {
        this.walkPath = walkPath;
        this.onWalkComplete = onWalkComplete || function () {};
      }, 50);
    });
  }

  stopWalking(shouldCallOnWalkComplete?: boolean) {
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

  isAtWalkPosition(point: Point) {
    const myRenderCoords = this.room.worldToRenderCoords(
      this.getWalkPosition()
    );
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

  setAtWalkPosition(point: Point) {
    this.x = point.x;
    this.y = point.y - this.height / 3;
  }

  getWalkPosition() {
    return pt(this.x, this.y + this.height / 3);
  }

  setAnimationState(stateName?: string, useHeading?: boolean) {
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
      this.animationState = stateName || '';
    }
    return this.getCurrentAnimation();
  }

  // not instant
  setPositionToTurnTowards(position: Point, onRotateComplete?: () => void) {
    this.nextRotationPoint = position;
    this.isRotating = true;
    this.onRotateComplete = onRotateComplete || function () {};
  }

  // instant
  lookAt(position: Point) {
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
      } else if (this.isAtWalkPosition(firstPoint)) {
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

    // DEBUG: draw circle at walk position
    const { x, y } = this.room.worldToRenderCoords(this.getWalkPosition());
    display.drawCircleOutline(x, y, this.walkRadius, 'lightgreen');

    if (this.shouldDrawHitBox) {
      const { width, height } = this.hitBox;
      const { x, y } = this.room.worldToRenderCoords(
        pt(this.x - width / 2, this.y - height / 2)
      );
      display.drawRectOutline(
        x,
        y,
        width * this.room.baseScale,
        height * this.room.baseScale,
        'white',
        2
      );
    }
  }
}

export default RoomActor;
