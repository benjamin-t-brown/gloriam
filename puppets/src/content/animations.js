import { assignState, assignStatic, getStatic } from 'store';

class Animation {
  constructor(loop) {
    //this.name = name;
    this.loop = loop || false;
    this.sprites = [];

    this.currentFrame = 0;
    this.currentMaxFrames = 0;
    this.currentSpriteIndex = 0;
    this.done = false;
  }

  reset() {
    this.currentFrame = 0;
    this.currentSpriteIndex = 0;
  }

  addSprite({ name, nframes, offsetX, offsetY, opacity }) {
    this.sprites.push({
      spriteName: name,
      nframes,
      offsetX: offsetX || 0,
      offsetY: offsetY || 0,
      opacity,
    });
    if (this.sprites.length === 1) {
      this.currentMaxFrames = nframes;
    }
  }

  update() {
    this.currentFrame++;
    if (this.currentFrame >= this.currentMaxFrames) {
      this.currentSpriteIndex++;
      if (this.currentSpriteIndex >= this.sprites.length) {
        if (this.loop) {
          this.currentSpriteIndex = 0;
        } else {
          this.done = true;
          this.currentSpriteIndex--;
        }
      }
      this.currentFrame = 0;
      this.currentMaxFrames = this.sprites[this.currentSpriteIndex].nframes;
    }
  }

  getSprite() {
    return this.sprites[this.currentSpriteIndex];
  }

  getFramesLength() {
    return this.sprites.reduce((sum, s) => {
      return sum + s.nframes;
    }, 0);
  }

  isDone() {
    return this.done;
  }
}

export function createAnimation(animName, cb) {
  assignStatic('animations.' + animName, cb);
}

export function setZoom(zoom) {
  assignState('animation', null, {
    zoom,
  });
}

export function getAnimation(animName) {
  const ret = getStatic('animations.' + animName);
  if (!ret) {
    throw `Cannot get animation with name "${animName}", it does not exist.`;
  }
  return ret();
}

export async function loadAnimations() {
  // createAnimation(`${base}_${unitName}_idle`, () => {
  // 	const a = new Animation(true);
  // 	const fs = 10;
  // 	const spriteName = `${base}_${unitName}_idle`;
  // 	a.addSprite({
  // 		name: spriteName,
  // 		nframes: fs,
  // 	});
  // 	return a;
  // });
  console.log('loaded animations');
}
