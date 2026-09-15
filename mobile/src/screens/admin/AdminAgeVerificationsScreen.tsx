import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing } from '../../constants/theme';
import { AdminAgeVerification, fetchAdminAgeVerifications } from '../../api/admin';
import { GlassCard } from '../../components/GlassCard';
import { ApiError } from '../../api/client';

export function AdminAgeVerificationsScreen() {
  const navigation = useNavigation<any>();
  const [items, setItems] = useState<AdminAgeVerification[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      const data = await fetchAdminAgeVerifications();
      setItems(data.verifications);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không tải được lịch sử xác minh');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹ Dashboard</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Xác Minh CCCD</Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
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
        ListEmptyComponent={<Text style={styles.empty}>Chưa có lượt xác minh.</Text>}
        renderItem={({ item }) => (
          <GlassCard style={styles.card}>
            <Text style={[styles.status, item.passed ? styles.pass : styles.fail]}>
              {item.passed ? 'PASSED' : 'FAILED'}
            </Text>
            <Text style={styles.meta}>
              {item.movieSlug || '—'} · {item.rating || '—'} · yêu cầu {item.requiredAge}+
            </Text>
            <Text style={styles.meta}>
              Tuổi: {item.computedAge ?? '—'} · thẻ {item.idMasked || '****'}
            </Text>
            {item.failureReason ? <Text style={styles.failReason}>{item.failureReason}</Text> : null}
            <Text style={styles.time}>{new Date(item.createdAt).toLocaleString('vi-VN')}</Text>
          </GlassCard>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  back: { color: colors.primaryLight, fontWeight: '700', marginBottom: 6 },
  title: { fontSize: 22, fontWeight: '900', color: '#fff' },
  error: { color: colors.roseLight, marginTop: 6 },
  list: { padding: spacing.lg, gap: spacing.sm },
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: 40 },
  card: { padding: spacing.md },
  status: { fontSize: 12, fontWeight: '900', letterSpacing: 0.8 },
  pass: { color: colors.emeraldLight },
  fail: { color: colors.roseLight },
  meta: { fontSize: 11, color: colors.textSecondary, marginTop: 4 },
  failReason: { fontSize: 11, color: colors.goldLight, marginTop: 4 },
  time: { fontSize: 10, color: colors.textMuted, marginTop: 6 },
});
