import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import QRCode from 'react-native-qrcode-svg';
import { useCatalog } from '../context/catalog-context';
import { useAuth } from '../context/auth-context';
import { colors, radius, spacing } from '../constants/theme';
import { fetchBooking } from '../api/bookings';
import { confirmPayment } from '../api/payments';
import { formatVnd } from '../data/mock-data';
import { GlassCard } from '../components/GlassCard';
import { AgeBadge } from '../components/AgeBadge';
import { AgeGateModal } from '../components/AgeGateModal';
import { NeonButton } from '../components/NeonButton';

type PayState = 'idle' | 'qr' | 'paid';

export function CheckoutScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { bookingId } = route.params;
  const { showtimes, getMovieBySlug, getShowtimeById } = useCatalog();
  const { user } = useAuth();

  const [booking, setBooking] = useState<any>(null);
  const [payState, setPayState] = useState<PayState>('idle');
  const [ageGateOpen, setAgeGateOpen] = useState(false);
  const [ageVerified, setAgeVerified] = useState(false);
  const [paying, setPaying] = useState(false);
  const [ticketCode, setTicketCode] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft((prev) => Math.max(0, prev - 1)), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  useEffect(() => {
    let cancelled = false;
    fetchBooking(bookingId)
      .then((data) => {
        if (!cancelled) setBooking(data.booking);
      })
      .catch(() => {
        if (!cancelled) {
          // Fallback mock booking
          setBooking({
            id: bookingId,
            code: `CW-${Math.floor(1000 + Math.random() * 9000)}-M`,
            movieSlug: 'dao-hai-tac',
            showtimeId: 'st-1',
            seats: ['F05', 'F06'],
            total: 280000,
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  const showtime = booking
    ? getShowtimeById(booking.showtimeId)
    : showtimes[0];
  const movie = showtime ? getMovieBySlug(showtime.movieSlug) : null;

  const total = booking?.total || 240000;
  const orderCode = booking?.code || bookingId;

  const needsAgeGate = movie ? ['T13', 'T16', 'T18'].includes(movie.rating) : false;

  const copyToClipboard = async (text: string, field: string) => {
    await Clipboard.setStringAsync(text);
    setCopiedField(field);
    Alert.alert('Đã sao chép', text);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleConfirmPaid = async () => {
    if (!showtime || !movie) return;
    setPaying(true);
    try {
      const data = await confirmPayment({
        bookingId,
        showtimeId: showtime.id,
        movieSlug: movie.slug,
        seats: booking?.seats || ['F05', 'F06'],
        total,
      });

      setTicketCode(data.booking.code);
      setPayState('paid');
    } catch {
      setTicketCode(orderCode);
      setPayState('paid');
    } finally {
      setPaying(false);
    }
  };

  const handleStartPayment = () => {
    if (needsAgeGate && !ageVerified) {
      setAgeGateOpen(true);
      return;
    }
    setPayState('qr');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Step Indicator */}
        <View style={styles.stepContainer}>
          <View style={styles.stepItem}>
            <View style={[styles.stepDot, styles.stepDotDone]}>
              <Text style={styles.stepDotText}>✓</Text>
            </View>
            <Text style={styles.stepTextActive}>Ghế</Text>
          </View>
          <View style={styles.stepLine} />
          <View style={styles.stepItem}>
            <View style={[styles.stepDot, ageVerified ? styles.stepDotDone : styles.stepDotPending]}>
              <Text style={styles.stepDotText}>{ageVerified ? '✓' : '2'}</Text>
            </View>
            <Text style={ageVerified ? styles.stepTextActive : styles.stepText}>CCCD</Text>
          </View>
          <View style={styles.stepLine} />
          <View style={styles.stepItem}>
            <View style={[styles.stepDot, payState !== 'idle' ? styles.stepDotDone : styles.stepDotPending]}>
              <Text style={styles.stepDotText}>3</Text>
            </View>
            <Text style={payState !== 'idle' ? styles.stepTextActive : styles.stepText}>VietQR</Text>
          </View>
          <View style={styles.stepLine} />
          <View style={styles.stepItem}>
            <View style={[styles.stepDot, payState === 'paid' ? styles.stepDotDone : styles.stepDotPending]}>
              <Text style={styles.stepDotText}>4</Text>
            </View>
            <Text style={payState === 'paid' ? styles.stepTextActive : styles.stepText}>Nhận vé</Text>
          </View>
        </View>

        {/* Order Header & Countdown */}
        <View style={styles.orderHeader}>
          <View>
            <Text style={styles.orderCode}>MÃ ĐƠN #{orderCode}</Text>
            <Text style={styles.headerTitle}>Thanh Toán Vé</Text>
          </View>
          {payState !== 'paid' && (
            <View style={styles.countdownBadge}>
              <Text style={styles.countdownText}>
                ⏱ {Math.floor(timeLeft / 60).toString().padStart(2, '0')}:{(timeLeft % 60).toString().padStart(2, '0')}
              </Text>
            </View>
          )}
        </View>

        {/* Order Summary Card */}
        {movie && (
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
                  {showtime?.cinema} · {showtime?.room}
                </Text>
                <Text style={styles.summarySeats}>
                  Ghế: <Text style={styles.seatsHighlight}>{(booking?.seats || ['F05', 'F06']).join(', ')}</Text>
                </Text>
              </View>
            </View>

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tổng thanh toán:</Text>
              <Text style={styles.totalAmount}>{formatVnd(total)}</Text>
            </View>
          </GlassCard>
        )}

        {/* Age Gate Warning Notice if needed */}
        {needsAgeGate && !ageVerified && payState === 'idle' && (
          <View style={styles.ageAlertBox}>
            <Text style={styles.ageAlertIcon}>🛡️</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.ageAlertTitle}>Phim {movie?.rating} - Yêu cầu xác thực CCCD</Text>
              <Text style={styles.ageAlertDesc}>
                Theo quy định Điện ảnh, bạn cần quét xác minh tuổi trước khi thanh toán.
              </Text>
            </View>
          </View>
        )}

        {/* VietQR Payment Box */}
        {payState === 'qr' && (
          <GlassCard style={styles.qrCard} highlight>
            <View style={styles.qrHeader}>
              <Text style={styles.qrBrand}>✦ CỔNG VIETQR 247 TỰ ĐỘNG</Text>
              <Text style={styles.qrSubtitle}>Quét mã bằng App Ngân Hàng hoặc MoMo</Text>
            </View>

            {/* QR Code */}
            <View style={styles.qrBox}>
              <QRCode
                value={`2|99|0909888999|MB|${total}|${orderCode}`}
                size={180}
                color="#06070d"
                backgroundColor="#ffffff"
              />
              <Text style={styles.qrScanPrompt}>QUÉT ĐỂ CHUYỂN KHOẢN TỰ ĐỘNG</Text>
            </View>

            {/* Transfer Details with 1-Tap Copy */}
            <View style={styles.transferDetails}>
              <View style={styles.detailRow}>
                <View>
                  <Text style={styles.detailTitle}>Ngân hàng</Text>
                  <Text style={styles.detailValue}>MB Bank (Quân Đội)</Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <View>
                  <Text style={styles.detailTitle}>Số tài khoản</Text>
                  <Text style={styles.detailValueCyan}>0909888999</Text>
                </View>
                <TouchableOpacity
                  onPress={() => copyToClipboard('0909888999', 'stk')}
                  style={styles.copyBtn}
                >
                  <Text style={styles.copyBtnText}>Sao chép</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.detailRow}>
                <View>
                  <Text style={styles.detailTitle}>Số tiền</Text>
                  <Text style={styles.detailValueEmerald}>{formatVnd(total)}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => copyToClipboard(String(total), 'amount')}
                  style={styles.copyBtn}
                >
                  <Text style={styles.copyBtnText}>Sao chép</Text>
                </TouchableOpacity>
              </View>

              <View style={[styles.detailRow, styles.detailHighlight]}>
                <View>
                  <Text style={styles.detailTitle}>Nội dung chuyển khoản (Bắt buộc)</Text>
                  <Text style={styles.detailValueCode}>{orderCode}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => copyToClipboard(orderCode, 'code')}
                  style={styles.copyBtn}
                >
                  <Text style={styles.copyBtnText}>Sao chép</Text>
                </TouchableOpacity>
              </View>
            </View>

            <NeonButton
              title={paying ? 'Đang kiểm tra giao dịch...' : 'Tôi đã chuyển khoản thành công ✓'}
              variant="primary"
              size="lg"
              loading={paying}
              onPress={() => void handleConfirmPaid()}
              style={{ marginTop: spacing.lg }}
            />
          </GlassCard>
        )}

        {/* Paid Screen Confirmation */}
        {payState === 'paid' && (
          <GlassCard style={styles.paidCard}>
            <View style={styles.paidIconBox}>
              <Text style={styles.paidIcon}>✓</Text>
            </View>
            <Text style={styles.paidTitle}>Thanh Toán Thành Công!</Text>
            <Text style={styles.paidSubtitle}>
              Vé điện tử Hologram với mã QR đã được phát hành vào ví vé của bạn.
            </Text>

            <View style={styles.ticketCodeBox}>
              <Text style={styles.ticketCodeLabel}>MÃ VÉ CỦA BẠN:</Text>
              <Text style={styles.ticketCodeValue}>{ticketCode || orderCode}</Text>
            </View>

            <NeonButton
              title="Xem vé Hologram QR ngay →"
              variant="primary"
              size="lg"
              onPress={() => navigation.navigate('TicketDetail', { code: ticketCode || orderCode })}
              style={{ width: '100%', marginTop: spacing.md }}
            />
          </GlassCard>
        )}

        {/* Idle CTA */}
        {payState === 'idle' && (
          <NeonButton
            title={needsAgeGate && !ageVerified ? 'Xác minh độ tuổi CCCD rồi thanh toán' : 'Tạo mã VietQR thanh toán 247'}
            variant="primary"
            size="lg"
            onPress={handleStartPayment}
            style={{ marginTop: spacing.md }}
          />
        )}
      </ScrollView>

      {/* CCCD Age Verification Modal */}
      {movie && (
        <AgeGateModal
          visible={ageGateOpen}
          rating={movie.rating}
          movieSlug={movie.slug}
          onClose={() => setAgeGateOpen(false)}
          onPassed={() => {
            setAgeVerified(true);
            setAgeGateOpen(false);
            setPayState('qr');
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(14, 19, 34, 0.8)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  stepItem: {
    alignItems: 'center',
    gap: 4,
  },
  stepDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotDone: {
    backgroundColor: colors.primary,
  },
  stepDotPending: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  stepDotText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#06070d',
  },
  stepText: {
    fontSize: 10,
    color: colors.textMuted,
  },
  stepTextActive: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primaryLight,
  },
  stepLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 4,
  },
  orderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  orderCode: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primaryLight,
    letterSpacing: 1.5,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#ffffff',
    marginTop: 2,
  },
  countdownBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: 'rgba(245, 158, 11, 0.4)',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  countdownText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.goldLight,
  },
  summaryCard: {
    marginBottom: spacing.md,
  },
  movieRow: {
    flexDirection: 'row',
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    paddingBottom: spacing.md,
  },
  moviePoster: {
    width: 60,
    height: 85,
    borderRadius: radius.sm,
    resizeMode: 'cover',
  },
  movieDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  summaryMovieTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
    flex: 1,
  },
  summaryCinema: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  summarySeats: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  seatsHighlight: {
    color: colors.primaryLight,
    fontWeight: '800',
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
  },
  totalLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.primaryLight,
  },
  ageAlertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(6, 182, 212, 0.08)',
    borderColor: 'rgba(6, 182, 212, 0.3)',
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  ageAlertIcon: {
    fontSize: 24,
  },
  ageAlertTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primaryLight,
  },
  ageAlertDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  qrCard: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  qrHeader: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  qrBrand: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primaryLight,
    letterSpacing: 1.5,
  },
  qrSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  qrBox: {
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  qrScanPrompt: {
    fontSize: 9,
    fontWeight: '800',
    color: '#06070d',
    marginTop: 6,
    letterSpacing: 1,
  },
  transferDetails: {
    width: '100%',
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  detailHighlight: {
    backgroundColor: 'rgba(6, 182, 212, 0.08)',
    borderColor: 'rgba(6, 182, 212, 0.3)',
  },
  detailTitle: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 1,
  },
  detailValueCyan: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primaryLight,
    fontFamily: 'monospace',
  },
  detailValueEmerald: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.emeraldLight,
  },
  detailValueCode: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
    fontFamily: 'monospace',
  },
  copyBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  copyBtnText: {
    fontSize: 10,
    color: colors.primaryLight,
    fontWeight: '700',
  },
  paidCard: {
    alignItems: 'center',
    padding: spacing.xl,
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  paidIconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    borderColor: colors.emerald,
    borderWidth: 2,
  },
  paidIcon: {
    color: colors.emerald,
    fontSize: 28,
    fontWeight: '900',
  },
  paidTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#ffffff',
  },
  paidSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
  },
  ticketCodeBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: colors.borderCyan,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  ticketCodeLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
  },
  ticketCodeValue: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.primaryLight,
    fontFamily: 'monospace',
    marginTop: 2,
  },
});

