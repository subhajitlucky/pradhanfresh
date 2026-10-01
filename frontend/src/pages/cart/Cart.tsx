import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight, ShoppingBasket, Trash2, Truck } from 'lucide-react';
import { Button, IconButton } from '../../components/ui/Button';
import {
  Badge,
  EmptyState,
  LoadingBlock,
  Spinner,
  useToast,
} from '../../components/ui/Feedback';
import { Card, Meter, PriceTag, ProseImage, QtyStepper } from '../../components/ui/Surface';
import { FREE_DELIVERY_AT, DELIVERY_FEE, TAX_RATE, orderEstimate, useCart } from '../../lib/cart';
import { errText } from '../../lib/catalog';
import { cn, money, moneyExact, plural } from '../../lib/format';

/* -------------------------------------------------------------------------- */
/*  Line item                                                                  */
/* -------------------------------------------------------------------------- */

function LineItem({
  productId,
  name,
  thumbnail,
  unit,
  price,
  subtotal,
  quantity,
  max,
  hasStockIssue,
  busy,
  onQuantity,
  onRemove,
  index,
}: {
  productId: number;
  name: string;
  thumbnail: string;
  unit: string;
  price: number;
  subtotal: number;
  quantity: number;
  max: number;
  hasStockIssue: boolean;
  busy: boolean;
  onQuantity: (q: number) => void;
  onRemove: () => void;
  index: number;
}) {
  return (
    <li
      className={cn(
        'stagger grid gap-4 py-6 transition-opacity duration-200 sm:grid-cols-[7rem_minmax(0,1fr)]',
        busy && 'opacity-60',
      )}
      style={{ '--i': index } as never}
    >
      <ProseImage
        src={thumbnail}
        alt={name}
        className="h-32 w-full rounded-md border border-rule sm:h-36"
      />

      <div className="flex min-w-0 flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-lg leading-tight">
              <Link to={`/products/${productId}`} className="wipe transition-colors hover:text-ember">
                {name}
              </Link>
            </h3>
            <p className="tnum mt-1 font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-ink-3">
              {money(price)} / {unit}
            </p>
          </div>
          <IconButton
            label={`Remove ${name} from basket`}
            tone="paper"
            size="sm"
            disabled={busy}
            onClick={onRemove}
            className="shrink-0"
          >
            <Trash2 className="size-3.5" aria-hidden />
          </IconButton>
        </div>

        {hasStockIssue && (
          <p className="inline-flex items-center gap-1.5 text-xs font-medium text-bad">
            <AlertTriangle className="size-3.5" aria-hidden />
            Stock changed for this item — quantity was adjusted.
          </p>
        )}

        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-3">
            <QtyStepper
              value={quantity}
              onChange={onQuantity}
              min={1}
              max={max}
              disabled={busy}
              label={`Quantity of ${name}`}
            />
            {busy && <Spinner className="text-ember" label="Saving" />}
          </div>
          <p className="tnum font-display text-xl font-semibold text-ink">{money(subtotal)}</p>
        </div>
      </div>
    </li>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function Cart() {
  const ready = useCart((s) => s.ready);
  const items = useCart((s) => s.items);
  const itemsCount = useCart((s) => s.itemsCount);
  const warnings = useCart((s) => s.warnings);
  const pending = useCart((s) => s.pending);
  const setQuantity = useCart((s) => s.setQuantity);
  const remove = useCart((s) => s.remove);
  const clear = useCart((s) => s.clear);
  const { notify } = useToast();

  const [confirmClear, setConfirmClear] = useState(false);
  const [clearing, setClearing] = useState(false);

  const est = orderEstimate(items);
  const remaining = Math.max(0, FREE_DELIVERY_AT - est.subtotal);
  const freeDelivery = est.subtotal >= FREE_DELIVERY_AT;

  const changeQty = async (itemId: number, name: string, q: number) => {
    try {
      await setQuantity(itemId, q);
    } catch (err) {
      notify(errText(err, `Could not update ${name}.`), 'error');
    }
  };

  const drop = async (itemId: number, name: string) => {
    try {
      await remove(itemId);
      notify(`Removed ${name}`);
    } catch (err) {
      notify(errText(err, `Could not remove ${name}.`), 'error');
    }
  };

  const emptyBasket = async () => {
    setClearing(true);
    try {
      await clear();
      setConfirmClear(false);
      notify('Basket cleared');
    } catch (err) {
      notify(errText(err, 'Could not clear the basket.'), 'error');
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="shell py-10 md:py-14">
      <header className="stagger" style={{ '--i': 0 } as never}>
        <span className="eyebrow">Today’s run</span>
        <h1 className="mt-3 text-3xl leading-[1.05] md:text-4xl">Your basket</h1>
        <p
          role="status"
          aria-live="polite"
          className="mt-2.5 font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-ink-3"
        >
          {ready
            ? itemsCount > 0
              ? `${plural(itemsCount, 'item')} · ${money(est.total)} before you check out`
              : 'Nothing in the basket yet'
            : 'Reading your basket…'}
        </p>
      </header>

      {!ready ? (
        <LoadingBlock label="Fetching your basket" />
      ) : items.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            icon={<ShoppingBasket className="size-6" aria-hidden />}
            title="Your basket is empty"
            body="Nothing on the scale yet. This morning’s harvest is waiting at the stall."
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
      ) : (
        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_21rem] lg:gap-12">
          {/* Line items ------------------------------------------------- */}
          <div>
            {warnings.length > 0 && (
              <div
                role="alert"
                className="mb-6 flex items-start gap-3 rounded-lg border border-citrus-line bg-citrus-soft px-4 py-3.5"
              >
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warn" aria-hidden />
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-ink">Some stock changed</p>
                  <ul className="space-y-0.5">
                    {warnings.map((w) => (
                      <li key={w} className="text-sm text-ink-2">
                        {w}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            <ul className="divide-y divide-rule border-y border-rule">
              {items.map((item, i) => (
                <LineItem
                  key={item.id}
                  productId={item.productId}
                  name={item.product.name}
                  thumbnail={item.product.thumbnail}
                  unit={item.product.unit}
                  price={item.price}
                  subtotal={item.subtotal}
                  quantity={item.quantity}
                  max={Math.max(1, Math.min(99, item.stockAvailable ?? item.product.stock ?? 99))}
                  hasStockIssue={!!item.hasStockIssue}
                  busy={pending.has(item.id)}
                  index={i}
                  onQuantity={(q) => void changeQty(item.id, item.product.name, q)}
                  onRemove={() => void drop(item.id, item.product.name)}
                />
              ))}
            </ul>

            {/* Clear basket — inline two-step confirm --------------------- */}
            <div className="mt-6 flex flex-wrap items-center gap-2">
              {confirmClear ? (
                <>
                  <span className="text-sm text-ink-2">Empty the whole basket?</span>
                  <Button
                    variant="ember"
                    size="sm"
                    loading={clearing}
                    onClick={() => void emptyBasket()}
                  >
                    Yes, clear it
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setConfirmClear(false)}>
                    Keep my items
                  </Button>
                </>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={<Trash2 className="size-3.5" aria-hidden />}
                  onClick={() => setConfirmClear(true)}
                >
                  Clear basket
                </Button>
              )}
              <Button
                to="/products"
                variant="ghost"
                size="sm"
                rightIcon={<ArrowRight className="size-3.5" aria-hidden />}
                className="ml-auto"
              >
                Keep shopping
              </Button>
            </div>
          </div>

          {/* Summary ----------------------------------------------------- */}
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <h2 className="sr-only">Order summary</h2>
            <Card className="p-6">
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-ink-3">
                  Summary
                </span>
                <Badge tone="paper">{plural(itemsCount, 'item')}</Badge>
              </div>

              <div className="mt-5">
                {freeDelivery ? (
                  <p className="flex items-center gap-2 text-sm font-medium text-leaf">
                    <Truck className="size-4" aria-hidden />
                    Free delivery unlocked
                  </p>
                ) : (
                  <p className="flex items-center gap-2 text-sm text-ink-2">
                    <Truck className="size-4" aria-hidden />
                    <span>
                      <span className="font-medium text-ember">{money(remaining)}</span> more for
                      free delivery
                    </span>
                  </p>
                )}
                <div className="mt-2.5">
                  <Meter
                    value={Math.min(est.subtotal, FREE_DELIVERY_AT)}
                    max={FREE_DELIVERY_AT}
                    tone={freeDelivery ? 'leaf' : 'ember'}
                    label="Progress toward free delivery"
                  />
                </div>
              </div>

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

              <p className="mt-2 text-xs text-ink-3">
                Delivery is {money(DELIVERY_FEE)} below {money(FREE_DELIVERY_AT)}. Tax is 18% GST.
              </p>

              <div className="mt-6 grid gap-2">
                <Button
                  to="/checkout"
                  variant="ember"
                  size="lg"
                  full
                  rightIcon={<ArrowRight className="size-4" aria-hidden />}
                >
                  Checkout · {money(est.total)}
                </Button>
                <Button to="/products" variant="outline" size="md" full>
                  Add more produce
                </Button>
              </div>
            </Card>
          </aside>
        </div>
      )}
    </div>
  );
}
