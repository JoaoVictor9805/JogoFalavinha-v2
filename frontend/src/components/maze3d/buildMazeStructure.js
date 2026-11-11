import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import {
  CELL,
  CLIENT_ROOM,
  DEPTH,
  DOOR_H,
  DOOR_W,
  DOOR_X,
  DOOR_Z,
  WALL_H,
  WALL_T,
  WIDTH,
  buildWalls,
} from './mazeData'
import {
  carpetTextures,
  fabricTextures,
  glowTexture,
  signTexture,
  woodTextures,
} from './textures'

function createPartition({ x, z, alongX, length = CELL, fabricMat, trimMat }) {
  const [w, d] = alongX ? [length + WALL_T, WALL_T] : [WALL_T, length + WALL_T]
  const group = new THREE.Group()
  group.position.set(x, 0, z)

  const panel = new THREE.Mesh(new THREE.BoxGeometry(w, WALL_H, d), fabricMat)
  panel.position.set(0, WALL_H / 2, 0)
  panel.castShadow = true
  panel.receiveShadow = true
  group.add(panel)

  const trim = new THREE.Mesh(new THREE.BoxGeometry(w, 0.024, d + 0.018), trimMat)
  trim.position.set(0, WALL_H + 0.012, 0)
  trim.castShadow = true
  group.add(trim)

  return group
}

function createPost({ x, z, postGeo, postMat }) {
  const mesh = new THREE.Mesh(postGeo, postMat)
  mesh.position.set(x, (WALL_H + 0.03) / 2, z)
  mesh.castShadow = true
  return mesh
}

/**
 * Constrói a maquete completa: base, carpete, divisórias com animação de abertura,
 * placa Falavinha Next, sala do cliente e porta animada.
 */
