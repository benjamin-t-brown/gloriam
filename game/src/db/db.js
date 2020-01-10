import characters from './characters';
import skills from './skills';
import stages from './stages';
import encounters from './encounters';
import statuses from './statuses';
import cadences from './cadences';
import { get, exists } from './map';

const _db = {
  encounters,
  characters,
  skills,
  stages,
  statuses,
  cadences,
};

const MAP_CONTROLLED = ['rooms', 'triggers', 'scripts'];

export const db = _db;

export function addElem(type, key, data) {
  if (_db[type]) {
    _db[type][key] = data;
  } else {
    console.error('[DB] Cannot add elem to db', type, key, data);
  }
}

export function getElem(type, key) {
  let e = null;
  if (MAP_CONTROLLED.includes(type)) {
    return get(type, key);
  }

  if (!db[type]) {
    e = `Cannot access db type="${type}", no type exists.`;
  }
  if (!db[type][key]) {
    e = `Cannot get from db at key "${type}.${key}", it does not exist.`;
  }

  if (e) {
    console.error(e);
    throw new Error('[DB] Error in db.getElem: ' + e);
  }
  return db[type][key];
}

export function elemExists(type, key) {
  if (MAP_CONTROLLED.includes(type)) {
    return exists(type, key);
  }

  if (!db[type]) {
    return false;
  }
  if (!db[type][key]) {
    return false;
  }
  return true;
}

// keep this global for debugging reasons
global.db = {
  ...db,
  getElem,
  elemExists,
};

export default _db;
