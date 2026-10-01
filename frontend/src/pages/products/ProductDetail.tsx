import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Leaf,
  Package,
  RefreshCcw,
  Share2,
  ShieldCheck,
  ShoppingBasket,
  Sprout,
  Truck,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge, ErrorState, LoadingBlock, Skeleton, useToast } from '../../components/ui/Feedback';
import { Card, PriceTag, ProseImage, QtyStepper } from '../../components/ui/Surface';
import { ProductCard } from '../../components/product/ProductCard';
import { useCart } from '../../lib/cart';
import { errText, useProduct, useRelatedProducts } from '../../lib/catalog';
import { ApiError } from '../../lib/api';
import { cn, discountPercent, formatDate, money, plural } from '../../lib/format';

/* -------------------------------------------------------------------------- */
/*  Content                                                                    */
/* -------------------------------------------------------------------------- */

const TRUST = [
  {
    Icon: Sprout,
    title: 'Harvested at dawn',
    body: 'Picked before sunrise, never stored cold.',
  },
  {
    Icon: Truck,
    title: 'On your step by noon',
    body: 'Same-day delivery inside Pune.',
  },
  {
    Icon: RefreshCcw,
    title: 'Replacement promise',
    body: 'Anything not right? We replace it.',
  },
  {
    Icon: ShieldCheck,
    title: 'Secure checkout',
    body: 'Pay on delivery or online, safely.',
  },
];

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: product, isLoading, isError, error, refetch } = useProduct(id);
  const { data: related = [], isLoading: relatedLoading } = useRelatedProducts(product?.categoryId);

  const add = useCart((s) => s.add);
  const items = useCart((s) => s.items);
  const { notify } = useToast();

  const [active, setActive] = useState(0);
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const [copied, setCopied] = useState(false);
  const thumbRefs = useRef<Array<HTMLButtonElement | null>>([]);

  /* --- Gallery --------------------------------------------------------- */
  const gallery = useMemo(() => {
    if (!product) return [] as string[];
    return Array.from(new Set([product.thumbnail, ...(product.images ?? [])].filter(Boolean)));
  }, [product]);

  useEffect(() => {
    setActive(0);
    setQty(1);
  }, [product?.id]);

  const onThumbKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const delta = e.key === 'ArrowRight' ? 1 : -1;
    const next = (active + delta + gallery.length) % gallery.length;
    setActive(next);
    thumbRefs.current[next]?.focus();
  };

  /* --- Stock ----------------------------------------------------------- */
  const soldOut = !product?.isAvailable || (product?.stock ?? 0) <= 0;
  const lowStock = !!product && !soldOut && product.stock <= 5;
  const inBasket = items.find((i) => i.productId === product?.id)?.quantity ?? 0;
  const off = product ? discountPercent(product.price, product.salePrice) : 0;

  const addToBasket = async () => {
    if (!product || soldOut) return;
    setAdding(true);
    try {
      await add(product.id, qty);
      notify(`${plural(qty, product.unit)} of ${product.name} added to your basket`);
    } catch (err) {
      notify(errText(err, 'Could not add that to your basket.'), 'error');
    } finally {
      setAdding(false);
    }
  };

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      notify('Link copied to your clipboard');
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      notify('Could not copy the link — copy it from the address bar instead.', 'error');
    }
  };

  /* --- States ---------------------------------------------------------- */
  if (isLoading) {
    return (
      <div className="shell py-14 md:py-20">
        <h1 className="text-3xl md:text-4xl">Loading produce…</h1>
        <LoadingBlock label="Pulling this crate from the shelf" />
      </div>
    );
  }

  const notFound = isError && (error instanceof ApiError ? error.isNotFound : false);

  if (isError || !product) {
    return (
      <div className="shell py-14 md:py-20">
        <Link
          to="/products"
          className="inline-flex items-center gap-1.5 font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-ink-3 transition-colors hover:text-ember"
        >
          <ArrowLeft className="size-3.5" aria-hidden />
          All produce
        </Link>

        {notFound ? (
          <div className="mx-auto mt-10 max-w-lg text-center">
            <span className="eyebrow">Empty crate</span>
            <h1 className="mt-4 text-4xl leading-[1.05] md:text-5xl">
              We can no longer find this produce.
            </h1>
            <p className="mt-4 leading-relaxed text-ink-2">
              The harvest for this item may have sold out or been renamed. The rest of the stall is
              still open.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-2">
              <Button to="/products" variant="ember" leftIcon={<ShoppingBasket className="size-4" aria-hidden />}>
                Browse the market
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-10">
            <ErrorState
              title="This page did not load"
              message={errText(error, 'We could not reach the market just now.')}
              onRetry={refetch}
            />
          </div>
        )}
      </div>
    );
  }

  /* --- Spec ledger: real fields only, nothing invented ------------------ */
  const specs: Array<{ label: string; value: string }> = [
    { label: 'SKU', value: product.sku },
    { label: 'Sold by', value: product.unit },
    { label: 'Aisle', value: product.category?.name ?? '—' },
    { label: 'In stock', value: `${plural(product.stock, product.unit)}` },
    { label: 'Certification', value: product.isOrganic ? 'Organic' : 'Conventional' },
    { label: 'Listing', value: product.isFeatured ? 'Featured this week' : 'Standard' },
  ];
  if (product.weight != null) specs.push({ label: 'Weight', value: `${product.weight} g` });
  if (product.createdBy?.name) specs.push({ label: 'Listed by', value: product.createdBy.name });
  if (product.createdAt) specs.push({ label: 'Added', value: formatDate(product.createdAt) });

  const description = (product.description ?? '').trim();
  const suggestions = related.filter((p) => p.id !== product.id).slice(0, 4);

  return (
    <div className="shell py-8 md:py-12">
      {/* Breadcrumb ------------------------------------------------------ */}
      <div className="stagger flex flex-wrap items-center gap-x-3 gap-y-2" style={{ '--i': 0 } as never}>
        <Link
          to="/products"
          className="inline-flex items-center gap-1.5 font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-ink-3 transition-colors hover:text-ember"
        >
          <ArrowLeft className="size-3.5" aria-hidden />
          All produce
        </Link>
        {product.category?.name && product.categoryId != null && (
          <>
            <span aria-hidden className="font-mono text-xs text-ink-4">
              /
            </span>
            <Link
              to={`/products?categories=${product.categoryId}`}
              className="font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-ink-3 transition-colors hover:text-ember"
            >
              {product.category.name}
            </Link>
          </>
        )}
      </div>

      <div className="mt-6 grid gap-10 lg:grid-cols-2 lg:gap-14">
        {/* Gallery ------------------------------------------------------- */}
        <div className="stagger" style={{ '--i': 1 } as never}>
          <div className="overflow-hidden rounded-lg border border-rule bg-paper-card">
            <ProseImage
              src={gallery[active] ?? gallery[0]}
              alt={product.name}
              loading="eager"
              className="aspect-[4/5] w-full sm:aspect-square"
            />
          </div>

          {gallery.length > 1 && (
            <div
              role="group"
              aria-label="Product images"
              onKeyDown={onThumbKey}
              className="no-bar mt-3 flex gap-2.5 overflow-x-auto pb-1"
            >
              {gallery.map((src, i) => {
                const isActive = i === active;
                return (
                  <button
                    key={`${src}-${i}`}
                    type="button"
                    ref={(el) => {
                      thumbRefs.current[i] = el;
                    }}
                    onClick={() => setActive(i)}
                    aria-pressed={isActive}
                    aria-current={isActive ? 'true' : undefined}
                    aria-label={`Show image ${i + 1} of ${gallery.length}`}
                    className={cn(
                      'relative size-20 shrink-0 overflow-hidden rounded-md border transition-colors duration-200',
                      isActive
                        ? 'border-ember shadow-[0_0_0_2px_var(--color-ember-soft)]'
                        : 'border-rule hover:border-ink-3',
                    )}
                  >
                    <ProseImage src={src} alt="" className="size-full" />
                  </button>
                );
              })}
            </div>
          )}

          {/* Trust row ---------------------------------------------------- */}
          <ul className="mt-7 grid grid-cols-2 gap-5 border-t border-rule pt-6 sm:grid-cols-2">
            {TRUST.map(({ Icon, title, body }, i) => (
              <li key={title} className="stagger" style={{ '--i': i + 2 } as never}>
                <Icon className="size-5 text-leaf" aria-hidden />
                <p className="mt-2 font-mono text-[0.625rem] uppercase tracking-[0.14em] text-ink">
                  {title}
                </p>
                <p className="mt-1 text-xs leading-snug text-ink-3">{body}</p>
              </li>
            ))}
          </ul>
        </div>

        {/* Purchase panel ------------------------------------------------ */}
        <div className="stagger" style={{ '--i': 2 } as never}>
          <p className="font-mono text-[0.625rem] uppercase tracking-[0.18em] text-ember">
            {product.category?.name ?? 'Fresh produce'}
          </p>
          <h1 className="mt-2.5 text-4xl leading-[1.03] md:text-5xl">{product.name}</h1>

          {product.shortDescription && (
            <p className="mt-3 text-lg leading-relaxed text-ink-2">{product.shortDescription}</p>
          )}

          <div className="mt-6 flex flex-wrap items-end gap-4">
            <PriceTag
              price={product.price}
              salePrice={product.salePrice}
              unit={product.unit}
              size="lg"
            />
            {off > 0 && <Badge tone="ember">{off}% off</Badge>}
            {product.isOrganic && (
              <Badge tone="leaf">
                <Leaf className="size-3" aria-hidden />
                Organic
              </Badge>
            )}
            {product.isFeatured && <Badge tone="ink">Featured</Badge>}
          </div>

          {/* Stock state */}
          <div className="mt-5 flex flex-wrap items-center gap-2.5">
            {soldOut ? (
              <Badge tone="ember" dot>
                Sold out
              </Badge>
            ) : lowStock ? (
              <Badge tone="citrus" dot>
                Only {product.stock} left
              </Badge>
            ) : (
              <Badge tone="leaf" dot>
                In stock
              </Badge>
            )}
            {inBasket > 0 && <Badge tone="paper">{inBasket} in basket</Badge>}
          </div>

          {/* Buy */}
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <span className="font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-ink-3">
                Qty
              </span>
              <QtyStepper
                value={qty}
                onChange={setQty}
                min={1}
                max={soldOut ? 1 : Math.max(1, product.stock)}
                disabled={soldOut}
                label={`Quantity of ${product.name}`}
              />
            </div>
            <Button
              variant="ember"
              size="lg"
              className="sm:flex-1"
              loading={adding}
              disabled={soldOut}
              onClick={() => void addToBasket()}
              leftIcon={<ShoppingBasket className="size-4" aria-hidden />}
            >
              {soldOut ? 'Sold out' : `Add to basket · ${money((product.salePrice ?? product.price) * qty)}`}
            </Button>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => void share()}
              leftIcon={<Share2 className="size-3.5" aria-hidden />}
            >
              {copied ? 'Link copied' : 'Share this produce'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              to="/cart"
              leftIcon={<Package className="size-3.5" aria-hidden />}
            >
              View basket
            </Button>
          </div>

          {/* Description -------------------------------------------------- */}
          {description && (
            <section aria-labelledby="pf-about" className="rule-t mt-8 pt-6">
              <h2 id="pf-about" className="text-2xl">
                About this produce
              </h2>
              <div className="mt-3 space-y-3 leading-relaxed text-ink-2">
                {description.split(/\n{2,}/).map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            </section>
          )}

          {/* Spec ledger -------------------------------------------------- */}
          <section aria-labelledby="pf-specs" className="rule-t mt-8 pt-6">
            <h2 id="pf-specs" className="text-2xl">
              Specification
            </h2>
            <dl className="mt-4 divide-y divide-rule-soft border-y border-rule-soft">
              {specs.map((s) => (
                <div
                  key={s.label}
                  className="flex items-baseline justify-between gap-6 py-2.5"
                >
                  <dt className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-ink-3">
                    {s.label}
                  </dt>
                  <dd className="tnum text-right text-sm font-medium text-ink">{s.value}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>
      </div>

      {/* Related --------------------------------------------------------- */}
      <section aria-labelledby="pf-related" className="rule-t mt-14 pt-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <span className="eyebrow">From the same aisle</span>
            <h2 id="pf-related" className="mt-3 text-3xl leading-[1.05] md:text-4xl">
              You may also like
            </h2>
          </div>
          <Button to="/products" variant="ghost" size="sm">
            See everything
          </Button>
        </div>

        <div className="mt-7">
          {relatedLoading ? (
            <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
              {Array.from({ length: 4 }, (_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="aspect-[4/5] rounded-none" />
                  <div className="space-y-2 p-4">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-5 w-1/2" />
                  </div>
                </Card>
              ))}
            </div>
          ) : suggestions.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
              {suggestions.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-ink-3">
              Nothing else is listed in this aisle right now.{' '}
              <Link to="/products" className="text-ember underline underline-offset-4">
                Browse all produce
              </Link>
              .
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
