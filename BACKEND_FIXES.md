# PradhanFresh — Backend Defect Fixes

**Date:** 2026-10-01
**Scope:** `backend/` — Express 5 · Prisma 6 · PostgreSQL
**Verified against:** PostgreSQL 16 in Docker, real HTTP requests via supertest,
plus a full browser journey against the real server.

Every fix below is covered by an assertion in `backend/tests/fixVerification.js`
(**46 checks, all passing**).

---

## Summary

The order pipeline could not work at all. Four separate faults each returned HTTP 500 on
their own, and two more meant **the server would not start**. Three of these were visible
in the repository's own test files, which had never been runnable — `package.json` still
had `"test": "echo \"Error: no test specified\" && exit 1"`.

| Area | Before | After |
| --- | --- | --- |
| Server boot | ❌ module not found | ✅ starts |
| `POST /api/orders/create` | 500 | 201 |
| `GET /api/orders/:orderNumber` | 500 | 200 |
| `PUT /api/orders/:orderNumber/status` | 500 (after refresh: 403) | 200 |
| `PUT /api/orders/:orderNumber/cancel` | 500 | 200 |
| `PUT /api/user/address/:id` | route did not exist | 200 |
| `POST /api/user/address` | 500 on bad input | 400 with `success:false` |
| `DELETE /api/user/address/:id` | 500 | 200 |
| Refresh token | dropped `role` | preserves it |
| Rate limiter | plain text; counted 2× | JSON; counts once |
| Wishlist | stub returning `[]` | real persistence |
| Error envelopes | 5 different shapes | all carry `success:false` |

---

## 1. The server could not start at all

Two faults, both fatal, both invisible because the server was never run.

### 1.1 Missing module barrels

`utils/user/validation/` and `utils/user/operations/` contained only loose files and **no
`index.js`**, yet routes imported them as directories:

```js
// routes/user/profile.js
const { validateProfileUpdate, validatePasswordChange } = require('../../utils/user/validation');
// → MODULE_NOT_FOUND
```

Because `server.js` requires the user router at boot, the whole process died before
listening. Added barrels for both directories.

### 1.2 `multer` was used but never declared

`utils/upload/imageHandler.js` requires `multer`, which was missing from `package.json`
entirely — so `npm install` on a clean checkout could never produce a working server.
Added to `dependencies`, along with `supertest` as a devDependency.

---

## 2. `orderUtils` imported three helpers from the wrong module

```js
const { calculateOrderTotals, calculateItemSubtotal, calculateDeliveryFee } =
  require('./cart/support/calculations');   // ← the CART module
```

`utils/cart/support/calculations.js` exports only `updateCartTotal` and `getFinalCartData`.
All three names resolved to `undefined`, so every order creation died at the first use:

```
TypeError: calculateDeliveryFee is not a function
    at utils/order/operations/create.js:23
```

The real implementations live in `utils/order/support/calculations.js`. Repointed.

---

## 3. Order creation omitted required fields

`OrderItem.productName`, `productSku` and `unit` are `String` with no default in
`schema.prisma`, but `create.js` never set them. Prisma rejected the insert and the
transaction rolled back — **the cart was never charged, but the order was never recorded
either**. The cart query also omitted `sku`, `unit` and `thumbnail`, so the data was not
available to populate even if the code had asked for it.

Both fixed. These fields are a deliberate *snapshot* of the product at purchase time, so the
catalogue can change later without rewriting order history.

---

## 4. Schema drift: three missing models/columns

