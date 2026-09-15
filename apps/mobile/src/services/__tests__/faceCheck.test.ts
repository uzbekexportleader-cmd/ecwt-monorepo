import { checkFaces, type FaceSample } from '../faceCheck';

/** Barcha shartlarga javob beradigan namunaviy yuz */
function goodFace(patch: Partial<FaceSample> = {}): FaceSample {
  return {
    frameWidth: 1000,
    frameHeight: 1000,
    bounds: { x: 200, y: 200, width: 600, height: 600 },
    yawAngle: 0,
    pitchAngle: 0,
    rollAngle: 0,
    leftEyeOpenProbability: 0.9,
    rightEyeOpenProbability: 0.9,
    ...patch,
  };
}

describe('checkFaces', () => {
  it('yuz to‘g‘ri joylashganda tayyor deydi', () => {
    expect(checkFaces([goodFace()]).ready).toBe(true);
  });

  it('yuz topilmasa tayyor demaydi', () => {
    const result = checkFaces([]);
    expect(result.ready).toBe(false);
    expect(result.problem).toBe('topilmadi');
  });

  it('kadrda bir nechta odam bo‘lsa ogohlantiradi', () => {
    const result = checkFaces([goodFace(), goodFace()]);
    expect(result.problem).toBe('bir nechta');
  });

  it('yuz kichik bo‘lsa yaqinroq turishni so‘raydi', () => {
    const result = checkFaces([goodFace({ bounds: { x: 400, y: 400, width: 200, height: 200 } })]);
    expect(result.problem).toBe('uzoq');
  });

  it('yuz juda katta bo‘lsa uzoqroq turishni so‘raydi', () => {
    const result = checkFaces([goodFace({ bounds: { x: 40, y: 40, width: 920, height: 920 } })]);
    expect(result.problem).toBe('yaqin');
  });

  it('yuz chetga siljigan bo‘lsa markazga chaqiradi', () => {
    const result = checkFaces([goodFace({ bounds: { x: 20, y: 200, width: 600, height: 600 } })]);
    expect(result.problem).toBe('markazda emas');
  });

  it('bosh burilgan bo‘lsa to‘g‘ri qarashni so‘raydi', () => {
    expect(checkFaces([goodFace({ yawAngle: 30 })]).problem).toBe('burilgan');
    expect(checkFaces([goodFace({ pitchAngle: -25 })]).problem).toBe('burilgan');
    expect(checkFaces([goodFace({ rollAngle: 20 })]).problem).toBe('burilgan');
  });

  it('ko‘z yumuq bo‘lsa ochishni so‘raydi', () => {
    const result = checkFaces([goodFace({ leftEyeOpenProbability: 0.05 })]);
    expect(result.problem).toBe('ko‘z yumuq');
  });

  it('ko‘z ehtimolligi berilmagan qurilmada ham ishlaydi', () => {
    const face = goodFace();
    delete face.leftEyeOpenProbability;
    delete face.rightEyeOpenProbability;
    expect(checkFaces([face]).ready).toBe(true);
  });
});
