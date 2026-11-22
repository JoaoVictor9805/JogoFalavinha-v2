import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  COUNCIL_MEMBERS,
  estimateSpeechTypingMs,
  pickErrorDialogue,
  pickOpeningGreeting,
} from '../data/conselhoNextData'
import { apiService } from '../services/apiService'
import {
  playApprovalSound,
  playCouncilPopSound,
  playPenaltySound,
  playSelectSound,
} from '../utils/soundEffects'
import { GameContext } from './gameContextInstance'

const LEGACY_PLAYER_STORAGE_KEY = 'conselho_next_last_player_v2'
const OPTION_LABELS = ['a)', 'b)', 'c)', 'd)']
const BLOCKED_READING_MS = 3500
const MIN_APPROVAL_READING_MS = 2500
const POST_SPEECH_PAUSE_MS = 1000
const POST_SKIP_GRACE_MS = 800
const MAX_APPROVAL_CROSSTALK_PER_MATCH = 2
export const COUNCIL_POP_STAGGER_MS = 300
const COUNCIL_POP_DURATION_MS = 780
const COUNCIL_POP_SETTLE_MS = 420
const COUNCIL_IMPACT_SOUND_OFFSET_MS = 135

// Flag de teste para animação 3D de erro (telefone tocando) na reprovação após 3 erros
export const ENABLE_3D_ERROR_ANIMATION = true

function shuffleOptionsList(options = []) {
  const list = [...options]
  for (let i = list.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
      ;[list[i], list[j]] = [list[j], list[i]]
  }
  return list.map((opt, idx) => ({
    ...opt,
    label: OPTION_LABELS[idx] || `${idx + 1})`,
  }))
}

function shuffleChallengesOptions(membersList = COUNCIL_MEMBERS) {
  return membersList.map((member) => ({
    ...member,
    options: shuffleOptionsList(member.options || []),
  }))
}

function createInitialMemberProgress(membersList = COUNCIL_MEMBERS) {
  const initial = {}
  membersList.forEach((member) => {
    initial[member.id] = {
      completed: false,
      errors: 0,
      totalErrors: 0,
      penaltySeconds: 0,
      disabledOptions: [],
    }
  })
  return initial
}

function buildProgressFromPartida(partida, membersList = COUNCIL_MEMBERS) {
  const initial = createInitialMemberProgress(membersList)
  const concluidos = partida?.membrosConcluidos || []
  const desabilitadas = partida?.opcoesDesabilitadas || []
  const tentativasErradas = partida?.tentativas || []

  concluidos.forEach((id) => {
    if (initial[id]) {
      initial[id].completed = true
    }
  })

  desabilitadas.forEach((d) => {
    if (initial[d.membroId]) {
      initial[d.membroId].disabledOptions = Array.from(
        new Set([...initial[d.membroId].disabledOptions, d.opcaoId])
      )
      initial[d.membroId].errors = initial[d.membroId].disabledOptions.length
    }
  })

  tentativasErradas.forEach((t) => {
    if (initial[t.desafioId]) {
      initial[t.desafioId].totalErrors += 1
      initial[t.desafioId].penaltySeconds += Number(t.penalidadeAplicada) || 5
    }
  })

  return initial
}

function buildLocksFromPartida(partida) {
  const locks = {}
  const now = Date.now()
    ; (partida?.bloqueios || []).forEach((b) => {
      if (!b?.bloqueadoAte) return
      const ts = new Date(b.bloqueadoAte).getTime()
      if (Number.isFinite(ts) && ts > now) {
        locks[b.membroId] = ts
      }
    })
  return locks
}

function clearLegacyPlayerStorage() {
  try {
    localStorage.removeItem(LEGACY_PLAYER_STORAGE_KEY)
  } catch {
    // Armazenamento local indisponível (modo privado)
  }
}

