import { CheckCircle2, XCircle } from 'lucide-react'

function resolveOutfitKind(text = '') {
  const lower = text.toLowerCase()
  if (lower.includes('social')) return 'social'
  if (lower.includes('esporte')) return 'smart_casual'
  if (lower.includes('passeio') || lower.includes('gala')) return 'gala'
  return 'casual'
}

/**
 * Ilustrações vetoriais limpas de cada estilo de vestimenta para o Guia de Dress Code.
 */
function OutfitIllustration({ kind, isSuccess, isDisabled }) {
  const primary = isSuccess ? '#065f46' : isDisabled ? '#a8a29e' : '#1c1917'
  const secondary = isSuccess ? '#10b981' : isDisabled ? '#d6d3d1' : '#334155'
  const accent = isSuccess ? '#a7f3d0' : isDisabled ? '#e7e5e4' : '#d99b38'
  const shirt = isDisabled ? '#f5f5f4' : '#ffffff'

  if (kind === 'social') {
    // Terno / blazer social com camisa branca e gravata
    return (
      <svg viewBox="0 0 88 76" aria-hidden="true" className="w-16 h-14 sm:w-[72px] sm:h-[60px]">
        {/* Ombros e blazer */}
        <path
          d="M14 24 L29 14 L44 20 L59 14 L74 24 L79 52 L67 54 L64 34 L63 70 L25 70 L24 34 L21 54 L9 52 Z"
          fill={primary}
        />
        {/* Camisa social interna */}
        <path d="M34 15 L44 43 L54 15 Z" fill={shirt} />
        {/* Lapelas */}
        <path d="M29 14 L38 42 L31 36 Z" fill={secondary} />
        <path d="M59 14 L50 42 L57 36 Z" fill={secondary} />
        {/* Gravata */}
        <path d="M41.5 18 L46.5 18 L45.5 23 L48 41 L44 46 L40 41 L42.5 23 Z" fill={accent} />
        {/* Lenço discreto no bolso */}
        <rect x="52" y="45" width="7" height="2.5" rx="0.5" fill={shirt} />
      </svg>
    )
  }

  if (kind === 'smart_casual') {
    // Esporte fino: camisa de botão aberta no colarinho (sem gravata)
    return (
      <svg viewBox="0 0 88 76" aria-hidden="true" className="w-16 h-14 sm:w-[72px] sm:h-[60px]">
        {/* Camisa de manga dobrada */}
        <path
          d="M15 24 L31 15 L44 21 L57 15 L73 24 L76 46 L64 48 L63 34 L62 70 L26 70 L25 34 L24 48 L12 46 Z"
          fill={secondary}
        />
        {/* Colarinho aberto */}
        <path d="M33 15 L44 30 L55 15 L49 14 L44 22 L39 14 Z" fill={shirt} />
        {/* Botões */}
        <circle cx="44" cy="36" r="1.6" fill={shirt} />
        <circle cx="44" cy="46" r="1.6" fill={shirt} />
        <circle cx="44" cy="56" r="1.6" fill={shirt} />
        {/* Bolso frontal */}
        <rect x="50" y="34" width="8" height="9" rx="1" fill={primary} opacity="0.35" />
      </svg>
    )
  }

  if (kind === 'gala') {
    // Passeio completo / Black-tie: smoking com gravata borboleta e colete
    return (
      <svg viewBox="0 0 88 76" aria-hidden="true" className="w-16 h-14 sm:w-[72px] sm:h-[60px]">
        <path
          d="M14 24 L29 14 L44 19 L59 14 L74 24 L79 52 L67 54 L64 34 L63 70 L25 70 L24 34 L21 54 L9 52 Z"
          fill={primary}
        />
        {/* Peitilho branco */}
        <path d="M35 16 L44 45 L53 16 Z" fill={shirt} />
        {/* Lapela acetinada */}
        <path d="M29 14 L40 46 L33 42 Z" fill="#475569" />
        <path d="M59 14 L48 46 L55 42 Z" fill="#475569" />
        {/* Gravata borboleta */}
        <path d="M37 19 L44 22.5 L37 26 Z M51 19 L44 22.5 L51 26 Z" fill={accent} />
        <circle cx="44" cy="22.5" r="2.2" fill={primary} />
        {/* Botões de gala */}
        <circle cx="44" cy="31" r="1.4" fill={primary} />
        <circle cx="44" cy="38" r="1.4" fill={primary} />
      </svg>
    )
  }

  // Casual: camiseta básica com gola careca
  return (
    <svg viewBox="0 0 88 76" aria-hidden="true" className="w-16 h-14 sm:w-[72px] sm:h-[60px]">
      <path
        d="M16 24 L31 15 Q44 24 57 15 L72 24 L76 41 L64 44 L62 35 L62 70 L26 70 L26 35 L24 44 L12 41 Z"
        fill={secondary}
      />
      {/* Gola careca */}
      <path
        d="M31 15 Q44 26 57 15"
        fill="none"
        stroke={shirt}
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      {/* Faixa esportiva discreta */}
      <rect x="26" y="38" width="36" height="5" fill={accent} opacity="0.85" />
    </svg>
  )
}

