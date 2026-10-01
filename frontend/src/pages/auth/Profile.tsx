import { useRef, useState } from 'react';
import type { ChangeEvent, FormEvent, KeyboardEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BadgeCheck,
  CircleAlert,
  LogOut,
  Mail,
  MapPin,
  Package,
  Phone,
  Plus,
  ShieldCheck,
  SquarePen,
  Trash2,
  User as UserIcon,
} from 'lucide-react';
import { Button, IconButton } from '../../components/ui/Button';
import { Input } from '../../components/ui/Field';
import { Badge, EmptyState, ErrorState, LoadingBlock, useToast } from '../../components/ui/Feedback';
import { Card, SectionHeading } from '../../components/ui/Surface';
import { api } from '../../lib/api';
import { useAuth, initials } from '../../lib/auth';
import {
  errText,
  useAddAddress,
  useAddresses,
  useChangePassword,
  useDeleteAddress,
  useOrders,
} from '../../lib/catalog';
import { cn, formatDate, money, orderTone, plural } from '../../lib/format';
import type { Address, OrderStatus, User } from '../../lib/types';

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const MIN_PASSWORD = 6;
const PHONE_RE = /^(?:\+?91[-\s]?|0)?[6-9]\d{9}$/;
const PINCODE_RE = /^\d{6}$/;

const TABS = [
  { id: 'details', label: 'Details' },
  { id: 'password', label: 'Password' },
  { id: 'addresses', label: 'Addresses' },
] as const;

type TabId = (typeof TABS)[number]['id'];

/** One dot-coloured badge, driven by the shared order tone map. */
function StatusBadge({ status, label }: { status: OrderStatus; label?: string }) {
  const t = orderTone(status);
  const tone = status === 'DELIVERED' ? 'leaf' : status === 'SHIPPED' ? 'paper' : status === 'PENDING' || status === 'CONFIRMED' ? 'citrus' : 'ember';
  return (
    <Badge tone={tone}>
      <span aria-hidden className={cn('size-1.5 rounded-full', t.dot)} />
      {label ?? status}
    </Badge>
  );
}

interface AddressDraft {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
  landmark: string;
}

const EMPTY_DRAFT: AddressDraft = {
  fullName: '',
  phone: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  pincode: '',
  landmark: '',
};

/** The address POST has no server-side validation and 500s on gaps. */
function validateDraft(d: AddressDraft): Record<string, string | undefined> {
  const e: Record<string, string | undefined> = {};
  if (d.fullName.trim().length < 2) e.fullName = 'Who should the runner ask for?';
  if (!PHONE_RE.test(d.phone.trim())) e.phone = 'Enter a 10-digit Indian mobile number.';
  if (d.addressLine1.trim().length < 5) e.addressLine1 = 'Flat, house number and street.';
  if (d.city.trim().length < 2) e.city = 'Which city?';
  if (d.state.trim().length < 2) e.state = 'Which state?';
  if (!PINCODE_RE.test(d.pincode.trim())) e.pincode = 'Six digits, please.';
  return e;
}

/* -------------------------------------------------------------------------- */
/*  Tab list                                                                   */
/* -------------------------------------------------------------------------- */

