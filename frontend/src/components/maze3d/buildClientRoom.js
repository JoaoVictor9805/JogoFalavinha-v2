import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { CLIENT_ROOM, DOOR_Z } from './mazeData'
import { ringTexture, woodTextures } from './textures'
import { errorIntensity } from './world'

const DESK_X = CLIENT_ROOM.x1 - 0.5
const DESK_H = 0.38

/**
 * Constrói a sala do cliente: mesa, monitor Falavinha Next, luminária, cadeira
 * e telefone de mesa que treme e pisca em vermelho a cada resposta incorreta.
 */
export function buildClientRoom() {
  const root = new THREE.Group()
  const wood = woodTextures(1, 1)

  const deskGroup = new THREE.Group()
  deskGroup.position.set(DESK_X, 0, DOOR_Z)

  const tabletop = new THREE.Mesh(
    new THREE.BoxGeometry(0.72, 0.035, 1.5),
    new THREE.MeshStandardMaterial({ map: wood.map, roughness: 0.35, metalness: 0.05 })
  )
  tabletop.position.set(0, DESK_H, 0)
  tabletop.castShadow = true
  tabletop.receiveShadow = true
  deskGroup.add(tabletop)

  const legGeo = new THREE.BoxGeometry(0.04, DESK_H, 0.04)
  const steelMat = new THREE.MeshStandardMaterial({ color: '#202226', metalness: 0.8, roughness: 0.35 })
  ;[
    [-0.3, -0.68],
    [0.3, -0.68],
    [-0.3, 0.68],
    [0.3, 0.68],
  ].forEach(([lx, lz]) => {
    const leg = new THREE.Mesh(legGeo, steelMat)
    leg.position.set(lx, DESK_H / 2, lz)
    leg.castShadow = true
    deskGroup.add(leg)
  })

  // Monitor
  const screenTex = new THREE.TextureLoader().load('/brand/logo-screen.png')
  screenTex.colorSpace = THREE.SRGBColorSpace
  const screenMat = new THREE.MeshStandardMaterial({
    map: screenTex,
    emissive: '#ffffff',
    emissiveMap: screenTex,
    emissiveIntensity: 0.9,
  })
  const monitorFrame = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.3, 0.025),
    new THREE.MeshStandardMaterial({ color: '#0d0e10', roughness: 0.3, metalness: 0.4 })
  )
  monitorFrame.position.set(0.18, DESK_H + 0.2, -0.5)
  monitorFrame.rotation.y = -Math.PI / 2 + 0.2
  monitorFrame.castShadow = true
  deskGroup.add(monitorFrame)

  const monitorDisplay = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.26), screenMat)
  monitorDisplay.position.set(0.168, DESK_H + 0.2, -0.5)
  monitorDisplay.rotation.y = -Math.PI / 2 + 0.2
  deskGroup.add(monitorDisplay)

  const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 0.03, 20), steelMat)
  stand.position.set(0.18, DESK_H + 0.05, -0.5)
  stand.castShadow = true
  deskGroup.add(stand)

  // Luminária
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.24, 8), steelMat)
  stem.position.set(0.2, DESK_H + 0.14, 0.55)
  stem.castShadow = true
  deskGroup.add(stem)

  const bulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.045, 16, 12),
    new THREE.MeshStandardMaterial({ color: '#fff0cf', emissive: '#ffcf80', emissiveIntensity: 4 })
  )
  bulb.position.set(0.2, DESK_H + 0.27, 0.55)
  deskGroup.add(bulb)
  root.add(deskGroup)

  const lamp = new THREE.PointLight('#ffd9a3', 2.2, 4.5, 2)
  lamp.position.set(DESK_X + 0.2, DESK_H + 0.3, DOOR_Z + 0.55)
  root.add(lamp)

  // Cadeira
  const chair = new THREE.Group()
  chair.position.set(DESK_X - 0.85, 0, DOOR_Z + 0.1)
  chair.rotation.y = 0.5
  const cushionMat = new THREE.MeshStandardMaterial({ color: '#26262a', roughness: 0.7 })
  const chromeMat = new THREE.MeshStandardMaterial({ color: '#9ea2a8', metalness: 0.9, roughness: 0.3 })

  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.05, 0.34), cushionMat)
  seat.position.set(0, 0.23, 0)
  seat.castShadow = true
  chair.add(seat)

  const backrest = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.36, 0.32), cushionMat)
  backrest.position.set(-0.16, 0.42, 0)
  backrest.castShadow = true
  chair.add(backrest)

  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.2, 10), chromeMat)
  pole.position.set(0, 0.11, 0)
  pole.castShadow = true
  chair.add(pole)

  const baseStar = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.02, 5), chromeMat)
  baseStar.position.set(0, 0.02, 0)
  baseStar.castShadow = true
  chair.add(baseStar)
  root.add(chair)

  // Telefone de erro no canto da mesa
  const phoneMount = new THREE.Group()
  phoneMount.position.set(DESK_X, DESK_H + 0.02, DOOR_Z)
  phoneMount.rotation.y = -Math.PI / 2
  phoneMount.scale.setScalar(1.5)

  const phoneLight = new THREE.PointLight('#ff2a2a', 0, 2.2, 2)
  phoneLight.position.set(0, 0.3, 0)
  phoneMount.add(phoneLight)

  const phoneShakeGroup = new THREE.Group()
  const phoneBody = new THREE.Mesh(
    new RoundedBoxGeometry(0.42, 0.075, 0.34, 4, 0.025),
    new THREE.MeshStandardMaterial({ color: '#17181b', roughness: 0.22, metalness: 0.3 })
  )
  phoneBody.position.set(0, 0.04, 0)
  phoneBody.castShadow = true
  phoneShakeGroup.add(phoneBody)

  const phoneKeypad = new THREE.Mesh(
    new RoundedBoxGeometry(0.34, 0.04, 0.2, 3, 0.015),
    new THREE.MeshStandardMaterial({ color: '#222428', roughness: 0.3, metalness: 0.3 })
  )
  phoneKeypad.position.set(0, 0.095, 0.045)
  phoneKeypad.rotation.x = -0.25
  phoneKeypad.castShadow = true
  phoneShakeGroup.add(phoneKeypad)

  const keyGeo = new THREE.BoxGeometry(0.055, 0.012, 0.03)
  const keyMat = new THREE.MeshStandardMaterial({ color: '#d8d8d4', roughness: 0.4 })
  for (let i = 0; i < 12; i += 1) {
    const key = new THREE.Mesh(keyGeo, keyMat)
    key.position.set(
      -0.08 + (i % 3) * 0.08,
      0.121 + Math.floor(i / 3) * -0.0045,
      0.01 + Math.floor(i / 3) * 0.045
    )
    key.rotation.x = -0.25
    phoneShakeGroup.add(key)
  }

  const cradleMat = new THREE.MeshStandardMaterial({ color: '#17181b', roughness: 0.3 })
  ;[-1, 1].forEach((s) => {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.05, 0.05), cradleMat)
    post.position.set(s * 0.15, 0.1, -0.09)
    post.castShadow = true
    phoneShakeGroup.add(post)
  })

  const handset = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.035, 0.26, 6, 14),
    new THREE.MeshStandardMaterial({ color: '#101012', roughness: 0.2, metalness: 0.3 })
  )
  handset.position.set(0, 0.118, -0.09)
  handset.rotation.z = Math.PI / 2
  handset.castShadow = true
  phoneShakeGroup.add(handset)

  const ledMat = new THREE.MeshStandardMaterial({
    color: '#400',
    emissive: '#ff2b2b',
    emissiveIntensity: 0.15,
  })
  const led = new THREE.Mesh(new THREE.SphereGeometry(0.02, 12, 10), ledMat)
  led.position.set(0.17, 0.082, 0.12)
  phoneShakeGroup.add(led)

  const ringTex = ringTexture()
  const rings = [0, 1, 2].map(() => {
    const mat = new THREE.MeshBasicMaterial({
      map: ringTex,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    const ringMesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat)
    ringMesh.position.set(0, 0.17, 0)
    ringMesh.rotation.x = -Math.PI / 2
    phoneShakeGroup.add(ringMesh)
    return { mesh: ringMesh, mat }
  })

  phoneMount.add(phoneShakeGroup)
  root.add(phoneMount)

  function update(elapsedSec, nowMs, world) {
    lamp.intensity =
      2.2 + Math.sin(elapsedSec * 3.1) * 0.12 + (Math.sin(elapsedSec * 17) > 0.97 ? -0.7 : 0)
    screenMat.emissiveIntensity = 0.85 + Math.sin(elapsedSec * 1.4) * 0.1

    const { e, k } = errorIntensity(world, nowMs)
    phoneShakeGroup.position.x = Math.sin(e * 85) * 0.022 * k
    phoneShakeGroup.position.z = Math.cos(e * 70) * 0.014 * k
    phoneShakeGroup.rotation.y = Math.sin(e * 62) * 0.12 * k
    phoneShakeGroup.rotation.z = Math.sin(e * 90) * 0.05 * k
    handset.position.y = 0.118 + Math.abs(Math.sin(e * 55)) * 0.018 * k
    phoneLight.intensity = k > 0 ? (Math.sin(e * 28) > 0 ? 5 : 0.6) * k : 0
    ledMat.emissiveIntensity = k > 0 ? (Math.sin(e * 28) > 0 ? 6 : 0.4) : 0.15

    rings.forEach(({ mesh, mat }, idx) => {
      if (k <= 0) {
        mat.opacity = 0
        return
      }
      const waveT = (((e * 1.7 + idx / 3) % 1) + 1) % 1
      const sc = 0.4 + waveT * 2.4
      mesh.scale.set(sc, sc, sc)
      mat.opacity = (1 - waveT) * 1.4 * Math.min(1, k * 2)
    })
  }

  return { group: root, update }
}

