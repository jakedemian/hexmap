import type { HECSCoord, Orientation } from '../hex/types'
import { TileState, hecsToKey } from '../hex/types'
import { hecsNeighbors } from '../hex/math'

export type GridState = {
  tiles: Map<string, TileState>
  orientation: Orientation
}

export type GridAction =
  | { type: 'TOGGLE_TILE'; coord: HECSCoord }
  | { type: 'SET_ORIENTATION'; orientation: Orientation }

// ensure all neighbors of a coord exist as white tiles
function expandAt(tiles: Map<string, TileState>, coord: HECSCoord, orientation: Orientation): Map<string, TileState> {
  const neighbors = hecsNeighbors(coord, orientation)
  let changed = false
  for (const n of neighbors) {
    const key = hecsToKey(n)
    if (!tiles.has(key)) {
      tiles.set(key, TileState.WHITE)
      changed = true
    }
  }
  return tiles
}

export function gridReducer(state: GridState, action: GridAction): GridState {
  switch (action.type) {
    case 'TOGGLE_TILE': {
      const key = hecsToKey(action.coord)
      const newTiles = new Map(state.tiles)
      const current = newTiles.get(key)
      if (current === undefined) return state

      // toggle
      newTiles.set(
        key,
        current === TileState.WHITE ? TileState.BLACK : TileState.WHITE,
      )

      // expand: ensure neighbors of toggled tile exist
      expandAt(newTiles, action.coord, state.orientation)

      // also expand neighbors of all edge tiles that are now adjacent
      // to give a consistent border of white tiles
      const neighbors = hecsNeighbors(action.coord, state.orientation)
      for (const n of neighbors) {
        expandAt(newTiles, n, state.orientation)
      }

      return { ...state, tiles: newTiles }
    }

    case 'SET_ORIENTATION': {
      return { ...state, orientation: action.orientation }
    }

    default:
      return state
  }
}
