import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Award, ChevronsRight, Clock, Flame, ShieldCheck, Sparkles, Star, Trophy } from 'lucide-react'
import cutout4JhonnyPose1 from '../../assets/jhonny/cutout-4-jhonny-pose1.webp'
import cutout4JhonnyPose2 from '../../assets/jhonny/cutout-4-jhonny-pose2.webp'
import cutout4JhonnyPose3 from '../../assets/jhonny/cutout-4-jhonny-pose3.webp'
import cutout4JhonnySuccess from '../../assets/jhonny/cutout-4-jhonny-success.webp'
import tribunalMesaSoloImg from '../../assets/outros/tribunal-mesa-solo.webp'
import { CEO_TRIBUNAL_BRIEFING, getCeoFinalVerdict } from '../../data/conselhoNextData'
import { useTypewriter } from '../../hooks/useTypewriter'
import { playDialogueBlipSound, playWaxSealStampSound } from '../../utils/soundEffects'
import { formatarTempo } from '../../utils/validacaoDesafio'

const POSE_SWITCH_TYPING_MS = 1100
const POSE_SWITCH_IDLE_MS = 2400
const CEO_IDLE_POSES = [cutout4JhonnyPose1, cutout4JhonnyPose2, cutout4JhonnyPose3]
const CEO_COMPLETED_POSES = [
  cutout4JhonnySuccess,
  cutout4JhonnyPose1,
  cutout4JhonnyPose2,
  cutout4JhonnyPose3,
]

