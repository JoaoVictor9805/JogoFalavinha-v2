import crypto from 'node:crypto'
import { getJwtSecret } from './jwt.js'

export const OTP_LENGTH = 6
export const OTP_EXPIRY_MINUTES = 15
export const OTP_EXPIRY_MS = OTP_EXPIRY_MINUTES * 60 * 1000
export const OTP_MAX_ATTEMPTS = 5
export const OTP_RESEND_COOLDOWN_SECONDS = 60
export const OTP_RESEND_COOLDOWN_MS = OTP_RESEND_COOLDOWN_SECONDS * 1000

export const OTP_PURPOSES = Object.freeze({
  CADASTRO: 'CADASTRO',
  RECUPERACAO_SENHA: 'RECUPERACAO_SENHA',
})

const OTP_CODE_REGEX = /^\d{6}$/

function getOtpHmacSecret() {
  const customSecret = process.env.OTP_SECRET?.trim()
  if (customSecret) {
    return customSecret
  }
  return crypto.createHash('sha256').update(`falavinha-otp:${getJwtSecret()}`).digest()
}

export function normalizarCodigoOtp(codigo) {
  if (typeof codigo !== 'string' && typeof codigo !== 'number') {
    return null
  }
  const limpo = String(codigo).trim()
  return OTP_CODE_REGEX.test(limpo) ? limpo : null
}

export function gerarCodigoOtp() {
  return crypto.randomInt(0, 1_000_000).toString().padStart(OTP_LENGTH, '0')
}

export function hashCodigoOtp({ email, finalidade, codigo }) {
  const emailNormalizado = String(email || '').trim().toLowerCase()
  const payload = `${emailNormalizado}:${finalidade}:${codigo}`
  return crypto.createHmac('sha256', getOtpHmacSecret()).update(payload).digest('hex')
}

export function compararHashOtp(hashA, hashB) {
  if (typeof hashA !== 'string' || typeof hashB !== 'string') {
    return false
  }
  const bufA = Buffer.from(hashA, 'utf8')
  const bufB = Buffer.from(hashB, 'utf8')
  if (bufA.length !== bufB.length) {
    return false
  }
  return crypto.timingSafeEqual(bufA, bufB)
}
