import React from 'react';
import ContainerTargetFollower from 'cmpts/ContainerTargetFollower';
import ScaledAnimation from 'cmpts/ScaledAnimation';

export default function (props) {
  const { ch, battle, type } = props;

  const size = battle.baseScale * 64;

  if (!ch) {
    return <div className="indicator-player" />;
  }

  return (
    <ContainerTargetFollower target={ch} width={size} height={size}>
      <div
        className="indicator-target"
        style={{
          width: size + 'px',
          height: size + 'px',
        }}
      >
        <ScaledAnimation
          animName={type === 'player' ? 'playerIndicator' : 'enemyIndicator'}
          scale={battle.baseScale}
        />
      </div>
    </ContainerTargetFollower>
  );
}
