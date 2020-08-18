import React from 'react';
import MenuList from 'cmpts/MenuList';
import MenuBack from 'cmpts/MenuBack';
import MenuClose from 'cmpts/MenuClose';
import SaveMenuContent from 'cmpts/SaveMenuContent';
import LoadMenuContent from 'cmpts/LoadMenuContent';
import OptionsMenuContent from 'cmpts/OptionsMenuContent';
import { colors } from 'theme';

export const MENU_STATES = {
  MAIN: 0,
  SAVE: 1,
  LOAD: 2,
  OPTIONS: 3,
};

const EscMenuContent = ({ setCurrentMenu, gameInterface }) => {
  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        justifyContent: 'center',
        flexDirection: 'column',
      }}
    >
      <div className="main-menu-title">Menu</div>
      <MenuBack onClick={() => gameInterface.setEscMenuOpen(false)} />
      <MenuClose onClick={() => gameInterface.setEscMenuOpen(false)} />
      <MenuList
        items={[
          {
            label: 'Save',
            onClick: () => {
              setCurrentMenu(MENU_STATES.SAVE);
            },
          },
          {
            label: 'Load',
            onClick: () => {
              setCurrentMenu(MENU_STATES.LOAD);
            },
          },
          {
            label: 'Options',
            onClick: () => {
              setCurrentMenu(MENU_STATES.OPTIONS);
            },
          },
          {
            label: 'Exit',
            backgroundColor: colors.red,
            onClick: () => {},
          },
        ]}
      />
    </div>
  );
};

const EscMenu = ({ open, gameInterface }) => {
  const [currentMenu, setCurrentMenu] = React.useState();

  let elem = null;
  switch (currentMenu) {
    case MENU_STATES.SAVE:
      elem = <SaveMenuContent setCurrentMenu={setCurrentMenu} />;
      break;
    case MENU_STATES.LOAD:
      elem = <LoadMenuContent setCurrentMenu={setCurrentMenu} />;
      break;
    case MENU_STATES.OPTIONS:
      elem = <OptionsMenuContent setCurrentMenu={setCurrentMenu} />;
      break;
    case MENU_STATES.MAIN:
    default:
      elem = (
        <EscMenuContent
          setCurrentMenu={setCurrentMenu}
          gameInterface={gameInterface}
        />
      );
  }

  return (
    <div
      className="anim-clouds"
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        opacity: open ? '1' : '0',
        pointerEvents: open ? undefined : 'none',
        transition: 'opacity 0.25s linear, border-width 0.25s linear',
        boxSizing: 'border-box',
        // border: `50px ridge ${colors.greyBlue}`,
        borderStyle: 'ridge',
        borderColor: colors.greyBlue,
        borderWidth: open ? '50px' : '0px',
      }}
    >
      <div
        style={{
          border: `15px ridge ${colors.yellow}`,
          minWidth: '750px',
          background: 'rgba(0, 0, 0, 0.7)',
          padding: '30px',
        }}
      >
        {elem}
      </div>
    </div>
  );
};

export default EscMenu;
