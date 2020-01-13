import React from 'react';
import ContainerDisplay from 'cmpts/ContainerDisplay';
import BattleUI from 'cmpts/BattleUI';
import RoomUI from 'cmpts/RoomUI';
import Room from 'room/Room';
import scene from 'main/Scene';
import { getElem } from 'db';

const INITIAL_ROOM = 'castle_entrance';
console.log('ENV', process.env);

const App = class extends React.Component {
  constructor(props) {
    super(props);

    const playerCharacters = [
      getElem('characters', 'Rydo'),
      getElem('characters', 'Ferelith'),
    ];

    this.GameInterface = {
      getActor: actorName => {
        return this.state.room.room.getActor(actorName);
      },
      setRoom: roomName => {
        const newRoom = new Room(props.gameInterface, roomName, playerCharacters);
        this.setState({
          room: {
            ...this.state.room,
            room: newRoom,
            roomName,
          },
        });
        scene.setRoom(newRoom);
      },
      setBattle: battleName => {},
      save: () => this.state.room.room.save(),
      restore: () => this.state.room.room.restore(),
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

    scene.setRoom(this.state.room.room);
  }

  render() {
    return (
      <ContainerDisplay
        child={RoomUI}
        childProps={{
          gameInterface: this.GameInterface,
          ...this.state.room,
        }}
      />
    );
  }
};

export default App;
