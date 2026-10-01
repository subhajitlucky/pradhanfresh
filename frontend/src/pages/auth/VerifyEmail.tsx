import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Ban, Check, ShieldCheck, Sprout, Truck } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { LoadingBlock } from '../../components/ui/Feedback';
import { ProseImage } from '../../components/ui/Surface';
import { ApiError, api } from '../../lib/api';
import { errText } from '../../lib/catalog';

const TRUST = [
  { Icon: Truck, title: 'Free delivery over ₹500', note: 'Same-morning slots across Pune.' },
  { Icon: Sprout, title: '200+ local farms', note: 'Picked at dawn, never machine-sorted.' },
  { Icon: ShieldCheck, title: 'One tap closes the ledger', note: 'Then you can sign in for good.' },
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
          We only trade with addresses we can reach.
        </p>
        <p className="mt-5 max-w-sm text-[0.9375rem] leading-relaxed text-paper/70">
          Verifying an inbox is how a fifty-year-old market keeps its books honest. It takes one tap
          and it happens once.
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
          One click · No password needed
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

type State = 'pending' | 'success' | 'failure';

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const token = params.get('token')?.trim() ?? '';

  const [state, setState] = useState<State>('pending');
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setState('failure');
      setMessage('This link is missing its one-time code, so we cannot verify the address.');
      return;
    }

    const controller = new AbortController();
    setState('pending');

    api
      .get<{ success?: boolean; message?: string }>('/auth/verify-email', {
        params: { token },
        signal: controller.signal,
      })
      .then((res) => {
        setState('success');
        setMessage(res.data?.message ?? 'Your email address is verified. You can sign in now.');
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return; // the page moved on — say nothing
        setState('failure');
        setMessage(
          err instanceof ApiError
            ? err.message
            : errText(err, 'That link could not be verified.'),
        );
      });

    return () => controller.abort();
  }, [token]);

  return (
    <div className="grid lg:min-h-[36rem] lg:grid-cols-[1.05fr_minmax(0,1fr)]">
      <HarvestPanel />

      <section className="flex items-center justify-center px-5 py-14 sm:px-8 lg:py-20">
        <div className="w-full max-w-[26rem]">
          {state === 'pending' && (
            <div className="stagger" role="status" aria-live="polite">
              <span className="eyebrow">Verifying</span>
              <h1 className="mt-4 text-4xl leading-[1.03] sm:text-[2.75rem]">
                Stamping your ledger…
              </h1>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink-2">
                Hold this page for a moment while we mark your address as verified.
              </p>
              <div className="mt-8">
                <LoadingBlock label="Verifying your email" />
              </div>
            </div>
          )}

          {state === 'success' && (
            <div className="stagger" role="status" aria-live="polite">
              <span className="eyebrow">Verified</span>
              <h1 className="mt-4 text-4xl leading-[1.03] sm:text-[2.75rem]">
                Your inbox is on the ledger.
              </h1>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink-2">{message}</p>

              <div className="mt-8 rounded-lg border border-leaf-line bg-leaf-soft p-5">
                <p className="flex items-center gap-2 font-mono text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-leaf-deep">
                  <Check className="size-4 shrink-0" aria-hidden />
                  Account unlocked
                </p>
                <p className="mt-2.5 text-sm leading-relaxed text-ink-2">
                  This code is spent. Your ledger opens on the sign-in page and stays open until you
                  close it.
                </p>
              </div>

              <Button to="/login" variant="ember" size="lg" full className="mt-7">
                Sign in now
              </Button>
            </div>
          )}

          {state === 'failure' && (
            <div className="stagger">
              <span className="eyebrow">Not verified</span>
              <h1 className="mt-4 text-4xl leading-[1.03] sm:text-[2.75rem]">
                That stamp did not take.
              </h1>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink-2">
                {message ?? 'That link could not be verified.'}
              </p>

              <div className="mt-8 rounded-lg border border-citrus-line bg-citrus-soft p-5">
                <p className="flex items-center gap-2 font-mono text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-warn">
                  <Ban className="size-4 shrink-0" aria-hidden />
                  Usually one of three things
                </p>
                <ul className="mt-2.5 space-y-1.5 text-sm leading-relaxed text-ink-2">
                  <li>· The code has already been used — verification is a one-tap, one-time act.</li>
                  <li>· The link is older than an hour and has expired.</li>
                  <li>· The mail was clipped by your inbox before the full address arrived.</li>
                </ul>
              </div>

              <div className="mt-7 grid gap-2">
                <Button to="/signup" variant="ember" size="lg" full>
                  Register again
                </Button>
                <Button to="/forgot-password" variant="ghost" full>
                  I need help signing in
                </Button>
              </div>

              <p className="mt-8 border-t border-rule pt-5 text-sm leading-relaxed text-ink-3">
                Our mail desk can post a fresh verification link by hand — write to us at{' '}
                <Link to="/contact" className="wipe font-medium text-ember">
                  the market counter
                </Link>
                .
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}