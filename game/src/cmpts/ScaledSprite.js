import React, { createRef } from 'react';
import display from 'display/Display';

class ScaledSprite extends React.Component {
  constructor(props) {
    super(props);

    this.canvasRef = createRef();
  }

  componentDidMount() {
    const canvas = this.canvasRef.current;
    display.pushCanvas(canvas);
    display.drawSprite(this.props.spriteName, 0, 0, {
      scale: this.props.scale,
    });
    display.popCanvas();
  }

  render() {
    const { scale, spriteName } = this.props;
    const { clip_w, clip_h } = display.getSprite(spriteName);

    return <canvas ref={this.canvasRef} width={scale * clip_w} height={scale * clip_h} />;
  }
}

export default ScaledSprite;
