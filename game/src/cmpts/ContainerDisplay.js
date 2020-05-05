import React, { createRef } from 'react';
import display from 'display/Display';

class ContainerDisplay extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      width: window.innerWidth,
      height: window.innerHeight,
    };

    this.canvasRef = createRef();

    this.handleResize = () => {
      const { width, height } = props.childProps.gameInterface.getGameAreaSize();
      this.setState({
        width,
        height,
      });
      setTimeout(() => {
        const { width, height } = props.childProps.gameInterface.getGameAreaSize();
        display.resize(width, height);
      });
    };
  }

  componentDidMount() {
    const { width, height } = this.props.childProps.gameInterface.getGameAreaSize();
    window.addEventListener('resize', this.handleResize);
    display.setCanvas(this.canvasRef.current);
    display.resize(width, height);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize);
  }

  render() {
    const Child = this.props.child;
    return (
      <div>
        <canvas
          className="screen"
          key="screen"
          id="screen"
          ref={this.canvasRef}
          width={this.state.width}
          height={this.state.height}
          style={{
            position: 'fixed',
            left: 0,
            top: 0,
          }}
        />
        <Child
          width={this.state.width}
          height={this.state.height}
          canvasRef={this.canvasRef}
          {...this.props.childProps}
        />
      </div>
    );
  }
}

export default ContainerDisplay;
