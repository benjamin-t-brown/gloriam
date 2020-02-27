import React, { Component } from 'react';
import { connect } from 'react-redux';
import {
  playSound,
  pauseSound,
  stopSound,
  setSoundTimePercentage,
} from 'content/sounds';
import { showCadenceMaker, getCadence } from 'content/cadence';

class SoundPlayerTimelineCmpt extends Component {
  constructor(props) {
    super(props);

    this.handleClick = function(ev) {
      const { x, width } = ev.target.getBoundingClientRect();
      const percentage = ((ev.clientX - x) * 100) / width;
      setSoundTimePercentage(this.props.sound, percentage);
    }.bind(this);
  }

  renderCadencePoints() {
    if (!this.props.hasCadence) {
      return;
    }

    const cadence = getCadence(this.props.sound.soundName);

    if (!cadence) {
      return;
    }
    return cadence.openPoints.map(({ timestamp }, i) => {
      const pct = (timestamp * 100) / this.props.sound.soundDuration;
      return (
        <div
          key={i}
          className="timeline-cadence-cursor"
          style={{ left: pct + '%' }}
        />
      );
    });
  }

  render() {
    const timeNow = (
      (this.props.playbackCursorPosition * this.props.sound.soundDuration) /
      100
    ).toFixed(2);
    let cursorPosition = `${this.props.playbackCursorPosition}%`;
    return (
      <div>
        <div className="audio-player-time">
          {timeNow}/{this.props.sound.soundDuration.toFixed(2)}
        </div>
        <div className="audio-player-timeline" onMouseDown={this.handleClick}>
          <div
            className="timeline-cursor"
            style={{
              left: cursorPosition,
            }}
          />
          {this.renderCadencePoints()}
        </div>
      </div>
    );
  }
}
const SoundPlayerTimeline = connect(state => {
  return {
    playbackCursorPosition: state.sound.playbackCursorPosition,
    soundName: state.sound.soundName,
    hasCadence: state.cadences[state.sound.soundName],
    cadences: state.cadences,
  };
}, null)(SoundPlayerTimelineCmpt);

class SoundPlayerCmpt extends Component {
  constructor(props) {
    super(props);

    this.handlePlayClick = () => {
      if (!this.props.sound) {
        return;
      }
      if (!this.props.isPlaying) {
        playSound(this.props.sound);
      }
    };
    this.handlePauseClick = () => {
      if (!this.props.sound) {
        return;
      }
      if (this.props.isPlaying) {
        pauseSound(this.props.sound);
      }
    };
    this.handleStopClick = () => {
      if (!this.props.sound) {
        return;
      }
      stopSound(this.props.sound);
    };
    this.handleCreateCadenceClick = () => {
      if (!this.props.sound) {
        return;
      }
      showCadenceMaker();
    };
    this.handleKeyPress = ev => {
      if (!this.props.sound) {
        return;
      }
      if (this.props.makerMode === 'invisible') {
        if (ev.key === ' ') {
          if (!this.props.isPlaying) {
            this.handlePlayClick();
          } else {
            this.handlePauseClick();
          }
          ev.preventDefault();
        } else if (ev.key === 'Enter') {
          this.handleStopClick();
        }
      }
    };
  }

  componentDidMount() {
    window.addEventListener('keydown', this.handleKeyPress);
  }

  componentWillUnmount() {
    window.removeEventListener('keydown', this.handleKeyPress);
  }

  renderControls() {
    const stopClassName = 'audio-player-button';
    let pauseClassName = 'audio-player-button';
    let playClassName = 'audio-player-button';
    if (this.props.isPlaying) {
      playClassName += ' audio-player-button-toggled';
    }
    if (this.props.isPaused) {
      pauseClassName += ' audio-player-button-toggled';
    }
    return (
      <div className="audio-player-controls">
        <div className={pauseClassName} onClick={this.handlePauseClick}>
          <span className="no-select"> ❚❚ </span>
        </div>
        <div className={playClassName} onClick={this.handlePlayClick}>
          <span className="no-select"> ► </span>
        </div>
        <div className={stopClassName} onClick={this.handleStopClick}>
          <span className="no-select"> ◼ </span>
        </div>
      </div>
    );
  }

  render() {
    if (!this.props.sound) {
      return (
        <div style={{ textAlign: 'center', color: 'white', fontSize: '42px' }}>
          <div>Loading sound...</div>
          <img
            alt="loading..."
            style={{
              margin: '20px',
              width: '60px',
            }}
            src="loading.gif"
          ></img>
        </div>
      );
    }

    return (
      <div className="audio-player">
        <div className="label no-select">
          Clip: {this.props.soundName}{' '}
          {this.props.cadence ? '(Cadence Set)' : ''}
          <span
            className="button button-cadence"
            onClick={this.handleCreateCadenceClick}
          >
            Set Cadence
          </span>
        </div>
        <SoundPlayerTimeline sound={this.props.sound} />
        <div>{this.renderControls()}</div>
      </div>
    );
  }
}

const mapStateToProps = function(state) {
  return {
    isPlaying: state.sound.isPlaying,
    isPaused: state.sound.isPaused,
    soundName: state.sound.soundName,
    makerMode: state.cadence.makerMode,
  };
};

export const SoundPlayer = connect(mapStateToProps, null)(SoundPlayerCmpt);
