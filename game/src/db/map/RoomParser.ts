import display from 'display/Display';

import {
  Tilesets,
  TiledJSONLayer,
  TiledJSONTileset,
  TiledJSONObject,
  TiledProp,
  TiledWall,
  TiledItem,
  TiledCharacter,
  TiledTrigger,
} from './tiledTypes';

import { RoomTemplate, RoomActorTemplate } from 'db/dbTypes';

const GID_ITEM = 8;

class RoomParser {
  name: string;
  json: any;
  tilesets: Tilesets;

  constructor(name: string, tilesets: Tilesets) {
    this.name = name;
    this.json = null;
    this.tilesets = tilesets;
  }

  throwParsingError(err: Error | string) {
    console.error('[RoomParser] while loading room =', this.name + '.', err);
    throw new Error('Tiled Parsing error: ' + err);
  }

  warn(msg: string) {
    console.warn('[RoomParser]', `roomName="${this.name}"`, msg);
  }

  getLayer(
    layers: TiledJSONLayer[],
    layerName: string,
    ignoreIfNotFound?: boolean
  ) {
    for (let i in layers) {
      const layer = layers[i];
      if (layer.name === layerName) {
        return layer;
      }
    }
    if (!ignoreIfNotFound) {
      this.throwParsingError(
        'Malformed tiled JSON, no layer found named "' + layerName + '".'
      );
    }
    return null;
  }

  extractSpriteNameFromImagePath(url: string) {
    const arr = url.split('/');
    return arr.slice(-1)[0].slice(0, -4);
  }

  isMarker(propName: string) {
    return propName.toLowerCase().indexOf('marker') > -1;
  }

  gidToSpriteName(gid: number, mapTilesets: TiledJSONTileset[]) {
    let tilesetName = '';
    let tilesetFirstGid = 0;
    if (mapTilesets.length === 1) {
      const url = mapTilesets[0].source.split(/[/|\\]/);
      tilesetName = url[url.length - 1];
      tilesetFirstGid = 1;
    }

    for (let i = 1; i < mapTilesets.length; i++) {
      const { firstgid, source } = mapTilesets[i - 1];
      const { firstgid: firstgid2 } = mapTilesets[i];
      if (gid >= firstgid && gid < firstgid2) {
        const url = source.split(/[/|\\]/);
        tilesetName = url[url.length - 1];
        tilesetFirstGid = firstgid;
        break;
      }
    }

    if (!tilesetName) {
      const url = mapTilesets[mapTilesets.length - 1].source.split(/[/|\\]/);
      tilesetName = url[url.length - 1];
      tilesetFirstGid = mapTilesets[mapTilesets.length - 1].firstgid;
    }

    if (!this.tilesets[tilesetName]) {
      console.error(gid, mapTilesets, tilesetName, this.tilesets);
      throw new Error(
        `Error: could not get a tileset for gid="${gid}" tileset="${tilesetName}"`
      );
    }

    const ind = (gid - tilesetFirstGid) % this.tilesets[tilesetName].length;

    if (!this.tilesets[tilesetName][ind]) {
      console.error(this.tilesets[tilesetName]);
      throw new Error(
        `Invalid tileset specified for gid="${gid}" ind=${ind} tileset="${tilesetName}"`
      );
    }

    const { name: spriteName } = this.tilesets[tilesetName][ind];

    if (spriteName.indexOf('indicator') === 0) {
      return 'invisible';
    } else {
      return spriteName;
    }
  }

