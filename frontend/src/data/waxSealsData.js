import seloSapoImg from '../assets/selos/selo_sapo.png'
import seloRamonImg from '../assets/selos/selo_ramon.png'
import seloVanessaImg from '../assets/selos/selo_vanessa.png'
import seloJhonnyImg from '../assets/selos/selo_jhonny.png'
import seloJuarezImg from '../assets/selos/selo_juarez.png'
import seloRicardoImg from '../assets/selos/selo_ricardo.png'
import seloEdImg from '../assets/selos/selo_ed.png'

/**
 * Metadados e assets dos 7 selos de cera (sistema de insígnias do Conselho Next).
 * Cada selo acompanha a paleta da cadeira e uma leve inclinação natural de carimbo.
 */
export const WAX_SEALS_BY_MEMBER = {
  1: {
    memberId: 1,
    code: 'C01',
    fallbackName: 'André',
    image: seloSapoImg,
    ringColor: 'rgba(56, 189, 248, 0.72)',
    accentBorder: 'border-t-sky-500',
    stampTiltDeg: -7,
    cardTiltDeg: -8,
  },
  2: {
    memberId: 2,
    code: 'C02',
    fallbackName: 'Ramon',
    image: seloRamonImg,
    ringColor: 'rgba(45, 212, 191, 0.72)',
    accentBorder: 'border-t-teal-500',
    stampTiltDeg: 6,
    cardTiltDeg: 7,
  },
  3: {
    memberId: 3,
    code: 'C03',
    fallbackName: 'Vanessa',
    image: seloVanessaImg,
    ringColor: 'rgba(251, 191, 36, 0.78)',
    accentBorder: 'border-t-amber-500',
    stampTiltDeg: -5,
    cardTiltDeg: -6,
  },
  4: {
    memberId: 4,
    code: 'C04',
    fallbackName: 'Jhonny',
    image: seloJhonnyImg,
    ringColor: 'rgba(192, 132, 252, 0.72)',
    accentBorder: 'border-t-purple-500',
    stampTiltDeg: 8,
    cardTiltDeg: 6,
  },
  5: {
    memberId: 5,
    code: 'C05',
    fallbackName: 'Juarez',
    image: seloJuarezImg,
    ringColor: 'rgba(251, 113, 133, 0.72)',
    accentBorder: 'border-t-rose-500',
    stampTiltDeg: -6,
    cardTiltDeg: -7,
  },
  6: {
    memberId: 6,
    code: 'C06',
    fallbackName: 'Ricardo',
    image: seloRicardoImg,
    ringColor: 'rgba(34, 211, 238, 0.72)',
    accentBorder: 'border-t-cyan-500',
    stampTiltDeg: 5,
    cardTiltDeg: 8,
  },
  7: {
    memberId: 7,
    code: 'C07',
    fallbackName: 'Ed',
    image: seloEdImg,
    ringColor: 'rgba(52, 211, 153, 0.72)',
    accentBorder: 'border-t-emerald-500',
    stampTiltDeg: -4,
    cardTiltDeg: -5,
  },
}

export function getWaxSealByMemberId(memberId) {
  return WAX_SEALS_BY_MEMBER[Number(memberId)] || null
}
