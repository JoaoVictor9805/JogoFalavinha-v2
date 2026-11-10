import { useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle2, Clock, Shield, User } from 'lucide-react'
import { useGame } from '../../context/gameContextInstance'
import { COUNCIL_MEMBERS } from '../../data/conselhoNextData'
import { formatarTempo } from '../../utils/validacaoDesafio'

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

  if (screen === 'REGISTRATION') return null

  return (
    <header className="fixed top-0 inset-x-0 z-50 pointer-events-none px-4 sm:px-8 py-3.5 flex items-start justify-between gap-4">
      {/* Bloco Esquerdo: Identificação + Progresso de Aprovações do Conselho */}
      <div className="pointer-events-auto hidden sm:flex items-center gap-3.5 bg-slate-950/90 backdrop-blur-md border border-slate-800/90 rounded-2xl px-4 py-2.5 shadow-xl">
        <div className="w-9 h-9 rounded-xl bg-teal-500/15 border border-teal-400/40 flex items-center justify-center text-teal-400">
          <Shield className="w-5 h-5" />
        </div>

        <div className="pr-2 border-r border-slate-800">
          <div className="text-[10px] font-bold uppercase tracking-widest text-teal-400">
            Conselho Next
          </div>
          {player && (
            <div className="text-xs text-slate-300 flex items-center gap-1.5 font-medium">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span className="truncate max-w-[140px]">{player.nome}</span>
              <span className="text-slate-500">·</span>
              <span className="text-slate-400">{player.setor}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 pl-1">
          <div className="flex items-center gap-1">
            {COUNCIL_MEMBERS.map((m) => {
              const isDone = memberProgress[m.id]?.completed
              return (
                <span
                  key={m.id}
                  title={`${m.name}: ${isDone ? 'Aprovado' : 'Pendente'}`}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${isDone
                      ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] scale-110'
                      : 'bg-slate-700'
                    }`}
                />
              )
            })}
          </div>
          <span className="text-xs font-bold text-slate-300 ml-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 inline mr-1 -mt-0.5" />
            {completedCount}/7
          </span>
        </div>
      </div>

      {/* Bloco Direito Fixo em Destaque: Cronômetro Global + Indicador de Penalidade (+5s) */}
      <div className="pointer-events-auto ml-auto flex flex-col items-end gap-2">
        <div
          className={`flex items-center gap-3.5 bg-slate-950/95 backdrop-blur-md border-2 rounded-2xl px-4 sm:px-5 py-2.5 shadow-2xl transition-all duration-300 ${showPenaltyFlash
              ? 'border-red-500 shadow-red-500/30 scale-105'
              : 'border-teal-500/40 shadow-black/60'
            }`}
        >
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors duration-300 ${showPenaltyFlash
                ? 'bg-red-500/20 text-red-400'
                : 'bg-amber-400/15 text-amber-400'
              }`}
          >
            <Clock className="w-5 h-5" />
          </div>

          <div className="text-right">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Tempo Total
            </div>
            <div className="font-mono text-xl sm:text-2xl font-extrabold leading-none tracking-tight text-amber-400">
              {formatarTempo(totalSeconds)}
            </div>
          </div>

          {penaltySeconds > 0 && (
            <div className="pl-3 border-l border-slate-800 text-right">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-red-400">
                Penalidades
              </div>
              <div className="font-mono text-xs sm:text-sm font-bold text-red-400">
                +{penaltySeconds}s
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                Base: {formatarTempo(realSeconds)}
              </div>
            </div>
          )}
        </div>

        {/* Alerta Flutuante de +5s quando o jogador erra */}
        <div
          className={`transition-all duration-300 ${showPenaltyFlash
              ? 'opacity-100 translate-y-0 scale-100'
              : 'opacity-0 -translate-y-2 scale-95 pointer-events-none'
            }`}
        >
          <div className="flex items-center gap-1.5 bg-red-600 text-white text-xs font-extrabold uppercase tracking-wider px-3.5 py-1.5 rounded-full shadow-lg shadow-red-600/40 border border-red-300 animate-bounce">
            <AlertTriangle className="w-4 h-4" />
            <span>+5s de Penalidade!</span>
          </div>
        </div>
      </div>
    </header>
  )
}

export default HudTimerHeader
