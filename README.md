# 🥬 PradhanFresh — Fresh Produce E-commerce Platform

A family-owned market platform bringing hand-picked fruits and vegetables from 200+ local
partner farms to your table. Harvested at dawn, delivered by noon.

| | |
| --- | --- |
| **Frontend** | Vite · React 19 · TypeScript · Tailwind v4 · React Query · Zustand |
| **Backend** | Express 5 · Prisma · PostgreSQL · JWT |
| **Design system** | [DESIGN_SYSTEM.md](frontend/DESIGN_SYSTEM.md) — "Harvest Ledger" |
| **Frontend audit** | [FRONTEND_AUDIT.md](FRONTEND_AUDIT.md) — findings, fixes, verification |
| **API reference** | [API_REFERENCE.md](API_REFERENCE.md) — every route, envelope and gotcha |

---

## Status

| Area | State |
| --- | --- |
| Authentication & security | ✅ JWT access + refresh, email verification, password reset, RBAC, rate limiting |
| Catalogue | ✅ 18 routes, URL-driven search/filter/sort/pagination |
| Basket & checkout | ✅ optimistic cart, 3-step checkout, order placement |
| Orders | ✅ history, detail, status tracker, cancel, reorder |
| Account | ✅ profile, password, address book |
| Admin | ✅ revenue/orders/customers, SVG sales chart, inventory CRUD, low stock, order status |
| Accessibility | ✅ WCAG AA verified (563/563 sampled text nodes) |
| Payments | ⚠️ Stripe webhook exists; the checkout payment step is COD-first |
| Reviews & ratings | ❌ no backend — deliberately not faked in the UI |

> The frontend was fully overhauled on 2026-09-30. It previously shipped with **Tailwind
> never running** (the site rendered unstyled), **no authenticated request working**, and
> **checkout that never created an order**. See [FRONTEND_AUDIT.md](FRONTEND_AUDIT.md).

---

## Quick start

### Frontend — no database needed

A mock API ships with the repo that speaks the real backend's exact response envelopes.

```bash
cd frontend
npm install
npm run mock     # http://localhost:5000 — 14 products, 5 orders, live cart
npm run dev      # http://localhost:5173
```

Sign in with `user@test.com` (any password) to reach the basket, orders, checkout and admin.

### Frontend — against the real backend

```bash
cd frontend
npm install
VITE_API_ORIGIN=http://localhost:5000 npm run dev
```

### Backend

```bash
cd backend
npm install
cp .env.example .env      # fill in DATABASE_URL, JWT secrets, SMTP, STRIPE_SECRET_KEY
npx prisma migrate dev
npm run dev               # http://localhost:5000
```

Seeded accounts: `admin@pradhanfresh.com / admin123` (ADMIN), `user@test.com / user123` (USER).

### Checks

```bash
cd frontend
npm run lint       # 0 errors, 0 warnings
npx tsc -b         # clean
npm run build      # per-route code splitting
npm run preview
```

---

## Project layout

```
backend/
  prisma/           schema, migrations, seed
  routes/           auth · products · cart · orders · user · admin · upload · webhooks
  middleware/       requireAuth · requireAdmin · rateLimiter
  tests/            per-route integration tests

frontend/
  src/
    lib/            api (normalised client + token refresh) · auth · cart ·
                    catalog (React Query hooks) · format · hooks · types
    components/
      ui/           Button · Field · Feedback · Surface      ← the primitives
      layout/       Navbar (live basket drawer) · Footer · routing guards · ErrorBoundary
      product/      ProductCard · ProductGrid
    pages/          18 routes, lazily code-split
    styles/
      index.css     the entire "Harvest Ledger" design system (@theme tokens)
  tools/
    mock-api.mjs    dependency-free mock of the real API
  DESIGN_SYSTEM.md  the contract every page follows
```

---

## Known backend defects

Order placement and order detail currently fail at runtime because the code references Prisma
models and columns that are not in `schema.prisma` (`orderStatusHistory`, `Order.cancellationReason`,
`User.phone`, and `OrderItem.create` omitting required `productName`/`productSku`/`unit`).
There is also no address-update endpoint — `routes/user/index.js` mounts `addresses.js`, so
`address.js` is dead code.

The frontend surfaces these honestly instead of faking success. The full list, with file
references, is in [FRONTEND_AUDIT.md §6](FRONTEND_AUDIT.md).

---

## License

MIT — see [LICENSE](LICENSE).