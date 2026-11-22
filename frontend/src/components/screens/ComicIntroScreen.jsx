import { useCallback, useEffect, useState } from 'react'
import { ArrowRight, FastForward } from 'lucide-react'
import { useGame } from '../../context/gameContextInstance'
import { COMIC_PANELS } from '../../data/conselhoNextData'
import { prefetchTribunalAssets } from '../../utils/assetPrefetch'
import { playDialogueBlipSound } from '../../utils/soundEffects'

const SEQUENCE = COMIC_PANELS.flatMap((panel, panelIndex) => [
  { panelIndex, field: 'narration', text: panel.narration },
  { panelIndex, field: 'speech', text: panel.speech },
])

const BASE_CHAR_MS = 24
const INITIAL_DELAY_MS = 420
const INTRA_PANEL_PAUSE_MS = 360
const NEXT_PANEL_PAUSE_MS = 540

function getCharDelay(text, nextCount) {
  const ch = text[nextCount - 1]
  const nextCh = text[nextCount]
  if (!ch) return BASE_CHAR_MS

  if (/[.!?]/.test(ch)) {
    if (nextCh && /[.!?]/.test(nextCh)) {
      return BASE_CHAR_MS * 1.4
    }
    return 220
  }

  if (/[,;:—–]/.test(ch)) {
    return 115
  }

  return BASE_CHAR_MS
}

