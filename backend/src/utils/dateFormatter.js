/**
 * Formata uma data/hora para exibição no fuso horário oficial de Brasília (UTC-3).
 */
export function formatarDataBrasilia(dateValue) {
  if (!dateValue) return ''
  return new Date(dateValue).toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
  })
}

