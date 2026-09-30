import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ApiError } from '../api/client';
import { checkInTicket, inspectTicket } from '../api/tickets';
import { useAuth } from '../context/auth-context';
import { useCatalog } from '../context/catalog-context';
import { AdminBooking } from '../types';
import { colors, radius, spacing } from '../constants/theme';
import { formatVnd } from '../data/mock-data';
import { NeonButton } from '../components/NeonButton';
import { GlassCard } from '../components/GlassCard';
import { AgeBadge } from '../components/AgeBadge';

export function GateScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const code = String(route.params?.code || '').toUpperCase();
  const sig = String(route.params?.sig || '');
  const { user, loading: authLoading } = useAuth();
  const { getMovieBySlug, getShowtimeById } = useCatalog();
  const [ticket, setTicket] = useState<AdminBooking | null>(null);
  const [validForEntry, setValidForEntry] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [loading, setLoading] = useState(true);
  const canCheckIn = user?.role === 'ADMIN' || user?.role === 'STAFF';

  useEffect(() => {
    if (!code) {
      setError('Thiếu mã vé');
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void inspectTicket(code, sig)
      .then((data) => {
        if (cancelled) return;
        setTicket(data.ticket);
        setValidForEntry(data.validForEntry);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setTicket(null);
        setError(err instanceof ApiError ? err.message : 'Không đọc được vé');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [code, sig]);

  const handleCheckIn = async () => {
    setChecking(true);
    try {
      const data = await checkInTicket(code, sig || undefined);
      setTicket(data.ticket);
      setValidForEntry(false);
      Alert.alert('Check-in', `Đã check-in ${data.ticket.code}`);
    } catch (err) {
      Alert.alert('Lỗi', err instanceof ApiError ? err.message : 'Không check-in được');
    } finally {
      setChecking(false);
    }
  };

  const movie = ticket ? getMovieBySlug(ticket.movieSlug) : null;
  const showtime = ticket ? getShowtimeById(ticket.showtimeId) : null;
  const used = ticket?.status === 'USED';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <TouchableOpacity
          onPress={() =>
            navigation.navigate(canCheckIn ? 'StaffScan' : 'MainTabs', canCheckIn ? undefined : { screen: 'TicketsTab' })
          }
        >
          <Text style={styles.back}>{canCheckIn ? '‹ Soát vé' : '‹ Vé của tôi'}</Text>
        </TouchableOpacity>

        <Text style={styles.eyebrow}>CỔNG SOÁT VÉ</Text>
        <Text style={styles.title}>Xác thực mã QR</Text>

        {loading || authLoading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.muted}>Đang xác thực mã vé…</Text>
          </View>
        ) : error ? (
          <GlassCard style={styles.errorCard}>
            <Text style={styles.errorTitle}>QR không hợp lệ</Text>
            <Text style={styles.muted}>{error}</Text>
          </GlassCard>
        ) : ticket ? (
          <GlassCard style={styles.card} highlight>
            <View style={styles.headerRow}>
              <Text style={styles.cardEyebrow}>THÔNG TIN VÉ</Text>
              <View
                style={[
                  styles.badge,
                  used
                    ? styles.badgeMuted
                    : validForEntry
                      ? styles.badgeOk
                      : styles.badgeBad,
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    used
                      ? styles.badgeTextMuted
                      : validForEntry
                        ? styles.badgeTextOk
                        : styles.badgeTextBad,
                  ]}
                >
                  {used ? 'Đã vào rạp' : validForEntry ? 'Hợp lệ — chờ vào' : ticket.status}
                </Text>
              </View>
            </View>

            <View style={styles.movieRow}>
              {movie ? <AgeBadge rating={movie.rating} size="sm" /> : null}
              <Text style={styles.movieTitle}>{movie?.title ?? ticket.movieSlug}</Text>
            </View>
            <Text style={styles.muted}>
              {showtime ? `${showtime.cinema} · ${showtime.room}` : ticket.showtimeId}
            </Text>

            <View style={styles.metaGrid}>
              <View style={styles.metaCell}>
                <Text style={styles.metaLabel}>Mã vé</Text>
                <Text style={styles.metaCode}>{ticket.code}</Text>
              </View>
              <View style={styles.metaCell}>
                <Text style={styles.metaLabel}>Ghế</Text>
                <Text style={styles.metaValue}>{ticket.seats.join(', ')}</Text>
              </View>
              <View style={styles.metaCell}>
                <Text style={styles.metaLabel}>Tổng tiền</Text>
                <Text style={styles.metaMoney}>{formatVnd(ticket.total)}</Text>
              </View>
              <View style={styles.metaCell}>
                <Text style={styles.metaLabel}>Check-in</Text>
                <Text style={styles.metaValue}>
                  {ticket.checkedInAt
                    ? new Date(ticket.checkedInAt).toLocaleTimeString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'Chưa'}
                </Text>
              </View>
            </View>

            {used ? (
              <Text style={styles.okMsg}>Vé đã được sử dụng. Không check-in lần hai.</Text>
            ) : validForEntry && canCheckIn ? (
              <NeonButton
                title={checking ? 'Đang check-in…' : 'Cho khách vào rạp'}
                loading={checking}
                onPress={() => void handleCheckIn()}
                style={{ marginTop: spacing.md }}
              />
            ) : validForEntry && !canCheckIn ? (
              <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
                <Text style={styles.warnMsg}>Chỉ nhân viên / admin mới check-in được.</Text>
                <NeonButton
                  title="Đăng nhập nhân viên"
                  variant="outline"
                  onPress={() =>
                    navigation.navigate('Login', {
                      next: 'Gate',
                      nextParams: { code, sig },
                    })
                  }
                />
              </View>
            ) : null}
          </GlassCard>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  center: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xl, gap: spacing.sm },
  back: { color: colors.primaryLight, fontWeight: '700', marginBottom: spacing.md },
  eyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5, color: colors.primaryLight },
  title: { fontSize: 22, fontWeight: '900', color: '#ffffff', marginTop: 4 },
  muted: { fontSize: 12, color: colors.textSecondary, marginTop: 6, lineHeight: 16 },
  errorCard: {
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderColor: 'rgba(244,63,94,0.35)',
    backgroundColor: 'rgba(244,63,94,0.1)',
  },
  errorTitle: { color: colors.roseLight, fontWeight: '800', fontSize: 14 },
  card: { marginTop: spacing.lg, padding: spacing.lg },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  cardEyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 1.2, color: colors.primaryLight },
  badge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  badgeOk: { backgroundColor: 'rgba(16,185,129,0.18)' },
  badgeBad: { backgroundColor: 'rgba(244,63,94,0.18)' },
  badgeMuted: { backgroundColor: 'rgba(255,255,255,0.08)' },
  badgeText: { fontSize: 11, fontWeight: '800' },
  badgeTextOk: { color: colors.emeraldLight },
  badgeTextBad: { color: colors.roseLight },
  badgeTextMuted: { color: colors.textSecondary },
  movieRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: spacing.sm },
  movieTitle: { fontSize: 18, fontWeight: '900', color: '#fff', flex: 1 },
  metaGrid: {
    marginTop: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(0,0,0,0.28)',
    padding: spacing.md,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  metaCell: { width: '45%', minWidth: 120 },
  metaLabel: { fontSize: 10, color: colors.textMuted, marginBottom: 2 },
  metaValue: { fontSize: 13, fontWeight: '800', color: '#fff' },
  metaCode: { fontSize: 13, fontWeight: '900', color: colors.primaryLight, fontFamily: 'monospace' },
  metaMoney: { fontSize: 13, fontWeight: '800', color: colors.emeraldLight },
  okMsg: { marginTop: spacing.md, color: colors.emeraldLight, fontWeight: '700', fontSize: 13 },
  warnMsg: { color: colors.goldLight, fontWeight: '600', fontSize: 12 },
});
