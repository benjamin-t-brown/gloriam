import React from 'react';
import display from 'display/Display';
import Animation from 'cmpts/Animation';
import { getElem } from 'db';
import { colors } from 'theme';
import scene from 'game/Scene';

const TRANSITION_TIME = 0.25;

const DRAWER_SIZE = 145;
const ITEM_SIZE = 115;

export const MENU_HEIGHT = DRAWER_SIZE;

const Item = ({
  itemName,
  i,
  content,
  isActive,
  setActiveItem,
  unsetActiveItem,
  onClick,
  style,
}) => {
  const item = itemName ? getElem('items', itemName) : null;
  return (
    <div
      className={`ui-elem ui-item ${isActive ? 'ui-item-selected' : ''}`}
      onClick={
        onClick ||
        (ev => {
          if (isActive) {
            unsetActiveItem();
          } else {
            setActiveItem(i, itemName);
          }
          ev.preventDefault();
          ev.stopPropagation();
        })
      }
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: '1rem',
        cursor: 'pointer',
        fontSize: '2rem',
        width: `${ITEM_SIZE}px`,
        height: `${ITEM_SIZE}px`,
        margin: '0px .75rem',
        boxSizing: 'border-box',
        border: isActive ? `4px groove ${colors.yellow}` : '',
        background: isActive ? `${colors.darkGrey}` : '',
        ...style,
      }}
    >
      {itemName ? <Animation animName={item.menuAnimName} /> : null}
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

const MenuBackpack = ({ gameInterface }) => {
  const [open, setOpen] = React.useState(true);
  const [activeItem, setActiveItemObj] = React.useState({
    index: -1,
    itemName: '',
  });
  const [itemRow, setItemRow] = React.useState(0);
  const isColumn = false; // window.innerWidth < window.innerHeight

  React.useEffect(() => {
    if (!scene.getActiveItem() && activeItem.itemName) {
      unsetActiveItem();
    }
  });

  const room = gameInterface.getRoom();
  const act = room.getActiveActor();
  const items = scene.getInventory(act.name);

  const setActiveItem = (index, itemName) => {
    setActiveItemObj({
      itemName,
      index,
    });
    scene.getCommands().playSound('use_item');
    scene.setActiveItem(itemName);
  };

  const unsetActiveItem = () => {
    setActiveItemObj({
      itemName: '',
      index: -1,
    });
    scene.unsetActiveItem();
  };

  const increaseItemRow = () => {
    const numItemsToDisplay = getNumItemsToDisplay();
    const currentStartingIndex = itemRow * numItemsToDisplay;
    const currentEndingIndex = currentStartingIndex + numItemsToDisplay - 1;
    if (currentEndingIndex < items.length - 1) {
      setItemRow(itemRow + 1);
    } else {
      setItemRow(Math.floor((items.length - 1) / numItemsToDisplay));
    }
  };

  const decreaseItemRow = () => {
    if (itemRow - 1 >= 0) {
      setItemRow(itemRow - 1);
    } else {
      setItemRow(0);
    }
  };

  const getNumItemsToDisplay = () => {
    const width = window.innerWidth - ITEM_SIZE - 185;
    return Math.floor(width / ITEM_SIZE) || 1;
  };

  const numItemsToDisplay = getNumItemsToDisplay();
  let startingIndex = itemRow * numItemsToDisplay;
  if (numItemsToDisplay >= items.length) {
    startingIndex = 0;
  }
  const itemsToDisplay = items.slice(
    startingIndex,
    startingIndex + numItemsToDisplay
  );

  const rowStyle = {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    width: '100%',
    height: open ? `${DRAWER_SIZE}px` : '0px',
    transition: `height ${TRANSITION_TIME}s ease-out, opacity ${TRANSITION_TIME}s`,
    backgroundColor: colors.greyBlue,
    border: open ? `10px ridge ${colors.yellow}` : '0px solid white',
    display: 'flex',
    justifyContent: 'flex-start',
    alignItems: 'center',
    opacity: open ? 1 : 0,
    boxSizing: 'border-box',
  };
  return (
    <>
      <div
        className="ui-elem"
        style={rowStyle}
        onClick={() => {
          if (activeItem.index > -1) {
            unsetActiveItem();
          }
        }}
      >
        <div
          style={{
            position: 'absolute',
            color: colors.white,
            right: '-10px',
            top: '-67px',
            padding: '0px 8px',
            fontSize: '32px',
            background: 'rgba(0, 0, 0, 0.7)',
            border: `10px ridge ${colors.purple}`,
            display: activeItem.index > -1 ? 'block' : 'none',
          }}
        >
          {activeItem.index > -1 ? `Use ${activeItem.itemName} with what?` : ''}
        </div>
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
            content="Menu"
            onClick={ev => {
              // display.playSoundName('bag_close');
              // setOpen(false);
              gameInterface.setEscMenuOpen(true);
              ev.preventDefault();
            }}
          />
          <ScrollBar
            isColumn={isColumn}
            onUpClick={decreaseItemRow}
            onDownClick={increaseItemRow}
          />
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-start',
              flexDirection: 'row-reverse',
            }}
          >
            {itemsToDisplay.map((itemName, i) => {
              return (
                <Item
                  key={i}
                  itemName={itemName}
                  i={i + startingIndex}
                  isActive={i + startingIndex === activeItem.index}
                  setActiveItem={(ind, itemName) => {
                    setActiveItem(ind, itemName);
                  }}
                  unsetActiveItem={() => {
                    unsetActiveItem();
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};

export default MenuBackpack;
