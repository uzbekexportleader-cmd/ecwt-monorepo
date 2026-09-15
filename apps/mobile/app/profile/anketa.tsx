import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { AuthImage } from '../../src/components/AuthImage';
import { Text } from '../../src/components/AppText';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';

import { fileUrl } from '../../src/api/client';
import { useDocuments, useProfile, useUpdateProfile } from '../../src/api/queries';
import { useAuthStore } from '../../src/store/auth';
import { Button, Card, Chip, InfoBanner, ProgressBar, Screen, SectionHeader } from '../../src/components/ui';
import { colors, formatPhone, spacing, typography } from '../../src/theme';
import { toastError, toastSuccess } from '../../src/store/toast';
import type { VerificationStatus } from '@ecwt/types';

/** Bo'sh qiymatni umuman chizmaydi — anketa faqat to'ldirilgan maydonlarni ko'rsatadi */
function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <View style={styles.row}>
      <Text style={[typography.caption, styles.rowLabel]}>{label}</Text>
      <Text style={typography.bodyStrong} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

const GENDER_LABEL: Record<string, string> = { MALE: 'Erkak', FEMALE: 'Ayol' };

const VERIFICATION_META: Record<
  VerificationStatus,
  { label: string; tone: 'neutral' | 'warning' | 'success' | 'danger'; icon: keyof typeof Ionicons.glyphMap }
> = {
  NOT_STARTED: { label: 'Boshlanmagan', tone: 'neutral', icon: 'ellipse-outline' },
  PENDING: { label: 'Kutilmoqda', tone: 'warning', icon: 'time-outline' },
  VERIFIED: { label: 'Tasdiqlangan', tone: 'success', icon: 'checkmark-circle' },
  FAILED: { label: 'Rad etilgan', tone: 'danger', icon: 'close-circle' },
};

function VerificationRow({ label, status }: { label: string; status: VerificationStatus }) {
  const meta = VERIFICATION_META[status];
  return (
    <View style={[styles.row, styles.verificationRow]}>
      <Text style={typography.bodyStrong}>{label}</Text>
      <Chip label={meta.label} tone={meta.tone} icon={meta.icon} />
    </View>
  );
}

/**
 * Foydalanuvchining to'liq anketasi — CV/rezyume ko'rinishida: kichik
 * profil rasmi (bosilganda to'liq ekranga ochiladi), barcha ma'lumotlar
 * va har bir bo'limning reyestrdagi tasdiqlash holati.
 *
 * Ro'yxatdan o'tish tugagach yoki Profil bo'limidan kirish mumkin.
 */
