/**
 * Serviço de comunicação HTTP com a API Backend do Jogo Falavinha v2.
 * Utiliza cookies httpOnly para sessão autenticada.
 */

const BASE_URL = import.meta.env.VITE_API_URL || '/api'

async function request(endpoint, options = {}) {
  const config = {
    credentials: 'include',
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  }

  let response
  try {
    response = await fetch(`${BASE_URL}${endpoint}`, config)
  } catch {
    const netErr = new Error(
      'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.'
    )
    netErr.isNetworkError = true
    throw netErr
  }

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    const errorMsg = data?.erro || data?.error || `Erro ao comunicar com o servidor (${response.status}).`
    const err = new Error(errorMsg)
    err.status = response.status
    err.data = data
    throw err
  }

  return data
}

export const apiService = {
  // Autenticação & Sessão
  async cadastrar(dados) {
    return request('/auth/cadastrar', {
      method: 'POST',
      body: JSON.stringify(dados),
    })
  },

  async login(dados) {
    return request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(dados),
    })
  },

  async obterSessao() {
    return request('/auth/me')
  },

  async logout() {
    return request('/auth/logout', {
      method: 'POST',
    })
  },

  // Desafios (Conselho Next)
  async obterDesafios() {
    return request('/desafios')
  },

  // Partidas e Validação
  async iniciarPartida({ forceNew = false } = {}) {
    return request('/partidas/iniciar', {
      method: 'POST',
      body: JSON.stringify({ forceNew }),
    })
  },

  async iniciarCronometro(partidaId) {
    return request(`/partidas/${partidaId}/iniciar-cronometro`, {
      method: 'POST',
    })
  },

  async obterMeuHistorico() {
    return request('/partidas/meu-historico')
  },

  async obterHistoricoTentativas(jogadorId) {
    return request(`/partidas/jogador/${jogadorId}/historico`)
  },

  async obterPartida(partidaId) {
    return request(`/partidas/${partidaId}`)
  },

  async validarResposta(partidaId, dados) {
    return request(`/partidas/${partidaId}/validar`, {
      method: 'POST',
      body: JSON.stringify(dados),
    })
  },

  async sincronizarTempo(partidaId, segundosReais) {
    return request(`/partidas/${partidaId}/sincronizar-tempo`, {
      method: 'POST',
      body: JSON.stringify({ segundosReais }),
    })
  },

  // Rankings
  async obterRankingGeral() {
    return request('/ranking')
  },

  async obterRankingSetores() {
    return request('/ranking/setores')
  },
}
