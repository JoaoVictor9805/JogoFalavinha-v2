import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  Award,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flame,
  History,
  Info,
  LogOut,
  Play,
  RotateCcw,
  Sparkles,
  Star,
  Trophy,
  Users,
} from 'lucide-react'
import { useGame } from '../../context/gameContextInstance'
import { getWaxSealByMemberId } from '../../data/waxSealsData'
import { calcularAssertividade, formatarTempo } from '../../utils/validacaoDesafio'
import CeoVerdictSection from './CeoVerdictSection'

const ITEMS_PER_PAGE = 10
const RANKING_POLL_INTERVAL_MS = 15000

function formatUpdateClock(date) {
  if (!date) return ''
  return date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function FinalRankingScreen() {
  const {
    player,
    activePartida,
    challenges,
    realSeconds,
    penaltySeconds,
    bonusSeconds,
    totalSeconds,
    totalErrors,
    memberProgress,
    rankingHistory,
    rankingSetores,
    playerHistory,
    justFinished,
    actionError,
    clearActionError,
    restartGame,
    logout,
    recarregarRankings,
    carregarHistoricoTentativas,
  } = useGame()

  // Alternância interna do Placar: 'geral' (Individual) | 'setores' (Equipes)
  const [rankingTab, setRankingTab] = useState('geral')
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null)

  const [currentPageGeral, setCurrentPageGeral] = useState(1)
  const [currentPageSetores, setCurrentPageSetores] = useState(1)
  const [currentPageTentativas, setCurrentPageTentativas] = useState(1)

  const isRefreshingRef = useRef(false)
  const lastFetchMsRef = useRef(0)

  const executeRankingRefresh = useCallback(async () => {
    if (isRefreshingRef.current || !recarregarRankings) return
    isRefreshingRef.current = true
    try {
      await recarregarRankings()
      lastFetchMsRef.current = Date.now()
      setLastUpdatedAt(new Date())
    } finally {
      isRefreshingRef.current = false
    }
  }, [recarregarRankings])

  // Carga inicial ao abrir a tela
  useEffect(() => {
    let cancelled = false
    Promise.all([
      recarregarRankings ? recarregarRankings() : Promise.resolve(),
      player?.id && carregarHistoricoTentativas
        ? carregarHistoricoTentativas()
        : Promise.resolve(),
    ]).then(() => {
      if (cancelled) return
      lastFetchMsRef.current = Date.now()
      setLastUpdatedAt(new Date())
    })
    return () => {
      cancelled = true
    }
  }, [player?.id, carregarHistoricoTentativas, recarregarRankings])

  // Polling seguro a cada 15s (pausa quando a aba está oculta e atualiza ao retornar)
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        executeRankingRefresh()
      }
    }, RANKING_POLL_INTERVAL_MS)

    const handleVisibilityChange = () => {
      if (
        document.visibilityState === 'visible' &&
        Date.now() - lastFetchMsRef.current >= RANKING_POLL_INTERVAL_MS
      ) {
        executeRankingRefresh()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [executeRankingRefresh])

  const councilList = Array.isArray(challenges) && challenges.length > 0 ? challenges : []
  const tentativasList = playerHistory?.tentativas || []
  const melhorPartida = playerHistory?.melhorPartida || null
  const ultimaPartida = playerHistory?.ultimaPartida || null
  const latestAttempt = ultimaPartida || tentativasList[0] || null
  const hasCompletedRun = Boolean(justFinished || melhorPartida || latestAttempt)
  const effectiveTotalErrors = justFinished
    ? totalErrors
    : (latestAttempt?.totalErros ?? melhorPartida?.totalErros ?? 0)
  const effectivePartidaId = justFinished
    ? activePartida?.id
    : (latestAttempt?.id ?? melhorPartida?.id ?? null)

  const displayTotalSeconds = justFinished
    ? totalSeconds
    : (latestAttempt?.segundosTotais ?? melhorPartida?.segundosTotais ?? 0)
  const displayRealSeconds = justFinished
    ? realSeconds
    : (latestAttempt?.segundosReais ?? melhorPartida?.segundosReais ?? 0)
  const displayPenaltySeconds = justFinished
    ? penaltySeconds
    : (latestAttempt?.segundosPenalidade ?? melhorPartida?.segundosPenalidade ?? 0)
  const displayBonusSeconds = justFinished
    ? bonusSeconds
    : (latestAttempt?.segundosBonus ?? melhorPartida?.segundosBonus ?? 0)
  const assertividadeFinal = calcularAssertividade(
    councilList.length,
    councilList.length + effectiveTotalErrors
  )
  const displayMemberDetails = justFinished
    ? memberProgress
    : (ultimaPartida?.detalhesPorMembro || {})

  const currentUserRankingEntry = useMemo(
    () => rankingHistory.find((item) => Boolean(item.isCurrentUser)) || null,
    [rankingHistory]
  )

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

  // Paginação: Minhas Tentativas
  const totalPagesTentativas = Math.max(1, Math.ceil(tentativasList.length / ITEMS_PER_PAGE))
  const paginatedTentativas = tentativasList.slice(
    (currentPageTentativas - 1) * ITEMS_PER_PAGE,
    currentPageTentativas * ITEMS_PER_PAGE
  )

  return (
    <div className="min-h-screen w-full bg-[#F5F0E6] text-stone-900 pt-22 pb-16 px-4 sm:px-8 flex flex-col justify-center">
      <div className="max-w-6xl w-full mx-auto space-y-10">
        {/* ========================================================= */}
        {/* 0. VEREDITO DO CEO (EXIBIDO SEMPRE NO TOPO DA TELA FINAL) */}
        {/* ========================================================= */}
        <CeoVerdictSection
          playerName={player?.nome}
          totalErrors={effectiveTotalErrors}
          activePartidaId={effectivePartidaId}
          rankingHistory={rankingHistory}
          melhorPartida={melhorPartida}
          tentativasCount={tentativasList.length}
          hasCompletedRun={hasCompletedRun}
          justFinished={justFinished}
        />

        {/* ========================================================= */}
        {/* 1. BLOCO SUPERIOR DE RESUMO / PAINEL DE DESEMPENHO        */}
        {/* ========================================================= */}
        <section className="bg-[#FDFBF7] border-2 border-stone-900 p-6 sm:p-8 shadow-[6px_6px_0px_#1C1917] space-y-6 animate-modal-pop">
          {/* Cabeçalho do Card */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-stone-200 pb-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-none bg-[#D99B38] text-stone-950 border-2 border-stone-900 shadow-[3px_3px_0px_#1C1917] flex items-center justify-center shrink-0">
                {justFinished ? (
                  <Trophy className="w-7 h-7 animate-vn-idle" />
                ) : (
                  <Award className="w-7 h-7" />
                )}
              </div>

              <div>
                <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-stone-900">
                  {justFinished
                    ? 'Você Passou pelo Conselho Next!'
                    : hasCompletedRun
                      ? 'Resumo da Última Partida'
                      : 'Painel de Desempenho & Recordes'}
                </h1>
                <p className="text-xs sm:text-sm text-stone-600 mt-0.5">
                  {justFinished ? (
                    <>
                      Parabéns, <strong className="text-stone-900">{player?.nome}</strong> (
                      {player?.setor} · {player?.unidade}). Sua aprovação foi registrada no ranking!
                    </>
                  ) : hasCompletedRun ? (
                    <>
                      Colaborador: <strong className="text-stone-900">{player?.nome}</strong> (
                      {player?.setor} · {player?.unidade})
                      {latestAttempt?.tentativaNumero ? ` · Tentativa #${latestAttempt.tentativaNumero}` : ''}.
                    </>
                  ) : (
                    <>
                      Colaborador: <strong className="text-stone-900">{player?.nome}</strong> (
                      {player?.setor} · {player?.unidade}).
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Botões Lado a Lado: Trocar Usuário na esquerda, Jogar Novamente na direita */}
            <div className="flex flex-row flex-nowrap items-center gap-2.5 sm:gap-3 shrink-0">
              {player && (
                <button
                  type="button"
                  onClick={logout}
                  className="inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-3 rounded-none bg-stone-100 hover:bg-stone-200 text-stone-800 hover:text-stone-950 border-2 border-stone-900 font-black text-xs sm:text-sm uppercase tracking-[0.14em] shadow-[3px_3px_0px_#1C1917] hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_#1C1917] active:scale-95 transition-all cursor-pointer whitespace-nowrap"
                  title="Desconectar do usuário atual"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Trocar Usuário</span>
                </button>
              )}

              <button
                type="button"
                onClick={restartGame}
                className="inline-flex items-center justify-center gap-2.5 px-5 sm:px-6 py-3 rounded-none bg-[#D99B38] hover:bg-[#c58927] text-stone-950 border-2 border-stone-900 font-black text-xs sm:text-sm uppercase tracking-[0.18em] shadow-[4px_4px_0px_#1C1917] hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#1C1917] active:scale-95 transition-all cursor-pointer whitespace-nowrap"
              >
                {justFinished ? (
                  <>
                    <RotateCcw className="w-4 h-4" />
                    <span>Jogar Novamente</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    <span>{melhorPartida ? 'Jogar Novamente' : 'Iniciar Desafio'}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Alerta amigável caso ocorra erro de rede ao reiniciar partida */}
          {actionError && (
            <div className="p-3.5 bg-red-50 border-2 border-red-600 flex items-center justify-between gap-3 text-red-800 text-xs sm:text-sm font-semibold">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{actionError}</span>
              </div>
              <button
                type="button"
                onClick={clearActionError}
                className="text-[10px] font-black uppercase px-2 py-0.5 border border-red-400 hover:bg-red-100 cursor-pointer"
              >
                OK
              </button>
            </div>
          )}

          {/* CASO A / RETORNO COM HISTÓRICO: Resumo completo da última partida concluída */}
          {hasCompletedRun ? (
            <>
              {/* Métricas do Tempo Final da Corrida */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-none bg-[#F5F0E6] border-2 border-stone-900 border-l-4 border-l-emerald-600 p-4 animate-panel-rise">
                  <div className="flex items-center justify-between gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-emerald-700">
                    <span className="inline-flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>Tempo Final Oficial</span>
                    </span>
                    {effectiveTotalErrors === 0 && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-emerald-600 text-white text-[9px] font-black">
                        <Flame className="w-3 h-3" />
                        INVICTO
                      </span>
                    )}
                  </div>
                  <div className="font-mono text-3xl sm:text-4xl font-black text-stone-900 mt-1.5">
                    {formatarTempo(displayTotalSeconds)}
                  </div>
                  <div className="text-xs text-stone-500 mt-1">
                    {displayTotalSeconds}{' '}
                    {displayTotalSeconds === 1
                      ? 'segundo contabilizado'
                      : 'segundos contabilizados'}{' '}
                    · Assertividade: <strong className="text-stone-700">{assertividadeFinal}%</strong>
                  </div>
                </div>

                <div
                  className="rounded-none bg-[#F5F0E6] border-2 border-stone-900 border-l-4 border-l-[#D99B38] p-4 animate-panel-rise"
                  style={{ animationDelay: '70ms' }}
                >
                  <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-[#B87D1E]">
                    <Award className="w-4 h-4" />
                    <span>Tempo Real &amp; Bônus</span>
                  </div>
                  <div className="font-mono text-2xl sm:text-3xl font-extrabold text-stone-900 mt-1.5">
                    {formatarTempo(displayRealSeconds)}
                  </div>
                  <div className="text-xs text-stone-500 mt-1">
                    {displayBonusSeconds > 0 ? (
                      <span className="font-bold text-emerald-700">
                        -{displayBonusSeconds}s de bônus (combo/invicto) aplicado
                      </span>
                    ) : (
                      'Tempo líquido sem contar ajustes'
                    )}
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
                    +{displayPenaltySeconds}s
                  </div>
                  <div className="text-xs text-stone-500 mt-1">
                    {effectiveTotalErrors}{' '}
                    {effectiveTotalErrors === 1 ? 'erro cometido' : 'erros cometidos'}
                  </div>
                </div>
              </div>

              {/* Resumo das 7 Cadeiras do Conselho com os 7 Selos de Cera Conquistados */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 pt-1">
                {councilList.map((m, idx) => {
                  const st = displayMemberDetails[m.id] || {
                    errors: 0,
                    totalErrors: 0,
                    penaltySeconds: 0,
                  }
                  const totalMemberErrors = st.totalErrors ?? st.errors ?? 0
                  const totalMemberPenalty = st.penaltySeconds ?? totalMemberErrors * 5
                  const waxSeal = getWaxSealByMemberId(m.id)
                  return (
                    <div
                      key={m.id}
                      style={{ animationDelay: `${180 + idx * 45}ms` }}
                      className={`group rounded-none bg-[#F5F0E6] border-2 border-stone-300 border-t-4 ${
                        waxSeal?.accentBorder || 'border-t-stone-900'
                      } p-3 text-center space-y-1.5 animate-panel-rise`}
                    >
                      {waxSeal?.image ? (
                        <div className="mx-auto w-14 h-14 flex items-center justify-center">
                          <img
                            src={waxSeal.image}
                            alt={`Selo de ${m.name}`}
                            draggable={false}
                            style={{ transform: `rotate(${waxSeal.cardTiltDeg}deg)` }}
                            className="w-full h-full object-contain drop-shadow-[0_4px_7px_rgba(28,25,23,0.35)] transition-transform duration-200 group-hover:scale-110"
                          />
                        </div>
                      ) : (
                        <div className="inline-flex items-center justify-center w-6 h-6 rounded-none bg-emerald-600 text-white">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </div>
                      )}
                      <div className="text-xs font-black uppercase tracking-tight text-stone-900 truncate">
                        {m.name}
                      </div>
                      <div
                        className={`text-[11px] font-mono font-bold ${
                          totalMemberErrors > 0 ? 'text-red-600' : 'text-emerald-700'
                        }`}
                      >
                        {totalMemberErrors === 0
                          ? 'Sem erros'
                          : `${totalMemberErrors} ${totalMemberErrors === 1 ? 'erro' : 'erros'} (+${totalMemberPenalty}s)`}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Banner Informativo de Recorde ao revisitar a tela via login/reload */}
              {!justFinished && melhorPartida && (
                <div className="p-3.5 bg-stone-100 border-2 border-stone-300 flex flex-wrap items-center justify-between gap-2.5 text-stone-700 text-xs">
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-[#B87D1E] shrink-0" />
                    <span>
                      Seu recorde oficial de <strong>{formatarTempo(melhorPartida.segundosTotais)}</strong> ({tentativasList.length}{' '}
                      {tentativasList.length === 1 ? 'tentativa concluída' : 'tentativas concluídas'}) pontua no ranking individual e pela equipe do setor <strong>{player?.setor}</strong>.
                    </span>
                  </div>
                  {currentUserRankingEntry && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#D99B38] text-stone-950 border border-stone-900 text-[10px] font-mono font-black shrink-0">
                      <Trophy className="w-3 h-3" />
                      <span>{currentUserRankingEntry.posicao}º Lugar</span>
                    </span>
                  )}
                </div>
              )}
            </>
          ) : (
            /* CASO C: Acessou via Login mas ainda não completou nenhuma tentativa */
            <div className="p-6 bg-stone-100 border-2 border-dashed border-stone-400 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-none bg-[#D99B38]/20 text-[#B87D1E] border-2 border-stone-900 flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black uppercase text-stone-900">
                Você ainda não possui tentativas concluídas no ranking
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 max-w-lg mx-auto">
                Desafie os 7 conselheiros no labirinto da Falavinha Next, teste seus conhecimentos e registre seu tempo para figurar no ranking e pontuar pela sua equipe!
              </p>
            </div>
          )}
        </section>

        {/* ========================================================= */}
        {/* 2. BLOCO DE RANKING: PLACAR OFICIAL DA CONEXÃO NEXT       */}
        {/* ========================================================= */}
        <section
          className="space-y-4 animate-panel-rise"
          style={{ animationDelay: '220ms' }}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-l-4 border-[#D99B38] pl-4">
            <div className="flex flex-wrap items-center gap-2.5">
              <Trophy className="w-5 h-5 text-stone-900" />
              <h2 className="text-lg font-black uppercase tracking-tight text-stone-900">
                Placar Oficial da Conexão Next
              </h2>
              <span
                title="O placar atualiza automaticamente a cada 15 segundos enquanto esta aba estiver visível"
                className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-[#FDFBF7] border border-stone-300 text-[10px] font-mono font-bold text-stone-600"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>
                  Ao vivo{lastUpdatedAt ? ` · ${formatUpdateClock(lastUpdatedAt)}` : ''}
                </span>
              </span>
            </div>

            {/* Alternância de Abas: Individual vs Setores */}
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
                      const bonusSec = item.bonusSeconds || 0
                      const isCurrentUser = Boolean(item.isCurrentUser)

                      return (
                        <tr
                          key={item.posicao || idx}
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
                            <span>{item.nome}</span>
                            {item.invicto && (
                              <span
                                title="Concluiu os 7 desafios sem nenhum erro"
                                className="ml-2 inline-flex items-center gap-1 text-[10px] font-black uppercase bg-emerald-600 text-white px-1.5 py-0.5"
                              >
                                <Flame className="w-2.5 h-2.5" />
                                Invicto
                              </span>
                            )}
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
                          <td className="py-3.5 px-4 font-mono text-xs font-bold">
                            <span className="text-red-600">
                              +{item.penaltySeconds || 0}s ({errCount}{' '}
                              {errCount === 1 ? 'erro' : 'erros'})
                            </span>
                            {bonusSec > 0 && (
                              <span className="ml-2 text-emerald-700">-{bonusSec}s bônus</span>
                            )}
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

              {/* Paginação Ranking Geral */}
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
                            <td className="py-3.5 px-4 text-center">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono font-black border ${
                                  isQualificado
                                    ? 'bg-emerald-100 text-emerald-900 border-emerald-400'
                                    : 'bg-amber-100 text-amber-900 border-amber-400'
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

                {/* Paginação Setores */}
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

        {/* ========================================================= */}
        {/* 3. BLOCO DEDICADO: MINHAS TENTATIVAS (ABAIXO DO RANKING)  */}
        {/* ========================================================= */}
        <section
          className="space-y-4 animate-panel-rise"
          style={{ animationDelay: '300ms' }}
        >
          <div className="flex items-center justify-between gap-4 border-l-4 border-stone-900 pl-4">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-stone-900" />
              <h2 className="text-lg font-black uppercase tracking-tight text-stone-900">
                Minhas Tentativas Anteriores
              </h2>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-stone-200 border border-stone-800 text-xs font-mono font-black text-stone-900">
              {tentativasList.length}{' '}
              {tentativasList.length === 1 ? 'tentativa concluída' : 'tentativas concluídas'}
            </span>
          </div>

          <div className="overflow-x-auto border-2 border-stone-900 bg-[#FDFBF7] shadow-[6px_6px_0px_#1C1917]">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-stone-900 text-white border-b-2 border-[#D99B38] text-[11px] font-black uppercase tracking-[0.16em]">
                  <th className="py-3.5 px-4"># Tentativa</th>
                  <th className="py-3.5 px-4">Concluída em</th>
                  <th className="py-3.5 px-4">Tempo de Percurso</th>
                  <th className="py-3.5 px-4">Penalidades</th>
                  <th className="py-3.5 px-4">Destaque</th>
                  <th className="py-3.5 px-4 text-right">Tempo Oficial</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {tentativasList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-stone-500 font-semibold text-xs uppercase tracking-wider">
                      Você ainda não possui tentativas concluídas no ranking. Conclua uma corrida no labirinto para registrar seu tempo aqui!
                    </td>
                  </tr>
                ) : (
                  paginatedTentativas.map((item) => (
                    <tr
                      key={item.id}
                      className={
                        item.isMelhorTempo
                          ? 'bg-[#F5F0E6] border-l-4 border-l-[#D99B38]'
                          : 'hover:bg-[#F5F0E6]/60 transition-colors'
                      }
                    >
                      <td className="py-3.5 px-4 font-mono font-black text-stone-900">
                        Tentativa #{item.tentativaNumero}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-semibold text-stone-600">
                        {item.completedAt || '-'}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-stone-700">
                        {formatarTempo(item.segundosReais)}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs font-bold">
                        <span className="text-red-600">
                          +{item.segundosPenalidade || 0}s ({item.totalErros || 0}{' '}
                          {item.totalErros === 1 ? 'erro' : 'erros'})
                        </span>
                        {(item.segundosBonus || 0) > 0 && (
                          <span className="ml-2 text-emerald-700">-{item.segundosBonus}s bônus</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {item.isMelhorTempo && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase bg-[#D99B38] text-stone-950 px-2 py-0.5 border border-stone-900 shadow-[1px_1px_0px_#1C1917]">
                              <Star className="w-3 h-3 fill-stone-950" />
                              Recorde Pessoal
                            </span>
                          )}
                          {item.invicto && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase bg-emerald-600 text-white px-2 py-0.5 border border-stone-900">
                              <Flame className="w-3 h-3" />
                              Invicto
                            </span>
                          )}
                          {!item.isMelhorTempo && !item.invicto && (
                            <span className="text-xs text-stone-400 font-medium">—</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-black text-emerald-700 text-right">
                        {formatarTempo(item.segundosTotais)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Paginação: Mostra até 10 direto, a partir disso paginação */}
            {totalPagesTentativas > 1 && (
              <div className="flex items-center justify-between border-t-2 border-stone-900 bg-stone-100 p-3 text-xs font-bold text-stone-700">
                <span className="font-mono text-stone-600">
                  Página {currentPageTentativas} de {totalPagesTentativas} ({tentativasList.length} tentativas)
                </span>
                <div className="inline-flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={currentPageTentativas <= 1}
                    onClick={() => setCurrentPageTentativas((p) => Math.max(1, p - 1))}
                    className="p-1.5 border-2 border-stone-900 bg-white hover:bg-[#D99B38] disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                    title="Página Anterior"
                  >
                    <ChevronLeft className="w-4 h-4 text-stone-900" />
                  </button>
                  <span className="px-2 font-mono text-stone-800">
                    {currentPageTentativas} / {totalPagesTentativas}
                  </span>
                  <button
                    type="button"
                    disabled={currentPageTentativas >= totalPagesTentativas}
                    onClick={() => setCurrentPageTentativas((p) => Math.min(totalPagesTentativas, p + 1))}
                    className="p-1.5 border-2 border-stone-900 bg-white hover:bg-[#D99B38] disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                    title="Próxima Página"
                  >
                    <ChevronRight className="w-4 h-4 text-stone-900" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

export default FinalRankingScreen
