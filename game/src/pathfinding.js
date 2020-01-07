import { distance, isPointWithinRect, normalize, pt } from './utils';

export function pointsEqual(p1, p2) {
  return p1.x === p2.x && p1.y === p2.y;
}

export function isInWall({ x, y }, walls) {
  const v = 0.0;
  for (let i = 0; i < walls.length; i++) {
    const wall = walls[i];
    const wx = wall.x - v;
    const wy = wall.y - v;
    const wx2 = wall.x + wall.width + v;
    const wy2 = wall.y + wall.height + v;
    if (x >= wx && x <= wx2 && y >= wy && y <= wy2) {
      return true;
    }
  }
  return false;
}

export function getIntersectionPoint(p0, p1, p2, p3) {
  const s1_x = p1.x - p0.x;
  const s1_y = p1.y - p0.y;
  const s2_x = p3.x - p2.x;
  const s2_y = p3.y - p2.y;

  const s = (-s1_y * (p0.x - p2.x) + s1_x * (p0.y - p2.y)) / (-s2_x * s1_y + s1_x * s2_y);
  const t = (s2_x * (p0.y - p2.y) - s2_y * (p0.x - p2.x)) / (-s2_x * s1_y + s1_x * s2_y);

  if (s >= 0 && s <= 1 && t >= 0 && t <= 1) {
    return { x: p0.x + t * s1_x, y: p0.y + t * s1_y };
  } else {
    return null;
  }
}

export function getIntersectionOfLineWithRect(point1, point2, rect) {
  const { x: rx, y: ry, width, height } = rect;
  const rxMax = rx + width;
  const ryMax = ry + height;

  let ret = null;

  ret = getIntersectionPoint(point1, point2, pt(rx, ry), pt(rxMax, ry));

  if (!ret) {
    ret = getIntersectionPoint(point1, point2, pt(rx, ry), pt(rx, ryMax));
  }
  if (!ret) {
    ret = getIntersectionPoint(point1, point2, pt(rx, ryMax), pt(rxMax, ryMax));
  }
  if (!ret) {
    ret = getIntersectionPoint(point1, point2, pt(rxMax, ry), pt(rxMax, ryMax));
  }

  return ret;
}

export function getNearestEdgePositionFromCenter(point, rect) {
  const { x: rx, y: ry, width, height } = rect;
  const center = {
    x: rx + width / 2,
    y: ry + height / 2,
  };

  if (isPointWithinRect(point, rect)) {
    return {
      x: point.x,
      y: point.y + height / 2,
    };
  }

  return getIntersectionOfLineWithRect(point, center, rect) || pt(0, 0);
}

export function hasVisibilityBetweenPoints(point1, point2, walls) {
  for (let i = 0; i < walls.length; i++) {
    const wall = walls[i];
    const intersectPt = getIntersectionOfLineWithRect(point1, point2, wall);
    if (intersectPt) {
      return false;
    }
  }
  return true;
}

function addPointToGraph(point, graph, walls) {
  const _connectEdges = vert => {
    const p = pt(vert.x, vert.y);
    for (let vertKey in graph) {
      const vert2 = graph[vertKey];
      const p2 = pt(vert2.x, vert2.y);
      if (
        vert2 !== vert &&
        !vert.edges[vert2.key] &&
        hasVisibilityBetweenPoints(p, p2, walls)
      ) {
        const cost = distance(p.x, p.y, p2.x, p2.y);
        vert.edges[vert2.key] = {
          cost,
          baseCost: cost,
          vert: vert2,
        };
        vert2.edges[vert.key] = {
          cost,
          baseCost: cost,
          vert: vert,
        };
      }
    }
  };

  const _createVert = pt => ({
    x: pt.x,
    y: pt.y,
    key: `${pt.x},${pt.y}`,
    edges: {},
    edgesList: [],
    parent: null,
  });
  graph[`${point.x},${point.y}`] = _createVert(point);
  _connectEdges(graph[`${point.x},${point.y}`]);
}

function removePointFromGraph(point, graph) {
  const key = `${point.x},${point.y}`;
  if (graph[key]) {
    delete graph[key];
  }
  for (let i in graph) {
    const node = graph[i];
    if (node.edges[key]) {
      delete node.edges[key];
    }
  }
}

