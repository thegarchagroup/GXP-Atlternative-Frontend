let hotelTimezone = 'UTC';

export function setHotelTimezone(tz) {
  if (tz) hotelTimezone = tz;
}

export function getHotelTimezone() {
  return hotelTimezone;
}

function parse(value) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatDateTime(value) {
  const d = parse(value);
  if (!d) return '—';
  return new Intl.DateTimeFormat(undefined, {
    timeZone: hotelTimezone, day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  }).format(d);
}

export function formatDate(value) {
  const d = parse(value);
  if (!d) return '—';
  return new Intl.DateTimeFormat(undefined, { timeZone: hotelTimezone, day: '2-digit', month: 'short', year: 'numeric' }).format(d);
}

export function timeAgo(value, now = new Date()) {
  const d = parse(value);
  if (!d) return '—';
  const s = Math.round((now - d) / 1000);
  if (s < 45) return 'just now';
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  return formatDate(d);
}

export function formatMinutes(min) {
  if (min === null || min === undefined) return '—';
  if (min < 60) return `${Math.round(min)} min`;
  const h = Math.floor(min / 60);
  return `${h} h ${Math.round(min % 60)} min`;
}

export function isoDate(d = new Date()) {
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}
