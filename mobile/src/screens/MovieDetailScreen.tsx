import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { WebView } from 'react-native-webview';
import { useCatalog } from '../context/catalog-context';
import { colors, radius, spacing } from '../constants/theme';
import { AgeBadge } from '../components/AgeBadge';
import { NeonButton } from '../components/NeonButton';
import { GlassCard } from '../components/GlassCard';
import { formatVnd } from '../data/mock-data';
import { fetchSimilarMovies, SimilarMovie } from '../api/catalog';

const { width } = Dimensions.get('window');

function toEmbedTrailerUrl(url?: string | null): string | null {
  if (!url?.trim()) return null;
  const raw = url.trim();
  try {
    const parsed = new URL(raw);
    const host = parsed.hostname.replace(/^www\./, '');
    if (host === 'youtu.be') {
      const id = parsed.pathname.split('/').filter(Boolean)[0];
      return id ? `https://www.youtube.com/embed/${id}?autoplay=1&rel=0` : null;
    }
    if (host.includes('youtube.com')) {
      const id = parsed.searchParams.get('v') || parsed.pathname.split('/').filter(Boolean).pop();
      if (parsed.pathname.includes('/embed/') && id) {
        return `https://www.youtube.com/embed/${id}?autoplay=1&rel=0`;
      }
      return id ? `https://www.youtube.com/embed/${id}?autoplay=1&rel=0` : null;
    }
    return raw;
  } catch {
    return raw;
  }
}

const dayKeyFmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
const dayLabelFmt = new Intl.DateTimeFormat('vi-VN', {
  weekday: 'short',
  day: '2-digit',
  month: '2-digit',
  timeZone: 'Asia/Ho_Chi_Minh',
});
const showTimeFmt = new Intl.DateTimeFormat('vi-VN', {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Asia/Ho_Chi_Minh',
});

function dayKey(iso: string) {
  try {
    return dayKeyFmt.format(new Date(iso));
  } catch {
    return iso.split('T')[0];
  }
}

function formatDay(iso: string) {
  try {
    return dayLabelFmt.format(new Date(iso));
  } catch {
    return iso;
  }
}

function formatShowTime(iso: string) {
  try {
    return showTimeFmt.format(new Date(iso));
  } catch {
    return iso;
  }
}

