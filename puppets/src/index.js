import { render } from 'react-dom';
import { createElement } from 'react';
import { Provider } from 'react-redux';
import store from './store';

import MainContainer from './cmpts/main-container';
import {
  getSound,
  loadSounds,
  getSoundList,
  selectSound,
  setSoundCursorPercentage,
  getSoundPlaybackPercentage,
} from './content/sounds';
import {
  loadImages,
  getSpriteList,
  selectSprite,
  getRenderables,
} from './content/images';
import { loadCadences } from './content/cadence';
import { localStore, urlToSoundName } from './utils';

async function init() {
  await loadSounds();
  await loadImages();
  await loadCadences();

  const state = global.store.getState();
  if (state.sound.soundName === '') {
    let soundUrl = localStore('soundUrl');
    if (soundUrl) {
      let soundName = urlToSoundName(soundUrl);
      try {
        selectSound(soundName, soundUrl);
      } catch (e) {
        const sounds = getSoundList();
        if (sounds.length) {
          soundUrl = sounds[0];
          soundName = urlToSoundName(soundUrl);
          selectSound(soundName, soundUrl);
        }
      }
    } else {
      const sounds = getSoundList();
      if (sounds.length) {
        soundUrl = sounds[0];
        let soundName = urlToSoundName(soundUrl);
        selectSound(soundName, soundUrl);
      }
    }
  }
  if (state.sprite.spriteId === '') {
    const s = localStore('spriteId');
    if (s) {
      try {
        selectSprite(s);
      } catch (e) {
        const sprites = getSpriteList();
        if (sprites.length) {
          selectSprite(sprites[0].spriteId);
        }
      }
    } else {
      const sprites = getSpriteList();
      if (sprites.length) {
        selectSprite(sprites[0].spriteId);
      }
    }
  }
}

async function loop() {
  const {
    sound: { soundName, soundUrl, isPlaying },
  } = store.getState();
  if (isPlaying) {
    const soundObj = await getSound(soundName, soundUrl);
    setSoundCursorPercentage(getSoundPlaybackPercentage(soundObj));
  }
  const renderables = getRenderables();
  renderables.forEach(({ cb }) => {
    cb();
  });
  window.requestAnimationFrame(loop);
}

const div = document.createElement('div');
document.body.append(div);
async function main() {
  await init();
  render(
    createElement(
      Provider,
      {
        store,
      },
      createElement(MainContainer)
    ),
    div
  );
  window.requestAnimationFrame(loop);
}
main().catch(e => {
  console.error(e);
});
