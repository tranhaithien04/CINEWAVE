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
import { colors, radius, spacing } from '../constants/theme';
import { GlassCard } from '../components/GlassCard';
import { NeonButton } from '../components/NeonButton';

export function RegisterScreen() {
  const navigation = useNavigation<any>();
  const { register } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng điền đầy đủ họ tên, email và mật khẩu.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Mật khẩu ngắn', 'Mật khẩu phải chứa ít nhất 6 ký tự.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Không khớp', 'Mật khẩu xác nhận không trùng khớp.');
      return;
    }

    setLoading(true);
    try {
      await register({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
      });
      Alert.alert('Thành công', 'Đã tạo tài khoản CineWave mới!', [
        { text: 'Bắt đầu', onPress: () => navigation.navigate('Home') },
      ]);
    } catch (err: any) {
      Alert.alert('Đăng ký thất bại', err?.message || 'Email này có thể đã được sử dụng.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>‹ Quay lại</Text>
        </TouchableOpacity>

        <GlassCard style={styles.card} highlight>
          <Text style={styles.brandText}>✦ CINEWAVE MEMBERSHIP</Text>
          <Text style={styles.title}>Đăng Ký Tài Khoản</Text>
          <Text style={styles.subtitle}>
            Trải nghiệm đặt vé 3D, tích lũy điểm thưởng và nhận thông báo suất chiếu sớm.
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Họ và tên</Text>
            <TextInput
              value={fullName}
              onChangeText={setFullName}
              placeholder="Nguyễn Văn A"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
            />
          </View>

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

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Mật khẩu</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Tối thiểu 6 ký tự"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
              style={styles.input}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Xác nhận mật khẩu</Text>
            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Nhập lại mật khẩu"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
              style={styles.input}
            />
          </View>

          <NeonButton
            title={loading ? 'Đang tạo tài khoản...' : 'Đăng ký ngay'}
            variant="primary"
            size="lg"
            loading={loading}
            onPress={() => void handleRegister()}
            style={{ marginTop: spacing.lg }}
          />

          <View style={styles.switchRow}>
            <Text style={styles.switchText}>Đã có tài khoản? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.switchLink}>Đăng nhập →</Text>
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
  brandText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: colors.primaryLight,
  },
  title: {
    fontSize: 24,
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
  inputGroup: {
    marginTop: spacing.sm,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 4,
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
});

