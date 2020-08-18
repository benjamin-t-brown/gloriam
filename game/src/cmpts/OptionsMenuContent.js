import React from 'react';
import MenuBack from 'cmpts/MenuBack';
import { MENU_STATES } from 'cmpts/EscMenu';
import { colors } from 'theme';

const OptionsMenuContent = ({ setCurrentMenu }) => {
  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        justifyContent: 'center',
        flexDirection: 'column',
      }}
    >
      <MenuBack onClick={() => setCurrentMenu(MENU_STATES.MAIN)} />
      <div className="main-menu-title">Options</div>
      <div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            color: colors.white,
            fontSize: '32px',
          }}
        >
          <input
            id="sound"
            name="sound"
            style={{
              marginRight: '32px',
              transform: 'scale(2)',
            }}
            type="checkbox"
          ></input>
          <label htmlFor="sound"> Enable Sound</label>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            color: colors.white,
            fontSize: '32px',
          }}
        >
          <input
            id="voice"
            name="voice"
            style={{
              marginRight: '32px',
              transform: 'scale(2)',
            }}
            type="checkbox"
          ></input>
          <label htmlFor="voice"> Enable Voice</label>
        </div>
      </div>
    </div>
  );
};

export default OptionsMenuContent;
