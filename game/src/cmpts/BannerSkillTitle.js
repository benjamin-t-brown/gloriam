import React from 'react';

export default function(props) {
  const { battle, scale } = props;
  const skillObj = battle.pendingSkills[0];

  const fontSize = scale * 8 + 'px';
  if (skillObj) {
    const {
      skill: { name, owner },
    } = skillObj;
    return (
      <div
        style={{
          textAlign: 'center',
          fontSize,
          color: '#F8F8F8',
          backgroundColor: 'rgba(16,30,41,0.5)',
          paddingTop: scale * 6 + 'px',
          paddingBottom: scale * 6 + 'px',
          width: '100%',
          position: 'absolute',
          left: '0px',
          top: scale * 4 + 'px',
        }}
      >
        <span
          style={{
            color: battle.isCharacterEnemy(owner) ? '#E1534A' : '#42CAFD',
          }}
        >
          {owner.name}
        </span>
        <span> uses </span>
        <span
          style={{
            color: '#BCB7C5',
          }}
        >
          {name}
        </span>
      </div>
    );
  } else {
    return <div />;
  }
}
