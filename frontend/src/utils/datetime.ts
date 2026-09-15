const TZ = "Asia/Ho_Chi_Minh";

const dateTimeFmt = new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: TZ,
});

const dateTimeCompactFmt = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: TZ,
});

const timeFmt = new Intl.DateTimeFormat("vi-VN", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: TZ,
});

const dayShortFmt = new Intl.DateTimeFormat("vi-VN", {
  weekday: "short",
  day: "2-digit",
  month: "2-digit",
  timeZone: TZ,
});

const dayLongFmt = new Intl.DateTimeFormat("vi-VN", {
  weekday: "long",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: TZ,
});

const dateOnlyFmt = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: TZ,
});

function asDate(value: string | number | Date) {
  return value instanceof Date ? value : new Date(value);
}

export function formatDateTime(value: string | number | Date) {
  return dateTimeFmt.format(asDate(value));
}

export function formatDateTimeCompact(value: string | number | Date) {
  return dateTimeCompactFmt.format(asDate(value));
}

export function formatTime(value: string | number | Date) {
  return timeFmt.format(asDate(value));
}

export function formatDayShort(value: string | number | Date) {
  return dayShortFmt.format(asDate(value));
}

export function formatDayLong(value: string | number | Date) {
  return dayLongFmt.format(asDate(value));
}

export function formatDateOnly(value: string | number | Date) {
  return dateOnlyFmt.format(asDate(value));
}
