import React from 'react';
import MenuList from 'cmpts/MenuList';
import MenuBack from 'cmpts/MenuBack';
import { MENU_STATES } from 'cmpts/EscMenu';
import { colors } from 'theme';

const SaveMenuContent = ({ setCurrentMenu }) => {
  const saves = [];
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
      <div className="main-menu-title">Save Game</div>
      <MenuList
        items={[
          {
            label: '+ New Save',
            backgroundColor: colors.darkGreen,
            onClick: () => {
              // TODO create new save
            },
          },
          ...saves.map(save => {
            return {
              label: save.name,
              onClick: () => {
                // TODO save over slot
              },
            };
          }),
        ]}
      />
    </div>
  );
};

export default SaveMenuContent;
