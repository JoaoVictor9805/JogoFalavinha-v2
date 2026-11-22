import { useEffect, useState } from 'react'
import { CheckCircle2, Clock, Fingerprint, XCircle } from 'lucide-react'
import { playClockPunchSound, playSelectSound } from '../../../utils/soundEffects'

function formatCurrentTime(date) {
  return date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

/**
 * C05 · Juarez — Terminal de Relógio de Ponto.
 * O jogador escolhe qual sistema está usando e aperta o botão "Bater Ponto".
 */
function JuarezClockChallenge({
  options,
  disabledOptions,
  selectedOptionId,
  isApprovedState,
  isBlockedState,
  isLocked,
  onHoverOption,
  onSelectOption,
}) {
  const [stagedOptionId, setStagedOptionId] = useState(null)
  const [clockDisplay, setClockDisplay] = useState(() => formatCurrentTime(new Date()))

  useEffect(() => {
    const interval = setInterval(() => {
      setClockDisplay(formatCurrentTime(new Date()))
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Limpa seleção local automaticamente caso a opção tenha sido desabilitada após erro
  const effectiveStagedId =
    stagedOptionId && !disabledOptions.includes(stagedOptionId) ? stagedOptionId : null

  const activeChoiceId = isApprovedState ? selectedOptionId : effectiveStagedId
  const activeOption = options.find((o) => o.id === activeChoiceId) || null

  const handleStage = (optionId) => {
    if (isLocked || isApprovedState || isBlockedState || disabledOptions.includes(optionId)) return
    playSelectSound()
    setStagedOptionId(optionId)
  }

  const handlePunchClock = () => {
    if (!effectiveStagedId || isLocked || isApprovedState || isBlockedState) return
    playClockPunchSound()
    onSelectOption(effectiveStagedId)
  }

  return (
    <div className="space-y-3">
      {/* Visor Digital do Relógio de Ponto */}
      <div className="bg-stone-950 text-stone-100 border-2 border-stone-900 border-t-4 border-t-rose-400 p-3.5 shadow-[4px_4px_0px_rgba(28,25,23,0.25)]">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-0.5 min-w-0">
            <div className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-rose-300">
              <Clock className="w-3.5 h-3.5" />
              <span>Relógio de Ponto · Registro de Jornada</span>
            </div>
            <div className="text-xs font-mono text-stone-300 truncate">
              Sistema:{' '}
              <strong
                className={
                  isApprovedState
                    ? 'text-emerald-400'
                    : activeOption
                      ? 'text-amber-300'
                      : 'text-stone-500'
                }
              >
                {activeOption ? activeOption.text : 'Selecione abaixo'}
              </strong>
            </div>
          </div>

          <div className="text-right shrink-0">
            <div
              className={`font-mono text-xl sm:text-2xl font-black leading-none tracking-wider ${
                isApprovedState ? 'text-emerald-400' : 'text-amber-300'
              }`}
            >
              {clockDisplay}
            </div>
            <div className="text-[9px] font-mono uppercase tracking-[0.16em] text-stone-400 mt-1">
              {isApprovedState ? 'Ponto registrado!' : 'Aguardando batida'}
            </div>
          </div>
        </div>
      </div>

      {/* Seletor de Sistema (Passo 1) */}
      <div className="grid grid-cols-2 gap-2.5">
        {options.map((option, idx) => {
          const isOptionDisabled = disabledOptions.includes(option.id)
          const isHighlightedSuccess = isApprovedState && selectedOptionId === option.id
          const isStaged = !isApprovedState && effectiveStagedId === option.id

          return (
            <button
              key={option.id}
              type="button"
              disabled={isLocked || isOptionDisabled || isApprovedState || isBlockedState}
              onMouseEnter={() => {
                if (!isOptionDisabled && !isApprovedState && !isBlockedState) {
                  onHoverOption(option.id)
                }
              }}
              onMouseLeave={() => onHoverOption(null)}
              onFocus={() => {
                if (!isOptionDisabled && !isApprovedState && !isBlockedState) {
                  onHoverOption(option.id)
                }
              }}
              onBlur={() => onHoverOption(null)}
              onClick={() => handleStage(option.id)}
              style={{ animationDelay: `${idx * 55}ms` }}
              className={`group w-full text-left p-3 border-2 flex items-center justify-between gap-2 animate-panel-rise transition-all duration-200 ${
                isHighlightedSuccess
                  ? 'bg-emerald-50 border-emerald-600 text-emerald-950 shadow-[3px_3px_0px_#059669]'
                  : isOptionDisabled
                    ? 'bg-red-50/70 border-red-200 text-stone-400 cursor-not-allowed'
                    : isStaged
                      ? 'bg-amber-50 border-stone-900 text-stone-950 shadow-[3px_3px_0px_#1C1917] -translate-y-0.5'
                      : 'bg-white hover:bg-rose-50/60 border-stone-300 hover:border-stone-900 hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#1C1917] text-stone-800 cursor-pointer disabled:opacity-60 disabled:pointer-events-none'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className={`w-7 h-7 font-mono text-xs font-black flex items-center justify-center shrink-0 transition-colors ${
                    isHighlightedSuccess
                      ? 'bg-emerald-600 text-white'
                      : isOptionDisabled
                        ? 'bg-red-100 text-red-500 border border-red-200'
                        : isStaged
                          ? 'bg-[#D99B38] text-stone-950'
                          : 'bg-stone-900 text-white group-hover:bg-rose-400 group-hover:text-stone-950'
                  }`}
                >
                  {option.label}
                </span>
                <span
                  className={`text-sm font-black truncate ${
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

      {/* Botão Tátil de Bater Ponto (Passo 2) */}
      <button
        type="button"
        disabled={!effectiveStagedId || isLocked || isApprovedState || isBlockedState}
        onClick={handlePunchClock}
        className={`w-full py-3 px-4 border-2 border-stone-900 font-black text-xs sm:text-sm uppercase tracking-[0.18em] flex items-center justify-center gap-2.5 transition-all duration-200 ${
          isApprovedState
            ? 'bg-emerald-600 text-white shadow-[3px_3px_0px_#1C1917]'
            : effectiveStagedId && !isLocked && !isBlockedState
              ? 'bg-[#D99B38] hover:bg-[#c58927] text-stone-950 shadow-[4px_4px_0px_#1C1917] hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#1C1917] active:scale-[0.99] cursor-pointer'
              : 'bg-stone-200 text-stone-500 border-stone-400 cursor-not-allowed'
        }`}
      >
        <Fingerprint className="w-4 h-4 shrink-0" />
        <span>
          {isApprovedState
            ? `Ponto Registrado no ${activeOption?.text || 'Sistema'}!`
            : effectiveStagedId
              ? `Bater Ponto no ${activeOption?.text}`
              : 'Selecione um sistema acima para bater o ponto'}
        </span>
      </button>
    </div>
  )
}

export default JuarezClockChallenge
