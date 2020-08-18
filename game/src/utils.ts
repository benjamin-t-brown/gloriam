import React, { ReactElement } from 'react';
import display from 'display/Display';

export type Circle = { x: number; y: number; r: number };
export type Point = { x: number; y: number };
export type Rect = { x: number; y: number; width: number; height: number };

export enum HEADING {
  UP = 'u',
  DOWN = 'd',
  LEFT = 'l',
  RIGHT = 'r',
}

function easeOut(t: number, b: number, c: number, d: number): number {
  const t2 = t / d;
  return -c * t2 * (t2 - 2) + b;
}

export function normalize(
  x: number,
  a: number,
  b: number,
  c: number,
  d: number
): number {
  return c + ((x - a) * (d - c)) / (b - a);
}

export function normalizeClamp(
  x: number,
  a: number,
  b: number,
  c: number,
  d: number
): number {
  let r = normalize(x, a, b, c, d);
  if (c < d) {
    if (r > d) {
      r = d;
    } else if (r < c) {
      r = c;
    }
  } else {
    if (r < d) {
      r = d;
    } else if (r > c) {
      r = c;
    }
  }
  return r;
}

export function normalizeEaseOut(
  x: number,
  a: number,
  b: number,
  c: number,
  d: number
): number {
  const t = normalize(x, a, b, 0, 1);
  return easeOut(t, c, d - c, 1);
}

export function normalizeEaseOutClamp(
  x: number,
  a: number,
  b: number,
  c: number,
  d: number
): number {
  const t = normalizeClamp(x, a, b, 0, 1);
  return easeOut(t, c, d - c, 1);
}

let fetchMock: any = null;
export async function fetchAsync(
  url: string
): Promise<string | void | undefined> {
  if (fetchMock) {
    return fetchMock(url);
  }

  return fetch(url, {
    method: 'get',
  })
    .then(async function (response) {
      if (response.status !== 200) {
        console.error('Internal server error ' + response.status);
      } else {
        return response.text();
      }
    })
    .catch(function (err) {
      console.error('Fetch error', err);
    });
}

export function distance(
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

export function distance2(
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return dx * dx + dy * dy;
}

export function circleCollides(circle1: Circle, circle2: Circle): boolean {
  let { x: x1, y: y1, r: r1 } = circle1;
  let { x: x2, y: y2, r: r2 } = circle2;

  r1 = r1 || 1;
  r2 = r2 || 1;

  const d = distance(x1, y1, x2, y2);
  return d <= r1 + r2;
}

export function probability(prob: number): boolean {
  //number between 0, 100 (0 is no chance, 100 is every time)
  if (prob > 100) {
    prob = 100;
  } else if (prob < 0) {
    prob = 0;
  }
  return Math.random() * 100 < prob;
}

export function randomId(): string {
  let ret = '';
  const str = '0123456789abcdefghijklmnopqrstuvwxyz';
  for (let i = 0; i < 6; i++) {
    ret += str[Math.floor(Math.random() * str.length)];
  }
  return ret;
}

//including n1 and n2, so range of 1-10 could include 1 or 10
export function randomInt(n1: number, n2: number): number {
  return Math.floor(Math.random() * (n2 + 1 - n1));
}

export function cycleNextIndex(i: number, arr: any[]): any {
  return (i + 1) % arr.length;
}

export function cyclePrevIndex(i: number, arr: any[]): any {
  i = Math.abs(i) + arr.length;
  return (i - 1) % arr.length;
}

export function hexToRGBA(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  if (alpha !== undefined) {
    return 'rgba(' + r + ', ' + g + ', ' + b + ', ' + alpha + ')';
  } else {
    return 'rgb(' + r + ', ' + g + ', ' + b + ')';
  }
}

export function isPointWithinRect(point: Point, rect: Rect): boolean {
  const { x, y } = point;
  const { x: rx, y: ry, width, height } = rect;
  const rxMax = rx + width;
  const ryMax = ry + height;
  return x > rx && x < rxMax && y > ry && y < ryMax;
}

export function getAngleTowards(point1: Point, point2: Point): number {
  const { x: x1, y: y1 } = point1;
  const { x: x2, y: y2 } = point2;
  const lenY = y2 - y1;
  const lenX = x2 - x1;
  const hyp = Math.sqrt(lenX * lenX + lenY * lenY);
  let ret = 0;
  if (y2 >= y1 && x2 >= x1) {
    ret = (Math.asin(lenY / hyp) * 180) / Math.PI + 90;
  } else if (y2 >= y1 && x2 < x1) {
    ret = (Math.asin(lenY / -hyp) * 180) / Math.PI - 90;
  } else if (y2 < y1 && x2 > x1) {
    ret = (Math.asin(lenY / hyp) * 180) / Math.PI + 90;
  } else {
    ret = (Math.asin(-lenY / hyp) * 180) / Math.PI - 90;
  }
  if (ret >= 360) {
    ret = 360 - ret;
  }
  if (ret < 0) {
    ret = 360 + ret;
  }
  return ret;
}

export function getDistPath(): string {
  return __dirname + '/../dist/';
}

export function pt(x: number, y: number): Point {
  return {
    x,
    y,
  };
}

export function isTest(): boolean {
  return (
    global.process &&
    global.process.env &&
    global.process.env.NODE_ENV === 'test'
  );
}

export function setFetchMock(cb: any): void {
  fetchMock = cb;
}

export function FunctionContainer(props: any): ReactElement {
  const Child = props.Child;
  return React.createElement(Child, { ...props });
}

export function drawPath(start: Point, end: Point, path: any[], room: any) {
  if (!path.length) {
    console.warn(
      'cannot draw path without length',
      start,
      end,
      path,
      path.length,
      Array.isArray(path)
    );
    return;
  }
  const p = room.worldToRenderCoords(path[0]);
  const p2 = room.worldToRenderCoords(start);
  display.drawLine(p2.x, p2.y, p.x, p.y, 'white');
  for (let i = 1; i < path.length; i++) {
    const p = room.worldToRenderCoords(path[i]);
    const p2 = room.worldToRenderCoords(path[i - 1]);
    display.drawLine(p.x, p.y, p2.x, p2.y, 'white');
  }
}

export function calculateAndSetScale(width: number, height: number): number {
  let scale = Math.min(display.height / height, display.width / width);
  if (scale < 1) {
    if (scale > 0.5) {
      scale = 0.5;
    } else if (scale > 0.25) {
      scale = 0.25;
    }
  } else {
    // comment back in to scale to whole numbers
    //scale = Math.floor(scale);
  }

  return scale;
}
