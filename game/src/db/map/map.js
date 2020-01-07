import ScriptParser from './ScriptParser';
import RoomParser from './RoomParser';
import display from 'display/Display';

import tilesets from './tilesets.json';

const scriptFiles = {};
const mapFiles = {};

async function requireAll(r, obj) {
  r.keys().forEach(async key => (obj[key] = r(key)));
}
requireAll(require.context('./scripts', true, /\.rpgscript$/), scriptFiles);
requireAll(require.context('./rooms', true, /\.json$/), mapFiles);

let rooms = {};
let triggers = {};
let scripts = {};

export async function load(db, scene) {
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

  if (scene.voiceEnabled) {
    for (let i = 0; i < soundsToLoad.length; i++) {
      const soundName = soundsToLoad[i];
      try {
        await display.loadSound(soundName, 'snd/' + soundName);
      } catch (e) {
        // uncomment out when you want to check which dialogue sounds are missing.
        // console.log('Failed to load sound', soundName);
        continue;
      }
    }
  }

  console.log(rooms, triggers, scripts, soundsToLoad);
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
