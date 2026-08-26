import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LOCALES, type Locale } from '@ecwt/contracts';
import { useLocale } from '@/i18n/LocaleContext';
import { colors, fontSize, radius, spacing } from '@/theme';

/**
 * Fondagi yorug'lik nuqtalari — shahar chiroqlari.
 *
 * Joylashuvi qat'iy: `Math.random()` ishlatilsa, ekran har qayta
 * chizilganda ular sakrab yurardi.
 */
const LIGHTS = [
  { left: '14%', top: '26%', size: 4 },
  { left: '31%', top: '38%', size: 3 },
  { left: '22%', top: '52%', size: 5 },
  { left: '47%', top: '31%', size: 3 },
  { left: '58%', top: '46%', size: 4 },
  { left: '39%', top: '61%', size: 3 },
  { left: '67%', top: '25%', size: 3 },
  { left: '75%', top: '54%', size: 4 },
];

/**
 * Tanishtiruv ekrani — ilova ochilganda birinchi ko'rinadigan sahifa.
 *
 * ── Nega kerak ──────────────────────────────────────────────────────
 * Ilgari ilova darrov parol so'rardi. Odam "bu qanaqa ilova, men to'g'ri
 * joydamanmi?" degan savolga javob topa olmasdan turib, undan hisob
 * ma'lumotlari talab qilinardi.
 *
 * ── Fon: video, lekin MOBIL uchun tayyorlangani ─────────────────────
 * Saytdagi video 30 MB va u gorizontal. Uni bu yerga solib bo'lmasdi:
 * ilova hajmi shuncha oshardi, batareya sarflanardi va telefon
 * ekranida kadrning yon tomonlari kesilib ketardi.
 *
 * Shuning uchun alohida nusxa tayyorlandi:
 *   manba      1440x2560, 60 kadr/s, 4.4 MB
 *   natija     1080x1920, 30 kadr/s, 1.08 MB
 *
 * Vertikal — telefon ekraniga aynan mos, kesish kerak emas. Sifat
 * deyarli yo'qolmadi (manbaga nisbatan 43.5 dB), sikl esa
 * tutashtirildi: boshi va oxiri farqi 8.19 dan 0.49 ga tushdi, ya'ni
 * qaytganda sakrash ko'rinmaydi.
 *
 * Video yuklanguncha uning bir kadri (59 KB) turadi — shunda ekran
 * bir zum bo'sh qolmaydi.
 *
 * ── Tugmalar `Link` emas, `router.push` ─────────────────────────────
 * Avval `<Link asChild>` ichida `Pressable` turgandi va tugmalar
 * ko'rinmay qolgandi: `Link` o'zining `style` ini bolaga uzatib,
 * `Pressable` nikini bekor qilardi. `router.push` da bunday
 * to'qnashuv yo'q.
 */
