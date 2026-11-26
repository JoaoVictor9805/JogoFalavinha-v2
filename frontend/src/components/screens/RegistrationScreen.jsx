import { useEffect, useState } from 'react'
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  CheckCircle2,
  Key,
  Loader2,
  LogIn,
  Mail,
  Play,
  RefreshCw,
  ShieldCheck,
  User,
  Users,
} from 'lucide-react'
import { useGame } from '../../context/gameContextInstance'
import { DEPARTMENTS_LIST, UNITS_LIST } from '../../data/conselhoNextData'

const CORPORATE_EMAIL_REGEX = /^[a-z0-9._%+-]+@falavinha\.com\.br$/i
const OTP_CODE_REGEX = /^\d{6}$/
const MIN_PASSWORD_LENGTH = 8
const MAX_PASSWORD_LENGTH = 72
const DEFAULT_RESEND_COOLDOWN_SECONDS = 60

function validarNovaSenha(senha, confirmarSenha) {
  if (typeof senha !== 'string' || senha.trim().length < MIN_PASSWORD_LENGTH) {
    return `A senha deve ter no mínimo ${MIN_PASSWORD_LENGTH} caracteres.`
  }
  if (new TextEncoder().encode(senha).length > MAX_PASSWORD_LENGTH) {
    return `A senha deve ter no máximo ${MAX_PASSWORD_LENGTH} bytes.`
  }
  if (senha !== confirmarSenha) {
    return 'As senhas digitadas não conferem.'
  }
  return null
}

