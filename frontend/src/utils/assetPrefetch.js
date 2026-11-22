import {
  PREFETCH_AUDIO_URLS,
  PREFETCH_PRIORITY_IMAGES,
  PREFETCH_SECONDARY_IMAGES,
} from '../data/councilAssets'

const decodedImageCache = new Map()
const prefetchedAudioSet = new Set()
let mazeChunkPromise = null
let texturesWarmPromise = null
let assetsPrefetchStarted = false

function scheduleIdle(fn, timeout = 1200) {
  if (typeof window === 'undefined') return
  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(fn, { timeout })
  } else {
    setTimeout(fn, 45)
  }
}

function preloadImage(src) {
  if (typeof Image === 'undefined' || !src) return Promise.resolve()
  if (decodedImageCache.has(src)) return Promise.resolve()

  return new Promise((resolve) => {
    const img = new Image()
    img.decoding = 'async'

    const finish = () => {
      decodedImageCache.set(src, img)
      if (typeof img.decode === 'function') {
        img.decode().catch(() => {}).finally(resolve)
      } else {
        resolve()
      }
    }

    img.onload = finish
    img.onerror = resolve
    img.src = src

    if (img.complete) {
      finish()
    }
  })
}

function preloadAudio(url) {
  if (typeof fetch !== 'function' || !url || prefetchedAudioSet.has(url)) {
    return Promise.resolve()
  }
  prefetchedAudioSet.add(url)
  return fetch(url, { credentials: 'same-origin' }).catch(() => {})
}

function preloadImageBatches(urls, batchSize = 4) {
  let index = 0

  function runNextBatch() {
    if (index >= urls.length) return
    const slice = urls.slice(index, index + batchSize)
    index += batchSize
    Promise.all(slice.map(preloadImage)).finally(() => {
      if (index < urls.length) {
        scheduleIdle(runNextBatch)
      }
    })
  }

  scheduleIdle(runNextBatch, 600)
}

/**
 * Pré-carrega o chunk JS do MazeModal3D + Three.js em segundo plano (idempotente).
 * Em seguida, aquece os canvas das texturas procedurais sem bloquear a UI.
 */
export function prefetchMazeModalChunk() {
  if (!mazeChunkPromise) {
    mazeChunkPromise = import('../components/maze3d/MazeModal3D').catch((err) => {
      mazeChunkPromise = null
      throw err
    })
  }

  if (!texturesWarmPromise) {
    texturesWarmPromise = mazeChunkPromise
      .then(() => import('../components/maze3d/textures'))
      .then((mod) => {
        scheduleIdle(() => {
          mod.warmProceduralTextures?.()
        }, 1500)
      })
      .catch(() => {
        texturesWarmPromise = null
      })
  }

  return mazeChunkPromise
}

/**
 * Pré-carrega silenciosamente os cutouts dos conselheiros, cards, selos,
 * mesas, marcas do 3D, áudios e o chunk do MazeModal3D em segundo plano.
 */
export function prefetchTribunalAssets() {
  prefetchMazeModalChunk().catch(() => {})

  if (assetsPrefetchStarted || typeof window === 'undefined') return
  assetsPrefetchStarted = true

  preloadImageBatches(PREFETCH_PRIORITY_IMAGES, 5)

  scheduleIdle(() => {
    preloadImageBatches(PREFETCH_SECONDARY_IMAGES, 4)
    PREFETCH_AUDIO_URLS.forEach(preloadAudio)
  }, 1500)
}
