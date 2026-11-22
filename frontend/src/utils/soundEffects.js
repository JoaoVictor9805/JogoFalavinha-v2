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
 * Perfis vocais ("blips") individuais para cada conselheiro + CEO.
 * Diferencia frequência base, forma de onda, duração e entonação.
 */
export const VOICE_PROFILES = {
  ceo: {
    baseFreq: 300,
    waveType: 'triangle',
    cadence: [0, 24, 10, 34, -12],
    gain: 0.036,
    duration: 0.032,
    glide: 1.06,
  },
  1: {
    // André / Sapo — grave e firme
    baseFreq: 315,
    waveType: 'triangle',
    cadence: [0, 20, -14, 28, 8],
    gain: 0.036,
    duration: 0.032,
    glide: 1.05,
  },
  2: {
    // Ramon — médio-grave dinâmico
    baseFreq: 375,
    waveType: 'triangle',
    cadence: [0, 34, 16, 44, -10],
    gain: 0.034,
    duration: 0.028,
    glide: 1.09,
  },
  3: {
    // Vanessa — feminina aguda e expressiva
    baseFreq: 585,
    waveType: 'sine',
    cadence: [0, 42, -16, 56, 24],
    gain: 0.032,
    duration: 0.03,
    glide: 1.11,
  },
  4: {
    // Jhonny — médio-agudo animado
    baseFreq: 450,
    waveType: 'triangle',
    cadence: [0, 38, 18, -14, 48],
    gain: 0.033,
    duration: 0.027,
    glide: 1.1,
  },
  5: {
    // Juarez — barítono profundo e cadenciado
    baseFreq: 270,
    waveType: 'triangle',
    cadence: [0, 16, -10, 24, 6],
    gain: 0.038,
    duration: 0.034,
    glide: 1.04,
  },
  6: {
    // Ricardo — timbre nítido/tech médio-alto
    baseFreq: 495,
    waveType: 'sine',
    cadence: [0, 30, -22, 42, 14],
    gain: 0.03,
    duration: 0.025,
    glide: 1.08,
  },
  7: {
    // Ed — médio-grave elegante e suave
    baseFreq: 340,
    waveType: 'sine',
    cadence: [0, 22, 12, -10, 28],
    gain: 0.035,
    duration: 0.032,
    glide: 1.06,
  },
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
 * Bip retro personalizado durante a digitação da fala dos conselheiros (estilo Ace Attorney).
 * Adapta timbre, frequência e inflexão de acordo com o conselheiro (`speakerKey`) e caractere.
 */
export function playDialogueBlipSound(step = 0, speakerKey = 'ceo', char = '') {
  try {
    const ctx = getAudioContext()
    if (!ctx) return
    const now = ctx.currentTime
    const profile = VOICE_PROFILES[speakerKey] || VOICE_PROFILES.ceo

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    const cadenceOffset = profile.cadence[step % profile.cadence.length] || 0
    const punctuationBoost = char === '?' ? 45 : char === '!' ? 30 : 0
    const freq = Math.max(160, profile.baseFreq + cadenceOffset + punctuationBoost)
    const duration = profile.duration || 0.028

    osc.type = profile.waveType || 'triangle'
    osc.frequency.setValueAtTime(freq, now)
    osc.frequency.exponentialRampToValueAtTime(freq * (profile.glide || 1.07), now + duration * 0.85)

    gain.gain.setValueAtTime(profile.gain || 0.032, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration)

    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + duration + 0.004)
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

/**
 * Batida grave e seca (estilo impacto/martelo de tribunal) para a entrada
 * sequencial dos 7 conselheiros na bancada, com ressonância mais marcante no último.
 */
export function playCouncilPopSound(index = 0, total = 7) {
  try {
    const ctx = getAudioContext()
    if (!ctx) return
    const now = ctx.currentTime
    const isFinal = index >= total - 1

    // Corpo grave seco ("thud" abafado de bancada)
    const bodyOsc = ctx.createOscillator()
    const bodyGain = ctx.createGain()
    bodyOsc.type = 'sine'
    const startFreq = isFinal ? 115 : 98 + (index % 2) * 4
    const endFreq = isFinal ? 38 : 46
    const bodyDur = isFinal ? 0.34 : 0.19

    bodyOsc.frequency.setValueAtTime(startFreq, now)
    bodyOsc.frequency.exponentialRampToValueAtTime(endFreq, now + bodyDur)

    bodyGain.gain.setValueAtTime(0.001, now)
    bodyGain.gain.linearRampToValueAtTime(isFinal ? 0.28 : 0.2, now + 0.008)
    bodyGain.gain.exponentialRampToValueAtTime(0.001, now + bodyDur)

    bodyOsc.connect(bodyGain)
    bodyGain.connect(ctx.destination)
    bodyOsc.start(now)
    bodyOsc.stop(now + bodyDur + 0.02)

    // Transiente curto abafado (textura seca de madeira/carimbo)
    const sampleCount = Math.floor(ctx.sampleRate * 0.035)
    const noiseBuffer = ctx.createBuffer(1, sampleCount, ctx.sampleRate)
    const channelData = noiseBuffer.getChannelData(0)
    for (let i = 0; i < sampleCount; i += 1) {
      channelData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (sampleCount * 0.28))
    }

    const noiseSrc = ctx.createBufferSource()
    noiseSrc.buffer = noiseBuffer

    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(isFinal ? 360 : 290, now)

    const noiseGain = ctx.createGain()
    noiseGain.gain.setValueAtTime(isFinal ? 0.16 : 0.11, now)
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.035)

    noiseSrc.connect(filter)
    filter.connect(noiseGain)
    noiseGain.connect(ctx.destination)
    noiseSrc.start(now)

    // Ressonância grave discreta ao fechar o 7º conselheiro na bancada
    if (isFinal) {
      const subOsc = ctx.createOscillator()
      const subGain = ctx.createGain()
      subOsc.type = 'triangle'
      subOsc.frequency.setValueAtTime(65, now + 0.01)
      subOsc.frequency.exponentialRampToValueAtTime(42, now + 0.45)

      subGain.gain.setValueAtTime(0.001, now + 0.01)
      subGain.gain.linearRampToValueAtTime(0.14, now + 0.03)
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.46)

      subOsc.connect(subGain)
      subGain.connect(ctx.destination)
      subOsc.start(now + 0.01)
      subOsc.stop(now + 0.48)
    }
  } catch {
    // Ignora
  }
}

