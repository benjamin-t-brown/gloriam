import React, { Component, createRef } from 'react';
import { connect } from 'react-redux';
import {
  drawSpriteToCanvas,
  addRenderable,
  removeRenderable,
} from 'content/images';
import { setZoom } from 'content/animations';
import { getSoundCurrentTime } from 'content/sounds';
import { getCadence } from 'content/cadence';

const SOUND_PLAYER_SIZE = 230;

class AnimationAreaCmpt extends Component {
  constructor(props) {
    super(props);

    this.canv = createRef();

    this.handleZoomClick = function(zoom) {
      setZoom(zoom);
    };
  }

  componentDidMount() {
    const ctx = this.canv.current.getContext('2d');
    ctx.mozImageSmoothingEnabled = false;
    ctx.webkitImageSmoothingEnabled = false;
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#080';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    addRenderable('animation', () => {
      this.renderCanvas();
    });

    this.onResize = () => {
      this.forceUpdate();
    };

    window.addEventListener('resize', this.onResize);
  }

  componentDidUpdate() {
    const ctx = this.canv.current.getContext('2d');
    ctx.mozImageSmoothingEnabled = false;
    ctx.webkitImageSmoothingEnabled = false;
    ctx.imageSmoothingEnabled = false;
  }

  componentWillUnmount() {
    removeRenderable('animation');
    window.removeEventListener('resize', this.onResize);
  }

  renderCanvas() {
    if (this.props.cadenceMode !== 'invisible') {
      return;
    }

    if (!this.props.sound) {
      return;
    }

    const ctx = this.canv.current.getContext('2d');
    ctx.fillStyle = '#333';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    const { hasCadence } = this.props;
    if (hasCadence && this.props.isPlaying) {
      const cadence = getCadence(this.props.sound.soundName);
      const soundTime = getSoundCurrentTime(this.props.sound);
      const i = cadence.getAnimIndex(soundTime);
      drawSpriteToCanvas(this.props.spriteId + '_' + i, this.canv.current);
    } else {
      drawSpriteToCanvas(this.props.spriteId + '_0', this.canv.current);
    }
  }

  getSize() {
    return this.props.zoom * 64;
  }

  render() {
    const sz = this.getSize();
    const height = window.innerHeight;
    return (
      <div style={{ position: 'relative', height: height - SOUND_PLAYER_SIZE }}>
        <div className="animation-area-zoom-container">
          <div
            className="button zoom-button"
            onClick={this.handleZoomClick.bind(this, 1)}
          >
            1X
          </div>
          <div
            className="button zoom-button"
            onClick={this.handleZoomClick.bind(this, 2)}
          >
            2X
          </div>
          <div
            className="button zoom-button"
            onClick={this.handleZoomClick.bind(this, 4)}
          >
            4X
          </div>
          <div
            className="button zoom-button"
            onClick={this.handleZoomClick.bind(this, 8)}
          >
            8X
          </div>
        </div>
        <div className="animation-area">
          <div
            style={{
              visibility: 'hidden',
              width: sz + 'px',
              height: sz + 'px',
              margin: '20px',
            }}
          />
          <canvas
            className="centeredxy"
            ref={this.canv}
            width={sz}
            height={sz}
          />
        </div>
      </div>
    );
  }
}

const mapStateToProps = function(state) {
  return {
    zoom: state.animation.zoom,
    isPlaying: state.sound.isPlaying,
    isPaused: state.sound.isPaused,
    spriteId: state.sprite.spriteId,
    soundName: state.sound.soundName,
    hasCadence: !!state.cadences[state.sound.soundName],
    cadenceMode: state.cadence.makerMode,
  };
};
export const AnimationArea = connect(mapStateToProps, null)(AnimationAreaCmpt);
