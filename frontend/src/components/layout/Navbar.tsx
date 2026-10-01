import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Search,
  ShoppingBasket,
  Trash2,
  User as UserIcon,
  X,
} from 'lucide-react';
import { useAuth, displayName, initials, isAdmin } from '../../lib/auth';
import { useCart, cartCount, orderEstimate, FREE_DELIVERY_AT } from '../../lib/cart';
import { cn, money, plural } from '../../lib/format';
import { Button, IconButton } from '../ui/Button';
import { ProseImage, QtyStepper } from '../ui/Surface';
import { EmptyState, useToast } from '../ui/Feedback';
import { useScrollLock } from '../../lib/hooks';

/* -------------------------------------------------------------------------- */
/*  Content                                                                    */
/* -------------------------------------------------------------------------- */

const TICKER = [
  'Harvested at dawn, delivered by noon',
  'Free delivery over ₹500',
  '200+ verified local farms',
  'No pesticides on our Organic line',
  'Hand-picked, never machine-sorted',
];

const NAV = [
  { label: 'Produce', to: '/products' },
  { label: 'Our Story', to: '/about' },
  { label: 'Visit', to: '/contact' },
];

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className="group flex items-center gap-2.5" aria-label="PradhanFresh — home">
      <span className="relative grid size-9 shrink-0 place-items-center rounded-md bg-ink text-paper transition-transform duration-300 group-hover:-rotate-6">
        <ShoppingBasket className="size-[1.15rem]" aria-hidden strokeWidth={1.9} />
        <span
          aria-hidden
          className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-ember ring-2 ring-paper"
        />
      </span>
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="font-display text-[1.35rem] font-semibold tracking-[-0.02em] text-ink">
            Pradhan<span className="text-ember">Fresh</span>
          </span>
          <span className="mt-1 font-mono text-[0.625rem] uppercase tracking-[0.28em] text-ink-2">
            Est. 1974
          </span>
        </span>
      )}
    </Link>
  );
}

/* -------------------------------------------------------------------------- */
/*  Ticker                                                                     */
/* -------------------------------------------------------------------------- */