function TabBar({
  value,
  onChange,
}: {
  value: TabId;
  onChange: (next: TabId) => void;
}) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  function step(e: KeyboardEvent<HTMLButtonElement>, index: number) {
    const last = TABS.length - 1;
    let next = -1;
    if (e.key === 'ArrowRight') next = index === last ? 0 : index + 1;
    else if (e.key === 'ArrowLeft') next = index === 0 ? last : index - 1;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = last;
    if (next < 0) return;
    e.preventDefault();
    onChange(TABS[next].id);
    refs.current[next]?.focus();
  }

  return (
    <div
      role="tablist"
      aria-label="Account settings"
      className="no-bar -mx-1 flex gap-1 overflow-x-auto border-b border-rule px-1"
    >
      {TABS.map((t, i) => {
        const selected = t.id === value;
        return (
          <button
            key={t.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={selected}
            aria-controls={`panel-${t.id}`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(t.id)}
            onKeyDown={(e) => step(e, i)}
            className={cn(
              'relative shrink-0 px-4 py-3 text-sm font-medium transition-colors',
              selected ? 'text-ember' : 'text-ink-3 hover:text-ink',
            )}
          >
            {t.label}
            {selected && (
              <span
                aria-hidden
                className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-ember"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Panel — details                                                            */
/* -------------------------------------------------------------------------- */

function DetailsPanel({ user }: { user: User }) {
  const setUser = useAuth((s) => s.setUser);
  const refreshProfile = useAuth((s) => s.refreshProfile);
  const { notify } = useToast();

  const [name, setName] = useState(user.name);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending) return; // guards a double click while the request is in flight

    const trimmed = name.trim();
    if (trimmed.length < 2 || trimmed.length > 50) {
      setNotice(null);
      setError('Your name must be between 2 and 50 characters.');
      return;
    }

    setPending(true);
    setError(null);
    setNotice(null);

    try {
      const res = await api.patch<{ success: boolean; message: string; data: User }>(
        '/auth/profile',
        { name: trimmed },
      );
      // One session, one store — never touch storage from a page.
      setUser(res.data.data);
      void refreshProfile();
      setName(trimmed);
      setNotice(res.data.message || 'Profile updated.');
      notify('Your details are up to date.');
    } catch (err) {
      setError(errText(err, 'We could not save that. Please try again.'));
    } finally {
      setPending(false);
    }
  }

  const dirty = name.trim() !== user.name;

  return (
    <form className="space-y-4" noValidate onSubmit={onSubmit}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-[0.625rem] uppercase tracking-[0.18em] text-ink-3">
          Signed in as
        </span>
        <span className="font-mono text-sm text-ink">{user.email}</span>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-md border border-bad/30 bg-ember-soft px-4 py-3 text-sm leading-relaxed text-bad"
        >
          {error}
        </p>
      )}
      {notice && !error && (
        <p
          role="status"
          aria-live="polite"
          className="rounded-md border border-leaf-line bg-leaf-soft px-4 py-3 text-sm leading-relaxed text-leaf-deep"
        >
          {notice}
        </p>
      )}

      <Input
        name="display-name"
        type="text"
        label="Full name"
        autoComplete="name"
        required
        icon={<UserIcon className="size-4" aria-hidden />}
        hint="2–50 characters. This is the name printed on your order slips."
        value={name}
        onChange={(e) => {
          setName(e.target.value);
          if (error) setError(null);
          if (notice) setNotice(null);
        }}
      />

      <Input
        name="email-readonly"
        type="email"
        label="Email address"
        icon={<Mail className="size-4" aria-hidden />}
        value={user.email}
        readOnly
        hint="Your sign-in address is fixed once the ledger is opened."
      />

      <div className="flex flex-wrap items-center gap-3 pt-1">
        <Button type="submit" variant="ember" loading={pending} disabled={pending || !dirty}>
          {pending ? 'Saving…' : 'Save changes'}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            setName(user.name);
            setError(null);
            setNotice(null);
          }}
          disabled={pending || !dirty}
        >
          Discard
        </Button>
        <span role="status" aria-live="polite" className="sr-only">
          {pending ? 'Saving your details.' : ''}
        </span>
      </div>
    </form>
  );
}

/* -------------------------------------------------------------------------- */
/*  Panel — password                                                           */
/* -------------------------------------------------------------------------- */

function PasswordPanel() {
  const change = useChangePassword();
  const { notify } = useToast();

  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (change.isPending) return; // guards a double click while in flight

    const found: Record<string, string | undefined> = {};
    if (!current) found.current = 'Enter the password you use today.';
    if (next.length < MIN_PASSWORD) found.next = `Use at least ${MIN_PASSWORD} characters.`;
    else if (next === current) found.next = 'Pick something different from your current password.';
    if (confirm !== next) found.confirm = 'The two passwords do not match.';
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    try {
      await change.mutateAsync({ currentPassword: current, newPassword: next });
      setCurrent('');
      setNext('');
      setConfirm('');
      notify('Password changed. Use it the next time you sign in.');
    } catch {
      // mutation.error carries the normalised message — rendered below.
    }
  }

  return (
    <form className="space-y-4" noValidate onSubmit={onSubmit}>
      <p className="flex items-start gap-2.5 rounded-md border border-rule bg-paper-deep px-4 py-3 text-sm leading-relaxed text-ink-2">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-ink-3" aria-hidden />
        Changing your password signs you out nowhere — you stay signed in on this device, and the
        next sign-in needs the new one.
      </p>

      {change.isError && (
        <p
          role="alert"
          className="rounded-md border border-bad/30 bg-ember-soft px-4 py-3 text-sm leading-relaxed text-bad"
        >
          {errText(change.error, 'We could not change that password.')}
        </p>
      )}
      {change.isSuccess && !change.isPending && (
        <p
          role="status"
          aria-live="polite"
          className="rounded-md border border-leaf-line bg-leaf-soft px-4 py-3 text-sm leading-relaxed text-leaf-deep"
        >
          Password changed.
        </p>
      )}

      <Input
        name="current-password"
        type="password"
        label="Current password"
        autoComplete="current-password"
        required
        value={current}
        error={errors.current}
        onChange={(e) => {
          setCurrent(e.target.value);
          if (errors.current) setErrors((f) => ({ ...f, current: undefined }));
        }}
      />

      <Input
        name="new-password"
        type="password"
        label="New password"
        autoComplete="new-password"
        required
        hint={`At least ${MIN_PASSWORD} characters.`}
        value={next}
        error={errors.next}
        onChange={(e) => {
          setNext(e.target.value);
          if (errors.next) setErrors((f) => ({ ...f, next: undefined }));
        }}
      />

      <Input
        name="confirm-password"
        type="password"
        label="Confirm new password"
        autoComplete="new-password"
        required
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
        loading={change.isPending}
        disabled={change.isPending}
        className="pt-1"
      >
        {change.isPending ? 'Changing…' : 'Change password'}
      </Button>
    </form>
  );
}

/* -------------------------------------------------------------------------- */
/*  Panel — addresses                                                          */
/* -------------------------------------------------------------------------- */

function AddressesPanel() {
  const query = useAddresses();
  const add = useAddAddress();
  const remove = useDeleteAddress();
  const { notify } = useToast();

  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<AddressDraft>(EMPTY_DRAFT);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [confirmingId, setConfirmingId] = useState<number | null>(null);

  const addresses = query.data ?? [];

  async function onAdd(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (add.isPending) return; // guards a double click while the request is in flight

    const found = validateDraft(draft);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    try {
      await add.mutateAsync({
        fullName: draft.fullName.trim(),
        phone: draft.phone.trim(),
        addressLine1: draft.addressLine1.trim(),
        addressLine2: draft.addressLine2.trim() || undefined,
        city: draft.city.trim(),
        state: draft.state.trim(),
        pincode: draft.pincode.trim(),
        landmark: draft.landmark.trim() || undefined,
      });
      setDraft(EMPTY_DRAFT);
      setOpen(false);
      notify('Address saved to your ledger.');
    } catch {
      // mutation.error carries the normalised message — rendered below.
    }
  }

  async function onDelete(id: number) {
    if (remove.isPending) return; // guards a double click while in flight
    try {
      await remove.mutateAsync(id);
      setConfirmingId(null);
      notify('Address removed.');
    } catch {
      notify('We could not remove that address.', 'error');
    }
  }

  function field<K extends keyof AddressDraft>(key: K) {
    return {
      value: draft[key],
      onChange: (e: ChangeEvent<HTMLInputElement>) => {
        setDraft((d) => ({ ...d, [key]: e.target.value }));
        if (errors[key]) setErrors((f) => ({ ...f, [key]: undefined }));
      },
    };
  }

  return (
    <div className="space-y-5">
      {query.isPending && <LoadingBlock label="Opening your address book" />}

      {query.isError && (
        <ErrorState
          title="Your address book would not open"
          message={errText(query.error, 'We could not load your saved addresses.')}
          onRetry={() => void query.refetch()}
        />
      )}

      {query.isSuccess && addresses.length === 0 && !open && (
        <EmptyState
          icon={<MapPin className="size-6" aria-hidden />}
          title="No addresses yet"
          body="Save one and checkout becomes a two-tap job every time after."
          action={
            <Button variant="ink" onClick={() => setOpen(true)} leftIcon={<Plus className="size-4" aria-hidden />}>
              Add your first address
            </Button>
          }
          className="border-0 bg-transparent px-0"
        />
      )}

      {query.isSuccess && addresses.length > 0 && (
        <ul className="space-y-3">
          {addresses.map((a: Address, i) => (
            <li
              key={a.id}
              className="stagger"
              style={{ '--i': i } as never}
            >
              <Card className="flex flex-wrap items-start justify-between gap-4 p-4 sm:p-5">
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2">
                    <span className="font-display text-lg font-semibold text-ink">{a.fullName}</span>
                    {a.isDefault && (
                      <span className="rounded-full border border-ember-line bg-ember-soft px-2 py-0.5 font-mono text-[0.5625rem] uppercase tracking-[0.14em] text-ember-deep">
                        Default
                      </span>
                    )}
                  </p>
                  <address className="mt-1.5 text-sm not-italic leading-relaxed text-ink-2">
                    {a.addressLine1}
                    {a.addressLine2 ? `, ${a.addressLine2}` : ''}
                    <br />
                    {a.city}, {a.state} — <span className="tnum font-mono text-xs">{a.pincode}</span>
                  </address>
                  <p className="tnum mt-2 flex items-center gap-1.5 font-mono text-xs text-ink-3">
                    <Phone className="size-3.5" aria-hidden />
                    {a.phone}
                    {a.landmark ? ` · near ${a.landmark}` : ''}
                  </p>
                </div>

                {confirmingId === a.id ? (
                  <div
                    role="group"
                    aria-label={`Confirm deleting the address for ${a.fullName}`}
                    className="flex shrink-0 items-center gap-2"
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      loading={remove.isPending}
                      disabled={remove.isPending}
                      onClick={() => void onDelete(a.id)}
                    >
                      Yes, delete
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={remove.isPending}
                      onClick={() => setConfirmingId(null)}
                    >
                      Keep
                    </Button>
                  </div>
                ) : (
                  <IconButton
                    label={`Delete the address for ${a.fullName}`}
                    onClick={() => setConfirmingId(a.id)}
                    disabled={remove.isPending}
                    className="shrink-0"
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </IconButton>
                )}
              </Card>
            </li>
          ))}
        </ul>
      )}

      {!open && addresses.length > 0 && (
        <Button variant="outline" onClick={() => setOpen(true)} leftIcon={<Plus className="size-4" aria-hidden />}>
          Add another address
        </Button>
      )}

      {add.isError && (
        <p
          role="alert"
          className="rounded-md border border-bad/30 bg-ember-soft px-4 py-3 text-sm leading-relaxed text-bad"
        >
          {errText(add.error, 'We could not save that address.')}
        </p>
      )}

      {open && (
        <Card className="p-5 sm:p-6">
          <p className="flex items-center gap-2 font-mono text-[0.625rem] uppercase tracking-[0.18em] text-ink-3">
            <SquarePen className="size-3.5" aria-hidden />
            New delivery address
          </p>
          <p className="mt-2 text-sm leading-relaxed text-ink-2">
            Every field is checked here before it is sent — the market keeps addresses without a
            second look, and a blank pincode ends up at the wrong doorstep.
          </p>

          <form className="mt-5 space-y-4" noValidate onSubmit={onAdd}>
            <Input
              name="addr-fullname"
              type="text"
              label="Full name"
              autoComplete="name"
              required
              icon={<UserIcon className="size-4" aria-hidden />}
              placeholder="Asadhabai Pradhan"
              error={errors.fullName}
              {...field('fullName')}
            />

            <Input
              name="addr-phone"
              type="tel"
              label="Mobile number"
              autoComplete="tel"
              inputMode="tel"
              required
              icon={<Phone className="size-4" aria-hidden />}
              placeholder="98765 43210"
              error={errors.phone}
              {...field('phone')}
            />

            <Input
              name="addr-line1"
              type="text"
              label="Address line 1"
              autoComplete="address-line1"
              required
              placeholder="Flat / house no., street, area"
              error={errors.addressLine1}
              {...field('addressLine1')}
            />

            <Input
              name="addr-line2"
              type="text"
              label="Address line 2"
              autoComplete="address-line2"
              hint="Optional — society, building or wing."
              placeholder="Near the old temple"
              error={errors.addressLine2}
              {...field('addressLine2')}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                name="addr-city"
                type="text"
                label="City"
                autoComplete="address-level2"
                required
                placeholder="Pune"
                error={errors.city}
                {...field('city')}
              />
              <Input
                name="addr-state"
                type="text"
                label="State"
                autoComplete="address-level1"
                required
                placeholder="Maharashtra"
                error={errors.state}
                {...field('state')}
              />
            </div>

            <Input
              name="addr-pincode"
              type="text"
              label="Pincode"
              autoComplete="postal-code"
              inputMode="numeric"
              required
              placeholder="411001"
              hint="Six digits."
              error={errors.pincode}
              {...field('pincode')}
            />

            <Input
              name="addr-landmark"
              type="text"
              label="Landmark"
              hint="Optional — helps the runner find you."
              placeholder="Opposite the water tank"
              error={errors.landmark}
              {...field('landmark')}
            />

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Button
                type="submit"
                variant="ember"
                loading={add.isPending}
                disabled={add.isPending}
              >
                {add.isPending ? 'Saving…' : 'Save address'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                disabled={add.isPending}
                onClick={() => {
                  setOpen(false);
                  setDraft(EMPTY_DRAFT);
                  setErrors({});
                }}
              >
                Cancel
              </Button>
              <span role="status" aria-live="polite" className="sr-only">
                {add.isPending ? 'Saving your address.' : ''}
              </span>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Recent orders                                                              */
/* -------------------------------------------------------------------------- */

function RecentOrders() {
  const query = useOrders(1);

  if (query.isPending) return <LoadingBlock label="Finding your orders" />;

  if (query.isError) {
    return (
      <ErrorState
        title="Orders would not load"
        message={errText(query.error, 'We could not reach the order ledger just now.')}
        onRetry={() => void query.refetch()}
      />
    );
  }

  const orders = query.data?.data ?? [];

  if (orders.length === 0) {
    return (
      <EmptyState
        icon={<Package className="size-6" aria-hidden />}
        title="No crates on the ledger yet"
        body="Your first order will appear here the moment it is placed."
        action={
          <Button to="/products" variant="ink">
            Browse the harvest
          </Button>
        }
        className="border-0 bg-transparent px-0"
      />
    );
  }

  return (
    <ul className="space-y-2.5">
      {orders.slice(0, 5).map((o, i) => (
        <li key={o.id} className="stagger" style={{ '--i': i } as never}>
          <Link
            to={`/orders/${o.orderNumber}`}
            className="flex items-center justify-between gap-3 rounded-md border border-rule bg-paper-card px-4 py-3 transition-colors hover:border-ink hover:bg-paper"
          >
            <span className="min-w-0">
              <span className="block font-mono text-xs tracking-[0.06em] text-ink">
                {o.orderNumber}
              </span>
              <span className="mt-1 block text-xs text-ink-3">
                {plural(
                  o.items.reduce((n, it) => n + it.quantity, 0),
                  'item',
                )}{' '}
                · {formatDate(o.createdAt)}
              </span>
            </span>
            <span className="flex shrink-0 items-center gap-3">
              <StatusBadge status={o.status} label={o.statusInfo?.label} />
              <span className="tnum font-mono text-sm font-medium text-ink">
                {money(o.totalAmount)}
              </span>
            </span>
          </Link>
        </li>
      ))}

      <li>
        <Button to="/orders" variant="ghost" size="sm" className="mt-1 w-full">
          Open the full order ledger
        </Button>
      </li>
    </ul>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function Profile() {
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabId>('details');
  const [signingOut, setSigningOut] = useState(false);

  async function onSignOut() {
    if (signingOut) return; // guards a double click while the request is in flight
    setSigningOut(true);
    await logout();
    navigate('/', { replace: true });
  }

  // RequireAuth has already redirected a signed-out visitor; this only narrows
  // the type while the session settles.
  if (!user) return <LoadingBlock label="Opening your ledger" />;

  const verified = user.isEmailVerified === true;

  return (
    <div className="shell py-12 md:py-16">
      {/* --- Account header ------------------------------------------------ */}
      <Card className="stagger overflow-hidden">
        <div className="flex flex-wrap items-start gap-5 p-6 sm:p-7">
          <span
            aria-hidden
            className="grid size-16 shrink-0 place-items-center rounded-full border border-leaf-line bg-leaf-soft font-display text-2xl font-semibold text-leaf-deep"
          >
            {initials(user)}
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-3xl leading-tight sm:text-4xl">{user.name}</h1>
              {verified ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-leaf-line bg-leaf-soft px-2.5 py-0.5 font-mono text-[0.625rem] font-medium uppercase tracking-[0.12em] text-leaf-deep">
                  <BadgeCheck className="size-3.5" aria-hidden />
                  Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-citrus-line bg-citrus-soft px-2.5 py-0.5 font-mono text-[0.625rem] font-medium uppercase tracking-[0.12em] text-warn">
                  <CircleAlert className="size-3.5" aria-hidden />
                  Unverified
                </span>
              )}
            </div>

            <dl className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-1.5 text-sm text-ink-2">
              <div className="flex items-center gap-1.5">
                <dt className="sr-only">Email address</dt>
                <Mail className="size-3.5 text-ink-3" aria-hidden />
                <dd className="font-mono text-xs">{user.email}</dd>
              </div>
              <div className="flex items-center gap-1.5">
                <dt className="sr-only">Member since</dt>
                <dd className="text-xs">At the counter since {formatDate(user.createdAt)}</dd>
              </div>
            </dl>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => void onSignOut()}
            loading={signingOut}
            disabled={signingOut}
            leftIcon={<LogOut className="size-4" aria-hidden />}
            className="shrink-0"
          >
            {signingOut ? 'Signing out…' : 'Sign out'}
          </Button>
        </div>

        {!verified && (
          <p className="border-t border-rule bg-citrus-soft px-6 py-3 text-sm leading-relaxed text-ink-2 sm:px-7">
            This address is still unverified, so the market will hold your orders until it is. Open
            the link we emailed you, or{' '}
            <Link to="/contact" className="wipe font-medium text-ember">
              ask the counter
            </Link>{' '}
            for a fresh one.
          </p>
        )}
      </Card>

      {/* --- Settings + orders --------------------------------------------- */}
      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-12">
        <section className="min-w-0">
          <SectionHeading
            eyebrow="Settings"
            title="Your ledger"
            lede="Name, password and the addresses we deliver to. Everything here takes effect on the next request."
          />

          <div className="mt-7">
            <TabBar value={tab} onChange={setTab} />

            <div
              role="tabpanel"
              id={`panel-${tab}`}
              aria-labelledby={`tab-${tab}`}
              tabIndex={0}
              className="pt-7 focus-visible:outline-none"
            >
              {tab === 'details' && <DetailsPanel user={user} />}
              {tab === 'password' && <PasswordPanel />}
              {tab === 'addresses' && <AddressesPanel />}
            </div>
          </div>
        </section>

        <aside className="min-w-0">
          <div className="rule-b pb-3">
            <h2 className="font-mono text-[0.6875rem] font-medium uppercase tracking-[0.18em] text-ink-3">
              Recent orders
            </h2>
          </div>
          <div className="pt-5">
            <RecentOrders />
          </div>
        </aside>
      </div>
    </div>
  );
}