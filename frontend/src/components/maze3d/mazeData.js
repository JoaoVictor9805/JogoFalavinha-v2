export const COLS = 5
export const ROWS = 4
export const CELL = 1.5
export const WIDTH = COLS * CELL
export const DEPTH = ROWS * CELL
export const WALL_H = 0.5
export const WALL_T = 0.07
export const DOOR_W = 0.78
export const DOOR_H = 1.1

/**
 * Caminho oficial de 7 etapas (8 células: passo 0 inicial até o passo 7 diante da porta).
 * Adaptado dos 9 desafios do projeto original para os 7 conselheiros do Conselho Next.
 */
export const PATH = [
  [0, 2],
  [1, 2],
  [1, 1],
  [2, 1],
  [2, 2],
  [2, 3],
  [3, 3],
  [4, 3],
]

export const MAZE_STEPS = PATH.length - 1 // 7 etapas

/** Corredores e becos sem saída para dar leitura visual de labirinto corporativo sem criar atalhos. */
const DECOYS = [
  [
    [1, 1],
    [0, 1],
  ],
  [
    [0, 1],
    [0, 0],
  ],
  [
    [0, 0],
    [1, 0],
  ],
  [
    [1, 0],
    [2, 0],
  ],
  [
    [2, 0],
    [3, 0],
  ],
  [
    [3, 0],
    [4, 0],
  ],
  [
    [4, 0],
    [4, 1],
  ],
  [
    [4, 1],
    [4, 2],
  ],
  [
    [0, 2],
    [0, 3],
  ],
  [
    [0, 3],
    [1, 3],
  ],
  [
    [2, 1],
    [3, 1],
  ],
  [
    [3, 1],
    [3, 2],
  ],
]

const edgeKey = (a, b) => {
  const [p, q] = [a, b].sort((u, v) => u[0] - v[0] || u[1] - v[1])
  return `${p[0]},${p[1]}-${q[0]},${q[1]}`
}

const passages = new Set()
for (let i = 0; i < PATH.length - 1; i += 1) {
  passages.add(edgeKey(PATH[i], PATH[i + 1]))
}
DECOYS.forEach(([a, b]) => {
  passages.add(edgeKey(a, b))
})

export const hasPassage = (a, b) => passages.has(edgeKey(a, b))

export function cellCenter(cx, cy) {
  return [(cx + 0.5) * CELL - WIDTH / 2, (cy + 0.5) * CELL - DEPTH / 2]
}

const DOOR_ROW = PATH[PATH.length - 1][1]

export const DOOR_X = WIDTH / 2
export const DOOR_Z = (DOOR_ROW + 0.5) * CELL - DEPTH / 2

export const CLIENT_ROOM = {
  x0: DOOR_X,
  x1: DOOR_X + 2.85,
  z0: DOOR_Z - 1.05,
  z1: DOOR_Z + 1.05,
}

export function buildWalls() {
  const walls = []
  const vertexUsed = new Set()
  const mark = (i, j) => vertexUsed.add(`${i},${j}`)

  // Paredes ao longo de Z (entre colunas i-1 e i)
  for (let i = 0; i <= COLS; i += 1) {
    for (let j = 0; j < ROWS; j += 1) {
      const outer = i === 0 || i === COLS
      const isDoor = i === COLS && j === DOOR_ROW
      const solid = outer ? !isDoor : !hasPassage([i - 1, j], [i, j])
      if (!solid) continue
      walls.push({ x: i * CELL - WIDTH / 2, z: (j + 0.5) * CELL - DEPTH / 2, alongX: false })
      mark(i, j)
      mark(i, j + 1)
    }
  }

  // Paredes ao longo de X (entre linhas j-1 e j)
  for (let j = 0; j <= ROWS; j += 1) {
    for (let i = 0; i < COLS; i += 1) {
      const outer = j === 0 || j === ROWS
      const solid = outer || !hasPassage([i, j - 1], [i, j])
      if (!solid) continue
      walls.push({ x: (i + 0.5) * CELL - WIDTH / 2, z: j * CELL - DEPTH / 2, alongX: true })
      mark(i, j)
      mark(i + 1, j)
    }
  }

  const posts = [...vertexUsed].map((k) => {
    const [i, j] = k.split(',').map(Number)
    return { x: i * CELL - WIDTH / 2, z: j * CELL - DEPTH / 2 }
  })

  return { walls, posts }
}

/** Polilinha percorrida pelo Johnny: 8 células do caminho + travessia pela porta até a sala do cliente. */
export function buildRoute() {
  const pts = PATH.map(([cx, cy]) => cellCenter(cx, cy))
  pts.push([DOOR_X, DOOR_Z])
  pts.push([DOOR_X + 1.5, DOOR_Z])
  const cum = [0]
  for (let i = 1; i < pts.length; i += 1) {
    cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]))
  }
  return { pts, cum }
}

export function routeDistanceForStep(step, cum) {
  const lastCellIdx = PATH.length - 1
  if (step >= lastCellIdx) return cum[cum.length - 1]
  return cum[Math.max(0, step)]
}

export function pointAt(s, pts, cum) {
  const total = cum[cum.length - 1]
  const d = Math.min(Math.max(s, 0), total)
  let i = 1
  while (i < cum.length - 1 && cum[i] < d) i += 1
  const seg = cum[i] - cum[i - 1] || 1
  const t = (d - cum[i - 1]) / seg
  const [x0, z0] = pts[i - 1]
  const [x1, z1] = pts[i]
  return { x: x0 + (x1 - x0) * t, z: z0 + (z1 - z0) * t, dx: x1 - x0, dz: z1 - z0 }
}

