/* ==========================================================================
   PRADHANFRESH — PRODUCE ENTRY
   One component for /admin/products/new and /admin/products/edit/:id.
   The form is the ledger line; the panel on the right is the shop window —
   exactly what the customer will see once it is saved.
   ========================================================================== */

import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, ImageIcon, Package, Undo2, Upload } from 'lucide-react';
import { Button, IconButton } from '../../components/ui/Button';
import { Checkbox, Input, Select, Textarea } from '../../components/ui/Field';
import {
  Badge,
  ErrorState,
  LoadingBlock,
  Spinner,
  useToast,
} from '../../components/ui/Feedback';
import { Card, PriceTag, ProseImage } from '../../components/ui/Surface';
import { ApiError } from '../../lib/api';
import {
  errText,
  uploadImage,
  useCategories,
  useProduct,
  useSaveProduct,
  type ProductInput,
} from '../../lib/catalog';
import { cn, money, plural } from '../../lib/format';
import type { Product } from '../../lib/types';

/* -------------------------------------------------------------------------- */
/*  Form state                                                                 */
/* -------------------------------------------------------------------------- */

interface FormState {
  name: string;
  shortDescription: string;
  description: string;
  categoryId: string;
  price: string;
  salePrice: string;
  stock: string;
  weight: string;
  sku: string;
  unit: string;
  thumbnail: string;
  isFeatured: boolean;
  isOrganic: boolean;
}

type FieldKey =
  | 'name'
  | 'shortDescription'
  | 'description'
  | 'categoryId'
  | 'price'
  | 'salePrice'
  | 'stock'
  | 'weight'
  | 'sku'
  | 'unit'
  | 'thumbnail';

type Errors = Partial<Record<FieldKey, string>>;

const EMPTY: FormState = {
  name: '',
  shortDescription: '',
  description: '',
  categoryId: '',
  price: '',
  salePrice: '',
  stock: '0',
  weight: '',
  sku: '',
  unit: 'kg',
  thumbnail: '',
  isFeatured: false,
  isOrganic: false,
};

const SHORT_DESCRIPTION_MAX = 160;

/** `weight` is cleared with `null`, which `ProductInput` does not model. */
type ProductPayload = Omit<ProductInput, 'weight'> & { weight?: number | null };

const UNITS: Array<{ value: string; label: string }> = [
  { value: 'kg', label: 'Kilogram (kg)' },
  { value: 'g', label: 'Gram (g)' },
  { value: 'piece', label: 'Piece' },
  { value: 'dozen', label: 'Dozen' },
  { value: 'bunch', label: 'Bunch' },
  { value: 'packet', label: 'Packet' },
];

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

/* -------------------------------------------------------------------------- */
/*  Mapping — field by field, never a spread of the API response               */
/* -------------------------------------------------------------------------- */

function mapProduct(product: Product): FormState {
  const categoryId =
    product.categoryId ?? (product.category?.id != null ? product.category.id : null);
  return {
    name: product.name ?? '',
    shortDescription: product.shortDescription ?? '',
    description: product.description ?? '',
    categoryId: categoryId != null ? String(categoryId) : '',
    price: Number.isFinite(product.price) ? String(product.price) : '',
    salePrice:
      product.salePrice != null && Number.isFinite(product.salePrice)
        ? String(product.salePrice)
        : '',
    stock: Number.isFinite(product.stock) ? String(product.stock) : '0',
    weight:
      product.weight != null && Number.isFinite(product.weight) ? String(product.weight) : '',
    sku: product.sku ?? '',
    unit: product.unit ?? '',
    thumbnail: product.thumbnail ?? '',
    isFeatured: Boolean(product.isFeatured),
    isOrganic: Boolean(product.isOrganic),
  };
}

function sameForm(a: FormState, b: FormState): boolean {
  return (Object.keys(a) as Array<keyof FormState>).every((key) => a[key] === b[key]);
}

