import { assignState, assignStatic, getStatic } from 'store';
import { localStore } from 'utils';

function createImage(imageName, img) {
  assignStatic(`images.${imageName}`, {
    imageName,
    img,
  });
}

function createSprite(name, imageName, x, y, w, h) {
  assignStatic(`sprites.${name}`, {
    imageName,
    spriteName: name,
    x,
    y,
    w,
    h,
  });
}

export function getSprite(spriteName) {
  const sprite = getStatic(`sprites.${spriteName}`);
  if (!sprite) {
    throw `cannot getSprite, no sprite exists with name "${spriteName}"`;
  }
  return sprite;
}

export function getSpriteList() {
  const spriteIds = getStatic('spriteIds');
  return Object.keys(spriteIds)
    .sort()
    .map(spriteName => {
      return spriteIds[spriteName];
    });
}

export function selectSprite(spriteId) {
  assignState('sprite', null, {
    spriteId,
  });
  localStore('spriteId', spriteId);
}

export function drawSpriteToCanvas(spriteName, canvas) {
  const sprite = getStatic(`sprites.${spriteName}`);
  if (!sprite) {
    throw `cannot drawSprite, no sprite exists with name "${spriteName}"`;
  }

  const { imageName, x, y, w, h } = sprite;
  const { img } = getStatic(`images.${imageName}`);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, x, y, w, h, 0, 0, canvas.width, canvas.height);
}

export function addRenderable(name, cb) {
  assignStatic(`renderables.${name}`, {
    name,
    cb,
  });
}

export function removeRenderable(name) {
  assignStatic(`renderables.${name}`, null);
}

export function getRenderables() {
  const renderables = getStatic(`renderables`);
  return Object.keys(renderables)
    .sort()
    .map(name => {
      return renderables[name];
    });
}

async function loadImage(imageName) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      console.log('Loaded image:', imageName);
      resolve(img);
    };
    img.src = imageName;
  });
}

export async function loadImages() {
  const tileSz = 64;
  const type = 'GET';
  const url = '/spritesheets';
  const opts = {
    method: 'GET',
    headers: {},
  };
  console.log('[fetch]', type, url);
  const data = await fetch(url, opts)
    .then(async function(response) {
      const json = await response.json();
      console.log('[fetch]', 'result', type, url, json);
      return json;
    })
    .catch(err => {
      throw err;
    });

  const callbacks = data.files.map(async fileName => {
    const imageElem = await loadImage(fileName);
    const id = fileName.slice(0, -4);
    createImage(id, imageElem);
    for (let i = 0; i < Math.min(imageElem.height / tileSz, 4); i++) {
      const spriteId = id + '_' + i;
      createSprite(spriteId + '_0', id, 0 * tileSz, i * tileSz, tileSz, tileSz);
      createSprite(spriteId + '_1', id, 1 * tileSz, i * tileSz, tileSz, tileSz);
      createSprite(spriteId + '_2', id, 2 * tileSz, i * tileSz, tileSz, tileSz);
      assignStatic(`spriteIds.${spriteId}`, {
        spriteId,
      });
    }
  });
  await Promise.all(callbacks);
}
