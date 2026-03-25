import type { HECSCoord, Orientation, Point } from './types'

const SQRT3 = Math.sqrt(3)

// convert hecs (a, r, c) to pixel center for pointy-top hexes
// pointy-top hex pixel position:
//   offset_row = 2r + a
//   offset_col = c
//   x = size * sqrt(3) * (col + 0.5 * (row & 1))
//   y = size * 3/2 * row
function hecsToPixelPointy(coord: HECSCoord, size: number): Point {
  const row = 2 * coord.r + coord.a
  const col = coord.c
  const x = size * SQRT3 * (col + 0.5 * (row & 1))
  const y = size * 1.5 * row
  return { x, y }
}

// flat-top hex pixel position:
//   x = size * 3/2 * col
//   y = size * sqrt(3) * (row + 0.5 * (col & 1))
// we reuse the same offset row/col mapping
function hecsToPixelFlat(coord: HECSCoord, size: number): Point {
  const row = 2 * coord.r + coord.a
  const col = coord.c
  const x = size * 1.5 * col
  const y = size * SQRT3 * (row + 0.5 * (col & 1))
  return { x, y }
}

export function hecsToPixel(coord: HECSCoord, orientation: Orientation, size: number): Point {
  return orientation === 'pointy'
    ? hecsToPixelPointy(coord, size)
    : hecsToPixelFlat(coord, size)
}

// convert pixel to the nearest hecs coordinate
// strategy: convert pixel to fractional offset coords, then to fractional cube,
// round cube coords, convert back to offset, then to hecs
export function pixelToHecs(px: Point, orientation: Orientation, size: number): HECSCoord {
  if (orientation === 'pointy') {
    return pixelToHecsPointy(px, size)
  } else {
    return pixelToHecsFlat(px, size)
  }
}

function pixelToHecsPointy(px: Point, size: number): HECSCoord {
  // convert pixel to fractional axial (pointy-top)
  const q = (SQRT3 / 3 * px.x - 1 / 3 * px.y) / size
  const r = (2 / 3 * px.y) / size

  // round axial to nearest hex
  const { q: rq, r: rr } = axialRound(q, r)

  // axial to offset (odd-r: odd rows shifted right, matching hecsToPixelPointy)
  const offsetCol = rq + Math.floor(rr / 2)
  const offsetRow = rr

  // offset to hecs
  const a = (((offsetRow % 2) + 2) % 2) as 0 | 1
  const hecsR = (offsetRow - a) / 2
  return { a, r: hecsR, c: offsetCol }
}

function pixelToHecsFlat(px: Point, size: number): HECSCoord {
  // convert pixel to fractional axial (flat-top)
  const q = (2 / 3 * px.x) / size
  const r = (-1 / 3 * px.x + SQRT3 / 3 * px.y) / size

  // round axial
  const { q: rq, r: rr } = axialRound(q, r)

  // axial to offset (odd-q: odd cols shifted down, matching hecsToPixelFlat)
  const offsetCol = rq
  const offsetRow = rr + Math.floor(rq / 2)

  // offset to hecs
  const a = (((offsetRow % 2) + 2) % 2) as 0 | 1
  const hecsR = (offsetRow - a) / 2
  return { a, r: hecsR, c: offsetCol }
}

function axialRound(q: number, r: number): { q: number; r: number } {
  const s = -q - r
  let rq = Math.round(q)
  let rr = Math.round(r)
  let rs = Math.round(s)

  const qDiff = Math.abs(rq - q)
  const rDiff = Math.abs(rr - r)
  const sDiff = Math.abs(rs - s)

  if (qDiff > rDiff && qDiff > sDiff) {
    rq = -rr - rs
  } else if (rDiff > sDiff) {
    rr = -rq - rs
  }

  return { q: rq, r: rr }
}

// get all 6 neighbors of a hecs coordinate
// derived from even-r offset neighbor table converted to hecs:
//   a=0 even row offsets: NE(-1,0) NW(-1,-1) SE(+1,0) SW(+1,-1)
//   a=1 odd row offsets:  NE(-1,+1) NW(-1,0) SE(+1,+1) SW(+1,0)
// unified: NE/NW use r+a-1, SE/SW use r+a, col shifts by +a
const POINTY_NEIGHBORS: Array<(coord: HECSCoord) => HECSCoord> = [
  // east
  ({ a, r, c }) => ({ a, r, c: c + 1 }),
  // west
  ({ a, r, c }) => ({ a, r, c: c - 1 }),
  // northeast
  ({ a, r, c }) => ({ a: (1 - a) as 0 | 1, r: r + a - 1, c: c + a }),
  // northwest
  ({ a, r, c }) => ({ a: (1 - a) as 0 | 1, r: r + a - 1, c: c + a - 1 }),
  // southeast
  ({ a, r, c }) => ({ a: (1 - a) as 0 | 1, r: r + a, c: c + a }),
  // southwest
  ({ a, r, c }) => ({ a: (1 - a) as 0 | 1, r: r + a, c: c + a - 1 }),
]

export function hecsNeighbors(coord: HECSCoord, _orientation: Orientation): HECSCoord[] {
  // hecs neighbors are orientation-independent because hecs is defined
  // on the abstract grid. the orientation only affects pixel rendering.
  return POINTY_NEIGHBORS.map(fn => fn(coord))
}
