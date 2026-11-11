import { useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle2, Clock, Compass, Shield, User } from 'lucide-react'
import { useGame } from '../../context/gameContextInstance'
import { COUNCIL_MEMBERS } from '../../data/conselhoNextData'
import { formatarTempo } from '../../utils/validacaoDesafio'
import MazeModal3D from '../maze3d/MazeModal3D'
import { MAZE_STEPS } from '../maze3d/mazeData'

function HudTimerHeader() {
  const {
    screen,
    player,
    realSeconds,
    penaltySeconds,
    totalSeconds,
    penaltyAlertKey,
    completedCount,
    memberProgress,
    ceoBriefingDismissed,
    mazeModal,
    openManualMazeModal,
    confirmIntroMazeAndStart,
    closeMazeModal,
  } = useGame()

  const [dismissedAlertKey, setDismissedAlertKey] = useState(0)
  const showPenaltyFlash = penaltyAlertKey > 0 && dismissedAlertKey !== penaltyAlertKey

  useEffect(() => {
    if (penaltyAlertKey <= 0) return undefined
    const timer = setTimeout(() => {
      setDismissedAlertKey(penaltyAlertKey)
    }, 1400)
    return () => clearTimeout(timer)
  }, [penaltyAlertKey])

  const showSideHud =
    (screen === 'TRIBUNAL_HUB' && ceoBriefingDismissed) || screen === 'FINAL_RANKING'
  const showMapButton = screen === 'TRIBUNAL_HUB' && ceoBriefingDismissed && !mazeModal
  const showMazeModal = screen === 'TRIBUNAL_HUB' && Boolean(mazeModal)

  if (!showSideHud && !showMazeModal) {
    return null
  }

  return (
    <>
      {/* HUD Superior: Identificação na esquerda + Cronômetro na direita */}
      {showSideHud && (
        <header className="fixed top-0 inset-x-0 z-50 pointer-events-none py-3 px-4 sm:px-8 animate-hud-enter">
          <div className="max-w-6xl w-full mx-auto flex items-start justify-between gap-4">
            {/* Bloco Esquerdo Flutuante: Identificação + Progresso de Aprovações */}
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
                  {COUNCIL_MEMBERS.map((m) => {
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
                  <span>{completedCount}/7</span>
                </span>
              </div>
            </div>

            {/* Bloco Direito Flutuante: Cronômetro Global + Alerta de Penalidade ao lado */}
            <div className="pointer-events-auto ml-auto relative">
              <div
                className={`flex items-center gap-3.5 bg-[#FDFBF7]/95 backdrop-blur-md border-2 rounded-none px-3.5 sm:px-4 py-2 shadow-[4px_4px_0px_#1C1917] transition-all duration-300 ${
                  showPenaltyFlash
                    ? 'border-red-600 border-r-4 border-r-red-600 scale-[1.03]'
                    : 'border-stone-800 border-r-4 border-r-[#D99B38]'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-none flex items-center justify-center shrink-0 transition-colors duration-300 ${
                    showPenaltyFlash ? 'bg-red-600 text-white' : 'bg-[#D99B38] text-stone-950'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                </div>

                <div className="text-right">
                  <div className="text-[9px] font-black uppercase tracking-[0.2em] text-stone-500 leading-tight">
                    Tempo Total
                  </div>
                  <div className="font-mono text-lg sm:text-xl font-black leading-none tracking-tight text-stone-900 mt-0.5">
                    {formatarTempo(totalSeconds)}
                  </div>
                </div>

                {penaltySeconds > 0 && (
                  <div className="pl-3 border-l border-stone-300 text-right">
                    <div className="text-[9px] font-black uppercase tracking-[0.16em] text-red-600 leading-tight">
                      Penalidades
                    </div>
                    <div className="font-mono text-xs font-black text-red-600 leading-tight">
                      +{penaltySeconds}s
                    </div>
                    <div className="text-[9px] text-stone-500 font-mono leading-tight">
                      Base: {formatarTempo(realSeconds)}
                    </div>
                  </div>
                )}
              </div>

              {/* Alerta flutuante de +5s ao lado esquerdo do relógio no desktop (ou abaixo no mobile) */}
              <div
                className={`absolute top-full right-0 mt-2 sm:top-1/2 sm:-translate-y-1/2 sm:right-full sm:mt-0 sm:mr-2.5 transition-all duration-300 ${
                  showPenaltyFlash
                    ? 'opacity-100 translate-y-0 sm:translate-x-0 scale-100'
                    : 'opacity-0 -translate-y-2 sm:translate-y-0 sm:translate-x-2 scale-95 pointer-events-none'
                }`}
              >
                <div className="flex items-center gap-1.5 bg-red-600 text-white text-[11px] font-black uppercase tracking-[0.18em] px-3.5 py-2 rounded-none shadow-[4px_4px_0px_#1C1917] border-2 border-stone-900">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span className="whitespace-nowrap">+5s de Penalidade!</span>
                </div>
              </div>
            </div>
          </div>
        </header>
      )}

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
              {completedCount}/{MAZE_STEPS}
            </span>
          </button>
        </div>
      )}

      {/* Modal 3D: Abertura do CEO, Avanço automático por resposta certa ou Visualização manual */}
      {showMazeModal && (
        <MazeModal3D
          key={`${mazeModal.mode}-${mazeModal.fromStep}-${mazeModal.toStep}`}
          modalState={mazeModal}
          onConfirmIntro={confirmIntroMazeAndStart}
          onClose={closeMazeModal}
        />
      )}
    </>
  )
}

export default HudTimerHeader
