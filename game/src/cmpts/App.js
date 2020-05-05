import React from 'react';
import ContainerDisplay from 'cmpts/ContainerDisplay';
import BattleUI from 'cmpts/BattleUI';
import RoomUI from 'cmpts/RoomUI';
import Room from 'room/Room';
import EscMenu from 'cmpts/EscMenu';
import { MENU_HEIGHT } from 'cmpts/MenuBackpack'
import scene from 'main/Scene';
import { getElem } from 'db';

const INITIAL_ROOM = 'east_window';

const App = class extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      escMenuVisible: false,
    };

    let room = null;

    const playerCharacters = [
      getElem('characters', 'Rydo'),
      getElem('characters', 'Ferelith'),
    ];

    this.GameInterface = {
      getRoom: () => {
        // return this.state.room.room;
        return room;
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
        const newRoom = new Room(props.gameInterface, roomName, playerCharacters);
        this.setState({
          room: {
            ...this.state.room,
            room: newRoom,
            roomName,
          },
        });
        room = newRoom;
        global.room = newRoom;
        scene.setRoom(newRoom);
      },
      setBattle: battleName => {},
      setEscMenuOpen: v => {
        this.setState({
          escMenuVisible: v,
        });
      },
      save: () => room.save(),
      restore: () => room.restore(),
      getGameAreaSize: () => ({
        width: window.innerWidth,
        height: window.innerHeight - MENU_HEIGHT,
      }),
    };
    scene.setGameInterface(this.GameInterface);

    this.state = {
      room: {
        room: new Room(this.GameInterface, INITIAL_ROOM, playerCharacters),
        roomName: INITIAL_ROOM,
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
    };

    room = this.state.room.room;
    global.room = this.state.room.room;
  }

  render() {
    return (
      <>
        <ContainerDisplay
          child={RoomUI}
          childProps={{
            gameInterface: this.GameInterface,
            ...this.state.room,
          }}
        />
        <EscMenu open={this.state.escMenuVisible} gameInterface={this.GameInterface} />
      </>
    );
  }
};

export default App;
