import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, Check, Lock, ShieldCheck, Sprout, Truck } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Field';
import { Meter, ProseImage } from '../../components/ui/Surface';
import { api } from '../../lib/api';
import { errText } from '../../lib/catalog';

const MIN_PASSWORD = 6;

type Tone = 'ember' | 'citrus' | 'leaf';

function strength(pw: string): { score: number; label: string; tone: Tone } {
  if (!pw) return { score: 0, label: 'Nothing yet', tone: 'ember' };
  if (pw.length < MIN_PASSWORD) return { score: 1, label: 'Too short', tone: 'ember' };

  let points = 1;
  if (pw.length >= 10) points += 1;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) points += 1;
  if (/\d/.test(pw) || /[^A-Za-z0-9]/.test(pw)) points += 1;

  if (points <= 1) return { score: 1, label: 'Weak', tone: 'ember' };
  if (points === 2) return { score: 2, label: 'Fair', tone: 'citrus' };
  if (points === 3) return { score: 3, label: 'Good', tone: 'leaf' };
  return { score: 4, label: 'Strong', tone: 'leaf' };
}

const TRUST = [
  { Icon: Truck, title: 'Free delivery over ₹500', note: 'Same-morning slots across Pune.' },
  { Icon: Sprout, title: '200+ local farms', note: 'Picked at dawn, never machine-sorted.' },
  { Icon: ShieldCheck, title: 'Your basket is safe', note: 'A new password changes nothing else.' },
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
          One signature closes the day.
        </p>
        <p className="mt-5 max-w-sm text-[0.9375rem] leading-relaxed text-paper/70">
          A reset link is a blank cheque the market stamps itself. Set a new password and the ledger
          carries on exactly where it left off.
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
          Nothing is deleted · Nothing is re-issued
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

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token')?.trim() ?? '';
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  /** Seconds until we walk the customer back to sign-in. null = no countdown. */
  const [countdown, setCountdown] = useState<number | null>(null);

  // The countdown timer must never outlive the page — clearing on every run
  // of the effect covers both the next tick and unmounting mid-count.
  const timer = useRef<number | null>(null);
  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      navigate('/login', { replace: true });
      return;
    }
    timer.current = window.setTimeout(() => setCountdown((c) => (c === null ? null : c - 1)), 1000);
    return () => {
      if (timer.current !== null) {
        window.clearTimeout(timer.current);
        timer.current = null;
      }
    };
  }, [countdown, navigate]);

  const meter = strength(password);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending || !token) return; // guards a double click while in flight

    const next: Record<string, string | undefined> = {};
    if (password.length < MIN_PASSWORD)
      next.password = `Use at least ${MIN_PASSWORD} characters.`;
    if (confirm !== password) next.confirm = 'The two passwords do not match.';

    setErrors(next);
    if (next.password || next.confirm) return;

    setPending(true);
    setFormError(null);

    try {
      await api.post('/auth/reset-password', { token, password });
      setDone(true);
      setCountdown(8);
    } catch (err) {
      setFormError(errText(err, 'We could not set that password. Request a fresh link and try again.'));
    } finally {
      setPending(false);
    }
  }

  /* --- No token: the link is unusable, so say so plainly. ---------------- */
  if (!token) {
    return (
      <div className="grid lg:min-h-[36rem] lg:grid-cols-[1.05fr_minmax(0,1fr)]">
        <HarvestPanel />
        <section className="flex items-center justify-center px-5 py-14 sm:px-8 lg:py-20">
          <div className="w-full max-w-[26rem]">
            <span className="eyebrow">Invalid link</span>
            <h1 className="mt-4 text-4xl leading-[1.03] sm:text-[2.75rem]">
              This reset link has lost its signature.
            </h1>
            <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink-2">
              The address you opened is missing its one-time code. Links also expire about an hour
              after we post them, so an old mail will not work either.
            </p>

            <div className="mt-8 grid gap-2">
              <Button to="/forgot-password" variant="ember" size="lg" full>
                Request a new link
              </Button>
              <Button to="/login" variant="ghost" full>
                Back to sign in
              </Button>
            </div>

            <p className="mt-8 border-t border-rule pt-5 text-sm leading-relaxed text-ink-3">
              No reset mail arriving at all? Write to us at{' '}
              <Link to="/contact" className="wipe font-medium text-ember">
                the market counter
              </Link>
              .
            </p>
          </div>
        </section>
      </div>
    );
  }

  /* --- Success ---------------------------------------------------------- */
  if (done) {
    return (
      <div className="grid lg:min-h-[36rem] lg:grid-cols-[1.05fr_minmax(0,1fr)]">
        <HarvestPanel />
        <section className="flex items-center justify-center px-5 py-14 sm:px-8 lg:py-20">
          <div className="w-full max-w-[26rem]" role="status" aria-live="polite">
            <span className="eyebrow">Password set</span>
            <h1 className="mt-4 text-4xl leading-[1.03] sm:text-[2.75rem]">The ledger is yours.</h1>
            <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink-2">
              Your new password is active. Sign in with it and everything you had before — orders,
              addresses, everything — is still there.
            </p>

            <div className="mt-8 rounded-lg border border-leaf-line bg-leaf-soft p-5">
              <p className="flex items-center gap-2 font-mono text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-leaf-deep">
                <Check className="size-4 shrink-0" aria-hidden />
                Signed and sealed
              </p>
              <p className="mt-2.5 text-sm leading-relaxed text-ink-2">
                This reset code is spent. If it ever leaks, ask us for a fresh one — we do not keep
                a way back in.
              </p>
            </div>

            <Button
              to="/login"
              variant="ember"
              size="lg"
              full
              className="mt-7"
              rightIcon={<ArrowRight className="size-4" aria-hidden />}
            >
              Sign in with your new password
            </Button>

            {countdown !== null && (
              <p className="mt-4 text-center text-xs text-ink-3">
                Taking you back to sign in in{' '}
                <span className="tnum font-mono text-ink-2">{countdown}s</span>…
              </p>
            )}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="grid lg:min-h-[36rem] lg:grid-cols-[1.05fr_minmax(0,1fr)]">
      <HarvestPanel />

      <section className="flex items-center justify-center px-5 py-14 sm:px-8 lg:py-20">
        <div className="w-full max-w-[26rem]">
          <span className="eyebrow">Set a new password</span>
          <h1 className="mt-4 text-4xl leading-[1.03] sm:text-[2.75rem]">
            Close the day with a new key.
          </h1>
          <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink-2">
            Choose something you will remember. We need it twice so a typo cannot lock you out.
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

            <div>
              <Input
                name="password"
                type="password"
                label="New password"
                autoComplete="new-password"
                required
                icon={<Lock className="size-4" aria-hidden />}
                placeholder={`At least ${MIN_PASSWORD} characters`}
                value={password}
                error={errors.password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors((f) => ({ ...f, password: undefined }));
                }}
              />

              {password.length > 0 && (
                <div className="mt-3 flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <Meter
                      value={meter.score}
                      max={4}
                      tone={meter.tone}
                      label={`Password strength: ${meter.label}`}
                    />
                  </div>
                  <span
                    aria-live="polite"
                    className="shrink-0 font-mono text-[0.625rem] uppercase tracking-[0.16em] text-ink-3"
                  >
                    {meter.label}
                  </span>
                </div>
              )}
            </div>

            <Input
              name="confirm"
              type="password"
              label="Confirm new password"
              autoComplete="new-password"
              required
              icon={<Lock className="size-4" aria-hidden />}
              placeholder="Type it once more"
              value={confirm}
              error={errors.confirm}
              onChange={(e) => {
                setConfirm(e.target.value);
                if (errors.confirm) setErrors((f) => ({ ...f, confirm: undefined }));
              }}
            />

            <Button
              type="submit"
              variant="ember"
              size="lg"
              full
              loading={pending}
              disabled={pending}
              rightIcon={<ArrowRight className="size-4" aria-hidden />}
            >
              {pending ? 'Stamping the ledger…' : 'Set new password'}
            </Button>

            <p role="status" aria-live="polite" className="sr-only">
              {pending ? 'Saving your new password, please wait.' : ''}
            </p>
          </form>

          <p className="mt-8 border-t border-rule pt-5 text-sm leading-relaxed text-ink-3">
            Code already used or expired?{' '}
            <Link to="/forgot-password" className="wipe font-medium text-ember">
              Request another link
            </Link>
            .
          </p>
        </div>
      </section>
    </div>
  );
}