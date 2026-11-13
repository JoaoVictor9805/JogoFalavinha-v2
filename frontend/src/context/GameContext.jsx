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

function createInitialMemberProgress(membersList = COUNCIL_MEMBERS) {
  const initial = {}
  membersList.forEach((member) => {
    initial[member.id] = {
      completed: false,
      errors: 0,
      disabledOptions: [],
      wrongTextAttempts: [],
    }
  })
  return initial
}

function loadSavedPlayer() {
  try {
    const raw = localStorage.getItem(PLAYER_STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function GameProvider({ children }) {
  // Progressão de telas: 'REGISTRATION' | 'COMIC_INTRO' | 'TRANSITION_ARRIVAL' | 'TRIBUNAL_HUB' | 'FINAL_RANKING'
  const [screen, setScreen] = useState('REGISTRATION')
  const [player, setPlayer] = useState(loadSavedPlayer)
  const [activePartida, setActivePartida] = useState(null)
  const [challenges, setChallenges] = useState(COUNCIL_MEMBERS)
  const [authError, setAuthError] = useState('')

  // Cronômetro global em segundos reais + penalidades (+5s por erro)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [realSeconds, setRealSeconds] = useState(0)
  const [penaltySeconds, setPenaltySeconds] = useState(0)
  const [penaltyAlertKey, setPenaltyAlertKey] = useState(0)

  // Estado dos 7 conselheiros, Overlay Visual Novel e Modal do Labirinto 3D
  const [memberProgress, setMemberProgress] = useState(() => createInitialMemberProgress(COUNCIL_MEMBERS))
  const [activeMemberId, setActiveMemberId] = useState(null)
  const [vnFeedback, setVnFeedback] = useState('idle') // 'idle' | 'wrong' | 'approved'
  const [isLocked, setIsLocked] = useState(false)
  const [ceoBriefingDismissed, setCeoBriefingDismissed] = useState(false)
  const [mazeModal, setMazeModal] = useState(null)
  const [screenFadePhase, setScreenFadePhase] = useState('idle') // 'idle' | 'fade-to-black' | 'fade-from-black'

  // Rankings oficiais do servidor (Geral e por Setor)
  const [rankingHistory, setRankingHistory] = useState([])
  const [rankingSetores, setRankingSetores] = useState([])

  // Refs para bloqueio imediato contra spam de cliques e leitura segura em timeouts
  const lockRef = useRef(false)
  const timersRef = useRef([])
  const stateSnapshotRef = useRef({
    realSeconds: 0,
    penaltySeconds: 0,
    player: null,
    activePartida: null,
    memberProgress: createInitialMemberProgress(COUNCIL_MEMBERS),
  })

  useEffect(() => {
    stateSnapshotRef.current = {
      realSeconds,
      penaltySeconds,
      player,
      activePartida,
      memberProgress,
    }
  }, [realSeconds, penaltySeconds, player, activePartida, memberProgress])

  // Carrega os 7 desafios protegidos da API no mount
  useEffect(() => {
    apiService
      .obterDesafios()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setChallenges(data)
        }
      })
      .catch((err) => {
        console.warn('[GameContext] Usando dados locais como fallback:', err)
      })
  }, [])

  // Carrega rankings iniciais em segundo plano
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

  useEffect(() => {
    recarregarRankings()
  }, [recarregarRankings])

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

  // Sincronização periódica do tempo no banco a cada 10 segundos
  useEffect(() => {
    if (!isTimerRunning || !activePartida?.id) return undefined

    const syncInterval = setInterval(() => {
      apiService.sincronizarTempo(activePartida.id, stateSnapshotRef.current.realSeconds).catch(() => { })
    }, 10000)

    return () => clearInterval(syncInterval)
  }, [isTimerRunning, activePartida?.id])

  const totalSeconds = realSeconds + penaltySeconds

  const completedCount = useMemo(() => {
    return Object.values(memberProgress).filter((m) => m.completed).length
  }, [memberProgress])

  const totalErrors = useMemo(() => {
    return Object.values(memberProgress).reduce((acc, m) => acc + m.errors, 0)
  }, [memberProgress])

  const activeMember = useMemo(() => {
    if (!activeMemberId) return null
    return challenges.find((m) => m.id === activeMemberId) || null
  }, [activeMemberId, challenges])

  const clearAuthError = useCallback(() => {
    setAuthError('')
  }, [])

  // Transição cinematográfica de fade out para preto + fade in para o Conselho (~1 segundo total)
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
      lockRef.current = true
      setIsLocked(true)

      try {
        clearAllTimeouts()

        // 1. Cadastra no PostgreSQL via API
        const cadRes = await apiService.cadastrar({
          nome: formData.nome,
          email: formData.email,
          unidade: formData.unidade,
          setor: formData.setor,
          senha: formData.senha || null,
        })

        const jogador = cadRes.jogador
        setPlayer(jogador)
        try {
          localStorage.setItem(PLAYER_STORAGE_KEY, JSON.stringify(jogador))
        } catch { }

        // 2. Inicia uma nova partida no banco
        const partidaRes = await apiService.iniciarPartida(jogador.id)
        setActivePartida(partidaRes.partida)

        // 3. Inicializa estado de jogo limpo
        setMemberProgress(createInitialMemberProgress(challenges))
        setRealSeconds(0)
        setPenaltySeconds(0)
        setPenaltyAlertKey(0)
        setActiveMemberId(null)
        setVnFeedback('idle')
        setCeoBriefingDismissed(false)
        setMazeModal(null)
        setIsTimerRunning(false)
        setScreen('COMIC_INTRO')
      } catch (err) {
        setAuthError(err.message || 'Erro ao realizar cadastro.')
        throw err
      } finally {
        lockRef.current = false
        setIsLocked(false)
      }
    },
    [challenges, clearAllTimeouts]
  )

  // 1B. Iniciar ou Retomar jogo através do LOGIN
  const loginAndStart = useCallback(
    async (loginData) => {
      setAuthError('')
      lockRef.current = true
      setIsLocked(true)

      try {
        clearAllTimeouts()

        // 1. Faz login no servidor
        const loginRes = await apiService.login({
          email: loginData.email,
          senha: loginData.senha,
        })

        const jogador = loginRes.jogador
        setPlayer(jogador)
        try {
          localStorage.setItem(PLAYER_STORAGE_KEY, JSON.stringify(jogador))
        } catch { }

        // 2. Verifica se já existe uma partida em andamento para retomar
        let partida = loginRes.partidaEmAndamento
        if (!partida) {
          const partidaRes = await apiService.iniciarPartida(jogador.id)
          partida = partidaRes.partida
        }
        setActivePartida(partida)

        // 3. Reconstitui o progresso salvo a partir dos dados do banco
        const initial = createInitialMemberProgress(challenges)
        const concluidos = partida.membrosConcluidos || []
        const desabilitadas = partida.opcoesDesabilitadas || []

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
          }
        })

        setMemberProgress(initial)
        setRealSeconds(partida.segundosReais || 0)
        setPenaltySeconds(partida.segundosPenalidade || 0)
        setPenaltyAlertKey(0)
        setActiveMemberId(null)
        setVnFeedback('idle')
        setMazeModal(null)

        // Se já tinha avançado no jogo, retoma direto no Tribunal
        if (concluidos.length > 0 || (partida.segundosReais || 0) > 0) {
          setCeoBriefingDismissed(true)
          setIsTimerRunning(true)
          setScreen('TRIBUNAL_HUB')
        } else {
          setCeoBriefingDismissed(false)
          setIsTimerRunning(false)
          setScreen('COMIC_INTRO')
        }
      } catch (err) {
        setAuthError(err.message || 'Erro ao realizar login.')
        throw err
      } finally {
        lockRef.current = false
        setIsLocked(false)
      }
    },
    [challenges, clearAllTimeouts]
  )

  // Abre o modal 3D de apresentação após o CEO explicar as regras
  const openIntroMazeModal = useCallback(() => {
    playSelectSound()
    triggerBlackoutTransition(() => {
      setMazeModal({ mode: 'intro', fromStep: 0, toStep: 0 })
    })
  }, [triggerBlackoutTransition])

  // Confirma "OK" no modal inicial do labirinto: inicia cronômetro oficial
  const confirmIntroMazeAndStart = useCallback(() => {
    playSelectSound()
    triggerBlackoutTransition(() => {
      setMazeModal(null)
      setCeoBriefingDismissed(true)
      setIsTimerRunning(true)
    })
  }, [triggerBlackoutTransition])

  // Abre o modal do mapa manualmente
  const openManualMazeModal = useCallback(() => {
    playSelectSound()
    triggerBlackoutTransition(() => {
      const done = Object.values(stateSnapshotRef.current.memberProgress).filter((m) => m.completed).length
      setMazeModal({ mode: 'manual', fromStep: done, toStep: done })
    })
  }, [triggerBlackoutTransition])

  // Fecha o modal de progresso
  const closeMazeModal = useCallback(() => {
    playSelectSound()
    triggerBlackoutTransition(() => {
      setMazeModal((current) => {
        if (current?.mode === 'progress' && current?.isFinal) {
          setScreen('FINAL_RANKING')
          recarregarRankings()
        }
        return null
      })
    })
  }, [recarregarRankings, triggerBlackoutTransition])

  // Avançar da Comic Strip para a Transição
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

  // Concluir Transição e revelar O Tribunal
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

      playSelectSound()
      setVnFeedback('idle')
      setActiveMemberId(memberId)
    },
    [memberProgress]
  )

  // Fechar o Overlay do conselheiro
  const closeMemberDialog = useCallback(() => {
    if (lockRef.current) return
    playSelectSound()
    setVnFeedback('idle')
    setActiveMemberId(null)
  }, [])

  // 5A. Responder questão de Múltipla Escolha (VALIDAÇÃO SERVER-SIDE NO POSTGRESQL)
  const submitMultipleChoice = useCallback(
    async (memberId, optionId) => {
      if (lockRef.current) return
      const member = challenges.find((m) => m.id === memberId)
      const progress = memberProgress[memberId]
      if (!member || !progress || progress.completed) return
      if (progress.disabledOptions.includes(optionId)) return

      // Lock imediato contra spam
      lockRef.current = true
      setIsLocked(true)

      const partidaId = stateSnapshotRef.current.activePartida?.id
      const currentRealSec = stateSnapshotRef.current.realSeconds

      try {
        // Envia resposta para validação segura no PostgreSQL
        const resultado = await apiService.validarResposta(partidaId, {
          membroId: memberId,
          opcaoId: optionId,
          segundosReais: currentRealSec,
        })

        if (resultado.acertou) {
          playApprovalSound()
          setVnFeedback('approved')

          // Delay de 2,5s para leitura do feedback do conselheiro
          registerTimeout(() => {
            const snapshot = stateSnapshotRef.current
            const prevCompleted = Object.values(snapshot.memberProgress).filter((item) => item.completed).length

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

              triggerBlackoutTransition(() => {
                setMazeModal({
                  mode: 'progress',
                  fromStep: prevCompleted,
                  toStep: nextCompleted,
                  memberName: member.name,
                  isFinal: true,
                })
              })
            } else {
              triggerBlackoutTransition(() => {
                setMazeModal({
                  mode: 'progress',
                  fromStep: prevCompleted,
                  toStep: nextCompleted,
                  memberName: member.name,
                  isFinal: false,
                })
              })
            }

            lockRef.current = false
            setIsLocked(false)
          }, 2500)
        } else {
          // Erro: +5 segundos de penalidade aplicados pelo backend
          playPenaltySound()
          setPenaltySeconds(resultado.segundosPenalidade || (resultado.partida?.segundosPenalidade ?? (penaltySeconds + 5)))
          setPenaltyAlertKey((prev) => prev + 1)
          setVnFeedback('wrong')
          setActivePartida(resultado.partida)

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
      } catch (error) {
        console.error('[GameContext] Erro ao validar resposta:', error)
        lockRef.current = false
        setIsLocked(false)
      }
    },
    [challenges, memberProgress, penaltySeconds, recarregarRankings, registerTimeout, triggerBlackoutTransition]
  )

  // 5B. Responder texto/código (mantido para compatibilidade caso haja input)
  const submitTextAnswer = useCallback(
    (memberId, rawInput) => {
      // Por enquanto todas as 7 cadeiras oficiais são múltipla escolha
      console.log('submitTextAnswer:', memberId, rawInput)
    },
    []
  )

  // 6. Reiniciar jogo a partir da Tela Final
  const restartGame = useCallback(async () => {
    clearAllTimeouts()
    lockRef.current = false
    setIsLocked(false)
    setIsTimerRunning(false)
    setRealSeconds(0)
    setPenaltySeconds(0)
    setPenaltyAlertKey(0)
    setMemberProgress(createInitialMemberProgress(challenges))
    setActiveMemberId(null)
    setVnFeedback('idle')
    setCeoBriefingDismissed(false)
    setMazeModal(null)

    // Se o jogador estiver logado, inicia uma nova partida no banco
    if (player?.id) {
      try {
        const novaPartida = await apiService.iniciarPartida(player.id)
        setActivePartida(novaPartida.partida)
        setScreen('COMIC_INTRO')
      } catch {
        setScreen('REGISTRATION')
      }
    } else {
      setScreen('REGISTRATION')
    }
  }, [challenges, clearAllTimeouts, player?.id])

  const value = useMemo(
    () => ({
      screen,
      player,
      activePartida,
      challenges,
      authError,
      clearAuthError,
      isTimerRunning,
      realSeconds,
      penaltySeconds,
      totalSeconds,
      penaltyAlertKey,
      memberProgress,
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
      recarregarRankings,
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
      submitTextAnswer,
      restartGame,
    }),
    [
      screen,
      player,
      activePartida,
      challenges,
      authError,
      clearAuthError,
      isTimerRunning,
      realSeconds,
      penaltySeconds,
      totalSeconds,
      penaltyAlertKey,
      memberProgress,
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
      recarregarRankings,
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
      submitTextAnswer,
      restartGame,
    ]
  )

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}
