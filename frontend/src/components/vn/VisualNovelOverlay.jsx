import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronsRight,
  Play,
  XCircle,
} from 'lucide-react'
import {
  MEMBER_CUTOUTS,
  TRIBUNAL_MESA_SOLO_IMG as tribunalMesaSoloImg,
} from '../../data/councilAssets'
import { useGame } from '../../context/gameContextInstance'
import { CEO_TRIBUNAL_BRIEFING, COUNCIL_MEMBERS } from '../../data/conselhoNextData'
import { getWaxSealByMemberId } from '../../data/waxSealsData'
import { useTypewriter } from '../../hooks/useTypewriter'
import { playDialogueBlipSound, playWaxSealStampSound } from '../../utils/soundEffects'

const POSE_SWITCH_TYPING_MS = 1100
const POSE_SWITCH_IDLE_MS = 2800
const WRONG_POSE_DURATION_MS = 2000
const WAX_SEAL_IMPACT_SOUND_DELAY_MS = 165

/**
 * Paletas visuais estilo Ace Attorney para cada Conselheiro + CEO.
 * Garante identidade própria (plaquinha da bancada e etiqueta de fala)
 * mesmo quando os desafios vêm do backend.
 */
const MEMBER_VN_THEMES = {
  ceo: {
    code: 'CEO',
    role: CEO_TRIBUNAL_BRIEFING.title,
    tagBg: 'bg-[#D99B38] text-stone-950 border-stone-900',
    plateAccent: 'border-t-[#D99B38]',
    plateText: 'text-[#D99B38]',
  },
  1: {
    code: 'C01',
    role: 'Cadeira 01 · Estrutura & Unidades',
    tagBg: 'bg-sky-400 text-stone-950 border-stone-900',
    plateAccent: 'border-t-sky-400',
    plateText: 'text-sky-300',
  },
  2: {
    code: 'C02',
    role: 'Cadeira 02 · Cultura & Valores',
    tagBg: 'bg-teal-400 text-stone-950 border-stone-900',
    plateAccent: 'border-t-teal-400',
    plateText: 'text-teal-300',
  },
  3: {
    code: 'C03',
    role: 'Cadeira 03 · Propósito Next',
    tagBg: 'bg-amber-400 text-stone-950 border-stone-900',
    plateAccent: 'border-t-amber-400',
    plateText: 'text-amber-300',
  },
  4: {
    code: 'C04',
    role: 'Cadeira 04 · Endomarketing & Eventos',
    tagBg: 'bg-purple-400 text-stone-950 border-stone-900',
    plateAccent: 'border-t-purple-400',
    plateText: 'text-purple-300',
  },
  5: {
    code: 'C05',
    role: 'Cadeira 05 · Rotina & Ponto',
    tagBg: 'bg-rose-400 text-stone-950 border-stone-900',
    plateAccent: 'border-t-rose-400',
    plateText: 'text-rose-300',
  },
  6: {
    code: 'C06',
    role: 'Cadeira 06 · Tecnologia & ERP',
    tagBg: 'bg-cyan-400 text-stone-950 border-stone-900',
    plateAccent: 'border-t-cyan-400',
    plateText: 'text-cyan-300',
  },
  7: {
    code: 'C07',
    role: 'Cadeira 07 · Imagem & Dress Code',
    tagBg: 'bg-emerald-400 text-stone-950 border-stone-900',
    plateAccent: 'border-t-emerald-400',
    plateText: 'text-emerald-300',
  },
}

