export const PENALIDADE_ERRO_SIMPLES = 5
export const PENALIDADE_ERRO_REPROVACAO = 10
export const LIMITE_ERROS_CICLO = 3
export const DURACAO_BLOQUEIO_SEGUNDOS = 10
export const COMBO_TAMANHO = 3
export const BONUS_COMBO_SEGUNDOS = 5
export const BONUS_INVICTO_SEGUNDOS = 10
export const TEMPO_MINIMO_OFICIAL = 1
export const TEMPO_SUSPEITO_CONCLUSAO_SEGUNDOS = 5
// Intervalo mínimo obrigatório após uma aprovação (compatível com a trava real de 2,5s da interface)
export const COOLDOWN_APOS_APROVACAO_MS = 2000

export function calcularSegundosTotais({
  segundosReais = 0,
  segundosPenalidade = 0,
  segundosBonus = 0,
}) {
  return Math.max(
    TEMPO_MINIMO_OFICIAL,
    Math.floor(segundosReais) + Math.floor(segundosPenalidade) - Math.floor(segundosBonus)
  )
}

/**
 * Calcula o tempo real 100% no servidor (anti-cheat):
 * - Ignora completamente qualquer contagem enviada pelo cliente.
 * - Baseia-se exclusivamente no intervalo contínuo entre `cronometroIniciadoEm` e `now`.
 * - Nunca retrocede abaixo do `segundosReais` já persistido na partida.
 */
export function calcularTempoServidor({ partida, now = new Date() }) {
  const baseAtual = Math.max(0, Number(partida?.segundosReais) || 0)

  if (!partida?.cronometroIniciadoEm) {
    return baseAtual
  }

  const inicioMs = new Date(partida.cronometroIniciadoEm).getTime()
  if (!Number.isFinite(inicioMs)) {
    return baseAtual
  }

  const decorrido = Math.max(0, Math.floor((now.getTime() - inicioMs) / 1000))
  return Math.max(baseAtual, decorrido)
}

/**
 * Avalia a punição de um erro no ciclo atual do conselheiro:
 * - 1º e 2º erros: +5s sem bloqueio
 * - 3º erro: +10s (totalizando +20s no ciclo), reprovação e bloqueio de 10s com reset das opções
 */
export function avaliarResultadoErro({ errosAnterioresNoCiclo = 0 }) {
  if (errosAnterioresNoCiclo >= LIMITE_ERROS_CICLO - 1) {
    return {
      reprovado: true,
      penalidade: PENALIDADE_ERRO_REPROVACAO,
      bloqueioSegundos: DURACAO_BLOQUEIO_SEGUNDOS,
    }
  }

  return {
    reprovado: false,
    penalidade: PENALIDADE_ERRO_SIMPLES,
    bloqueioSegundos: 0,
  }
}

/**
 * Avalia bônus ao acertar um conselheiro:
 * - 3 acertos seguidos de primeira: -5s (combo)
 * - Concluir todos sem nenhum erro na partida: -10s extras (invicto)
 */
export function avaliarBonusAcerto({
  comboAtual = 0,
  acertouDePrimeira = false,
  jogoConcluido = false,
  totalErrosPartida = 0,
}) {
  let novoComboAtual = acertouDePrimeira ? comboAtual + 1 : 0
  let bonusCombo = 0
  let comboAtivado = false
  let incrementTotalCombos = 0

  if (novoComboAtual >= COMBO_TAMANHO) {
    comboAtivado = true
    bonusCombo = BONUS_COMBO_SEGUNDOS
    novoComboAtual = 0
    incrementTotalCombos = 1
  }

  const invicto = Boolean(jogoConcluido && totalErrosPartida === 0)
  const bonusInvicto = invicto ? BONUS_INVICTO_SEGUNDOS : 0

  return {
    novoComboAtual,
    comboAtivado,
    bonusCombo,
    incrementTotalCombos,
    invicto,
    bonusInvicto,
    bonusTotalAplicado: bonusCombo + bonusInvicto,
  }
}
