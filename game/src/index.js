import React from 'react';
import ReactDOM from 'react-dom';
import App from 'cmpts/App';
import display from 'display/Display';
import { elemExists, addElem } from 'db';
import scene from 'main/Scene';
import { loadMapElements } from 'db/map';
import { loadCadences } from 'db/cadences';

const loadSave = async () => {
  await scene.callScript('setup');
};

async function main() {
  await display.init();
  await loadMapElements({ elemExists }, scene);
  await loadCadences({ addElem });
  await loadSave();
  ReactDOM.render(<App />, document.getElementById('root'));
}

console.log('MAIN BRO?');
main();
