import React from 'react';
import display from 'display/Display';
import Animation from 'cmpts/Animation';
import { getElem } from 'db';

const TRANSITION_TIME = 0.25;

const DRAWER_SIZE = 125;
const ITEM_SIZE = 115;

export const MENU_HEIGHT = DRAWER_SIZE;

const Item = ({ itemName, content, onClick, style }) => {
  const item = itemName ? getElem('items', itemName) : null;
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
        borderRadius: '1rem',
        cursor: 'pointer',
        fontSize: '4rem',
        width: `${ITEM_SIZE}px`,
        height: `${ITEM_SIZE}px`,
        margin: '0px .75rem',
        ...style,
      }}
    >
      {itemName ? <Animation animName={item.animName} /> : null}
      <span className="no-select">{content}</span>
    </div>
  );
};

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

const MenuBackpack = ({ items }) => {
  const [open, setOpen] = React.useState(false);
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
            flexDirection: isColumn ? 'column-reverse' : 'row-reverse',
            position: open ? 'fixed' : 'absolute',
            right: 0,
            marginRight: `${(DRAWER_SIZE - ITEM_SIZE) / 2}px`,
          }}
        >
          <Item
            style={{
              backgroundColor: '#7A444A',
              color: '#FFCE00',
              border: '1px solid #FFCE00',
            }}
            content={isColumn ? '⯈' : '▼'}
            onClick={ev => {
              display.playSoundName('bag_close');
              setOpen(false);
              ev.preventDefault();
            }}
          />
          <ScrollBar isColumn={isColumn} />
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-start',
              flexDirection: 'row-reverse',
            }}
          >
            {items.map(itemName => {
              return <Item itemName={itemName} />;
            })}
          </div>
        </div>
      </div>
      <div
        className="ui-elem"
        style={{
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
          display.playSoundName('bag_open');
          setOpen(true);
          ev.preventDefault();
          ev.stopPropagation();
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
