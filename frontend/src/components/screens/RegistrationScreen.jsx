import { useState } from 'react'
import { AlertCircle, Building2, Key, Loader2, LogIn, Mail, Play, User, Users } from 'lucide-react'
import { useGame } from '../../context/gameContextInstance'
import { DEPARTMENTS_LIST, UNITS_LIST } from '../../data/conselhoNextData'

function RegistrationScreen() {
  const {
    player,
    startGameFromRegistration,
    loginAndStart,
    isLocked,
    authError,
    clearAuthError,
  } = useGame()

  const [activeTab, setActiveTab] = useState('cadastro') // 'cadastro' | 'login'
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [localError, setLocalError] = useState('')

  // Formulário de Cadastro
  const [registerForm, setRegisterForm] = useState({
    nome: player?.nome || '',
    email: player?.email || '',
    senha: '',
    unidade: player?.unidade || UNITS_LIST[0],
    setor: player?.setor || DEPARTMENTS_LIST[0],
  })

  // Formulário de Login
  const [loginForm, setLoginForm] = useState({
    email: player?.email || '',
    senha: '',
  })

  const handleRegisterChange = (e) => {
    const { name, value } = e.target
    setRegisterForm((prev) => ({ ...prev, [name]: value }))
    if (localError || authError) {
      setLocalError('')
      clearAuthError?.()
    }
  }

  const handleLoginChange = (e) => {
    const { name, value } = e.target
    setLoginForm((prev) => ({ ...prev, [name]: value }))
    if (localError || authError) {
      setLocalError('')
      clearAuthError?.()
    }
  }

  const handleTabSwitch = (tab) => {
    setActiveTab(tab)
    setLocalError('')
    clearAuthError?.()
  }

  const handleRegisterSubmit = async (e) => {
    e.preventDefault()
    if (isLocked || isSubmitting) return

    if (!registerForm.nome.trim() || !registerForm.email.trim()) {
      setLocalError('Por favor, preencha o nome e o e-mail corporativo.')
      return
    }

    try {
      setIsSubmitting(true)
      setLocalError('')
      await startGameFromRegistration(registerForm)
    } catch (err) {
      setLocalError(err.message || 'Erro ao realizar cadastro.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLoginSubmit = async (e) => {
    e.preventDefault()
    if (isLocked || isSubmitting) return

    if (!loginForm.email.trim()) {
      setLocalError('Por favor, informe seu e-mail corporativo.')
      return
    }

    try {
      setIsSubmitting(true)
      setLocalError('')
      await loginAndStart(loginForm)
    } catch (err) {
      setLocalError(err.message || 'Erro ao realizar login.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const errorMessage = localError || authError

  return (
    <div className="min-h-screen w-full bg-[#F5F0E6] text-stone-900 flex items-center justify-center p-4 sm:p-8">
      <section className="max-w-lg w-full bg-[#FDFBF7] border-2 border-stone-900 p-6 sm:p-8 shadow-[8px_8px_0px_#1C1917] animate-modal-pop">
        {/* Cabeçalho */}
        <div className="border-l-4 border-[#D99B38] pl-4 mb-6">
          <div className="text-[11px] font-black uppercase tracking-[0.2em] text-[#B87D1E]">
            Escape Room Virtual Falavinha
          </div>
          <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-stone-900">
            {activeTab === 'cadastro' ? 'Credenciamento Oficial' : 'Acesso ao Desafio'}
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            {activeTab === 'cadastro'
              ? 'Cadastre seus dados para registrar sua pontuação no ranking.'
              : 'Entre com seus dados cadastrados para iniciar ou retomar sua partida.'}
          </p>
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

        {/* Alerta de Erro */}
        {errorMessage && (
          <div className="mb-5 p-3.5 bg-red-50 border-2 border-red-600 flex items-start gap-2.5 text-red-800 text-xs sm:text-sm font-semibold animate-shake">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* FORMULÁRIO DE CADASTRO */}
        {activeTab === 'cadastro' && (
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
                Senha de Acesso (para retomar depois)
              </label>
              <div className="relative group">
                <Key className="w-4 h-4 text-stone-400 group-focus-within:text-[#B87D1E] absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors" />
                <input
                  id="senha"
                  name="senha"
                  type="password"
                  placeholder="Crie uma senha simples (ex: 1234)"
                  value={registerForm.senha}
                  onChange={handleRegisterChange}
                  disabled={isLocked || isSubmitting}
                  className="w-full pl-10 pr-4 py-3 rounded-none bg-white border-2 border-stone-300 text-stone-900 placeholder-stone-400 text-sm font-semibold focus:outline-none focus:border-[#D99B38] transition-colors"
                />
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
                    <span>Cadastrando...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>Cadastrar e Iniciar</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* FORMULÁRIO DE LOGIN */}
        {activeTab === 'login' && (
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
              <label
                htmlFor="login-senha"
                className="block text-[11px] font-black uppercase tracking-[0.16em] text-stone-800 mb-1.5"
              >
                Senha
              </label>
              <div className="relative group">
                <Key className="w-4 h-4 text-stone-400 group-focus-within:text-[#B87D1E] absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors" />
                <input
                  id="login-senha"
                  name="senha"
                  type="password"
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
      </section>
    </div>
  )
}

export default RegistrationScreen
