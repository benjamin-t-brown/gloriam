import React from 'react';
import { colors } from 'theme';

const MenuBack = ({ onClick }) => {
  return (
    <div
      className="button"
      onClick={onClick}
      style={{
        cursor: 'pointer',
        backgroundColor: colors.blue,
        color: colors.white,
        position: 'absolute',
        borderRadius: '10px',
        padding: '10px',
        margin: '10px',
        left: '0px',
        top: '0px',
      }}
    >
      <span style={{ userSelect: 'none', fontSize: '28px' }}>Back</span>
    </div>
  );
};

export default MenuBack;
