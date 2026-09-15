import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { AdminBooking, Movie, Showtime } from '../types';
import { colors, radius, spacing } from '../constants/theme';
import { AgeBadge } from './AgeBadge';
import { formatVnd } from '../data/mock-data';
import { ticketQrValue } from '../utils/ticket-qr';

interface BoardingTicketProps {
  ticket: AdminBooking;
  movie?: Movie;
  showtime?: Showtime;
  onPress?: () => void;
  showFullQr?: boolean;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  PAID: { label: 'ĐÃ THANH TOÁN', color: colors.emerald },
  USED: { label: 'ĐÃ VÀO RẠP', color: colors.textMuted },
  EXPIRED: { label: 'HẾT HẠN', color: colors.rose },
  CANCELLED: { label: 'CHỜ HOÀN TIỀN', color: colors.gold },
  REFUNDED: { label: 'ĐÃ HOÀN TIỀN', color: colors.textMuted },
};

export function BoardingTicket({
  ticket,
  movie,
  showtime,
  onPress,
  showFullQr = false,
}: BoardingTicketProps) {
  const statusInfo = statusConfig[ticket.status] || {
    label: ticket.status,
    color: colors.textSecondary,
  };

  const showDate = showtime ? new Date(showtime.startsAt) : new Date(ticket.createdAt);
  const timeStr = showDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  const dateStr = showDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.85 : 1}
      onPress={onPress}
      disabled={!onPress}
      style={styles.cardContainer}
    >
      {/* Top Pass Brand Bar */}
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <Text style={styles.brandTitle}>✦ CINEWAVE IMAX PASS</Text>
          <View
            style={[
              styles.statusBadge,
              { borderColor: statusInfo.color, backgroundColor: 'rgba(16, 185, 129, 0.1)' },
            ]}
          >
            <Text style={[styles.statusText, { color: statusInfo.color }]}>
              {statusInfo.label}
            </Text>
          </View>
        </View>

        {movie && (
          <View style={styles.movieRow}>
            <AgeBadge rating={movie.rating} size="sm" />
            <Text style={styles.hallText}>
              {showtime?.room || 'IMAX Laser 01'}
            </Text>
          </View>
        )}

        <Text style={styles.movieTitle} numberOfLines={2}>
          {movie?.title || ticket.movieSlug}
        </Text>

        <Text style={styles.cinemaText}>
          {showtime?.cinema || 'CineWave Landmark 81 Cyber Cinema'}
        </Text>
      </View>

      {/* Perforated Divider with Circular Tear Notches */}
      <View style={styles.dividerContainer}>
        <View style={styles.notchLeft} />
        <View style={styles.dashedLine} />
        <View style={styles.notchRight} />
      </View>

      {/* Ticket Body / QR Section */}
      <View style={styles.body}>
        <View style={styles.detailsCol}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>GHẾ NGỒI</Text>
            <Text style={styles.detailValueCyan}>{ticket.seats.join(', ')}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>SUẤT CHIẾU</Text>
            <Text style={styles.detailValueWhite}>
              {timeStr} · {dateStr}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>MÃ VÉ</Text>
            <Text style={styles.detailValueCode}>{ticket.code}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>TỔNG TIỀN</Text>
            <Text style={styles.detailValueEmerald}>{formatVnd(ticket.total)}</Text>
          </View>
        </View>

        {/* QR Code Container */}
        <View style={styles.qrCol}>
          <View style={[styles.qrWrapper, showFullQr && styles.fullQrWrapper]}>
            <QRCode
              value={ticketQrValue(ticket)}
              size={showFullQr ? 140 : 68}
              color="#06070d"
              backgroundColor="#ffffff"
            />
          </View>
          <Text style={styles.scanLabel}>
            {ticket.status === 'CANCELLED'
              ? 'QR HOÀN TIỀN TẠI QUẦY'
              : showFullQr
                ? 'SCAN TẠI CỔNG VÀO RẠP'
                : 'SCAN CHECK-IN'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#0c101d',
    borderRadius: radius.xl,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: spacing.lg,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  header: {
    padding: spacing.lg,
    paddingBottom: spacing.md,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  brandTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: colors.primaryLight,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  movieRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: spacing.xs,
    marginBottom: 4,
  },
  hallText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primaryLight,
  },
  movieTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  cinemaText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 24,
    position: 'relative',
  },
  notchLeft: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.background,
    marginLeft: -10,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
  },
  notchRight: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.background,
    marginRight: -10,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
  },
  dashedLine: {
    flex: 1,
    height: 1,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderStyle: 'dashed',
  },
  body: {
    padding: spacing.lg,
    paddingTop: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailsCol: {
    flex: 1,
    gap: 6,
  },
  detailItem: {
    marginBottom: 2,
  },
  detailLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1,
  },
  detailValueCyan: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primaryLight,
  },
  detailValueWhite: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  detailValueCode: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
    fontFamily: 'monospace',
  },
  detailValueEmerald: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.emeraldLight,
  },
  qrCol: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.md,
  },
  qrWrapper: {
    backgroundColor: '#ffffff',
    padding: 6,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullQrWrapper: {
    padding: 12,
    borderRadius: radius.lg,
  },
  scanLabel: {
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 1,
    color: colors.primaryLight,
    marginTop: 6,
  },
});

