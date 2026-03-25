import { createContext, useContext, useReducer, type ReactNode } from 'react'
import type { GridState, GridAction } from './gridState'
import { gridReducer } from './gridState'
import { createInitialGrid } from './initGrid'

type GridContextValue = {
  state: GridState
  dispatch: React.Dispatch<GridAction>
}

const GridContext = createContext<GridContextValue | null>(null)

const initialState: GridState = {
  tiles: createInitialGrid(),
  orientation: 'pointy',
}

export function GridProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gridReducer, initialState)

  return (
    <GridContext.Provider value={{ state, dispatch }}>
      {children}
    </GridContext.Provider>
  )
}

export function useGrid(): GridContextValue {
  const ctx = useContext(GridContext)
  if (!ctx) throw new Error('useGrid must be used within GridProvider')
  return ctx
}
