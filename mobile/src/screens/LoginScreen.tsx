import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/auth-context';
import { ApiError } from '../api/client';
import { colors, radius, spacing } from '../constants/theme';
import { GlassCard } from '../components/GlassCard';
import { NeonButton } from '../components/NeonButton';
import { GoogleAuthButton } from '../components/GoogleAuthButton';
import { AuthUser } from '../types';

export function LoginScreen() {
  const navigation = useNavigation<any>();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const finishAuth = (authUser: AuthUser) => {
    if (authUser.role === 'STAFF') {
      navigation.navigate('StaffScan');
      return;
    }
    if (authUser.role === 'ADMIN') {
      navigation.navigate('AdminSuite');
      return;
    }
    navigation.goBack();
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập đầy đủ Email và Mật khẩu.');
      return;
    }

    setLoading(true);
    try {
      const authUser = await login({ email: email.trim(), password });
      finishAuth(authUser);
    } catch (err: unknown) {
      const message = err instanceof ApiError ? err.message : 'Email hoặc mật khẩu không chính xác.';
      Alert.alert('Đăng nhập thất bại', message);
      if (err instanceof ApiError && err.code === 'EMAIL_NOT_VERIFIED') {
        navigation.navigate('VerifyEmail', { email: email.trim() });
      }
    } finally {
      setLoading(false);
    }
  };

  const fillQuickAccount = (e: string, p: string) => {
    setEmail(e);
    setPassword(p);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Top Back Nav */}
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>‹ Đóng</Text>
        </TouchableOpacity>

        {/* Brand Glass Card */}
        <GlassCard style={styles.card} highlight>
          <View style={styles.brandRow}>
            <Text style={styles.brandText}>✦ CINEWAVE ACCOUNT</Text>
            <Text style={styles.sslBadge}>🛡️ SSL</Text>
          </View>

          <Text style={styles.title}>Đăng Nhập</Text>
          <Text style={styles.subtitle}>
            Quản lý vé xem phim, giữ ghế 3D và đồng bộ thông báo suất chiếu.
          </Text>

          {/* 1-Click Demo Accounts */}
          <View style={styles.quickAccountsBox}>
            <Text style={styles.quickTitle}>⚡ Đăng nhập nhanh 1-chạm:</Text>
            <View style={styles.quickButtonsRow}>
              <TouchableOpacity
                onPress={() => fillQuickAccount('demo@cinewave.vn', 'password1')}
                style={styles.quickBtn}
              >
                <Text style={styles.quickBtnText}>👤 Khách</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => fillQuickAccount('staff@cinewave.vn', 'password1')}
                style={styles.quickBtn}
              >
                <Text style={styles.quickBtnText}>🎫 Staff</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => fillQuickAccount('admin@cinewave.vn', 'password1')}
                style={styles.quickBtn}
              >
                <Text style={styles.quickBtnText}>👑 Admin</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Email Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="ten@cinewave.vn"
              placeholderTextColor={colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <View style={styles.passLabelRow}>
              <Text style={styles.inputLabel}>Mật khẩu</Text>
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Text style={styles.showPassText}>{showPassword ? 'Ẩn' : 'Hiện'}</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={colors.textMuted}
              secureTextEntry={!showPassword}
              style={styles.input}
            />
          </View>

          {/* Submit Button */}
          <NeonButton
            title={loading ? 'Đang đăng nhập...' : 'Đăng nhập ngay'}
            variant="primary"
            size="lg"
            loading={loading}
            onPress={() => void handleLogin()}
            style={{ marginTop: spacing.lg }}
          />

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>hoặc</Text>
            <View style={styles.dividerLine} />
          </View>

          <GoogleAuthButton
            onSuccess={(authUser) => {
              finishAuth(authUser);
            }}
          />

          {/* Switch to Register */}
          <View style={styles.switchRow}>
            <Text style={styles.switchText}>Chưa có tài khoản? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.switchLink}>Đăng ký mới →</Text>
            </TouchableOpacity>
          </View>
        </GlassCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.lg,
    justifyContent: 'center',
    minHeight: '100%',
  },
  backBtn: {
    alignSelf: 'flex-start',
    marginBottom: spacing.md,
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primaryLight,
  },
  card: {
    padding: spacing.xl,
    backgroundColor: 'rgba(14, 19, 34, 0.95)',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  brandText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: colors.primaryLight,
  },
  sslBadge: {
    fontSize: 10,
    color: colors.emeraldLight,
    fontWeight: '700',
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: '#ffffff',
    marginTop: 4,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 16,
    marginBottom: spacing.md,
  },
  quickAccountsBox: {
    backgroundColor: 'rgba(6, 182, 212, 0.08)',
    borderColor: 'rgba(6, 182, 212, 0.25)',
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  quickTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primaryLight,
    marginBottom: spacing.xs,
  },
  quickButtonsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  quickBtn: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    alignItems: 'center',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
  },
  quickBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
  },
  inputGroup: {
    marginTop: spacing.sm,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  passLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  showPassText: {
    fontSize: 10,
    color: colors.primaryLight,
    fontWeight: '700',
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
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  switchText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  switchLink: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primaryLight,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.md,
    gap: spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  dividerText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
});

