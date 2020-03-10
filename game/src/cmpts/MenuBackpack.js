import React from 'react';
import input from 'display/Input';
import display from 'display/Display';

const TRANSITION_TIME = 0.25;

const DRAWER_SIZE = 125;
const ITEM_SIZE = 115;

const ScrollBar = ({ onDownClick, onUpClick, isColumn, style }) => {
  const buttonStyle = {
    padding: '5px',
    backgroundColor: '#2E3740',
    color: '#F8F8F8',
    border: '1px solid #FFCE00',
    cursor: 'pointer',
  };
  return (
    <div
      className="ui-elem"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: isColumn ? 'row' : 'column',
        fontSize: '2rem',
        marginRight: `${(DRAWER_SIZE - ITEM_SIZE) / 2}px`,
        [isColumn ? 'width' : 'height']: ITEM_SIZE + 'px',
        ...style,
      }}
    >
      <div className="ui-elem button" style={buttonStyle} onClick={onUpClick}>
        <span className="no-select">{isColumn ? '🡢' : '🡡'}</span>
      </div>
      <div className="ui-elem button" style={buttonStyle} onClick={onDownClick}>
        <span className="no-select">{isColumn ? '🡠' : '🡣'}</span>
      </div>
    </div>
  );
};

const Item = ({ itemName, content, onClick, style }) => {
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (itemName) {
      display.setCanvas(ref.current);
      display.drawSprite(itemName, ITEM_SIZE / 2, ITEM_SIZE / 2, {
        centered: true,
      });
      display.restoreCanvas();
    }
  });

  return (
    <div
      className="ui-elem"
      onClick={
        onClick ||
        (ev => {
          ev.preventDefault();
        })
      }
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#7A444A',
        borderRadius: '1rem',
        color: '#FFCE00',
        cursor: 'pointer',
        fontSize: '4rem',
        width: `${ITEM_SIZE}px`,
        height: `${ITEM_SIZE}px`,
        border: '1px solid #FFCE00',
        ...style,
      }}
    >
      {itemName ? <canvas width={ITEM_SIZE} height={ITEM_SIZE}></canvas> : null}
      <span className="no-select">{content}</span>
    </div>
  );
};

const MenuBackpack = ({ items }) => {
  const [open, setOpen] = React.useState(false);
  const [hover, setHover] = React.useState(false);
  const isColumn = false; // window.innerWidth < window.innerHeight;

  const rowStyle = {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    width: '100%',
    height: open ? `${DRAWER_SIZE}px` : '0px',
    transition: `height ${TRANSITION_TIME}s ease-out, opacity ${TRANSITION_TIME}s`,
    backgroundColor: '#50576B',
    borderTop: open ? '5px solid #FFCE00' : '0px solid white',
    overflow: 'hidden',
    display: 'flex',
    justifyContent: 'flex-start',
    alignItems: 'center',
    opacity: open ? 1 : 0,
  };

  const columnStyle = {
    position: 'fixed',
    bottom: 0,
    right: 0,
    top: 0,
    height: '100%',
    width: open ? `${DRAWER_SIZE}px` : '0px',
    transition: `width ${TRANSITION_TIME}s ease-out, opacity ${TRANSITION_TIME}s`,
    backgroundColor: '#50576B',
    borderLeft: open ? '5px solid #FFCE00' : '0px solid white',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column-reverse',
    justifyContent: 'flex-start',
    alignItems: 'center',
    opacity: open ? 1 : 0,
  };
  return (
    <>
      <div className="ui-elem" style={isColumn ? columnStyle : rowStyle}>
        <div
          style={{
            display: 'flex',
            flexDirection: isColumn ? 'column' : 'row',
            position: open ? 'fixed' : 'absolute',
            right: 0,
            marginRight: `${(DRAWER_SIZE - ITEM_SIZE) / 2}px`,
          }}
        >
          <ScrollBar isColumn={isColumn} />
          <Item
            content={isColumn ? '⯈' : '▼'}
            onClick={ev => {
              setOpen(false);
              setHover(false);
              ev.preventDefault();
            }}
          />
        </div>
      </div>
      <div
        className="ui-elem"
        style={{
          // backgroundColor: 'rgba(0, 0, 0, 0.3)',
          borderRadius: '8px',
          padding: '5px',
          cursor: 'pointer',
          transition: `opacity ${TRANSITION_TIME}s ease-out`,
          opacity: open ? 0 : 1,
          pointerEvents: open ? 'none' : null,
          position: 'fixed',
          bottom: 0,
          right: 0,
        }}
        onDragStart={ev => {
          ev.preventDefault();
        }}
        onClick={ev => {
          console.log('CLICK!');
          input.setUIInputDisabled(true);
          setOpen(true);
          ev.preventDefault();
          ev.stopPropagation();
          setTimeout(() => {
            input.setUIInputDisabled(false);
          });
        }}
      >
        <img
          src="/img/static-bag.png"
          alt="inventory"
          style={{
            cursor: 'pointer',
          }}
        ></img>
      </div>
    </>
  );
};

export default MenuBackpack;
