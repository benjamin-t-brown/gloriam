import { createStore } from 'redux';

const initialState = {
  soundList: [],
  sound: {
    folder: null,
    soundUrl: '',
    soundName: '',
    soundDuration: 0,
    cadence: null,
    isPlaying: false,
    isPaused: false,
    lastStartTimestamp: 0,
    lastPauseTimestamps: [],
    playbackCursorPosition: 0,
  },
  cadences: {},
  sprite: {
    spriteId: '',
  },
  animation: {
    zoom: 4,
    animName: '',
    animIndex: 0,
  },
  cadence: {
    makerMode: 'invisible',
  },
};

const staticState = {
  sounds: {},
  images: {},
  sprites: {},
  spriteIds: {},
  renderables: {},
  animations: {},
  cadences: {},
};

const resolve = (key, obj) => {
  if (!key) {
    return obj;
  }
  const arr = key.split('.');
  let f = obj;
  while (arr.length) {
    const k = arr.shift();
    if (typeof f === 'object') {
      f = f[k];
    } else {
      f = undefined;
      break;
    }
  }
  return f;
};

const store = createStore((state, action) => {
  if (!action.cb) {
    return state || initialState;
  }
  const newState = action.cb.apply(null, [
    state || initialState,
    ...action.args,
  ]);
  return newState;
});

export const callActionCB = function(cb) {
  store.dispatch({
    type: 'CB',
    cb,
    args: [],
  });
};

export const assignAction = function(path, value) {
  callActionCB(state => {
    const newState = {
      ...state,
    };
    let ind = path.lastIndexOf('.');
    if (ind === -1) {
      ind = path.length;
      newState[path] = value;
    } else {
      let lastKey = path.slice(ind + 1);

      let ind2 = path.slice(0, ind).lastIndexOf('.');
      const nextLastKey = path.slice(ind2 + 1, ind);

      const subPath = ind2 > -1 ? path.slice(0, ind2) : '';

      const obj = resolve(subPath, newState);
      if (typeof obj === 'object') {
        const newObj = {
          ...obj[nextLastKey],
        };
        newObj[lastKey] = value;
        obj[nextLastKey] = newObj;
      } else {
        console.error(
          `Could not assignAction path=${path} value='${value}' lastKey=${lastKey} nextLastKey=${nextLastKey} subPath=${subPath}`
        );
      }
    }
    return newState;
  });
};

export const assignState = function(path, oldObj, newObj) {
  callActionCB(state => {
    const newState = {
      ...state,
    };
    if (!oldObj) {
      oldObj = resolve(path, newState);
    }
    const newNewObj = Object.assign({}, oldObj, newObj);
    let ind = path.lastIndexOf('.');
    if (ind === -1) {
      ind = path.length;
      newState[path] = newNewObj;
    } else {
      let lastKey = path.slice(ind + 1);
      const obj = resolve(path.slice(0, ind), newState);
      if (typeof obj === 'object') {
        obj[lastKey] = newNewObj;
      } else {
        console.error(
          `Could not assignState path=${path} newNewObj=`,
          newNewObj
        );
      }
    }
    return newState;
  });
};

export const assignStatic = function(path, value) {
  let ind = path.lastIndexOf('.');
  if (ind === -1) {
    ind = path.length;
    staticState[path] = value;
  } else {
    const lastKey = path.slice(ind + 1);
    const obj = resolve(path.slice(0, ind), staticState);
    if (typeof obj === 'object') {
      obj[lastKey] = value;
    } else {
      console.error(
        `Could not assignStatic path=${path} value=`,
        value,
        `staticState=`,
        staticState
      );
    }
  }
  return staticState;
};

export const getStatic = function(path) {
  let ind = path.lastIndexOf('.');
  if (ind === -1) {
    ind = path.length;
    return staticState[path];
  } else {
    const lastKey = path.slice(ind + 1);
    const obj = resolve(path.slice(0, ind), staticState);
    if (typeof obj === 'object') {
      return obj[lastKey];
    } else {
      return null;
    }
  }
};

global.store = store;
global.staticStore = staticState;
global.getStatic = getStatic;
export default store;
