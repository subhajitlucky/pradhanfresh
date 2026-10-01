# PradhanFresh Backend API Reference (audit of `backend/`, Node + Express 5 + Prisma/Postgres)

Base URL (dev): `http://localhost:5000` (`PORT` env, default 5000).
Every route below is prefixed with the exact mount string used in [server.js](backend/server.js).

## 0. Global middleware (applies to every request, in order)

`helmet()` → `cors` → **global rate limiter (100 req / 15 min / IP)** → `/uploads` static is registered *before* helmet but CORS/rate-limit still apply to it.

| Concern | Value |
|---|---|
| CORS | `credentials: true`; allowed: any origin containing `localhost`/`127.0.0.1` when `NODE_ENV !== 'production'`, any `*.vercel.app`, plus `https://pradhanfresh.vercel.app`. Anything else → error. |
| Global rate limit | 100 requests / 15 min / IP, **plain-text body** (not JSON): `"Too many requests from this IP, please try again after 15 minutes"`. `RateLimit-*` standard headers on. |
| Auth rate limit | 10 requests / 15 min / IP on auth routes, body: `{success:false, message, error:"Rate Limit Exceeded"}`. |
| JSON body | `express.json()` mounted **after** the Stripe webhook, so webhook gets a raw Buffer. |
| Cookies | `cookie-parser` enabled. Only the refresh token uses a cookie. |
| Health | `GET /` → text `"PradhanFresh backend is running 🥦"` (not JSON). |
| Static images | `GET /uploads/<file>` → `express.static('uploads')`, **relative to `process.cwd()`**. |

---

## 1. Route table

Legend: **auth** = `requireAuth` (Bearer JWT) / `+Admin` = `requireAdmin` / **AL** = `authLimiter` (10/15min).
Every route is additionally subject to the global 100/15min limiter.

### Auth — mount `/api/auth`

| Method | Path | Auth | Request | 2xx envelope |
|---|---|---|---|---|
| POST | `/api/auth/signup` | public, **AL** | body `{name, email, password}` (pwd ≥6, email regex) | `{message, user:{id,name,email,isEmailVerified,createdAt}}` — **no `success` flag** |
| POST | `/api/auth/login` | public, **AL** | body `{email, password}` | `{message, token, user:{id,name,email,role}}` + sets `refreshToken` cookie |
| POST | `/api/auth/logout` | public | — | `{message}` (clears cookie) |
| GET | `/api/auth/verify-email` | public, **AL** | query `?token=` | `{message}` |
| POST | `/api/auth/forgot-password` | public, **AL** | body `{email}` | `{message}` (always 200) |
| POST | `/api/auth/reset-password` | public, **AL** | body `{token, password}` (pwd ≥6) | `{message}` |
| POST | `/api/auth/refresh-token` | public, **AL** | cookie `refreshToken` | `{message, token}` |
| GET | `/api/auth/profile` | requireAuth | — | `{success, message, data:{id,name,email,role,isEmailVerified,createdAt}}` |
| PATCH | `/api/auth/profile` | requireAuth | body `{name}` (2–50 chars) | `{success, message, data:<same user object>}` |
| POST | `/api/auth/profile/change-password` | requireAuth | body `{currentPassword, newPassword}` | `{success, message}` |

### Products — mount `/api/products`

| Method | Path | Auth | Request | 2xx envelope |
|---|---|---|---|---|
| GET | `/api/products` | public | query: `page=1`, `limit=6`, `search`, `categories=1,2`, `minPrice`, `maxPrice`, `isOrganic=true\|false`, `isFeatured=true\|false`, `isAvailable=true\|false`, `sortBy`, `sortOrder=asc\|desc` | `{success, message, data:[Product], pagination, filters}` |
| GET | `/api/products/:id` | public | path numeric `id` | `{success, message, data:Product}` |
| POST | `/api/products` | +Admin | body (see §6) | `{success, message, data:Product}` |
| PUT | `/api/products/:id` | +Admin | partial body (see §6) | `{success, message, data:Product, changedFields:[…]}` |
| DELETE | `/api/products/:id` | +Admin | — | `{success, message, deletedProduct:{id,name,sku,category,createdBy}}` |

