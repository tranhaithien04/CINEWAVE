import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/auth-context';
import { useCatalog } from '../context/catalog-context';
import { AdminBooking } from '../types';
import { colors, radius, spacing } from '../constants/theme';
import { fetchMyTickets } from '../api/tickets';
import { BoardingTicket } from '../components/BoardingTicket';
import { NeonButton } from '../components/NeonButton';

export function TicketsScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { getMovieBySlug, getShowtimeById } = useCatalog();

  const [tickets, setTickets] = useState<AdminBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadTickets = async () => {
    if (!user) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      const data = await fetchMyTickets();
      setTickets(data);
    } catch {
      setTickets([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadTickets();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    void loadTickets();
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.authPromptContainer}>
          <Text style={styles.authIcon}>🎫</Text>
          <Text style={styles.authTitle}>Ví Vé Điện Tử</Text>
          <Text style={styles.authDesc}>
            Vui lòng đăng nhập để xem danh sách vé Hologram và mã QR check-in vào rạp.
          </Text>
          <NeonButton
            title="Đăng nhập ngay"
            variant="primary"
            onPress={() => navigation.navigate('Login')}
            style={{ marginTop: spacing.lg, minWidth: 200 }}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>DIGITAL WALLET</Text>
          <Text style={styles.title}>Vé Của Tôi</Text>
          <Text style={styles.subtitle}>
            Bạn đang có <Text style={styles.countHighlight}>{tickets.length}</Text> vé điện tử trong ví.
          </Text>
        </View>

        <FlatList
          data={tickets}
          keyExtractor={(item) => item.code}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          renderItem={({ item }) => {
            const movie = getMovieBySlug(item.movieSlug);
            const showtime = getShowtimeById(item.showtimeId);
            return (
              <BoardingTicket
                ticket={item}
                movie={movie}
                showtime={showtime}
                onPress={() => navigation.navigate('TicketDetail', { code: item.code })}
              />
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🎟️</Text>
              <Text style={styles.emptyTitle}>Chưa có vé xem phim</Text>
              <Text style={styles.emptyDesc}>
                Hãy đặt một suất chiếu phim hấp dẫn để nhận vé điện tử QR tại đây.
              </Text>
              <NeonButton
                title="Khám phá phim ngay"
                variant="primary"
                onPress={() => navigation.navigate('MoviesTab')}
                style={{ marginTop: spacing.md }}
              />
            </View>
          }
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
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: colors.primaryLight,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#ffffff',
    marginTop: 2,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    marginBottom: spacing.xs,
  },
  countHighlight: {
    color: colors.primaryLight,
    fontWeight: '800',
  },
  listContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxxl,
  },
  authPromptContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  authIcon: {
    fontSize: 54,
    marginBottom: spacing.md,
  },
  authTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#ffffff',
  },
  authDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
    lineHeight: 18,
    paddingHorizontal: spacing.md,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
  },
  emptyDesc: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 40,
    marginTop: 4,
  },
});