/**
 * Som tátil de carimbo pesado pressionando cera quente sobre o documento:
 * combina impacto grave seco, textura abafada de cera e clique curto de assentamento.
 */
export function playWaxSealStampSound() {
  try {
    const ctx = getAudioContext()
    if (!ctx) return
    const now = ctx.currentTime

    // 1. Corpo grave do impacto na bancada ("thump" pesado e seco)
    const bodyOsc = ctx.createOscillator()
    const bodyGain = ctx.createGain()
    bodyOsc.type = 'sine'
    bodyOsc.frequency.setValueAtTime(148, now)
    bodyOsc.frequency.exponentialRampToValueAtTime(38, now + 0.22)

    bodyGain.gain.setValueAtTime(0.001, now)
    bodyGain.gain.linearRampToValueAtTime(0.34, now + 0.006)
    bodyGain.gain.exponentialRampToValueAtTime(0.001, now + 0.24)

    bodyOsc.connect(bodyGain)
    bodyGain.connect(ctx.destination)
    bodyOsc.start(now)
    bodyOsc.stop(now + 0.26)

    // 2. Sub-ressonância curta de madeira/mesa
    const subOsc = ctx.createOscillator()
    const subGain = ctx.createGain()
    subOsc.type = 'triangle'
    subOsc.frequency.setValueAtTime(82, now)
    subOsc.frequency.exponentialRampToValueAtTime(32, now + 0.16)

    subGain.gain.setValueAtTime(0.001, now)
    subGain.gain.linearRampToValueAtTime(0.18, now + 0.008)
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18)

    subOsc.connect(subGain)
    subGain.connect(ctx.destination)
    subOsc.start(now)
    subOsc.stop(now + 0.2)

    // 3. Textura curta de pressão na cera/papel (ruído filtrado)
    const sampleCount = Math.floor(ctx.sampleRate * 0.048)
    const noiseBuffer = ctx.createBuffer(1, sampleCount, ctx.sampleRate)
    const channelData = noiseBuffer.getChannelData(0)
    for (let i = 0; i < sampleCount; i += 1) {
      channelData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (sampleCount * 0.24))
    }

    const noiseSrc = ctx.createBufferSource()
    noiseSrc.buffer = noiseBuffer

    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.setValueAtTime(620, now)
    filter.Q.setValueAtTime(1.1, now)

    const noiseGain = ctx.createGain()
    noiseGain.gain.setValueAtTime(0.22, now)
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.048)

    noiseSrc.connect(filter)
    filter.connect(noiseGain)
    noiseGain.connect(ctx.destination)
    noiseSrc.start(now)

    // 4. Estalo sutil do sinete ao firmar a cera
    const latchOsc = ctx.createOscillator()
    const latchGain = ctx.createGain()
    latchOsc.type = 'triangle'
    latchOsc.frequency.setValueAtTime(420, now + 0.012)
    latchOsc.frequency.exponentialRampToValueAtTime(175, now + 0.055)

    latchGain.gain.setValueAtTime(0.001, now + 0.012)
    latchGain.gain.linearRampToValueAtTime(0.09, now + 0.016)
    latchGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06)

    latchOsc.connect(latchGain)
    latchGain.connect(ctx.destination)
    latchOsc.start(now + 0.012)
    latchOsc.stop(now + 0.068)
  } catch {
    // Ignora
  }
}