### Categories — mount `/api/categories` (router file `routes/products/categories.js`)

| Method | Path | Auth | Request | 2xx envelope |
|---|---|---|---|---|
| GET | `/api/categories` | public | — | `{success, message, data:[Category & {_count, productCount}]}` |
| GET | `/api/categories/:slug` | public | **slug**, not id | `{success, message, data:Category & {products:[Product]}}` |

### Cart — mount `/api/cart`

| Method | Path | Auth | Request | 2xx envelope |
|---|---|---|---|---|
| GET | `/api/cart` | requireAuth | — | `{success, message, data:{cart, itemsCount, totalAmount, isEmpty, hasStockIssues, stockIssues}}` (+ top-level `warnings` when issues) |
| POST | `/api/cart/add` | requireAuth | body `{productId, quantity=1}` (1–99) | `{success, message, data:{cart, itemsCount, totalAmount}}` |
| PUT | `/api/cart/:itemId` | requireAuth | body `{quantity}` (1–99) | `{success, message, data:{updatedItem, cart, itemsCount, totalAmount}}` |
| DELETE | `/api/cart/:itemId` | requireAuth | — | `{success, message, data:{removedItem:{id,productId,productName}, cart, itemsCount, totalAmount, isEmpty}}` |
| DELETE | `/api/cart/clear` | requireAuth | — | `{success, message, data:{cart, itemsCount, totalAmount, isEmpty, clearedItems, clearedItemsCount}}` |

### Orders — mount `/api/orders`

| Method | Path | Auth | Request | 2xx envelope |
|---|---|---|---|---|
| POST | `/api/orders/create` | requireAuth | body `{deliveryAddress{…}, paymentMethod='COD', deliveryDate?, deliverySlot?, orderNotes?, discount=0}` | `{success, message, data:{order, orderNumber, totalAmount, itemsCount, estimatedDelivery, paymentMethod}}` |
| GET | `/api/orders` | requireAuth | query `page=1, limit=10 (max 50), status, startDate, endDate, sortBy∈{createdAt,updatedAt,totalAmount,status}, sortOrder` | `{success, message, data:[Order], pagination, filters}` |
| GET | `/api/orders/:orderNumber` | requireAuth | `orderNumber` like `PF-2026-000001` | `{success, message, data: enhancedOrder}` |
| PUT | `/api/orders/:orderNumber/cancel` | requireAuth | body `{reason?}` | `{success, message, data:{…order, statusInfo, deliveryAddress, orderSummary}}` |
| PUT | `/api/orders/:orderNumber/status` | requireAuth **+ manual ADMIN check** (403 if not admin) | body `{status, adminNotes?}` | `{success, message, data:{…order, statusInfo, deliveryAddress, previousStatus, changedBy}}` |
| POST | `/api/orders/payment/payment-intent` | requireAuth | body `{amount, orderId, currency='inr'}` | `{success, clientSecret}` — **no `data` wrapper** |

### User — mount `/api/user` (whole router is `requireAuth`)

> `routes/user/index.js` imports **`./addresses` (plural)**. `routes/user/address.js` (singular, with validation + `PUT /:id`) is **dead code, never mounted**.

| Method | Path | Auth | Request | 2xx envelope |
|---|---|---|---|---|
| GET | `/api/user/profile` | requireAuth | — | `{success, message, data:{id,name,email,role,isEmailVerified,createdAt}}` |
| PUT | `/api/user/profile` | requireAuth | body `{name}` (2–50) | `{success, message, data:<user>}` |
| POST | `/api/user/profile/change-password` | requireAuth | body `{currentPassword, newPassword}` (≥6, ≠ current) | `{success, message}` |
| GET | `/api/user/address` | requireAuth | — | `{success, data:[Address]}` — **no `message`** |
| POST | `/api/user/address` | requireAuth | body = raw Address fields (`fullName, phone, addressLine1, addressLine2?, city, state, pincode, landmark?, isDefault?`) — **no validation** | `{success, data:Address}` (200, not 201) |
| DELETE | `/api/user/address/:id` | requireAuth | — | `{success, message:'Address deleted'}` |
| GET | `/api/user/wishlist` | requireAuth | — | `{success, data:[]}` — **stub, always empty** |
| POST | `/api/user/wishlist/add` | requireAuth | body `{productId}` | `{success, message:'Added to wishlist'}` — **stub, no persistence** |
| – | `PUT /api/user/address/:id` | — | — | **does not exist** (only in the unmounted `address.js`) |