/* -------------------------------------------------------------------------- */
/*  Validation — runs before anything is sent, so we never POST NaN             */
/* -------------------------------------------------------------------------- */

function validate(values: FormState): Errors {
  const errors: Errors = {};

  if (!values.name.trim()) {
    errors.name = 'Give this produce a name customers will recognise.';
  }
  if (values.shortDescription.length > SHORT_DESCRIPTION_MAX) {
    errors.shortDescription = `Keep the short description to ${SHORT_DESCRIPTION_MAX} characters or fewer.`;
  }
  if (!values.description.trim()) {
    errors.description = 'A description is required — it is the body copy on the product page.';
  }
  if (!values.categoryId) {
    errors.categoryId = 'Choose the aisle this produce belongs in.';
  }

  const price = Number(values.price.trim());
  if (values.price.trim() === '' || !Number.isFinite(price) || price <= 0) {
    errors.price = 'Enter a price greater than ₹0.';
  }

  if (values.salePrice.trim() !== '') {
    const sale = Number(values.salePrice.trim());
    if (!Number.isFinite(sale) || sale <= 0) {
      errors.salePrice = 'The offer price must be greater than ₹0.';
    } else if (Number.isFinite(price) && sale >= price) {
      errors.salePrice = 'The offer price must be lower than the regular price.';
    }
  }

  if (values.stock.trim() === '' || !Number.isInteger(Number(values.stock)) || Number(values.stock) < 0) {
    errors.stock = 'Stock must be a whole number, zero or more.';
  }

  if (values.weight.trim() !== '') {
    const weight = Number(values.weight.trim());
    if (!Number.isFinite(weight) || weight <= 0) {
      errors.weight = 'Weight must be greater than 0, or leave it empty.';
    }
  }

  if (!values.sku.trim()) {
    errors.sku = 'Every crate needs a SKU, e.g. PF-APP-001.';
  }
  if (!values.unit) {
    errors.unit = 'Pick the unit this is sold in.';
  }
  if (!values.thumbnail.trim()) {
    errors.thumbnail = 'Add a photograph — it is the first thing a customer sees.';
  }

  return errors;
}

/* -------------------------------------------------------------------------- */
/*  Preview — the catalogue card, live                                         */
/* -------------------------------------------------------------------------- */

