import { useState } from 'react'
import {
  AlarmClockOff,
  BookOpen,
  CheckCircle2,
  Clock,
  Presentation,
  TrendingUp,
  XCircle,
} from 'lucide-react'

function getPurposeOptionIcon(text = '') {
  const lower = text.toLowerCase()
  if (lower.includes('resultado')) return TrendingUp
  if (lower.includes('atrasad')) return AlarmClockOff
  if (lower.includes('contáb') || lower.includes('contab')) return BookOpen
  return Clock
}

/**
 * C03 · Vanessa — Telão da reunião "Conexão Next".
 * Projeta a frase em foco no telão principal e encaixa o propósito escolhido ao clicar.
 */
function VanessaPurposeChallenge({
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
      {/* Mini Telão da Reunião Conexão Next */}
      <div className="relative bg-gradient-to-br from-stone-900 via-stone-900 to-amber-950/90 text-white border-2 border-stone-900 border-b-4 border-b-[#D99B38] p-4 shadow-[4px_4px_0px_rgba(28,25,23,0.25)]">
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-[#D99B38] text-stone-950 text-[10px] font-black uppercase tracking-[0.16em]">
            <Presentation className="w-3 h-3" />
            <span>Conexão Next</span>
          </span>
          <span className="text-[10px] font-mono uppercase tracking-wider text-amber-200/80">
            Slide Oficial · Propósito
          </span>
        </div>

        <div className="text-center py-1 space-y-2">
          <div className="text-[11px] font-black uppercase tracking-[0.22em] text-amber-300/90">
            Ser Next...
          </div>
          <div
            className={`min-h-[2.6rem] px-3 py-2 border-2 flex items-center justify-center text-sm sm:text-base font-black tracking-tight transition-all duration-200 ${
              isApprovedState
                ? 'bg-emerald-600/30 border-emerald-400 text-emerald-100'
                : previewOption
                  ? 'bg-amber-400/15 border-amber-300 text-amber-100'
                  : 'bg-stone-950/50 border-dashed border-amber-400/60 text-stone-400'
            }`}
          >
            {previewOption ? `“${previewOption.text}”` : 'Escolha o cartão que define nosso propósito'}
          </div>
        </div>
      </div>

      {/* 4 cartões de tópico com ícones */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {options.map((option, idx) => {
          const isOptionDisabled = disabledOptions.includes(option.id)
          const isHighlightedSuccess = isApprovedState && selectedOptionId === option.id
          const OptionIcon = getPurposeOptionIcon(option.text)

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
                    : 'bg-white hover:bg-amber-50/80 border-stone-300 hover:border-stone-900 hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#1C1917] text-stone-800 cursor-pointer active:scale-[0.99] disabled:opacity-60 disabled:pointer-events-none'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className={`w-8 h-8 border flex items-center justify-center shrink-0 transition-colors ${
                    isHighlightedSuccess
                      ? 'bg-emerald-600 text-white border-emerald-700'
                      : isOptionDisabled
                        ? 'bg-red-100 text-red-500 border-red-200'
                        : 'bg-[#F5F0E6] text-stone-900 border-stone-300 group-hover:bg-amber-400 group-hover:border-stone-900'
                  }`}
                >
                  <OptionIcon className="w-4 h-4" />
                </span>
                <span
                  className={`text-xs sm:text-sm font-bold leading-snug ${
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

export default VanessaPurposeChallenge
