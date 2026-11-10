import { ArrowRight, Briefcase, Lightbulb, PhoneOutgoing } from 'lucide-react'
import { useGame } from '../../context/gameContextInstance'
import { COMIC_PANELS } from '../../data/conselhoNextData'

const PANEL_ICONS = {
  1: Lightbulb,
  2: PhoneOutgoing,
  3: Briefcase,
}

function ComicIntroScreen() {
  const { advanceFromComic, isLocked } = useGame()

  return (
    <div className="min-h-screen w-full pt-24 pb-12 px-4 sm:px-8 flex flex-col items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 transition-opacity duration-300">
      <div className="max-w-6xl w-full space-y-8">
        {/* Cabeçalho da Comic Strip */}
        <div className="text-center space-y-2">
          <span className="inline-block px-3.5 py-1 rounded-full bg-amber-400/15 border border-amber-400/40 text-amber-300 text-xs font-extrabold uppercase tracking-widest">
            Prólogo · A Ideia
          </span>
          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Como Nasceu o Exame do Conselho Next
          </h1>
          <p className="text-sm text-slate-400 max-w-2xl mx-auto">
            Enquanto o seu cronômetro já corre nos bastidores, entenda o que levou o CEO a convocar
            as 7 lideranças.
          </p>
        </div>

        {/* Tirinha de 3 Quadros (Comic Strip) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {COMIC_PANELS.map((panel) => {
            const Icon = PANEL_ICONS[panel.id] || Lightbulb

            return (
              <article
                key={panel.id}
                className={`relative flex flex-col justify-between rounded-2xl border-4 ${panel.accentColor} bg-gradient-to-b ${panel.bgGradient} p-5 shadow-[8px_8px_0px_rgba(2,6,23,0.95)] transition-transform duration-300 hover:-translate-y-1`}
              >
                {/* Topo do Quadro de HQ */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-1 rounded-md bg-slate-950/90 border border-slate-700 text-[11px] font-black uppercase tracking-wider text-amber-300">
                      {panel.step}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">#{panel.id}</span>
                  </div>

                  {/* Placeholder Visual da Arte do Quadrinho */}
                  <div className="h-48 rounded-xl bg-slate-950/80 border-2 border-slate-800 relative overflow-hidden flex flex-col items-center justify-center p-4 text-center">
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#2dd4bf_1px,transparent_1px)] [background-size:14px_14px]" />

                    {/* Silhueta / Placeholder do CEO no Quadrinho */}
                    <div className="relative z-10 w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-amber-400/60 flex items-center justify-center shadow-lg mb-3">
                      <Icon className="w-10 h-10 text-amber-400" />
                    </div>

                    <span className="relative z-10 text-xs font-bold uppercase tracking-widest text-slate-300">
                      [Placeholder Arte HQ · {panel.title}]
                    </span>
                    <span className="relative z-10 text-[11px] text-slate-400 mt-1">
                      {panel.badgeText}
                    </span>
                  </div>

                  {/* Caixa Narrativa Amarela estilo HQ */}
                  <div className="bg-amber-300 text-slate-950 px-3.5 py-2.5 rounded-lg border-2 border-slate-950 text-xs font-bold leading-snug shadow-sm">
                    {panel.narration}
                  </div>
                </div>

                {/* Balão de Fala do CEO */}
                <div className="mt-4 relative bg-white text-slate-950 p-4 rounded-2xl border-2 border-slate-950 shadow-md">
                  <div className="text-[10px] font-black uppercase tracking-wider text-teal-700 mb-1">
                    CEO · Falavinha Next
                  </div>
                  <p className="text-xs sm:text-sm font-extrabold italic leading-relaxed">
                    {panel.speech}
                  </p>
                </div>
              </article>
            )
          })}
        </div>

        {/* Botão Avançar */}
        <div className="flex justify-center pt-2">
          <button
            type="button"
            disabled={isLocked}
            onClick={advanceFromComic}
            className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black text-base uppercase tracking-wider shadow-xl shadow-amber-500/20 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:pointer-events-none transition-all duration-200 cursor-pointer"
          >
            <span>Avançar para a Sala do Conselho</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default ComicIntroScreen