function CeoVerdictSection({
  playerName,
  totalErrors,
  activePartidaId,
  rankingHistory = [],
  melhorPartida = null,
  tentativasCount = 0,
  hasCompletedRun = true,
  justFinished = false,
}) {
  const [poseIndex, setPoseIndex] = useState(0)
  const [posePulseKey, setPosePulseKey] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const posesOnCurrentSideRef = useRef(0)

  const verdict = useMemo(
    () => getCeoFinalVerdict({ totalErrors, playerName, hasCompletedRun }),
    [totalErrors, playerName, hasCompletedRun]
  )

  const speechTriggerKey = `ceo-verdict-${hasCompletedRun ? activePartidaId || 'done' : 'pending'}-${totalErrors}`
  const hasPlayedStampRef = useRef(false)

  useEffect(() => {
    hasPlayedStampRef.current = false
  }, [speechTriggerKey])

  const handleTypeChar = useCallback((idx, ch) => {
    if (idx % 3 === 1 || /[?!]/.test(ch)) {
      playDialogueBlipSound(idx, 'ceo', ch)
    }
  }, [])

  const { displayedText, isTyping, isSpeaking, skip } = useTypewriter(verdict.speech, {
    speed: 22,
    triggerKey: speechTriggerKey,
    onCharacter: handleTypeChar,
  })

  const ceoPoses = hasCompletedRun ? CEO_COMPLETED_POSES : CEO_IDLE_POSES
  const activePoseCount = ceoPoses.length
  const poseIntervalMs = isTyping ? POSE_SWITCH_TYPING_MS : POSE_SWITCH_IDLE_MS

  useEffect(() => {
    if (activePoseCount <= 1) return undefined

    const timer = setInterval(() => {
      setPoseIndex((prev) => {
        const step = activePoseCount > 2 && Math.random() < 0.3 ? 2 : 1
        return (prev + step) % activePoseCount
      })
      setPosePulseKey((prev) => prev + 1)

      posesOnCurrentSideRef.current += 1
      const minPosesBeforeFlip = isTyping ? 3 : 2
      const flipChance = isTyping ? 0.35 : 0.42

      if (posesOnCurrentSideRef.current >= minPosesBeforeFlip && Math.random() < flipChance) {
        setIsFlipped((prev) => !prev)
        posesOnCurrentSideRef.current = 0
      }
    }, poseIntervalMs)

    return () => clearInterval(timer)
  }, [activePoseCount, poseIntervalMs, isTyping])

  const verdictRevealed = !isTyping

  useEffect(() => {
    if (!verdictRevealed || hasPlayedStampRef.current) return
    hasPlayedStampRef.current = true
    playWaxSealStampSound()
  }, [verdictRevealed])

  const userRankingEntry = useMemo(
    () => rankingHistory.find((item) => Boolean(item.isCurrentUser)) || null,
    [rankingHistory]
  )

  const isCurrentRunBest = Boolean(
    hasCompletedRun && melhorPartida && activePartidaId && melhorPartida.id === activePartidaId
  )
  const isFirstOfficialRecord = justFinished && isCurrentRunBest && tentativasCount <= 1
  const isNewPersonalRecord = justFinished && isCurrentRunBest && tentativasCount > 1

  const tierStyles =
    verdict.tier === 'pendente'
      ? {
          badge: 'bg-stone-800 text-[#D99B38] border-stone-900',
          cardAccent: 'border-l-stone-800',
          Icon: Clock,
        }
      : verdict.tier === 'invicto'
        ? {
            badge: 'bg-emerald-600 text-white border-stone-900',
            cardAccent: 'border-l-emerald-600',
            Icon: Flame,
          }
        : verdict.tier === 'merito'
          ? {
              badge: 'bg-[#D99B38] text-stone-950 border-stone-900',
              cardAccent: 'border-l-[#D99B38]',
              Icon: Award,
            }
          : {
              badge: 'bg-amber-600 text-white border-stone-900',
              cardAccent: 'border-l-amber-600',
              Icon: ShieldCheck,
            }

  const TierIcon = tierStyles.Icon
  const activePoseIdx = poseIndex % ceoPoses.length
  const activePoseSrc = ceoPoses[activePoseIdx]
  const effectiveFlipped = activePoseSrc === cutout4JhonnySuccess ? false : isFlipped
  const headerTagLabel = justFinished
    ? 'Veredito Final'
    : hasCompletedRun
      ? 'Último Veredito'
      : 'Convocação do Conselho'

  return (
    <section
      aria-label="Veredito Final do CEO"
      className="bg-[#FDFBF7] border-2 border-stone-900 border-t-4 border-t-[#D99B38] p-5 sm:p-7 shadow-[6px_6px_0px_#1C1917] animate-modal-pop"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-end">
        {/* Esquerda: CEO na Bancada do Tribunal */}
        <div className="lg:col-span-5 flex flex-col items-center justify-end order-2 lg:order-1">
          <div
            className={`relative z-10 inline-flex justify-center items-end origin-bottom select-none pointer-events-none ${
              isSpeaking
                ? 'animate-vn-talk drop-shadow-[0_14px_24px_rgba(28,25,23,0.22)]'
                : 'animate-vn-idle drop-shadow-[0_14px_24px_rgba(28,25,23,0.16)]'
            }`}
          >
            <div
              key={posePulseKey}
              className="animate-vn-pose-pop origin-bottom inline-flex justify-center items-end"
            >
              <div
                className={`relative origin-center transition-transform duration-150 ${
                  effectiveFlipped ? '-scale-x-100' : 'scale-x-100'
                }`}
              >
                {ceoPoses.map((poseSrc, idx) => {
                  const isActive = idx === activePoseIdx
                  return (
                    <img
                      key={poseSrc}
                      src={poseSrc}
                      alt={idx === 0 ? CEO_TRIBUNAL_BRIEFING.name : ''}
                      aria-hidden={idx > 0}
                      draggable={false}
                      className={`h-[195px] sm:h-[235px] lg:h-[250px] w-auto object-contain object-bottom saturate-[1.06] contrast-[1.03] ${
                        idx === 0 ? 'relative' : 'absolute inset-0 w-full h-full'
                      } ${isActive ? 'opacity-100' : 'opacity-0'}`}
                    />
                  )
                })}
              </div>
            </div>
          </div>

          <div className="relative z-20 -mt-[40px] sm:-mt-[48px] w-[260px] sm:w-[320px] max-w-full select-none pointer-events-none">
            <img
              src={tribunalMesaSoloImg}
              alt=""
              aria-hidden="true"
              draggable={false}
              className="w-full h-auto block pixel-art drop-shadow-[0_12px_18px_rgba(28,25,23,0.4)]"
            />
            <div className="absolute left-1/2 -translate-x-1/2 bottom-[18%] w-[68%] bg-stone-950/95 border-2 border-stone-900 border-t-[3px] border-t-[#D99B38] px-3 py-1.5 shadow-[3px_3px_0px_rgba(0,0,0,0.65)] flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.16em] text-[#D99B38] truncate">
                  {CEO_TRIBUNAL_BRIEFING.name}
                </div>
                <div className="text-[9px] sm:text-[10px] font-semibold text-stone-300 truncate">
                  {CEO_TRIBUNAL_BRIEFING.title}
                </div>
              </div>
              <span className="px-1.5 py-0.5 bg-stone-900 border border-stone-700 font-mono text-[9px] font-black text-stone-300 shrink-0">
                CEO
              </span>
            </div>
          </div>
        </div>

        {/* Direita: Caixa de Fala + Etiqueta Carimbada + Posição & Recorde */}
        <div className="lg:col-span-7 space-y-4 order-1 lg:order-2 self-center">
          {/* Caixa de Fala estilo Ace Attorney */}
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1 text-xs font-black uppercase tracking-widest border-2 border-b-0 border-stone-900 bg-[#D99B38] text-stone-950 ml-3 relative z-10">
              <span>{CEO_TRIBUNAL_BRIEFING.name}</span>
              <span className="opacity-65">·</span>
              <span>{headerTagLabel}</span>
            </div>

            <div
              role="button"
              tabIndex={0}
              onClick={skip}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  skip()
                }
              }}
              aria-label="Fala final do CEO. Clique para exibir o texto completo."
              className={`relative bg-[#F5F0E6] border-2 border-stone-900 px-5 py-4 shadow-[5px_5px_0px_#1C1917] transition-colors ${
                isTyping ? 'cursor-pointer hover:bg-[#EFE8DA]' : 'cursor-default'
              }`}
            >
              <p className="text-sm sm:text-base font-semibold text-stone-900 leading-relaxed min-h-[3.5rem]">
                “{displayedText}”
                {isTyping && (
                  <span className="inline-block w-2 h-4 ml-1 align-middle bg-[#D99B38] animate-vn-caret" />
                )}
              </p>

              <div className="mt-2 flex items-center justify-between gap-3 text-[11px] font-mono">
                <span className="text-stone-500">
                  {isTyping
                    ? 'Clique na caixa para revelar o veredito completo'
                    : 'Veredito oficial registrado pelo Conselho Next'}
                </span>
                <ChevronsRight
                  className={`w-4 h-4 text-[#B87D1E] shrink-0 ${
                    !isTyping ? 'opacity-40' : 'animate-vn-caret'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Abaixo da fala: Etiqueta da jogada + Posição no Ranking Geral + Recorde Pessoal */}
          {verdictRevealed ? (
            <div
              className={`bg-[#F5F0E6] border-2 border-stone-900 border-l-4 ${tierStyles.cardAccent} p-4 shadow-[4px_4px_0px_#1C1917] space-y-3 animate-panel-rise`}
            >
              {/* Linha 1: Etiqueta Carimbada + Destaque de Recorde */}
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                <span
                  className={`animate-vn-stamp inline-flex items-center gap-2 px-3.5 py-1.5 border-2 shadow-[3px_3px_0px_#1C1917] font-black text-xs sm:text-sm uppercase tracking-[0.16em] leading-none select-none ${tierStyles.badge}`}
                >
                  <TierIcon className="w-4 h-4 shrink-0" />
                  <span>{verdict.badgeLabel}</span>
                </span>

                {(isNewPersonalRecord || isFirstOfficialRecord) && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 text-[#D99B38] border-2 border-stone-900 shadow-[2px_2px_0px_#D99B38] font-black text-[11px] uppercase tracking-[0.14em] animate-panel-rise">
                    <Star className="w-3.5 h-3.5 fill-[#D99B38]" />
                    <span>
                      {isNewPersonalRecord
                        ? 'Novo Recorde Pessoal!'
                        : '1º Recorde Oficial!'}
                    </span>
                  </span>
                )}
              </div>

              {/* Linha 2: Posição no Ranking Geral + Resumo do Recorde */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-stone-300/80">
                <div className="flex items-center gap-3 bg-[#FDFBF7] border border-stone-300 px-3.5 py-2.5">
                  <div className="w-9 h-9 bg-[#D99B38] text-stone-950 border border-stone-900 flex items-center justify-center shrink-0">
                    <Trophy className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] font-black uppercase tracking-[0.16em] text-stone-500">
                      Posição no Ranking Geral
                    </div>
                    <div className="font-mono text-base sm:text-lg font-black text-stone-900 leading-tight">
                      {!hasCompletedRun ? (
                        <span className="text-sm text-stone-600">Ainda não ranqueado</span>
                      ) : userRankingEntry ? (
                        <>
                          {userRankingEntry.posicao}º Lugar
                          {rankingHistory.length > 0 && (
                            <span className="ml-1.5 text-xs font-semibold text-stone-500">
                              de {rankingHistory.length}{' '}
                              {rankingHistory.length === 1 ? 'participante' : 'participantes'}
                            </span>
                          )}
                        </>
                      ) : (
                        'Computando...'
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-[#FDFBF7] border border-stone-300 px-3.5 py-2.5">
                  <div className="w-9 h-9 bg-stone-900 text-[#D99B38] border border-stone-900 flex items-center justify-center shrink-0">
                    <Star className="w-4 h-4 fill-[#D99B38]" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] font-black uppercase tracking-[0.16em] text-stone-500">
                      {isCurrentRunBest ? 'Seu Melhor Tempo' : 'Recorde Pessoal Atual'}
                    </div>
                    <div className="font-mono text-base sm:text-lg font-black text-emerald-700 leading-tight">
                      {!hasCompletedRun ? (
                        <span className="text-sm text-stone-500">Sem registro</span>
                      ) : melhorPartida ? (
                        <>
                          {formatarTempo(melhorPartida.segundosTotais)}
                          {!isCurrentRunBest && (
                            <span className="ml-1.5 text-[11px] font-semibold text-stone-500">
                              (mantido)
                            </span>
                          )}
                        </>
                      ) : userRankingEntry ? (
                        formatarTempo(userRankingEntry.totalSeconds)
                      ) : (
                        '—'
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-stone-100/80 border-2 border-dashed border-stone-300 px-4 py-3.5 text-xs font-mono uppercase tracking-wider text-stone-500 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#B87D1E] shrink-0 animate-pulse" />
              <span>Aguardando conclusão da fala para emitir a etiqueta oficial...</span>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export default CeoVerdictSection
