import React from 'react';
import { colors } from 'theme';

const MenuListButton = ({ label, onClick, backgroundColor }) => {
  return (
    <div
      className="button"
      onClick={onClick}
      style={{
        padding: '10px',
        borderRadius: '10px',
        margin: '10px',
        cursor: 'pointer',
        background: backgroundColor || colors.blue,
        color: colors.white,
        fontSize: '32px',
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      {label}
    </div>
  );
};

const MenuList = ({ items }) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
      }}
    >
      {items.map((item, i) => {
        return (
          <MenuListButton
            key={i}
            label={item.label}
            onClick={item.onClick}
            backgroundColor={item.backgroundColor}
          />
        );
      })}
    </div>
  );
};

export default MenuList;
