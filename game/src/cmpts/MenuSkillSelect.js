import React from 'react';
import ScaledAnimation from 'cmpts/ScaledAnimation';
import input from 'display/Input';
import { hexToRGBA, cycleNextIndex, cyclePrevIndex } from 'utils';
import { SKILL_TYPES } from 'db/skills';

const skillColors = {
  [SKILL_TYPES.default]: hexToRGBA('#5A5353', 1),
  [SKILL_TYPES.damage]: hexToRGBA('#A93B3B', 1),
  [SKILL_TYPES.shield]: hexToRGBA('#3978A8', 1),
  [SKILL_TYPES.support]: hexToRGBA('#005F1B', 1),
  [SKILL_TYPES.special]: hexToRGBA('#564064', 1),
  [SKILL_TYPES.ultimate]: hexToRGBA('#BF7958', 1),
};

class MenuSkillSelect extends React.Component {
  constructor(props) {
    super(props);

    this.events = {
      ArrowUp: () => {
        const { ch } = this.props;
        ch.selectSkill(cyclePrevIndex(ch.selectedSkillIndex, ch.skills));
      },
      ArrowDown: () => {
        const { ch } = this.props;
        ch.selectSkill(cycleNextIndex(ch.selectedSkillIndex, ch.skills));
      },
      Enter: () => {
        const { battle, ch } = this.props;
        battle.addPendingSkill(ch.getSelectedSkill(), battle.getTarget());
        battle.unselectPlayerCh();
      },
    };

    this.handleMouseOver = function(i) {
      const { ch } = this.props;
      ch.selectSkill(i);
    };

    this.handleMouseDown = function(i) {
      const { battle, ch } = this.props;
      ch.selectSkill(i);
      battle.addPendingSkill(ch.getSelectedSkill(), battle.getTarget());
      battle.unselectPlayerCh();
    };
  }

  componentDidMount() {
    input.pushEventListeners('keydown', this.events);
  }

  componentWillUnmount() {
    input.popEventListeners('keydown', this.events);
  }

  render() {
    const { battle, ch, scale } = this.props;

    if (!ch) {
      return <div />;
    }

    const indicatorSize = Math.ceil(battle.baseScale / 2);
    const skillHeight = scale * 12;
    const fontSize = scale * 5;

    return (
      <div
        style={{
          position: 'absolute',
          right: 0,
          bottom: 0,
          fontSize: fontSize + 'px',
          overflow: 'visible',
          textAlign: 'center',
          minWidth: '300px',
          backgroundColor: 'rgba(16, 30, 41, 0.7)',
          border: '4px solid #BCB7C5',
          borderBottom: '4px solid #8D87A2',
          borderRight: '4px solid #8D87A2',
        }}
      >
        {ch.skills.map((skill, i) => {
          const { name, skillType } = skill;
          const isSelected = ch.selectedSkillIndex === i;
          return (
            <div
              key={skill.name + i}
              style={{
                color: '#F8F8F8',
                backgroundImage: isSelected
                  ? `linear-gradient(to left, ${skillColors[skillType]}, ${skillColors[skillType]})`
                  : `linear-gradient(to left, ${skillColors[skillType]}, rgba(0,0,0,0))`,
                paddingTop: skillHeight / 2,
                paddingBottom: skillHeight / 2,
                marginLeft: '2px',
                marginRight: '2px',
                border: scale + 'px solid rgba(0,0,0,0)',
                cursor: 'pointer',
              }}
              onMouseOver={this.handleMouseOver.bind(this, i)}
              onMouseDown={this.handleMouseDown.bind(this, i)}
            >
              {name}
            </div>
          );
        })}
        <div
          style={{
            position: 'absolute',
            width: indicatorSize + 'px',
            height: indicatorSize + 'px',
            left: (-64 * indicatorSize) / 2 + 'px',
            top:
              (-64 * indicatorSize) / 2 +
              (skillHeight + fontSize + 2 + scale * 2) * ch.selectedSkillIndex +
              (skillHeight + fontSize + 2 + scale * 2) / 2 +
              'px',
          }}
        >
          <ScaledAnimation
            animName="menuIndicatorLeftToRight"
            scale={Math.ceil(battle.baseScale / 2)}
          />
        </div>
      </div>
    );
  }
}

export default MenuSkillSelect;
