import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  Check,
  CheckCircle2,
  Clock,
  CreditCard,
  MapPin,
  Package,
  ShieldCheck,
  ShoppingBasket,
  Sun,
  Sunrise,
  Sunset,
  Wallet,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Checkbox, Input, RadioGroup, Textarea } from '../../components/ui/Field';
import { Badge, EmptyState, LoadingBlock, useToast } from '../../components/ui/Feedback';
import { Card, PriceTag, ProseImage } from '../../components/ui/Surface';
import { useAuth } from '../../lib/auth';
import { FREE_DELIVERY_AT, TAX_RATE, orderEstimate, useCart } from '../../lib/cart';
import { errText, useAddAddress, useAddresses, useCreateOrder } from '../../lib/catalog';
import type { CreateOrderInput } from '../../lib/catalog';
import { cn, formatDate, money, moneyExact, plural } from '../../lib/format';
import type { Address, DeliverySlot, Order, PaymentMethod } from '../../lib/types';

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

type Step = 1 | 2 | 3;

interface CreatedOrder {
  order: Order;
  orderNumber: string;
  totalAmount: number;
  itemsCount: number;
  estimatedDelivery: string;
  paymentMethod: string;
}

interface AddressForm {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
  landmark: string;
}

type Field = keyof AddressForm;

const EMPTY_FORM: AddressForm = {
  fullName: '',
  phone: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  pincode: '',
  landmark: '',
};

const STEPS: Array<{ n: Step; label: string }> = [
  { n: 1, label: 'Delivery' },
  { n: 2, label: 'Slot & payment' },
  { n: 3, label: 'Review' },
];

const SLOTS: Array<{ value: DeliverySlot; label: string; description: string }> = [
  { value: 'MORNING', label: 'Morning', description: 'The first run of the day' },
  { value: 'AFTERNOON', label: 'Afternoon', description: 'Midday run' },
  { value: 'EVENING', label: 'Evening', description: 'After the market closes' },
  { value: 'ANYTIME', label: 'Anytime', description: 'Whatever suits you' },
];

const PAYMENTS: Array<{ value: PaymentMethod; label: string; description: string }> = [
  { value: 'COD', label: 'Cash on delivery', description: 'Pay the runner at the door' },
  { value: 'ONLINE', label: 'Pay online', description: 'UPI, card or net banking' },
  { value: 'WALLET', label: 'Wallet', description: 'PradhanFresh wallet balance' },
];

const SLOT_LABEL: Record<DeliverySlot, string> = {
  MORNING: 'Morning',
  AFTERNOON: 'Afternoon',
  EVENING: 'Evening',
  ANYTIME: 'Anytime',
};

const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  COD: 'Cash on delivery',
  ONLINE: 'Paid online',
  WALLET: 'Wallet',
};

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function toIsoDate(d: Date): string {
  const month = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

/**
 * The API validates `deliveryDate` against `now + 1 day` and `now + 30 days`
 * using the exact clock time, so a bare `YYYY-MM-DD` string is read as UTC
 * midnight and "tomorrow" is rejected for most of the day. Anchoring the chosen
 * calendar day at its end keeps every day the picker allows inside the window.
 */
function toDeliveryIso(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, m - 1, d, 23, 59, 0).toISOString();
}

/** Same trick for display, so the review never shows the previous day. */
function prettyDate(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  return formatDate(new Date(y, m - 1, d, 12).toISOString());
}

/** The API answers with a plain date, or the literal "To be confirmed". */
function deliveryLabel(raw?: string | null): string {
  if (!raw) return 'To be confirmed';
  return /^\d{4}-\d{2}-\d{2}/.test(raw) ? prettyDate(raw.slice(0, 10)) : raw;
}

