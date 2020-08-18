import { Rect, HEADING } from 'utils';

export type { ItemTemplate } from './items';

export interface RoomTemplate {
  name: string;
  props: RoomActorTemplate[];
  characters: RoomActorTemplate[];
  walls: RoomActorTemplate[];
  triggers: RoomActorTemplate[];
  items: RoomActorTemplate[];
  bgImage: string;
  fgImage: string;
  width: number;
  height: number;
}

export interface RoomActorTemplate {
  name: string;
  itemName?: string;
  spriteBase?: string;
  spriteName?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  animName?: string;
  displayName?: string;
  hitBox?: Rect;
  talkTrigger?: string;
  defaultTrigger?: string;
  isMarker?: boolean;
  isBackground?: boolean;
  zOrdering?: number;
  useHeading?: boolean;
  defaultHeading?: HEADING;
  textColor?: string;
  cursor?: string;
}
