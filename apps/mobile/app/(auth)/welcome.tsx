import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../../src/components/AppText';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { FontAwesome6, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, layout, radius, spacing } from '../../src/theme';
import { useAuthStore } from '../../src/store/auth';
import { useT, type TranslationKey } from '../../src/i18n';
import { LanguageChips } from '../../src/components/LanguagePicker';
import { MARKETPLACES } from '../../src/constants/onboarding';
import { StepNav } from '../../src/components/StepNav';

/**
 * RN'ning Animated komponenti View uchun mo'ljallangan ichki proplarni
 * (collapsable, needsOffscreenAlphaCompositing) ham uzatadi. Web'da ular
 * to'g'ridan-to'g'ri SVG DOM elementiga tushib, "Received false for a
 * non-boolean attribute" ogohlantirishini chiqaradi — shuning uchun
 * Rect'ga yetib bormasdan filtrlanadi.
 */
type RawRectProps = React.ComponentProps<typeof Rect> & {
  collapsable?: boolean;
  needsOffscreenAlphaCompositing?: boolean;
};

const RawRect = React.forwardRef<React.ComponentRef<typeof Rect>, RawRectProps>(
  ({ collapsable: _collapsable, needsOffscreenAlphaCompositing: _compositing, ...rest }, ref) => (
    <Rect ref={ref} {...rest} />
  ),
);
const AnimatedRect = Animated.createAnimatedComponent(RawRect);
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Tugma bosilganda joyidan tepaga sakrab chiqadi va qo'yib yuborilganda
 * yumshoq qaytadi (spring).
 */
function usePopUp() {
  const value = useRef(new Animated.Value(0)).current;

  const animate = (to: number) =>
    Animated.spring(value, {
      toValue: to,
      friction: 5,
      tension: 140,
      useNativeDriver: false,
    }).start();

  return {
    press: () => animate(1),
    release: () => animate(0),
    lift: {
      translateY: value.interpolate({ inputRange: [0, 1], outputRange: [0, -8] }),
      scale: value.interpolate({ inputRange: [0, 1], outputRange: [1, 1.04] }),
    },
  };
}

/** FontAwesome brend glifining nomi (amazon, paypal, shopify, ...) */
type BrandGlyph = React.ComponentProps<typeof FontAwesome6>['name'];

interface Feature {
  icon: keyof typeof Ionicons.glyphMap;
  /** Lug'at kaliti — matn tanlangan tilda chiqadi */
  titleKey: TranslationKey;
  /** Faqat marketplace kartasida: 8 ta mini-logotip "Г" shaklida chetni o'raydi */
  showMarketplaceLogos?: boolean;
  /** To'lov kartasida: nomlar o'rniga PayPal / Stripe / Shopify logotiplari */
  showPaymentLogos?: boolean;
}

const FEATURES: Feature[] = [
  { icon: 'cart-outline', titleKey: 'welcome.card1', showMarketplaceLogos: true },
  { icon: 'globe-outline', titleKey: 'welcome.card2' },
  { icon: 'globe-outline', titleKey: 'welcome.card3' },
  { icon: 'repeat-outline', titleKey: 'welcome.card4', showPaymentLogos: true },
];