### Admin — mount `/api/admin` (whole router is `requireAuth` + `requireAdmin`)

| Method | Path | Request | 2xx envelope |
|---|---|---|---|
| GET | `/api/admin/dashboard` | — | `{message, adminUser: <JWT payload>}` (no `success`) |
| GET | `/api/admin/dashboard/stats` | — | `{success, data:{totalRevenue, totalOrders, totalCustomers, recentOrders[10], salesData[{date,sales}], topProduce[{productId,productName,_sum}]}}` |
| GET | `/api/admin/categories` | — | `{success, message, data:{categories:[Category & {_count, productCount}]}}` — **double nested** |
| POST | `/api/admin/categories` | body `{name, description?, image?, isActive=true}` (name 2–50, desc ≤500) | `{success, message, data:Category}` |
| PUT | `/api/admin/categories/:id` | body partial `{name?, description?, image?, isActive?}` | `{success, message, data:Category}` |
| DELETE | `/api/admin/categories/:id` | — | `{success, message, data:{deletedCategory:{id,name,slug}}}` |
| GET | `/api/admin/users` | query `page=1, limit=10 (max 100), search` | `{success, message, data:[User & {_count:{orders}}], pagination:{total,page,pages,hasNextPage,hasPrevPage}}` |
| GET | `/api/admin/users/:id` | — | `{success, message, data:User & {orders[≤10], addresses[]}}` |
| PUT | `/api/admin/users/:id` | body `{role:'USER'\|'ADMIN'}` | `{success, message, data:{id,name,email,role,updatedAt}}` |
| GET | `/api/admin/inventory/low-stock` | query `threshold=10` | `{success, count, threshold, data:[{id,name,sku,stock,unit,thumbnail,categoryId,category:{name}}]}` |

### Upload & webhook

| Method | Path | Auth | Request | 2xx envelope |
|---|---|---|---|---|
| POST | `/api/upload` | +Admin | `multipart/form-data`, field name **`image`**, ≤5 MB, `image/*` | `{success, message, data:{url:'/uploads/<file>', id:'<file>'}}` — **the path is `/api/upload`, not `/api/upload/image`** |
| POST | `/api/webhooks/stripe` | public (raw body, no signature check) | Stripe event JSON | `{received:true}`; sets `paymentStatus=COMPLETED,status=CONFIRMED` on `payment_intent.succeeded` |

---

## 2. Response envelopes (exact)

### `GET /api/products`
```jsonc
{
  "success": true,
  "message": "Products retrieved successfully",
  "data": [ /* Product + category(full) + createdBy{id,name,email} */ ],
  "pagination": {
    "currentPage": 1, "totalPages": 5, "totalProducts": 25, "productsPerPage": 6,
    "hasNextPage": true, "hasPrevPage": false, "nextPage": 2, "prevPage": null
  },
  "filters": {
    "totalResults": 25,
    "appliedFilters": {
      "search": null, "categories": [1,2] /*or null*/, 
      "priceRange": { "min": null, "max": null },
      "isOrganic": null, "isFeatured": null,
      "sortBy": "price", "sortOrder": "asc"
    }
  }
}
```
The array is under **`data`**, not `products`. Single product: `data` is the object.

