import * as THREE from 'three'

export const ERROR_DURATION = 3.2

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
  if (!world.errorActive || world.errorAt < 0) return { e: 0, k: 0, flash: 0 }
  const e = Math.max(0, (now - world.errorAt) / 1000)
  // Intensidade do tremor do telefone/câmera decai ao longo de ERROR_DURATION
  const k = e > ERROR_DURATION ? 0 : 1 - e / ERROR_DURATION
  // Pulso visual vermelho no labirinto: forte nos primeiros 3,2s e depois mantém alerta pulsante visível
  const fastWave = 0.5 + 0.5 * Math.sin(e * 15 - Math.PI / 2)
  const idleWave = 0.5 + 0.5 * Math.sin(e * 6.5 - Math.PI / 2)
  const flash =
    e <= ERROR_DURATION
      ? fastWave * (0.45 + 0.55 * k)
      : 0.14 + idleWave * 0.34
  return { e, k, flash }
}

