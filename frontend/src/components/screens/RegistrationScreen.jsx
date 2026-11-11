import { useState } from 'react'
import { Building2, Mail, Play, User, Users } from 'lucide-react'
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
    <div className="min-h-screen w-full bg-[#F5F0E6] text-stone-900 flex items-center justify-center p-4 sm:p-8">
      <section className="max-w-lg w-full bg-[#FDFBF7] border-2 border-stone-900 p-6 sm:p-8 shadow-[8px_8px_0px_#1C1917] animate-modal-pop">
        <div className="border-l-4 border-[#D99B38] pl-4 mb-6">
          <div className="text-[11px] font-black uppercase tracking-[0.2em] text-[#B87D1E]">
            Registro de Presença
          </div>
          <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-stone-900">
            Credenciamento Oficial
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            Preencha seus dados corporativos para prosseguir.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
                placeholder="Digite seu nome"
                value={form.nome}
                onChange={handleChange}
                disabled={isLocked}
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
                value={form.email}
                onChange={handleChange}
                disabled={isLocked}
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
                  value={form.unidade}
                  onChange={handleChange}
                  disabled={isLocked}
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
                  value={form.setor}
                  onChange={handleChange}
                  disabled={isLocked}
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
              disabled={isLocked}
              className="w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-none bg-[#D99B38] hover:bg-[#c58927] text-stone-950 border-2 border-stone-900 font-black text-xs sm:text-sm uppercase tracking-[0.2em] shadow-[4px_4px_0px_#1C1917] hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#1C1917] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none transition-all duration-200 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Prosseguir</span>
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

export default RegistrationScreen
