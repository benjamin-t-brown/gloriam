import Actor from 'game/Actor';
import RoomActor from 'game/RoomActor';
import { getElem } from 'db';
import display from 'display/Display';
import { isPointWithinRect, hexToRGBA } from 'utils';
import { getWaypointPath, getCollisionWalls } from 'pathfinding';
import scene from 'game/Scene';
import { colors } from 'theme';
import { RoomTemplate, RoomActorTemplate } from 'db/dbTypes';

class Room {
  gameInterface: any;
  backgroundSprite: string;
  foregroundSprite: string;
  name: string;
  baseScale: number;
  baseSize: 64;
  cameraSpeedMs = 500;
  width: number;
  height: number;
  fontSize: 16;
  camera: null | any;
  hoverAct: null | any;
  allowInput: boolean;
  actors: RoomActor[];
  markers: any;
  walls: RoomActorTemplate[];
  particles: any[];
  triggers: RoomActorTemplate[];
  particleSystems: any[];
  renderables: any[];
  timers: any[];
  pendingScenes: any[];

  constructor(gameInterface, roomName, playerCharacters) {
    this.gameInterface = gameInterface;
    const roomTemplate: RoomTemplate = getElem('rooms', roomName);
    const {
      name,
      props,
      characters,
      walls,
      triggers,
      items,
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
        character: true,
      });
      act.setAt(x, y);
      this.actors.push(act);
    });

    props.forEach(prop => {
      const {
        spriteName: spriteBase,
        name,
        x = 0,
        y = 0,
        width = 0,
        height = 0,
        isMarker,
      } = prop;
      if (isMarker) {
        this.markers[name] = { x: x + width / 2, y: y + height / 2 };
      } else {
        const propTemplate: RoomActorTemplate = {
          name,
          spriteBase,
        };
        const dbProp = getElem('props', spriteBase || '', true);
        // if there's a prop in the db, then apply those special properties here.  Most
        // props probably don't have any special props, just animated ones, or ones that
        // move.
        if (dbProp) {
          propTemplate.animName = dbProp.animName;
          propTemplate.zOrdering = dbProp.zOrdering;
          propTemplate.isBackground = dbProp.isBackground;
        }
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

    items.forEach(itemFromTemplate => {
      const { itemName = '', x, y } = itemFromTemplate;
      const itemTemplate = getElem('items', itemName);
      const act = new RoomActor(
        this,
        {
          ...itemTemplate,
          spriteBase: itemTemplate.animName,
        },
        this.camera
      );
      act.width = 32;
      act.height = 32;
      act.isItem = true;
      act.setAt(x, y);
      this.actors.push(act);
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

  getActor(name: string): RoomActor | null {
    return (this.actors as any).reduce(
      (prev: null | RoomActor, curr: RoomActor) => {
        if (prev) {
          return prev;
        } else if (curr.name === name) {
          return curr;
        } else {
          return prev;
        }
      },
      null
    );
  }

  getItemOrCharacterAt(x: number, y: number): RoomActor | null {
    let ret: RoomActor | null = null;

    for (let i = 0; i < this.actors.length; i++) {
      const act = this.actors[i];
      if (act.isCharacter || act.isItem) {
        const { x: actX, y: actY } = act;
        const { width, height } = act.hitBox;
        const xTopLeft = actX - width / 2;
        const yTopLeft = actY - width / 2;
        if (
          isPointWithinRect(
            { x, y },
            { x: xTopLeft, y: yTopLeft, width, height }
          )
        ) {
          if (!ret) {
            ret = act;
            break;
          }
        }
      }
    }

    return ret;
  }

  getCharacterAt(x, y): RoomActor | null {
    let ret: RoomActor | null = null;

    for (let i = 0; i < this.actors.length; i++) {
      const act = this.actors[i];
      if (!act.isCharacter) {
        continue;
      }
      const { x: actX, y: actY } = act;
      const { width, height } = act.hitBox;
      const xTopLeft = actX - width / 2;
      const yTopLeft = actY - width / 2;
      if (
        isPointWithinRect({ x, y }, { x: xTopLeft, y: yTopLeft, width, height })
      ) {
        if (!ret) {
          ret = act;
          break;
        }
      }
    }

    return ret;
  }

  worldToRenderCoords({ x, y }) {
    return {
      x:
        display.width / 2 -
        (this.width * this.baseScale) / 2 +
        x * this.baseScale,
      y:
        display.height / 2 -
        (this.height * this.baseScale) / 2 +
        y * this.baseScale,
    };
  }

  renderToWorldCoords({ x, y }) {
    return {
      x:
        (x - display.width / 2 + (this.width * this.baseScale) / 2) /
        this.baseScale,
      y:
        (y - display.height / 2 + (this.height * this.baseScale) / 2) /
        this.baseScale,
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
    // console.log('WALK TO POSITION', act.getWalkPosition(), point);
    const path = getWaypointPath(
      act.getWalkPosition(),
      point,
      this.walls,
      this
    );
    // console.log('PATH', path);
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
    if (a.isBackground && b.isBackground) {
      return a.zOrdering < b.zOrdering ? -1 : 1;
    } else if (a.isBackground) {
      return -1;
    } else if (b.isBackground) {
      return 1;
    }
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

    display.drawSprite(
      this.backgroundSprite,
      display.width / 2,
      display.height / 2,
      {
        centered: true,
        scale: this.baseScale,
      }
    );

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

    display.drawSprite(
      this.foregroundSprite,
      display.width / 2,
      display.height / 2,
      {
        centered: true,
        scale: this.baseScale,
      }
    );

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
            backgroundColor: hexToRGBA(colors.black, 0.9),
            backgroundPadding: 2,
            size: this.baseScale * 5 + 8,
            centered: true,
            offsetByLines: true,
            keepOnScreen: true,
          }
        );
      }
    }

    const activeAct = this.getActiveActor();
    const collidedTriggers = getCollisionWalls(
      activeAct.getWalkPosition(),
      this.triggers
    );
    for (let i = 0; i < collidedTriggers.length; i++) {
      const trigger = collidedTriggers[i];
      if (!scene.isExecutingBlockingScene()) {
        scene.callTrigger(this.name + '-' + trigger.name, 'step');
      }
    }

    // DEBUG: draw wall rectangles
    for (let i = 0; i < this.walls.length; i++) {
      const wall = this.walls[i];
      const { x, y } = this.worldToRenderCoords({ x: wall?.x, y: wall?.y });
      display.drawRectOutline(
        x,
        y,
        (wall?.width || 0) * this.baseScale,
        (wall?.height || 0) * this.baseScale,
        'red'
      );
    }

    for (let i = 0; i < this.renderables.length; i++) {
      const r = this.renderables[i];
      if (r.shouldRemove) {
        this.renderables.splice(i, 1);
        i--;
      } else {
        r.render();
      }
    }

    // display.drawRect(0, 0, window.innerWidth, window.innerHeight, 'rgba(0, 0, 0, 0.7)');

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
