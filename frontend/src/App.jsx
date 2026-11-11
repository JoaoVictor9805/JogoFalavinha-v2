import HudTimerHeader from './components/hud/HudTimerHeader'
import ArrivalTransition from './components/screens/ArrivalTransition'
import ComicIntroScreen from './components/screens/ComicIntroScreen'
import FinalRankingScreen from './components/screens/FinalRankingScreen'
import RegistrationScreen from './components/screens/RegistrationScreen'
import TribunalHubScreen from './components/screens/TribunalHubScreen'
import { GameProvider } from './context/GameContext'
import { useGame } from './context/gameContextInstance'

function GameScreenRouter() {
  const { screen } = useGame()

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
      {screen === 'FINAL_RANKING' && (
        <div key="FINAL_RANKING" className="animate-screen-enter">
          <FinalRankingScreen />
        </div>
      )}
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
