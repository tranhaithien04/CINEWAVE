import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  FlatList,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors, radius, spacing } from '../../constants/theme';
import { GlassCard } from '../../components/GlassCard';
import { NeonButton } from '../../components/NeonButton';
import { formatVnd } from '../../data/mock-data';
import {
  checkInAdminTicket,
  fetchAdminTickets,
} from '../../api/admin';
import { AdminBooking } from '../../types';
import { ApiError } from '../../api/client';
import { parseTicketQr } from '../../utils/ticket-qr';

export function AdminTicketsScreen() {
  const navigation = useNavigation<any>();
  const [tickets, setTickets] = useState<AdminBooking[]>([]);
  const [ticketCode, setTicketCode] = useState('');
  const [ticketResult, setTicketResult] = useState<AdminBooking | null>(null);
  const [checking, setChecking] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTickets = async () => {
    try {
      const data = await fetchAdminTickets();
      setTickets(data.tickets);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không tải được danh sách vé');
      setTickets([]);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadTickets();
  }, []);

  const handleCheckTicket = () => {
    const parsed = parseTicketQr(ticketCode.trim());
    const code = (parsed?.code || ticketCode.trim()).toUpperCase();
    if (!code) {
      Alert.alert('Chưa nhập mã', 'Vui lòng nhập mã vé để soát.');
      return;
    }
    const found = tickets.find((t) => t.code.toUpperCase() === code);
    if (found) {
      setTicketResult(found);
      return;
    }
    Alert.alert('Không tìm thấy', `Không có vé ${code} trong danh sách admin.`);
    setTicketResult(null);
  };

  const handleValidateEntry = async () => {
    if (!ticketResult) return;
    setChecking(true);
    try {
      const data = await checkInAdminTicket(ticketResult.code);
      setTicketResult(data.ticket);
      setTickets((prev) => prev.map((t) => (t.code === data.ticket.code ? data.ticket : t)));
      Alert.alert('Check-in thành công', `Đã mở cổng cho khách vé ${data.ticket.code}!`);
    } catch (err) {
      Alert.alert('Lỗi', err instanceof ApiError ? err.message : 'Không check-in được');
    } finally {
      setChecking(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>‹ Dashboard</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Soát Vé Cổng Check-In</Text>
          <Text style={styles.subtitle}>
            Tra cứu vé thật từ API admin và check-in tại cổng.
          </Text>
        </View>

        <FlatList
          data={tickets}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                void loadTickets();
              }}
              tintColor={colors.primary}
            />
          }
          ListHeaderComponent={
            <View style={styles.content}>
              <GlassCard style={styles.inputCard} highlight>
                <Text style={styles.inputLabel}>Nhập mã vé hoặc dán QR</Text>
                <View style={styles.inputRow}>
                  <TextInput
                    value={ticketCode}
                    onChangeText={setTicketCode}
                    placeholder="CW-XXXX-X"
                    placeholderTextColor={colors.textMuted}
                    autoCapitalize="characters"
                    style={styles.input}
                  />
                  <NeonButton
                    title="Kiểm tra"
                    variant="primary"
                    size="sm"
                    onPress={handleCheckTicket}
                    style={styles.checkBtn}
                  />
                </View>
              </GlassCard>

              {error ? <Text style={styles.error}>{error}</Text> : null}

              {ticketResult ? (
                <GlassCard
                  style={[
                    styles.resultCard,
                    ticketResult.status === 'PAID'
                      ? styles.resultCardValid
                      : styles.resultCardInvalid,
                  ]}
                >
                  <Text style={styles.resultTitle}>
                    {ticketResult.status === 'PAID'
                      ? 'VÉ HỢP LỆ - SẴN SÀNG VÀO RẠP'
                      : ticketResult.status === 'USED'
                        ? 'VÉ ĐÃ SỬ DỤNG'
                        : `TRẠNG THÁI: ${ticketResult.status}`}
                  </Text>
                  <Text style={styles.resultCode}>MÃ: {ticketResult.code}</Text>
                  <Text style={styles.resultDetailText}>Phim: {ticketResult.movieSlug}</Text>
                  <Text style={styles.resultDetailText}>
                    Ghế: {ticketResult.seats?.join(', ') || '—'}
                  </Text>
                  <Text style={styles.resultDetailText}>{formatVnd(ticketResult.total)}</Text>
                  {ticketResult.status === 'PAID' ? (
                    <NeonButton
                      title={checking ? 'Đang check-in…' : 'Xác nhận check-in →'}
                      loading={checking}
                      onPress={() => void handleValidateEntry()}
                      style={{ marginTop: spacing.md }}
                    />
                  ) : null}
                </GlassCard>
              ) : null}

              <Text style={styles.listHeading}>DANH SÁCH VÉ ({tickets.length})</Text>
            </View>
          }
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => {
                setTicketCode(item.code);
                setTicketResult(item);
              }}
            >
              <GlassCard style={styles.card}>
                <Text style={styles.resultCode}>{item.code}</Text>
                <Text style={styles.resultDetailText}>
                  {item.status} · {item.movieSlug} · {item.seats.join(', ')}
                </Text>
                <Text style={styles.resultDetailText}>{formatVnd(item.total)}</Text>
              </GlassCard>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            !error ? <Text style={styles.empty}>Chưa có vé trong hệ thống.</Text> : null
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1 },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { marginBottom: spacing.xs },
  backBtnText: { fontSize: 13, fontWeight: '700', color: colors.primaryLight },
  title: { fontSize: 22, fontWeight: '900', color: '#ffffff' },
  subtitle: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  content: { paddingBottom: spacing.md },
  list: { padding: spacing.lg, gap: spacing.sm, paddingBottom: spacing.xxxl },
  inputCard: { padding: spacing.md },
  inputLabel: { fontSize: 11, fontWeight: '700', color: colors.textSecondary, marginBottom: spacing.xs },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  input: {
    flex: 1,
    backgroundColor: 'rgba(6, 7, 13, 0.8)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 44,
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  checkBtn: { height: 44, justifyContent: 'center' },
  error: { color: colors.roseLight, marginTop: spacing.sm },
  resultCard: { padding: spacing.lg, marginTop: spacing.sm },
  resultCardValid: {
    borderColor: 'rgba(16, 185, 129, 0.5)',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
  },
  resultCardInvalid: {
    borderColor: 'rgba(239, 68, 68, 0.5)',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  resultTitle: { fontSize: 13, fontWeight: '900', color: '#ffffff', letterSpacing: 0.5 },
  resultCode: { fontSize: 12, fontWeight: '800', color: colors.primaryLight, fontFamily: 'monospace', marginTop: 4 },
  resultDetailText: { fontSize: 11, color: colors.textSecondary, marginTop: 4 },
  listHeading: {
    marginTop: spacing.lg,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: colors.textMuted,
  },
  card: { padding: spacing.md },
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: spacing.lg },
});
