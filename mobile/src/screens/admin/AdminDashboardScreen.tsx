import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors, radius, spacing } from '../../constants/theme';
import { fetchAdminOverview, fetchAdminRevenue, AdminOverview, RevenueReport } from '../../api/admin';
import { formatVnd } from '../../data/mock-data';
import { GlassCard } from '../../components/GlassCard';

export function AdminDashboardScreen() {
  const navigation = useNavigation<any>();
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [revenue, setRevenue] = useState<RevenueReport | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [ov, rev] = await Promise.all([fetchAdminOverview(), fetchAdminRevenue()]);
      setOverview(ov);
      setRevenue(rev);
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

  const stats = [
    { label: 'Phim Catalog', value: overview?.movies ?? 6, icon: '🎬', color: colors.primary },
    { label: 'Suất Chiếu', value: overview?.showtimes ?? 7, icon: '⏱️', color: '#3b82f6' },
    { label: 'Đơn Hàng', value: overview?.bookings ?? 28, icon: '🎫', color: colors.gold },
    { label: 'Người Dùng', value: overview?.users ?? 152, icon: '👥', color: colors.emerald },
    { label: 'Tổng Doanh Thu', value: formatVnd(overview?.revenue ?? 8450000), icon: '💳', color: '#ec4899', isMoney: true },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>‹ Thoát Admin</Text>
          </TouchableOpacity>

          <View style={styles.titleRow}>
            <Text style={styles.title}>Admin Dashboard</Text>
            <View style={styles.liveBadge}>
              <View style={styles.livePulse} />
              <Text style={styles.liveText}>LIVE SYSTEM</Text>
            </View>
          </View>
          <Text style={styles.subtitle}>
            Báo cáo hiệu suất bán vé, phòng chiếu và người dùng CineWave.
          </Text>
        </View>

        {/* 5 KPI Cards Grid */}
        <View style={styles.kpiGrid}>
          {stats.map((s) => (
            <GlassCard key={s.label} style={styles.kpiCard} highlight>
              <View style={styles.kpiHeader}>
                <Text style={styles.kpiLabel}>{s.label}</Text>
                <Text style={styles.kpiIcon}>{s.icon}</Text>
              </View>
              <Text style={[styles.kpiValue, { color: s.color }]}>{s.value}</Text>
            </GlassCard>
          ))}
        </View>

        {/* Navigation Quick Actions to other Admin modules */}
        <Text style={styles.sectionHeading}>QUẢN LÝ HỆ THỐNG</Text>
        <View style={styles.modulesGrid}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate('AdminBookings')}
            style={styles.moduleBtn}
          >
            <Text style={styles.moduleIcon}>📑</Text>
            <Text style={styles.moduleTitle}>Đơn Hàng</Text>
            <Text style={styles.moduleDesc}>Hủy / Hoàn tiền</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate('AdminMovies')}
            style={styles.moduleBtn}
          >
            <Text style={styles.moduleIcon}>🎥</Text>
            <Text style={styles.moduleTitle}>Quản Lý Phim</Text>
            <Text style={styles.moduleDesc}>Thêm / Sửa / Xóa</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate('AdminShowtimes')}
            style={styles.moduleBtn}
          >
            <Text style={styles.moduleIcon}>🕒</Text>
            <Text style={styles.moduleTitle}>Suất Chiếu</Text>
            <Text style={styles.moduleDesc}>Lịch chiếu rạp</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate('AdminTickets')}
            style={styles.moduleBtn}
          >
            <Text style={styles.moduleIcon}>🎟️</Text>
            <Text style={styles.moduleTitle}>Soát Vé Cổng</Text>
            <Text style={styles.moduleDesc}>Quét / Check-in</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate('AdminUsers')}
            style={styles.moduleBtn}
          >
            <Text style={styles.moduleIcon}>👥</Text>
            <Text style={styles.moduleTitle}>Người Dùng</Text>
            <Text style={styles.moduleDesc}>Phân quyền role</Text>
          </TouchableOpacity>
        </View>

        {/* Revenue Ranking by Movie */}
        {revenue && revenue.byMovie && (
          <View style={styles.revenueSection}>
            <Text style={styles.sectionHeading}>DOANH THU THEO PHIM</Text>
            <GlassCard style={styles.revenueCard}>
              {revenue.byMovie.map((item, idx) => (
                <View key={item.movieSlug} style={styles.revenueRow}>
                  <Text style={styles.rankNumber}>#{idx + 1}</Text>
                  <Text style={styles.rankTitle} numberOfLines={1}>
                    {item.title || item.movieSlug}
                  </Text>
                  <Text style={styles.rankAmount}>{formatVnd(item.total)}</Text>
                </View>
              ))}
            </GlassCard>
          </View>
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
    marginBottom: spacing.lg,
  },
  backBtn: {
    marginBottom: spacing.sm,
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryLight,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#ffffff',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.35)',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
    gap: 5,
  },
  livePulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.emerald,
  },
  liveText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.emeraldLight,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 4,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  kpiCard: {
    width: '48%',
    padding: spacing.md,
  },
  kpiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  kpiLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  kpiIcon: {
    fontSize: 16,
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  sectionHeading: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: colors.textMuted,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  modulesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  moduleBtn: {
    width: '48%',
    backgroundColor: 'rgba(14, 19, 34, 0.85)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  moduleIcon: {
    fontSize: 22,
    marginBottom: 6,
  },
  moduleTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
  moduleDesc: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
  revenueSection: {
    marginTop: spacing.lg,
  },
  revenueCard: {
    padding: spacing.md,
  },
  revenueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  rankNumber: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.goldLight,
    width: 28,
  },
  rankTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
    flex: 1,
  },
  rankAmount: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.emeraldLight,
  },
});

