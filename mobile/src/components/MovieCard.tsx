import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Movie } from '../types';
import { colors, radius, spacing } from '../constants/theme';
import { AgeBadge } from './AgeBadge';
import { NeonButton } from './NeonButton';

interface MovieCardProps {
  movie: Movie;
  onPress: () => void;
  onBookPress?: () => void;
  width?: number;
}

export function MovieCard({ movie, onPress, onBookPress, width = 160 }: MovieCardProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.container, { width }]}
    >
      {/* Poster with 2:3 aspect ratio */}
      <View style={styles.posterWrapper}>
        <Image source={{ uri: movie.posterUrl }} style={styles.poster} />

        {/* Age Rating Badge top-right */}
        <View style={styles.badgeTopRight}>
          <AgeBadge rating={movie.rating} size="sm" />
        </View>

        {/* Duration bottom-left */}
        <View style={styles.durationTag}>
          <Text style={styles.durationText}>⏱ {movie.durationMin}p</Text>
        </View>
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>
          {movie.title}
        </Text>
        <Text style={styles.genres} numberOfLines={1}>
          {movie.genres.join(' · ')}
        </Text>

        <View style={styles.buttonWrapper}>
          <NeonButton
            title="Đặt vé"
            size="sm"
            variant="primary"
            onPress={onBookPress || onPress}
          />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(14, 19, 34, 0.85)',
    borderRadius: radius.lg,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    overflow: 'hidden',
    marginRight: spacing.md,
    marginBottom: spacing.md,
  },
  posterWrapper: {
    width: '100%',
    aspectRatio: 2 / 3,
    backgroundColor: colors.surfaceElevated,
    position: 'relative',
  },
  poster: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  badgeTopRight: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 2,
  },
  durationTag: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(6, 7, 13, 0.75)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  durationText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.primaryLight,
  },
  info: {
    padding: spacing.sm,
  },
  title: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.2,
  },
  genres: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
    marginBottom: spacing.xs,
  },
  buttonWrapper: {
    marginTop: spacing.xs,
  },
});