export function createVisibilityGraph(walls) {
  const graph = {};
  for (let i = 0; i < walls.length; i++) {
    forEachPointInRectangle(walls[i], p => {
      addPointToGraph(p, graph, walls);
    });
  }
  return graph;
}

export function forEachPointInRectangle(rect, cb) {
  const { x, y, width, height } = rect;
  const v = 0.75;
  cb({ x: x - v, y: y - v });
  cb({ x: x - v, y: y + height + v });
  cb({ x: x + width + v, y: y - v });
  cb({ x: x + width + v, y: y + height + v });
}

function getPointAlongLine(startPoint, endPoint, pct) {
  const pctX = normalize(pct, 0, 100, startPoint.x, endPoint.x);
  const pctY = normalize(pct, 0, 100, startPoint.y, endPoint.y);
  return {
    x: pctX,
    y: pctY,
  };
}

export function getWaypointPath(startPoint, endPoint, walls, iterate) {
  const graph = createVisibilityGraph(walls);
  const attemptedPoints = [];

  const _resetGraph = (startPoint, endPoint, graph) => {
    removePointFromGraph(startPoint, graph);
    removePointFromGraph(endPoint, graph);
    for (let i in graph) {
      const node = graph[i];
      delete node.visited;
      node.cost = node.baseCost;
      node.parent = null;
    }
  };

  const _findPath = (startPoint, endPoint) => {
    const start = graph[`${startPoint.x},${startPoint.y}`];
    start.cost = 0;
    start.visited = true;
    let queue = [start];
    let max = 0;
    const maxIterations = 100;
    let pathFound = false;

    while (queue.length) {
      queue = queue.sort((a, b) => {
        return a.cost < b.cost ? -1 : 1;
      });
      const vert = queue.shift();
      if (vert.x === endPoint.x && vert.y === endPoint.y) {
        pathFound = true;
        break;
      }

      for (let key in vert.edges) {
        const vert2 = vert.edges[key].vert;
        const newCost = vert.edges[key].cost + vert.cost;
        const ind = queue.indexOf(vert2);
        if (ind > -1 && newCost < vert2.cost) {
          vert2.cost = newCost;
          vert2.parent = vert;
        } else if (!vert2.visited) {
          vert2.parent = vert;
          vert2.cost = newCost;
          vert2.visited = true;
          queue.push(vert2);
        }
      }
      max++;
      if (max > maxIterations) {
        break;
      }
    }
    return pathFound;
  };

  let found = false;
  let shouldIterate =
    iterate === false
      ? false
      : distance(startPoint.x, startPoint.y, endPoint.x, endPoint.y) > 20;
  if (shouldIterate) {
    for (let i = 100; i > 0; i -= 5) {
      const endPoint2 = getPointAlongLine(startPoint, endPoint, i);
      addPointToGraph(startPoint, graph, walls);
      addPointToGraph(endPoint2, graph, walls);
      attemptedPoints.push(endPoint2);
      if (_findPath(startPoint, endPoint2)) {
        found = true;
        break;
      }
      _resetGraph(startPoint, endPoint2, graph);
    }
    if (!found) {
      const dX = Math.abs(endPoint.x - startPoint.x);
      const dY = Math.abs(endPoint.y - startPoint.y);
      let newPoint = null;

      if (dX > dY) {
        newPoint = pt(endPoint.x, startPoint.y);
      } else {
        newPoint = pt(startPoint.x, endPoint.y);
      }

      addPointToGraph(startPoint, graph, walls);
      addPointToGraph(newPoint, graph, walls);
      attemptedPoints.push(newPoint);
      if (!_findPath(startPoint, newPoint)) {
        return [];
      }
    }
  } else {
    addPointToGraph(startPoint, graph, walls);
    addPointToGraph(endPoint, graph, walls);
    attemptedPoints.push(endPoint);
    if (!_findPath(startPoint, endPoint)) {
      return [];
    }
  }

  const path = [];
  const lastPoint = attemptedPoints[attemptedPoints.length - 1];
  let v = graph[`${lastPoint.x},${lastPoint.y}`];
  while (v.parent) {
    const p = pt(v.x, v.y);
    p.cost = v.cost;
    path.push(v);
    v = v.parent;
  }
  return path.reverse();
}
