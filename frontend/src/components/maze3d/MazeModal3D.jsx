import { Component, useEffect, useRef, useState } from 'react'
import { Check, Compass, Play, Trophy, X } from 'lucide-react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { buildClientRoom } from './buildClientRoom'
import { buildJohnnyModel } from './buildJohnnyModel'
import { buildMazeStructure } from './buildMazeStructure'
import { MAZE_STEPS } from './mazeData'
import { ringTexture } from './textures'
import { createWorldState, errorIntensity } from './world'

const BASE_FOV = 34
const SCENE_BG = '#eae1cf'
const GROUND_BG = '#e3d9c5'

class WebGLBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { failed: false }
  }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-[#F5F0E6] text-xs font-bold uppercase tracking-wider text-stone-600 px-6 text-center">
          Não foi possível iniciar a visualização 3D neste navegador (WebGL indisponível). Percurso:{' '}
          {this.props.step}/{MAZE_STEPS}.
        </div>
      )
    }
    return this.props.children
  }
}

function detectWebGL() {
  if (typeof document === 'undefined') return false
  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'))
  } catch {
    return false
  }
}

function MazeViewport({ initialStep, targetStep, animateIntro }) {
  const containerRef = useRef(null)
  const [webglUnavailable, setWebglUnavailable] = useState(() => !detectWebGL())

  const initialStepRef = useRef(initialStep)
  const targetStepRef = useRef(targetStep)
  const animateIntroRef = useRef(animateIntro)
  const worldRef = useRef(null)

  const stepAudioRef = useRef(null)
  const chimeAudioRef = useRef(null)
  const prevTargetRef = useRef(targetStep)

  useEffect(() => {
    const stepSfx = new Audio('/sounds/footstep.mp3')
    stepSfx.volume = 0.4
    stepAudioRef.current = stepSfx

    const chime = new Audio('/sounds/chime.mp3')
    chime.volume = 0.45
    chimeAudioRef.current = chime

    return () => {
      stepAudioRef.current = null
      chimeAudioRef.current = null
    }
  }, [])

  useEffect(() => {
    targetStepRef.current = targetStep
    if (targetStep > prevTargetRef.current) {
      if (worldRef.current) {
        worldRef.current.successAt = performance.now()
      }
      if (chimeAudioRef.current) {
        chimeAudioRef.current.currentTime = 0
        chimeAudioRef.current.play().catch(() => {})
      }
    }
    prevTargetRef.current = targetStep
  }, [targetStep])

  useEffect(() => {
    const container = containerRef.current
    if (!container || webglUnavailable) return undefined

    let renderer
    let pmrem
    let envRT
    let controls
    let observer
    let rafId = 0

    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
    } catch {
      Promise.resolve().then(() => setWebglUnavailable(true))
      return undefined
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.1
    renderer.domElement.style.display = 'block'
    renderer.domElement.style.width = '100%'
    renderer.domElement.style.height = '100%'
    container.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(SCENE_BG)
    scene.fog = new THREE.Fog(SCENE_BG, 55, 130)

    pmrem = new THREE.PMREMGenerator(renderer)
    const roomEnv = new RoomEnvironment()
    envRT = pmrem.fromScene(roomEnv, 0.04)
    scene.environment = envRT.texture
    roomEnv.dispose()

    const world = createWorldState()
    worldRef.current = world

    const skipIntroAnim = !animateIntroRef.current
    const structure = buildMazeStructure(world, { skipRise: skipIntroAnim })
    const room = buildClientRoom()
    const johnny = buildJohnnyModel(initialStepRef.current, { skipDrop: skipIntroAnim })
    scene.add(structure.group, room.group, johnny.group)

    const studioGround = new THREE.Mesh(
      new THREE.PlaneGeometry(80, 80),
      new THREE.MeshStandardMaterial({ color: GROUND_BG, roughness: 0.96, metalness: 0 })
    )
    studioGround.rotation.x = -Math.PI / 2
    studioGround.position.set(1.5, -0.31, 0)
    studioGround.receiveShadow = true
    scene.add(studioGround)

    const pulseMat = new THREE.MeshBasicMaterial({
      map: ringTexture('34,197,94', 28),
      transparent: true,
      opacity: 0,
      depthWrite: false,
    })
    const pulseMesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), pulseMat)
    pulseMesh.rotation.x = -Math.PI / 2
    pulseMesh.visible = false
    scene.add(pulseMesh)

    const hemi = new THREE.HemisphereLight('#fffbf2', '#7a6c5d', 0.95)
    scene.add(hemi)

    const dirLight = new THREE.DirectionalLight('#fff2df', 2.8)
    dirLight.position.set(-4.5, 9, 5.5)
    dirLight.castShadow = true
    dirLight.shadow.mapSize.set(1024, 1024)
    dirLight.shadow.camera.left = -9
    dirLight.shadow.camera.right = 11
    dirLight.shadow.camera.top = 8
    dirLight.shadow.camera.bottom = -8
    dirLight.shadow.camera.near = 1
    dirLight.shadow.camera.far = 30
    dirLight.shadow.bias = -0.0004
    dirLight.shadow.normalBias = 0.02
    scene.add(dirLight)

    const errorRedLight = new THREE.PointLight('#ff2a2a', 0, 16, 2)
    errorRedLight.position.set(1.5, 3.2, 0.5)
    scene.add(errorRedLight)

    const camera = new THREE.PerspectiveCamera(BASE_FOV, 1, 0.5, 160)
    camera.position.set(-5.8, 8.6, 10.6)

    controls = new OrbitControls(camera, renderer.domElement)
    controls.enablePan = false
    controls.enableZoom = false
    controls.enableDamping = true
    controls.dampingFactor = 0.08
    controls.minPolarAngle = 0.45
    controls.maxPolarAngle = 1.18
    controls.minAzimuthAngle = -1.4
    controls.maxAzimuthAngle = 0.25
    controls.target.copy(structure.center)

    const fitCamera = () => {
      const w = Math.max(1, container.clientWidth)
      const h = Math.max(1, container.clientHeight)
      renderer.setSize(w, h, false)
      camera.aspect = w / h

      const vHalf = THREE.MathUtils.degToRad(BASE_FOV) / 2
      const hHalf = Math.atan(Math.tan(vHalf) * camera.aspect)
      const dist = Math.min(45, Math.max(7.4 / Math.tan(hHalf), 4.6 / Math.tan(vHalf)))
      const dir = camera.position.clone().sub(controls.target).normalize()
      camera.position.copy(controls.target.clone().addScaledVector(dir, dist))
      camera.updateProjectionMatrix()
      controls.update()
    }

    fitCamera()
    observer = new ResizeObserver(fitCamera)
    observer.observe(container)

    const desiredTarget = new THREE.Vector3()
    const deltaTarget = new THREE.Vector3()
    let mountMs = null
    let prevMs = null

    const onFootstep = () => {
      const audio = stepAudioRef.current
      if (!audio) return
      audio.currentTime = 0
      audio.play().catch(() => {})
    }

    const animate = () => {
      rafId = requestAnimationFrame(animate)
      const nowMs = performance.now()
      if (mountMs === null) {
        mountMs = nowMs
        prevMs = nowMs
      }
      const dt = Math.max(0, Math.min((nowMs - prevMs) / 1000, 0.05))
      prevMs = nowMs
      const elapsedSec = Math.max(0, (nowMs - mountMs) / 1000)

      structure.update(elapsedSec, dt)
      room.update(elapsedSec, nowMs, world)
      johnny.update(dt, nowMs, targetStepRef.current, world, {
        onFootstep,
      })

      const pulseAge = (nowMs - world.successAt) / 1000
      if (world.successAt > 0 && pulseAge <= 1.1) {
        pulseMesh.visible = true
        const k = pulseAge / 1.1
        const sc = 0.5 + k * 3.0
        pulseMesh.position.set(world.pos.x, 0.025, world.pos.z)
        pulseMesh.scale.set(sc, sc, sc)
        pulseMat.opacity = (1 - k * k) * 0.95
      } else {
        pulseMesh.visible = false
      }

      const { e, k: errK } = errorIntensity(world, nowMs)
      errorRedLight.intensity = errK > 0 ? (0.5 + 0.5 * Math.sin(e * 22)) * 55 * errK : 0

      let fov = BASE_FOV
      if (animateIntroRef.current) {
        const introK = Math.min(1, elapsedSec / 1.8)
        fov += (1 - (1 - Math.pow(1 - introK, 3))) * 14
      }
      fov += Math.sin(e * 45) * 0.5 * errK
      if (world.successAt > 0 && pulseAge < 0.6) {
        fov -= Math.sin((Math.PI * pulseAge) / 0.6) * 1.1
      }
      if (Math.abs(camera.fov - fov) > 0.005) {
        camera.fov = fov
        camera.updateProjectionMatrix()
      }

      desiredTarget.copy(structure.center).lerp(world.pos, 0.14)
      deltaTarget.copy(controls.target).lerp(desiredTarget, 0.04).sub(controls.target)
      camera.position.add(deltaTarget)
      controls.target.add(deltaTarget)
      controls.update()

      renderer.render(scene, camera)
    }

    rafId = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(rafId)
      observer?.disconnect()
      controls?.dispose()

      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose()
        if (obj.material) {
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
          mats.forEach((m) => {
            if (m.map) m.map.dispose()
            if (m.bumpMap) m.bumpMap.dispose()
            if (m.emissiveMap) m.emissiveMap.dispose()
            m.dispose()
          })
        }
      })

      envRT?.dispose()
      pmrem?.dispose()
      renderer?.dispose()
      if (renderer?.domElement && renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement)
      }
      worldRef.current = null
    }
  }, [webglUnavailable])

  if (webglUnavailable) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#F5F0E6] text-xs font-bold uppercase tracking-wider text-stone-600 px-6 text-center">
        Visualização 3D indisponível neste dispositivo. Progresso: {targetStep}/{MAZE_STEPS}.
      </div>
    )
  }

  return <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
}

