/**
 * Release APK ni ECWT ning o'z kaliti bilan imzolaydi.
 *
 * MUAMMO
 * `expo prebuild` yasaydigan `android/app/build.gradle` da release
 * varianti DEBUG kaliti bilan imzolanadi ("Caution! In production, you
 * need to generate your own keystore file"). Bunday APK ni Play Market
 * qabul qilmaydi va u har qurilishda boshqa imzo oladi — ya'ni ustiga
 * yangilanish o'rnatib bo'lmaydi.
 *
 * Kalitni qo'lda `build.gradle` ga yozib qo'yish ham yaramaydi: u fayl
 * generatsiya qilinadi, keyingi `prebuild` da o'zgarish yo'qoladi. Shu
 * sababli sozlama PLAGIN sifatida yozilgan — har safar o'zi qo'shiladi.
 *
 * PAROLLAR BU YERDA YO'Q
 * Kalit yo'li va parollari `~/.gradle/gradle.properties` faylidan
 * o'qiladi (ECWT_STORE_FILE va boshqalar). Ular berilmagan kompyuterda
 * qurilish to'xtamaydi — debug kaliti bilan davom etadi, faqat bunday
 * APK ni tarqatib bo'lmaydi.
 */
const { withAppBuildGradle } = require('expo/config-plugins');

const SIGNING_BLOCK = `        release {
            if (project.hasProperty('ECWT_STORE_FILE')) {
                storeFile file(project.property('ECWT_STORE_FILE'))
                storePassword project.property('ECWT_STORE_PASSWORD')
                keyAlias project.property('ECWT_KEY_ALIAS')
                keyPassword project.property('ECWT_KEY_PASSWORD')
            }
        }
`;

/** Debug kaliti bloki tugagan joy — release shundan keyin qo'shiladi */
const DEBUG_BLOCK_END = `            keyPassword 'android'
        }
`;

const OLD_RELEASE_SIGNING = `            signingConfig signingConfigs.debug
            def enableShrinkResources`;

const NEW_RELEASE_SIGNING = `            signingConfig project.hasProperty('ECWT_STORE_FILE') ? signingConfigs.release : signingConfigs.debug
            def enableShrinkResources`;

module.exports = function withReleaseSigning(config) {
  return withAppBuildGradle(config, (cfg) => {
    let gradle = cfg.modResults.contents;

    // Ikki marta qo'shilib ketmasin
    if (!gradle.includes('ECWT_STORE_FILE')) {
      if (!gradle.includes(DEBUG_BLOCK_END)) {
        throw new Error('withReleaseSigning: debug signingConfig topilmadi');
      }
      gradle = gradle.replace(DEBUG_BLOCK_END, DEBUG_BLOCK_END + SIGNING_BLOCK);

      if (!gradle.includes(OLD_RELEASE_SIGNING)) {
        throw new Error('withReleaseSigning: release signingConfig topilmadi');
      }
      gradle = gradle.replace(OLD_RELEASE_SIGNING, NEW_RELEASE_SIGNING);
    }

    cfg.modResults.contents = gradle;
    return cfg;
  });
};
