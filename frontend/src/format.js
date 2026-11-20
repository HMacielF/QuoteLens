import { money } from './api/comparison.js';

export { money };

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// "2026-10-14" or a full ISO time -> "Oct 14, 2026". Plain dates are read as written, not shifted by time zone.
export function formatDate(value) {
  if (!value) return '';
  const plain = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (plain) return `${MONTHS[Number(plain[2]) - 1]} ${Number(plain[3])}, ${plain[1]}`;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

export const plural = (n, one, many = one + 's') => `${n} ${n === 1 ? one : many}`;

export const sqftLabel = (n) => (n ? `${Number(n)} sq ft` : '');
export const perSqFt = (total, sqft) => (total && sqft ? money(Math.round((total / sqft) * 100) / 100) : '');

export const SERVICES = [
  ['fabrication', 'Fabrication'],
  ['installation', 'Installation'],
  ['sinkCutout', 'Sink cutout'],
  ['backsplash', 'Backsplash'],
  ['tearOut', 'Tear-out / removal'],
];

export const STATUS_OPTIONS = [
  ['included', 'Included in the total'],
  ['extra', 'Extra, charged on top'],
  ['excluded', 'Not included'],
  ['not_specified', 'Not specified'],
];

// How one service reads on screen, and which tag style it gets.
export function serviceView(item) {
  const status = item?.status || 'not_specified';
  const parts = [];
  if (item?.detail) parts.push(item.detail);
  if (status === 'included') {
    if (item.amount != null) parts.push(money(item.amount));
    return { kind: 'included', text: parts.length ? `Included (${parts.join(', ')})` : 'Included' };
  }
  if (status === 'extra') {
    const amount = item.amount != null ? `+${money(item.amount)} extra` : '+ extra, amount not stated';
    return { kind: 'extra', text: item.detail ? `${amount} (${item.detail})` : amount };
  }
  if (status === 'excluded') return { kind: 'excluded', text: item.detail ? `Not included (${item.detail})` : 'Not included' };
  return { kind: 'ns', text: 'Not Specified' };
}

export const comparisonStatus = (comparison) =>
  comparison.status === 'ready' ? { label: 'Compared', tone: 'green' } : { label: 'In progress', tone: 'blue' };

export const quoteStatus = (quote) => ({
  reading: { label: 'Reading', tone: 'blue' },
  details_ready: { label: 'Needs your check', tone: 'amber' },
  confirmed: { label: 'Confirmed', tone: 'green' },
  failed: { label: 'Could not read', tone: 'red' },
}[quote.status] || { label: quote.status, tone: 'grey' });

// Where a comparison should open: results once built, otherwise the review step.
export const comparisonHref = (comparison) =>
  comparison.status === 'ready' ? `/comparisons/${comparison.id}` : `/comparisons/${comparison.id}/review`;

export const initials = (name) =>
  (name || '').split(/\s+/).filter(Boolean).map((p) => p[0].toUpperCase()).slice(0, 2).join('') || 'U';
