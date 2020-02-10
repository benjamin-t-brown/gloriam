const express = require('express');
const fs = require('fs');
const bodyParser = require('body-parser');

const PORT = 8889;
const SOUNDS_DIR = `${__dirname}/../../../game/dist/voice`;
const SPRITESHEETS_DIR = `${__dirname}/../../spritesheets`;
const CADENCES_DIR = `${__dirname}/../../../game/src/db/cadences`;
const CADENCE_FILE_EXTENSION = '.cadence.json';

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(`${__dirname}/../../public`));
app.use(express.static(`${__dirname}/../../spritesheets`));
app.use(express.static(SOUNDS_DIR));

console.log('Serving sounds from:', SOUNDS_DIR);

const isSound = url => {
  return ['mp3', 'wav', 'ogg'].includes(url.slice(-3));
};

app.get('/spritesheets', (req, res) => {
  console.log(`[Puppets SRV] GET/spritesheets`, req.body);
  const resp = {
    files: [],
    err: null,
  };

  fs.readdir(SPRITESHEETS_DIR, (err, files) => {
    if (err) {
      resp.err = err;
    } else {
      resp.files = files.sort();
    }
    res.send(JSON.stringify(resp));
  });
});

app.get('/sounds', (req, res) => {
  console.log(`[Puppets SRV] GET/sounds`, req.body);
  const resp = {
    files: [],
    err: null,
  };

  fs.readdir(SOUNDS_DIR, async (err, files) => {
    if (err) {
      resp.err = err;
    } else {
      const folders = [];
      resp.files = [];
      for (let i = 0; i < files.length; i++) {
        const fName = files[i];

        const url = `${SOUNDS_DIR}/${fName}`;
        const stat = await fs.promises.lstat(url);
        if (stat.isFile()) {
          if (!isSound(fName)) {
            continue;
          }
          resp.files.push(fName);
        } else {
          folders.push(fName);
        }
      }

      for (let i = 0; i < folders.length; i++) {
        const folderUrl = SOUNDS_DIR + '/' + folders[i];
        const files = await fs.promises.readdir(folderUrl);
        files.forEach(file => {
          if (err) {
            resp.err = err;
          } else {
            resp.files.push(folders[i] + '/' + file);
          }
        });
      }
    }
    res.send(JSON.stringify(resp));
  });
});

app.get('/cadences', (req, res) => {
  console.log(`[Puppets SRV] GET/cadences`, req.body);
  const resp = {
    cadences: [],
    err: null,
  };

  const addCadence = (data, fName) => {
    const cadence = JSON.parse(data.toString());
    if (fName.indexOf(CADENCE_FILE_EXTENSION) > -1) {
      fName = fName.slice(0, -CADENCE_FILE_EXTENSION.length);
    }
    // fix for when cadences had their names embedded in them
    if (typeof cadence[4] === 'string') {
      cadence.splice(4, 1, fName);
    } else {
      cadence.splice(4, 0, fName);
    }
    resp.cadences.push(cadence);
  };

  fs.readdir(CADENCES_DIR, async (err, files) => {
    if (err) {
      resp.err = err;
    } else {
      const folders = [];
      for (let i = 0; i < files.length; i++) {
        const fName = files[i];
        const stat = await fs.promises.lstat(`${CADENCES_DIR}/${fName}`);
        if (stat.isFile()) {
          if (fName.slice(-5) === '.json') {
            const data = fs.readFileSync(`${CADENCES_DIR}/${fName}`);
            addCadence(data, fName);
          }
        } else {
          folders.push(fName);
        }
      }
      for (let i = 0; i < folders.length; i++) {
        const folderUrl = CADENCES_DIR + '/' + folders[i];
        const files = await fs.promises.readdir(folderUrl);
        files.forEach(file => {
          //eslint-disable-line
          if (err) {
            resp.err = err;
          } else {
            const data = fs.readFileSync(
              `${CADENCES_DIR}/${folders[i]}/${file}`
            );
            addCadence(data, `${folders[i]}/${file}`);
          }
        });
      }
    }
    res.send(JSON.stringify(resp));
  });
});

app.post('/cadence', (req, res) => {
  console.log(`[Puppets SRV] POST/cadence`, req.body);
  const resp = {
    success: false,
    err: null,
  };
  let valid = false;

  if (!req.body.name) {
    resp.err = 'No name provided.';
  } else if (!req.body.cadence) {
    resp.err = 'No cadence json provided.';
  } else {
    valid = true;
  }

  if (valid) {
    const arr = req.body.name.split('/');
    if (arr.length > 1) {
      const dir = CADENCES_DIR + '/' + arr.slice(0, -1).join('/');
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
      }
    }

    const cadence = req.body.cadence;

    // remove the name from the cadence in order to save space
    if (typeof cadence[4] === 'string') {
      cadence.splice(4, 1);
    }

    fs.writeFile(
      `${CADENCES_DIR}/${req.body.name}${CADENCE_FILE_EXTENSION}`,
      JSON.stringify(cadence, null, 2),
      err => {
        if (err) {
          resp.err = err;
        } else {
          resp.success = true;
        }
        res.send(JSON.stringify(resp));
      }
    );
  } else {
    res.send(JSON.stringify(resp));
  }
});

app.listen(PORT, () => {
  console.log(`[Puppets SRV] Listening on port ${PORT}`);
});
