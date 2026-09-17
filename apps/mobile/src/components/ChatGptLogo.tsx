import React from 'react';
import Svg, { G, Path } from 'react-native-svg';

/**
 * ChatGPT logotipi.
 *
 * Shakl bitta "bargdan" iborat: u markaz atrofida olti marta 60 gradusga
 * aylantiriladi. Manba — rasmiy SVG (Wikimedia Commons), shu sababli
 * nisbatlar aniq.
 *
 * DIQQAT — HUQUQIY ESLATMA: bu OpenAI kompaniyasining TOVAR BELGISI.
 * Uni ilovada ishlatish kompaniya rahbarining qarori bilan qo'yilgan.
 * OpenAI brend qoidalari o'zgarsa yoki e'tiroz kelsa, shu faylni
 * almashtirish kifoya — logotip boshqa hech qayerda takrorlanmagan.
 */

/** Rasmiy SVG dagi asosiy shakl (bitta barg) */
const LEAF =
  'M1107.3 299.1c-197.999 0-373.9 127.3-435.2 315.3L650 743.5v427.9c0 21.4 11 40.4 29.4 51.4l344.5 ' +
  '198.515V833.3h.1v-27.9L1372.7 604c33.715-19.52 70.44-32.857 108.47-39.828L1447.6 450.3C1361 353.5 ' +
  '1237.1 298.5 1107.3 299.1zm0 117.5-.6.6c79.699 0 156.3 27.5 217.6 78.4-2.5 1.2-7.4 4.3-11 6.1L952.8 ' +
  '709.3c-18.4 10.4-29.4 30-29.4 51.4V1248l-155.1-89.4V755.8c-.1-187.099 151.601-338.9 339-339.2z';

/** Shakl markaz atrofida shu burchaklarga aylantiriladi */
const ANGLES = [0, 60, 120, 180, 240, 300];

export function ChatGptLogo({ size = 30, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 2406 2406">
      {ANGLES.map((angle) => (
        <G key={angle} transform={`rotate(${angle} 1203 1203)`}>
          <Path d={LEAF} fill={color} />
        </G>
      ))}
    </Svg>
  );
}