function fromAddress(a: Address): AddressForm {
  return {
    fullName: a.fullName ?? '',
    phone: a.phone ?? '',
    addressLine1: a.addressLine1 ?? '',
    addressLine2: a.addressLine2 ?? '',
    city: a.city ?? '',
    state: a.state ?? '',
    pincode: a.pincode ?? '',
    landmark: a.landmark ?? '',
  };
}

function validateAddress(form: AddressForm): Partial<Record<Field, string>> {
  const errors: Partial<Record<Field, string>> = {};
  if (!form.fullName.trim()) errors.fullName = 'Who should we hand this to?';
  if (form.phone.replace(/\D/g, '').length !== 10) errors.phone = 'Enter a 10-digit phone number';
  if (!form.addressLine1.trim()) errors.addressLine1 = 'Add the house, flat or street';
  if (!form.city.trim()) errors.city = 'City is required';
  if (!form.state.trim()) errors.state = 'State is required';
  if (!/^\d{6}$/.test(form.pincode.trim())) errors.pincode = 'Pincode must be 6 digits';
  return errors;
}

/* -------------------------------------------------------------------------- */
/*  Confirmation                                                               */
/* -------------------------------------------------------------------------- */

function Confirmation({
  created,
  slot,
  payment,
  date,
  form,
}: {
  created: CreatedOrder;
  slot: DeliverySlot;
  payment: PaymentMethod;
  date: string;
  form: AddressForm;
}) {
  return (
    <div className="shell py-14 md:py-20">
      <div className="mx-auto max-w-2xl">
        <div className="stagger text-center" style={{ '--i': 0 } as never}>
          <span className="grid mx-auto size-16 place-items-center rounded-full border border-leaf-line bg-leaf-soft text-leaf">
            <CheckCircle2 className="size-8" aria-hidden />
          </span>
          <p className="mt-6 font-mono text-[0.6875rem] uppercase tracking-[0.22em] text-ember">
            Order placed
          </p>
          <h1 className="mt-3 text-4xl leading-[1.03] md:text-5xl">Your order is in the ledger.</h1>
          <p className="mx-auto mt-4 max-w-md leading-relaxed text-ink-2">
            Keep this number for your records — it is what we quote on the phone and in your order
            history.
          </p>
          <p className="tnum mt-5 inline-block rounded-md border border-rule bg-paper-card px-4 py-2 font-mono text-lg font-semibold tracking-[0.08em] text-ink">
            {created.orderNumber}
          </p>
        </div>

        <Card className="stagger mt-10 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl">What happens next</h2>
            <Badge tone="citrus" dot>
              {created.order.status}
            </Badge>
          </div>

          <dl className="mt-5 divide-y divide-rule-soft border-y border-rule-soft">
            {[
              {
                label: 'Items',
                value: `${plural(created.itemsCount, 'unit')} · ${money(created.totalAmount)}`,
              },
              {
                label: 'Estimated delivery',
                value: deliveryLabel(created.estimatedDelivery),
              },
              {
                label: 'Slot',
                value: date ? `${SLOT_LABEL[slot]} · ${prettyDate(date)}` : SLOT_LABEL[slot],
              },
              { label: 'Payment', value: PAYMENT_LABEL[payment] },
              {
                label: 'Delivering to',
                value: `${form.fullName}, ${form.addressLine1}, ${form.city} ${form.pincode}`,
              },
            ].map((row) => (
              <div key={row.label} className="flex items-baseline justify-between gap-6 py-3">
                <dt className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-ink-3">
                  {row.label}
                </dt>
                <dd className="text-right text-sm font-medium text-ink">{row.value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <Button
              to={`/orders/${created.orderNumber}`}
              variant="ember"
              full
              rightIcon={<ArrowRight className="size-4" aria-hidden />}
            >
              Track this order
            </Button>
            <Button to="/products" variant="outline" full>
              Back to the market
            </Button>
          </div>

          <p className="mt-5 flex items-start gap-2 text-xs leading-relaxed text-ink-3">
            <ShieldCheck className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            Your basket was emptied by the market when the order was written — nothing is left to
            pay twice.
          </p>
        </Card>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function Checkout() {
  const user = useAuth((s) => s.user);
  const ready = useCart((s) => s.ready);
  const items = useCart((s) => s.items);
  const itemsCount = useCart((s) => s.itemsCount);
  const { notify } = useToast();

  const { data: addresses = [], isLoading: addressesLoading } = useAddresses();
  const addAddress = useAddAddress();
  const createOrder = useCreateOrder();

  const [step, setStep] = useState<Step>(1);
  const [created, setCreated] = useState<CreatedOrder | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [stepError, setStepError] = useState<string | null>(null);

  const [form, setForm] = useState<AddressForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [picked, setPicked] = useState<number | 'new'>('new');
  const [saveAddress, setSaveAddress] = useState(true);

  const [slot, setSlot] = useState<DeliverySlot>('MORNING');
  const [payment, setPayment] = useState<PaymentMethod>('COD');
  const [date, setDate] = useState('');
  const [dateError, setDateError] = useState<string | null>(null);
  const [notes, setNotes] = useState('');

  const seeded = useRef(false);
  const touched = useRef(false);

  /* --- Date window (tomorrow … +30 days) -------------------------------- */
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const month = new Date();
  month.setDate(month.getDate() + 30);
  const minDate = toIsoDate(tomorrow);
  const maxDate = toIsoDate(month);

  /* --- Prefill from the saved address book ------------------------------- */
  useEffect(() => {
    // Never clobber something the shopper has already typed.
    if (seeded.current || touched.current || addressesLoading) return;
    seeded.current = true;
    const first = addresses.find((a) => a.isDefault) ?? addresses[0];
    if (first) {
      setPicked(first.id);
      setForm(fromAddress(first));
      return;
    }
    setForm((f) => ({ ...f, fullName: f.fullName || user?.name || '' }));
  }, [addresses, addressesLoading, user]);

  /* --- Derived ------------------------------------------------------------ */
  const est = orderEstimate(items);
  const isNewAddress = picked === 'new';

  /* --- Form helpers ------------------------------------------------------- */
  const setField = (field: Field, value: string) => {
    touched.current = true;
    setForm((f) => ({ ...f, [field]: value }));
    if (picked !== 'new') setPicked('new');
    setErrors((e) => (e[field] ? { ...e, [field]: undefined } : e));
    setStepError(null);
  };

  const pickAddress = (a: Address) => {
    touched.current = true;
    setPicked(a.id);
    setForm(fromAddress(a));
    setErrors({});
    setStepError(null);
  };

  const useNewAddress = () => {
    setPicked('new');
    setStepError(null);
  };

  const goto = (next: Step) => {
    setStepError(null);
    setStep(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goNext = () => {
    if (step === 1) {
      const found = validateAddress(form);
      setErrors(found);
      if (Object.keys(found).length > 0) {
        setStepError('Please fix the highlighted fields before continuing.');
        return;
      }
      goto(2);
      return;
    }
    if (step === 2) {
      if (date && (date < minDate || date > maxDate)) {
        setDateError(`Choose a date between ${prettyDate(minDate)} and ${prettyDate(maxDate)}.`);
        return;
      }
      setDateError(null);
      goto(3);
    }
  };

  const goBack = () => {
    if (step === 2) goto(1);
    else if (step === 3) goto(2);
  };

  const persistAddress = async (address: CreateOrderInput['deliveryAddress']) => {
    try {
      await addAddress.mutateAsync(address);
      notify('Address saved to your account');
    } catch (err) {
      notify(errText(err, 'Order placed, but we could not save this address.'), 'error');
    }
  };

  const placeOrder = () => {
    setApiError(null);
    const shouldSave = isNewAddress && saveAddress;
    const payload: CreateOrderInput = {
      deliveryAddress: {
        fullName: form.fullName.trim(),
        phone: form.phone.replace(/\D/g, ''),
        addressLine1: form.addressLine1.trim(),
        addressLine2: form.addressLine2.trim() || null,
        city: form.city.trim(),
        state: form.state.trim(),
        pincode: form.pincode.trim(),
        landmark: form.landmark.trim() || null,
      },
      paymentMethod: payment,
      deliverySlot: slot,
      ...(date ? { deliveryDate: toDeliveryIso(date) } : {}),
      ...(notes.trim() ? { orderNotes: notes.trim() } : {}),
    };

    createOrder.mutate(payload, {
      onSuccess: (result) => {
        setCreated(result);
        if (shouldSave) void persistAddress(payload.deliveryAddress);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
      onError: (err) => {
        setApiError(errText(err, 'We could not place your order. Please try again.'));
      },
    });
  };

  /* --- Guards ------------------------------------------------------------- */
  if (created) {
    return (
      <Confirmation created={created} slot={slot} payment={payment} date={date} form={form} />
    );
  }

  if (!ready) {
    return (
      <div className="shell py-10 md:py-14">
        <span className="eyebrow">Checkout</span>
        <h1 className="mt-3 text-3xl leading-[1.05] md:text-4xl">Checkout</h1>
        <LoadingBlock label="Checking your basket" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="shell py-10 md:py-14">
        <span className="eyebrow">Checkout</span>
        <h1 className="mt-3 text-3xl leading-[1.05] md:text-4xl">Checkout</h1>
        <div className="mt-10">
          <EmptyState
            icon={<ShoppingBasket className="size-6" aria-hidden />}
            title="There is nothing to check out"
            body="Your basket is empty, so there is no order to place yet."
            action={
              <Button
                to="/products"
                variant="ember"
                leftIcon={<ShoppingBasket className="size-4" aria-hidden />}
              >
                Browse produce
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  /* --- Render ------------------------------------------------------------- */
  return (
    <div className="shell py-10 md:py-14">
      <header className="stagger" style={{ '--i': 0 } as never}>
        <span className="eyebrow">Almost yours</span>
        <h1 className="mt-3 text-3xl leading-[1.05] md:text-4xl">Checkout</h1>
        <p
          role="status"
          aria-live="polite"
          className="mt-2.5 font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-ink-3"
        >
          {plural(itemsCount, 'item')} · {money(est.total)} · step {step} of 3
        </p>
      </header>

      {/* Progress ---------------------------------------------------------- */}
      <nav aria-label="Checkout progress" className="stagger mt-8" style={{ '--i': 1 } as never}>
        <ol className="flex flex-wrap items-center gap-2">
          {STEPS.map((s) => {
            const state = s.n === step ? 'current' : s.n < step ? 'done' : 'todo';
            return (
              <li key={s.n} className="flex items-center gap-2">
                {s.n > 1 && <span aria-hidden className="h-px w-6 bg-rule sm:w-10" />}
                {state === 'todo' ? (
                  <span
                    aria-disabled
                    className="inline-flex items-center gap-2 rounded-full border border-dashed border-rule px-3 py-1.5"
                  >
                    <span className="tnum font-mono text-[0.625rem] text-ink-4">0{s.n}</span>
                    <span className="font-mono text-[0.625rem] uppercase tracking-[0.14em] text-ink-4">
                      {s.label}
                    </span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => goto(s.n)}
                    aria-current={state === 'current' ? 'step' : undefined}
                    className={cn(
                      'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 transition-colors duration-200',
                      state === 'current'
                        ? 'border-ember bg-ember-soft text-ember-deep'
                        : 'border-leaf bg-leaf-soft text-leaf-deep hover:border-leaf',
                    )}
                  >
                    {state === 'done' ? (
                      <Check className="size-3" aria-hidden />
                    ) : (
                      <span className="tnum font-mono text-[0.625rem]">0{s.n}</span>
                    )}
                    <span className="font-mono text-[0.625rem] uppercase tracking-[0.14em]">
                      {s.label}
                    </span>
                    {state === 'done' && <span className="sr-only">(completed)</span>}
                  </button>
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_21rem] lg:gap-12">
        {/* Steps ---------------------------------------------------------- */}
        <div className="min-w-0">
          {/* Step 1 ------------------------------------------------------ */}
          {step === 1 && (
            <section aria-labelledby="pf-step-1" className="stagger" style={{ '--i': 2 } as never}>
              <h2 id="pf-step-1" className="text-3xl leading-[1.05]">
                Where is this going?
              </h2>

              {addresses.length > 0 && (
                <fieldset className="mt-6">
                  <legend className="mb-2.5 font-mono text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-ink-3">
                    Saved addresses
                  </legend>
                  <div className="grid gap-2">
                    {addresses.map((a) => {
                      const active = picked === a.id;
                      return (
                        <label
                          key={a.id}
                          className={cn(
                            'flex cursor-pointer items-start gap-3 rounded-md border px-3.5 py-3 transition-colors duration-200',
                            active
                              ? 'border-ember bg-ember-soft'
                              : 'border-rule bg-paper-card hover:border-rule-strong',
                          )}
                        >
                          <input
                            type="radio"
                            name="savedAddress"
                            className="peer sr-only"
                            checked={active}
                            onChange={() => pickAddress(a)}
                          />
                          <span
                            aria-hidden
                            className={cn(
                              'mt-0.5 grid size-4 shrink-0 place-items-center rounded-full border-2 transition-colors',
                              active ? 'border-ember' : 'border-rule-strong',
                            )}
                          >
                            <span
                              className={cn(
                                'size-2 rounded-full bg-ember transition-transform duration-200',
                                active ? 'scale-100' : 'scale-0',
                              )}
                            />
                          </span>
                          <span className="min-w-0">
                            <span className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-medium text-ink">{a.fullName}</span>
                              {a.isDefault && <Badge tone="paper">Default</Badge>}
                            </span>
                            <span className="mt-0.5 block text-xs leading-relaxed text-ink-3">
                              {a.addressLine1}
                              {a.addressLine2 ? `, ${a.addressLine2}` : ''}, {a.city}, {a.state}{' '}
                              {a.pincode}
                            </span>
                            <span className="tnum mt-0.5 block font-mono text-[0.6875rem] text-ink-3">
                              {a.phone}
                            </span>
                          </span>
                        </label>
                      );
                    })}

                    <label
                      className={cn(
                        'flex cursor-pointer items-center gap-3 rounded-md border px-3.5 py-3 transition-colors duration-200',
                        isNewAddress
                          ? 'border-ember bg-ember-soft'
                          : 'border-dashed border-rule-strong bg-paper-card hover:border-ink',
                      )}
                    >
                      <input
                        type="radio"
                        name="savedAddress"
                        className="peer sr-only"
                        checked={isNewAddress}
                        onChange={useNewAddress}
                      />
                      <span
                        aria-hidden
                        className={cn(
                          'grid size-4 shrink-0 place-items-center rounded-full border-2 transition-colors',
                          isNewAddress ? 'border-ember' : 'border-rule-strong',
                        )}
                      >
                        <span
                          className={cn(
                            'size-2 rounded-full bg-ember transition-transform duration-200',
                            isNewAddress ? 'scale-100' : 'scale-0',
                          )}
                        />
                      </span>
                      <span className="text-sm font-medium text-ink">Use a new address</span>
                    </label>
                  </div>
                </fieldset>
              )}

              <div className="mt-7 grid gap-4 sm:grid-cols-2">
                <Input
                  name="fullName"
                  label="Full name"
                  required
                  autoComplete="name"
                  value={form.fullName}
                  error={errors.fullName}
                  onChange={(e) => setField('fullName', e.target.value)}
                />
                <Input
                  name="phone"
                  label="Phone"
                  required
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  maxLength={10}
                  placeholder="10-digit mobile"
                  value={form.phone}
                  error={errors.phone}
                  onChange={(e) => setField('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                />
                <Input
                  name="addressLine1"
                  label="Flat, house or street"
                  required
                  autoComplete="address-line1"
                  containerClassName="sm:col-span-2"
                  value={form.addressLine1}
                  error={errors.addressLine1}
                  onChange={(e) => setField('addressLine1', e.target.value)}
                />
                <Input
                  name="addressLine2"
                  label="Area or landmark (optional)"
                  autoComplete="address-line2"
                  containerClassName="sm:col-span-2"
                  value={form.addressLine2}
                  onChange={(e) => setField('addressLine2', e.target.value)}
                />
                <Input
                  name="city"
                  label="City"
                  required
                  autoComplete="address-level2"
                  value={form.city}
                  error={errors.city}
                  onChange={(e) => setField('city', e.target.value)}
                />
                <Input
                  name="state"
                  label="State"
                  required
                  autoComplete="address-level1"
                  value={form.state}
                  error={errors.state}
                  onChange={(e) => setField('state', e.target.value)}
                />
                <Input
                  name="pincode"
                  label="Pincode"
                  required
                  inputMode="numeric"
                  maxLength={6}
                  autoComplete="postal-code"
                  value={form.pincode}
                  error={errors.pincode}
                  onChange={(e) => setField('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))}
                />
                <Input
                  name="landmark"
                  label="Landmark (optional)"
                  value={form.landmark}
                  onChange={(e) => setField('landmark', e.target.value)}
                />
              </div>

              {isNewAddress && (
                <div className="rule-t mt-6 pt-5">
                  <Checkbox
                    name="saveAddress"
                    label="Save this address to my account"
                    description="Next time you order it will be waiting for you."
                    checked={saveAddress}
                    onChange={(e) => setSaveAddress(e.target.checked)}
                  />
                </div>
              )}

              {stepError && (
                <p
                  role="alert"
                  className="mt-5 rounded-md border border-bad/40 bg-ember-soft/50 px-3.5 py-2.5 text-sm text-bad"
                >
                  {stepError}
                </p>
              )}
            </section>
          )}

          {/* Step 2 ------------------------------------------------------ */}
          {step === 2 && (
            <section aria-labelledby="pf-step-2" className="stagger" style={{ '--i': 2 } as never}>
              <h2 id="pf-step-2" className="text-3xl leading-[1.05]">
                When should we come by?
              </h2>

              <div className="mt-7 space-y-7">
                <RadioGroup
                  legend="Delivery slot"
                  name="deliverySlot"
                  value={slot}
                  onChange={(v) => setSlot(v)}
                  options={[
                    { ...SLOTS[0], icon: <Sunrise className="size-4" aria-hidden /> },
                    { ...SLOTS[1], icon: <Sun className="size-4" aria-hidden /> },
                    { ...SLOTS[2], icon: <Sunset className="size-4" aria-hidden /> },
                    { ...SLOTS[3], icon: <Clock className="size-4" aria-hidden /> },
                  ]}
                />

                <Input
                  name="deliveryDate"
                  label="Preferred date (optional)"
                  type="date"
                  min={minDate}
                  max={maxDate}
                  hint={`Between ${prettyDate(minDate)} and ${prettyDate(maxDate)}. Leave blank for the next run.`}
                  error={dateError}
                  value={date}
                  onChange={(e) => {
                    setDate(e.target.value);
                    setDateError(null);
                  }}
                />

                <RadioGroup
                  legend="Payment method"
                  name="paymentMethod"
                  value={payment}
                  onChange={(v) => setPayment(v)}
                  columns={1}
                  options={[
                    { ...PAYMENTS[0], icon: <Banknote className="size-4" aria-hidden /> },
                    { ...PAYMENTS[1], icon: <CreditCard className="size-4" aria-hidden /> },
                    { ...PAYMENTS[2], icon: <Wallet className="size-4" aria-hidden /> },
                  ]}
                />
              </div>
            </section>
          )}

          {/* Step 3 ------------------------------------------------------ */}
          {step === 3 && (
            <section aria-labelledby="pf-step-3" className="stagger" style={{ '--i': 2 } as never}>
              <h2 id="pf-step-3" className="text-3xl leading-[1.05]">
                Check the ledger
              </h2>

              <div className="mt-7 grid gap-4 sm:grid-cols-2">
                <Card className="p-5">
                  <h3 className="flex items-center gap-2 font-mono text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-ink-3">
                    <MapPin className="size-3.5" aria-hidden />
                    Delivering to
                  </h3>
                  <address className="mt-3 space-y-0.5 text-sm not-italic leading-relaxed text-ink-2">
                    <p className="font-medium text-ink">{form.fullName}</p>
                    <p>{form.addressLine1}</p>
                    {form.addressLine2 && <p>{form.addressLine2}</p>}
                    <p>
                      {form.city}, {form.state} {form.pincode}
                    </p>
                    {form.landmark && <p className="text-ink-3">Near {form.landmark}</p>}
                    <p className="tnum pt-1 font-mono text-[0.8125rem]">{form.phone}</p>
                  </address>
                  <Button variant="link" size="sm" className="mt-3 px-0" onClick={() => goto(1)}>
                    Edit address
                  </Button>
                </Card>

                <Card className="p-5">
                  <h3 className="flex items-center gap-2 font-mono text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-ink-3">
                    <Package className="size-3.5" aria-hidden />
                    Slot & payment
                  </h3>
                  <dl className="mt-3 space-y-2 text-sm">
                    <div className="flex items-baseline justify-between gap-3">
                      <dt className="text-ink-3">Slot</dt>
                      <dd className="font-medium text-ink">{SLOT_LABEL[slot]}</dd>
                    </div>
                    <div className="flex items-baseline justify-between gap-3">
                      <dt className="text-ink-3">Date</dt>
                      <dd className="font-medium text-ink">
                        {date ? prettyDate(date) : 'Next run'}
                      </dd>
                    </div>
                    <div className="flex items-baseline justify-between gap-3">
                      <dt className="text-ink-3">Payment</dt>
                      <dd className="font-medium text-ink">{PAYMENT_LABEL[payment]}</dd>
                    </div>
                  </dl>
                  <Button variant="link" size="sm" className="mt-3 px-0" onClick={() => goto(2)}>
                    Edit slot
                  </Button>
                </Card>
              </div>

              {/* Items ---------------------------------------------------- */}
              <div className="rule-t mt-8 pt-6">
                <h3 className="font-mono text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-ink-3">
                  {plural(itemsCount, 'item')} in this run
                </h3>
                <ul className="mt-4 divide-y divide-rule-soft border-y border-rule-soft">
                  {items.map((item) => (
                    <li key={item.id} className="flex items-center gap-4 py-3">
                      <ProseImage
                        src={item.product.thumbnail}
                        alt={item.product.name}
                        className="size-14 shrink-0 rounded-md border border-rule"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-ink">
                          {item.product.name}
                        </p>
                        <p className="tnum font-mono text-[0.6875rem] text-ink-3">
                          {item.quantity} × {money(item.price)} / {item.product.unit}
                        </p>
                      </div>
                      <p className="tnum shrink-0 text-sm font-medium text-ink">
                        {money(item.subtotal)}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>

              <Textarea
                name="orderNotes"
                label="Notes for the picker (optional)"
                placeholder="Leave at the gate, ring the bell twice…"
                rows={3}
                containerClassName="mt-6"
                value={notes}
                maxLength={500}
                onChange={(e) => setNotes(e.target.value)}
              />

              {apiError && (
                <div
                  role="alert"
                  className="mt-6 flex items-start gap-3 rounded-lg border border-ember-line bg-ember-soft/60 px-4 py-3.5"
                >
                  <Package className="mt-0.5 size-4 shrink-0 text-bad" aria-hidden />
                  <div>
                    <p className="text-sm font-semibold text-ink">We could not place the order</p>
                    <p className="mt-0.5 text-sm text-ink-2">{apiError}</p>
                  </div>
                </div>
              )}

              <p className="mt-4 text-xs leading-relaxed text-ink-3">
                Placing the order writes it to your account and empties your basket. You can still
                cancel from your orders while it is pending.
              </p>
            </section>
          )}

          {/* Step navigation --------------------------------------------- */}
          <div className="rule-t mt-8 flex flex-wrap items-center gap-2 pt-6">
            {step > 1 && (
              <Button
                variant="ghost"
                onClick={goBack}
                leftIcon={<ArrowLeft className="size-4" aria-hidden />}
              >
                Back
              </Button>
            )}

            {step < 3 ? (
              <Button
                variant="ember"
                size="lg"
                className="ml-auto"
                onClick={goNext}
                rightIcon={<ArrowRight className="size-4" aria-hidden />}
              >
                Continue to {step === 1 ? 'slot & payment' : 'review'}
              </Button>
            ) : (
              <Button
                variant="ember"
                size="lg"
                className="ml-auto"
                loading={createOrder.isPending}
                onClick={placeOrder}
                rightIcon={<ArrowRight className="size-4" aria-hidden />}
              >
                Place order · {money(est.total)}
              </Button>
            )}
          </div>
        </div>

        {/* Summary -------------------------------------------------------- */}
        <aside className="order-first lg:order-none lg:sticky lg:top-28 lg:self-start">
          <h2 className="sr-only">Order summary</h2>
          <Card className="p-6">
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-ink-3">
                Summary
              </span>
              <Badge tone="paper">{plural(itemsCount, 'item')}</Badge>
            </div>

            <ul className="mt-4 max-h-64 space-y-3 overflow-y-auto pr-1">
              {items.map((item) => (
                <li key={item.id} className="flex items-center gap-3">
                  <ProseImage
                    src={item.product.thumbnail}
                    alt=""
                    className="size-11 shrink-0 rounded-md border border-rule"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-ink-2">{item.product.name}</p>
                    <p className="tnum font-mono text-[0.6875rem] text-ink-3">
                      × {item.quantity}
                    </p>
                  </div>
                  <p className="tnum shrink-0 font-mono text-sm text-ink">
                    {money(item.subtotal)}
                  </p>
                </li>
              ))}
            </ul>

            <dl className="rule-t mt-5 space-y-2.5 pt-5">
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-sm text-ink-2">Subtotal</dt>
                <dd className="tnum text-sm text-ink">{moneyExact(est.subtotal)}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-sm text-ink-2">Delivery</dt>
                <dd className="tnum text-sm text-ink">
                  {est.deliveryFee === 0 ? 'Free' : moneyExact(est.deliveryFee)}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-sm text-ink-2">GST ({TAX_RATE * 100}%)</dt>
                <dd className="tnum text-sm text-ink">{moneyExact(est.tax)}</dd>
              </div>
              <div className="rule-t flex items-baseline justify-between gap-4 pt-3">
                <dt className="font-display text-lg font-semibold text-ink">Total</dt>
                <dd>
                  <PriceTag price={est.total} size="md" />
                </dd>
              </div>
            </dl>

            {est.subtotal < FREE_DELIVERY_AT && (
              <p className="mt-3 text-xs text-ink-3">
                Add {money(FREE_DELIVERY_AT - est.subtotal)} more to this basket for free delivery.
              </p>
            )}
          </Card>
        </aside>
      </div>
    </div>
  );
}