export default function WelcomeScreen() {
  const t = useT();
  const router = useRouter();
  const markWelcomeSeen = useAuthStore((s) => s.markWelcomeSeen);

  const go = async () => {
    await markWelcomeSeen();
    router.replace('/(auth)/phone');
  };

  /**
   * "Hisobim bor" — parol yoki biometrika bilan kirish ekrani.
   *
   * Ro'yxatdan o'tish yo'lidan (`go`) farqi shunda: bu yerda foydalanuvchi
   * allaqachon hisobga ega, ya'ni unga SMS kutish shart emas.
   */
  const goLogin = async () => {
    await markWelcomeSeen();
    router.replace('/(auth)/login');
  };

  return (
    <View style={layout.screenClear}>
      {/* Birinchi ekran — orqaga joy yo'q */}
      <StepNav onNext={go} floating />

      <SafeAreaView style={styles.safe}>
        <ScrollView
          contentContainerStyle={styles.body}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Til tanlash — sarlavhadan ham tepada */}
          <LanguageChips />

          {/* Sarlavha */}
          <Text style={styles.heading}>{t('welcome.heading')}</Text>
          <Text style={styles.founder}>{t('welcome.founder')}</Text>
          <Text style={styles.about}>{t('welcome.about')}</Text>

          {/* Imkoniyatlar */}
          <View style={styles.cards}>
            {FEATURES.map((f, i) => (
              <FeatureCard key={f.titleKey} feature={f} index={i} />
            ))}
          </View>
        </ScrollView>

        {/* Pastki qism */}
        <View style={styles.footer}>
          <PulsingButton title={t('onboarding.register')} onPress={go} />
          <GlowBorderButton title={t('welcome.haveAccount')} onPress={() => void goLogin()} />

          <Text style={styles.motto}>{t('welcome.motto')}</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

/* ------------------------------ kartalar ------------------------------- */

/** Bosib turilganda karta tagidan ko'tariladigan oltin nur */
const GOLD_CORE = '#FFD874';
const GOLD_SOFT = '#F5B942';

/**
 * Imkoniyat kartasi.
 *
 * Karta tugma emas — bosilganda hech qayerga o'tmaydi. Chetlari va ostidagi
 * oltin nur UZLUKSIZ yonib-o'chib turadi (ambient effekt) — e'tibor tortish
 * uchun. Har bir karta boshqasidan bir oz kechikib boshlanadi, shu bilan
 * to'rttasi bir vaqtda emas, ketma-ket "nafas oladi".
 */
function FeatureCard({ feature, index }: { feature: Feature; index: number }) {
  const t = useT();
  const glow = useRef(new Animated.Value(0)).current;
  const [size, setSize] = useState({ w: 0, h: 0 });
  const gradientId = `cardGold${index}`;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(index * 260),
        Animated.timing(glow, {
          toValue: 1,
          duration: 1300,
          easing: Easing.inOut(Easing.quad),
          // Rang animatsiyasi native driver bilan ishlamaydi
          useNativeDriver: false,
        }),
        Animated.timing(glow, {
          toValue: 0.18,
          duration: 1300,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [glow, index]);

  const borderColor = glow.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(30, 44, 85, 0.9)', GOLD_CORE],
  });

  return (
    <AnimatedPressable
      accessibilityRole="text"
      accessibilityLabel={t(feature.titleKey)}
      onLayout={(e) =>
        setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })
      }
      style={[styles.card, { borderColor }]}
    >
      {size.w > 0 ? (
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: glow }]} pointerEvents="none">
          <Svg width={size.w} height={size.h}>
            <Defs>
              <LinearGradient id={gradientId} x1="0" y1="1" x2="0" y2="0">
                <Stop offset="0%" stopColor={GOLD_CORE} stopOpacity="0.6" />
                <Stop offset="35%" stopColor={GOLD_SOFT} stopOpacity="0.26" />
                <Stop offset="100%" stopColor={GOLD_SOFT} stopOpacity="0" />
              </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width={size.w} height={size.h} fill={`url(#${gradientId})`} />
          </Svg>
        </Animated.View>
      ) : null}

      {feature.showMarketplaceLogos ? (
        <MarketplaceCorner title={t(feature.titleKey)} />
      ) : (
        <>
          {feature.showPaymentLogos ? (
            <PaymentLogos />
          ) : (
            <Ionicons name={feature.icon} size={22} color={colors.primary} />
          )}
          <Text style={styles.cardTitle}>{t(feature.titleKey)}</Text>
        </>
      )}
    </AnimatedPressable>
  );
}

/** Bitta oq doiradagi mini-logotip. Brend glifi bo'lmasa — nomning bosh harfi. */
function MiniLogo({ brand, color, name }: { brand?: BrandGlyph; color: string; name: string }) {
  return (
    <View style={styles.miniLogo}>
      {brand ? (
        <FontAwesome6 name={brand} iconStyle="brands" size={11} color={color} />
      ) : (
        <Text style={[styles.miniLogoLetter, { color }]}>{name.charAt(0)}</Text>
      )}
    </View>
  );
}

