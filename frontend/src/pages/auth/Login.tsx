import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, Lock, Mail, MailCheck, ShieldCheck, Sprout, Truck } from 'lucide-react';
import { Button, IconButton } from '../../components/ui/Button';
import { Input } from '../../components/ui/Field';
import { ProseImage } from '../../components/ui/Surface';
import { ApiError } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { errText } from '../../lib/catalog';

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * RequireAuth parks the visitor here and remembers where they were headed.
 * Only same-site paths are honoured so the redirect can never leave the app.
 */
function redirectTarget(state: unknown): string {
  if (state && typeof state === 'object' && 'from' in state) {
    const from = (state as { from?: unknown }).from;
    if (typeof from === 'string' && from.startsWith('/') && !from.startsWith('//')) return from;
  }
  return '/profile';
}

const TRUST = [
  { Icon: Truck, title: 'Free delivery over ₹500', note: 'Same-morning slots across Pune.' },
  { Icon: Sprout, title: '200+ local farms', note: 'Picked at dawn, never machine-sorted.' },
  { Icon: ShieldCheck, title: 'Your orders stay yours', note: 'One account, one honest ledger.' },
];

/* -------------------------------------------------------------------------- */
/*  Brand panel — duplicated per auth screen so the family looks identical      */
/* -------------------------------------------------------------------------- */

