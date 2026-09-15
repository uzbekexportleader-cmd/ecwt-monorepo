import React, { useRef, useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Switch, View, type KeyboardTypeOptions } from 'react-native';
import { Text, TextInput } from './AppText';
import { Ionicons } from '@expo/vector-icons';

import { CONTROL_HEIGHT, colors, layout, radius, spacing, typography } from '../theme';
import { useScrollIntoView } from './KeyboardAwareScroll';
import { useT, type TranslationKey } from '../i18n';

/* ------------------------------- TextField ------------------------------- */

export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  hint,
  keyboardType,
  maxLength,
  multiline,
  autoCapitalize = 'sentences',
  editable = true,
  prefix,
  testID,
  secureTextEntry,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  error?: string;
  hint?: string;
  keyboardType?: KeyboardTypeOptions;
  maxLength?: number;
  multiline?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  editable?: boolean;
  prefix?: string;
  /** E2E testlar uchun barqaror identifikator (matn tarjimaga bog'liq emas) */
  testID?: string;
  /** Parol maydoni: matn nuqtalar bilan yashiriladi */
  secureTextEntry?: boolean;
}) {
  const [focused, setFocused] = useState(false);

  // Klaviatura ochilganda shu maydon uning tepasiga surib chiqariladi
  const wrapper = useRef<View>(null);
  const scrollIntoView = useScrollIntoView();

  return (
    <View style={{ gap: spacing.sm }}>
      <Text style={typography.label}>{label}</Text>
      <View
        ref={wrapper}
        style={[
          styles.inputWrap,
          multiline && { height: 120, alignItems: 'flex-start', paddingVertical: spacing.md },
          focused && { borderColor: colors.primary },
          !!error && { borderColor: colors.danger },
          !editable && { opacity: 0.6 },
        ]}
      >
        {prefix ? <Text style={[typography.bodyStrong, { marginRight: 4 }]}>{prefix}</Text> : null}
        <TextInput
          testID={testID}
          secureTextEntry={secureTextEntry}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          keyboardType={keyboardType}
          maxLength={maxLength}
          multiline={multiline}
          editable={editable}
          autoCapitalize={autoCapitalize}
          onFocus={() => {
            setFocused(true);
            scrollIntoView(wrapper.current);
          }}
          onBlur={() => setFocused(false)}
          style={[styles.input, multiline && { height: '100%', textAlignVertical: 'top' }]}
        />
      </View>
      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : hint ? (
        <Text style={typography.caption}>{hint}</Text>
      ) : null}
    </View>
  );
}

/* ------------------------------ SelectField ------------------------------ */

export interface SelectOption {
  value: string;
  label: string;
  hint?: string;
}

