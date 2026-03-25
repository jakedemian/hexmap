import { useRef, useEffect, useCallback, useState } from 'react'
import { useGrid } from '../state/GridContext'
import { hecsToPixel, pixelToHecs } from '../hex/math'
import { hexCorners } from '../hex/geometry'
import { hecsToKey, keyToHecs, TileState } from '../hex/types'

const HEX_SIZE = 30

type Camera = {
  offsetX: number
  offsetY: number
  zoom: number
}

export function HexCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { state, dispatch } = useGrid()
  const [camera, setCamera] = useState<Camera>({ offsetX: 0, offsetY: 0, zoom: 1 })
  const [hoveredKey, setHoveredKey] = useState<string | null>(null)
  const isPanning = useRef(false)
  const isDrawing = useRef(false)
  const drawTarget = useRef<TileState>(TileState.BLACK) // what we're painting tiles to
  const lastMouse = useRef({ x: 0, y: 0 })
  const needsCenter = useRef(true)

  // convert screen coords to world coords
  const screenToWorld = useCallback((screenX: number, screenY: number, cam: Camera) => {
    return {
      x: (screenX - cam.offsetX) / cam.zoom,
      y: (screenY - cam.offsetY) / cam.zoom,
    }
  }, [])

  // draw the grid
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const width = canvas.clientWidth
    const height = canvas.clientHeight

    // handle dpi scaling
    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr
      canvas.height = height * dpr
    }

    // center camera on first draw
    if (needsCenter.current) {
      setCamera(prev => ({
        ...prev,
        offsetX: width / 2,
        offsetY: height / 2,
      }))
      needsCenter.current = false
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, width, height)

    // apply camera transform
    ctx.save()
    ctx.translate(camera.offsetX, camera.offsetY)
    ctx.scale(camera.zoom, camera.zoom)

    // draw each tile
    for (const [key, tileState] of state.tiles) {
      const coord = keyToHecs(key)
      const center = hecsToPixel(coord, state.orientation, HEX_SIZE)
      const corners = hexCorners(center, HEX_SIZE, state.orientation)

      ctx.beginPath()
      ctx.moveTo(corners[0].x, corners[0].y)
      for (let i = 1; i < corners.length; i++) {
        ctx.lineTo(corners[i].x, corners[i].y)
      }
      ctx.closePath()

      // fill
      if (tileState === TileState.BLACK) {
        ctx.fillStyle = '#1a1a2e'
      } else {
        ctx.fillStyle = '#e8e8f0'
      }

      // hover highlight
      if (key === hoveredKey) {
        ctx.fillStyle = tileState === TileState.BLACK ? '#2a2a4e' : '#c8c8e0'
      }

      ctx.fill()

      // stroke
      ctx.strokeStyle = '#555580'
      ctx.lineWidth = 1.5
      ctx.stroke()
    }

    ctx.restore()
  }, [state, camera, hoveredKey])

  // redraw on state changes
  useEffect(() => {
    draw()
  }, [draw])

  // resize handler
  useEffect(() => {
    const handleResize = () => {
      needsCenter.current = false
      draw()
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [draw])

  // helper: paint a tile at screen position during drawing
  const paintAt = useCallback((screenX: number, screenY: number) => {
    const world = screenToWorld(screenX, screenY, camera)
    const coord = pixelToHecs(world, state.orientation, HEX_SIZE)
    const key = hecsToKey(coord)
    if (state.tiles.has(key)) {
      dispatch({ type: 'SET_TILE', coord, value: drawTarget.current })
    }
  }, [camera, state.orientation, state.tiles, dispatch, screenToWorld])

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    // right/middle click = pan
    if (e.button === 1 || e.button === 2) {
      e.preventDefault()
      isPanning.current = true
      lastMouse.current = { x: e.clientX, y: e.clientY }
      return
    }

    // left click = start drawing
    if (e.button === 0) {
      const rect = canvasRef.current!.getBoundingClientRect()
      const screenX = e.clientX - rect.left
      const screenY = e.clientY - rect.top
      const world = screenToWorld(screenX, screenY, camera)
      const coord = pixelToHecs(world, state.orientation, HEX_SIZE)
      const key = hecsToKey(coord)
      const current = state.tiles.get(key)

      if (current !== undefined) {
        // determine draw mode from the starting tile
        drawTarget.current = current === TileState.WHITE ? TileState.BLACK : TileState.WHITE
        isDrawing.current = true
        dispatch({ type: 'SET_TILE', coord, value: drawTarget.current })
      }
    }
  }, [camera, state.orientation, state.tiles, dispatch, screenToWorld])

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect()
    const screenX = e.clientX - rect.left
    const screenY = e.clientY - rect.top

    // panning
    if (isPanning.current) {
      const dx = e.clientX - lastMouse.current.x
      const dy = e.clientY - lastMouse.current.y
      setCamera(prev => ({
        ...prev,
        offsetX: prev.offsetX + dx,
        offsetY: prev.offsetY + dy,
      }))
      lastMouse.current = { x: e.clientX, y: e.clientY }
      return
    }

    // drawing
    if (isDrawing.current) {
      paintAt(screenX, screenY)
    }

    // hover detection
    const world = screenToWorld(screenX, screenY, camera)
    const coord = pixelToHecs(world, state.orientation, HEX_SIZE)
    const key = `${coord.a},${coord.r},${coord.c}`
    setHoveredKey(state.tiles.has(key) ? key : null)
  }, [camera, state.orientation, state.tiles, screenToWorld, paintAt])

  const handleMouseUp = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 1 || e.button === 2) {
      isPanning.current = false
    }
    if (e.button === 0) {
      isDrawing.current = false
    }
  }, [])

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
  }, [])

  // zoom with scroll wheel
  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    const rect = canvasRef.current!.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9
    setCamera(prev => {
      const newZoom = Math.max(0.1, Math.min(5, prev.zoom * zoomFactor))
      // zoom toward mouse position
      const newOffsetX = mouseX - (mouseX - prev.offsetX) * (newZoom / prev.zoom)
      const newOffsetY = mouseY - (mouseY - prev.offsetY) * (newZoom / prev.zoom)
      return { offsetX: newOffsetX, offsetY: newOffsetY, zoom: newZoom }
    })
  }, [])

  const hoveredCoord = hoveredKey ? keyToHecs(hoveredKey) : null
  const hoveredTileState = hoveredKey ? state.tiles.get(hoveredKey) : undefined

  return (
    <>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block', cursor: isPanning.current ? 'grabbing' : 'pointer' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onContextMenu={handleContextMenu}
        onWheel={handleWheel}
      />
      {hoveredCoord && (
        <div style={{
          position: 'absolute',
          bottom: 16,
          left: 16,
          padding: '6px 12px',
          background: '#2a2a4e',
          color: '#e8e8f0',
          border: '1px solid #555580',
          borderRadius: 6,
          fontSize: 14,
          fontFamily: 'monospace',
          pointerEvents: 'none',
        }}>
          HECS({hoveredCoord.a}, {hoveredCoord.r}, {hoveredCoord.c}){' '}
          <span style={{ color: hoveredTileState === TileState.BLACK ? '#8888cc' : '#666688' }}>
            ({hoveredTileState === TileState.BLACK
              ? `exported as {a:${hoveredCoord.a}, r:${hoveredCoord.r}, c:${hoveredCoord.c}, v:1}`
              : 'not exported'})
          </span>
        </div>
      )}
    </>
  )
}
