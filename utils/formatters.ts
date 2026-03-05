/**
 * Shared formatting utilities for consistent display across views.
 */

/** Format a timestamp string to readable time (e.g., "02:30 PM") */
export function fmtTime(ts: string | null): string {
  if (!ts) return '—';
  const d = new Date(ts);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

/** Format a date string/number to DD/MM/YYYY (e.g., "23/02/2026") */
export function fmtDate(d: string | number): string {
  if (!d) return '—';
  const date = new Date(d);
  if (isNaN(date.getTime())) return '—';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/** Format a date string/number to DD/MM/YYYY + time (e.g., "23/02/2026 02:30 PM") */
export function fmtDateTime(d: string | number): string {
  if (!d) return '—';
  const date = new Date(d);
  if (isNaN(date.getTime())) return '—';
  return `${fmtDate(d)} ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}`;
}

/** Format minutes to hours + minutes (e.g., "2h 30m") */
export function fmtMinutes(mins: number): string {
  if (!mins) return '—';
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

/** HR attendance status color mapping */
export const STATUS_COLORS: Record<string, string> = {
  present: 'bg-green-100 text-green-700',
  absent: 'bg-red-100 text-red-700',
  late: 'bg-amber-100 text-amber-700',
  weekend: 'bg-slate-100 text-slate-500',
  holiday: 'bg-blue-100 text-blue-600',
  leave: 'bg-purple-100 text-purple-600',
};
