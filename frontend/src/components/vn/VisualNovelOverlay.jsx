import { useCallback, useEffect, useState } from 'react'
import {
  ArrowLeft,
  CheckCircle2,
  ChevronsRight,
  KeyRound,
  Play,
  Send,
  XCircle,
} from 'lucide-react'
import cutout1Valdir from '../../assets/cutout-1-valdir.png'
import cutout2Ramon from '../../assets/cutout-2-ramon.png'
import cutout3Vanessa from '../../assets/cutout-3-vanessa.png'
import cutout4Jhonny from '../../assets/cutout-4-jhonny.png'
import cutout5Juarez from '../../assets/cutout-5-juarez.png'
import cutout6RicardoPose1 from '../../assets/cutout-6-ricardo-pose1.png'
import cutout6RicardoPose2 from '../../assets/cutout-6-ricardo-pose2.png'
import cutout6RicardoPose3 from '../../assets/cutout-6-ricardo-pose3.png'
import cutout6RicardoWrong from '../../assets/cutout-6-ricardo-wrong.png'
import cutout6RicardoSuccess from '../../assets/cutout-6-ricardo-success.png'
import cutout7EdPose1 from '../../assets/cutout-7-ed-pose1.png'
import cutout7EdPose2 from '../../assets/cutout-7-ed-pose2.png'
import cutout7EdPose3 from '../../assets/cutout-7-ed-pose3.png'
import cutout7EdWrong from '../../assets/cutout-7-ed-wrong.png'
import cutout7EdSuccess from '../../assets/cutout-7-ed-success.png'
import { useGame } from '../../context/gameContextInstance'
import { CEO_TRIBUNAL_BRIEFING, getErrorDialogue } from '../../data/conselhoNextData'
import { useTypewriter } from '../../hooks/useTypewriter'
import { playDialogueBlipSound } from '../../utils/soundEffects'

const POSE_SWITCH_INTERVAL_MS = 2000
const WRONG_POSE_DURATION_MS = 2000

const MEMBER_CUTOUTS = {
  1: {
    default: [cutout1Valdir],
    wrong: null,
    success: null,
  },
  2: {
    default: [cutout2Ramon],
    wrong: null,
    success: null,
  },
  3: {
    default: [cutout3Vanessa],
    wrong: null,
    success: null,
  },
  4: {
    default: [cutout4Jhonny],
    wrong: null,
    success: null,
  },
  5: {
    default: [cutout5Juarez],
    wrong: null,
    success: null,
  },
  6: {
    default: [cutout6RicardoPose1, cutout6RicardoPose2, cutout6RicardoPose3],
    wrong: cutout6RicardoWrong,
    success: cutout6RicardoSuccess,
  },
  7: {
    default: [cutout7EdPose1, cutout7EdPose2, cutout7EdPose3],
    wrong: cutout7EdWrong,
    success: cutout7EdSuccess,
  },
}

