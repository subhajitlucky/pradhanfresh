import { Link } from 'react-router-dom';
import { Check, Plus } from 'lucide-react';
import { useCart } from '../../lib/cart';
import { cn, discountPercent } from '../../lib/format';
import { useToast, Skeleton } from '../ui/Feedback';
import { PriceTag, ProseImage } from '../ui/Surface';
import type { Product } from '../../lib/types';

/**
 * The catalogue tile. Rendered as a <article> with a single stretched link so
 * the whole card is clickable while the add button stays independently
 * focusable above it.
 */
export function ProductCard({
  product,
  index = 0,
  compact = false,
}: {
  product: Product;
  index?: number;
  compact?: boolean;
}) {
  const add = useCart((s) => s.add);
  const items = useCart((s) => s.items);
  const { notify } = useToast();

  const inCartQty = items.find((i) => i.productId === product.id)?.quantity ?? 0;
  const off = discountPercent(product.price, product.salePrice);
  const soldOut = !product.isAvailable || product.stock <= 0;
  const lowStock = !soldOut && product.stock <= 5;
  const href = `/products/${product.id}`;

  const quickAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (soldOut) return;
    try {
      await add(product.id, 1);
      notify(`${product.name} added to your basket`);
    } catch (err) {
      notify(
        err instanceof Error ? err.message : 'Could not add that to your basket.',
        'error',
      );
    }
  };

  return (
    <article
      className={cn(
        'stagger group relative flex flex-col overflow-hidden rounded-lg border border-rule bg-paper-card',
        'transition-[transform,box-shadow,border-color] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
        'hover:-translate-y-1 hover:border-ink-3 hover:shadow-lift',
        compact && 'sm:flex-row',
      )}
      style={{ '--i': index } as never}
    >
      {/* Stretched link: makes the entire card one target */}
      <Link to={href} className="absolute inset-0 z-10" aria-label={`View ${product.name}`}>
        <span className="sr-only">{product.name}</span>
      </Link>

      <div
        className={cn(
          'relative overflow-hidden bg-paper-deep',
          compact ? 'aspect-square w-32 shrink-0 sm:aspect-auto sm:h-auto' : 'aspect-[4/5]',
        )}
      >
        <ProseImage
          src={product.thumbnail}
          alt={product.name}
          className="size-full"
          imgClassName="transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.06]"
        />

        <div className="pointer-events-none absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {soldOut ? (
            <span className="rounded-full bg-ink px-2.5 py-1 font-mono text-[0.5625rem] font-medium uppercase tracking-[0.14em] text-paper">
              Sold out
            </span>
          ) : off > 0 ? (
            <span className="rounded-full bg-ember px-2.5 py-1 font-mono text-[0.5625rem] font-semibold uppercase tracking-[0.14em] text-paper-card">
              {off}% off
            </span>
          ) : null}
          {product.isOrganic && !soldOut && (
            <span className="rounded-full bg-leaf px-2.5 py-1 font-mono text-[0.5625rem] font-medium uppercase tracking-[0.14em] text-paper">
              Organic
            </span>
          )}
        </div>

        {lowStock && (
          <p className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-paper-card/90 px-2.5 py-1 font-mono text-[0.5625rem] uppercase tracking-[0.12em] text-warn backdrop-blur-sm">
            Only {product.stock} left
          </p>
        )}
      </div>

      <div className={cn('flex flex-1 flex-col gap-2 p-4', compact && 'justify-center sm:p-5')}>
        {product.category?.name && (
          <p className="font-mono text-[0.5625rem] uppercase tracking-[0.18em] text-ink-3">
            {product.category.name}
          </p>
        )}

        <h3 className="font-display text-lg font-semibold leading-tight text-ink transition-colors group-hover:text-ember">
          {product.name}
        </h3>

        {!compact && product.shortDescription && (
          <p className="line-clamp-2 text-sm leading-relaxed text-ink-3">
            {product.shortDescription}
          </p>
        )}

        <div className="mt-auto flex items-end justify-between gap-3 pt-2">
          <PriceTag
            price={product.price}
            salePrice={product.salePrice}
            unit={product.unit}
            size={compact ? 'sm' : 'md'}
          />

          <button
            type="button"
            onClick={quickAdd}
            disabled={soldOut}
            aria-label={`Add ${product.name} to basket`}
            className={cn(
              'relative z-20 grid size-9 shrink-0 place-items-center rounded-md border transition-all duration-200',
              soldOut
                ? 'cursor-not-allowed border-rule bg-paper-deep text-ink-4'
                : inCartQty > 0
                  ? 'border-leaf bg-leaf text-paper'
                  : 'border-rule-strong bg-paper-card text-ink hover:bg-ink hover:text-paper',
            )}
          >
            {inCartQty > 0 ? (
              <span className="tnum font-mono text-xs font-semibold" aria-hidden>
                {inCartQty}
              </span>
            ) : (
              <Plus className="size-4" aria-hidden />
            )}
            {inCartQty > 0 && (
              <span className="sr-only">
                <Check aria-hidden /> {inCartQty} in basket — add another
              </span>
            )}
          </button>
        </div>
      </div>
    </article>
  );
}

function ProductCardSkeleton({ index }: { index: number }) {
  return (
    <div
      aria-hidden
      className="stagger overflow-hidden rounded-lg border border-rule bg-paper-card"
      style={{ '--i': index } as never}
    >
      <Skeleton className="aspect-[4/5] rounded-none" />
      <div className="space-y-2.5 p-4">
        <Skeleton className="h-2.5 w-1/3" />
        <Skeleton className="h-5 w-4/5" />
        <Skeleton className="h-3 w-full" />
        <div className="flex items-center justify-between pt-2">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="size-9 rounded-md" />
        </div>
      </div>
    </div>
  );
}

/** Grid wrapper that keeps card rhythm consistent across every listing. */
export function ProductGrid({
  products,
  skeletonCount = 8,
}: {
  products?: Product[];
  skeletonCount?: number;
}) {
  if (!products) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: skeletonCount }, (_, i) => (
          <ProductCardSkeleton key={i} index={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} index={i} />
      ))}
    </div>
  );
}

export default ProductCard;
