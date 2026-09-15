import React, { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text, TextInput } from '../src/components/AppText';
import { Ionicons } from '@expo/vector-icons';

import { useAiHistory, useAskAi } from '../src/api/queries';
import { InfoBanner, LoadingView } from '../src/components/ui';
import { colors, radius, spacing, typography } from '../src/theme';
import { useT } from '../src/i18n';

export default function AssistantScreen() {
  const t = useT();
  const history = useAiHistory();
  const ask = useAskAi();
  const [text, setText] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  const messages = history.data ?? [];

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
        <InfoBanner text={t('ai.disclaimer')} tone="info" />

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
      </ScrollView>

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
