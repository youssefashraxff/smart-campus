import { Temporal } from 'temporal-polyfill';

// The campus runs on Cairo time, whatever time zone the browser is in. The backend also builds
// "one day" in Africa/Cairo (Admin list and Availability tasks), so the UI uses the same zone everywhere.
// Egypt uses daylight saving time, so the UTC offset is +02:00 or +03:00 depending on the date;
// Temporal works that out from the zone name instead of us hard-coding an offset.
export const CAMPUS_TZ = 'Africa/Cairo';

const fmt = (options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat('en-GB', { timeZone: CAMPUS_TZ, ...options });

const timeFmt = fmt({ hour: '2-digit', minute: '2-digit', hour12: false });
const dayFmt = fmt({ weekday: 'short', day: 'numeric', month: 'short' });
const longDayFmt = fmt({ weekday: 'long', day: 'numeric', month: 'long' });
const fullFmt = fmt({ weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
const dateTimeFmt = fmt({
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

/** "14:00" */
export const formatTime = (iso: string) => timeFmt.format(new Date(iso));
/** "Tue 24 Nov" */
export const formatDay = (iso: string) => dayFmt.format(new Date(iso));
/** "Tuesday 24 November" */
export const formatLongDay = (iso: string) => longDayFmt.format(new Date(iso));
/** "Tue 24 Nov 2026" */
export const formatFullDay = (iso: string) => fullFmt.format(new Date(iso));
/** "24 Nov, 14:00" */
export const formatDateTime = (iso: string) => dateTimeFmt.format(new Date(iso));

/** "Tue 24 Nov, 10:00–12:00" (an en dash, and the day once when both ends share it) */
export function formatRange(startIso: string, endIso: string): string {
  const sameDay = toCampusDate(startIso) === toCampusDate(endIso);
  return sameDay
    ? `${formatDay(startIso)}, ${formatTime(startIso)}–${formatTime(endIso)}`
    : `${formatDateTime(startIso)} – ${formatDateTime(endIso)}`;
}

/** The calendar date (YYYY-MM-DD) of an instant, as seen in Cairo */
export function toCampusDate(iso: string): string {
  return Temporal.Instant.from(new Date(iso).toISOString())
    .toZonedDateTimeISO(CAMPUS_TZ)
    .toPlainDate()
    .toString();
}

/** The wall-clock time (HH:mm) of an instant, as seen in Cairo */
export function toCampusTime(iso: string): string {
  return Temporal.Instant.from(new Date(iso).toISOString())
    .toZonedDateTimeISO(CAMPUS_TZ)
    .toPlainTime()
    .toString({ smallestUnit: 'minute' });
}

/** Today's date in Cairo (YYYY-MM-DD) */
export const campusToday = () => Temporal.Now.plainDateISO(CAMPUS_TZ).toString();

/** Adds days to a YYYY-MM-DD date */
export const addDays = (date: string, days: number) =>
  Temporal.PlainDate.from(date).add({ days }).toString();

/**
 * Cairo wall-clock date + time -> ISO string with the right offset, ready for an OffsetDateTime field.
 * toCampusIso('2026-11-24', '10:00') === '2026-11-24T10:00:00+02:00'
 */
export function toCampusIso(date: string, time: string): string {
  return Temporal.PlainDateTime.from(`${date}T${time}`)
    .toZonedDateTime(CAMPUS_TZ)
    .toString({ timeZoneName: 'never', smallestUnit: 'second' });
}

/** True when the instant is still in the future */
export const isFuture = (iso: string) => new Date(iso).getTime() > Date.now();

/**
 * "in 20 minutes", "in 5 hours", "tomorrow", "in 3 days", "2 days ago".
 * Past a day, it counts calendar days in Cairo, so Thursday 10:00 seen on Tuesday night is
 * "in 2 days", not "tomorrow".
 */
export function relativeTime(iso: string): string {
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  const minutes = Math.round((new Date(iso).getTime() - Date.now()) / 60_000);
  if (Math.abs(minutes) < 60) return rtf.format(minutes, 'minute');
  if (Math.abs(minutes) < 12 * 60) return rtf.format(Math.round(minutes / 60), 'hour');
  const days = Temporal.PlainDate.from(campusToday()).until(toCampusDate(iso), {
    largestUnit: 'day',
  }).days;
  return days === 0 ? rtf.format(Math.round(minutes / 60), 'hour') : rtf.format(days, 'day');
}

/** The next whole half hour in Cairo, as { date, time } */
export function nextHalfHour(): { date: string; time: string } {
  const now = Temporal.Now.zonedDateTimeISO(CAMPUS_TZ);
  const rounded = now.round({
    smallestUnit: 'minute',
    roundingIncrement: 30,
    roundingMode: 'ceil',
  });
  return {
    date: rounded.toPlainDate().toString(),
    time: rounded.toPlainTime().toString({ smallestUnit: 'minute' }),
  };
}
