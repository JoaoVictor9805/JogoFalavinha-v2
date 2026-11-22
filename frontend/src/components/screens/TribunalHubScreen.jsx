import { useEffect, useState } from 'react'
import { AlertCircle, CheckCircle2, Lock } from 'lucide-react'
import {
  MEMBER_CARD_IMAGES,
  TRIBUNAL_MESA_IMG as tribunalMesaImg,
} from '../../data/councilAssets'
import { COUNCIL_POP_STAGGER_MS } from '../../context/GameContext'
import { useGame } from '../../context/gameContextInstance'
import { getWaxSealByMemberId } from '../../data/waxSealsData'
import { prefetchTribunalAssets } from '../../utils/assetPrefetch'
import VisualNovelOverlay from '../vn/VisualNovelOverlay'

function TribunalHubScreen() {
  const {
    challenges,
    memberProgress,
    memberLocks,
    completedCount,
    activeMember,
    openMemberDialog,
    isLocked,
    ceoBriefingDismissed,
    councilEntranceState,
    mazeModal,
    actionError,
    clearActionError,
  } = useGame()

  const [nowMs, setNowMs] = useState(() => Date.now())
  const hasAnyLocks = Object.keys(memberLocks).length > 0

  const completedIds = challenges
    .filter((m) => memberProgress[m.id]?.completed)
    .map((m) => m.id)
  const completedIdsSignature = completedIds.join(',')
  const [prevCompletedIds, setPrevCompletedIds] = useState(completedIds)
  const [recentlyStampedId, setRecentlyStampedId] = useState(null)

  if (completedIdsSignature !== prevCompletedIds.join(',')) {
    const newlyCompleted = completedIds.find((id) => !prevCompletedIds.includes(id))
    setPrevCompletedIds(completedIds)
    if (newlyCompleted) {
      setRecentlyStampedId(newlyCompleted)
    } else if (completedIds.length === 0) {
      setRecentlyStampedId(null)
    }
  }

  useEffect(() => {
    prefetchTribunalAssets()
  }, [])

  useEffect(() => {
    if (!hasAnyLocks) return undefined
    const interval = setInterval(() => {
      setNowMs(Date.now())
    }, 250)
    return () => clearInterval(interval)
  }, [hasAnyLocks])

  const totalMembers = challenges.length || 7

  return (
    <div className="min-h-screen w-full bg-[#F5F0E6] text-stone-900 flex flex-col justify-center pt-18 pb-10 px-4 sm:px-8 relative overflow-hidden">
      {/* Alerta amigável caso ocorra erro de rede ou tentativa em card bloqueado */}
      {actionError && ceoBriefingDismissed && !activeMember && (
        <div className="max-w-xl w-full mx-auto mb-3 relative z-20">
          <div className="p-3 bg-red-50 border-2 border-red-600 shadow-[4px_4px_0px_#1C1917] flex items-center justify-between gap-3 text-red-900 text-xs font-semibold">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{actionError}</span>
            </div>
            <button
              type="button"
              onClick={clearActionError}
              className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 border border-red-400 hover:bg-red-100 cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* Bancada do Tribunal: 7 painéis verticais estilo Ace Attorney acima das 7 cadeiras */}
      <main className="relative z-10 w-full flex flex-col justify-center">
        <section aria-label="Bancada do Conselho Next" className="max-w-6xl w-full mx-auto">
          <div className="overflow-x-auto pt-8 pb-4 px-2">
            <div className="min-w-[940px] w-full flex flex-col items-center">
              {/* Fileira única horizontal de cards brancos, compridos e sem cantos arredondados */}
              <div className="w-[88%] mx-auto grid grid-cols-7 gap-2.5 xl:gap-3 items-stretch relative z-10">
                {challenges.map((member, idx) => {
                  const status = memberProgress[member.id] || {
                    completed: false,
                    errors: 0,
                  }
                  const isCompleted = status.completed
                  const lockExp = memberLocks[member.id]
                  const remainingLockSec =
                    lockExp && lockExp > nowMs ? Math.max(1, Math.ceil((lockExp - nowMs) / 1000)) : 0
                  const isCoolingDown = !isCompleted && remainingLockSec > 0
                  const cardImage = MEMBER_CARD_IMAGES[member.id]
                  const waxSeal = getWaxSealByMemberId(member.id)
                  const isFreshlyStamped =
                    isCompleted && recentlyStampedId === member.id && !activeMember && !mazeModal
                  const isEntranceWaiting = councilEntranceState === 'waiting'
                  const isEntranceAnimating = councilEntranceState === 'animating'

                  return (
                    <button
                      key={member.id}
                      type="button"
                      disabled={
                        isCompleted ||
                        isLocked ||
                        isCoolingDown ||
                        isEntranceWaiting ||
                        isEntranceAnimating
                      }
                      onClick={() => openMemberDialog(member.id)}
                      aria-label={`${member.name} — ${member.role}${
                        isCompleted
                          ? ' (Aprovado)'
                          : isCoolingDown
                            ? ` (Bloqueado por ${remainingLockSec}s)`
                            : ''
                      }`}
                      title={
                        isCoolingDown
                          ? `${member.name} · Bloqueado (${remainingLockSec}s)`
                          : `${member.name} · ${member.role}`
                      }
                      style={
                        isEntranceAnimating
                          ? { animationDelay: `${idx * COUNCIL_POP_STAGGER_MS}ms` }
                          : undefined
                      }
                      className={`group relative h-[260px] xl:h-[300px] rounded-none border-[3px] p-0 overflow-hidden transition-all duration-300 ${
                        isEntranceWaiting
                          ? 'opacity-0 scale-0 pointer-events-none'
                          : isEntranceAnimating
                            ? 'animate-council-pop pointer-events-none'
                            : ''
                      } ${
                        isCompleted
                          ? 'bg-stone-200 border-emerald-700/80 shadow-[3px_3px_0px_rgba(28,25,23,0.45)] cursor-not-allowed pointer-events-none'
                          : isCoolingDown
                            ? 'bg-stone-900 border-red-600 cursor-not-allowed'
                            : `bg-white ${member.borderAccent} shadow-[4px_4px_0px_rgba(28,25,23,0.85)] hover:-translate-y-2.5 hover:shadow-[6px_10px_0px_#1C1917] focus-visible:-translate-y-2 focus-visible:outline-none cursor-pointer`
                      }`}
                    >
                      {cardImage && (
                        <img
                          src={cardImage}
                          alt={member.name}
                          draggable={false}
                          className={`block w-full h-full object-cover object-top transition-all duration-500 ${
                            isCompleted
                              ? 'grayscale opacity-50 contrast-95'
                              : isCoolingDown
                                ? 'grayscale brightness-50 contrast-110'
                                : 'saturate-[1.06] contrast-[1.03] group-hover:scale-[1.05] group-hover:saturate-[1.15] group-hover:brightness-[1.03]'
                          }`}
                        />
                      )}

                      {/* Reflexo diagonal sutil ao passar o mouse */}
                      {!isCompleted && !isCoolingDown && (
                        <span className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
                      )}

                      {/* Overlay de bloqueio temporário (20s após 3 erros) */}
                      {isCoolingDown && (
                        <div className="pointer-events-none absolute inset-0 bg-stone-950/65 flex flex-col items-center justify-center gap-2 p-2 text-center">
                          <div className="w-10 h-10 bg-red-600 border-2 border-stone-950 text-white flex items-center justify-center shadow-[2px_2px_0px_#000]">
                            <Lock className="w-5 h-5" />
                          </div>
                          <span className="px-2 py-0.5 bg-stone-950 border border-red-500 text-red-200 font-mono text-sm font-black">
                            {remainingLockSec}s
                          </span>
                          <span className="text-[9px] font-black uppercase tracking-[0.14em] text-stone-200 leading-tight">
                            Reprovado · Aguarde
                          </span>
                        </div>
                      )}

                      {/* Etiqueta discreta com nome revelada no hover/foco */}
                      {!isCompleted && !isCoolingDown && (
                        <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-stone-950/90 border-t-2 border-[#D99B38] py-1 px-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-white opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 group-focus-visible:opacity-100 group-focus-visible:translate-y-0 transition-all duration-200 text-center truncate">
                          {member.name}
                        </span>
                      )}

                      {/* Confere verde de aprovação no canto superior esquerdo + Selo de cera no canto inferior direito */}
                      {isCompleted && (
                        <>
                          <span className="pointer-events-none absolute top-2 left-2 z-20 w-6 h-6 bg-emerald-600 border-2 border-stone-900 text-white flex items-center justify-center shadow-sm">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </span>

                          {waxSeal && (
                            <span
                              key={`card-seal-${member.id}-${isFreshlyStamped ? 'fresh' : 'settled'}`}
                              aria-hidden="true"
                              className="pointer-events-none select-none absolute bottom-1 right-1 z-20 w-[38%] min-w-[36px] max-w-[46px] aspect-square flex items-center justify-center"
                            >
                              <img
                                src={waxSeal.image}
                                alt=""
                                draggable={false}
                                style={{
                                  '--seal-tilt': `${waxSeal.cardTiltDeg}deg`,
                                  transform: isFreshlyStamped
                                    ? undefined
                                    : `rotate(${waxSeal.cardTiltDeg}deg)`,
                                }}
                                className={`w-full h-full object-contain drop-shadow-[0_3px_6px_rgba(28,25,23,0.48)] ${
                                  isFreshlyStamped ? 'animate-wax-card-settle' : ''
                                }`}
                              />
                            </span>
                          )}
                        </>
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Mesa do Tribunal com as 7 cadeiras levemente sobrepostas pela base dos cards */}
              <div className="relative z-0 w-full -mt-6 xl:-mt-8 pointer-events-none select-none animate-panel-rise">
                <img
                  src={tribunalMesaImg}
                  alt={`Mesa do Tribunal do Conselho Next com 7 cadeiras (${completedCount} de ${totalMembers} aprovações)`}
                  className="relative w-full h-auto block drop-shadow-[0_14px_24px_rgba(28,25,23,0.3)]"
                  draggable={false}
                />
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Fala inicial do CEO */}
      {!ceoBriefingDismissed && <VisualNovelOverlay isCeoIntro />}

      {/* Overlay Visual Novel de cada Conselheiro */}
      {ceoBriefingDismissed && activeMember && <VisualNovelOverlay key={activeMember.id} />}
    </div>
  )
}

export default TribunalHubScreen
