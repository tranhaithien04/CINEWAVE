import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useCatalog } from '../context/catalog-context';
import { useAuth } from '../context/auth-context';
import { AdminBooking } from '../types';
import { colors, radius, spacing } from '../constants/theme';
import { cancelMyTicket, fetchMyTicket } from '../api/tickets';
import { BoardingTicket } from '../components/BoardingTicket';
import { NeonButton } from '../components/NeonButton';

export function TicketDetailScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { code } = route.params;
  const { getMovieBySlug, getShowtimeById } = useCatalog();
  const { user } = useAuth();

  const [ticket, setTicket] = useState<AdminBooking | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!user) {
      setLoaded(true);
      return;
    }
    void fetchMyTicket(code)
      .then((t) => {
        if (!cancelled) setTicket(t);
      })
      .catch(() => {
        if (!cancelled) setTicket(null);
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [code, user]);

  const movie = ticket ? getMovieBySlug(ticket.movieSlug) : null;
  const showtime = ticket ? getShowtimeById(ticket.showtimeId) : null;

  const handleShare = async () => {
    if (!ticket) return;
    try {
      await Share.share({
        message: `Vé CineWave: ${movie?.title || ticket.movieSlug} | Ghế: ${ticket.seats.join(', ')} | Mã: ${ticket.code}`,
      });
    } catch {
      /* ignore */
    }
  };

  const handleCancel = () => {
    if (!ticket) return;
    setCancelling(true);
    void cancelMyTicket(ticket.code)
      .then((data) => {
        setTicket(data.ticket);
        setConfirmCancel(false);
        Alert.alert('Đã hủy vé', 'Dùng QR hoàn tiền tại quầy trong 7 ngày.');
      })
      .catch((err) => {
        Alert.alert('Lỗi', err instanceof Error ? err.message : 'Không hủy được vé');
      })
      .finally(() => setCancelling(false));
  };

  if (!loaded) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingBox}>
          <Text style={styles.loadingText}>Đang tải vé điện tử Hologram...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!ticket || !movie) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingBox}>
          <Text style={styles.loadingText}>Không tìm thấy vé hoặc cần đăng nhập.</Text>
          <NeonButton title="Quay lại" onPress={() => navigation.goBack()} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>‹ Quay lại</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => void handleShare()} style={styles.shareBtn}>
            <Text style={styles.shareBtnText}>Chia sẻ ↗</Text>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <BoardingTicket
            ticket={ticket}
            movie={movie}
            showtime={showtime || undefined}
            showFullQr
          />

          {user && ticket.status === 'PAID' && (ticket.canCancel || ticket.canReschedule) ? (
            <View style={styles.actionsCard}>
              <Text style={styles.actionsHint}>
                Hủy hoặc đổi suất trước giờ chiếu ít nhất 60 phút. Hủy vé sẽ cấp QR hoàn tiền tại quầy.
              </Text>
              {confirmCancel ? (
                <View style={styles.confirmBox}>
                  <Text style={styles.confirmText}>
                    Hủy vé {ticket.code}? QR vào rạp sẽ hết hiệu lực.
                  </Text>
                  <View style={styles.confirmRow}>
                    <NeonButton
                      title={cancelling ? 'Đang hủy…' : 'Xác nhận hủy'}
                      loading={cancelling}
                      variant="secondary"
                      onPress={handleCancel}
                      style={{ flex: 1, marginRight: spacing.sm }}
                    />
                    <NeonButton
                      title="Giữ vé"
                      variant="outline"
                      onPress={() => setConfirmCancel(false)}
                      style={{ flex: 1 }}
                    />
                  </View>
                </View>
              ) : (
                <View style={styles.actionRow}>
                  {ticket.canReschedule ? (
                    <NeonButton
                      title="Đổi suất cùng giá"
                      variant="outline"
                      onPress={() => navigation.navigate('ChangeShowtime', { code: ticket.code })}
                      style={{ flex: 1, marginRight: spacing.sm }}
                    />
                  ) : null}
                  {ticket.canCancel ? (
                    <NeonButton
                      title="Hủy vé · QR hoàn tiền"
                      variant="secondary"
                      onPress={() => setConfirmCancel(true)}
                      style={{ flex: 1 }}
                    />
                  ) : null}
                </View>
              )}
            </View>
          ) : null}

          <View style={styles.turnstileCard}>
            <Text style={styles.turnstileTitle}>💡 Hướng dẫn check-in tại rạp</Text>
            <Text style={styles.turnstileText}>
              1. Đến trước giờ chiếu 15 phút.{'\n'}
              2. Đưa mã QR có chữ ký này vào máy quét tại cửa phòng chiếu.{'\n'}
              3. Cổng mở cho {ticket.seats.length} khán giả tương ứng số ghế.
            </Text>
          </View>

          <NeonButton
            title="Về ví vé"
            variant="outline"
            size="md"
            onPress={() => navigation.navigate('TicketsTab')}
            style={{ marginTop: spacing.md }}
          />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { paddingVertical: 4 },
  backBtnText: { fontSize: 14, fontWeight: '700', color: colors.primaryLight },
  shareBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  shareBtnText: { fontSize: 11, fontWeight: '700', color: '#ffffff' },
  scrollContent: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  actionsCard: {
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  actionsHint: { fontSize: 11, color: colors.textMuted, lineHeight: 16, marginBottom: spacing.sm },
  actionRow: { flexDirection: 'row' },
  confirmBox: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  confirmText: { fontSize: 12, color: colors.goldLight, marginBottom: spacing.sm },
  confirmRow: { flexDirection: 'row' },
  turnstileCard: {
    backgroundColor: 'rgba(14, 19, 34, 0.85)',
    borderColor: 'rgba(6, 182, 212, 0.25)',
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  turnstileTitle: { fontSize: 12, fontWeight: '800', color: colors.primaryLight, marginBottom: 6 },
  turnstileText: { fontSize: 11, color: colors.textSecondary, lineHeight: 18 },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg, gap: spacing.md },
  loadingText: { fontSize: 13, color: colors.textMuted, textAlign: 'center' },
});
