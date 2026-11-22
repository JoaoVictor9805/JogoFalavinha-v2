import { useCallback, useEffect, useRef, useState } from 'react'
import { DoorOpen } from 'lucide-react'
import { useGame } from '../../context/gameContextInstance'
import { WAX_SEALS_BY_MEMBER } from '../../data/waxSealsData'
import { playExitDoorUnlockSound } from '../../utils/soundEffects'

const SEALS_LIST = Object.values(WAX_SEALS_BY_MEMBER)

function ExitTransition() {
  const { finishExitTransition } = useGame()
  const [stageIndex, setStageIndex] = useState(0)
  const finishedRef = useRef(false)

  const handleFinish = useCallback(() => {
    if (finishedRef.current) return
    finishedRef.current = true
    finishExitTransition()
  }, [finishExitTransition])

  useEffect(() => {
    playExitDoorUnlockSound()

    const t1 = setTimeout(() => {
      setStageIndex(1)
    }, 1300)

    const t2 = setTimeout(() => {
      handleFinish()
    }, 2800)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [handleFinish])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        handleFinish()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleFinish])

  const stageText =
    stageIndex === 0
      ? 'Os 7 selos foram reconhecidos pelo Conselho Next...'
      : 'A porta se destranca diante de você. Hora de ouvir o veredito final.'

  return (
    <div
      onClick={handleFinish}
      title="Clique para avançar"
      className="min-h-screen w-full bg-[#F5F0E6] text-stone-900 flex flex-col items-center justify-center p-6 text-center select-none cursor-pointer"
    >
      <div className="max-w-xl w-full bg-[#FDFBF7] border-2 border-stone-900 border-t-4 border-t-emerald-600 p-8 sm:p-10 shadow-[8px_8px_0px_#1C1917] space-y-6 animate-modal-pop">
        <div className="mx-auto w-20 h-20 rounded-none bg-emerald-50 border-2 border-emerald-600 flex items-center justify-center text-emerald-700 shadow-[3px_3px_0px_#1C1917]">
          <DoorOpen className="w-9 h-9 animate-vn-idle" />
        </div>

        {/* Fileira discreta dos 7 selos de cera reconhecidos */}
        <div className="flex items-center justify-center gap-2 sm:gap-2.5 flex-wrap">
          {SEALS_LIST.map((seal, idx) => (
            <span
              key={seal.memberId}
              style={{ animationDelay: `${idx * 65}ms` }}
              className="w-9 h-9 sm:w-10 sm:h-10 bg-[#F5F0E6] border border-stone-300 p-1 flex items-center justify-center animate-panel-rise"
            >
              <img
                src={seal.image}
                alt={seal.fallbackName}
                draggable={false}
                style={{ transform: `rotate(${seal.cardTiltDeg}deg)` }}
                className="w-full h-full object-contain drop-shadow-[0_2px_4px_rgba(28,25,23,0.35)]"
              />
            </span>
          ))}
        </div>

        <p
          key={stageIndex}
          className="text-lg sm:text-xl font-bold text-stone-900 tracking-wide animate-screen-enter"
        >
          “{stageText}”
        </p>

        <div className="w-60 h-2 bg-[#EBE4D5] border border-stone-900 rounded-none overflow-hidden mx-auto">
          <div className="h-full bg-emerald-600 animate-exit-fill" />
        </div>
      </div>
    </div>
  )
}

export default ExitTransition