function VisualNovelOverlay({ isCeoIntro = false }) {
  const {
    activeMember,
    memberProgress,
    vnFeedback,
    isLocked,
    closeMemberDialog,
    submitMultipleChoice,
    submitTextAnswer,
    openIntroMazeModal,
  } = useGame()

  const [textValue, setTextValue] = useState('')
  const [poseIndex, setPoseIndex] = useState(0)
  const [prevFeedback, setPrevFeedback] = useState(vnFeedback)
  const [isShowingWrongPose, setIsShowingWrongPose] = useState(false)

  if (vnFeedback !== prevFeedback) {
    setPrevFeedback(vnFeedback)
    if (vnFeedback === 'wrong') {
      setIsShowingWrongPose(true)
    }
  }

  useEffect(() => {
    if (!isShowingWrongPose) return undefined

    const timer = setTimeout(() => {
      setIsShowingWrongPose(false)
      setPoseIndex(0)
    }, WRONG_POSE_DURATION_MS)

    return () => clearTimeout(timer)
  }, [isShowingWrongPose])

  const memberId = activeMember?.id

  const progress = (memberId && memberProgress[memberId]) || {
    completed: false,
    errors: 0,
    disabledOptions: [],
    wrongTextAttempts: [],
  }

  const dynamicErrorSpeech = !isCeoIntro ? getErrorDialogue(progress.errors) : null
  const isApprovedState = !isCeoIntro && vnFeedback === 'approved'
  const isWrongShake = !isCeoIntro && vnFeedback === 'wrong'

  const speechMode = isCeoIntro
    ? 'ceo'
    : isApprovedState
      ? 'approved'
      : dynamicErrorSpeech
        ? 'error'
        : 'greeting'

  const memberConfig = memberId ? MEMBER_CUTOUTS[memberId] : null
  const counselorPoses = isCeoIntro
    ? [cutout4Jhonny]
    : isApprovedState && memberConfig?.success
      ? [memberConfig.success]
      : isShowingWrongPose && memberConfig?.wrong
        ? [memberConfig.wrong]
        : memberConfig?.default || [cutout4Jhonny]
  const activePoseCount = counselorPoses.length

  useEffect(() => {
    if (activePoseCount <= 1) return undefined

    const timer = setInterval(() => {
      setPoseIndex((prev) => (prev + 1) % activePoseCount)
    }, POSE_SWITCH_INTERVAL_MS)

    return () => clearInterval(timer)
  }, [activePoseCount])

  const currentSpeech = isCeoIntro
    ? CEO_TRIBUNAL_BRIEFING.message
    : !activeMember
      ? ''
      : isApprovedState
        ? activeMember.approvalMessage
        : dynamicErrorSpeech || activeMember.greeting

  const handleTypeChar = useCallback((idx) => {
    if (idx % 3 === 1) {
      playDialogueBlipSound(idx)
    }
  }, [])

  const { displayedText, isTyping, skip } = useTypewriter(currentSpeech, {
    speed: 22,
    triggerKey: isCeoIntro ? 'ceo-intro' : `${memberId || 0}-${speechMode}-${progress.errors}`,
    onCharacter: handleTypeChar,
  })

  if (!isCeoIntro && !activeMember) return null

  const speakerName = isCeoIntro ? CEO_TRIBUNAL_BRIEFING.name : activeMember.name

  const handleTextSubmit = (e) => {
    e.preventDefault()
    if (isLocked || isApprovedState || !textValue.trim() || !activeMember) return
    const submitted = textValue
    setTextValue('')
    submitTextAnswer(activeMember.id, submitted)
  }

  const speakerTagClass = isApprovedState
    ? 'bg-emerald-600 text-white border-stone-900'
    : speechMode === 'error'
      ? 'bg-red-600 text-white border-stone-900'
      : 'bg-[#D99B38] text-stone-950 border-stone-900'

  const portraitReactionClass = isWrongShake
    ? 'animate-vn-shake drop-shadow-[0_0_26px_rgba(220,38,38,0.48)]'
    : isApprovedState
      ? 'animate-vn-approve drop-shadow-[0_0_28px_rgba(16,185,129,0.4)]'
      : isTyping
        ? 'animate-vn-talk drop-shadow-[0_14px_24px_rgba(28,25,23,0.2)]'
        : 'animate-vn-idle drop-shadow-[0_14px_24px_rgba(28,25,23,0.16)]'

  const auraClass = isWrongShake
    ? 'bg-red-500/20'
    : isApprovedState
      ? 'bg-emerald-500/20'
      : 'bg-[#D99B38]/15'

  return (
    <div
      className="fixed inset-0 z-40 bg-[#F5F0E6] text-stone-900 flex flex-col overflow-y-auto animate-overlay-enter"
      role="dialog"
      aria-modal="true"
      aria-label={speakerName}
    >
      {/* Topo: Caixa de Falas estilo Pokémon / Ace Attorney */}
      <div
        className={`w-full max-w-6xl mx-auto px-4 sm:px-8 shrink-0 animate-panel-rise ${
          isCeoIntro ? 'pt-8 sm:pt-12' : 'pt-20 sm:pt-22'
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
                <span>+{progress.errors * 5}s</span>
              </>
            )}
          </div>

          {!isCeoIntro && (
            <button
              type="button"
              disabled={isLocked || isApprovedState}
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
          onClick={() => {
            if (isTyping) skip()
          }}
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === ' ') && isTyping) {
              e.preventDefault()
              skip()
            }
          }}
          aria-label="Fala do personagem. Clique para completar o texto."
          className={`relative bg-[#FDFBF7] border-2 px-5 sm:px-6 py-4 shadow-[6px_6px_0px_#1C1917] transition-colors duration-200 ${
            isApprovedState
              ? 'border-emerald-600'
              : speechMode === 'error'
                ? 'border-red-600'
                : 'border-stone-900'
          } ${isTyping ? 'cursor-pointer' : 'cursor-default'}`}
        >
          <p className="text-base sm:text-lg font-semibold text-stone-900 leading-relaxed min-h-[3rem] pr-8">
            “{displayedText}”
            {isTyping && (
              <span className="inline-block w-2 h-4 ml-1 align-middle bg-[#D99B38] animate-vn-caret" />
            )}
          </p>

          <div className="mt-2 flex items-center justify-between gap-4 text-[11px] font-mono">
            <span className="text-stone-500">
              {isApprovedState
                ? 'Registrando aprovação no Tribunal...'
                : isTyping
                  ? 'Clique na caixa para exibir tudo'
                  : isCeoIntro
                    ? 'Clique em "Iniciar Desafio" abaixo para começar'
                    : 'Selecione ou digite sua resposta abaixo'}
            </span>

            <span
              className={`inline-flex items-center gap-1 font-bold ${
                isApprovedState
                  ? 'text-emerald-700'
                  : speechMode === 'error'
                    ? 'text-red-600'
                    : 'text-[#B87D1E]'
              }`}
            >
              {isApprovedState ? (
                <span>2,5s</span>
              ) : (
                <ChevronsRight
                  className={`w-4 h-4 ${!isTyping ? 'animate-vn-caret' : 'opacity-60'}`}
                />
              )}
            </span>
          </div>

          {isApprovedState && (
            <div className="mt-2.5 w-full h-1.5 bg-[#EBE4D5] overflow-hidden border border-emerald-600">
              <div className="h-full bg-emerald-600 animate-reading-bar" />
            </div>
          )}
        </div>
      </div>

      {/* Mesma horizontal: Imagem viva alinhada à base da caixa de perguntas à esquerda + Caixa de perguntas/ação à direita */}
      <main className="flex-1 flex items-start lg:items-center">
        <div className="max-w-6xl w-full mx-auto px-4 sm:px-8 pt-4 pb-16 sm:pb-20 lg:pt-6 lg:pb-10 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 lg:items-end">
          {/* Esquerda: Recorte alinhado ao final da caixa de pergunta, com aura sutil e respiração */}
          <div className="lg:col-span-5 lg:self-end flex justify-center items-end pt-2 pb-0 order-2 lg:order-1 animate-portrait-enter relative">
            <div
              className={`pointer-events-none absolute bottom-4 w-72 h-72 rounded-full blur-3xl transition-colors duration-500 ${auraClass}`}
            />
            <div
              className={`relative inline-flex justify-center items-end origin-bottom select-none pointer-events-none ${portraitReactionClass}`}
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
                    className={`h-[280px] sm:h-[360px] lg:h-[clamp(400px,56vh,540px)] w-auto object-contain object-bottom saturate-[1.06] contrast-[1.03] ${
                      idx === 0 ? 'relative' : 'absolute inset-0 w-full h-full'
                    } ${isActive ? 'opacity-100' : 'opacity-0'}`}
                  />
                )
              })}
            </div>
          </div>

          {/* Direita: Botão "Ver Mapa e Iniciar" (quando for o CEO) ou Pergunta e Alternativas/Input */}
          <section
            className={`lg:col-span-7 space-y-5 order-1 lg:order-2 animate-modal-pop ${
              isCeoIntro ? 'lg:self-center' : 'lg:self-end'
            }`}
          >
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
                    Veja o percurso 3D no mapa e clique em OK para dar a largada no cronômetro.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={openIntroMazeModal}
                  className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-none bg-[#D99B38] hover:bg-[#c58927] text-stone-950 border-2 border-stone-900 font-black text-xs sm:text-sm uppercase tracking-[0.2em] shadow-[4px_4px_0px_#1C1917] hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#1C1917] active:scale-95 transition-all cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Ver Labirinto &amp; Começar</span>
                </button>
              </div>
            ) : (
              <div className="bg-[#FDFBF7] border-2 border-stone-900 p-6 sm:p-7 shadow-[6px_6px_0px_#1C1917] space-y-5">
                <div className="border-l-4 border-[#D99B38] pl-4 sm:pl-5 space-y-1.5">
                  <h3 className="text-lg sm:text-2xl font-bold text-stone-900 leading-snug">
                    {activeMember.question}
                  </h3>
                </div>

                {activeMember.type === 'multiple_choice' ? (
                  <div className="space-y-3">
                    {activeMember.options?.map((option, optIdx) => {
                      const isOptionDisabled = progress.disabledOptions.includes(option.id)
                      const isHighlightedSuccess = isApprovedState && option.isCorrect

                      return (
                        <button
                          key={option.id}
                          type="button"
                          disabled={isLocked || isOptionDisabled || isApprovedState}
                          onClick={() => submitMultipleChoice(activeMember.id, option.id)}
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
                              <span>+5s</span>
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
                ) : (
                  <div className="space-y-4">
                    <form onSubmit={handleTextSubmit} className="flex flex-col sm:flex-row gap-3">
                      <div className="relative flex-1 group">
                        <KeyRound className="w-4 h-4 text-stone-400 group-focus-within:text-[#B87D1E] absolute left-4 top-1/2 -translate-y-1/2 transition-colors" />
                        <input
                          type="text"
                          value={textValue}
                          onChange={(e) => setTextValue(e.target.value)}
                          disabled={isLocked || isApprovedState}
                          placeholder={activeMember.placeholder || 'Digite sua resposta...'}
                          autoFocus
                          className="w-full pl-11 pr-4 py-3.5 bg-white border-2 border-stone-300 text-stone-900 placeholder-stone-400 text-sm sm:text-base font-semibold focus:outline-none focus:border-[#D99B38] disabled:opacity-50 transition-colors"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isLocked || isApprovedState || !textValue.trim()}
                        className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-[#D99B38] hover:bg-[#c58927] text-stone-950 border-2 border-stone-900 font-black text-xs sm:text-sm uppercase tracking-widest shadow-[3px_3px_0px_#1C1917] hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_#1C1917] active:scale-95 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
                      >
                        <Send className="w-4 h-4" />
                        <span>Confirmar</span>
                      </button>
                    </form>

                    {progress.wrongTextAttempts.length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap pt-1">
                        <span className="text-xs font-semibold text-stone-500">
                          Palpites incorretos (+5s):
                        </span>
                        {progress.wrongTextAttempts.map((attempt) => (
                          <span
                            key={attempt}
                            className="px-2.5 py-0.5 bg-red-50 border border-red-200 text-xs font-mono font-semibold text-red-700 line-through"
                          >
                            {attempt}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}

export default VisualNovelOverlay