### `GET /api/cart`
```jsonc
{ "success": true, "message": "Cart retrieved successfully",
  "data": {
    "cart": { "id":1,"userId":1,"items":[ /* CartItem + stockAvailable + hasStockIssue + product{...} */ ],
              "totalAmount": 899.5, "itemsCount": 3, "createdAt":"…","updatedAt":"…","expiresAt":"…" },
    "itemsCount": 3, "totalAmount": 899.5, "isEmpty": false,
    "hasStockIssues": false, "stockIssues": []
  },
  // "warnings": [ {productId, productName, issue} ]  ← only when hasStockIssues
}
```
**Empty-cart early return** (no cart row) is a *different shape* — no `cart.hasStockIssues`, no `warnings`:
`{success, message:'Cart is empty', data:{cart:null, itemsCount:0, totalAmount:0, isEmpty:true}}`.

### `POST /api/cart/add`
```jsonc
{ "success": true, "message": "Fresh Apples added to cart successfully",
  "data": { "cart": { …Cart, items:[{ …CartItem, product:{id,name,thumbnail,stock,isAvailable,unit} }] },
            "itemsCount": 3, "totalAmount": 899.5 } }
```
Note: after *add*, `product` has **no price/salePrice** (unlike GET cart, which does).

### `POST /api/orders/create`
```jsonc
{ "success": true, "message": "Order PF-2026-000001 created successfully",
  "data": { "order": { …Order, items:[OrderItem & {product:{id,name,slug,thumbnail,unit}}], user:{id,name,email} },
            "orderNumber": "PF-2026-000001", "totalAmount": 1170,
            "itemsCount": 3, "estimatedDelivery": "2026-01-20" /*or "To be confirmed"*/, "paymentMethod": "COD" } }
```
Here `data.order.deliveryAddress` is the **raw JSON string** (not parsed) — unlike every other order response.

### `GET /api/orders`
```jsonc
{ "success": true, "message": "Orders retrieved successfully",
  "data": [ { …Order, items:[{…OrderItem, product:{id,name,slug,thumbnail,unit}}],
              statusInfo: {label, description, color, canCancel},
              deliveryAddress: { /* parsed object */ } } ],
  "pagination": { "currentPage":1,"totalPages":3,"totalOrders":25,"ordersPerPage":10,
                  "hasNextPage":true,"hasPrevPage":false,"nextPage":2,"prevPage":null },
  "filters": { "appliedFilters": { "status":null, "dateRange":null, "sortBy":"createdAt", "sortOrder":"desc" },
               "totalResults": 25 } }
```

### `GET /api/orders/:orderNumber`
`data` = Order + `items[].product{id,name,slug,thumbnail,unit,price,salePrice}` + `user` + `statusInfo` + parsed `deliveryAddress` + `orderSummary{itemsCount,totalItems,subtotal,deliveryFee,tax,discount,totalAmount}` + `canCancel` + `canReturn` + `estimatedDelivery`.

### `statusInfo` values (safe to hard-code in the UI)
| status | label | color | canCancel |
|---|---|---|---|
| PENDING | Pending | orange | true |
| CONFIRMED | Confirmed | blue | true |
| PROCESSING | Processing | purple | true |
| SHIPPED | Shipped | indigo | false |
| DELIVERED | Delivered | green | false |
| CANCELLED | Cancelled | red | false |
| RETURNED | Returned | gray | false |

### Error shapes (there is no single convention — handle all of these)
| Shape | Where |
|---|---|
| `{success:false, message, error}` | most domain routes |
| `{success:false, message}` | categories, admin dashboard/inventory/wishlist, `GET /api/user/address` errors |
| `{error:"…"}` | **auth middleware only** — 401 `Authorization token required` / `Invalid or expired token`, 403 `Forbidden: Access is restricted to administrators.` |
| `{valid:false, message, error[, missingFields]}` — **raw validator object, no `success` key** | product create/update, user profile PUT/change-password, order create, order status update, `GET /api/orders`, admin categories create/update/delete, `GET /api/admin/users` |
| plain text | global rate limiter |
| `{success:false, message, details:[]}` | order create cart validation |

---

## 3. Data shapes (from `schema.prisma`)

