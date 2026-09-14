import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/auth-context';
import { colors, radius, spacing } from '../constants/theme';
import { getApiUrl, setApiUrl } from '../api/client';
import { GlassCard } from '../components/GlassCard';
import { NeonButton } from '../components/NeonButton';

export function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { user, logout } = useAuth();

  const [serverUrl, setServerUrl] = useState(getApiUrl());
  const [editingUrl, setEditingUrl] = useState(false);

  const handleSaveUrl = () => {
    if (!serverUrl.trim()) {
      Alert.alert('Lỗi', 'Địa chỉ máy chủ không được để trống.');
      return;
    }
    setApiUrl(serverUrl.trim());
    setEditingUrl(false);
    Alert.alert('Đã cập nhật', `Máy chủ API đã chuyển sang: ${serverUrl.trim()}`);
  };

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn đăng xuất tài khoản?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: () => {
          void logout();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.eyebrow}>MY ACCOUNT</Text>
          <Text style={styles.title}>Hồ Sơ Cá Nhân</Text>
        </View>

        {/* User Card */}
        {user ? (
          <GlassCard style={styles.userCard} highlight>
            <View style={styles.avatarRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {(user.fullName || user.email).charAt(0).toUpperCase()}
                </Text>
              </View>

              <View style={styles.userDetails}>
                <Text style={styles.userName}>{user.fullName || 'Khách hàng CineWave'}</Text>
                <Text style={styles.userEmail}>{user.email}</Text>
                <View style={styles.roleBadge}>
                  <Text style={styles.roleBadgeText}>
                    {user.role === 'ADMIN' ? '👑 QUẢN TRỊ VIÊN' : '✦ THÀNH VIÊN VIP'}
                  </Text>
                </View>
              </View>
            </View>
          </GlassCard>
        ) : (
          <GlassCard style={styles.unauthCard}>
            <Text style={styles.unauthTitle}>Chào mừng bạn đến với CineWave</Text>
            <Text style={styles.unauthSubtitle}>
              Đăng nhập để lưu vé, giữ ghế 3D và quản lý hồ sơ của bạn.
            </Text>
            <View style={styles.unauthActions}>
              <NeonButton
                title="Đăng nhập"
                variant="primary"
                size="md"
                onPress={() => navigation.navigate('Login')}
                style={{ flex: 1, marginRight: spacing.sm }}
              />
              <NeonButton
                title="Đăng ký"
                variant="secondary"
                size="md"
                onPress={() => navigation.navigate('Register')}
                style={{ flex: 1 }}
              />
            </View>
          </GlassCard>
        )}

        {/* Admin Suite Entry (For Admin users) */}
        {user?.role === 'ADMIN' && (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => navigation.navigate('AdminSuite')}
            style={styles.adminEntryCard}
          >
            <View style={styles.adminIconBox}>
              <Text style={styles.adminIconText}>👑</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.adminTitle}>Bảng Quản Trị CineWave</Text>
              <Text style={styles.adminDesc}>
                Quản lý phim, suất chiếu, đơn hàng, người dùng và soát vé cổng.
              </Text>
            </View>
            <Text style={styles.adminArrow}>→</Text>
          </TouchableOpacity>
        )}

        {/* Quick Menu Links */}
        <View style={styles.menuSection}>
          <Text style={styles.menuHeading}>LỐI TẮT TIỆN ÍCH</Text>

          <TouchableOpacity
            onPress={() => navigation.navigate('TicketsTab')}
            style={styles.menuItem}
          >
            <Text style={styles.menuItemIcon}>🎟️</Text>
            <Text style={styles.menuItemLabel}>Vé điện tử của tôi</Text>
            <Text style={styles.menuItemChevron}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('NotificationsTab')}
            style={styles.menuItem}
          >
            <Text style={styles.menuItemIcon}>🔔</Text>
            <Text style={styles.menuItemLabel}>Hộp thư thông báo</Text>
            <Text style={styles.menuItemChevron}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Server URL Config (Essential for physical Expo Go devices) */}
        <View style={styles.menuSection}>
          <Text style={styles.menuHeading}>KẾT NỐI MÁY CHỦ API</Text>
          <GlassCard style={styles.serverCard}>
            <View style={styles.serverRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.serverLabel}>Địa chỉ API hiện tại</Text>
                {editingUrl ? (
                  <TextInput
                    value={serverUrl}
                    onChangeText={setServerUrl}
                    placeholder="http://192.168.1.x:4000"
                    placeholderTextColor={colors.textMuted}
                    autoCapitalize="none"
                    style={styles.serverInput}
                  />
                ) : (
                  <Text style={styles.serverValue}>{getApiUrl()}</Text>
                )}
              </View>

              <TouchableOpacity
                onPress={() => {
                  if (editingUrl) {
                    handleSaveUrl();
                  } else {
                    setEditingUrl(true);
                  }
                }}
                style={styles.editUrlBtn}
              >
                <Text style={styles.editUrlBtnText}>{editingUrl ? 'Lưu' : 'Đổi'}</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.serverHint}>
              💡 Mẹo: Khi chạy Expo Go trên điện thoại thật, hãy đổi thành IP máy tính (ví dụ: http://192.168.1.15:4000).
            </Text>
          </GlassCard>
        </View>

        {/* Logout Button */}
        {user && (
          <NeonButton
            title="Đăng xuất tài khoản"
            variant="ghost"
            size="md"
            onPress={handleLogout}
            style={{ marginTop: spacing.xl }}
            textStyle={{ color: colors.roseLight }}
          />
        )}
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
    paddingBottom: spacing.xxxl,
  },
  header: {
    marginBottom: spacing.md,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: colors.primaryLight,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#ffffff',
    marginTop: 2,
  },
  userCard: {
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(6, 182, 212, 0.2)',
    borderColor: colors.primary,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.primaryLight,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ffffff',
  },
  userEmail: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 1,
  },
  roleBadge: {
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
    borderColor: 'rgba(234, 179, 8, 0.35)',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  roleBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.goldLight,
    letterSpacing: 0.5,
  },
  unauthCard: {
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  unauthTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ffffff',
  },
  unauthSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginVertical: spacing.sm,
    lineHeight: 16,
  },
  unauthActions: {
    flexDirection: 'row',
    marginTop: spacing.xs,
  },
  adminEntryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(234, 179, 8, 0.12)',
    borderColor: 'rgba(234, 179, 8, 0.4)',
    borderWidth: 1.5,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  adminIconBox: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: 'rgba(234, 179, 8, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminIconText: {
    fontSize: 20,
  },
  adminTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.goldLight,
  },
  adminDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 15,
  },
  adminArrow: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.goldLight,
  },
  menuSection: {
    marginTop: spacing.md,
  },
  menuHeading: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(14, 19, 34, 0.8)',
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  menuItemIcon: {
    fontSize: 18,
    marginRight: spacing.md,
  },
  menuItemLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
    flex: 1,
  },
  menuItemChevron: {
    fontSize: 18,
    color: colors.textMuted,
  },
  serverCard: {
    padding: spacing.md,
  },
  serverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  serverLabel: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '600',
  },
  serverValue: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primaryLight,
    marginTop: 2,
    fontFamily: 'monospace',
  },
  serverInput: {
    backgroundColor: 'rgba(6, 7, 13, 0.8)',
    borderColor: colors.borderCyan,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    height: 36,
    color: '#ffffff',
    fontSize: 12,
    marginTop: 4,
  },
  editUrlBtn: {
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    borderColor: 'rgba(6, 182, 212, 0.3)',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.md,
    marginLeft: spacing.sm,
  },
  editUrlBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primaryLight,
  },
  serverHint: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: spacing.sm,
    lineHeight: 14,
  },
});

