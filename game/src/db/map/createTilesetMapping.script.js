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
    fs.readdir(__dirname + '/rooms/tmx', (err, files) => {
      if (err) {
        reject(err);
      } else {
        resolve(
          files
            .filter(filename => filename.slice(-3) === 'tsx')
            .map(filename => __dirname + '/rooms/tmx/' + filename)
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
    tilesets[filename] = tileset;
  }

  console.log('OUTPUT', JSON.stringify(tilesets, false, 2));
  fs.writeFileSync('tilesets.json', JSON.stringify(tilesets));
}
main();
