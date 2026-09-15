import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors, radius, spacing } from '../../constants/theme';
import {
  fetchAdminSystemSettings,
  SystemSettingRow,
  SystemStatus,
  updateAdminSystemSettings,
} from '../../api/admin';
import { GlassCard } from '../../components/GlassCard';
import { NeonButton } from '../../components/NeonButton';
import { ApiError } from '../../api/client';

export function AdminSystemScreen() {
  const navigation = useNavigation<any>();
  const [settings, setSettings] = useState<SystemSettingRow[]>([]);
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [password, setPassword] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  const editable = useMemo(() => settings.filter((s) => s.editable), [settings]);

  const load = async () => {
    try {
      const data = await fetchAdminSystemSettings();
      setSettings(data.settings);
      setStatus(data.status);
      const next: Record<string, string> = {};
      for (const row of data.settings) {
        if (row.editable) next[row.key] = row.value ?? '';
      }
      setDraft(next);
    } catch (err) {
      Alert.alert('Lỗi', err instanceof ApiError ? err.message : 'Không tải được system settings');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleSave = async () => {
    if (!password.trim()) {
      Alert.alert('Cần mật khẩu', 'Nhập mật khẩu admin để xác nhận thay đổi.');
      return;
    }
    setSaving(true);
    try {
      const payload: Record<string, string | null> = {};
      for (const row of editable) {
        const value = (draft[row.key] ?? '').trim();
        payload[row.key] = value.length ? value : null;
      }
      const res = await updateAdminSystemSettings({
        settings: payload,
        confirmPassword: password,
      });
      setSettings(res.settings);
      setStatus(res.status);
      setPassword('');
      Alert.alert('Đã lưu', res.changed.length ? `Đã đổi: ${res.changed.join(', ')}` : 'Không có thay đổi.');
    } catch (err) {
      Alert.alert('Lỗi', err instanceof ApiError ? err.message : 'Không lưu được cấu hình');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void load();
            }}
            tintColor={colors.primary}
          />
        }
      >
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹ Dashboard</Text>
        </TouchableOpacity>
        <Text style={styles.title}>System Settings</Text>

        {status ? (
          <GlassCard style={styles.card}>
            <Text style={styles.meta}>ENV: {status.nodeEnv}</Text>
            <Text style={styles.meta}>Uptime: {Math.round(status.uptimeSec)}s</Text>
            {status.checks.map((c) => (
              <Text key={c.id} style={[styles.meta, { color: c.ok ? colors.emeraldLight : colors.roseLight }]}>
                {c.ok ? '✓' : '✕'} {c.label}
              </Text>
            ))}
          </GlassCard>
        ) : null}

        {editable.map((row) => (
          <GlassCard key={row.key} style={styles.card}>
            <Text style={styles.label}>{row.label}</Text>
            <Text style={styles.hint}>{row.description}</Text>
            <TextInput
              style={styles.input}
              value={draft[row.key] ?? ''}
              onChangeText={(text) => setDraft((prev) => ({ ...prev, [row.key]: text }))}
              placeholder={row.hint || row.key}
              placeholderTextColor={colors.textMuted}
              secureTextEntry={row.sensitivity === 'secret'}
              autoCapitalize="none"
            />
          </GlassCard>
        ))}

        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="Mật khẩu admin xác nhận"
          placeholderTextColor={colors.textMuted}
          secureTextEntry
        />
        <NeonButton title={saving ? 'Đang lưu…' : 'Lưu cấu hình'} loading={saving} onPress={() => void handleSave()} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.sm, paddingBottom: spacing.xxxl },
  back: { color: colors.primaryLight, fontWeight: '700', marginBottom: 6 },
  title: { fontSize: 22, fontWeight: '900', color: '#fff', marginBottom: spacing.md },
  card: { padding: spacing.md, gap: 4 },
  label: { color: '#fff', fontWeight: '800', fontSize: 13 },
  hint: { color: colors.textMuted, fontSize: 10 },
  meta: { color: colors.textSecondary, fontSize: 11, marginTop: 2 },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: radius.md,
    color: '#fff',
    paddingHorizontal: spacing.md,
    height: 44,
    marginTop: 4,
  },
});
