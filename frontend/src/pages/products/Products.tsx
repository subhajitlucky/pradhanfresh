import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Leaf, Search, SlidersHorizontal, X } from 'lucide-react';
import { Button, IconButton } from '../../components/ui/Button';
import { Checkbox, Input, Select } from '../../components/ui/Field';
import { EmptyState, ErrorState, Skeleton } from '../../components/ui/Feedback';
import { Card, Pagination } from '../../components/ui/Surface';
import { ProductGrid } from '../../components/product/ProductCard';
import { errText, useCategories, useProducts } from '../../lib/catalog';
import { useScrollLock } from '../../lib/hooks';
import { cn, money, plural } from '../../lib/format';
import { SORT_OPTIONS } from '../../lib/types';
import type { Category } from '../../lib/types';

/* -------------------------------------------------------------------------- */
/*  Constants                                                                  */
/* -------------------------------------------------------------------------- */

/** The server defaults `limit` to 6 — always send our own page size. */
const PAGE_SIZE = 12;

/**
 * The URL stores the canonical `sortBy` + `sortOrder` pair; the <Select> shows a
 * single combined token (the same vocabulary as SORT_OPTIONS in lib/types).
 */
const SORT_MAP: Record<string, { sortBy: string; sortOrder: string }> = {
  featured: { sortBy: 'featured', sortOrder: 'desc' },
  newest: { sortBy: 'newest', sortOrder: 'desc' },
  price_asc: { sortBy: 'price', sortOrder: 'asc' },
  price_desc: { sortBy: 'price', sortOrder: 'desc' },
  name: { sortBy: 'name', sortOrder: 'asc' },
  popularity: { sortBy: 'popularity', sortOrder: 'desc' },
};

const DEFAULT_SORT = SORT_MAP.featured;

/** Filter keys owned by the filter panel (sorting is deliberately kept). */
const FILTER_KEYS = ['search', 'categories', 'minPrice', 'maxPrice', 'isOrganic', 'page'];

