import React, { createRef } from 'react';
import display from 'display/Display';

class ScaledAnimation extends React.Component {
  constructor(props) {
    super(props);
    this.anim = display.getAnimation(props.animName);
    this.canvasRef = createRef();
  }

  renderAnim() {
    const canvas = this.canvasRef.current;
    display.pushCanvas(canvas);
    display.clearScreen();
    display.drawAnimation(this.anim, 0, 0, {
      scale: this.props.scale,
    });
    display.popCanvas();
  }

  componentDidMount() {
    this.renderAnim();
  }

  render() {
    const { scale } = this.props;
    const { width, height } = this.anim.getSpriteSize();
    if (this.canvasRef.current) {
      this.renderAnim();
    }

    return (
      <canvas
        ref={this.canvasRef}
        width={scale * width}
        height={scale * height}
        style={{
          pointerEvents: 'none',
        }}
      />
    );
  }
}

export default ScaledAnimation;
