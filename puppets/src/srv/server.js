const express = require('express');
const fs = require('fs');
const bodyParser = require('body-parser');

const PORT = 8888;
const SOUNDS_DIR = `${__dirname}/../../sounds`;
const SPRITESHEETS_DIR = `${__dirname}/../../spritesheets`;
const CADENCES_DIR = `${__dirname}/../../cadences`;

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(`${__dirname}/../../public`));
app.use(express.static(`${__dirname}/../../spritesheets`));
app.use(express.static(`${__dirname}/../../sounds`));

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

  fs.readdir(SOUNDS_DIR, (err, files) => {
    if (err) {
      resp.err = err;
    } else {
      resp.files = files;
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

  fs.readdir(CADENCES_DIR, (err, files) => {
    if (err) {
      resp.err = err;
    } else {
      files.forEach(fileName => {
        if (fileName === 'DO_NOT_DELETE') {
          return;
        }
        const data = fs.readFileSync(`${CADENCES_DIR}/${fileName}`);
        resp.cadences.push(JSON.parse(data.toString()));
      });
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
    fs.writeFile(
      `${CADENCES_DIR}/${req.body.name}.cadence.json`,
      JSON.stringify(req.body.cadence, null, 2),
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
