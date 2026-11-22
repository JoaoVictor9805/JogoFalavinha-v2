import card1Andre from '../assets/andre/card-1-andre.jpg'
import cutout1AndrePose1 from '../assets/andre/cutout-1-andre-pose1.webp'
import cutout1AndrePose2 from '../assets/andre/cutout-1-andre-pose2.webp'
import cutout1AndrePose3 from '../assets/andre/cutout-1-andre-pose3.webp'
import cutout1AndreSuccess from '../assets/andre/cutout-1-andre-success.webp'
import cutout1AndreWrong from '../assets/andre/cutout-1-andre-wrong.webp'
import card7Ed from '../assets/ed/card-7-ed.jpg'
import cutout7EdPose1 from '../assets/ed/cutout-7-ed-pose1.webp'
import cutout7EdPose2 from '../assets/ed/cutout-7-ed-pose2.webp'
import cutout7EdPose3 from '../assets/ed/cutout-7-ed-pose3.webp'
import cutout7EdSuccess from '../assets/ed/cutout-7-ed-success.webp'
import cutout7EdWrong from '../assets/ed/cutout-7-ed-wrong.webp'
import card4Jhonny from '../assets/jhonny/card-4-jhonny.jpg'
import cutout4JhonnyPose1 from '../assets/jhonny/cutout-4-jhonny-pose1.webp'
import cutout4JhonnyPose2 from '../assets/jhonny/cutout-4-jhonny-pose2.webp'
import cutout4JhonnyPose3 from '../assets/jhonny/cutout-4-jhonny-pose3.webp'
import cutout4JhonnySuccess from '../assets/jhonny/cutout-4-jhonny-success.webp'
import cutout4JhonnyWrong from '../assets/jhonny/cutout-4-jhonny-wrong.webp'
import card5Juarez from '../assets/juarez/card-5-juarez.jpg'
import cutout5JuarezPose1 from '../assets/juarez/cutout-5-juarez-pose1.webp'
import cutout5JuarezPose2 from '../assets/juarez/cutout-5-juarez-pose2.webp'
import cutout5JuarezPose3 from '../assets/juarez/cutout-5-juarez-pose3.webp'
import cutout5JuarezSuccess from '../assets/juarez/cutout-5-juarez-success.webp'
import cutout5JuarezWrong from '../assets/juarez/cutout-5-juarez-wrong.webp'
import tribunalMesaImg from '../assets/outros/tribunal-mesa.webp'
import tribunalMesaSoloImg from '../assets/outros/tribunal-mesa-solo.webp'
import card2Ramon from '../assets/ramon/card-2-ramon.jpg'
import cutout2RamonPose1 from '../assets/ramon/cutout-2-ramon-pose1.webp'
import cutout2RamonPose2 from '../assets/ramon/cutout-2-ramon-pose2.webp'
import cutout2RamonPose3 from '../assets/ramon/cutout-2-ramon-pose3.webp'
import cutout2RamonSuccess from '../assets/ramon/cutout-2-ramon-success.webp'
import cutout2RamonWrong from '../assets/ramon/cutout-2-ramon-wrong.webp'
import card6Ricardo from '../assets/ricardo/card-6-ricardo.jpg'
import cutout6RicardoPose1 from '../assets/ricardo/cutout-6-ricardo-pose1.webp'
import cutout6RicardoPose2 from '../assets/ricardo/cutout-6-ricardo-pose2.webp'
import cutout6RicardoPose3 from '../assets/ricardo/cutout-6-ricardo-pose3.webp'
import cutout6RicardoSuccess from '../assets/ricardo/cutout-6-ricardo-success.webp'
import cutout6RicardoWrong from '../assets/ricardo/cutout-6-ricardo-wrong.webp'
import card3Vanessa from '../assets/vanessa/card-3-vanessa.jpg'
import cutout3VanessaPose1 from '../assets/vanessa/cutout-3-vanessa-pose1.webp'
import cutout3VanessaPose2 from '../assets/vanessa/cutout-3-vanessa-pose2.webp'
import cutout3VanessaPose3 from '../assets/vanessa/cutout-3-vanessa-pose3.webp'
import cutout3VanessaSuccess from '../assets/vanessa/cutout-3-vanessa-success.webp'
import cutout3VanessaWrong from '../assets/vanessa/cutout-3-vanessa-wrong.webp'
import { WAX_SEALS_BY_MEMBER } from './waxSealsData'

export const TRIBUNAL_MESA_IMG = tribunalMesaImg
export const TRIBUNAL_MESA_SOLO_IMG = tribunalMesaSoloImg

export const MEMBER_CARD_IMAGES = {
  1: card1Andre,
  2: card2Ramon,
  3: card3Vanessa,
  4: card4Jhonny,
  5: card5Juarez,
  6: card6Ricardo,
  7: card7Ed,
}

export const MEMBER_CUTOUTS = {
  1: {
    default: [cutout1AndrePose1, cutout1AndrePose2, cutout1AndrePose3],
    wrong: cutout1AndreWrong,
    success: cutout1AndreSuccess,
  },
  2: {
    default: [cutout2RamonPose1, cutout2RamonPose2, cutout2RamonPose3],
    wrong: cutout2RamonWrong,
    success: cutout2RamonSuccess,
  },
  3: {
    default: [cutout3VanessaPose1, cutout3VanessaPose2, cutout3VanessaPose3],
    wrong: cutout3VanessaWrong,
    success: cutout3VanessaSuccess,
  },
  4: {
    default: [cutout4JhonnyPose1, cutout4JhonnyPose2, cutout4JhonnyPose3],
    wrong: cutout4JhonnyWrong,
    success: cutout4JhonnySuccess,
  },
  5: {
    default: [cutout5JuarezPose1, cutout5JuarezPose2, cutout5JuarezPose3],
    wrong: cutout5JuarezWrong,
    success: cutout5JuarezSuccess,
  },
  6: {
    default: [cutout6RicardoPose1, cutout6RicardoPose2, cutout6RicardoPose3],
    wrong: cutout6RicardoWrong,
    success: cutout6RicardoSuccess,
  },
  7: {
    default: [cutout7EdPose1, cutout7EdPose2, cutout7EdPose3],
    wrong: cutout7EdWrong,
    success: cutout7EdSuccess,
  },
}

const ALL_CARD_URLS = Object.values(MEMBER_CARD_IMAGES)
const ALL_SEAL_URLS = Object.values(WAX_SEALS_BY_MEMBER).map((s) => s.image)
const ALL_DEFAULT_POSES = Object.values(MEMBER_CUTOUTS).flatMap((c) => c.default)
const ALL_REACTION_POSES = Object.values(MEMBER_CUTOUTS).flatMap((c) => [c.wrong, c.success])

export const PREFETCH_PRIORITY_IMAGES = Array.from(
  new Set([
    TRIBUNAL_MESA_IMG,
    TRIBUNAL_MESA_SOLO_IMG,
    ...MEMBER_CUTOUTS[4].default,
    ...ALL_CARD_URLS,
    ...ALL_SEAL_URLS,
    '/brand/logo-plaque.png',
    '/brand/logo-screen.png',
  ])
)

export const PREFETCH_SECONDARY_IMAGES = Array.from(
  new Set([...ALL_DEFAULT_POSES, ...ALL_REACTION_POSES])
)

export const PREFETCH_AUDIO_URLS = [
  '/sounds/footstep.mp3',
  '/sounds/chime.mp3',
  '/sounds/desk-phone-ring.mp3',
]
