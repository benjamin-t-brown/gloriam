// This script reads all the tilesets inside rooms/tmx/* and pulls all the tile tilesets.
// It then maps the tileset ids with the global ids so that they can be read in as
// distinct props in the database.  The result is 'tilesets.json'

const parseString = require('xml2js').parseString;
const fs = require('fs');

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

async function getProps() {
  return new Promise((resolve, reject) => {
    fs.readdir(__dirname + '/props', (err, files) => {
      if (err) {
        reject(err);
      } else {
        resolve(
          files
            .filter(filename => filename.slice(-3) === 'png')
            .map(filename => __dirname + '/props/' + filename)
        );
      }
    });
  });
}

const tilesets = {};

async function main() {
  const files = await getTilesets();
  for (let i = 0; i < files.length; i++) {
    const filename = files[i];
    console.log('parse', filename);
    const result = await parseXmlFile(filename);
    const tileset = result.tileset.tile.map(({ $, image }) => {
      const url = image[0].$.source.split(/[/|\\]/);
      console.log(url[url.length - 1]);
      return {
        id: $.id,
        name: url[url.length - 1].slice(0, -4),
      };
    });
    const arr = filename.split(/[/|\\]/);
    tilesets[arr[arr.length - 1]] = tileset;
  }

  const dir = '../game/src/db/map/tilesets.json';
  console.log('OUTPUT', dir, JSON.stringify(tilesets, false, 2));
  fs.writeFileSync(dir, JSON.stringify(tilesets));
}
main();