function HarvestPanel() {
  return (
    <aside
      aria-hidden
      className="hidden flex-col justify-between gap-10 bg-paper-ink px-10 py-14 text-paper lg:flex xl:px-16 xl:py-16"
    >
      <div className="stagger" style={{ '--i': 0 } as never}>
        <p className="font-mono text-[0.625rem] uppercase tracking-[0.28em] text-citrus">
          Est. 1974 · Pune
        </p>
        <p className="mt-6 max-w-md font-display text-[2.75rem] font-semibold leading-[1.02] text-paper">
          The harvest ledger, kept by hand since 1974.
        </p>
        <p className="mt-5 max-w-sm text-[0.9375rem] leading-relaxed text-paper/70">
          Every crate that leaves our yard is weighed, dated and signed for. Your account keeps the
          same ledger for your own orders.
        </p>
      </div>

      <div className="stagger flex flex-col items-center gap-5" style={{ '--i': 1 } as never}>
        <ProseImage
          src="/mark.svg"
          alt=""
          loading="eager"
          className="duotone size-44 rounded-full border border-paper/15 bg-paper-ink"
        />
        <p className="font-mono text-[0.625rem] uppercase tracking-[0.22em] text-paper/50">
          Day 1 · The first ledger book
        </p>
      </div>

      <ul className="stagger space-y-4" style={{ '--i': 2 } as never}>
        {TRUST.map(({ Icon, title, note }) => (
          <li key={title} className="flex items-start gap-3.5">
            <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-md border border-paper/20 bg-paper/5 text-ember">
              <Icon className="size-4" aria-hidden strokeWidth={1.8} />
            </span>
            <span>
              <span className="block text-sm font-medium text-paper">{title}</span>
              <span className="block text-xs leading-snug text-paper/60">{note}</span>
            </span>
          </li>
        ))}
      </ul>
    </aside>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function Login() {
  const login = useAuth((s) => s.login);
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [reveal, setReveal] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [unverified, setUnverified] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending) return; // guards a double click while the request is in flight

    const next: { email?: string; password?: string } = {};
    if (!email.trim()) next.email = 'Enter the email you signed up with.';
    else if (!EMAIL_RE.test(email.trim())) next.email = 'That does not look like an email address.';
    if (!password) next.password = 'Enter your password.';
    setFieldErrors(next);
    if (next.email || next.password) return;

    setPending(true);
    setFormError(null);
    setUnverified(false);

    try {
      await login(email.trim(), password);
      navigate(redirectTarget(location.state), { replace: true });
    } catch (err) {
      setFormError(errText(err, 'We could not sign you in. Please try again.'));
      if (err instanceof ApiError && err.isForbidden) setUnverified(true);
      setPassword('');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid lg:min-h-[36rem] lg:grid-cols-[1.05fr_minmax(0,1fr)]">
      <HarvestPanel />

      <section className="flex items-center justify-center px-5 py-14 sm:px-8 lg:py-20">
        <div className="w-full max-w-[26rem]">
          <span className="eyebrow">Sign in</span>
          <h1 className="mt-4 text-4xl leading-[1.03] sm:text-[2.75rem]">
            Welcome back to the yard.
          </h1>
          <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink-2">
            Sign in to see your crates, addresses and every order you have placed with us.
          </p>

          <form className="mt-8 space-y-4" noValidate onSubmit={onSubmit}>
            {formError && (
              <p
                role="alert"
                className="rounded-md border border-bad/30 bg-ember-soft px-4 py-3 text-sm leading-relaxed text-bad"
              >
                {formError}
              </p>
            )}

            {unverified && (
              <div className="rounded-md border border-citrus-line bg-citrus-soft p-4">
                <p className="flex items-center gap-2 font-mono text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-warn">
                  <MailCheck className="size-4 shrink-0" aria-hidden />
                  Email not verified
                </p>
                <p className="mt-2.5 text-sm leading-relaxed text-ink-2">
                  Your account exists, but sign-in stays closed until the address is verified. Open
                  the link we emailed you when you registered — it opens{' '}
                  <span className="font-mono text-xs text-ink">pradhanfresh…/verify-email?token=…</span>
                </p>
                <p className="mt-2.5 text-sm leading-relaxed text-ink-2">
                  We have no &ldquo;resend&rdquo; button on the login screen, so if that link expired or
                  the mail never arrived, ask us to post a fresh one at{' '}
                  <Link to="/contact" className="wipe font-medium text-ember">
                    the market counter
                  </Link>
                  .
                </p>
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="mt-1 -ml-3.5"
                  onClick={() => {
                    setUnverified(false);
                    setFormError(null);
                  }}
                >
                  Use a different account
                </Button>
              </div>
            )}

            <Input
              name="email"
              type="email"
              label="Email address"
              autoComplete="email"
              inputMode="email"
              required
              icon={<Mail className="size-4" aria-hidden />}
              placeholder="you@example.com"
              value={email}
              error={fieldErrors.email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldErrors.email) setFieldErrors((f) => ({ ...f, email: undefined }));
              }}
            />

            <div className="flex items-end gap-2">
              <Input
                containerClassName="min-w-0 flex-1"
                name="password"
                type={reveal ? 'text' : 'password'}
                label="Password"
                autoComplete="current-password"
                required
                icon={<Lock className="size-4" aria-hidden />}
                placeholder="Your market password"
                value={password}
                error={fieldErrors.password}
                aside={
                  <Link to="/forgot-password" className="wipe font-medium text-ember">
                    Forgot password?
                  </Link>
                }
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) setFieldErrors((f) => ({ ...f, password: undefined }));
                }}
              />
              <IconButton
                label={reveal ? 'Hide password' : 'Show password'}
                onClick={() => setReveal((v) => !v)}
                aria-pressed={reveal}
                className="mb-[1px] shrink-0"
              >
                {reveal ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
              </IconButton>
            </div>

            <Button
              type="submit"
              variant="ember"
              size="lg"
              full
              loading={pending}
              disabled={pending}
              rightIcon={<ArrowRight className="size-4" aria-hidden />}
            >
              {pending ? 'Opening the ledger…' : 'Sign in'}
            </Button>

            <p role="status" aria-live="polite" className="sr-only">
              {pending ? 'Signing you in, please wait.' : ''}
            </p>
          </form>

          <p className="mt-8 border-t border-rule pt-5 text-sm leading-relaxed text-ink-3">
            First time at the counter?{' '}
            <Link to="/signup" className="wipe font-medium text-ember">
              Create an account
            </Link>{' '}
            — it takes a minute and a verified inbox.
          </p>
        </div>
      </section>
    </div>
  );
}