Code (and the repo's own tests) referenced structures that `schema.prisma` never declared:

| Reference | Where | Fix |
| --- | --- | --- |
| `prisma.orderStatusHistory` | `update.js`, `cancel.js`, 4 test files | new `OrderStatusHistory` model + `Order.statusHistory` relation |
| `Order.cancellationReason` | `cancel.js`, 3 test assertions | new `User.phone`-style nullable column |
| `User.phone` in a `select` | `retrieve.js` | new nullable `User.phone` |

Migration:
`prisma/migrations/20261001080908_fix_order_status_history_cancellation_and_wishlist/`.

The history writers also disagreed with the tests: the code wrote `changedBy`, the tests
asserted `changedByUserId`. The model uses `changedByUserId` (matching the `changedByUser`
relation the code reads), and `changedAt` is now `@default(now())` instead of being passed
manually.

### Wishlist

`/api/user/wishlist` returned a hardcoded `{ success: true, data: [] }` with a `select: {}`
that Prisma rejects outright, so even the stub threw. Added `Wishlist` and `WishlistItem`
models and implemented GET / POST `/add` / DELETE with real persistence.

---

## 5. Refreshed tokens lost `role`

```js
const newAccessToken = jwt.sign(
  { userId: payload.userId, email: payload.email },  // ← role dropped
  ACCESS_SECRET, { expiresIn: '30m' });
```

`requireAdmin` reads `req.user.role`. Access tokens last 30 minutes, so **the admin
dashboard broke for every admin roughly half an hour after signing in**, with a 403 and no
obvious cause.

The refresh handler now re-reads the user from the database, so `role` is always current
(an admin demotion also takes effect). It additionally detects a deleted account, and rotates
the refresh token so a captured cookie has a bounded lifetime.

### The refresh cookie was unusable in development

`secure: true` means the browser refuses to store the cookie over plain `http`, so on
`http://localhost` every refresh returned `401 No refresh token found`. Cookie policy now
lives in `utils/auth/cookies.js`: `secure` only in production, `sameSite: 'lax'` normally
and `'none'` when the SPA and API are genuinely on different sites. `logout.js` now uses the
same helper, so logout actually clears the cookie.

---

## 6. Address routes

`routes/user/index.js` mounted `./addresses`, so `./address.js` — which held the `PUT
/:id` handler — was never registered. There was **no way to edit an address**. The dead
file has been removed and its behaviour merged into `addresses.js`.

Also fixed there:

- `POST` did no validation, so a missing field produced a Prisma error and a **500**. It now
  returns **400** with a per-field message, and **201** on success with a `message` key.
- `DELETE` called `prisma.address.delete({ where: { id, userId } })`. Prisma's unique `where`
  accepts one key, so this always threw → **500**. Now uses `deleteMany` and returns 404 when
  the address is not the caller's.
- Only known columns are taken from the body, so a crafted request cannot set `userId`.

---

## 7. Rate limiting counted every request twice

```js
router.use('/',       authLimiter, authRoutes);      // matches everything
router.use('/login',  authLimiter, loginRoute);      // matches again
```

A single `POST /api/auth/login` passed through **both** limiters and counted twice against a
10-request budget — so five logins locked an IP out for fifteen minutes. The blanket mount
also meant `GET /api/auth/profile` consumed the auth budget, and because the SPA calls
`/auth/refresh-token` automatically whenever an access token expires, an ordinary session
could exhaust the budget on its own.

Limiters are now attached per route: `authLimiter` (10) on login, signup and password reset;
a new `refreshLimiter` (60) on refresh-token and verify-email. Measured after the fix:

```
10 × 200, then 429   (was: 5 × 200, then 429)
```

The limiter's `message` was also a plain string, which makes express-rate-limit reply with
`text/plain` — unreadable by any JSON client. Now a JSON object.

---

## 8. Error envelope consistency

Responses used five different shapes (`{success,message}`, `{message}`, `{error}`,
`{valid:false,…}`, plain text). Every error response now carries `success: false`, and raw
validator objects are no longer returned verbatim — they are wrapped into
`{ success: false, message, error }`.

---

## 9. Correction: the CORP finding was wrong

The original frontend audit claimed `helmet()`'s `crossOriginResourcePolicy: same-origin`
blocked product images. **It did not.** `express.static('/uploads')` is mounted *before*
`helmet()` in `server.js`, so uploaded images never carried a CORP header:

```
CORP headers on /uploads/...  → 0
CORP headers on /api/products → 1
```

`crossOriginResourcePolicy: { policy: 'cross-origin' }` is now set explicitly. That is
reasonable hardening — it prevents a future middleware reordering from silently breaking
every uploaded photo — but it did **not** fix a live bug, and the original claim was wrong.

---

## Testing

`backend/tests/fixVerification.js` is a standalone harness (supertest + Prisma) covering
all of the above. It needs a reachable database:

```bash
cd backend
cp .env.example .env          # point DATABASE_URL at your database
npx prisma migrate deploy
node prisma/seed.js
node tests/fixVerification.js
```

Expected output: `46 passed, 0 failed`.

It cleans up after itself. The 20 existing Jest suites were left untouched — they could
never run, because no test runner was configured; wiring Jest up and getting that suite
green is a separate piece of work.