import { useCallback, useEffect, useRef, useState } from 'react'

function getNextCharDelay(text, currentIndex, baseSpeed) {
  const ch = text[currentIndex - 1]
  const nextCh = text[currentIndex]
  if (!ch) return baseSpeed

  // Se for sequência de pontuação (ex.: "..." ou "?!"), só pausa no último sinal
  if (/[.!?]/.test(ch)) {
    if (nextCh && /[.!?]/.test(nextCh)) {
      return baseSpeed * 1.4
    }
    return Math.max(baseSpeed * 10, 250)
  }

  if (/[,;:—–]/.test(ch)) {
    return Math.max(baseSpeed * 5, 125)
  }

  return baseSpeed
}

/**
 * Efeito de digitação progressiva estilo Visual Novel / Ace Attorney,
 * com pausas orgânicas na pontuação e suporte a `skip()` imediato.
 */
export function useTypewriter(text, { speed = 22, onCharacter, triggerKey = '' } = {}) {
  const normalizedText = String(text || '')
  const compositeKey = `${triggerKey}::${normalizedText}`
  const [state, setState] = useState({
    source: compositeKey,
    count: 0,
    isPunctuationPause: false,
  })
  const onCharRef = useRef(onCharacter)
  const skippedRef = useRef(false)
  const timeoutRef = useRef(null)

  useEffect(() => {
    onCharRef.current = onCharacter
  }, [onCharacter])

  const currentCount = state.source === compositeKey ? state.count : 0
  const isTyping = currentCount < normalizedText.length
  const isPunctuationPause =
    state.source === compositeKey && isTyping ? state.isPunctuationPause : false
  const isSpeaking = isTyping && !isPunctuationPause

  useEffect(() => {
    skippedRef.current = false
    if (timeoutRef.current) clearTimeout(timeoutRef.current)

    if (!normalizedText) return undefined

    let idx = 0

    const step = () => {
      if (skippedRef.current) return

      idx += 1
      const ch = normalizedText[idx - 1]
      const nextDelay = getNextCharDelay(normalizedText, idx, speed)
      const isLongPause = nextDelay >= speed * 4 && idx < normalizedText.length

      setState((prev) => {
        if (prev.source === compositeKey && prev.count >= normalizedText.length) {
          return prev
        }
        return {
          source: compositeKey,
          count: idx,
          isPunctuationPause: isLongPause,
        }
      })

      if (ch && !/\s/.test(ch)) {
        onCharRef.current?.(idx, ch)
      }

      if (idx < normalizedText.length && !skippedRef.current) {
        timeoutRef.current = setTimeout(step, nextDelay)
      }
    }

    timeoutRef.current = setTimeout(step, speed)

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [compositeKey, normalizedText, speed])

  const skip = useCallback(() => {
    skippedRef.current = true
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setState({
      source: compositeKey,
      count: normalizedText.length,
      isPunctuationPause: false,
    })
  }, [compositeKey, normalizedText.length])

  return {
    displayedText: normalizedText.slice(0, currentCount),
    isTyping,
    isSpeaking,
    isPunctuationPause,
    skip,
  }
}

export default useTypewriter
