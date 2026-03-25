import type { HECSCoord } from '../hex/types'
import { TileState, hecsToKey } from '../hex/types'
import { hecsNeighbors } from '../hex/math'

// create an initial hex grid: center tile + 1 ring of neighbors + their border
export function createInitialGrid(): Map<string, TileState> {
  const tiles = new Map<string, TileState>()
  const center: HECSCoord = { a: 0, r: 0, c: 0 }

  // add center
  tiles.set(hecsToKey(center), TileState.WHITE)

  // add ring 1 (immediate neighbors)
  const ring1 = hecsNeighbors(center, 'pointy')
  for (const n of ring1) {
    tiles.set(hecsToKey(n), TileState.WHITE)
  }

  // add ring 2 (neighbors of ring 1) to provide a border
  for (const n of ring1) {
    const ring2 = hecsNeighbors(n, 'pointy')
    for (const n2 of ring2) {
      const key = hecsToKey(n2)
      if (!tiles.has(key)) {
        tiles.set(key, TileState.WHITE)
      }
    }
  }

  return tiles
}
