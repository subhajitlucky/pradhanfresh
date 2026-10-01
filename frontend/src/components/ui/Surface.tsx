import type { ReactNode } from 'react';
import { Minus, Plus } from 'lucide-react';
import { imageUrl } from '../../lib/api';
import { cn, money } from '../../lib/format';

/* -------------------------------------------------------------------------- */
/*  Surfaces                                                                   */
/* -------------------------------------------------------------------------- */

export function Card({
  children,
  className,
  as: Tag = 'div',
  interactive,
  ...rest
}: {
  children: ReactNode;
  className?: string;
  as?: 'div' | 'article' | 'li' | 'section';
  interactive?: boolean;
} & Record<string, unknown>) {
  return (
    <Tag
      className={cn(
        'relative rounded-lg border border-rule bg-paper-card',
        interactive &&
          'transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-0.5 hover:border-ink-3 hover:shadow-lift',
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/** Section header used across every page: eyebrow, display heading, lede. */
export function SectionHeading({
  eyebrow,
  title,
  lede,
  align = 'left',
  action,
  className,
  as: Tag = 'h2',
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  lede?: ReactNode;
  align?: 'left' | 'center';
  action?: ReactNode;
  className?: string;
  as?: 'h1' | 'h2' | 'h3';
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4',
        align === 'center' ? 'items-center text-center' : 'items-start',
        action ? 'md:flex-row md:items-end md:justify-between' : '',
        className,
      )}
    >
      <div className={cn('max-w-2xl space-y-3', align === 'center' && 'mx-auto')}>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <Tag className="text-4xl leading-[1.02] sm:text-5xl md:text-[3.5rem]">{title}</Tag>
        {lede && <p className="text-base leading-relaxed text-ink-2 sm:text-lg">{lede}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Image — resolves backend paths and survives a broken link                  */
/* -------------------------------------------------------------------------- */

/**
 * Image with a built-in fallback: resolves backend `/uploads/…` paths, requests
 * in CORS mode (helmet blocks a plain cross-origin <img>), and swaps to a crate
 * glyph if the source 404s.
 *
 * The element positions itself `relative` so the fallback overlay can sit on top.
 * That means `className="absolute"` is silently ignored — Tailwind emits
 * `.relative` after `.absolute`, so `relative` wins and a full-bleed image would
 * collapse. Use `fill` to opt into absolute positioning explicitly.
 */
export function ProseImage({
  src,
  alt,
  className,
  imgClassName,
  fallback = 'produce',
  loading = 'lazy',
  fill = false,
}: {
  src?: string | null;
  alt: string;
  className?: string;
  imgClassName?: string;
  fallback?: 'produce' | 'crate';
  loading?: 'lazy' | 'eager';
  /** Stretch to the nearest positioned ancestor instead of participating in flow. */
  fill?: boolean;
}) {
  const resolved = imageUrl(src);
  return (
    <span
      className={cn(
        'block overflow-hidden bg-paper-deep',
        fill ? 'absolute inset-0' : 'relative',
        className,
      )}
    >
      {resolved ? (
        <img
          src={resolved}
          alt={alt}
          loading={loading}
          // helmet sets crossOriginResourcePolicy: same-origin on the API, which
          // blocks a cross-origin <img> unless the request is made in CORS mode.
          crossOrigin="anonymous"
          decoding="async"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            e.currentTarget.nextElementSibling?.removeAttribute('hidden');
          }}
          className={cn('size-full object-cover', imgClassName)}
        />
      ) : null}
      <span hidden className="absolute inset-0 grid place-items-center bg-paper-deep text-ink-4">
        {fallback === 'crate' ? (
          <svg viewBox="0 0 48 48" className="size-8" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
            <path d="M6 18h36v20a4 4 0 0 1-4 4H10a4 4 0 0 1-4-4V18Z" />
            <path d="M4 12h40v6H4zM14 12l6-6M34 12l-6-6" />
          </svg>
        ) : (
          <svg viewBox="0 0 48 48" className="size-8" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
            <circle cx="24" cy="27" r="13" />
            <path d="M24 14c0-4 3-7 7-8-1 5-3 8-7 8Z" />
          </svg>
        )}
      </span>
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*  Price                                                                      */
/* -------------------------------------------------------------------------- */

export function PriceTag({
  price,
  salePrice,
  unit,
  size = 'md',
  className,
}: {
  price: number;
  salePrice?: number | null;
  unit?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const onSale = !!salePrice && salePrice < price;
  const main = size === 'lg' ? 'text-3xl' : size === 'md' ? 'text-xl' : 'text-base';

  return (
    <span className={cn('flex items-baseline gap-1.5', className)}>
      <span className={cn('tnum font-display font-semibold text-ink', main)}>
        {money(onSale ? salePrice! : price)}
      </span>
      {onSale && (
        <span className="tnum font-mono text-xs text-ink-3 line-through">{money(price)}</span>
      )}
      {unit && <span className="font-mono text-[0.6875rem] uppercase tracking-wider text-ink-3">/ {unit}</span>}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*  Quantity stepper                                                           */
/* -------------------------------------------------------------------------- */

export function QtyStepper({
  value,
  onChange,
  min = 1,
  max = 99,
  disabled,
  label = 'Quantity',
  size = 'md',
}: {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  label?: string;
  size?: 'sm' | 'md';
}) {
  const dim = size === 'sm' ? 'size-8' : 'size-10';
  const box = size === 'sm' ? 'min-w-9 text-sm' : 'min-w-11 text-base';

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-md border border-rule bg-paper-card',
        disabled && 'opacity-45',
      )}
    >
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={disabled || value <= min}
        aria-label={`Decrease ${label.toLowerCase()}`}
        className={cn(
          dim,
          'grid place-items-center rounded-l-md text-ink-2 transition-colors hover:bg-paper-deep hover:text-ink',
          'disabled:pointer-events-none disabled:opacity-30',
        )}
      >
        <Minus className="size-3.5" aria-hidden />
      </button>
      <span
        aria-live="polite"
        aria-label={`${label}: ${value}`}
        className={cn('tnum border-x border-rule text-center font-mono font-medium', box)}
      >
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={disabled || value >= max}
        aria-label={`Increase ${label.toLowerCase()}`}
        className={cn(
          dim,
          'grid place-items-center rounded-r-md text-ink-2 transition-colors hover:bg-paper-deep hover:text-ink',
          'disabled:pointer-events-none disabled:opacity-30',
        )}
      >
        <Plus className="size-3.5" aria-hidden />
      </button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Pagination — mirrors the backend pagination envelope                       */
/* -------------------------------------------------------------------------- */

export function Pagination({
  page,
  totalPages,
  onChange,
  className,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  className?: string;
}) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter((p) => {
    if (totalPages <= 7) return true;
    return p === 1 || p === totalPages || Math.abs(p - page) <= 1;
  });

  return (
    <nav aria-label="Pagination" className={cn('flex items-center justify-center gap-1.5', className)}>
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className="h-9 rounded-md border border-rule bg-paper-card px-3 font-mono text-xs uppercase tracking-wider text-ink-2 transition-colors hover:border-ink hover:text-ink disabled:pointer-events-none disabled:opacity-35"
      >
        Prev
      </button>

      {pages.map((p, i) => {
        const gap = i > 0 && p - pages[i - 1] > 1;
        return (
          <span key={p} className="flex items-center gap-1.5">
            {gap && (
              <span aria-hidden className="px-1 font-mono text-xs text-ink-4">
                …
              </span>
            )}
            <button
              type="button"
              onClick={() => onChange(p)}
              aria-current={p === page ? 'page' : undefined}
              className={cn(
                'tnum h-9 min-w-9 rounded-md border px-2.5 font-mono text-xs transition-colors',
                p === page
                  ? 'border-ink bg-ink text-paper'
                  : 'border-rule bg-paper-card text-ink-2 hover:border-ink hover:text-ink',
              )}
            >
              {p}
            </button>
          </span>
        );
      })}

      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        className="h-9 rounded-md border border-rule bg-paper-card px-3 font-mono text-xs uppercase tracking-wider text-ink-2 transition-colors hover:border-ink hover:text-ink disabled:pointer-events-none disabled:opacity-35"
      >
        Next
      </button>
    </nav>
  );
}

/* -------------------------------------------------------------------------- */
/*  Stat                                                                      */
/* -------------------------------------------------------------------------- */

export function Stat({
  label,
  value,
  note,
  tone = 'ink',
  index = 0,
}: {
  label: string;
  value: ReactNode;
  note?: ReactNode;
  tone?: 'ink' | 'ember' | 'leaf' | 'citrus';
  index?: number;
}) {
  const accent = {
    ink: 'text-ink',
    ember: 'text-ember',
    leaf: 'text-leaf',
    citrus: 'text-warn',
  }[tone];

  return (
    <div className="stagger" style={{ '--i': index } as never}>
      <p className="font-mono text-[0.625rem] uppercase tracking-[0.18em] text-ink-3">{label}</p>
      <p className={cn('tnum mt-2 font-display text-3xl font-semibold sm:text-4xl', accent)}>
        {value}
      </p>
      {note && <p className="mt-1 text-xs text-ink-3">{note}</p>}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Hairline meter                                                             */
/* -------------------------------------------------------------------------- */

export function Meter({
  value,
  max = 100,
  tone = 'ember',
  label,
}: {
  value: number;
  max?: number;
  tone?: 'ember' | 'leaf' | 'citrus' | 'ink';
  label?: string;
}) {
  const pct = Math.max(0, Math.min(100, (value / (max || 1)) * 100));
  const bar = {
    ember: 'bg-ember',
    leaf: 'bg-leaf',
    citrus: 'bg-citrus',
    ink: 'bg-ink',
  }[tone];

  return (
    <div
      role="meter"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label}
      className="h-1.5 w-full overflow-hidden rounded-full bg-paper-deep"
    >
      <div className={cn('h-full rounded-full transition-[width] duration-500', bar)} style={{ width: `${pct}%` }} />
    </div>
  );
}
