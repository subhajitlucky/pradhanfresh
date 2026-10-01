import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/format';

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

type Variant = 'ink' | 'ember' | 'outline' | 'ghost' | 'link';
type Size = 'sm' | 'md' | 'lg';

interface BaseProps {
  variant?: Variant;
  size?: Size;
  /** Renders a <Link> when given, a <button> otherwise. */
  to?: string;
  href?: string;
  full?: boolean;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  children?: ReactNode;
  className?: string;
}

type ButtonProps = BaseProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof BaseProps | 'children'>;

/* -------------------------------------------------------------------------- */
/*  Styles — print logic: solid ink slab, 2px rule, presses on active          */
/* -------------------------------------------------------------------------- */

const VARIANTS: Record<Variant, string> = {
  ink: 'bg-ink text-paper border-ink hover:bg-ink-2 hover:border-ink-2 shadow-[0_2px_0_0_var(--color-ink)] active:translate-y-px active:shadow-none',
  ember:
    'bg-ember text-paper-card border-ember-deep hover:bg-ember-deep hover:border-ember-deep shadow-[0_2px_0_0_var(--color-ember-deep)] active:translate-y-px active:shadow-none',
  outline:
    'bg-paper-card text-ink border-rule-strong hover:bg-ink hover:text-paper hover:border-ink active:translate-y-px',
  ghost: 'bg-transparent text-ink-2 border-transparent hover:bg-paper-deep hover:text-ink',
  link: 'bg-transparent text-ember border-transparent hover:text-ember-deep underline underline-offset-4 decoration-ember-line decoration-1 hover:decoration-ember',
};

const SIZES: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-[0.8125rem] gap-1.5',
  md: 'h-11 px-5 text-sm gap-2',
  lg: 'h-14 px-8 text-base gap-2.5',
};

const BASE =
  'relative inline-flex select-none items-center justify-center whitespace-nowrap border font-medium ' +
  'transition-[background-color,color,border-color,transform,box-shadow] duration-200 ' +
  'disabled:pointer-events-none disabled:opacity-45 rounded-md';

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'ink',
    size = 'md',
    to,
    href,
    full,
    loading,
    leftIcon,
    rightIcon,
    className,
    children,
    disabled,
    ...rest
  },
  ref,
) {
  const classes = cn(BASE, VARIANTS[variant], SIZES[size], full && 'w-full', className);

  const inner = (
    <>
      {loading ? (
        <span
          aria-hidden
          className="size-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      ) : (
        leftIcon
      )}
      {children}
      {!loading && rightIcon}
    </>
  );

  if (to && !disabled) {
    return (
      <Link to={to} className={classes} aria-busy={loading || undefined}>
        {inner}
      </Link>
    );
  }

  if (href && !disabled) {
    return (
      <a href={href} className={classes} aria-busy={loading || undefined}>
        {inner}
      </a>
    );
  }

  return (
    <button
      ref={ref}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {inner}
    </button>
  );
});

/* -------------------------------------------------------------------------- */
/*  Icon button                                                                */
/* -------------------------------------------------------------------------- */

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  children: ReactNode;
  tone?: 'default' | 'ember' | 'paper';
  size?: 'sm' | 'md';
}

export function IconButton({
  label,
  children,
  tone = 'default',
  size = 'md',
  className,
  ...rest
}: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        'inline-grid place-items-center rounded-md border transition-colors duration-200',
        'disabled:pointer-events-none disabled:opacity-40',
        size === 'sm' ? 'size-8' : 'size-10',
        tone === 'ember' && 'border-ember-line bg-ember-soft text-ember hover:bg-ember hover:text-paper-card',
        tone === 'paper' && 'border-transparent bg-paper-deep text-ink hover:bg-ink hover:text-paper',
        tone === 'default' && 'border-rule bg-paper-card text-ink-2 hover:border-ink hover:text-ink',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