```ts
type Role = 'USER' | 'ADMIN'
type OrderStatus = 'PENDING'|'CONFIRMED'|'PROCESSING'|'SHIPPED'|'DELIVERED'|'CANCELLED'|'RETURNED'
type PaymentMethod = 'COD'|'ONLINE'|'WALLET'
type PaymentStatus = 'PENDING'|'COMPLETED'|'FAILED'|'REFUNDED'

User      { id:Int, name:string, email:string(unique), password:string(bcrypt, never returned),
            role:Role='USER', isEmailVerified:boolean=false,
            emailVerificationToken:string?|unique, passwordResetToken:string?|unique,
            passwordResetExpires:DateTime?, createdAt:DateTime }   // no updatedAt, no phone
Category  { id:Int, name:string(unique), slug:string(unique), description:string?,
            image:string?, isActive:boolean=true, createdAt, updatedAt }
Product   { id:Int, name, slug(unique, auto-generated), description, shortDescription?,
            price:Float, salePrice:Float?, categoryId:Int, category:Category,
            images:string[], thumbnail:string, stock:Int=0, isAvailable:boolean=true,
            sku:string(unique, stored UPPERCASE), unit:string='piece', weight:Float?,
            isFeatured:boolean=false, isOrganic:boolean=false,
            createdAt, updatedAt, createdById:Int, createdBy:User }
Cart      { id:Int, userId:Int(unique), items:CartItem[], totalAmount:Float=0,
            createdAt, updatedAt, expiresAt:DateTime? }          // expiresAt = now + 24h
CartItem  { id:Int, cartId, productId, quantity:Int=1, price:Float, subtotal:Float,
            createdAt, updatedAt }                              // @@unique([cartId,productId])
Order     { id:Int, orderNumber:string(unique, "PF-YYYY-000001"), userId:Int, items:OrderItem[],
            status:OrderStatus='PENDING', subtotal:Float, deliveryFee:Float=0, tax:Float=0,
            discount:Float=0, totalAmount:Float,
            deliveryAddress:Json (written as a JSON **string**), deliveryDate:DateTime?,
            deliverySlot:string?, paymentMethod:PaymentMethod='COD',
            paymentStatus:PaymentStatus='PENDING', paymentId:string?,
            orderNotes:string?, adminNotes:string?,
            createdAt, updatedAt, confirmedAt?, shippedAt?, deliveredAt?, cancelledAt? }
OrderItem { id:Int, orderId, productId, productName:string(req), productSku:string(req),
            quantity:Int, price:Float, subtotal:Float, unit:string(req), thumbnail:string?,
            createdAt, updatedAt }
Address   { id:Int, userId:Int, fullName, phone, addressLine1, addressLine2?,
            city, state, pincode, landmark?, isDefault:boolean=false, createdAt, updatedAt }
Wishlist  — **no model exists in the schema**; /api/user/wishlist is a stub.
```

Fields the API renames / adds on the way out:
- `createdBy` on Product = `{id, name, email}` (no role/password).
- `categories` on cart/order items = `{id,name,slug,thumbnail,unit}` (+ `price,salePrice` only in order-detail / cart-update responses).
- Category responses carry **both** `_count: {products}` and a flat `productCount`.
- Order responses add `statusInfo`, `orderSummary`, `canCancel`, `canReturn`, `estimatedDelivery`, `previousStatus`, `changedBy`; cart items add `stockAvailable`, `hasStockIssue`.

---

## 4. Auth mechanism

