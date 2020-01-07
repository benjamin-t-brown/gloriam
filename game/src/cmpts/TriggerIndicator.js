import React from 'react';
import display from 'display/Display';
import theme from 'main/theme';
import { hexToRGBA } from 'utils';
import { getWaypointPath } from 'pathfinding';
import { pt } from 'utils';
import { HEADINGS } from 'main/Actor';
import scene from 'main/Scene';
import input from 'display/Input';

const getPadding = room => {
  return Math.min(room.baseScale * 2, 10);
};

const TriggerIndicator = props => {
  const { room, trigger } = props;
  const div = React.useRef(null);
  const text = React.useRef(null);
  React.useEffect(() => {
    const { width: textWidth } = display.measureText({
      text: trigger.name,
      size: room.getFontSize(),
    });
    room.addRenderable(trigger.name, () => {
      if (!div.current || !text.current) {
        return;
      }
      const tDiv = div.current;
      const tText = text.current;
      const { x, y } = room.worldToRenderCoords(trigger);
      const width = trigger.width * room.baseScale;
      const height = trigger.height * room.baseScale;
      tDiv.style.left = x;
      tDiv.style.top = y;
      tDiv.style.width = width;
      tDiv.style.height = height;

      let left = x + width / 2 - textWidth / 2 - getPadding(room);
      if (left + textWidth > window.innerWidth) {
        left = window.innerWidth - textWidth - getPadding(room) * 2;
      }
      if (left < 0) {
        left = 0;
      }
      tText.style.left = left;
      tText.style.top = y;
      if (trigger.cursor) {
        tDiv.style.cursor = trigger.cursor;
      }
    });
    return () => {
      room.removeRenderable(trigger.id);
    };
  }, [trigger, room, room.baseScale]);
  const [visible, setVisible] = React.useState(false);
  const handleClick = ev => {
    if (!input.isUIInputEnabled()) {
      return;
    }
    const triggerName = room.name + '-' + trigger.name;
    const act = room.getActiveActor();
    const triggerPoint = pt(
      trigger.x + trigger.width / 2,
      trigger.y + trigger.height + 1
    );
    if (act.isAtWalkPosition(triggerPoint)) {
      act.setHeading(HEADINGS.UP);
      scene.callTrigger(triggerName, 'action');
      return;
    }
    const path = getWaypointPath(act.getWalkPosition(), triggerPoint, room.walls, room);
    if (path.length) {
      act.setWalkPath(path, () => {
        act.setHeading(HEADINGS.UP);
        scene.callTrigger(triggerName, 'action');
      });
    } else {
      // TODO: say 'cant reach' text
    }
    ev.stopPropagation();
  };

  return (
    <>
      <div
        ref={div}
        onMouseOver={() => setVisible(true)}
        onMouseOut={() => setVisible(false)}
        onClick={handleClick}
        className="trigger-container"
      ></div>
      <div
        ref={text}
        style={{
          visibility: visible ? 'visible' : 'hidden',
          whiteSpace: 'pre',
          color: theme.palette.white,
          position: 'fixed',
          fontSize: room.getFontSize(),
          padding: getPadding(room),
          backgroundColor: hexToRGBA(theme.palette.black, 0.5),
          pointerEvents: 'none',
        }}
      >
        {trigger.name}
      </div>
    </>
  );
};

export default TriggerIndicator;
