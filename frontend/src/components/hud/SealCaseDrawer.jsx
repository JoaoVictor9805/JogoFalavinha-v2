import { useEffect, useState } from 'react'
import { Award, ChevronLeft, ChevronRight, Lock, Star, X } from 'lucide-react'
import { useGame } from '../../context/gameContextInstance'
import { getWaxSealByMemberId } from '../../data/waxSealsData'
import { playSelectSound } from '../../utils/soundEffects'

const SEAL_CASE_HINT_STORAGE_PREFIX = 'conselho_next_seal_case_seen_v1_'

function readHasSeenSealCase(storageKey) {
  try {
    return localStorage.getItem(storageKey) === '1'
  } catch {
    return false
  }
}

function writeHasSeenSealCase(storageKey) {
  try {
    localStorage.setItem(storageKey, '1')
  } catch {
    // Armazenamento indisponível (modo privado)
  }
}

/**
 * Gaveta retrátil fixa na borda direita da tela ("Estojo de Selos").
 * Exibe os 7 selos de cera no estilo estojo de insígnias:
 *  - Pendentes: silhueta escura em baixo-relevo (mantém o mistério antes da aprovação)
 *  - Conquistados: selo em cor viva com nome do conselheiro e destaque quando aprovado de 1ª
 */
function SealCaseDrawer() {
  const { screen, player, activePartida, challenges, memberProgress, justFinished, playerHistory } =
    useGame()
  const [isOpen, setIsOpen] = useState(false)

  const hintStorageKey = `${SEAL_CASE_HINT_STORAGE_PREFIX}partida_${activePartida?.id || player?.id || 'guest'}`
  const [hintState, setHintState] = useState(() => ({
    key: hintStorageKey,
    seen: readHasSeenSealCase(hintStorageKey),
  }))

  if (hintState.key !== hintStorageKey) {
    setHintState({
      key: hintStorageKey,
      seen: readHasSeenSealCase(hintStorageKey),
    })
  }

  const hasSeenSealCase = hintState.seen

  const hasPreviousCompletion = Boolean(playerHistory?.melhorPartida)
  const isFinalRankingArchiveView = screen === 'FINAL_RANKING' && !justFinished

  const sealSlots = challenges.map((member, index) => {
    const seal = getWaxSealByMemberId(member.id)
    const prog = memberProgress[member.id]
    const isUnlocked = isFinalRankingArchiveView
      ? hasPreviousCompletion
      : Boolean(prog?.completed)
    const totalMemberErrors = prog?.totalErrors ?? prog?.errors ?? 0
    const showFlawlessBadge =
      isUnlocked && !isFinalRankingArchiveView && totalMemberErrors === 0

    return {
      memberId: member.id,
      name: member.name || seal?.fallbackName || `Conselheiro ${index + 1}`,
      code: seal?.code || `C0${index + 1}`,
      seal,
      isUnlocked,
      showFlawlessBadge,
    }
  })

  const totalMembers = sealSlots.length || 7
  const unlockedCount = sealSlots.filter((s) => s.isUnlocked).length
  const progressPercent = Math.round((unlockedCount / Math.max(1, totalMembers)) * 100)

  // Detecta ganho de novo selo durante a partida para pulsar discretamente a aba direita
  const [prevTrack, setPrevTrack] = useState({
    screen,
    count: unlockedCount,
  })
  const [pulseKey, setPulseKey] = useState(0)

  if (prevTrack.screen !== screen || prevTrack.count !== unlockedCount) {
    const earnedDuringMatch =
      prevTrack.screen === screen &&
      screen === 'TRIBUNAL_HUB' &&
      unlockedCount > prevTrack.count

    setPrevTrack({ screen, count: unlockedCount })
    if (earnedDuringMatch) {
      setPulseKey((k) => k + 1)
    }
  }

  // Fecha com Escape quando aberta
  useEffect(() => {
    if (!isOpen) return undefined
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  const showFirstSealAlert =
    screen === 'TRIBUNAL_HUB' && unlockedCount >= 1 && !hasSeenSealCase && !isOpen

  const toggleDrawer = () => {
    playSelectSound()
    const nextOpen = !isOpen
    setIsOpen(nextOpen)
    if (nextOpen && !hasSeenSealCase) {
      writeHasSeenSealCase(hintStorageKey)
      setHintState({ key: hintStorageKey, seen: true })
    }
  }

  const closeDrawer = () => {
    playSelectSound()
    setIsOpen(false)
  }

  return (
    <>
      {/* Backdrop sutil ao abrir o estojo (clique fora fecha) */}
      {isOpen && (
        <div
          aria-hidden="true"
          onClick={closeDrawer}
          className="fixed inset-0 z-[47] bg-stone-950/25 transition-opacity duration-200"
        />
      )}

      {/* Gaveta Retrátil + Aba acoplada na borda direita */}
      <aside
        aria-label="Estojo de Selos do Conselho Next"
        className={`fixed right-0 top-1/2 -translate-y-1/2 z-[48] w-[min(84vw,496px)] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Aba fixa acoplada ao lado esquerdo da gaveta */}
        <button
          key={pulseKey > 0 ? `seal-tab-pulse-${pulseKey}` : 'seal-tab-idle'}
          type="button"
          onClick={toggleDrawer}
          aria-expanded={isOpen}
          aria-controls="seal-case-drawer-panel"
          title={isOpen ? 'Fechar Estojo de Selos' : `Abrir Estojo de Selos (${unlockedCount}/${totalMembers})`}
          className={`pointer-events-auto absolute right-full top-1/2 -translate-y-1/2 flex flex-col items-center gap-1.5 px-2 py-2.5 bg-[#FDFBF7] hover:bg-[#F5EBD6] text-stone-900 border-2 border-r-0 border-stone-900 shadow-[-4px_4px_0px_#1C1917] transition-colors cursor-pointer select-none ${
            pulseKey > 0 && !isOpen ? 'animate-wax-tab-pulse' : ''
          }`}
        >
          {/* Indicador "!" exibido apenas na 1ª vez que o usuário conquista um selo até abrir o estojo */}
          {showFirstSealAlert && (
            <span
              aria-label="Novo selo no estojo"
              className="absolute -top-2.5 -left-2.5 w-5 h-5 bg-red-600 text-white border-2 border-stone-900 shadow-[2px_2px_0px_#1C1917] font-mono text-[11px] font-black leading-none flex items-center justify-center animate-bounce"
            >
              !
            </span>
          )}

          <span
            className={`w-7 h-7 flex items-center justify-center border border-stone-900 transition-colors ${
              unlockedCount === totalMembers
                ? 'bg-emerald-600 text-white'
                : 'bg-[#D99B38] text-stone-950'
            }`}
          >
            <Award className="w-4 h-4" />
          </span>

          <span className="text-[9px] font-black uppercase tracking-[0.16em] text-stone-800 leading-none">
            Selos
          </span>

          <span className="px-1.5 py-0.5 bg-[#F5F0E6] border border-stone-800 font-mono text-[10px] font-black text-stone-900 leading-none">
            {unlockedCount}/{totalMembers}
          </span>

          <span className="text-stone-600">
            {isOpen ? (
              <ChevronRight className="w-3.5 h-3.5" />
            ) : (
              <ChevronLeft className="w-3.5 h-3.5" />
            )}
          </span>
        </button>

        {/* Corpo da Gaveta ("Estojo de Selos") */}
        <div
          id="seal-case-drawer-panel"
          className={`bg-[#FDFBF7] border-2 border-r-0 border-stone-900 shadow-[-8px_8px_0px_#1C1917] flex flex-col overflow-hidden ${
            isOpen ? 'pointer-events-auto' : 'pointer-events-none'
          }`}
        >
          {/* Cabeçalho escuro estilo caixa de selos */}
          <div className="bg-stone-900 text-[#FDFBF7] px-4 py-3 border-b-2 border-[#D99B38] flex items-center justify-between gap-2">
            <h2 className="text-sm sm:text-base font-black uppercase tracking-tight leading-tight truncate">
              Estojo de Selos
            </h2>

            <div className="flex items-center gap-2 shrink-0">
              <span className="px-2 py-0.5 bg-stone-800 border border-[#D99B38]/70 font-mono text-xs font-black text-[#D99B38]">
                {unlockedCount}/{totalMembers}
              </span>
              <button
                type="button"
                onClick={closeDrawer}
                aria-label="Fechar Estojo de Selos"
                className="w-7 h-7 bg-stone-800 hover:bg-red-600 text-stone-200 hover:text-white border border-stone-700 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Barra fina de preenchimento do estojo */}
          <div className="h-1.5 w-full bg-stone-800">
            <div
              className="h-full bg-[#D99B38] transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Bandeja interna com os 7 slots: 4 na linha superior e 3 centralizados na linha inferior */}
          <div className="bg-[#EFE7D6] p-3 sm:p-4 max-h-[70vh] overflow-y-auto">
            {[sealSlots.slice(0, 4), sealSlots.slice(4)].map(
              (rowSlots, rowIdx) =>
                rowSlots.length > 0 && (
                  <div
                    key={`seal-row-${rowIdx}`}
                    className={`flex items-stretch justify-center gap-2 sm:gap-2.5 ${
                      rowIdx > 0 ? 'mt-2 sm:mt-2.5' : ''
                    }`}
                  >
                    {rowSlots.map((slot) => (
                      <div
                        key={slot.memberId}
                        className={`relative w-[calc((100%-1.5rem)/4)] sm:w-[calc((100%-1.875rem)/4)] border-2 p-2 sm:p-2.5 flex flex-col items-center text-center transition-all duration-300 ${
                          slot.isUnlocked
                            ? 'bg-[#FDFBF7] border-stone-900 shadow-[3px_3px_0px_#1C1917]'
                            : 'bg-[#E5DBC7]/85 border-stone-400/80 border-dashed'
                        }`}
                      >
                        {/* Etiqueta da cadeira */}
                        <div className="w-full flex items-center justify-between gap-1 mb-1">
                          <span
                            className={`font-mono text-[8px] sm:text-[9px] font-black px-1 py-0.5 border leading-none ${
                              slot.isUnlocked
                                ? 'bg-stone-900 text-[#D99B38] border-stone-900'
                                : 'bg-stone-300/70 text-stone-500 border-stone-400'
                            }`}
                          >
                            {slot.code}
                          </span>

                          {slot.showFlawlessBadge ? (
                            <span
                              title="Aprovado de primeira, sem erros!"
                              className="inline-flex items-center gap-0.5 text-[8px] sm:text-[9px] font-black uppercase text-amber-800 bg-amber-100 border border-amber-400 px-1 py-0.5 leading-none"
                            >
                              <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-600" />
                              <span>1ª</span>
                            </span>
                          ) : !slot.isUnlocked ? (
                            <Lock className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-stone-400 shrink-0" />
                          ) : null}
                        </div>

                        {/* Cavidade circular em baixo-relevo estilo estojo Pokémon */}
                        <div
                          className={`relative w-[clamp(2.85rem,5.5vw,3.9rem)] aspect-square rounded-full flex items-center justify-center p-1 sm:p-1.5 my-0.5 ${
                            slot.isUnlocked
                              ? 'bg-[#F5F0E6] shadow-[inset_0_2px_6px_rgba(28,25,23,0.16)] border border-stone-300'
                              : 'bg-stone-900/[0.08] shadow-[inset_0_3px_8px_rgba(28,25,23,0.28)] border border-stone-400/60'
                          }`}
                        >
                          {slot.seal?.image && (
                            <img
                              src={slot.seal.image}
                              alt={
                                slot.isUnlocked
                                  ? `Selo de ${slot.name}`
                                  : `Selo bloqueado ${slot.code}`
                              }
                              draggable={false}
                              style={
                                slot.isUnlocked
                                  ? { transform: `rotate(${slot.seal.cardTiltDeg}deg)` }
                                  : undefined
                              }
                              className={`w-full h-full object-contain transition-all duration-300 ${
                                slot.isUnlocked
                                  ? 'opacity-100 scale-100 drop-shadow-[0_4px_6px_rgba(28,25,23,0.38)] hover:scale-105'
                                  : 'brightness-0 contrast-150 opacity-[0.17] scale-[0.9] select-none'
                              }`}
                            />
                          )}
                        </div>

                        {/* Nome ou estado bloqueado */}
                        <div
                          className={`mt-1 text-[9px] sm:text-[10px] font-black uppercase tracking-tight truncate w-full ${
                            slot.isUnlocked ? 'text-stone-900' : 'text-stone-500'
                          }`}
                        >
                          {slot.isUnlocked ? slot.name : 'Bloqueado'}
                        </div>
                      </div>
                    ))}
                  </div>
                )
            )}
          </div>

          {/* Rodapé do estojo */}
          <div className="bg-[#FDFBF7] border-t-2 border-stone-900 px-4 py-2.5 flex items-center justify-between gap-2 text-[10px] font-bold uppercase tracking-wider text-stone-600">
            <span>
              {unlockedCount === totalMembers
                ? 'Coleção completa!'
                : `Faltam ${totalMembers - unlockedCount} ${
                    totalMembers - unlockedCount === 1 ? 'selo' : 'selos'
                  }`}
            </span>
            <span className="font-mono text-stone-500">ESC fecha</span>
          </div>
        </div>
      </aside>
    </>
  )
}

export default SealCaseDrawer
