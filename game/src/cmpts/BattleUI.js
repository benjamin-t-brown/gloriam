import React from 'react';
import Battle from 'battle/Battle';
import display from 'display/Display';
import input from 'display/Input';
import { cycleNextIndex, cyclePrevIndex } from 'utils';

import PanePartyStatus from 'cmpts/PanePartyStatus';
import BannerSkillTitle from 'cmpts/BannerSkillTitle';
import IndicatorTarget from 'cmpts/IndicatorTarget';
import MenuSkillSelect from 'cmpts/MenuSkillSelect';
import ContainerTargetFollower from 'cmpts/ContainerTargetFollower';

class ContainerBattle extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedPlayerIndex: -1,
      targetedEnemyIndex: 0,
      selectedPlayer: null,
      targetedEnemy: null,
      scale: 5,
    };

    this.battle = new Battle(
      s => {
        this.setState(s);
      },
      props.encounterName,
      props.playerCharacters
    );
    this.battle.setBaseScale(this.state.scale);
    global.battle = this.battle;

    this.events = {
      ArrowLeft: () => {
        if (this.state.selectedPlayer) {
          const newIndex = cycleNextIndex(
            this.state.targetedEnemyIndex,
            this.battle.enemies
          );
          this.battle.targetEnemy(newIndex);
        }
      },
      ArrowRight: () => {
        if (this.state.selectedPlayer) {
          const newIndex = cyclePrevIndex(
            this.state.targetedEnemyIndex,
            this.battle.enemies
          );
          this.battle.targetEnemy(newIndex);
        }
      },
      Tab: ev => {
        ev.preventDefault();
        if (this.state.selectedPlayer) {
          const newIndex = cycleNextIndex(
            this.state.selectedPlayerIndex,
            this.battle.players
          );
          this.battle.selectPlayerCh(newIndex);
        }
      },
      Shift: ev => {
        ev.preventDefault();
        if (this.state.selectedPlayer) {
          this.battle.addPendingSkill(
            this.battle.getCharacter(this.state.targetedEnemyIndex, 'enemies')
              .skills[1],
            this.battle.getCharacter(this.state.selectedPlayerIndex, 'players')
          );
        }
      },
      ' ': ev => {
        ev.preventDefault();
        if (display.isPaused) {
          display.unpause();
        } else {
          display.pause();
        }
      },
    };

    this.selectNextTarget = function (direction) {
      if (direction === 'left') {
        if (this.state.selectedPlayer) {
          const newIndex = cycleNextIndex(
            this.state.targetedEnemyIndex,
            this.battle.enemies
          );
          this.battle.targetEnemy(newIndex);
        }
      } else if (direction === 'right') {
        if (this.state.selectedPlayer) {
          const newIndex = cyclePrevIndex(
            this.state.targetedEnemyIndex,
            this.battle.enemies
          );
          this.battle.targetEnemy(newIndex);
        }
      }
    }.bind(this);

    this.handleResize = () => {
      // const rW = this.battle.getUnitLength() / (display.width);
      // console.log('RW', rW);
      // if (rW < 0.214) {
      // 	this.battle.setBaseScale(this.state.scale - 1);
      // 	this.setState({
      // 		scale: this.state.scale - 1
      // 	});
      // } else if (rW > 0.3414) {
      // 	this.battle.setBaseScale(this.state.scale + 1);
      // 	this.setState({
      // 		scale: this.state.scale + 1
      // 	});
      // }
    };
  }

  componentDidMount() {
    window.addEventListener('resize', this.handleResize);
    input.pushEventListeners('keydown', this.events);
    this.battle.setBaseScale(this.state.scale);
    display.setLoop(() => {
      this.battle.loop();
      this.setState({});
    });
  }

  componentWillUnmount() {
    window.addEventListener('resize', this.handleResize);
    input.popEventListeners('keydown', this.events);
  }

  render() {
    const { scale } = this.state;
    return (
      <div
        style={{
          width: this.props.width,
          height: this.props.height,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <IndicatorTarget
          battle={this.battle}
          ch={this.state.selectedPlayer}
          type="player"
        />
        <IndicatorTarget
          battle={this.battle}
          ch={this.state.selectedPlayer ? this.state.targetedEnemy : null}
          type="enemy"
        />
        <BannerSkillTitle
          battle={this.battle}
          scale={this.battle.baseScale - 1}
        />
        <PanePartyStatus
          battle={this.battle}
          scale={this.battle.baseScale}
          selectedPlayerIndex={this.state.selectedPlayerIndex}
        />
        {this.state.selectedPlayer ? (
          <MenuSkillSelect
            battle={this.battle}
            scale={this.battle.baseScale}
            ch={this.state.selectedPlayer}
          />
        ) : null}
        {this.state.selectedPlayer
          ? this.battle.enemies.map((ch, i) => {
              const size = this.battle.baseScale * 64;
              return (
                <ContainerTargetFollower
                  key={i}
                  target={ch}
                  width={size}
                  height={size}
                >
                  <div
                    className="indicator-target"
                    onClick={() => {
                      this.battle.targetEnemy(i);
                    }}
                    style={{
                      width: size + 'px',
                      height: size + 'px',
                    }}
                  />
                </ContainerTargetFollower>
              );
            })
          : null}
      </div>
    );
  }
}

export default ContainerBattle;
