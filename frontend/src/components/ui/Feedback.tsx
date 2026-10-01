import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { AlertCircle, Check, Info, X } from 'lucide-react';
import { cn } from '../../lib/format';

/* -------------------------------------------------------------------------- */
/*  Badge                                                                      */
/* -------------------------------------------------------------------------- */

type Tone = 'ink' | 'ember' | 'leaf' | 'citrus' | 'paper';

const TONES: Record<Tone, string> = {
  ink: 'border-ink bg-ink text-paper',
  ember: 'border-ember-line bg-ember-soft text-ember-deep',
  leaf: 'border-leaf-line bg-leaf-soft text-leaf-deep',
  citrus: 'border-citrus-line bg-citrus-soft text-warn',
  paper: 'border-rule bg-paper-deep text-ink-2',
};

export function Badge({
  tone = 'paper',
  children,
  className,
  dot,
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
  dot?: boolean;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5',
        'font-mono text-[0.625rem] font-medium uppercase tracking-[0.12em]',
        TONES[tone],
        className,
      )}
    >
      {dot && <span aria-hidden className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*  Spinner / skeleton                                                         */
/* -------------------------------------------------------------------------- */

export function Spinner({ className, label }: { className?: string; label?: string }) {
  return (
    <span role={label ? 'status' : undefined} className={cn('inline-flex items-center gap-2', className)}>
      <span
        aria-hidden
        className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent opacity-70"
      />
      {label && <span className="text-sm text-ink-3">{label}</span>}
      {label && <span className="sr-only">{label}</span>}
    </span>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        'relative overflow-hidden rounded-sm bg-paper-deep',
        'after:absolute after:inset-0 after:-translate-x-full',
        'after:bg-gradient-to-r after:from-transparent after:via-paper-card/70 after:to-transparent',
        'after:animate-[rise_1.4s_ease-in-out_infinite]',
        className,
      )}
    />
  );
}

/** Full-section loading state that keeps layout height stable. */
export function LoadingBlock({ label = 'Loading' }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-[40vh] flex-col items-center justify-center gap-3"
    >
      <Spinner className="text-ember" />
      <p className="font-mono text-[0.6875rem] uppercase tracking-[0.2em] text-ink-3">
        {label}
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Empty & error states                                                       */
/* -------------------------------------------------------------------------- */

export function EmptyState({
  icon,
  title,
  body,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  body?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-rule',
        'bg-paper-card/50 px-6 py-16 text-center',
        className,
      )}
    >
      {icon && (
        <div className="grid size-14 place-items-center rounded-full border border-rule bg-paper-deep text-ink-3">
          {icon}
        </div>
      )}
      <div className="max-w-sm space-y-1.5">
        <h3 className="text-xl text-ink">{title}</h3>
        {body && <p className="text-sm leading-relaxed text-ink-3">{body}</p>}
      </div>
      {action}
    </div>
  );
}

export function ErrorState({
  title = 'That did not load',
  message,
  onRetry,
  className,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center gap-4 rounded-lg border border-ember-line bg-ember-soft/40',
        'px-6 py-14 text-center',
        className,
      )}
    >
      <div className="grid size-14 place-items-center rounded-full border border-ember-line bg-ember-soft text-ember">
        <AlertCircle className="size-6" aria-hidden />
      </div>
      <div className="max-w-sm space-y-1.5">
        <h3 className="text-xl text-ink">{title}</h3>
        {message && <p className="text-sm leading-relaxed text-ink-2">{message}</p>}
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-md border border-rule-strong bg-paper-card px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-ink hover:text-paper"
        >
          Try again
        </button>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Toasts                                                                     */
/* -------------------------------------------------------------------------- */

type ToastKind = 'success' | 'error' | 'info';
interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

const ToastCtx = createContext<{
  notify: (message: string, kind?: ToastKind) => void;
} | null>(null);

const TOAST_STYLE: Record<ToastKind, { cls: string; Icon: typeof Check }> = {
  success: { cls: 'border-ok bg-leaf-soft text-leaf-deep', Icon: Check },
  error: { cls: 'border-bad bg-ember-soft text-bad', Icon: AlertCircle },
  info: { cls: 'border-rule-strong bg-paper-ink text-paper', Icon: Info },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const seq = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const notify = useCallback(
    (message: string, kind: ToastKind = 'success') => {
      const id = ++seq.current;
      setToasts((t) => [...t.slice(-2), { id, kind, message }]);
      window.setTimeout(() => dismiss(id), 4200);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <ToastCtx.Provider value={value}>
      {children}
      <div
        // Polite live region: cart actions announce without interrupting.
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed bottom-5 left-1/2 z-[100] flex w-[min(26rem,calc(100vw-2rem))] -translate-x-1/2 flex-col gap-2 sm:left-auto sm:right-5 sm:translate-x-0"
      >
        {toasts.map((t) => {
          const { cls, Icon } = TOAST_STYLE[t.kind];
          return (
            <div
              key={t.id}
              className={cn(
                'pointer-events-auto flex items-start gap-3 rounded-md border px-4 py-3 shadow-lift',
                'animate-[slide-in_0.35s_var(--ease-out-soft)_both]',
                cls,
              )}
            >
              <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
              <p className="flex-1 text-sm leading-snug">{t.message}</p>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss notification"
                className="-mr-1 -mt-0.5 shrink-0 rounded p-1 opacity-60 transition-opacity hover:opacity-100"
              >
                <X className="size-3.5" aria-hidden />
              </button>
            </div>
          );
        })}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