export function buildMazeStructure(world, { skipRise = false } = {}) {
  const root = new THREE.Group()
  const { walls, posts } = buildWalls()

  const fabric = fabricTextures(3, 1)
  const carpet = carpetTextures(WIDTH / 0.75, DEPTH / 0.75)
  const wood = woodTextures(3, 3)

  const fabricMat = new THREE.MeshStandardMaterial({
    map: fabric.map,
    bumpMap: fabric.bumpMap,
    bumpScale: 0.8,
    roughness: 0.95,
    color: '#c9d3db',
  })
  const trimMat = new THREE.MeshStandardMaterial({
    color: '#c8ccd0',
    metalness: 0.9,
    roughness: 0.28,
  })
  const postMat = new THREE.MeshStandardMaterial({
    color: '#b9bdc2',
    metalness: 0.92,
    roughness: 0.3,
  })
  const postGeo = new THREE.BoxGeometry(0.1, WALL_H + 0.03, 0.1)

  const roomW = CLIENT_ROOM.x1 - CLIENT_ROOM.x0
  const roomD = CLIENT_ROOM.z1 - CLIENT_ROOM.z0
  const slabX0 = -WIDTH / 2 - 0.7
  const slabX1 = CLIENT_ROOM.x1 + 0.7
  const slabW = slabX1 - slabX0
  const slabD = DEPTH + 1.4
  const stub = CELL / 2 - DOOR_W / 2 - 0.06

  // Base da maquete
  const slab = new THREE.Mesh(
    new RoundedBoxGeometry(slabW, 0.3, slabD, 4, 0.05),
    new THREE.MeshStandardMaterial({ color: '#26262a', roughness: 0.38, metalness: 0.55 })
  )
  slab.position.set((slabX0 + slabX1) / 2, -0.15, 0)
  slab.receiveShadow = true
  slab.castShadow = true
  root.add(slab)

  // Carpete do labirinto
  const carpetMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(WIDTH, DEPTH),
    new THREE.MeshStandardMaterial({
      map: carpet.map,
      bumpMap: carpet.bumpMap,
      bumpScale: 1.2,
      roughness: 1,
    })
  )
  carpetMesh.rotation.x = -Math.PI / 2
  carpetMesh.position.set(0, 0.002, 0)
  carpetMesh.receiveShadow = true
  root.add(carpetMesh)

  // Piso de madeira da sala do cliente
  const roomFloor = new THREE.Mesh(
    new THREE.PlaneGeometry(roomW, roomD),
    new THREE.MeshStandardMaterial({ map: wood.map, roughness: 0.5 })
  )
  roomFloor.rotation.x = -Math.PI / 2
  roomFloor.position.set(
    (CLIENT_ROOM.x0 + CLIENT_ROOM.x1) / 2,
    0.002,
    (CLIENT_ROOM.z0 + CLIENT_ROOM.z1) / 2
  )
  roomFloor.receiveShadow = true
  root.add(roomFloor)

  // Divisórias e pilares com subida animada escalonada na entrada
  const risers = []
  walls.forEach((w) => {
    const holder = new THREE.Group()
    holder.scale.set(1, skipRise ? 1 : 0.001, 1)
    holder.visible = skipRise
    holder.add(createPartition({ ...w, fabricMat, trimMat }))
    root.add(holder)
    risers.push({
      group: holder,
      delay: 0.12 + (w.x + WIDTH / 2) * 0.08 + (w.z + DEPTH / 2) * 0.03,
      done: skipRise,
    })
  })

  posts.forEach((p) => {
    const holder = new THREE.Group()
    holder.scale.set(1, skipRise ? 1 : 0.001, 1)
    holder.visible = skipRise
    holder.add(createPost({ ...p, postGeo, postMat }))
    root.add(holder)
    risers.push({
      group: holder,
      delay: 0.08 + (p.x + WIDTH / 2) * 0.08 + (p.z + DEPTH / 2) * 0.03,
      done: skipRise,
    })
  })

  // Paredes da sala do cliente
  root.add(
    createPartition({
      x: (CLIENT_ROOM.x0 + CLIENT_ROOM.x1) / 2,
      z: CLIENT_ROOM.z0,
      alongX: true,
      length: roomW,
      fabricMat,
      trimMat,
    })
  )
  root.add(
    createPartition({
      x: (CLIENT_ROOM.x0 + CLIENT_ROOM.x1) / 2,
      z: CLIENT_ROOM.z1,
      alongX: true,
      length: roomW,
      fabricMat,
      trimMat,
    })
  )
  root.add(
    createPartition({
      x: CLIENT_ROOM.x1,
      z: (CLIENT_ROOM.z0 + CLIENT_ROOM.z1) / 2,
      alongX: false,
      length: roomD,
      fabricMat,
      trimMat,
    })
  )
  ;[
    [CLIENT_ROOM.x0, CLIENT_ROOM.z0],
    [CLIENT_ROOM.x1, CLIENT_ROOM.z0],
    [CLIENT_ROOM.x0, CLIENT_ROOM.z1],
    [CLIENT_ROOM.x1, CLIENT_ROOM.z1],
  ].forEach(([px, pz]) => {
    root.add(createPost({ x: px, z: pz, postGeo, postMat }))
  })

  // Trechos de parede ao lado da porta
  ;[-1, 1].forEach((s) => {
    const seg = new THREE.Mesh(new THREE.BoxGeometry(WALL_T, WALL_H, stub), fabricMat)
    seg.position.set(DOOR_X, WALL_H / 2, DOOR_Z + s * (DOOR_W / 2 + 0.06 + stub / 2))
    seg.castShadow = true
    seg.receiveShadow = true
    root.add(seg)
  })

  // Placas da marca Falavinha Next
  const texLoader = new THREE.TextureLoader()
  const plaqueTex = texLoader.load('/brand/logo-plaque.png')
  plaqueTex.colorSpace = THREE.SRGBColorSpace
  plaqueTex.anisotropy = 8

  const frontZ = DEPTH / 2 + 0.37
  const centerX = (slabX0 + slabX1) / 2
  const frontPlaqueGroup = new THREE.Group()
  frontPlaqueGroup.position.set(centerX, 0.004, frontZ)
  frontPlaqueGroup.rotation.x = -Math.PI / 2

  const plateBack = new THREE.Mesh(new THREE.PlaneGeometry(3.5, 0.74), trimMat)
  plateBack.position.z = -0.002
  plateBack.receiveShadow = true
  frontPlaqueGroup.add(plateBack)

  const plateFront = new THREE.Mesh(
    new THREE.PlaneGeometry(3.4, 0.68),
    new THREE.MeshStandardMaterial({ map: plaqueTex, roughness: 0.35, metalness: 0.1 })
  )
  plateFront.receiveShadow = true
  frontPlaqueGroup.add(plateFront)
  root.add(frontPlaqueGroup)

  const frameZ = (CLIENT_ROOM.z0 + CLIENT_ROOM.z1) / 2
  const wallSignGroup = new THREE.Group()
  wallSignGroup.position.set(CLIENT_ROOM.x1 - 0.06, 0.3, frameZ)
  wallSignGroup.rotation.y = -Math.PI / 2

  const signBacking = new THREE.Mesh(
    new THREE.BoxGeometry(1.02, 0.26, 0.03),
    new THREE.MeshStandardMaterial({ color: '#1c1c1c', roughness: 0.4, metalness: 0.4 })
  )
  signBacking.castShadow = true
  wallSignGroup.add(signBacking)

  const signFace = new THREE.Mesh(
    new THREE.PlaneGeometry(0.96, 0.2),
    new THREE.MeshStandardMaterial({
      map: plaqueTex,
      roughness: 0.4,
      emissive: '#ffffff',
      emissiveMap: plaqueTex,
      emissiveIntensity: 0.25,
    })
  )
  signFace.position.z = 0.017
  wallSignGroup.add(signFace)
  root.add(wallSignGroup)

  // Porta da sala do cliente
  const doorGroup = new THREE.Group()
  doorGroup.position.set(DOOR_X, 0, DOOR_Z)
  const jambW = 0.06
  const half = DOOR_W / 2
  const jambMat = new THREE.MeshStandardMaterial({ color: '#d8d2c4', roughness: 0.55 })

  ;[-1, 1].forEach((s) => {
    const jamb = new THREE.Mesh(new THREE.BoxGeometry(0.12, DOOR_H, jambW), jambMat)
    jamb.position.set(0, DOOR_H / 2, s * (half + jambW / 2))
    jamb.castShadow = true
    doorGroup.add(jamb)
  })
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, DOOR_W + jambW * 2), jambMat)
  lintel.position.set(0, DOOR_H + 0.03, 0)
  lintel.castShadow = true
  doorGroup.add(lintel)

  const clientSignTex = signTexture('CLIENTE')
  const clientSignMat = new THREE.MeshStandardMaterial({
    map: clientSignTex,
    emissive: '#ffffff',
    emissiveMap: clientSignTex,
    emissiveIntensity: 0.3,
    roughness: 0.4,
    metalness: 0.2,
  })
  const clientSignMesh = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.15, 0.025), clientSignMat)
  clientSignMesh.position.set(-0.075, DOOR_H + 0.2, 0)
  clientSignMesh.rotation.y = -Math.PI / 2
  clientSignMesh.castShadow = true
  doorGroup.add(clientSignMesh)

  const leafGroup = new THREE.Group()
  leafGroup.position.set(0, 0, -half)

  const doorPanel = new THREE.Mesh(
    new THREE.BoxGeometry(0.05, DOOR_H - 0.04, DOOR_W - 0.01),
    new THREE.MeshStandardMaterial({ color: '#6e4a2e', roughness: 0.45, metalness: 0.05 })
  )
  doorPanel.position.set(0, DOOR_H / 2 - 0.02, half)
  doorPanel.castShadow = true
  doorPanel.receiveShadow = true
  leafGroup.add(doorPanel)

  const knob = new THREE.Mesh(
    new THREE.SphereGeometry(0.028, 14, 12),
    new THREE.MeshStandardMaterial({ color: '#d6b25e', metalness: 1, roughness: 0.2 })
  )
  knob.position.set(-0.035, DOOR_H / 2 - 0.02, half + 0.28)
  knob.castShadow = true
  leafGroup.add(knob)

  const trimPanel = new THREE.Mesh(
    new THREE.BoxGeometry(0.006, 0.3, 0.4),
    new THREE.MeshStandardMaterial({ color: '#8a6340', roughness: 0.4 })
  )
  trimPanel.position.set(-0.028, DOOR_H * 0.7, half)
  leafGroup.add(trimPanel)
  doorGroup.add(leafGroup)

  const glowMat = new THREE.MeshBasicMaterial({
    map: glowTexture(),
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })
  const glowPlane = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.2), glowMat)
  glowPlane.position.set(-0.9, 0.006, 0)
  glowPlane.rotation.x = -Math.PI / 2
  doorGroup.add(glowPlane)

  root.add(doorGroup)

  function update(elapsedSec, dt) {
    risers.forEach((item) => {
      if (item.done) return
      const k = Math.min(1, Math.max(0, (elapsedSec - item.delay) / 0.55))
      const c1 = 1.5
      const e = k >= 1 ? 1 : 1 + (c1 + 1) * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2)
      item.group.visible = k > 0
      item.group.scale.y = Math.max(0.001, e)
      if (k >= 1) item.done = true
    })

    clientSignMat.emissiveIntensity = 0.25 + 0.2 * Math.sin(elapsedSec * 2.2)

    const near = world.pos.x > DOOR_X - 1.2 && Math.abs(world.pos.z - DOOR_Z) < 0.4
    world.doorOpen += ((near ? 1 : 0) - world.doorOpen) * Math.min(1, dt * 4)
    leafGroup.rotation.y = world.doorOpen * 1.75
    glowMat.opacity = world.doorOpen * 0.9
  }

  return { group: root, center: new THREE.Vector3(1.15, 0, 0.15), update }
}
