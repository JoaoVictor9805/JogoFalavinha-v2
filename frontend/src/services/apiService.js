/**
 * Serviço de comunicação HTTP com a API Backend do Jogo Falavinha v2.
 * Utiliza o proxy configurado no Vite (/api).
 */

const BASE_URL = '/api'

async function request(endpoint, options = {}) {
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, config)
  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    const errorMsg = data?.erro || data?.error || `Erro HTTP ${response.status}`
    throw new Error(errorMsg)
  }

  return data
}

export const apiService = {
  // Autenticação
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

  // Desafios (Conselho Next)
  async obterDesafios() {
    return request('/desafios')
  },

  // Partidas e Validação
  async iniciarPartida(jogadorId) {
    return request('/partidas/iniciar', {
      method: 'POST',
      body: JSON.stringify({ jogadorId }),
    })
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

