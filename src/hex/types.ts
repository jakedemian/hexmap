export type HECSCoord = {
  a: 0 | 1
  r: number
  c: number
}

export const TileState = {
  WHITE: 0,
  BLACK: 1,
} as const

export type TileState = (typeof TileState)[keyof typeof TileState]

export type Orientation = 'pointy' | 'flat'

export type Point = { x: number; y: number }

export function hecsToKey(coord: HECSCoord): string {
  return `${coord.a},${coord.r},${coord.c}`
}

export function keyToHecs(key: string): HECSCoord {
  const [a, r, c] = key.split(',').map(Number)
  return { a: a as 0 | 1, r, c }
}

export function hecsEqual(a: HECSCoord, b: HECSCoord): boolean {
  return a.a === b.a && a.r === b.r && a.c === b.c
}
