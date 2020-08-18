import React from 'react';
import { colors } from 'theme';

const MenuClose = ({ onClick }) => {
  return (
    <div
      className="button"
      onClick={onClick}
      style={{
        cursor: 'pointer',
        backgroundColor: colors.red,
        color: colors.white,
        position: 'absolute',
        borderRadius: '10px',
        padding: '10px 20px',
        margin: '10px',
        right: '0px',
        top: '0px',
      }}
    >
      <span style={{ userSelect: 'none', fontSize: '28px' }}>X</span>
    </div>
  );
};

export default MenuClose;
