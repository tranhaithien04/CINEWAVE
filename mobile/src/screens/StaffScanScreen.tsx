import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { ApiError } from '../api/client';
import {
  checkInTicket,
  inspectTicketAsStaff,
  payoutRefund,
} from '../api/tickets';
import { useAuth } from '../context/auth-context';
import { useCatalog } from '../context/catalog-context';
import { TicketInspectResult } from '../types';
import { colors, radius, spacing } from '../constants/theme';
import { formatVnd } from '../data/mock-data';
import { parseTicketQr } from '../utils/ticket-qr';
import { NeonButton } from '../components/NeonButton';
import { GlassCard } from '../components/GlassCard';
import { AgeBadge } from '../components/AgeBadge';

export function StaffScanScreen() {
  const navigation = useNavigation<any>();
  const { user, loading } = useAuth();
  const { getMovieBySlug, getShowtimeById } = useCatalog();
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraOn, setCameraOn] = useState(false);
  const [manual, setManual] = useState('');
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<TicketInspectResult | null>(null);
  const [lastSig, setLastSig] = useState<string | undefined>();
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [lastRaw, setLastRaw] = useState('');

  const onScan = useCallback(async (payload: { kind?: 'ticket' | 'refund'; code: string; sig?: string }) => {
    setBusy(true);
    setLookupError(null);
    setCameraOn(false);
    try {
      const data = await inspectTicketAsStaff(payload.code, payload.sig, payload.kind);
      setResult(data);
      setLastSig(payload.sig);
      if (data.verdict === 'VALID') {
        Alert.alert('Hợp lệ', `Vé ${data.ticket.code} sẵn sàng vào rạp.`);
      } else if (data.verdict === 'REFUND_PENDING') {
        Alert.alert('Hoàn tiền', `Phiếu hoàn tiền ${data.ticket.code}`);
      } else {
        Alert.alert('Không hợp lệ', data.message);
      }
    } catch (err) {
      setResult(null);
      const message = err instanceof ApiError ? err.message : 'Không kiểm tra được vé';
      setLookupError(message);
      Alert.alert('Lỗi', message);
    } finally {
      setBusy(false);
    }
  }, []);

  const handleBarcode = ({ data }: { data: string }) => {
    if (busy || data === lastRaw) return;
    const parsed = parseTicketQr(data);
    if (!parsed) return;
    setLastRaw(data);
    void onScan(parsed);
  };

  const submitManual = () => {
    const parsed = parseTicketQr(manual);
    if (!parsed) {
      Alert.alert('Không đọc được', 'Dán nội dung QR hoặc mã vé CW-...');
      return;
    }
    void onScan(parsed);
  };

  const enableCamera = async () => {
    if (!permission?.granted) {
      const next = await requestPermission();
      if (!next.granted) {
        Alert.alert('Cần quyền camera', 'Vui lòng cấp quyền máy ảnh để quét QR vé.');
        return;
      }
    }
    setLastRaw('');
    setCameraOn(true);
  };

  const handleCheckIn = async () => {
    if (!result?.ticket) return;
    setChecking(true);
    try {
      const data = await checkInTicket(result.ticket.code, lastSig);
      setResult({
        ticket: data.ticket,
        validForEntry: false,
        verdict: 'USED',
        message: 'Vé đã được sử dụng. Không cho vào lần hai.',
        signed: Boolean(lastSig),
      });
      Alert.alert('Check-in', `Đã check-in ${data.ticket.code}`);
    } catch (err) {
      Alert.alert('Lỗi', err instanceof ApiError ? err.message : 'Không check-in được');
    } finally {
      setChecking(false);
    }
  };

  const handlePayout = async () => {
    if (!result?.ticket) return;
    setChecking(true);
    try {
      const data = await payoutRefund(result.ticket.code);
      setResult({
        ticket: data.ticket,
        validForEntry: false,
        validForRefund: false,
        kind: 'refund',
        verdict: 'REFUNDED',
        message: 'Đã hoàn tiền rồi. Không trả lần hai.',
        signed: Boolean(lastSig),
      });
      Alert.alert('Hoàn tiền', `Đã trả ${result.ticket.code}`);
    } catch (err) {
      Alert.alert('Lỗi', err instanceof ApiError ? err.message : 'Không hoàn tiền được');
    } finally {
      setChecking(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Text style={styles.muted}>Đang tải…</Text>
      </SafeAreaView>
    );
  }

  if (!user || (user.role !== 'STAFF' && user.role !== 'ADMIN')) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <Text style={styles.title}>Khu vực nhân viên</Text>
          <Text style={styles.muted}>Chỉ tài khoản Staff/Admin mới soát vé tại đây.</Text>
          <NeonButton title="Đăng nhập" onPress={() => navigation.navigate('Login')} />
        </View>
      </SafeAreaView>
    );
  }

  const ticket = result?.ticket;
  const movie = ticket ? getMovieBySlug(ticket.movieSlug) : null;
  const showtime = ticket ? getShowtimeById(ticket.showtimeId) : null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹ Quay lại</Text>
        </TouchableOpacity>

        <Text style={styles.eyebrow}>STAFF GATE SCANNER</Text>
        <Text style={styles.title}>Soát vé & hoàn tiền</Text>
        <Text style={styles.muted}>
          Quét camera QR hoặc dán nội dung QR (URL gate / CINEWAVE|mã|chữ ký).
        </Text>

        {cameraOn ? (
          <View style={styles.cameraBox}>
            <CameraView
              style={StyleSheet.absoluteFillObject}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onBarcodeScanned={busy ? undefined : handleBarcode}
            />
            <View style={styles.cameraOverlay}>
              <Text style={styles.cameraHint}>{busy ? 'Đang kiểm tra…' : 'Đưa QR vào khung'}</Text>
              <NeonButton title="Tắt camera" variant="secondary" size="sm" onPress={() => setCameraOn(false)} />
            </View>
          </View>
        ) : (
          <NeonButton
            title="Bật camera quét QR"
            variant="primary"
            onPress={() => void enableCamera()}
            style={{ marginTop: spacing.md }}
          />
        )}

        <TextInput
          value={manual}
          onChangeText={setManual}
          placeholder="Dán QR hoặc mã CW-..."
          placeholderTextColor={colors.textMuted}
          multiline
          style={styles.input}
        />
        <NeonButton
          title={busy ? 'Đang kiểm tra…' : 'Kiểm tra mã'}
          loading={busy}
          onPress={submitManual}
        />

        {lookupError ? <Text style={styles.error}>{lookupError}</Text> : null}

        {ticket && movie ? (
          <GlassCard style={styles.resultCard} highlight>
            <View style={styles.resultHeader}>
              <Text style={styles.resultCode}>{ticket.code}</Text>
              <Text style={styles.verdict}>{result?.verdict}</Text>
            </View>
            <View style={styles.movieRow}>
              <AgeBadge rating={movie.rating} size="sm" />
              <Text style={styles.movieTitle}>{movie.title}</Text>
            </View>
            <Text style={styles.muted}>
              {showtime?.cinema} · {showtime?.room} · Ghế {ticket.seats.join(', ')}
            </Text>
            <Text style={styles.muted}>{result?.message}</Text>
            <Text style={styles.total}>{formatVnd(ticket.total)}</Text>

            {result?.validForEntry ? (
              <NeonButton
                title={checking ? 'Đang check-in…' : 'Cho khách vào rạp (check-in)'}
                loading={checking}
                onPress={() => void handleCheckIn()}
                style={{ marginTop: spacing.md }}
              />
            ) : null}

            {result?.validForRefund ? (
              <NeonButton
                title={checking ? 'Đang hoàn…' : 'Xác nhận hoàn tiền mặt'}
                variant="secondary"
                loading={checking}
                onPress={() => void handlePayout()}
                style={{ marginTop: spacing.sm }}
              />
            ) : null}

            <TouchableOpacity
              onPress={() => {
                setResult(null);
                setManual('');
                setLookupError(null);
                setLastRaw('');
              }}
            >
              <Text style={styles.scanNext}>Quét vé tiếp theo →</Text>
            </TouchableOpacity>
          </GlassCard>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg, gap: spacing.md },
  back: { color: colors.primaryLight, fontWeight: '700', marginBottom: spacing.md },
  eyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5, color: colors.primaryLight },
  title: { fontSize: 22, fontWeight: '900', color: '#ffffff', marginTop: 4 },
  muted: { fontSize: 12, color: colors.textSecondary, marginTop: 6, lineHeight: 16 },
  cameraBox: {
    marginTop: spacing.md,
    height: 280,
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderCyan,
    backgroundColor: '#000',
  },
  cameraOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: spacing.md,
    backgroundColor: 'rgba(0,0,0,0.55)',
    gap: spacing.sm,
  },
  cameraHint: { color: '#fff', fontWeight: '700', fontSize: 12, textAlign: 'center' },
  input: {
    marginTop: spacing.md,
    minHeight: 80,
    backgroundColor: 'rgba(6, 7, 13, 0.75)',
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    color: '#ffffff',
    fontSize: 12,
    fontFamily: 'monospace',
  },
  error: { color: colors.roseLight, marginTop: spacing.sm },
  resultCard: { marginTop: spacing.lg, padding: spacing.lg },
  resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  resultCode: { fontSize: 16, fontWeight: '900', color: colors.primaryLight, fontFamily: 'monospace' },
  verdict: { fontSize: 11, fontWeight: '800', color: colors.goldLight },
  movieRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: spacing.sm },
  movieTitle: { fontSize: 16, fontWeight: '800', color: '#ffffff', flex: 1 },
  total: { fontSize: 18, fontWeight: '900', color: colors.emeraldLight, marginTop: spacing.sm },
  scanNext: {
    marginTop: spacing.md,
    textAlign: 'center',
    color: colors.primaryLight,
    fontWeight: '800',
    fontSize: 12,
  },
});
