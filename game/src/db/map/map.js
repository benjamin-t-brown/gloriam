import ScriptParser from './ScriptParser';
import RoomParser from './RoomParser';
import display from 'display/Display';
import { fetchAsync } from 'utils';
import tilesets from './tilesets.json';

const scriptFiles = {};
const mapFiles = {};

const SOUND_EXTENSION = '.mp3';

async function requireAll(r, obj) {
  r.keys().forEach(async key => (obj[key] = r(key)));
}
requireAll(require.context('./scripts', true, /\.rpgscript$/), scriptFiles);
requireAll(require.context('./rooms', true, /\.json$/), mapFiles);

let rooms = {};
let triggers = {};
let scripts = {};

export async function loadMapElements(db, scene) {
  let soundsToLoad = [];
  for (let scriptFileName in scriptFiles) {
    const text = scriptFiles[scriptFileName].default;
    const parser = new ScriptParser(scriptFileName);
    const { triggers: localTriggers, scripts: localScripts } = parser.parse(text, scene);
    triggers = { ...triggers, ...localTriggers };
    scripts = { ...scripts, ...localScripts };
    soundsToLoad = soundsToLoad.concat(parser.soundsToLoad);
  }

  for (let mapFileName in mapFiles) {
    const json = mapFiles[mapFileName];
    const parser = new RoomParser(mapFileName.slice(2, -5), tilesets);
    const localRooms = parser.parse(json, db);
    rooms = { ...rooms, ...localRooms };
  }

  const soundLoadErrors = [];
  if (scene.voiceEnabled) {
    const sounds = JSON.parse(await fetchAsync(`${global.SOUND_PATH || ''}sounds.json`));

    for (let i = 0; i < soundsToLoad.length; i++) {
      const { soundNameCh: soundName } = soundsToLoad[i];
      const soundUrl = soundName + SOUND_EXTENSION;
      if (sounds[soundUrl]) {
        await display.loadSound(soundName, 'snd/' + soundName + SOUND_EXTENSION);
      } else {
        soundLoadErrors.push(soundUrl);
      }
    }
  }

  console.log(
    'ROOMS:',
    rooms,
    '\nTRIGGERS:',
    triggers,
    '\nSCRIPTS:',
    scripts,
    '\nSOUND_LOAD_ERRORS:',
    soundLoadErrors
  );
}

export function get(type, key) {
  let obj = null;
  if (type === 'rooms') {
    obj = rooms;
    return rooms[key];
  } else if (type === 'triggers') {
    obj = triggers;
    return triggers[key];
  } else if (type === 'scripts') {
    obj = scripts;
    return scripts[key];
  }

  if (!obj) {
    throw new Error('[DB->MAP] cannot get elem of type: ', type);
  }
  if (!obj[key]) {
    throw new Error(`[DB->MAP] cannot get elem in ${type} with key `, key);
  }
  return obj[key];
}

export function exists(type, key) {
  let obj = null;
  if (type === 'rooms') {
    obj = rooms;
    return rooms[key];
  } else if (type === 'triggers') {
    obj = triggers;
    return triggers[key];
  } else if (type === 'scripts') {
    obj = scripts;
    return scripts[key];
  }
  if (!obj) {
    return false;
  }
  return !!obj[key];
}
