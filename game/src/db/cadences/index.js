const cadenceFiles = {};

async function requireAll(r, obj) {
  r.keys().forEach(async key => (obj[key] = r(key)));
}
requireAll(require.context('.', true, /\.cadence\.json$/), cadenceFiles);

export async function load(db) {}
