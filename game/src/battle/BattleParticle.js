import display from 'display/Display';

class BattleParticle {
  constructor(battleController, { animName, text, textParams, transform }) {
    this.battleController = battleController;
    this.animations = {};
    if (!transform) {
      throw new Error('Cannot create a BattleParticle without a transform!');
    }
    this.setTransform(transform);
    this.setAnimation(animName);
    this.renderX = 0;
    this.renderY = 0;
    this.text = text;
    this.textParams = textParams || {};
    this.shouldRemove = false;
  }

  setTransform(transform) {
    this.transform = transform;
    this.transform.start();
    if (transform.animState) {
      this.setAnimation(transform.animState);
    }
  }

  setAnimation(animName) {
    if (!animName) {
      return;
    }

    if (!this.animations[animName]) {
      if (display.animExists(animName)) {
        this.animations[animName] = display.getAnimation(animName);
      } else {
        console.warn(
          `BattleParticle ${this.name} does not have corresponding animation for animName=${animName}, using default.`
        );
        this.animations[animName] = display.getAnimation('defaultParticle');
      }
    }

    if (this.animName !== animName) {
      this.animations[animName].reset();
      this.animations[animName].start();
      this.animName = animName;
    }
  }

  getCurrentAnimation() {
    return this.animations[this.animName];
  }

  getBaseRenderPosition() {
    return {
      x: this.renderX,
      y: this.renderY,
    };
  }

  update() {
    this.transform.update(this.camera);
    const { x, y, scale } = this.transform.get();
    this.renderX = x;
    this.renderY = y;
    //this.scale = scale;
    if (this.transform.isDone) {
      this.shouldRemove = true;
    }
  }

  draw() {
    const anim = this.getCurrentAnimation();
    if (anim) {
      display.drawAnimation(this.getCurrentAnimation(), this.renderX, this.renderY, {
        centered: true,
        scale: this.battleController.baseScale,
      });
    }
    if (this.text) {
      display.drawText(this.text, this.renderX, this.renderY, this.textParams);
    }
  }
}

export default BattleParticle;