function PreviewCard({
  values,
  categoryName,
}: {
  values: FormState;
  categoryName: string;
}) {
  const price = Number(values.price.trim());
  const sale = Number(values.salePrice.trim());
  const stock = Number(values.stock.trim());
  const showPrice = Number.isFinite(price) && price > 0;
  const onSale = showPrice && values.salePrice.trim() !== '' && Number.isFinite(sale) && sale > 0 && sale < price;
  const realStock = Number.isFinite(stock) ? stock : 0;
  const soldOut = realStock <= 0;
  const low = !soldOut && realStock <= 5;
  const name = values.name.trim() || 'Untitled produce';
  const off = onSale && showPrice ? Math.round(((price - sale) / price) * 100) : 0;

  return (
    <div className="lg:sticky lg:top-6">
      <p className="font-mono text-[0.6875rem] uppercase tracking-[0.2em] text-ink-3">
        Shop window
      </p>
      <h2 className="mt-2 text-2xl">How it will look</h2>
      <p className="mt-1.5 text-xs leading-relaxed text-ink-2">
        A live copy of the catalogue tile, built from the fields on the left.
      </p>

      <Card className="mt-4 overflow-hidden">
        <div className="relative aspect-[4/3] bg-paper-deep">
          <ProseImage
            src={values.thumbnail.trim()}
            alt={`Photograph of ${name} as it will appear in the catalogue`}
            className="size-full"
            loading="eager"
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
            {values.isOrganic && !soldOut && (
              <span className="rounded-full bg-leaf px-2.5 py-1 font-mono text-[0.5625rem] font-medium uppercase tracking-[0.14em] text-paper">
                Organic
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2.5 p-4">
          {categoryName && (
            <p className="font-mono text-[0.5625rem] uppercase tracking-[0.18em] text-ink-3">
              {categoryName}
            </p>
          )}
          <h3 className="font-display text-lg font-semibold leading-tight text-ink">{name}</h3>
          {values.shortDescription.trim() && (
            <p className="line-clamp-3 text-sm leading-relaxed text-ink-3">
              {values.shortDescription.trim()}
            </p>
          )}

          <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
            {showPrice ? (
              <PriceTag
                price={price}
                salePrice={onSale ? sale : null}
                unit={values.unit || undefined}
              />
            ) : (
              <span className="font-mono text-xs uppercase tracking-[0.12em] text-ink-4">
                No price yet
              </span>
            )}
            {values.isFeatured && <Badge tone="ember">Featured</Badge>}
          </div>

          <div className="mt-1 flex items-center gap-2 border-t border-rule-soft pt-3">
            <Badge tone={soldOut ? 'ember' : low ? 'citrus' : 'leaf'} dot>
              {soldOut ? 'Sold out' : low ? `Only ${plural(realStock, 'unit')}` : 'In stock'}
            </Badge>
            <span className="truncate font-mono text-[0.625rem] uppercase tracking-[0.12em] text-ink-3">
              {values.sku.trim() || 'NO-SKU'}
            </span>
          </div>

          {values.description.trim() && (
            <p className="border-t border-rule-soft pt-3 text-xs leading-relaxed text-ink-3">
              {values.description.trim()}
            </p>
          )}
        </div>
      </Card>

      <p className="mt-3 text-xs leading-relaxed text-ink-3">
        Availability is derived by the server from stock — it cannot be set by hand, and a strike
        through the price only shows when the offer price is lower than the regular one.
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { notify } = useToast();

  const parsedId = id != null ? Number(id) : NaN;
  const isEdit = id != null && Number.isFinite(parsedId) && parsedId > 0;
  const productId = isEdit ? parsedId : undefined;

  const product = useProduct(productId);
  const categories = useCategories();
  const save = useSaveProduct(productId);

  const [values, setValues] = useState<FormState>(EMPTY);
  const [baseline, setBaseline] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);
  const seeded = useRef(false);

  /* Seed once, field by field, when the product arrives. */
  useEffect(() => {
    const fetched = product.data;
    if (!fetched || seeded.current) return;
    seeded.current = true;
    const next = mapProduct(fetched);
    setValues(next);
    setBaseline(next);
  }, [product.data]);

  /* Revoke the object URL created for a locally picked file. */
  useEffect(
    () => () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
    },
    [localPreview],
  );

  const dirty = useMemo(() => !sameForm(values, baseline), [values, baseline]);

  /* Unsaved-changes guard for a real page unload. */
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty]);

  /** Applies a patch and clears the error for exactly the fields it touches. */
  const set = (patch: Partial<FormState>) => {
    setValues((prev) => ({ ...prev, ...patch }));
    setErrors((prev) => {
      const keys = Object.keys(patch) as FieldKey[];
      if (!keys.some((key) => prev[key])) return prev;
      const next: Errors = { ...prev };
      for (const key of keys) delete next[key];
      return next;
    });
    setSubmitError(null);
  };

  /* ---- Edit mode chrome --------------------------------------------- */
  if (id != null && !isEdit) {
    return (
      <div className="shell py-16">
        <ErrorState
          title="That product link is not valid"
          message="The address pointed at a product id we cannot read. Open the inventory list and pick a crate to edit."
          onRetry={() => navigate('/admin/products')}
        />
      </div>
    );
  }

  if (isEdit && product.isPending) {
    return (
      <div className="shell py-16">
        <LoadingBlock label="Fetching the ledger line" />
      </div>
    );
  }

  if (isEdit && product.isError) {
    return (
      <div className="shell py-16">
        <ErrorState
          title="That crate could not be fetched"
          message={errText(product.error, 'We could not load this product.')}
          onRetry={() => void product.refetch()}
        />
      </div>
    );
  }

  const activeProduct = isEdit ? product.data : undefined;
  const unitOptions = UNITS.some((u) => u.value === values.unit)
    ? UNITS
    : values.unit
      ? [{ value: values.unit, label: `${values.unit} (current)` }, ...UNITS]
      : UNITS;

  const categoryOptions = [
    { value: '', label: 'Choose an aisle…', disabled: true },
    ...(categories.data ?? []).map((c) => ({
      value: String(c.id),
      label: c.name,
    })),
  ];
  // Never silently drop a category the API knows about but /categories omitted.
  if (
    values.categoryId &&
    !(categories.data ?? []).some((c) => String(c.id) === values.categoryId)
  ) {
    categoryOptions.splice(1, 0, { value: values.categoryId, label: 'Current aisle' });
  }
  const categoryName =
    (categories.data ?? []).find((c) => String(c.id) === values.categoryId)?.name ??
    activeProduct?.category?.name ??
    '';

  /* ---- Image ---------------------------------------------------------- */
  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.target;
    const file = input.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrors((prev) => ({ ...prev, thumbnail: 'That file is not an image. Pick a JPEG or PNG.' }));
      notify('That file is not an image. Pick a JPEG or PNG.', 'error');
      input.value = '';
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setErrors((prev) => ({ ...prev, thumbnail: 'That image is over 5 MB. Choose a smaller one.' }));
      notify('That image is over 5 MB. Choose a smaller one.', 'error');
      input.value = '';
      return;
    }

    setLocalPreview(URL.createObjectURL(file));
    setUploading(true);
    setErrors((prev) => ({ ...prev, thumbnail: undefined }));
    setSubmitError(null);

    try {
      const url = await uploadImage(file);
      set({ thumbnail: url });
      notify('Photograph uploaded.');
    } catch (err) {
      setLocalPreview(null);
      const message = errText(err, 'The photograph could not be uploaded.');
      setErrors((prev) => ({ ...prev, thumbnail: message }));
      notify(message, 'error');
    } finally {
      setUploading(false);
      input.value = '';
    }
  };

  /* ---- Submit --------------------------------------------------------- */
  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const found = validate(values);
    setErrors(found);
    setSubmitError(null);

    if (Object.keys(found).length > 0) {
      const first = document.querySelector<HTMLElement>('#produce-form [aria-invalid="true"]');
      first?.focus();
      return;
    }

    const price = Number(values.price.trim());
    const stock = Number(values.stock.trim());
    const weight =
      values.weight.trim() === '' ? null : Number(values.weight.trim());
    const sale = values.salePrice.trim() === '' ? null : Number(values.salePrice.trim());

    const payload: ProductPayload = {
      name: values.name.trim(),
      // An empty string is how the backend is told to clear the field.
      shortDescription: values.shortDescription.trim(),
      description: values.description.trim(),
      categoryId: Number(values.categoryId),
      price,
      salePrice: sale,
      thumbnail: values.thumbnail.trim(),
      // `images` is deliberately left out: create falls back to [thumbnail] and
      // a partial update keeps whatever gallery the product already has.
      stock,
      weight,
      sku: values.sku.trim(),
      unit: values.unit,
      isFeatured: values.isFeatured,
      isOrganic: values.isOrganic,
    };

    try {
      // One narrowing assertion: every other field is checked by ProductInput.
      const saved = await save.mutateAsync(payload as ProductInput);
      setBaseline(values);
      notify(
        isEdit
          ? `${saved?.name || payload.name} was updated.`
          : `${payload.name} was added to the catalogue.`,
      );
      navigate('/admin');
    } catch (err) {
      const message = errText(err, 'The product could not be saved.');
      if (err instanceof ApiError && err.isConflict) {
        setErrors((prev) => ({ ...prev, sku: message }));
        setSubmitError(
          `That SKU is already in the ledger — ${message} Choose a different code and try again.`,
        );
        notify('That SKU is already in use by another product.', 'error');
        document.getElementById('produce-form')?.scrollTo({ top: 0 });
        return;
      }
      setSubmitError(message);
      notify(message, 'error');
    }
  };

  const discard = () => {
    setValues(baseline);
    setErrors({});
    setSubmitError(null);
    setLocalPreview(null);
    if (fileRef.current) fileRef.current.value = '';
    notify('Unsaved changes discarded.', 'info');
  };

  const errorCount = Object.values(errors).filter(Boolean).length;
  const previewSrc = localPreview ?? values.thumbnail.trim();

  return (
    <div className="shell py-10 md:py-14">
      {/* ---- Page head --------------------------------------------------- */}
      <div className="flex flex-col gap-5 border-b border-rule pb-8 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <span className="eyebrow">{isEdit ? 'Amend ledger line' : 'New entry'}</span>
          <h1 className="mt-3 text-4xl leading-[1.02] md:text-5xl">
            {isEdit ? 'Edit this produce' : 'Add produce to the market'}
          </h1>
          <p className="mt-2.5 max-w-xl text-sm leading-relaxed text-ink-2">
            {isEdit
              ? 'Change what is wrong. The shop window on the right updates as you type.'
              : 'Fill the line and the produce goes straight onto the shop window. Everything marked with an asterisk has to be right.'}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span
            className={cn(
              'font-mono text-[0.6875rem] uppercase tracking-[0.16em]',
              dirty ? 'text-ember' : 'text-ink-3',
            )}
          >
            {dirty ? 'Unsaved changes' : 'No changes yet'}
          </span>
          <Button
            to="/admin"
            variant="outline"
            size="sm"
            rightIcon={<ArrowRight className="size-4" aria-hidden />}
          >
            Back to ledger
          </Button>
        </div>
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        {/* ---- Form ------------------------------------------------------ */}
        <form
          id="produce-form"
          noValidate
          onSubmit={(e) => void onSubmit(e)}
          className="min-w-0 space-y-10"
        >
          <div role="status" aria-live="polite" className="sr-only">
            {submitError ?? (errorCount > 0 ? `${plural(errorCount, 'field')} need attention.` : '')}
          </div>

          {submitError && (
            <div
              role="alert"
              className="flex flex-wrap items-start justify-between gap-3 rounded-md border border-ember-line bg-ember-soft/60 px-4 py-3.5"
            >
              <p className="text-sm leading-relaxed text-ink-2">{submitError}</p>
              <IconButton label="Dismiss the save error" size="sm" onClick={() => setSubmitError(null)}>
                <Undo2 className="size-3.5" aria-hidden />
              </IconButton>
            </div>
          )}

          {/* ---- Identity ------------------------------------------------ */}
          <fieldset className="space-y-5">
            <legend className="font-mono text-[0.6875rem] font-medium uppercase tracking-[0.2em] text-ember">
              Identity
            </legend>

            <Input
              name="name"
              label="Name"
              required
              value={values.name}
              onChange={(e) => set({ name: e.target.value })}
              error={errors.name}
              placeholder="Shimla Apples"
              hint="The headline on the catalogue tile. Renaming an existing product regenerates its URL."
              maxLength={120}
            />

            <Input
              name="shortDescription"
              label="Short description"
              value={values.shortDescription}
              onChange={(e) => set({ shortDescription: e.target.value })}
              error={errors.shortDescription}
              placeholder="Crisp, cold-stored, straight from Nashik."
              hint={`${values.shortDescription.length}/${SHORT_DESCRIPTION_MAX} characters. Shown under the name on the tile.`}
              maxLength={SHORT_DESCRIPTION_MAX}
            />

            <Textarea
              name="description"
              label="Description"
              required
              rows={6}
              value={values.description}
              onChange={(e) => set({ description: e.target.value })}
              error={errors.description}
              placeholder="Where it was grown, when it was picked, how it should be stored…"
              hint="The body copy on the product page. Required by the market."
            />
          </fieldset>

          {/* ---- Aisle + units ------------------------------------------ */}
          <fieldset className="space-y-5">
            <legend className="font-mono text-[0.6875rem] font-medium uppercase tracking-[0.2em] text-ember">
              Aisle &amp; packing
            </legend>

            {categories.isPending ? (
              <div className="flex items-center gap-3 rounded-md border border-rule bg-paper-card px-3.5 py-3">
                <Spinner className="text-ember" />
                <span className="text-sm text-ink-3">Loading the aisles…</span>
              </div>
            ) : (
              <Select
                name="categoryId"
                label="Aisle"
                required
                value={values.categoryId}
                onChange={(e) => set({ categoryId: e.target.value })}
                error={errors.categoryId}
                options={categoryOptions}
                hint="The section of the market this produce is shelved in."
              />
            )}

            {categories.isError && (
              <p role="alert" className="text-xs font-medium text-bad">
                {errText(categories.error, 'The aisles could not be loaded, so nothing can be saved yet.')}
              </p>
            )}

            <div className="grid gap-5 sm:grid-cols-2">
              <Input
                name="sku"
                label="SKU"
                required
                value={values.sku}
                onChange={(e) => set({ sku: e.target.value.toUpperCase() })}
                error={errors.sku}
                placeholder="PF-APP-001"
                autoCapitalize="characters"
                autoCorrect="off"
                spellCheck={false}
                maxLength={32}
                hint="Unique across the market. Stored in upper case."
              />
              <Select
                name="unit"
                label="Sold by"
                required
                value={values.unit}
                onChange={(e) => set({ unit: e.target.value })}
                error={errors.unit}
                options={unitOptions}
                hint="The unit every price is quoted in."
              />
            </div>

            <Input
              name="weight"
              label="Weight"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={values.weight}
              onChange={(e) => set({ weight: e.target.value })}
              error={errors.weight}
              placeholder="0.5"
              hint="Optional. Grams or kilos as the crate is packed."
            />
          </fieldset>

          {/* ---- Pricing ------------------------------------------------- */}
          <fieldset className="space-y-5">
            <legend className="font-mono text-[0.6875rem] font-medium uppercase tracking-[0.2em] text-ember">
              Pricing &amp; stock
            </legend>

            <div className="grid gap-5 sm:grid-cols-2">
              <Input
                name="price"
                label="Regular price"
                required
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                value={values.price}
                onChange={(e) => set({ price: e.target.value })}
                error={errors.price}
                placeholder="249"
                hint="Rupees per unit. Must be more than ₹0."
              />
              <Input
                name="salePrice"
                label="Offer price"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                value={values.salePrice}
                onChange={(e) => set({ salePrice: e.target.value })}
                error={errors.salePrice}
                placeholder="199"
                hint="Leave empty for no discount. When set, it must be lower than the regular price."
              />
            </div>

            <Input
              name="stock"
              label="Units in stock"
              type="number"
              inputMode="numeric"
              step="1"
              min="0"
              value={values.stock}
              onChange={(e) => set({ stock: e.target.value })}
              error={errors.stock}
              hint="Availability is derived from this — a stock of zero takes the produce off the shelf."
            />

            <div className="grid gap-3 rounded-md border border-rule bg-paper-card p-4 sm:grid-cols-2">
              <Checkbox
                name="isOrganic"
                label="Organic"
                description="Adds the green Organic seal on the tile."
                checked={values.isOrganic}
                onChange={(e) => set({ isOrganic: e.target.checked })}
              />
              <Checkbox
                name="isFeatured"
                label="Featured"
                description="Puts it in the featured rail on the front page."
                checked={values.isFeatured}
                onChange={(e) => set({ isFeatured: e.target.checked })}
              />
            </div>
          </fieldset>

          {/* ---- Photograph --------------------------------------------- */}
          <fieldset className="space-y-5">
            <legend className="font-mono text-[0.6875rem] font-medium uppercase tracking-[0.2em] text-ember">
              Photograph
            </legend>

            <div className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-mono text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-ink-3">
                  Image <span className="text-ember">*</span>
                </span>
                {values.thumbnail.trim() && (
                  <IconButton
                    label="Remove the current image"
                    size="sm"
                    tone="ember"
                    onClick={() => {
                      setLocalPreview(null);
                      set({ thumbnail: '' });
                      if (fileRef.current) fileRef.current.value = '';
                    }}
                  >
                    <Undo2 className="size-3.5" aria-hidden />
                  </IconButton>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/*
                  The native control is `sr-only`, not `hidden`: it stays in the
                  tab order and keeps a real accessible name from its <label>.
                */}
                <input
                  ref={fileRef}
                  id="produce-image-file"
                  name="produce-image-file"
                  type="file"
                  accept="image/*"
                  className="peer sr-only"
                  onChange={(e) => void handleFile(e)}
                  disabled={uploading}
                  aria-describedby="produce-image-hint"
                />
                <label
                  htmlFor="produce-image-file"
                  className={cn(
                    'inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-md border border-rule-strong',
                    'bg-paper-card px-5 text-sm font-medium text-ink transition-colors duration-200',
                    'hover:bg-ink hover:text-paper peer-focus-visible:outline peer-focus-visible:outline-2',
                    'peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ember',
                    uploading && 'pointer-events-none opacity-50',
                  )}
                >
                  {uploading ? (
                    <Spinner className="size-4" />
                  ) : (
                    <Upload className="size-4" aria-hidden />
                  )}
                  {uploading ? 'Uploading…' : 'Upload photograph'}
                </label>
                <p id="produce-image-hint" className="text-xs text-ink-3">
                  JPEG, PNG or WebP, up to 5 MB.
                </p>
              </div>

              <div aria-live="polite" className="sr-only">
                {uploading ? 'Uploading the photograph' : ''}
              </div>

              {uploading && (
                <div aria-hidden className="h-1 w-full overflow-hidden rounded-full bg-paper-deep">
                  <div className="h-full w-1/3 rounded-full bg-ember animate-pulse" />
                </div>
              )}

              <Input
                name="thumbnail"
                label="…or paste an image URL"
                type="url"
                inputMode="url"
                value={values.thumbnail}
                onChange={(e) => {
                  setLocalPreview(null);
                  set({ thumbnail: e.target.value });
                }}
                error={errors.thumbnail}
                placeholder="/uploads/photograph.jpg"
                icon={<ImageIcon className="size-4" aria-hidden />}
                hint="Either upload a file or paste a URL — whatever is here is what the shop shows."
              />

              {previewSrc && (
                <ProseImage
                  src={previewSrc}
                  alt={`Preview of the photograph for ${values.name.trim() || 'this produce'}`}
                  className="aspect-[16/9] w-full max-w-md rounded-md border border-rule"
                  loading="eager"
                />
              )}
            </div>
          </fieldset>

          {/* ---- Actions ------------------------------------------------- */}
          <div className="flex flex-wrap items-center gap-3 border-t border-rule pt-8">
            <Button
              type="submit"
              variant="ember"
              loading={save.isPending}
              disabled={uploading}
              leftIcon={<Package className="size-4" aria-hidden />}
            >
              {isEdit ? 'Save changes' : 'Create product'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={discard}
              disabled={!dirty || save.isPending}
              leftIcon={<Undo2 className="size-4" aria-hidden />}
            >
              Discard changes
            </Button>
            {uploading && <span className="text-xs text-ink-3">Finish the upload before saving.</span>}
          </div>
        </form>

        {/* ---- Live preview ---------------------------------------------- */}
        <PreviewCard values={values} categoryName={categoryName} />
      </div>

      {activeProduct && (
        <p className="mt-10 border-t border-rule pt-5 font-mono text-[0.625rem] uppercase tracking-[0.16em] text-ink-4">
          Ledger line #{activeProduct.id} · currently listed at{' '}
          {money(activeProduct.price)} per {activeProduct.unit}
        </p>
      )}
    </div>
  );
}
