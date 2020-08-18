export interface TiledCharacter {
  name: string;
  x: number;
  y: number;
}

export interface TiledProp {
  gid: number;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TiledWall {
  name: '';
  x: number;
  y: number;
  width: number;
  height: number;
}
export interface TiledTrigger {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TiledItem {
  name: string;
  x: number;
  y: number;
}

export interface TiledJSONLayer {
  id: string;
  image: string;
  name: string;
  opacity?: number;
  type: string;
  visible: boolean;
  objects?: any;
  x: number;
  y: number;
}

export interface TiledJSONObject {
  gid: number;
  id: number;
  width: number;
  height: number;
  rotation: number;
  type: string;
  visible: boolean;
  name?: string;
  cursor?: boolean;
  x: number;
  y: number;
}

export interface TiledJSONTileset {
  source: string;
  firstgid: number;
}

export interface Tilesets {
  [filename: string]: { id: number; name: string }[];
}
