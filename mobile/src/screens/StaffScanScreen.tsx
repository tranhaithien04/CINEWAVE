import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { CameraView, scanFromURLAsync, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
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

const VERDICT_LABEL: Record<TicketInspectResult['verdict'], string> = {
  VALID: 'Hợp lệ',
  USED: 'Đã dùng',
  UNPAID: 'Chưa thanh toán',
  CANCELLED: 'Đã hủy',
  REFUND_PENDING: 'Chờ hoàn tiền',
  REFUNDED: 'Đã hoàn',
};

function verdictTone(verdict?: TicketInspectResult['verdict']) {
  if (verdict === 'VALID') {
    return {
      border: 'rgba(16, 185, 129, 0.45)',
      bg: 'rgba(16, 185, 129, 0.12)',
      badgeBg: 'rgba(16, 185, 129, 0.22)',
      badgeText: colors.emeraldLight,
      message: colors.emeraldLight,
    };
  }
  if (verdict === 'USED' || verdict === 'REFUND_PENDING') {
    return {
      border: 'rgba(245, 158, 11, 0.45)',
      bg: 'rgba(245, 158, 11, 0.12)',
      badgeBg: 'rgba(245, 158, 11, 0.22)',
      badgeText: colors.goldLight,
      message: colors.goldLight,
    };
  }
  return {
    border: 'rgba(244, 63, 94, 0.45)',
    bg: 'rgba(244, 63, 94, 0.12)',
    badgeBg: 'rgba(244, 63, 94, 0.22)',
    badgeText: colors.roseLight,
    message: colors.roseLight,
  };
}

export function StaffScanScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user, loading } = useAuth();
  const { getMovieBySlug, getShowtimeById } = useCatalog();
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraOn, setCameraOn] = useState(Boolean(route.params?.openCamera));
  const [torchOn, setTorchOn] = useState(false);
  const [readingImage, setReadingImage] = useState(false);
  const [manual, setManual] = useState('');
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<TicketInspectResult | null>(null);
  const [lastSig, setLastSig] = useState<string | undefined>();
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [lastRaw, setLastRaw] = useState('');

  const onScan = useCallback(
    async (payload: { kind?: 'ticket' | 'refund'; code: string; sig?: string }) => {
      setBusy(true);
      setLookupError(null);
      setCameraOn(false);
      setTorchOn(false);
      try {
        const data = await inspectTicketAsStaff(payload.code, payload.sig, payload.kind);
        setResult(data);
        setLastSig(payload.sig);
        if (data.verdict === 'VALID') {
          Alert.alert('Hợp lệ', `Vé ${data.ticket.code} sẵn sàng vào rạp.`);
        } else if (data.verdict === 'REFUND_PENDING') {
          Alert.alert('Hoàn tiền', `Phiếu hoàn tiền ${data.ticket.code}`);
        } else {
          Alert.alert(VERDICT_LABEL[data.verdict] || 'Không hợp lệ', data.message);
        }
      } catch (err) {
        setResult(null);
        const message = err instanceof ApiError ? err.message : 'Không kiểm tra được vé';
        setLookupError(message);
        Alert.alert('Lỗi', message);
      } finally {
        setBusy(false);
      }
    },
    [],
  );

  useEffect(() => {
    const refund = route.params?.refund as string | undefined;
    const code = route.params?.code as string | undefined;
    const sig = route.params?.sig as string | undefined;
    const raw = route.params?.raw as string | undefined;
    if (raw) {
      const parsed = parseTicketQr(raw);
      if (parsed) void onScan(parsed);
      return;
    }
    if (refund) {
      void onScan({ kind: 'refund', code: refund, sig });
      return;
    }
    if (code) {
      void onScan({ kind: 'ticket', code, sig });
    }
  }, [route.params?.refund, route.params?.code, route.params?.sig, route.params?.raw, onScan]);

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

  const pickQrImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Cần quyền ảnh', 'Cho phép truy cập thư viện để chọn ảnh QR vé.');
        return;
      }
      const picked = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 1,
        allowsEditing: false,
      });
      if (picked.canceled || !picked.assets[0]?.uri) return;

      setReadingImage(true);
      setLookupError(null);
      const scanned = await scanFromURLAsync(picked.assets[0].uri, ['qr']);
      const raw = scanned[0]?.data?.trim();
      if (!raw) {
        Alert.alert('Không thấy QR', 'Ảnh không có mã QR rõ. Chụp gần hơn hoặc dùng camera.');
        return;
      }
      const parsed = parseTicketQr(raw);
      if (!parsed) {
        Alert.alert('QR không phải vé CINEWAVE', 'Hãy dùng mã trên vé điện tử hoặc phiếu hoàn tiền.');
        return;
      }
      setLastRaw(raw);
      void onScan(parsed);
    } catch (err: any) {
      Alert.alert('Lỗi đọc ảnh', err?.message || 'Không đọc được QR từ ảnh.');
    } finally {
      setReadingImage(false);
    }
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
      Alert.alert('Hoàn tiền', `Đã trả ${formatVnd(result.ticket.total)} · ${result.ticket.code}`);
    } catch (err) {
      Alert.alert('Lỗi', err instanceof ApiError ? err.message : 'Không hoàn tiền được');
    } finally {
      setChecking(false);
    }
  };

  const scanNext = () => {
    setResult(null);
    setManual('');
    setLookupError(null);
    setLastRaw('');
    setLastSig(undefined);
    void enableCamera();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.muted}>Đang tải…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <Text style={styles.title}>Cần đăng nhập nhân viên</Text>
          <Text style={styles.muted}>Trang soát vé dành cho role STAFF hoặc ADMIN.</Text>
          <NeonButton title="Đăng nhập nhân viên" onPress={() => navigation.navigate('Login')} />
        </View>
      </SafeAreaView>
    );
  }

  if (user.role !== 'STAFF' && user.role !== 'ADMIN') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <Text style={styles.title}>Không có quyền soát vé</Text>
          <Text style={styles.muted}>
            Tài khoản khách không vào được cổng. Đăng nhập staff@cinewave.vn để quét QR.
          </Text>
          <NeonButton title="Đăng nhập lại" onPress={() => navigation.navigate('Login')} />
        </View>
      </SafeAreaView>
    );
  }

  const ticket = result?.ticket;
  const movie = ticket ? getMovieBySlug(ticket.movieSlug) : null;
  const showtime = ticket ? getShowtimeById(ticket.showtimeId) : null;
  const tone = verdictTone(result?.verdict);
  const isRefundCard =
    result?.verdict === 'REFUND_PENDING' || result?.verdict === 'REFUNDED' || result?.kind === 'refund';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹ Quay lại</Text>
        </TouchableOpacity>

        <Text style={styles.eyebrow}>CỔNG SOÁT VÉ · {user.role}</Text>
        <Text style={styles.title}>Quét QR kiểm vé</Text>
        <Text style={styles.muted}>
          Camera / ảnh QR / dán mã — kiểm tra hợp lệ, đã dùng, giả, hoặc phiếu hoàn tiền.
        </Text>

        {cameraOn ? (
          <View style={styles.cameraBox}>
            <CameraView
              style={StyleSheet.absoluteFillObject}
              facing="back"
              enableTorch={torchOn}
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onBarcodeScanned={busy ? undefined : handleBarcode}
            />
            <View style={styles.cameraFrame} pointerEvents="none" />
            <View style={styles.cameraOverlay}>
              <Text style={styles.cameraHint}>{busy ? 'Đang kiểm tra…' : 'Đưa QR vào khung'}</Text>
              <View style={styles.cameraActions}>
                <NeonButton
                  title={torchOn ? 'Tắt đèn' : 'Đèn pin'}
                  variant="secondary"
                  size="sm"
                  onPress={() => setTorchOn((v) => !v)}
                  style={{ flex: 1 }}
                />
                <NeonButton
                  title="Tắt camera"
                  variant="outline"
                  size="sm"
                  onPress={() => {
                    setCameraOn(false);
                    setTorchOn(false);
                  }}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.scanActions}>
            <NeonButton
              title="Bật camera quét QR"
              variant="primary"
              onPress={() => void enableCamera()}
              style={{ flex: 1 }}
            />
            <NeonButton
              title={readingImage ? 'Đang đọc ảnh…' : 'Chọn ảnh QR'}
              variant="outline"
              loading={readingImage}
              onPress={() => void pickQrImage()}
              style={{ flex: 1 }}
            />
          </View>
        )}

        <TextInput
          value={manual}
          onChangeText={setManual}
          placeholder="Dán URL gate / QR text / mã CW-..."
          placeholderTextColor={colors.textMuted}
          multiline
          style={styles.input}
        />
        <NeonButton
          title={busy ? 'Đang kiểm tra…' : 'Kiểm tra mã'}
          loading={busy}
          onPress={submitManual}
        />

        {lookupError ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorTitle}>QR không hợp lệ</Text>
            <Text style={styles.error}>{lookupError}</Text>
          </View>
        ) : null}

        {ticket ? (
          <GlassCard
            style={[
              styles.resultCard,
              { borderColor: tone.border, backgroundColor: tone.bg },
            ]}
            highlight
          >
            <View style={styles.resultHeader}>
              <Text style={styles.resultEyebrow}>
                {isRefundCard ? 'PHIẾU HOÀN TIỀN' : 'KẾT QUẢ SOÁT VÉ'}
              </Text>
              <View style={[styles.verdictBadge, { backgroundColor: tone.badgeBg }]}>
                <Text style={[styles.verdictText, { color: tone.badgeText }]}>
                  {result?.verdict ? VERDICT_LABEL[result.verdict] : '—'}
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
                <Text style={styles.metaValueCode}>{ticket.code}</Text>
              </View>
              <View style={styles.metaCell}>
                <Text style={styles.metaLabel}>Ghế</Text>
                <Text style={styles.metaValue}>{ticket.seats.join(', ') || '—'}</Text>
              </View>
              <View style={styles.metaCell}>
                <Text style={styles.metaLabel}>Tổng tiền</Text>
                <Text style={styles.metaValueMoney}>{formatVnd(ticket.total)}</Text>
              </View>
              <View style={styles.metaCell}>
                <Text style={styles.metaLabel}>Trạng thái</Text>
                <Text style={styles.metaValue}>{ticket.status}</Text>
              </View>
            </View>

            <Text style={[styles.message, { color: tone.message }]}>{result?.message}</Text>

            {result?.validForEntry ? (
              <NeonButton
                title={checking ? 'Đang check-in…' : 'Cho khách vào rạp'}
                loading={checking}
                onPress={() => void handleCheckIn()}
                style={{ marginTop: spacing.md }}
              />
            ) : null}

            {result?.validForRefund ? (
              <NeonButton
                title={
                  checking ? 'Đang xác nhận…' : `Đã trả tiền mặt ${formatVnd(ticket.total)}`
                }
                variant="secondary"
                loading={checking}
                onPress={() => void handlePayout()}
                style={{ marginTop: spacing.sm }}
              />
            ) : null}

            <TouchableOpacity onPress={scanNext} style={styles.scanNextBtn}>
              <Text style={styles.scanNext}>Quét vé tiếp →</Text>
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
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  back: { color: colors.primaryLight, fontWeight: '700', marginBottom: spacing.md },
  eyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5, color: colors.primaryLight },
  title: { fontSize: 22, fontWeight: '900', color: '#ffffff', marginTop: 4 },
  muted: { fontSize: 12, color: colors.textSecondary, marginTop: 6, lineHeight: 16 },
  scanActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  cameraBox: {
    marginTop: spacing.md,
    height: 300,
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderCyan,
    backgroundColor: '#000',
  },
  cameraFrame: {
    position: 'absolute',
    top: 36,
    left: 36,
    right: 36,
    bottom: 88,
    borderWidth: 2,
    borderColor: 'rgba(34, 211, 238, 0.75)',
    borderRadius: 16,
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
  cameraActions: { flexDirection: 'row', gap: spacing.sm },
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
  errorBox: {
    marginTop: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.35)',
    backgroundColor: 'rgba(244, 63, 94, 0.12)',
    padding: spacing.md,
  },
  errorTitle: { color: colors.roseLight, fontWeight: '800', fontSize: 12 },
  error: { color: 'rgba(255,228,230,0.85)', marginTop: 4, fontSize: 11 },
  resultCard: { marginTop: spacing.lg, padding: spacing.lg },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  resultEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: '#ffffff',
  },
  verdictBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  verdictText: { fontSize: 11, fontWeight: '800' },
  movieRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: spacing.sm },
  movieTitle: { fontSize: 16, fontWeight: '800', color: '#ffffff', flex: 1 },
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
  metaValue: { fontSize: 13, fontWeight: '800', color: '#ffffff' },
  metaValueCode: {
    fontSize: 13,
    fontWeight: '900',
    color: colors.primaryLight,
    fontFamily: 'monospace',
  },
  metaValueMoney: { fontSize: 13, fontWeight: '800', color: colors.emeraldLight },
  message: { marginTop: spacing.md, fontSize: 13, fontWeight: '600', lineHeight: 18 },
  scanNextBtn: { marginTop: spacing.md, paddingVertical: spacing.sm },
  scanNext: {
    textAlign: 'center',
    color: colors.primaryLight,
    fontWeight: '800',
    fontSize: 12,
  },
});
