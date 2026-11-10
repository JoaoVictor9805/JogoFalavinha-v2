import { useEffect, useState } from 'react'
import { DoorClosed, Volume2 } from 'lucide-react'
import { useGame } from '../../context/gameContextInstance'
import { playArrivalDoorSound as triggerDoorAudio } from '../../utils/soundEffects'

function ArrivalTransition() {
  const { finishArrivalTransition } = useGame()
  const [stageText, setStageText] = useState('Você caminha pelo corredor silencioso do 7º andar...')

  useEffect(() => {
    // Dispara o gatilho sonoro de chegada + porta pesada fechando
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
    <div className="fixed inset-0 z-40 bg-black flex flex-col items-center justify-center p-6 text-center select-none transition-opacity duration-500">
      <div className="max-w-lg w-full space-y-6">
        {/* Ícone de Áudio / Porta Pesada */}
        <div className="mx-auto w-20 h-20 rounded-full bg-slate-900/90 border border-slate-800 flex items-center justify-center text-teal-400 shadow-[0_0_50px_rgba(20,184,166,0.2)] animate-pulse">
          <DoorClosed className="w-9 h-9" />
        </div>

        {/* Indicador do Gatilho de Áudio (Placeholder visual + Web Audio API ativo) */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs font-mono text-amber-400">
          <Volume2 className="w-4 h-4 animate-bounce" />
          <span>[SFX: Passos no corredor + Porta pesada do Tribunal fechando]</span>
        </div>

        <p className="text-lg sm:text-xl font-semibold text-slate-200 tracking-wide transition-all duration-500">
          {stageText}
        </p>

        {/* Barra sutil de progresso da transição */}
        <div className="w-48 h-1 bg-slate-900 rounded-full overflow-hidden mx-auto">
          <div className="h-full bg-teal-500 animate-pulse w-full" />
        </div>
      </div>
    </div>
  )
}

export default ArrivalTransition
