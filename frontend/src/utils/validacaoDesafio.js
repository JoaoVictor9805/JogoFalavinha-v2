/**
 * Formata segundos totais no padrão MM:SS.
 */
export function formatarTempo(segundosTotais) {
  const safe = Math.max(0, Math.floor(Number(segundosTotais) || 0))
  const minutos = Math.floor(safe / 60)
  const segundos = safe % 60
  return `${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`
}

/**
 * Calcula o percentual de assertividade com base nas etapas concluídas vs tentativas totais.
 */
export function calcularAssertividade(totalEtapas, totalTentativas) {
  if (!totalEtapas || !totalTentativas) return 100
  const percentual = Math.round((totalEtapas / totalTentativas) * 100)
  return Math.min(100, Math.max(0, percentual))
}
