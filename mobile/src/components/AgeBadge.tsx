import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AgeRating } from '../types';
import { colors } from '../constants/theme';

const badgeColors: Record<AgeRating, { bg: string; text: string; border: string; label: string }> = {
  P: {
    bg: 'rgba(16, 185, 129, 0.15)',
    text: colors.ageP,
    border: 'rgba(16, 185, 129, 0.40)',
    label: 'P',
  },
  K: {
    bg: 'rgba(59, 130, 246, 0.15)',
    text: colors.ageK,
    border: 'rgba(59, 130, 246, 0.40)',
    label: 'K',
  },
  T13: {
    bg: 'rgba(245, 158, 11, 0.15)',
    text: colors.ageT13,
    border: 'rgba(245, 158, 11, 0.40)',
    label: 'T13',
  },
  T16: {
    bg: 'rgba(249, 115, 22, 0.15)',
    text: colors.ageT16,
    border: 'rgba(249, 115, 22, 0.40)',
    label: 'T16',
  },
  T18: {
    bg: 'rgba(244, 63, 94, 0.20)',
    text: colors.ageT18,
    border: 'rgba(244, 63, 94, 0.45)',
    label: 'T18',
  },
};

export function AgeBadge({ rating, size = 'md' }: { rating: AgeRating; size?: 'sm' | 'md' | 'lg' }) {
  const conf = badgeColors[rating] || badgeColors.P;
  const isSm = size === 'sm';
  const isLg = size === 'lg';

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: conf.bg,
          borderColor: conf.border,
          paddingHorizontal: isSm ? 5 : isLg ? 10 : 7,
          paddingVertical: isSm ? 1 : isLg ? 4 : 2,
        },
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: conf.text,
            fontSize: isSm ? 9 : isLg ? 12 : 10,
          },
        ]}
      >
        {conf.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});