  parse(json: any, db: any) {
    const rooms = {};

    const addRoom = (k: string, r: RoomTemplate) => (rooms[k] = r);

    this.json = json;
    const { layers, tilesets } = json;

    const roomTemplate: RoomTemplate = {
      name: this.name,
      props: [] as TiledProp[],
      characters: [] as TiledCharacter[],
      triggers: [] as TiledTrigger[],
      items: [] as TiledItem[],
      walls: [] as TiledWall[],
      bgImage: '',
      fgImage: '',
      width: 0,
      height: 0,
    };

    const propsLayer = this.getLayer(layers, 'props');
    const wallsLayer = this.getLayer(layers, 'walls');
    const triggersLayer = this.getLayer(layers, 'triggers');
    const charactersLayer = this.getLayer(layers, 'characters');
    const { image: bgImagePath } = this.getLayer(layers, 'bg') as {
      image: string;
    };
    const fgLayer = this.getLayer(layers, 'fg', true);
    let fgImagePath = '';
    if (fgLayer) {
      fgImagePath = fgLayer.image;
    }

    roomTemplate.bgImage = bgImagePath
      ? this.extractSpriteNameFromImagePath(bgImagePath)
      : 'invisible';
    roomTemplate.fgImage = fgImagePath
      ? this.extractSpriteNameFromImagePath(fgImagePath)
      : 'invisible';

    if (!display.getSprite(roomTemplate.bgImage)) {
      this.throwParsingError(
        'No Image loaded for background "' + roomTemplate.bgImage + '".'
      );
    }
    if (!display.getSprite(roomTemplate.fgImage)) {
      this.throwParsingError(
        'No Image loaded for foreground "' + roomTemplate.fgImage + '".'
      );
    }

    roomTemplate.width = json.width;
    roomTemplate.height = json.height;

    propsLayer?.objects.forEach((obj: TiledProp) => {
      let { name, width, height, x: xBottomLeft, y: yBottomLeft, gid } = obj;
      const x = xBottomLeft + width / 2;
      const y = yBottomLeft - height / 2;
      const spriteName = this.gidToSpriteName(gid, tilesets);
      if (width === undefined && height === undefined) {
        const { clip_w, clip_h } = display.getSprite(spriteName);
        width = clip_w;
        height = clip_h;
      }
      const propTemplate = {
        name: name || '',
        spriteBase: '',
        spriteName: spriteName,
        isMarker: this.isMarker(name),
        x,
        y,
        width,
        height,
      };
      roomTemplate.props.push(propTemplate);
    });

    wallsLayer?.objects.forEach((obj: TiledJSONObject) => {
      const { width, height, x: xW, y: yW } = obj;
      const x = xW;
      const y = yW;
      roomTemplate.walls.push({
        name: '',
        x,
        y,
        width,
        height,
      });
    });

    triggersLayer?.objects.forEach((obj: TiledJSONObject) => {
      const { name, width, height, x: xW, y: yW, type, gid } = obj;
      const x = xW;
      const y = yW;
      if (gid === GID_ITEM) {
        if (!db.elemExists('items', name)) {
          this.warn(`Warning, item specified, but no item exists: ${name}`);
          return;
        }
        roomTemplate.items.push({
          name: name || '',
          itemName: name || '',
          x,
          y,
        });
        return;
      } else if (name && !db.elemExists('triggers', this.name + '-' + name)) {
        this.warn(
          `Warning, trigger specified with name and no definition: "${this.name}-${name}"`
        );
      }
      const trigger: RoomActorTemplate = {
        name: name || '',
        x,
        y,
        width,
        height,
      };
      if (type) {
        trigger.cursor = type;
      }
      roomTemplate.triggers.push(trigger);
    });

    charactersLayer?.objects.forEach((obj: TiledJSONObject) => {
      let { name, width, height, x: xBottomLeft, y: yBottomLeft, gid } = obj;
      const x = xBottomLeft + width / 2;
      const y = yBottomLeft - height / 2;
      const spriteName = this.gidToSpriteName(gid, tilesets);
      if (width === undefined && height === undefined) {
        const { clip_w, clip_h } = display.getSprite(spriteName);
        width = clip_w;
        height = clip_h;
      }
      if (db.elemExists('characters', name)) {
        roomTemplate.characters.push({
          name: name || '',
          x,
          y,
        });
      } else {
        this.warn('Character does not exist in db: ' + name);
      }
    });

    roomTemplate.walls.push({
      name: '',
      x: 0,
      y: 0,
      width: roomTemplate.width,
      height: 4,
    });

    roomTemplate.walls.push({
      name: '',
      x: 0,
      y: roomTemplate.height - 4,
      width: roomTemplate.width,
      height: 4,
    });

    roomTemplate.walls.push({
      name: '',
      x: 0,
      y: 0,
      width: 4,
      height: roomTemplate.height,
    });

    roomTemplate.walls.push({
      name: '',
      x: roomTemplate.width - 4,
      y: 0,
      width: 4,
      height: roomTemplate.height,
    });

    addRoom(this.name, roomTemplate);
    return rooms;
  }
}

export default RoomParser;
