import { Link } from 'react-router-dom';
import { useState } from 'react';
import { ArrowUpRight, Check, Instagram, MapPin, Phone, Send, Twitter, Youtube } from 'lucide-react';
import { Logo } from './Navbar';

const COLUMNS = [
  {
    title: 'Market',
    links: [
      { label: 'All produce', to: '/products' },
      { label: 'Organic line', to: '/products?isOrganic=true' },
      { label: 'This week’s harvest', to: '/products?sortBy=newest' },
      { label: 'Gift boxes', to: '/products?isFeatured=true' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'Our story', to: '/about' },
      { label: 'Visit the market', to: '/contact' },
      { label: 'Farming partners', to: '/about#partners' },
      { label: 'Sustainability', to: '/about#promise' },
    ],
  },
  {
    title: 'Account',
    links: [
      { label: 'Your basket', to: '/cart' },
      { label: 'Track an order', to: '/orders' },
      { label: 'Your profile', to: '/profile' },
      { label: 'Sign in', to: '/login' },
    ],
  },
];

const SOCIALS = [
  { label: 'Instagram', Icon: Instagram, href: 'https://instagram.com' },
  { label: 'X', Icon: Twitter, href: 'https://x.com' },
  { label: 'YouTube', Icon: Youtube, href: 'https://youtube.com' },
];

export function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!email.trim()) return;
        setDone(true);
        setEmail('');
      }}
      className="w-full"
    >
      <label htmlFor="newsletter-email" className="sr-only">
        Email address
      </label>
      <div className="flex items-center gap-2 border-b border-paper/30 pb-2 focus-within:border-citrus">
        <input
          id="newsletter-email"
          type="email"
          required
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setDone(false);
          }}
          placeholder="your@email.com"
          className="h-10 min-w-0 flex-1 bg-transparent text-sm text-paper outline-none placeholder:text-paper/40"
        />
        <button
          type="submit"
          aria-label="Subscribe to the harvest letter"
          className="grid size-9 shrink-0 place-items-center rounded-md bg-citrus text-ink transition-transform duration-200 hover:scale-105"
        >
          {done ? <Check className="size-4" aria-hidden /> : <Send className="size-4" aria-hidden />}
        </button>
      </div>
      <p className="mt-2.5 text-xs text-paper/50" role="status" aria-live="polite">
        {done ? "You're on the list — first look at every harvest." : 'One letter a week. Nothing else.'}
      </p>
    </form>
  );
}

export function Footer() {
  return (
    <footer className="mt-auto bg-paper-ink text-paper">
      {/* Ledger strip */}
      <div className="border-b border-paper/12">
        <dl className="shell grid grid-cols-2 divide-paper/12 md:grid-cols-4 md:divide-x">
          {[
            { k: 'Harvested daily', v: '5:30 am' },
            { k: 'Home delivery', v: 'By noon' },
            { k: 'Partner farms', v: '200+' },
            { k: 'Since', v: '1974' },
          ].map((s, i) => (
            <div key={s.k} className="stagger px-1 py-6 md:px-6" style={{ '--i': i } as never}>
              <dt className="font-mono text-[0.625rem] uppercase tracking-[0.18em] text-paper/45">
                {s.k}
              </dt>
              <dd className="tnum mt-1 font-display text-2xl font-semibold text-citrus">{s.v}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="shell grid gap-10 py-14 md:grid-cols-12 md:gap-8">
        <div className="md:col-span-4">
          <div className="inline-flex rounded-md bg-paper px-3 py-2">
            <Logo />
          </div>
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-paper/60">
            A family market built on fifty years of knowing which farm grows what best — and
            getting it to your door while it still tastes of the field.
          </p>

          <ul className="mt-6 space-y-2.5 text-sm">
            <li className="flex items-start gap-2.5 text-paper/70">
              <MapPin className="mt-0.5 size-4 shrink-0 text-ember" aria-hidden />
              <span>14 Market Yard, Pune 411001</span>
            </li>
            <li>
              <a
                href="tel:+919876543210"
                className="flex items-start gap-2.5 py-1 text-paper/70 transition-colors hover:text-citrus"
              >
                <Phone className="mt-0.5 size-4 shrink-0 text-ember" aria-hidden />
                +91 98765 43210
              </a>
            </li>
          </ul>

          <div className="mt-6 flex gap-2">
            {SOCIALS.map(({ label, Icon, href }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer noopener"
                aria-label={label}
                className="grid size-9 place-items-center rounded-md border border-paper/20 text-paper/70 transition-colors hover:border-citrus hover:text-citrus"
              >
                <Icon className="size-4" aria-hidden />
              </a>
            ))}
          </div>
        </div>

        {COLUMNS.map((col) => (
          <nav key={col.title} aria-label={col.title} className="md:col-span-2">
            <h2 className="font-mono text-[0.625rem] uppercase tracking-[0.2em] text-paper/45">
              {col.title}
            </h2>
            <ul className="mt-4 space-y-1">
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link
                    to={l.to}
                    className="group inline-flex min-h-6 items-center gap-1 py-0.5 text-sm text-paper/70 transition-colors hover:text-citrus"
                  >
                    <span className="wipe">{l.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        <div className="md:col-span-2">
          <h2 className="font-mono text-[0.625rem] uppercase tracking-[0.2em] text-paper/45">
            The harvest letter
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-paper/60">
            What came in this morning, who grew it, and what is running low.
          </p>
          <div className="mt-4">
            <NewsletterForm />
          </div>
        </div>
      </div>

      <div className="border-t border-paper/12">
        <div className="shell flex flex-col items-center justify-between gap-3 py-6 text-xs text-paper/45 sm:flex-row">
          <p>
            © {new Date().getFullYear()} PradhanFresh Family Market. All rights reserved.
          </p>
          <div className="flex items-center gap-5">
            <Link to="/about#promise" className="py-1 transition-colors hover:text-citrus">
              Privacy
            </Link>
            <Link to="/contact" className="py-1 transition-colors hover:text-citrus">
              Terms
            </Link>
            <a
              href="#main"
              className="inline-flex items-center gap-1 py-1 transition-colors hover:text-citrus"
            >
              Back to top
              <ArrowUpRight className="size-3" aria-hidden />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