export function SelectField({
  label,
  value,
  options,
  onChange,
  placeholder = 'Tanlang',
  error,
  hint,
}: {
  label: string;
  value?: string | null;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  hint?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <View style={{ gap: spacing.sm }}>
      <Text style={typography.label}>{label}</Text>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={[styles.inputWrap, !!error && { borderColor: colors.danger }]}
      >
        <Text
          style={[
            styles.input,
            { color: selected ? colors.text : colors.textMuted },
          ]}
          numberOfLines={1}
        >
          {selected?.label ?? placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
      </Pressable>
      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : hint ? (
        <Text style={typography.caption}>{hint}</Text>
      ) : null}

      {/*
        Web'da yopilish animatsiyasi tugagunча oyna DOM'da qolib, undan
        keyingi birinchi teginishni "yutib" yuboradi — foydalanuvchi
        tanlagach darhol quyidagi maydonni bossa, bosish yo'qoladi.
        Shu sababli web'da animatsiyasiz yopamiz; telefonda silliq
        surilish saqlanadi.
      */}
      <Modal
        visible={open}
        animationType={Platform.OS === 'web' ? 'none' : 'slide'}
        transparent
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
        <View style={styles.sheet}>
          <View style={[layout.rowBetween, { marginBottom: spacing.lg }]}>
            <Text style={typography.h3}>{label}</Text>
            <Pressable onPress={() => setOpen(false)} hitSlop={12} accessibilityRole="button" accessibilityLabel="Yopish">
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </Pressable>
          </View>
          <ScrollView style={{ maxHeight: 420 }}>
            {options.map((o) => {
              const active = o.value === value;
              return (
                <Pressable
                  key={o.value}
                  onPress={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={o.label}
                  style={[styles.option, active && { backgroundColor: colors.primarySoft }]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[typography.bodyStrong, active && { color: colors.primary }]}>
                      {o.label}
                    </Text>
                    {o.hint ? <Text style={typography.caption}>{o.hint}</Text> : null}
                  </View>
                  {active ? <Ionicons name="checkmark" size={20} color={colors.primary} /> : null}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}


/* ------------------------------- DateField -------------------------------- */

/** Oy raqamidan lug'at kalitini yasaydi: 1 → 'month.1' */
const MONTH_KEYS = Array.from({ length: 12 }, (_, i) => `month.${i + 1}` as TranslationKey);

/**
 * Sana kiritish: Kun | Oy | Yil — uchta alohida maydon.
 *
 * NEGA SHUNDAY: ilgari bitta maydon bo'lib, foydalanuvchi `1990-05-14`
 * ko'rinishida QO'LDA yozishi kerak edi — tire bilan, yil-oy-kun tartibida.
 * Hech kim sanani bunday yozmaydi va tartibni chalkashtirib yuborish juda
 * oson (05-14 mi yoki 14-05 mi?).
 *
 * Oy raqam emas, NOM bilan tanlanadi — shunda chalkashish umuman qolmaydi.
 *
 * Tashqariga har doim standart `YYYY-MM-DD` chiqadi: server va validatsiya
 * sxemasi (`birthDateSchema`) aynan shu ko'rinishni kutadi.
 */
export function DateField({
  label,
  value,
  onChange,
  error,
  hint,
}: {
  label: string;
  /** `YYYY-MM-DD` yoki bo'sh satr */
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: string;
}) {
  const t = useT();

  // Kelgan qiymatni qismlarga ajratamiz (to'liq bo'lmasa ham ishlaydi)
  const [year = '', month = '', day = ''] = value.split('-');

  /**
   * Qismlardan yagona qiymat yig'adi.
   *
   * To'liq bo'lmaganda ham `YYYY-MM-DD` shaklida qaytaradi (masalan
   * `1990--14`) — shunda validatsiya "sana to'liq emas" deb aniq aytadi,
   * maydon esa kiritilgan qismni yo'qotmaydi.
   */
  const emit = (next: { d?: string; m?: string; y?: string }) => {
    const d = (next.d ?? day).replace(/D/g, '').slice(0, 2);
    const m = (next.m ?? month).replace(/D/g, '').slice(0, 2);
    const y = (next.y ?? year).replace(/D/g, '').slice(0, 4);

    if (!d && !m && !y) {
      onChange('');
      return;
    }
    // Kun va oy har doim ikki xonali: server shu ko'rinishni kutadi
    onChange(`${y}-${m ? m.padStart(2, '0') : ''}-${d ? d.padStart(2, '0') : ''}`);
  };

  const monthOptions: SelectOption[] = MONTH_KEYS.map((key, i) => ({
    value: String(i + 1).padStart(2, '0'),
    label: t(key),
  }));

  return (
    <View style={{ gap: spacing.sm }}>
      <Text style={typography.label}>{label}</Text>

      <View style={styles.dateRow}>
        <View style={styles.dateDay}>
          <TextField
            label={t('field.day')}
            value={day}
            onChangeText={(v) => emit({ d: v })}
            placeholder="14"
            keyboardType="number-pad"
            maxLength={2}
          />
        </View>

        <View style={styles.dateMonth}>
          <SelectField
            label={t('field.month')}
            value={month ? month.padStart(2, '0') : null}
            options={monthOptions}
            onChange={(v) => emit({ m: v })}
            placeholder={t('field.month')}
          />
        </View>

        <View style={styles.dateYear}>
          <TextField
            label={t('field.year')}
            value={year}
            onChangeText={(v) => emit({ y: v })}
            placeholder="1990"
            keyboardType="number-pad"
            maxLength={4}
          />
        </View>
      </View>

      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : hint ? (
        <Text style={typography.caption}>{hint}</Text>
      ) : null}
    </View>
  );
}

/* ------------------------------ SwitchField ------------------------------ */

export function SwitchField({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  hint?: string;
}) {
  return (
    <View style={[layout.rowBetween, { paddingVertical: spacing.sm }]}>
      <View style={{ flex: 1, paddingRight: spacing.lg }}>
        <Text style={typography.bodyStrong}>{label}</Text>
        {hint ? <Text style={typography.caption}>{hint}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.surfaceAlt, true: colors.primary }}
        thumbColor={Platform.OS === 'android' ? colors.white : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  inputWrap: {
    minHeight: CONTROL_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
  },
  input: { flex: 1, color: colors.text, fontSize: 17, paddingVertical: spacing.md },
  error: { color: colors.danger, fontSize: 13 },
  /* Kun | Oy | Yil — oy nomi uzun bo'lgani uchun unga ko'proq joy beriladi */
  dateRow: { flexDirection: 'row', gap: spacing.sm },
  dateDay: { flex: 1 },
  dateMonth: { flex: 2 },
  dateYear: { flex: 1.4 },
  backdrop: { flex: 1, backgroundColor: colors.overlay },
  sheet: {
    backgroundColor: colors.bgElevated,
    borderTopLeftRadius: radius['2xl'],
    borderTopRightRadius: radius['2xl'],
    padding: spacing.xl,
    paddingBottom: spacing['3xl'],
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: radius.md,
    marginBottom: spacing.xs,
  },
});
