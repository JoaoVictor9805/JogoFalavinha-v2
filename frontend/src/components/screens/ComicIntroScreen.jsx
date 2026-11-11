import { ArrowRight } from 'lucide-react'
import { useGame } from '../../context/gameContextInstance'
import { COMIC_PANELS } from '../../data/conselhoNextData'

function ComicIntroScreen() {
  const { advanceFromComic, isLocked } = useGame()

  return (
    <div className="min-h-screen w-full bg-[#F5F0E6] text-stone-900 flex flex-col items-center justify-center p-4 sm:p-8">
      <div className="max-w-6xl w-full space-y-8">
        {/* 3 espaços limpos para as imagens dos quadrinhos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {COMIC_PANELS.map((panel, idx) => (
            <div
              key={panel.id}
              style={{ animationDelay: `${idx * 110}ms` }}
              className="group aspect-[3/4] w-full rounded-none border-2 border-stone-900 border-t-4 border-t-[#D99B38] bg-[#FDFBF7] shadow-[6px_6px_0px_#1C1917] hover:-translate-y-1.5 hover:shadow-[8px_10px_0px_#1C1917] transition-all duration-300 overflow-hidden flex items-center justify-center animate-panel-rise"
            >
              {panel.image ? (
                <img
                  src={panel.image}
                  alt={`Quadrinho ${panel.id}`}
                  className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                  draggable={false}
                />
              ) : (
                <span className="text-xs font-mono font-bold uppercase tracking-widest text-stone-400">
                  [Quadrinho 0{panel.id}]
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Único botão para seguir ao desafio */}
        <div className="flex justify-center animate-panel-rise" style={{ animationDelay: '320ms' }}>
          <button
            type="button"
            disabled={isLocked}
            onClick={advanceFromComic}
            className="inline-flex items-center gap-3 px-8 py-4 rounded-none bg-[#D99B38] hover:bg-[#c58927] text-stone-950 border-2 border-stone-900 font-black text-xs sm:text-sm uppercase tracking-[0.2em] shadow-[6px_6px_0px_#1C1917] hover:-translate-y-0.5 hover:shadow-[8px_8px_0px_#1C1917] active:scale-95 disabled:opacity-50 disabled:pointer-events-none transition-all duration-200 cursor-pointer"
          >
            <span>Seguir para o Desafio</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default ComicIntroScreen
