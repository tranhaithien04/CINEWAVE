import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ConcessionItem } from '../types';
import { colors, radius, spacing } from '../constants/theme';
import { formatVnd } from '../data/mock-data';

type Props = {
  items: ConcessionItem[];
  qty: Record<string, number>;
  disabled?: boolean;
  onChange: (id: string, next: number) => void;
};

export function ConcessionPicker({ items, qty, disabled, onChange }: Props) {
  if (!items.length) return null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Combo bắp nước (tùy chọn)</Text>
      {items.map((item) => {
        const count = qty[item.id] ?? 0;
        return (
          <View key={item.id} style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.desc} numberOfLines={2}>
                {item.description}
              </Text>
              <Text style={styles.price}>{formatVnd(item.price)}</Text>
            </View>
            <View style={styles.stepper}>
              <TouchableOpacity
                disabled={disabled || count <= 0}
                onPress={() => onChange(item.id, count - 1)}
                style={[styles.stepBtn, (disabled || count <= 0) && styles.stepBtnDisabled]}
              >
                <Text style={styles.stepBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.qty}>{count}</Text>
              <TouchableOpacity
                disabled={disabled || count >= 8}
                onPress={() => onChange(item.id, count + 1)}
                style={[styles.stepBtn, (disabled || count >= 8) && styles.stepBtnDisabled]}
              >
                <Text style={styles.stepBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  title: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.sm,
    gap: spacing.sm,
  },
  name: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
  desc: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
  price: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.goldLight,
    marginTop: 4,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(6, 182, 212, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnDisabled: {
    opacity: 0.35,
  },
  stepBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primaryLight,
  },
  qty: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
    minWidth: 16,
    textAlign: 'center',
  },
});