/**
 * Modal sobreposto com a maquete 3D do Labirinto do Johnny.
 * Modos:
 *  - 'intro': mostrado após a explicação do CEO; exige confirmação em "OK · Iniciar Desafio"
 *  - 'progress': exibido automaticamente quando o jogador acerta uma questão, animando o avanço
 *  - 'manual': aberto sob demanda pelo botão "Visualizar Mapa", fechado pelo botão "X"
 */
function MazeModal3D({ modalState, onConfirmIntro, onClose }) {
  const { mode, fromStep, toStep, memberName, isFinal } = modalState
  const [displayedStep, setDisplayedStep] = useState(fromStep)

  useEffect(() => {
    if (toStep <= fromStep) return undefined
    const timer = setTimeout(() => {
      setDisplayedStep(toStep)
    }, 340)
    return () => clearTimeout(timer)
  }, [fromStep, toStep])

  useEffect(() => {
    if (mode === 'intro') return undefined
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [mode, onClose])

  const isIntro = mode === 'intro'
  const isProgress = mode === 'progress'

  const tagTitle = isIntro
    ? 'Percurso 3D · Apresentação'
    : isFinal
      ? 'Aprovação Unânime · 7/7'
      : isProgress
        ? `Avanço no Labirinto · ${toStep}/${MAZE_STEPS}`
        : `Mapa do Labirinto · ${toStep}/${MAZE_STEPS}`

  const headline = isIntro
    ? 'Mapa Corporativo até a Sala do Cliente'
    : isFinal
      ? 'Johnny Chegou à Porta do Cliente!'
      : isProgress
        ? `${memberName || 'Conselheiro'} aprovou sua resposta!`
        : 'Visão Geral do Percurso 3D'

  const description = isIntro
    ? 'A cada conselheiro aprovado, o Johnny avança uma etapa por esses corredores até alcançar a sala do cliente.'
    : isFinal
      ? 'Todos os 7 conselheiros foram convencidos e o Johnny cruzou a porta final.'
      : isProgress
        ? `Johnny avançou para a etapa ${toStep} de ${MAZE_STEPS}. Faltam ${MAZE_STEPS - toStep} ${
            MAZE_STEPS - toStep === 1 ? 'conselheiro' : 'conselheiros'
          }.`
        : 'Arraste o mouse sobre a maquete para girar o ângulo de visão.'

  return (
    <div
      className="fixed inset-0 z-[60] bg-stone-950/60 backdrop-blur-[2px] flex items-center justify-center p-4 sm:p-6 animate-overlay-enter"
      role="dialog"
      aria-modal="true"
      aria-label={headline}
      onClick={(e) => {
        if (e.target === e.currentTarget && mode === 'manual') {
          onClose()
        }
      }}
    >
      <div className="max-w-3xl w-full animate-modal-pop">
        {/* Aba superior estilo Ace Attorney + Botão X */}
        <div className="flex items-end justify-between gap-4">
          <div
            className={`inline-flex items-center gap-2 px-4 py-1 text-xs font-black uppercase tracking-[0.18em] border-2 border-b-0 border-stone-900 ml-3 relative z-10 ${
              isFinal ? 'bg-emerald-600 text-white' : 'bg-[#D99B38] text-stone-950'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>{tagTitle}</span>
          </div>

          {!isIntro && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar mapa 3D"
              title="Fechar mapa"
              className="mb-1 inline-flex items-center justify-center w-9 h-9 bg-[#FDFBF7] hover:bg-red-600 text-stone-900 hover:text-white border-2 border-stone-900 shadow-[3px_3px_0px_#1C1917] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4 stroke-[2.75]" />
            </button>
          )}
        </div>

        {/* Corpo principal do Modal */}
        <div className="bg-[#FDFBF7] border-2 border-stone-900 shadow-[8px_8px_0px_#1C1917]">
          {/* Cabeçalho compacto dentro do modal */}
          <div className="px-5 py-3.5 border-b-2 border-stone-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#F5F0E6]">
            <div>
              <h2 className="text-base sm:text-lg font-black uppercase tracking-tight text-stone-900">
                {headline}
              </h2>
              <p className="text-xs text-stone-600 mt-0.5">{description}</p>
            </div>

            <div className="inline-flex items-center gap-1.5 self-start sm:self-auto px-3 py-1 bg-white border-2 border-stone-900 text-xs font-mono font-black text-stone-900 shrink-0">
              <span>{displayedStep}</span>
              <span className="text-stone-400">/</span>
              <span>{MAZE_STEPS}</span>
            </div>
          </div>

          {/* Viewport 3D em destaque */}
          <div className="relative w-full h-[290px] sm:h-[380px] bg-[#EAE1CF] border-b-2 border-stone-900 overflow-hidden">
            <WebGLBoundary step={displayedStep}>
              <MazeViewport
                initialStep={fromStep}
                targetStep={displayedStep}
                animateIntro={isIntro}
              />
            </WebGLBoundary>
          </div>

          {/* Rodapé com ação */}
          <div className="px-5 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#FDFBF7]">
            <span className="text-[11px] font-mono text-stone-500">
              Arraste sobre a maquete 3D para girar a visualização
            </span>

            {isIntro ? (
              <button
                type="button"
                onClick={onConfirmIntro}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3 bg-[#D99B38] hover:bg-[#c58927] text-stone-950 border-2 border-stone-900 font-black text-xs uppercase tracking-[0.18em] shadow-[4px_4px_0px_#1C1917] hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_#1C1917] active:scale-95 transition-all cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>OK · Iniciar Desafio</span>
              </button>
            ) : isFinal ? (
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3 bg-emerald-600 hover:bg-emerald-700 text-white border-2 border-stone-900 font-black text-xs uppercase tracking-[0.18em] shadow-[4px_4px_0px_#1C1917] hover:-translate-y-0.5 active:scale-95 transition-all cursor-pointer"
              >
                <Trophy className="w-4 h-4" />
                <span>OK · Ver Ranking Final</span>
              </button>
            ) : isProgress ? (
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-[#D99B38] hover:bg-[#c58927] text-stone-950 border-2 border-stone-900 font-black text-xs uppercase tracking-[0.18em] shadow-[3px_3px_0px_#1C1917] hover:-translate-y-0.5 active:scale-95 transition-all cursor-pointer"
              >
                <Check className="w-4 h-4 stroke-[2.75]" />
                <span>OK · Continuar</span>
              </button>
            ) : (
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                Clique no X acima para fechar
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default MazeModal3D
