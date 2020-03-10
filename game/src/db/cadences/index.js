import Cadence from 'main/Cadence';

const cadenceFiles = {};

async function requireAll(r, obj) {
  r.keys().forEach(async key => (obj[key] = r(key)));
}
requireAll(require.context('.', true, /\.cadence\.json$/), cadenceFiles);

export async function loadCadences(db) {
  const ext = '.cadence.json';

  for (let fileName in cadenceFiles) {
    const cadence = cadenceFiles[fileName];
    const cadenceName = fileName.slice(2, -ext.length);
    // fix for when cadences had their names embedded in them
    if (typeof cadence[4] === 'string') {
      cadence.splice(4, 1, cadenceName);
    } else {
      cadence.splice(4, 0, cadenceName);
    }
    db.addElem('cadences', cadenceName, new Cadence(cadence));
  }
}

// this is here just so the above require includes all the cadence files
export default {};
