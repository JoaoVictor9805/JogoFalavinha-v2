import {
  AlertTriangle,
  Award,
  CheckCircle2,
  Clock,
  RotateCcw,
  ShieldCheck,
  Trophy,
  Users,
} from 'lucide-react'
import { useGame } from '../../context/gameContextInstance'
import { COUNCIL_MEMBERS } from '../../data/conselhoNextData'
import { formatarTempo } from '../../utils/validacaoDesafio'

function FinalRankingScreen() {
  const {
    player,
    realSeconds,
    penaltySeconds,
    totalSeconds,
    totalErrors,
    memberProgress,
    rankingHistory,
    restartGame,
  } = useGame()

  return (
    <div className="min-h-screen w-full pt-24 pb-16 px-4 sm:px-8 flex flex-col items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-950/40 via-slate-950 to-black">
      <div className="max-w-5xl w-full space-y-6">
        {/* Card Principal de Sucesso / Aprovação Unânime */}
        <section className="rounded-3xl border-2 border-emerald-500/40 bg-slate-900/90 backdrop-blur-xl p-6 sm:p-10 shadow-2xl space-y-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-400 to-yellow-600 text-slate-950 flex items-center justify-center shadow-xl shadow-amber-500/25 shrink-0">
                <Trophy className="w-10 h-10" />
              </div>
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-extrabold uppercase tracking-widest">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Aprovação Unânime · 7/7 Conselheiros</span>
                </div>
                <h1 className="text-2xl sm:text-4xl font-black text-white">
                  Você Passou pelo Conselho Next!
                </h1>
                <p className="text-sm sm:text-base text-slate-300">
                  Parabéns, <strong className="text-white">{player?.nome}</strong> ({player?.setor}{' '}
                  · {player?.unidade}). O cronômetro foi encerrado!
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={restartGame}
              className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-teal-400 to-emerald-500 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-teal-500/20 hover:brightness-110 active:scale-95 transition-all cursor-pointer shrink-0"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Jogar Novamente</span>
            </button>
          </div>

          {/* Métricas do Tempo Final (Tempo Real + Penalidades de +5s) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl bg-slate-950/90 border-2 border-emerald-500/40 p-5">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
                <Clock className="w-4 h-4" />
                <span>Tempo Final Oficial</span>
              </div>
              <div className="font-mono text-3xl sm:text-4xl font-black text-white mt-2">
                {formatarTempo(totalSeconds)}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {totalSeconds} segundos totais contabilizados
              </div>
            </div>

            <div className="rounded-2xl bg-slate-950/80 border border-slate-800 p-5">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
                <Award className="w-4 h-4" />
                <span>Tempo de Percurso Real</span>
              </div>
              <div className="font-mono text-2xl sm:text-3xl font-extrabold text-amber-300 mt-2">
                {formatarTempo(realSeconds)}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Tempo líquido sem contar punições
              </div>
            </div>

            <div className="rounded-2xl bg-slate-950/80 border border-slate-800 p-5">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-red-400">
                <AlertTriangle className="w-4 h-4" />
                <span>Penalidades Acumuladas</span>
              </div>
              <div className="font-mono text-2xl sm:text-3xl font-extrabold text-red-400 mt-2">
                +{penaltySeconds}s
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {totalErrors} erro{totalErrors === 1 ? '' : 's'} cometidos (+5s por erro)
              </div>
            </div>
          </div>

          {/* Resumo das 7 Cadeiras do Conselho */}
          <div className="space-y-3">
            <h2 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">
              Relatório Individual por Conselheiro
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              {COUNCIL_MEMBERS.map((m) => {
                const st = memberProgress[m.id] || { errors: 0 }
                return (
                  <div
                    key={m.id}
                    className="rounded-2xl bg-slate-950/80 border border-slate-800 p-3 text-center space-y-1"
                  >
                    <div className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div className="text-xs font-bold text-white truncate">{m.name}</div>
                    <div className="text-[11px] text-slate-400 truncate">{m.shortLabel}</div>
                    <div
                      className={`text-[11px] font-mono font-bold ${
                        st.errors > 0 ? 'text-red-400' : 'text-emerald-400'
                      }`}
                    >
                      {st.errors === 0 ? 'Sem erros' : `${st.errors} erro(s) (+${st.errors * 5}s)`}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Tabela de Ranking Local */}
        <section className="rounded-3xl border border-slate-800 bg-slate-900/85 backdrop-blur-xl p-6 sm:p-8 shadow-xl space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2.5">
              <Users className="w-5 h-5 text-teal-400" />
              <h2 className="text-lg font-extrabold text-white">
                Ranking Geral — Conselho Next
              </h2>
            </div>
            <span className="text-xs text-slate-400">
              Ordenado pelo menor Tempo Total (Percurso + Penalidades)
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-3">#</th>
                  <th className="py-3 px-3">Colaborador</th>
                  <th className="py-3 px-3">Setor</th>
                  <th className="py-3 px-3">Unidade</th>
                  <th className="py-3 px-3">Penalidades</th>
                  <th className="py-3 px-3 text-right">Tempo Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {rankingHistory.map((item, idx) => (
                  <tr
                    key={item.id || idx}
                    className={
                      item.nome === player?.nome && item.totalSeconds === totalSeconds
                        ? 'bg-teal-500/10'
                        : ''
                    }
                  >
                    <td className="py-3.5 px-3 font-mono font-bold text-amber-400">{idx + 1}º</td>
                    <td className="py-3.5 px-3 font-bold text-white">{item.nome}</td>
                    <td className="py-3.5 px-3 text-slate-300">{item.setor}</td>
                    <td className="py-3.5 px-3 text-slate-400">{item.unidade}</td>
                    <td className="py-3.5 px-3 font-mono text-xs text-red-400">
                      +{item.penaltySeconds || 0}s ({item.totalErrors || 0} erros)
                    </td>
                    <td className="py-3.5 px-3 font-mono font-extrabold text-emerald-400 text-right">
                      {formatarTempo(item.totalSeconds)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  )
}

export default FinalRankingScreen

