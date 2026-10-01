import { forwardRef, useId } from 'react';
import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/format';

/* -------------------------------------------------------------------------- */
/*  Shared shell                                                               */
/* -------------------------------------------------------------------------- */

interface FieldShellProps {
  id: string;
  label?: ReactNode;
  hint?: ReactNode;
  error?: string | null;
  required?: boolean;
  /** Right-aligned label slot, e.g. a "Forgot password?" link. */
  aside?: ReactNode;
  className?: string;
  children: ReactNode;
}

function FieldShell({
  id,
  label,
  hint,
  error,
  required,
  aside,
  className,
  children,
}: FieldShellProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {(label || aside) && (
        <div className="flex items-baseline justify-between gap-3">
          {label && (
            <label
              htmlFor={id}
              className="font-mono text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-ink-3"
            >
              {label}
              {required && <span className="ml-0.5 text-ember">*</span>}
            </label>
          )}
          {aside && <div className="text-xs text-ink-3">{aside}</div>}
        </div>
      )}
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-xs font-medium text-bad">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-ink-3">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

const CONTROL =
  'w-full rounded-md border bg-paper-card px-3.5 text-[0.9375rem] text-ink placeholder:text-ink-4 ' +
  'transition-[border-color,box-shadow,background-color] duration-200 ' +
  'hover:border-rule-strong focus:outline-none focus-visible:border-ember ' +
  'focus-visible:shadow-[0_0_0_3px_var(--color-ember-soft)] disabled:cursor-not-allowed disabled:bg-paper-deep disabled:text-ink-3';

function controlClass(invalid: boolean): string {
  return cn(CONTROL, invalid ? 'border-bad' : 'border-rule');
}

/* -------------------------------------------------------------------------- */
/*  Text input                                                                 */
/* -------------------------------------------------------------------------- */

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: string | null;
  aside?: ReactNode;
  /** Icon rendered inside the left edge of the control. */
  icon?: ReactNode;
  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, aside, icon, className, containerClassName, required, ...rest },
  ref,
) {
  const auto = useId();
  const id = rest.name ? `${rest.name}-${auto}` : auto;

  return (
    <FieldShell
      id={id}
      label={label}
      hint={hint}
      error={error}
      required={required}
      aside={aside}
      className={containerClassName}
    >
      <div className="relative">
        {icon && (
          <span
            aria-hidden
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3"
          >
            {icon}
          </span>
        )}
        <input
          ref={ref}
          id={id}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          className={cn(controlClass(!!error), 'h-11', icon && 'pl-10', className)}
          {...rest}
        />
      </div>
    </FieldShell>
  );
});

/* -------------------------------------------------------------------------- */
/*  Textarea                                                                   */
/* -------------------------------------------------------------------------- */

interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: string | null;
  containerClassName?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, className, containerClassName, required, rows = 4, ...rest },
  ref,
) {
  const auto = useId();
  const id = rest.name ? `${rest.name}-${auto}` : auto;

  return (
    <FieldShell
      id={id}
      label={label}
      hint={hint}
      error={error}
      required={required}
      className={containerClassName}
    >
      <textarea
        ref={ref}
        id={id}
        rows={rows}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className={cn(controlClass(!!error), 'py-2.5 leading-relaxed', className)}
        {...rest}
      />
    </FieldShell>
  );
});

/* -------------------------------------------------------------------------- */
/*  Select                                                                     */
/* -------------------------------------------------------------------------- */

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id'> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: string | null;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  containerClassName?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, error, options, className, containerClassName, required, ...rest },
  ref,
) {
  const auto = useId();
  const id = rest.name ? `${rest.name}-${auto}` : auto;

  return (
    <FieldShell
      id={id}
      label={label}
      hint={hint}
      error={error}
      required={required}
      className={containerClassName}
    >
      <div className="relative">
        <select
          ref={ref}
          id={id}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          className={cn(controlClass(!!error), 'h-11 cursor-pointer appearance-none pr-10', className)}
          {...rest}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value} disabled={o.disabled}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden
          className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-3"
        />
      </div>
    </FieldShell>
  );
});

