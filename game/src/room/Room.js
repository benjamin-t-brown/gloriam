import { HEADINGS } from 'main/Actor';
import RoomActor from 'room/RoomActor';
import { getElem } from 'db';
import display from 'display/Display';
import { isPointWithinRect, pt, hexToRGBA } from 'utils';
import { getWaypointPath, isInWall } from 'pathfinding';
import scene from 'main/Scene';
import theme from 'main/theme';

class Room {
  constructor(gameInterface, roomName, playerCharacters) {
    this.gameInterface = gameInterface;
    const roomTemplate = getElem('rooms', roomName);
    const {
      name,
      props,
      characters,
      walls,
      triggers,
      bgImage,
      fgImage,
      width,
      height,
    } = roomTemplate;

    this.backgroundSprite = bgImage;
    this.foregroundSprite = fgImage;
    this.name = name;
    this.baseScale = 4; // set in the container
    this.baseSize = 64;
    this.cameraSpeedMs = 500;
    this.width = width;
    this.height = height;
    this.fontSize = 16;

    this.camera = null;
    this.hoverAct = null;

    this.allowInput = true;

    this.actors = [];
    this.markers = {};
    this.walls = walls;
    this.particles = [];
    this.triggers = [];
    this.particleSystems = [];
    this.renderables = [];
    this.timers = [];
    this.pendingScenes = [];

    characters.forEach(ch => {
      const { name, x, y } = ch;
      const characterTemplate = getElem('characters', name);
      const act = new RoomActor(this, characterTemplate, this.camera, {
        heading: true,
      });
      act.setAt(x, y);
      act.setHeading(HEADINGS.DOWN);
      this.actors.push(act);
    });

    props.forEach(props => {
      const { spriteName: spriteBase, name, x, y, width, height, isMarker } = props;
      if (isMarker) {
        this.markers[name] = { x: x + width / 2, y: y + height / 2 };
      } else {
        const propTemplate = {
          name,
          spriteBase,
        };
        const act = new RoomActor(this, propTemplate, this.camera);
        act.width = width;
        act.height = height;
        act.setAt(x, y);
        this.actors.push(act);
      }
    });

    triggers.forEach(trigger => {
      this.triggers.push(trigger);
    });

    console.log('RoomController', this);
  }

  setBaseScale(s) {
    this.baseScale = s;
    this.actors.forEach(ch => {
      ch.setBaseScale(s);
    });
  }

  save() {
    this.actors.forEach(act => {
      act.saveHeading();
    });
  }

  restore() {
    this.actors.forEach(act => {
      act.restoreHeading();
    });
  }

  getFontSize() {
    return this.fontSize;
  }

  getUnitLength() {
    return this.baseScale * this.baseSpacing;
  }

  getActor(name) {
    return this.actors.reduce((prev, curr) => {
      if (prev) {
        return prev;
      } else if (curr.name === name) {
        return curr;
      } else {
        return prev;
      }
    }, null);
  }

  getActorAt(x, y) {
    let ret = null;

    for (let i = 0; i < this.actors.length; i++) {
      const act = this.actors[i];
      const { x: renderX, y: renderY } = act.getRenderLocation();
      const { width, height } = act.getSize();
      const xTopLeft = renderX - width / 2;
      const yTopLeft = renderY - width / 2;
      if (isPointWithinRect({ x, y }, { x: xTopLeft, y: yTopLeft, width, height })) {
        if (!ret) {
          ret = act;
        } else if (ret.getBottomYRenderLocation() < yTopLeft + height) {
          ret = act;
        }
      }
    }

    return ret;
  }

  worldToRenderCoords({ x, y }) {
    return {
      x: display.width / 2 - (this.width * this.baseScale) / 2 + x * this.baseScale,
      y: display.height / 2 - (this.height * this.baseScale) / 2 + y * this.baseScale,
    };
  }

  renderToWorldCoords({ x, y }) {
    return {
      x: (x - display.width / 2 + (this.width * this.baseScale) / 2) / this.baseScale,
      y: (y - display.height / 2 + (this.height * this.baseScale) / 2) / this.baseScale,
    };
  }

