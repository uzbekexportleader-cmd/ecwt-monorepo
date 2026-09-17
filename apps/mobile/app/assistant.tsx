import React, { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text, TextInput } from '../src/components/AppText';
import { Ionicons } from '@expo/vector-icons';

import { useRouter } from 'expo-router';

import { useAiHistory, useAiStatus, useAskAi } from '../src/api/queries';
import { Button, InfoBanner, LoadingView } from '../src/components/ui';
import { useAuthStore } from '../src/store/auth';
import { colors, radius, spacing, typography } from '../src/theme';
import { useT } from '../src/i18n';

export default function AssistantScreen() {
  const t = useT();
  const router = useRouter();
  const history = useAiHistory();
  const aiStatus = useAiStatus();
  const ask = useAskAi();
  const [text, setText] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  const messages = history.data ?? [];

  /*
   * Kirishdan oldin ham ochiladi (tugma birinchi ekrandan turadi), lekin
   * savol yuborib bo'lmaydi: server so'rovi sessiya talab qiladi va suhbat
   * tarixi foydalanuvchiga bog'langan. Shuning uchun sababni ochiq yozamiz
   * va ro'yxatdan o'tishga yo'naltiramiz — bo'sh chat oynasini ko'rsatib,
   * javob kelmasligini kutdirgandan ko'ra halolroq.
   */
  const signedIn = Boolean(useAuthStore((s) => s.user));

  useEffect(() => {
    const timeout = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 200);
    return () => clearTimeout(timeout);
  }, [messages.length]);

  const send = async (value?: string) => {
    const message = (value ?? text).trim();
    if (!message) return;
    setText('');
    await ask.mutateAsync(message).catch(() => undefined);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
      // Fon shaffof — ortidagi video ko‘rinadi (11–22-qadamlar)
      style={{ flex: 1 }}
    >
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{ padding: spacing.xl, paddingBottom: spacing.xl }}
        keyboardShouldPersistTaps="handled"
      >
        {/*
          Kalit ulanmagan bo'lsa — ochiq aytamiz. Tugmada ChatGPT
          logotipi turgani holda javoblar boshqa joydan kelayotganini
          yashirish foydalanuvchini aldash bo'lardi.

          Yozuv SERVER javobiga bog'langan: kalit ulangan kunda o'zi
          yo'qoladi, qo'lda o'chirish kerak emas.
        */}
        {!signedIn ? (
          <View style={{ gap: spacing.lg }}>
            <InfoBanner text={t('ai.signInFirst')} tone="info" icon="person-circle-outline" />
            <Button title={t('onboarding.register')} onPress={() => router.replace('/(auth)/phone')} />
          </View>
        ) : null}

        {signedIn && aiStatus.data && !aiStatus.data.connected ? (
          <InfoBanner text={t('ai.notConnected')} tone="warning" icon="key-outline" />
        ) : null}

        {signedIn ? (
        <>
        <InfoBanner text={t('ai.disclaimer')} tone="info" />

        {/*
          Ilova shaxsiy ma'lumotni yubormaydi (anketa foizi, yetishmayotgan
          bandlar NOMI, mos subsidiyalar va ariza holati — xolos). Lekin
          hunarmandning O'ZI savol matniga PINFL yoki bank raqamini yozib
          yuborishi mumkin. Ogohlantirish aynan shuning oldini oladi.
        */}
        <InfoBanner text={t('ai.privacy')} tone="warning" icon="lock-closed-outline" />

        {history.isLoading ? <LoadingView /> : null}

        {!history.isLoading && messages.length === 0 ? (
          <View style={{ marginTop: spacing.xl, gap: spacing.md }}>
            <Text style={typography.body}>Nima bilan yordam bera olaman?</Text>
            {(['ai.suggest1', 'ai.suggest2', 'ai.suggest3'] as const).map((k) => (
              <Pressable key={k} onPress={() => void send(t(k))} style={styles.suggestion}>
                <Ionicons name="sparkles-outline" size={16} color={colors.primary} />
                <Text style={[typography.small, { color: colors.text, flex: 1 }]}>{t(k)}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        <View style={{ marginTop: spacing.lg, gap: spacing.md }}>
          {messages.map((m, i) => (
            <View
              key={`${m.createdAt}-${i}`}
              style={[
                styles.bubble,
                m.role === 'user' ? styles.userBubble : styles.aiBubble,
              ]}
            >
              <Text style={[typography.body, m.role === 'user' && { color: colors.textInverse }]}>
                {m.content}
              </Text>
            </View>
          ))}
          {ask.isPending ? (
            <View style={[styles.bubble, styles.aiBubble]}>
              <Text style={typography.small}>Yozmoqda...</Text>
            </View>
          ) : null}
        </View>
        </>
        ) : null}
      </ScrollView>

      {signedIn ? (
      <View style={styles.composer}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder={t('ai.placeholder')}
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          multiline
        />
        <Pressable
          onPress={() => void send()}
          disabled={!text.trim() || ask.isPending}
          style={[styles.sendButton, (!text.trim() || ask.isPending) && { opacity: 0.4 }]}
        >
          <Ionicons name="arrow-up" size={20} color={colors.textInverse} />
        </Pressable>
      </View>
      ) : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bubble: { padding: spacing.lg, borderRadius: radius.lg, maxWidth: '90%' },
  userBubble: { alignSelf: 'flex-end', backgroundColor: colors.primary },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    padding: spacing.lg,
    paddingBottom: spacing['2xl'],
    backgroundColor: colors.bgElevated,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    maxHeight: 120,
    minHeight: 48,
    color: colors.text,
    fontSize: 16,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
