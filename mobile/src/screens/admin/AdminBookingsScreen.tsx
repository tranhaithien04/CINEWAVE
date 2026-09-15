import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors, radius, spacing } from '../../constants/theme';
import { fetchAdminBookings, cancelAdminBooking, refundAdminBooking } from '../../api/admin';
import { AdminBooking } from '../../types';
import { formatVnd } from '../../data/mock-data';
import { GlassCard } from '../../components/GlassCard';
import { ApiError } from '../../api/client';

export function AdminBookingsScreen() {
  const navigation = useNavigation<any>();
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const data = await fetchAdminBookings();
      setBookings(data);
    } catch {
      setBookings([]);
      Alert.alert('Lỗi', 'Không tải được danh sách đơn hàng.');
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

  const handleCancel = (booking: AdminBooking) => {
    Alert.alert('Hủy đơn hàng', `Bạn có chắc muốn hủy đơn ${booking.code}?`, [
      { text: 'Không', style: 'cancel' },
      {
        text: 'Hủy đơn',
        style: 'destructive',
        onPress: async () => {
          try {
            await cancelAdminBooking(booking.id);
            setBookings((prev) =>
              prev.map((b) => (b.id === booking.id ? { ...b, status: 'CANCELLED' } : b))
            );
            Alert.alert('Thành công', 'Đã hủy đơn hàng.');
          } catch (err) {
            Alert.alert('Lỗi', err instanceof ApiError ? err.message : 'Không hủy được đơn');
          }
        },
      },
    ]);
  };

  const handleRefund = (booking: AdminBooking) => {
    Alert.alert('Hoàn tiền', `Hoàn tiền cho đơn ${booking.code} (${formatVnd(booking.total)})?`, [
      { text: 'Không', style: 'cancel' },
      {
        text: 'Hoàn tiền',
        onPress: async () => {
          try {
            await refundAdminBooking(booking.id);
            setBookings((prev) =>
              prev.map((b) => (b.id === booking.id ? { ...b, status: 'REFUNDED' } : b))
            );
            Alert.alert('Thành công', 'Đã hoàn tiền đơn hàng.');
          } catch (err) {
            Alert.alert('Lỗi', err instanceof ApiError ? err.message : 'Không hoàn tiền được');
          }
        },
      },
    ]);
  };

  const filtered = bookings.filter(
    (b) =>
      b.code.toLowerCase().includes(search.toLowerCase()) ||
      (b.userEmail || '').toLowerCase().includes(search.toLowerCase()) ||
      b.movieSlug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>‹ Dashboard</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Quản Lý Đơn Hàng</Text>

          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Tìm theo mã đơn hoặc email..."
            placeholderTextColor={colors.textMuted}
            style={styles.searchInput}
          />
        </View>

        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          renderItem={({ item }) => (
            <GlassCard style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.codeText}>#{item.code}</Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{item.status}</Text>
                </View>
              </View>

              <Text style={styles.userText}>{item.userEmail || 'Khách vãng lai'}</Text>
              <Text style={styles.movieText}>Phim: {item.movieSlug}</Text>
              <Text style={styles.seatsText}>Ghế: {item.seats.join(', ')}</Text>
              <Text style={styles.totalText}>{formatVnd(item.total)}</Text>

              <View style={styles.actionRow}>
                {item.status !== 'CANCELLED' && item.status !== 'REFUNDED' && (
                  <>
                    <TouchableOpacity onPress={() => handleCancel(item)} style={styles.cancelBtn}>
                      <Text style={styles.cancelBtnText}>Hủy đơn</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleRefund(item)} style={styles.refundBtn}>
                      <Text style={styles.refundBtnText}>Hoàn tiền</Text>
                    </TouchableOpacity>
                  </>
                )}
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
    marginBottom: spacing.sm,
  },
  searchInput: {
    backgroundColor: 'rgba(14, 19, 34, 0.9)',
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 42,
    color: '#ffffff',
    fontSize: 13,
  },
  list: {
    padding: spacing.lg,
    gap: spacing.sm,
    paddingBottom: spacing.xxxl,
  },
  card: {
    padding: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  codeText: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.primaryLight,
    fontFamily: 'monospace',
  },
  badge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#ffffff',
  },
  userText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  movieText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '700',
    marginTop: 2,
  },
  seatsText: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  totalText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.emeraldLight,
    marginTop: 4,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    paddingTop: spacing.sm,
  },
  cancelBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.35)',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  cancelBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.roseLight,
  },
  refundBtn: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.35)',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  refundBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.goldLight,
  },
});

