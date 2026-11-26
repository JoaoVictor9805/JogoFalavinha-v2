import nodemailer from 'nodemailer'
import { maskEmail } from './securityLogger.js'

let cachedTransporter = null
let cachedConfigKey = ''
let testTransporterOverride = null

export class MailConfigurationError extends Error {
  constructor(message = 'Serviço de envio de e-mail não configurado no servidor.') {
    super(message)
    this.name = 'MailConfigurationError'
    this.code = 'SMTP_NOT_CONFIGURED'
  }
}

export class MailDeliveryError extends Error {
  constructor(message = 'Não foi possível enviar o e-mail no momento. Tente novamente em instantes.') {
    super(message)
    this.name = 'MailDeliveryError'
    this.code = 'SMTP_DELIVERY_FAILED'
  }
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function parseBooleanEnv(value, fallback = false) {
  if (value === undefined || value === null || String(value).trim() === '') {
    return fallback
  }
  const normalized = String(value).trim().toLowerCase()
  return normalized === 'true' || normalized === '1' || normalized === 'yes'
}

function resolveSmtpConfig() {
  const host = process.env.SMTP_HOST?.trim() || ''
  const port = Number(process.env.SMTP_PORT || 587)
  const secure = parseBooleanEnv(process.env.SMTP_SECURE, port === 465)
  const user = process.env.SMTP_USER?.trim() || ''
  const pass = process.env.SMTP_PASS ?? ''
  const customFrom = process.env.SMTP_FROM?.trim() || ''

  const from = customFrom || (user ? `Conselho Next Falavinha <${user}>` : 'Conselho Next Falavinha <no-reply@falavinha.com.br>')

  return {
    host,
    port: Number.isFinite(port) && port > 0 ? port : 587,
    secure,
    user,
    pass,
    from,
  }
}

export function isSmtpConfigured() {
  if (testTransporterOverride) return true
  const { host } = resolveSmtpConfig()
  return Boolean(host)
}

export function setMailTransporterForTests(transporter) {
  testTransporterOverride = transporter || null
}

export function resetMailTransporterForTests() {
  testTransporterOverride = null
  cachedTransporter = null
  cachedConfigKey = ''
}

function getTransporter() {
  if (testTransporterOverride) {
    return {
      transporter: testTransporterOverride,
      from: resolveSmtpConfig().from,
    }
  }

  const config = resolveSmtpConfig()
  if (!config.host) {
    throw new MailConfigurationError()
  }

  const configKey = JSON.stringify({
    host: config.host,
    port: config.port,
    secure: config.secure,
    user: config.user,
    hasPass: Boolean(config.pass),
    from: config.from,
  })

  if (!cachedTransporter || cachedConfigKey !== configKey) {
    const transportOptions = {
      host: config.host,
      port: config.port,
      secure: config.secure,
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    }

    if (config.user && config.pass) {
      transportOptions.auth = {
        user: config.user,
        pass: config.pass,
      }
      transportOptions.tls = {
        minVersion: 'TLSv1.2',
      }
    }

    cachedTransporter = nodemailer.createTransport(transportOptions)
    cachedConfigKey = configKey
  }

  return {
    transporter: cachedTransporter,
    from: config.from,
  }
}

function montarEmailOtpHtml({ titulo, subtitulo, nome, instrucao, codigo, expiracaoMinutos, avisoSeguranca }) {
  const nomeSeguro = escapeHtml(nome || 'Colaborador(a)')
  const codigoSeguro = escapeHtml(codigo)

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(titulo)}</title>
</head>
<body style="margin:0;padding:24px;background-color:#F5F0E6;font-family:Arial,Helvetica,sans-serif;color:#1C1917;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;margin:0 auto;background-color:#FDFBF7;border:2px solid #1C1917;">
    <tr>
      <td style="padding:24px 28px;border-bottom:4px solid #D99B38;background-color:#1C1917;color:#FDFBF7;">
        <div style="font-size:11px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;color:#D99B38;">
          Escape Room Virtual Falavinha
        </div>
        <h1 style="margin:6px 0 0 0;font-size:20px;line-height:1.25;text-transform:uppercase;">
          ${escapeHtml(titulo)}
        </h1>
      </td>
    </tr>
    <tr>
      <td style="padding:28px;">
        <p style="margin:0 0 12px 0;font-size:15px;line-height:1.5;">
          Olá, <strong>${nomeSeguro}</strong>!
        </p>
        <p style="margin:0 0 18px 0;font-size:14px;line-height:1.55;color:#44403C;">
          ${escapeHtml(subtitulo)} ${escapeHtml(instrucao)}
        </p>
        <div style="margin:24px 0;padding:18px;text-align:center;background-color:#F5F0E6;border:2px solid #1C1917;">
          <div style="font-size:11px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;color:#78716C;margin-bottom:8px;">
            Código de Verificação
          </div>
          <div style="font-size:34px;font-weight:bold;letter-spacing:10px;color:#1C1917;font-family:'Courier New',Courier,monospace;">
            ${codigoSeguro}
          </div>
        </div>
        <p style="margin:0 0 10px 0;font-size:13px;line-height:1.5;color:#57534E;">
          Este código é válido por <strong>${Number(expiracaoMinutos)} minutos</strong> e permite no máximo 5 tentativas.
        </p>
        <p style="margin:0;font-size:12px;line-height:1.5;color:#78716C;border-top:1px solid #E7E5E4;padding-top:14px;">
          ${escapeHtml(avisoSeguranca)}
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`
}

async function enviarEmail({ to, subject, text, html }) {
  const { transporter, from } = getTransporter()
  try {
    await transporter.sendMail({
      from,
      to,
      subject,
      text,
      html,
    })
  } catch (error) {
    if (error instanceof MailConfigurationError) {
      throw error
    }
    console.error('[mailer] Falha ao enviar e-mail:', {
      to: maskEmail(to),
      code: error?.code,
      responseCode: error?.responseCode,
      message: error?.message,
    })
    throw new MailDeliveryError()
  }
}

export async function enviarCodigoVerificacaoCadastro({ email, nome, codigo, expiracaoMinutos }) {
  const subject = 'Código de verificação — Conselho Next Falavinha'
  const text = [
    `Olá, ${nome || 'Colaborador(a)'}!`,
    '',
    'Para confirmar seu cadastro no Conselho Next Falavinha, digite o código abaixo na tela de verificação:',
    '',
    `Código: ${codigo}`,
    '',
    `Validade: ${expiracaoMinutos} minutos.`,
    'Se você não solicitou este cadastro, basta ignorar este e-mail.',
  ].join('\n')

  const html = montarEmailOtpHtml({
    titulo: 'Confirmação de Cadastro',
    subtitulo: 'Recebemos sua solicitação de credenciamento no Conselho Next.',
    nome,
    instrucao: 'Informe o código de 6 dígitos abaixo na tela do sistema para ativar sua conta e iniciar o desafio:',
    codigo,
    expiracaoMinutos,
    avisoSeguranca: 'Se você não realizou este cadastro, ignore este e-mail. Nenhuma conta será ativada sem a confirmação deste código.',
  })

  await enviarEmail({ to: email, subject, text, html })
}

export async function enviarCodigoRecuperacaoSenha({ email, nome, codigo, expiracaoMinutos }) {
  const subject = 'Recuperação de senha — Conselho Next Falavinha'
  const text = [
    `Olá, ${nome || 'Colaborador(a)'}!`,
    '',
    'Recebemos um pedido para redefinir sua senha no Conselho Next Falavinha.',
    '',
    `Código de recuperação: ${codigo}`,
    '',
    `Validade: ${expiracaoMinutos} minutos.`,
    'Se você não solicitou a redefinição de senha, ignore este e-mail; sua senha atual continuará ativa.',
  ].join('\n')

  const html = montarEmailOtpHtml({
    titulo: 'Recuperação de Senha',
    subtitulo: 'Foi solicitada uma redefinição de senha para o seu acesso ao Conselho Next.',
    nome,
    instrucao: 'Use o código de 6 dígitos abaixo para criar uma nova senha:',
    codigo,
    expiracaoMinutos,
    avisoSeguranca: 'Se você não pediu esta alteração, ignore este e-mail. Sua senha atual permanecerá inalterada.',
  })

  await enviarEmail({ to: email, subject, text, html })
}
