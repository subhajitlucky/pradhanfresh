import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Ban,
  Check,
  CircleAlert,
  CreditCard,
  MapPin,
  Repeat2,
  ScrollText,
  ShoppingBasket,
  Truck,
  X,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge, ErrorState, LoadingBlock, useToast } from '../../components/ui/Feedback';
import { Card, ProseImage } from '../../components/ui/Surface';
import { Textarea } from '../../components/ui/Field';
import { ApiError } from '../../lib/api';
import { useCart } from '../../lib/cart';
import { errText, useCancelOrder, useOrder } from '../../lib/catalog';
import { cn, formatDate, formatDateTime, moneyExact, orderTone, plural } from '../../lib/format';
import type { Address, Order, OrderStatus, PaymentStatus } from '../../lib/types';

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const FLOW: OrderStatus[] = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
const TERMINAL: OrderStatus[] = ['CANCELLED', 'RETURNED'];

const STEP_NOTE: Record<OrderStatus, string> = {
  PENDING: 'Order received',
  CONFIRMED: 'Confirmed at the counter',
  PROCESSING: 'Picked and packed',
  SHIPPED: 'Out for delivery',
  DELIVERED: 'Handed over',
  CANCELLED: 'Order called off',
  RETURNED: 'Sent back to the yard',
};

const PAYMENT_TONE: Record<PaymentStatus, 'citrus' | 'leaf' | 'ember' | 'paper'> = {
  PENDING: 'citrus',
  COMPLETED: 'leaf',
  FAILED: 'ember',
  REFUNDED: 'paper',
};

/** deliveryAddress arrives parsed, but create-order returns a JSON string. */
function parseAddress(value: Address | string | null | undefined): Partial<Address> | null {
  if (!value) return null;
  if (typeof value === 'object') return Object.keys(value).length ? value : null;
  try {
    const parsed: unknown = JSON.parse(value);
    if (parsed && typeof parsed === 'object') {
      const obj = parsed as Partial<Address>;
      return Object.keys(obj).length ? obj : null;
    }
  } catch {
    // Not JSON at all — fall through and show the raw text.
  }
  return null;
}

function addressLines(a: Partial<Address> | null): string[] {
  if (!a) return [];
  return [
    a.fullName,
    a.addressLine1,
    a.addressLine2,
    [a.city, a.state, a.pincode].filter(Boolean).join(' — '),
    a.phone,
    a.landmark ? `Near ${a.landmark}` : null,
  ].filter((v): v is string => typeof v === 'string' && v.trim().length > 0);
}

function StatusBadge({ order }: { order: Order }) {
  const t = orderTone(order.status);
  const tone =
    order.status === 'DELIVERED'
      ? 'leaf'
      : order.status === 'SHIPPED'
        ? 'paper'
        : order.status === 'PENDING' || order.status === 'CONFIRMED'
          ? 'citrus'
          : 'ember';

  return (
    <Badge tone={tone}>
      <span aria-hidden className={cn('size-1.5 rounded-full', t.dot)} />
      {order.statusInfo?.label ?? order.status}
    </Badge>
  );
}

/* -------------------------------------------------------------------------- */
/*  Status tracker                                                             */
/* -------------------------------------------------------------------------- */

