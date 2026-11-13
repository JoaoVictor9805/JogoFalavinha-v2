import { useState } from 'react'
import {
  AlertTriangle,
  Award,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Info,
  RotateCcw,
  Trophy,
  Users,
} from 'lucide-react'
import { useGame } from '../../context/gameContextInstance'
import { formatarTempo } from '../../utils/validacaoDesafio'

const ITEMS_PER_PAGE = 10

function FinalRankingScreen() {
  const {
    player,
    challenges,
    realSeconds,
    penaltySeconds,
    totalSeconds,
    totalErrors,
    memberProgress,
    rankingHistory,
    rankingSetores,
    restartGame,
  } = useGame()

  const [rankingTab, setRankingTab] = useState('geral') // 'geral' | 'setores'
  const [currentPageGeral, setCurrentPageGeral] = useState(1)
  const [currentPageSetores, setCurrentPageSetores] = useState(1)

  const councilList = Array.isArray(challenges) && challenges.length > 0 ? challenges : []

  // Paginação: Ranking Geral
  const totalPagesGeral = Math.max(1, Math.ceil(rankingHistory.length / ITEMS_PER_PAGE))
  const paginatedGeral = rankingHistory.slice(
    (currentPageGeral - 1) * ITEMS_PER_PAGE,
    currentPageGeral * ITEMS_PER_PAGE
  )

  // Paginação: Ranking por Setores
  const totalPagesSetores = Math.max(1, Math.ceil(rankingSetores.length / ITEMS_PER_PAGE))
  const paginatedSetores = rankingSetores.slice(
    (currentPageSetores - 1) * ITEMS_PER_PAGE,
    currentPageSetores * ITEMS_PER_PAGE
  )

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
                {totalSeconds}{' '}
                {totalSeconds === 1
                  ? 'segundo total contabilizado'
                  : 'segundos totais contabilizados'}
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
                {totalErrors}{' '}
                {totalErrors === 1 ? 'erro cometido' : 'erros cometidos'} (+5s por erro)
              </div>
            </div>
          </div>

          {/* Resumo das 7 Cadeiras do Conselho */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 pt-1">
            {councilList.map((m, idx) => {
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
                      : `${st.errors} ${st.errors === 1 ? 'erro' : 'erros'} (+${
                          st.errors * 5
                        }s)`}
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Bloco de Rankings (Abas: Geral e por Setores) */}
        <section
          className="space-y-4 animate-panel-rise"
          style={{ animationDelay: '220ms' }}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-l-4 border-[#D99B38] pl-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-stone-900" />
              <h2 className="text-lg font-black uppercase tracking-tight text-stone-900">
                Placar Oficial da Conexão Next
              </h2>
            </div>

            {/* Alternância de Abas de Ranking */}
            <div className="inline-flex border-2 border-stone-900 bg-stone-200">
              <button
                type="button"
                onClick={() => setRankingTab('geral')}
                className={`py-1.5 px-3.5 text-xs font-black uppercase tracking-[0.14em] cursor-pointer transition-all ${
                  rankingTab === 'geral'
                    ? 'bg-[#D99B38] text-stone-950 shadow-inner'
                    : 'bg-[#FDFBF7] text-stone-600 hover:text-stone-900'
                }`}
              >
                Ranking Geral (Individual)
              </button>
              <button
                type="button"
                onClick={() => setRankingTab('setores')}
                className={`py-1.5 px-3.5 text-xs font-black uppercase tracking-[0.14em] border-l-2 border-stone-900 cursor-pointer transition-all ${
                  rankingTab === 'setores'
                    ? 'bg-[#D99B38] text-stone-950 shadow-inner'
                    : 'bg-[#FDFBF7] text-stone-600 hover:text-stone-900'
                }`}
              >
                Ranking por Equipes (Setores)
              </button>
            </div>
          </div>

          {/* TABELA: RANKING GERAL */}
          {rankingTab === 'geral' && (
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
                  {rankingHistory.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-stone-500 font-semibold text-xs uppercase tracking-wider">
                        Nenhum colaborador concluiu a partida ainda.
                      </td>
                    </tr>
                  ) : (
                    paginatedGeral.map((item, idx) => {
                      const errCount = item.totalErrors || 0
                      // Identificação inequívoca: apenas bate se for o mesmo jogadorId ou o mesmo email corporativo
                      const isCurrentUser = Boolean(
                        (player?.id && item.jogadorId === player.id) ||
                        (player?.email && item.email && item.email.toLowerCase() === player.email.toLowerCase())
                      )

                      return (
                        <tr
                          key={item.id || idx}
                          className={
                            isCurrentUser
                              ? 'bg-[#F5F0E6] border-l-4 border-l-[#D99B38]'
                              : 'hover:bg-[#F5F0E6]/60 transition-colors'
                          }
                        >
                          <td className="py-3.5 px-4 font-mono font-black text-[#B87D1E]">
                            {item.posicao || (currentPageGeral - 1) * ITEMS_PER_PAGE + idx + 1}º
                          </td>
                          <td className="py-3.5 px-4 font-bold text-stone-900">
                            {item.nome}
                            {isCurrentUser && (
                              <span className="ml-2 text-[10px] font-black uppercase bg-[#D99B38] text-stone-950 px-1.5 py-0.5">
                                Você
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-stone-600">
                            {item.setor}
                          </td>
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
                    })
                  )}
                </tbody>
              </table>

              {/* Barra de Paginação (Máximo 10 linhas por página) */}
              {totalPagesGeral > 1 && (
                <div className="flex items-center justify-between border-t-2 border-stone-900 bg-stone-100 p-3 text-xs font-bold text-stone-700">
                  <span className="font-mono text-stone-600">
                    Página {currentPageGeral} de {totalPagesGeral} ({rankingHistory.length} colaboradores)
                  </span>
                  <div className="inline-flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={currentPageGeral <= 1}
                      onClick={() => setCurrentPageGeral((p) => Math.max(1, p - 1))}
                      className="p-1.5 border-2 border-stone-900 bg-white hover:bg-[#D99B38] disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                      title="Página Anterior"
                    >
                      <ChevronLeft className="w-4 h-4 text-stone-900" />
                    </button>
                    <span className="px-2 font-mono text-stone-800">
                      {currentPageGeral} / {totalPagesGeral}
                    </span>
                    <button
                      type="button"
                      disabled={currentPageGeral >= totalPagesGeral}
                      onClick={() => setCurrentPageGeral((p) => Math.min(totalPagesGeral, p + 1))}
                      className="p-1.5 border-2 border-stone-900 bg-white hover:bg-[#D99B38] disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                      title="Próxima Página"
                    >
                      <ChevronRight className="w-4 h-4 text-stone-900" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TABELA: RANKING POR SETORES */}
          {rankingTab === 'setores' && (
            <div className="space-y-3">
              {/* Box explicativo das regras de Quórum e Desempate */}
              <div className="p-3.5 bg-stone-100 border-2 border-stone-300 flex items-start gap-2.5 text-stone-700 text-xs">
                <Info className="w-4 h-4 text-[#B87D1E] shrink-0 mt-0.5" />
                <div>
                  <strong>Regras da Competição por Equipes:</strong>
                  <span className="ml-1">
                    Para figurar no pódio oficial, o setor precisa atingir o <strong>quórum mínimo de 3 colaboradores concluintes</strong>.
                    Em caso de empate na média de tempo, o setor com o <strong>maior número de concluintes</strong> vence o desempate!
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto border-2 border-stone-900 bg-[#FDFBF7] shadow-[6px_6px_0px_#1C1917]">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-stone-900 text-white border-b-2 border-[#D99B38] text-[11px] font-black uppercase tracking-[0.16em]">
                      <th className="py-3.5 px-4"># Pódio</th>
                      <th className="py-3.5 px-4">Setor / Departamento</th>
                      <th className="py-3.5 px-4 text-center">Pessoas Participantes</th>
                      <th className="py-3.5 px-4">Total de Erros</th>
                      <th className="py-3.5 px-4">Melhor Tempo</th>
                      <th className="py-3.5 px-4 text-right">Média do Setor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200">
                    {rankingSetores.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-stone-500 font-semibold text-xs uppercase tracking-wider">
                          Nenhum setor computado ainda.
                        </td>
                      </tr>
                    ) : (
                      paginatedSetores.map((setorItem, idx) => {
                        const isCurrentSector = setorItem.setor === player?.setor
                        const isQualificado = Boolean(setorItem.qualificado)

                        return (
                          <tr
                            key={setorItem.setor || idx}
                            className={
                              isCurrentSector
                                ? 'bg-[#F5F0E6] border-l-4 border-l-[#D99B38]'
                                : isQualificado
                                  ? 'hover:bg-[#F5F0E6]/60 transition-colors'
                                  : 'bg-stone-50/70 text-stone-400 hover:bg-stone-100/70 transition-colors'
                            }
                          >
                            <td className="py-3.5 px-4 font-mono font-black">
                              {isQualificado ? (
                                <span className="text-[#B87D1E]">{setorItem.posicao}º</span>
                              ) : (
                                <span className="text-[10px] uppercase font-bold text-stone-500 bg-stone-200 px-2 py-0.5">
                                  Aguardando Quórum
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 font-bold text-stone-900">
                              {setorItem.setor}
                              {isCurrentSector && (
                                <span className="ml-2 text-[10px] font-black uppercase bg-[#D99B38] text-stone-950 px-1.5 py-0.5">
                                  Sua Equipe
                                </span>
                              )}
                            </td>
                            {/* Coluna de Pessoas Participantes: Apenas a contagem limpa de colaboradores */}
                            <td className="py-3.5 px-4 text-center">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono font-black border ${
                                  isQualificado
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                    : 'bg-stone-100 text-stone-700 border-stone-300'
                                }`}
                              >
                                <Users className="w-3.5 h-3.5" />
                                <span>
                                  {setorItem.participantesConcluidos}{' '}
                                  {setorItem.participantesConcluidos === 1 ? 'colaborador' : 'colaboradores'}
                                </span>
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-mono text-xs font-bold text-stone-600">
                              {setorItem.totalErros} {setorItem.totalErros === 1 ? 'erro' : 'erros'}
                            </td>
                            <td className="py-3.5 px-4 font-mono font-semibold text-stone-700">
                              {formatarTempo(setorItem.melhorTempoSegundos)}
                            </td>
                            <td className="py-3.5 px-4 font-mono font-black text-emerald-700 text-right">
                              {formatarTempo(setorItem.mediaSegundosTotais)}
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>

                {/* Barra de Paginação para Setores (se passar de 10) */}
                {totalPagesSetores > 1 && (
                  <div className="flex items-center justify-between border-t-2 border-stone-900 bg-stone-100 p-3 text-xs font-bold text-stone-700">
                    <span className="font-mono text-stone-600">
                      Página {currentPageSetores} de {totalPagesSetores} ({rankingSetores.length} setores)
                    </span>
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={currentPageSetores <= 1}
                        onClick={() => setCurrentPageSetores((p) => Math.max(1, p - 1))}
                        className="p-1.5 border-2 border-stone-900 bg-white hover:bg-[#D99B38] disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                        title="Página Anterior"
                      >
                        <ChevronLeft className="w-4 h-4 text-stone-900" />
                      </button>
                      <span className="px-2 font-mono text-stone-800">
                        {currentPageSetores} / {totalPagesSetores}
                      </span>
                      <button
                        type="button"
                        disabled={currentPageSetores >= totalPagesSetores}
                        onClick={() => setCurrentPageSetores((p) => Math.min(totalPagesSetores, p + 1))}
                        className="p-1.5 border-2 border-stone-900 bg-white hover:bg-[#D99B38] disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                        title="Próxima Página"
                      >
                        <ChevronRight className="w-4 h-4 text-stone-900" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

export default FinalRankingScreen
