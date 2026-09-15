import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors, radius, spacing } from '../../constants/theme';
import { broadcastAdminNotification } from '../../api/admin';
import { GlassCard } from '../../components/GlassCard';
import { NeonButton } from '../../components/NeonButton';
import { ApiError } from '../../api/client';

export function AdminNotificationsScreen() {
  const navigation = useNavigation<any>();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [href, setHref] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) {
      Alert.alert('Thiếu nội dung', 'Nhập tiêu đề và nội dung thông báo.');
      return;
    }
    setSending(true);
    try {
      const res = await broadcastAdminNotification({
        title: title.trim(),
        body: body.trim(),
        href: href.trim() || undefined,
      });
      Alert.alert('Đã gửi', `Đã broadcast tới ${res.sent}/${res.totalUsers} người dùng.`);
      setTitle('');
      setBody('');
      setHref('');
    } catch (err) {
      Alert.alert('Lỗi', err instanceof ApiError ? err.message : 'Không gửi được thông báo');
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹ Dashboard</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Broadcast Thông Báo</Text>
        <GlassCard style={styles.card} highlight>
          <TextInput
            style={styles.input}
            placeholder="Tiêu đề"
            placeholderTextColor={colors.textMuted}
            value={title}
            onChangeText={setTitle}
          />
          <TextInput
            style={[styles.input, styles.area]}
            placeholder="Nội dung"
            placeholderTextColor={colors.textMuted}
            value={body}
            onChangeText={setBody}
            multiline
          />
          <TextInput
            style={styles.input}
            placeholder="Href (tuỳ chọn, VD: /tickets)"
            placeholderTextColor={colors.textMuted}
            value={href}
            onChangeText={setHref}
          />
          <NeonButton title={sending ? 'Đang gửi…' : 'Gửi tất cả user'} loading={sending} onPress={() => void handleSend()} />
        </GlassCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg },
  back: { color: colors.primaryLight, fontWeight: '700', marginBottom: 6 },
  title: { fontSize: 22, fontWeight: '900', color: '#fff', marginBottom: spacing.md },
  card: { padding: spacing.lg, gap: spacing.sm },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: radius.md,
    color: '#fff',
    paddingHorizontal: spacing.md,
    height: 44,
  },
  area: { height: 110, textAlignVertical: 'top', paddingTop: 12 },
});
