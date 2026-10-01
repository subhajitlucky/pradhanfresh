/* ==========================================================================
   PRADHANFRESH — OPERATIONS DESK
   The admin shell: Overview · Inventory · Orders, all inside one component
   because /admin, /admin/products and /admin/categories all resolve here.
   Same paper-and-ink identity as the shop, printed denser.
   ========================================================================== */

import { useEffect, useMemo, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Boxes,
  LayoutDashboard,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShoppingBasket,
  Trash2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button, IconButton } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Field';
import {
  Badge,
  EmptyState,
  ErrorState,
  LoadingBlock,
  Spinner,
  useToast,
} from '../../components/ui/Feedback';
import {
  Card,
  Meter,
  Pagination,
  PriceTag,
  ProseImage,
  Stat,
} from '../../components/ui/Surface';
import { ApiError } from '../../lib/api';
import {
  errText,
  useAdminProducts,
  useAdminStats,
  useDeleteProduct,
  useLowStock,
  useOrders,
  useUpdateOrderStatus,
} from '../../lib/catalog';
import { cn, formatDate, money, orderTone, plural, relativeDay } from '../../lib/format';
import type { AdminStats, Order, OrderStatus, Product } from '../../lib/types';

/* -------------------------------------------------------------------------- */
/*  Shell                                                                      */
/* -------------------------------------------------------------------------- */

type AdminTab = 'overview' | 'inventory' | 'orders';

type BadgeTone = 'ink' | 'ember' | 'leaf' | 'citrus' | 'paper';

const TABS: ReadonlyArray<{ id: AdminTab; label: string; Icon: LucideIcon }> = [
  { id: 'overview', label: 'Overview', Icon: LayoutDashboard },
  { id: 'inventory', label: 'Inventory', Icon: Boxes },
  { id: 'orders', label: 'Orders', Icon: ShoppingBasket },
];

/** The ledger is mounted at three URLs — open the right drawer for each. */
function tabFromPath(pathname: string): AdminTab {
  if (pathname.startsWith('/admin/categories') || pathname.startsWith('/admin/products')) {
    return 'inventory';
  }
  if (pathname.startsWith('/admin/orders')) return 'orders';
  return 'overview';
}

/* -------------------------------------------------------------------------- */
/*  Order status — the server enforces these, the menu never offers more       */
/* -------------------------------------------------------------------------- */

const NEXT_STATUS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED', 'RETURNED'],
  DELIVERED: ['RETURNED'],
  CANCELLED: [],
  RETURNED: [],
};

const ALL_STATUSES: OrderStatus[] = [
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
  'RETURNED',
];

const STATUS_FILTER: Array<{ value: OrderStatus | ''; label: string }> = [
  { value: '', label: 'Every status' },
  ...ALL_STATUSES.map((s) => ({ value: s as OrderStatus | '', label: titleCase(s) })),
];

function titleCase(value: string): string {
  return value.charAt(0) + value.slice(1).toLowerCase();
}

/** orderTone() picks the family; <Badge> does the printing. */
function statusBadgeTone(status: string): BadgeTone {
  const { fg } = orderTone(status);
  if (fg === 'text-ok') return 'leaf';
  if (fg === 'text-bad' || fg === 'text-ember') return 'ember';
  if (fg === 'text-ink') return 'paper';
  return 'citrus';
}

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge tone={statusBadgeTone(status)} dot>
      {status}
    </Badge>
  );
}

/* -------------------------------------------------------------------------- */
/*  Stock                                                                      */
/* -------------------------------------------------------------------------- */

type StockState = { label: string; tone: BadgeTone; meter: 'ember' | 'citrus' | 'leaf' };

function stockState(stock: number): StockState {
  if (!Number.isFinite(stock) || stock <= 0) {
    return { label: 'Sold out', tone: 'ember', meter: 'ember' };
  }
  if (stock <= 10) return { label: 'Low', tone: 'citrus', meter: 'citrus' };
  return { label: 'In stock', tone: 'leaf', meter: 'leaf' };
}

function stockNumber(stock: number | undefined | null): number {
  return typeof stock === 'number' && Number.isFinite(stock) ? stock : 0;
}

/* -------------------------------------------------------------------------- */
/*  API shapes that are richer than the shared types                            */
/* -------------------------------------------------------------------------- */

/** GET /admin/dashboard/stats includes `user` on each recent order. */
interface RecentOrder extends Order {
  user?: { name?: string | null; email?: string | null } | null;
}

/**
 * `AdminStats.topProduce` is typed as `{ totalSold, revenue }`, but the live
 * route aggregates Prisma's `orderItem.quantity` / `.subtotal` and sends those
 * names instead. Both are optional here so the column is never blank.
 */
