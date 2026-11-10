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
    <div className="relative min-h-screen w-full bg-slate-950 text-slate-100">
      {/* HUD Fixo no canto superior direito durante todo o jogo */}
      <HudTimerHeader />

      {screen === 'REGISTRATION' && <RegistrationScreen />}
      {screen === 'COMIC_INTRO' && <ComicIntroScreen />}
      {screen === 'TRANSITION_ARRIVAL' && <ArrivalTransition />}
      {screen === 'TRIBUNAL_HUB' && <TribunalHubScreen />}
      {screen === 'FINAL_RANKING' && <FinalRankingScreen />}
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
