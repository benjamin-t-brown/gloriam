import React from 'react';
import display from 'display/Display';
import input from 'display/Input';
import { pt, drawPath, calculateAndSetScale } from 'utils';
import TriggerIndicator from 'cmpts/TriggerIndicator';
import MenuBackpack from 'cmpts/MenuBackpack';
import scene from '../main/Scene';

class RoomUI extends React.Component {
  constructor(props) {
    super(props);
    this.mouse = {};
    this.events = {
      ' ': ev => {
        ev.preventDefault();
        this.loop = false;
        // if (display.isPaused) {
        //   display.unpause();
        // } else {
        //   display.pause();
        // }
      },
      Escape: ev => {
        ev.preventDefault();
        this.props.gameInterface.setEscMenuOpen(
          !this.props.gameInterface.isEscMenuOpen()
        );
      },
    };

    this.mouseEvents = {
      1: ev => {
        this.handleClick(ev);
      },
    };

    this.calculateAndSetScale();
  }

  handleClick = ev => {
    const point = this.props.room.renderToWorldCoords(pt(ev.clientX, ev.clientY));
    if (input.isUIInputEnabled() && !scene.isExecutingBlockingScene()) {
      const clickedAct = this.props.room.getItemOrCharacterAt(point.x, point.y);
      if (clickedAct && clickedAct.talkTrigger) {
        scene.callTrigger(clickedAct.talkTrigger, 'action');
      } else {
        const act = this.props.room.getActiveActor();
        this.props.room.actorWalkTowards(act, point);
      }
    }
  };

  calculateAndSetScale() {
    this.props.room.setBaseScale(
      calculateAndSetScale(this.props.room.width, this.props.room.height)
    );
  }

  componentDidMount() {
    this.handleResize = () => this.calculateAndSetScale();
    window.addEventListener('resize', this.handleResize);
    input.pushEventListeners('keydown', this.events);
    input.pushEventListeners('mousedown', this.mouseEvents);

    const drawDebugMouse = () => {
      const mouse = this.mouse;
      const mP = this.props.room.renderToWorldCoords(this.mouse);

      //display.drawRect(mouse.x - 5, mouse.y - 5, 10, 10, 'blue');
      display.drawText(
        Math.round(mouse.x) +
          ', ' +
          Math.round(mouse.y) +
          ':' +
          Math.round(mP.x) +
          ',' +
          Math.round(mP.y),
        Math.round(mouse.x + 20),
        Math.round(mouse.y),
        {}
      );
    };

    const drawDebugGraph = graph => {};

    this.loop = true;
    display.setLoop(() => {
      display.clearScreen();
      this.props.room.loop();
      drawDebugMouse();
      if (this.loop === false) {
        throw new Error('Loop execution stopped by a user event.');
      }
      if (this.props.walk.path && this.props.walk.path.length) {
        drawPath(
          this.props.walk.start,
          this.props.walk.end,
          this.props.walk.path,
          this.props.room
        );
      }
    });
    this.props.room.loop();
    //this.forceUpdate();
  }

  componentDidUpdate() {
    this.calculateAndSetScale();
  }

  componentWillUnmount() {
    window.addEventListener('resize', this.handleResize);
    input.popEventListeners('keydown', this.events);
    input.popEventListeners('mousedown', this.mouseEvents);
    display.setLoop(function() {});
  }

  setSelectedActor = act => {
    return ev => {
      this.setState({
        selectedActor: act,
      });
      ev.stopPropagation();
      ev.preventDefault();
    };
  };

  render() {
    return (
      <div
        id="cmpt-game"
        onMouseMove={ev => {
          this.mouse = {
            x: Math.round(ev.clientX),
            y: Math.round(ev.clientY),
          };
        }}
        style={{
          width: this.props.width,
          height: this.props.height,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {this.props.room.triggers.map(trigger => {
          return <TriggerIndicator trigger={trigger} room={this.props.room} />;
        })}
        <MenuBackpack
          gameInterface={this.props.gameInterface}
          items={['Small Rock', 'Small Rock', 'Small Rock', 'Small Rock']}
        />
      </div>
    );
  }
}

export default RoomUI;
