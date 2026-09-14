import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useCatalog } from '../context/catalog-context';
import { AgeRating, AGE_RATINGS } from '../types';
import { colors, radius, spacing } from '../constants/theme';
import { MovieCard } from '../components/MovieCard';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - spacing.lg * 2 - spacing.md) / 2;

export function MoviesScreen() {
  const navigation = useNavigation<any>();
  const { movies } = useCatalog();

  const [query, setQuery] = useState('');
  const [selectedRating, setSelectedRating] = useState<AgeRating | 'ALL'>('ALL');

  const filteredMovies = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return movies.filter((m) => {
      const matchRating = selectedRating === 'ALL' || m.rating === selectedRating;
      const matchQuery =
        !needle ||
        m.title.toLowerCase().includes(needle) ||
        m.genres.some((g) => g.toLowerCase().includes(needle));
      return matchRating && matchQuery;
    });
  }, [movies, query, selectedRating]);

  const ratingOptions: Array<AgeRating | 'ALL'> = ['ALL', ...AGE_RATINGS];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.eyebrow}>IMAX CATALOG</Text>
          <Text style={styles.title}>Danh Sách Phim</Text>
          <Text style={styles.subtitle}>
            Hiển thị <Text style={styles.count}>{filteredMovies.length}</Text> tác phẩm điện ảnh.
          </Text>

          {/* Search Box */}
          <View style={styles.searchBox}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Tìm kiếm phim, thể loại..."
              placeholderTextColor={colors.textMuted}
              style={styles.searchInput}
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')}>
                <Text style={styles.clearIcon}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Filter Pills */}
        <View style={styles.filterSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            {ratingOptions.map((rating) => {
              const active = selectedRating === rating;
              return (
                <TouchableOpacity
                  key={rating}
                  activeOpacity={0.8}
                  onPress={() => setSelectedRating(rating)}
                  style={[
                    styles.filterPill,
                    active && styles.filterPillActive,
                  ]}
                >
                  <Text style={[styles.filterText, active && styles.filterTextActive]}>
                    {rating === 'ALL' ? 'Tất cả' : `Nhãn ${rating}`}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Movie Grid */}
        <FlatList
          data={filteredMovies}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.gridContainer}
          columnWrapperStyle={styles.gridRow}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <MovieCard
              movie={item}
              width={CARD_WIDTH}
              onPress={() => navigation.navigate('MovieDetail', { slug: item.slug })}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🎬</Text>
              <Text style={styles.emptyTitle}>Không tìm thấy phim</Text>
              <Text style={styles.emptySub}>Thử tìm kiếm với từ khóa khác hoặc bỏ chọn bộ lọc.</Text>
            </View>
          }
        />
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
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: colors.primaryLight,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#ffffff',
    marginTop: 2,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    marginBottom: spacing.md,
  },
  count: {
    color: colors.primaryLight,
    fontWeight: '800',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(14, 19, 34, 0.90)',
    borderColor: 'rgba(255, 255, 255, 0.10)',
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 44,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 13,
  },
  clearIcon: {
    color: colors.textMuted,
    fontSize: 14,
    padding: 4,
  },
  filterSection: {
    marginVertical: spacing.xs,
  },
  filterScroll: {
    paddingHorizontal: spacing.lg,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: 'rgba(14, 19, 34, 0.70)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
  },
  filterPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryLight,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 3,
  },
  filterText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  filterTextActive: {
    color: '#06070d',
  },
  gridContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  gridRow: {
    justifyContent: 'space-between',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
  },
  emptySub: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});

