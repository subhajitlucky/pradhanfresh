/** Formatting helpers shared across every surface. Prices are rupees. */

const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
});

const inrExact = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** ₹249 — whole numbers drop the decimals, which reads cleaner on cards. */
export function money(value: number): string {
  if (!Number.isFinite(value)) return '₹0';
  return Number.isInteger(value) ? inr.format(value) : inrExact.format(value);
}

/** Always two decimals — for receipts and order summaries. */
export function moneyExact(value: number): string {
  return Number.isFinite(value) ? inrExact.format(value) : '₹0.00';
}

export function discountPercent(price: number, salePrice?: number | null): number {
  if (!salePrice || salePrice >= price || price <= 0) return 0;
  return Math.round(((price - salePrice) / price) * 100);
}

/** The price actually charged: a sale price when present, else list price. */
export function effectivePrice(price: number, salePrice?: number | null): number {
  return salePrice && salePrice < price ? salePrice : price;
}

export function formatDate(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateTime(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatTime(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

/** "3 items" / "1 item" — never "1 items". */
export function plural(n: number, one: string, many = `${one}s`): string {
  return `${n.toLocaleString('en-IN')} ${n === 1 ? one : many}`;
}

export function relativeDay(iso?: string | null): string {
  if (!iso) return '';
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return '';
  const days = Math.round((Date.now() - then.getTime()) / 86_400_000);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export const cx = (...parts: Array<string | false | null | undefined>): string =>
  parts.filter(Boolean).join(' ');

/**
 * Joins conditional class names, flattening any Tailwind conflicts.
 * Accepts anything (including `false`, `0` and `''` produced by `cond && 'cls'`
 * expressions) so call sites never need a cast.
 */
export function cn(...inputs: unknown[]): string {
  const out: string[] = [];
  for (const i of inputs) {
    if (!i) continue;
    if (typeof i === 'string') out.push(i);
    else if (typeof i === 'number') out.push(String(i));
    else if (typeof i === 'object') {
      for (const [k, v] of Object.entries(i)) if (v) out.push(k);
    }
  }
  return out.join(' ');
}

/** Maps an order status to its ledger tone. */
export function orderTone(status: string): { fg: string; bg: string; border: string; dot: string } {
  switch (status) {
    case 'DELIVERED':
      return { fg: 'text-ok', bg: 'bg-leaf-soft', border: 'border-leaf-line', dot: 'bg-ok' };
    case 'CANCELLED':
    case 'RETURNED':
      return { fg: 'text-bad', bg: 'bg-ember-soft', border: 'border-ember-line', dot: 'bg-bad' };
    case 'SHIPPED':
      return { fg: 'text-ink', bg: 'bg-paper-deep', border: 'border-rule', dot: 'bg-ink' };
    case 'PROCESSING':
      return { fg: 'text-ember', bg: 'bg-ember-soft', border: 'border-ember-line', dot: 'bg-ember' };
    default:
      return { fg: 'text-warn', bg: 'bg-citrus-soft', border: 'border-citrus-line', dot: 'bg-warn' };
  }
}