function RegistrationScreen() {
  const {
    player,
    registerAccount,
    verifyEmailAndStartGame,
    resendVerificationCode,
    requestPasswordReset,
    confirmPasswordReset,
    loginAndStart,
    isLocked,
    authError,
    clearAuthError,
  } = useGame()

  // activeTab: 'cadastro' | 'login'
  // viewMode: 'form' | 'verify_email' | 'forgot_request' | 'forgot_reset'
  const [activeTab, setActiveTab] = useState('cadastro')
  const [viewMode, setViewMode] = useState('form')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [localError, setLocalError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [needsVerificationEmail, setNeedsVerificationEmail] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)

  // Formulário de Cadastro
  const [registerForm, setRegisterForm] = useState({
    nome: player?.nome || '',
    email: player?.email || '',
    senha: '',
    confirmarSenha: '',
    genero: player?.genero || 'masculino',
    unidade: player?.unidade || UNITS_LIST[0],
    setor: player?.setor || DEPARTMENTS_LIST[0],
  })

  // Verificação de e-mail do cadastro
  const [verifyEmail, setVerifyEmail] = useState('')
  const [verifyCode, setVerifyCode] = useState('')

  // Formulário de Login
  const [loginForm, setLoginForm] = useState({
    email: player?.email || '',
    senha: '',
  })

  // Recuperação de senha
  const [forgotForm, setForgotForm] = useState({
    email: player?.email || '',
    codigo: '',
    novaSenha: '',
    confirmarNovaSenha: '',
  })

  useEffect(() => {
    if (resendCooldown <= 0) return undefined
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 1 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [resendCooldown])

  const clearFeedback = () => {
    setLocalError('')
    setSuccessMessage('')
    setNeedsVerificationEmail('')
    clearAuthError?.()
  }

  const handleRegisterChange = (e) => {
    const { name, value } = e.target
    setRegisterForm((prev) => ({ ...prev, [name]: value }))
    if (localError || authError || successMessage) {
      clearFeedback()
    }
  }

  const handleLoginChange = (e) => {
    const { name, value } = e.target
    setLoginForm((prev) => ({ ...prev, [name]: value }))
    if (localError || authError || successMessage || needsVerificationEmail) {
      clearFeedback()
    }
  }

  const handleForgotChange = (e) => {
    const { name, value } = e.target
    const nextValue = name === 'codigo' ? value.replace(/\D/g, '').slice(0, 6) : value
    setForgotForm((prev) => ({ ...prev, [name]: nextValue }))
    if (localError || authError || successMessage) {
      clearFeedback()
    }
  }

  const handleTabSwitch = (tab) => {
    setActiveTab(tab)
    setViewMode('form')
    setVerifyCode('')
    clearFeedback()
  }

  const handleRegisterSubmit = async (e) => {
    e.preventDefault()
    if (isLocked || isSubmitting) return

    if (!registerForm.nome.trim() || registerForm.nome.trim().length < 2) {
      setLocalError('Por favor, informe seu nome completo (mínimo 2 caracteres).')
      return
    }

    if (!CORPORATE_EMAIL_REGEX.test(registerForm.email.trim())) {
      setLocalError('Utilize um e-mail corporativo válido terminado em @falavinha.com.br.')
      return
    }

    const senhaErro = validarNovaSenha(registerForm.senha, registerForm.confirmarSenha)
    if (senhaErro) {
      setLocalError(senhaErro)
      return
    }

    try {
      setIsSubmitting(true)
      clearFeedback()
      const res = await registerAccount(registerForm)
      const emailNormalizado = res?.email || registerForm.email.trim().toLowerCase()
      setVerifyEmail(emailNormalizado)
      setVerifyCode('')
      setResendCooldown(res?.cooldownReenvioSegundos || DEFAULT_RESEND_COOLDOWN_SECONDS)
      setSuccessMessage(
        res?.mensagem || 'Enviamos um código de 6 dígitos para o seu e-mail corporativo.'
      )
      setViewMode('verify_email')
    } catch (err) {
      if (err?.status === 429 && err?.data?.segundosRestantes) {
        setVerifyEmail(registerForm.email.trim().toLowerCase())
        setResendCooldown(Number(err.data.segundosRestantes) || DEFAULT_RESEND_COOLDOWN_SECONDS)
      }
      setLocalError(err.message || 'Erro ao realizar cadastro.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleVerifyEmailSubmit = async (e) => {
    e.preventDefault()
    if (isLocked || isSubmitting) return

    const codigoLimpo = verifyCode.trim()
    if (!OTP_CODE_REGEX.test(codigoLimpo)) {
      setLocalError('Informe o código numérico de 6 dígitos enviado para seu e-mail.')
      return
    }

    try {
      setIsSubmitting(true)
      clearFeedback()
      await verifyEmailAndStartGame({
        email: verifyEmail,
        codigo: codigoLimpo,
      })
    } catch (err) {
      setLocalError(err.message || 'Código inválido ou expirado.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResendRegisterCode = async () => {
    if (isResending || isSubmitting || resendCooldown > 0 || !verifyEmail) return

    try {
      setIsResending(true)
      clearFeedback()
      const res = await resendVerificationCode(verifyEmail)
      setResendCooldown(res?.cooldownReenvioSegundos || DEFAULT_RESEND_COOLDOWN_SECONDS)
      setSuccessMessage(res?.mensagem || 'Enviamos um novo código para o seu e-mail.')
    } catch (err) {
      if (err?.status === 429 && err?.data?.segundosRestantes) {
        setResendCooldown(Number(err.data.segundosRestantes) || DEFAULT_RESEND_COOLDOWN_SECONDS)
      }
      setLocalError(err.message || 'Não foi possível reenviar o código.')
    } finally {
      setIsResending(false)
    }
  }

  const handleLoginSubmit = async (e) => {
    e.preventDefault()
    if (isLocked || isSubmitting) return

    if (!CORPORATE_EMAIL_REGEX.test(loginForm.email.trim())) {
      setLocalError('Informe um e-mail corporativo válido (@falavinha.com.br).')
      return
    }

    if (!loginForm.senha) {
      setLocalError('Por favor, informe sua senha cadastrada.')
      return
    }

    try {
      setIsSubmitting(true)
      clearFeedback()
      await loginAndStart(loginForm)
    } catch (err) {
      setLocalError(err.message || 'Erro ao realizar login.')
      if (err?.data?.codigoErro === 'EMAIL_NAO_VERIFICADO') {
        setNeedsVerificationEmail(loginForm.email.trim().toLowerCase())
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenVerifyFromLogin = async () => {
    if (!needsVerificationEmail || isResending) return
    const targetEmail = needsVerificationEmail
    setActiveTab('cadastro')
    setVerifyEmail(targetEmail)
    setVerifyCode('')
    setViewMode('verify_email')
    clearFeedback()

    try {
      setIsResending(true)
      const res = await resendVerificationCode(targetEmail)
      setResendCooldown(res?.cooldownReenvioSegundos || DEFAULT_RESEND_COOLDOWN_SECONDS)
      setSuccessMessage('Enviamos um novo código de 6 dígitos para o seu e-mail.')
    } catch (err) {
      if (err?.status === 429 && err?.data?.segundosRestantes) {
        setResendCooldown(Number(err.data.segundosRestantes) || DEFAULT_RESEND_COOLDOWN_SECONDS)
        setSuccessMessage('Digite o código enviado recentemente para o seu e-mail.')
      } else {
        setLocalError(err.message || 'Não foi possível reenviar o código.')
      }
    } finally {
      setIsResending(false)
    }
  }

  const handleOpenForgotPassword = () => {
    clearFeedback()
    setActiveTab('login')
    setForgotForm((prev) => ({
      ...prev,
      email: CORPORATE_EMAIL_REGEX.test(loginForm.email.trim())
        ? loginForm.email.trim().toLowerCase()
        : prev.email,
      codigo: '',
      novaSenha: '',
      confirmarNovaSenha: '',
    }))
    setViewMode('forgot_request')
  }

  const handleForgotRequestSubmit = async (e) => {
    e.preventDefault()
    if (isLocked || isSubmitting) return

    if (!CORPORATE_EMAIL_REGEX.test(forgotForm.email.trim())) {
      setLocalError('Informe um e-mail corporativo válido (@falavinha.com.br).')
      return
    }

    try {
      setIsSubmitting(true)
      clearFeedback()
      const emailLimpo = forgotForm.email.trim().toLowerCase()
      const res = await requestPasswordReset(emailLimpo)
      setForgotForm((prev) => ({ ...prev, email: emailLimpo, codigo: '' }))
      setResendCooldown(res?.cooldownReenvioSegundos || DEFAULT_RESEND_COOLDOWN_SECONDS)
      setSuccessMessage(
        res?.mensagem ||
          'Se este e-mail estiver cadastrado e verificado, enviaremos um código de recuperação.'
      )
      setViewMode('forgot_reset')
    } catch (err) {
      setLocalError(err.message || 'Erro ao solicitar código de recuperação.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResendForgotCode = async () => {
    if (isResending || isSubmitting || resendCooldown > 0 || !forgotForm.email) return

    try {
      setIsResending(true)
      clearFeedback()
      const res = await requestPasswordReset(forgotForm.email)
      setResendCooldown(res?.cooldownReenvioSegundos || DEFAULT_RESEND_COOLDOWN_SECONDS)
      setSuccessMessage('Se o e-mail estiver verificado, um novo código foi enviado.')
    } catch (err) {
      setLocalError(err.message || 'Não foi possível reenviar o código agora.')
    } finally {
      setIsResending(false)
    }
  }

  const handleForgotResetSubmit = async (e) => {
    e.preventDefault()
    if (isLocked || isSubmitting) return

    if (!OTP_CODE_REGEX.test(forgotForm.codigo.trim())) {
      setLocalError('Informe o código numérico de 6 dígitos enviado para seu e-mail.')
      return
    }

    const senhaErro = validarNovaSenha(forgotForm.novaSenha, forgotForm.confirmarNovaSenha)
    if (senhaErro) {
      setLocalError(senhaErro)
      return
    }

    try {
      setIsSubmitting(true)
      clearFeedback()
      const res = await confirmPasswordReset({
        email: forgotForm.email,
        codigo: forgotForm.codigo.trim(),
        novaSenha: forgotForm.novaSenha,
      })
      setLoginForm({
        email: forgotForm.email,
        senha: '',
      })
      setForgotForm((prev) => ({
        ...prev,
        codigo: '',
        novaSenha: '',
        confirmarNovaSenha: '',
      }))
      setActiveTab('login')
      setViewMode('form')
      setSuccessMessage(
        res?.mensagem || 'Senha redefinida com sucesso! Faça login com sua nova senha.'
      )
    } catch (err) {
      setLocalError(err.message || 'Não foi possível redefinir a senha.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const errorMessage = localError || authError

  const headerTitle =
    viewMode === 'verify_email'
      ? 'Confirmar E-mail'
      : viewMode === 'forgot_request' || viewMode === 'forgot_reset'
        ? 'Recuperar Senha'
        : activeTab === 'cadastro'
          ? 'Credenciamento Oficial'
          : 'Acesso ao Desafio'

  const headerSubtitle =
    viewMode === 'verify_email'
      ? 'Digite o código de 6 dígitos enviado para o seu e-mail corporativo.'
      : viewMode === 'forgot_request'
        ? 'Informe seu e-mail @falavinha.com.br para receber um código de recuperação.'
        : viewMode === 'forgot_reset'
          ? 'Digite o código recebido no e-mail e defina sua nova senha.'
          : activeTab === 'cadastro'
            ? 'Cadastre seus dados para registrar sua pontuação no ranking.'
            : 'Entre com seus dados cadastrados para iniciar ou retomar sua partida.'

  return (
    <div className="min-h-screen w-full bg-[#F5F0E6] text-stone-900 flex items-center justify-center p-4 sm:p-8">
      <section className="max-w-lg w-full bg-[#FDFBF7] border-2 border-stone-900 p-6 sm:p-8 shadow-[8px_8px_0px_#1C1917] animate-modal-pop">
        {/* Cabeçalho */}
        <div className="border-l-4 border-[#D99B38] pl-4 mb-6">
          <div className="text-[11px] font-black uppercase tracking-[0.2em] text-[#B87D1E]">
            Questionário Virtual Falavinha
          </div>
          <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-stone-900">
            {headerTitle}
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">{headerSubtitle}</p>
        </div>

        {/* Abas de Navegação (Cadastro / Login) */}
        <div className="flex border-2 border-stone-900 mb-6 bg-stone-200">
          <button
            type="button"
            onClick={() => handleTabSwitch('cadastro')}
            className={`flex-1 py-2.5 px-3 text-xs font-black uppercase tracking-[0.14em] transition-all cursor-pointer ${
              activeTab === 'cadastro'
                ? 'bg-[#D99B38] text-stone-950 shadow-inner'
                : 'bg-[#FDFBF7] text-stone-600 hover:text-stone-900'
            }`}
          >
            Novo Cadastro
          </button>
          <button
            type="button"
            onClick={() => handleTabSwitch('login')}
            className={`flex-1 py-2.5 px-3 text-xs font-black uppercase tracking-[0.14em] border-l-2 border-stone-900 transition-all cursor-pointer ${
              activeTab === 'login'
                ? 'bg-[#D99B38] text-stone-950 shadow-inner'
                : 'bg-[#FDFBF7] text-stone-600 hover:text-stone-900'
            }`}
          >
            Já sou Cadastrado
          </button>
        </div>

        {/* Alerta de Sucesso */}
        {successMessage && (
          <div className="mb-5 p-3.5 bg-emerald-50 border-2 border-emerald-700 flex items-start gap-2.5 text-emerald-900 text-xs sm:text-sm font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Alerta de Erro */}
        {errorMessage && (
          <div className="mb-5 p-3.5 bg-red-50 border-2 border-red-600 text-red-800 text-xs sm:text-sm font-semibold animate-shake">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
            {needsVerificationEmail && (
              <button
                type="button"
                onClick={handleOpenVerifyFromLogin}
                disabled={isResending}
                className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.12em] text-red-900 underline underline-offset-4 hover:text-stone-900 cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Confirmar código de verificação</span>
              </button>
            )}
          </div>
        )}

        {/* FORMULÁRIO DE CADASTRO */}
        {activeTab === 'cadastro' && viewMode === 'form' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="nome"
                className="block text-[11px] font-black uppercase tracking-[0.16em] text-stone-800 mb-1.5"
              >
                Nome Completo *
              </label>
              <div className="relative group">
                <User className="w-4 h-4 text-stone-400 group-focus-within:text-[#B87D1E] absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors" />
                <input
                  id="nome"
                  name="nome"
                  type="text"
                  required
                  placeholder="Digite seu nome completo"
                  value={registerForm.nome}
                  onChange={handleRegisterChange}
                  disabled={isLocked || isSubmitting}
                  className="w-full pl-10 pr-4 py-3 rounded-none bg-white border-2 border-stone-300 text-stone-900 placeholder-stone-400 text-sm font-semibold focus:outline-none focus:border-[#D99B38] transition-colors"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-[11px] font-black uppercase tracking-[0.16em] text-stone-800 mb-1.5"
              >
                E-mail Corporativo *
              </label>
              <div className="relative group">
                <Mail className="w-4 h-4 text-stone-400 group-focus-within:text-[#B87D1E] absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="seu.nome@falavinha.com.br"
                  value={registerForm.email}
                  onChange={handleRegisterChange}
                  disabled={isLocked || isSubmitting}
                  className="w-full pl-10 pr-4 py-3 rounded-none bg-white border-2 border-stone-300 text-stone-900 placeholder-stone-400 text-sm font-semibold focus:outline-none focus:border-[#D99B38] transition-colors"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="senha"
                className="block text-[11px] font-black uppercase tracking-[0.16em] text-stone-800 mb-1.5"
              >
                Senha de Acesso (para retomar depois) *
              </label>
              <div className="relative group">
                <Key className="w-4 h-4 text-stone-400 group-focus-within:text-[#B87D1E] absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors" />
                <input
                  id="senha"
                  name="senha"
                  type="password"
                  required
                  minLength={MIN_PASSWORD_LENGTH}
                  maxLength={MAX_PASSWORD_LENGTH}
                  autoComplete="new-password"
                  placeholder="Mínimo 8 caracteres"
                  value={registerForm.senha}
                  onChange={handleRegisterChange}
                  disabled={isLocked || isSubmitting}
                  className="w-full pl-10 pr-4 py-3 rounded-none bg-white border-2 border-stone-300 text-stone-900 placeholder-stone-400 text-sm font-semibold focus:outline-none focus:border-[#D99B38] transition-colors"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="confirmarSenha"
                className="block text-[11px] font-black uppercase tracking-[0.16em] text-stone-800 mb-1.5"
              >
                Confirmar Senha *
              </label>
              <div className="relative group">
                <Key className="w-4 h-4 text-stone-400 group-focus-within:text-[#B87D1E] absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors" />
                <input
                  id="confirmarSenha"
                  name="confirmarSenha"
                  type="password"
                  required
                  minLength={MIN_PASSWORD_LENGTH}
                  maxLength={MAX_PASSWORD_LENGTH}
                  autoComplete="new-password"
                  placeholder="Digite a mesma senha novamente"
                  value={registerForm.confirmarSenha}
                  onChange={handleRegisterChange}
                  disabled={isLocked || isSubmitting}
                  className="w-full pl-10 pr-4 py-3 rounded-none bg-white border-2 border-stone-300 text-stone-900 placeholder-stone-400 text-sm font-semibold focus:outline-none focus:border-[#D99B38] transition-colors"
                />
              </div>
            </div>

            <div>
              <span className="block text-[11px] font-black uppercase tracking-[0.16em] text-stone-800 mb-1.5">
                Gênero (Avatar no Labirinto) *
              </span>
              <div className="grid grid-cols-2 border-2 border-stone-900 bg-stone-200">
                {[
                  { value: 'masculino', label: 'Masculino' },
                  { value: 'feminino', label: 'Feminino' },
                ].map((opt, idx) => {
                  const isSelected = registerForm.genero === opt.value
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      disabled={isLocked || isSubmitting}
                      aria-pressed={isSelected}
                      onClick={() =>
                        setRegisterForm((prev) => ({ ...prev, genero: opt.value }))
                      }
                      className={`py-2.5 px-3 text-xs font-black uppercase tracking-[0.14em] transition-all cursor-pointer disabled:opacity-50 ${
                        idx > 0 ? 'border-l-2 border-stone-900' : ''
                      } ${
                        isSelected
                          ? 'bg-[#D99B38] text-stone-950 shadow-inner'
                          : 'bg-white text-stone-600 hover:bg-[#F5F0E6] hover:text-stone-900'
                      }`}
                    >
                      {opt.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="unidade"
                  className="block text-[11px] font-black uppercase tracking-[0.16em] text-stone-800 mb-1.5"
                >
                  Unidade *
                </label>
                <div className="relative group">
                  <Building2 className="w-4 h-4 text-stone-400 group-focus-within:text-[#B87D1E] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors" />
                  <select
                    id="unidade"
                    name="unidade"
                    value={registerForm.unidade}
                    onChange={handleRegisterChange}
                    disabled={isLocked || isSubmitting}
                    className="w-full pl-10 pr-3 py-3 rounded-none bg-white border-2 border-stone-300 text-stone-900 text-sm font-semibold focus:outline-none focus:border-[#D99B38] transition-colors cursor-pointer"
                  >
                    {UNITS_LIST.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="setor"
                  className="block text-[11px] font-black uppercase tracking-[0.16em] text-stone-800 mb-1.5"
                >
                  Setor *
                </label>
                <div className="relative group">
                  <Users className="w-4 h-4 text-stone-400 group-focus-within:text-[#B87D1E] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors" />
                  <select
                    id="setor"
                    name="setor"
                    value={registerForm.setor}
                    onChange={handleRegisterChange}
                    disabled={isLocked || isSubmitting}
                    className="w-full pl-10 pr-3 py-3 rounded-none bg-white border-2 border-stone-300 text-stone-900 text-sm font-semibold focus:outline-none focus:border-[#D99B38] transition-colors cursor-pointer"
                  >
                    {DEPARTMENTS_LIST.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLocked || isSubmitting}
                className="w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-none bg-[#D99B38] hover:bg-[#c58927] text-stone-950 border-2 border-stone-900 font-black text-xs sm:text-sm uppercase tracking-[0.2em] shadow-[4px_4px_0px_#1C1917] hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#1C1917] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none transition-all duration-200 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Enviando código...</span>
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4" />
                    <span>Enviar Código e Continuar</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* ETAPA DE CONFIRMAÇÃO DE E-MAIL DO CADASTRO */}
        {activeTab === 'cadastro' && viewMode === 'verify_email' && (
          <form onSubmit={handleVerifyEmailSubmit} className="space-y-4">
            <div className="p-3.5 bg-[#F5F0E6] border-2 border-stone-900 text-xs text-stone-700 font-semibold">
              Código enviado para:{' '}
              <span className="font-black text-stone-900 break-all">{verifyEmail}</span>
              <div className="text-[11px] text-stone-500 mt-1">
                Válido por 15 minutos. Confira também a caixa de spam/lixo eletrônico.
              </div>
            </div>

            <div>
              <label
                htmlFor="codigo-verificacao"
                className="block text-[11px] font-black uppercase tracking-[0.16em] text-stone-800 mb-1.5"
              >
                Código de 6 Dígitos *
              </label>
              <div className="relative group">
                <ShieldCheck className="w-4 h-4 text-stone-400 group-focus-within:text-[#B87D1E] absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors" />
                <input
                  id="codigo-verificacao"
                  name="codigo"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                  maxLength={6}
                  placeholder="000000"
                  value={verifyCode}
                  onChange={(e) => {
                    setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                    if (localError || authError) {
                      setLocalError('')
                      clearAuthError?.()
                    }
                  }}
                  disabled={isLocked || isSubmitting}
                  className="w-full pl-10 pr-4 py-3 rounded-none bg-white border-2 border-stone-300 text-stone-900 placeholder-stone-400 text-lg font-black tracking-[0.4em] text-center font-mono focus:outline-none focus:border-[#D99B38] transition-colors"
                />
              </div>
            </div>

            <div className="pt-1">
              <button
                type="submit"
                disabled={isLocked || isSubmitting}
                className="w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-none bg-[#D99B38] hover:bg-[#c58927] text-stone-950 border-2 border-stone-900 font-black text-xs sm:text-sm uppercase tracking-[0.2em] shadow-[4px_4px_0px_#1C1917] hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#1C1917] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none transition-all duration-200 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Validando...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>Verificar e Iniciar</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-200">
              <button
                type="button"
                onClick={handleResendRegisterCode}
                disabled={isResending || isSubmitting || resendCooldown > 0}
                className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.12em] text-[#B87D1E] hover:text-stone-900 disabled:text-stone-400 disabled:cursor-not-allowed cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
                <span>
                  {resendCooldown > 0
                    ? `Reenviar em ${resendCooldown}s`
                    : 'Reenviar código'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setViewMode('form')
                  setVerifyCode('')
                  clearFeedback()
                }}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-600 hover:text-stone-900 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Voltar / Editar dados</span>
              </button>
            </div>
          </form>
        )}

        {/* FORMULÁRIO DE LOGIN */}
        {activeTab === 'login' && viewMode === 'form' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="login-email"
                className="block text-[11px] font-black uppercase tracking-[0.16em] text-stone-800 mb-1.5"
              >
                E-mail Corporativo *
              </label>
              <div className="relative group">
                <Mail className="w-4 h-4 text-stone-400 group-focus-within:text-[#B87D1E] absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors" />
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  required
                  placeholder="seu.nome@falavinha.com.br"
                  value={loginForm.email}
                  onChange={handleLoginChange}
                  disabled={isLocked || isSubmitting}
                  className="w-full pl-10 pr-4 py-3 rounded-none bg-white border-2 border-stone-300 text-stone-900 placeholder-stone-400 text-sm font-semibold focus:outline-none focus:border-[#D99B38] transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="login-senha"
                  className="block text-[11px] font-black uppercase tracking-[0.16em] text-stone-800"
                >
                  Senha *
                </label>
                <button
                  type="button"
                  onClick={handleOpenForgotPassword}
                  disabled={isLocked || isSubmitting}
                  className="text-[11px] font-black uppercase tracking-[0.1em] text-[#B87D1E] hover:text-stone-900 underline underline-offset-4 cursor-pointer"
                >
                  Esqueceu sua senha?
                </button>
              </div>
              <div className="relative group">
                <Key className="w-4 h-4 text-stone-400 group-focus-within:text-[#B87D1E] absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors" />
                <input
                  id="login-senha"
                  name="senha"
                  type="password"
                  required
                  maxLength={MAX_PASSWORD_LENGTH}
                  placeholder="Digite sua senha cadastrada"
                  value={loginForm.senha}
                  onChange={handleLoginChange}
                  disabled={isLocked || isSubmitting}
                  className="w-full pl-10 pr-4 py-3 rounded-none bg-white border-2 border-stone-300 text-stone-900 placeholder-stone-400 text-sm font-semibold focus:outline-none focus:border-[#D99B38] transition-colors"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLocked || isSubmitting}
                className="w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-none bg-[#D99B38] hover:bg-[#c58927] text-stone-950 border-2 border-stone-900 font-black text-xs sm:text-sm uppercase tracking-[0.2em] shadow-[4px_4px_0px_#1C1917] hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#1C1917] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none transition-all duration-200 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Entrando...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Entrar no Desafio</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* RECUPERAÇÃO DE SENHA — PASSO 1 (SOLICITAR CÓDIGO) */}
        {activeTab === 'login' && viewMode === 'forgot_request' && (
          <form onSubmit={handleForgotRequestSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="forgot-email"
                className="block text-[11px] font-black uppercase tracking-[0.16em] text-stone-800 mb-1.5"
              >
                E-mail Corporativo Cadastrado *
              </label>
              <div className="relative group">
                <Mail className="w-4 h-4 text-stone-400 group-focus-within:text-[#B87D1E] absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors" />
                <input
                  id="forgot-email"
                  name="email"
                  type="email"
                  required
                  placeholder="seu.nome@falavinha.com.br"
                  value={forgotForm.email}
                  onChange={handleForgotChange}
                  disabled={isLocked || isSubmitting}
                  className="w-full pl-10 pr-4 py-3 rounded-none bg-white border-2 border-stone-300 text-stone-900 placeholder-stone-400 text-sm font-semibold focus:outline-none focus:border-[#D99B38] transition-colors"
                />
              </div>
            </div>

            <div className="pt-1">
              <button
                type="submit"
                disabled={isLocked || isSubmitting}
                className="w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-none bg-[#D99B38] hover:bg-[#c58927] text-stone-950 border-2 border-stone-900 font-black text-xs sm:text-sm uppercase tracking-[0.2em] shadow-[4px_4px_0px_#1C1917] hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#1C1917] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none transition-all duration-200 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Enviando...</span>
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4" />
                    <span>Enviar Código de Recuperação</span>
                  </>
                )}
              </button>
            </div>

            <div className="pt-2 border-t border-stone-200">
              <button
                type="button"
                onClick={() => {
                  setViewMode('form')
                  clearFeedback()
                }}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-600 hover:text-stone-900 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Voltar para o login</span>
              </button>
            </div>
          </form>
        )}

        {/* RECUPERAÇÃO DE SENHA — PASSO 2 (CÓDIGO + NOVA SENHA) */}
        {activeTab === 'login' && viewMode === 'forgot_reset' && (
          <form onSubmit={handleForgotResetSubmit} className="space-y-4">
            <div className="p-3.5 bg-[#F5F0E6] border-2 border-stone-900 text-xs text-stone-700 font-semibold">
              Recuperando acesso para:{' '}
              <span className="font-black text-stone-900 break-all">{forgotForm.email}</span>
            </div>

            <div>
              <label
                htmlFor="forgot-codigo"
                className="block text-[11px] font-black uppercase tracking-[0.16em] text-stone-800 mb-1.5"
              >
                Código de 6 Dígitos *
              </label>
              <div className="relative group">
                <ShieldCheck className="w-4 h-4 text-stone-400 group-focus-within:text-[#B87D1E] absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors" />
                <input
                  id="forgot-codigo"
                  name="codigo"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                  maxLength={6}
                  placeholder="000000"
                  value={forgotForm.codigo}
                  onChange={handleForgotChange}
                  disabled={isLocked || isSubmitting}
                  className="w-full pl-10 pr-4 py-3 rounded-none bg-white border-2 border-stone-300 text-stone-900 placeholder-stone-400 text-lg font-black tracking-[0.4em] text-center font-mono focus:outline-none focus:border-[#D99B38] transition-colors"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="forgot-nova-senha"
                className="block text-[11px] font-black uppercase tracking-[0.16em] text-stone-800 mb-1.5"
              >
                Nova Senha *
              </label>
              <div className="relative group">
                <Key className="w-4 h-4 text-stone-400 group-focus-within:text-[#B87D1E] absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors" />
                <input
                  id="forgot-nova-senha"
                  name="novaSenha"
                  type="password"
                  required
                  minLength={MIN_PASSWORD_LENGTH}
                  maxLength={MAX_PASSWORD_LENGTH}
                  autoComplete="new-password"
                  placeholder="Mínimo 8 caracteres"
                  value={forgotForm.novaSenha}
                  onChange={handleForgotChange}
                  disabled={isLocked || isSubmitting}
                  className="w-full pl-10 pr-4 py-3 rounded-none bg-white border-2 border-stone-300 text-stone-900 placeholder-stone-400 text-sm font-semibold focus:outline-none focus:border-[#D99B38] transition-colors"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="forgot-confirmar-senha"
                className="block text-[11px] font-black uppercase tracking-[0.16em] text-stone-800 mb-1.5"
              >
                Confirmar Nova Senha *
              </label>
              <div className="relative group">
                <Key className="w-4 h-4 text-stone-400 group-focus-within:text-[#B87D1E] absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors" />
                <input
                  id="forgot-confirmar-senha"
                  name="confirmarNovaSenha"
                  type="password"
                  required
                  minLength={MIN_PASSWORD_LENGTH}
                  maxLength={MAX_PASSWORD_LENGTH}
                  autoComplete="new-password"
                  placeholder="Digite a nova senha novamente"
                  value={forgotForm.confirmarNovaSenha}
                  onChange={handleForgotChange}
                  disabled={isLocked || isSubmitting}
                  className="w-full pl-10 pr-4 py-3 rounded-none bg-white border-2 border-stone-300 text-stone-900 placeholder-stone-400 text-sm font-semibold focus:outline-none focus:border-[#D99B38] transition-colors"
                />
              </div>
            </div>

            <div className="pt-1">
              <button
                type="submit"
                disabled={isLocked || isSubmitting}
                className="w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-none bg-[#D99B38] hover:bg-[#c58927] text-stone-950 border-2 border-stone-900 font-black text-xs sm:text-sm uppercase tracking-[0.2em] shadow-[4px_4px_0px_#1C1917] hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#1C1917] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none transition-all duration-200 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Redefinindo...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Redefinir Senha</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-200">
              <button
                type="button"
                onClick={handleResendForgotCode}
                disabled={isResending || isSubmitting || resendCooldown > 0}
                className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.12em] text-[#B87D1E] hover:text-stone-900 disabled:text-stone-400 disabled:cursor-not-allowed cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
                <span>
                  {resendCooldown > 0
                    ? `Reenviar em ${resendCooldown}s`
                    : 'Reenviar código'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setViewMode('form')
                  clearFeedback()
                }}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-600 hover:text-stone-900 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Voltar para o login</span>
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  )
}

export default RegistrationScreen
