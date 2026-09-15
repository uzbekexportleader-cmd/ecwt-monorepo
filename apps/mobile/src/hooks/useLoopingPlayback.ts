import { useEffect } from 'react';
import { AppState } from 'react-native';
import type { VideoPlayer } from 'expo-video';

/**
 * Videoni uzluksiz aylantirib, ishonchli ishga tushiradi.
 *
 * `player.play()` ni ekran ochilishi bilan darhol chaqirish har doim ham
 * ishlamaydi: fayl hali yuklanmagan bo'lsa (bufer tayyor emas), pleyer
 * birinchi kadrda pauzada "qotib" qoladi va hech qachon o'zi boshlanmaydi.
 * Shu sababli "readyToPlay" holatiga o'tganda ham qayta `play()` chaqiramiz.
 *
 * Bundan tashqari video BIZ so'ramagan holda ham to'xtab qolishi mumkin:
 * tizim quvvat tejash uchun, ilova fonga o'tib qaytganda yoki brauzer
 * sahifani ko'rinmas deb hisoblaganda. Shuning uchun o'ynash holati
 * kuzatiladi va ko'rinib turgan video o'z-o'zidan pauzaga tushsa, qayta
 * ishga tushiriladi.
 *
 * `active` — video ko'rinib turibdimi. Ko'rinmayotganda pauza qilinadi, lekin
 * pleyer o'chirilmaydi: qaytganda video to'xtagan joyidan davom etadi,
 * fayl qaytadan yuklanmaydi.
 */

/**
 * Qayta urinishlar chegarasi.
 *
 * Agar muhit o'ynashga umuman ruxsat bermasa (masalan brauzerning avtomatik
 * ijro cheklovi), cheksiz urinish protsessorni behuda yeydi. Shu sababli
 * uzluksiz muvaffaqiyatsiz urinishlar soni cheklanadi; video bir marta
 * o'ynasa hisob nolga qaytadi.
 */
const MAX_RESUME_ATTEMPTS = 12;

export function useLoopingPlayback(player: VideoPlayer, active = true): void {
  useEffect(() => {
    if (!active) {
      player.pause();
      return;
    }

    let attempts = 0;
    let cancelled = false;

    const start = () => {
      if (cancelled) return;
      player.muted = true;
      player.loop = true;
      player.play();
    };

    start();

    const ready = player.addListener('statusChange', ({ status }) => {
      if (status === 'readyToPlay') {
        attempts = 0;
        start();
      }
    });

    /*
     * Video biz so'ramagan holda to'xtasa — qayta yoqamiz.
     *
     * Pauzani faqat shu hook chaqiradi, ya'ni bu yerga tushgan har qanday
     * to'xtash tashqi sabab bilan bo'lgan: quvvat tejash, ovoz fokusi yoki
     * brauzerning ko'rinmas sahifani to'xtatishi.
     */
    const playing = player.addListener('playingChange', ({ isPlaying }) => {
      if (isPlaying) {
        attempts = 0;
        return;
      }
      if (attempts >= MAX_RESUME_ATTEMPTS) return;
      attempts += 1;
      start();
    });

    // Ilova fondan qaytganda video ko'pincha pauzada qoladi
    const appState = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        attempts = 0;
        start();
      }
    });

    return () => {
      cancelled = true;
      ready.remove();
      playing.remove();
      appState.remove();
    };
  }, [player, active]);
}
