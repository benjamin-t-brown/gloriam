import React from 'react';
import { connect } from 'react-redux';
import {
  selectSound,
  stopSound,
  getSoundList,
  hasSound,
  getSound,
  setFolder,
} from 'content/sounds';
import { urlToSoundName } from 'utils';

const mapStateToProps = state => {
  return {
    folder: state.sound.folder,
    soundName: state.sound.soundName,
    hasCadence: state.cadences[state.sound.soundName],
    cadences: state.cadences,
  };
};

const handleSelectSound = (currentSound, soundUrl) => async () => {
  const soundName = urlToSoundName(soundUrl);
  if (currentSound) {
    stopSound(currentSound);
  }
  if (hasSound(soundUrl)) {
    const soundObj = await getSound(soundName, soundUrl);
    stopSound(soundObj);
  }
  selectSound(soundName, soundUrl);
};

const handleSelectFolder = folder => async () => {
  setFolder(folder);
};

const getClassName = (soundListObject, props) => {
  const baseClassName = 'column-item';
  const { url, fileName } = soundListObject;
  let className = baseClassName;
  const soundName = urlToSoundName(fileName);
  if (props.soundName === soundName) {
    className += ' column-item-selected';
  }
  const cadence = props.cadences[url.slice(0, -4)];
  if (!cadence) {
    className += ' column-item-uninitialized';
  }
  return className;
};

const SoundItem = ({ currentSound, soundName, className, url }) => {
  return (
    <div
      key={soundName}
      className={className}
      onClick={handleSelectSound(currentSound, url)}
    >
      <span className="no-select">{soundName}</span>
    </div>
  );
};

const SoundSelectCmpt = props => {
  const [filter, setFilter] = React.useState('');

  const sounds = getSoundList().filter(({ url }) => {
    if (filter) {
      return url.includes(filter);
    } else {
      return true;
    }
  });
  const folderName = props.folder;
  const elems = [];
  const elemMap = {};
  if (folderName) {
    sounds
      .filter(({ folder }) => {
        return folder === folderName;
      })
      .forEach(soundListObject => {
        const { url, fileName } = soundListObject;
        const className = getClassName(soundListObject, props);
        const soundName = urlToSoundName(fileName);
        elems.push(
          <SoundItem
            key={url}
            soundName={soundName}
            className={className}
            url={url}
            currentSound={props.sound}
          />
        );
      });
  } else {
    sounds.forEach(soundListObject => {
      const { url, folder, fileName } = soundListObject;
      const className = getClassName(soundListObject, props);
      const soundName = urlToSoundName(fileName);

      if (folder) {
        if (!elemMap[folder]) {
          elemMap[folder] = true;
          elems.push(
            <div
              key={soundName}
              className={'column-item column-item-folder'}
              onClick={handleSelectFolder(folder)}
            >
              <span className="no-select">Folder: {folder}</span>
            </div>
          );
        }
        return;
      }

      elems.push(
        <SoundItem
          key={url}
          soundName={soundName}
          className={className}
          url={url}
          currentSound={props.sound}
        />
      );
    });
  }
  return (
    <div className="column">
      <div className="column-title">Sounds</div>
      {props.folder ? (
        <>
          <div
            className="button"
            onClick={() => setFolder(null)}
            style={{
              width: '20px',
              padding: '3px',
              float: 'left',
              position: 'absolute',
              top: '9px',
              left: '9px',
            }}
          >
            ↩
          </div>
          <div
            className="column-item-folder"
            style={{ fontSize: '16px', textAlign: 'center' }}
          >
            Folder: {folderName}
          </div>
        </>
      ) : null}
      <div>
        <label htmlFor="filter">Filter:</label>
        <input
          name="filter"
          id="filter"
          type="text"
          value={filter}
          onChange={ev => {
            setFilter(ev.target.value);
          }}
        ></input>
      </div>
      <div>{elems}</div>
    </div>
  );
};

export default connect(mapStateToProps, null)(SoundSelectCmpt);
