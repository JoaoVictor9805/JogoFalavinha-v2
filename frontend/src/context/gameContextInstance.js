import { createContext, useContext } from 'react'

export const GameContext = createContext(null)

export function useGame() {
  const context = useContext(GameContext)
  if (!context) {
    throw new Error('useGame deve ser utilizado dentro de um GameProvider')
  }
  return context
}