/**
 * C07 · Ed — Guia de Dress Code da Recepção com ilustrações de vestimenta + legenda.
 */
function EdDressCodeChallenge({
  options,
  disabledOptions,
  selectedOptionId,
  isApprovedState,
  isBlockedState,
  isLocked,
  onHoverOption,
  onSelectOption,
}) {
  return (
    <div className="space-y-3">
      <div className="text-[11px] font-black uppercase tracking-[0.14em] text-emerald-900 bg-emerald-50 border border-emerald-300 px-3 py-1.5 inline-flex items-center gap-2">
        <span>Guia de Apresentação · Selecione o traje adequado</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {options.map((option, idx) => {
          const isOptionDisabled = disabledOptions.includes(option.id)
          const isHighlightedSuccess = isApprovedState && selectedOptionId === option.id
          const outfitKind = resolveOutfitKind(option.text)

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
              style={{ animationDelay: `${idx * 55}ms` }}
              className={`group text-center border-2 p-3 flex flex-col items-center justify-between gap-2 animate-panel-rise transition-all duration-200 ${
                isHighlightedSuccess
                  ? 'bg-emerald-50 border-emerald-600 text-emerald-950 shadow-[3px_3px_0px_#059669]'
                  : isOptionDisabled
                    ? 'bg-red-50/70 border-red-200 text-stone-400 cursor-not-allowed'
                    : 'bg-white hover:bg-emerald-50/60 border-stone-300 hover:border-stone-900 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#1C1917] text-stone-900 cursor-pointer active:scale-[0.99] disabled:opacity-60 disabled:pointer-events-none'
              }`}
            >
              {/* Moldura da vestimenta */}
              <div
                className={`w-full py-2.5 flex items-center justify-center border transition-colors ${
                  isHighlightedSuccess
                    ? 'bg-emerald-100/70 border-emerald-300'
                    : isOptionDisabled
                      ? 'bg-stone-100/70 border-red-200/70'
                      : 'bg-[#F5F0E6] border-stone-200 group-hover:bg-emerald-100/50 group-hover:border-emerald-300'
                }`}
              >
                <div className="transition-transform duration-200 group-hover:scale-105">
                  <OutfitIllustration
                    kind={outfitKind}
                    isSuccess={isHighlightedSuccess}
                    isDisabled={isOptionDisabled}
                  />
                </div>
              </div>

              {/* Legenda abaixo do traje */}
              <div className="w-full flex items-center justify-between gap-1.5 pt-0.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`w-6 h-6 font-mono text-[11px] font-black flex items-center justify-center shrink-0 transition-colors ${
                      isHighlightedSuccess
                        ? 'bg-emerald-600 text-white'
                        : isOptionDisabled
                          ? 'bg-red-100 text-red-500 border border-red-200'
                          : 'bg-stone-900 text-white group-hover:bg-emerald-500 group-hover:text-stone-950'
                    }`}
                  >
                    {option.label}
                  </span>
                  <span
                    className={`text-xs sm:text-sm font-black tracking-tight truncate ${
                      isOptionDisabled ? 'line-through text-stone-400' : 'text-stone-900'
                    }`}
                  >
                    {option.text}
                  </span>
                </div>

                {isOptionDisabled && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-red-600 shrink-0">
                    <XCircle className="w-3.5 h-3.5" />
                    <span>
                      {isBlockedState && selectedOptionId === option.id ? '+10s' : '+5s'}
                    </span>
                  </span>
                )}

                {isHighlightedSuccess && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default EdDressCodeChallenge
