import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Efeito de digitação progressiva estilo Visual Novel / Pokémon / Ace Attorney.
 * Permite pular imediatamente para o texto completo com `skip()`.
 */
export function useTypewriter(text, { speed = 22, onCharacter, triggerKey = '' } = {}) {
  const normalizedText = String(text || '')
  const compositeKey = `${triggerKey}::${normalizedText}`
  const [state, setState] = useState({ source: compositeKey, count: 0 })
  const onCharRef = useRef(onCharacter)
  const skippedRef = useRef(false)

  useEffect(() => {
    onCharRef.current = onCharacter
  }, [onCharacter])

  const currentCount = state.source === compositeKey ? state.count : 0
  const isTyping = currentCount < normalizedText.length

  useEffect(() => {
    skippedRef.current = false
    if (!normalizedText) return undefined

    let idx = 0
    const interval = setInterval(() => {
      if (skippedRef.current) {
        clearInterval(interval)
        return
      }
      idx += 1
      setState((prev) => {
        if (prev.source === compositeKey && prev.count >= normalizedText.length) {
          return prev
        }
        return { source: compositeKey, count: idx }
      })

      const ch = normalizedText[idx - 1]
      if (ch && !/\s/.test(ch)) {
        onCharRef.current?.(idx, ch)
      }

      if (idx >= normalizedText.length) {
        clearInterval(interval)
      }
    }, speed)

    return () => clearInterval(interval)
  }, [compositeKey, normalizedText, speed])

  const skip = useCallback(() => {
    skippedRef.current = true
    setState({ source: compositeKey, count: normalizedText.length })
  }, [compositeKey, normalizedText.length])

  return {
    displayedText: normalizedText.slice(0, currentCount),
    isTyping,
    skip,
  }
}

export default useTypewriter
