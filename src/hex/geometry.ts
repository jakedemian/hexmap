import type { Orientation, Point } from './types'

// return the 6 corner vertices of a hex centered at `center`
export function hexCorners(center: Point, size: number, orientation: Orientation): Point[] {
  const corners: Point[] = []
  for (let i = 0; i < 6; i++) {
    // pointy-top: first corner at 30 degrees (offset by 30)
    // flat-top: first corner at 0 degrees
    const angleDeg = orientation === 'pointy' ? 60 * i - 30 : 60 * i
    const angleRad = (Math.PI / 180) * angleDeg
    corners.push({
      x: center.x + size * Math.cos(angleRad),
      y: center.y + size * Math.sin(angleRad),
    })
  }
  return corners
}
