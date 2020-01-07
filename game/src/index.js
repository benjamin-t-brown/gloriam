import React from 'react';
import ReactDOM from 'react-dom';
import App from 'cmpts/App';
import display from 'display/Display';
import { elemExists } from 'db';
import scene from 'main/Scene';
import { load } from 'db/map';

const loadSave = async () => {
  await scene.callScript('setup');
};

async function main() {
  await display.init();
  await load({ elemExists }, scene);
  await loadSave();
  ReactDOM.render(<App />, document.getElementById('root'));
}

main();
