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
import { Movie, AgeRating, AGE_RATINGS } from '../../types';
import { colors, radius, spacing } from '../../constants/theme';
import { GlassCard } from '../../components/GlassCard';
import { AgeBadge } from '../../components/AgeBadge';
import { NeonButton } from '../../components/NeonButton';
import { createMovie, deleteMovie, enrichAdminMovie, syncAdminNowPlaying } from '../../api/admin';

export function AdminMoviesScreen() {
  const navigation = useNavigation<any>();
  const { movies, refresh } = useCatalog();

  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [desc, setDesc] = useState('');
  const [duration, setDuration] = useState('120');
  const [rating, setRating] = useState<AgeRating>('P');
  const [genres, setGenres] = useState('Hành động, Phiêu lưu');
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const handleSyncNowPlaying = async () => {
    setSyncing(true);
    try {
      const res = await syncAdminNowPlaying({ limit: 12 });
      await refresh();
      Alert.alert(
        'Đồng bộ xong',
        `Import ${res.imported.length} phim · bỏ qua ${res.skipped} · lỗi ${res.failed.length}`,
      );
    } catch (err: any) {
      Alert.alert('Lỗi', err?.message || 'Không sync được phim đang chiếu');
    } finally {
      setSyncing(false);
    }
  };

  const handleEnrich = async (m: Movie) => {
    try {
      await enrichAdminMovie(m.id);
      await refresh();
      Alert.alert('Đã làm giàu', `Đã cập nhật metadata cho ${m.title}`);
    } catch (err: any) {
      Alert.alert('Lỗi', err?.message || 'Không enrich được phim');
    }
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      Alert.alert('Thiếu tên phim', 'Vui lòng nhập tên phim.');
      return;
    }

    setSaving(true);
    const movieSlug = slug.trim() || title.trim().toLowerCase().replace(/\s+/g, '-');
    try {
      await createMovie({
        title: title.trim(),
        slug: movieSlug,
        description: desc.trim() || 'Mô tả tác phẩm điện ảnh.',
        durationMin: Number(duration) || 120,
        rating,
        posterUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&h=900',
        backdropUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1600&q=80',
        genres: genres.split(',').map((g) => g.trim()).filter(Boolean),
        nowShowing: true,
      });

      await refresh();
      setModalOpen(false);
      Alert.alert('Thành công', 'Đã thêm phim mới vào hệ thống.');
    } catch (err: any) {
      Alert.alert('Lỗi', err?.message || 'Không thể tạo phim.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (m: Movie) => {
    Alert.alert('Xóa phim', `Bạn có chắc muốn xóa phim "${m.title}"?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteMovie(m.id);
            await refresh();
            Alert.alert('Đã xóa', 'Phim đã được gỡ bỏ.');
          } catch (err: any) {
            Alert.alert('Lỗi', err?.message || 'Không thể xóa phim này.');
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
            <Text style={styles.title}>Quản Lý Phim ({movies.length})</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity onPress={() => void handleSyncNowPlaying()} style={styles.addBtn}>
                <Text style={styles.addBtnText}>{syncing ? '...' : 'Sync'}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setModalOpen(true)} style={styles.addBtn}>
                <Text style={styles.addBtnText}>+ Thêm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <FlatList
          data={movies}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <GlassCard style={styles.card}>
              <View style={styles.cardRow}>
                <View style={{ flex: 1 }}>
                  <View style={styles.titleWithBadge}>
                    <Text style={styles.movieTitle}>{item.title}</Text>
                    <AgeBadge rating={item.rating} size="sm" />
                  </View>
                  <Text style={styles.metaText}>
                    {item.durationMin} phút · {item.genres.join(', ')}
                  </Text>
                  <Text style={styles.slugText}>Slug: {item.slug}</Text>
                </View>

                <View style={{ gap: 8 }}>
                  <TouchableOpacity onPress={() => void handleEnrich(item)} style={styles.deleteBtn}>
                    <Text style={[styles.deleteBtnText, { color: colors.primaryLight }]}>Enrich</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(item)} style={styles.deleteBtn}>
                    <Text style={styles.deleteBtnText}>Xóa</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </GlassCard>
          )}
        />

        {/* Add Movie Modal */}
        <Modal visible={modalOpen} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Thêm Phim Mới</Text>

              <Text style={styles.inputLabel}>Tên phim</Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="VD: Avatar 3"
                placeholderTextColor={colors.textMuted}
                style={styles.input}
              />

              <Text style={styles.inputLabel}>Thời lượng (phút)</Text>
              <TextInput
                value={duration}
                onChangeText={setDuration}
                keyboardType="numeric"
                style={styles.input}
              />

              <Text style={styles.inputLabel}>Nhãn độ tuổi</Text>
              <View style={styles.ratingsRow}>
                {AGE_RATINGS.map((r) => (
                  <TouchableOpacity
                    key={r}
                    onPress={() => setRating(r)}
                    style={[styles.ratingPill, rating === r && styles.ratingPillActive]}
                  >
                    <Text style={[styles.ratingPillText, rating === r && styles.ratingPillTextActive]}>
                      {r}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Thể loại</Text>
              <TextInput
                value={genres}
                onChangeText={setGenres}
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
                  title={saving ? 'Đang lưu...' : 'Lưu phim'}
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
  titleWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  movieTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
  },
  metaText: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  slugText: {
    fontSize: 10,
    color: colors.textMuted,
    fontFamily: 'monospace',
    marginTop: 2,
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
  ratingsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  ratingPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  ratingPillActive: {
    backgroundColor: colors.primary,
  },
  ratingPillText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  ratingPillTextActive: {
    color: '#06070d',
    fontWeight: '900',
  },
  modalBtnsRow: {
    flexDirection: 'row',
    marginTop: spacing.lg,
  },
});

