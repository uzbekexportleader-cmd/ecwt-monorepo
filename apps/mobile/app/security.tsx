import React, { useEffect, useState } from 'react';
import { StyleSheet, Switch, View } from 'react-native';
import { Text } from '../src/components/AppText';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { Button, Card, InfoBanner, LoadingView, Screen, SectionHeader } from '../src/components/ui';
import { TextField } from '../src/components/form';
import { api, EcwtApiError } from '../src/api/client';
import { useT } from '../src/i18n';
import { useAuthStore } from '../src/store/auth';
import { authenticate, getBiometricInfo, type BiometricInfo } from '../src/services/biometrics';
import { toastError, toastSuccess } from '../src/store/toast';
import { colors, layout, spacing, typography } from '../src/theme';

export default function SecurityScreen() {
  const biometricEnabled = useAuthStore((s) => s.biometricEnabled);
  const setBiometricEnabled = useAuthStore((s) => s.setBiometricEnabled);

  const [info, setInfo] = useState<BiometricInfo | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void getBiometricInfo().then(setInfo);
  }, []);

  /**
   * Yoqishda ham, o'chirishda ham biometrik tasdiqlash so'raladi —
   * telefon boshqa odam qo'lida bo'lsa sozlamani o'zgartira olmasin.
   */
  const toggle = async (next: boolean) => {
    if (!info) return;
    if (next && !info.available) {
      toastError(
        info.hasHardware
          ? 'Qurilmada yuz yoki barmoq izi sozlanmagan. Telefon sozlamalaridan qo‘shing.'
          : 'Bu qurilmada biometrik kirish mavjud emas.',
      );
      return;
    }

    setBusy(true);
    try {
      const result = await authenticate(
        next ? `${info.label} ni yoqish` : `${info.label} ni o‘chirish`,
        { fallbackToPasscode: true },
      );
      if (!result.success) {
        if (!result.cancelled && result.message) toastError(result.message);
        return;
      }
      await setBiometricEnabled(next);
      toastSuccess(next ? `${info.label} yoqildi` : `${info.label} o‘chirildi`);
    } finally {
      setBusy(false);
    }
  };

  if (!info) {
    return (
      <Screen>
        <LoadingView />
      </Screen>
    );
  }

  return (
    <Screen>
      <SectionHeader title="Kirish himoyasi" />

      <Card>
        <View style={[layout.rowBetween]}>
          <View style={[layout.row, { flex: 1, gap: spacing.lg }]}>
            <View style={styles.icon}>
              <MaterialCommunityIcons
                name={info.kind === 'fingerprint' ? 'fingerprint' : 'face-recognition'}
                size={26}
                color={info.available ? colors.primary : colors.textMuted}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={typography.bodyStrong}>
                {/^Biometrik/.test(info.label) ? info.label : `${info.label} orqali kirish`}
              </Text>
              <Text style={typography.caption}>
                {info.available
                  ? 'Ilova ochilganda shaxsingiz tasdiqlanadi'
                  : 'Bu qurilmada mavjud emas'}
              </Text>
            </View>
          </View>
          <Switch
            value={biometricEnabled}
            onValueChange={toggle}
            disabled={busy || !info.available}
            trackColor={{ false: colors.surfaceAlt, true: colors.primary }}
            thumbColor={colors.white}
          />
        </View>
      </Card>

      {!info.available ? (
        <View style={{ marginTop: spacing.lg }}>
          <InfoBanner
            text={
              info.hasHardware
                ? 'Telefon sozlamalarida yuz yoki barmoq izini qo‘shsangiz, bu funksiya faollashadi.'
                : 'Qurilmangizda biometrik datchik yo‘q. Ilovadan telefon raqamingiz orqali foydalanaverasiz.'
            }
            tone="info"
          />
        </View>
      ) : null}

      <PasswordSection />

      <SectionHeader title="Ma’lumotlaringiz qanday himoyalanadi" />
      <Card>
        <Row
          icon="cellphone-lock"
          title="Yuzingiz telefondan chiqmaydi"
          text="Yuz va barmoq izi telefoningizning himoyalangan qismida qoladi. ECWT serveriga hech qachon yuborilmaydi."
        />
        <Row
          icon="key-outline"
          title="Kalitlar shifrlangan xotirada"
          text="Kirish kalitlari qurilmaning xavfsiz xotirasida (Keychain / Keystore) saqlanadi."
        />
        <Row
          icon="logout"
          title="Chiqishda hammasi tozalanadi"
          text="Hisobdan chiqsangiz, kalitlar o‘chiriladi va biometrik himoya yopiladi."
          last
        />
      </Card>
    </Screen>
  );
}

