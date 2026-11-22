import { useState } from 'react'
import {
  Cake,
  CalendarDays,
  CheckCircle2,
  HeartHandshake,
  PartyPopper,
  Pizza,
  XCircle,
} from 'lucide-react'

const WEEK_DAYS = ['SEG', 'TER', 'QUA', 'QUI', 'SEX']
// Grade compacta de 4 semanas úteis destacando a última quarta-feira do mês (dia 26)
const CALENDAR_WEEKS = [
  [3, 4, 5, 6, 7],
  [10, 11, 12, 13, 14],
  [17, 18, 19, 20, 21],
  [24, 25, 26, 27, 28],
]
const HIGHLIGHT_DAY = 26

function EventIcon({ text = '', fallback = false, className = 'w-4 h-4' }) {
  if (fallback || !text) return <CalendarDays className={className} />
  const lower = text.toLowerCase()
  if (lower.includes('pizza')) return <Pizza className={className} />
  if (lower.includes('anivers')) return <Cake className={className} />
  if (lower.includes('outubro')) return <HeartHandshake className={className} />
  return <PartyPopper className={className} />
}

/**
 * C04 · Jhonny — Calendário Corporativo com a última quarta-feira destacada + 4 adesivos de evento.
 */
function JhonnyCalendarChallenge({
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
      {/* Mini Calendário Corporativo + Adesivo da Última Semana */}
      <div className="bg-[#F5F0E6] border-2 border-stone-900 p-3 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
        {/* Grade do mês */}
        <div className="sm:col-span-7 bg-white border border-stone-300 p-2">
          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.14em] text-stone-700 pb-1.5 mb-1.5 border-b border-stone-200">
            <span className="inline-flex items-center gap-1 text-purple-800">
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Agenda Interna · Mês</span>
            </span>
            <span className="text-[9px] font-mono text-purple-700">Última semana</span>
          </div>

          <div className="grid grid-cols-5 gap-1 text-center font-mono text-[9px] font-black text-stone-400 mb-1">
            {WEEK_DAYS.map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>

          <div className="space-y-1">
            {CALENDAR_WEEKS.map((week, wIdx) => (
              <div
                key={wIdx}
                className={`grid grid-cols-5 gap-1 text-center font-mono text-[10px] ${
                  wIdx === 3 ? 'bg-purple-50 py-0.5 border border-purple-200' : ''
                }`}
              >
                {week.map((day) => {
                  const isTarget = day === HIGHLIGHT_DAY
                  return (
                    <span
                      key={day}
                      className={`py-0.5 font-bold ${
                        isTarget
                          ? isApprovedState
                            ? 'bg-emerald-600 text-white font-black ring-2 ring-emerald-300'
                            : 'bg-purple-600 text-white font-black ring-2 ring-purple-300'
                          : 'text-stone-600'
                      }`}
                    >
                      {day}
                    </span>
                  )
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Lembrete/adesivo colado na última quarta-feira */}
        <div
          className={`sm:col-span-5 h-full min-h-[104px] border-2 p-3 flex flex-col items-center justify-center text-center gap-1.5 transition-all duration-200 ${
            isApprovedState
              ? 'bg-emerald-50 border-emerald-600 text-emerald-950'
              : previewOption
                ? 'bg-purple-50 border-purple-600 text-purple-950'
                : 'bg-white border-dashed border-purple-400 text-stone-500'
          }`}
        >
          <span className="text-[9px] font-black uppercase tracking-[0.16em] text-purple-700">
            Última Semana
          </span>
          <div
            className={`w-10 h-10 border-2 flex items-center justify-center ${
              isApprovedState
                ? 'bg-emerald-600 text-white border-stone-900'
                : previewOption
                  ? 'bg-purple-500 text-white border-stone-900'
                  : 'bg-[#F5F0E6] text-stone-400 border-stone-300'
            }`}
          >
            <EventIcon
              text={previewOption?.text}
              fallback={!previewOption}
              className="w-5 h-5"
            />
          </div>
          <span className="text-xs font-black leading-tight">
            {previewOption ? previewOption.text : 'Cole o evento oficial'}
          </span>
        </div>
      </div>

      {/* 4 adesivos de eventos */}
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
              onClick={() => {
                setLocalHoveredId(null)
                onSelectOption(option.id)
              }}
              style={{ animationDelay: `${idx * 55}ms` }}
              className={`group w-full text-left p-3 border-2 flex items-center justify-between gap-2 animate-panel-rise transition-all duration-200 ${
                isHighlightedSuccess
                  ? 'bg-emerald-50 border-emerald-600 text-emerald-950 shadow-[3px_3px_0px_#059669]'
                  : isOptionDisabled
                    ? 'bg-red-50/70 border-red-200 text-stone-400 cursor-not-allowed'
                    : 'bg-white hover:bg-purple-50/80 border-stone-300 hover:border-stone-900 hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#1C1917] text-stone-800 cursor-pointer active:scale-[0.99] disabled:opacity-60 disabled:pointer-events-none'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className={`w-8 h-8 border flex items-center justify-center shrink-0 transition-colors ${
                    isHighlightedSuccess
                      ? 'bg-emerald-600 text-white border-emerald-700'
                      : isOptionDisabled
                        ? 'bg-red-100 text-red-500 border-red-200'
                        : 'bg-purple-100 text-purple-900 border-purple-300 group-hover:bg-purple-500 group-hover:text-white group-hover:border-stone-900'
                  }`}
                >
                  <EventIcon text={option.text} className="w-4 h-4" />
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

export default JhonnyCalendarChallenge