/** Г shaklining yuqori qatoridagi logotiplar soni — qolgani chap ustunga tushadi */
const TOP_ROW_COUNT = 5;

/**
 * 8 ta marketplace logotipi kartaning chetini "Г" harfi shaklida o'raydi:
 * beshtasi yuqori chekka bo'ylab, qolgan uchtasi chap chekka bo'ylab pastga.
 * Matn esa shu burchakning ichiga — logotiplar yoniga joylashadi.
 */
function MarketplaceCorner({ title }: { title: string }) {
  const top = MARKETPLACES.slice(0, TOP_ROW_COUNT);
  const left = MARKETPLACES.slice(TOP_ROW_COUNT);

  return (
    <View style={styles.corner}>
      <View style={styles.cornerTop}>
        {top.map((m) => (
          <MiniLogo key={m.code} brand={m.brand} color={m.color} name={m.name} />
        ))}
      </View>

      <View style={styles.cornerLower}>
        <View style={styles.cornerLeft}>
          {left.map((m) => (
            <MiniLogo key={m.code} brand={m.brand} color={m.color} name={m.name} />
          ))}
        </View>
        <Text style={styles.cornerTitle}>{title}</Text>
      </View>
    </View>
  );
}

/** To'lov tizimlari — nomi o'rniga brend logotipi ko'rsatiladi */
const PAYMENTS: { key: string; brand: BrandGlyph; color: string }[] = [
  { key: 'paypal', brand: 'paypal', color: '#0070BA' },
  { key: 'stripe', brand: 'stripe', color: '#635BFF' },
  { key: 'shopify', brand: 'shopify', color: '#5E8E3E' },
];

function PaymentLogos() {
  return (
    <View style={styles.payRow}>
      {PAYMENTS.map((p) => (
        <View key={p.key} style={styles.payLogo}>
          <FontAwesome6 name={p.brand} iconStyle="brands" size={20} color={p.color} />
        </View>
      ))}
    </View>
  );
}

/* ------------------------------ tugmalar ------------------------------- */

/** Asosiy tugmaning yashil foni */
const GREEN_LIGHT = '#5FD98A';
const GREEN_DEEP = '#22A75A';

/** LED nur — ikkala tugmada bir xil */
const LED_EDGE = '#0E7A3C';
const LED_GLOW = '#5CFFA6';
const LED_CORE = '#FFFFFF';
const LED_DURATION = 2600;

/**
 * Tugma chetidan aylanib yuradigan yorqin LED nur.
 *
 * Har bir tugmaga alohida gradient kerak, shu sababli `gradientId` beriladi.
 */
function LedBorder({
  width,
  height,
  gradientId,
}: {
  width: number;
  height: number;
  gradientId: string;
}) {
  const travel = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(travel, {
        toValue: 1,
        duration: LED_DURATION,
        easing: Easing.linear,
        // SVG xossalari native driver bilan ishlamaydi
        useNativeDriver: false,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [travel]);

  const perimeter = 2 * (width + height);
  const offset = travel.interpolate({ inputRange: [0, 1], outputRange: [perimeter, 0] });

  if (width <= 0) return null;

  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
      <Defs>
        <LinearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0%" stopColor={LED_EDGE} stopOpacity="0" />
          <Stop offset="30%" stopColor={LED_GLOW} stopOpacity="0.85" />
          <Stop offset="50%" stopColor={LED_CORE} stopOpacity="1" />
          <Stop offset="70%" stopColor={LED_GLOW} stopOpacity="0.85" />
          <Stop offset="100%" stopColor={LED_EDGE} stopOpacity="0" />
        </LinearGradient>
      </Defs>
      <AnimatedRect
        x="2"
        y="2"
        width={width - 4}
        height={height - 4}
        rx={(height - 4) / 2}
        stroke={`url(#${gradientId})`}
        strokeWidth="3.5"
        fill="none"
        strokeLinecap="round"
        strokeDasharray={`${perimeter * 0.24} ${perimeter * 0.76}`}
        strokeDashoffset={offset}
      />
    </Svg>
  );
}

