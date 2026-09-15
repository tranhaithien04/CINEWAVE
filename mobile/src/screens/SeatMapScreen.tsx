import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useCatalog } from '../context/catalog-context';
import { useAuth } from '../context/auth-context';
import { Seat } from '../types';
import { colors, radius, spacing } from '../constants/theme';
import { buildSeatMap, formatVnd, seatPrice } from '../data/mock-data';
import { holdSeats } from '../api/bookings';
import { fetchShowtimeById, fetchShowtimeSeats } from '../api/catalog';
import { rescheduleMyTicket } from '../api/tickets';
import { couplePartner, isSeatTaken, MAX_SEATS_PER_BOOKING } from '../utils/seat';
import { Showtime } from '../types';
import { ScreenCurve } from '../components/ScreenCurve';
import { SeatButton } from '../components/SeatButton';
import { HoldTimer } from '../components/HoldTimer';
import { NeonButton } from '../components/NeonButton';

export function SeatMapScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { showtimeId, changeTicket } = route.params as { showtimeId: string; changeTicket?: string };
  const { getShowtimeById, getMovieBySlug } = useCatalog();
  const { user } = useAuth();

  const catalogShow = getShowtimeById(showtimeId);
  const [showtime, setShowtime] = useState<Showtime | null>(catalogShow);
  const movie = showtime ? getMovieBySlug(showtime.movieSlug) : null;
  const changing = Boolean(changeTicket);

  const [seats, setSeats] = useState<Seat[]>(() => buildSeatMap());

  useEffect(() => {
    if (catalogShow) {
      setShowtime(catalogShow);
      return;
    }
    let cancelled = false;
    void fetchShowtimeById(showtimeId).then((data) => {
      if (!cancelled) setShowtime(data);
    });
    return () => {
      cancelled = true;
    };
  }, [catalogShow, showtimeId]);

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      void fetchShowtimeSeats(showtimeId).then((data) => {
        if (!cancelled && data.length) setSeats(data);
      });
    };
    load();
    const timer = setInterval(load, 5000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [showtimeId]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');
  const [holding, setHolding] = useState(false);

  // Group seats by rows A..H
  const rows = useMemo(() => {
    const map: Record<string, Seat[]> = {};
    for (const seat of seats) {
      if (!map[seat.row]) map[seat.row] = [];
      map[seat.row].push(seat);
    }
    return map;
  }, [seats]);

  const selectedSeats = useMemo(() => {
    const set = new Set(selectedIds);
    return seats.filter((s) => set.has(s.id));
  }, [seats, selectedIds]);

  const totalPrice = useMemo(() => {
    if (!showtime) return 0;
    return selectedSeats.reduce((sum, s) => sum + seatPrice(showtime.priceBase, s.type), 0);
  }, [selectedSeats, showtime]);

  const toggleSeat = (seat: Seat) => {
    if (isSeatTaken(seat)) return;

    setSelectedIds((prev) => {
      const partner = couplePartner(seats, seat);
      const bundle = partner ? [seat, partner] : [seat];
      const currentSet = new Set(prev);

      if (currentSet.has(seat.id)) {
        const remove = new Set(bundle.map((item) => item.id));
        return prev.filter((id) => !remove.has(id));
      }

      if (partner && isSeatTaken(partner)) {
        Alert.alert('Ghế đôi', 'Ghế đôi phải chọn cả cặp còn trống.');
        return prev;
      }

      const addIds = bundle.map((item) => item.id).filter((id) => !currentSet.has(id));
      const next = [...prev, ...addIds];
      if (next.length > MAX_SEATS_PER_BOOKING) {
        Alert.alert('Giới hạn ghế', `Mỗi lần đặt tối đa ${MAX_SEATS_PER_BOOKING} ghế.`);
        return prev;
      }
      return next;
    });
  };

  const handleContinue = async () => {
    if (selectedSeats.length === 0) {
      Alert.alert('Chưa chọn ghế', 'Vui lòng chọn ít nhất 1 vị trí ghế trên sơ đồ.');
      return;
    }

    if (!user) {
      Alert.alert(
        'Yêu cầu đăng nhập',
        'Vui lòng đăng nhập tài khoản để giữ ghế và tiến hành đặt vé.',
        [
          { text: 'Để sau', style: 'cancel' },
          { text: 'Đăng nhập ngay', onPress: () => navigation.navigate('Login') },
        ]
      );
      return;
    }

    if (!showtime || !movie) return;

    setHolding(true);
    try {
      const labels = selectedSeats.map((s) => `${s.row}${s.number}`);
      if (changing && changeTicket) {
        const data = await rescheduleMyTicket(changeTicket, {
          showtimeId: showtime.id,
          seats: labels,
        });
        Alert.alert('Đổi suất thành công', `Ghế mới: ${data.ticket.seats.join(', ')}`, [
          {
            text: 'Xem vé',
            onPress: () => navigation.navigate('TicketDetail', { code: data.ticket.code }),
          },
        ]);
        return;
      }

      const res = await holdSeats({
        showtimeId: showtime.id,
        movieSlug: movie.slug,
        seats: labels,
        total: totalPrice,
      });

      navigation.navigate('Checkout', { bookingId: res.booking.id });
    } catch (err: any) {
      Alert.alert(
        changing ? 'Không đổi được suất' : 'Lỗi giữ ghế',
        err?.message || 'Không thể xử lý yêu cầu vào lúc này.',
      );
    } finally {
      setHolding(false);
    }
  };

  if (!showtime || !movie || showtime.closed) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>Suất chiếu không tồn tại</Text>
          <NeonButton title="Quay lại" onPress={() => navigation.goBack()} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Top Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Text style={styles.backBtnText}>‹</Text>
            </TouchableOpacity>
            <View>
              <Text style={styles.movieTitle} numberOfLines={1}>
                {movie.title}
              </Text>
              <Text style={styles.cinemaHall}>
                {showtime.cinema} · {showtime.room}
              </Text>
            </View>
          </View>

          {/* 2D / 3D Mode Toggle */}
          <View style={styles.toggleRow}>
            <TouchableOpacity
              onPress={() => setViewMode('2d')}
              style={[styles.toggleBtn, viewMode === '2d' && styles.toggleBtnActive]}
            >
              <Text style={[styles.toggleText, viewMode === '2d' && styles.toggleTextActive]}>2D</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setViewMode('3d')}
              style={[styles.toggleBtn, viewMode === '3d' && styles.toggleBtnActive]}
            >
              <Text style={[styles.toggleText, viewMode === '3d' && styles.toggleTextActive]}>3D POV</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Hold Timer Bar */}
        <View style={styles.timerBar}>
          <HoldTimer />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Curved Screen */}
          <ScreenCurve />

          {/* Seat Grid with 3D POV Perspective effect if 3d mode */}
          <View style={[styles.seatGridContainer, viewMode === '3d' && styles.seatGrid3d]}>
            {Object.keys(rows).map((rowLetter) => (
              <View key={rowLetter} style={styles.seatRow}>
                {/* Row Letter on left */}
                <Text style={styles.rowLabel}>{rowLetter}</Text>

                {/* Seats in row */}
                <View style={styles.seatsInRow}>
                  {rows[rowLetter].map((seat) => (
                    <SeatButton
                      key={seat.id}
                      seat={seat}
                      isSelected={selectedIds.includes(seat.id)}
                      onPress={toggleSeat}
                    />
                  ))}
                </View>

                {/* Row Letter on right */}
                <Text style={styles.rowLabel}>{rowLetter}</Text>
              </View>
            ))}
          </View>

          {/* Legend Badges */}
          <View style={styles.legendContainer}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.seatAvailable }]} />
              <Text style={styles.legendLabel}>Ghế trống</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.seatSelected }]} />
              <Text style={styles.legendLabel}>Đang chọn</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.seatVip }]} />
              <Text style={styles.legendLabel}>Ghế VIP</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.seatCouple }]} />
              <Text style={styles.legendLabel}>Sweetbox Đôi</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.seatSold }]} />
              <Text style={styles.legendLabel}>Đã bán</Text>
            </View>
          </View>
        </ScrollView>

        {/* Bottom Booking Summary Sheet */}
        <View style={styles.bottomSheet}>
          <View style={styles.summaryInfo}>
            <Text style={styles.selectedSeatsText}>
              Ghế: {selectedSeats.length > 0 ? selectedSeats.map((s) => s.id).join(', ') : 'Chưa chọn'}
            </Text>
            <Text style={styles.totalPriceText}>{formatVnd(totalPrice)}</Text>
          </View>

          <NeonButton
            title={holding ? 'Đang giữ ghế...' : 'Giữ ghế & Thanh toán →'}
            variant="primary"
            size="md"
            loading={holding}
            disabled={selectedSeats.length === 0 || holding}
            onPress={() => void handleContinue()}
            style={{ flex: 1, marginLeft: spacing.md }}
          />
        </View>
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
  errorBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  errorTitle: {
    fontSize: 16,
    color: '#ffffff',
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
    marginTop: -2,
  },
  movieTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },
  cinemaHall: {
    fontSize: 11,
    color: colors.textMuted,
  },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(14, 19, 34, 0.9)',
    borderRadius: radius.md,
    borderColor: colors.border,
    borderWidth: 1,
    padding: 2,
  },
  toggleBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  toggleBtnActive: {
    backgroundColor: colors.primary,
  },
  toggleText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textSecondary,
  },
  toggleTextActive: {
    color: '#06070d',
  },
  timerBar: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 100,
    alignItems: 'center',
  },
  seatGridContainer: {
    width: '100%',
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  seatGrid3d: {
    transform: [{ perspective: 600 }, { rotateX: '18deg' }],
  },
  seatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 2,
  },
  rowLabel: {
    width: 18,
    fontSize: 11,
    fontWeight: '800',
    color: colors.textMuted,
    textAlign: 'center',
  },
  seatsInRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 3,
  },
  legendLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0e1322',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderTopWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  summaryInfo: {
    maxWidth: '45%',
  },
  selectedSeatsText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  totalPriceText: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.primaryLight,
    marginTop: 2,
  },
});

