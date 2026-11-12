import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { COUNCIL_MEMBERS } from '../data/conselhoNextData'
import {
  playApprovalSound,
  playPenaltySound,
  playSelectSound,
  playVictorySound,
} from '../utils/soundEffects'
import { GameContext } from './gameContextInstance'

const RANKING_STORAGE_KEY = 'conselho_next_ranking_v2'
const PLAYER_STORAGE_KEY = 'conselho_next_last_player_v2'

function createInitialMemberProgress() {
  const initial = {}
  COUNCIL_MEMBERS.forEach((member) => {
    initial[member.id] = {
      completed: false,
      errors: 0,
      disabledOptions: [],
      wrongTextAttempts: [],
    }
  })
  return initial
}

function loadSavedRanking() {
  try {
    const raw = localStorage.getItem(RANKING_STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
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

  // Cronômetro global em segundos reais + penalidades (+5s por erro)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [realSeconds, setRealSeconds] = useState(0)
  const [penaltySeconds, setPenaltySeconds] = useState(0)
  const [penaltyAlertKey, setPenaltyAlertKey] = useState(0)

  // Estado dos 7 conselheiros, Overlay Visual Novel e Modal do Labirinto 3D
  const [memberProgress, setMemberProgress] = useState(createInitialMemberProgress)
  const [activeMemberId, setActiveMemberId] = useState(null)
  const [vnFeedback, setVnFeedback] = useState('idle') // 'idle' | 'wrong' | 'approved'
  const [isLocked, setIsLocked] = useState(false)
  const [ceoBriefingDismissed, setCeoBriefingDismissed] = useState(false)
  const [mazeModal, setMazeModal] = useState(null)
  const [screenFadePhase, setScreenFadePhase] = useState('idle') // 'idle' | 'fade-to-black' | 'fade-from-black'
  const [rankingHistory, setRankingHistory] = useState(loadSavedRanking)

  // Refs para bloqueio imediato contra spam de cliques e leitura segura em timeouts
  const lockRef = useRef(false)
  const timersRef = useRef([])
  const stateSnapshotRef = useRef({
    realSeconds: 0,
    penaltySeconds: 0,
    player: null,
    memberProgress: createInitialMemberProgress(),
  })

  useEffect(() => {
    stateSnapshotRef.current = {
      realSeconds,
      penaltySeconds,
      player,
      memberProgress,
    }
  }, [realSeconds, penaltySeconds, player, memberProgress])

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

  // Cronômetro global em segundo plano (inicia no clique em "Iniciar" do Cadastro)
  useEffect(() => {
    if (!isTimerRunning) return undefined

    const interval = setInterval(() => {
      setRealSeconds((prev) => prev + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [isTimerRunning])

  const totalSeconds = realSeconds + penaltySeconds

  const completedCount = useMemo(() => {
    return Object.values(memberProgress).filter((m) => m.completed).length
  }, [memberProgress])

  const totalErrors = useMemo(() => {
    return Object.values(memberProgress).reduce((acc, m) => acc + m.errors, 0)
  }, [memberProgress])

  const activeMember = useMemo(() => {
    if (!activeMemberId) return null
    return COUNCIL_MEMBERS.find((m) => m.id === activeMemberId) || null
  }, [activeMemberId])

  // 1. Iniciar jogo a partir da Tela de Cadastro
  const startGameFromRegistration = useCallback(
    (playerData) => {
      if (lockRef.current) return
      lockRef.current = true
      setIsLocked(true)

      clearAllTimeouts()
      const normalizedPlayer = {
        nome: String(playerData.nome || '').trim(),
        email: String(playerData.email || '').trim(),
        unidade: playerData.unidade,
        setor: playerData.setor,
      }

      setPlayer(normalizedPlayer)
      try {
        localStorage.setItem(PLAYER_STORAGE_KEY, JSON.stringify(normalizedPlayer))
      } catch {
        // Ignora erro de storage
      }

      setMemberProgress(createInitialMemberProgress())
      setRealSeconds(0)
      setPenaltySeconds(0)
      setPenaltyAlertKey(0)
      setActiveMemberId(null)
      setVnFeedback('idle')
      setCeoBriefingDismissed(false)
      setMazeModal(null)
      setIsTimerRunning(false)
      setScreen('COMIC_INTRO')

      registerTimeout(() => {
        lockRef.current = false
        setIsLocked(false)
      }, 300)
    },
    [clearAllTimeouts, registerTimeout]
  )

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

  // Abre o modal 3D de apresentação após o CEO (Jhonny) explicar as regras
  const openIntroMazeModal = useCallback(() => {
    playSelectSound()
    triggerBlackoutTransition(() => {
      setMazeModal({ mode: 'intro', fromStep: 0, toStep: 0 })
    })
  }, [triggerBlackoutTransition])

  // Confirma "OK" no modal inicial do labirinto: fecha intro e inicia o cronômetro oficial
  const confirmIntroMazeAndStart = useCallback(() => {
    playSelectSound()
    triggerBlackoutTransition(() => {
      setMazeModal(null)
      setCeoBriefingDismissed(true)
      setIsTimerRunning(true)
    })
  }, [triggerBlackoutTransition])

  // Abre o modal do mapa manualmente pelo botão inferior direito
  const openManualMazeModal = useCallback(() => {
    playSelectSound()
    triggerBlackoutTransition(() => {
      const done = Object.values(stateSnapshotRef.current.memberProgress).filter((m) => m.completed).length
      setMazeModal({ mode: 'manual', fromStep: done, toStep: done })
    })
  }, [triggerBlackoutTransition])

  // Fecha o modal de progresso/visualização e avança para o Ranking se for a 7ª aprovação
  const closeMazeModal = useCallback(() => {
    playSelectSound()
    triggerBlackoutTransition(() => {
      setMazeModal((current) => {
        if (current?.mode === 'progress' && current?.isFinal) {
          setScreen('FINAL_RANKING')
        }
        return null
      })
    })
  }, [triggerBlackoutTransition])

  // 2. Avançar da Comic Strip para a Transição Preta + Gatilho de Áudio
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

  // 3. Concluir Transição e revelar O Tribunal (Hub Principal)
  const finishArrivalTransition = useCallback(() => {
    lockRef.current = false
    setIsLocked(false)
    setScreen('TRIBUNAL_HUB')
  }, [])

  // 4. Selecionar um membro no Tribunal para abrir o Overlay Visual Novel
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

  // Fechar voluntariamente o Overlay para escolher outro membro no Hub
  const closeMemberDialog = useCallback(() => {
    if (lockRef.current) return
    playSelectSound()
    setVnFeedback('idle')
    setActiveMemberId(null)
  }, [])

  // Função interna compartilhada para aplicar aprovação ou punição (+5s)
  const handleAnswerEvaluation = useCallback(
    (member, isCorrect, wrongPayload = {}) => {
      if (isCorrect) {
        playApprovalSound()
        setVnFeedback('approved')

        // Delay obrigatório de 2,5 segundos congelado para leitura do elogio
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

          const allCompleted = COUNCIL_MEMBERS.every((m) => nextProgress[m.id]?.completed)
          const nextCompleted = allCompleted ? COUNCIL_MEMBERS.length : prevCompleted + 1

          if (allCompleted) {
            setIsTimerRunning(false)
            playVictorySound()

            const finalReal = snapshot.realSeconds
            const finalPenalty = snapshot.penaltySeconds
            const finalTotal = finalReal + finalPenalty
            const finalErrors = Object.values(nextProgress).reduce(
              (acc, item) => acc + item.errors,
              0
            )

            const entry = {
              id: `run_${Date.now()}`,
              nome: snapshot.player?.nome || 'Colaborador Next',
              email: snapshot.player?.email || '',
              unidade: snapshot.player?.unidade || 'Curitiba - Matriz',
              setor: snapshot.player?.setor || 'Geral',
              realSeconds: finalReal,
              penaltySeconds: finalPenalty,
              totalSeconds: finalTotal,
              totalErrors: finalErrors,
              completedAt: new Date().toLocaleString('pt-BR'),
            }

            setRankingHistory((prev) => {
              const updated = [...prev, entry].sort((a, b) => a.totalSeconds - b.totalSeconds)
              try {
                localStorage.setItem(RANKING_STORAGE_KEY, JSON.stringify(updated))
              } catch {
                // Ignora
              }
              return updated
            })

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
        // Punição: +5 segundos no cronômetro + atualização da fala dinâmica (1..5)
        playPenaltySound()
        setPenaltySeconds((prev) => prev + 5)
        setPenaltyAlertKey((prev) => prev + 1)
        setVnFeedback('wrong')

        setMemberProgress((prev) => {
          const current = prev[member.id]
          const updatedDisabled = wrongPayload.optionId
            ? Array.from(new Set([...current.disabledOptions, wrongPayload.optionId]))
            : current.disabledOptions
          const updatedTexts = wrongPayload.wrongText
            ? Array.from(new Set([...current.wrongTextAttempts, wrongPayload.wrongText]))
            : current.wrongTextAttempts

          return {
            ...prev,
            [member.id]: {
              ...current,
              errors: current.errors + 1,
              disabledOptions: updatedDisabled,
              wrongTextAttempts: updatedTexts,
            },
          }
        })

        // Mantém os controles travados durante a animação de erro para impedir spam de cliques
        registerTimeout(() => {
          setVnFeedback('idle')
          lockRef.current = false
          setIsLocked(false)
        }, 650)
      }
    },
    [registerTimeout, triggerBlackoutTransition]
  )

  // 5A. Responder questão de Múltipla Escolha
  const submitMultipleChoice = useCallback(
    (memberId, optionId) => {
      if (lockRef.current) return
      const member = COUNCIL_MEMBERS.find((m) => m.id === memberId)
      const progress = memberProgress[memberId]
      if (!member || !progress || progress.completed) return
      if (progress.disabledOptions.includes(optionId)) return

      // Lock imediato contra spam de cliques
      lockRef.current = true
      setIsLocked(true)

      const selectedOption = member.options?.find((opt) => opt.id === optionId)
      const isCorrect = Boolean(selectedOption?.isCorrect)

      handleAnswerEvaluation(member, isCorrect, { optionId })
    },
    [handleAnswerEvaluation, memberProgress]
  )

  // 5B. Responder questão de Input de Texto (Enigma, Senha ou Código)
  const submitTextAnswer = useCallback(
    (memberId, rawInput) => {
      if (lockRef.current) return
      const cleaned = String(rawInput || '').trim()
      if (!cleaned) return

      const member = COUNCIL_MEMBERS.find((m) => m.id === memberId)
      const progress = memberProgress[memberId]
      if (!member || !progress || progress.completed) return

      // Lock imediato contra spam de cliques
      lockRef.current = true
      setIsLocked(true)

      const normalizedUser = cleaned
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase()
      const normalizedExpected = String(member.correctAnswer || '')
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase()

      const isCorrect = normalizedUser === normalizedExpected
      handleAnswerEvaluation(member, isCorrect, { wrongText: cleaned.toUpperCase() })
    },
    [handleAnswerEvaluation, memberProgress]
  )

  // 6. Reiniciar jogo a partir da Tela Final
  const restartGame = useCallback(() => {
    clearAllTimeouts()
    lockRef.current = false
    setIsLocked(false)
    setIsTimerRunning(false)
    setRealSeconds(0)
    setPenaltySeconds(0)
    setPenaltyAlertKey(0)
    setMemberProgress(createInitialMemberProgress())
    setActiveMemberId(null)
    setVnFeedback('idle')
    setCeoBriefingDismissed(false)
    setMazeModal(null)
    setScreen('REGISTRATION')
  }, [clearAllTimeouts])

  const value = useMemo(
    () => ({
      screen,
      player,
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
      setCeoBriefingDismissed,
      openIntroMazeModal,
      confirmIntroMazeAndStart,
      openManualMazeModal,
      closeMazeModal,
      startGameFromRegistration,
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
      openIntroMazeModal,
      confirmIntroMazeAndStart,
      openManualMazeModal,
      closeMazeModal,
      startGameFromRegistration,
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