export default function AnketaScreen() {
  const router = useRouter();

  /**
   * Orqaga qaytish.
   *
   * NEGA ODDIY `router.back()` YETMAYDI: bu ekranga ikki yo'l bilan kelinadi —
   * Profil bo'limidan (`push`, tarix bor) va ro'yxatdan o'tish yakunidagi
   * "Anketamni ko'rish" tugmasidan (`replace`, tarix BO'SH). Ikkinchi holatda
   * `back()` hech narsa qilmaydi va foydalanuvchi ekranda qamalib qoladi.
   */
  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/profile');
  };
  const user = useAuthStore((s) => s.user);
  const profile = useProfile();
  const documents = useDocuments();
  const updateProfile = useUpdateProfile();
  const [locating, setLocating] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);

  const p = profile.data;
  /* Face ID bosqichida yuklangan eng so'nggi selfi — anketa rasmi sifatida */
  const selfie = documents.data?.filter((d) => d.type === 'SELFIE').slice(-1)[0];
  const photoUri = selfie ? fileUrl(selfie.url) : undefined;

  const fullName =
    [p?.lastName, p?.firstName, p?.middleName].filter(Boolean).join(' ') || 'Ism kiritilmagan';

  const address = [p?.region, p?.district, p?.mahalla, p?.street, p?.houseNumber]
    .filter(Boolean)
    .join(', ');

  const hasLocation = p?.latitude != null && p?.longitude != null;

  const detectLocation = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        toastError('Joylashuvga ruxsat berilmadi. Sozlamalardan yoqing.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      await updateProfile.mutateAsync({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      });
      toastSuccess('Joylashuv aniqlandi');
    } catch {
      toastError('Joylashuvni aniqlab bo‘lmadi. GPS yoqilganini tekshiring.');
    } finally {
      setLocating(false);
    }
  };

  return (
    <Screen>
      <Text style={[typography.h1, { marginBottom: spacing.lg }]}>Anketa</Text>

      {/* --- CV sarlavhasi: kichik rasm + F.I.Sh. + telefon --- */}
      <Card>
        <View style={[styles.header, { flexDirection: 'row' }]}>
          <Pressable
            onPress={() => photoUri && setPhotoOpen(true)}
            disabled={!photoUri}
            accessibilityRole={photoUri ? 'imagebutton' : undefined}
            accessibilityLabel="Rasmni kattalashtirish"
          >
            {photoUri ? (
              <AuthImage uri={photoUri} style={styles.photoSmall} contentFit="cover" />
            ) : (
              <View style={styles.photoPlaceholderSmall}>
                <Text style={styles.photoInitialSmall}>
                  {(p?.firstName?.[0] ?? user?.phone.slice(-2) ?? 'E').toUpperCase()}
                </Text>
              </View>
            )}
            {photoUri ? (
              <View style={styles.zoomBadge}>
                <Ionicons name="expand-outline" size={12} color={colors.textInverse} />
              </View>
            ) : null}
          </Pressable>

          <View style={{ flex: 1, marginLeft: spacing.lg, justifyContent: 'center' }}>
            <Text style={typography.h3} numberOfLines={2}>
              {fullName}
            </Text>
            <Text style={typography.caption}>{user ? formatPhone(user.phone) : ''}</Text>
            {p?.craftCategory ? (
              <View style={{ marginTop: spacing.xs, alignSelf: 'flex-start' }}>
                <Chip label={p.craftCategory.nameUz} tone="info" />
              </View>
            ) : null}
          </View>
        </View>

        {p ? (
          <View style={{ marginTop: spacing.lg }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs }}>
              <Text style={typography.caption}>Profil to‘ldirilganligi</Text>
              <Text style={[typography.caption, { color: colors.text, fontWeight: '700' }]}>
                {p.completionPercent}%
              </Text>
            </View>
            <ProgressBar percent={p.completionPercent} height={8} />
          </View>
        ) : null}
      </Card>

      {/* --- Rasmni to'liq ekranga ochadigan modal --- */}
      <Modal visible={photoOpen} transparent animationType="fade" onRequestClose={() => setPhotoOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setPhotoOpen(false)}>
          {photoUri ? (
            <AuthImage uri={photoUri} style={styles.photoFull} contentFit="contain" />
          ) : null}
          <Pressable style={styles.modalClose} onPress={() => setPhotoOpen(false)}>
            <Ionicons name="close" size={28} color={colors.textInverse} />
          </Pressable>
        </Pressable>
      </Modal>

      <SectionHeader title="Tasdiqlash holati" />
      <Card padded={false} style={{ paddingHorizontal: spacing.lg }}>
        {p ? (
          <>
            <VerificationRow label="Shaxsni tasdiqlash" status={p.identityVerification} />
            <VerificationRow label="Yuz orqali tasdiqlash" status={p.faceVerification} />
            <VerificationRow label="Tadbirkorlik" status={p.businessVerification} />
            <VerificationRow label="Bank rekvizitlari" status={p.bankVerification} />
            <VerificationRow label="Uyushma a’zoligi" status={p.membershipVerification} />
          </>
        ) : null}
      </Card>

      <SectionHeader title="Shaxsiy ma’lumotlar" />
      <Card>
        <Row label="Tug‘ilgan sana" value={p?.birthDate} />
        <Row label="Jinsi" value={p?.gender ? GENDER_LABEL[p.gender] : null} />
        <Row label="JShShIR" value={p?.pinfl} />
      </Card>

      <SectionHeader title="Manzil" />
      <Card>
        <Row label="Manzil" value={address || null} />
        {hasLocation ? (
          <Row
            label="GPS koordinatalari"
            value={`${p!.latitude!.toFixed(5)}, ${p!.longitude!.toFixed(5)}`}
          />
        ) : (
          <InfoBanner text="Joylashuvingiz hali GPS orqali aniqlanmagan" tone="info" />
        )}
        <View style={{ marginTop: spacing.md }}>
          <Button
            title={hasLocation ? 'Joylashuvni yangilash' : 'GPS orqali aniqlash'}
            variant="secondary"
            icon="location-outline"
            onPress={() => void detectLocation()}
            loading={locating}
          />
        </View>
      </Card>

      <SectionHeader title="Hunar" />
      <Card>
        <Row label="Yo‘nalish" value={p?.craftCategory?.nameUz} />
        <Row
          label="Tajriba"
          value={p?.yearsOfExperience != null ? `${p.yearsOfExperience} yil` : null}
        />
        <Row label="Ustaxona manzili" value={p?.workshopAddress} />
      </Card>

      <SectionHeader title="Tadbirkorlik" />
      <Card>
        <Row label="STIR" value={p?.stir} />
      </Card>

      <SectionHeader title="Bank rekvizitlari" />
      <Card>
        <Row label="Hisob raqami" value={p?.bankAccount} />
        <Row label="Bank nomi" value={p?.bankName} />
        <Row label="MFO" value={p?.bankMfo} />
      </Card>

      <View style={{ marginTop: spacing.xl }}>
        <Button title="Orqaga" variant="ghost" onPress={goBack} />
      </View>
    </Screen>
  );
}

/**
 * Anketadagi rasm o'lchami.
 *
 * CV uslubidagi kichik rasm edi (64), lekin yuz deyarli ko'rinmasdi —
 * hujjat kartasida odamning o'zi asosiy narsa.
 */
const PHOTO_SIZE_SMALL = 104;

const styles = StyleSheet.create({
  header: { alignItems: 'center' },
  photoSmall: { width: PHOTO_SIZE_SMALL, height: PHOTO_SIZE_SMALL, borderRadius: PHOTO_SIZE_SMALL / 2 },
  photoPlaceholderSmall: {
    width: PHOTO_SIZE_SMALL,
    height: PHOTO_SIZE_SMALL,
    borderRadius: PHOTO_SIZE_SMALL / 2,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoInitialSmall: { color: colors.primary, fontSize: 22, fontWeight: '700' },
  zoomBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoFull: { width: '92%', height: '70%' },
  modalClose: {
    position: 'absolute',
    top: 56,
    right: 24,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  verificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowLabel: { marginBottom: 2 },
});
