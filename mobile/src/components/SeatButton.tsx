import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Seat } from '../types';
import { colors } from '../constants/theme';

interface SeatButtonProps {
  seat: Seat;
  isSelected: boolean;
  onPress: (seat: Seat) => void;
}

export function SeatButton({ seat, isSelected, onPress }: SeatButtonProps) {
  const isSold = seat.status === 'SOLD';
  const isCouple = seat.type === 'COUPLE';
  const isVip = seat.type === 'VIP';

  let bgColor = colors.seatAvailable;
  let borderColor = 'rgba(255, 255, 255, 0.1)';
  let textColor = '#ffffff';

  if (isSold) {
    bgColor = colors.seatSold;
    borderColor = 'transparent';
    textColor = colors.textMuted;
  } else if (isSelected) {
    bgColor = colors.seatSelected;
    borderColor = colors.emeraldLight;
    textColor = '#ffffff';
  } else if (isCouple) {
    bgColor = 'rgba(225, 29, 72, 0.25)';
    borderColor = colors.rose;
    textColor = colors.roseLight;
  } else if (isVip) {
    bgColor = 'rgba(234, 179, 8, 0.25)';
    borderColor = colors.gold;
    textColor = colors.goldLight;
  }

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      disabled={isSold}
      onPress={() => onPress(seat)}
      style={[
        styles.seat,
        isCouple && styles.coupleSeat,
        {
          backgroundColor: bgColor,
          borderColor,
        },
        isSelected && styles.selectedGlow,
      ]}
    >
      <Text
        style={[
          styles.text,
          { color: textColor },
          isSelected && styles.selectedText,
        ]}
      >
        {seat.number}
      </Text>
      {isCouple && (
        <Text style={[styles.subText, { color: textColor }]}>Đôi</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  seat: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 1,
    margin: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coupleSeat: {
    width: 32,
  },
  text: {
    fontSize: 10,
    fontWeight: '700',
  },
  subText: {
    fontSize: 7,
    fontWeight: '600',
    marginTop: -2,
  },
  selectedGlow: {
    shadowColor: colors.emerald,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
    transform: [{ scale: 1.05 }],
  },
  selectedText: {
    fontWeight: '900',
  },
});
