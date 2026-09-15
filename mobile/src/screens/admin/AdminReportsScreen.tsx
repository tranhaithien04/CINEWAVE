import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing } from '../../constants/theme';
import { fetchAdminRevenue, RevenueReport } from '../../api/admin';
import { GlassCard } from '../../components/GlassCard';
import { formatVnd } from '../../data/mock-data';
import { ApiError } from '../../api/client';

export function AdminReportsScreen() {
  const navigation = useNavigation<any>();
  const [report, setReport] = useState<RevenueReport | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      const data = await fetchAdminRevenue();
      setReport(data);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không tải được báo cáo');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void load();
            }}
            tintColor={colors.primary}
          />
        }
      >
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹ Dashboard</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Báo Cáo Doanh Thu</Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <GlassCard style={styles.card} highlight>
          <Text style={styles.label}>Tổng doanh thu</Text>
          <Text style={styles.total}>{formatVnd(report?.total ?? 0)}</Text>
          <Text style={styles.meta}>Đơn đã thanh toán: {report?.paidCount ?? 0}</Text>
          {report?.seatRevenue != null ? (
            <Text style={styles.meta}>Ghế: {formatVnd(report.seatRevenue)}</Text>
          ) : null}
          {report?.concessionRevenue != null ? (
            <Text style={styles.meta}>Combo: {formatVnd(report.concessionRevenue)}</Text>
          ) : null}
        </GlassCard>

        <Text style={styles.section}>THEO PHIM</Text>
        {(report?.byMovie || []).map((item, idx) => (
          <GlassCard key={item.movieSlug} style={styles.rowCard}>
            <Text style={styles.rank}>#{idx + 1}</Text>
            <Text style={styles.rowTitle} numberOfLines={1}>
              {item.title || item.movieSlug}
            </Text>
            <Text style={styles.amount}>{formatVnd(item.total)}</Text>
          </GlassCard>
        ))}

        {(report?.byCinema || []).length ? (
          <>
            <Text style={styles.section}>THEO RẠP</Text>
            {report!.byCinema!.map((item) => (
              <GlassCard key={item.cinema} style={styles.rowCard}>
                <Text style={styles.rowTitle}>{item.cinema}</Text>
                <Text style={styles.amount}>{formatVnd(item.total)}</Text>
              </GlassCard>
            ))}
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl, gap: spacing.sm },
  back: { color: colors.primaryLight, fontWeight: '700', marginBottom: 6 },
  title: { fontSize: 22, fontWeight: '900', color: '#fff', marginBottom: spacing.md },
  error: { color: colors.roseLight },
  card: { padding: spacing.lg },
  label: { fontSize: 11, color: colors.textMuted, fontWeight: '700' },
  total: { fontSize: 26, fontWeight: '900', color: colors.emeraldLight, marginTop: 4 },
  meta: { fontSize: 11, color: colors.textSecondary, marginTop: 4 },
  section: {
    marginTop: spacing.md,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: colors.textMuted,
  },
  rowCard: { padding: spacing.md, flexDirection: 'row', alignItems: 'center', gap: 8 },
  rank: { color: colors.goldLight, fontWeight: '800', width: 28 },
  rowTitle: { flex: 1, color: '#fff', fontWeight: '700', fontSize: 12 },
  amount: { color: colors.emeraldLight, fontWeight: '800', fontSize: 12 },
});
