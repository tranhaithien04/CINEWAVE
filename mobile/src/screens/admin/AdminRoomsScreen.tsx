import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors, radius, spacing } from '../../constants/theme';
import { AdminRoom, fetchAdminRooms, updateAdminRoomBlockedSeats } from '../../api/admin';
import { GlassCard } from '../../components/GlassCard';
import { NeonButton } from '../../components/NeonButton';
import { ApiError } from '../../api/client';

export function AdminRoomsScreen() {
  const navigation = useNavigation<any>();
  const [rooms, setRooms] = useState<AdminRoom[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<AdminRoom | null>(null);
  const [blockedText, setBlockedText] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const data = await fetchAdminRooms();
      setRooms(data.rooms);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không tải được phòng');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const openEdit = (room: AdminRoom) => {
    setEditing(room);
    setBlockedText(room.blockedSeats.join(', '));
  };

  const saveBlocked = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const blockedSeats = blockedText
        .split(/[,\s]+/)
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean);
      const res = await updateAdminRoomBlockedSeats({
        cinema: editing.cinema,
        room: editing.room,
        blockedSeats,
      });
      setRooms((prev) =>
        prev.map((r) =>
          r.cinema === editing.cinema && r.room === editing.room
            ? { ...r, blockedSeats: res.blockedSeats }
            : r,
        ),
      );
      setEditing(null);
      Alert.alert('Đã lưu', `Đã khóa ${res.blockedSeats.length} ghế cho phòng ${editing.room}.`);
    } catch (err) {
      Alert.alert('Lỗi', err instanceof ApiError ? err.message : 'Không cập nhật được ghế khóa');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹ Dashboard</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Phòng & Khóa Ghế</Text>
        <Text style={styles.hint}>
          Đổi loại ghế / thêm / xóa sơ đồ: dùng Admin Web. Tại đây chỉnh ghế khóa theo suất phòng.
        </Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
      <FlatList
        data={rooms}
        keyExtractor={(item) => `${item.cinema}::${item.room}`}
        contentContainerStyle={styles.list}
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
        ListEmptyComponent={<Text style={styles.empty}>Chưa có phòng.</Text>}
        renderItem={({ item }) => (
          <GlassCard style={styles.card}>
            <Text style={styles.name}>{item.room}</Text>
            <Text style={styles.meta}>
              {item.cinema} · {item.showtimeCount} suất
            </Text>
            <Text style={styles.blocked}>
              Ghế khóa: {item.blockedSeats.length ? item.blockedSeats.join(', ') : 'Không'}
            </Text>
            <TouchableOpacity onPress={() => openEdit(item)} style={styles.editBtn}>
              <Text style={styles.editText}>Sửa ghế khóa</Text>
            </TouchableOpacity>
          </GlassCard>
        )}
      />

      <Modal visible={Boolean(editing)} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              Khóa ghế · {editing?.room}
            </Text>
            <Text style={styles.meta}>Nhập mã ghế cách nhau bởi dấu phẩy (VD: A1, A2, B5)</Text>
            <TextInput
              value={blockedText}
              onChangeText={setBlockedText}
              multiline
              style={styles.input}
              placeholderTextColor={colors.textMuted}
              placeholder="A1, A2, B5"
            />
            <NeonButton title={saving ? 'Đang lưu…' : 'Lưu'} loading={saving} onPress={() => void saveBlocked()} />
            <TouchableOpacity onPress={() => setEditing(null)} style={{ marginTop: spacing.sm }}>
              <Text style={styles.back}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  back: { color: colors.primaryLight, fontWeight: '700', marginBottom: 6 },
  title: { fontSize: 22, fontWeight: '900', color: '#fff' },
  hint: { fontSize: 11, color: colors.textMuted, marginTop: 6, lineHeight: 16 },
  error: { color: colors.roseLight, marginTop: 6 },
  list: { padding: spacing.lg, gap: spacing.sm },
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: 40 },
  card: { padding: spacing.md },
  name: { fontSize: 15, fontWeight: '800', color: '#fff' },
  meta: { fontSize: 11, color: colors.textSecondary, marginTop: 4 },
  blocked: { fontSize: 11, color: colors.goldLight, marginTop: 6 },
  editBtn: {
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.borderCyan,
  },
  editText: { color: colors.primaryLight, fontWeight: '700', fontSize: 11 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    backgroundColor: '#0e1322',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderCyan,
    padding: spacing.lg,
  },
  modalTitle: { fontSize: 16, fontWeight: '900', color: '#fff', marginBottom: spacing.sm },
  input: {
    minHeight: 90,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: radius.md,
    color: '#fff',
    padding: spacing.md,
    marginVertical: spacing.md,
    textAlignVertical: 'top',
  },
});
