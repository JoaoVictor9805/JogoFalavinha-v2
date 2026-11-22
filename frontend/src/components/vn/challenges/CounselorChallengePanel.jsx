import { CheckCircle2, XCircle } from 'lucide-react'
import AndreUnitsChallenge from './AndreUnitsChallenge'
import EdDressCodeChallenge from './EdDressCodeChallenge'
import JhonnyCalendarChallenge from './JhonnyCalendarChallenge'
import JuarezClockChallenge from './JuarezClockChallenge'
import RamonValuesChallenge from './RamonValuesChallenge'
import RicardoErpChallenge from './RicardoErpChallenge'
import VanessaPurposeChallenge from './VanessaPurposeChallenge'

const CHALLENGE_COMPONENT_BY_MEMBER = {
  1: AndreUnitsChallenge,
  2: RamonValuesChallenge,
  3: VanessaPurposeChallenge,
  4: JhonnyCalendarChallenge,
  5: JuarezClockChallenge,
  6: RicardoErpChallenge,
  7: EdDressCodeChallenge,
}

/**
 * Renderiza a micro-mecânica dedicada de cada conselheiro (C01–C07),
 * mantendo 100% compatibilidade com a validação server-side das 4 alternativas.
 */
function CounselorChallengePanel({
  member,
  options = [],
  disabledOptions = [],
  selectedOptionId = null,
  isApprovedState = false,
  isBlockedState = false,
  isLocked = false,
  onHoverOption,
  onSelectOption,
}) {
  const MemberChallenge = CHALLENGE_COMPONENT_BY_MEMBER[Number(member?.id)]

  if (MemberChallenge) {
    return (
      <MemberChallenge
        member={member}
        options={options}
        disabledOptions={disabledOptions}
        selectedOptionId={selectedOptionId}
        isApprovedState={isApprovedState}
        isBlockedState={isBlockedState}
        isLocked={isLocked}
        onHoverOption={onHoverOption}
        onSelectOption={onSelectOption}
      />
    )
  }

  // Fallback padrão de múltipla escolha caso surja um desafio sem mecânica específica
  return (
    <div className="space-y-2.5">
      {options.map((option, optIdx) => {
        const isOptionDisabled = disabledOptions.includes(option.id)
        const isHighlightedSuccess = isApprovedState && selectedOptionId === option.id

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
            onClick={() => onSelectOption(option.id)}
            style={{ animationDelay: `${optIdx * 60}ms` }}
            className={`group w-full text-left p-4 border-2 flex items-center justify-between gap-3 animate-panel-rise transition-all duration-200 ${
              isHighlightedSuccess
                ? 'bg-emerald-50 border-emerald-600 text-emerald-950 shadow-[3px_3px_0px_#059669]'
                : isOptionDisabled
                  ? 'bg-red-50/70 border-red-200 text-stone-400 cursor-not-allowed'
                  : 'bg-white hover:bg-[#F5F0E6] border-stone-300 hover:border-stone-900 hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#1C1917] text-stone-800 cursor-pointer active:scale-[0.995] disabled:opacity-60 disabled:pointer-events-none'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <span
                className={`w-8 h-8 font-mono text-xs font-black flex items-center justify-center shrink-0 transition-colors ${
                  isHighlightedSuccess
                    ? 'bg-emerald-600 text-white'
                    : isOptionDisabled
                      ? 'bg-red-100 text-red-500 border border-red-200'
                      : 'bg-stone-900 text-white group-hover:bg-[#D99B38] group-hover:text-stone-950'
                }`}
              >
                {option.label}
              </span>
              <span
                className={`text-sm sm:text-base font-semibold leading-snug ${
                  isOptionDisabled ? 'line-through text-stone-400' : 'text-stone-800'
                }`}
              >
                {option.text}
              </span>
            </div>

            {isOptionDisabled && (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600 shrink-0">
                <XCircle className="w-4 h-4" />
                <span>
                  {isBlockedState && selectedOptionId === option.id ? '+10s' : '+5s'}
                </span>
              </span>
            )}

            {isHighlightedSuccess && (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 shrink-0">
                <CheckCircle2 className="w-4 h-4" />
                <span>Correta</span>
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

export default CounselorChallengePanel
