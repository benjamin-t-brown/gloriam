import React from 'react';
import ReactDOM from 'react-dom';
import App from 'cmpts/App';
import display from 'display/Display';
import { elemExists, addElem } from 'db';
import scene from 'main/Scene';
import { loadMapElements } from 'db/map';
import { loadCadences } from 'db/cadences';

const load = window.load;

const loadSave = async () => {
  await scene.callScript('setup');
};

async function main() {
  load.setLoadingText('Acquiring images...');
  await display.init();
  load.setLoadingText('Acquiring voices...');
  await loadMapElements({ elemExists }, scene);
  load.setLoadingText('Acquiring cadences...');
  await loadCadences({ addElem });
  load.setLoadingText('Acquiring saves...');
  await loadSave();
  load.complete();
  ReactDOM.render(<App />, document.getElementById('root'));
}

main();
