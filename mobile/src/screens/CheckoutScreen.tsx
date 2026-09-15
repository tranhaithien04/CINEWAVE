import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import { useCatalog } from '../context/catalog-context';
import { useAuth } from '../context/auth-context';
import { colors, radius, spacing } from '../constants/theme';
import { fetchBooking, updateBookingConcessions, type Booking } from '../api/bookings';
import {
  confirmPayment,
  createPaymentIntent,
  fetchPaymentStatus,
} from '../api/payments';
import { fetchConcessions, fetchShowtimeById } from '../api/catalog';
import { ConcessionItem, PaymentInfo, Showtime } from '../types';
import { formatVnd, seatPrice } from '../data/mock-data';
import { GlassCard } from '../components/GlassCard';
import { AgeBadge } from '../components/AgeBadge';
import { AgeGateModal } from '../components/AgeGateModal';
import { NeonButton } from '../components/NeonButton';
import { ConcessionPicker } from '../components/ConcessionPicker';

type PayState = 'idle' | 'qr' | 'paid';

const AGE_GATE_RATINGS = new Set(['T13', 'T16', 'T18']);

function seatTypeFromLabel(label: string): 'STANDARD' | 'VIP' | 'COUPLE' {
  if (label.startsWith('F')) return 'VIP';
  if (label === 'A5' || label === 'A6') return 'COUPLE';
  return 'STANDARD';
}