export function GameProvider({ children }) {
  // Progressão de telas: 'REGISTRATION' | 'COMIC_INTRO' | 'TRANSITION_ARRIVAL' | 'TRIBUNAL_HUB' | 'TRANSITION_EXIT' | 'FINAL_RANKING'
  const [screen, setScreen] = useState('REGISTRATION')
  const [isRestoringSession, setIsRestoringSession] = useState(true)
  const [player, setPlayer] = useState(null)
  const [activePartida, setActivePartida] = useState(null)
  const [challenges, setChallenges] = useState(() => shuffleChallengesOptions(COUNCIL_MEMBERS))
  const [authError, setAuthError] = useState('')
  const [actionError, setActionError] = useState('')
  const [justFinished, setJustFinished] = useState(false)
  const [playerHistory, setPlayerHistory] = useState({
    totalTentativas: 0,
    melhorPartida: null,
    tentativas: [],
  })

  // Cronômetro global em segundos reais, penalidades e bônus de combo/invicto
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [isTimerPausedForApproval, setIsTimerPausedForApproval] = useState(false)
  const [realSeconds, setRealSeconds] = useState(0)
  const [penaltySeconds, setPenaltySeconds] = useState(0)
  const [bonusSeconds, setBonusSeconds] = useState(0)
  const [comboAtual, setComboAtual] = useState(0)
  const [totalCombos, setTotalCombos] = useState(0)
  const [penaltyAlert, setPenaltyAlert] = useState({ key: 0, seconds: 5 })
  const [comboAlert, setComboAlert] = useState({ key: 0, seconds: 0, label: '' })

  // Estado dos 7 conselheiros, bloqueios temporários (20s), Overlay VN e Modal 3D
  const [memberProgress, setMemberProgress] = useState(() =>
    createInitialMemberProgress(COUNCIL_MEMBERS)
  )
  const [memberLocks, setMemberLocks] = useState({})
  const [activeMemberId, setActiveMemberId] = useState(null)
  const [vnFeedback, setVnFeedback] = useState('idle') // 'idle' | 'wrong' | 'blocked' | 'approved'
  const [vnApprovalMessage, setVnApprovalMessage] = useState('')
  const [approvalReadingState, setApprovalReadingState] = useState(null)
  const [vnSpeechText, setVnSpeechText] = useState('')
  const [vnSpeechKey, setVnSpeechKey] = useState(0)
  const [vnErrorStep, setVnErrorStep] = useState(0)
  const [isLocked, setIsLocked] = useState(false)
  const [ceoBriefingDismissed, setCeoBriefingDismissed] = useState(false)
  const [councilEntranceState, setCouncilEntranceState] = useState('done') // 'waiting' | 'animating' | 'done'
  const [mazeModal, setMazeModal] = useState(null)
  const [screenFadePhase, setScreenFadePhase] = useState('idle') // 'idle' | 'fade-to-black' | 'fade-from-black'

  // Rankings oficiais do servidor (Geral e por Setor)
  const [rankingHistory, setRankingHistory] = useState([])
  const [rankingSetores, setRankingSetores] = useState([])

  const lockRef = useRef(false)
  const timersRef = useRef([])
  const approvalTimeoutRef = useRef(null)
  const approvalSafetyTimeoutRef = useRef(null)
  const pendingApprovalRef = useRef(null)
  const crossTalkHistoryRef = useRef({
    citedMemberIds: [],
    chairHadCrossTalk: {},
    approvalCrossTalkCount: 0,
    lastOpeningWasCrossTalk: false,
  })
  const stateSnapshotRef = useRef({
    realSeconds: 0,
    penaltySeconds: 0,
    bonusSeconds: 0,
    player: null,
    activePartida: null,
    challenges: COUNCIL_MEMBERS,
    memberProgress: createInitialMemberProgress(COUNCIL_MEMBERS),
    vnSpeechText: '',
  })

  useEffect(() => {
    stateSnapshotRef.current = {
      realSeconds,
      penaltySeconds,
      bonusSeconds,
      player,
      activePartida,
      challenges,
      memberProgress,
      vnSpeechText,
    }
  }, [
    realSeconds,
    penaltySeconds,
    bonusSeconds,
    player,
    activePartida,
    challenges,
    memberProgress,
    vnSpeechText,
  ])

  const resetCrossTalkHistory = useCallback(() => {
    crossTalkHistoryRef.current = {
      citedMemberIds: [],
      chairHadCrossTalk: {},
      approvalCrossTalkCount: 0,
      lastOpeningWasCrossTalk: false,
    }
  }, [])

  const recordCrossTalkUsage = useCallback((memberId, citedMemberId, { isApproval = false } = {}) => {
    const hist = crossTalkHistoryRef.current
    if (memberId) {
      hist.chairHadCrossTalk[memberId] = true
    }
    if (citedMemberId) {
      hist.citedMemberIds = [...hist.citedMemberIds, Number(citedMemberId)]
    }
    if (isApproval) {
      hist.approvalCrossTalkCount += 1
    }
  }, [])

  const clearApprovalTimers = useCallback(() => {
    if (approvalTimeoutRef.current) {
      clearTimeout(approvalTimeoutRef.current)
      approvalTimeoutRef.current = null
    }
    if (approvalSafetyTimeoutRef.current) {
      clearTimeout(approvalSafetyTimeoutRef.current)
      approvalSafetyTimeoutRef.current = null
    }
    pendingApprovalRef.current = null
  }, [])

  const registerTimeout = useCallback((fn, delay) => {
    const id = setTimeout(fn, delay)
    timersRef.current.push(id)
    return id
  }, [])

  const clearAllTimeouts = useCallback(() => {
    timersRef.current.forEach((id) => clearTimeout(id))
    timersRef.current = []
    clearApprovalTimers()
  }, [clearApprovalTimers])

  useEffect(() => {
    return () => clearAllTimeouts()
  }, [clearAllTimeouts])

  // Redireciona automaticamente para o login caso a sessão expire ou seja revogada (401)
  const handleUnauthorizedSession = useCallback(
    (message) => {
      clearAllTimeouts()
      resetCrossTalkHistory()
      clearLegacyPlayerStorage()
      lockRef.current = false
      setIsLocked(false)
      setChallenges(COUNCIL_MEMBERS)
      setPlayer(null)
      setActivePartida(null)
      setIsTimerRunning(false)
      setIsTimerPausedForApproval(false)
      setRealSeconds(0)
      setPenaltySeconds(0)
      setBonusSeconds(0)
      setComboAtual(0)
      setTotalCombos(0)
      setPenaltyAlert({ key: 0, seconds: 5 })
      setComboAlert({ key: 0, seconds: 0, label: '' })
      setMemberProgress(createInitialMemberProgress(COUNCIL_MEMBERS))
      setMemberLocks({})
      setActiveMemberId(null)
      setVnFeedback('idle')
      setVnApprovalMessage('')
      setApprovalReadingState(null)
      setVnSpeechText('')
      setVnErrorStep(0)
      setCeoBriefingDismissed(false)
      setCouncilEntranceState('waiting')
      setMazeModal(null)
      setPlayerHistory({ totalTentativas: 0, melhorPartida: null, tentativas: [] })
      setRankingHistory([])
      setRankingSetores([])
      setJustFinished(false)
      setActionError('')
      setAuthError(message || 'Sua sessão expirou ou foi encerrada. Faça login novamente.')
      setScreen('REGISTRATION')
    },
    [clearAllTimeouts, resetCrossTalkHistory]
  )

  const recarregarRankings = useCallback(async () => {
    try {
      const [geral, setores] = await Promise.all([
        apiService.obterRankingGeral(),
        apiService.obterRankingSetores(),
      ])
      setRankingHistory(geral || [])
      setRankingSetores(setores || [])
    } catch (err) {
      if (err?.status === 401) {
        handleUnauthorizedSession(err.message)
        return
      }
      console.warn('[GameContext] Erro ao carregar rankings:', err)
    }
  }, [handleUnauthorizedSession])

  const carregarHistoricoTentativas = useCallback(async () => {
    try {
      const res = await apiService.obterMeuHistorico()
      if (res) {
        setPlayerHistory({
          totalTentativas: res.totalTentativas || 0,
          melhorPartida: res.melhorPartida || null,
          tentativas: res.tentativas || [],
        })
        return res
      }
    } catch (err) {
      if (err?.status === 401) {
        handleUnauthorizedSession(err.message)
        return null
      }
      console.warn('[GameContext] Erro ao carregar histórico de tentativas:', err)
    }
    return null
  }, [handleUnauthorizedSession])

  const carregarDesafiosAutenticado = useCallback(async () => {
    try {
      const desafiosApi = await apiService.obterDesafios()
      if (Array.isArray(desafiosApi) && desafiosApi.length > 0) {
        const shuffled = shuffleChallengesOptions(desafiosApi)
        setChallenges(shuffled)
        return shuffled
      }
    } catch (err) {
      if (err?.status === 401) {
        handleUnauthorizedSession(err.message)
        return COUNCIL_MEMBERS
      }
      console.warn('[GameContext] Erro ao carregar desafios autenticados:', err)
      setActionError(
        'Não foi possível carregar os desafios do servidor. Atualize a página e tente novamente.'
      )
    }
    return COUNCIL_MEMBERS
  }, [handleUnauthorizedSession])

  // Boot único: limpa qualquer resíduo de localStorage, valida sessão e só então carrega rotas protegidas
  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      clearLegacyPlayerStorage()

      try {
        const sessao = await apiService.obterSessao()
        if (cancelled || !sessao?.jogador) return

        const jogador = sessao.jogador
        setPlayer(jogador)

        const [shuffled] = await Promise.all([
          carregarDesafiosAutenticado(),
          recarregarRankings(),
          carregarHistoricoTentativas(),
        ])

        if (cancelled) return

        const partida = sessao.partidaEmAndamento
        if (partida && partida.status === 'EM_ANDAMENTO') {
          const jaIniciouCronometro = Boolean(partida.cronometroIniciadoEm)
          resetCrossTalkHistory()
          setActivePartida(partida)
          setMemberProgress(buildProgressFromPartida(partida, shuffled))
          setMemberLocks(buildLocksFromPartida(partida))
          setRealSeconds(partida.segundosReais || 0)
          setPenaltySeconds(partida.segundosPenalidade || 0)
          setBonusSeconds(partida.segundosBonus || 0)
          setComboAtual(partida.comboAtual || 0)
          setTotalCombos(partida.totalCombos || 0)
          setActiveMemberId(null)
          setVnFeedback('idle')
          setVnApprovalMessage('')
          setApprovalReadingState(null)
          setVnSpeechText('')
          setVnErrorStep(0)
          setMazeModal(null)
          setJustFinished(false)
          setCeoBriefingDismissed(jaIniciouCronometro)
          setCouncilEntranceState(jaIniciouCronometro ? 'done' : 'waiting')
          setIsTimerPausedForApproval(false)
          setIsTimerRunning(jaIniciouCronometro)
          setScreen('TRIBUNAL_HUB')

          if (jaIniciouCronometro && partida.pausadoDesde) {
            apiService
              .retomarCronometro(partida.id)
              .then((res) => {
                if (typeof res?.segundosReais === 'number') {
                  setRealSeconds((prev) => Math.max(prev, res.segundosReais))
                }
              })
              .catch(() => { })
          }
        } else {
          resetCrossTalkHistory()
          setActivePartida(null)
          setIsTimerRunning(false)
          setIsTimerPausedForApproval(false)
          setApprovalReadingState(null)
          setMemberProgress(createInitialMemberProgress(shuffled))
          setMemberLocks({})
          setVnApprovalMessage('')
          setScreen('FINAL_RANKING')
        }
      } catch {
        // Sem sessão ativa: mantém na tela de cadastro/login sem chamar rotas protegidas
      } finally {
        if (!cancelled) {
          setIsRestoringSession(false)
        }
      }
    }

    bootstrap()

    return () => {
      cancelled = true
    }
  }, [
    carregarDesafiosAutenticado,
    carregarHistoricoTentativas,
    recarregarRankings,
    resetCrossTalkHistory,
  ])

  // Cronômetro global em segundo plano (pausa durante a fala final de aprovação)
  useEffect(() => {
    if (!isTimerRunning || isTimerPausedForApproval) return undefined

    const interval = setInterval(() => {
      setRealSeconds((prev) => prev + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [isTimerRunning, isTimerPausedForApproval])

  // Limpa automaticamente bloqueios de 20s expirados
  const hasActiveLocks = Object.keys(memberLocks).length > 0
  useEffect(() => {
    if (!hasActiveLocks) return undefined

    const interval = setInterval(() => {
      const now = Date.now()
      setMemberLocks((prev) => {
        let changed = false
        const next = {}
        Object.entries(prev).forEach(([k, exp]) => {
          if (exp > now) {
            next[k] = exp
          } else {
            changed = true
          }
        })
        return changed ? next : prev
      })
    }, 500)

    return () => clearInterval(interval)
  }, [hasActiveLocks])

  // Sincronização periódica com o relógio oficial do servidor a cada 10 segundos
  useEffect(() => {
    if (!isTimerRunning || isTimerPausedForApproval || !activePartida?.id) return undefined

    const syncInterval = setInterval(() => {
      apiService
        .sincronizarTempo(activePartida.id)
        .then((res) => {
          if (typeof res?.segundosReais === 'number') {
            setRealSeconds((prev) => Math.max(prev, res.segundosReais))
          }
        })
        .catch((err) => {
          if (err?.status === 401) {
            handleUnauthorizedSession(err.message)
          }
        })
    }, 10000)

    return () => clearInterval(syncInterval)
  }, [isTimerRunning, isTimerPausedForApproval, activePartida?.id, handleUnauthorizedSession])

  const totalSeconds = Math.max(
    realSeconds === 0 && penaltySeconds === 0 && bonusSeconds === 0 ? 0 : 1,
    realSeconds + penaltySeconds - bonusSeconds
  )

  const completedCount = useMemo(() => {
    return Object.values(memberProgress).filter((m) => m.completed).length
  }, [memberProgress])

  const totalErrors = useMemo(() => {
    if (typeof activePartida?.totalErros === 'number' && activePartida.totalErros > 0) {
      return activePartida.totalErros
    }
    return Object.values(memberProgress).reduce((acc, m) => acc + m.errors, 0)
  }, [activePartida, memberProgress])

  const activeMember = useMemo(() => {
    if (!activeMemberId) return null
    return challenges.find((m) => m.id === activeMemberId) || null
  }, [activeMemberId, challenges])

  const clearAuthError = useCallback(() => {
    setAuthError('')
  }, [])

  const clearActionError = useCallback(() => {
    setActionError('')
  }, [])

  const triggerBlackoutTransition = useCallback(
    (middleAction, { onFadeComplete, keepLockedAfterFade = false } = {}) => {
      setScreenFadePhase('fade-to-black')
      lockRef.current = true
      setIsLocked(true)

      registerTimeout(() => {
        if (typeof middleAction === 'function') {
          middleAction()
        }
        setScreenFadePhase('fade-from-black')

        registerTimeout(() => {
          setScreenFadePhase('idle')
          if (!keepLockedAfterFade) {
            lockRef.current = false
            setIsLocked(false)
          }
          if (typeof onFadeComplete === 'function') {
            onFadeComplete()
          }
        }, 500)
      }, 500)
    },
    [registerTimeout]
  )

  // 1A. Iniciar jogo através do NOVO CADASTRO
  const startGameFromRegistration = useCallback(
    async (formData) => {
      setAuthError('')
      setActionError('')
      lockRef.current = true
      setIsLocked(true)

      try {
        clearAllTimeouts()
        resetCrossTalkHistory()

        const cadRes = await apiService.cadastrar({
          nome: formData.nome,
          email: formData.email,
          unidade: formData.unidade,
          setor: formData.setor,
          genero: formData.genero || 'masculino',
          senha: formData.senha,
        })

        const jogador = cadRes.jogador
        setPlayer(jogador)

        const [shuffled, partidaRes] = await Promise.all([
          carregarDesafiosAutenticado(),
          apiService.iniciarPartida({ forceNew: true }),
        ])
        setActivePartida(partidaRes.partida)

        setMemberProgress(createInitialMemberProgress(shuffled))
        setMemberLocks({})
        setRealSeconds(0)
        setPenaltySeconds(0)
        setBonusSeconds(0)
        setComboAtual(0)
        setTotalCombos(0)
        setPenaltyAlert({ key: 0, seconds: 5 })
        setComboAlert({ key: 0, seconds: 0, label: '' })
        setActiveMemberId(null)
        setVnFeedback('idle')
        setVnApprovalMessage('')
        setApprovalReadingState(null)
        setCeoBriefingDismissed(false)
        setCouncilEntranceState('waiting')
        setMazeModal(null)
        setIsTimerRunning(false)
        setIsTimerPausedForApproval(false)
        setJustFinished(false)
        setScreen('COMIC_INTRO')
      } catch (err) {
        setAuthError(err.message || 'Não foi possível concluir seu cadastro. Tente novamente.')
        throw err
      } finally {
        lockRef.current = false
        setIsLocked(false)
      }
    },
    [carregarDesafiosAutenticado, clearAllTimeouts, resetCrossTalkHistory]
  )

  // 1B. Iniciar ou Retomar jogo através do LOGIN
  const loginAndStart = useCallback(
    async (loginData) => {
      setAuthError('')
      setActionError('')
      lockRef.current = true
      setIsLocked(true)

      try {
        clearAllTimeouts()
        resetCrossTalkHistory()

        const loginRes = await apiService.login({
          email: loginData.email,
          senha: loginData.senha,
        })

        const jogador = loginRes.jogador
        setPlayer(jogador)

        const [shuffled] = await Promise.all([
          carregarDesafiosAutenticado(),
          carregarHistoricoTentativas(),
          recarregarRankings(),
        ])

        const partida = loginRes.partidaEmAndamento

        if (partida && partida.status === 'EM_ANDAMENTO') {
          const jaIniciouCronometro = Boolean(partida.cronometroIniciadoEm)
          setActivePartida(partida)
          setMemberProgress(buildProgressFromPartida(partida, shuffled))
          setMemberLocks(buildLocksFromPartida(partida))
          setRealSeconds(partida.segundosReais || 0)
          setPenaltySeconds(partida.segundosPenalidade || 0)
          setBonusSeconds(partida.segundosBonus || 0)
          setComboAtual(partida.comboAtual || 0)
          setTotalCombos(partida.totalCombos || 0)
          setPenaltyAlert({ key: 0, seconds: 5 })
          setComboAlert({ key: 0, seconds: 0, label: '' })
          setActiveMemberId(null)
          setVnFeedback('idle')
          setVnApprovalMessage('')
          setApprovalReadingState(null)
          setVnSpeechText('')
          setVnErrorStep(0)
          setMazeModal(null)
          setJustFinished(false)
          setCeoBriefingDismissed(jaIniciouCronometro)
          setCouncilEntranceState(jaIniciouCronometro ? 'done' : 'waiting')
          setIsTimerPausedForApproval(false)
          setIsTimerRunning(jaIniciouCronometro)
          setScreen('TRIBUNAL_HUB')

          if (jaIniciouCronometro && partida.pausadoDesde) {
            apiService
              .retomarCronometro(partida.id)
              .then((res) => {
                if (typeof res?.segundosReais === 'number') {
                  setRealSeconds((prev) => Math.max(prev, res.segundosReais))
                }
              })
              .catch(() => { })
          }
        } else {
          setActivePartida(null)
          setIsTimerRunning(false)
          setIsTimerPausedForApproval(false)
          setRealSeconds(0)
          setPenaltySeconds(0)
          setBonusSeconds(0)
          setComboAtual(0)
          setTotalCombos(0)
          setPenaltyAlert({ key: 0, seconds: 5 })
          setComboAlert({ key: 0, seconds: 0, label: '' })
          setMemberProgress(createInitialMemberProgress(shuffled))
          setMemberLocks({})
          setActiveMemberId(null)
          setVnFeedback('idle')
          setVnApprovalMessage('')
          setApprovalReadingState(null)
          setCeoBriefingDismissed(false)
          setMazeModal(null)
          setJustFinished(false)
          setScreen('FINAL_RANKING')
        }
      } catch (err) {
        setAuthError(err.message || 'Não foi possível entrar agora. Tente novamente.')
        throw err
      } finally {
        lockRef.current = false
        setIsLocked(false)
      }
    },
    [
      carregarDesafiosAutenticado,
      carregarHistoricoTentativas,
      clearAllTimeouts,
      recarregarRankings,
      resetCrossTalkHistory,
    ]
  )

  // Abre o modal 3D de apresentação após o CEO explicar as regras
  const openIntroMazeModal = useCallback(() => {
    playSelectSound()
    triggerBlackoutTransition(() => {
      setMazeModal({ mode: 'intro', fromStep: 0, toStep: 0 })
    })
  }, [triggerBlackoutTransition])

  // Confirma "OK" no modal inicial do labirinto:
  // 1) Revela a sala vazia do Tribunal
  // 2) Dispara a animação em cascata dos 7 conselheiros (esquerda → direita)
  // 3) Assim que todos pousam na bancada, registra a largada oficial do cronômetro no servidor
  const confirmIntroMazeAndStart = useCallback(() => {
    if (lockRef.current) return
    playSelectSound()
    setActionError('')
    const partidaId = stateSnapshotRef.current.activePartida?.id
    const memberCount = stateSnapshotRef.current.challenges?.length || 7
    const totalEntranceMs =
      Math.max(0, memberCount - 1) * COUNCIL_POP_STAGGER_MS +
      COUNCIL_POP_DURATION_MS +
      COUNCIL_POP_SETTLE_MS

    triggerBlackoutTransition(
      () => {
        setMazeModal(null)
        setCeoBriefingDismissed(true)
        setCouncilEntranceState('waiting')
        setIsTimerRunning(false)
      },
      {
        keepLockedAfterFade: true,
        onFadeComplete: () => {
          setCouncilEntranceState('animating')

          for (let i = 0; i < memberCount; i += 1) {
            registerTimeout(() => {
              playCouncilPopSound(i, memberCount)
            }, i * COUNCIL_POP_STAGGER_MS + COUNCIL_IMPACT_SOUND_OFFSET_MS)
          }

          registerTimeout(async () => {
            if (partidaId) {
              try {
                const res = await apiService.iniciarCronometro(partidaId)
                if (typeof res?.segundosReais === 'number') {
                  setRealSeconds(res.segundosReais)
                }
                setActivePartida((prev) =>
                  prev
                    ? {
                      ...prev,
                      cronometroIniciadoEm:
                        res?.cronometroIniciadoEm || prev.cronometroIniciadoEm,
                    }
                    : prev
                )
              } catch (err) {
                if (err?.status === 401) {
                  handleUnauthorizedSession(err.message)
                  return
                }
                console.warn('[GameContext] Falha ao registrar início do cronômetro:', err)
                setActionError(
                  err?.message ||
                  'Não foi possível iniciar o cronômetro no servidor. Atualize a página e tente novamente.'
                )
                setCouncilEntranceState('done')
                lockRef.current = false
                setIsLocked(false)
                return
              }
            }

            setCouncilEntranceState('done')
            setIsTimerRunning(true)
            lockRef.current = false
            setIsLocked(false)
          }, totalEntranceMs)
        },
      }
    )
  }, [handleUnauthorizedSession, registerTimeout, triggerBlackoutTransition])

  // Abre o modal do mapa manualmente (sem fade para preto)
  const openManualMazeModal = useCallback(() => {
    if (lockRef.current) return
    playSelectSound()
    const done = Object.values(stateSnapshotRef.current.memberProgress).filter(
      (m) => m.completed
    ).length
    setMazeModal({ mode: 'manual', fromStep: done, toStep: done })
  }, [])

  // Fecha o modal do mapa (fade para preto apenas na transição final para a saída do Conselho)
  const closeMazeModal = useCallback(() => {
    playSelectSound()
    const isFinalTransition = mazeModal?.mode === 'progress' && mazeModal?.isFinal

    if (isFinalTransition) {
      recarregarRankings()
      carregarHistoricoTentativas()
      triggerBlackoutTransition(() => {
        setMazeModal(null)
        setJustFinished(true)
        setScreen('TRANSITION_EXIT')
      })
      return
    }

    setMazeModal(null)
  }, [carregarHistoricoTentativas, mazeModal, recarregarRankings, triggerBlackoutTransition])

  const advanceFromComic = useCallback(() => {
    if (lockRef.current) return
    lockRef.current = true
    setIsLocked(true)
    playSelectSound()
    setScreen('TRANSITION_ARRIVAL')

    registerTimeout(() => {
      lockRef.current = false
      setIsLocked(false)
    }, 350)
  }, [registerTimeout])

  const finishArrivalTransition = useCallback(() => {
    lockRef.current = false
    setIsLocked(false)
    setScreen('TRIBUNAL_HUB')
  }, [])

  const finishExitTransition = useCallback(() => {
    lockRef.current = false
    setIsLocked(false)
    setScreen('FINAL_RANKING')
  }, [])

  // Finaliza a exibição da aprovação, retoma o cronômetro (visual e servidor) e abre o modal 3D
  const completeApprovalTransition = useCallback(() => {
    const pending = pendingApprovalRef.current
    if (!pending || pending.completed) return
    pending.completed = true

    if (approvalTimeoutRef.current) {
      clearTimeout(approvalTimeoutRef.current)
      approvalTimeoutRef.current = null
    }
    if (approvalSafetyTimeoutRef.current) {
      clearTimeout(approvalSafetyTimeoutRef.current)
      approvalSafetyTimeoutRef.current = null
    }
    pendingApprovalRef.current = null

    const { member, resultado, partidaId } = pending
    const snapshot = stateSnapshotRef.current
    const prevCompleted = Object.values(snapshot.memberProgress).filter(
      (item) => item.completed
    ).length

    const nextProgress = {
      ...snapshot.memberProgress,
      [member.id]: {
        ...snapshot.memberProgress[member.id],
        completed: true,
      },
    }

    setMemberProgress(nextProgress)
    setActiveMemberId(null)
    setVnFeedback('idle')
    setVnApprovalMessage('')
    setApprovalReadingState(null)
    setVnSpeechText('')
    setVnErrorStep(0)
    setActivePartida(resultado.partida)

    const allCompleted = resultado.jogoConcluido
    const nextCompleted = resultado.etapaAtual || prevCompleted + 1

    if (allCompleted) {
      setIsTimerRunning(false)
      setIsTimerPausedForApproval(false)
      recarregarRankings()
      carregarHistoricoTentativas()

      setMazeModal({
        mode: 'progress',
        fromStep: prevCompleted,
        toStep: nextCompleted,
        memberName: member.name,
        isFinal: true,
      })
    } else {
      setIsTimerPausedForApproval(false)
      if (partidaId) {
        apiService
          .retomarCronometro(partidaId)
          .then((res) => {
            if (typeof res?.segundosReais === 'number') {
              setRealSeconds((prev) => Math.max(prev, res.segundosReais))
            }
          })
          .catch((err) => {
            if (err?.status === 401) {
              handleUnauthorizedSession(err.message)
            }
          })
      }

      setMazeModal({
        mode: 'progress',
        fromStep: prevCompleted,
        toStep: nextCompleted,
        memberName: member.name,
        isFinal: false,
      })
    }

    lockRef.current = false
    setIsLocked(false)
  }, [carregarHistoricoTentativas, handleUnauthorizedSession, recarregarRankings])

  const scheduleApprovalClose = useCallback(
    (remainingMs, { skipped = false, speechFinished = false } = {}) => {
      const pending = pendingApprovalRef.current
      if (!pending || pending.completed) return

      if (approvalTimeoutRef.current) {
        clearTimeout(approvalTimeoutRef.current)
        approvalTimeoutRef.current = null
      }

      const safeRemaining = Math.max(150, Math.round(remainingMs))
      const now = Date.now()
      setApprovalReadingState((prev) =>
        prev
          ? {
            ...prev,
            targetEndAt: now + safeRemaining,
            skipped: prev.skipped || skipped,
            speechFinished: prev.speechFinished || speechFinished,
          }
          : null
      )

      approvalTimeoutRef.current = setTimeout(() => {
        completeApprovalTransition()
      }, safeRemaining)
    },
    [completeApprovalTransition]
  )

  const notifyApprovalSpeechSkipped = useCallback(() => {
    const pending = pendingApprovalRef.current
    if (!pending || pending.completed || pending.skipped) return

    pending.skipped = true
    pending.finishScheduled = true
    const elapsed = Date.now() - pending.startedAt
    const remainingMs = Math.max(MIN_APPROVAL_READING_MS - elapsed, POST_SKIP_GRACE_MS)
    scheduleApprovalClose(remainingMs, { skipped: true, speechFinished: true })
  }, [scheduleApprovalClose])

  const notifyApprovalSpeechFinished = useCallback(() => {
    const pending = pendingApprovalRef.current
    if (!pending || pending.completed || pending.finishScheduled) return

    pending.finishScheduled = true
    const elapsed = Date.now() - pending.startedAt
    const remainingMs = Math.max(MIN_APPROVAL_READING_MS - elapsed, POST_SPEECH_PAUSE_MS)
    scheduleApprovalClose(remainingMs, { speechFinished: true })
  }, [scheduleApprovalClose])

  // Selecionar um membro no Tribunal
  const openMemberDialog = useCallback(
    (memberId) => {
      if (lockRef.current) return
      const status = memberProgress[memberId]
      if (!status || status.completed) return

      const lockExp = memberLocks[memberId]
      if (lockExp && lockExp > Date.now()) {
        const secs = Math.max(1, Math.ceil((lockExp - Date.now()) / 1000))
        setActionError(`Este conselheiro está indisponível por mais ${secs}s. Tente outro membro!`)
        return
      }

      const member = challenges.find((m) => m.id === memberId)
      const completedMemberIds = Object.entries(memberProgress)
        .filter(([, prog]) => prog?.completed)
        .map(([id]) => Number(id))
      const remainingMemberIds = challenges
        .filter((m) => !memberProgress[m.id]?.completed && m.id !== memberId)
        .map((m) => m.id)

      const hist = crossTalkHistoryRef.current
      const allowChairCrossTalk = !hist.chairHadCrossTalk[memberId]

      const speechPick =
        status.errors > 0
          ? pickErrorDialogue({
            memberId,
            errorNumber: status.errors,
            isBlocked: false,
            completedMemberIds,
            remainingMemberIds,
            citedMemberIds: hist.citedMemberIds,
            allowCrossTalk: allowChairCrossTalk,
          })
          : pickOpeningGreeting({
            memberId,
            defaultGreeting: member?.greeting || '',
            completedMemberIds,
            citedMemberIds: hist.citedMemberIds,
            allowCrossTalk: allowChairCrossTalk && !hist.lastOpeningWasCrossTalk,
            totalMembers: challenges.length || 7,
          })

      if (status.errors === 0) {
        hist.lastOpeningWasCrossTalk = Boolean(speechPick.usedCrossTalk)
      }
      if (speechPick.usedCrossTalk) {
        recordCrossTalkUsage(memberId, speechPick.citedMemberId)
      }

      playSelectSound()
      setActionError('')
      setVnFeedback('idle')
      setVnApprovalMessage('')
      setApprovalReadingState(null)
      setVnErrorStep(status.errors || 0)
      setVnSpeechText(speechPick.text || member?.greeting || '')
      setVnSpeechKey((prev) => prev + 1)
      setActiveMemberId(memberId)
    },
    [challenges, memberLocks, memberProgress, recordCrossTalkUsage]
  )

  const closeMemberDialog = useCallback(() => {
    if (lockRef.current) return
    playSelectSound()
    setActionError('')
    setVnFeedback('idle')
    setVnApprovalMessage('')
    setApprovalReadingState(null)
    setVnSpeechText('')
    setVnErrorStep(0)
    setActiveMemberId(null)
  }, [])

  // Responder questão de Múltipla Escolha (validação server-side transacional)
  const submitMultipleChoice = useCallback(
    async (memberId, optionId) => {
      if (lockRef.current) return
      const member = challenges.find((m) => m.id === memberId)
      const progress = memberProgress[memberId]
      if (!member || !progress || progress.completed) return
      if (progress.disabledOptions.includes(optionId)) return

      const partidaId = stateSnapshotRef.current.activePartida?.id
      if (!partidaId) {
        setActionError('Partida não encontrada. Atualize a página ou faça login novamente.')
        return
      }

      setActionError('')
      lockRef.current = true
      setIsLocked(true)

      try {
        const hist = crossTalkHistoryRef.current
        const evitarCruzadaNaAprovacao = Boolean(
          hist.chairHadCrossTalk[memberId] ||
          hist.approvalCrossTalkCount >= MAX_APPROVAL_CROSSTALK_PER_MATCH
        )

        const resultado = await apiService.validarResposta(partidaId, {
          membroId: memberId,
          opcaoId: optionId,
          membrosJaCitados: hist.citedMemberIds,
          evitarCruzada: evitarCruzadaNaAprovacao,
        })

        if (typeof resultado.segundosReais === 'number') {
          setRealSeconds((prev) => Math.max(prev, resultado.segundosReais))
        }

        if (resultado.acertou) {
          playApprovalSound()
          const approvalMsg = resultado.mensagemAprovacao || ''

          if (resultado.usouCruzada || resultado.citouMembroId) {
            recordCrossTalkUsage(member.id, resultado.citouMembroId, { isApproval: true })
          }

          if (resultado.jogoConcluido) {
            setIsTimerRunning(false)
            setIsTimerPausedForApproval(false)
          } else {
            setIsTimerPausedForApproval(true)
          }

          const now = Date.now()
          const expectedDurationMs =
            typeof resultado.duracaoLeituraMs === 'number' &&
              resultado.duracaoLeituraMs >= MIN_APPROVAL_READING_MS
              ? resultado.duracaoLeituraMs
              : Math.max(
                MIN_APPROVAL_READING_MS,
                estimateSpeechTypingMs(approvalMsg) + POST_SPEECH_PAUSE_MS
              )

          clearApprovalTimers()
          pendingApprovalRef.current = {
            member,
            resultado,
            partidaId,
            startedAt: now,
            expectedDurationMs,
            skipped: false,
            finishScheduled: false,
            completed: false,
          }
          setApprovalReadingState({
            key: now,
            startedAt: now,
            targetEndAt: now + expectedDurationMs,
            expectedDurationMs,
            skipped: false,
            speechFinished: false,
          })

          // Timeout de segurança caso a aba em segundo plano atrase o typewriter
          approvalSafetyTimeoutRef.current = setTimeout(() => {
            completeApprovalTransition()
          }, expectedDurationMs + 2500)

          setVnApprovalMessage(approvalMsg)
          setVnSpeechText(approvalMsg)
          setVnSpeechKey((prev) => prev + 1)
          setVnErrorStep(0)
          setVnFeedback('approved')
          setComboAtual(resultado.comboAtual ?? 0)
          if (typeof resultado.segundosBonus === 'number') {
            setBonusSeconds(resultado.segundosBonus)
          }
          if (resultado.partida?.totalCombos !== undefined) {
            setTotalCombos(resultado.partida.totalCombos)
          }

          if (resultado.invicto && resultado.comboAtivado) {
            setComboAlert((prev) => ({
              key: prev.key + 1,
              seconds: (resultado.bonusCombo || 5) + (resultado.bonusInvicto || 10),
              label: 'COMBO + INVICTO! -15s',
            }))
          } else if (resultado.invicto) {
            setComboAlert((prev) => ({
              key: prev.key + 1,
              seconds: resultado.bonusInvicto || 10,
              label: '7/7 INVICTO! -10s',
            }))
          } else if (resultado.comboAtivado) {
            setComboAlert((prev) => ({
              key: prev.key + 1,
              seconds: resultado.bonusCombo || 5,
              label: 'COMBO x3! -5s',
            }))
          }
        } else {
          playPenaltySound()
          const appliedPenalty = resultado.penalidade || 5
          setPenaltySeconds(
            resultado.segundosPenalidade ?? resultado.partida?.segundosPenalidade ?? 0
          )
          setPenaltyAlert((prev) => ({ key: prev.key + 1, seconds: appliedPenalty }))
          setComboAtual(0)
          setActivePartida(resultado.partida)

          const completedMemberIds = Object.entries(stateSnapshotRef.current.memberProgress)
            .filter(([, prog]) => prog?.completed)
            .map(([id]) => Number(id))
          const remainingMemberIds = stateSnapshotRef.current.challenges
            .filter((m) => !stateSnapshotRef.current.memberProgress[m.id]?.completed && m.id !== member.id)
            .map((m) => m.id)

          const allowChairCrossTalk = !crossTalkHistoryRef.current.chairHadCrossTalk[member.id]

          if (resultado.reprovado) {
            const lockUntilMs = resultado.bloqueadoAte
              ? new Date(resultado.bloqueadoAte).getTime()
              : Date.now() + (resultado.bloqueioSegundos || 20) * 1000

            const blockPick = pickErrorDialogue({
              memberId: member.id,
              errorNumber: 3,
              isBlocked: true,
              completedMemberIds,
              remainingMemberIds,
              citedMemberIds: crossTalkHistoryRef.current.citedMemberIds,
              lastSpeech: stateSnapshotRef.current.vnSpeechText,
              allowCrossTalk: allowChairCrossTalk,
            })

            if (blockPick.usedCrossTalk) {
              recordCrossTalkUsage(member.id, blockPick.citedMemberId)
            }

            setMemberLocks((prev) => ({
              ...prev,
              [member.id]: lockUntilMs,
            }))

            // Durante os 3,5s de leitura da reprovação, mantém os 3 erros visíveis antes de resetar e embaralhar
            setMemberProgress((prev) => {
              const current = prev[member.id]
              const updatedDisabled = Array.from(new Set([...current.disabledOptions, optionId]))
              return {
                ...prev,
                [member.id]: {
                  ...current,
                  errors: 3,
                  totalErrors: (current?.totalErrors || 0) + 1,
                  penaltySeconds: (current?.penaltySeconds || 0) + appliedPenalty,
                  disabledOptions: updatedDisabled,
                },
              }
            })

            setVnErrorStep(3)
            setVnSpeechText(blockPick.text)
            setVnSpeechKey((prev) => prev + 1)
            setVnFeedback('blocked')

            registerTimeout(() => {
              const done = Object.values(stateSnapshotRef.current.memberProgress).filter(
                (item) => item.completed
              ).length

              // Reseta erros/desabilitadas do ciclo atual, preservando o acumulado total para o resumo final
              setMemberProgress((prev) => ({
                ...prev,
                [member.id]: {
                  ...prev[member.id],
                  errors: 0,
                  disabledOptions: [],
                },
              }))

              setChallenges((prev) =>
                prev.map((m) =>
                  m.id === member.id ? { ...m, options: shuffleOptionsList(m.options) } : m
                )
              )

              setVnFeedback('idle')
              setVnSpeechText('')
              setVnErrorStep(0)
              setActiveMemberId(null)
              lockRef.current = false
              setIsLocked(false)

              if (ENABLE_3D_ERROR_ANIMATION) {
                setMazeModal({
                  mode: 'error',
                  fromStep: done,
                  toStep: done,
                  memberName: member.name,
                  lockSeconds: resultado.bloqueioSegundos || 20,
                })
              }
            }, BLOCKED_READING_MS)
          } else {
            const nextErrorNumber = (progress.errors || 0) + 1
            const errorPick = pickErrorDialogue({
              memberId: member.id,
              errorNumber: nextErrorNumber,
              isBlocked: false,
              completedMemberIds,
              remainingMemberIds,
              citedMemberIds: crossTalkHistoryRef.current.citedMemberIds,
              lastSpeech: stateSnapshotRef.current.vnSpeechText,
              allowCrossTalk: allowChairCrossTalk,
            })

            if (errorPick.usedCrossTalk) {
              recordCrossTalkUsage(member.id, errorPick.citedMemberId)
            }

            setMemberProgress((prev) => {
              const current = prev[member.id]
              const updatedDisabled = Array.from(new Set([...current.disabledOptions, optionId]))
              return {
                ...prev,
                [member.id]: {
                  ...current,
                  errors: current.errors + 1,
                  totalErrors: (current.totalErrors || 0) + 1,
                  penaltySeconds: (current.penaltySeconds || 0) + appliedPenalty,
                  disabledOptions: updatedDisabled,
                },
              }
            })

            setVnErrorStep(nextErrorNumber)
            setVnSpeechText(errorPick.text)
            setVnSpeechKey((prev) => prev + 1)
            setVnFeedback('wrong')

            registerTimeout(() => {
              setVnFeedback('idle')
              lockRef.current = false
              setIsLocked(false)
            }, 650)
          }
        }
      } catch (error) {
        if (error?.status === 401) {
          handleUnauthorizedSession(error.message)
          return
        }
        console.error('[GameContext] Erro ao validar resposta:', error)

        if (error?.status === 423 && error?.data?.bloqueadoAte) {
          const lockUntilMs = new Date(error.data.bloqueadoAte).getTime()
          setMemberLocks((prev) => ({ ...prev, [memberId]: lockUntilMs }))
          setVnFeedback('idle')
          setVnSpeechText('')
          setVnErrorStep(0)
          setActiveMemberId(null)
        }

        setActionError(
          error?.message ||
          'Não foi possível validar sua resposta agora. Verifique sua conexão e tente novamente.'
        )
        lockRef.current = false
        setIsLocked(false)
      }
    },
    [
      challenges,
      clearApprovalTimers,
      completeApprovalTransition,
      handleUnauthorizedSession,
      memberProgress,
      recordCrossTalkUsage,
      registerTimeout,
    ]
  )

  // Reiniciar jogo a partir da Tela Final / Ranking
  const restartGame = useCallback(async () => {
    clearAllTimeouts()
    resetCrossTalkHistory()
    setActionError('')
    lockRef.current = true
    setIsLocked(true)

    const currentPlayerId = stateSnapshotRef.current.player?.id
    if (!currentPlayerId) {
      lockRef.current = false
      setIsLocked(false)
      setScreen('REGISTRATION')
      return
    }

    try {
      const currentChallenges = stateSnapshotRef.current.challenges
      const hasLoadedQuestions =
        Array.isArray(currentChallenges) &&
        currentChallenges.length > 0 &&
        currentChallenges.every((c) => Array.isArray(c.options) && c.options.length > 0)

      const [novaPartida, shuffled] = await Promise.all([
        apiService.iniciarPartida({ forceNew: true }),
        hasLoadedQuestions
          ? Promise.resolve(shuffleChallengesOptions(currentChallenges))
          : carregarDesafiosAutenticado(),
      ])

      setActivePartida(novaPartida.partida)
      setChallenges(shuffled)
      setIsTimerRunning(false)
      setIsTimerPausedForApproval(false)
      setRealSeconds(0)
      setPenaltySeconds(0)
      setBonusSeconds(0)
      setComboAtual(0)
      setTotalCombos(0)
      setPenaltyAlert({ key: 0, seconds: 5 })
      setComboAlert({ key: 0, seconds: 0, label: '' })
      setMemberProgress(createInitialMemberProgress(shuffled))
      setMemberLocks({})
      setActiveMemberId(null)
      setVnFeedback('idle')
      setVnApprovalMessage('')
      setApprovalReadingState(null)
      setVnSpeechText('')
      setVnErrorStep(0)
      setCeoBriefingDismissed(false)
      setCouncilEntranceState('waiting')
      setMazeModal(null)
      setJustFinished(false)
      setScreen('COMIC_INTRO')
    } catch (err) {
      if (err?.status === 401) {
        handleUnauthorizedSession(err.message)
        return
      }
      console.error('[GameContext] Erro ao iniciar nova partida:', err)
      setActionError(
        err?.message || 'Não foi possível iniciar uma nova partida agora. Tente novamente.'
      )
    } finally {
      lockRef.current = false
      setIsLocked(false)
    }
  }, [
    carregarDesafiosAutenticado,
    clearAllTimeouts,
    handleUnauthorizedSession,
    resetCrossTalkHistory,
  ])

  // Desconectar e voltar para a tela de login/cadastro (limpando perguntas da memória do React)
  const logout = useCallback(async () => {
    clearAllTimeouts()
    resetCrossTalkHistory()
    try {
      await apiService.logout()
    } catch (err) {
      console.warn('[GameContext] Erro ao encerrar sessão no servidor:', err)
    }
    clearLegacyPlayerStorage()
    setChallenges(COUNCIL_MEMBERS)
    setPlayer(null)
    setActivePartida(null)
    setIsTimerRunning(false)
    setIsTimerPausedForApproval(false)
    setRealSeconds(0)
    setPenaltySeconds(0)
    setBonusSeconds(0)
    setComboAtual(0)
    setTotalCombos(0)
    setPenaltyAlert({ key: 0, seconds: 5 })
    setComboAlert({ key: 0, seconds: 0, label: '' })
    setMemberProgress(createInitialMemberProgress(COUNCIL_MEMBERS))
    setMemberLocks({})
    setActiveMemberId(null)
    setVnFeedback('idle')
    setPlayerHistory({ totalTentativas: 0, melhorPartida: null, tentativas: [] })
    setRankingHistory([])
    setRankingSetores([])
    setVnApprovalMessage('')
    setApprovalReadingState(null)
    setVnSpeechText('')
    setVnErrorStep(0)
    setCeoBriefingDismissed(false)
    setMazeModal(null)
    setActionError('')
    setAuthError('')
    setJustFinished(false)
    setScreen('REGISTRATION')
  }, [clearAllTimeouts, resetCrossTalkHistory])

  const value = useMemo(
    () => ({
      screen,
      isRestoringSession,
      player,
      activePartida,
      challenges,
      authError,
      actionError,
      clearAuthError,
      clearActionError,
      isTimerRunning,
      isTimerPausedForApproval,
      realSeconds,
      penaltySeconds,
      bonusSeconds,
      totalSeconds,
      comboAtual,
      totalCombos,
      penaltyAlertKey: penaltyAlert.key,
      penaltyAlertSeconds: penaltyAlert.seconds,
      comboAlert,
      memberProgress,
      memberLocks,
      completedCount,
      totalErrors,
      activeMember,
      activeMemberId,
      vnFeedback,
      vnApprovalMessage,
      approvalReadingState,
      vnSpeechText,
      vnSpeechKey,
      vnErrorStep,
      isLocked,
      ceoBriefingDismissed,
      councilEntranceState,
      mazeModal,
      screenFadePhase,
      rankingHistory,
      rankingSetores,
      playerHistory,
      justFinished,
      recarregarRankings,
      carregarHistoricoTentativas,
      setCeoBriefingDismissed,
      openIntroMazeModal,
      confirmIntroMazeAndStart,
      openManualMazeModal,
      closeMazeModal,
      startGameFromRegistration,
      loginAndStart,
      advanceFromComic,
      finishArrivalTransition,
      finishExitTransition,
      openMemberDialog,
      closeMemberDialog,
      submitMultipleChoice,
      notifyApprovalSpeechFinished,
      notifyApprovalSpeechSkipped,
      restartGame,
      logout,
    }),
    [
      screen,
      isRestoringSession,
      player,
      activePartida,
      challenges,
      authError,
      actionError,
      clearAuthError,
      clearActionError,
      isTimerRunning,
      isTimerPausedForApproval,
      realSeconds,
      penaltySeconds,
      bonusSeconds,
      totalSeconds,
      comboAtual,
      totalCombos,
      penaltyAlert,
      comboAlert,
      memberProgress,
      memberLocks,
      completedCount,
      totalErrors,
      activeMember,
      activeMemberId,
      vnFeedback,
      vnApprovalMessage,
      approvalReadingState,
      vnSpeechText,
      vnSpeechKey,
      vnErrorStep,
      isLocked,
      ceoBriefingDismissed,
      councilEntranceState,
      mazeModal,
      screenFadePhase,
      rankingHistory,
      rankingSetores,
      playerHistory,
      justFinished,
      recarregarRankings,
      carregarHistoricoTentativas,
      openIntroMazeModal,
      confirmIntroMazeAndStart,
      openManualMazeModal,
      closeMazeModal,
      startGameFromRegistration,
      loginAndStart,
      advanceFromComic,
      finishArrivalTransition,
      finishExitTransition,
      openMemberDialog,
      closeMemberDialog,
      submitMultipleChoice,
      notifyApprovalSpeechFinished,
      notifyApprovalSpeechSkipped,
      restartGame,
      logout,
    ]
  )

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}
