import * as THREE from 'three'

function makeCanvas(w, h) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return c
}

function makeTexture(c, rx, ry, srgb) {
  const t = new THREE.CanvasTexture(c)
  t.wrapS = THREE.RepeatWrapping
  t.wrapT = THREE.RepeatWrapping
  t.repeat.set(rx, ry)
  t.anisotropy = 8
  if (srgb) t.colorSpace = THREE.SRGBColorSpace
  t.needsUpdate = true
  return t
}

/** Carpete de escritório em placas, com fibra e junções. */
export function carpetTextures(rx, ry) {
  const S = 512
  const col = makeCanvas(S, S)
  const bump = makeCanvas(S, S)
  const cx = col.getContext('2d')
  const bx = bump.getContext('2d')
  const img = cx.createImageData(S, S)
  const bimg = bx.createImageData(S, S)
  for (let i = 0; i < S * S; i += 1) {
    const n = Math.random()
    const fibre = (Math.random() - 0.5) * 26
    const base = 98 + fibre + (n > 0.97 ? 16 : 0)
    img.data.set([base - 6, base - 2, base + 8, 255], i * 4)
    const b = 128 + (Math.random() - 0.5) * 120
    bimg.data.set([b, b, b, 255], i * 4)
  }
  cx.putImageData(img, 0, 0)
  bx.putImageData(bimg, 0, 0)
  cx.strokeStyle = 'rgba(0,0,0,0.35)'
  cx.lineWidth = 3
  cx.strokeRect(0, 0, S, S)
  return { map: makeTexture(col, rx, ry, true), bumpMap: makeTexture(bump, rx, ry, false) }
}

/** Tecido de divisória com trama. */
export function fabricTextures(rx, ry) {
  const S = 256
  const col = makeCanvas(S, S)
  const bump = makeCanvas(S, S)
  const cx = col.getContext('2d')
  const bx = bump.getContext('2d')
  const img = cx.createImageData(S, S)
  for (let i = 0; i < S * S; i += 1) {
    const v = (Math.random() - 0.5) * 22
    img.data.set([120 + v, 138 + v, 152 + v, 255], i * 4)
  }
  cx.putImageData(img, 0, 0)
  bx.fillStyle = '#808080'
  bx.fillRect(0, 0, S, S)
  for (let p = 0; p < S; p += 3) {
    bx.fillStyle = 'rgba(255,255,255,0.35)'
    bx.fillRect(p, 0, 1, S)
    bx.fillStyle = 'rgba(0,0,0,0.35)'
    bx.fillRect(0, p, S, 1)
  }
  return { map: makeTexture(col, rx, ry, true), bumpMap: makeTexture(bump, rx, ry, false) }
}

/** Piso de madeira (sala do cliente e mesa). */
export function woodTextures(rx, ry) {
  const W = 512
  const H = 512
  const col = makeCanvas(W, H)
  const cx = col.getContext('2d')
  const plankH = 64
  for (let p = 0; p < H / plankH; p += 1) {
    const tone = 0.85 + Math.random() * 0.3
    for (let y = 0; y < plankH; y += 1) {
      for (let x = 0; x < W; x += 2) {
        const grain =
          Math.sin((x + p * 91) * 0.045 + Math.sin(y * 0.3 + p) * 1.3) * 0.06 +
          (Math.random() - 0.5) * 0.05
        const k = tone + grain
        cx.fillStyle = `rgb(${(132 * k) | 0},${(92 * k) | 0},${(58 * k) | 0})`
        cx.fillRect(x, p * plankH + y, 2, 1)
      }
    }
    cx.fillStyle = 'rgba(20,10,0,0.55)'
    cx.fillRect(0, p * plankH, W, 2)
  }
  return { map: makeTexture(col, rx, ry, true) }
}

/** Placa "CLIENTE" sobre a porta. */
export function signTexture(text) {
  const c = makeCanvas(512, 128)
  const g = c.getContext('2d')
  g.fillStyle = '#1C1C1C'
  g.fillRect(0, 0, 512, 128)
  g.strokeStyle = '#F2EFE8'
  g.lineWidth = 6
  g.strokeRect(8, 8, 496, 112)
  g.fillStyle = '#F2EFE8'
  g.font = 'bold 66px Helvetica, Arial, sans-serif'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.fillText(text, 256, 68)
  return makeTexture(c, 1, 1, true)
}

/** Brilho radial quente (luz vazando pela porta). */
export function glowTexture() {
  const c = makeCanvas(256, 256)
  const g = c.getContext('2d')
  const grad = g.createRadialGradient(128, 128, 0, 128, 128, 128)
  grad.addColorStop(0, 'rgba(255,214,150,1)')
  grad.addColorStop(0.5, 'rgba(255,190,110,0.35)')
  grad.addColorStop(1, 'rgba(255,180,100,0)')
  g.fillStyle = grad
  g.fillRect(0, 0, 256, 256)
  return makeTexture(c, 1, 1, true)
}

/** Anel para pulso de acerto ou ondas do telefone tocando. */
export function ringTexture(rgb = '255,60,60', lineWidth = 14) {
  const c = makeCanvas(256, 256)
  const g = c.getContext('2d')
  g.strokeStyle = `rgba(${rgb},1)`
  g.lineWidth = lineWidth
  g.beginPath()
  g.arc(128, 128, 112, 0, Math.PI * 2)
  g.stroke()
  return makeTexture(c, 1, 1, true)
}

