import { assignState, assignStatic, getStatic } from 'store';
import { normalize, localStore, urlToSoundName } from 'utils';

function createSound(soundUrl, audio) {
  const soundName = soundUrl.slice(0, soundUrl.lastIndexOf('.'));
  if (!audio) {
    assignStatic(`sounds.${soundName}`, { loading: true, callbacks: [] });
    return;
  } else {
    const s = getStatic(`sounds.${soundName}`);
    if (s) {
      s.callbacks.forEach(cb => cb());
    }
  }

  audio.currentTime = 99999999999;
  const soundDuration = audio.currentTime;
  audio.currentTime = 0;
  const sound = {
    soundUrl,
    soundName,
    soundDuration,
    audio,
    loading: false,
  };
  audio.onended = function() {
    stopSound(sound);
  };
  assignStatic(`sounds.${soundName}`, sound);
  return sound;
}

export function hasSound(soundName) {
  const sound = getStatic(`sounds.${soundName}`);
  if (sound) {
    return !sound.loading;
  } else {
    return false;
  }
}

export function isLoading(soundName) {
  const sound = getStatic(`sounds.${soundName}`);
  return sound && sound.loading;
}

async function loadSound(soundUrl) {
  return new Promise(resolve => {
    const soundName = urlToSoundName(soundUrl);
    const s = getStatic(`sounds.${soundName}`);
    if (s && s.loading) {
      s.cbs.push(() => {
        resolve(getStatic(`sounds.${soundName}`));
      });
      return;
    } else {
      createSound(soundUrl);
    }
    const sound = new Audio(soundUrl);
    sound.autoplay = false;
    sound.oncanplay = async () => {
      console.log('Loaded sound:', soundUrl);
      sound.oncanplay = null;
      const snd = createSound(soundUrl, sound);
      resolve(snd);
    };
    sound.src = soundUrl;
  });
}

export async function getSound(soundName, soundUrl) {
  let sound = getStatic(`sounds.${soundName}`);
  if (!sound) {
    sound = await loadSound(soundUrl);
  }
  return sound;
}

export function getSoundList() {
  return getStatic('soundList');
}

export function selectSound(soundName, soundUrl) {
  assignState('sound', null, {
    soundName,
    soundUrl,
    playbackCursorPosition: 0,
  });
  localStore('soundName', soundName);
  localStore('soundUrl', soundUrl);
}

export function getSoundPlaybackPercentage(soundObj) {
  const { soundDuration, audio } = soundObj;
  if (!audio) {
    return;
  }
  return normalize(audio.currentTime, 0, soundDuration, 0, 100);
}
export function setSoundCursorPercentage(percentage) {
  assignState('sound', null, {
    playbackCursorPosition: percentage,
  });
}
export function setSoundTimePercentage(soundObj, percentage) {
  const { audio, soundDuration } = soundObj;
  audio.currentTime = normalize(percentage, 0, 100, 0, soundDuration);
  setSoundCursorPercentage(percentage);
}

export function getSoundCurrentTime(soundObj) {
  const { audio } = soundObj;
  return audio.currentTime;
}

export function playSound(soundObj) {
  const { audio, soundName } = soundObj;
  audio.play();
  assignState('sound', null, {
    soundName: soundName,
    lastStartTimestamp: performance.now(),
    isPlaying: true,
    isPaused: false,
  });
}

export function pauseSound(soundObj) {
  const { audio } = soundObj;
  audio.pause();
  assignState('sound', null, {
    isPlaying: false,
    isPaused: true,
  });
}

export function stopSound(soundObj) {
  const { audio } = soundObj;
  audio.pause();
  audio.currentTime = 0;
  assignState('sound', null, {
    isPlaying: false,
    isPaused: false,
    playbackCursorPosition: 0,
  });
}

export function setEventOnSoundStop(soundObj, cb) {
  const { audio } = soundObj;
  audio.onended = function() {
    cb();
    stopSound(soundObj);
    audio.onended = function() {
      stopSound(soundObj);
    };
  };
}

export async function loadSounds() {
  const type = 'GET';
  const url = '/sounds';
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

  assignStatic(
    'soundList',
    data.files
      .map(fileName => {
        let [name, num] = fileName.split('-');
        let noNumber = true;
        let ext;
        if (num === undefined) {
          num = 0;
          ext = name.slice(-4);
          name = name.slice(0, -4);
        } else {
          ext = num.slice(-4);
          num = Number(num.slice(0, -4));
          noNumber = false;
        }
        const ret = {
          name,
          num,
          ext,
          noNumber,
        };
        return ret;
      })
      .sort((a, b) => {
        if (a.num === b.num) {
          return a.name < b.name ? -1 : 1;
        } else {
          return a.num < b.num ? -1 : 1;
        }
      })
      .map(({ name, num, ext, noNumber }) => {
        return noNumber ? name + ext : name + '-' + num + ext;
      })
  );
}
