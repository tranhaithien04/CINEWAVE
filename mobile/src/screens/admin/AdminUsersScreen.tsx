import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors, radius, spacing } from '../../constants/theme';
import { fetchAdminUsers, updateUserRole, AdminUser } from '../../api/admin';
import { GlassCard } from '../../components/GlassCard';

export function AdminUsersScreen() {
  const navigation = useNavigation<any>();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const data = await fetchAdminUsers();
      setUsers(data);
    } catch {
      // Keep state
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    void loadData();
  };

  const handleToggleRole = (u: AdminUser) => {
    const nextRole = u.role === 'ADMIN' ? 'CUSTOMER' : 'ADMIN';
    Alert.alert('Đổi quyền tài khoản', `Đổi quyền của ${u.email} thành ${nextRole}?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Cập nhật',
        onPress: async () => {
          try {
            await updateUserRole(u.id, nextRole);
            setUsers((prev) =>
              prev.map((item) => (item.id === u.id ? { ...item, role: nextRole } : item))
            );
            Alert.alert('Thành công', `Tài khoản hiện có vai trò ${nextRole}.`);
          } catch {
            setUsers((prev) =>
              prev.map((item) => (item.id === u.id ? { ...item, role: nextRole } : item))
            );
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>‹ Dashboard</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Quản Lý Người Dùng ({users.length})</Text>
          <Text style={styles.subtitle}>Danh sách thành viên và phân quyền quản trị.</Text>
        </View>

        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          renderItem={({ item }) => (
            <GlassCard style={styles.card}>
              <View style={styles.userRow}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {(item.fullName || item.email).charAt(0).toUpperCase()}
                  </Text>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.userName}>{item.fullName || 'Thành viên CineWave'}</Text>
                  <Text style={styles.userEmail}>{item.email}</Text>
                  <View
                    style={[
                      styles.roleTag,
                      item.role === 'ADMIN' ? styles.roleAdmin : styles.roleCustomer,
                    ]}
                  >
                    <Text
                      style={[
                        styles.roleText,
                        item.role === 'ADMIN' ? styles.roleTextAdmin : styles.roleTextCustomer,
                      ]}
                    >
                      {item.role === 'ADMIN' ? '👑 ADMIN' : '👤 KHÁCH HÀNG'}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={() => handleToggleRole(item)}
                  style={styles.switchRoleBtn}
                >
                  <Text style={styles.switchRoleBtnText}>
                    {item.role === 'ADMIN' ? 'Hạ quyền' : 'Nâng Admin'}
                  </Text>
                </TouchableOpacity>
              </View>
            </GlassCard>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    marginBottom: spacing.xs,
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryLight,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  list: {
    padding: spacing.lg,
    gap: spacing.sm,
    paddingBottom: spacing.xxxl,
  },
  card: {
    padding: spacing.md,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: colors.borderCyan,
    borderWidth: 1,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.primaryLight,
  },
  userName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },
  userEmail: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
  roleTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
    borderWidth: 1,
  },
  roleAdmin: {
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
    borderColor: 'rgba(234, 179, 8, 0.35)',
  },
  roleCustomer: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  roleText: {
    fontSize: 9,
    fontWeight: '800',
  },
  roleTextAdmin: {
    color: colors.goldLight,
  },
  roleTextCustomer: {
    color: colors.textSecondary,
  },
  switchRoleBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: colors.borderLight,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.sm,
  },
  switchRoleBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primaryLight,
  },
});

