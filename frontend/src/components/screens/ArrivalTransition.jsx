import { useEffect, useState } from 'react'
import { DoorClosed, Volume2 } from 'lucide-react'
import { useGame } from '../../context/gameContextInstance'
import { playArrivalDoorSound as triggerDoorAudio } from '../../utils/soundEffects'

function ArrivalTransition() {
  const { finishArrivalTransition } = useGame()
  const [stageText, setStageText] = useState('Você caminha pelo corredor silencioso do 7º andar...')

  useEffect(() => {
    triggerDoorAudio()

    const t1 = setTimeout(() => {
      setStageText('A porta dupla do Tribunal se fecha pesadamente atrás de você.')
    }, 1650)

    const t2 = setTimeout(() => {
      finishArrivalTransition()
    }, 3400)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [finishArrivalTransition])

  return (
    <div className="min-h-screen w-full bg-[#F5F0E6] text-stone-900 flex flex-col items-center justify-center p-6 text-center select-none">
      <div className="max-w-xl w-full bg-[#FDFBF7] border-2 border-stone-900 border-t-4 border-t-[#D99B38] p-8 sm:p-10 shadow-[8px_8px_0px_#1C1917] space-y-6 animate-modal-pop">
        <div className="mx-auto w-20 h-20 rounded-none bg-[#F5F0E6] border-2 border-[#D99B38] flex items-center justify-center text-[#B87D1E] shadow-[3px_3px_0px_#1C1917]">
          <DoorClosed className="w-9 h-9 animate-vn-idle" />
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-none bg-[#F5F0E6] border border-stone-300 text-xs font-mono text-stone-700">
          <Volume2 className="w-4 h-4 text-[#B87D1E] animate-bounce" />
          <span>[SFX: Passos no corredor + Porta pesada do Tribunal fechando]</span>
        </div>

        <p
          key={stageText}
          className="text-lg sm:text-xl font-bold text-stone-900 tracking-wide animate-screen-enter"
        >
          “{stageText}”
        </p>

        <div className="w-60 h-2 bg-[#EBE4D5] border border-stone-900 rounded-none overflow-hidden mx-auto">
          <div className="h-full bg-[#D99B38] animate-arrival-fill" />
        </div>
      </div>
    </div>
  )
}

export default ArrivalTransition