function readNumber(raw: string | null): number | undefined {
  if (raw == null || raw.trim() === '') return undefined;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

function readPage(raw: string | null): number {
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : 1;
}

function splitIds(raw: string | null): string[] {
  return (raw ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function priceLabel(min?: number, max?: number): string {
  if (min != null && max != null) return `${money(min)} – ${money(max)}`;
  if (min != null) return `From ${money(min)}`;
  if (max != null) return `Under ${money(max)}`;
  return 'Price';
}

/* -------------------------------------------------------------------------- */
/*  Filter panel — shared by the sticky desktop rail and the mobile sheet       */
/* -------------------------------------------------------------------------- */

interface FilterPanelProps {
  categories: Category[];
  categoriesLoading: boolean;
  selected: string[];
  onToggleCategory: (id: string) => void;
  organic: boolean;
  onOrganicChange: (next: boolean) => void;
  priceDraft: { min: string; max: string };
  onPriceDraft: (next: { min: string; max: string }) => void;
  onPriceApply: () => void;
  onClearAll: () => void;
  activeCount: number;
}

function FilterPanel({
  categories,
  categoriesLoading,
  selected,
  onToggleCategory,
  organic,
  onOrganicChange,
  priceDraft,
  onPriceDraft,
  onPriceApply,
  onClearAll,
  activeCount,
}: FilterPanelProps) {
  const priceKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onPriceApply();
    }
  };

  return (
    <div className="flex flex-col">
      {/* Categories ------------------------------------------------------ */}
      <div className="pb-5">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="font-mono text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-ink-3">
            Aisle
          </h3>
          {activeCount > 0 && (
            <button
              type="button"
              onClick={onClearAll}
              className="font-mono text-[0.625rem] uppercase tracking-[0.14em] text-ember transition-colors hover:text-ember-deep"
            >
              Clear all
            </button>
          )}
        </div>

        <div className="mt-3.5 flex flex-col gap-2.5">
          {categoriesLoading ? (
            Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="size-[1.125rem] rounded-[3px]" />
                <Skeleton className="h-3.5 w-2/3" />
              </div>
            ))
          ) : categories.length === 0 ? (
            <p className="text-xs text-ink-3">No aisles published yet.</p>
          ) : (
            categories.map((c) => {
              const id = String(c.id);
              return (
                <Checkbox
                  key={c.id}
                  name="category"
                  value={id}
                  label={c.name}
                  count={c.productCount ?? c._count?.products ?? 0}
                  checked={selected.includes(id)}
                  onChange={() => onToggleCategory(id)}
                />
              );
            })
          )}
        </div>
      </div>

      {/* Price ----------------------------------------------------------- */}
      <div className="rule-t pt-5">
        <h3 className="font-mono text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-ink-3">
          Price range
        </h3>
        <div className="mt-3.5 grid grid-cols-2 gap-2">
          <Input
            name="minPrice"
            label="Min ₹"
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            placeholder="0"
            value={priceDraft.min}
            onChange={(e) => onPriceDraft({ ...priceDraft, min: e.target.value })}
            onBlur={onPriceApply}
            onKeyDown={priceKey}
            className="tnum h-10 text-sm"
          />
          <Input
            name="maxPrice"
            label="Max ₹"
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            placeholder="Any"
            value={priceDraft.max}
            onChange={(e) => onPriceDraft({ ...priceDraft, max: e.target.value })}
            onBlur={onPriceApply}
            onKeyDown={priceKey}
            className="tnum h-10 text-sm"
          />
        </div>
        <p className="mt-2 text-xs leading-snug text-ink-3">
          Applied when you leave the box or press enter.
        </p>
      </div>

      {/* Organic --------------------------------------------------------- */}
      <div className="rule-t pt-5">
        <Checkbox
          name="isOrganic"
          label={
            <span className="inline-flex items-center gap-1.5">
              <Leaf className="size-3.5 text-leaf" aria-hidden />
              Organic only
            </span>
          }
          description="No pesticides on our certified line."
          checked={organic}
          onChange={(e) => onOrganicChange(e.target.checked)}
        />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function Products() {
  const [params, setParams] = useSearchParams();

  // The latest params, readable from stable callbacks without re-creating them.
  const paramsRef = useRef(params);
  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  /* --- URL is the single source of truth ------------------------------- */
  const search = params.get('search') ?? '';
  const selectedCategories = useMemo(() => splitIds(params.get('categories')), [params]);
  const categoryParam = selectedCategories.join(',');
  const minPrice = readNumber(params.get('minPrice'));
  const maxPrice = readNumber(params.get('maxPrice'));
  const organic = params.get('isOrganic') === 'true';
  const page = readPage(params.get('page'));

  const sort = useMemo(() => {
    const key = params.get('sortBy') ?? '';
    const entry = Object.entries(SORT_MAP).find(
      ([, v]) => v.sortBy === key && v.sortOrder === (params.get('sortOrder') ?? v.sortOrder),
    );
    return entry ? entry[0] : 'featured';
  }, [params]);

  /* --- Debounced search (local mirror of the ?search= param) ------------- */
  const [term, setTerm] = useState(search);

  // Follow the URL when it changes from somewhere else (chips, back button).
  useEffect(() => {
    setTerm(search);
  }, [search]);

  /* --- Writers --------------------------------------------------------- */
  const write = useCallback(
    (mutate: (next: URLSearchParams) => void) => {
      const current = paramsRef.current;
      const next = new URLSearchParams(current);
      mutate(next);
      if (next.toString() === current.toString()) return;
      setParams(next, { replace: true });
    },
    [setParams],
  );

  const patchSort = useCallback(
    (token: string) => {
      const map = SORT_MAP[token] ?? DEFAULT_SORT;
      write((next) => {
        next.set('sortBy', map.sortBy);
        next.set('sortOrder', map.sortOrder);
        next.delete('page');
      });
    },
    [write],
  );

  const toggleCategory = useCallback(
    (id: string) => {
      write((next) => {
        const current = splitIds(next.get('categories'));
        const updated = current.includes(id)
          ? current.filter((c) => c !== id)
          : [...current, id];
        if (updated.length) next.set('categories', updated.join(','));
        else next.delete('categories');
        next.delete('page');
      });
    },
    [write],
  );

  const setOrganic = useCallback(
    (value: boolean) => {
      write((next) => {
        if (value) next.set('isOrganic', 'true');
        else next.delete('isOrganic');
        next.delete('page');
      });
    },
    [write],
  );

  const clearAll = useCallback(() => {
    write((next) => {
      for (const key of FILTER_KEYS) next.delete(key);
    });
    setTerm('');
  }, [write]);

  /* --- Debounced search ------------------------------------------------ */
  useEffect(() => {
    if (term.trim() === search) return;
    const timer = window.setTimeout(() => {
      write((next) => {
        const value = term.trim();
        if (value) next.set('search', value);
        else next.delete('search');
        next.delete('page');
      });
    }, 300);
    return () => window.clearTimeout(timer);
  }, [term, search, write]);

  /* --- Price range: a draft the user can actually type into ------------- */
  const [priceDraft, setPriceDraft] = useState({
    min: minPrice != null ? String(minPrice) : '',
    max: maxPrice != null ? String(maxPrice) : '',
  });

  useEffect(() => {
    setPriceDraft({
      min: minPrice != null ? String(minPrice) : '',
      max: maxPrice != null ? String(maxPrice) : '',
    });
  }, [minPrice, maxPrice]);

  const applyPrice = useCallback(() => {
    const min = priceDraft.min.trim() === '' ? undefined : Number(priceDraft.min);
    const max = priceDraft.max.trim() === '' ? undefined : Number(priceDraft.max);
    if (min != null && (!Number.isFinite(min) || min < 0)) return;
    if (max != null && (!Number.isFinite(max) || max < 0)) return;
    write((next) => {
      if (min != null) next.set('minPrice', String(min));
      else next.delete('minPrice');
      if (max != null) next.set('maxPrice', String(max));
      else next.delete('maxPrice');
      next.delete('page');
    });
  }, [priceDraft, write]);

  /* --- Data ------------------------------------------------------------ */
  const query = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      ...(search ? { search } : {}),
      ...(categoryParam ? { categories: categoryParam } : {}),
      ...(minPrice != null ? { minPrice } : {}),
      ...(maxPrice != null ? { maxPrice } : {}),
      ...(organic ? { isOrganic: 'true' } : {}),
      sortBy: SORT_MAP[sort].sortBy,
      sortOrder: SORT_MAP[sort].sortOrder,
    }),
    [page, search, categoryParam, minPrice, maxPrice, organic, sort],
  );

  const { data, isLoading, isFetching, isError, error, refetch } = useProducts(query);
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();

  const products = data?.data ?? [];
  const total = data?.filters?.totalResults ?? data?.pagination.totalProducts ?? products.length;

  /* --- Mobile filter sheet --------------------------------------------- */
  const [sheetOpen, setSheetOpen] = useState(false);
  const sheetTrigger = useRef<HTMLButtonElement>(null);
  const closeSheet = useCallback(() => {
    setSheetOpen(false);
    // Send focus back to the control that opened the sheet.
    sheetTrigger.current?.focus();
  }, []);
  const gridRef = useRef<HTMLElement>(null);

  useScrollLock(sheetOpen);

  useEffect(() => {
    if (!sheetOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeSheet();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sheetOpen, closeSheet]);

  /* --- Derived --------------------------------------------------------- */
  const activeCount =
    (search ? 1 : 0) +
    selectedCategories.length +
    (organic ? 1 : 0) +
    (minPrice != null || maxPrice != null ? 1 : 0);

  const categoryName = useCallback(
    (id: string) => categories.find((c) => String(c.id) === id)?.name ?? `Aisle ${id}`,
    [categories],
  );

  const chips: Array<{ key: string; label: string; clear: () => void }> = [];
  if (search) {
    chips.push({
      key: 'search',
      label: `“${search}”`,
      clear: () => write((next) => next.delete('search')),
    });
  }
  for (const id of selectedCategories) {
    chips.push({
      key: `cat-${id}`,
      label: categoryName(id),
      clear: () => toggleCategory(id),
    });
  }
  if (minPrice != null || maxPrice != null) {
    chips.push({
      key: 'price',
      label: priceLabel(minPrice, maxPrice),
      clear: () =>
        write((next) => {
          next.delete('minPrice');
          next.delete('maxPrice');
          next.delete('page');
        }),
    });
  }
  if (organic) {
    chips.push({ key: 'organic', label: 'Organic only', clear: () => setOrganic(false) });
  }

  const goToPage = (next: number) => {
    write((p) => {
      if (next <= 1) p.delete('page');
      else p.set('page', String(next));
    });
    gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const panel = () => (
    <FilterPanel
      categories={categories}
      categoriesLoading={categoriesLoading}
      selected={selectedCategories}
      onToggleCategory={toggleCategory}
      organic={organic}
      onOrganicChange={setOrganic}
      priceDraft={priceDraft}
      onPriceDraft={setPriceDraft}
      onPriceApply={applyPrice}
      onClearAll={clearAll}
      activeCount={activeCount}
    />
  );

  const showEmpty = !isLoading && !isError && products.length === 0;

  return (
    <div className="shell py-10 md:py-14">
      {/* Header --------------------------------------------------------- */}
      <header className="stagger" style={{ '--i': 0 } as never}>
        <span className="eyebrow">The market stall</span>
        <h1 className="mt-3 text-3xl leading-[1.05] md:text-4xl">All produce</h1>
        <p
          role="status"
          aria-live="polite"
          className="mt-2.5 font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-ink-3"
        >
          {isLoading
            ? 'Reading the ledger…'
            : showEmpty
              ? `No match for ${search ? `“${search}”` : 'those filters'}`
              : plural(total, 'produce item')}
          {isFetching && !isLoading && <span className="ml-2 text-ember">Updating…</span>}
        </p>
      </header>

      {/* Toolbar -------------------------------------------------------- */}
      <div
        className="stagger mt-7 flex flex-col gap-3 sm:flex-row sm:items-end"
        style={{ '--i': 1 } as never}
      >
        <div className="relative flex-1">
          <Input
            name="search"
            label="Search produce"
            type="search"
            icon={<Search className="size-4" aria-hidden />}
            placeholder="Mangoes, spinach, tomatoes…"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            className="h-12 pr-11 [&::-webkit-search-cancel-button]:hidden"
          />
          {term && (
            <IconButton
              label="Clear search"
              size="sm"
              tone="paper"
              className="absolute right-2 top-[1.9rem]"
              onClick={() => {
                setTerm('');
                write((next) => next.delete('search'));
              }}
            >
              <X className="size-3.5" aria-hidden />
            </IconButton>
          )}
        </div>

        <div className="flex items-end gap-2">
          <Select
            name="sort"
            label="Sort by"
            value={sort}
            onChange={(e) => patchSort(e.target.value)}
            options={SORT_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
            containerClassName="w-full sm:w-56"
          />
          <Button
            ref={sheetTrigger}
            type="button"
            variant="outline"
            className="lg:hidden"
            aria-expanded={sheetOpen}
            aria-controls="pf-filter-sheet"
            onClick={() => setSheetOpen(true)}
            leftIcon={<SlidersHorizontal className="size-4" aria-hidden />}
          >
            Filters
            {activeCount > 0 && <span className="tnum ml-0.5">({activeCount})</span>}
          </Button>
        </div>
      </div>

      {/* Active filter chips -------------------------------------------- */}
      {chips.length > 0 && (
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span className="font-mono text-[0.625rem] uppercase tracking-[0.18em] text-ink-3">
            Filtering by
          </span>
          {chips.map((c) => (
            <span
              key={c.key}
              className="inline-flex items-center gap-1 rounded-full border border-rule bg-paper-card py-0.5 pl-3 pr-0.5"
            >
              <span className="font-mono text-[0.625rem] uppercase tracking-[0.12em] text-ink-2">
                {c.label}
              </span>
              <IconButton
                label={`Remove filter: ${c.label}`}
                size="sm"
                tone="paper"
                onClick={c.clear}
              >
                <X className="size-3" aria-hidden />
              </IconButton>
            </span>
          ))}
          <Button variant="ghost" size="sm" onClick={clearAll} className="ml-1">
            Clear all
          </Button>
        </div>
      )}

      {/* Body ----------------------------------------------------------- */}
      <div className="mt-8 grid gap-10 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-12">
        {/* Desktop rail */}
        <aside className="hidden lg:sticky lg:top-28 lg:block lg:self-start">
          <h2 className="sr-only">Filter produce</h2>
          <Card className="p-5">{panel()}</Card>
        </aside>

        {/* Results */}
        <section ref={gridRef} aria-label="Produce results" className="scroll-mt-28">
          <h2 className="sr-only">Results</h2>

          {isError ? (
            <ErrorState
              title="The stall list did not load"
              message={errText(error, 'We could not read the catalogue just now.')}
              onRetry={refetch}
            />
          ) : showEmpty ? (
            <EmptyState
              icon={<Search className="size-6" aria-hidden />}
              title="Nothing matches that"
              body={
                search
                  ? `We could not find produce for “${search}” with the filters you picked.`
                  : 'No produce matches the filters you picked. Try widening the range.'
              }
              action={
                <Button variant="ember" onClick={clearAll}>
                  Clear filters
                </Button>
              }
            />
          ) : (
            <div
              key={`${categoryParam}|${search}|${minPrice ?? ''}-${maxPrice ?? ''}|${organic}|${sort}|${page}`}
            >
              <ProductGrid products={isLoading ? undefined : products} skeletonCount={8} />
            </div>
          )}

          <div className="mt-10 flex flex-col items-center gap-3">
            {!isError && !showEmpty && (
              <Pagination
                page={data?.pagination.currentPage ?? page}
                totalPages={data?.pagination.totalPages ?? 1}
                onChange={goToPage}
              />
            )}
            {data && data.pagination.totalPages > 1 && !isError && (
              <p className="tnum font-mono text-[0.625rem] uppercase tracking-[0.18em] text-ink-3">
                Page {data.pagination.currentPage} of {data.pagination.totalPages} ·{' '}
                {plural(data.pagination.totalProducts ?? total, 'item')}
              </p>
            )}
          </div>
        </section>
      </div>

      {/* Mobile filter sheet -------------------------------------------- */}
      {sheetOpen && (
        <div
          className="fixed inset-0 z-[90] bg-ink/45 backdrop-blur-[3px] lg:hidden"
          onClick={closeSheet}
          aria-hidden
        />
      )}

      <div
        id="pf-filter-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="Filter produce"
        aria-hidden={sheetOpen ? undefined : true}
        className={cn(
          'fixed inset-x-0 bottom-0 z-[95] flex max-h-[85dvh] flex-col lg:hidden',
          'rounded-t-xl border-t border-rule bg-paper shadow-float',
          'transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
          sheetOpen ? 'translate-y-0' : 'pointer-events-none translate-y-full',
        )}
      >
        {sheetOpen && (
          <>
            <header className="flex items-center justify-between border-b border-rule px-5 py-4">
              <div>
                <p className="font-mono text-[0.625rem] uppercase tracking-[0.2em] text-ember">
                  Narrow the stall
                </p>
                <h2 className="mt-0.5 text-2xl">Filters</h2>
              </div>
              <IconButton
                label="Close filters"
                tone="paper"
                autoFocus
                onClick={closeSheet}
              >
                <X className="size-4" aria-hidden />
              </IconButton>
            </header>

            <div className="flex-1 overflow-y-auto px-5 py-5">{panel()}</div>

            <footer className="grid grid-cols-2 gap-2 border-t border-rule bg-paper-card px-5 py-4">
              <Button variant="outline" onClick={clearAll}>
                Clear all
              </Button>
              <Button variant="ember" onClick={closeSheet}>
                Show {plural(total, 'result')}
              </Button>
            </footer>
          </>
        )}
      </div>
    </div>
  );
}