interface ProduceRow {
  productId: number;
  productName: string;
  _sum: {
    totalSold?: number;
    revenue?: number;
    quantity?: number;
    subtotal?: number;
  };
}

function produceUnits(row: ProduceRow): number {
  return row._sum.totalSold ?? row._sum.quantity ?? 0;
}

function produceRevenue(row: ProduceRow): number {
  return row._sum.revenue ?? row._sum.subtotal ?? 0;
}

function customerName(order: RecentOrder): string {
  const name = order.user?.name?.trim();
  if (name) return name;
  const email = order.user?.email?.trim();
  return email || 'Guest customer';
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function AdminDashboard() {
  const { pathname } = useLocation();
  const [tab, setTab] = useState<AdminTab>(() => tabFromPath(pathname));

  // A deep link or a back-navigation re-opens the matching drawer.
  useEffect(() => {
    setTab(tabFromPath(pathname));
  }, [pathname]);

  const onTabKey = (event: KeyboardEvent<HTMLButtonElement>) => {
    const i = TABS.findIndex((t) => t.id === tab);
    let next = -1;
    if (event.key === 'ArrowRight') next = (i + 1) % TABS.length;
    else if (event.key === 'ArrowLeft') next = (i - 1 + TABS.length) % TABS.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = TABS.length - 1;
    if (next < 0) return;
    event.preventDefault();
    setTab(TABS[next].id);
    document.getElementById(`ledger-tab-${TABS[next].id}`)?.focus();
  };

  return (
    <div className="pb-20">
      {/* ---- Masthead ---------------------------------------------------- */}
      <header className="border-b border-rule bg-paper-card/70">
        <div className="shell py-8 md:py-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="min-w-0">
              <span className="eyebrow">Operations desk · Est. 1974, Pune</span>
              <h1 className="mt-3 text-4xl leading-[1.02] md:text-5xl">The counter ledger</h1>
              <p className="mt-2.5 max-w-xl text-sm leading-relaxed text-ink-2">
                Crates in, crates out, takings in between. Everything on this page is read
                live from the market floor — nothing here is a placeholder figure.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2.5">
              <Button
                to="/admin/products/new"
                variant="ember"
                size="sm"
                leftIcon={<Plus className="size-4" aria-hidden />}
              >
                New product
              </Button>
            </div>
          </div>

          {/* ---- Sub-navigation ------------------------------------------- */}
          <div
            role="tablist"
            aria-label="Admin sections"
            className="mt-8 flex gap-1 overflow-x-auto border-b border-rule no-bar"
          >
            {TABS.map(({ id, label, Icon }) => {
              const selected = tab === id;
              return (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  id={`ledger-tab-${id}`}
                  aria-selected={selected}
                  aria-controls={`ledger-panel-${id}`}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => setTab(id)}
                  onKeyDown={onTabKey}
                  className={cn(
                    'relative -mb-px flex shrink-0 items-center gap-2 border-b-2 px-4 py-3',
                    'font-mono text-[0.6875rem] font-medium uppercase tracking-[0.18em] transition-colors duration-200',
                    selected
                      ? 'border-ember text-ember'
                      : 'border-transparent text-ink-3 hover:border-rule hover:text-ink',
                  )}
                >
                  <Icon className="size-4" aria-hidden />
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <div
        role="tabpanel"
        id={`ledger-panel-${tab}`}
        aria-labelledby={`ledger-tab-${tab}`}
        tabIndex={0}
        className="shell pt-10 outline-none"
      >
        {tab === 'overview' && <OverviewTab />}
        {tab === 'inventory' && <InventoryTab />}
        {tab === 'orders' && <OrdersTab />}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Overview                                                                   */
/* -------------------------------------------------------------------------- */

function OverviewTab() {
  const stats = useAdminStats();

  if (stats.isPending) return <LoadingBlock label="Reading the ledger" />;
  if (stats.isError) {
    return (
      <ErrorState
        title="The ledger would not open"
        message={errText(stats.error, 'We could not load the dashboard figures.')}
        onRetry={() => void stats.refetch()}
      />
    );
  }

  const data = stats.data;
  const recentOrders: RecentOrder[] = data?.recentOrders ?? [];
  const produce: ProduceRow[] = data?.topProduce ?? [];

  const revenue = data?.totalRevenue ?? 0;
  const orders = data?.totalOrders ?? 0;
  const customers = data?.totalCustomers ?? 0;
  // Revenue counts DELIVERED orders only, so this is a conservative ratio.
  const averageOrderValue = orders > 0 ? revenue / orders : 0;

  return (
    <div className="space-y-12">
      {/* ---- Figures ---------------------------------------------------- */}
      <section aria-labelledby="figures-heading">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 id="figures-heading" className="text-2xl">
            Where the day stands
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void stats.refetch()}
            loading={stats.isFetching}
            leftIcon={<RefreshCw className="size-4" aria-hidden />}
          >
            Refresh figures
          </Button>
        </div>

        {/* Hairline dividers instead of cards — a printed tally strip. */}
        <div className="mt-5 grid gap-px overflow-hidden rounded-lg border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Revenue delivered', value: money(revenue), note: 'Delivered orders only', tone: 'ember' as const },
            { label: 'Orders on the book', value: orders.toLocaleString('en-IN'), note: 'Every status counted', tone: 'ink' as const },
            { label: 'Registered customers', value: customers.toLocaleString('en-IN'), note: 'Shopper accounts', tone: 'leaf' as const },
            {
              label: 'Average order value',
              value: money(averageOrderValue),
              note: orders > 0 ? 'Revenue ÷ all orders' : 'No orders yet',
              tone: 'citrus' as const,
            },
          ].map((s, i) => (
            <div key={s.label} className="bg-paper-card p-5">
              <Stat label={s.label} value={s.value} note={s.note} tone={s.tone} index={i} />
            </div>
          ))}
        </div>
      </section>

      {/* ---- Sales + top produce --------------------------------------- */}
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <section aria-labelledby="sales-heading">
          <h2 id="sales-heading" className="text-2xl">
            Takings, day by day
          </h2>
          <Card className="mt-5 p-5 md:p-6">
            {data && data.salesData.length > 0 ? (
              <SalesChart series={data.salesData} />
            ) : (
              <EmptyState
                icon={<ShoppingBasket className="size-6" aria-hidden />}
                title="No delivered sales in the last seven days"
                body="The chart fills in as soon as orders reach DELIVERED. Nothing to plot yet."
              />
            )}
          </Card>
        </section>

        <section aria-labelledby="produce-heading">
          <h2 id="produce-heading" className="text-2xl">
            Best moving produce
          </h2>
          <Card className="mt-5 p-5">
            {produce.length > 0 ? (
              <TopProduce rows={produce} />
            ) : (
              <EmptyState
                icon={<Boxes className="size-6" aria-hidden />}
                title="Nothing sold yet"
                body="Once crates start moving, the five best sellers land here."
              />
            )}
          </Card>
        </section>
      </div>

      {/* ---- Recent orders ---------------------------------------------- */}
      <section aria-labelledby="recent-heading">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 id="recent-heading" className="text-2xl">
            Latest orders
          </h2>
          <p className="font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-ink-3">
            {plural(recentOrders.length, 'order')} on the counter
          </p>
        </div>
        <div className="mt-5">
          {recentOrders.length > 0 ? (
            <RecentOrdersTable orders={recentOrders} />
          ) : (
            <EmptyState
              icon={<ShoppingBasket className="size-6" aria-hidden />}
              title="No orders yet"
              body="The ten most recent orders will be printed here as they come in."
            />
          )}
        </div>
      </section>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Hand-rolled SVG chart — no chart library, no extra dependency                */
/* -------------------------------------------------------------------------- */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** salesData dates arrive as YYYY-MM-DD; parse them without a timezone shift. */
function shortDay(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  const month = MONTHS[Number(m[2]) - 1];
  return month ? `${Number(m[3])} ${month}` : iso;
}

function SalesChart({ series }: { series: AdminStats['salesData'] }) {
  const W = 760;
  const H = 200;
  const padX = 8;
  const padTop = 10;
  const padBottom = 8;
  const innerH = H - padTop - padBottom;

  const points = series.map((d) => ({ ...d, sales: Number.isFinite(d.sales) ? d.sales : 0 }));
  const peak = Math.max(1, ...points.map((d) => d.sales));
  const step = (W - padX * 2) / points.length;
  const barW = Math.max(6, Math.min(48, step - 14));
  const gutter = `${(padX / W) * 100}%`;

  const total = points.reduce((sum, d) => sum + d.sales, 0);
  const best = points.reduce((b, d) => (d.sales > b.sales ? d : b), points[0]);
  const dayCount = new Set(points.map((d) => d.date)).size;
  const labelEvery = Math.max(1, Math.ceil(points.length / 7));

  const y = (value: number) => padTop + innerH - (value / peak) * innerH;

  return (
    <figure className="m-0">
      <div
        role="img"
        aria-label={`Bar chart of delivered sales across ${plural(dayCount, 'day')}, totalling ${money(total)}. The best day was ${shortDay(best.date)} at ${money(best.sales)}.`}
        className="relative"
      >
        <span
          aria-hidden
          className="tnum absolute right-0 top-0 font-mono text-[0.625rem] uppercase tracking-[0.12em] text-ink-4"
        >
          {money(peak)}
        </span>
        <svg viewBox={`0 0 ${W} ${H}`} aria-hidden focusable="false" className="h-auto w-full">
          {[0, 0.5, 1].map((t) => (
            <line
              key={t}
              x1={padX}
              x2={W - padX}
              y1={y(peak * t)}
              y2={y(peak * t)}
              className="stroke-rule"
              strokeWidth={1}
              strokeDasharray={t === 0 ? '0' : '3 5'}
            />
          ))}
          {points.map((d, i) => {
            const x = padX + step * i + (step - barW) / 2;
            const top = y(d.sales);
            return (
              <g key={`${d.date}-${i}`}>
                <title>{`${d.date} · ${money(d.sales)}`}</title>
                <rect
                  x={x}
                  y={top}
                  width={barW}
                  height={Math.max(d.sales > 0 ? 2 : 0, padTop + innerH - top)}
                  rx={2}
                  className="fill-ember transition-[fill] duration-200 hover:fill-ember-deep"
                />
              </g>
            );
          })}
        </svg>
        {/* X labels as HTML so they stay legible at every width. */}
        <div className="mt-2 flex" style={{ marginLeft: gutter, marginRight: gutter }}>
          {points.map((d, i) => (
            <span
              key={`${d.date}-label`}
              className="flex-1 text-center font-mono text-[0.625rem] uppercase tracking-[0.1em] text-ink-3"
            >
              {i % labelEvery === 0 ? shortDay(d.date) : ''}
            </span>
          ))}
        </div>
      </div>

      <figcaption className="mt-4 flex flex-col gap-1 border-t border-rule pt-3 text-xs leading-relaxed text-ink-3 sm:flex-row sm:items-baseline sm:justify-between">
        <span>Delivered sales, last seven days.</span>
        <span className="tnum font-mono uppercase tracking-[0.12em]">
          <span className="text-ink">{money(total)}</span> across {plural(dayCount, 'day')} · peak{' '}
          {money(best.sales)}
        </span>
      </figcaption>

      <table className="sr-only">
        <caption>Delivered sales by day, last seven days</caption>
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">Sales</th>
          </tr>
        </thead>
        <tbody>
          {points.map((d) => (
            <tr key={`${d.date}-row`}>
              <th scope="row">{d.date}</th>
              <td>{money(d.sales)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

/* -------------------------------------------------------------------------- */
/*  Top produce                                                                */
/* -------------------------------------------------------------------------- */

function TopProduce({ rows }: { rows: ProduceRow[] }) {
  const max = Math.max(1, ...rows.map(produceUnits));
  return (
    <ol className="space-y-4">
      {rows.map((row, i) => {
        const units = produceUnits(row);
        const revenue = produceRevenue(row);
        return (
          <li key={`${row.productId}-${i}`} className="stagger" style={{ '--i': i } as never}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="truncate text-sm font-medium text-ink">{row.productName}</span>
              <span className="tnum shrink-0 font-mono text-xs text-ink-3">
                {plural(units, 'unit')}
              </span>
            </div>
            <div className="mt-1.5">
              <Meter
                value={units}
                max={max}
                tone="ember"
                label={`${row.productName}: ${plural(units, 'unit')} sold`}
              />
            </div>
            <p className="tnum mt-1 font-mono text-[0.625rem] uppercase tracking-[0.12em] text-ink-4">
              {money(revenue)} takings
            </p>
          </li>
        );
      })}
    </ol>
  );
}

/* -------------------------------------------------------------------------- */
/*  Recent orders table                                                        */
/* -------------------------------------------------------------------------- */

function RecentOrdersTable({ orders }: { orders: RecentOrder[] }) {
  const navigate = useNavigate();

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[44rem] border-collapse text-left">
          <caption className="sr-only">
            The ten most recent orders, with customer, date, status and total
          </caption>
          <thead>
            <tr className="border-b border-rule bg-paper-deep/50">
              {['Order', 'Customer', 'Placed', 'Status', 'Total', 'Open'].map((head) => (
                <th
                  key={head}
                  scope="col"
                  className="px-4 py-3 font-mono text-[0.625rem] font-medium uppercase tracking-[0.16em] text-ink-3 last:w-px last:text-right"
                >
                  {head}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr
                key={order.orderNumber}
                className="border-b border-rule-soft transition-colors last:border-0 hover:bg-paper-deep/40"
              >
                <th scope="row" className="px-4 py-3 font-mono text-xs font-medium text-ink">
                  {order.orderNumber}
                </th>
                <td className="px-4 py-3">
                  <span className="block truncate text-sm text-ink-2">{customerName(order)}</span>
                  {order.user?.email && (
                    <span className="block truncate text-xs text-ink-3">{order.user.email}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-ink-2">
                  {formatDate(order.createdAt)}
                  <span className="block font-mono text-[0.625rem] uppercase tracking-[0.12em] text-ink-4">
                    {relativeDay(order.createdAt)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={order.status} />
                </td>
                <td className="tnum px-4 py-3 font-display text-base font-semibold text-ink">
                  {money(order.totalAmount)}
                </td>
                <td className="px-4 py-3 text-right">
                  {/* Always visible and focusable — never hover-only. */}
                  <IconButton
                    label={`Open order ${order.orderNumber}`}
                    onClick={() => navigate(`/orders/${order.orderNumber}`)}
                  >
                    <Pencil className="size-4" aria-hidden />
                  </IconButton>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/*  Inventory                                                                  */
/* -------------------------------------------------------------------------- */

function InventoryTab() {
  const { notify } = useToast();
  const navigate = useNavigate();

  const [term, setTerm] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [confirmId, setConfirmId] = useState<number | null>(null);

  // Debounce the box into the query key so typing does not hammer the API.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(term.trim());
      setPage(1);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [term]);

  const products = useAdminProducts(page, search);
  const lowStock = useLowStock(10);
  const remove = useDeleteProduct();

  const rows = products.data?.data ?? [];
  const pagination = products.data?.pagination;

  const confirmDelete = async (product: Product) => {
    try {
      await remove.mutateAsync(product.id);
      setConfirmId(null);
      notify(`${product.name} was removed from the catalogue.`);
    } catch (err) {
      setConfirmId(null);
      notify(errText(err, `Could not delete ${product.name}.`), 'error');
    }
  };

  return (
    <div className="space-y-10">
      <section aria-labelledby="inventory-heading">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 id="inventory-heading" className="text-2xl">
              The stock book
            </h2>
            <p className="mt-1.5 text-sm text-ink-2">
              Every crate on the floor. Search by name or SKU, edit the ledger line, or strike a
              produce entry out entirely.
            </p>
          </div>
          <Button
            to="/admin/products/new"
            variant="ember"
            size="sm"
            leftIcon={<Plus className="size-4" aria-hidden />}
          >
            New product
          </Button>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="w-full sm:max-w-sm">
            <Input
              name="inventory-search"
              type="search"
              label="Search inventory"
              placeholder="Shimla apple, PF-APP-001…"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              icon={<Search className="size-4" aria-hidden />}
              hint={
                search
                  ? `Filtering the catalogue for “${search}”.`
                  : 'Filters the catalogue as you type.'
              }
            />
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="self-end sm:mb-6"
            onClick={() => void products.refetch()}
            loading={products.isFetching}
            leftIcon={<RefreshCw className="size-4" aria-hidden />}
          >
            Refresh
          </Button>
        </div>

        <div aria-live="polite" className="sr-only">
          {products.isPending
            ? 'Loading inventory'
            : `${plural(rows.length, 'product')} on this page${
                search ? ` matching ${search}` : ''
              }`}
        </div>

        <div className="mt-4">
          {products.isPending ? (
            <LoadingBlock label="Opening the stock book" />
          ) : products.isError ? (
            <ErrorState
              title="The stock book would not open"
              message={errText(products.error, 'We could not load the product list.')}
              onRetry={() => void products.refetch()}
            />
          ) : rows.length === 0 ? (
            <EmptyState
              icon={<Boxes className="size-6" aria-hidden />}
              title={search ? `Nothing matches “${search}”` : 'No produce listed yet'}
              body={
                search
                  ? 'Try a shorter search, or clear the box to see the whole catalogue.'
                  : 'Add the first crate to the catalogue and it will appear here.'
              }
              action={
                search ? (
                  <Button variant="outline" size="sm" onClick={() => setTerm('')}>
                    Clear search
                  </Button>
                ) : (
                  <Button
                    to="/admin/products/new"
                    variant="ember"
                    size="sm"
                    leftIcon={<Plus className="size-4" aria-hidden />}
                  >
                    New product
                  </Button>
                )
              }
            />
          ) : (
            <>
              <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[54rem] border-collapse text-left">
                    <caption className="sr-only">
                      Catalogue inventory with price, stock level and row actions
                    </caption>
                    <thead>
                      <tr className="border-b border-rule bg-paper-deep/50">
                        {['Produce', 'SKU', 'Aisle', 'Price', 'Stock', 'Actions'].map((head) => (
                          <th
                            key={head}
                            scope="col"
                            className="px-4 py-3 font-mono text-[0.625rem] font-medium uppercase tracking-[0.16em] text-ink-3 last:w-px"
                          >
                            {head}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((product) => {
                        const stock = stockNumber(product.stock);
                        const state = stockState(stock);
                        const confirming = confirmId === product.id;
                        return (
                          <tr
                            key={product.id}
                            className="border-b border-rule-soft align-middle transition-colors last:border-0 hover:bg-paper-deep/40"
                          >
                            <th scope="row" className="px-4 py-3 font-normal">
                              <span className="flex items-center gap-3">
                                <ProseImage
                                  src={product.thumbnail}
                                  alt={`Photograph of ${product.name}`}
                                  className="size-11 shrink-0 rounded-md border border-rule"
                                />
                                <span className="min-w-0">
                                  <span className="block truncate text-sm font-medium text-ink">
                                    {product.name}
                                  </span>
                                  <span className="block truncate text-xs text-ink-3">
                                    {product.shortDescription || 'No short description'}
                                  </span>
                                </span>
                              </span>
                            </th>
                            <td className="px-4 py-3 font-mono text-xs text-ink-2">
                              {product.sku}
                            </td>
                            <td className="px-4 py-3 text-sm text-ink-2">
                              {product.category?.name || '—'}
                            </td>
                            <td className="px-4 py-3">
                              <PriceTag
                                price={product.price}
                                salePrice={product.salePrice}
                                unit={product.unit}
                                size="sm"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <span className="flex flex-col items-start gap-1.5">
                                <Badge tone={state.tone} dot>
                                  {state.label}
                                </Badge>
                                <span className="tnum font-mono text-xs text-ink-3">
                                  {stock.toLocaleString('en-IN')} {product.unit}
                                </span>
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              {confirming ? (
                                <div
                                  role="group"
                                  aria-label={`Confirm deleting ${product.name}`}
                                  className="flex items-center gap-1.5"
                                >
                                  <Button
                                    variant="ember"
                                    size="sm"
                                    loading={remove.isPending}
                                    onClick={() => void confirmDelete(product)}
                                    leftIcon={<Trash2 className="size-3.5" aria-hidden />}
                                  >
                                    Delete
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    disabled={remove.isPending}
                                    onClick={() => setConfirmId(null)}
                                  >
                                    Keep
                                  </Button>
                                </div>
                              ) : (
                                <span className="flex items-center gap-1.5">
                                  <IconButton
                                    label={`Edit ${product.name}`}
                                    onClick={() =>
                                      navigate(`/admin/products/edit/${product.id}`)
                                    }
                                  >
                                    <Pencil className="size-4" aria-hidden />
                                  </IconButton>
                                  <IconButton
                                    label={`Delete ${product.name}`}
                                    tone="ember"
                                    disabled={remove.isPending}
                                    onClick={() => setConfirmId(product.id)}
                                  >
                                    <Trash2 className="size-4" aria-hidden />
                                  </IconButton>
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>

              {pagination && (
                <div className="mt-6 flex flex-col items-center gap-3">
                  <Pagination
                    page={pagination.currentPage}
                    totalPages={pagination.totalPages}
                    onChange={setPage}
                  />
                  <p className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-ink-3">
                    Page {pagination.currentPage} of {pagination.totalPages} ·{' '}
                    {plural(pagination.totalProducts ?? rows.length, 'product')}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <LowStockPanel
        query={lowStock}
        onEdit={(id) => navigate(`/admin/products/edit/${id}`)}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Low stock                                                                  */
/* -------------------------------------------------------------------------- */

type LowStockRow = {
  id: number;
  name: string;
  sku: string;
  stock: number;
  unit: string;
  thumbnail: string;
  category?: { name: string } | null;
};

function LowStockPanel({
  query,
  onEdit,
}: {
  query: ReturnType<typeof useLowStock>;
  onEdit: (id: number) => void;
}) {
  const rows: LowStockRow[] = useMemo(() => query.data ?? [], [query.data]);
  const ceiling = Math.max(10, ...rows.map((r) => stockNumber(r.stock)));

  return (
    <section aria-labelledby="low-stock-heading">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 id="low-stock-heading" className="text-2xl">
          Running thin
        </h2>
        <p className="font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-ink-3">
          Threshold · 10 units or fewer
        </p>
      </div>

      <div className="mt-5">
        {query.isPending ? (
          <div className="flex items-center gap-3 py-8">
            <Spinner className="text-ember" />
            <span className="text-sm text-ink-3">Counting the crates…</span>
          </div>
        ) : query.isError ? (
          <ErrorState
            title="Low-stock panel would not load"
            message={errText(query.error, 'We could not read the low-stock report.')}
            onRetry={() => void query.refetch()}
            className="py-10"
          />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<Boxes className="size-6" aria-hidden />}
            title="Every crate is stocked"
            body="Nothing is at or below the ten-unit threshold right now."
          />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((row, i) => {
              const stock = stockNumber(row.stock);
              const state = stockState(stock);
              return (
                <li
                  key={row.id}
                  className="stagger flex items-center gap-3 rounded-lg border border-rule bg-paper-card p-3.5"
                  style={{ '--i': i } as never}
                >
                  <ProseImage
                    src={row.thumbnail}
                    alt={`Photograph of ${row.name}`}
                    className="size-12 shrink-0 rounded-md border border-rule"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{row.name}</p>
                    <p className="truncate font-mono text-[0.625rem] uppercase tracking-[0.12em] text-ink-3">
                      {row.sku} · {row.category?.name || 'Unassigned'}
                    </p>
                    <div className="mt-1.5">
                      <Meter
                        value={stock}
                        max={ceiling}
                        tone={state.meter}
                        label={`${row.name}: ${plural(stock, 'unit')} in stock`}
                      />
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <Badge tone={state.tone} dot>
                      {state.label}
                    </Badge>
                    <span className="tnum font-mono text-xs text-ink-2">
                      {stock.toLocaleString('en-IN')} {row.unit}
                    </span>
                    <IconButton
                      label={`Restock ${row.name}`}
                      size="sm"
                      onClick={() => onEdit(row.id)}
                    >
                      <Pencil className="size-3.5" aria-hidden />
                    </IconButton>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Orders                                                                     */
/* -------------------------------------------------------------------------- */

function OrdersTab() {
  const { notify } = useToast();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<OrderStatus | ''>('');
  const [rowError, setRowError] = useState<Record<string, string>>({});

  const orders = useOrders(page, status);
  const updateStatus = useUpdateOrderStatus();

  const rows = orders.data?.data ?? [];
  const pagination = orders.data?.pagination;

  const changeStatus = async (orderNumber: string, next: OrderStatus) => {
    setRowError((prev) => {
      const copy = { ...prev };
      delete copy[orderNumber];
      return copy;
    });
    try {
      await updateStatus.mutateAsync({ orderNumber, status: next });
      notify(`${orderNumber} moved to ${titleCase(next)}.`);
    } catch (err) {
      const message = errText(err, 'The status could not be changed.');
      const serverSide = err instanceof ApiError && err.status >= 500;
      const text = serverSide
        ? `Server error — ${message} The order is unchanged.`
        : `Not saved — ${message}`;
      setRowError((prev) => ({ ...prev, [orderNumber]: text }));
      notify(text, 'error');
    }
  };

  return (
    <div className="space-y-8">
      <section aria-labelledby="orders-heading">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 id="orders-heading" className="text-2xl">
              The order book
            </h2>
            <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink-2">
              Move a crate through the counter by hand. The menu only offers the states the server
              will accept from where the order is standing.
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void orders.refetch()}
            loading={orders.isFetching}
            leftIcon={<RefreshCw className="size-4" aria-hidden />}
          >
            Refresh
          </Button>
        </div>

        {/* ---- Known backend defect, stated plainly ---------------------- */}
        <div
          role="note"
          className="mt-5 flex gap-3 rounded-md border border-citrus-line bg-citrus-soft px-4 py-3.5"
        >
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warn" aria-hidden />
          <p className="text-xs leading-relaxed text-ink-2">
            <strong className="font-semibold text-ink">
              Status changes currently fail on the server.
            </strong>{' '}
            <code className="font-mono text-[0.6875rem]">PUT /api/orders/:orderNumber/status</code>{' '}
            references a <code className="font-mono text-[0.6875rem]">prisma.orderStatusHistory</code>{' '}
            model that does not exist in the schema, so the endpoint answers HTTP 500 for every
            order. Nothing is faked here — the error is shown as it comes back, and the order keeps
            the status it already had.
          </p>
        </div>

        <p className="mt-3 text-xs leading-relaxed text-ink-3">
          A second limit worth knowing:{' '}
          <code className="font-mono text-[0.6875rem]">GET /api/orders</code> scopes its results to
          the signed-in account, so this book shows the orders placed against the staff account
          rather than the whole market. Market-wide figures live on the Overview tab.
        </p>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="w-full sm:max-w-xs">
            <Select
              name="order-status-filter"
              label="Filter by status"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as OrderStatus | '');
                setPage(1);
              }}
              options={STATUS_FILTER}
            />
          </div>
          <p className="font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-ink-3">
            {orders.isPending
              ? 'Loading…'
              : `${plural(rows.length, 'order')} on this page`}
          </p>
        </div>

        <div className="mt-4">
          {orders.isPending ? (
            <LoadingBlock label="Fetching the order book" />
          ) : orders.isError ? (
            <ErrorState
              title="The order book would not open"
              message={errText(orders.error, 'We could not load the orders.')}
              onRetry={() => void orders.refetch()}
            />
          ) : rows.length === 0 ? (
            <EmptyState
              icon={<ShoppingBasket className="size-6" aria-hidden />}
              title={status ? `No ${titleCase(status).toLowerCase()} orders` : 'No orders to show'}
              body={
                status
                  ? 'Nothing is sitting at that status right now. Clear the filter to see the whole book.'
                  : 'Orders will be printed here as soon as customers start checking out.'
              }
              action={
                status ? (
                  <Button variant="outline" size="sm" onClick={() => setStatus('')}>
                    Clear filter
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[52rem] border-collapse text-left">
                  <caption className="sr-only">
                    Orders with their current status and the transitions available to an admin
                  </caption>
                  <thead>
                    <tr className="border-b border-rule bg-paper-deep/50">
                      {['Order', 'Placed', 'Items', 'Total', 'Status', 'Move to'].map((head) => (
                        <th
                          key={head}
                          scope="col"
                          className="px-4 py-3 font-mono text-[0.625rem] font-medium uppercase tracking-[0.16em] text-ink-3"
                        >
                          {head}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((order) => {
                      const next = NEXT_STATUS[order.status] ?? [];
                      const busy = updateStatus.isPending
                        ? updateStatus.variables?.orderNumber === order.orderNumber
                        : false;
                      const failure = rowError[order.orderNumber];
                      return (
                        <tr
                          key={order.orderNumber}
                          className="border-b border-rule-soft align-middle transition-colors last:border-0 hover:bg-paper-deep/40"
                        >
                          <th scope="row" className="px-4 py-3 font-mono text-xs font-medium text-ink">
                            {order.orderNumber}
                            {failure && (
                              <span
                                role="alert"
                                className="mt-1 block max-w-xs font-sans text-xs font-normal leading-snug text-bad"
                              >
                                {failure}
                              </span>
                            )}
                          </th>
                          <td className="px-4 py-3 text-sm text-ink-2">
                            {formatDate(order.createdAt)}
                            <span className="block font-mono text-[0.625rem] uppercase tracking-[0.12em] text-ink-4">
                              {relativeDay(order.createdAt)}
                            </span>
                          </td>
                          <td className="tnum px-4 py-3 text-sm text-ink-2">
                            {plural((order.items ?? []).length, 'line')}
                          </td>
                          <td className="tnum px-4 py-3 font-display text-base font-semibold text-ink">
                            {money(order.totalAmount)}
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={order.status} />
                          </td>
                          <td className="px-4 py-3">
                            {next.length > 0 ? (
                              <Select
                                name={`status-${order.orderNumber}`}
                                label={
                                  <span className="sr-only">
                                    {`New status for order ${order.orderNumber}`}
                                  </span>
                                }
                                value=""
                                disabled={busy}
                                onChange={(e) => {
                                  const value = e.target.value as OrderStatus;
                                  if (value) void changeStatus(order.orderNumber, value);
                                }}
                                options={[
                                  { value: '', label: busy ? 'Updating…' : 'Choose…' },
                                  ...next.map((s) => ({ value: s, label: titleCase(s) })),
                                ]}
                                className="min-w-[9.5rem] text-sm"
                              />
                            ) : (
                              <span className="font-mono text-[0.625rem] uppercase tracking-[0.12em] text-ink-4">
                                Terminal
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>

        {pagination && !orders.isPending && !orders.isError && rows.length > 0 && (
          <div className="mt-6 flex flex-col items-center gap-3">
            <Pagination
              page={pagination.currentPage}
              totalPages={pagination.totalPages}
              onChange={setPage}
            />
            <p className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-ink-3">
              Page {pagination.currentPage} of {pagination.totalPages} ·{' '}
              {plural(pagination.totalOrders ?? rows.length, 'order')}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
