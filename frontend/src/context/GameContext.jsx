import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { COUNCIL_MEMBERS } from '../data/conselhoNextData'
import { apiService } from '../services/apiService'
import {
  playApprovalSound,
  playPenaltySound,
  playSelectSound,
  playVictorySound,
} from '../utils/soundEffects'
import { GameContext } from './gameContextInstance'

const PLAYER_STORAGE_KEY = 'conselho_next_last_player_v2'
const OPTION_LABELS = ['a)', 'b)', 'c)', 'd)']

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
      disabledOptions: [],
    }
  })
  return initial
}

function buildProgressFromPartida(partida, membersList = COUNCIL_MEMBERS) {
  const initial = createInitialMemberProgress(membersList)
  const concluidos = partida?.membrosConcluidos || []
  const desabilitadas = partida?.opcoesDesabilitadas || []

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

  return initial
}

function buildLocksFromPartida(partida) {
  const locks = {}
  const now = Date.now()
  ;(partida?.bloqueios || []).forEach((b) => {
    if (!b?.bloqueadoAte) return
    const ts = new Date(b.bloqueadoAte).getTime()
    if (Number.isFinite(ts) && ts > now) {
      locks[b.membroId] = ts
    }
  })
  return locks
}

function loadSavedPlayerHint() {
  try {
    const raw = localStorage.getItem(PLAYER_STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function savePlayerHint(jogador) {
  try {
    if (jogador) {
      localStorage.setItem(PLAYER_STORAGE_KEY, JSON.stringify(jogador))
    } else {
      localStorage.removeItem(PLAYER_STORAGE_KEY)
    }
  } catch {
    // Armazenamento local indisponível (modo privado)
  }
}

export function GameProvider({ children }) {
  // Progressão de telas: 'REGISTRATION' | 'COMIC_INTRO' | 'TRANSITION_ARRIVAL' | 'TRIBUNAL_HUB' | 'FINAL_RANKING'
  const [screen, setScreen] = useState('REGISTRATION')
  const [isRestoringSession, setIsRestoringSession] = useState(true)
  const [player, setPlayer] = useState(loadSavedPlayerHint)
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
  const [realSeconds, setRealSeconds] = useState(0)
  const [penaltySeconds, setPenaltySeconds] = useState(0)
  const [bonusSeconds, setBonusSeconds] = useState(0)
  const [comboAtual, setComboAtual] = useState(0)
  const [totalCombos, setTotalCombos] = useState(0)
  const [penaltyAlert, setPenaltyAlert] = useState({ key: 0, seconds: 5 })
  const [comboAlert, setComboAlert] = useState({ key: 0, seconds: 0, label: '' })

  // Estado dos 7 conselheiros, bloqueios temporários (10s), Overlay VN e Modal 3D
  const [memberProgress, setMemberProgress] = useState(() =>
    createInitialMemberProgress(COUNCIL_MEMBERS)
  )
  const [memberLocks, setMemberLocks] = useState({})
  const [activeMemberId, setActiveMemberId] = useState(null)
  const [vnFeedback, setVnFeedback] = useState('idle') // 'idle' | 'wrong' | 'approved'
  const [isLocked, setIsLocked] = useState(false)
  const [ceoBriefingDismissed, setCeoBriefingDismissed] = useState(false)
  const [mazeModal, setMazeModal] = useState(null)
  const [screenFadePhase, setScreenFadePhase] = useState('idle') // 'idle' | 'fade-to-black' | 'fade-from-black'

  // Rankings oficiais do servidor (Geral e por Setor)
  const [rankingHistory, setRankingHistory] = useState([])
  const [rankingSetores, setRankingSetores] = useState([])

  const lockRef = useRef(false)
  const timersRef = useRef([])
  const stateSnapshotRef = useRef({
    realSeconds: 0,
    penaltySeconds: 0,
    bonusSeconds: 0,
    player: null,
    activePartida: null,
    challenges: COUNCIL_MEMBERS,
    memberProgress: createInitialMemberProgress(COUNCIL_MEMBERS),
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
    }
  }, [realSeconds, penaltySeconds, bonusSeconds, player, activePartida, challenges, memberProgress])

  const recarregarRankings = useCallback(async () => {
    try {
      const [geral, setores] = await Promise.all([
        apiService.obterRankingGeral(),
        apiService.obterRankingSetores(),
      ])
      setRankingHistory(geral || [])
      setRankingSetores(setores || [])
    } catch (err) {
      console.warn('[GameContext] Erro ao carregar rankings:', err)
    }
  }, [])

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
      console.warn('[GameContext] Erro ao carregar histórico de tentativas:', err)
    }
    return null
  }, [])

  // Boot único: carrega desafios da API, rankings e restaura sessão autenticada (sobrevive ao F5)
  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      let loadedChallenges = COUNCIL_MEMBERS

      try {
        const desafiosApi = await apiService.obterDesafios()
        if (!cancelled && Array.isArray(desafiosApi) && desafiosApi.length > 0) {
          loadedChallenges = desafiosApi
        }
      } catch (err) {
        console.warn('[GameContext] Usando metadados locais como fallback:', err)
      }

      const shuffled = shuffleChallengesOptions(loadedChallenges)
      if (!cancelled) {
        setChallenges(shuffled)
      }

      try {
        const [geral, setores] = await Promise.all([
          apiService.obterRankingGeral(),
          apiService.obterRankingSetores(),
        ])
        if (!cancelled) {
          setRankingHistory(geral || [])
          setRankingSetores(setores || [])
        }
      } catch (err) {
        console.warn('[GameContext] Erro ao carregar rankings iniciais:', err)
      }

      try {
        const sessao = await apiService.obterSessao()
        if (cancelled || !sessao?.jogador) return

        const jogador = sessao.jogador
        setPlayer(jogador)
        savePlayerHint(jogador)

        try {
          const hist = await apiService.obterMeuHistorico()
          if (!cancelled && hist) {
            setPlayerHistory({
              totalTentativas: hist.totalTentativas || 0,
              melhorPartida: hist.melhorPartida || null,
              tentativas: hist.tentativas || [],
            })
          }
        } catch (err) {
          console.warn('[GameContext] Erro ao restaurar histórico:', err)
        }

        if (cancelled) return

        const partida = sessao.partidaEmAndamento
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
          setActiveMemberId(null)
          setVnFeedback('idle')
          setMazeModal(null)
          setJustFinished(false)
          setCeoBriefingDismissed(jaIniciouCronometro)
          setIsTimerRunning(jaIniciouCronometro)
          setScreen('TRIBUNAL_HUB')
        } else {
          setActivePartida(null)
          setIsTimerRunning(false)
          setMemberProgress(createInitialMemberProgress(shuffled))
          setMemberLocks({})
          setScreen('FINAL_RANKING')
        }
      } catch {
        // Sem sessão ativa: mantém na tela de cadastro/login
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
  }, [])

  const registerTimeout = useCallback((fn, delay) => {
    const id = setTimeout(fn, delay)
    timersRef.current.push(id)
    return id
  }, [])

  const clearAllTimeouts = useCallback(() => {
    timersRef.current.forEach((id) => clearTimeout(id))
    timersRef.current = []
  }, [])

  useEffect(() => {
    return () => clearAllTimeouts()
  }, [clearAllTimeouts])

  // Cronômetro global em segundo plano
  useEffect(() => {
    if (!isTimerRunning) return undefined

    const interval = setInterval(() => {
      setRealSeconds((prev) => prev + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [isTimerRunning])

  // Limpa automaticamente bloqueios de 10s expirados
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

  // Sincronização periódica do tempo no banco a cada 10 segundos
  useEffect(() => {
    if (!isTimerRunning || !activePartida?.id) return undefined

    const syncInterval = setInterval(() => {
      apiService
        .sincronizarTempo(activePartida.id, stateSnapshotRef.current.realSeconds)
        .catch(() => {})
    }, 10000)

    return () => clearInterval(syncInterval)
  }, [isTimerRunning, activePartida?.id])

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
    (middleAction) => {
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
          lockRef.current = false
          setIsLocked(false)
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
        savePlayerHint(jogador)

        const partidaRes = await apiService.iniciarPartida({ forceNew: true })
        setActivePartida(partidaRes.partida)

        const shuffled = shuffleChallengesOptions(stateSnapshotRef.current.challenges)
        setChallenges(shuffled)
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
        setCeoBriefingDismissed(false)
        setMazeModal(null)
        setIsTimerRunning(false)
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
    [clearAllTimeouts]
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

        const loginRes = await apiService.login({
          email: loginData.email,
          senha: loginData.senha,
        })

        const jogador = loginRes.jogador
        setPlayer(jogador)
        savePlayerHint(jogador)

        await Promise.all([carregarHistoricoTentativas(), recarregarRankings()])

        const shuffled = shuffleChallengesOptions(stateSnapshotRef.current.challenges)
        setChallenges(shuffled)

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
          setMazeModal(null)
          setJustFinished(false)
          setCeoBriefingDismissed(jaIniciouCronometro)
          setIsTimerRunning(jaIniciouCronometro)
          setScreen('TRIBUNAL_HUB')
        } else {
          setActivePartida(null)
          setIsTimerRunning(false)
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
    [carregarHistoricoTentativas, clearAllTimeouts, recarregarRankings]
  )

  // Abre o modal 3D de apresentação após o CEO explicar as regras
  const openIntroMazeModal = useCallback(() => {
    playSelectSound()
    triggerBlackoutTransition(() => {
      setMazeModal({ mode: 'intro', fromStep: 0, toStep: 0 })
    })
  }, [triggerBlackoutTransition])

  // Confirma "OK" no modal inicial do labirinto: registra largada no servidor e inicia cronômetro
  const confirmIntroMazeAndStart = useCallback(() => {
    playSelectSound()
    const partidaId = stateSnapshotRef.current.activePartida?.id
    if (partidaId) {
      apiService.iniciarCronometro(partidaId).catch((err) => {
        console.warn('[GameContext] Falha ao registrar início do cronômetro:', err)
      })
    }

    triggerBlackoutTransition(() => {
      setMazeModal(null)
      setCeoBriefingDismissed(true)
      setIsTimerRunning(true)
    })
  }, [triggerBlackoutTransition])

  // Abre o modal do mapa manualmente (sem fade para preto)
  const openManualMazeModal = useCallback(() => {
    if (lockRef.current) return
    playSelectSound()
    const done = Object.values(stateSnapshotRef.current.memberProgress).filter(
      (m) => m.completed
    ).length
    setMazeModal({ mode: 'manual', fromStep: done, toStep: done })
  }, [])

  // Fecha o modal do mapa (fade para preto apenas na transição final para o Ranking)
  const closeMazeModal = useCallback(() => {
    playSelectSound()
    const isFinalTransition = mazeModal?.mode === 'progress' && mazeModal?.isFinal

    if (isFinalTransition) {
      triggerBlackoutTransition(() => {
        setMazeModal(null)
        setJustFinished(true)
        setScreen('FINAL_RANKING')
        recarregarRankings()
        carregarHistoricoTentativas()
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

      playSelectSound()
      setActionError('')
      setVnFeedback('idle')
      setActiveMemberId(memberId)
    },
    [memberLocks, memberProgress]
  )

  const closeMemberDialog = useCallback(() => {
    if (lockRef.current) return
    playSelectSound()
    setActionError('')
    setVnFeedback('idle')
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

      const currentRealSec = stateSnapshotRef.current.realSeconds

      try {
        const resultado = await apiService.validarResposta(partidaId, {
          membroId: memberId,
          opcaoId: optionId,
          segundosReais: currentRealSec,
        })

        if (typeof resultado.segundosReais === 'number') {
          setRealSeconds((prev) => Math.max(prev, resultado.segundosReais))
        }

        if (resultado.acertou) {
          playApprovalSound()
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

          registerTimeout(() => {
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
            setActivePartida(resultado.partida)

            const allCompleted = resultado.jogoConcluido
            const nextCompleted = resultado.etapaAtual || prevCompleted + 1

            if (allCompleted) {
              setIsTimerRunning(false)
              playVictorySound()
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
          }, 2500)
        } else {
          playPenaltySound()
          const appliedPenalty = resultado.penalidade || 5
          setPenaltySeconds(
            resultado.segundosPenalidade ?? resultado.partida?.segundosPenalidade ?? 0
          )
          setPenaltyAlert((prev) => ({ key: prev.key + 1, seconds: appliedPenalty }))
          setComboAtual(0)
          setVnFeedback('wrong')
          setActivePartida(resultado.partida)

          if (resultado.reprovado) {
            const lockUntilMs = resultado.bloqueadoAte
              ? new Date(resultado.bloqueadoAte).getTime()
              : Date.now() + (resultado.bloqueioSegundos || 10) * 1000

            setMemberLocks((prev) => ({
              ...prev,
              [member.id]: lockUntilMs,
            }))

            // Reseta erros/desabilitadas locais e reembaralha as 4 alternativas do conselheiro
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

            registerTimeout(() => {
              const done = Object.values(stateSnapshotRef.current.memberProgress).filter(
                (item) => item.completed
              ).length

              setVnFeedback('idle')
              setActiveMemberId(null)
              lockRef.current = false
              setIsLocked(false)

              if (ENABLE_3D_ERROR_ANIMATION) {
                setMazeModal({
                  mode: 'error',
                  fromStep: done,
                  toStep: done,
                  memberName: member.name,
                  lockSeconds: resultado.bloqueioSegundos || 10,
                })
              }
            }, 950)
          } else {
            setMemberProgress((prev) => {
              const current = prev[member.id]
              const updatedDisabled = Array.from(new Set([...current.disabledOptions, optionId]))
              return {
                ...prev,
                [member.id]: {
                  ...current,
                  errors: current.errors + 1,
                  disabledOptions: updatedDisabled,
                },
              }
            })

            registerTimeout(() => {
              setVnFeedback('idle')
              lockRef.current = false
              setIsLocked(false)
            }, 650)
          }
        }
      } catch (error) {
        console.error('[GameContext] Erro ao validar resposta:', error)

        if (error?.status === 423 && error?.data?.bloqueadoAte) {
          const lockUntilMs = new Date(error.data.bloqueadoAte).getTime()
          setMemberLocks((prev) => ({ ...prev, [memberId]: lockUntilMs }))
          setVnFeedback('idle')
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
    [carregarHistoricoTentativas, challenges, memberProgress, recarregarRankings, registerTimeout]
  )

  // Reiniciar jogo a partir da Tela Final / Ranking
  const restartGame = useCallback(async () => {
    clearAllTimeouts()
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
      const novaPartida = await apiService.iniciarPartida({ forceNew: true })
      const shuffled = shuffleChallengesOptions(stateSnapshotRef.current.challenges)

      setActivePartida(novaPartida.partida)
      setChallenges(shuffled)
      setIsTimerRunning(false)
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
      setCeoBriefingDismissed(false)
      setMazeModal(null)
      setJustFinished(false)
      setScreen('COMIC_INTRO')
    } catch (err) {
      console.error('[GameContext] Erro ao iniciar nova partida:', err)
      setActionError(
        err?.message || 'Não foi possível iniciar uma nova partida agora. Tente novamente.'
      )
    } finally {
      lockRef.current = false
      setIsLocked(false)
    }
  }, [clearAllTimeouts])

  // Desconectar e voltar para a tela de login/cadastro
  const logout = useCallback(async () => {
    clearAllTimeouts()
    try {
      await apiService.logout()
    } catch (err) {
      console.warn('[GameContext] Erro ao encerrar sessão no servidor:', err)
    }
    savePlayerHint(null)
    const shuffled = shuffleChallengesOptions(stateSnapshotRef.current.challenges)
    setChallenges(shuffled)
    setPlayer(null)
    setActivePartida(null)
    setIsTimerRunning(false)
    setRealSeconds(0)
    setPenaltySeconds(0)
    setBonusSeconds(0)
    setComboAtual(0)
    setTotalCombos(0)
    setPenaltyAlert({ key: 0, seconds: 5 })
    setComboAlert({ key: 0, seconds: 0, label: '' })
    setMemberProgress(createInitialMemberProgress(shuffled))
    setMemberLocks({})
    setPlayerHistory({ totalTentativas: 0, melhorPartida: null, tentativas: [] })
    setActionError('')
    setAuthError('')
    setJustFinished(false)
    setScreen('REGISTRATION')
  }, [clearAllTimeouts])

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
      isLocked,
      ceoBriefingDismissed,
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
      openMemberDialog,
      closeMemberDialog,
      submitMultipleChoice,
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
      isLocked,
      ceoBriefingDismissed,
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
      openMemberDialog,
      closeMemberDialog,
      submitMultipleChoice,
      restartGame,
      logout,
    ]
  )

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}
