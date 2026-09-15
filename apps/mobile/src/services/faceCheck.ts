/**
 * Yuz oval ichiga to'g'ri joylashganini tekshirish qoidalari.
 *
 * ML Kit har bir kadrda yuzning o'lchami, joyi va burilish burchaklarini
 * beradi. Shu ma'lumot asosida "tayyor" yoki "tayyor emas" degan qaror
 * chiqariladi — aynan shu qaror ramkani yashil qiladi.
 *
 * Qoidalar alohida faylda: ularni ekranni ishga tushirmasdan ham sinash
 * mumkin bo'lsin.
 */

/** ML Kit qaytaradigan yuz ma'lumotining bizga kerakli qismi */
export interface FaceSample {
  bounds: { x: number; y: number; width: number; height: number };
  frameWidth: number;
  frameHeight: number;
  /** Boshning chapga-o'ngga burilishi, gradus */
  yawAngle: number;
  /** Boshning yuqoriga-pastga qiyaligi, gradus */
  pitchAngle: number;
  /** Boshning yon tomonga og'ishi, gradus */
  rollAngle: number;
  leftEyeOpenProbability?: number;
  rightEyeOpenProbability?: number;
}

export type FaceProblem =
  | 'topilmadi'
  | 'bir nechta'
  | 'uzoq'
  | 'yaqin'
  | 'markazda emas'
  | 'burilgan'
  | 'ko‘z yumuq';

export interface FaceCheck {
  ready: boolean;
  problem?: FaceProblem;
  /** Foydalanuvchiga ko'rsatiladigan matn */
  hint: string;
}

/** Yuz kadr kengligining kamida/ko'pi bilan shuncha qismini egallashi kerak */
const MIN_WIDTH_RATIO = 0.42;
const MAX_WIDTH_RATIO = 0.86;

/** Yuz markazi kadr markazidan shuncha qismdan ko'p siljimasin */
const MAX_OFFSET_RATIO = 0.14;

/** Bosh burilishining ruxsat etilgan chegarasi, gradus */
const MAX_YAW = 14;
const MAX_PITCH = 14;
const MAX_ROLL = 12;

/** Ko'z ochiq deb hisoblanadigan eng kichik ehtimollik */
const MIN_EYE_OPEN = 0.35;

const HINTS: Record<FaceProblem, string> = {
  'topilmadi': 'Yuzingizni oval ichiga joylashtiring',
  'bir nechta': 'Kadrda bitta odam qolsin',
  'uzoq': 'Telefonni yaqinroq tuting',
  'yaqin': 'Telefonni sal uzoqroq tuting',
  'markazda emas': 'Yuzingizni oval markaziga keltiring',
  'burilgan': 'To‘g‘ri qarang',
  'ko‘z yumuq': 'Ko‘zingizni oching',
};

/**
 * Kadrda topilgan yuzlar bo'yicha qaror chiqaradi.
 *
 * Tekshiruv tartibi ataylab shunday: avval eng ko'zga tashlanadigan
 * muammo aytiladi, shunda foydalanuvchi bir vaqtning o'zida bir nechta
 * ko'rsatmani o'qib chalkashmaydi.
 */
export function checkFaces(faces: FaceSample[]): FaceCheck {
  if (faces.length === 0) return fail('topilmadi');
  if (faces.length > 1) return fail('bir nechta');

  const face = faces[0];
  const { bounds, frameWidth, frameHeight } = face;
  if (frameWidth <= 0 || frameHeight <= 0) return fail('topilmadi');

  const widthRatio = bounds.width / frameWidth;
  if (widthRatio < MIN_WIDTH_RATIO) return fail('uzoq');
  if (widthRatio > MAX_WIDTH_RATIO) return fail('yaqin');

  const centerX = (bounds.x + bounds.width / 2) / frameWidth;
  const centerY = (bounds.y + bounds.height / 2) / frameHeight;
  if (
    Math.abs(centerX - 0.5) > MAX_OFFSET_RATIO ||
    Math.abs(centerY - 0.5) > MAX_OFFSET_RATIO
  ) {
    return fail('markazda emas');
  }

  if (
    Math.abs(face.yawAngle) > MAX_YAW ||
    Math.abs(face.pitchAngle) > MAX_PITCH ||
    Math.abs(face.rollAngle) > MAX_ROLL
  ) {
    return fail('burilgan');
  }

  // Ehtimollik berilmasa (ba'zi qurilmalarda bo'lmaydi) — bu shartni
  // o'tkazib yuboramiz, aks holda tekshiruv umuman tugamay qoladi
  const left = face.leftEyeOpenProbability;
  const right = face.rightEyeOpenProbability;
  if (
    (left !== undefined && left < MIN_EYE_OPEN) ||
    (right !== undefined && right < MIN_EYE_OPEN)
  ) {
    return fail('ko‘z yumuq');
  }

  return { ready: true, hint: 'Yuzingiz joyida — qimirlamang' };
}

function fail(problem: FaceProblem): FaceCheck {
  return { ready: false, problem, hint: HINTS[problem] };
}