function StatusTracker({ order }: { order: Order }) {
  const stopped = TERMINAL.includes(order.status);
  const reachedIndex = stopped ? FLOW.indexOf('PENDING') : FLOW.indexOf(order.status);
  const reached = reachedIndex < 0 ? 0 : reachedIndex;

  return (
    <div>
      {stopped && (
        <div
          role="status"
          className="mb-6 flex items-start gap-3 rounded-md border border-ember-line bg-ember-soft px-4 py-3.5"
        >
          <Ban className="mt-0.5 size-4 shrink-0 text-bad" aria-hidden />
          <div>
            <p className="font-mono text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-bad">
              {order.status === 'CANCELLED' ? 'Order cancelled' : 'Order returned'}
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-2">
              {order.statusInfo?.description ??
                (order.status === 'CANCELLED'
                  ? 'This order was called off before it shipped. Any payment taken is refunded to the original method.'
                  : 'This order was sent back to the yard. Any payment taken is refunded to the original method.')}
            </p>
          </div>
        </div>
      )}

      <ol className="flex flex-col gap-0 sm:flex-row sm:gap-0" aria-label="Order progress">
        {FLOW.map((step, i) => {
          const done = i < reached;
          const current = i === reached && !stopped;
          const line = i < FLOW.length - 1;

          return (
            <li
              key={step}
              aria-current={current ? 'step' : undefined}
              className="flex flex-1 gap-3 sm:flex-col sm:gap-2.5"
            >
              <div className="flex flex-col items-center sm:flex-row sm:items-center">
                <span
                  aria-hidden
                  className={cn(
                    'grid size-7 shrink-0 place-items-center rounded-full border font-mono text-[0.625rem] font-semibold transition-colors',
                    current
                      ? 'border-ember bg-ember text-paper-card'
                      : done
                        ? 'border-leaf-line bg-leaf-soft text-leaf-deep'
                        : 'border-rule bg-paper-card text-ink-4',
                  )}
                >
                  {done ? <Check className="size-3.5" strokeWidth={2.6} /> : i + 1}
                </span>
                {line && (
                  <span
                    aria-hidden
                    className={cn(
                      'my-1 w-px flex-1 sm:my-0 sm:mx-2 sm:h-px sm:w-auto sm:flex-1',
                      done ? 'bg-leaf-line' : 'bg-rule',
                    )}
                  />
                )}
              </div>

              <div className="pb-6 sm:pb-0 sm:pr-4">
                <p
                  className={cn(
                    'font-mono text-[0.6875rem] uppercase tracking-[0.14em]',
                    current ? 'text-ember' : done ? 'text-ink' : 'text-ink-4',
                  )}
                >
                  {step}
                </p>
                <p
                  className={cn(
                    'mt-1 text-xs leading-snug',
                    current ? 'text-ink-2' : 'text-ink-3',
                  )}
                >
                  {STEP_NOTE[step]}
                </p>
              </div>
            </li>
          );
        })}
      </ol>

      {order.estimatedDelivery && !stopped && order.status !== 'DELIVERED' && (
        <p className="mt-1 flex items-center gap-2 border-t border-rule pt-4 text-sm text-ink-2">
          <Truck className="size-4 shrink-0 text-ink-3" aria-hidden />
          Estimated delivery <span className="font-medium text-ink">{formatDate(order.estimatedDelivery)}</span>
        </p>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Cancel action                                                              */
/* -------------------------------------------------------------------------- */

function CancelBlock({ order }: { order: Order }) {
  const cancel = useCancelOrder();
  const { notify } = useToast();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [broken, setBroken] = useState(false);

  async function onConfirm(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (cancel.isPending) return; // guards a double click while in flight

    setError(null);
    setBroken(false);

    try {
      await cancel.mutateAsync({
        orderNumber: order.orderNumber,
        reason: reason.trim() || undefined,
      });
      setOpen(false);
      setReason('');
      notify(`Order ${order.orderNumber} cancelled.`);
    } catch (err) {
      const message = errText(err, 'We could not cancel that order.');
      setError(message);
      if (err instanceof ApiError && err.status === 500) setBroken(true);
    }
  }

  if (!open) {
    return (
      <div className="rounded-md border border-rule bg-paper-deep px-4 py-4">
        <p className="text-sm leading-relaxed text-ink-2">
          Changed your mind? You can still call this crate off — the market stops picking the moment
          you ask.
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={() => setOpen(true)}
          leftIcon={<X className="size-3.5" aria-hidden />}
        >
          Cancel this order
        </Button>
      </div>
    );
  }

  return (
    <form
      className="rounded-md border border-ember-line bg-ember-soft/50 p-4"
      noValidate
      onSubmit={onConfirm}
    >
      <p className="flex items-center gap-2 font-mono text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-bad">
        <CircleAlert className="size-4 shrink-0" aria-hidden />
        Call off {order.orderNumber}?
      </p>
      <p className="mt-2 text-sm leading-relaxed text-ink-2">
        This cannot be undone from here. Any payment taken is refunded to the original method, and
        the items go back on the shelf for the next customer.
      </p>

      <Textarea
        name="cancel-reason"
        label="Reason (optional)"
        rows={3}
        className="mt-3.5"
        placeholder="Duplicate order, found it cheaper nearby, changed plans…"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
      />

      {error && (
        <p
          role="alert"
          className="mt-3 rounded-md border border-bad/30 bg-paper-card px-3.5 py-2.5 text-sm leading-relaxed text-bad"
        >
          {error}
        </p>
      )}
      {broken && (
        <p className="mt-2 text-xs leading-relaxed text-ink-3">
          Our order service is failing on cancellations right now — this is a fault on our side, not
          something wrong with your order. Nothing has been changed. Write to us at{' '}
          <Link to="/contact" className="wipe font-medium text-ember">
            the market counter
          </Link>{' '}
          and we will cancel it by hand.
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button
          type="submit"
          variant="ember"
          size="sm"
          loading={cancel.isPending}
          disabled={cancel.isPending}
        >
          {cancel.isPending ? 'Calling it off…' : 'Yes, cancel the order'}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={cancel.isPending}
          onClick={() => {
            setOpen(false);
            setReason('');
            setError(null);
            setBroken(false);
          }}
        >
          Keep the order
        </Button>
        <span role="status" aria-live="polite" className="sr-only">
          {cancel.isPending ? 'Cancelling your order.' : ''}
        </span>
      </div>
    </form>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function OrderDetail() {
  const { orderNumber } = useParams();
  const query = useOrder(orderNumber);
  const addToCart = useCart((s) => s.add);
  const { notify } = useToast();
  const [reordering, setReordering] = useState(false);

  async function onReorder() {
    if (reordering || !order) return; // guards a double click while in flight
    setReordering(true);

    let added = 0;
    try {
      for (const item of order.items) {
        await addToCart(item.productId, item.quantity);
        added += 1;
      }
      notify(
        added > 0
          ? `${plural(added, 'line')} added to your basket.`
          : 'There was nothing left to reorder.',
      );
    } catch {
      notify('We could not refill your basket. Please add the items by hand.', 'error');
    } finally {
      setReordering(false);
    }
  }

  if (query.isPending) {
    return (
      <div className="shell py-14 md:py-20">
        <LoadingBlock label="Fetching the receipt" />
      </div>
    );
  }

  if (query.isError || !query.data) {
    const message = errText(query.error, 'We could not fetch that order.');
    const serverFault = query.error instanceof ApiError && query.error.status === 500;

    return (
      <div className="shell py-14 md:py-20">
        <Link
          to="/orders"
          className="inline-flex items-center gap-1.5 font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-ink-3 transition-colors hover:text-ember"
        >
          <ArrowLeft className="size-3.5" aria-hidden />
          Back to the ledger
        </Link>

        <h1 className="mt-6 max-w-2xl text-4xl leading-[1.05] sm:text-5xl">
          This receipt is not on the desk.
        </h1>

        <div className="mt-8 max-w-2xl">
          <ErrorState
            title="Order details unavailable"
            message={message}
            onRetry={() => void query.refetch()}
          />

          {serverFault && (
            <p className="mt-4 rounded-md border border-rule bg-paper-card px-4 py-3.5 text-sm leading-relaxed text-ink-2">
              Our order service is failing to answer right now — a fault on our side, and not
              anything wrong with your order. Your order is safe in the ledger. Try again in a
              moment, or write to us at{' '}
              <Link to="/contact" className="wipe font-medium text-ember">
                the market counter
              </Link>{' '}
              and we will pull the paper copy for you.
            </p>
          )}
        </div>
      </div>
    );
  }

  const order = query.data;
  const summary = order.orderSummary;
  const address = parseAddress(order.deliveryAddress);
  const addressText = address ? null : typeof order.deliveryAddress === 'string' ? order.deliveryAddress : null;
  const canCancel = order.canCancel === true && !TERMINAL.includes(order.status);

  const subtotal = summary?.subtotal ?? order.subtotal;
  const deliveryFee = summary?.deliveryFee ?? order.deliveryFee;
  const tax = summary?.tax ?? order.tax;
  const discount = summary?.discount ?? order.discount;
  const total = summary?.totalAmount ?? order.totalAmount;

  return (
    <div className="shell py-12 md:py-16">
      <Link
        to="/orders"
        className="inline-flex items-center gap-1.5 font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-ink-3 transition-colors hover:text-ember"
      >
        <ArrowLeft className="size-3.5" aria-hidden />
        Back to the ledger
      </Link>

      {/* --- Header -------------------------------------------------------- */}
      <header className="mt-5 flex flex-wrap items-end justify-between gap-5 border-b border-rule pb-6">
        <div>
          <span className="eyebrow">Receipt</span>
          <h1 className="mt-3 font-mono text-3xl tracking-[0.04em] sm:text-4xl">
            {order.orderNumber}
          </h1>
          <p className="mt-2.5 flex flex-wrap items-center gap-2 text-sm text-ink-2">
            <StatusBadge order={order} />
            <span aria-hidden className="text-ink-4">·</span>
            <span>Placed {formatDateTime(order.createdAt)}</span>
            {summary && (
              <>
                <span aria-hidden className="text-ink-4">·</span>
                <span>{plural(summary.totalItems, 'item')}</span>
              </>
            )}
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() => void onReorder()}
          loading={reordering}
          disabled={reordering || order.items.length === 0}
          leftIcon={<Repeat2 className="size-4" aria-hidden />}
        >
          {reordering ? 'Refilling…' : 'Reorder'}
        </Button>
      </header>

      {/* --- Tracker ------------------------------------------------------- */}
      <section className="stagger mt-8" style={{ '--i': 0 } as never} aria-label="Delivery progress">
        <StatusTracker order={order} />
      </section>

      <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-12">
        {/* --- Left: the lines -------------------------------------------- */}
        <section className="min-w-0" aria-labelledby="lines-heading">
          <div className="flex items-baseline justify-between gap-4 border-b border-rule pb-3">
            <h2 id="lines-heading" className="font-mono text-[0.6875rem] font-medium uppercase tracking-[0.18em] text-ink-3">
              What was in the crate
            </h2>
            <span className="font-mono text-[0.6875rem] text-ink-3">
              {plural(order.items.length, 'line')}
            </span>
          </div>

          <ul className="divide-y divide-rule">
            {order.items.map((item, i) => (
              <li
                key={item.id}
                className="stagger flex items-start gap-4 py-4"
                style={{ '--i': i } as never}
              >
                <ProseImage
                  src={item.thumbnail ?? item.product?.thumbnail ?? null}
                  alt={item.productName}
                  className="size-20 shrink-0 rounded-md border border-rule"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-display text-lg leading-snug font-semibold text-ink">
                    {item.productName}
                  </p>
                  {item.productSku && (
                    <p className="mt-1 font-mono text-[0.625rem] uppercase tracking-[0.14em] text-ink-3">
                      SKU {item.productSku}
                    </p>
                  )}
                  <p className="tnum mt-1.5 font-mono text-xs text-ink-2">
                    {moneyExact(item.price)} × {item.quantity}
                    {item.unit ? ` ${item.unit}` : ''}
                  </p>
                </div>
                <p className="tnum shrink-0 font-display text-lg font-semibold text-ink">
                  {moneyExact(item.subtotal)}
                </p>
              </li>
            ))}
          </ul>

          {/* --- Notes ---------------------------------------------------- */}
          {(order.orderNotes || order.adminNotes) && (
            <Card className="mt-6 p-5">
              <p className="flex items-center gap-2 font-mono text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-ink-3">
                <ScrollText className="size-3.5" aria-hidden />
                Notes
              </p>
              {order.orderNotes && (
                <p className="mt-3 text-sm leading-relaxed text-ink-2">
                  <span className="font-medium text-ink">Your note:</span> {order.orderNotes}
                </p>
              )}
              {order.adminNotes && (
                <p className="mt-2 text-sm leading-relaxed text-ink-2">
                  <span className="font-medium text-ink">From the market:</span> {order.adminNotes}
                </p>
              )}
            </Card>
          )}

          {/* --- Cancel --------------------------------------------------- */}
          {canCancel && (
            <div className="mt-8">
              <CancelBlock order={order} />
            </div>
          )}

          {order.canReturn && (
            <p className="mt-8 flex items-start gap-2.5 rounded-md border border-rule bg-paper-deep px-4 py-3.5 text-sm leading-relaxed text-ink-2">
              <ShoppingBasket className="mt-0.5 size-4 shrink-0 text-ink-3" aria-hidden />
              This order has landed, so it can be returned. Write to us at{' '}
              <Link to="/contact" className="wipe font-medium text-ember">
                the market counter
              </Link>{' '}
              with the order number and we will arrange the pickup.
            </p>
          )}
        </section>

        {/* --- Right: the ledger ----------------------------------------- */}
        <aside className="min-w-0 space-y-6">
          <Card className="p-5">
            <h2 className="font-mono text-[0.6875rem] font-medium uppercase tracking-[0.18em] text-ink-3">
              Bill
            </h2>
            <dl className="mt-4 space-y-2 font-mono text-sm">
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-ink-2">Subtotal</dt>
                <dd className="tnum text-ink">{moneyExact(subtotal)}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-ink-2">Delivery</dt>
                <dd className={cn('tnum', deliveryFee > 0 ? 'text-ink' : 'text-leaf')}>
                  {deliveryFee > 0 ? moneyExact(deliveryFee) : 'Free'}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-ink-2">GST</dt>
                <dd className="tnum text-ink">{moneyExact(tax)}</dd>
              </div>
              {discount > 0 && (
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-ink-2">Discount</dt>
                  <dd className="tnum text-ember">− {moneyExact(discount)}</dd>
                </div>
              )}
              <div className="flex items-baseline justify-between gap-4 border-t border-rule pt-3 text-base">
                <dt className="font-display text-lg font-semibold text-ink">Total</dt>
                <dd className="tnum font-display text-lg font-semibold text-ink">
                  {moneyExact(total)}
                </dd>
              </div>
            </dl>

            <div className="mt-5 space-y-2.5 border-t border-rule pt-4">
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-1.5 font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-ink-3">
                  <CreditCard className="size-3.5" aria-hidden />
                  Payment
                </span>
                <span className="font-mono text-xs text-ink">{order.paymentMethod}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-ink-3">
                  Status
                </span>
                <Badge tone={PAYMENT_TONE[order.paymentStatus]} dot>
                  {order.paymentStatus}
                </Badge>
              </div>
              {order.paymentId && (
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-ink-3">
                    Reference
                  </span>
                  <span className="truncate font-mono text-xs text-ink-2">{order.paymentId}</span>
                </div>
              )}
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="flex items-center gap-2 font-mono text-[0.6875rem] font-medium uppercase tracking-[0.18em] text-ink-3">
              <MapPin className="size-3.5" aria-hidden />
              Delivering to
            </h2>
            {address ? (
              <address className="mt-3.5 space-y-0.5 text-sm not-italic leading-relaxed text-ink-2">
                {addressLines(address).map((line, i) => (
                  <span key={`${line}-${i}`} className="block">
                    {line}
                  </span>
                ))}
              </address>
            ) : addressText ? (
              <p className="mt-3.5 text-sm leading-relaxed text-ink-2">{addressText}</p>
            ) : (
              <p className="mt-3.5 text-sm leading-relaxed text-ink-3">
                No address was filed against this order.
              </p>
            )}

            {order.deliverySlot && (
              <p className="mt-3.5 border-t border-rule pt-3 font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-ink-3">
                Slot <span className="text-ink">{order.deliverySlot.toLowerCase()}</span>
              </p>
            )}
          </Card>

          <div className="grid gap-2">
            <Button to="/products" variant="ink" full>
              Back to the harvest
            </Button>
            <Button to="/orders" variant="ghost" full>
              All your orders
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}