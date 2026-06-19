export interface Location {
  x: number
  y: number
  z: number
}

export function getCubeRange(location: Location, radius: number = 1): Location[] {
  const centerX = location.x
  const centerY = location.y
  const centerZ = location.z

  const positions: Location[] = []

  for (let x = centerX - radius; x <= centerX + radius; x++) {
    for (let y = centerY - radius; y <= centerY + radius; y++) {
      for (let z = centerZ - radius; z <= centerZ + radius; z++) {
        positions.push({ x, y, z })
      }
    }
  }
  return positions
}

export function getSphereRange(location: Location, radius: number = 1): Location[] {
  const centerX = location.x
  const centerY = location.y
  const centerZ = location.z
  const radiusSq = radius * radius

  const positions: Location[] = []

  for (let x = centerX - radius; x <= centerX + radius; x++) {
    for (let y = centerY - radius; y <= centerY + radius; y++) {
      for (let z = centerZ - radius; z <= centerZ + radius; z++) {
        const dx = x - centerX
        const dy = y - centerY
        const dz = z - centerZ
        if (dx * dx + dy * dy + dz * dz <= radiusSq) {
          positions.push({ x, y, z })
        }
      }
    }
  }
  return positions
}
