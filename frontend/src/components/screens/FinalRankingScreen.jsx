import {
  AlertTriangle,
  Award,
  CheckCircle2,
  Clock,
  RotateCcw,
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
    <div className="min-h-screen w-full bg-[#F5F0E6] text-stone-900 pt-22 pb-12 px-4 sm:px-8 flex flex-col justify-center">
      <div className="max-w-6xl w-full mx-auto space-y-8">
        {/* Bloco de Resumo do Resultado Final */}
        <section className="bg-[#FDFBF7] border-2 border-stone-900 p-6 sm:p-8 shadow-[6px_6px_0px_#1C1917] space-y-6 animate-modal-pop">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-stone-200 pb-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-none bg-[#D99B38] text-stone-950 border-2 border-stone-900 shadow-[3px_3px_0px_#1C1917] flex items-center justify-center shrink-0">
                <Trophy className="w-7 h-7 animate-vn-idle" />
              </div>

              <div>
                <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-stone-900">
                  Você Passou pelo Conselho Next!
                </h1>
                <p className="text-xs sm:text-sm text-stone-600 mt-0.5">
                  Parabéns, <strong className="text-stone-900">{player?.nome}</strong> (
                  {player?.setor} · {player?.unidade}).
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={restartGame}
              className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-none bg-[#D99B38] hover:bg-[#c58927] text-stone-950 border-2 border-stone-900 font-black text-xs sm:text-sm uppercase tracking-[0.18em] shadow-[4px_4px_0px_#1C1917] hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#1C1917] active:scale-95 transition-all cursor-pointer shrink-0"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Jogar Novamente</span>
            </button>
          </div>

          {/* Métricas do Tempo Final */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-none bg-[#F5F0E6] border-2 border-stone-900 border-l-4 border-l-emerald-600 p-4 animate-panel-rise">
              <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-emerald-700">
                <Clock className="w-4 h-4" />
                <span>Tempo Final Oficial</span>
              </div>
              <div className="font-mono text-3xl sm:text-4xl font-black text-stone-900 mt-1.5">
                {formatarTempo(totalSeconds)}
              </div>
              <div className="text-xs text-stone-500 mt-1">
                {totalSeconds} {totalSeconds === 1 ? 'segundo total contabilizado' : 'segundos totais contabilizados'}
              </div>
            </div>

            <div
              className="rounded-none bg-[#F5F0E6] border-2 border-stone-900 border-l-4 border-l-[#D99B38] p-4 animate-panel-rise"
              style={{ animationDelay: '70ms' }}
            >
              <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-[#B87D1E]">
                <Award className="w-4 h-4" />
                <span>Tempo de Percurso Real</span>
              </div>
              <div className="font-mono text-2xl sm:text-3xl font-extrabold text-stone-900 mt-1.5">
                {formatarTempo(realSeconds)}
              </div>
              <div className="text-xs text-stone-500 mt-1">
                Tempo líquido sem contar punições
              </div>
            </div>

            <div
              className="rounded-none bg-[#F5F0E6] border-2 border-stone-900 border-l-4 border-l-red-600 p-4 animate-panel-rise"
              style={{ animationDelay: '140ms' }}
            >
              <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-red-600">
                <AlertTriangle className="w-4 h-4" />
                <span>Penalidades Acumuladas</span>
              </div>
              <div className="font-mono text-2xl sm:text-3xl font-extrabold text-red-600 mt-1.5">
                +{penaltySeconds}s
              </div>
              <div className="text-xs text-stone-500 mt-1">
                {totalErrors} {totalErrors === 1 ? 'erro cometido' : 'erros cometidos'} (+5s por erro)
              </div>
            </div>
          </div>

          {/* Resumo das 7 Cadeiras do Conselho */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 pt-1">
            {COUNCIL_MEMBERS.map((m, idx) => {
              const st = memberProgress[m.id] || { errors: 0 }
              return (
                <div
                  key={m.id}
                  style={{ animationDelay: `${180 + idx * 45}ms` }}
                  className="rounded-none bg-[#F5F0E6] border-2 border-stone-300 border-t-4 border-t-stone-900 p-3 text-center space-y-1 animate-panel-rise"
                >
                  <div className="inline-flex items-center justify-center w-6 h-6 rounded-none bg-emerald-600 text-white">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-xs font-black uppercase tracking-tight text-stone-900 truncate">
                    {m.name}
                  </div>
                  <div
                    className={`text-[11px] font-mono font-bold ${
                      st.errors > 0 ? 'text-red-600' : 'text-emerald-700'
                    }`}
                  >
                    {st.errors === 0
                      ? 'Sem erros'
                      : `${st.errors} ${st.errors === 1 ? 'erro' : 'erros'} (+${st.errors * 5}s)`}
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Tabela de Ranking Geral */}
        <section
          className="space-y-3 animate-panel-rise"
          style={{ animationDelay: '220ms' }}
        >
          <div className="flex items-center justify-between gap-4 flex-wrap border-l-4 border-[#D99B38] pl-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-stone-900" />
              <h2 className="text-lg font-black uppercase tracking-tight text-stone-900">
                Ranking Geral — Conselho Next
              </h2>
            </div>
            <span className="text-xs font-semibold text-stone-500">
              Ordenado pelo menor Tempo Total
            </span>
          </div>

          <div className="overflow-x-auto border-2 border-stone-900 bg-[#FDFBF7] shadow-[6px_6px_0px_#1C1917]">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-stone-900 text-white border-b-2 border-[#D99B38] text-[11px] font-black uppercase tracking-[0.16em]">
                  <th className="py-3.5 px-4">#</th>
                  <th className="py-3.5 px-4">Colaborador</th>
                  <th className="py-3.5 px-4">Setor</th>
                  <th className="py-3.5 px-4">Unidade</th>
                  <th className="py-3.5 px-4">Penalidades</th>
                  <th className="py-3.5 px-4 text-right">Tempo Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {rankingHistory.map((item, idx) => {
                  const errCount = item.totalErrors || 0
                  return (
                    <tr
                      key={item.id || idx}
                      className={
                        item.nome === player?.nome && item.totalSeconds === totalSeconds
                          ? 'bg-[#F5F0E6] border-l-4 border-l-[#D99B38]'
                          : 'hover:bg-[#F5F0E6]/60 transition-colors'
                      }
                    >
                      <td className="py-3.5 px-4 font-mono font-black text-[#B87D1E]">
                        {idx + 1}º
                      </td>
                      <td className="py-3.5 px-4 font-bold text-stone-900">{item.nome}</td>
                      <td className="py-3.5 px-4 font-semibold text-stone-600">{item.setor}</td>
                      <td className="py-3.5 px-4 text-stone-500">{item.unidade}</td>
                      <td className="py-3.5 px-4 font-mono text-xs font-bold text-red-600">
                        +{item.penaltySeconds || 0}s ({errCount}{' '}
                        {errCount === 1 ? 'erro' : 'erros'})
                      </td>
                      <td className="py-3.5 px-4 font-mono font-black text-emerald-700 text-right">
                        {formatarTempo(item.totalSeconds)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  )
}

export default FinalRankingScreen
