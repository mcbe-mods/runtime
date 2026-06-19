import { describe, expect, it } from 'vitest'
import { getCubeRange, getSphereRange } from '../src/index'

describe('getCubeRange', () => {
  it('radius 0 returns only center', () => {
    const positions = getCubeRange({ x: 0, y: 0, z: 0 }, 0)
    expect(positions).toHaveLength(1)
    expect(positions[0]).toEqual({ x: 0, y: 0, z: 0 })
  })

  it('radius 1 returns 27 positions', () => {
    const positions = getCubeRange({ x: 0, y: 0, z: 0 }, 1)
    expect(positions).toHaveLength(27)
  })

  it('radius 2 returns 125 positions', () => {
    const positions = getCubeRange({ x: 5, y: 5, z: 5 }, 2)
    expect(positions).toHaveLength(125)
  })

  it('all positions are within range', () => {
    const center = { x: 10, y: 20, z: 30 }
    const radius = 2
    const positions = getCubeRange(center, radius)
    for (const pos of positions) {
      expect(Math.abs(pos.x - center.x)).toBeLessThanOrEqual(radius)
      expect(Math.abs(pos.y - center.y)).toBeLessThanOrEqual(radius)
      expect(Math.abs(pos.z - center.z)).toBeLessThanOrEqual(radius)
    }
  })

  it('positions are unique', () => {
    const positions = getCubeRange({ x: 0, y: 0, z: 0 }, 1)
    const keys = positions.map(p => `${p.x},${p.y},${p.z}`)
    expect(new Set(keys).size).toBe(positions.length)
  })
})

describe('getSphereRange', () => {
  it('radius 0 returns only center', () => {
    const positions = getSphereRange({ x: 0, y: 0, z: 0 }, 0)
    expect(positions).toHaveLength(1)
    expect(positions[0]).toEqual({ x: 0, y: 0, z: 0 })
  })

  it('radius 1 returns center + 6 faces', () => {
    const positions = getSphereRange({ x: 0, y: 0, z: 0 }, 1)
    expect(positions).toHaveLength(7)
  })

  it('radius 2 returns fewer than cube', () => {
    const positions = getSphereRange({ x: 0, y: 0, z: 0 }, 2)
    expect(positions.length).toBeLessThan(125)
    expect(positions.length).toBeGreaterThan(0)
  })

  it('all positions are within Euclidean distance', () => {
    const center = { x: 10, y: 20, z: 30 }
    const radius = 3
    const positions = getSphereRange(center, radius)
    for (const pos of positions) {
      const dx = pos.x - center.x
      const dy = pos.y - center.y
      const dz = pos.z - center.z
      expect(dx * dx + dy * dy + dz * dz).toBeLessThanOrEqual(radius * radius)
    }
  })

  it('positions are unique', () => {
    const positions = getSphereRange({ x: 0, y: 0, z: 0 }, 2)
    const keys = positions.map(p => `${p.x},${p.y},${p.z}`)
    expect(new Set(keys).size).toBe(positions.length)
  })
})
