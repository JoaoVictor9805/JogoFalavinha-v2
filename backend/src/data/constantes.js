export const UNIDADES_OFICIAIS = [
  'Bacacheri',
  'Alphaville',
  'Araucária',
]

export const SETORES_OFICIAIS = [
  'Administrativo',
  'Altavia',
  'CIGAM',
  'Comercial',
  'Condomínios',
  'Consulta de negócios',
  'Contábil',
  'DP',
  'Diretoria',
  'Financeiro',
  'Fiscal',
  'Gente & Gestão',
  'Hubnext',
  'Inovação',
  'Inteligência de negócios',
  'Marketing',
  'Societário',
  'TI',
  'Tributário',
]

export const GENEROS_VALIDOS = ['masculino', 'feminino']

export const ALLOWED_EMAIL_DOMAIN = '@falavinha.com.br'
export const MIN_PASSWORD_LENGTH = 8
// Limite real do bcrypt em bytes UTF-8 (acima de 72 bytes o bcrypt trunca silenciosamente)
export const MAX_PASSWORD_LENGTH = 72

export const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const CORPORATE_EMAIL_REGEX =
  /^[a-z0-9._%+-]+@falavinha\.com\.br$/i

export function isValidUuid(value) {
  return typeof value === 'string' && UUID_REGEX.test(value.trim())
}

export function isValidCorporateEmail(email) {
  return typeof email === 'string' && CORPORATE_EMAIL_REGEX.test(email.trim())
}
