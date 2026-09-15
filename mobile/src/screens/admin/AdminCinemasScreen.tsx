import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing } from '../../constants/theme';
import { fetchAdminCinemas, AdminCinema } from '../../api/admin';
import { GlassCard } from '../../components/GlassCard';
import { ApiError } from '../../api/client';

export function AdminCinemasScreen() {
  const navigation = useNavigation<any>();
  const [cinemas, setCinemas] = useState<AdminCinema[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      const data = await fetchAdminCinemas();
      setCinemas(data.cinemas);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không tải được rạp');
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
        <Text style={styles.title}>Quản Lý Rạp</Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
      <FlatList
        data={cinemas}
        keyExtractor={(item) => item.name}
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
        ListEmptyComponent={<Text style={styles.empty}>Chưa có rạp.</Text>}
        renderItem={({ item }) => (
          <GlassCard style={styles.card}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.meta}>
              {item.roomCount} phòng · {item.showtimeCount} suất
            </Text>
            <Text style={styles.rooms}>{item.rooms.join(' · ') || 'Chưa có phòng'}</Text>
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
  name: { fontSize: 15, fontWeight: '800', color: '#fff' },
  meta: { fontSize: 11, color: colors.textSecondary, marginTop: 4 },
  rooms: { fontSize: 11, color: colors.primaryLight, marginTop: 6 },
});
