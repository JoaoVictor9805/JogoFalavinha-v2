export const UNIDADES_OFICIAIS = [
  'Curitiba - Matriz',
  'Londrina',
  'Maringá',
  'Ponta Grossa',
  'Cascavel',
  'Remoto / Outra',
]

export const SETORES_OFICIAIS = [
  'Tributário',
  'Contábil',
  'Financeiro',
  'Recursos Humanos',
  'TI / Inovação',
  'Comercial / Vendas',
  'Operações / Suporte',
  'Diretoria / Gestão',
]

export const GENEROS_VALIDOS = ['masculino', 'feminino']

export const ALLOWED_EMAIL_DOMAIN = '@falavinha.com.br'
export const MIN_PASSWORD_LENGTH = 8
export const MAX_PASSWORD_LENGTH = 128

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
