import mock from 'mock';

import display from 'display/Display';
import ScriptParser from 'main/ScriptParser';
import RoomParser from 'room/RoomParser';
import utils, { fetchAsync } from 'utils';

import db, { getElem } from 'db';
import BattleController from 'battle/BattleController';
import RoomController from 'room/RoomController';

import {
  getNearestEdgePositionFromCenter,
  getIntersectionPoint,
  hasVisibilityBetweenPoints,
} from 'utils';

const assert = require('assert');

mock();

describe('index.js', () => {
  before(async () => {
    async function loadScripts() {
      const files = ['map/readyroom.rpgscript'];

      for (let i = 0; i < files.length; i++) {
        const fileName = files[i];
        const text = await fetchAsync(fileName);
        const parser = new ScriptParser(fileName);
        parser.parse(text);
      }
    }

    async function loadMaps() {
      const files = ['map/readyroom.json'];
      const tilesets = JSON.parse(await fetchAsync('map/tilesets.json'));
      for (let i = 0; i < files.length; i++) {
        const fileName = files[i];
        const mapJson = await fetchAsync(fileName);
        const parser = new RoomParser(fileName.split('/')[1].slice(0, -5), tilesets);
        parser.parse(JSON.parse(mapJson));
      }
    }

    async function main() {
      await display.init();
      console.log('loading scripts...');
      await loadScripts();
      console.log('loading maps...');
      await loadMaps();
    }
    return main();
  });

  it('can set up a battle', () => {
    const playerCharacters = [
      getElem('characters', 'Rydo'),
      getElem('characters', 'Ferelith'),
    ];
    const encounterName = 'test';

    const battle = new BattleController(function() {}, 'test', playerCharacters);
    battle.setBaseScale(5);
    battle.loop();
  });

  it('can set up a room', () => {
    const playerCharacters = [
      getElem('characters', 'Rydo'),
      getElem('characters', 'Ferelith'),
    ];
    const mapName = 'readyroom';
    const room = new RoomController(function() {}, mapName, playerCharacters);
  });

  it.only('intersects', () => {
    const pt = (x, y) => {
      return {
        x,
        y,
      };
    };

    const walls = [
      {
        x: 1,
        y: 1,
        width: 10,
        height: 10,
      },
      {
        x: 5,
        y: 5,
        width: 20,
        height: 20,
      },
    ];

    const result = hasVisibilityBetweenPoints(pt(50, 50), pt(0, 0), walls);
    console.log('RESULT', result);
  });
});
