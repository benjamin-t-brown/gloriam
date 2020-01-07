import React from 'react';
import ContainerTargetFollower from 'cmpts/ContainerTargetFollower';

const BLACK = 'rgba(0,0,0,0.8)';
const TRANSPARENT = 'rgba(0,0,0,0)';

const HoverFollower = props => {
  const {
    act,
    room,
    containerKey,
    setHoveredActor,
    setSelectedActor,
    hoveredActor,
    selectedActor,
  } = props;
  const width = act.width * room.baseScale;
  const height = act.height * room.baseScale;
  const isSelected = selectedActor === act;
  const isHovered = hoveredActor === act;
  const isSelectedOrHovered = isSelected || isHovered;
  return (
    <ContainerTargetFollower
      key={containerKey}
      target={act}
      width={width}
      height={height}
    >
      <div
        onMouseOver={setHoveredActor(act)}
        onMouseOut={setHoveredActor(null)}
        onClick={setSelectedActor(act)}
        style={{
          width: width + 'px',
          height: height + 'px',
          cursor: 'pointer',
          textAlign: 'center',
        }}
      >
        {isSelectedOrHovered && (
          <div
            className={isSelected ? 'room-animated-border' : null}
            style={{
              borderTop: !isSelected ? '1px solid' : null,
              borderBottom: !isSelected ? '1px solid' : null,
              borderColor: !isSelected ? 'transparent' : null,
              background: `linear-gradient(to right, ${TRANSPARENT} 0%, ${BLACK} 49%, ${TRANSPARENT} 100%)`,
              pointerEvents: 'none',
              paddingBottom: '2px',
              width: 'calc(100% - 2px)',
              color: 'white',
              position: 'absolute',
              fontSize: '16px',
              left: 1,
              top: 1,
            }}
          >
            {act.name}
          </div>
        )}
      </div>
    </ContainerTargetFollower>
  );
};

export default HoverFollower;
