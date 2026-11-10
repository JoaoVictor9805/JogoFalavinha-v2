import { useState } from 'react'
import { Building2, Clock, Mail, Play, ShieldCheck, Sparkles, User, Users } from 'lucide-react'
import { useGame } from '../../context/gameContextInstance'
import { DEPARTMENTS_LIST, UNITS_LIST } from '../../data/conselhoNextData'

function RegistrationScreen() {
  const { player, startGameFromRegistration, isLocked } = useGame()

  const [form, setForm] = useState({
    nome: player?.nome || '',
    email: player?.email || '',
    unidade: player?.unidade || UNITS_LIST[0],
    setor: player?.setor || DEPARTMENTS_LIST[0],
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (isLocked || !form.nome.trim() || !form.email.trim()) return
    startGameFromRegistration(form)
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-8 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-950/50 via-slate-950 to-black">
      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 rounded-3xl overflow-hidden border border-slate-800 bg-slate-900/80 backdrop-blur-xl shadow-2xl">
        {/* Coluna Esquerda: Apresentação do Jogo "Conselho Next" */}
        <div className="lg:col-span-6 p-8 sm:p-10 flex flex-col justify-between bg-gradient-to-br from-slate-900 via-teal-950/40 to-slate-950 border-b lg:border-b-0 lg:border-r border-slate-800">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-500/15 border border-teal-400/30 text-teal-300 text-xs font-bold uppercase tracking-widest">
              <ShieldCheck className="w-4 h-4" />
              <span>Falavinha Next · Web Game</span>
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                Conselho <span className="text-teal-400">Next</span>
              </h1>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                Você foi convocado para a Sala do Tribunal. Encare as{' '}
                <strong className="text-white">7 lideranças da empresa</strong> em uma experiência
                Point &amp; Click e Visual Novel e conquiste a aprovação unânime da bancada.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                <Clock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm text-slate-300">
                  <strong className="text-white block">Cronômetro Global Imediato</strong>O tempo
                  começa a correr nos bastidores assim que você clicar em <em>Iniciar</em>.
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                <Sparkles className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm text-slate-300">
                  <strong className="text-white block">7 Conselheiros · Ordem Livre</strong>4
                  desafios de múltipla escolha e 3 enigmas/senhas. Cada erro adiciona{' '}
                  <span className="text-red-400 font-bold">+5 segundos</span> de penalidade.
                </div>
              </div>
            </div>
          </div>

          <div className="pt-8 mt-8 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Mecânica: Point &amp; Click + Visual Novel</span>
            <span className="font-mono text-teal-400 font-semibold">v2.0</span>
          </div>
        </div>

        {/* Coluna Direita: Formulário de Cadastro */}
        <div className="lg:col-span-6 p-8 sm:p-10 flex flex-col justify-center">
          <div className="mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-white">Credenciamento</h2>
            <p className="text-sm text-slate-400 mt-1">
              Identifique-se antes de abrir as portas do Conselho.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="nome"
                className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5"
              >
                Nome Completo *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="nome"
                  name="nome"
                  type="text"
                  required
                  placeholder="Digite seu nome"
                  value={form.nome}
                  onChange={handleChange}
                  disabled={isLocked}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 transition-all"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5"
              >
                E-mail Corporativo *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="seu.nome@falavinha.com.br"
                  value={form.email}
                  onChange={handleChange}
                  disabled={isLocked}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="unidade"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5"
                >
                  Unidade *
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    id="unidade"
                    name="unidade"
                    value={form.unidade}
                    onChange={handleChange}
                    disabled={isLocked}
                    className="w-full pl-10 pr-3 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 transition-all"
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
                  className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5"
                >
                  Setor *
                </label>
                <div className="relative">
                  <Users className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    id="setor"
                    name="setor"
                    value={form.setor}
                    onChange={handleChange}
                    disabled={isLocked}
                    className="w-full pl-10 pr-3 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 transition-all"
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

            <div className="pt-3">
              <button
                type="submit"
                disabled={isLocked}
                className="w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-xl bg-gradient-to-r from-teal-400 to-emerald-500 text-slate-950 font-extrabold text-base shadow-lg shadow-teal-500/25 hover:brightness-110 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none transition-all duration-200 cursor-pointer"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>Iniciar Exame do Conselho</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default RegistrationScreen

