import { getDistPath, setFetchMock } from 'utils';
const fs = require('fs');

async function readFileAsync(filename) {
  const DIST = getDistPath();
  filename = DIST + filename;
  return new Promise(resolve => {
    fs.readFile(filename, (err, file) => {
      if (err) {
        console.error(err);
        resolve('');
      } else {
        resolve(file.toString());
      }
    });
  });
}

const Image = function() {
  Object.defineProperties(this, {
    src: {
      set: function() {
        setTimeout(() => {
          this.onload();
        }, 1);
      },
    },
  });
  this.width = 256;
  this.height = 256;
  this.onload = () => {};
};

export default function() {
  setFetchMock(readFileAsync);

  global.Image = Image;

  const ctx = {
    drawImage: () => {},
    strokeText: () => {},
    fillText: () => {},
    clearRect: () => {},
    fillRect: () => {},
    beginPath: () => {},
    arc: () => {},
    stroke: () => {},
    strokeRect: () => {},
    save: () => {},
    translate: () => {},
    rotate: () => {},
    restore: () => {},
    measureText: () => {},
  };

  global.document = {
    createElement: () => {
      return {
        width: 1000,
        height: 1000,
        getContext: () => {
          return ctx;
        },
      };
    },
    getElementById: () => {
      return null;
    },
  };

  ctx.canvas = global.document.createElement();
  global.window = {
    addEventListener: () => {},
    removeEventListener: () => {},
    innerWidth: 1000,
    innerHeight: 1000,
  };
}
