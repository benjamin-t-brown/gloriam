import React from 'react';
import { connect } from 'react-redux';
import {
  selectSound,
  stopSound,
  getSoundList,
  hasSound,
  getSound,
} from 'content/sounds';
import { urlToSoundName } from 'utils';

const mapStateToProps = state => {
  return {
    soundName: state.sound.soundName,
    hasCadence: state.cadences[state.sound.soundName],
    cadences: state.cadences,
  };
};

const handleSelectSound = soundUrl => async () => {
  const soundName = urlToSoundName(soundUrl);
  if (hasSound(soundUrl)) {
    const soundObj = await getSound(soundName, soundUrl);
    stopSound(soundObj);
  }
  selectSound(soundName, soundUrl);
};

const SoundSelectCmpt = props => {
  const [filter, setFilter] = React.useState('');

  const baseClassName = 'column-item';
  const sounds = getSoundList();
  return (
    <div className="column">
      <div className="column-title">Sounds</div>
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
      <div>
        {sounds.map(soundUrl => {
          let className = baseClassName;
          const soundName = urlToSoundName(soundUrl);
          if (props.soundName === soundName) {
            className += ' column-item-selected';
          }
          const cadence = props.cadences[soundName];
          if (!cadence) {
            className += ' column-item-uninitialized';
          }
          return (
            <div
              key={soundName}
              className={className}
              onClick={handleSelectSound(soundUrl)}
            >
              <span className="no-select">{soundName}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default connect(mapStateToProps, null)(SoundSelectCmpt);
