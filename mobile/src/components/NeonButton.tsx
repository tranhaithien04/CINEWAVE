import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, spacing } from '../constants/theme';

type ButtonVariant = 'primary' | 'gold' | 'rose' | 'secondary' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface NeonButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function NeonButton({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
}: NeonButtonProps) {
  const isSm = size === 'sm';
  const isLg = size === 'lg';

  const padVertical = isSm ? 8 : isLg ? 16 : 12;
  const padHorizontal = isSm ? 12 : isLg ? 24 : 18;
  const fontSize = isSm ? 12 : isLg ? 16 : 14;

  let gradientColors: readonly [string, string] | null = null;
  let bgColor = 'transparent';
  let borderColor = 'transparent';
  let textColor = colors.text;

  if (variant === 'primary') {
    gradientColors = colors.primaryGradient;
    textColor = '#ffffff';
  } else if (variant === 'gold') {
    gradientColors = colors.goldGradient;
    textColor = '#0f172a';
  } else if (variant === 'rose') {
    gradientColors = colors.roseGradient;
    textColor = '#ffffff';
  } else if (variant === 'secondary') {
    bgColor = colors.surfaceElevated;
    borderColor = colors.borderLight;
    textColor = colors.textSecondary;
  } else if (variant === 'outline') {
    bgColor = 'rgba(255, 255, 255, 0.05)';
    borderColor = colors.borderCyan;
    textColor = colors.primaryLight;
  } else if (variant === 'ghost') {
    bgColor = 'transparent';
    textColor = colors.textSecondary;
  }

  const content = (
    <View style={styles.innerRow}>
      {loading ? (
        <ActivityIndicator
          size="small"
          color={textColor}
          style={{ marginRight: spacing.sm }}
        />
      ) : icon ? (
        <View style={{ marginRight: spacing.sm }}>{icon}</View>
      ) : null}
      <Text
        style={[
          styles.text,
          {
            color: textColor,
            fontSize,
            fontWeight: variant === 'gold' ? '800' : '700',
          },
          textStyle,
        ]}
      >
        {title}
      </Text>
    </View>
  );

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.wrapper,
        disabled && styles.disabled,
        variant === 'primary' && styles.primaryShadow,
        style,
      ]}
    >
      {gradientColors ? (
        <LinearGradient
          colors={gradientColors as any}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            styles.container,
            {
              paddingVertical: padVertical,
              paddingHorizontal: padHorizontal,
            },
          ]}
        >
          {content}
        </LinearGradient>
      ) : (
        <View
          style={[
            styles.container,
            {
              backgroundColor: bgColor,
              borderColor,
              borderWidth: borderColor !== 'transparent' ? 1 : 0,
              paddingVertical: padVertical,
              paddingHorizontal: padHorizontal,
            },
          ]}
        >
          {content}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  primaryShadow: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  container: {
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    letterSpacing: 0.3,
  },
  disabled: {
    opacity: 0.5,
  },
});