function VisualNovelOverlay({ isCeoIntro = false }) {
  const {
    activeMember,
    memberProgress,
    vnFeedback,
    vnApprovalMessage,
    approvalReadingState,
    vnSpeechText,
    vnSpeechKey,
    vnErrorStep,
    isLocked,
    penaltyAlertSeconds,
    actionError,
    clearActionError,
    closeMemberDialog,
    submitMultipleChoice,
    notifyApprovalSpeechFinished,
    notifyApprovalSpeechSkipped,
    openIntroMazeModal,
  } = useGame()

  const [poseIndex, setPoseIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [posePulseKey, setPosePulseKey] = useState(0)
  const [prevFeedback, setPrevFeedback] = useState(vnFeedback)
  const [isShowingWrongPose, setIsShowingWrongPose] = useState(false)
  const [selectedOptionId, setSelectedOptionId] = useState(null)
  const [hoveredOptionId, setHoveredOptionId] = useState(null)
  const [spotlightDismissed, setSpotlightDismissed] = useState(false)
  const [approvalBarUi, setApprovalBarUi] = useState({ progress: 1, remainingSec: 2.5 })

  const posesOnCurrentSideRef = useRef(0)
  const overlayRef = useRef(null)
  const speechBoxRef = useRef(null)
  const stageRef = useRef(null)
  const questionRef = useRef(null)
  const spotlightRectsRef = useRef(null)
  const flipTimeoutRef = useRef(null)
  const approvalBarPhaseRef = useRef({
    key: 0,
    targetEndAt: 0,
    startAt: 0,
    startProgress: 1,
    currentProgress: 1,
  })

  if (vnFeedback !== prevFeedback) {
    setPrevFeedback(vnFeedback)
    if (vnFeedback === 'wrong' || vnFeedback === 'blocked') {
      setIsShowingWrongPose(true)
    } else if (vnFeedback === 'approved') {
      setIsShowingWrongPose(false)
    }
  }

  useEffect(() => {
    if (!isShowingWrongPose || vnFeedback === 'blocked') return undefined

    const timer = setTimeout(() => {
      setIsShowingWrongPose(false)
      setPoseIndex(0)
      setPosePulseKey((prev) => prev + 1)
    }, WRONG_POSE_DURATION_MS)

    return () => clearTimeout(timer)
  }, [isShowingWrongPose, vnFeedback])

  const memberId = activeMember?.id
  const scopeKey = isCeoIntro ? 'ceo' : memberId || 0
  const [prevScopeKey, setPrevScopeKey] = useState(scopeKey)

  if (scopeKey !== prevScopeKey) {
    setPrevScopeKey(scopeKey)
    setSelectedOptionId(null)
    setHoveredOptionId(null)
    setPoseIndex(0)
    setIsFlipped(false)
    setSpotlightDismissed(false)
    setIsShowingWrongPose(false)
  }

  useEffect(() => {
    posesOnCurrentSideRef.current = 0
  }, [scopeKey])

  const progress = (memberId && memberProgress[memberId]) || {
    completed: false,
    errors: 0,
    disabledOptions: [],
  }

  const localMemberMeta = memberId
    ? COUNCIL_MEMBERS.find((m) => m.id === memberId)
    : null

  const isApprovedState = !isCeoIntro && vnFeedback === 'approved'
  const isBlockedState = !isCeoIntro && vnFeedback === 'blocked'
  const isWrongShake = !isCeoIntro && (vnFeedback === 'wrong' || isBlockedState)
  const showWrongVisual = !isApprovedState && (isBlockedState || isShowingWrongPose)
  const activeWaxSeal = !isCeoIntro && memberId ? getWaxSealByMemberId(memberId) : null
  const approvalSealKey = approvalReadingState?.key || memberId || 'approved'

  const speechMode = isCeoIntro
    ? 'ceo'
    : isApprovedState
      ? 'approved'
      : isBlockedState
        ? 'blocked'
        : vnErrorStep > 0 || progress.errors > 0
          ? 'error'
          : 'greeting'

  const isErrorSpeechMode = speechMode === 'error' || speechMode === 'blocked'

  const memberConfig = memberId ? MEMBER_CUTOUTS[memberId] : null
  const counselorPoses = isCeoIntro
    ? MEMBER_CUTOUTS[4].default
    : isApprovedState && memberConfig?.success
      ? [memberConfig.success]
      : showWrongVisual && memberConfig?.wrong
        ? [memberConfig.wrong]
        : memberConfig?.default || MEMBER_CUTOUTS[4].default
  const activePoseCount = counselorPoses.length

  const currentSpeech = isCeoIntro
    ? CEO_TRIBUNAL_BRIEFING.message
    : !activeMember
      ? ''
      : isApprovedState
        ? vnApprovalMessage || 'Você tem o meu voto de aprovação no Conselho Next!'
        : vnSpeechText || activeMember.greeting || localMemberMeta?.greeting || ''

  const speakerKey = isCeoIntro ? 'ceo' : memberId || 'ceo'

  const handleTypeChar = useCallback(
    (idx, ch) => {
      if (idx % 3 === 1 || /[?!]/.test(ch)) {
        playDialogueBlipSound(idx, speakerKey, ch)
      }
    },
    [speakerKey]
  )

  const { displayedText, isTyping, isSpeaking, skip } = useTypewriter(currentSpeech, {
    speed: 22,
    triggerKey: isCeoIntro ? 'ceo-intro' : `${memberId || 0}-${speechMode}-${vnSpeechKey}`,
    onCharacter: handleTypeChar,
  })

  // Notifica o contexto assim que o conselheiro termina de falar a aprovação naturalmente
  useEffect(() => {
    if (isApprovedState && !isTyping) {
      notifyApprovalSpeechFinished()
    }
  }, [isApprovedState, isTyping, notifyApprovalSpeechFinished])

  // Dispara o áudio tátil do carimbo de cera no instante exato do impacto + screen shake
  useEffect(() => {
    if (!isApprovedState || !activeWaxSeal) return undefined
    const timer = setTimeout(() => {
      playWaxSealStampSound()
    }, WAX_SEAL_IMPACT_SOUND_DELAY_MS)
    return () => clearTimeout(timer)
  }, [isApprovedState, activeWaxSeal, approvalSealKey])

  // Anima a barrinha dinâmica de leitura da aprovação sem saltos (mesmo ao pular com clique)
  useEffect(() => {
    if (!isApprovedState || !approvalReadingState) return undefined

    const phase = approvalBarPhaseRef.current
    const nowInit = Date.now()
    if (phase.key !== approvalReadingState.key) {
      phase.key = approvalReadingState.key
      phase.startAt = approvalReadingState.startedAt
      phase.targetEndAt = approvalReadingState.targetEndAt
      phase.startProgress = 1
      phase.currentProgress = 1
    } else if (phase.targetEndAt !== approvalReadingState.targetEndAt) {
      phase.startAt = nowInit
      phase.targetEndAt = approvalReadingState.targetEndAt
      phase.startProgress = phase.currentProgress
    }

    let rafId = 0
    const tick = () => {
      const now = Date.now()
      const duration = Math.max(1, phase.targetEndAt - phase.startAt)
      const elapsed = Math.max(0, now - phase.startAt)
      const ratio = Math.max(0, Math.min(1, 1 - elapsed / duration))
      const progress = phase.startProgress * ratio
      phase.currentProgress = progress

      const remainingSec = Math.max(0, (phase.targetEndAt - now) / 1000)
      setApprovalBarUi({ progress, remainingSec })

      if (now < phase.targetEndAt) {
        rafId = requestAnimationFrame(tick)
      }
    }

    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [isApprovedState, approvalReadingState])

  // Troca de pose moderada durante a fala (1100ms) e mais espaçada em idle (2800ms),
  // com micro-impulso e chance de flipar horizontalmente apenas após um bloco de trocas do mesmo lado.
  const poseIntervalMs = isTyping ? POSE_SWITCH_TYPING_MS : POSE_SWITCH_IDLE_MS

  useEffect(() => {
    if (activePoseCount <= 1) return undefined

    const timer = setInterval(() => {
      setPoseIndex((prev) => {
        const step = activePoseCount > 2 && Math.random() < 0.32 ? 2 : 1
        return (prev + step) % activePoseCount
      })
      setPosePulseKey((prev) => prev + 1)

      posesOnCurrentSideRef.current += 1
      const minPosesBeforeFlip = isTyping ? 3 : 2
      const flipChance = isTyping ? 0.38 : 0.45

      if (posesOnCurrentSideRef.current >= minPosesBeforeFlip && Math.random() < flipChance) {
        setIsFlipped((prev) => !prev)
        posesOnCurrentSideRef.current = 0
      }
    }, poseIntervalMs)

    return () => clearInterval(timer)
  }, [activePoseCount, poseIntervalMs, isTyping])

  // "Câmera Viva": Foco centralizado apenas na fala inicial de abertura (greeting sem erros ou intro do CEO)
  const isOpeningSpeech =
    (isCeoIntro || (speechMode === 'greeting' && progress.errors === 0)) &&
    !isApprovedState &&
    !isBlockedState
  const isIntroSpotlight = isOpeningSpeech && isTyping && !spotlightDismissed

  const prevSpotlightRef = useRef(isIntroSpotlight)

  const captureSpotlightRects = useCallback(() => {
    if (typeof window === 'undefined' || window.innerWidth >= 1024) return
    if (!stageRef.current || !questionRef.current) return
    spotlightRectsRef.current = {
      stageTop: stageRef.current.getBoundingClientRect().top,
      questionTop: questionRef.current.getBoundingClientRect().top,
    }
  }, [])

  // Mantém as coordenadas atualizadas enquanto o spotlight está ativo no celular
  useEffect(() => {
    if (!isIntroSpotlight) return undefined
    captureSpotlightRects()

    const observer =
      typeof ResizeObserver !== 'undefined' && speechBoxRef.current
        ? new ResizeObserver(() => captureSpotlightRects())
        : null
    if (observer && speechBoxRef.current) {
      observer.observe(speechBoxRef.current)
    }
    window.addEventListener('resize', captureSpotlightRects)

    return () => {
      observer?.disconnect()
      window.removeEventListener('resize', captureSpotlightRects)
    }
  }, [isIntroSpotlight, captureSpotlightRects])

  // Transição FLIP suave no celular quando o spotlight termina: personagem desliza para baixo e pergunta desliza para cima
  useLayoutEffect(() => {
    const wasSpotlight = prevSpotlightRef.current
    prevSpotlightRef.current = isIntroSpotlight

    if (!wasSpotlight || isIntroSpotlight) return undefined
    if (typeof window === 'undefined' || window.innerWidth >= 1024) return undefined

    const prev = spotlightRectsRef.current
    const stageEl = stageRef.current
    const questionEl = questionRef.current
    if (!prev || !stageEl || !questionEl) return undefined

    const nextStageTop = stageEl.getBoundingClientRect().top
    const nextQuestionTop = questionEl.getBoundingClientRect().top
    const dyStage = prev.stageTop - nextStageTop
    const dyQuestion = prev.questionTop - nextQuestionTop

    if (flipTimeoutRef.current) clearTimeout(flipTimeoutRef.current)

    stageEl.style.transition = 'none'
    stageEl.style.transform = `translate3d(0, ${dyStage}px, 0) scale(1.05)`

    questionEl.style.transition = 'none'
    questionEl.style.transform = `translate3d(0, ${dyQuestion}px, 0) scale(0.97)`
    questionEl.style.opacity = '0.2'

    void stageEl.offsetHeight

    const rafId = requestAnimationFrame(() => {
      stageEl.style.transition = 'transform 560ms cubic-bezier(0.22, 1, 0.36, 1)'
      stageEl.style.transform = 'translate3d(0, 0, 0) scale(1)'

      questionEl.style.transition =
        'transform 560ms cubic-bezier(0.22, 1, 0.36, 1), opacity 480ms ease-out, max-height 520ms cubic-bezier(0.22, 1, 0.36, 1)'
      questionEl.style.transform = 'translate3d(0, 0, 0) scale(1)'
      questionEl.style.opacity = '1'

      if (overlayRef.current && overlayRef.current.scrollTop > 8) {
        overlayRef.current.scrollTo({ top: 0, behavior: 'smooth' })
      }
    })

    flipTimeoutRef.current = setTimeout(() => {
      stageEl.style.transition = ''
      stageEl.style.transform = ''
      questionEl.style.transition = ''
      questionEl.style.transform = ''
      questionEl.style.opacity = ''
    }, 600)

    return () => {
      cancelAnimationFrame(rafId)
    }
  }, [isIntroSpotlight])

  useEffect(() => {
    return () => {
      if (flipTimeoutRef.current) clearTimeout(flipTimeoutRef.current)
    }
  }, [])

  const handleSkipOrDismissSpotlight = useCallback(() => {
    captureSpotlightRects()
    if (isTyping) {
      skip()
      if (isApprovedState) {
        notifyApprovalSpeechSkipped()
      }
    }
    setSpotlightDismissed(true)
  }, [captureSpotlightRects, isApprovedState, isTyping, notifyApprovalSpeechSkipped, skip])

  // Atalho global de teclado (Espaço / Enter) para pular a fala inicial sem perder tempo no cronômetro
  useEffect(() => {
    if (!isTyping && !isIntroSpotlight) return undefined

    const handleGlobalKeyDown = (e) => {
      const tag = document.activeElement?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        handleSkipOrDismissSpotlight()
      }
    }

    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => window.removeEventListener('keydown', handleGlobalKeyDown)
  }, [isTyping, isIntroSpotlight, handleSkipOrDismissSpotlight])

  if (!isCeoIntro && !activeMember) return null

  const speakerName = isCeoIntro
    ? CEO_TRIBUNAL_BRIEFING.name
    : activeMember.name || localMemberMeta?.name || 'Conselheiro'

  const theme = MEMBER_VN_THEMES[speakerKey] || MEMBER_VN_THEMES.ceo
  const speakerRole = isCeoIntro
    ? CEO_TRIBUNAL_BRIEFING.title
    : activeMember.role || localMemberMeta?.role || theme.role

  const speakerTagClass = isApprovedState
    ? 'bg-emerald-600 text-white border-stone-900'
    : isErrorSpeechMode
      ? 'bg-red-600 text-white border-stone-900'
      : theme.tagBg

  const isOptionHovered =
    Boolean(hoveredOptionId) && !isApprovedState && !showWrongVisual

  const portraitReactionClass = isWrongShake
    ? 'animate-vn-shake drop-shadow-[0_0_26px_rgba(220,38,38,0.48)]'
    : isApprovedState
      ? 'animate-vn-approve drop-shadow-[0_0_28px_rgba(16,185,129,0.4)]'
      : isSpeaking
        ? 'animate-vn-talk drop-shadow-[0_14px_24px_rgba(28,25,23,0.2)]'
        : 'animate-vn-idle drop-shadow-[0_14px_24px_rgba(28,25,23,0.16)]'

  // No estado de erro ou aprovação, garante orientação original sem espelhamento
  const effectiveFlipped =
    showWrongVisual || isApprovedState ? false : isFlipped

  // Tensão progressiva na tela (1º erro = só reação do personagem; 2º erro = vermelho leve; 3º+ = vermelho marcado)
  const screenTensionLevel =
    isCeoIntro || isApprovedState
      ? 0
      : isBlockedState || progress.errors >= 3
        ? 3
        : progress.errors === 2
          ? 2
          : 0

  // Transformação da "Câmera Viva" no conjunto Personagem + Bancada
  const stageCameraTransformClass = isIntroSpotlight
    ? 'scale-[1.05] lg:translate-x-[34%] lg:scale-[1.09] z-30'
    : isApprovedState
      ? 'lg:translate-x-2 lg:scale-[1.02] z-20'
      : showWrongVisual
        ? 'lg:scale-[1.02] z-20'
        : isOptionHovered
          ? 'lg:translate-x-2 lg:rotate-[0.55deg] lg:scale-[1.02] z-20'
          : 'translate-x-0 scale-100 z-20'

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-40 bg-[#F5F0E6] text-stone-900 flex flex-col overflow-y-auto overflow-x-hidden animate-overlay-enter"
      role="dialog"
      aria-modal="true"
      aria-label={speakerName}
    >
      {/* Camada de Tensão Progressiva na Tela (apenas a partir do 2º erro, preservando cliques) */}
      {screenTensionLevel > 0 && (
        <div
          aria-hidden="true"
          className={`pointer-events-none fixed inset-0 z-30 transition-opacity duration-500 ${
            screenTensionLevel >= 3 ? 'vn-screen-tension-3' : 'vn-screen-tension-2'
          }`}
        />
      )}

      {/* Backdrop do Modo Foco ("Câmera Viva") durante a fala inicial de cada conselheiro */}
      <div
        aria-hidden={!isIntroSpotlight}
        onClick={isIntroSpotlight ? handleSkipOrDismissSpotlight : undefined}
        className={`fixed inset-0 z-20 bg-stone-950/70 backdrop-blur-[2px] transition-opacity duration-500 ${
          isIntroSpotlight
            ? 'opacity-100 cursor-pointer pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Wrapper único centralizado verticalmente: mantém a disposição compacta da tela menor também em monitores grandes */}
      <div
        className={`w-full my-auto ${
          isCeoIntro ? 'pt-6 sm:pt-10 pb-8' : 'pt-16 sm:pt-[72px] pb-8 sm:pb-10'
        } ${isApprovedState && activeWaxSeal ? 'animate-wax-screen-shake' : ''}`}
      >
        {/* Topo: Caixa de Falas estilo Pokémon / Ace Attorney */}
        <div
          ref={speechBoxRef}
          className={`w-full max-w-6xl mx-auto px-4 sm:px-8 shrink-0 animate-panel-rise relative transition-transform duration-500 ease-out ${
            isIntroSpotlight ? 'z-30 lg:scale-[1.02] lg:translate-y-1' : 'z-20 scale-100 translate-y-0'
          }`}
        >
        <div className="flex items-end justify-between gap-4">
          <div
            className={`inline-flex items-center gap-2 px-4 py-1 text-xs font-black uppercase tracking-widest border-2 border-b-0 relative z-10 ml-3 transition-colors duration-200 ${speakerTagClass}`}
          >
            <span>{speakerName}</span>
            {!isCeoIntro && progress.errors > 0 && !isApprovedState && (
              <>
                <span className="opacity-70">·</span>
                <span>+{progress.errors >= 3 ? 20 : progress.errors * 5}s</span>
                {progress.errors >= 2 && (
                  <span className="inline-flex items-center gap-1 ml-1 px-1.5 py-0.2 bg-stone-950/85 text-red-200 text-[10px]">
                    <AlertTriangle className="w-3 h-3 text-red-400" />
                    <span>{progress.errors >= 3 ? 'TENSÃO MÁXIMA' : 'SOB PRESSÃO'}</span>
                  </span>
                )}
              </>
            )}
          </div>

          {!isCeoIntro && (
            <button
              type="button"
              disabled={isLocked || isApprovedState || isBlockedState}
              onClick={closeMemberDialog}
              className="mb-1.5 inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#FDFBF7] hover:bg-[#D99B38] text-stone-800 hover:text-stone-950 border-2 border-stone-800 rounded-none text-[11px] font-black uppercase tracking-widest shadow-[2px_2px_0px_#1C1917] hover:-translate-y-0.5 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar ao Tribunal</span>
            </button>
          )}
        </div>

        {/* Caixa de texto que vai preenchendo conforme fala */}
        <div
          role="button"
          tabIndex={0}
          onClick={handleSkipOrDismissSpotlight}
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === ' ') && (isTyping || isIntroSpotlight)) {
              e.preventDefault()
              handleSkipOrDismissSpotlight()
            }
          }}
          aria-label="Fala do personagem. Clique para completar o texto."
          className={`relative bg-[#FDFBF7] border-2 px-5 sm:px-6 py-3.5 sm:py-4 transition-all duration-300 ${
            isIntroSpotlight
              ? 'shadow-[0_18px_48px_rgba(0,0,0,0.6)] border-[#D99B38]'
              : isApprovedState
                ? 'border-emerald-600 shadow-[6px_6px_0px_#1C1917]'
                : isErrorSpeechMode
                  ? 'border-red-600 shadow-[6px_6px_0px_#1C1917]'
                  : 'border-stone-900 shadow-[6px_6px_0px_#1C1917]'
          } ${isTyping || isIntroSpotlight ? 'cursor-pointer' : 'cursor-default'}`}
        >
          <p className="text-base sm:text-lg font-semibold text-stone-900 leading-relaxed min-h-[2.75rem] pr-8">
            “{displayedText}”
            {isTyping && (
              <span className="inline-block w-2 h-4 ml-1 align-middle bg-[#D99B38] animate-vn-caret" />
            )}
          </p>

          <div className="mt-1.5 flex items-center justify-between gap-4 text-[11px] font-mono">
            <span className="text-stone-500">
              {isApprovedState
                ? isTyping
                  ? 'Cronômetro pausado · Clique (ou Espaço) para pular a fala'
                  : 'Cronômetro pausado · Voltando ao Tribunal...'
                : isBlockedState
                  ? 'Conselheiro bloqueado por 20s...'
                  : isIntroSpotlight
                    ? 'Modo Foco: clique em qualquer lugar (ou Espaço) para ir direto à pergunta'
                    : isTyping
                      ? 'Clique na caixa para exibir tudo'
                      : isCeoIntro
                        ? 'Clique em "Ver Labirinto & Começar" abaixo para iniciar'
                        : 'Selecione sua resposta ao lado'}
            </span>

            <span
              className={`inline-flex items-center gap-1 font-bold ${
                isApprovedState
                  ? 'text-emerald-700'
                  : isErrorSpeechMode
                    ? 'text-red-600'
                    : 'text-[#B87D1E]'
              }`}
            >
              {isApprovedState ? (
                <span>{`${approvalBarUi.remainingSec.toFixed(1).replace('.', ',')}s`}</span>
              ) : isBlockedState ? (
                <span>3,5s</span>
              ) : (
                <ChevronsRight
                  className={`w-4 h-4 ${!isTyping ? 'animate-vn-caret' : 'opacity-60'}`}
                />
              )}
            </span>
          </div>

          {isApprovedState && (
            <div className="absolute inset-x-0 bottom-0 h-1.5 bg-[#EBE4D5] overflow-hidden border-t border-emerald-600">
              <div
                className="h-full bg-emerald-600 origin-left"
                style={{ transform: `scaleX(${approvalBarUi.progress})` }}
              />
            </div>
          )}

          {isBlockedState && (
            <div className="absolute inset-x-0 bottom-0 h-1.5 bg-[#EBE4D5] overflow-hidden border-t border-red-600">
              <div className="h-full bg-red-600 animate-reading-bar" />
            </div>
          )}
        </div>
      </div>

      {/* Palco Principal: Conselheiro + Bancada à esquerda | Pergunta e Alternativas à direita */}
      <main className="relative mt-5 sm:mt-6">
        <div className="max-w-6xl w-full mx-auto px-4 sm:px-8 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 lg:items-end">
          {/* Esquerda (desktop) / Acima no foco inicial do celular e abaixo após a fala */}
          <div
            ref={stageRef}
            onClick={isIntroSpotlight ? handleSkipOrDismissSpotlight : undefined}
            className={`lg:col-span-5 lg:self-end relative transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] origin-bottom ${
              isIntroSpotlight ? 'order-1 lg:order-1 cursor-pointer' : 'order-2 lg:order-1'
            } ${stageCameraTransformClass}`}
          >
            <div className="flex flex-col items-center justify-end pt-1 pb-0 animate-portrait-enter">
            {/* Recorte do Personagem (z-10, posicionado atrás da bancada) */}
            <div
              className={`relative z-10 inline-flex justify-center items-end origin-bottom select-none pointer-events-none ${portraitReactionClass}`}
            >
              {/* Wrapper de micro-impulso disparado a cada troca de pose */}
              <div
                key={posePulseKey}
                className="animate-vn-pose-pop origin-bottom inline-flex justify-center items-end"
              >
                {/* Wrapper de Flip Horizontal (intervalo maior) */}
                <div
                  className={`origin-center transition-transform duration-150 ${
                    effectiveFlipped ? '-scale-x-100' : 'scale-x-100'
                  }`}
                >
                  {counselorPoses.map((poseSrc, idx) => {
                    const isActive = idx === poseIndex % counselorPoses.length
                    return (
                      <img
                        key={poseSrc}
                        src={poseSrc}
                        alt={idx === 0 ? speakerName : ''}
                        aria-hidden={idx > 0}
                        draggable={false}
                        className={`h-[235px] sm:h-[295px] lg:h-[318px] w-auto object-contain object-bottom saturate-[1.06] contrast-[1.03] ${
                          idx === 0 ? 'relative' : 'absolute inset-0 w-full h-full'
                        } ${isActive ? 'opacity-100' : 'opacity-0'}`}
                      />
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Bancada Individual adaptada de tribunal-mesa.png (z-20, cobrindo o corte abaixo da cintura) */}
            <div className="relative z-20 -mt-[46px] sm:-mt-[58px] lg:-mt-[72px] w-[300px] sm:w-[370px] lg:w-[430px] max-w-full select-none pointer-events-none">
              <img
                src={tribunalMesaSoloImg}
                alt=""
                aria-hidden="true"
                draggable={false}
                className="w-full h-auto block pixel-art drop-shadow-[0_14px_22px_rgba(28,25,23,0.45)]"
              />

              {/* Plaquinha de Identificação na frente da Bancada */}
              <div
                className={`absolute left-1/2 -translate-x-1/2 bottom-[18%] w-[64%] sm:w-[60%] bg-stone-950/95 border-2 border-stone-900 border-t-[3px] ${theme.plateAccent} px-3 py-1.5 shadow-[3px_3px_0px_rgba(0,0,0,0.65)] flex items-center justify-between gap-2`}
              >
                <div className="min-w-0">
                  <div
                    className={`text-[10px] sm:text-[11px] font-black uppercase tracking-[0.16em] truncate ${theme.plateText}`}
                  >
                    {speakerName}
                  </div>
                  <div className="text-[9px] sm:text-[10px] font-semibold text-stone-300 truncate">
                    {speakerRole}
                  </div>
                </div>
                <span className="px-1.5 py-0.5 bg-stone-900 border border-stone-700 font-mono text-[9px] font-black text-stone-300 shrink-0">
                  {theme.code}
                </span>
              </div>

              {/* Badge/Carimbo Animado estilo Ace Attorney na frente da mesa (mutuamente exclusivo: Acerto OU Erro) */}
              {isApprovedState ? (
                <div
                  key="approved-stamp"
                  className="absolute -top-4 right-2 sm:right-4 z-30 animate-vn-stamp"
                >
                  <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 text-white border-2 border-stone-950 shadow-[4px_4px_0px_#1C1917] font-black text-xs sm:text-sm uppercase tracking-[0.16em]">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>APROVADO!</span>
                  </div>
                </div>
              ) : showWrongVisual ? (
                <div
                  key={`wrong-stamp-${vnErrorStep}-${progress.errors}-${penaltyAlertSeconds}`}
                  className="absolute -top-4 right-2 sm:right-4 z-30 animate-vn-stamp"
                >
                  <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-red-600 text-white border-2 border-stone-950 shadow-[4px_4px_0px_#1C1917] font-black text-xs sm:text-sm uppercase tracking-[0.16em]">
                    <XCircle className="w-4 h-4 shrink-0" />
                    <span>
                      {isBlockedState || vnErrorStep >= 3 || penaltyAlertSeconds >= 10
                        ? `REPROVADO! +${penaltyAlertSeconds || 10}s`
                        : vnErrorStep === 2 || progress.errors === 2
                          ? `INCORRETO! +${penaltyAlertSeconds || 5}s`
                          : `OBJEÇÃO! +${penaltyAlertSeconds || 5}s`}
                    </span>
                  </div>
                </div>
              ) : null}
            </div>
            </div>
          </div>

          {/* Direita (desktop) / Abaixo durante o foco inicial no celular e acima após a fala */}
          <section
            ref={questionRef}
            className={`lg:col-span-7 transition-[opacity,transform,filter,max-height] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              isCeoIntro ? 'lg:self-center' : 'lg:self-end'
            } ${
              isIntroSpotlight
                ? 'order-2 lg:order-2 opacity-20 scale-[0.97] blur-[1px] max-lg:max-h-[180px] max-lg:overflow-hidden pointer-events-none z-10'
                : isApprovedState
                  ? 'order-1 lg:order-2 opacity-100 scale-100 blur-0 max-lg:max-h-[950px] pointer-events-auto z-30'
                  : 'order-1 lg:order-2 opacity-100 scale-100 blur-0 max-lg:max-h-[950px] pointer-events-auto z-20'
            }`}
          >
            <div className="space-y-5 animate-modal-pop">
            {isCeoIntro ? (
              <div className="bg-[#FDFBF7] border-2 border-stone-900 p-6 sm:p-8 shadow-[6px_6px_0px_#1C1917] space-y-5">
                <div className="border-l-4 border-[#D99B38] pl-4 space-y-1">
                  <div className="text-[11px] font-black uppercase tracking-[0.2em] text-[#B87D1E]">
                    {CEO_TRIBUNAL_BRIEFING.title}
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-stone-900">
                    Pronto para Encarar a Bancada?
                  </h2>
                  <p className="text-xs sm:text-sm text-stone-600">
                    Cada aprovação garante 1 selo oficial — conquiste os 7 selos para sair do Conselho. Veja o percurso 3D no mapa e clique em OK para dar a largada no cronômetro.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={openIntroMazeModal}
                  onMouseEnter={() => setHoveredOptionId('ceo-start')}
                  onMouseLeave={() => setHoveredOptionId(null)}
                  className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-none bg-[#D99B38] hover:bg-[#c58927] text-stone-950 border-2 border-stone-900 font-black text-xs sm:text-sm uppercase tracking-[0.2em] shadow-[4px_4px_0px_#1C1917] hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#1C1917] active:scale-95 transition-all cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Ver Labirinto &amp; Começar</span>
                </button>
              </div>
            ) : (
              <div
                className={`relative bg-[#FDFBF7] border-2 p-5 sm:p-6 shadow-[6px_6px_0px_#1C1917] lg:min-h-[416px] flex flex-col justify-between gap-4 transition-colors duration-300 ${
                  isApprovedState
                    ? 'border-emerald-700'
                    : screenTensionLevel >= 3
                      ? 'border-red-700'
                      : screenTensionLevel === 2
                        ? 'border-red-500/80'
                        : 'border-stone-900'
                }`}
              >
                {/* Carimbão do Selo de Cera lacrando o documento da pergunta no momento do acerto */}
                {isApprovedState && activeWaxSeal && (
                  <div
                    key={`wax-seal-stamp-${approvalSealKey}`}
                    aria-hidden="true"
                    className="pointer-events-none select-none absolute top-0 right-0 translate-x-[35%] sm:translate-x-1/2 -translate-y-[36%] z-30 flex items-center justify-center w-[clamp(4.4rem,7.8vw,6.8rem)] aspect-square"
                  >
                    {/* Anel de impacto sincronizado à batida */}
                    <span
                      className="absolute inset-1.5 rounded-full border-[3px] animate-wax-impact-ring"
                      style={{
                        borderColor: activeWaxSeal.ringColor,
                        boxShadow: `0 0 18px ${activeWaxSeal.ringColor}`,
                      }}
                    />

                    {/* Selo de cera caindo com peso e overshoot tátil */}
                    <img
                      src={activeWaxSeal.image}
                      alt=""
                      draggable={false}
                      style={{ '--seal-tilt': `${activeWaxSeal.stampTiltDeg}deg` }}
                      className="relative w-full h-full object-contain animate-wax-seal-slam drop-shadow-[0_8px_16px_rgba(28,25,23,0.44)]"
                    />
                  </div>
                )}

                <div className="border-l-4 border-[#D99B38] pl-4 sm:pl-5 space-y-1.5">
                  <h3 className="text-lg sm:text-2xl font-bold text-stone-900 leading-snug">
                    {activeMember.question}
                  </h3>
                  {progress.errors === 2 && !isApprovedState && (
                    <p className="text-[11px] font-black uppercase tracking-[0.14em] text-red-600">
                      Atenção: próximo erro aplica +10s e bloqueia o conselheiro por 20s!
                    </p>
                  )}
                </div>

                {actionError && (
                  <div className="p-3 bg-red-50 border-2 border-red-600 flex items-center justify-between gap-2 text-red-800 text-xs font-semibold">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                      <span>{actionError}</span>
                    </div>
                    <button
                      type="button"
                      onClick={clearActionError}
                      className="text-[10px] font-black uppercase px-2 py-0.5 border border-red-400 hover:bg-red-100 cursor-pointer"
                    >
                      OK
                    </button>
                  </div>
                )}

                <div className="space-y-2.5">
                  {activeMember.options?.map((option, optIdx) => {
                    const isOptionDisabled = progress.disabledOptions.includes(option.id)
                    const isHighlightedSuccess = isApprovedState && selectedOptionId === option.id

                    return (
                      <button
                        key={option.id}
                        type="button"
                        disabled={isLocked || isOptionDisabled || isApprovedState || isBlockedState}
                        onMouseEnter={() => {
                          if (!isOptionDisabled && !isApprovedState && !isBlockedState) {
                            setHoveredOptionId(option.id)
                          }
                        }}
                        onMouseLeave={() => setHoveredOptionId(null)}
                        onFocus={() => {
                          if (!isOptionDisabled && !isApprovedState && !isBlockedState) {
                            setHoveredOptionId(option.id)
                          }
                        }}
                        onBlur={() => setHoveredOptionId(null)}
                        onClick={() => {
                          setHoveredOptionId(null)
                          setSelectedOptionId(option.id)
                          submitMultipleChoice(activeMember.id, option.id)
                        }}
                        style={{ animationDelay: `${optIdx * 60}ms` }}
                        className={`group w-full text-left p-4 border-2 flex items-center justify-between gap-3 animate-panel-rise transition-all duration-200 ${
                          isHighlightedSuccess
                            ? 'bg-emerald-50 border-emerald-600 text-emerald-950 shadow-[3px_3px_0px_#059669]'
                            : isOptionDisabled
                              ? 'bg-red-50/70 border-red-200 text-stone-400 cursor-not-allowed'
                              : 'bg-white hover:bg-[#F5F0E6] border-stone-300 hover:border-stone-900 hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#1C1917] text-stone-800 cursor-pointer active:scale-[0.995] disabled:opacity-60 disabled:pointer-events-none'
                        }`}
                      >
                        <div className="flex items-center gap-3.5">
                          <span
                            className={`w-8 h-8 font-mono text-xs font-black flex items-center justify-center shrink-0 transition-colors ${
                              isHighlightedSuccess
                                ? 'bg-emerald-600 text-white'
                                : isOptionDisabled
                                  ? 'bg-red-100 text-red-500 border border-red-200'
                                  : 'bg-stone-900 text-white group-hover:bg-[#D99B38] group-hover:text-stone-950'
                            }`}
                          >
                            {option.label}
                          </span>
                          <span
                            className={`text-sm sm:text-base font-semibold leading-snug ${
                              isOptionDisabled ? 'line-through text-stone-400' : 'text-stone-800'
                            }`}
                          >
                            {option.text}
                          </span>
                        </div>

                        {isOptionDisabled && (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600 shrink-0">
                            <XCircle className="w-4 h-4" />
                            <span>
                              {isBlockedState && selectedOptionId === option.id ? '+10s' : '+5s'}
                            </span>
                          </span>
                        )}

                        {isHighlightedSuccess && (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 shrink-0">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Correta</span>
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
            </div>
          </section>
        </div>
      </main>
      </div>
    </div>
  )
}

export default VisualNovelOverlay
