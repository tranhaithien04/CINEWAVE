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
import { colors, radius, spacing } from '../constants/theme';
import { fetchMyTicket } from '../api/tickets';
import { mockTickets } from '../data/mock-data';
import { BoardingTicket } from '../components/BoardingTicket';
import { NeonButton } from '../components/NeonButton';

export function TicketDetailScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { code } = route.params;
  const { getMovieBySlug, getShowtimeById } = useCatalog();

  const [ticket, setTicket] = useState<any>(null);

  useEffect(() => {
    let cancelled = false;
    fetchMyTicket(code)
      .then((t) => {
        if (!cancelled && t) setTicket(t);
      })
      .catch(() => {
        if (!cancelled) {
          const fallback = mockTickets.find((item) => item.code === code) || mockTickets[0];
          setTicket(fallback);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [code]);

  const movie = ticket ? getMovieBySlug(ticket.movieSlug) : null;
  const showtime = ticket ? getShowtimeById(ticket.showtimeId) : null;

  const handleShare = async () => {
    if (!ticket) return;
    try {
      await Share.share({
        message: `Vé xem phim CineWave IMAX của tôi: ${movie?.title || ticket.movieSlug} | Ghế: ${ticket.seats.join(', ')} | Mã vé: ${ticket.code}`,
      });
    } catch {
      // Ignore
    }
  };

  if (!ticket) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingBox}>
          <Text style={styles.loadingText}>Đang tải vé điện tử Hologram...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Top App Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>‹ Quay lại</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => void handleShare()} style={styles.shareBtn}>
            <Text style={styles.shareBtnText}>Chia sẻ ↗</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Detailed Boarding Pass */}
          <BoardingTicket
            ticket={ticket}
            movie={movie || undefined}
            showtime={showtime || undefined}
            showFullQr
          />

          {/* Turnstile Instructions */}
          <View style={styles.turnstileCard}>
            <Text style={styles.turnstileTitle}>💡 Hướng dẫn check-in tại rạp</Text>
            <Text style={styles.turnstileText}>
              1. Đến trước giờ chiếu 15 phút.{'\n'}
              2. Đưa màn hình mã QR này vào mắt đọc máy quét tại cửa phòng chiếu.{'\n'}
              3. Cổng tự động mở cho {ticket.seats.length} khán giả tương ứng với số ghế.
            </Text>
          </View>

          {/* Bottom Action */}
          <NeonButton
            title="Đã lưu vào ví vé"
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
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    paddingVertical: 4,
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primaryLight,
  },
  shareBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  shareBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  turnstileCard: {
    backgroundColor: 'rgba(14, 19, 34, 0.85)',
    borderColor: 'rgba(6, 182, 212, 0.25)',
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  turnstileTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primaryLight,
    marginBottom: 6,
  },
  turnstileText: {
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 13,
    color: colors.textMuted,
  },
});
