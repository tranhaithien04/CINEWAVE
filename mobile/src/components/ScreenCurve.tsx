import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing } from '../constants/theme';

export function ScreenCurve() {
  return (
    <View style={styles.container}>
      {/* Curved Screen Glowing Arc */}
      <View style={styles.arcContainer}>
        <View style={styles.arc} />
      </View>
      <Text style={styles.label}>MÀN CHIẾU CONG IMAX LASER</Text>
      <View style={styles.ambientLight} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: spacing.lg,
    width: '100%',
  },
  arcContainer: {
    width: '90%',
    height: 16,
    overflow: 'hidden',
    alignItems: 'center',
  },
  arc: {
    width: '110%',
    height: 60,
    borderRadius: 90,
    borderWidth: 3,
    borderColor: colors.primary,
    backgroundColor: 'transparent',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 8,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    color: colors.primaryLight,
    marginTop: spacing.xs,
    textTransform: 'uppercase',
  },
  ambientLight: {
    width: '70%',
    height: 8,
    backgroundColor: 'rgba(6, 182, 212, 0.08)',
    borderRadius: 10,
    marginTop: 2,
  },
});