function Ticker() {
  const row = (key: string) => (
    <div key={key} className="flex shrink-0 items-center">
      {TICKER.map((t) => (
        <span key={t} className="flex items-center">
          <span className="px-6 font-mono text-[0.625rem] uppercase tracking-[0.22em] text-paper/70">
            {t}
          </span>
          {/* A CSS diamond rather than a dingbat glyph, which would fall back
              to a colour emoji on systems whose fonts lack it. */}
          <span aria-hidden className="size-1 rotate-45 bg-ember" />
        </span>
      ))}
    </div>
  );
  return (
    <div className="relative overflow-hidden bg-paper-ink py-2" aria-hidden>
      <div className="ticker-track">
        {row('a')}
        {row('b')}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Cart drawer                                                                */
/* -------------------------------------------------------------------------- */

function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const items = useCart((s) => s.items);
  const setQuantity = useCart((s) => s.setQuantity);
  const remove = useCart((s) => s.remove);
  const { notify } = useToast();
  const count = cartCount(items);
  const est = orderEstimate(items);
  const remaining = Math.max(0, FREE_DELIVERY_AT - est.subtotal);

  useScrollLock(open);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const apply = async (itemId: number, qty: number) => {
    try {
      await setQuantity(itemId, qty);
    } catch {
      notify('Could not update that item.', 'error');
    }
  };

  const drop = async (itemId: number, name: string) => {
    try {
      await remove(itemId);
      notify(`Removed ${name}`);
    } catch {
      notify('Could not remove that item.', 'error');
    }
  };

  return (
    <>
      <div
        onClick={onClose}
        aria-hidden
        className={cn(
          'fixed inset-0 z-[90] bg-ink/45 backdrop-blur-[3px] transition-opacity duration-300',
          open ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Shopping basket"
        className={cn(
          'fixed right-0 top-0 z-[95] flex h-full w-[min(26rem,100vw)] flex-col',
          'border-l border-rule bg-paper shadow-float transition-transform duration-400 ease-[cubic-bezier(0.16,1,0.3,1)]',
          open ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        <header className="flex items-center justify-between border-b border-rule px-5 py-4">
          <div>
            <p className="font-mono text-[0.625rem] uppercase tracking-[0.2em] text-ember">
              Your basket
            </p>
            <h2 className="mt-0.5 font-display text-2xl font-semibold">
              {count ? plural(count, 'item') : 'Empty'}
            </h2>
          </div>
          <IconButton label="Close basket" onClick={onClose} tone="paper">
            <X className="size-4" aria-hidden />
          </IconButton>
        </header>

        {items.length > 0 && (
          <div className="border-b border-rule bg-paper-card px-5 py-3">
            {remaining > 0 ? (
              <p className="text-xs text-ink-2">
                <span className="font-medium text-ember">{money(remaining)}</span> more for free
                delivery
              </p>
            ) : (
              <p className="text-xs font-medium text-leaf">Free delivery unlocked</p>
            )}
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-paper-deep">
              <div
                className="h-full rounded-full bg-ember transition-[width] duration-500"
                style={{ width: `${Math.min(100, (est.subtotal / FREE_DELIVERY_AT) * 100)}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <EmptyState
              icon={<ShoppingBasket className="size-6" aria-hidden />}
              title="Nothing in the basket"
              body="Pick something from this morning's harvest."
              action={
                <Button to="/products" variant="ink" onClick={onClose}>
                  Browse produce
                </Button>
              }
              className="mt-6 border-0 bg-transparent px-0"
            />
          ) : (
            <ul className="flex flex-col divide-y divide-rule">
              {items.map((item) => (
                <li key={item.id} className="flex gap-3 py-4 first:pt-0">
                  <ProseImage
                    src={item.product.thumbnail}
                    alt={item.product.name}
                    className="size-16 shrink-0 rounded-md border border-rule"
                  />
                  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <p className="truncate text-sm font-medium text-ink">{item.product.name}</p>
                    <p className="tnum font-mono text-xs text-ink-3">
                      {money(item.price)} / {item.product.unit}
                    </p>
                    <div className="mt-auto flex items-center justify-between gap-2">
                      <QtyStepper
                        size="sm"
                        value={item.quantity}
                        onChange={(q) => apply(item.id, q)}
                      />
                      <span className="tnum font-mono text-sm font-medium text-ink">
                        {money(item.subtotal)}
                      </span>
                    </div>
                  </div>
                  <IconButton
                    label={`Remove ${item.product.name}`}
                    size="sm"
                    tone="paper"
                    onClick={() => drop(item.id, item.product.name)}
                    className="shrink-0 self-start"
                  >
                    <Trash2 className="size-3.5" aria-hidden />
                  </IconButton>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <footer className="border-t border-rule bg-paper-card px-5 py-4">
            <dl className="space-y-1.5 font-mono text-sm">
              <div className="flex justify-between text-ink-2">
                <dt>Subtotal</dt>
                <dd className="tnum">{money(est.subtotal)}</dd>
              </div>
              <div className="flex justify-between text-ink-2">
                <dt>Delivery</dt>
                <dd className="tnum">{est.deliveryFee ? money(est.deliveryFee) : 'Free'}</dd>
              </div>
              <div className="flex justify-between text-ink-2">
                <dt>GST (18%)</dt>
                <dd className="tnum">{money(est.tax)}</dd>
              </div>
              <div className="flex justify-between border-t border-rule pt-2 text-base font-semibold text-ink">
                <dt>Total</dt>
                <dd className="tnum">{money(est.total)}</dd>
              </div>
            </dl>
            <div className="mt-4 grid gap-2">
              <Button to="/checkout" onClick={onClose} full size="md">
                Checkout · {money(est.total)}
              </Button>
              <Button to="/cart" onClick={onClose} variant="ghost" full size="sm">
                View full basket
              </Button>
            </div>
          </footer>
        )}
      </aside>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*  Navbar                                                                     */
/* -------------------------------------------------------------------------- */

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [term, setTerm] = useState('');
  const { user, logout } = useAuth();
  const items = useCart((s) => s.items);
  const count = cartCount(items);
  const navigate = useNavigate();
  const location = useLocation();
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Any navigation closes every transient surface.
  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
    setCartOpen(false);
  }, [location.pathname]);

  useScrollLock(menuOpen);
  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setMenuOpen(false);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = term.trim();
    navigate(q ? `/products?search=${encodeURIComponent(q)}` : '/products');
    setSearchOpen(false);
    setTerm('');
  };

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-md focus:bg-ink focus:px-4 focus:py-2.5 focus:text-sm focus:text-paper"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-[80]">
        <Ticker />

        <div
          className={cn(
            'border-b transition-[background-color,border-color,box-shadow] duration-300',
            scrolled
              ? 'border-rule bg-paper/92 shadow-sheet backdrop-blur-md'
              : 'border-transparent bg-paper',
          )}
        >
          <div className="shell flex h-16 items-center gap-4 sm:h-[4.5rem]">
            <Logo />

            <nav aria-label="Primary" className="ml-6 hidden lg:block">
              <ul className="flex items-center gap-1">
                {NAV.map((n) => (
                  <li key={n.to}>
                    <NavLink
                      to={n.to}
                      className={({ isActive }) =>
                        cn(
                          'relative block px-3.5 py-2 text-sm font-medium transition-colors',
                          isActive ? 'text-ink' : 'text-ink-2 hover:text-ink',
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {n.label}
                          {isActive && (
                            <span
                              aria-hidden
                              className="absolute inset-x-3.5 -bottom-px h-0.5 rounded-full bg-ember"
                            />
                          )}
                        </>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
              <IconButton label="Search produce (Ctrl+K)" onClick={() => setSearchOpen(true)}>
                <Search className="size-4" aria-hidden />
              </IconButton>

              <button
                type="button"
                onClick={() => setCartOpen(true)}
                aria-label={`Open basket, ${plural(count, 'item')}`}
                className="relative grid size-10 place-items-center rounded-md border border-rule bg-paper-card text-ink-2 transition-colors hover:border-ink hover:text-ink"
              >
                <ShoppingBasket className="size-4" aria-hidden />
                {count > 0 && (
                  <span
                    aria-hidden
                    className="tnum absolute -right-1.5 -top-1.5 grid min-w-[1.25rem] place-items-center rounded-full bg-ember px-1 font-mono text-[0.625rem] font-semibold text-paper-card ring-2 ring-paper"
                  >
                    {count > 99 ? '99+' : count}
                  </span>
                )}
              </button>

              {user ? (
                <div className="hidden items-center gap-1.5 md:flex">
                  {isAdmin(user) && (
                    <IconButton label="Admin dashboard" onClick={() => navigate('/admin')}>
                      <LayoutDashboard className="size-4" aria-hidden />
                    </IconButton>
                  )}
                  <Link
                    to="/profile"
                    className="flex items-center gap-2 rounded-md border border-rule bg-paper-card py-1 pl-1 pr-3 transition-colors hover:border-ink"
                  >
                    <span className="grid size-7 place-items-center rounded-[4px] bg-leaf-soft font-mono text-[0.6875rem] font-semibold text-leaf-deep">
                      {initials(user)}
                    </span>
                    <span className="max-w-[7rem] truncate text-sm font-medium text-ink">
                      {displayName(user)}
                    </span>
                  </Link>
                  <IconButton label="Sign out" onClick={() => void logout()}>
                    <LogOut className="size-4" aria-hidden />
                  </IconButton>
                </div>
              ) : (
                <div className="hidden items-center gap-2 md:flex">
                  <Button to="/login" variant="ghost" size="sm">
                    Sign in
                  </Button>
                  <Button to="/signup" variant="ink" size="sm">
                    Join us
                  </Button>
                </div>
              )}

              <IconButton
                label={menuOpen ? 'Close menu' : 'Open menu'}
                className="lg:hidden"
                onClick={() => setMenuOpen((v) => !v)}
                aria-expanded={menuOpen}
              >
                {menuOpen ? <X className="size-4" aria-hidden /> : <Menu className="size-4" aria-hidden />}
              </IconButton>
            </div>
          </div>
        </div>

        {/* Mobile panel */}
        <div
          className={cn(
            'overflow-hidden border-b border-rule bg-paper transition-[max-height,opacity] duration-400 lg:hidden',
            menuOpen ? 'max-h-[80vh] opacity-100' : 'max-h-0 opacity-0',
          )}
        >
          <nav aria-label="Mobile" className="shell py-4">
            <ul className="flex flex-col">
              {NAV.map((n, i) => (
                <li key={n.to} className="stagger" style={{ '--i': i } as never}>
                  <NavLink
                    to={n.to}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center justify-between border-b border-rule-soft py-3.5 font-display text-xl font-medium transition-colors',
                        isActive ? 'text-ember' : 'text-ink',
                      )
                    }
                  >
                    {n.label}
                    <span aria-hidden className="font-mono text-xs text-ink-4">
                      0{i + 1}
                    </span>
                  </NavLink>
                </li>
              ))}
            </ul>

            <div className="mt-5 flex flex-col gap-2">
              {user ? (
                <>
                  <Button to="/profile" variant="outline" full leftIcon={<UserIcon className="size-4" aria-hidden />}>
                    {displayName(user)}
                  </Button>
                  {isAdmin(user) && (
                    <Button to="/admin" variant="outline" full leftIcon={<LayoutDashboard className="size-4" aria-hidden />}>
                      Admin dashboard
                    </Button>
                  )}
                  <Button to="/orders" variant="outline" full leftIcon={<Package className="size-4" aria-hidden />}>
                    My orders
                  </Button>
                  <Button
                    variant="ghost"
                    full
                    leftIcon={<LogOut className="size-4" aria-hidden />}
                    onClick={() => void logout()}
                  >
                    Sign out
                  </Button>
                </>
              ) : (
                <>
                  <Button to="/login" variant="outline" full>
                    Sign in
                  </Button>
                  <Button to="/signup" variant="ink" full>
                    Join PradhanFresh
                  </Button>
                </>
              )}
            </div>
          </nav>
        </div>
      </header>

      {/* Search overlay */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-[100] bg-ink/50 backdrop-blur-sm"
          onClick={() => setSearchOpen(false)}
        >
          <div className="shell pt-[12vh]" onClick={(e) => e.stopPropagation()}>
            <form
              onSubmit={submitSearch}
              role="search"
              className="mx-auto flex max-w-2xl items-center gap-2 rounded-lg border border-rule bg-paper-card p-2 shadow-float animate-[slide-in_0.3s_var(--ease-out-soft)_both]"
            >
              <Search className="ml-3 size-5 shrink-0 text-ink-3" aria-hidden />
              <input
                ref={searchRef}
                type="search"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="Search mangoes, spinach, tomatoes…"
                aria-label="Search produce"
                className="h-11 min-w-0 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-ink-4"
              />
              <Button type="submit" variant="ink" size="md">
                Search
              </Button>
            </form>
            <p className="mx-auto mt-3 max-w-2xl px-1 text-center font-mono text-[0.625rem] uppercase tracking-[0.18em] text-paper/60">
              Press esc to close · ⌘K to reopen
            </p>
          </div>
        </div>
      )}

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}

export default Navbar;
