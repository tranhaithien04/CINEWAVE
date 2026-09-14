import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useCatalog } from '../context/catalog-context';
import { colors, radius, spacing } from '../constants/theme';
import { MovieCard } from '../components/MovieCard';
import { NeonButton } from '../components/NeonButton';
import { GlassCard } from '../components/GlassCard';
import { AgeBadge } from '../components/AgeBadge';

const { width } = Dimensions.get('window');

export function HomeScreen() {
  const navigation = useNavigation<any>();
  const { movies } = useCatalog();

  const featured = movies.find((m) => m.nowShowing) || movies[0];
  const nowShowing = movies.filter((m) => m.nowShowing);
  const comingSoon = movies.filter((m) => !m.nowShowing);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Hero Cyber Header */}
        <View style={styles.heroSection}>
          <LinearGradient
            colors={['rgba(6, 182, 212, 0.15)', 'transparent']}
            style={styles.heroGlow}
          />
          <View style={styles.cyberBadge}>
            <Text style={styles.cyberBadgeText}>✦ FUTURISTIC CYBER CINEMA</Text>
          </View>

          <Text style={styles.heroTitle}>
            ĐẶT VÉ XEM PHIM{'\n'}
            <Text style={styles.heroTitleHighlight}>KHÔNG GIAN 3D ĐỈNH CAO</Text>
          </Text>

          <Text style={styles.heroSubtitle}>
            Chọn suất chiếu IMAX, giữ ghế realtime, xác thực độ tuổi qua CCCD AI Vision.
          </Text>

          <View style={styles.heroActions}>
            <NeonButton
              title="Khám phá phim ngay"
              variant="primary"
              size="md"
              onPress={() => navigation.navigate('MoviesTab')}
              style={{ flex: 1, marginRight: spacing.sm }}
            />
            {featured && (
              <NeonButton
                title="Xem phim Hot"
                variant="outline"
                size="md"
                onPress={() => navigation.navigate('MovieDetail', { slug: featured.slug })}
                style={{ flex: 1 }}
              />
            )}
          </View>
        </View>

        {/* 3 Core Tech Features Cards */}
        <View style={styles.techCardsSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing.lg }}>
            <GlassCard style={styles.techCard}>
              <Text style={styles.techIcon}>🎬</Text>
              <Text style={styles.techTitle}>Phim & Suất Chiếu</Text>
              <Text style={styles.techDesc}>Lọc chuẩn độ tuổi P, T13, T16, T18 cập nhật tức thời.</Text>
            </GlassCard>

            <GlassCard style={styles.techCard}>
              <Text style={styles.techIcon}>💺</Text>
              <Text style={styles.techTitle}>Giữ Ghế Realtime</Text>
              <Text style={styles.techDesc}>Sơ đồ phòng chiếu 2D / 3D góc nhìn POV chân thực.</Text>
            </GlassCard>

            <GlassCard style={styles.techCard}>
              <Text style={styles.techIcon}>🛡️</Text>
              <Text style={styles.techTitle}>AI Vision CCCD</Text>
              <Text style={styles.techDesc}>YOLO + OCR nhận diện tuổi nhanh chóng, bảo mật thẻ.</Text>
            </GlassCard>
          </ScrollView>
        </View>

        {/* Spotlight Featured Movie Banner */}
        {featured && (
          <View style={styles.spotlightSection}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => navigation.navigate('MovieDetail', { slug: featured.slug })}
              style={styles.spotlightCard}
            >
              <Image source={{ uri: featured.backdropUrl }} style={styles.spotlightBackdrop} />
              <LinearGradient
                colors={['transparent', 'rgba(6, 7, 13, 0.85)', '#06070d']}
                style={styles.spotlightGradient}
              />
              <View style={styles.spotlightInfo}>
                <View style={styles.spotlightBadgeRow}>
                  <Text style={styles.spotlightBadge}>★ PHIM NỔI BẬT TUẦN</Text>
                  <AgeBadge rating={featured.rating} size="sm" />
                </View>
                <Text style={styles.spotlightTitle}>{featured.title}</Text>
                <Text style={styles.spotlightDesc} numberOfLines={2}>
                  {featured.description}
                </Text>
                <View style={styles.spotlightBtnRow}>
                  <NeonButton
                    title="Đặt vé suất sớm"
                    variant="primary"
                    size="sm"
                    onPress={() => navigation.navigate('MovieDetail', { slug: featured.slug })}
                  />
                  <Text style={styles.spotlightDetailLink}>Xem chi tiết →</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Carousel: Đang chiếu (Now Showing) */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionEyebrow}>NOW SHOWING</Text>
            <Text style={styles.sectionTitle}>Phim Đang Chiếu</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('MoviesTab')}>
            <Text style={styles.seeAllText}>Xem tất cả →</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.carouselContainer}
        >
          {nowShowing.map((movie) => (
            <MovieCard
              key={movie.id}
              movie={movie}
              onPress={() => navigation.navigate('MovieDetail', { slug: movie.slug })}
            />
          ))}
        </ScrollView>

        {/* Carousel: Sắp chiếu (Coming Soon) */}
        <View style={[styles.sectionHeader, { marginTop: spacing.xl }]}>
          <View>
            <Text style={styles.sectionEyebrow}>COMING SOON</Text>
            <Text style={styles.sectionTitle}>Phim Sắp Chiếu</Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.carouselContainer}
        >
          {comingSoon.map((movie) => (
            <MovieCard
              key={movie.id}
              movie={movie}
              onPress={() => navigation.navigate('MovieDetail', { slug: movie.slug })}
            />
          ))}
        </ScrollView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: spacing.xxxl,
  },
  heroSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    position: 'relative',
  },
  heroGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 250,
  },
  cyberBadge: {
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    borderColor: 'rgba(6, 182, 212, 0.35)',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
    marginBottom: spacing.md,
  },
  cyberBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primaryLight,
    letterSpacing: 1.5,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#ffffff',
    lineHeight: 34,
    letterSpacing: 0.5,
  },
  heroTitleHighlight: {
    color: colors.primaryLight,
  },
  heroSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    lineHeight: 18,
  },
  heroActions: {
    flexDirection: 'row',
    marginTop: spacing.lg,
  },
  techCardsSection: {
    marginVertical: spacing.md,
  },
  techCard: {
    width: 180,
    padding: spacing.md,
    marginRight: spacing.md,
  },
  techIcon: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  techTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 4,
  },
  techDesc: {
    fontSize: 11,
    color: colors.textMuted,
    lineHeight: 15,
  },
  spotlightSection: {
    paddingHorizontal: spacing.lg,
    marginVertical: spacing.md,
  },
  spotlightCard: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderColor: 'rgba(6, 182, 212, 0.35)',
    borderWidth: 1.5,
    backgroundColor: '#0c101d',
    position: 'relative',
    height: 240,
  },
  spotlightBackdrop: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    resizeMode: 'cover',
  },
  spotlightGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '100%',
  },
  spotlightInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
  },
  spotlightBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  spotlightBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.goldLight,
    letterSpacing: 1,
  },
  spotlightTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  spotlightDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    marginVertical: 4,
    lineHeight: 16,
  },
  spotlightBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  spotlightDetailLink: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryLight,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: colors.primaryLight,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#ffffff',
    marginTop: 2,
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryLight,
  },
  carouselContainer: {
    paddingHorizontal: spacing.lg,
  },
});