- **Access token**: JWT `ACCESS_TOKEN_SECRET`, payload `{userId, email, role}`, TTL `30m`. Returned as **`token`** (not `accessToken`) in the login body. Header: `Authorization: Bearer <token>`.
- **Refresh token**: JWT `REFRESH_TOKEN_SECRET`, TTL `7d`, stored in an **httpOnly cookie** named `refreshToken` with `secure:true, sameSite:'Strict'`.
- **Refresh flow**: `POST /api/auth/refresh-token` reads the cookie and returns `{message, token}` — the new access token payload is `{userId, email}` **without `role`**, so admin screens break after the first refresh until re-login.
- `requireAuth` errors are `{error: "..."}` (no `success` flag). `requireAdmin` compares `req.user.role === 'ADMIN'` → 403.
- Roles: `"USER" | "ADMIN"`. Seeded accounts (`prisma/seedData/users.js`): `admin@pradhanfresh.com / admin123` (ADMIN), `user@test.com / user123` (USER); both `isEmailVerified: true`.
- Signup sends a verification mail linking to `${FRONTEND_URL}/verify-email?token=…`; the FE must call `GET /api/auth/verify-email?token=…`. **Login returns 403 `Please verify your email before logging in.`** until then.
- Password-reset mail links to `${FRONTEND_URL}/reset-password?token=…` → FE posts `{token,password}` to `/api/auth/reset-password`.

---

## 5. Image handling

