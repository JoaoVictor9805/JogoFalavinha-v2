import * as THREE from 'three'
import { buildRoute, pointAt, routeDistanceForStep } from './mazeData'
import { ERROR_DURATION } from './world'

const SKIN = '#e2b08c'

function stdMat(color, roughness = 0.7, metalness = 0) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness })
}

/**
 * Constrói o avatar 3D do Johnny (terno azul, gravata, óculos, headset)
 * e controla a caminhada pelo percurso de 7 etapas até a sala do cliente.
 */
export function buildJohnnyModel(initialStep = 0, { skipDrop = false } = {}) {
  const route = buildRoute()
  const root = new THREE.Group()
  const body = new THREE.Group()
  const head = new THREE.Group()
  head.position.set(0, 0.76, 0)

  const legL = new THREE.Group()
  legL.position.set(-0.07, 0.3, 0)
  const legR = new THREE.Group()
  legR.position.set(0.07, 0.3, 0)
  const armL = new THREE.Group()
  armL.position.set(-0.145, 0.58, 0)
  const armR = new THREE.Group()
  armR.position.set(0.145, 0.58, 0)

  const pantMat = stdMat('#1b2433')
  const shoeMat = stdMat('#15110e', 0.3)
  ;[legL, legR].forEach((leg) => {
    const legMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.048, 0.18, 6, 12), pantMat)
    legMesh.position.set(0, -0.15, 0)
    leg.add(legMesh)
    const shoeMesh = new THREE.Mesh(new THREE.BoxGeometry(0.095, 0.05, 0.16), shoeMat)
    shoeMesh.position.set(0, -0.285, 0.025)
    leg.add(shoeMesh)
    body.add(leg)
  })

  const suitMat = stdMat('#22314a', 0.75)
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.105, 0.16, 8, 16), suitMat)
  torso.position.set(0, 0.46, 0)
  torso.scale.set(1, 1, 0.78)
  body.add(torso)

  const shirt = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.17, 0.012), stdMat('#f4f4f2', 0.8))
  shirt.position.set(0, 0.5, 0.084)
  body.add(shirt)

  const tie = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.15, 0.012), stdMat('#7A2B2B', 0.5))
  tie.position.set(0, 0.48, 0.093)
  body.add(tie)

  const skinMat = stdMat(SKIN, 0.55)
  ;[armL, armR].forEach((arm) => {
    const sleeve = new THREE.Mesh(new THREE.CapsuleGeometry(0.036, 0.19, 6, 12), suitMat)
    sleeve.position.set(0, -0.13, 0)
    arm.add(sleeve)
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.04, 14, 12), skinMat)
    hand.position.set(0, -0.265, 0)
    arm.add(hand)
    body.add(arm)
  })

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.045, 0.05, 12), skinMat)
  neck.position.set(0, 0.625, 0)
  body.add(neck)

  // Cabeça
  const cranium = new THREE.Mesh(new THREE.SphereGeometry(0.135, 32, 24), stdMat(SKIN, 0.5))
  cranium.scale.set(1, 1.06, 1)
  head.add(cranium)

  const hairMat = stdMat('#2a1d16', 0.9)
  const hair = new THREE.Mesh(
    new THREE.SphereGeometry(0.142, 32, 20, 0, Math.PI * 2, 0, Math.PI * 0.52),
    hairMat
  )
  hair.position.set(0, 0.012, -0.012)
  hair.rotation.x = -0.35
  hair.scale.set(1, 1.04, 1)
  head.add(hair)

  ;[-1, 1].forEach((s) => {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.03, 12, 10), skinMat)
    ear.position.set(s * 0.133, -0.005, 0)
    ear.scale.set(0.5, 1, 0.8)
    head.add(ear)

    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.014, 12, 10), stdMat('#0d0d0d', 0.2))
    eye.position.set(s * 0.05, 0.012, 0.122)
    head.add(eye)

    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.011, 0.012), hairMat)
    brow.position.set(s * 0.05, 0.05, 0.12)
    brow.rotation.z = s * -0.12
    head.add(brow)

    const frame = new THREE.Mesh(
      new THREE.TorusGeometry(0.034, 0.0045, 8, 24),
      stdMat('#101010', 0.3, 0.6)
    )
    frame.position.set(s * 0.05, 0.012, 0.128)
    head.add(frame)
  })

  const bridge = new THREE.Mesh(
    new THREE.BoxGeometry(0.03, 0.005, 0.005),
    stdMat('#101010', 0.3, 0.6)
  )
  bridge.position.set(0, 0.012, 0.13)
  head.add(bridge)

  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.019, 12, 10), stdMat('#d99f7d', 0.5))
  nose.position.set(0, -0.02, 0.135)
  nose.scale.set(1, 1, 1.2)
  head.add(nose)

  const smile = new THREE.Mesh(
    new THREE.TorusGeometry(0.032, 0.0055, 8, 14, Math.PI),
    stdMat('#6b2a2a', 0.5)
  )
  smile.position.set(0, -0.058, 0.122)
  smile.rotation.z = Math.PI
  head.add(smile)

  // Headset de atendimento
  const headsetMat = stdMat('#1a1a1c', 0.35, 0.5)
  const band = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.011, 8, 28, Math.PI), headsetMat)
  band.position.set(0, 0.005, 0)
  head.add(band)

  ;[-1, 1].forEach((s) => {
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.034, 0.03, 18), headsetMat)
    cup.position.set(s * 0.148, 0.002, 0)
    cup.rotation.z = Math.PI / 2
    head.add(cup)
  })

  const micArm = new THREE.Mesh(
    new THREE.CylinderGeometry(0.004, 0.004, 0.1, 8),
    stdMat('#1a1a1c', 0.3, 0.6)
  )
  micArm.position.set(0.118, -0.035, 0.07)
  micArm.rotation.set(0.9, 0.2, 0)
  head.add(micArm)

  const micTip = new THREE.Mesh(new THREE.SphereGeometry(0.012, 10, 8), stdMat('#1a1a1c', 0.4, 0.4))
  micTip.position.set(0.1, -0.062, 0.115)
  head.add(micTip)

  body.add(head)
  root.add(body)

  root.traverse((obj) => {
    if (obj.isMesh) {
      obj.castShadow = true
      obj.receiveShadow = true
    }
  })

  const st = {
    s: routeDistanceForStep(initialStep, route.cum),
    vel: 0,
    phase: 0,
    heading: Math.PI / 2,
    stepAcc: 0,
    doneTimer: 0,
    completed: false,
    cheer: -1,
    wasMoving: false,
    intro: skipDrop ? 5 : 0,
  }

  function update(rawDt, nowMs, targetStep, world, callbacks) {
    const dt = Math.min(rawDt, 0.05)
    st.intro += dt
    const target = routeDistanceForStep(targetStep, route.cum)
    const remaining = target - st.s
    const total = route.cum[route.cum.length - 1]
    const finalTarget = target >= total - 0.01

    if (remaining > 0.002) {
      st.wasMoving = true
      const want = Math.min(1.45, 0.35 + remaining * 2.4)
      st.vel += (want - st.vel) * Math.min(1, dt * 7)
      const move = Math.min(st.vel * dt, remaining)
      st.s += move
      st.phase += move * 8.5
      st.stepAcc += move
      if (st.stepAcc > 0.42) {
        st.stepAcc = 0
        callbacks.onFootstep?.()
      }
    } else {
      st.vel += (0 - st.vel) * Math.min(1, dt * 10)
      st.s = target
      if (st.wasMoving && !finalTarget) st.cheer = 0
      st.wasMoving = false
    }

    if (st.s >= total - 0.01 && !st.completed) {
      st.doneTimer += dt
      if (st.doneTimer > 0.55) {
        st.completed = true
        callbacks.onComplete?.()
      }
    } else if (st.s < total - 0.05) {
      st.completed = false
      st.doneTimer = 0
    }

    const p = pointAt(st.s, route.pts, route.cum)
    const ahead = pointAt(st.s + 0.05, route.pts, route.cum)
    const desired = st.completed ? -Math.PI / 2 : Math.atan2(ahead.dx, ahead.dz)
    let diff = desired - st.heading
    diff = Math.atan2(Math.sin(diff), Math.cos(diff))
    st.heading += diff * Math.min(1, dt * (st.completed ? 5 : 9))

    const t = nowMs / 1000
    const moving = Math.min(1, st.vel / 0.9)
    const err = world.errorActive ? (nowMs - world.errorAt) / 1000 : 99
    const errK = err < ERROR_DURATION ? 1 - err / ERROR_DURATION : 0

    let cheerUp = 0
    let hop = 0
    if (st.completed) {
      cheerUp = 1
      hop = Math.abs(Math.sin(t * 6)) * 0.14
    } else if (st.cheer >= 0) {
      st.cheer += dt
      const k = st.cheer / 0.8
      if (k >= 1) st.cheer = -1
      else {
        cheerUp = Math.sin(Math.PI * Math.min(1, k * 1.15))
        hop = Math.abs(Math.sin(k * Math.PI * 2)) * 0.12 * (1 - k)
      }
    }

    const dropK = Math.min(1, Math.max(0, (st.intro - 0.75) / 0.5))
    const dropY = dropK <= 0 ? 3 : dropK < 1 ? 3 * (1 - dropK * dropK) : 0
    const landed = st.intro - 1.25
    const landBounce =
      landed > 0 && landed < 0.35 ? Math.sin((landed / 0.35) * Math.PI) * 0.07 : 0

    const swing = Math.sin(st.phase) * 0.75 * moving
    const bob = Math.abs(Math.sin(st.phase)) * 0.025 * moving
    const breathe = Math.sin(t * 2) * 0.004
    const idle = moving < 0.05 && cheerUp === 0 && errK === 0 ? 1 : 0

    root.position.set(p.x, dropY, p.z)
    root.rotation.y = st.heading
    root.visible = st.intro > 0.7

    world.pos.set(p.x, 0.4, p.z)
    world.s = st.s
    body.position.y = bob + breathe + hop + landBounce

    const armBase = (side) =>
      (side < 0 ? -swing * 0.9 : swing * 0.9) + Math.sin(t * 1.6 + side) * 0.05 * idle
    const raise = Math.max(cheerUp, errK * 0.85)
    const flail = Math.sin(t * 30) * 0.12 * errK
    const lerp = (a, b, k) => a + (b - a) * k

    legL.rotation.x = swing
    legR.rotation.x = -swing
    armL.rotation.x = lerp(armBase(-1), -2.8, raise) + flail
    armL.rotation.z = -0.35 * raise
    armR.rotation.x = lerp(armBase(1), -2.8, raise) - flail
    armR.rotation.z = 0.35 * raise

    head.rotation.y = Math.sin(t * 40) * 0.45 * errK + Math.sin(t * 0.8) * 0.45 * idle
    head.rotation.x = errK * 0.12 - cheerUp * 0.18 + Math.sin(t * 1.1) * 0.05 * idle
    head.rotation.z = Math.sin(t * 0.8) * 0.06 * idle
  }

  return { group: root, update }
}

