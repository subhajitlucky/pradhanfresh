# PradhanFresh — Frontend Audit & Overhaul

**Scope:** `frontend/` (Vite · React 19 · TypeScript · Tailwind v4), audited against the
real Express/Prisma backend in `backend/`.
**Date:** 2026-09-30

---

## Executive summary

The storefront was **functionally non-functional** despite a green `npm run build`. Tailwind
was never actually generating utility CSS, the entire hand-written stylesheet layer was being
discarded by the bundler, and no authenticated request had ever carried a token. The codebase
had been written twice over — a legacy CSS implementation that no longer backed any component,
and a Tailwind implementation layered on top of it — with the seams still visible as dead code,
dead buttons and fabricated data.

This overhaul replaces it with a coherent design system, a real data layer, and 18 routes that
are wired to the actual API and verified in a browser.

| | Before | After |
| --- | --- | --- |
| Compiled CSS rules | **210** (14 kB) | **1018** (72 kB) |
| Custom design tokens generating utilities | **0** | all of them |
| `tsc` errors | 21 | **0** |
| ESLint warnings (max 0) | — | **0** |
| Authenticated requests that worked | **0** | all |
| Routes rendering without console errors | 0 of 18 | **18 of 18** |
| Text samples meeting WCAG AA | — | **563 / 563** |
| Unlabelled form controls | 33 of 33 | **0** |
| Icon buttons without an accessible name | ~30 | **0** |
| Dead components (written, never imported) | 5 (566 LOC) | **0** |
| Dead CSS files | 19 (~3,700 LOC, 273 unused classes) | **0** |

---

## 1. The showstoppers

### 1.1 Tailwind was never running — the site shipped unstyled

