// This script reads all the tilesets inside rooms/tmx/* and pulls all the tile tilesets.
// It then maps the tileset ids with the global ids so that they can be read in as
// distinct props in the database.  The result is 'tilesets.json'
const parseString = require('xml2js').parseString;
const fs = require('fs');
const { exec } = require('child_process');

const execAsync = async command => {
  return new Promise(resolve => {
    console.log(command);
    exec(command, (err, stdout, stderr) => {
      if (err) {
        console.error(err, stdout, stderr);
        return;
      }
      resolve();
    });
  });
};

async function parseXmlFile(filename) {
  return new Promise((resolve, reject) => {
    fs.readFile(filename, (err, xml) => {
      if (err) {
        reject(err);
      } else {
        parseString(xml, function(err, result) {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        });
      }
    });
  });
}

async function getTilesets() {
  return new Promise((resolve, reject) => {
    fs.readdir(__dirname + '/tmx', (err, files) => {
      if (err) {
        reject(err);
      } else {
        resolve(
          files
            .filter(filename => filename.slice(-3) === 'tsx')
            .map(filename => __dirname + '/tmx/' + filename)
        );
      }
    });
  });
}

async function getFolder(folderName) {
  return new Promise((resolve, reject) => {
    fs.readdir(__dirname + '/' + folderName, (err, files) => {
      if (err) {
        reject(err);
      } else {
        resolve(
          files
            .filter(filename => filename.slice(-3) === 'png')
            .map(filename => __dirname + '/' + folderName + '/' + filename)
        );
      }
    });
  });
}

const createResFile = files => {
  const filesRes = files.reduce((prev, curr) => {
    const fileName = curr.split('/').slice(-1)[0];
    const name = fileName.slice(0, -4);
    return prev + `Picture,${name},${fileName}\n`;
  }, '');
  return filesRes;
};

const tilesets = {};

async function main() {
  const files = await getTilesets();
  for (let i = 0; i < files.length; i++) {
    const filename = files[i];
    if (filename.indexOf('terrains') > -1) {
      continue;
    }
    const result = await parseXmlFile(filename);
    const tileset = result.tileset.tile.map(({ $, image }) => {
      const url = image[0].$.source.split(/[/|\\]/);
      return {
        id: $.id,
        name: url[url.length - 1].slice(0, -4),
      };
    });
    const arr = filename.split(/[/|\\]/);
    tilesets[arr[arr.length - 1]] = tileset;
  }

  const tilesetsDir = '../game/src/db/map/tilesets.json';
  console.log('OUTPUT', tilesetsDir, JSON.stringify(tilesets, false, 2));
  fs.writeFileSync(tilesetsDir, JSON.stringify(tilesets));

  const props = await getFolder('props');
  const propsRes = createResFile(props);
  const propsDir = '../game/src/display/res/props.txt';
  console.log('OUTPUT', propsDir, '\n' + propsRes);
  fs.writeFileSync(propsDir, propsRes);

  const stages = await getFolder('stages');
  const stagesRes = createResFile(stages);
  const stagesDir = '../game/src/display/res/roomBackgrounds.txt';
  console.log('OUTPUT', stagesDir, '\n' + stagesRes);
  fs.writeFileSync(stagesDir, stagesRes);

  await execAsync('cp -r props/*.png ../game/dist/img/');
  await execAsync('cp -r stages/*.png ../game/dist/img/');
}
main();
