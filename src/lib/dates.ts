const dayFormat = new Intl.DateTimeFormat('en-PH', { month: 'short', day: 'numeric' });
const timeFormat = new Intl.DateTimeFormat('en-PH', { hour: 'numeric', minute: '2-digit' });

export const formatDay = (iso: string): string => dayFormat.format(new Date(iso));
export const formatTime = (iso: string): string => timeFormat.format(new Date(iso));
/** "Sept 21, 2:14 PM" */
export const formatDayTime = (iso: string): string => `${formatDay(iso)}, ${formatTime(iso)}`;

export function startOfToday(): Date {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

export function isToday(iso: string): boolean {
  return new Date(iso) >= startOfToday();
}

export function dayLabel(iso: string): string {
  if (isToday(iso)) return 'Today';
  const yesterday = startOfToday();
  yesterday.setDate(yesterday.getDate() - 1);
  if (new Date(iso) >= yesterday) return 'Yesterday';
  return formatDay(iso);
}