export function MovieDetailScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { slug } = route.params;
  const { movies, getMovieBySlug, getShowtimesByMovie } = useCatalog();

  const movie = getMovieBySlug(slug) || movies[0];
  const showtimes = movie ? getShowtimesByMovie(movie.slug) : [];

  const days = useMemo(() => [...new Set(showtimes.map((s) => dayKey(s.startsAt)))], [showtimes]);
  const [selectedDay, setSelectedDay] = useState(days[0] || '');
  const [trailerOpen, setTrailerOpen] = useState(false);
  const [similar, setSimilar] = useState<SimilarMovie[]>([]);

  useEffect(() => {
    if (days.length && !days.includes(selectedDay)) {
      setSelectedDay(days[0] ?? '');
    }
  }, [days, selectedDay]);

  useEffect(() => {
    let cancelled = false;
    if (!movie?.tmdbId) {
      setSimilar([]);
      return;
    }
    void fetchSimilarMovies(movie.slug).then((data) => {
      if (!cancelled) setSimilar(data);
    });
    return () => {
      cancelled = true;
    };
  }, [movie?.slug, movie?.tmdbId]);

  const visibleShowtimes = showtimes.filter((s) => dayKey(s.startsAt) === (selectedDay || days[0]));
  const similarMovies = movies.filter((m) => m.slug !== movie?.slug).slice(0, 4);
  const similarFromApi = similar.filter((item) => item.slug && item.slug !== movie?.slug);
  const similarList =
    similarFromApi.length > 0
      ? similarFromApi.map((item) => ({
          key: String(item.tmdbId),
          slug: item.slug!,
          title: item.title,
          posterUrl: item.posterUrl || '',
        }))
      : similarMovies.map((sim) => ({
          key: sim.id,
          slug: sim.slug,
          title: sim.title,
          posterUrl: sim.posterUrl,
        }));

  if (!movie) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Không tìm thấy phim</Text>
          <NeonButton title="Quay lại" onPress={() => navigation.goBack()} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Backdrop Banner */}
        <View style={styles.backdropContainer}>
          <Image source={{ uri: movie.backdropUrl }} style={styles.backdrop} />
          <LinearGradient
            colors={['rgba(6, 7, 13, 0.3)', 'rgba(6, 7, 13, 0.7)', '#06070d']}
            style={styles.backdropGradient}
          />
          {/* Back Button */}
          <SafeAreaView style={styles.backButtonSafeArea}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Text style={styles.backButtonText}>‹ Quay lại</Text>
            </TouchableOpacity>
          </SafeAreaView>
        </View>

        {/* Movie Info Header */}
        <View style={styles.infoSection}>
          <View style={styles.posterRow}>
            <View style={styles.posterCard}>
              <Image source={{ uri: movie.posterUrl }} style={styles.poster} />
              <View style={styles.badgeWrapper}>
                <AgeBadge rating={movie.rating} size="sm" />
              </View>
            </View>

            <View style={styles.mainSpecs}>
              <Text style={styles.movieTitle}>{movie.title}</Text>

              {/* Meta stats */}
              <View style={styles.metaRow}>
                {movie.imdbRating && (
                  <View style={styles.imdbTag}>
                    <Text style={styles.imdbStar}>★</Text>
                    <Text style={styles.imdbScore}>{movie.imdbRating.toFixed(1)}</Text>
                  </View>
                )}
                {movie.year && <Text style={styles.metaText}>{movie.year}</Text>}
                <Text style={styles.metaText}>⏱ {movie.durationMin} phút</Text>
              </View>

              {/* Genre Pills */}
              <View style={styles.genresRow}>
                {movie.genres.map((g) => (
                  <View key={g} style={styles.genrePill}>
                    <Text style={styles.genreText}>{g}</Text>
                  </View>
                ))}
              </View>

              {/* Watch Trailer Button */}
              <NeonButton
                title="▶ Xem Trailer"
                variant="rose"
                size="sm"
                onPress={() => {
                  if (!toEmbedTrailerUrl(movie.trailerUrl)) {
                    Alert.alert('Chưa có trailer', 'Phim này chưa có đường dẫn trailer.');
                    return;
                  }
                  setTrailerOpen(true);
                }}
                style={{ marginTop: spacing.sm, alignSelf: 'flex-start' }}
              />
            </View>
          </View>

          {/* Cast & Director */}
          {(movie.director || movie.actors) && (
            <GlassCard style={styles.crewCard}>
              {movie.director && (
                <Text style={styles.crewText}>
                  <Text style={styles.crewLabel}>Đạo diễn: </Text>
                  {movie.director}
                </Text>
              )}
              {movie.actors && (
                <Text style={[styles.crewText, { marginTop: 4 }]}>
                  <Text style={styles.crewLabel}>Diễn viên: </Text>
                  {movie.actors}
                </Text>
              )}
            </GlassCard>
          )}

          {/* Description */}
          <Text style={styles.descTitle}>Nội dung phim</Text>
          <Text style={styles.descText}>{movie.description}</Text>
        </View>

        {/* Date & Showtime Selector */}
        <View style={styles.showtimeSection}>
          <Text style={styles.sectionTitle}>CHỌN NGÀY & SUẤT CHIẾU</Text>

          {/* Date tabs */}
          {days.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateTabs}>
              {days.map((d) => {
                const sample = showtimes.find((s) => dayKey(s.startsAt) === d);
                const active = (selectedDay || days[0]) === d;
                return (
                  <TouchableOpacity
                    key={d}
                    onPress={() => setSelectedDay(d)}
                    style={[styles.dateTab, active && styles.dateTabActive]}
                  >
                    <Text style={[styles.dateTabText, active && styles.dateTabTextActive]}>
                      {sample ? formatDay(sample.startsAt) : d}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          ) : null}

          {/* Showtimes List */}
          <View style={styles.showtimeList}>
            {visibleShowtimes.length === 0 ? (
              <View style={styles.noShowtimesBox}>
                <Text style={styles.noShowtimesText}>Chưa có suất chiếu mở cho ngày này.</Text>
              </View>
            ) : (
              visibleShowtimes.map((item) => {
                const timeStr = formatShowTime(item.startsAt);
                return (
                  <GlassCard key={item.id} style={styles.showtimeCard} highlight>
                    <View style={styles.showtimeLeft}>
                      <View style={styles.timeRow}>
                        <Text style={styles.showtimeTime}>{timeStr}</Text>
                        <View style={styles.imaxBadge}>
                          <Text style={styles.imaxBadgeText}>IMAX 3D</Text>
                        </View>
                      </View>
                      <Text style={styles.cinemaName}>
                        📍 {item.cinema} · {item.room}
                      </Text>
                      <Text style={styles.priceText}>{formatVnd(item.priceBase)}</Text>
                    </View>

                    <NeonButton
                      title="Chọn ghế →"
                      variant="primary"
                      size="sm"
                      onPress={() => navigation.navigate('SeatMap', { showtimeId: item.id })}
                    />
                  </GlassCard>
                );
              })
            )}
          </View>
        </View>

        {/* Similar Movies */}
        {similarList.length > 0 && (
          <View style={styles.similarSection}>
            <Text style={styles.sectionTitle}>PHIM TƯƠNG TỰ</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing.lg }}>
              {similarList.map((sim) => (
                <TouchableOpacity
                  key={sim.key}
                  activeOpacity={0.8}
                  onPress={() => navigation.push('MovieDetail', { slug: sim.slug })}
                  style={styles.similarCard}
                >
                  {sim.posterUrl ? (
                    <Image source={{ uri: sim.posterUrl }} style={styles.similarPoster} />
                  ) : (
                    <View style={[styles.similarPoster, styles.similarPosterPlaceholder]} />
                  )}
                  <Text style={styles.similarTitle} numberOfLines={1}>
                    {sim.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>

      {/* Trailer Modal */}
      <Modal visible={trailerOpen} transparent animationType="fade" onRequestClose={() => setTrailerOpen(false)}>
        <View style={styles.trailerOverlay}>
          <View style={styles.trailerBox}>
            <Text style={styles.trailerTitle}>🎬 Trailer: {movie.title}</Text>
            {toEmbedTrailerUrl(movie.trailerUrl) ? (
              <WebView
                style={styles.trailerWebView}
                source={{ uri: toEmbedTrailerUrl(movie.trailerUrl)! }}
                allowsFullscreenVideo
                mediaPlaybackRequiresUserAction={false}
                javaScriptEnabled
                domStorageEnabled
              />
            ) : (
              <View style={styles.trailerPlaceholder}>
                <Text style={styles.trailerPlaceholderText}>Không phát được trailer.</Text>
              </View>
            )}
            <NeonButton
              title="Đóng trailer"
              variant="secondary"
              onPress={() => setTrailerOpen(false)}
              style={{ marginTop: spacing.md }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: spacing.xxxl,
  },
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  errorText: {
    fontSize: 16,
    color: '#ffffff',
    marginBottom: spacing.md,
  },
  backdropContainer: {
    width: '100%',
    height: 260,
    position: 'relative',
  },
  backdrop: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  backdropGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '100%',
  },
  backButtonSafeArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 10,
  },
  backButton: {
    backgroundColor: 'rgba(6, 7, 13, 0.75)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    marginLeft: spacing.lg,
    marginTop: spacing.sm,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  infoSection: {
    paddingHorizontal: spacing.lg,
    marginTop: -40,
  },
  posterRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  posterCard: {
    width: 120,
    height: 170,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    backgroundColor: colors.surfaceElevated,
    position: 'relative',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  poster: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  badgeWrapper: {
    position: 'absolute',
    top: 6,
    left: 6,
  },
  mainSpecs: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  movieTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 6,
  },
  imdbTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  imdbStar: {
    color: colors.goldLight,
    fontSize: 14,
  },
  imdbScore: {
    color: colors.goldLight,
    fontSize: 12,
    fontWeight: '800',
  },
  metaText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  genresRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: 4,
  },
  genrePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
  },
  genreText: {
    fontSize: 9,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  crewCard: {
    marginTop: spacing.md,
    padding: spacing.md,
  },
  crewText: {
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  crewLabel: {
    color: '#ffffff',
    fontWeight: '700',
  },
  descTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  descText: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  showtimeSection: {
    marginTop: spacing.xl,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: colors.primaryLight,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  dateTabs: {
    paddingHorizontal: spacing.lg,
    gap: 8,
    marginBottom: spacing.md,
  },
  dateTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.md,
    backgroundColor: 'rgba(14, 19, 34, 0.8)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
  },
  dateTabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryLight,
  },
  dateTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  dateTabTextActive: {
    color: '#06070d',
    fontWeight: '900',
  },
  showtimeList: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  showtimeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  showtimeLeft: {
    flex: 1,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  showtimeTime: {
    fontSize: 18,
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
  imaxBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.primaryLight,
  },
  cinemaName: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  priceText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primaryLight,
    marginTop: 4,
  },
  noShowtimesBox: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  noShowtimesText: {
    color: colors.textMuted,
    fontSize: 12,
  },
  similarSection: {
    marginTop: spacing.xl,
  },
  similarCard: {
    width: 100,
    marginRight: spacing.md,
  },
  similarPoster: {
    width: 100,
    height: 140,
    borderRadius: radius.md,
    resizeMode: 'cover',
  },
  similarPosterPlaceholder: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  similarTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 4,
  },
  trailerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  trailerBox: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#0e1322',
    borderRadius: radius.lg,
    borderColor: colors.borderCyan,
    borderWidth: 1,
    padding: spacing.lg,
  },
  trailerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: spacing.md,
  },
  trailerPlaceholder: {
    height: 200,
    backgroundColor: '#06070d',
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
  },
  trailerWebView: {
    width: '100%',
    height: 220,
    borderRadius: radius.md,
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  trailerPlaceholderIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  trailerPlaceholderText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '700',
    textAlign: 'center',
  },
  trailerUrlText: {
    fontSize: 10,
    color: colors.primaryLight,
    marginTop: 6,
  },
});

