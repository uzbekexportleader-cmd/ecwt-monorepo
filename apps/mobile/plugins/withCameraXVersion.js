/**
 * CameraX kutubxonasining versiyasini bitta qiymatga qadab qo'yadi.
 *
 * MUAMMO
 * Ilovada ikkita kamera kutubxonasi bor va ular Android'ning CameraX
 * kutubxonasidan turli versiyalarni so'raydi:
 *
 *   react-native-vision-camera 4.7.3  →  CameraX 1.5.0-alpha03
 *   expo-camera 57                    →  CameraX 1.6.0
 *
 * Gradle bunday holatda ENG YANGISINI (1.6.0) tanlaydi. Lekin
 * vision-camera 1.5 dagi ichki klassga (`Camera2CameraInfoImpl`)
 * to'g'ridan-to'g'ri murojaat qiladi, u esa 1.6 da o'zgargan. Natijada
 * ilova kamerani ochishga urinishi bilan yiqilardi:
 *
 *   NoClassDefFoundError: androidx/camera/camera2/internal/Camera2CameraInfoImpl
 *
 * YECHIM
 * Barcha CameraX modullarini vision-camera talab qiladigan versiyaga
 * qadaymiz. Yuz aniqlash aynan vision-camera orqali ishlaydi, shu sababli
 * ustunlik unga beriladi. `expo-camera` esa faqat brauzer va Expo Go
 * versiyasida ishlatiladi — telefondagi ilovada uning native qismi
 * umuman chaqirilmaydi.
 */
const { withAppBuildGradle } = require('expo/config-plugins');

/** vision-camera 4.7.3 shu versiyaga qarshi kompilyatsiya qilingan */
const CAMERAX_VERSION = '1.5.0-alpha03';

const BLOCK = `
// CameraX versiyasini qadab qo'yamiz — qarang: plugins/withCameraXVersion.js
configurations.all {
    resolutionStrategy {
        eachDependency { details ->
            if (details.requested.group == 'androidx.camera') {
                details.useVersion '${CAMERAX_VERSION}'
                details.because 'react-native-vision-camera shu versiyaga bog\\'liq'
            }
        }
    }
}
`;

module.exports = function withCameraXVersion(config) {
  return withAppBuildGradle(config, (cfg) => {
    // Takroriy qo'shilib ketmasin (prebuild bir necha marta ishlashi mumkin)
    if (cfg.modResults.contents.includes("details.requested.group == 'androidx.camera'")) {
      return cfg;
    }
    cfg.modResults.contents += BLOCK;
    return cfg;
  });
};
