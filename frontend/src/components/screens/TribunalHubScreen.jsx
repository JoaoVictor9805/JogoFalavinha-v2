import {
  AlertCircle,
  CheckCircle2,
  Crown,
  HelpCircle,
  KeyRound,
  MessageSquare,
  Sparkles,
  UserCheck,
  UserRound,
} from 'lucide-react'
import { useGame } from '../../context/gameContextInstance'
import { CEO_TRIBUNAL_BRIEFING, COUNCIL_MEMBERS } from '../../data/conselhoNextData'
import VisualNovelOverlay from '../vn/VisualNovelOverlay'

// Offset vertical em telas grandes para criar a curvatura de semicírculo da bancada
const ARC_OFFSETS = {
  1: 'lg:translate-y-12',
  2: 'lg:translate-y-5',
  3: 'lg:translate-y-1',
  4: 'lg:-translate-y-2',
  5: 'lg:translate-y-1',
  6: 'lg:translate-y-5',
  7: 'lg:translate-y-12',
}

function TribunalHubScreen() {
  const {
    memberProgress,
    completedCount,
    activeMember,
    openMemberDialog,
    isLocked,
    ceoBriefingDismissed,
    setCeoBriefingDismissed,
  } = useGame()

  return (
    <div className="min-h-screen w-full pt-24 pb-12 px-4 sm:px-8 flex flex-col justify-between bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black relative overflow-hidden">
      {/* Luz cênica de fundo do Tribunal */}
      <div className="pointer-events-none absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[720px] h-[360px] bg-teal-500/10 blur-[120px] rounded-full" />

      <div className="max-w-7xl w-full mx-auto space-y-8 relative z-10 my-auto">
        {/* Card do CEO explicando a situação no Tribunal */}
        <section className="max-w-4xl mx-auto rounded-3xl border border-amber-400/40 bg-slate-900/90 backdrop-blur-md p-5 sm:p-6 shadow-2xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-600 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
                <Crown className="w-8 h-8" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-widest text-amber-400">
                    {CEO_TRIBUNAL_BRIEFING.name}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-teal-500/15 border border-teal-400/30 text-[10px] font-bold text-teal-300">
                    Ordem Livre
                  </span>
                </div>
                <h1 className="text-lg sm:text-xl font-black text-white mt-0.5">
                  O Tribunal · Bancada dos 7 Conselheiros
                </h1>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setCeoBriefingDismissed(!ceoBriefingDismissed)}
              className="text-xs font-bold text-slate-400 hover:text-white px-3 py-1.5 rounded-lg bg-slate-950/70 border border-slate-800 cursor-pointer transition-colors"
            >
              {ceoBriefingDismissed ? 'Mostrar Instruções do CEO' : 'Recolher Fala do CEO'}
            </button>
          </div>

          {!ceoBriefingDismissed && (
            <p className="mt-4 text-xs sm:text-sm text-slate-200 leading-relaxed bg-slate-950/75 border border-slate-800/90 rounded-2xl p-4">
              “{CEO_TRIBUNAL_BRIEFING.message}”
            </p>
          )}
        </section>

        {/* Semicírculo / Bancada das 7 Cabeças do Conselho */}
        <section aria-label="Bancada do Conselho Next" className="pt-2 pb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 items-stretch">
            {COUNCIL_MEMBERS.map((member) => {
              const status = memberProgress[member.id] || {
                completed: false,
                errors: 0,
              }
              const isCompleted = status.completed
              const arcClass = ARC_OFFSETS[member.id] || ''

              return (
                <button
                  key={member.id}
                  type="button"
                  disabled={isCompleted || isLocked}
                  onClick={() => openMemberDialog(member.id)}
                  className={`group relative rounded-3xl border-2 p-4 flex flex-col justify-between text-left transition-all duration-300 ${arcClass} ${
                    isCompleted
                      ? 'bg-slate-950/60 border-emerald-500/40 opacity-50 grayscale cursor-not-allowed pointer-events-none'
                      : `bg-slate-900/90 hover:bg-slate-900 ${member.borderAccent} hover:-translate-y-2 hover:shadow-2xl ${member.glowAccent} cursor-pointer`
                  }`}
                >
                  {/* Topo da Cadeira: Número + Ícone do Tipo de Desafio */}
                  <div className="flex items-center justify-between gap-2 w-full mb-3">
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-950 border border-slate-800 font-mono text-[11px] font-bold text-slate-300">
                      #{member.id}
                    </span>

                    {isCompleted ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-[10px] font-black uppercase text-emerald-300">
                        <CheckCircle2 className="w-3 h-3" />
                        Concluído
                      </span>
                    ) : member.type === 'multiple_choice' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-950/90 border border-slate-700 text-[10px] font-semibold text-slate-300">
                        <HelpCircle className="w-3 h-3 text-teal-400" />
                        Questão
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-950/90 border border-slate-700 text-[10px] font-semibold text-amber-300">
                        <KeyRound className="w-3 h-3 text-amber-400" />
                        Enigma/Senha
                      </span>
                    )}
                  </div>

                  {/* Silhueta / Avatar Placeholder da "Cabeça" do Conselho */}
                  <div
                    className={`w-full h-36 rounded-2xl bg-gradient-to-b ${member.avatarGradient} border border-white/15 flex flex-col items-center justify-center p-3 relative overflow-hidden mb-3`}
                  >
                    <div className="w-16 h-16 rounded-full bg-slate-950/60 border-2 border-white/30 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      {isCompleted ? (
                        <UserCheck className="w-8 h-8 text-emerald-300" />
                      ) : (
                        <UserRound className="w-8 h-8 text-white" />
                      )}
                    </div>
                    <span className="mt-2 text-[10px] font-mono uppercase tracking-wider text-white/80">
                      {member.shortLabel}
                    </span>
                  </div>

                  {/* Nome e Papel do Conselheiro */}
                  <div className="space-y-1 w-full">
                    <h2 className="text-sm font-black text-white truncate">{member.name}</h2>
                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-tight">
                      {member.role}
                    </p>
                  </div>

                  {/* Rodapé de Status de Interação */}
                  <div className="mt-3 pt-2.5 border-t border-slate-800/90 w-full flex items-center justify-between text-[11px]">
                    {isCompleted ? (
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Aprovado
                      </span>
                    ) : status.errors > 0 ? (
                      <span className="text-amber-400 font-bold flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                        {status.errors} erro{status.errors > 1 ? 's' : ''} (+{status.errors * 5}s)
                      </span>
                    ) : (
                      <span className="text-teal-300 font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                        <MessageSquare className="w-3.5 h-3.5" />
                        Conversar
                      </span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Mesa Circular / Semicircular Estilizada do Tribunal */}
          <div className="mt-8 lg:mt-14 max-w-5xl mx-auto rounded-t-[120px] rounded-b-3xl border-t-4 border-x-2 border-b border-teal-500/30 bg-gradient-to-b from-slate-900/95 to-slate-950 p-5 text-center shadow-[0_-15px_50px_rgba(20,184,166,0.12)]">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-teal-400">
              <Sparkles className="w-4 h-4" />
              <span>
                Mesa Circular do Conselho Next · {completedCount} de 7 Aprovações Conquistadas
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Clique em qualquer conselheiro disponível acima para iniciar o diálogo.
            </p>
          </div>
        </section>
      </div>

      {/* Overlay Visual Novel (renderizado com key única por membro para resetar inputs) */}
      {activeMember && <VisualNovelOverlay key={activeMember.id} />}
    </div>
  )
}

export default TribunalHubScreen

