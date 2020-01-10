import Animation from 'display/Animation';
import AssetLoader from 'display/AssetLoader';
import { normalize, randomId } from 'utils';

const display = {
  canvases: [],
  canvas: null,
  ctx: null,
  canvasId: 'canvas',
  loading: false,
  loaded: false,
  resources: [],
  pictures: {},
  sprites: {},
  sounds: {},
  animations: {},
  objects: {},
  screens: {},
  cadenceSprites: {},
  frame: 0,
  width: 256,
  height: 256,
  assets_loaded: 0,
  assets_loading: 0,
  isPaused: false,
  isBlurred: false,
  lastFocusTimestamp: 0,
  timePausedMs: 0,
  now: 0,
  nowTotal: 0,
  error: false,
  timeouts: {},
  transform: {
    x: 0,
    y: 0,
  },
};

// window.addEventListener('focus', () => {
//   display.unpause();
// });

// window.addEventListener('blur', () => {
//   display.pause();
// });

class Sprite {
  constructor(img_name, clip_x, clip_y, clip_w, clip_h) {
    this.img = img_name;
    this.clip_x = clip_x;
    this.clip_y = clip_y;
    this.clip_w = clip_w;
    this.clip_h = clip_h;
  }
}

display.pause = function() {
  if (!display.isPaused) {
    display.isPaused = true;
    display.pauseStartTimestamp = window.performance.now();
  }
};

display.unpause = function() {
  if (display.isPaused) {
    display.isPaused = false;
    display.timePausedMs += window.performance.now() - display.pauseStartTimestamp;
    display.setLoop(display.loopCb);
  }
};

display.setTransform = function(x, y) {
  display.transform.x = x;
  display.transform.y = y;
};

display.createFadeAnimation = function(sprite, nframes, is_fade_out) {
  const a = new Animation('fade', false);
  for (let i = 0; i < nframes - 1; i++) {
    if (is_fade_out) {
      a.addSprite(sprite, nframes * 16, normalize(i, 0, nframes, 1.0, 0.0));
    } else {
      a.addSprite(sprite, nframes * 16, normalize(i, 0, nframes, 0.0, 1.0));
    }
  }

  if (is_fade_out) {
    a.addSprite(sprite, 16, 0.0);
  } else {
    a.addSprite(sprite, 16);
  }
  return a;
};

display.loadPicture = async function(name, url) {
  return new Promise(resolve => {
    const cbs = display.pictures[name];

    if (Array.isArray(cbs)) {
      cbs.push(() => {
        resolve(display.pictures[name]);
      });
      return;
    } else if (typeof cbs === 'object') {
      resolve(display.pictures[name]);
      return;
    }

    display.pictures[name] = [];
    const img = new global.Image();
    img.onload = () => {
      display.sprites[name] = new Sprite(name, 0, 0, img.width, img.height);
      display.createAnimationFromPicture(name);
      const cbs = display.pictures[name];
      display.pictures[name] = img;
      cbs.forEach(cb => cb());
      resolve(img);
    };
    img.src = url;
  });
};

display.loadSound = async function(name, url) {
  return new Promise((resolve, reject) => {
    const sound = new Audio(url + '.wav');
    sound.autoplay = false;
    sound.oncanplay = () => {
      sound.oncanplay = null;
      sound.currentTime = 99999999999;
      const soundDuration = sound.currentTime;
      sound.currentTime = 0;
      sound.onended = function() {
        sound.pause();
        sound.currentTime = 0;
      };
      display.sounds[name] = {
        sound,
        audio: sound,
        soundDuration,
      };
      resolve(sound);
    };
    sound.addEventListener('error', e => {
      reject(e);
    });
    sound.src = url;
  });
};

display.getSound = function(name) {
  const soundObj = display.sounds[name];
  if (!soundObj) {
    console.warn(`[Display] No sound exists with name ${name}`);
    return null;
  }
  const s = {
    ...soundObj,
    //soundDuration merged in from soundObj
    audio: soundObj.audio.cloneNode(),
    soundName: name,
    duration: 0,
    isPlaying: false,
    isPaused: false,
  };
  s.sound = s.audio;
  return s;
};

