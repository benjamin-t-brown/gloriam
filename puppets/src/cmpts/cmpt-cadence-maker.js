import React, { Component, createRef } from 'react';
import { connect } from 'react-redux';
import {
  startMakingCadence,
  showCadenceMaker,
  hideCadenceMaker,
  createCadence,
} from 'content/cadence';
import {
  getSoundCurrentTime,
  stopSound,
  playSound,
  setEventOnSoundStop,
  selectSound,
} from 'content/sounds';
import { assignState, assignStatic } from 'store';

class CadenceMakerCmpt extends Component {
  constructor(props) {
    super(props);

    this.state = {
      loading: false,
    };

    this.div = createRef();
    this.handleKeyDown = ev => {
      if (!this.props.sound) {
        return;
      }

      if (this.props.makerMode === 'invisible') {
        return;
      }
      if (ev.keyCode === 27) {
        stopSound(this.props.sound);
        setEventOnSoundStop(this.props.sound, function() {});
        if (this.props.makerMode === 'making') {
          showCadenceMaker();
        } else {
          hideCadenceMaker();
        }
      } else if (this.props.makerMode === 'making') {
        const timestamp = getSoundCurrentTime(this.props.sound);
        this.newCadence.createOpenPoint(timestamp);
        this.div.current.classList.remove('cadence-flash');
        setTimeout(() => {
          this.div.current.classList.add('cadence-flash');
        });
      }

      if (this.props.makerMode !== 'making') {
        if (ev.keyCode === 32) {
          this.beginConstructingCadence();
        } else if (ev.keyCode === 13) {
          this.saveCadence();
        }
      }
    };
  }

  beginConstructingCadence() {
    this.newCadence = createCadence(this.props.sound.soundName);
    stopSound(this.props.sound);
    playSound(this.props.sound);
    startMakingCadence();
    setEventOnSoundStop(this.props.sound, () => {
      showCadenceMaker();
    });
  }

  saveCadence() {
    if (this.newCadence) {
      stopSound(this.props.sound);
      setEventOnSoundStop(this.props.sound, function() {});
      this.setState({
        loading: true,
      });

      const type = 'POST';
      const url = '/cadence';
      const opts = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: this.newCadence.soundName,
          cadence: this.newCadence.toJson(),
        }),
      };
      console.log('[fetch]', type, url, opts.body);
      fetch(url, opts)
        .then(async response => {
          const json = await response.json();
          if (json.err) {
            console.error(json.err);
            throw new Error(json.err);
          }
          console.log('[fetch]', 'result', type, url, json);
          assignStatic(`cadences.${this.props.soundName}`, this.newCadence);
          assignState(`cadences.${this.props.soundName}`, null, {
            exists: true,
          });
          selectSound(this.props.soundName, this.props.sound.soundUrl);
          this.setState({
            loading: false,
          });
          this.newCadence = null;
          hideCadenceMaker();
          return json;
        })
        .catch(err => {
          throw err;
        });
    }
  }

  componentDidMount() {
    document.addEventListener('keydown', this.handleKeyDown);
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.handleKeyDown);
  }

  render() {
    return (
      <div
        className="cadence-maker"
        style={{
          display: this.props.makerMode === 'invisible' ? 'none' : 'block',
          backgroundColor:
            this.props.makerMode === 'making' ? 'rgba(0,0,0,0)' : null,
        }}
      >
        <div className="centeredxy" ref={this.div}>
          {this.state.loading ? (
            <img
              alt="loading..."
              style={{
                width: '40px',
              }}
              src="loading.gif"
            ></img>
          ) : (
            <div
              style={{
                visibility: this.props.makerMode === 'making' ? 'hidden' : null,
              }}
            >
              <div>Cadence Maker Ready</div>
              <div
                className="button button-primary button-cadence-control"
                onClick={() => this.beginConstructingCadence()}
              >
                Start
              </div>
              <div
                className={`button button-secondary button-cadence-control ${
                  this.newCadence ? '' : 'button-disabled'
                }`}
                onClick={() => this.saveCadence()}
                disabled
              >
                Save
              </div>
              <div
                className="button button-cancel button-cadence-control"
                onClick={() => hideCadenceMaker()}
              >
                Cancel
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
}

export const CadenceMaker = connect(state => {
  return {
    makerMode: state.cadence.makerMode,
    cadence: state.cadences[state.sound.soundName] || null,
    soundName: state.sound.soundName,
  };
}, null)(CadenceMakerCmpt);
