export function normalize(x, a, b, c, d) {
  return c + ((x - a) * (d - c)) / (b - a);
}

export const localStore = (function(a) {
  return function(c, d) {
    return d === undefined ? a[c] : (a[c] = d);
  };
})(window.localStorage || {});

export const urlToSoundName = soundUrl =>
  soundUrl.slice(0, soundUrl.lastIndexOf('.'));

global.localStore = localStore;
