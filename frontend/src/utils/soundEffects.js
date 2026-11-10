let audioCtx = null

function getAudioContext() {
  if (typeof window === 'undefined') return null
  const AudioCtx = window.AudioContext || window.webkitAudioContext
  if (!AudioCtx) return null
  if (!audioCtx) {
    audioCtx = new AudioCtx()
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {})
  }
  return audioCtx
}

/**
 * Gatilho de áudio para a cena de Transição e Chegada:
 * Simula passos cadenciados seguidos pelo impacto grave de uma porta dupla pesada se fechando.
 */
export function playArrivalDoorSound() {
  try {
    const ctx = getAudioContext()
    if (!ctx) return
    const now = ctx.currentTime

    // 3 passos sutis antes da porta fechar
    ;[0.15, 0.65, 1.15].forEach((offset) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(95, now + offset)
      osc.frequency.exponentialRampToValueAtTime(38, now + offset + 0.12)

      gain.gain.setValueAtTime(0.18, now + offset)
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.14)

      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now + offset)
      osc.stop(now + offset + 0.15)
    })

    // Impacto grave da porta pesada do Tribunal fechando (t = 1.75s)
    const doorTime = now + 1.75
    const thudOsc = ctx.createOscillator()
    const thudGain = ctx.createGain()
    thudOsc.type = 'sine'
    thudOsc.frequency.setValueAtTime(110, doorTime)
    thudOsc.frequency.exponentialRampToValueAtTime(24, doorTime + 0.65)

    thudGain.gain.setValueAtTime(0.45, doorTime)
    thudGain.gain.exponentialRampToValueAtTime(0.001, doorTime + 0.7)

    thudOsc.connect(thudGain)
    thudGain.connect(ctx.destination)
    thudOsc.start(doorTime)
    thudOsc.stop(doorTime + 0.72)

    // Clique metálico da trava da porta (t = 2.1s)
    const latchOsc = ctx.createOscillator()
    const latchGain = ctx.createGain()
    latchOsc.type = 'square'
    latchOsc.frequency.setValueAtTime(420, now + 2.1)
    latchOsc.frequency.exponentialRampToValueAtTime(140, now + 2.18)

    latchGain.gain.setValueAtTime(0.12, now + 2.1)
    latchGain.gain.exponentialRampToValueAtTime(0.001, now + 2.2)

    latchOsc.connect(latchGain)
    latchGain.connect(ctx.destination)
    latchOsc.start(now + 2.1)
    latchOsc.stop(now + 2.22)
  } catch {
    // Ignora caso o navegador bloqueie áudio
  }
}

/**
 * Som curto de clique ao interagir com personagens no Hub.
 */
export function playSelectSound() {
  try {
    const ctx = getAudioContext()
    if (!ctx) return
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(520, now)
    osc.frequency.exponentialRampToValueAtTime(680, now + 0.08)

    gain.gain.setValueAtTime(0.12, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09)

    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.1)
  } catch {
    // Ignora
  }
}

/**
 * Som de aprovação de um conselheiro.
 */
export function playApprovalSound() {
  try {
    const ctx = getAudioContext()
    if (!ctx) return
    const now = ctx.currentTime
    const notes = [523.25, 659.25, 783.99, 1046.5] // C5, E5, G5, C6

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(freq, now + idx * 0.09)

      gain.gain.setValueAtTime(0.16, now + idx * 0.09)
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.35)

      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now + idx * 0.09)
      osc.stop(now + idx * 0.09 + 0.36)
    })
  } catch {
    // Ignora
  }
}

/**
 * Som de erro e penalidade (+5s).
 */
export function playPenaltySound() {
  try {
    const ctx = getAudioContext()
    if (!ctx) return
    const now = ctx.currentTime

    ;[190, 145].forEach((freq, idx) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(freq, now + idx * 0.14)

      gain.gain.setValueAtTime(0.15, now + idx * 0.14)
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.14 + 0.18)

      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now + idx * 0.14)
      osc.stop(now + idx * 0.14 + 0.2)
    })
  } catch {
    // Ignora
  }
}

/**
 * Fanfarra de vitória ao conquistar a aprovação dos 7 membros.
 */
export function playVictorySound() {
  try {
    const ctx = getAudioContext()
    if (!ctx) return
    const now = ctx.currentTime
    const sequence = [523.25, 659.25, 783.99, 1046.5, 1318.5]

    sequence.forEach((freq, idx) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(freq, now + idx * 0.11)

      gain.gain.setValueAtTime(0.2, now + idx * 0.11)
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.11 + 0.5)

      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now + idx * 0.11)
      osc.stop(now + idx * 0.11 + 0.52)
    })
  } catch {
    // Ignora
  }
}

