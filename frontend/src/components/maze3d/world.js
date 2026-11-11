import * as THREE from 'three'

export const ERROR_DURATION = 1.2

export function createWorldState() {
  return {
    s: 0,
    pos: new THREE.Vector3(-3, 0.4, 0.75),
    errorAt: -1,
    errorActive: false,
    doorOpen: 0,
    successAt: -1,
  }
}

export function errorIntensity(world, now) {
  if (!world.errorActive || world.errorAt < 0) return { e: 0, k: 0 }
  const e = (now - world.errorAt) / 1000
  if (e > ERROR_DURATION) return { e, k: 0 }
  return { e, k: 1 - e / ERROR_DURATION }
}

