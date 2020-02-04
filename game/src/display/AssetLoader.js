import display from './Display';
import Animation from './Animation';

const res = {};

// auto loads all the files in the 'res' directory that end in '.txt'
async function requireAll(r) {
  r.keys().forEach(async key => (res[key] = r(key)));
}
requireAll(require.context('./res/', true, /\.txt$/));

class AssetLoader {
  constructor() {
    this.isLoading = false;
  }

  isLoading() {
    return this.isLoading;
  }

  async processAssetFile(filename, text) {
    const sprite_cbs = [];

    const _Picture = async function(line) {
      const [_, pictureName, url, spriteWidth, spriteHeight] = line;
      const img = await display.loadPicture(pictureName, 'img/' + url);
      if (spriteWidth && spriteHeight) {
        const n = (img.width / spriteWidth) * (img.height / spriteHeight);
        _SpriteList([_, pictureName, n, spriteWidth, spriteHeight], pictureName, 0);
      }
      return img;
    };

    const _SpriteList = function(line, currentPicture, lastSpriteInd) {
      const sprite = display.getSprite(currentPicture);
      const sprite_pfx = line[1];
      const n = parseInt(line[2]) + lastSpriteInd;
      const w = parseInt(line[3]);
      const h = parseInt(line[4]);
      const num_x = sprite.clip_w / w;
      let ctr = 0;
      for (let i = lastSpriteInd; i < n; i++) {
        const spriteName = sprite_pfx + '_' + ctr;
        display.createSprite(
          spriteName,
          currentPicture,
          (i % num_x) * w,
          Math.floor(i / num_x) * h,
          w,
          h
        );
        ctr++;
      }
      lastSpriteInd = n;
    };

    const _Sprite = function(line, currentPicture) {
      const sprite_name = line[1];
      const x = parseInt(line[2]);
      const y = parseInt(line[3]);
      const w = parseInt(line[4]);
      const h = parseInt(line[5]);
      display.createSprite(sprite_name, currentPicture, x * w, y * h, w, h);
      display.createAnimationFromPicture(sprite_name);
    };

    const _Animation = function(line, currentAnim) {
      const animName = line[1];
      const loop = line[2];
      currentAnim.name = animName;
      currentAnim.loop = loop === 'true' ? true : false;
    };

    const _AnimSprite = function(line, currentAnim) {
      const spriteName = line[1];
      const ms = parseFloat(line[2]);

      currentAnim.sprites.push({
        name: spriteName,
        duration: ms,
      });
    };

    const _Cadence = function(line) {
      let [, cadenceName, spr1, spr2, spr3] = line;
      display.addCadenceSprites(cadenceName, spr1, spr2, spr3);
    };

    const res = (display.resources = text.split('\n'));
    let currentPicture = '';
    let currentAnim = null;
    let lastSpriteInd = 0;

    const _FinalizeCurrentAnimation = function() {
      display.createAnimation(
        currentAnim.name,
        function(currentAnim) {
          let a = new Animation(currentAnim.loop);
          currentAnim.sprites.forEach(obj => {
            a.addSprite({
              name: obj.name,
              duration: obj.duration,
              opacity: obj.opacity,
              offsetX: obj.offsetX,
              offsetY: obj.offsetY,
            });
          });
          return a;
        }.bind(this, currentAnim)
      );
    };

    for (let line of res) {
      line = line.split(',');
      const [type] = line;
      if (type === 'AnimSprite') {
        if (!currentAnim) {
          console.error(`Error reading '${filename}', AnimSprite without Anim`, line);
          throw new Error('display loading error');
        }
        _AnimSprite(line, currentAnim);
        continue;
      }

      if (currentAnim) {
        _FinalizeCurrentAnimation();
        currentAnim = null;
      }

      if (type === 'Picture') {
        currentPicture = line[1];
        lastSpriteInd = 0;
        await _Picture(line);
      } else if (type === 'SpriteList') {
        const n = parseInt(line[2]);
        sprite_cbs.push(_SpriteList.bind(display, line, currentPicture, lastSpriteInd));
        lastSpriteInd += n;
      } else if (type === 'Sprite') {
        sprite_cbs.push(_Sprite.bind(display, line, currentPicture));
      } else if (type === 'Animation') {
        currentAnim = {
          name: '',
          loop: true,
          sprites: [],
        };
        _Animation(line, currentAnim);
        continue;
      } else if (type === 'Cadence') {
        _Cadence(line);
      }
    }

    if (currentAnim) {
      _FinalizeCurrentAnimation();
    }

    sprite_cbs.forEach(f => {
      f();
    });
  }

  async loadAssets() {
    this.loading = true;
    await Promise.all(
      Object.keys(res).map(async filename => {
        await this.processAssetFile(filename, res[filename].default);
      })
    );

    this.loading = false;
  }
}

export default AssetLoader;
