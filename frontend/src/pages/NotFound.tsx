import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, Compass, Search, ShoppingBasket, Sprout } from 'lucide-react';
import { Button } from '../components/ui/Button';

/** A few likely destinations, offered as a short list instead of a dead end. */
const SUGGESTIONS = [
  { label: 'All produce', to: '/products', hint: 'Today’s crates from Market Yard', Icon: ShoppingBasket },
  { label: 'Our story', to: '/about', hint: 'Fifty years, one rule', Icon: Sprout },
  { label: 'Visit or write', to: '/contact', hint: 'Address, hours and a form', Icon: Compass },
] as const;

export default function NotFound() {
  const { pathname, search } = useLocation();
  const requested = `${pathname}${search}`;

  return (
    <section className="shell py-16 md:py-24">
      <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-16">
        {/* ------------------------------ The editorial half ---------- */}
        <div>
          <span className="eyebrow">Error 404</span>

          <p
            aria-hidden
            className="tnum mt-4 font-display text-[7rem] font-semibold leading-[0.78] tracking-[-0.04em] text-ink-4 sm:text-[9rem] lg:text-[11rem]"
          >
            404
          </p>

          <h1 className="mt-6 max-w-xl text-4xl leading-[1.04] sm:text-5xl">
            This crate never made it past the{' '}
            <span className="italic text-ember">grading table</span>
          </h1>

          <p className="mt-5 max-w-lg text-lg leading-relaxed text-ink-2">
            The page you asked for is not on our shelves. It may have been moved, renamed, or it
            may never have existed — all three look the same from here.
          </p>

          {/* The requested path, echoed verbatim in mono */}
          <div className="mt-8 max-w-lg">
            <p className="font-mono text-[0.625rem] uppercase tracking-[0.2em] text-ink-3">
              Requested path
            </p>
            <p className="mt-2 flex items-start gap-2.5 rounded-md border border-rule bg-paper-card px-4 py-3">
              <Search className="mt-0.5 size-4 shrink-0 text-ink-4" aria-hidden />
              <span className="min-w-0 break-all font-mono text-sm text-ink">{requested}</span>
            </p>
          </div>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Button
              to="/products"
              variant="ink"
              size="lg"
              leftIcon={<ShoppingBasket className="size-4" aria-hidden />}
            >
              Browse today&rsquo;s harvest
            </Button>
            <Button
              to="/"
              variant="outline"
              size="lg"
              leftIcon={<ArrowLeft className="size-4" aria-hidden />}
            >
              Back to the market
            </Button>
          </div>
        </div>

        {/* ------------------------------ The way out ------------------ */}
        <div className="rounded-lg border border-rule bg-paper-card p-6 md:p-8">
          <h2 className="font-mono text-[0.625rem] font-medium uppercase tracking-[0.2em] text-ink-3">
            You might have wanted
          </h2>

          <ul className="mt-5 divide-y divide-rule">
            {SUGGESTIONS.map(({ label, to, hint, Icon }) => (
              <li key={to}>
                <Link
                  to={to}
                  className="group flex items-center gap-4 py-4 transition-colors hover:text-ember"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-md border border-rule bg-paper text-ink-2 transition-colors group-hover:border-ember group-hover:bg-ember-soft group-hover:text-ember-deep">
                    <Icon className="size-4" aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-display text-lg font-semibold text-ink transition-colors group-hover:text-ember">
                      {label}
                    </span>
                    <span className="block text-sm text-ink-3">{hint}</span>
                  </span>
                  <span
                    aria-hidden
                    className="ml-auto shrink-0 font-mono text-xs text-ink-4 transition-transform duration-300 group-hover:translate-x-1"
                  >
                    &rarr;
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          <p className="mt-6 border-t border-rule pt-5 text-sm leading-relaxed text-ink-3">
            If you followed a link from an email we sent, tell us at{' '}
            <a href="mailto:hello@pradhanfresh.com" className="wipe font-medium text-ember">
              hello@pradhanfresh.com
            </a>{' '}
            and we will fix it.
          </p>
        </div>
      </div>
    </section>
  );
}
