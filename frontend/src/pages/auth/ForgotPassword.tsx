import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Check, Mail, MailCheck, ShieldCheck, Sprout, Truck } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Field';
import { ProseImage } from '../../components/ui/Surface';
import { api } from '../../lib/api';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const TRUST = [
  { Icon: Truck, title: 'Free delivery over ₹500', note: 'Same-morning slots across Pune.' },
  { Icon: Sprout, title: '200+ local farms', note: 'Picked at dawn, never machine-sorted.' },
  { Icon: ShieldCheck, title: 'Nothing is sold on', note: 'Your address stays in our ledger.' },
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
          A new key for the same ledger.
        </p>
        <p className="mt-5 max-w-sm text-[0.9375rem] leading-relaxed text-paper/70">
          Lose a password and nothing is lost. The crates are still on the shelves, still weighed at
          dawn, still waiting for you.
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
          Reset links last one hour
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

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending) return; // guards a double click while the request is in flight

    const trimmed = email.trim();
    if (!trimmed) {
      setError('Enter the email address on your account.');
      return;
    }
    if (!EMAIL_RE.test(trimmed)) {
      setError('That does not look like an email address.');
      return;
    }

    setError(null);
    setPending(true);

    try {
      await api.post('/auth/forgot-password', { email: trimmed });
    } catch {
      // The endpoint answers 200 even for addresses we do not hold. Anything
      // that escapes it here is a transport failure — still say the same
      // thing, because saying anything else would leak which accounts exist.
    } finally {
      setPending(false);
      setSent(true);
    }
  }

  function tryAnother() {
    setSent(false);
    setEmail('');
    setError(null);
  }

  return (
    <div className="grid lg:min-h-[36rem] lg:grid-cols-[1.05fr_minmax(0,1fr)]">
      <HarvestPanel />

      <section className="flex items-center justify-center px-5 py-14 sm:px-8 lg:py-20">
        <div className="w-full max-w-[26rem]">
          {sent ? (
            <div className="stagger" role="status" aria-live="polite">
              <span className="eyebrow">Link on its way</span>
              <h1 className="mt-4 text-4xl leading-[1.03] sm:text-[2.75rem]">
                Check your email.
              </h1>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink-2">
                If an account is filed under{' '}
                <span className="font-medium text-ink">{email.trim()}</span>, a reset link is on its
                way. It opens this site with a one-time code.
              </p>

              <div className="mt-8 rounded-lg border border-leaf-line bg-leaf-soft p-5">
                <p className="flex items-center gap-2 font-mono text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-leaf-deep">
                  <Check className="size-4 shrink-0" aria-hidden />
                  Same answer either way
                </p>
                <p className="mt-2.5 text-sm leading-relaxed text-ink-2">
                  We never confirm whether an address is registered — that would tell a stranger who
                  shops here. If no mail arrives within a few minutes, check the spam tray or write
                  to us at{' '}
                  <Link to="/contact" className="wipe font-medium text-ember">
                    the market counter
                  </Link>
                  .
                </p>
              </div>

              <div className="mt-7 grid gap-2">
                <Button to="/login" variant="ember" size="lg" full>
                  Back to sign in
                </Button>
                <Button type="button" variant="ghost" full onClick={tryAnother}>
                  Try another address
                </Button>
              </div>
            </div>
          ) : (
            <>
              <span className="eyebrow">Forgotten password</span>
              <h1 className="mt-4 text-4xl leading-[1.03] sm:text-[2.75rem]">
                We will post you a key.
              </h1>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink-2">
                Give us the email on your ledger and we will send a link to set a new password. Your
                orders, addresses and history are untouched.
              </p>

              <form className="mt-8 space-y-4" noValidate onSubmit={onSubmit}>
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
                  error={error}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError(null);
                  }}
                />

                <Button
                  type="submit"
                  variant="ember"
                  size="lg"
                  full
                  loading={pending}
                  disabled={pending}
                  leftIcon={<MailCheck className="size-4" aria-hidden />}
                >
                  {pending ? 'Posting the link…' : 'Send reset link'}
                </Button>

                <p role="status" aria-live="polite" className="sr-only">
                  {pending ? 'Sending your reset link, please wait.' : ''}
                </p>
              </form>

              <p className="mt-8 border-t border-rule pt-5 text-sm leading-relaxed text-ink-3">
                Remembered it after all?{' '}
                <Link to="/login" className="wipe inline-flex items-center gap-1.5 font-medium text-ember">
                  <ArrowLeft className="size-3.5" aria-hidden />
                  Back to sign in
                </Link>
                .
              </p>
            </>
          )}
        </div>
      </section>
    </div>
  );
}