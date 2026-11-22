import { useState } from 'react'
import { CheckCircle2, Sparkles, XCircle } from 'lucide-react'

const FIXED_OFFICIAL_VALUES = [
  'Velocidade com precisão',
  'Compromisso total com o cliente',
  'Pessoas que fazem a diferença',
  'Tecnologia como alicerce',
  'Foco na solução, e não no problema',
]

/**
 * C02 · Ramon — Placa Oficial dos 6 Valores da Falavinha Next.
 * Exibe os outros 5 valores oficiais já gravados e convida o jogador a completar o 6º pilar.
 */
function RamonValuesChallenge({
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

  const previewOption = isApprovedState
    ? options.find((o) => o.id === selectedOptionId) || null
    : localHoveredId && !disabledOptions.includes(localHoveredId)
      ? options.find((o) => o.id === localHoveredId) || null
      : null

  return (
    <div className="space-y-3.5">
      {/* Placa Oficial de Cultura da Falavinha Next */}
      <div className="bg-stone-900 text-[#FDFBF7] border-2 border-stone-900 border-t-4 border-t-teal-400 p-3.5 shadow-[4px_4px_0px_rgba(28,25,23,0.22)]">
        <div className="flex items-center justify-between gap-2 pb-2 mb-2.5 border-b border-stone-700">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-teal-300">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Quadro Oficial · 6 Valores Falavinha Next</span>
          </span>
          <span className="font-mono text-[10px] font-bold text-stone-400">
            {isApprovedState ? '6/6' : '5/6'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] sm:text-xs">
          {FIXED_OFFICIAL_VALUES.map((val, idx) => (
            <div
              key={val}
              className="flex items-center gap-2 bg-stone-800/80 border border-stone-700/80 px-2.5 py-1.5"
            >
              <span className="font-mono text-[10px] font-black text-teal-300 shrink-0">
                0{idx + 1}
              </span>
              <span className="font-semibold text-stone-100 truncate">{val}</span>
            </div>
          ))}

          {/* 6º espaço: pré-visualiza o valor em foco ou trava no aprovado */}
          <div
            className={`flex items-center gap-2 px-2.5 py-1.5 border transition-all duration-200 ${
              isApprovedState
                ? 'bg-emerald-600/25 border-emerald-400 text-emerald-100'
                : previewOption
                  ? 'bg-teal-500/20 border-teal-400 text-teal-100'
                  : 'bg-stone-950/60 border-dashed border-[#D99B38] text-[#D99B38]'
            }`}
          >
            <span className="font-mono text-[10px] font-black shrink-0">06</span>
            <span className="font-bold truncate">
              {previewOption ? previewOption.text : 'Qual completa a lista oficial?'}
            </span>
          </div>
        </div>
      </div>

      {/* 4 plaquinhas candidatas para completar o 6º valor oficial */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
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
              onClick={() => {
                setLocalHoveredId(null)
                onSelectOption(option.id)
              }}
              style={{ animationDelay: `${idx * 55}ms` }}
              className={`group w-full text-left p-3 border-2 flex items-center justify-between gap-2.5 animate-panel-rise transition-all duration-200 ${
                isHighlightedSuccess
                  ? 'bg-emerald-50 border-emerald-600 text-emerald-950 shadow-[3px_3px_0px_#059669]'
                  : isOptionDisabled
                    ? 'bg-red-50/70 border-red-200 text-stone-400 cursor-not-allowed'
                    : 'bg-white hover:bg-teal-50/70 border-stone-300 hover:border-stone-900 hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#1C1917] text-stone-800 cursor-pointer active:scale-[0.99] disabled:opacity-60 disabled:pointer-events-none'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className={`w-7 h-7 font-mono text-xs font-black flex items-center justify-center shrink-0 transition-colors ${
                    isHighlightedSuccess
                      ? 'bg-emerald-600 text-white'
                      : isOptionDisabled
                        ? 'bg-red-100 text-red-500 border border-red-200'
                        : 'bg-stone-900 text-white group-hover:bg-teal-400 group-hover:text-stone-950'
                  }`}
                >
                  {option.label}
                </span>
                <span
                  className={`text-sm font-bold leading-snug ${
                    isOptionDisabled ? 'line-through text-stone-400' : 'text-stone-900'
                  }`}
                >
                  {option.text}
                </span>
              </div>

              {isOptionDisabled && (
                <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-red-600 shrink-0">
                  <XCircle className="w-3.5 h-3.5" />
                  <span>
                    {isBlockedState && selectedOptionId === option.id ? '+10s' : '+5s'}
                  </span>
                </span>
              )}

              {isHighlightedSuccess && (
                <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-emerald-700 shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default RamonValuesChallenge
