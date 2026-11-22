import { useEffect } from 'react'
import HudTimerHeader from './components/hud/HudTimerHeader'
import ArrivalTransition from './components/screens/ArrivalTransition'
import ComicIntroScreen from './components/screens/ComicIntroScreen'
import ExitTransition from './components/screens/ExitTransition'
import FinalRankingScreen from './components/screens/FinalRankingScreen'
import RegistrationScreen from './components/screens/RegistrationScreen'
import TribunalHubScreen from './components/screens/TribunalHubScreen'
import { GameProvider } from './context/GameContext'
import { useGame } from './context/gameContextInstance'

function GameScreenRouter() {
  const { screen, isRestoringSession, screenFadePhase } = useGame()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [screen])

  if (isRestoringSession) {
    return (
      <div className="min-h-screen w-full bg-[#F5F0E6] text-stone-900 flex items-center justify-center p-6">
        <div className="bg-[#FDFBF7] border-2 border-stone-900 px-6 py-4 shadow-[6px_6px_0px_#1C1917] text-xs font-black uppercase tracking-[0.2em] text-stone-700">
          Carregando Conselho Next...
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen w-full bg-[#F5F0E6] text-stone-900">
      {/* HUD Fixo no topo durante o desafio */}
      <HudTimerHeader />

      {screen === 'REGISTRATION' && (
        <div key="REGISTRATION" className="animate-screen-enter">
          <RegistrationScreen />
        </div>
      )}
      {screen === 'COMIC_INTRO' && (
        <div key="COMIC_INTRO" className="animate-screen-enter">
          <ComicIntroScreen />
        </div>
      )}
      {screen === 'TRANSITION_ARRIVAL' && (
        <div key="TRANSITION_ARRIVAL" className="animate-screen-enter">
          <ArrivalTransition />
        </div>
      )}
      {screen === 'TRIBUNAL_HUB' && (
        <div key="TRIBUNAL_HUB" className="animate-screen-enter">
          <TribunalHubScreen />
        </div>
      )}
      {screen === 'TRANSITION_EXIT' && (
        <div key="TRANSITION_EXIT" className="animate-screen-enter">
          <ExitTransition />
        </div>
      )}
      {screen === 'FINAL_RANKING' && (
        <div key="FINAL_RANKING" className="animate-screen-enter">
          <FinalRankingScreen />
        </div>
      )}

      {/* Transição cinematográfica: Fade out para preto (500ms) + Fade in do conselho (500ms) = ~1s total */}
      <div
        aria-hidden="true"
        className={`fixed inset-0 z-[100] bg-stone-950 transition-opacity duration-500 ease-in-out ${
          screenFadePhase === 'fade-to-black'
            ? 'opacity-100 pointer-events-auto'
            : screenFadePhase === 'fade-from-black'
              ? 'opacity-0 pointer-events-auto'
              : 'opacity-0 pointer-events-none'
        }`}
      />
    </div>
  )
}

function App() {
  return (
    <GameProvider>
      <GameScreenRouter />
    </GameProvider>
  )
}

export default App
