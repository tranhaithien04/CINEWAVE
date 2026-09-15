import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors, radius, spacing } from '../../constants/theme';
import {
  AdminConcession,
  createAdminConcession,
  deleteAdminConcession,
  fetchAdminConcessions,
  updateAdminConcession,
} from '../../api/admin';
import { GlassCard } from '../../components/GlassCard';
import { NeonButton } from '../../components/NeonButton';
import { formatVnd } from '../../data/mock-data';
import { ApiError } from '../../api/client';

export function AdminConcessionsScreen() {
  const navigation = useNavigation<any>();
  const [items, setItems] = useState<AdminConcession[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('45000');
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const data = await fetchAdminConcessions();
      setItems(data.items);
    } catch (err) {
      Alert.alert('Lỗi', err instanceof ApiError ? err.message : 'Không tải được combo');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Thiếu tên', 'Nhập tên combo.');
      return;
    }
    setSaving(true);
    try {
      const res = await createAdminConcession({
        name: name.trim(),
        description: description.trim(),
        price: Number(price) || 0,
        active,
      });
      setItems((prev) => [res.item, ...prev]);
      setModalOpen(false);
      setName('');
      setDescription('');
      setPrice('45000');
      setActive(true);
    } catch (err) {
      Alert.alert('Lỗi', err instanceof ApiError ? err.message : 'Không tạo được combo');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (item: AdminConcession) => {
    try {
      const res = await updateAdminConcession(item.id, { active: !item.active });
      setItems((prev) => prev.map((x) => (x.id === item.id ? res.item : x)));
    } catch (err) {
      Alert.alert('Lỗi', err instanceof ApiError ? err.message : 'Không cập nhật được');
    }
  };

  const handleDelete = (item: AdminConcession) => {
    Alert.alert('Xóa combo', `Xóa ${item.name}?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteAdminConcession(item.id);
            setItems((prev) => prev.filter((x) => x.id !== item.id));
          } catch (err) {
            Alert.alert('Lỗi', err instanceof ApiError ? err.message : 'Không xóa được');
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹ Dashboard</Text>
        </TouchableOpacity>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Bắp nước / Combo</Text>
          <TouchableOpacity onPress={() => setModalOpen(true)} style={styles.addBtn}>
            <Text style={styles.addText}>+ Thêm</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
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
        ListEmptyComponent={<Text style={styles.empty}>Chưa có combo.</Text>}
        renderItem={({ item }) => (
          <GlassCard style={styles.card}>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.meta}>{item.description || '—'}</Text>
                <Text style={styles.price}>{formatVnd(item.price)}</Text>
              </View>
              <Switch value={item.active} onValueChange={() => void toggleActive(item)} />
            </View>
            <TouchableOpacity onPress={() => handleDelete(item)}>
              <Text style={styles.delete}>Xóa</Text>
            </TouchableOpacity>
          </GlassCard>
        )}
      />

      <Modal visible={modalOpen} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.title}>Thêm combo</Text>
            <TextInput style={styles.input} placeholder="Tên" placeholderTextColor={colors.textMuted} value={name} onChangeText={setName} />
            <TextInput style={styles.input} placeholder="Mô tả" placeholderTextColor={colors.textMuted} value={description} onChangeText={setDescription} />
            <TextInput style={styles.input} placeholder="Giá" placeholderTextColor={colors.textMuted} keyboardType="numeric" value={price} onChangeText={setPrice} />
            <View style={styles.row}>
              <Text style={styles.meta}>Đang bán</Text>
              <Switch value={active} onValueChange={setActive} />
            </View>
            <NeonButton title={saving ? 'Đang lưu…' : 'Tạo combo'} loading={saving} onPress={() => void handleCreate()} />
            <TouchableOpacity onPress={() => setModalOpen(false)} style={{ marginTop: spacing.sm }}>
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
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '900', color: '#fff' },
  addBtn: { borderWidth: 1, borderColor: colors.borderCyan, borderRadius: radius.sm, paddingHorizontal: 10, paddingVertical: 6 },
  addText: { color: colors.primaryLight, fontWeight: '700', fontSize: 12 },
  list: { padding: spacing.lg, gap: spacing.sm },
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: 40 },
  card: { padding: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  name: { fontSize: 14, fontWeight: '800', color: '#fff' },
  meta: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  price: { fontSize: 13, fontWeight: '800', color: colors.emeraldLight, marginTop: 4 },
  delete: { marginTop: spacing.sm, color: colors.roseLight, fontWeight: '700', fontSize: 12 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', padding: spacing.lg },
  modal: { backgroundColor: '#0e1322', borderRadius: radius.lg, borderWidth: 1, borderColor: colors.borderCyan, padding: spacing.lg, gap: spacing.sm },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: radius.md,
    color: '#fff',
    paddingHorizontal: spacing.md,
    height: 44,
  },
});
