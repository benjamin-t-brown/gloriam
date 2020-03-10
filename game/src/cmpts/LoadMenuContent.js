import React from 'react';
import MenuList from 'elements/MenuList';
import MenuBack from 'elements/MenuBack';
import { MENU_STATES } from 'cmpts/EscMenu';
import { colors } from 'theme';

const LoadMenuContent = ({ setCurrentMenu }) => {
  const loads = [];
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
      <div className="main-menu-title">Load Game</div>
      <MenuList
        items={[
          {
            label: '+ Upload Game',
            backgroundColor: colors.purple,
            onClick: () => {
              // TODO create new save
            },
          },
          ...loads.map(load => {
            return {
              label: load.name,
              onClick: () => {
                // TODO load save
              },
            };
          }),
        ]}
      />
    </div>
  );
};

export default LoadMenuContent;