display.playSound = function(soundObj) {
  if (!soundObj) {
    console.warn('[Display] No soundObj given');
    return;
  }
  const { sound } = soundObj;
  sound.play();
  soundObj.lastStartTimestamp = display.now;
  soundObj.isPlaying = true;
};

display.stopSound = function(soundObj) {
  const { sound } = soundObj;
  sound.pause();
  sound.currentTime = 0;
  soundObj.isPlaying = false;
};

display.addCadenceSprite = function(name, spriteName) {
  display.cadenceSprites[name] = spriteName;
};

display.getCadenceSprite = function(name) {
  return display.cadenceSprites[name];
};

display.createSprite = function(name, pic, x, y, w, h) {
  if (!display.sprites[name]) {
    display.sprites[name] = new Sprite(pic, x, y, w, h);
  }
};

display.createAnimation = function(name, cb) {
  display.animations[name] = cb;
};

display.createAnimationFromPicture = function(name) {
  display.createAnimation(name, () => {
    const a = new Animation(false);
    a.addSprite({ name: name, duration: 100 });
    return a;
  });
};

display.setError = function() {
  display.error = true;
};

display.setTimeout = function(cb, ms) {
  const id = randomId(7);
  display.timeouts[id] = {
    cb,
    timeStart: display.now_ms,
    ms,
  };
  return id;
};

display.clearTimeout = function(id) {
  delete display.timeouts[id];
};

display.getCurrentTime = function() {
  return {
    delta_t_ms: Math.min(display.delta_t_ms, 100),
    now: display.now,
  };
};

display.setLoop = function(cb) {
  let then = 0;
  this.loopCb = cb;
  this.now_ms = window.performance.now();
  this.now = this.now_ms * 0.001;
  const _loop = () => {
    if (display.isPaused) {
      return;
    }
    let now = window.performance.now();

    display.delta_t_ms = now - display.now_ms;
    display.now = display.now_ms = now - display.timePausedMs;
    now *= 0.001;
    display.delta_t = now - then;
    then = now;
    display.frame = (display.frame + 1) % 1024;

    const toDelete = [];
    for (let i in display.timeouts) {
      const { cb: cbTimeout, timeStart, ms: msTimeout } = display.timeouts[i];
      if (this.now_ms - timeStart >= msTimeout) {
        cbTimeout();
        toDelete.push(i);
      }
    }
    toDelete.forEach(id => display.clearTimeout(id));

    cb();
    if (!display.error) {
      window.requestAnimationFrame(_loop);
    }
  };
  window.requestAnimationFrame(_loop);
};

display.getCtx = function() {
  return display.canvas.getContext('2d');
};

display.setCanvas = function(canvas) {
  display.canvasId = canvas.id;
  display.canvas = canvas;
  display.ctx = canvas.getContext('2d');
  display.ctx.mozImageSmoothingEnabled = false;
  display.ctx.webkitImageSmoothingEnabled = false;
  display.ctx.imageSmoothingEnabled = false;
};

display.pushCanvas = function(canvas) {
  display.canvases.push(display.canvas);
  display.setCanvas(canvas);
};

display.popCanvas = function() {
  if (display.canvases.length) {
    const canvas = display.canvases.shift();
    display.setCanvas(canvas);
  }
};

display.getSprite = function(k) {
  if (display.sprites[k]) {
    return display.sprites[k];
  } else {
    console.error('[DISPLAY] No sprite named: ', k);
    display.setError();
    return null;
  }
};

display.getAnimation = function(k, t) {
  let key = k;
  if (t) {
    key = k + '_' + t;
  }

  if (display.animations[key]) {
    return display.animations[key]();
  } else {
    console.error('[DISPLAY] No animation named: ', key);
    display.setError();
    return null;
  }
};

display.getAnimationMs = function(k) {
  const anim = this.getAnimation(k);
  return anim.totalDurationMs;
};

