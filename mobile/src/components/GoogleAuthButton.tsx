import React, { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView, type WebViewNavigation } from 'react-native-webview';
import { ApiError, apiUrl, ensureLanApiUrl } from '../api/client';
import { redeemGoogleMobileTicketApi } from '../api/auth';
import { useAuth } from '../context/auth-context';
import { AuthUser } from '../types';
import { colors, radius, spacing } from '../constants/theme';

type Props = {
  label?: string;
  onSuccess: (user: AuthUser) => void;
};

function rewriteLocalhostToLan(url: string, lanBase: string): string | null {
  try {
    const lan = new URL(lanBase);
    const current = new URL(url);
    if (current.hostname === 'localhost' || current.hostname === '127.0.0.1') {
      current.protocol = lan.protocol;
      current.hostname = lan.hostname;
      current.port = lan.port;
      return current.toString();
    }
  } catch {
    /* ignore */
  }
  return null;
}

function parseAuthPayload(url: string) {
  try {
    const parsed = new URL(url);
    return {
      path: parsed.pathname,
      error: parsed.searchParams.get('error'),
      ticket: parsed.searchParams.get('ticket'),
    };
  } catch {
    const errorMatch = url.match(/[?&]error=([^&]+)/);
    const ticketMatch = url.match(/[?&]ticket=([^&]+)/);
    return {
      path: '',
      error: errorMatch ? decodeURIComponent(errorMatch[1]) : null,
      ticket: ticketMatch ? decodeURIComponent(ticketMatch[1]) : null,
    };
  }
}

function isMobileDoneUrl(url: string) {
  return (
    url.includes('/auth/google/mobile-done') ||
    url.startsWith('cinewave://oauth/google')
  );
}

export function GoogleAuthButton({ label = 'Tiếp tục với Google', onSuccess }: Props) {
  const { setUser } = useAuth();
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [startUrl, setStartUrl] = useState<string | null>(null);
  const lanBaseRef = useRef(ensureLanApiUrl());
  const finishingRef = useRef(false);
  const webRef = useRef<WebView>(null);

  const source = useMemo(() => (startUrl ? { uri: startUrl } : undefined), [startUrl]);

  const closeModal = () => {
    setOpen(false);
    setStartUrl(null);
    setBusy(false);
    finishingRef.current = false;
  };

  const finishWithUrl = async (url: string) => {
    if (finishingRef.current) return;
    if (!isMobileDoneUrl(url) && !url.includes('ticket=') && !url.includes('error=')) return;
    finishingRef.current = true;

    const { error, ticket } = parseAuthPayload(url);
    if (error) {
      closeModal();
      const messages: Record<string, string> = {
        google_denied: 'Bạn đã hủy đăng nhập Google.',
        google_failed: 'Không đăng nhập được bằng Google.',
        google_config: 'Chưa cấu hình Google OAuth trên server.',
      };
      Alert.alert('Google', messages[error] ?? `Đăng nhập Google thất bại (${error}).`);
      return;
    }

    if (!ticket) {
      closeModal();
      Alert.alert('Google', 'Không nhận được phiên đăng nhập từ server.');
      return;
    }

    try {
      const user = await redeemGoogleMobileTicketApi(ticket);
      setUser(user);
      closeModal();
      onSuccess(user);
    } catch (err: unknown) {
      closeModal();
      Alert.alert('Google', err instanceof ApiError ? err.message : 'Không đăng nhập được bằng Google');
    }
  };

  const handleUrl = (url: string): boolean => {
    if (!url) return true;

    if (isMobileDoneUrl(url)) {
      void finishWithUrl(url);
      return false;
    }

    // Custom scheme — never let WebView try to open it externally
    if (url.startsWith('cinewave://')) {
      void finishWithUrl(url);
      return false;
    }

    const rewritten = rewriteLocalhostToLan(url, lanBaseRef.current);
    if (rewritten && rewritten !== url) {
      setStartUrl(rewritten);
      return false;
    }

    return true;
  };

  const handlePress = () => {
    const base = ensureLanApiUrl();
    if (/localhost|127\.0\.0\.1/i.test(base)) {
      Alert.alert(
        'Sai địa chỉ API',
        `Điện thoại không gọi được localhost.\nHiện tại: ${base}\nVào Hồ sơ đổi thành IP máy (vd http://192.168.2.8:4000).`,
      );
      return;
    }
    lanBaseRef.current = base;
    finishingRef.current = false;
    setBusy(true);
    setStartUrl(`${apiUrl('/auth/google')}?platform=mobile`);
    setOpen(true);
  };

  const onNav = (nav: WebViewNavigation) => {
    handleUrl(nav.url || '');
  };

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.85}
        disabled={busy}
        onPress={handlePress}
        style={[styles.btn, busy && styles.btnDisabled]}
      >
        {busy && !open ? (
          <ActivityIndicator color={colors.primaryLight} size="small" />
        ) : (
          <>
            <View style={styles.glyphWrap}>
              <Text style={styles.glyphG}>G</Text>
            </View>
            <Text style={styles.label}>{label}</Text>
          </>
        )}
      </TouchableOpacity>

      <Modal visible={open} animationType="slide" onRequestClose={closeModal}>
        <SafeAreaView style={styles.modalSafe} edges={['top', 'bottom']}>
          <View style={styles.modalBar}>
            <TouchableOpacity onPress={closeModal}>
              <Text style={styles.closeText}>Đóng</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Đăng nhập Google</Text>
            <View style={{ width: 48 }} />
          </View>
          {source ? (
            <WebView
              ref={webRef}
              source={source}
              onNavigationStateChange={onNav}
              onShouldStartLoadWithRequest={(req) => handleUrl(req.url || '')}
              // Android often fires custom schemes here instead of shouldStartLoad
              onOpenWindow={(e) => {
                const url = e.nativeEvent.targetUrl || '';
                handleUrl(url);
              }}
              setSupportMultipleWindows={false}
              originWhitelist={['https://*', 'http://*', 'cinewave://*']}
              startInLoadingState
              renderLoading={() => (
                <View style={styles.loadingBox}>
                  <ActivityIndicator color={colors.primaryLight} />
                </View>
              )}
              style={styles.webview}
            />
          ) : null}
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  btnDisabled: {
    opacity: 0.55,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  glyphWrap: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyphG: {
    fontSize: 12,
    fontWeight: '900',
    color: '#4285F4',
  },
  modalSafe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  closeText: {
    color: colors.primaryLight,
    fontWeight: '700',
    width: 48,
  },
  modalTitle: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 14,
  },
  webview: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingBox: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