export default function WelcomeScreen() {
  const { t, locale, setLocale } = useLocale();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  /**
   * Fondagi video.
   *
   * `loop` — sikl tutashtirilgan, shuning uchun qaytish ko'rinmaydi.
   * `muted` — fon videosi ovozsiz bo'lishi shart: aks holda u
   *           foydalanuvchining musiqasini to'xtatib qo'yadi.
   */
  const player = useVideoPlayer(require('../../assets/backdrop.mp4'), (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  /**
   * Chiroqlarning miltillashi.
   *
   * Video ustida qo'shimcha qatlam: uning o'zida yorug'lik bor, lekin
   * bu nuqtalar harakatni jonliroq qiladi. `useNativeDriver` yoqilgan —
   * animatsiya JS oqimida emas, tizimning o'zida bajariladi.
   */
  const pulse = useRef(new Animated.Value(0)).current;
  const [videoReady, setVideoReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    // Harakatni kamaytirish yoqilgan bo'lsa — video ham, miltillash ham
    // to'xtaydi. Bu sozlamani yoqqan odam ataylab yoqqan.
    void AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
      if (cancelled) return;
      if (reduced) {
        player.pause();
        return;
      }
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, {
            toValue: 1,
            duration: 3200,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(pulse, {
            toValue: 0,
            duration: 3200,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      ).start();
    });

    // Video birinchi kadrni chizguncha ostidagi rasm ko'rinib turadi
    const sub = player.addListener('statusChange', ({ status }) => {
      if (status === 'readyToPlay') setVideoReady(true);
    });

    return () => {
      cancelled = true;
      sub.remove();
      pulse.stopAnimation();
    };
  }, [player, pulse]);

  return (
    <View style={styles.screen}>
      {/* Video yuklanguncha uning bir kadri turadi — ekran bir zum
          bo'sh qolmaydi. */}
      <Image source={require('../../assets/backdrop.jpg')} style={styles.bg} contentFit="cover" />

      <VideoView
        player={player}
        style={[styles.bg, !videoReady && styles.hidden]}
        contentFit="cover"
        nativeControls={false}
        // Foydalanuvchi fonni to'liq ekranga ochib yubormasligi kerak
        allowsFullscreen={false}
        allowsPictureInPicture={false}
      />

      {/* Miltillovchi chiroqlar — saytdagi ikkinchi qatlamning
          soddalashtirilgani */}
      {LIGHTS.map((l, i) => (
        <Animated.View
          key={i}
          style={[
            styles.light,
            {
              left: l.left as unknown as number,
              top: l.top as unknown as number,
              width: l.size,
              height: l.size,
              borderRadius: l.size,
              opacity: pulse.interpolate({
                inputRange: [0, 1],
                // Juft va toq nuqtalar teskari bosqichda — hammasi bir
                // vaqtda yonib-o'chmaydi
                outputRange: i % 2 === 0 ? [0.15, 0.7] : [0.7, 0.15],
              }),
            },
          ]}
        />
      ))}

      <View style={styles.scrim} />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          // Android'da pastda tizim tugmalari turadi — ularsiz hisob
          // qilinsa, tugmalar ular ostida qolib ketadi
          { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.xl },
        ]}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.mark}>ECWT</Text>
            <Text style={styles.company}>E-COMMERCE WORLD TRADE</Text>
          </View>

          {/* Til almashtirgich — saytdagi kabi o'ng tepada.
              Busiz ilova telefon tilini oladi va uni o'zgartirib
              bo'lmasdi: rus tilidagi telefonda hamma narsa rus tilida
              chiqardi. */}
          <View style={styles.langRow}>
            {LOCALES.map((code: Locale) => {
              const active = code === locale;
              return (
                <Pressable
                  key={code}
                  onPress={() => setLocale(code)}
                  style={[styles.lang, active && styles.langActive]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                >
                  <Text style={[styles.langText, active && styles.langTextActive]}>
                    {code.toUpperCase()}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.middle}>
          <Text style={styles.tagline}>{t.welcome.tagline}</Text>
          <Text style={styles.lead}>{t.welcome.lead}</Text>

          <View style={styles.marketRow}>
            {['Amazon', 'eBay', 'Etsy', 'Walmart', 'TikTok Shop', 'Alibaba'].map((name) => (
              <View key={name} style={styles.marketChip}>
                <Text style={styles.marketText}>{name}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.bottom}>
          {/* Dalil tugmalar USTIDA: odam qaror qabul qilayotgan aynan
              o'sha lahzada ko'radi. */}
          <Text style={styles.partners}>{t.welcome.partners}</Text>

          <Pressable
            onPress={() => router.push('/(auth)/register')}
            style={({ pressed }) => [styles.primary, pressed && styles.pressed]}
            accessibilityRole="button"
          >
            <Text style={styles.primaryText}>{t.welcome.start}</Text>
          </Pressable>

          <Pressable
            onPress={() => router.push('/(auth)/login')}
            style={({ pressed }) => [styles.ghost, pressed && styles.pressed]}
            accessibilityRole="button"
          >
            <Text style={styles.ghostText}>{t.welcome.haveAccount}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.brand950,
  },
  bg: {
    ...StyleSheet.absoluteFillObject,
  },
  hidden: {
    opacity: 0,
  },
  light: {
    position: 'absolute',
    backgroundColor: 'rgba(190,225,255,0.95)',
    // Yorug'lik nuqtaning o'zidan kengroq tarqaladi — 'chiroq' tuyg'usi shundan
    shadowColor: '#78beff',
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 4,
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(4,10,22,0.72)',
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    justifyContent: 'space-between',
    gap: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  mark: {
    color: colors.white,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  company: {
    color: colors.brand300,
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 2,
    marginTop: 2,
  },
  langRow: {
    flexDirection: 'row',
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    borderRadius: radius.full,
    padding: 3,
  },
  lang: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
  },
  langActive: {
    backgroundColor: colors.white,
  },
  langText: {
    color: colors.brand200,
    fontSize: 11,
    fontWeight: '700',
  },
  langTextActive: {
    color: colors.brand950,
  },
  middle: {
    gap: spacing.lg,
  },
  tagline: {
    color: colors.white,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  lead: {
    color: colors.brand100,
    fontSize: fontSize.sm,
    lineHeight: 22,
  },
  marketRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  marketChip: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  marketText: {
    color: colors.brand100,
    fontSize: 12,
    fontWeight: '600',
  },
  bottom: {
    gap: spacing.md,
  },
  partners: {
    color: colors.brand300,
    fontSize: 11,
    lineHeight: 16,
  },
  primary: {
    backgroundColor: colors.brand500,
    borderRadius: radius.full,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  ghost: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.26)',
    backgroundColor: 'rgba(9,23,41,0.55)',
    borderRadius: radius.full,
    paddingVertical: 16,
    alignItems: 'center',
  },
  ghostText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.85,
  },
});