/** Ichi yonib-o'chib turadigan, atrofida LED nur yuguradigan asosiy tugma */
function PulsingButton({ title, onPress }: { title: string; onPress: () => void }) {
  const pulse = useRef(new Animated.Value(0)).current;
  const [width, setWidth] = useState(0);
  const height = 62;

  useEffect(() => {
    // Rang animatsiyasi native driver bilan ishlamaydi
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.quad), useNativeDriver: false }),
        Animated.timing(pulse, { toValue: 0, duration: 1400, easing: Easing.inOut(Easing.quad), useNativeDriver: false }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const backgroundColor = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [GREEN_LIGHT, GREEN_DEEP],
  });

  const { lift, press, release } = usePopUp();

  return (
    <Pressable
      onPress={onPress}
      onPressIn={press}
      onPressOut={release}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <Animated.View
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        style={[
          styles.primary,
          {
            backgroundColor,
            transform: [{ translateY: lift.translateY }, { scale: lift.scale }],
          },
        ]}
      >
        <LedBorder width={width} height={height} gradientId="ledPrimary" />
        <Text style={styles.primaryText}>{title}</Text>
        <Ionicons name="arrow-forward" size={22} color="#06301A" />
      </Animated.View>
    </Pressable>
  );
}

/** Atrofida xuddi shunday LED nur aylanib turadigan ikkinchi tugma */
function GlowBorderButton({ title, onPress }: { title: string; onPress: () => void }) {
  const [width, setWidth] = useState(0);
  const height = 58;

  const { lift, press, release } = usePopUp();

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={press}
      onPressOut={release}
      accessibilityRole="button"
      accessibilityLabel={title}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={[
        styles.secondary,
        { transform: [{ translateY: lift.translateY }, { scale: lift.scale }] },
      ]}
    >
      <LedBorder width={width} height={height} gradientId="ledSecondary" />
      <Text style={styles.secondaryText}>{title}</Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },

  body: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    // Tepadagi o'qlar qatoridan ham pastda boshlanadi. SafeAreaView xavfsiz
    // zonani o'zi qo'shadi, bu esa qo'shimcha nafas: iPhone'ning Dynamic
    // Island'i kattalashsa ham sarlavha unga tegmaydi.
    paddingTop: 56,
    paddingBottom: spacing.md,
  },

  heading: {
    color: colors.text,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  founder: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.4,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  // Qisqa shior — kartalar darhol tagida, yuz ochiq qoladi
  about: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 22,
    textAlign: 'center',
    marginTop: spacing.xs,
  },

  cards: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: spacing.xs },
  card: {
    flexBasis: '47%',
    flexGrow: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(15, 26, 56, 0.7)',
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardTitle: { color: colors.text, fontSize: 12, lineHeight: 16, fontWeight: '700', textAlign: 'center' },

  /* Г shakli: logotiplar chetni o'raydi, matn burchak ichida qoladi */
  corner: { alignSelf: 'stretch', gap: 5 },
  cornerTop: { flexDirection: 'row', gap: 4 },
  cornerLower: { flexDirection: 'row', gap: 6 },
  cornerLeft: { gap: 4 },
  cornerTitle: {
    flex: 1,
    color: colors.text,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    paddingTop: 2,
  },

  /* To'lov tizimlari logotiplari */
  payRow: { flexDirection: 'row', gap: 8 },
  payLogo: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  miniLogo: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniLogoLetter: { fontSize: 10, fontWeight: '800' },
  cardText: { color: colors.textMuted, fontSize: 10, lineHeight: 13, textAlign: 'center' },

  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    paddingTop: spacing.sm,
    // Ikkala tugma bir-biriga yaqin tursin
    gap: spacing.sm,
  },
  primary: {
    height: 62,
    // To'liq dumaloq chetlar
    borderRadius: 31,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    overflow: 'hidden',
  },
  primaryText: { color: '#06301A', fontSize: 18, fontWeight: '700' },
  secondary: {
    height: 58,
    borderRadius: 29,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    backgroundColor: 'rgba(15, 26, 56, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: { color: colors.text, fontSize: 17, fontWeight: '600' },
  motto: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
