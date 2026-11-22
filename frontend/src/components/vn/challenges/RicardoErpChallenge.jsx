import { useState } from 'react'
import { ArrowRight, CheckCircle2, Cpu, Layers, Monitor, XCircle } from 'lucide-react'
import { playSystemBootSound } from '../../../utils/soundEffects'

/**
 * C06 · Ricardo — Central de Sistemas (visual corporativo amigável, zero jargão técnico).
 * O jogador escolhe qual ERP oficial inicializar para integrar todos os setores.
 */
function RicardoErpChallenge({
  options,
  disabledOptions,
  selectedOptionId,
  isApprovedState,
  isBlockedState,
  isLocked,
  onHoverOption,
  onSelectOption,
}) {
  const [localHoveredId, setLocalHoveredId] = useState(null)

  const activePreview = isApprovedState
    ? options.find((o) => o.id === selectedOptionId) || null
    : localHoveredId && !disabledOptions.includes(localHoveredId)
      ? options.find((o) => o.id === localHoveredId) || null
      : null

  const handleLaunchSystem = (optionId) => {
    setLocalHoveredId(null)
    playSystemBootSound()
    onSelectOption(optionId)
  }

  return (
    <div className="bg-slate-900 border-2 border-stone-900 shadow-[4px_4px_0px_rgba(28,25,23,0.28)] overflow-hidden">
      {/* Barra superior estilo janela corporativa moderna */}
      <div className="bg-slate-950 px-3.5 py-2.5 border-b border-slate-700 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex items-center gap-1 shrink-0" aria-hidden="true">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/80" />
          </span>
          <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-black uppercase tracking-[0.16em] text-cyan-300 truncate">
            <Monitor className="w-3.5 h-3.5 shrink-0" />
            <span>Central de Sistemas · Falavinha Next</span>
          </span>
        </div>

        <span
          className={`px-2 py-0.5 text-[9px] font-mono font-black uppercase border shrink-0 ${
            isApprovedState
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/60'
              : 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40'
          }`}
        >
          {isApprovedState ? 'Integrado' : 'ERP'}
        </span>
      </div>

      {/* Área interna com os 4 aplicativos/sistemas para iniciar */}
      <div className="p-3.5 space-y-3">
        <div className="flex items-center justify-between gap-2 bg-slate-800/80 border border-slate-700 px-3 py-2 text-xs text-slate-200">
          <div className="flex items-center gap-2 min-w-0">
            <Layers className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="font-semibold truncate">
              {isApprovedState
                ? `${activePreview?.text || 'ERP'} iniciado — todos os setores conectados!`
                : activePreview
                  ? `Clique para iniciar o sistema ${activePreview.text}`
                  : 'Escolha qual sistema ERP você deseja iniciar:'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {options.map((option, idx) => {
            const isOptionDisabled = disabledOptions.includes(option.id)
            const isHighlightedSuccess = isApprovedState && selectedOptionId === option.id

            return (
              <button
                key={option.id}
                type="button"
                disabled={isLocked || isOptionDisabled || isApprovedState || isBlockedState}
                onMouseEnter={() => {
                  if (!isOptionDisabled && !isApprovedState && !isBlockedState) {
                    setLocalHoveredId(option.id)
                    onHoverOption(option.id)
                  }
                }}
                onMouseLeave={() => {
                  setLocalHoveredId(null)
                  onHoverOption(null)
                }}
                onFocus={() => {
                  if (!isOptionDisabled && !isApprovedState && !isBlockedState) {
                    setLocalHoveredId(option.id)
                    onHoverOption(option.id)
                  }
                }}
                onBlur={() => {
                  setLocalHoveredId(null)
                  onHoverOption(null)
                }}
                onClick={() => handleLaunchSystem(option.id)}
                style={{ animationDelay: `${idx * 55}ms` }}
                className={`group text-left border-2 p-3 flex flex-col justify-between gap-2.5 animate-panel-rise transition-all duration-200 ${
                  isHighlightedSuccess
                    ? 'bg-emerald-950/90 border-emerald-400 text-emerald-100 shadow-[3px_3px_0px_#10b981]'
                    : isOptionDisabled
                      ? 'bg-slate-900/60 border-red-900/60 text-slate-500 cursor-not-allowed'
                      : 'bg-slate-800/90 hover:bg-slate-700/90 border-slate-600 hover:border-cyan-400 hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#22d3ee] text-white cursor-pointer active:scale-[0.99] disabled:opacity-60 disabled:pointer-events-none'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`w-8 h-8 border flex items-center justify-center shrink-0 transition-colors ${
                      isHighlightedSuccess
                        ? 'bg-emerald-500 text-slate-950 border-emerald-300'
                        : isOptionDisabled
                          ? 'bg-red-950/70 text-red-400 border-red-800/70'
                          : 'bg-slate-950 text-cyan-300 border-slate-600 group-hover:bg-cyan-400 group-hover:text-slate-950 group-hover:border-cyan-300'
                    }`}
                  >
                    <Cpu className="w-4 h-4" />
                  </span>

                  {isOptionDisabled ? (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-red-400">
                      <XCircle className="w-3.5 h-3.5" />
                      <span>
                        {isBlockedState && selectedOptionId === option.id ? '+10s' : '+5s'}
                      </span>
                    </span>
                  ) : isHighlightedSuccess ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-emerald-300">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Ativo</span>
                    </span>
                  ) : (
                    <span className="font-mono text-[10px] font-bold text-slate-400">
                      {option.label}
                    </span>
                  )}
                </div>

                <div>
                  <div
                    className={`text-sm sm:text-base font-black tracking-tight ${
                      isOptionDisabled ? 'line-through text-slate-500' : 'text-white'
                    }`}
                  >
                    {option.text}
                  </div>
                  <div
                    className={`mt-0.5 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider ${
                      isHighlightedSuccess
                        ? 'text-emerald-300'
                        : isOptionDisabled
                          ? 'text-red-400/80'
                          : 'text-cyan-300/90 group-hover:text-cyan-200'
                    }`}
                  >
                    <span>
                      {isHighlightedSuccess
                        ? 'Sistema conectado'
                        : isOptionDisabled
                          ? 'Indisponível'
                          : 'Iniciar sistema'}
                    </span>
                    {!isOptionDisabled && !isHighlightedSuccess && (
                      <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default RicardoErpChallenge
