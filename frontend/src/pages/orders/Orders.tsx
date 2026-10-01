import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarClock, Package, ReceiptIndianRupee } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge, EmptyState, ErrorState, LoadingBlock } from '../../components/ui/Feedback';
import { Pagination, SectionHeading } from '../../components/ui/Surface';
import { errText, useOrders } from '../../lib/catalog';
import { cn, formatDate, money, orderTone, plural } from '../../lib/format';
import type { OrderStatus } from '../../lib/types';

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const STATUSES: OrderStatus[] = [
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
  'RETURNED',
];

const STATUS_HINT: Record<OrderStatus, string> = {
  PENDING: 'Awaiting confirmation',
  CONFIRMED: 'Confirmed at the counter',
  PROCESSING: 'Being picked and packed',
  SHIPPED: 'On the way to you',
  DELIVERED: 'Landed',
  CANCELLED: 'Called off',
  RETURNED: 'Sent back',
};

/** The badge is the shared primitive; orderTone supplies its printed dot. */
function StatusBadge({ status, label }: { status: OrderStatus; label?: string }) {
  const t = orderTone(status);
  const tone =
    status === 'DELIVERED'
      ? 'leaf'
      : status === 'SHIPPED'
        ? 'paper'
        : status === 'PENDING' || status === 'CONFIRMED'
          ? 'citrus'
          : 'ember';

  return (
    <Badge tone={tone}>
      <span aria-hidden className={cn('size-1.5 rounded-full', t.dot)} />
      {label ?? status}
    </Badge>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function Orders() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<OrderStatus | ''>('');

  const query = useOrders(page, status);
  const orders = query.data?.data ?? [];
  const pagination = query.data?.pagination;
  const total = pagination?.totalOrders ?? 0;

  function pickStatus(next: OrderStatus | '') {
    setStatus(next);
    setPage(1); // a new filter always starts at the top of the ledger
  }

  return (
    <div className="shell py-12 md:py-16">
      <SectionHeading
        as="h1"
        eyebrow="Order ledger"
        title="Everything we have carried for you."
        lede="Each line is one delivery — weighed, dated and signed for at the counter. Open any row to see the full receipt."
        action={
          <Button to="/products" variant="ink" rightIcon={<ArrowRight className="size-4" aria-hidden />}>
            Browse the harvest
          </Button>
        }
      />

      {/* --- Status filter ------------------------------------------------- */}
      <div className="mt-9">
        <div
          role="group"
          aria-label="Filter orders by status"
          className="no-bar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1"
        >
          <button
            type="button"
            onClick={() => pickStatus('')}
            aria-pressed={status === ''}
            className={cn(
              'h-9 shrink-0 rounded-full border px-4 font-mono text-[0.6875rem] uppercase tracking-[0.14em] transition-colors',
              status === ''
                ? 'border-ink bg-ink text-paper'
                : 'border-rule bg-paper-card text-ink-2 hover:border-ink hover:text-ink',
            )}
          >
            All
          </button>
          {STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => pickStatus(s)}
              aria-pressed={status === s}
              className={cn(
                'h-9 shrink-0 rounded-full border px-4 font-mono text-[0.6875rem] uppercase tracking-[0.14em] transition-colors',
                status === s
                  ? 'border-ink bg-ink text-paper'
                  : 'border-rule bg-paper-card text-ink-2 hover:border-ink hover:text-ink',
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* --- Count + live status ------------------------------------------- */}
      <div className="mt-6 flex flex-wrap items-baseline justify-between gap-3 border-b border-rule pb-3">
        <h2 className="font-mono text-[0.6875rem] font-medium uppercase tracking-[0.18em] text-ink-3">
          {query.isSuccess
            ? `${plural(total, 'order')} on file${status ? ` · ${status.toLowerCase()}` : ''}`
            : 'Reading the ledger…'}
        </h2>
        <p role="status" aria-live="polite" className="text-xs text-ink-3">
          {query.isFetching && !query.isPending ? 'Refreshing…' : ''}
        </p>
      </div>

      {/* --- Body ----------------------------------------------------------- */}
      <div className="mt-6">
        {query.isPending && <LoadingBlock label="Opening your order ledger" />}

        {query.isError && (
          <ErrorState
            title="The ledger would not open"
            message={errText(query.error, 'We could not load your orders just now.')}
            onRetry={() => void query.refetch()}
          />
        )}

        {query.isSuccess && orders.length === 0 && (
          <EmptyState
            icon={<Package className="size-6" aria-hidden />}
            title={status ? `No ${status.toLowerCase()} orders` : 'Nothing on the ledger yet'}
            body={
              status
                ? 'Nothing sits in this column of the book. Try another status, or clear the filter to see everything.'
                : 'Place your first order and it will be dated, weighed and filed here.'
            }
            action={
              status ? (
                <Button variant="outline" onClick={() => pickStatus('')}>
                  Clear the filter
                </Button>
              ) : (
                <Button to="/products" variant="ink">
                  Browse the harvest
                </Button>
              )
            }
          />
        )}

        {query.isSuccess && orders.length > 0 && (
          <ul className="space-y-2.5">
            {orders.map((o, i) => {
              const units = o.items.reduce((n, it) => n + it.quantity, 0);
              return (
                <li key={o.id} className="stagger" style={{ '--i': i } as never}>
                  <Link
                    to={`/orders/${o.orderNumber}`}
                    className="group block rounded-lg border border-rule bg-paper-card transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-0.5 hover:border-ink hover:shadow-lift"
                  >
                    {/* Ledger header strip */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rule-soft px-4 py-2.5 sm:px-5">
                      <span className="font-mono text-xs tracking-[0.06em] text-ink">
                        {o.orderNumber}
                      </span>
                      <span className="flex items-center gap-1.5 font-mono text-[0.6875rem] text-ink-3">
                        <CalendarClock className="size-3.5" aria-hidden />
                        <span className="tnum">{formatDate(o.createdAt)}</span>
                      </span>
                    </div>

                    {/* Ledger body */}
                    <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-5">
                      <div className="min-w-0 flex-1">
                        <p className="flex flex-wrap items-center gap-2">
                          <StatusBadge status={o.status} label={o.statusInfo?.label} />
                          <span className="text-xs text-ink-3">{STATUS_HINT[o.status]}</span>
                        </p>
                        <p className="mt-2 text-sm leading-relaxed text-ink-2">
                          {plural(units, 'item')}
                          <span aria-hidden className="px-1.5 text-ink-4">
                            ·
                          </span>
                          {o.items.length > 0
                            ? o.items
                                .slice(0, 2)
                                .map((it) => it.productName)
                                .join(', ') + (o.items.length > 2 ? ` +${o.items.length - 2} more` : '')
                            : 'No line items recorded'}
                        </p>
                        <p className="mt-1.5 flex items-center gap-1.5 font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-ink-3">
                          <ReceiptIndianRupee className="size-3.5" aria-hidden />
                          <span className="tnum">{money(o.totalAmount)}</span>
                          <span aria-hidden className="text-ink-4">
                            ·
                          </span>
                          <span>{o.paymentMethod}</span>
                        </p>
                      </div>

                      <span
                        aria-hidden
                        className="flex shrink-0 items-center gap-1.5 font-mono text-[0.625rem] uppercase tracking-[0.16em] text-ink-3 transition-colors group-hover:text-ember"
                      >
                        Open
                        <ArrowRight className="size-3.5" />
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* --- Pagination ------------------------------------------------------ */}
      {query.isSuccess && orders.length > 0 && pagination && (
        <div className="mt-9 flex flex-col items-center gap-3">
          <Pagination page={page} totalPages={pagination.totalPages} onChange={setPage} />
          <p className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-ink-3">
            Page <span className="tnum">{pagination.currentPage}</span> of{' '}
            <span className="tnum">{pagination.totalPages}</span>
          </p>
        </div>
      )}
    </div>
  );
}