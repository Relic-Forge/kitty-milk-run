import { MAP_NODES, type MapNode } from '../../worldMap';

export type MapPoint = { x: number; y: number };
export type RouteSegment = { from: MapNode; to: MapNode };
const STOPS: MapPoint[] = [
  { x: -340, y: 65 }, { x: -310, y: -30 }, { x: -208, y: -65 },
  { x: -112, y: 10 }, { x: -8, y: 78 }, { x: 98, y: 14 },
  { x: 192, y: -62 }, { x: 294, y: -16 }
];
export function getNodePoint(node: MapNode): MapPoint {
  if (node.nodeType === 'bonus') return { x: -96, y: -111 };
  if (node.nodeType === 'gate') return { x: 366, y: 88 };
  const nodes = MAP_NODES.filter((n) => n.worldId === node.worldId && n.nodeType === 'main');
  return STOPS[nodes.findIndex((n) => n.id === node.id)] ?? STOPS[0];
}
export function getRouteControl(from: MapNode, to: MapNode): MapPoint {
  // Derive curvature from the canonical edge, so reverse travel follows exactly the same trail.
  const child = to.unlock.previousNodeId === from.id ? to : from;
  const start = getNodePoint(from), end = getNodePoint(to);
  const index = MAP_NODES.filter((n) => n.worldId === child.worldId).findIndex((n) => n.id === child.id);
  return { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 + (child.nodeType === 'bonus' ? -12 : index % 2 ? -24 : 24) };
}
export function quadraticPoint(start: MapPoint, control: MapPoint, end: MapPoint, t: number): MapPoint {
  const inverse = 1 - t;
  return { x: inverse * inverse * start.x + 2 * inverse * t * control.x + t * t * end.x,
    y: inverse * inverse * start.y + 2 * inverse * t * control.y + t * t * end.y };
}
export function getRouteSegments(from: MapNode, to: MapNode): RouteSegment[] {
  if (from.worldId !== to.worldId || from.id === to.id) return [];
  const nodes = MAP_NODES.filter((n) => n.worldId === from.worldId);
  const queue: { node: MapNode; route: RouteSegment[] }[] = [{ node: from, route: [] }];
  const visited = new Set([from.id]);
  while (queue.length) {
    const current = queue.shift()!;
    if (current.node.id === to.id) return current.route;
    for (const next of nodes) {
      if (visited.has(next.id)) continue;
      if (next.unlock.previousNodeId !== current.node.id && current.node.unlock.previousNodeId !== next.id) continue;
      visited.add(next.id);
      queue.push({ node: next, route: [...current.route, { from: current.node, to: next }] });
    }
  }
  return [];
}