/* -------------------------------------------------------------------------- */
/*  Checkbox — a real input, a printed box                                    */
/* -------------------------------------------------------------------------- */

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'type'> {
  label: ReactNode;
  description?: ReactNode;
  count?: number;
}

export function Checkbox({ label, description, count, className, ...rest }: CheckboxProps) {
  const auto = useId();
  const id = rest.name ? `${rest.name}-${auto}` : auto;

  return (
    <div className={cn('flex items-start gap-3', className)}>
      <span className="relative mt-0.5 grid size-[1.125rem] shrink-0 place-items-center">
        <input
          type="checkbox"
          id={id}
          className="peer size-[1.125rem] cursor-pointer appearance-none rounded-[3px] border border-rule-strong bg-paper-card transition-colors checked:border-ember checked:bg-ember hover:border-ember disabled:cursor-not-allowed disabled:opacity-40"
          {...rest}
        />
        <svg
          aria-hidden
          viewBox="0 0 12 12"
          className="pointer-events-none absolute size-3 scale-50 stroke-paper-card stroke-[2.2] opacity-0 transition peer-checked:scale-100 peer-checked:opacity-100"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M2.5 6.2 4.8 8.5 9.5 3.8" />
        </svg>
      </span>
      <label htmlFor={id} className="flex min-w-0 flex-1 cursor-pointer items-baseline gap-2">
        <span className="text-sm text-ink-2 transition-colors peer-checked:text-ink">
          {label}
        </span>
        {count != null && (
          <span className="tnum ml-auto shrink-0 font-mono text-xs text-ink-4">{count}</span>
        )}
      </label>
      {description && <p className="w-full text-xs text-ink-3">{description}</p>}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Radio group — rendered as real radios inside a segmented rule              */
/* -------------------------------------------------------------------------- */

interface RadioOption<T extends string> {
  value: T;
  label: string;
  description?: string;
  icon?: ReactNode;
}

interface RadioGroupProps<T extends string> {
  legend: string;
  name: string;
  value: T;
  onChange: (value: T) => void;
  options: Array<RadioOption<T>>;
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}

export function RadioGroup<T extends string>({
  legend,
  name,
  value,
  onChange,
  options,
  columns = 2,
  className,
}: RadioGroupProps<T>) {
  const cols = { 1: '', 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-3', 4: 'sm:grid-cols-4' }[columns];

  return (
    <fieldset className={className}>
      <legend className="mb-2.5 font-mono text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-ink-3">
        {legend}
      </legend>
      <div className={cn('grid grid-cols-1 gap-2', cols)}>
        {options.map((o) => {
          const checked = o.value === value;
          return (
            <label
              key={o.value}
              className={cn(
                'flex cursor-pointer items-center gap-3 rounded-md border px-3.5 py-3 transition-colors duration-200',
                checked
                  ? 'border-ember bg-ember-soft'
                  : 'border-rule bg-paper-card hover:border-rule-strong',
              )}
            >
              <input
                type="radio"
                name={name}
                value={o.value}
                checked={checked}
                onChange={() => onChange(o.value)}
                className="peer sr-only"
              />
              <span
                aria-hidden
                className={cn(
                  'grid size-4 shrink-0 place-items-center rounded-full border-2 transition-colors',
                  checked ? 'border-ember' : 'border-rule-strong',
                )}
              >
                <span
                  className={cn(
                    'size-2 rounded-full bg-ember transition-transform duration-200',
                    checked ? 'scale-100' : 'scale-0',
                  )}
                />
              </span>
              {o.icon && (
                <span aria-hidden className={cn('shrink-0', checked ? 'text-ember' : 'text-ink-3')}>
                  {o.icon}
                </span>
              )}
              <span className="min-w-0">
                <span
                  className={cn(
                    'block text-sm font-medium',
                    checked ? 'text-ink' : 'text-ink-2',
                  )}
                >
                  {o.label}
                </span>
                {o.description && (
                  <span className="mt-0.5 block text-xs leading-snug text-ink-3">
                    {o.description}
                  </span>
                )}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