/**
 * Gatilho de áudio para a cena de Transição de Saída:
 * Simula a trava dupla destrancando pelos 7 selos seguida da abertura luminosa da porta.
 */
export function playExitDoorUnlockSound() {
  try {
    const ctx = getAudioContext()
    if (!ctx) return
    const now = ctx.currentTime

    // 1. Destrave metálico da fechadura (dois cliques ascendentes)
    ;[0.12, 0.36].forEach((offset, idx) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'triangle'
      const base = idx === 0 ? 360 : 480
      osc.frequency.setValueAtTime(base, now + offset)
      osc.frequency.exponentialRampToValueAtTime(base * 1.45, now + offset + 0.08)

      gain.gain.setValueAtTime(0.001, now + offset)
      gain.gain.linearRampToValueAtTime(0.14, now + offset + 0.008)
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.11)

      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now + offset)
      osc.stop(now + offset + 0.12)
    })

    // 2. Deslizamento suave da porta dupla abrindo (t = 1.25s)
    const openTime = now + 1.25
    const thudOsc = ctx.createOscillator()
    const thudGain = ctx.createGain()
    thudOsc.type = 'sine'
    thudOsc.frequency.setValueAtTime(68, openTime)
    thudOsc.frequency.exponentialRampToValueAtTime(118, openTime + 0.42)

    thudGain.gain.setValueAtTime(0.001, openTime)
    thudGain.gain.linearRampToValueAtTime(0.22, openTime + 0.04)
    thudGain.gain.exponentialRampToValueAtTime(0.001, openTime + 0.48)

    thudOsc.connect(thudGain)
    thudGain.connect(ctx.destination)
    thudOsc.start(openTime)
    thudOsc.stop(openTime + 0.5)

    // 3. Acorde breve de alívio ao abrir a porta (t = 1.45s)
    ;[523.25, 659.25, 783.99].forEach((freq, idx) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      const startAt = openTime + 0.18 + idx * 0.06
      osc.frequency.setValueAtTime(freq, startAt)

      gain.gain.setValueAtTime(0.001, startAt)
      gain.gain.linearRampToValueAtTime(0.08, startAt + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, startAt + 0.45)

      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(startAt)
      osc.stop(startAt + 0.48)
    })
  } catch {
    // Ignora
  }
}
