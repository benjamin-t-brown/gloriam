import React from 'react';
import display from 'display/Display';
import input from 'display/Input';
import scene from 'main/Scene';
import { calculateAndSetScale } from 'utils';

const TRANSITION_TIME = 200;

const NarrativeUI = ({
  gameInterface,
  width,
  height,
  backgroundImage,
  speakerName,
  text,
  textPosition,
}) => {
  const ref = React.useRef(null);

  let timeoutId = false;
  const nextText = () => {
    if (timeoutId) {
      return;
    }
    ref.current.style.opacity = 0;
    timeoutId = setTimeout(() => {
      scene.stopWaitingForInput();
    }, TRANSITION_TIME);
  };

  const events = {
    x: ev => {
      ev.preventDefault();
      nextText();
    },
    Enter: ev => {
      ev.preventDefault();
      nextText();
    },
    Escape: ev => {
      ev.preventDefault();
      gameInterface.setEscMenuOpen(!gameInterface.isEscMenuOpen());
    },
  };

  const mouseEvents = {
    1: ev => {
      nextText();
    },
  };

  React.useEffect(() => {
    input.pushEventListeners('keydown', events);
    input.pushEventListeners('mousedown', mouseEvents);
    ref.current.style.opacity = 1;
    if (backgroundImage) {
      const anim = display.getAnimation(backgroundImage);
      const scale = calculateAndSetScale(800, 600);
      const width2 = 800 * scale;
      const height2 = 600 * scale;
      const left = width / 2 - width2 / 2;
      const top = height / 2 - height2 / 2;
      display.setLoop(() => {
        display.clearScreen();
        if (backgroundImage) {
          display.drawAnim(anim, left, top, { width: width2, height: height2 });
        }
      });
    }
    return () => {
      input.popEventListeners('keydown', events);
      input.popEventListeners('mousedown', mouseEvents);
      display.setLoop(function() {});
    };
  }, [gameInterface, events, mouseEvents, backgroundImage, width, height]);

  return (
    <div
      id="cmpt-game-narrative"
      style={{
        width,
        height,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <div
        ref={ref}
        style={{
          position: 'absolute',
          ...textPosition,
          opacity: 0,
          background: 'rgba(0, 0, 0, 0.65)',
          color: 'white',
          fontSize: '26px',
          border: '2px solid white',
          padding: '25px',
          borderRadius: '5px',
          transition: `opacity ${TRANSITION_TIME / 1000}s`,
        }}
      >
        {text}
      </div>
    </div>
  );
};

export default NarrativeUI;
