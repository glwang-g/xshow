export type WireRoutePoint = { x: number; y: number };
export type WireRouteSide = -1 | 1;

export type WireRouteOptions = {
  bounds: { height: number; width: number };
  end: WireRoutePoint;
  endSide: WireRouteSide;
  lane?: number;
  mobile?: boolean;
  start: WireRoutePoint;
  startSide: WireRouteSide;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function compact(points: WireRoutePoint[]) {
  const compacted: WireRoutePoint[] = [];
  for (const point of points) {
    const previous = compacted[compacted.length - 1];
    if (previous && previous.x === point.x && previous.y === point.y) continue;

    const beforePrevious = compacted[compacted.length - 2];
    if (beforePrevious && previous) {
      const sameHorizontal = beforePrevious.y === previous.y && previous.y === point.y;
      const sameVertical = beforePrevious.x === previous.x && previous.x === point.x;
      if (sameHorizontal || sameVertical) {
        compacted[compacted.length - 1] = point;
        continue;
      }
    }
    compacted.push(point);
  }
  return compacted;
}

/**
 * Create a stable, readable orthogonal route. `lane` separates wires that
 * would otherwise share the same outside or middle corridor.
 */
export function routeWire(options: WireRouteOptions) {
  const { bounds, end, endSide, mobile = false, start, startSide } = options;
  const lane = options.lane ?? 0;
  const lead = 44;
  const margin = 28;
  const laneGap = 24;
  const laneOffset = lane * laneGap;
  // Start separating a bundle at the terminal itself. Without this small
  // fan-out, several wires share the exact same first segment and only
  // become distinct much farther into the canvas.
  const fanOut = lane * 12;
  const leadDistance = lead + fanOut;
  const startLead = {
    x: clamp(start.x + startSide * leadDistance, margin, bounds.width - margin),
    y: start.y,
  };
  const endLead = {
    x: clamp(end.x + endSide * leadDistance, margin, bounds.width - margin),
    y: end.y,
  };
  const route: WireRoutePoint[] = [start, startLead];

  const verticalMobileRoute = mobile && Math.abs(startLead.y - endLead.y) > 96;
  if (verticalMobileRoute && startSide !== endSide) {
    const direction = endLead.y > startLead.y ? 1 : -1;
    const baseY = direction > 0
      ? Math.min(endLead.y - 44, startLead.y + 72)
      : Math.max(endLead.y + 44, startLead.y - 72);
    const bridgeY = clamp(baseY + laneOffset, margin, bounds.height - margin);
    route.push({ x: startLead.x, y: bridgeY }, { x: endLead.x, y: bridgeY });
  } else if (startSide === endSide) {
    // Same-side terminals often sit on opposite sides of another part. Use
    // an outside corridor to go around it, then come back to the target.
    // `compact` removes the redundant collinear lead points before rounding,
    // so this remains a clean U-shaped detour rather than a small braid.
    const outsideX = startSide > 0
      ? clamp(Math.max(startLead.x, endLead.x) + 72 + laneOffset, margin, bounds.width - margin)
      : clamp(Math.min(startLead.x, endLead.x) - 72 - laneOffset, margin, bounds.width - margin);
    route.push({ x: outsideX, y: startLead.y }, { x: outsideX, y: endLead.y });
  } else {
    const middleX = clamp(Math.round((startLead.x + endLead.x) / 2) + laneOffset, margin, bounds.width - margin);
    route.push({ x: middleX, y: startLead.y }, { x: middleX, y: endLead.y });
  }

  route.push(endLead, end);
  return compact(route);
}

export function roundedOrthogonalPath(points: WireRoutePoint[], radius = 16) {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  const commands = [`M ${points[0].x} ${points[0].y}`];
  for (let index = 1; index < points.length - 1; index += 1) {
    const previous = points[index - 1];
    const current = points[index];
    const next = points[index + 1];
    const previousDistance = Math.hypot(current.x - previous.x, current.y - previous.y);
    const nextDistance = Math.hypot(next.x - current.x, next.y - current.y);
    if (previousDistance === 0 || nextDistance === 0) continue;

    const turnRadius = Math.min(radius, previousDistance / 2, nextDistance / 2);
    const before = {
      x: current.x + ((previous.x - current.x) / previousDistance) * turnRadius,
      y: current.y + ((previous.y - current.y) / previousDistance) * turnRadius,
    };
    const after = {
      x: current.x + ((next.x - current.x) / nextDistance) * turnRadius,
      y: current.y + ((next.y - current.y) / nextDistance) * turnRadius,
    };
    commands.push(`L ${Math.round(before.x)} ${Math.round(before.y)}`, `Q ${current.x} ${current.y} ${Math.round(after.x)} ${Math.round(after.y)}`);
  }
  const last = points[points.length - 1];
  commands.push(`L ${last.x} ${last.y}`);
  return commands.join(" ");
}
