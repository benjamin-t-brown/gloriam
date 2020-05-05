import React from 'react';
import display from 'display/Display';

const Animation = ({ animName, style, width, height }) => {
  const ref = React.useRef(null);
  const anim = display.getAnimation(animName);
  const { width: canvasWidth, height: canvasHeight } = anim.getSpriteSize(0);
  React.useEffect(() => {
    const func = display.addRenderable(() => {
      display.setCanvas(ref.current);
      display.clearScreen();
      display.drawAnimation(anim, canvasWidth / 2, canvasHeight / 2, {
        centered: true,
        width,
        height,
      });
      display.restoreCanvas();
    });
    return () => {
      display.removeRenderable(func);
    };
  }, [anim, canvasWidth, canvasHeight, width, height]);

  return (
    <canvas
      style={{
        ...style,
      }}
      ref={ref}
      width={width || canvasWidth}
      height={height || canvasHeight}
    ></canvas>
  );
};

export default Animation;
