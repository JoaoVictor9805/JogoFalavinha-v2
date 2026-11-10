const DEFAULT_NORMALIZATION = {
  trim: true,
  ignorarMaiusculas: true,
  ignorarAcentos: true,
  ignorarPontuacao: false,
}

/**
 * Normaliza uma resposta de acordo com as regras declaradas no JSON da etapa.
 */
export function normalizarResposta(valor, regras = {}) {
  const cfg = { ...DEFAULT_NORMALIZATION, ...regras }
  let texto = String(valor ?? '')

  if (cfg.trim) {
    texto = texto.trim().replace(/\s+/g, ' ')
  }
  if (cfg.ignorarAcentos) {
    texto = texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  }
  if (cfg.ignorarPontuacao) {
    texto = texto.replace(/[^\p{L}\p{N}\s]/gu, '')
  }
  if (cfg.ignorarMaiusculas) {
    texto = texto.toUpperCase()
  }

  return texto
}

/**
 * Valida a resposta enviada pelo jogador usando exclusivamente os metadados da etapa no JSON.
 * @param {object} etapa
 * @param {string} respostaUsuario - ID da opção selecionada ou texto digitado
 */
export function validarRespostaEtapa(etapa, respostaUsuario) {
  if (!etapa || !etapa.validacao) return false

  const { validacao } = etapa
  const norm = validacao.normalizacao || {}

  if (validacao.modo === 'opcao_id') {
    if (validacao.respostaCorretaId && respostaUsuario === validacao.respostaCorretaId) {
      return true
    }
  }

  const entradaNormalizada = normalizarResposta(respostaUsuario, norm)
  if (!entradaNormalizada) return false

  const aceitas = Array.isArray(validacao.respostasAceitas) ? validacao.respostasAceitas : []
  return aceitas.some((item) => normalizarResposta(item, norm) === entradaNormalizada)
}

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

