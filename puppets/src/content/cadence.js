import { assignState, assignStatic, getStatic } from 'store';

class Cadence {
  constructor(soundName) {
    this.soundName = soundName;
    this.openPoints = [];

    this.middleFrameMinimumMS = 50;
    this.middleFrameMaximumMS = 60;
    this.maxFrameMinimumMS = 40;
    this.maxFrameMaximumMS = 90;
  }

  toJson() {
    return [
      this.middleFrameMinimumMS,
      this.middleFrameMaximumMS,
      this.maxFrameMinimumMS,
      this.maxFrameMaximumMS,
      this.soundName,
      this.openPoints.map(({ timestamp }) => timestamp),
    ];
  }

  fromJson(json) {
    this.middleFrameMinimumMS = json[0];
    this.middleFrameMaximumMS = json[1];
    this.maxFrameMinimumMS = json[2];
    this.maxFrameMaximumMS = json[3];
    this.openPoints = json[5].map(timestamp => ({
      timestamp,
    }));
  }

  createOpenPoint(timestampInSound) {
    this.openPoints.push({
      timestamp: timestampInSound,
    });
    this.openPoints.sort((a, b) => {
      if (a.timestamp > b.timestamp) {
        return 1;
      } else {
        return -1;
      }
    });
  }

  isAtThreshold(timestampA, timestampB, offsetMS) {
    timestampA *= 1000;
    timestampB *= 1000;
    const d = timestampB - timestampA;
    if (d > 0 && d < offsetMS) {
      return true;
    }
    return false;
  }

  getAnimIndex(timestampInSound) {
    let lastIndex = 0;

    let leftI = 0;
    let rightI = this.openPoints.length - 1;
    while (leftI <= rightI) {
      const midI = leftI + Math.floor((rightI - leftI) / 2);
      const { timestamp: timestampOpenPoint } = this.openPoints[midI];
      if (
        this.isAtThreshold(
          timestampOpenPoint,
          timestampInSound,
          this.maxFrameMinimumMS
        )
      ) {
        lastIndex = 2;
      } else if (
        this.isAtThreshold(
          timestampInSound,
          timestampOpenPoint,
          this.middleFrameMinimumMS
        )
      ) {
        lastIndex = 1;
      } else if (
        this.isAtThreshold(
          timestampOpenPoint,
          timestampInSound,
          this.maxFrameMaximumMS
        )
      ) {
        lastIndex = 2;
      } else if (
        this.isAtThreshold(
          timestampInSound,
          timestampOpenPoint,
          this.middleFrameMaximumMS
        )
      ) {
        lastIndex = 1;
      }

      if (timestampInSound > timestampOpenPoint) {
        leftI = midI + 1;
      } else {
        rightI = midI - 1;
      }
    }
    return lastIndex;
  }
}

export function getCadence(soundName) {
  return getStatic('cadences.' + soundName);
}

export function createCadence(soundName) {
  return new Cadence(soundName);
}

export function showCadenceMaker() {
  assignState('cadence', null, {
    makerMode: 'ready',
  });
}

export function startMakingCadence() {
  assignState('cadence', null, {
    makerMode: 'making',
  });
}

export function hideCadenceMaker() {
  assignState('cadence', null, {
    makerMode: 'invisible',
  });
}

function formatNumber(n) {
  if (n < 10) {
    return '0' + n;
  } else {
    return String(n);
  }
}

function getAllCadencesWithPrefix(prefix) {
  const ret = [];
  const cadences = getStatic('cadences');
  for (let soundName in cadences) {
    if (soundName.indexOf(prefix) > -1) {
      if (cadences[soundName]) {
        ret.push(cadences[soundName]);
      }
    }
  }
  return ret;
}

export async function insertAndSlideUp(soundName) {
  const soundPrefix = soundName.slice(0, -2);
  const cadences = getAllCadencesWithPrefix(soundPrefix);
  const ind = Number(soundName.slice(-2)) - 1;
  for (let i = cadences.length - 1; i >= ind; i--) {
    const cadence = cadences[i];
    const soundNumber = Number(cadence.soundName.slice(-2));
    const newSoundName = soundPrefix + formatNumber(soundNumber + 1);
    console.log(cadence.soundName, 'is now', newSoundName);
    cadence.soundName = newSoundName;
    assignStatic('cadences.' + newSoundName, cadence);
  }
  const lastSoundName = soundPrefix + formatNumber(cadences.length + 1);
  assignStatic('cadences.' + soundName, null);
  assignState('cadences', null, {
    [soundName]: null,
  });
  assignState('cadences', null, {
    [lastSoundName]: { exists: true },
  });
  const arr = getAllCadencesWithPrefix(soundPrefix);
  for (let i = 0; i < arr.length; i++) {
    await saveCadence(arr[i]);
  }
}

export async function removeAndSlideDown(soundName) {
  const soundPrefix = soundName.slice(0, -2);
  const cadences = getAllCadencesWithPrefix(soundPrefix);
  const cadencesStatic = getStatic('cadences');
  if (!cadencesStatic[soundName]) {
    return;
  }
  const ind = Number(soundName.slice(-2));
  for (let i = ind; i < cadences.length - 1; i++) {
    const cadence = cadences[i + 1];
    const soundNumber = Number(cadence.soundName.slice(-2));
    const newSoundName = soundPrefix + formatNumber(soundNumber - 1);
    cadence.soundName = newSoundName;
    assignStatic('cadences.' + newSoundName, cadence);
  }
  const lastSoundName = soundPrefix + formatNumber(cadences.length);
  assignStatic('cadences.' + lastSoundName, null);
  assignState('cadences', null, {
    [lastSoundName]: null,
  });
  return Promise.all(getAllCadencesWithPrefix(soundPrefix).map(saveCadence));
}

export async function saveCadence(cadence) {
  const soundName = cadence.soundName;
  const type = 'POST';
  const url = '/cadence';
  const opts = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: soundName,
      cadence: cadence.toJson(),
    }),
  };
  console.log('[fetch]', type, url, opts.body);
  return fetch(url, opts)
    .then(async response => {
      const json = await response.json();
      if (json.err) {
        console.error(json.err);
        throw new Error(json.err);
      }
      console.log('[fetch]', 'result', type, url, json);
      assignStatic(`cadences.${soundName}`, cadence);
      assignState(`cadences.${soundName}`, null, {
        exists: true,
      });
      return json;
    })
    .catch(err => {
      throw err;
    });
}

export async function loadCadences() {
  const type = 'GET';
  const url = '/cadences';
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

  data.cadences.forEach(json => {
    const c = new Cadence(json[4]);
    c.fromJson(json);
    assignState(`cadences.${c.soundName}`, null, { exists: true });
    assignStatic(`cadences.${c.soundName}`, c);
  });
}
