const load = {
  loading: 0,
  loaded: 0,
  text: '',
  styles: {
    root: {
      display: 'flex',
      'flex-direction': 'column',
      'justify-content': 'center',
      'align-items': 'center',
      height: '100%',
    },
    loadingBarContainer: {
      border: '1px solid #DFF6F5',
      'text-align': 'center',
      width: '50%',
    },
    loadingBar: {
      height: '5rem',
      width: '0px',
      'background-color': '#E1534A',
    },
    loadingText: {
      color: 'white',
      'margin-bottom': '1.5rem',
      'font-size': '1rem',
    },
    loadingImage: {
      'margin-bottom': '-8rem',
      'margin-right': '10px',
    },
  },
  toStyles: function(style) {
    let ret = '';
    for (let i in style) {
      ret += `${i}: ${style[i]};`;
    }
    return ret;
  },
  setStyles: function() {
    const bar = document.getElementById('loadingBar');
    let pct = (load.loaded * 100) / load.loading;
    if (pct > 100) {
      pct = 100;
    }
    bar.style.width = pct + '%';
    const text = document.getElementById('loadingText');
    text.innerHTML = `${load.loaded}/${load.loading}`;
    bar.style.visibility = 'visible';
    text.style.visibility = load.loading ? 'visible' : 'hidden';

    const text2 = document.getElementById('loadingText2');
    text2.innerHTML = load.text;
  },
  markLoading: function() {
    load.loading++;
    load.setStyles();
  },
  markLoaded: function() {
    load.loaded++;
    load.setStyles();
  },
  setLoadingText: function(text) {
    load.text = text;
    load.setStyles();
  },
  init: function() {
    const div = document.createElement('div');
    div.innerHTML = `
  <div id="loading" style="${load.toStyles(load.styles.root)}">
        <img src="${window.IMAGE_PATH || ''}loading.gif" style="${load.toStyles(
      load.styles.loadingImage
    )}"></img>
        <span id="loadingText2" style="${load.toStyles(load.styles.loadingText)}"></span>
        <span id="loadingText" style="${load.toStyles(load.styles.loadingText)}"></span>
        <div id="loadingBarContainer" style="${load.toStyles(
          load.styles.loadingBarContainer
        )}">
          <div id="loadingBar" style="${load.toStyles(load.styles.loadingBar)}"></div>
        </div>
  </div>`;
    document.body.appendChild(div);
  },
  complete: function() {
    document.getElementById('loading').style.display = 'none';
  },
};
window.load = load;
load.init();
load.setLoadingText('Fetching code...');
