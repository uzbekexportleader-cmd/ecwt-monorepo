import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { FontAwesome6, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { Text } from '../../src/components/AppText';
import { StepScreen } from '../../src/components/StepScreen';
import { ChoiceCard } from '../../src/components/ChoiceCard';
import { SelectionGlow } from '../../src/components/SelectionGlow';
import { MARKETPLACES } from '../../src/constants/onboarding';
import { useOnboarding } from '../../src/store/onboarding';
import { EcwtApiError } from '../../src/api/client';
import { toastError } from '../../src/store/toast';
import { useT } from '../../src/i18n';
import { colors, radius, spacing, typography } from '../../src/theme';

/**
 * 9-qadam: ECWT xizmatlarini tanlash.
 *
 * Sakkizta marketplace'dan FAQAT bittasi tanlanadi — ariza va shartnoma
 * bitta marketplace bo'yicha rasmiylashtiriladi. Ustiga uchta xizmatdan
 * bir yoki bir nechtasi qo'shilishi mumkin.
 */
export default function ServicesStep() {
  const t = useT();
  const router = useRouter();
  const { draft, set, saveStep, saving } = useOnboarding();

  /**
   * Butun ekranda — 8 ta marketplace VA 2 ta xizmat qo'shib — bor-yo'g'i
   * BITTA tanlov bo'ladi: yo marketplace, yo xizmat. Ikkalasi birga
   * tanlanadigan xizmat turi yo'q, shu sababli biri tanlansa ikkinchi guruh
   * avtomatik bo'shaydi.
   *
   * `wantsChinaImport` endi ekranda tanlanmaydi (uchinchi karta olib
   * tashlangan), lekin maydon ma'lumotlar modelida QOLADI: eski arizalarda
   * u `true` bo'lishi mumkin va admin panelida ko'rinishi kerak. Shu
   * sababli tozalashda u ham nolga tushiriladi.
   */
  const clearServices = () => {
    set('wantsBrandSite', false);
    set('wantsDropshipping', false);
    set('wantsChinaImport', false);
  };

  const selectMarketplace = (code: string) => {
    const turningOn = draft.selectedMarketplaces[0] !== code;
    set('selectedMarketplaces', turningOn ? [code] : []);
    if (turningOn) clearServices();
  };

  const selectService = (key: 'wantsBrandSite' | 'wantsDropshipping') => {
    const next = !draft[key];
    set('wantsBrandSite', key === 'wantsBrandSite' && next);
    set('wantsDropshipping', key === 'wantsDropshipping' && next);
    set('wantsChinaImport', false);
    if (next) set('selectedMarketplaces', []);
  };

  const ready =
    draft.selectedMarketplaces.length > 0 || draft.wantsBrandSite || draft.wantsDropshipping;

  const next = async () => {
    if (!ready) return;
    try {
      await saveStep(
        {
          selectedMarketplaces: draft.selectedMarketplaces,
          wantsBrandSite: draft.wantsBrandSite,
          wantsDropshipping: draft.wantsDropshipping,
          wantsChinaImport: draft.wantsChinaImport,
        },
        'BANK',
      );
      router.push('/(setup)/bank');
    } catch (e) {
      toastError(e instanceof EcwtApiError ? e.message : t('done.saveFailed'));
    }
  };

  return (
    <StepScreen
      step={5}
      backTo={'/(setup)/activity-details'}
      title={t('step.services')}
      onNext={() => void next()}
      nextDisabled={!ready}
      loading={saving}
    >
      <Text style={typography.label}>{t('services.marketplaceBlock')}</Text>
      <Text style={typography.caption}>{t('services.marketplaceHint')}</Text>

      <View style={styles.grid}>
        {MARKETPLACES.map((m) => {
          const selected = draft.selectedMarketplaces[0] === m.code;
          return (
            <Pressable
              key={m.code}
              onPress={() => selectMarketplace(m.code)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={m.name}
              style={({ pressed }) => [
                styles.tile,
                selected && styles.tileSelected,
                pressed && styles.tilePressed,
              ]}
            >
              <SelectionGlow selected={selected} />

              <View style={[styles.logo, { backgroundColor: '#FFFFFF' }]}>
                {m.brand ? (
                  <FontAwesome6 name={m.brand} iconStyle="brands" size={20} color={m.color} />
                ) : (
                  <Text style={[styles.letter, { color: m.color }]}>{m.name.charAt(0)}</Text>
                )}
              </View>
              <Text style={styles.tileName} numberOfLines={2}>
                {m.name}
              </Text>

              {/*
                Integratsiya hali ulanmagan bo'lsa — ochiq aytamiz.
                Foydalanuvchi mahsulotim shu yerda sotilyapti deb o'ylab
                qolmasligi kerak.
              */}
              {m.connected ? null : (
                <View style={styles.soonBadge}>
                  <Text style={styles.soonText}>{t('marketplace.soon')}</Text>
                </View>
              )}

              {selected ? (
                <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
              ) : null}
            </Pressable>
          );
        })}
      </View>

      <Text style={[typography.label, { marginTop: spacing.lg }]}>{t('services.title')}</Text>

      <ChoiceCard
        icon="storefront-outline"
        title={t('services.brandSite')}
        hint={t('services.brandSiteDesc')}
        selected={draft.wantsBrandSite}
        onPress={() => selectService('wantsBrandSite')}
      />
      <ChoiceCard
        icon="repeat-outline"
        title={t('services.dropshipping')}
        hint={t('services.dropshippingDesc')}
        selected={draft.wantsDropshipping}
        onPress={() => selectService('wantsDropshipping')}
      />
    </StepScreen>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  /*
   * Ulanmagan integratsiya belgisi — kartaning O'NG YUQORI burchagida,
   * kichkina. Markazda va kattaroq bo'lganda logotip bilan bellashib,
   * kartaning asosiy mazmunini bosib qo'yardi.
   */
  soonBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: radius.sm,
    backgroundColor: colors.dangerSoft,
    borderWidth: 0.5,
    borderColor: colors.danger,
  },
  soonText: { color: colors.danger, fontSize: 8, fontWeight: '700' },
  tile: {
    flexBasis: '47%',
    flexGrow: 1,
    minHeight: 92,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    // Tanlash nuri karta chetidan tashqariga chiqib ketmasligi uchun
    overflow: 'hidden',
    borderColor: colors.border,
    backgroundColor: 'rgba(15, 26, 56, 0.72)',
  },
  tileSelected: { borderColor: colors.primary, backgroundColor: 'rgba(0, 194, 224, 0.12)' },
  tilePressed: { opacity: 0.75 },
  logo: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letter: { fontSize: 18, fontWeight: '800' },
  tileName: { color: colors.text, fontSize: 12, fontWeight: '600', textAlign: 'center' },
});
