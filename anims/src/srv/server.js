const express = require('express');
const fs = require('fs');
const bodyParser = require('body-parser');

const PORT = 8888;
const PROPS_DIR = `${__dirname}/../../props`;
const STAGES_DIR = `${__dirname}/../../stages`;
const SPRITESHEETS_DIR = `${__dirname}/../../spritesheets`;
const TXT_DIR = `${__dirname}/../../txt`;

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(`${__dirname}/../../public`));
app.use(express.static(`${__dirname}/../../spritesheets`));
app.use(express.static(`${__dirname}/../../props`));

app.get('/spritesheets', (req, res) => {
  console.log(`[Anims SRV] GET/spritesheets`, req.body);
  const resp = {
    files: [],
    err: null,
  };

  fs.readdir(SPRITESHEETS_DIR, (err, files) => {
    if (err) {
      resp.err = err;
    } else {
      resp.files = files
        .filter(fileName => fileName.indexOf('.png') > -1)
        .sort();
    }
    res.send(JSON.stringify(resp));
  });
});

app.get('/props', (req, res) => {
  console.log(`[Anims SRV] GET/props`, req.body);
  const resp = {
    files: [],
    err: null,
  };

  fs.readdir(PROPS_DIR, (err, files) => {
    if (err) {
      resp.err = err;
    } else {
      resp.files = files
        .filter(fileName => fileName.indexOf('.png') > -1)
        .sort();
    }
    res.send(JSON.stringify(resp));
  });
});

app.get('/txt', (req, res) => {
  console.log(`[Anims SRV] GET/txt`, req.body);
  const resp = {
    txt: '',
    err: null,
  };

  fs.readdir(TXT_DIR, (err, files) => {
    if (err) {
      resp.err = err;
    } else {
      resp.files = files
        .filter(fileName => fileName.indexOf('.txt') > -1)
        .sort()
        .map(fileName => {
          return fs.readFileSync(TXT_DIR + '/' + fileName).toString();
        });
    }
    res.send(JSON.stringify(resp));
  });
});

app.post('/txt', (req, res) => {
  console.log(`[Anims SRV] POST/txt`, req.body);
  const resp = {
    success: false,
    err: null,
  };
  let valid = false;

  console.log('BODY', req.body);

  if (!req.body.txt) {
    resp.err = 'No txt json provided.';
  } else {
    valid = true;
  }

  if (valid) {
    fs.writeFile(`${TXT_DIR}/res.txt`, req.body.txt, err => {
      if (err) {
        resp.err = err;
      } else {
        resp.success = true;
      }
      res.send(JSON.stringify(resp));
    });
  } else {
    res.send(JSON.stringify(resp));
  }
});

app.post('/prop', (req, res) => {
  console.log(`[Anims SRV] POST/prop`, req.body);
  const resp = {
    success: false,
    err: null,
  };
  let valid = false;

  if (!req.body.name) {
    resp.err = 'No name provided.';
  } else if (!req.body.prop) {
    resp.err = 'No prop json provided.';
  } else {
    valid = true;
  }

  if (valid) {
    // fs.writeFile(
    //   `${CADENCES_DIR}/${req.body.name}.cadence.json`,
    //   JSON.stringify(req.body.cadence, null, 2),
    //   err => {
    //     if (err) {
    //       resp.err = err;
    //     } else {
    //       resp.success = true;
    //     }
    //     res.send(JSON.stringify(resp));
    //   }
    // );
  } else {
    res.send(JSON.stringify(resp));
  }
});

app.listen(PORT, () => {
  console.log(`[Anims SRV] Listening on port ${PORT}`);
});
