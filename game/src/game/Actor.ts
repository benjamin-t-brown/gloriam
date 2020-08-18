import display from 'display/Display';
import { colors } from 'theme';
import { getElem, elemExists } from 'db';
import Room from './Room';
import { HEADING } from 'utils';

class Actor {
  controller: any;
  room: Room;
  battle: any;
  spriteBase: string;
  shouldAnimUseHeading: boolean;
  name: string;
  subtitleText: string;
  subtitleTextColor: string;
  subtitleSound: any | null;
  cadence: any;
  cadenceSprites: any;
  scale: number;
  baseScale: number;
  x: number;
  y: number;
  width: number;
  height: number;
  transform: any;
  renderX: number;
  renderY: number;
  shouldRemove: boolean;
  animationState: string;
  animationName: string;
  animations: { [key: string]: any };
  heading: HEADING;
  angle: number;
  savedHeading: HEADING;
  savedAngle: number;

  constructor(controller: any, spriteBase: string) {
    this.controller = controller;
    this.room = controller;
    this.battle = controller;
    this.spriteBase = spriteBase;
    this.shouldAnimUseHeading = false;
    this.name = spriteBase;
    this.subtitleText = '';
    this.subtitleTextColor = colors.white;
    this.subtitleSound = null;
    this.cadence = null;
    this.cadenceSprites = {};

    this.baseScale = this.controller.baseScale;
    this.scale = this.baseScale;

    this.x = 0;
    this.y = 0;
    this.width = this.controller.baseSize;
    this.height = this.controller.baseSize;

    this.transform = null;
    this.renderX = 0;
    this.renderY = 0;
    this.shouldRemove = false;

    this.animationState = '';
    this.animationName = '';
    this.animations = {};

    this.heading = HEADING.DOWN;
    this.savedHeading = HEADING.DOWN;
    this.angle = 180;
    this.savedAngle = 0;

    if (this.spriteBase) {
      this.setAnimationState();
    }
  }

  remove() {
    this.shouldRemove = true;
  }

  setBaseScale(s: number) {
    this.scale = s + (this.scale - this.baseScale);
    this.baseScale = s;
  }
  setScale(s: number) {
    this.scale = s;
  }
  setAt(x?: number, y?: number) {
    if (x !== undefined || x !== null) {
      this.x = x || 0;
    }
    if (y !== undefined || y !== null) {
      this.y = y || 0;
    }
  }
  setHeading(h: HEADING) {
    this.heading = h;
  }

  setAnimation(animName: string) {
    if (!this.animations[animName]) {
      if (display.animExists(animName)) {
        this.animations[animName] = display.getAnimation(animName);
      } else {
        console.warn(
          `Actor ${this.name} does not have corresponding animation for anim=${animName}, not changing state.`
        );
        return false;
      }
    }
    if (this.animationName !== animName) {
      this.animations[animName].reset();
      this.animations[animName].start();
      this.animationName = animName;
    }
    return true;
  }

  setAnimationState(stateName?: string) {
    if (stateName && stateName !== 'default') {
      if (this.setAnimation(this.spriteBase + '_' + stateName)) {
        this.animationState = stateName;
      }
    } else {
      if (this.setAnimation(this.spriteBase)) {
        this.animationState = '';
      }
    }
  }

  getCadenceSprites() {
    let cadenceBase = this.spriteBase;
    if (this.animationState && this.animationState !== 'default') {
      cadenceBase += '_' + this.animationState;
    }
    if (this.shouldAnimUseHeading) {
      cadenceBase += '_' + this.heading;
    } else {
      cadenceBase = this.animationName;
    }
    cadenceBase += '_cad';
    const desiredSprites = display.getCadenceSprites(cadenceBase);
    if (desiredSprites) {
      return desiredSprites;
    }

    const defaultSprite = this.spriteBase + '_0';
    return [defaultSprite, defaultSprite, defaultSprite];
  }

  setTransform(transform: any) {
    this.transform = transform;
    this.transform.start();
    if (transform.animState) {
      this.setAnimationState(transform.animState);
    }
  }

  getCurrentAnimation() {
    return this.animations[this.animationName];
  }

  getRenderLocation() {
    return {
      x: this.renderX,
      y: this.renderY,
    };
  }

  getBottomYRenderLocation() {
    return this.renderY + (this.height * this.scale) / 2;
  }

  getCollisionCircle() {
    return {
      x: this.x,
      y: this.getBottomYRenderLocation(),
      r: 5,
    };
  }

  getSize() {
    return {
      width: this.width * this.scale,
      height: this.height * this.scale,
    };
  }

  sayDialogue(text: string, soundName: string) {
    this.subtitleText = text;
    if (soundName) {
      if (elemExists('cadences', soundName)) {
        this.cadence = getElem('cadences', soundName);
      }

      this.subtitleSound = display.getSound(soundName);
      display.playSound(this.subtitleSound);
    }
  }

  stopDialogue() {
    this.subtitleText = '';
    this.cadence = null;
    if (this.subtitleSound) {
      display.stopSound(this.subtitleSound);
      this.subtitleSound = null;
    }
  }

  saveHeading() {
    this.savedHeading = this.heading;
    this.savedAngle = this.angle;
  }

  restoreHeading() {
    this.setHeading(this.savedHeading);
    this.angle = this.savedAngle;
  }

  setRenderLocation() {
    this.renderX = this.x * this.scale;
    this.renderY = this.y * this.scale;
  }

  update() {
    this.setRenderLocation();
  }

  draw() {
    if (this.subtitleSound && this.cadence) {
      const { audio } = this.subtitleSound;
      const cadence = this.cadence;
      const i = cadence.getAnimIndex(audio.currentTime);
      const sprites = this.getCadenceSprites();
      display.drawSprite(sprites[i], this.renderX, this.renderY, {
        centered: true,
        scale: this.scale,
      });
    } else if (this.spriteBase) {
      display.drawAnimation(
        this.getCurrentAnimation(),
        this.renderX,
        this.renderY,
        {
          centered: true,
          scale: this.scale,
        }
      );
    }
  }
}

export default Actor;
