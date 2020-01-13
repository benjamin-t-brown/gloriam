import display from 'display/Display';
import theme from 'main/theme';
import { getElem, elemExists } from 'db';

export const HEADINGS = {
  UP: 'u',
  DOWN: 'd',
  LEFT: 'l',
  RIGHT: 'r',
};

class Actor {
  constructor(controller, spriteBase) {
    this.controller = controller;
    this.room = controller;
    this.battle = controller;
    this.spriteBase = spriteBase;
    this.shouldAnimUseHeading = false;
    this.name = spriteBase;
    this.subtitleText = '';
    this.subtitleTextColor = theme.palette.white;
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
    this.animations = {};

    this.heading = HEADINGS.DOWN;
    this.angle = 180;
    this.savedHeading = 0;
    this.savedAngle = 0;

    if (this.spriteBase) {
      this.setAnimationState();
    }
  }

  remove() {
    this.shouldRemove = true;
  }

  setBaseScale(s) {
    this.scale = s + (this.scale - this.baseScale);
    this.baseScale = s;
  }
  setScale(s) {
    this.scale = s;
  }
  setAt(x, y) {
    if (x !== undefined || x !== null) {
      this.x = x;
    }
    if (y !== undefined || y !== null) {
      this.y = y;
    }
  }
  setHeading(h) {
    this.heading = h;
  }

  setAnimation(animName) {
    if (!this.animations[animName]) {
      if (display.animExists(animName)) {
        this.animations[animName] = display.getAnimation(animName);
      } else {
        console.warn(
          `Actor ${this.name} does not have corresponding animation for anim=${animName}, using default.`
        );
        animName = this.spriteBase;
        if (!this.animations[animName]) {
          throw new Error(`No default sprite could be found for ${animName}.`);
        }
      }
    }
    if (this.animationName !== animName) {
      this.animations[animName].reset();
      this.animations[animName].start();
      this.animationName = animName;
    }
  }

  setAnimationState(stateName) {
    if (stateName && stateName !== 'default') {
      this.setAnimation(this.spriteBase + '_' + stateName);
      this.animationState = stateName;
    } else {
      this.setAnimation(this.spriteBase);
      this.animationState = '';
    }
  }

  getCadenceSprites() {
    let cadenceBase = this.spriteBase;
    if (this.animationState) {
      cadenceBase += '_' + this.animationState;
    }
    if (this.shouldAnimUseHeading) {
      cadenceBase += '_' + this.heading;
    }
    const desiredSprites = display.getCadenceSprites(cadenceBase);
    if (desiredSprites) {
      return desiredSprites;
    }

    const defaultSprite = this.spriteBase + '_0';
    return [defaultSprite, defaultSprite, defaultSprite];
  }

  setTransform(transform) {
    this.transform = transform;
    this.transform.start();
    if (transform.animState) {
      this.setAnimationState(transform.animState);
    }
  }

  getCurrentAnimation() {
    return this.animations[this.animationName];
  }

  setRenderLocation() {
    this.renderX = this.x * this.scale;
    this.renderY = this.y * this.scale;
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

  sayDialogue(text, soundName) {
    this.subtitleText = text;
    if (soundName) {
      if (elemExists('cadences', soundName)) {
        this.cadence = getElem('cadences', soundName);
      } else {
        console.warn('Dialogue sound without cadence:', soundName);
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
      display.drawAnimation(this.getCurrentAnimation(), this.renderX, this.renderY, {
        centered: true,
        scale: this.scale,
      });
    }
  }
}

export default Actor;