  addTimer(ms, cb) {
    this.timers.push({
      duration: ms,
      cb,
      startTimestamp: display.now,
    });
  }

  actorWalkTowards(act, point) {
    //console.log('WALK TO POSITION', act.getWalkPosition(), point);
    const path = getWaypointPath(act.getWalkPosition(), point, this.walls, this);
    //console.log('PATH', path);
    if (path.length) {
      //console.log('ACTOR WALK PATH', path);
      act.setWalkPath(path, () => {
        //console.log('COMPLETED WALKING THE PATH', act);
      });
      return [...path];
    } else {
      // console.warn(
      //   'No path found between',
      //   act.getWalkPosition(),
      //   'and',
      //   point,
      //   'actor=',
      //   act
      // );
      return null;
    }
  }

  getActiveActor() {
    let ret = this.getActor('Rydo');
    if (!ret) {
      ret = this.actors[0];
    }
    return ret;
  }

  addRenderable(id, render) {
    this.renderables.push({
      id,
      render,
      shouldRemove: false,
    });
  }

  removeRenderable(id) {
    for (let i = 0; i < this.renderables.length; i++) {
      const r = this.renderables[i];
      if (r.id === id) {
        r.shouldRemove = true;
        return true;
      }
    }
    return false;
  }

  sortActors(a, b) {
    const aBottom = a.getBottomYRenderLocation();
    const bBottom = b.getBottomYRenderLocation();
    if (aBottom < bBottom) {
      return -1;
    } else {
      return 1;
    }
  }

  loop() {
    this.actors = this.actors.sort(this.sortActors);
    scene.update();

    display.drawSprite(this.backgroundSprite, display.width / 2, display.height / 2, {
      centered: true,
      scale: this.baseScale,
    });

    for (let i = 0; i < this.timers.length; i++) {
      const { startTimestamp, duration, cb } = this.timers[i];
      if (display.now - startTimestamp > duration) {
        cb();
        this.timers.splice(i, 1);
        i--;
      }
    }

    for (let i = 0; i < this.actors.length; i++) {
      const act = this.actors[i];
      if (act.shouldRemove) {
        this.actors.splice(i, 1);
        i--;
      } else {
        act.update();
        act.draw();
      }
    }

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.update();
      p.draw();
      if (p.shouldRemove) {
        this.particles.splice(i, 1);
        i--;
      }
    }

    display.drawSprite(this.foregroundSprite, display.width / 2, display.height / 2, {
      centered: true,
      scale: this.baseScale,
    });

    for (let i = 0; i < this.actors.length; i++) {
      const act = this.actors[i];
      if (act.subtitleText) {
        display.drawTextWrapped(
          act.subtitleText,
          act.renderX,
          act.renderY - (act.height * act.scale) / 2,
          window.innerWidth / 2,
          {
            color: act.subtitleTextColor,
            backgroundColor: hexToRGBA(theme.palette.black, 0.9),
            backgroundPadding: 2,
            size: this.baseScale * 5 + 8,
            centered: true,
            offsetByLines: true,
            keepOnScreen: true,
          }
        );
      }
    }

    // for (let i = 0; i < this.walls.length; i++) {
    //   const wall = this.walls[i];
    //   const { x, y } = this.worldToRenderCoords(wall);
    //   display.drawRectOutline(
    //     x,
    //     y,
    //     wall.width * this.baseScale,
    //     wall.height * this.baseScale,
    //     'red'
    //   );
    // }

    for (let i = 0; i < this.renderables.length; i++) {
      const r = this.renderables[i];
      if (r.shouldRemove) {
        this.renderables.splice(i, 1);
        i--;
      } else {
        r.render();
      }
    }

    // draw a sprite sheet with labels
    // const pictureName = 'ferelith';
    // const w = 8;
    // const h = 8;
    // for (let i = 0; i < h; i++) {
    //   for (let j = 0; j < w; j++) {
    //     const n = i * h + j;
    //     const x = 64 * j;
    //     const y = 64 * i;
    //     display.drawSprite(pictureName + '_' + n, x, y);
    //     display.drawText(n, x + 32, y + 32, {
    //       color: 'white',
    //       centered: true,
    //       size: 10,
    //     });
    //   }
    // }
  }
}

export default Room;