export function CheckoutScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { bookingId } = route.params;
  const { showtimes, getMovieBySlug, getShowtimeById } = useCatalog();
  const { user, loading: authLoading } = useAuth();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [payment, setPayment] = useState<PaymentInfo | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadingBooking, setLoadingBooking] = useState(true);
  const [payState, setPayState] = useState<PayState>('idle');
  const [ageGateOpen, setAgeGateOpen] = useState(false);
  const [ageVerified, setAgeVerified] = useState(false);
  const [paying, setPaying] = useState(false);
  const [ticketCode, setTicketCode] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [menu, setMenu] = useState<ConcessionItem[]>([]);
  const [comboQty, setComboQty] = useState<Record<string, number>>({});
  const [savingCombo, setSavingCombo] = useState(false);
  const [fetchedShow, setFetchedShow] = useState<Showtime | null>(null);

  const syncExpiry = (iso?: string | null) => {
    if (!iso) return;
    setTimeLeft(Math.max(0, Math.floor((new Date(iso).getTime() - Date.now()) / 1000)));
  };

  const applyPaid = (code: string) => {
    setTicketCode(code);
    setPayState('paid');
  };

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft((prev) => Math.max(0, prev - 1)), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  useEffect(() => {
    void fetchConcessions().then(setMenu).catch(() => setMenu([]));
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoadingBooking(false);
      return;
    }
    let cancelled = false;
    setLoadingBooking(true);
    void fetchBooking(bookingId)
      .then((data) => {
        if (cancelled) return;
        setBooking(data.booking);
        setLoadError(null);
        syncExpiry(data.booking.paymentExpiresAt ?? data.booking.holdExpiresAt);
        if (data.booking.status === 'PAID' || data.booking.status === 'USED') {
          applyPaid(data.booking.code);
        } else if (data.booking.status === 'PENDING_PAYMENT') {
          setPayState('qr');
          void createPaymentIntent(bookingId)
            .then((intent) => {
              if (cancelled) return;
              setBooking(intent.booking);
              setPayment(intent.payment);
              syncExpiry(intent.payment.expiresAt);
            })
            .catch(() => undefined);
        }
        const qty: Record<string, number> = {};
        for (const line of data.booking.concessions ?? []) qty[line.id] = line.qty;
        setComboQty(qty);
      })
      .catch((error) => {
        if (cancelled) return;
        setBooking(null);
        setLoadError(error instanceof Error ? error.message : 'Không tải được đơn');
      })
      .finally(() => {
        if (!cancelled) setLoadingBooking(false);
      });
    return () => {
      cancelled = true;
    };
  }, [authLoading, bookingId, user]);

  useEffect(() => {
    if (!booking?.showtimeId) return;
    if (getShowtimeById(booking.showtimeId)) return;
    let cancelled = false;
    void fetchShowtimeById(booking.showtimeId).then((data) => {
      if (!cancelled && data) setFetchedShow(data);
    });
    return () => {
      cancelled = true;
    };
  }, [booking?.showtimeId, getShowtimeById]);

  useEffect(() => {
    if (payState !== 'qr' || !bookingId) return;
    let cancelled = false;
    const poll = async () => {
      try {
        const data = await fetchPaymentStatus(bookingId);
        if (cancelled) return;
        setBooking(data.booking);
        if (data.payment) setPayment(data.payment);
        if (data.paid) {
          applyPaid(data.booking.code);
          Alert.alert('Thành công', 'SePay đã nhận tiền. Vé đã được phát hành.');
        }
      } catch {
        /* keep polling */
      }
    };
    void poll();
    const timer = setInterval(() => void poll(), 3000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [payState, bookingId]);

  const catalogShow = booking ? getShowtimeById(booking.showtimeId) : null;
  const showtime = catalogShow ?? fetchedShow ?? showtimes.find((s) => s.id === booking?.showtimeId) ?? showtimes[0];
  const movie = showtime ? getMovieBySlug(showtime.movieSlug) : null;

  const seats = useMemo(() => {
    const labels = booking?.seats?.length ? booking.seats : ['F1', 'F2'];
    return labels.map((label) => ({ label, type: seatTypeFromLabel(label) }));
  }, [booking]);

  const total = payment?.amount ?? booking?.total ?? seats.reduce(
    (sum, seat) => sum + seatPrice(showtime?.priceBase ?? 0, seat.type),
    0,
  );

  const transferContent = payment?.content ?? booking?.paymentCode ?? booking?.code ?? bookingId;
  const isSepay = (payment?.provider ?? booking?.paymentProvider) !== 'MOCK';
  const needsAgeGate = movie ? AGE_GATE_RATINGS.has(movie.rating) : false;

  useEffect(() => {
    if (!movie) return;
    setAgeVerified(!AGE_GATE_RATINGS.has(movie.rating));
  }, [movie]);

  const copyToClipboard = async (text: string) => {
    await Clipboard.setStringAsync(text);
    Alert.alert('Đã sao chép', text);
  };

  const startSepayIntent = async () => {
    setPaying(true);
    try {
      const data = await createPaymentIntent(bookingId);
      setBooking(data.booking);
      setPayment(data.payment);
      syncExpiry(data.payment.expiresAt);
      if (data.booking.status === 'PAID' || data.booking.status === 'USED') {
        applyPaid(data.booking.code);
        return;
      }
      setPayState('qr');
      Alert.alert('VietQR', 'Mã VietQR SePay đã sẵn sàng. Quét để chuyển khoản.');
    } catch (error) {
      Alert.alert('Lỗi', error instanceof Error ? error.message : 'Không tạo được mã thanh toán');
    } finally {
      setPaying(false);
    }
  };

  const changeCombo = async (id: string, next: number) => {
    const qty = Math.max(0, Math.min(8, next));
    const preview = { ...comboQty, [id]: qty };
    setComboQty(preview);
    setSavingCombo(true);
    try {
      const items = Object.entries(preview)
        .filter(([, count]) => count > 0)
        .map(([itemId, count]) => ({ id: itemId, qty: count }));
      const data = await updateBookingConcessions(bookingId, items);
      setBooking(data.booking);
    } catch (error) {
      Alert.alert('Lỗi', error instanceof Error ? error.message : 'Không cập nhật được combo');
    } finally {
      setSavingCombo(false);
    }
  };

  const handleConfirmPaid = async () => {
    if (!showtime || !movie) return;
    setPaying(true);
    try {
      if (isSepay) {
        const data = await fetchPaymentStatus(bookingId);
        setBooking(data.booking);
        if (data.paid) {
          applyPaid(data.booking.code);
          Alert.alert('Thành công', 'Thanh toán thành công! Vé đã được phát hành.');
        } else {
          Alert.alert('Chưa nhận tiền', 'Chưa nhận được tiền từ SePay. Quét QR và chuyển đúng nội dung.');
        }
        return;
      }
      const data = await confirmPayment({
        bookingId,
        showtimeId: showtime.id,
        movieSlug: movie.slug,
        seats: seats.map((s) => s.label),
        total,
      });
      applyPaid(data.booking.code);
      Alert.alert('Thành công', 'Thanh toán thành công! Vé đã được phát hành.');
    } catch (error) {
      Alert.alert('Lỗi', error instanceof Error ? error.message : 'Thanh toán thất bại');
    } finally {
      setPaying(false);
    }
  };

  const handleStartPayment = () => {
    if (needsAgeGate && !ageVerified) {
      setAgeGateOpen(true);
      return;
    }
    void startSepayIntent();
  };

  const formatCountdown = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (authLoading || loadingBooking) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ActivityIndicator color={colors.primaryLight} style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerBox}>
          <Text style={styles.headerTitle}>Cần đăng nhập</Text>
          <Text style={styles.muted}>Đăng nhập để giữ ghế và thanh toán.</Text>
          <NeonButton title="Đăng nhập ngay" onPress={() => navigation.navigate('Login')} />
        </View>
      </SafeAreaView>
    );
  }

  if (loadError && !booking) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerBox}>
          <Text style={styles.errorText}>{loadError}</Text>
          <NeonButton title="Thử lại" onPress={() => navigation.goBack()} />
        </View>
      </SafeAreaView>
    );
  }

  if (!showtime || !movie) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerBox}>
          <Text style={styles.headerTitle}>Không tìm thấy suất</Text>
          <NeonButton title="Quay lại" onPress={() => navigation.goBack()} />
        </View>
      </SafeAreaView>
    );
  }

  const orderCode = booking?.code ?? bookingId;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.orderHeader}>
          <View>
            <Text style={styles.orderCode}>MÃ ĐƠN #{orderCode}</Text>
            <Text style={styles.headerTitle}>Thanh Toán Vé</Text>
          </View>
          {payState !== 'paid' && timeLeft > 0 ? (
            <View style={styles.countdownBadge}>
              <Text style={styles.countdownText}>⏱ {formatCountdown(timeLeft)}</Text>
            </View>
          ) : null}
        </View>

        <GlassCard style={styles.summaryCard} highlight>
          <View style={styles.movieRow}>
            <Image source={{ uri: movie.posterUrl }} style={styles.moviePoster} />
            <View style={styles.movieDetails}>
              <View style={styles.titleRow}>
                <Text style={styles.summaryMovieTitle} numberOfLines={1}>
                  {movie.title}
                </Text>
                <AgeBadge rating={movie.rating} size="sm" />
              </View>
              <Text style={styles.summaryCinema}>
                {showtime.cinema} · {showtime.room}
              </Text>
              <Text style={styles.summarySeats}>
                Ghế: <Text style={styles.seatsHighlight}>{seats.map((s) => s.label).join(', ')}</Text>
              </Text>
              {(booking?.concessions ?? []).length ? (
                <Text style={styles.comboLine}>
                  Combo: {booking!.concessions!.map((l) => `${l.name} × ${l.qty}`).join(', ')}
                </Text>
              ) : null}
            </View>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tổng thanh toán:</Text>
            <Text style={styles.totalAmount}>{formatVnd(total)}</Text>
          </View>
        </GlassCard>

        {payState === 'idle' && menu.length > 0 ? (
          <GlassCard style={{ padding: spacing.md, marginBottom: spacing.md }}>
            <ConcessionPicker
              items={menu}
              qty={comboQty}
              disabled={savingCombo || paying}
              onChange={(id, next) => void changeCombo(id, next)}
            />
          </GlassCard>
        ) : null}

        {needsAgeGate && !ageVerified && payState === 'idle' ? (
          <View style={styles.ageAlertBox}>
            <Text style={styles.ageAlertTitle}>Phim {movie.rating} — xác thực CCCD</Text>
            <Text style={styles.ageAlertDesc}>
              Xác minh thẻ CCCD/VNeID bằng AI trước khi tạo mã QR thanh toán.
            </Text>
          </View>
        ) : null}

        {payState === 'qr' ? (
          <GlassCard style={styles.qrCard} highlight>
            <Text style={styles.qrBrand}>
              {isSepay ? '✦ CỔNG SEPAY · VIETQR 247' : '✦ CHẾ ĐỘ DEMO · MOCK'}
            </Text>
            <Text style={styles.qrSubtitle}>
              {isSepay
                ? 'Hệ thống tự xác nhận khi SePay báo đã nhận tiền (mỗi 3 giây).'
                : 'Bấm xác nhận để phát hành vé ngay.'}
            </Text>

            <View style={styles.qrBox}>
              {payment?.qrUrl ? (
                <Image source={{ uri: payment.qrUrl }} style={styles.qrImage} resizeMode="contain" />
              ) : (
                <Text style={styles.qrMissing}>Chưa có QR SePay. Kiểm tra cấu hình backend.</Text>
              )}
            </View>

            <View style={styles.transferDetails}>
              <Text style={styles.detailValue}>{payment?.bankLabel ?? 'MB Bank'}</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailValueCyan}>{payment?.accountNumber ?? '—'}</Text>
                <TouchableOpacity onPress={() => copyToClipboard(payment?.accountNumber ?? '')}>
                  <Text style={styles.copyBtnText}>Sao chép STK</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailValueEmerald}>{formatVnd(total)}</Text>
                <TouchableOpacity onPress={() => copyToClipboard(String(total))}>
                  <Text style={styles.copyBtnText}>Sao chép</Text>
                </TouchableOpacity>
              </View>
              <View style={[styles.detailRow, styles.detailHighlight]}>
                <Text style={styles.detailValueCode}>{transferContent}</Text>
                <TouchableOpacity onPress={() => copyToClipboard(transferContent)}>
                  <Text style={styles.copyBtnText}>Sao chép ND</Text>
                </TouchableOpacity>
              </View>
            </View>

            <NeonButton
              title={
                paying
                  ? 'Đang kiểm tra giao dịch...'
                  : isSepay
                    ? 'Tôi đã chuyển khoản — kiểm tra lại'
                    : 'Tôi đã chuyển khoản thành công'
              }
              loading={paying}
              onPress={() => void handleConfirmPaid()}
              style={{ marginTop: spacing.lg }}
            />
          </GlassCard>
        ) : null}

        {payState === 'paid' ? (
          <GlassCard style={styles.paidCard}>
            <Text style={styles.paidTitle}>Thanh Toán Thành Công!</Text>
            <Text style={styles.paidSubtitle}>Vé Hologram QR đã sẵn sàng trong ví vé.</Text>
            <Text style={styles.ticketCodeValue}>{ticketCode || orderCode}</Text>
            <NeonButton
              title="Xem vé Hologram QR →"
              onPress={() => navigation.navigate('TicketDetail', { code: ticketCode || orderCode })}
            />
          </GlassCard>
        ) : null}

        {payState === 'idle' ? (
          <NeonButton
            title={
              needsAgeGate && !ageVerified
                ? 'Xác minh độ tuổi CCCD rồi thanh toán'
                : 'Tạo mã VietQR SePay'
            }
            loading={paying}
            onPress={handleStartPayment}
            style={{ marginTop: spacing.md }}
          />
        ) : null}
      </ScrollView>

      {movie ? (
        <AgeGateModal
          visible={ageGateOpen}
          rating={movie.rating}
          movieSlug={movie.slug}
          bookingId={bookingId}
          showtimeId={showtime.id}
          onClose={() => setAgeGateOpen(false)}
          onPassed={() => {
            setAgeVerified(true);
            setAgeGateOpen(false);
            void startSepayIntent();
          }}
        />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xxxl },
  centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg, gap: spacing.md },
  muted: { fontSize: 12, color: colors.textSecondary, textAlign: 'center' },
  errorText: { color: colors.roseLight, textAlign: 'center' },
  orderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  orderCode: { fontSize: 10, fontWeight: '800', color: colors.primaryLight, letterSpacing: 1.5 },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#ffffff', marginTop: 2 },
  countdownBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: 'rgba(245, 158, 11, 0.4)',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  countdownText: { fontSize: 11, fontWeight: '800', color: colors.goldLight },
  summaryCard: { marginBottom: spacing.md },
  movieRow: { flexDirection: 'row', gap: spacing.md, paddingBottom: spacing.sm },
  moviePoster: { width: 60, height: 85, borderRadius: radius.sm },
  movieDetails: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  summaryMovieTitle: { fontSize: 16, fontWeight: '800', color: '#ffffff', flex: 1 },
  summaryCinema: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  summarySeats: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
  comboLine: { fontSize: 10, color: colors.goldLight, marginTop: 4 },
  seatsHighlight: { color: colors.primaryLight, fontWeight: '800' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: spacing.sm },
  totalLabel: { fontSize: 12, color: colors.textSecondary },
  totalAmount: { fontSize: 20, fontWeight: '900', color: colors.primaryLight },
  ageAlertBox: {
    backgroundColor: 'rgba(6, 182, 212, 0.08)',
    borderColor: 'rgba(6, 182, 212, 0.3)',
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  ageAlertTitle: { fontSize: 12, fontWeight: '800', color: colors.primaryLight },
  ageAlertDesc: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  qrCard: { padding: spacing.lg, alignItems: 'center' },
  qrBrand: { fontSize: 11, fontWeight: '800', color: colors.primaryLight, letterSpacing: 1.2 },
  qrSubtitle: { fontSize: 11, color: colors.textSecondary, marginTop: 4, textAlign: 'center' },
  qrBox: {
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: radius.lg,
    marginTop: spacing.md,
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrImage: { width: 196, height: 196 },
  qrMissing: { fontSize: 11, color: '#333', textAlign: 'center', padding: 8 },
  transferDetails: { width: '100%', marginTop: spacing.lg, gap: spacing.sm },
  detailRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  detailHighlight: {
    backgroundColor: 'rgba(6, 182, 212, 0.08)',
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  detailValue: { fontSize: 12, fontWeight: '700', color: '#ffffff' },
  detailValueCyan: { fontSize: 13, fontWeight: '800', color: colors.primaryLight, fontFamily: 'monospace' },
  detailValueEmerald: { fontSize: 13, fontWeight: '800', color: colors.emeraldLight },
  detailValueCode: { fontSize: 13, fontWeight: '800', color: '#ffffff', fontFamily: 'monospace', flex: 1 },
  copyBtnText: { fontSize: 10, color: colors.primaryLight, fontWeight: '700' },
  paidCard: { alignItems: 'center', padding: spacing.xl },
  paidTitle: { fontSize: 20, fontWeight: '900', color: '#ffffff' },
  paidSubtitle: { fontSize: 12, color: colors.textSecondary, marginTop: 4, textAlign: 'center' },
  ticketCodeValue: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.primaryLight,
    fontFamily: 'monospace',
    marginVertical: spacing.md,
  },
});
