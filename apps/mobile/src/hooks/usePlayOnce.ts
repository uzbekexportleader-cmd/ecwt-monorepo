import { useEffect, useRef } from 'react';
import type { VideoPlayer } from 'expo-video';

/**
 * Videoni bir marta o'ynatadi va oxirgi kadrda to'xtatadi.
 *
 * `player.play()` ni darhol chaqirish har doim ham ishlamaydi: fayl hali
 * yuklanmagan bo'lsa, pleyer pauzada qolib ketadi. Shu sababli "readyToPlay"
 * holatini ham kuzatamiz. Video tugagach qayta ishga tushirmaymiz.
 */
export function usePlayOnce(player: VideoPlayer, onEnd?: () => void) {
  const finished = useRef(false);

  // Callback o'zgarsa effekt qayta ishga tushmasin (video boshidan ketardi)
  const onEndRef = useRef(onEnd);
  onEndRef.current = onEnd;

  useEffect(() => {
    const start = () => {
      if (finished.current) return;
      player.muted = true;
      player.loop = false;
      player.play();
    };

    start();

    const ready = player.addListener('statusChange', ({ status }) => {
      if (status === 'readyToPlay') start();
    });
    const done = player.addListener('playToEnd', () => {
      finished.current = true;
      onEndRef.current?.();
    });

    return () => {
      ready.remove();
      done.remove();
    };
  }, [player]);
}
