import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ApiError } from '../api/client';
import { resendVerificationEmail, verifyEmailApi } from '../api/auth';
import { useAuth } from '../context/auth-context';
import { colors, radius, spacing } from '../constants/theme';
import { GlassCard } from '../components/GlassCard';
import { NeonButton } from '../components/NeonButton';

export function VerifyEmailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { setUser } = useAuth();
  const token = route.params?.token ?? '';
  const emailParam = route.params?.email ?? '';

  const [email, setEmail] = useState(emailParam);
  const [message, setMessage] = useState(
    token ? 'Đang xác minh email...' : 'Kiểm tra hộp thư và mở link xác minh, hoặc gửi lại email.',
  );
  const [status, setStatus] = useState<'idle' | 'verifying' | 'done' | 'error'>(
    token ? 'verifying' : 'idle',
  );
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    void verifyEmailApi(token)
      .then((user) => {
        if (cancelled) return;
        setUser(user);
        setStatus('done');
        setMessage('Email đã được xác minh. Bạn đã đăng nhập.');
        Alert.alert('Thành công', 'Xác minh email thành công', [
          { text: 'Vào app', onPress: () => navigation.navigate('MainTabs') },
        ]);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setStatus('error');
        setMessage(err instanceof ApiError ? err.message : 'Không xác minh được email');
      });
    return () => {
      cancelled = true;
    };
  }, [token, navigation, setUser]);

  const handleResend = async () => {
    if (!email.trim()) {
      Alert.alert('Thiếu email', 'Nhập email để gửi lại link xác minh.');
      return;
    }
    setSending(true);
    try {
      const data = await resendVerificationEmail(email.trim());
      Alert.alert('Đã gửi', data.message);
    } catch (err) {
      Alert.alert('Lỗi', err instanceof ApiError ? err.message : 'Không gửi lại được');
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <GlassCard style={styles.card} highlight>
        <Text style={styles.brand}>✦ XÁC MINH EMAIL</Text>
        <Text style={styles.title}>Xác minh tài khoản</Text>
        <Text style={styles.subtitle}>{message}</Text>

        {status !== 'done' ? (
          <>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="ban@email.com"
              placeholderTextColor={colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
            />
            <NeonButton
              title={sending ? 'Đang gửi...' : 'Gửi lại email xác minh'}
              variant="primary"
              size="lg"
              loading={sending}
              onPress={() => void handleResend()}
              style={{ marginTop: spacing.md }}
            />
          </>
        ) : null}

        <NeonButton
          title="Về trang đăng nhập"
          variant="outline"
          size="md"
          onPress={() => navigation.navigate('Login')}
          style={{ marginTop: spacing.md }}
        />
      </GlassCard>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  card: {
    padding: spacing.xl,
  },
  brand: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: colors.primaryLight,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#ffffff',
    marginTop: 4,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 6,
    marginBottom: spacing.md,
    lineHeight: 16,
  },
  input: {
    backgroundColor: 'rgba(6, 7, 13, 0.75)',
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 46,
    color: '#ffffff',
    fontSize: 13,
  },
});
