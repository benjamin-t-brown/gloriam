import React from 'react';
import display from 'display/Display';

const ContainerDisplay = props => {
  const canvasRef = React.useRef(null);
  const [size, setSize] = React.useState(
    props.childProps.gameInterface.getGameAreaSize()
  );
  const { width, height } = props.childProps.gameInterface.getGameAreaSize();

  React.useEffect(() => {
    const handleResize = () => {
      const { width, height } = props.childProps.gameInterface.getGameAreaSize();
      setSize({
        width,
        height,
      });
      setTimeout(() => {
        const { width, height } = props.childProps.gameInterface.getGameAreaSize();
        display.resize(width, height);
      }, 50);
    };

    setSize({
      width,
      height,
    });
    window.addEventListener('resize', handleResize);
    display.setCanvas(canvasRef.current);
    display.resize(width, height);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [width, height, props.childProps.gameInterface]);

  const Child = props.child;
  return (
    <div>
      <canvas
        className="screen"
        key="screen"
        id="screen"
        ref={canvasRef}
        width={size.width}
        height={size.height}
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
        }}
      />
      <Child
        width={size.width}
        height={size.height}
        canvasRef={canvasRef}
        {...props.childProps}
      />
    </div>
  );
};

export default ContainerDisplay;
