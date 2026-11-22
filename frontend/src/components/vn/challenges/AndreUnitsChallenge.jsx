import { CheckCircle2, XCircle } from 'lucide-react'

const BUILDING_HEIGHTS = [34, 46, 38, 50, 36, 44, 40]

function BuildingSilhouetteRow({ count, isSuccess, isDisabled }) {
  const safeCount = Math.max(1, Math.min(7, Number(count) || 1))
  const buildingWidth = safeCount >= 7 ? 15 : safeCount >= 5 ? 19 : 24
  const gap = safeCount >= 7 ? 4 : safeCount >= 5 ? 5 : 7
  const totalWidth = safeCount * buildingWidth + (safeCount - 1) * gap
  const startX = (160 - totalWidth) / 2
  const groundY = 62

  const fillClass = isSuccess
    ? 'fill-emerald-700'
    : isDisabled
      ? 'fill-stone-300'
      : 'fill-stone-800 group-hover:fill-sky-700'

  const windowClass = isSuccess
    ? 'fill-emerald-200'
    : isDisabled
      ? 'fill-stone-200'
      : 'fill-amber-200/90 group-hover:fill-amber-300'

  return (
    <svg
      viewBox="0 0 160 70"
      aria-hidden="true"
      className="w-full h-14 sm:h-16 block overflow-visible"
    >
      {/* Linha do solo */}
      <line
        x1="10"
        y1={groundY}
        x2="150"
        y2={groundY}
        stroke={isSuccess ? '#059669' : isDisabled ? '#d6d3d1' : '#78716c'}
        strokeWidth="2"
      />

      {Array.from({ length: safeCount }).map((_, idx) => {
        const h = BUILDING_HEIGHTS[idx % BUILDING_HEIGHTS.length]
        const x = startX + idx * (buildingWidth + gap)
        const y = groundY - h
        const cols = buildingWidth >= 22 ? 3 : 2
        const rows = Math.max(2, Math.floor((h - 10) / 10))
        const winW = buildingWidth >= 22 ? 3.5 : 3
        const winGapX = (buildingWidth - cols * winW) / (cols + 1)

        return (
          <g key={idx}>
            {/* Corpo do prédio */}
            <rect
              x={x}
              y={y}
              width={buildingWidth}
              height={h}
              rx="1"
              className={`transition-colors duration-200 ${fillClass}`}
            />
            {/* Topo/platibanda */}
            <rect
              x={x + 2}
              y={y - 3}
              width={buildingWidth - 4}
              height="3"
              className={`transition-colors duration-200 ${fillClass}`}
            />
            {/* Janelinhas */}
            {Array.from({ length: rows }).map((__, rIdx) =>
              Array.from({ length: cols }).map((___, cIdx) => (
                <rect
                  key={`${rIdx}-${cIdx}`}
                  x={x + winGapX + cIdx * (winW + winGapX)}
                  y={y + 5 + rIdx * 9}
                  width={winW}
                  height="4.5"
                  rx="0.5"
                  className={`transition-colors duration-200 ${windowClass}`}
                />
              ))
            )}
          </g>
        )
      })}
    </svg>
  )
}

/**
 * C01 · André / Sapo — Silhuetas de Prédios representando a quantidade de unidades físicas.
 */
function AndreUnitsChallenge({
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
      <div className="text-[11px] font-black uppercase tracking-[0.14em] text-sky-800 bg-sky-50 border border-sky-300 px-3 py-1.5 inline-flex items-center gap-2">
        <span>Selecione o conjunto que representa nossas unidades físicas</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {options.map((option, idx) => {
          const isOptionDisabled = disabledOptions.includes(option.id)
          const isHighlightedSuccess = isApprovedState && selectedOptionId === option.id
          const unitsNumber = parseInt(option.text, 10)
          const countDisplay = Number.isFinite(unitsNumber) ? unitsNumber : option.text

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
              className={`group text-left border-2 p-3 flex flex-col justify-between gap-2.5 animate-panel-rise transition-all duration-200 ${
                isHighlightedSuccess
                  ? 'bg-emerald-50 border-emerald-600 text-emerald-950 shadow-[3px_3px_0px_#059669]'
                  : isOptionDisabled
                    ? 'bg-red-50/70 border-red-200 text-stone-400 cursor-not-allowed'
                    : 'bg-white hover:bg-sky-50/70 border-stone-300 hover:border-stone-900 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#1C1917] text-stone-900 cursor-pointer active:scale-[0.99] disabled:opacity-60 disabled:pointer-events-none'
              }`}
            >
              {/* Moldura com silhuetas de prédios */}
              <div
                className={`w-full px-2 pt-2 pb-1 border transition-colors ${
                  isHighlightedSuccess
                    ? 'bg-emerald-100/70 border-emerald-300'
                    : isOptionDisabled
                      ? 'bg-stone-100/70 border-red-200/70'
                      : 'bg-[#F5F0E6] border-stone-200 group-hover:bg-sky-100/60 group-hover:border-sky-300'
                }`}
              >
                <BuildingSilhouetteRow
                  count={unitsNumber}
                  isSuccess={isHighlightedSuccess}
                  isDisabled={isOptionDisabled}
                />
              </div>

              {/* Rodapé do card com letra e quantidade */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`w-7 h-7 font-mono text-xs font-black flex items-center justify-center shrink-0 transition-colors ${
                      isHighlightedSuccess
                        ? 'bg-emerald-600 text-white'
                        : isOptionDisabled
                          ? 'bg-red-100 text-red-500 border border-red-200'
                          : 'bg-stone-900 text-white group-hover:bg-sky-500 group-hover:text-stone-950'
                    }`}
                  >
                    {option.label}
                  </span>
                  <span
                    className={`text-sm sm:text-base font-black tracking-tight truncate ${
                      isOptionDisabled ? 'line-through text-stone-400' : 'text-stone-900'
                    }`}
                  >
                    {countDisplay} {unitsNumber === 1 ? 'unidade' : 'unidades'}
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
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default AndreUnitsChallenge
