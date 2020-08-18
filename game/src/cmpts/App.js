import React from 'react';
import ContainerDisplay from 'cmpts/ContainerDisplay';
import BattleUI from 'cmpts/BattleUI';
import RoomUI from 'cmpts/RoomUI';
import NarrativeUI from 'cmpts/NarrativeUI';
import Room from 'game/Room';
import EscMenu from 'cmpts/EscMenu';
import { MENU_HEIGHT } from 'cmpts/MenuBackpack';
import scene, { MODES } from 'game/Scene';
import { getElem } from 'db';

const App = class extends React.Component {
  constructor(props) {
    super(props);

    let room = null;
    let mode = MODES.ROOM;
    let narrative = {};

    const playerCharacters = [
      getElem('characters', 'Rydo'),
      getElem('characters', 'Ferelith'),
    ];

    this.GameInterface = {
      render: () => {
        this.setState({
          render: !this.state.render,
        });
      },
      getMode: () => {
        return mode;
      },
      getRoom: () => {
        // return this.state.room.room;
        if (this.GameInterface.getMode() !== MODES.ROOM) {
          console.warn('Warning, call to getRoom when not in ROOM mode');
          return null;
        }
        return room || this.state.room;
      },
      getActor: actorName => {
        const act = room.getActor(actorName);
        if (!act) {
          console.error('No actor exists with name', actorName);
          return null;
        }
        return act;
      },
      getPlayer: () => {
        return this.GameInterface.getActor('Rydo');
      },
      getMarker: markerName => {
        return room.markers[markerName];
      },
      setRoom: roomName => {
        console.log('SET ROOM', roomName);
        const newRoom = new Room(
          props.gameInterface,
          roomName,
          playerCharacters
        );
        this.setState({
          mode: MODES.ROOM,
          room: {
            ...this.state.room,
            room: newRoom,
            roomName,
          },
        });
        room = newRoom;
        global.room = newRoom;
        // scene.setRoom(newRoom);
      },
      setBattle: battleName => {},
      isEscMenuOpen: () => {
        return this.state.escMenuVisible;
      },
      setEscMenuOpen: v => {
        this.setState({
          escMenuVisible: v,
        });
      },
      save: () => room.save(),
      restore: () => room.restore(),
      getGameAreaSize: () => ({
        width: window.innerWidth,
        height:
          window.innerHeight -
          (this.state.mode === MODES.ROOM ? MENU_HEIGHT : 0),
      }),
      setMode: m => {
        mode = m;
        this.setState({
          mode: m,
        });
      },
      setNarrativeText: (speakerName, text) => {
        const newState = {
          narrative: {
            ...narrative,
            speakerName,
            text,
          },
        };
        narrative = newState.narrative;
        this.setState(newState);
      },
      setNarrativeBackground: backgroundImage => {
        const newState = {
          narrative: {
            ...narrative,
            backgroundImage,
          },
        };
        narrative = newState.narrative;
        this.setState(newState);
      },
      setNarrativeTextPosition: style => {
        const newState = {
          narrative: {
            ...narrative,
            textPosition: {
              ...style,
            },
          },
        };
        narrative = newState.narrative;
        this.setState(newState);
      },
    };
    scene.setGameInterface(this.GameInterface);

    this.state = {
      mode: MODES.ROOM,
      render: true,
      escMenuVisible: false,
      room: {
        room: null,
        roomName: '',
        activeCharacter: null,
        selectedActor: null,
        hoveredActor: null,
        walk: {
          start: null,
          end: null,
          path: null,
        },
        scale: 3, // UI scale
        mouse: {
          x: 0,
          y: 0,
        },
      },
      narrative: {
        speakerName: '',
        text: '',
        backgroundImage: '',
        textPosition: {
          left: 0,
          top: 0,
          width: '33%',
          height: '33%',
        },
      },
    };

    narrative = this.state.narrative;

    window.gameInterface = this.GameInterface;
  }

  componentDidMount() {
    console.log('Run setup script...');
    scene.callScript('setup');
  }

  render() {
    console.log('render app', this.state);
    return (
      <>
        {this.state.mode === MODES.ROOM && this.state.room.room ? (
          <ContainerDisplay
            child={RoomUI}
            childProps={{
              gameInterface: this.GameInterface,
              ...this.state.room,
            }}
          />
        ) : null}
        {this.state.mode === MODES.NARRATIVE ? (
          <ContainerDisplay
            child={NarrativeUI}
            childProps={{
              gameInterface: this.GameInterface,
              ...this.state.narrative,
            }}
          />
        ) : null}
        <EscMenu
          open={this.state.escMenuVisible}
          gameInterface={this.GameInterface}
        />
      </>
    );
  }
};

export default App;
