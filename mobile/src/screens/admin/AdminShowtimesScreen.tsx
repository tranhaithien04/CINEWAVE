import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useCatalog } from '../../context/catalog-context';
import { Showtime } from '../../types';
import { colors, radius, spacing } from '../../constants/theme';
import { GlassCard } from '../../components/GlassCard';
import { NeonButton } from '../../components/NeonButton';
import { formatVnd } from '../../data/mock-data';
import { createShowtime, deleteShowtime } from '../../api/admin';

export function AdminShowtimesScreen() {
  const navigation = useNavigation<any>();
  const { showtimes, movies, refresh } = useCatalog();

  const [modalOpen, setModalOpen] = useState(false);
  const [movieSlug, setMovieSlug] = useState(movies[0]?.slug || '');
  const [cinema, setCinema] = useState('CineWave Landmark 81');
  const [room, setRoom] = useState('IMAX Laser 01');
  const [price, setPrice] = useState('120000');
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    setSaving(true);
    try {
      await createShowtime({
        movieSlug: movieSlug || movies[0]?.slug || 'dao-hai-tac',
        cinema: cinema.trim(),
        room: room.trim(),
        startsAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
        priceBase: Number(price) || 120000,
      });

      await refresh();
      setModalOpen(false);
      Alert.alert('Thành công', 'Đã thêm suất chiếu mới.');
    } catch (err: any) {
      Alert.alert('Lỗi', err?.message || 'Không thể tạo suất chiếu.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (s: Showtime) => {
    Alert.alert('Xóa suất chiếu', `Xóa suất ${s.room} - ${s.cinema}?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteShowtime(s.id);
            await refresh();
            Alert.alert('Đã xóa', 'Suất chiếu đã được gỡ bỏ.');
          } catch (err: any) {
            Alert.alert('Lỗi', err?.message || 'Không thể xóa suất này.');
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>‹ Dashboard</Text>
          </TouchableOpacity>
          <View style={styles.titleRow}>
            <Text style={styles.title}>Quản Lý Suất Chiếu ({showtimes.length})</Text>
            <TouchableOpacity onPress={() => setModalOpen(true)} style={styles.addBtn}>
              <Text style={styles.addBtnText}>+ Thêm suất</Text>
            </TouchableOpacity>
          </View>
        </View>

        <FlatList
          data={showtimes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const timeStr = new Date(item.startsAt).toLocaleTimeString('vi-VN', {
              hour: '2-digit',
              minute: '2-digit',
            });
            const dateStr = new Date(item.startsAt).toLocaleDateString('vi-VN', {
              day: '2-digit',
              month: '2-digit',
            });

            return (
              <GlassCard style={styles.card}>
                <View style={styles.cardRow}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.timeBadgeRow}>
                      <Text style={styles.showtimeTime}>{timeStr} · {dateStr}</Text>
                      <View style={styles.imaxBadge}>
                        <Text style={styles.imaxText}>{item.room}</Text>
                      </View>
                    </View>
                    <Text style={styles.movieSlug}>Phim: {item.movieSlug}</Text>
                    <Text style={styles.cinemaText}>{item.cinema}</Text>
                    <Text style={styles.priceText}>{formatVnd(item.priceBase)}</Text>
                  </View>

                  <TouchableOpacity onPress={() => handleDelete(item)} style={styles.deleteBtn}>
                    <Text style={styles.deleteBtnText}>Xóa</Text>
                  </TouchableOpacity>
                </View>
              </GlassCard>
            );
          }}
        />

        {/* Add Showtime Modal */}
        <Modal visible={modalOpen} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Thêm Suất Chiếu Mới</Text>

              <Text style={styles.inputLabel}>Chọn phim (Slug)</Text>
              <TextInput
                value={movieSlug}
                onChangeText={setMovieSlug}
                placeholder="VD: dao-hai-tac"
                placeholderTextColor={colors.textMuted}
                style={styles.input}
              />

              <Text style={styles.inputLabel}>Cụm rạp</Text>
              <TextInput
                value={cinema}
                onChangeText={setCinema}
                style={styles.input}
              />

              <Text style={styles.inputLabel}>Phòng chiếu</Text>
              <TextInput
                value={room}
                onChangeText={setRoom}
                style={styles.input}
              />

              <Text style={styles.inputLabel}>Giá vé cơ bản (VNĐ)</Text>
              <TextInput
                value={price}
                onChangeText={setPrice}
                keyboardType="numeric"
                style={styles.input}
              />

              <View style={styles.modalBtnsRow}>
                <NeonButton
                  title="Hủy"
                  variant="secondary"
                  size="sm"
                  onPress={() => setModalOpen(false)}
                  style={{ flex: 1, marginRight: spacing.sm }}
                />
                <NeonButton
                  title={saving ? 'Đang lưu...' : 'Lưu suất chiếu'}
                  variant="primary"
                  size="sm"
                  loading={saving}
                  onPress={() => void handleCreate()}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          </View>
        </Modal>
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: '#ffffff',
  },
  addBtn: {
    backgroundColor: 'rgba(6, 182, 212, 0.2)',
    borderColor: colors.borderCyan,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.md,
  },
  addBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primaryLight,
  },
  list: {
    padding: spacing.lg,
    gap: spacing.sm,
    paddingBottom: spacing.xxxl,
  },
  card: {
    padding: spacing.md,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  showtimeTime: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ffffff',
  },
  imaxBadge: {
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    borderColor: 'rgba(6, 182, 212, 0.3)',
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  imaxText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.primaryLight,
  },
  movieSlug: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '700',
    marginTop: 2,
  },
  cinemaText: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
  priceText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.emeraldLight,
    marginTop: 4,
  },
  deleteBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  deleteBtnText: {
    color: colors.roseLight,
    fontSize: 11,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(6, 7, 13, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#0e1322',
    borderColor: colors.borderCyan,
    borderWidth: 1.5,
    borderRadius: radius.xl,
    padding: spacing.lg,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    marginTop: spacing.sm,
    marginBottom: 4,
  },
  input: {
    backgroundColor: 'rgba(6, 7, 13, 0.8)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 40,
    color: '#ffffff',
    fontSize: 13,
  },
  modalBtnsRow: {
    flexDirection: 'row',
    marginTop: spacing.lg,
  },
});

