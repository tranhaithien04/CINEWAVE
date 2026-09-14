import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../constants/theme';

interface HoldTimerProps {
  initialSeconds?: number;
  onExpire?: () => void;
}

export function HoldTimer({ initialSeconds = 480, onExpire }: HoldTimerProps) {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);

  useEffect(() => {
    if (timeLeft <= 0) {
      onExpire?.();
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, onExpire]);

  const minutes = Math.floor(timeLeft / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (timeLeft % 60).toString().padStart(2, '0');

  return (
    <View style={styles.container}>
      <Text style={styles.dot}>●</Text>
      <Text style={styles.label}>Thời gian giữ ghế: </Text>
      <Text style={styles.time}>
        {minutes}:{seconds}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: 'rgba(245, 158, 11, 0.40)',
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
  },
  dot: {
    color: colors.warning,
    fontSize: 10,
    marginRight: 6,
  },
  label: {
    fontSize: 11,
    color: colors.goldLight,
    fontWeight: '600',
  },
  time: {
    fontSize: 12,
    fontWeight: '900',
    color: '#ffffff',
    fontFamily: 'monospace',
  },
});

