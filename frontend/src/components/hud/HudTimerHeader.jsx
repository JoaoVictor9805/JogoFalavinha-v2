import { Suspense, lazy, useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle2, Clock, Compass, Flame, Loader2, Pause, Shield, User } from 'lucide-react'
import { useGame } from '../../context/gameContextInstance'
import { prefetchMazeModalChunk } from '../../utils/assetPrefetch'
import { formatarTempo } from '../../utils/validacaoDesafio'
import { MAZE_STEPS } from '../maze3d/mazeData'
import SealCaseDrawer from './SealCaseDrawer'

const MazeModal3D = lazy(() => prefetchMazeModalChunk())

function HudTimerHeader() {
  const {
    screen,
    player,
    challenges,
    isTimerPausedForApproval,
    realSeconds,
    penaltySeconds,
    bonusSeconds,
    totalSeconds,
    comboAtual,
    penaltyAlertKey,
    penaltyAlertSeconds,
    comboAlert,
    completedCount,
    memberProgress,
    ceoBriefingDismissed,
    councilEntranceState,
    mazeModal,
    openManualMazeModal,
    confirmIntroMazeAndStart,
    closeMazeModal,
  } = useGame()

  const [dismissedPenaltyKey, setDismissedPenaltyKey] = useState(0)
  const [dismissedComboKey, setDismissedComboKey] = useState(0)

  const showPenaltyFlash = penaltyAlertKey > 0 && dismissedPenaltyKey !== penaltyAlertKey
  const showComboFlash = comboAlert?.key > 0 && dismissedComboKey !== comboAlert.key

  useEffect(() => {
    if (penaltyAlertKey <= 0) return undefined
    const timer = setTimeout(() => {
      setDismissedPenaltyKey(penaltyAlertKey)
    }, 1500)
    return () => clearTimeout(timer)
  }, [penaltyAlertKey])

  useEffect(() => {
    if (!comboAlert?.key) return undefined
    const timer = setTimeout(() => {
      setDismissedComboKey(comboAlert.key)
    }, 2400)
    return () => clearTimeout(timer)
  }, [comboAlert?.key])

  const isCouncilReady = ceoBriefingDismissed && councilEntranceState === 'done'
  const showSideHud =
    (screen === 'TRIBUNAL_HUB' && isCouncilReady) || screen === 'FINAL_RANKING'
  const showSealDrawer = showSideHud && !mazeModal
  const showMapButton = screen === 'TRIBUNAL_HUB' && isCouncilReady && !mazeModal
  const keepMazeMounted = screen === 'TRANSITION_ARRIVAL' || screen === 'TRIBUNAL_HUB'
  const showMazeModal = screen === 'TRIBUNAL_HUB' && Boolean(mazeModal)

  if (!showSideHud && !keepMazeMounted) {
    return null
  }

  const totalMembers = challenges.length || MAZE_STEPS

  return (
    <>
      {/* HUD Superior: Identificação na esquerda + Cronômetro na direita */}
      {showSideHud && (
        <header className="fixed top-0 inset-x-0 z-50 pointer-events-none py-3 px-4 sm:px-8 animate-hud-enter">
          <div className="max-w-6xl w-full mx-auto flex items-start justify-between gap-4">
            {/* Bloco Esquerdo Flutuante: Identificação + Progresso + Combo */}
            <div className="pointer-events-auto hidden sm:flex items-center gap-3.5 bg-[#FDFBF7]/95 backdrop-blur-md border-2 border-stone-800 border-l-4 border-l-[#D99B38] rounded-none px-3.5 py-2 shadow-[4px_4px_0px_#1C1917]">
              <div className="w-8 h-8 rounded-none bg-[#D99B38] text-stone-950 flex items-center justify-center shrink-0">
                <Shield className="w-4 h-4" />
              </div>

              <div className="pr-3 border-r border-stone-300">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-900 leading-tight">
                  CONSELHO NEXT<span className="text-[#D99B38]">.</span>
                </div>
                {player && (
                  <div className="text-[11px] text-stone-600 flex items-center gap-1.5 font-semibold mt-0.5">
                    <User className="w-3 h-3 text-[#B87D1E] shrink-0" />
                    <span className="truncate max-w-[140px] text-stone-900">{player.nome}</span>
                    <span className="text-stone-400">/</span>
                    <span className="text-[#B87D1E] uppercase tracking-wider text-[10px] font-bold">
                      {player.setor}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2.5 pl-0.5">
                <div className="flex items-center gap-1">
                  {challenges.map((m) => {
                    const isDone = memberProgress[m.id]?.completed
                    return (
                      <span
                        key={m.id}
                        title={`${m.name}: ${isDone ? 'Aprovado' : 'Pendente'}`}
                        className={`w-2.5 h-3.5 rounded-none border transition-all duration-300 ${
                          isDone
                            ? 'bg-emerald-600 border-emerald-800 scale-105'
                            : 'bg-[#EBE4D5] border-stone-400'
                        }`}
                      />
                    )
                  })}
                </div>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#F5F0E6] border border-stone-300 text-[11px] font-mono font-black text-stone-900">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                  <span>
                    {completedCount}/{totalMembers}
                  </span>
                </span>

                {screen === 'TRIBUNAL_HUB' && (
                  <span
                    title="Sequência atual de acertos de primeira (3 seguidos = -5s)"
                    className={`inline-flex items-center gap-1 px-2 py-0.5 border text-[10px] font-mono font-black transition-colors ${
                      comboAtual > 0
                        ? 'bg-amber-100 border-amber-500 text-amber-900'
                        : 'bg-stone-100 border-stone-300 text-stone-500'
                    }`}
                  >
                    <Flame className="w-3 h-3 text-[#B87D1E]" />
                    <span>{comboAtual}/3</span>
                  </span>
                )}
              </div>
            </div>

            {/* Bloco Direito Flutuante: Cronômetro Global + Alerta de Penalidade / Combo */}
            <div className="pointer-events-auto ml-auto relative">
              <div
                className={`flex items-center gap-3.5 bg-[#FDFBF7]/95 backdrop-blur-md border-2 rounded-none px-3.5 sm:px-4 py-2 shadow-[4px_4px_0px_#1C1917] transition-all duration-300 ${
                  showPenaltyFlash
                    ? 'border-red-600 border-r-4 border-r-red-600 scale-[1.03]'
                    : showComboFlash
                      ? 'border-emerald-600 border-r-4 border-r-emerald-600 scale-[1.03]'
                      : isTimerPausedForApproval && screen === 'TRIBUNAL_HUB'
                        ? 'border-emerald-700 border-r-4 border-r-emerald-600'
                        : 'border-stone-800 border-r-4 border-r-[#D99B38]'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-none flex items-center justify-center shrink-0 transition-colors duration-300 ${
                    showPenaltyFlash
                      ? 'bg-red-600 text-white'
                      : showComboFlash || (isTimerPausedForApproval && screen === 'TRIBUNAL_HUB')
                        ? 'bg-emerald-600 text-white'
                        : 'bg-[#D99B38] text-stone-950'
                  }`}
                >
                  {isTimerPausedForApproval && screen === 'TRIBUNAL_HUB' && !showPenaltyFlash ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Clock className="w-4 h-4" />
                  )}
                </div>

                <div className="text-right">
                  <div className="text-[9px] font-black uppercase tracking-[0.2em] leading-tight flex items-center justify-end gap-1.5">
                    {isTimerPausedForApproval && screen === 'TRIBUNAL_HUB' ? (
                      <span className="text-emerald-700">Pausado</span>
                    ) : (
                      <span className="text-stone-500">Tempo Total</span>
                    )}
                  </div>
                  <div className="font-mono text-lg sm:text-xl font-black leading-none tracking-tight text-stone-900 mt-0.5">
                    {formatarTempo(totalSeconds)}
                  </div>
                </div>

                {(penaltySeconds > 0 || bonusSeconds > 0) && (
                  <div className="pl-3 border-l border-stone-300 text-right space-y-0.5">
                    {penaltySeconds > 0 && (
                      <div className="font-mono text-[11px] font-black text-red-600 leading-tight">
                        +{penaltySeconds}s erro
                      </div>
                    )}
                    {bonusSeconds > 0 && (
                      <div className="font-mono text-[11px] font-black text-emerald-700 leading-tight">
                        -{bonusSeconds}s bônus
                      </div>
                    )}
                    <div className="text-[9px] text-stone-500 font-mono leading-tight">
                      Base: {formatarTempo(realSeconds)}
                    </div>
                  </div>
                )}
              </div>

              {/* Alerta flutuante de penalidade (+5s ou +10s) */}
              <div
                className={`absolute top-full right-0 mt-2 sm:top-1/2 sm:-translate-y-1/2 sm:right-full sm:mt-0 sm:mr-2.5 transition-all duration-300 ${
                  showPenaltyFlash
                    ? 'opacity-100 translate-y-0 sm:translate-x-0 scale-100'
                    : 'opacity-0 -translate-y-2 sm:translate-y-0 sm:translate-x-2 scale-95 pointer-events-none'
                }`}
              >
                <div className="flex items-center gap-1.5 bg-red-600 text-white text-[11px] font-black uppercase tracking-[0.18em] px-3.5 py-2 rounded-none shadow-[4px_4px_0px_#1C1917] border-2 border-stone-900">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span className="whitespace-nowrap">+{penaltyAlertSeconds}s de Penalidade!</span>
                </div>
              </div>

              {/* Alerta flutuante de bônus (Combo -5s / Invicto -10s) */}
              <div
                className={`absolute top-full right-0 mt-2 sm:top-1/2 sm:-translate-y-1/2 sm:right-full sm:mt-0 sm:mr-2.5 transition-all duration-300 ${
                  showComboFlash && !showPenaltyFlash
                    ? 'opacity-100 translate-y-0 sm:translate-x-0 scale-100'
                    : 'opacity-0 -translate-y-2 sm:translate-y-0 sm:translate-x-2 scale-95 pointer-events-none'
                }`}
              >
                <div className="flex items-center gap-1.5 bg-emerald-600 text-white text-[11px] font-black uppercase tracking-[0.18em] px-3.5 py-2 rounded-none shadow-[4px_4px_0px_#1C1917] border-2 border-stone-900">
                  <Flame className="w-3.5 h-3.5 shrink-0" />
                  <span className="whitespace-nowrap">{comboAlert?.label || 'Bônus!'}</span>
                </div>
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Gaveta retrátil na lateral direita com os 7 Selos de Cera */}
      {showSealDrawer && <SealCaseDrawer />}

      {/* Botão Flutuante Discreto no Canto Inferior Direito para Visualizar o Mapa 3D */}
      {showMapButton && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-8 z-[45] pointer-events-auto animate-maze-enter">
          <button
            type="button"
            onClick={openManualMazeModal}
            className="group inline-flex items-center gap-2.5 px-4 py-2.5 bg-[#FDFBF7] hover:bg-[#D99B38] text-stone-900 border-2 border-stone-900 rounded-none font-black text-xs uppercase tracking-[0.16em] shadow-[4px_4px_0px_#1C1917] hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#1C1917] active:scale-95 transition-all cursor-pointer"
          >
            <Compass className="w-4 h-4 text-[#B87D1E] group-hover:text-stone-950 transition-colors" />
            <span>Visualizar Mapa</span>
            <span className="px-1.5 py-0.5 bg-[#F5F0E6] group-hover:bg-white/80 border border-stone-800 font-mono text-[10px]">
              {completedCount}/{totalMembers}
            </span>
          </button>
        </div>
      )}

      {/* Modal 3D: pré-aquecido durante a chegada/briefing e mantido em cache durante o Tribunal */}
      {keepMazeMounted && (
        <Suspense
          fallback={
            showMazeModal ? (
              <div className="fixed inset-0 z-[60] bg-stone-950/60 backdrop-blur-[2px] flex items-center justify-center p-4">
                <div className="bg-[#FDFBF7] border-2 border-stone-900 px-6 py-4 shadow-[6px_6px_0px_#1C1917] flex items-center gap-3 text-xs font-black uppercase tracking-[0.18em] text-stone-900">
                  <Loader2 className="w-4 h-4 animate-spin text-[#B87D1E]" />
                  <span>Carregando Maquete 3D...</span>
                </div>
              </div>
            ) : null
          }
        >
          <MazeModal3D
            modalState={showMazeModal ? mazeModal : null}
            onConfirmIntro={confirmIntroMazeAndStart}
            onClose={closeMazeModal}
          />
        </Suspense>
      )}
    </>
  )
}

export default HudTimerHeader
