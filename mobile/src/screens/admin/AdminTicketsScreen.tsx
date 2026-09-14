import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors, radius, spacing } from '../../constants/theme';
import { GlassCard } from '../../components/GlassCard';
import { NeonButton } from '../../components/NeonButton';
import { mockTickets, formatVnd } from '../../data/mock-data';
import { fetchMyTicket } from '../../api/tickets';

export function AdminTicketsScreen() {
  const navigation = useNavigation<any>();
  const [ticketCode, setTicketCode] = useState('');
  const [ticketResult, setTicketResult] = useState<any>(null);
  const [checking, setChecking] = useState(false);

  const handleCheckTicket = async () => {
    const code = ticketCode.trim().toUpperCase();
    if (!code) {
      Alert.alert('Chưa nhập mã', 'Vui lòng nhập mã vé để soát.');
      return;
    }

    setChecking(true);
    try {
      const data = await fetchMyTicket(code);
      if (data) {
        setTicketResult(data);
      } else {
        const fallback = mockTickets.find((t) => t.code === code);
        if (fallback) {
          setTicketResult(fallback);
        } else {
          setTicketResult({
            code,
            status: 'INVALID',
            message: 'Mã vé không tồn tại trong hệ thống!',
          });
        }
      }
    } catch {
      setTicketResult({
        code,
        status: 'INVALID',
        message: 'Không tìm thấy vé hợp lệ.',
      });
    } finally {
      setChecking(false);
    }
  };

  const handleValidateEntry = () => {
    if (!ticketResult) return;
    setTicketResult({
      ...ticketResult,
      status: 'USED',
    });
    Alert.alert('Check-in thành công', `Đã mở cổng cho khách vé ${ticketResult.code}!`);
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
            Nhập mã vé hoặc quét QR để kiểm tra tính hợp lệ và cho khách vào phòng chiếu.
          </Text>
        </View>

        <View style={styles.content}>
          {/* Code Input Box */}
          <GlassCard style={styles.inputCard} highlight>
            <Text style={styles.inputLabel}>Nhập mã vé (VD: CW-8921-X)</Text>
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
                title={checking ? '...' : 'Kiểm tra'}
                variant="primary"
                size="sm"
                loading={checking}
                onPress={() => void handleCheckTicket()}
                style={styles.checkBtn}
              />
            </View>
          </GlassCard>

          {/* Quick Demo Code Fill */}
          <View style={styles.quickCodesRow}>
            <Text style={styles.quickLabel}>Mã vé demo:</Text>
            <TouchableOpacity
              onPress={() => {
                setTicketCode('CW-8921-X');
              }}
              style={styles.quickCodePill}
            >
              <Text style={styles.quickCodeText}>CW-8921-X (Hợp lệ)</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setTicketCode('CW-4412-M');
              }}
              style={styles.quickCodePill}
            >
              <Text style={styles.quickCodeText}>CW-4412-M (Đã dùng)</Text>
            </TouchableOpacity>
          </View>

          {/* Validation Result Box */}
          {ticketResult && (
            <GlassCard
              style={[
                styles.resultCard,
                ticketResult.status === 'PAID'
                  ? styles.resultCardValid
                  : styles.resultCardInvalid,
              ]}
            >
              <View style={styles.statusRow}>
                <Text style={styles.resultIcon}>
                  {ticketResult.status === 'PAID' ? '✓' : '✕'}
                </Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.resultTitle}>
                    {ticketResult.status === 'PAID'
                      ? 'VÉ HỢP LỆ - SẴN SÀNG VÀO RẠP'
                      : ticketResult.status === 'USED'
                      ? 'VÉ ĐÃ SỬ DỤNG'
                      : 'VÉ KHÔNG HỢP LỆ'}
                  </Text>
                  <Text style={styles.resultCode}>MÃ: {ticketResult.code}</Text>
                </View>
              </View>

              {ticketResult.seats && (
                <View style={styles.resultDetails}>
                  <Text style={styles.resultDetailText}>
                    Phim: <Text style={{ color: '#ffffff', fontWeight: '800' }}>{ticketResult.movieSlug}</Text>
                  </Text>
                  <Text style={styles.resultDetailText}>
                    Ghế ngồi: <Text style={{ color: colors.primaryLight, fontWeight: '800' }}>{ticketResult.seats.join(', ')}</Text>
                  </Text>
                  <Text style={styles.resultDetailText}>
                    Tổng tiền: {formatVnd(ticketResult.total)}
                  </Text>
                </View>
              )}

              {ticketResult.status === 'PAID' && (
                <NeonButton
                  title="Xác nhận mở cổng vào rạp (Check-in) →"
                  variant="primary"
                  size="md"
                  onPress={handleValidateEntry}
                  style={{ marginTop: spacing.md }}
                />
              )}
            </GlassCard>
          )}
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
  },
  subtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  content: {
    padding: spacing.lg,
  },
  inputCard: {
    padding: spacing.md,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
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
  checkBtn: {
    height: 44,
    justifyContent: 'center',
  },
  quickCodesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: spacing.md,
    flexWrap: 'wrap',
  },
  quickLabel: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '700',
  },
  quickCodePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  quickCodeText: {
    fontSize: 10,
    color: colors.primaryLight,
    fontWeight: '700',
  },
  resultCard: {
    padding: spacing.lg,
    marginTop: spacing.sm,
  },
  resultCardValid: {
    borderColor: 'rgba(16, 185, 129, 0.5)',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
  },
  resultCardInvalid: {
    borderColor: 'rgba(239, 68, 68, 0.5)',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  resultIcon: {
    fontSize: 28,
    fontWeight: '900',
    color: '#ffffff',
  },
  resultTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  resultCode: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primaryLight,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  resultDetails: {
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: spacing.sm,
    gap: 4,
  },
  resultDetailText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
});

