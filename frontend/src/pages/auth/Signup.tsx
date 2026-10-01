import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, Lock, Mail, ShieldCheck, Sprout, Truck, User } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Field';
import { Meter, ProseImage } from '../../components/ui/Surface';
import { useAuth } from '../../lib/auth';
import { errText } from '../../lib/catalog';

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
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
  { Icon: ShieldCheck, title: 'One account, one ledger', note: 'Orders and addresses in one place.' },
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
          Fifty years of crates, now one account.
        </p>
        <p className="mt-5 max-w-sm text-[0.9375rem] leading-relaxed text-paper/70">
          Opening a ledger is how a market keeps its promise. Tell us where to bring the harvest and
          we will keep the receipts.
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
          200+ farms · 1 delivery route
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
/*  Confirmation — signup returns no token, so the inbox does the signing       */
/* -------------------------------------------------------------------------- */

function SentState({ email }: { email: string }) {
  return (
    <div className="stagger">
      <span className="eyebrow">Almost there</span>
      <h1 className="mt-4 text-4xl leading-[1.03] sm:text-[2.75rem]">Check your inbox.</h1>
      <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink-2">
        We sent a verification link to{' '}
        <span className="font-medium text-ink">{email}</span>. Open it, then come back and sign in.
      </p>

      <div className="mt-8 rounded-lg border border-leaf-line bg-leaf-soft p-5">
        <p className="flex items-center gap-2 font-mono text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-leaf-deep">
          <Check className="size-4 shrink-0" aria-hidden />
          Ledger opened
        </p>
        <ol className="mt-3.5 space-y-2.5 text-sm leading-relaxed text-ink-2">
          <li className="flex gap-2.5">
            <span className="tnum font-mono text-xs text-leaf-deep">01</span>Open the email we just sent.
          </li>
          <li className="flex gap-2.5">
            <span className="tnum font-mono text-xs text-leaf-deep">02</span>Follow the link to verify your address.
          </li>
          <li className="flex gap-2.5">
            <span className="tnum font-mono text-xs text-leaf-deep">03</span>Sign in — verification is required before the first order.
          </li>
        </ol>
      </div>

      <p className="mt-5 text-sm leading-relaxed text-ink-3">
        Nothing after ten minutes? Check the spam tray, or read how we handle your details on{' '}
        <Link to="/about#promise" className="wipe font-medium text-ember">
          our promise page
        </Link>
        .
      </p>

      <Button to="/login" variant="ember" size="lg" full className="mt-7" rightIcon={<ArrowRight className="size-4" aria-hidden />}>
        Go to sign in
      </Button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function Signup() {
  const signup = useAuth((s) => s.signup);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const meter = strength(password);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending) return; // guards a double click while the request is in flight

    const next: Record<string, string | undefined> = {};
    const trimmedName = name.trim();
    if (trimmedName.length < 2) next.name = 'Tell us what to call you.';
    else if (trimmedName.length > 50) next.name = 'Please keep it under 50 characters.';

    const trimmedEmail = email.trim();
    if (!trimmedEmail) next.email = 'We need an address to send your verification link.';
    else if (!EMAIL_RE.test(trimmedEmail)) next.email = 'That does not look like an email address.';

    if (password.length < MIN_PASSWORD)
      next.password = `Use at least ${MIN_PASSWORD} characters — the market ledger is not fussy about the rest.`;
    if (confirm !== password) next.confirm = 'The two passwords do not match.';

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setPending(true);
    setFormError(null);

    try {
      await signup(trimmedName, trimmedEmail, password);
      setSentTo(trimmedEmail);
    } catch (err) {
      setFormError(errText(err, 'We could not open your ledger. Please try again.'));
    } finally {
      setPending(false);
    }
  }

  if (sentTo) {
    return (
      <div className="grid lg:min-h-[36rem] lg:grid-cols-[1.05fr_minmax(0,1fr)]">
        <HarvestPanel />
        <section className="flex items-center justify-center px-5 py-14 sm:px-8 lg:py-20">
          <div className="w-full max-w-[26rem]">
            <SentState email={sentTo} />
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
          <span className="eyebrow">Join us</span>
          <h1 className="mt-4 text-4xl leading-[1.03] sm:text-[2.75rem]">
            Open a ledger at the market.
          </h1>
          <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink-2">
            One account for your orders, delivery addresses and reorder history. We email a
            verification link before the first crate moves.
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

            <Input
              name="name"
              type="text"
              label="Full name"
              autoComplete="name"
              required
              icon={<User className="size-4" aria-hidden />}
              placeholder="Asadhabai Pradhan"
              value={name}
              error={errors.name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors((f) => ({ ...f, name: undefined }));
              }}
            />

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
              error={errors.email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((f) => ({ ...f, email: undefined }));
              }}
            />

            <div>
              <Input
                name="password"
                type="password"
                label="Password"
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
              label="Confirm password"
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
              {pending ? 'Opening your ledger…' : 'Create account'}
            </Button>

            <p role="status" aria-live="polite" className="sr-only">
              {pending ? 'Creating your account, please wait.' : ''}
            </p>
          </form>

          <p className="mt-8 border-t border-rule pt-5 text-sm leading-relaxed text-ink-3">
            Already have a ledger here?{' '}
            <Link to="/login" className="wipe font-medium text-ember">
              Sign in instead
            </Link>
            .
          </p>
        </div>
      </section>
    </div>
  );
}