function Row({
  icon,
  title,
  text,
  last,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  text: string;
  last?: boolean;
}) {
  return (
    <View
      style={[
        styles.row,
        last && { borderBottomWidth: 0, paddingBottom: 0 },
      ]}
    >
      <MaterialCommunityIcons name={icon} size={22} color={colors.primary} style={{ marginTop: 2 }} />
      <View style={{ flex: 1 }}>
        <Text style={typography.bodyStrong}>{title}</Text>
        <Text style={[typography.small, { marginTop: 2 }]}>{text}</Text>
      </View>
    </View>
  );
}

/* ------------------------------- parol ---------------------------------- */

/**
 * Parol o'rnatish va almashtirish.
 *
 * NEGA KERAK: parolsiz foydalanuvchi har safar SMS kodini kutadi. Parol
 * qo'ysa — "Hisobim bor" ekranidan darhol kiradi.
 *
 * Parol ALLAQACHON bo'lsa, joriy parol ham so'raladi: telefonni qo'lga
 * kiritgan begona odam parolni jimgina almashtirib, haqiqiy egasini
 * hisobidan chiqarib yubora olmasin.
 */
function PasswordSection() {
  const t = useT();
  const [hasPassword, setHasPassword] = useState<boolean | null>(null);
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    let cancelled = false;
    void api.auth
      .hasPassword()
      .then((r) => !cancelled && setHasPassword(r.hasPassword))
      .catch(() => !cancelled && setHasPassword(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const save = async () => {
    setSaving(true);
    setError(undefined);
    try {
      await api.auth.setPassword({
        currentPassword: hasPassword ? current : undefined,
        newPassword: next,
      });
      setHasPassword(true);
      setOpen(false);
      setCurrent('');
      setNext('');
      toastSuccess(t('password.saved'));
    } catch (e) {
      setError(e instanceof EcwtApiError ? e.message : t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  if (hasPassword === null) return null;

  return (
    <>
      <SectionHeader title={t('login.password')} />
      <Card>
        <View style={layout.rowBetween}>
          <View style={{ flex: 1, paddingRight: spacing.lg }}>
            <Text style={typography.bodyStrong}>
              {hasPassword ? t('password.isSet') : t('password.notSet')}
            </Text>
            <Text style={typography.caption}>{t('password.why')}</Text>
          </View>
        </View>

        {open ? (
          <View style={{ gap: spacing.lg, marginTop: spacing.lg }}>
            {hasPassword ? (
              <TextField
                label={t('password.current')}
                value={current}
                onChangeText={setCurrent}
                secureTextEntry
                autoCapitalize="none"
              />
            ) : null}
            <TextField
              label={t('password.new')}
              value={next}
              onChangeText={setNext}
              secureTextEntry
              autoCapitalize="none"
              hint={t('password.hint')}
              error={error}
            />
            <Button
              title={t('common.save')}
              onPress={() => void save()}
              loading={saving}
              disabled={next.length < 8 || (hasPassword && current.length === 0)}
            />
            <Button title={t('common.cancel')} variant="ghost" onPress={() => setOpen(false)} />
          </View>
        ) : (
          <View style={{ marginTop: spacing.lg }}>
            <Button
              title={hasPassword ? t('password.change') : t('password.set')}
              variant="secondary"
              icon="key-outline"
              onPress={() => setOpen(true)}
            />
          </View>
        )}
      </Card>
    </>
  );
}

const styles = StyleSheet.create({
  icon: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingVertical: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
});