function ComicIntroScreen() {
  const { advanceFromComic, isLocked } = useGame()
  const [hasStarted, setHasStarted] = useState(false)
  const [activeStep, setActiveStep] = useState(0)
  const [charCount, setCharCount] = useState(0)

  const isSequenceDone = hasStarted && activeStep >= SEQUENCE.length

  const revealAllNow = useCallback(() => {
    setHasStarted(true)
    setActiveStep(SEQUENCE.length)
    setCharCount(0)
  }, [])

  // Pequena pausa inicial para os 3 quadros surgirem antes da 1ª letra começar a digitar
  useEffect(() => {
    if (hasStarted) return undefined
    const timer = setTimeout(() => {
      setHasStarted(true)
    }, INITIAL_DELAY_MS)
    return () => clearTimeout(timer)
  }, [hasStarted])

  // Prefetch silencioso dos cutouts, cards, selos, áudios e chunk 3D enquanto o jogador lê os quadrinhos
  useEffect(() => {
    const timer = setTimeout(() => {
      prefetchTribunalAssets()
    }, 600)
    return () => clearTimeout(timer)
  }, [])

  // Motor sequencial de digitação: Q1 narração → Q1 fala → Q2 narração → Q2 fala → Q3 narração → Q3 fala
  useEffect(() => {
    if (!hasStarted || activeStep >= SEQUENCE.length) return undefined

    const currentItem = SEQUENCE[activeStep]
    const fullText = currentItem.text

    if (charCount < fullText.length) {
      const nextCount = charCount + 1
      const delay = getCharDelay(fullText, nextCount)
      const timer = setTimeout(() => {
        const ch = fullText[nextCount - 1]
        if (currentItem.field === 'speech' && ch && !/\s/.test(ch) && nextCount % 3 === 1) {
          playDialogueBlipSound(nextCount, 'ceo', ch)
        }
        setCharCount(nextCount)
      }, delay)
      return () => clearTimeout(timer)
    }

    const nextItem = SEQUENCE[activeStep + 1]
    const pauseMs =
      nextItem && nextItem.panelIndex === currentItem.panelIndex
        ? INTRA_PANEL_PAUSE_MS
        : NEXT_PANEL_PAUSE_MS

    const stepTimer = setTimeout(() => {
      setActiveStep((prev) => prev + 1)
      setCharCount(0)
    }, pauseMs)

    return () => clearTimeout(stepTimer)
  }, [hasStarted, activeStep, charCount])

  const getStepDisplay = (stepIndex, fullText) => {
    if (!hasStarted || activeStep < stepIndex) {
      return { visible: false, text: '', typing: false }
    }
    if (activeStep > stepIndex) {
      return { visible: true, text: fullText, typing: false }
    }
    return {
      visible: true,
      text: fullText.slice(0, charCount),
      typing: charCount < fullText.length,
    }
  }

  return (
    <div className="min-h-screen w-full bg-[#F5F0E6] text-stone-900 flex flex-col items-center justify-center px-4 py-6 sm:p-8">
      <div className="w-full max-w-md md:max-w-6xl space-y-6 sm:space-y-8">
        {/* 3 quadrinhos lado a lado no desktop e empilhados com scroll natural no celular */}
        <div
          onClick={!isSequenceDone ? revealAllNow : undefined}
          title={!isSequenceDone ? 'Clique para revelar todo o texto imediatamente' : undefined}
          className={`grid grid-cols-1 md:grid-cols-3 gap-6 ${!isSequenceDone ? 'cursor-pointer' : ''}`}
        >
          {COMIC_PANELS.map((panel, idx) => {
            const narrationStep = idx * 2
            const speechStep = idx * 2 + 1
            const narrationState = getStepDisplay(narrationStep, panel.narration)
            const speechState = getStepDisplay(speechStep, panel.speech)
            const isPanelActive =
              hasStarted &&
              !isSequenceDone &&
              (activeStep === narrationStep || activeStep === speechStep)

            return (
              <article
                key={panel.id}
                style={{ animationDelay: `${idx * 110}ms` }}
                className={`comic-panel-frame group relative aspect-[3/4] w-full rounded-none border-2 border-stone-900 border-t-4 bg-[#FDFBF7] overflow-hidden select-none animate-panel-rise transition-all duration-300 ${
                  isPanelActive
                    ? 'border-t-[#D99B38] shadow-[7px_7px_0px_#1C1917] ring-2 ring-[#D99B38]/60'
                    : 'border-t-[#D99B38] shadow-[6px_6px_0px_#1C1917] hover:-translate-y-1 hover:shadow-[8px_10px_0px_#1C1917]'
                }`}
              >
                {panel.image ? (
                  <img
                    src={panel.image}
                    alt={`Quadrinho 0${panel.id} — ${panel.title}`}
                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                    draggable={false}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-xs font-mono font-bold uppercase tracking-widest text-stone-400">
                      [Quadrinho 0{panel.id}]
                    </span>
                  </div>
                )}

                {/* Caixa de narração no canto superior esquerdo (estilo recordatório de HQ) */}
                {narrationState.visible && (
                  <div
                    style={panel.layout.narrationStyle}
                    className="comic-narration-box absolute z-10 text-left pointer-events-none animate-comic-bubble-in"
                  >
                    <div className="relative">
                      <span className="invisible block" aria-hidden="true">
                        {panel.narration}
                      </span>
                      <p className="absolute inset-0 m-0">
                        {narrationState.text}
                        {narrationState.typing && (
                          <span
                            aria-hidden="true"
                            className="inline-block w-[0.55em] h-[0.95em] ml-[0.15em] align-middle bg-stone-900 animate-vn-caret"
                          />
                        )}
                      </p>
                    </div>
                  </div>
                )}

                {/* Balão de fala do CEO posicionado proporcionalmente conforme a composição de cada arte */}
                {speechState.visible && (
                  <div
                    style={panel.layout.speechStyle}
                    className="comic-speech-bubble absolute z-10 text-left pointer-events-none animate-comic-bubble-in"
                  >
                    {panel.layout.speechTail === 'bottom-center' && (
                      <span aria-hidden="true" className="comic-tail-bottom" />
                    )}
                    {panel.layout.speechTail === 'top-right' && (
                      <span aria-hidden="true" className="comic-tail-top-right" />
                    )}

                    <div className="relative z-10">
                      <div className="comic-speech-tag font-mono font-black uppercase text-[#9A6513]">
                        CEO · Falavinha Next
                      </div>
                      <div className="relative">
                        <span className="invisible block italic" aria-hidden="true">
                          {panel.speech}
                        </span>
                        <p className="absolute inset-0 m-0 italic">
                          {speechState.text}
                          {speechState.typing && (
                            <span
                              aria-hidden="true"
                              className="inline-block w-[0.55em] h-[0.95em] ml-[0.15em] align-middle bg-[#B87D1E] animate-vn-caret"
                            />
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </article>
            )
          })}
        </div>

        {/* Controles inferiores: pular digitação (enquanto anima) + botão principal */}
        <div
          className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 animate-panel-rise"
          style={{ animationDelay: '320ms' }}
        >
          {!isSequenceDone && (
            <button
              type="button"
              onClick={revealAllNow}
              className="inline-flex items-center gap-2 px-5 py-3.5 rounded-none bg-[#FDFBF7] hover:bg-[#EFE7D6] text-stone-800 border-2 border-stone-900 font-black text-[11px] sm:text-xs uppercase tracking-[0.16em] shadow-[4px_4px_0px_#1C1917] hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#1C1917] active:scale-95 transition-all duration-200 cursor-pointer"
            >
              <FastForward className="w-3.5 h-3.5" />
              <span>Revelar Tudo</span>
            </button>
          )}

          <button
            type="button"
            disabled={isLocked}
            onClick={advanceFromComic}
            className="inline-flex items-center gap-3 px-8 py-4 rounded-none bg-[#D99B38] hover:bg-[#c58927] text-stone-950 border-2 border-stone-900 font-black text-xs sm:text-sm uppercase tracking-[0.2em] shadow-[6px_6px_0px_#1C1917] hover:-translate-y-0.5 hover:shadow-[8px_8px_0px_#1C1917] active:scale-95 disabled:opacity-50 disabled:pointer-events-none transition-all duration-200 cursor-pointer"
          >
            <span>Seguir para o Desafio</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default ComicIntroScreen
