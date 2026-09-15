import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ApiError } from '../api/client';
import { fetchRescheduleOptions } from '../api/tickets';
import { useAuth } from '../context/auth-context';
import { useCatalog } from '../context/catalog-context';
import { Showtime } from '../types';
import { colors, radius, spacing } from '../constants/theme';
import { formatVnd } from '../data/mock-data';
import { NeonButton } from '../components/NeonButton';

function formatShow(show: Showtime) {
  const date = new Date(show.startsAt);
  return {
    time: new Intl.DateTimeFormat('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Ho_Chi_Minh',
    }).format(date),
    day: new Intl.DateTimeFormat('vi-VN', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'Asia/Ho_Chi_Minh',
    }).format(date),
  };
}

export function ChangeShowtimeScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { code } = route.params;
  const { user, loading } = useAuth();
  const { getMovieBySlug } = useCatalog();
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [movieSlug, setMovieSlug] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    void fetchRescheduleOptions(code)
      .then((data) => {
        if (cancelled) return;
        setShowtimes(data.showtimes);
        setMovieSlug(data.booking.movieSlug);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setShowtimes([]);
        setError(err instanceof ApiError ? err.message : 'Không tải được suất đổi');
      });
    return () => {
      cancelled = true;
    };
  }, [code, user]);

  const movie = movieSlug ? getMovieBySlug(movieSlug) : null;

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Text style={styles.loadingText}>Đang tải…</Text>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerBox}>
          <Text style={styles.title}>Cần đăng nhập</Text>
          <Text style={styles.subtitle}>Đăng nhập để đổi suất chiếu.</Text>
          <NeonButton title="Đăng nhập" onPress={() => navigation.navigate('Login')} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <TouchableOpacity onPress={() => navigation.navigate('TicketDetail', { code })}>
          <Text style={styles.back}>‹ Quay lại vé</Text>
        </TouchableOpacity>

        <Text style={styles.eyebrow}>ĐỔI SUẤT CÙNG GIÁ</Text>
        <Text style={styles.title}>{movie?.title ?? 'Chọn suất mới'}</Text>
        <Text style={styles.subtitle}>
          Chỉ hiện suất cùng phim, cùng giá. Sau đó chọn lại ghế — tổng tiền ghế phải bằng vé cũ.
        </Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {!error && showtimes.length === 0 ? (
          <Text style={styles.subtitle}>Hiện chưa có suất khác cùng mức giá để đổi.</Text>
        ) : (
          showtimes.map((show) => {
            const stamp = formatShow(show);
            return (
              <TouchableOpacity
                key={show.id}
                style={styles.showRow}
                onPress={() => navigation.navigate('SeatMap', { showtimeId: show.id, changeTicket: code })}
              >
                <View>
                  <Text style={styles.showTime}>{stamp.time}</Text>
                  <Text style={styles.showMeta}>
                    {stamp.day} · {show.cinema} · {show.room}
                  </Text>
                </View>
                <Text style={styles.showPrice}>{formatVnd(show.priceBase)}</Text>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  loadingText: { color: colors.textMuted, textAlign: 'center', marginTop: 40 },
  back: { color: colors.primaryLight, fontWeight: '700', marginBottom: spacing.md },
  eyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: colors.primaryLight,
  },
  title: { fontSize: 22, fontWeight: '900', color: '#ffffff', marginTop: 4 },
  subtitle: { fontSize: 12, color: colors.textSecondary, marginTop: 6, lineHeight: 16 },
  error: { color: colors.roseLight, marginTop: spacing.md },
  showRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginTop: spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  showTime: { fontSize: 18, fontWeight: '800', color: '#ffffff' },
  showMeta: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  showPrice: { fontSize: 13, fontWeight: '800', color: colors.primaryLight },
});
