import React from 'react';
import { colors } from 'utils';
import Text from 'elements/text';
import Button from 'elements/button';
import Input from 'elements/input';
import display from 'content/display';
import { addSpriteAtIndex } from 'cmpts/cmpt-frames-area';

const AnimationPreview = ({ anim, appInterface }) => {
  const ref = React.useRef(null);
  const canvasWidth = 225;
  const canvasHeight = 225;
  React.useEffect(() => {
    display.setLoop(() => {
      display.setCanvas(ref.current);
      display.clearScreen();
      if (window.appInterface.animation) {
        display.drawAnimation(anim, canvasWidth / 2, canvasHeight / 2, {
          centered: true,
        });
      }
      display.restoreCanvas();
    });
  });

  return (
    <div
      style={{
        padding: '5px',
        justifyContent: 'center',
        flexDirection: 'column',
        alignItems: 'center',
        backgroundColor: colors.darkBlue,
        borderBottom: '1px solid ' + colors.grey,
      }}
    >
      <div
        style={{
          paddingBottom: '5px',
        }}
      >
        <div
          className="no-select"
          style={{
            paddingBottom: '5px',
            textAlign: 'center',
            color: colors.lightBlue,
          }}
        >
          {anim ? anim.name : '(select animation)'}
        </div>
        <canvas
          style={{
            margin: '5px',
            border: '1px solid ' + colors.white,
            backgroundColor: 'black',
          }}
          ref={ref}
          width={canvasWidth}
          height={canvasHeight}
        ></canvas>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Button
            type="secondary"
            disabled={anim ? false : true}
            onClick={() => {
              if (anim) {
                anim.reset();
                anim.start();
              }
            }}
          >
            Play ▶
          </Button>
        </div>
      </div>
    </div>
  );
};

const AnimationTxt = ({ anim, appInterface }) => {
  const txt = (anim && display.getFormattedTxtForAnimation(anim)) || '';
  return (
    <div>
      <textarea
        style={{
          width: '100%',
          height: '200px',
          backgroundColor: colors.black,
          color: colors.white,
          border: '1px solid ' + colors.grey,
        }}
        readOnly
        value={txt}
        onChange={ev => {}}
      ></textarea>
    </div>
  );
};

const AnimationArea = ({ appInterface }) => {
  const [defaultDuration, setDefaultDuration] = React.useState(100);
  const imageName = appInterface.imageName;
  const anim = appInterface.animation;
  return (
    <div>
      <div
        style={{
          borderBottom: '1px solid ' + colors.grey,
          paddingTop: '5px',
          paddingBottom: '6px',
        }}
      >
        <Text type="title" ownLine={true} centered={true}>
          Preview
        </Text>
      </div>
      <AnimationPreview anim={anim} appInterface={appInterface} />
      <AnimationTxt anim={anim} appInterface={appInterface} />
      {anim && (
        <div style={{ margin: '5px' }}>
          <Input
            type="checkbox"
            name="loop"
            label="Loop"
            value={anim.loop}
            checked={anim.loop}
            style={{
              width: '160px',
            }}
            onChange={() => {
              display.updateAnimation(
                anim,
                imageName,
                !anim.loop,
                anim.sprites
              );
              appInterface.setAnimation(display.getAnimation(anim.name));
            }}
          />
          <Input
            type="number"
            name="duration"
            label="Anim Duration"
            value={defaultDuration}
            style={{
              width: '160px',
            }}
            onChange={ev => setDefaultDuration(Number(ev.target.value))}
            onBlur={() => {
              appInterface.setDefaultAnimDuration(defaultDuration);
            }}
          />
          <Button
            style={{ marginTop: '15px' }}
            type="primary"
            onClick={() => {
              addSpriteAtIndex(
                anim,
                'invisible',
                anim.sprites.length,
                defaultDuration
              );
              appInterface.setAnimation(display.getAnimation(anim.name));
            }}
          >
            + Add Invisible
          </Button>
        </div>
      )}
    </div>
  );
};

export default AnimationArea;