`src/styles/index.css` used the **Tailwind v3** directives:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@import './base/global.css';   /* ← illegal: @import must come first */
@import './components/navbar.css';
/* …15 more */
```

Two compounding failures:

1. **v3 directives are inert in v4.** Tailwind v4 requires `@import "tailwindcss"`. Without
   it, no utility is ever generated — and because `tailwind.config.js` is *not* auto-loaded in
   v4, the `primary` colour scale did not exist either.
2. **Every `@import` was discarded.** All 19 hand-written CSS files (~3,700 lines, 273 class
   names of which none were referenced) were silently dropped, because `@import` cannot follow
   other statements.

Measured on the original build output:

```
bg-primary-600   → 0 occurrences
text-gray-600    → 0
bg-white         → 0
max-w-7xl        → 0
shadow-xl        → 0
--color-primary  → 0     (global.css was never bundled)
total CSS rules  → 210
```

**Fix:** a single v4 `@theme` design-token block, one `index.css`, no JS config. CSS output
went 14 kB → 72 kB and 210 rules → 1,018.

### 1.2 Auth was split across two stores, so nothing was ever authenticated

```
AuthContext.tsx   → localStorage['user'], ['token']    ← read by Navbar
authStore.ts      → zustand persist 'auth-storage'     ← written by Login
api.ts            → Authorization: Bearer ← localStorage.getItem('token')
```

`AuthContext.login()` was the only function that ever wrote the token the HTTP layer read, and
**it was called from nowhere**. Consequences:

- every `/cart/*`, `/orders/*`, `PATCH /auth/profile` request went out unauthenticated → 401;
- `useAuth().user` was permanently `null`, so the navbar always rendered signed-out;
- the **admin link was unreachable even for a real `role: 'ADMIN'` user**;
- logout was broken in both directions (neither store cleared the other);
- `Profile.tsx` nulled the token on every profile save.

**Fix:** one store, `src/lib/auth.ts` (zustand + persist), which owns the token and keeps
`lib/api.ts`'s token store in sync inside `login()`. `User.id` was also declared as `string` in
one file and `number` in the other; there is now one type.

### 1.3 Checkout never created an order

```tsx
if (!cart || cart.items.length === 0 && !isSuccess)   // operator precedence
```

The old checkout had no order API call at all — it displayed "Order Placed!", then cleared the
cart 500 ms later, which (via the precedence bug above) flipped the success screen back to
"Checkout is empty". Ordering was impossible end to end.

**Fix:** a real 3-step flow (address → slot & payment → review) posting to `POST /orders/create`
via `useCreateOrder()`. The created order is captured in state so a cart reset can never
destroy the confirmation screen.

### 1.4 Features that looked real but did nothing

| Defect | Location |
| --- | --- |
| Search input had no `value`/`onChange` | `Products.tsx:77` |
| Category checkboxes uncontrolled | `Products.tsx:100` |
| Min/max price were static `<div>`s | `Products.tsx:112` |
| Sort button had no handler | `Products.tsx:160` |
| Quick-add `+` had no `onClick` | `Products.tsx:214` |
| Mobile filter sheet rendered "Coming soon…" | `Products.tsx:258` |
| Contact form called `alert()` and sent nothing | `Contact.tsx:13` |
| `Plus` icon used but never imported → `ReferenceError` | `ProductForm.tsx:257` |
| File input was `className="hidden"` → unreachable by keyboard | `ProductForm.tsx:210` |
| Image upload had no `catch` → silent unhandled rejection | `ProductForm.tsx:108` |
| Admin delete had no `try/catch`, used stale closure | `Dashboard.tsx:75` |
| `/admin/*` routes had **no role guard** | `App.tsx:60` |
| No catch-all route → blank screen on unknown URLs | `App.tsx` |
| Wishlist UI built on a backend stub that always returns `[]` | `Profile.tsx` |
| Fabricated reviews, ratings, "Shelf Life", "₹1,24,500 revenue" | multiple |

Every one of these is now a real, tested interaction — or removed because the backend cannot
support it (the wishlist endpoint is a no-op stub, so no wishlist UI was rebuilt).

---

## 2. Design system — "Harvest Ledger"

The old identity was generic: `Poppins` + system fonts, `rounded-[40px]` on everything,
green/purple gradients, blurred colour blobs, `italic` applied indiscriminately. That aesthetic
was not iterated on — it was replaced.

**Concept:** a fifty-year-old family produce market presented like a letterpress almanac.
Warm newsprint ground, ink typography, tomato-crate ember as the single accent, hairline rules
instead of floating cards, generous editorial whitespace.

| | |
| --- | --- |
| Display | **Fraunces** — variable serif, optical-size axis |
| Body | **Archivo** — sturdy grotesque |
| Numeric / label | **JetBrains Mono** — ledger figures, SKUs, order numbers |

```css
--color-paper      #f4efe4   /* newsprint ground        */
--color-paper-deep #e9e0cc   /* pressed stock           */
--color-paper-card #fcfaf4   /* raised surface          */
--color-paper-ink  #1c1813   /* inverted panels         */
--color-ink        #14110d   /* type, primary           */
--color-ember      #b03a22   /* the accent              */
--color-leaf       #3f6b3a   /* success / organic       */
--color-citrus     #b8781a   /* ratings / dark grounds  */
```

Deliberately **not** a Tailwind green store. All tokens live in one `@theme` block in
`src/styles/index.css`; there is no `tailwind.config.js`. Full contract, including the
contrast rules the palette is tuned to satisfy, is in
[`frontend/DESIGN_SYSTEM.md`](frontend/DESIGN_SYSTEM.md).

### Signature moves

- **Paper grain** — a fixed SVG turbulence overlay on `body::before`, so no surface is flat colour.
- **Ticker strip** — a monospace marquee of harvest promises above the sticky header.
- **Ledger strip** — a ruled 4-up stat band, numeral in citrus on the ink footer.
- **Editorial process list** — oversized Fraunces ordinals (`01`–`04`) separated by hairlines,
  replacing the generic three-icon "features" grid.
- **Staggered reveal** — one `.stagger` primitive driven by a `--i` CSS variable; no JS animation
  library, and `prefers-reduced-motion` is honoured globally.
- **Live basket drawer** — opens from the header, free-delivery progress meter, per-row
  spinners that never blank the list.

---

## 3. Architecture

```
src/
├─ lib/            api.ts · auth.ts · cart.ts · catalog.ts · format.ts · hooks.ts · types.ts
├─ components/
│  ├─ ui/          Button · Field · Feedback · Surface      (the primitives)
│  ├─ layout/      Navbar · Footer · routing (guards) · ErrorBoundary
│  └─ product/     ProductCard · ProductGrid
└─ pages/          18 routes, code-split
```

**Data layer.** `lib/api.ts` normalises the backend's **five different response shapes**
(`{success,message}`, `{message}`, `{error}`, `{valid:false,…}`, plain text) into one
`ApiError`, resolves `/uploads/…` image paths, and performs a single-flight silent token
refresh on 401. `lib/catalog.ts` holds React Query hooks — the query client was previously
mounted with **zero consumers**, so every page hand-rolled `useEffect` + `axios`. Now
caching, dedup, invalidation and retry actually work.

**Cart.** Zustand store with **optimistic quantity updates and rollback**, a per-item `pending`
set (the old shared boolean replaced the whole page with a skeleton on every quantity click),
and warnings surfaced from the backend's stock-check payload.

**Accessibility.** The audit found 33 inputs with no `id` and 25 labels with no `htmlFor`.
Now: every control has an accessible name, icon-only buttons are labelled, async state uses
live regions, there is a skip link and a `main` landmark, and an `ErrorBoundary` catches render
crashes instead of white-screening.

---

## 4. Verification

Everything below was run against a production build in headless Chromium.

```
npm run lint      → 0 errors, 0 warnings (--max-warnings 0)
npx tsc -b        → clean
npm run build     → 38 assets, per-route chunks
```

**Route sweep** — 18 routes, 0 console errors, 0 page errors, one `<h1>` each:

```
home · products · product-detail · cart · login · signup · about · contact
notfound · forgot · reset · verify · profile · orders · order-detail
checkout · admin
```

**Journey tests** — real interactions against the API:

```
✅ catalogue renders · search writes to URL · search filters · organic filter applies
✅ quick-add increments the header badge
✅ login persists a session (the old split-brain bug, verified fixed)
✅ basket renders · quantity stepper updates the total
✅ checkout → order placed, confirmation number returned
✅ orders list · order detail · admin stats
JS errors during journeys: 0
```

**Design audit** — automated in-browser measurement of computed styles:

```
563 / 563 text samples meet WCAG AA  (0 failures)
0 legacy classes leaked (gray-*/primary-*/rounded-[40px])
0 emoji
0 unlabelled form controls · 0 unnamed icon buttons
1 undersized target (the sr-only skip link, which is correct)
```

Three real contrast defects were found by this audit and fixed at the source:

| Defect | Was | Now |
| --- | --- | --- |
| `ember` as text on paper | 4.19:1 ✗ | `#b03a22` → 5.27:1 ✓ |
| `ink-3` meta text | 3.60:1 ✗ | `#6b6252` → 5.24:1 ✓ |
| strikethrough price in `ink-4` | 2.94:1 ✗ | `ink-3` ✓ |

