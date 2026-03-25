import { TileState, keyToHecs } from './types'

export type ExportTile = {
  a: number
  r: number
  c: number
  v: number
}

export type ExportData = {
  tiles: ExportTile[]
}

// export only black (filled) tiles
export function exportSparse(tiles: Map<string, TileState>): ExportData {
  const result: ExportTile[] = []
  for (const [key, state] of tiles) {
    if (state === TileState.BLACK) {
      const coord = keyToHecs(key)
      result.push({ a: coord.a, r: coord.r, c: coord.c, v: 1 })
    }
  }
  return { tiles: result }
}

// export all tiles in the grid
export function exportFull(tiles: Map<string, TileState>): ExportData {
  const result: ExportTile[] = []
  for (const [key, state] of tiles) {
    const coord = keyToHecs(key)
    result.push({ a: coord.a, r: coord.r, c: coord.c, v: state })
  }
  return { tiles: result }
}

// trigger a json file download
export function downloadJson(data: ExportData, filename: string) {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
