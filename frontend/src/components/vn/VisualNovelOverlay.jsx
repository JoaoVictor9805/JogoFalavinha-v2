import { useState } from 'react'
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  KeyRound,
  MessageSquareQuote,
  Send,
  Sparkles,
  UserCheck,
  UserRound,
  XCircle,
} from 'lucide-react'
import { useGame } from '../../context/gameContextInstance'
import { getErrorDialogue } from '../../data/conselhoNextData'

function VisualNovelOverlay() {
  const {
    activeMember,
    memberProgress,
    vnFeedback,
    isLocked,
    closeMemberDialog,
    submitMultipleChoice,
    submitTextAnswer,
  } = useGame()

  const [textValue, setTextValue] = useState('')

  if (!activeMember) return null

  const progress = memberProgress[activeMember.id] || {
    completed: false,
    errors: 0,
    disabledOptions: [],
    wrongTextAttempts: [],
  }

  const dynamicErrorSpeech = getErrorDialogue(progress.errors)
  const isApprovedState = vnFeedback === 'approved'
  const isWrongShake = vnFeedback === 'wrong'

  const handleTextSubmit = (e) => {
    e.preventDefault()
    if (isLocked || isApprovedState || !textValue.trim()) return
    const submitted = textValue
    setTextValue('')
    submitTextAnswer(activeMember.id, submitted)
  }

  return (
    <div
      className="fixed inset-0 z-40 bg-slate-950/88 backdrop-blur-md flex items-end lg:items-center justify-center p-3 sm:p-6 lg:p-10 transition-opacity duration-300"
      role="dialog"
      aria-modal="true"
      aria-labelledby="vn-member-name"
    >
      <div
        className={`max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-stretch ${
          isWrongShake ? 'animate-vn-shake' : ''
        }`}
      >
        {/* Lado Esquerdo / Centro: Arte Grande do Personagem (Visual Novel Portrait Placeholder) */}
        <div
          className={`lg:col-span-5 relative rounded-3xl border-2 overflow-hidden flex flex-col justify-between p-6 min-h-[250px] sm:min-h-[340px] lg:min-h-[520px] bg-gradient-to-b ${
            activeMember.avatarGradient
          } shadow-2xl transition-all duration-300 ${
            isApprovedState
              ? 'border-emerald-400 shadow-emerald-500/30 ring-4 ring-emerald-400/30'
              : isWrongShake
                ? 'border-red-500 shadow-red-500/30'
                : activeMember.borderAccent
          }`}
        >
          {/* Textura sutil de fundo */}
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

          {/* Topo do Retrato: Cargo e Status */}
          <div className="relative z-10 flex items-center justify-between gap-2 flex-wrap">
            <span className="px-3 py-1 rounded-full bg-slate-950/75 border border-white/20 text-xs font-extrabold uppercase tracking-wider text-white">
              {activeMember.role}
            </span>

            {isApprovedState ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500 text-slate-950 text-xs font-black uppercase tracking-wider shadow-lg">
                <CheckCircle2 className="w-4 h-4" />
                Aprovado!
              </span>
            ) : progress.errors > 0 ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-950/90 border border-red-400/50 text-red-200 text-xs font-bold">
                <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                {progress.errors} erro{progress.errors > 1 ? 's' : ''} (+{progress.errors * 5}s)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/70 border border-white/15 text-slate-200 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                Em Avaliação
              </span>
            )}
          </div>

          {/* Silhueta / Arte Grande do Conselheiro (Placeholder Visual Novel) */}
          <div className="relative z-10 my-auto py-4 flex flex-col items-center justify-center text-center">
            <div
              className={`w-28 h-28 sm:w-36 sm:h-36 lg:w-44 lg:h-44 rounded-full border-4 flex items-center justify-center shadow-2xl transition-transform duration-300 ${
                isApprovedState
                  ? 'bg-emerald-950/80 border-emerald-300 scale-105'
                  : isWrongShake
                    ? 'bg-red-950/80 border-red-300 scale-95'
                    : 'bg-slate-950/65 border-white/30'
              }`}
            >
              {isApprovedState ? (
                <UserCheck className="w-16 h-16 sm:w-20 sm:h-20 text-emerald-300" />
              ) : (
                <UserRound className="w-16 h-16 sm:w-20 sm:h-20 text-white/90" />
              )}
            </div>

            <div className="mt-4 px-3 py-1 rounded-lg bg-slate-950/60 border border-white/10 text-[11px] font-mono uppercase tracking-widest text-white/80">
              [Placeholder Arte Visual Novel · {activeMember.name}]
            </div>
          </div>

          {/* Rodapé do Retrato: Identificação do Membro */}
          <div className="relative z-10 bg-slate-950/80 backdrop-blur-md border border-white/15 rounded-2xl p-4">
            <div className="text-[11px] font-bold uppercase tracking-widest text-teal-300">
              Bancada do Conselho Next
            </div>
            <h2 id="vn-member-name" className="text-xl sm:text-2xl font-black text-white">
              {activeMember.name}
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Especialidade: <strong className="text-white">{activeMember.shortLabel}</strong>
            </p>
          </div>
        </div>

        {/* Lado Direito / Inferior: Caixa de Diálogo Visual Novel + Alternativas / Input */}
        <div className="lg:col-span-7 rounded-3xl border-2 border-slate-800 bg-slate-900/95 backdrop-blur-xl p-5 sm:p-7 flex flex-col justify-between gap-5 shadow-2xl">
          {/* Barra Superior da Caixa de Diálogo */}
          <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2.5">
              <MessageSquareQuote className="w-5 h-5 text-teal-400" />
              <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-teal-300">
                Diálogo Direto · {activeMember.name}
              </span>
            </div>

            <button
              type="button"
              disabled={isLocked || isApprovedState}
              onClick={closeMemberDialog}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar ao Tribunal</span>
            </button>
          </div>

          {/* Balão de Fala do Personagem (Saudação, Fala Dinâmica de Erro 1..5 ou Elogio de Aprovação) */}
          {isApprovedState ? (
            <div className="rounded-2xl border-2 border-emerald-400 bg-emerald-950/70 p-5 space-y-3 shadow-lg shadow-emerald-950/50 transition-all duration-300">
              <div className="flex items-center gap-2 text-emerald-300 font-extrabold text-xs uppercase tracking-wider">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>Veredito Favorável · Conselheiro Aprovou sua Resposta!</span>
              </div>
              <p className="text-base sm:text-lg font-bold text-white leading-relaxed">
                “{activeMember.approvalMessage}”
              </p>
              <div className="pt-1 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-mono text-emerald-300/90">
                  <span>Registrando aprovação no Tribunal...</span>
                  <span>2,5s</span>
                </div>
                <div className="w-full h-2 rounded-full bg-emerald-950 overflow-hidden border border-emerald-700/50">
                  <div className="h-full bg-emerald-400 animate-reading-bar" />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Fala inicial do personagem */}
              <div className="rounded-2xl bg-slate-950/80 border border-slate-800 p-4">
                <p className="text-xs sm:text-sm text-slate-300 italic leading-relaxed">
                  “{activeMember.greeting}”
                </p>
              </div>

              {/* Fala Dinâmica de Erro (1ª a 5ª frase, repetindo a 5ª se > 5) */}
              {dynamicErrorSpeech && (
                <div className="rounded-2xl bg-amber-950/60 border-l-4 border-amber-400 border border-amber-500/30 p-4 flex items-start gap-3 transition-all duration-300">
                  <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="text-[11px] font-extrabold uppercase tracking-wider text-amber-300">
                      Reação do Conselheiro · Erro #{progress.errors} (Frase{' '}
                      {Math.min(progress.errors, 5)} de 5)
                    </div>
                    <p className="text-sm sm:text-base font-bold text-amber-100">
                      “{dynamicErrorSpeech}”
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Enunciado da Pergunta / Desafio */}
          <div className="rounded-2xl bg-slate-950 border border-teal-500/30 p-5 space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-widest text-teal-400">
              {activeMember.type === 'multiple_choice'
                ? 'Questão do Conselho · Múltipla Escolha'
                : `Desafio de Texto · ${activeMember.inputType || 'Enigma / Senha'}`}
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white leading-snug">
              {activeMember.question}
            </h3>
          </div>

          {/* Área de Resposta: Alternativas (a, b, c) ou Input de Texto */}
          <div className="space-y-3">
            {activeMember.type === 'multiple_choice' ? (
              <div className="space-y-2.5">
                {activeMember.options?.map((option) => {
                  const isOptionDisabled = progress.disabledOptions.includes(option.id)
                  const isHighlightedSuccess = isApprovedState && option.isCorrect

                  return (
                    <button
                      key={option.id}
                      type="button"
                      disabled={isLocked || isOptionDisabled || isApprovedState}
                      onClick={() => submitMultipleChoice(activeMember.id, option.id)}
                      className={`w-full text-left p-4 rounded-2xl border-2 flex items-center justify-between gap-3 transition-all duration-200 ${
                        isHighlightedSuccess
                          ? 'bg-emerald-500/25 border-emerald-400 text-white shadow-lg shadow-emerald-500/15'
                          : isOptionDisabled
                            ? 'bg-red-950/25 border-red-900/40 text-slate-500 opacity-50 cursor-not-allowed'
                            : 'bg-slate-950/90 hover:bg-teal-950/50 border-slate-800 hover:border-teal-400 text-slate-100 cursor-pointer active:scale-[0.99] disabled:opacity-60 disabled:pointer-events-none'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <span
                          className={`w-8 h-8 rounded-xl font-mono text-xs font-black flex items-center justify-center shrink-0 ${
                            isHighlightedSuccess
                              ? 'bg-emerald-400 text-slate-950'
                              : isOptionDisabled
                                ? 'bg-red-950 text-red-400 border border-red-800/50'
                                : 'bg-slate-800 text-teal-300'
                          }`}
                        >
                          {option.label}
                        </span>
                        <span
                          className={`text-sm sm:text-base font-semibold leading-snug ${
                            isOptionDisabled ? 'line-through text-slate-500' : ''
                          }`}
                        >
                          {option.text}
                        </span>
                      </div>

                      {isOptionDisabled && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-red-400 shrink-0">
                          <XCircle className="w-4 h-4" />
                          <span>+5s</span>
                        </span>
                      )}

                      {isHighlightedSuccess && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-300 shrink-0">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Correta</span>
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            ) : (
              <div className="space-y-3">
                <form onSubmit={handleTextSubmit} className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <KeyRound className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={textValue}
                      onChange={(e) => setTextValue(e.target.value)}
                      disabled={isLocked || isApprovedState}
                      placeholder={activeMember.placeholder || 'Digite sua resposta...'}
                      autoFocus
                      className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-slate-950 border-2 border-slate-800 text-white placeholder-slate-500 text-sm sm:text-base font-semibold focus:outline-none focus:border-teal-400 disabled:opacity-50 transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLocked || isApprovedState || !textValue.trim()}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-teal-400 to-emerald-500 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-teal-500/20 hover:brightness-110 active:scale-95 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>Confirmar</span>
                  </button>
                </form>

                {progress.wrongTextAttempts.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap pt-1">
                    <span className="text-xs text-slate-400">Palpites incorretos (+5s):</span>
                    {progress.wrongTextAttempts.map((attempt) => (
                      <span
                        key={attempt}
                        className="px-2.5 py-0.5 rounded-lg bg-red-950/60 border border-red-800/60 text-xs font-mono text-red-300 line-through"
                      >
                        {attempt}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default VisualNovelOverlay

