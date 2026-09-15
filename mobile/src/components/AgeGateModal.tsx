import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { AgeRating, AgeVerificationResult } from '../types';
import { colors, radius, spacing } from '../constants/theme';
import { uploadCccd } from '../api/client';
import { NeonButton } from './NeonButton';
import { AgeBadge } from './AgeBadge';

interface AgeGateModalProps {
  visible: boolean;
  rating: AgeRating;
  movieSlug?: string;
  bookingId?: string;
  showtimeId?: string;
  onClose: () => void;
  onPassed: (result: AgeVerificationResult) => void;
}

const requiredAgeMap: Record<AgeRating, number | null> = {
  P: null,
  K: null,
  T13: 13,
  T16: 16,
  T18: 18,
};

export function AgeGateModal({
  visible,
  rating,
  movieSlug,
  bookingId,
  showtimeId,
  onClose,
  onPassed,
}: AgeGateModalProps) {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageMime, setImageMime] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<AgeVerificationResult | null>(null);
  const [acceptedPolicy, setAcceptedPolicy] = useState(false);

  // Laser scanning animation
  const scanAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (scanning) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(scanAnim, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      scanAnim.stopAnimation();
    }
  }, [scanning, scanAnim]);

  useEffect(() => {
    if (!visible) {
      setAcceptedPolicy(false);
    }
  }, [visible]);

  const reqAge = requiredAgeMap[rating];

  const pickImage = async (useCamera = false) => {
    try {
      const permission = useCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          'Yêu cầu quyền truy cập',
          'Vui lòng cấp quyền máy ảnh hoặc thư viện ảnh để tải lên CCCD xác minh.'
        );
        return;
      }

      const pickerResult = useCamera
        ? await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [16, 10],
            quality: 0.85,
            exif: false,
          })
        : await ImagePicker.launchImageLibraryAsync({
            allowsEditing: true,
            aspect: [16, 10],
            quality: 0.85,
            exif: false,
          });

      if (!pickerResult.canceled && pickerResult.assets[0]) {
        const asset = pickerResult.assets[0];
        setImageUri(asset.uri);
        setImageMime(asset.mimeType ?? null);
        setImageName(asset.fileName ?? null);
        setResult(null);
      }
    } catch (err: any) {
      Alert.alert('Lỗi', err?.message || 'Không thể chọn ảnh');
    }
  };

  const handleVerify = async () => {
    if (!imageUri) {
      Alert.alert('Chưa có ảnh', 'Vui lòng chọn hoặc chụp ảnh mặt trước CCCD.');
      return;
    }
    if (!acceptedPolicy) {
      Alert.alert(
        'Chưa xác nhận điều khoản',
        'Vui lòng tích xác nhận điều khoản xác minh tuổi trước khi tiếp tục.'
      );
      return;
    }

    setScanning(true);
    try {
      const data: AgeVerificationResult = await uploadCccd({
        imageUri,
        rating,
        movieSlug,
        bookingId,
        showtimeId,
        mimeType: imageMime,
        fileName: imageName,
      });

      setResult(data);

      if (data.passed) {
        setTimeout(() => {
          onPassed(data);
        }, 1200);
      } else {
        Alert.alert(
          'Không đủ điều kiện',
          data.message || 'Rất tiếc bạn chưa đủ độ tuổi theo quy định của phim này.'
        );
      }
    } catch (err: any) {
      const fail: AgeVerificationResult = {
        passed: false,
        requiredAge: reqAge || 18,
        computedAge: null,
        confidence: null,
        verificationId: '',
        idMasked: null,
        message: err?.message || 'Không xác minh được CCCD. Kiểm tra kết nối AI/API và thử lại.',
        rawImageDeleted: true,
      };
      setResult(fail);
      Alert.alert('Xác minh thất bại', fail.message || 'Vui lòng chụp lại ảnh CCCD rõ hơn.');
    } finally {
      setScanning(false);
    }
  };

  const reset = () => {
    setImageUri(null);
    setImageMime(null);
    setImageName(null);
    setResult(null);
    setScanning(false);
    setAcceptedPolicy(false);
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Text style={styles.shieldIcon}>🛡️</Text>
              <Text style={styles.title}>Xác Minh Độ Tuổi CCCD</Text>
              <AgeBadge rating={rating} size="sm" />
            </View>
            <Text style={styles.subtitle}>
              Phim nhãn {rating} yêu cầu khán giả đủ {reqAge}+ tuổi. AI Vision sẽ quét
              mặt trước CCCD để nhận diện năm sinh.
            </Text>
          </View>

          {/* Scanner / Preview Box */}
          <View style={styles.scannerBox}>
            {/* 4 Holographic Reticle Corners */}
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />

            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.previewImage} />
            ) : (
              <View style={styles.placeholderContainer}>
                <Text style={styles.placeholderIcon}>🪪</Text>
                <Text style={styles.placeholderText}>
                  Đặt mặt trước CCCD nằm ngang trong khung
                </Text>
                <Text style={styles.placeholderSub}>
                  Đảm bảo thấy rõ ảnh chân dung và ngày sinh
                </Text>
              </View>
            )}

            {/* Laser Line Scanning Effect */}
            {scanning && (
              <Animated.View
                style={[
                  styles.laserLine,
                  {
                    transform: [
                      {
                        translateY: scanAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [10, 170],
                        }),
                      },
                    ],
                  },
                ]}
              />
            )}
          </View>

          {/* Verification Result Feedback */}
          {result && (
            <View
              style={[
                styles.resultCard,
                result.passed ? styles.resultPass : styles.resultFail,
              ]}
            >
              <Text style={styles.resultTitle}>
                {result.passed ? '✓ XÁC THỰC THÀNH CÔNG' : '✕ CHƯA ĐỦ ĐIỀU KIỆN'}
              </Text>
              {result.computedAge !== null && (
                <Text style={styles.resultText}>
                  Độ tuổi nhận diện: {result.computedAge} tuổi (Yêu cầu: {result.requiredAge}+)
                </Text>
              )}
              {result.idMasked && (
                <Text style={styles.resultSub}>Mã thẻ: {result.idMasked}</Text>
              )}
            </View>
          )}

          {/* Privacy Guarantee Note */}
          <View style={styles.privacyBox}>
            <Text style={styles.privacyText}>
              🔒 Ảnh thẻ chỉ xử lý tạm thời bằng AI và bị xóa tự động ngay sau khi kiểm tra.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.policyRow}
            onPress={() => setAcceptedPolicy((prev) => !prev)}
            activeOpacity={0.8}
          >
            <View style={[styles.checkbox, acceptedPolicy && styles.checkboxChecked]}>
              {acceptedPolicy ? <Text style={styles.checkboxMark}>✓</Text> : null}
            </View>
            <Text style={styles.policyText}>
              Tôi xác nhận CCCD thuộc về tôi, đủ tuổi theo phân loại phim, và chịu trách nhiệm nếu dùng
              giấy tờ giả / của người khác. Tôi đồng ý với điều khoản xác minh tuổi của CINEWAVE.
            </Text>
          </TouchableOpacity>

          {/* Actions */}
          <View style={styles.actionsRow}>
            {!imageUri ? (
              <>
                <NeonButton
                  title="Chụp ảnh"
                  variant="outline"
                  size="sm"
                  onPress={() => void pickImage(true)}
                  style={{ flex: 1, marginRight: spacing.sm }}
                />
                <NeonButton
                  title="Chọn từ máy"
                  variant="primary"
                  size="sm"
                  onPress={() => void pickImage(false)}
                  style={{ flex: 1 }}
                />
              </>
            ) : scanning ? (
              <View style={styles.scanningIndicator}>
                <ActivityIndicator color={colors.primary} />
                <Text style={styles.scanningText}>
                  YOLO & OCR AI đang nhận diện độ tuổi...
                </Text>
              </View>
            ) : result?.passed ? (
              <NeonButton
                title="Tiếp tục thanh toán →"
                variant="primary"
                onPress={() => onPassed(result)}
                style={{ width: '100%' }}
              />
            ) : (
              <>
                <NeonButton
                  title="Chụp lại"
                  variant="secondary"
                  size="sm"
                  onPress={reset}
                  style={{ flex: 1, marginRight: spacing.sm }}
                />
                <NeonButton
                  title="Quét AI ngay"
                  variant="primary"
                  size="sm"
                  onPress={() => void handleVerify()}
                  disabled={!acceptedPolicy}
                  style={{ flex: 1 }}
                />
              </>
            )}
          </View>

          {/* Close / Skip */}
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Đóng lại</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(6, 7, 13, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#0e1322',
    borderRadius: radius.xl,
    borderColor: 'rgba(6, 182, 212, 0.3)',
    borderWidth: 1.5,
    padding: spacing.lg,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  header: {
    marginBottom: spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  shieldIcon: {
    fontSize: 18,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: '#ffffff',
    flex: 1,
  },
  subtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 16,
    marginTop: 2,
  },
  scannerBox: {
    width: '100%',
    height: 190,
    borderRadius: radius.md,
    backgroundColor: '#06070d',
    borderColor: 'rgba(6, 182, 212, 0.35)',
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.sm,
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderContainer: {
    alignItems: 'center',
    padding: spacing.md,
  },
  placeholderIcon: {
    fontSize: 36,
    marginBottom: spacing.xs,
  },
  placeholderText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
  },
  placeholderSub: {
    fontSize: 10,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 2,
  },
  laserLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: colors.primaryLight,
    shadowColor: colors.primaryLight,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
  corner: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderColor: colors.primary,
    zIndex: 10,
  },
  cornerTL: { top: 6, left: 6, borderTopWidth: 2, borderLeftWidth: 2 },
  cornerTR: { top: 6, right: 6, borderTopWidth: 2, borderRightWidth: 2 },
  cornerBL: { bottom: 6, left: 6, borderBottomWidth: 2, borderLeftWidth: 2 },
  cornerBR: { bottom: 6, right: 6, borderBottomWidth: 2, borderRightWidth: 2 },
  resultCard: {
    padding: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    marginVertical: spacing.xs,
    alignItems: 'center',
  },
  resultPass: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: colors.emerald,
  },
  resultFail: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: colors.danger,
  },
  resultTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  resultText: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  resultSub: {
    fontSize: 10,
    color: colors.textMuted,
  },
  privacyBox: {
    marginVertical: spacing.xs,
  },
  privacyText: {
    fontSize: 10,
    color: colors.textMuted,
    textAlign: 'center',
  },
  policyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
    padding: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: 'rgba(6, 182, 212, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkboxMark: {
    color: '#041016',
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 14,
  },
  policyText: {
    flex: 1,
    fontSize: 10,
    lineHeight: 15,
    color: colors.textSecondary,
  },
  actionsRow: {
    flexDirection: 'row',
    marginTop: spacing.md,
  },
  scanningIndicator: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: spacing.sm,
  },
  scanningText: {
    fontSize: 12,
    color: colors.primaryLight,
    fontWeight: '600',
  },
  closeButton: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
    marginTop: spacing.xs,
  },
  closeButtonText: {
    fontSize: 12,
    color: colors.textMuted,
  },
});