- Stored as plain strings: `Product.thumbnail` (required string) and `Product.images: string[]` (required; if `images` is not an array on create it is set to `[thumbnail]`).
- Served by `GET /uploads/<file>` → `express.static('uploads')` (CWD-relative).
- Upload: `POST /api/upload` as `multipart/form-data`, field **`image`**, max **5 MB**, mimetype must start with `image/*`. Files land in `backend/uploads/` named `image-<timestamp>-<random><ext>` (multer's `file.fieldname` is the prefix). Response `data.url` is the **root-relative path** `/uploads/<file>` — prefix it with the backend origin yourself; the backend never returns absolute URLs.
- Seed data stores **Vite source paths** such as `/src/assets/images/apple.jpg` — those are FE asset URLs, not backend-served files, and are what the seeded DB actually contains.
- Category `image` is an optional free-form string (seed values are also `/src/assets/...` paths).

---

## 6. Frontend-relevant gotchas

**Product create (`POST /api/products`)**
- Required: `name, description, price, categoryId, thumbnail, sku, unit`. Optional: `shortDescription, salePrice, images, stock, weight, isFeatured, isOrganic`.
- `sku` is upper-cased, `unit` lower-cased; `slug` is generated server-side (send **no** slug).
- `isAvailable` is derived: `stock > 0`. It cannot be set directly.
- Duplicate SKU → **409**; invalid fields → **400**.

**Product update (`PUT /api/products/:id`)** — partial; only supplied fields change, `salePrice: null|""` clears the discount, and a `name` change regenerates the slug. Sending no updatable field returns **400 "No valid fields provided for update"**. Response adds `changedFields`.

**Product list query params** — names are camelCase and exact: `page, limit, search, categories, minPrice, maxPrice, isOrganic, isFeatured, isAvailable, sortBy, sortOrder`.
- `limit` defaults to **6** and is **not capped** in this route (the 50-cap helper is not wired in); `page`/`limit` must be positive ints or 400.
- `sortBy` accepts `price | name | featured | newest | oldest | popularity`. **Anything else — including the documented default `createdAt` — silently falls back to `isFeatured desc, name asc`.**
- `categories` is a comma-separated string of **IDs** (`categories=1,2`), not slugs.
- `isAvailable` defaults to `true`; `isOrganic`/`isFeatured` are only applied when present, and only the exact string `"true"` means true.
- Search covers `name`, `description`, `shortDescription`, `category.name` (case-insensitive).

**Orders**
- Order status filter values are the uppercase enum values.
- `GET /api/orders` limit default **10**, max 50; `page<1`, `limit>50`, or an unknown `sortBy` → **400**.
- `PUT /:orderNumber/status` is **not** protected by `requireAdmin` middleware but does an in-handler role lookup → 403 `Access denied: Admin privileges required`.
- Status transitions are enforced: `PENDING→CONFIRMED|CANCELLED`, `CONFIRMED→PROCESSING|CANCELLED`, `PROCESSING→SHIPPED|CANCELLED`, `SHIPPED→DELIVERED|RETURNED`, `DELIVERED→RETURNED`; `CANCELLED`/`RETURNED` terminal. Invalid transition → **400**.
- User cancellation is only allowed in `PENDING|CONCIRMED|PROCESSING`; otherwise **400**. Method is **PUT**, not DELETE/POST.
- `deliveryDate` must be **≥ tomorrow and ≤ +30 days**; `deliverySlot` ∈ `MORNING|AFTERNOON|EVENING|ANYTIME`; `paymentMethod` ∈ `COD|ONLINE|WALLET`. Omit `deliveryDate` entirely to skip the check.
- Order creation **empties the cart** and decrements stock. Delivery fee: ₹0 when cart total ≥ ₹500, else ₹40; tax is hard-coded 18% GST; `discount` is a flat rupee amount you send yourself.
- Order numbers are `PF-<year>-<6 digits>` (`PF-2026-000001`) and are what the detail/cancel/status URLs take — not the numeric id.

**Cart**
- Mutating calls take the **CartItem `id`** (`cart.items[].id`), not the product id; only `/api/cart/add` takes `productId`.
- Quantity is an integer 1–99; adding an existing product **increments** its quantity instead of creating a duplicate row.
- Unit price is `salePrice ?? price` at the time of add/update; `GET /api/cart` recalculates and silently rewrites `totalAmount` if prices changed.
- `DELETE /api/cart/:itemId` with id `"clear"` is unambiguous — `/clear` is registered first.

**Addresses**
- Only `GET`, `POST`, `DELETE /:id` exist under `/api/user/address`. **There is no update route** (the implementation lives in the unmounted `routes/user/address.js`).
- `POST /api/user/address` performs **no validation**: missing `fullName`/`phone`/`pincode`/etc. returns **500**, not 400. Validate on the client and send every required field.
- `POST` returns **200**, not 201, and the success body has no `message` key.

**Wishlist** is non-functional (always `data: []`; `POST /add` discards the body). Build it client-side or add a backend model.

**Payments** — `POST /api/orders/payment/payment-intent` needs `{amount (rupees), orderId (numeric Order.id, not orderNumber), currency}`; returns a bare `{success, clientSecret}` and 503 when `STRIPE_SECRET_KEY` is unset.

**Upload** — `POST /api/upload` (admin-only, `multipart/form-data`, field `image`), not `/api/upload/image`.

**Cross-cutting**
- Responses mix `{success,message}` and `{message}`/`{error}` — write one error-normalising interceptor.
- Every backend response is limited to **100 req/15 min per IP**; auth endpoints to **10**. Handle 429 (body is plain text).
- Refresh-cookie flows need `credentials:'include'` in the client **and** an HTTPS backend: the cookie is `secure:true, sameSite:'Strict'`, so on plain `http://localhost:5000` it is dropped and `POST /api/auth/refresh-token` returns 401 `No refresh token found`.
- `helmet()` ships `crossOriginResourcePolicy: same-origin`, so cross-origin `<img src="http://localhost:5000/uploads/...">` from `:5173` is blocked by the browser; proxy images through the frontend origin or relax that header.
- Local uploads work only when the server process CWD is `backend/` (static path is CWD-relative, multer writes to `backend/uploads/`).

---

## 7. Schema-vs-code mismatches (these endpoints throw at runtime → 500)

Code references fields/models that do not exist in `prisma/schema.prisma`:

| Reference | Used in | Effect |
|---|---|---|
| `Order.cancellationReason` | `utils/order/operations/cancel.js` | cancel always 500 |
| `prisma.orderStatusHistory` (+ `include.statusHistory`) | `update.js`, `cancel.js`, `retrieve.js` | status update, cancel **and** `GET /api/orders/:orderNumber` always 500 |
| `User.phone` in a `select` | `retrieve.js` | `GET /api/orders/:orderNumber` 500 |
| `OrderItem.create` without `productName`, `productSku`, `unit` (all required in schema) | `utils/order/operations/create.js` | `POST /api/orders/create` 500, transaction rolled back |
| `Wishlist` model | `routes/user/wishlist.js` | stub, no data |

So today only `GET /api/orders` (list), cart, products, categories, auth, address, admin (except order-status) can be wired to a UI without backend fixes.