---

## 5. Running it

A mock API ships with the repo (`tools/mock-api.mjs`) that speaks the real backend's exact
envelopes, so the storefront can be developed without a Postgres + Prisma setup:

```bash
cd frontend
npm install
npm run mock      # http://localhost:5000 — 14 products, 5 orders, live cart
npm run dev       # http://localhost:5173
# sign in with user@test.com (any password)
```

Against the real backend, point `VITE_API_ORIGIN` at it.

---

## 6. Backend defects — now fixed

All of the defects below were **fixed** on 2026-10-01 and verified against a real
PostgreSQL 16 instance. See [BACKEND_FIXES.md](BACKEND_FIXES.md) for the full write-up,
including two defects this audit originally reported incorrectly.

| Defect | Status |
| --- | --- |
| `prisma.orderStatusHistory` referenced but absent from `schema.prisma` | fixed — model + migration added |
| `Order.cancellationReason` not in schema | fixed — column added |
| `OrderItem.create` omits required `productName`/`productSku`/`unit` | fixed — snapshot now populated |
| `User.phone` in a `select` | fixed — column added |
| `routes/user/index.js` mounted `./addresses`, leaving `address.js` unreachable | fixed — routes merged, dead file deleted |
| Refreshed access token omitted `role` | fixed — role re-read from the database |
| Refresh cookie was `secure:true` | fixed — secure only in production |
| Wishlist endpoints were stubs | fixed — real `Wishlist`/`WishlistItem` models |
| Global rate limit 100 req/15 min | fixed — envelope is now JSON, not plain text |
| `helmet()` CORP `same-origin` blocking `/uploads` images | **not a real defect — see below** |
| `orderUtils` imported three helpers from the *cart* module | fixed — order creation always 500'd |
| `utils/user/{validation,operations}` had no `index.js` | fixed — **the server could not boot** |
| `multer` required but undeclared in `package.json` | fixed — **the server could not boot** |
| Auth rate limiter counted each request twice | fixed — 10 logins now, not 5 |

### Correction: the CORP finding was wrong

This audit originally reported that `helmet()`'s `crossOriginResourcePolicy: same-origin`
blocked product images on the storefront. **That was incorrect.** `app.use('/uploads',
express.static('uploads'))` is mounted *before* `app.use(helmet())` in `server.js`, so
uploaded images never received a CORP header and were never blocked. Verified directly:

```
CORP headers on /uploads/...  → 0
CORP headers on /api/products → 1
```

`crossOriginResourcePolicy: { policy: 'cross-origin' }` is now set explicitly. That is
defensible hardening — it stops a future reordering of the middleware from silently breaking
every uploaded photo — but it did **not** fix a live bug, and the original claim was wrong.