display.animExists = function(k, t) {
  let key = k;
  if (t) {
    key = k + '_' + t;
  }
  if (display.animations[key]) {
    return true;
  } else {
    return false;
  }
};

display.clearScreen = function() {
  const ctx = display.getCtx();
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
};

display.drawLine = function(x1, y1, x2, y2, color) {
  const ctx = display.getCtx();
  ctx.lineWidth = 2;
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
};

display.drawRect = function(x, y, w, h, color) {
  const ctx = display.getCtx();
  ctx.lineWidth = 2;
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
};

display.drawRectOutline = function(x, y, w, h, color, line_width) {
  const ctx = display.getCtx();
  ctx.lineWidth = line_width || 2;
  ctx.strokeStyle = color;
  ctx.strokeRect(x, y, w, h);
};

display.drawCircleOutline = function(x, y, r, color) {
  const ctx = display.getCtx();
  ctx.lineWidth = 3;
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, 2 * Math.PI);
  ctx.stroke();
};

display.drawSprite = function(sprite, x, y, params) {
  const ctx = display.getCtx();
  let s = null;
  let img = null;
  let { width, height, centered, bottom, rotation, opacity, scale } = params || {};
  if (typeof sprite === 'string') {
    s = display.getSprite(sprite);
  } else {
    s = true;
    img = sprite;
  }
  if (s) {
    ctx.save();
    if (opacity !== undefined) {
      ctx.globalAlpha = params.opacity;
    }
    let w = width ? width * s.clip_w : s.clip_w;
    let h = height ? height * s.clip_h : s.clip_h;
    if (scale !== undefined) {
      w = s.clip_w * scale;
      h = s.clip_h * scale;
    }
    if (rotation !== undefined) {
      centered = false;
      x -= w / 2;
      y -= w / 2;
      ctx.translate(x, y);
      ctx.translate(w / 2, h / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      x = -w / 2;
      y = -h / 2;
    }

    if (s !== true) {
      img = display.pictures[s.img];

      let _x = Math.round(x);
      let _y = Math.round(y);
      if (centered) {
        _x = Math.round(x - w / 2);
        _y = Math.round(y - h / 2);
      } else if (bottom) {
        _x = Math.round(x - w / 2);
        _y = Math.round(y - h);
      }

      _x += display.transform.x;
      _y += display.transform.y;

      ctx.drawImage(
        img,
        s.clip_x,
        s.clip_y,
        s.clip_w,
        s.clip_h,
        _x,
        _y,
        Math.round(w),
        Math.round(h)
      );
    } else {
      ctx.drawImage(img, x, y);
    }
    ctx.restore();
  }
};

display.measureText = function({ text, font, size }) {
  const ctx = display.getCtx();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'hanging';
  size = size || 16;
  font = font || 'monospace';
  ctx.font = size + 'px ' + font;
  var width = ctx.measureText(text).width;
  var height = size;
  return {
    width,
    height,
  };
};

display.wrapText = function({ text, font, size, maxWidth, lineHeight }) {
  const ret = [];
  const split_text = text.split(' ');
  const t = display.measureText({
    text: text,
    font: font,
    size: size,
  });
  lineHeight = lineHeight || t.height;
  let current_text = '';
  while (split_text.length) {
    const next_text = split_text.shift();
    const check_text = current_text + (current_text ? ' ' : '') + next_text;
    const t = display.measureText({
      text: check_text,
      font,
      size,
    });
    if (t.width > maxWidth) {
      ret.push(current_text);
      current_text = next_text;
    } else {
      current_text = check_text;
    }
  }
  if (current_text) {
    ret.push(current_text);
  }
  let width = -1;
  for (let i = 0; i < ret.length; i++) {
    const t = display.measureText({
      text: ret[i],
      font,
      size,
    });
    if (t.width > width) {
      width = t.width;
    }
  }
  return {
    lines: ret,
    width,
    height: ret.length * lineHeight,
  };
};

display.drawTextWrapped = function(text, x, y, maxWidth, params) {
  let { backgroundColor, backgroundPadding } = params || {};
  backgroundPadding = backgroundPadding === 'undefined' ? 1 : backgroundPadding;
  const obj = display.wrapText(
    { text, maxWidth, font: params.font, size: params.size },
    2
  );
  const size = params.size || 16;
  const lineHeight = params.lineHeight || size + 2;
  const height = lineHeight * obj.lines.length + backgroundPadding * 2;

  if (params.keepOnScreen) {
    const newWidth = backgroundPadding * 2 + obj.width;
    let newX = x;
    let newY = y;
    if (params.centered) {
      newX = x - obj.width / 2;
    }
    if (params.offsetByLines) {
      newY = y - height;
    }

    if (newX < 0) {
      x = params.centered ? obj.width / 2 : 0;
    } else if (newX + newWidth > window.innerWidth) {
      x = window.innerWidth - newWidth;
    }

    if (newY < 0) {
      newY = params.offsetByLines ? height : 0;
    }
  }

  if (backgroundColor) {
    const w = obj.width + backgroundPadding * 4;
    const h = height;
    display.drawRect(
      x - backgroundPadding - w / 2,
      y - backgroundPadding - (params.offsetByLines ? h : 0),
      w,
      h,
      backgroundColor
    );
  }

  obj.lines.forEach((line, i) => {
    if (params.offsetByLines) {
      display.drawText(
        line,
        x,
        y - lineHeight * obj.lines.length + i * lineHeight,
        params
      );
    } else {
      display.drawText(line, x, y + i * lineHeight, params);
    }
  });
};

display.drawText = function(text, x, y, params) {
  const ctx = display.getCtx();
  const opacity = params.opacity;
  ctx.save();
  if (opacity !== undefined) {
    ctx.globalAlpha = params.opacity;
  }
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  let { font, size, color, outlineColor, outlineSize, fontStyle } = params || {};
  ctx.font =
    (fontStyle ? fontStyle + ' ' : '') + (size || 16) + 'px ' + (font || 'monospace');
  ctx.fillStyle = color || 'white';

  if (params.centered) {
    const t = display.measureText({
      text: text,
      font: font,
      size: size,
    });
    x -= t.width / 2;
  }

  ctx.fillText(text, x, y);
  if (params.outline) {
    ctx.lineWidth = outlineSize || 3;
    ctx.strokeStyle = outlineColor || ctx.fillStyle;
    ctx.strokeText(text, x, y);
  }
  ctx.restore();
};

display.drawAnim = function(anim, x, y, params) {
  const spriteName = anim.getSprite();
  display.drawSprite(spriteName, x, y, params);
  anim.update();
};
display.drawAnimation = display.drawAnim;

display.saveScreenToSprite = function(spriteName) {
  const canvas = document.createElement('canvas');
  canvas.width = display.width;
  canvas.height = display.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(display.canvas, 0, 0);
  display.createSprite(spriteName, canvas, 0, 0, canvas.width, canvas.height);
};

display.resize = function(width, height) {
  display.width = width;
  display.height = height;
  const ctx = display.getCtx();
  ctx.canvas.width = width;
  ctx.canvas.height = height;
  display.setCanvas(ctx.canvas);
};

display.init = async function(canvasId) {
  if (display.loaded) {
    console.warn('[DISPLAY] already loaded!');
    return;
  }
  if (display.loading) {
    console.warn('[DISPLAY] already loading...');
    return;
  }
  if (canvasId) {
    display.canvasId = canvasId;
  }

  display.loading = true;
  display.setCanvas(
    document.getElementById(display.canvasId) || document.createElement('canvas')
  );
  display.width = display.canvas.width;
  display.height = display.canvas.height;

  const l = new AssetLoader();
  await l.loadAssets();
  display.resize(window.innerWidth, window.innerHeight);
  console.log('[DISPLAY] successfully loaded.');
  display.loading = false;
};

global.display = display;

export default display;
