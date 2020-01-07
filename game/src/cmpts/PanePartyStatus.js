import React from 'react';
import ScaledSprite from 'cmpts/ScaledSprite';

function CooldownBar(props) {
  const { scale, battle, ch } = props;
  const pct = ch.getMinCooldownPct();

  return (
    <div
      style={{
        position: 'relative',
        textAlign: 'center',
        color: '#F8F8F8',
        padding: scale * 2 + 'px',
        borderTop: '2px solid #BCB7C5',
        borderLeft: '2px solid #BCB7C5',
        borderBottom: '2px solid #8D87A2',
        borderRight: '2px solid #8D87A2',
        backgroundColor: '#5A5353',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: pct + '%',
          height: '100%',
          fontSize: 14 + 'px',
          backgroundColor:
            pct < 100
              ? '#3F7E00'
              : battle.isCharacterWaitingToUseSkill(ch)
              ? '#564064'
              : '#00A383',
        }}
      >
        {pct === 100
          ? battle.isCharacterWaitingToUseSkill(ch)
            ? 'Waiting...'
            : 'Ready'
          : ''}
      </div>
    </div>
  );
}

function HealthBar(props) {
  const { scale, value, pct, color, backgroundColor } = props;
  const numberFontSize = 5 * scale;

  return (
    <>
      <div
        style={{
          position: 'relative',
          height: scale * 4.5 + 'px',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            bottom: scale,
            width: pct + '%',
            height: scale + 'px',
            backgroundColor: backgroundColor,
          }}
        />
        <span
          style={{
            position: 'absolute',
            left: 0,
            bottom: 0,
            color: color,
            fontSize: numberFontSize,
          }}
        >
          {value}
        </span>
      </div>
    </>
  );
}

function PanelCharacter(props) {
  const { battle, ch, scale, isSelected, playerIndex } = props;

  const nameFontSize = 5 * scale;
  const spriteName = ch.name.toLowerCase() + 'BattlePortrait';

  const hp = ch.stats.getCurrentHp();
  const shield = ch.stats.getCurrentShield();

  const hpPct = (100 * hp) / ch.stats.getMaxHp();
  const shieldPct = (100 * shield) / ch.stats.getMaxShield();

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'flex-start',
        backgroundImage: isSelected
          ? `linear-gradient(to right, ${'rgba(0,95,27,1.0)'}, rgba(0,0,0,0))`
          : null,
        padding: scale + 'px',
        cursor: 'pointer',
      }}
      onMouseDown={() => {
        battle.selectPlayerCh(playerIndex);
      }}
    >
      <div
        style={{
          width: 24 * scale + 'px',
        }}
      >
        <ScaledSprite scale={scale - 1} spriteName={spriteName} />
      </div>
      <div
        style={{
          width: scale * 35,
        }}
      >
        <div
          style={{
            color: '#F8F8F8',
            borderBottom: '1px solid #50576B',
            borderBottomRightRadius: '10px',
            fontSize: nameFontSize + 'px',
            textAlign: 'center',
            margin: '2px',
          }}
        >
          {ch.name}
        </div>
        <HealthBar
          scale={scale}
          value={shield}
          pct={shieldPct}
          color="#92F4FF"
          backgroundColor="#3978A8"
        />
        <HealthBar
          scale={scale}
          value={hp}
          pct={hpPct}
          color="#FFAEB6"
          backgroundColor="#A93B3B"
        />
        <CooldownBar battle={battle} scale={scale} ch={ch} />
      </div>
    </div>
  );
}

export default function(props) {
  const { battle, scale, selectedPlayerIndex } = props;

  return (
    <div
      style={{
        position: 'fixed',
        left: 0,
        bottom: 0,
        minWidth: '300px',
        backgroundColor: 'rgba(16, 30, 41, 0.7)',
        border: '4px solid #BCB7C5',
        borderBottom: '4px solid #8D87A2',
        borderRight: '4px solid #8D87A2',
      }}
    >
      {battle.players.map((ch, i) => {
        return (
          <PanelCharacter
            key={ch.name}
            battle={battle}
            ch={ch}
            scale={scale}
            playerIndex={i}
            isSelected={selectedPlayerIndex === i}
          />
        );
      })}
    </div>
  );
}
