/**
 * PradhanFresh — mock API server
 * ================================
 * Speaks the exact response envelopes of the real Express backend (see
 * API_REFERENCE.md) so the storefront can be developed and visually reviewed
 * without a Postgres + Prisma setup.
 *
 *   node tools/mock-api.mjs            # http://localhost:5000
 *   PORT=5050 node tools/mock-api.mjs
 *
 * Routes implemented: auth (login/signup/refresh/logout/profile),
 * categories, products (list + detail), cart (full), orders (list),
 * user addresses, and admin stats. Cart state is in-memory per token.
 */
import { createServer } from 'node:http';

const PORT = Number(process.env.PORT ?? 5000);
const TOKEN = 'mock.jwt.token';

/* -------------------------------------------------------------------------- */
/*  Fixtures                                                                   */
/* -------------------------------------------------------------------------- */

const img = (id) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&q=80&w=800`;

const categories = [
  {
    id: 1,
    name: 'Fruits',
    slug: 'fruits',
    description: 'Seasonal fruit picked at peak ripeness',
    image: img('photo-1619566636858-adb3ef26402b'),
    isActive: true,
  },
  {
    id: 2,
    name: 'Vegetables',
    slug: 'vegetables',
    description: 'Everyday vegetables from nearby farms',
    image: img('photo-1540420773420-3366772f4999'),
    isActive: true,
  },
  {
    id: 3,
    name: 'Leafy Greens',
    slug: 'leafy-greens',
    description: 'Tender greens cut this morning',
    image: img('photo-1576045057995-568f588f82fb'),
    isActive: true,
  },
];

const PRODUCT_SEED = [
  ['Kashmiri Apples', 180, 150, 1, 'kg', 50, true, false, 'FRUIT-APPLE-KAS', 'Crisp, sweet and cold-stored in Gulmarg orchards.', img('photo-1560806887-1e4cd0b6cbd6')],
  ['Organic Bananas', 90, 70, 1, 'dozen', 100, true, true, 'FRUIT-BANANA-ORG', 'Naturally ripened, high in potassium.', img('photo-1571771894821-ce9b6c11b08e')],
  ['Nagpur Oranges', 120, 100, 1, 'kg', 75, false, false, 'FRUIT-ORANGE-NAG', 'Seedless and exceptionally juicy.', img('photo-1547514701-42782101795e')],
  ['Shimla Apples', 240, null, 1, 'kg', 12, false, false, 'FRUIT-APPLE-SHM', 'Small, dense and tart-sweet.', img('photo-1567306226416-28f0efdc88ce')],
  ['Alphonso Mangoes', 420, 349, 1, 'kg', 30, true, false, 'FRUIT-MANGO-ALP', 'Ratnagiri Alphonso — the king of mangoes.', img('photo-1553279768-865429fa0078')],
  ['Pineapples', 85, null, 1, 'piece', 40, false, true, 'FRUIT-PINE-ORG', 'Grown without chemical ripening agents.', img('photo-1550258987-190a2d41a8ba')],
  ['Organic Tomatoes', 80, 65, 2, 'kg', 60, false, true, 'VEG-TOMATO-ORG', 'Vine-ripened with deep colour.', img('photo-1546094096-0df4bcaaa337')],
  ['Baby Spinach', 45, 39, 3, 'bunch', 80, false, true, 'VEG-SPINACH-BAB', 'Tender leaves, washed and ready.', img('photo-1576045057995-568f588f82fb')],
  ['Red Carrots', 60, null, 2, 'kg', 55, false, false, 'VEG-CARROT-RED', 'Sweet and crisp, great for juicing.', img('photo-1598170845058-32b9d6a5da37')],
  ['Broccoli Crowns', 95, 79, 2, 'piece', 22, false, true, 'VEG-BROC-CRW', 'Dense green florets, field cut.', img('photo-1459411621453-7b03977f4bfc')],
  ['Green Chillies', 35, null, 2, 'packet', 90, false, false, 'VEG-CHILLI-GRN', 'Medium heat, picked in the morning.', img('photo-1563565375-f3fdfdbefa83')],
  ['Russet Potatoes', 48, 42, 2, 'kg', 120, false, false, 'VEG-POTATO-RUS', 'Ideal for roasting and mash.', img('photo-1518977676601-b53f82aba655')],
  ['Baby Corn', 70, null, 2, 'piece', 35, false, false, 'VEG-CORN-BAB', 'Sweet, tender and vacuum packed.', img('photo-1551754655-cd27e38d2076')],
  ['Coriander Bunch', 20, null, 3, 'bunch', 70, false, false, 'VEG-CORIANDER', 'Bright, fragrant and perishable.', img('photo-1592417817098-8fd3d9eb14a5')],
];

const products = PRODUCT_SEED.map(([name, price, salePrice, categoryId, unit, stock, isFeatured, isOrganic, sku, shortDescription, thumbnail], i) => ({
  id: i + 1,
  name,
  slug: name.toLowerCase().replace(/\s+/g, '-'),
  description: `${shortDescription} Delivered the same morning it was picked, from one of our 200+ partner farms around Pune. Stored cold from harvest to your door so it arrives tasting like the field.`,
  shortDescription,
  price,
  salePrice,
  thumbnail,
  images: [thumbnail],
  stock,
  isAvailable: stock > 0,
  isFeatured,
  isOrganic,
  sku,
  unit,
  weight: unit === 'kg' ? 1 : null,
  categoryId,
  category: categories.find((c) => c.id === categoryId),
  createdBy: { id: 1, name: 'PradhanFresh', email: 'admin@pradhanfresh.com' },
  createdAt: new Date(Date.now() - i * 86_400_000).toISOString(),
}));

const demoUser = {
  id: 1,
  name: 'Ananya Pradhan',
  email: 'user@test.com',
  role: 'ADMIN',
  isEmailVerified: true,
  createdAt: new Date('2024-06-12').toISOString(),
};

const demoAddress = {
  id: 1,
  userId: 1,
  fullName: 'Ananya Pradhan',
  phone: '9876543210',
  addressLine1: '402, Green Meadows',
  addressLine2: 'Near Balewadi High School',
  city: 'Pune',
  state: 'Maharashtra',
  pincode: '411045',
  landmark: 'Opposite the temple',
  isDefault: true,
};

const STATUS_INFO = {
  PENDING: { label: 'Pending', description: 'Waiting for the farm to confirm.', color: 'orange', canCancel: true },
  CONFIRMED: { label: 'Confirmed', description: 'The farm has accepted your order.', color: 'blue', canCancel: true },
  PROCESSING: { label: 'Packing', description: 'Being picked and packed right now.', color: 'purple', canCancel: true },
  SHIPPED: { label: 'Out for delivery', description: 'On the way to your address.', color: 'indigo', canCancel: false },
  DELIVERED: { label: 'Delivered', description: 'Handed over. Enjoy it.', color: 'green', canCancel: false },
  CANCELLED: { label: 'Cancelled', description: 'This order was cancelled.', color: 'red', canCancel: false },
  RETURNED: { label: 'Returned', description: 'This order was returned.', color: 'gray', canCancel: false },
};

/* -------------------------------------------------------------------------- */
/*  In-memory state                                                            */
/* -------------------------------------------------------------------------- */

let cart = { id: 1, items: [], totalAmount: 0 };

const effective = (p) => (p.salePrice && p.salePrice < p.price ? p.salePrice : p.price);

function cartPayload() {
  const items = cart.items.map((it) => {
    const p = products.find((x) => x.id === it.productId);
    return {
      ...it,
      price: it.price,
      subtotal: it.price * it.quantity,
      stockAvailable: p?.stock ?? 0,
      hasStockIssue: (p?.stock ?? 0) < it.quantity,
      product: {
        id: p.id,
        name: p.name,
        thumbnail: p.thumbnail,
        unit: p.unit,
        price: p.price,
        salePrice: p.salePrice,
        stock: p.stock,
        isAvailable: p.isAvailable,
        slug: p.slug,
      },
    };
  });
  const totalAmount = items.reduce((s, i) => s + i.subtotal, 0);
  return {
    cart: { id: cart.id, userId: 1, items, totalAmount, itemsCount: items.length },
    itemsCount: items.length,
    totalAmount,
    isEmpty: items.length === 0,
    hasStockIssues: items.some((i) => i.hasStockIssue),
    stockIssues: items.filter((i) => i.hasStockIssue).map((i) => ({ productId: i.productId, productName: i.product.name, issue: `Only ${i.stockAvailable} in stock` })),
  };
}

const ORDERS = [
  { status: 'DELIVERED', days: 2, items: [1, 8], total: 649 },
  { status: 'SHIPPED', days: 0, items: [5, 10], total: 1128 },
  { status: 'PROCESSING', days: 0, items: [7, 14], total: 165 },
  { status: 'PENDING', days: 1, items: [9, 12], total: 285 },
  { status: 'CANCELLED', days: 6, items: [4], total: 240 },
].map((o, i) => {
  const items = o.items.map((pid, j) => {
    const p = products.find((x) => x.id === pid);
    const qty = j + 1;
    return {
      id: i * 10 + j,
      productId: p.id,
      productName: p.name,
      productSku: p.sku,
      quantity: qty,
      price: effective(p),
      subtotal: effective(p) * qty,
      unit: p.unit,
      thumbnail: p.thumbnail,
      product: { id: p.id, name: p.name, slug: p.slug, thumbnail: p.thumbnail, unit: p.unit },
    };
  });
  const subtotal = items.reduce((s, x) => s + x.subtotal, 0);
  const createdAt = new Date(Date.now() - o.days * 86_400_000).toISOString();
  return {
    id: i + 1,
    orderNumber: `PF-2026-00000${5 - i}`,
    userId: 1,
    items,
    status: o.status,
    subtotal,
    deliveryFee: subtotal >= 500 ? 0 : 40,
    tax: Math.round(subtotal * 0.18 * 100) / 100,
    discount: 0,
    totalAmount: subtotal + (subtotal >= 500 ? 0 : 40) + Math.round(subtotal * 0.18 * 100) / 100,
    deliveryAddress: demoAddress,
    deliverySlot: 'MORNING',
    paymentMethod: i % 2 ? 'COD' : 'ONLINE',
    paymentStatus: o.status === 'DELIVERED' ? 'COMPLETED' : 'PENDING',
    createdAt,
    updatedAt: createdAt,
    statusInfo: STATUS_INFO[o.status],
    orderSummary: {
      itemsCount: items.length,
      totalItems: items.reduce((s, x) => s + x.quantity, 0),
      subtotal,
      deliveryFee: subtotal >= 500 ? 0 : 40,
      tax: Math.round(subtotal * 0.18 * 100) / 100,
      discount: 0,
      totalAmount: subtotal + (subtotal >= 500 ? 0 : 40) + Math.round(subtotal * 0.18 * 100) / 100,
    },
    canCancel: STATUS_INFO[o.status].canCancel,
    canReturn: o.status === 'DELIVERED',
    estimatedDelivery: new Date(Date.now() + 86_400_000).toISOString(),
  };
});

/* -------------------------------------------------------------------------- */
/*  Server                                                                     */
/* -------------------------------------------------------------------------- */

/** Set once per request so `send` can echo the Origin header for CORS. */
let currentReq = null;

const send = (res, status = 200, body) => {
  // Allow send(res, body) as shorthand for send(res, 200, body).
  if (typeof status !== 'number') {
    body = status;
    status = 200;
  }
  const payload = JSON.stringify(body ?? {});
  // `withCredentials` forbids `Access-Control-Allow-Origin: *`, so echo the origin.
  const origin = currentReq?.headers?.origin ?? '*';
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': origin,
    Vary: 'Origin',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
  });
  res.end(payload);
};

const ok = (res, data, message = 'OK') => send(res, 200, { success: true, message, data });

const readBody = (req) =>
  new Promise((resolve) => {
    let raw = '';
    req.on('data', (c) => (raw += c));
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        resolve({});
      }
    });
  });

const isAuthed = (req) => (req.headers.authorization || '').includes(TOKEN);

createServer(async (req, res) => {
  currentReq = req;
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const path = url.pathname.replace(/^\/api/, '');
  const q = url.searchParams;
  const method = req.method;

  if (method === 'OPTIONS') return send(res, 204, {});

  /* ---- auth ---- */
  if (path === '/auth/login' && method === 'POST') {
    const { email } = await readBody(req);
    if (email !== 'user@test.com' && email !== 'admin@pradhanfresh.com') {
      return send(res, 401, { success: false, message: 'Invalid email or password' });
    }
    return send(res, 200, { message: 'Logged in', token: TOKEN, user: demoUser });
  }
  if (path === '/auth/signup' && method === 'POST') {
    return send(res, 201, { message: 'Verification email sent', user: { id: 2 } });
  }
  if (path === '/auth/refresh-token' && method === 'POST') {
    return send(res, 200, { message: 'Refreshed', token: TOKEN });
  }
  if (path === '/auth/logout' && method === 'POST') return send(res, 200, { message: 'Logged out' });
  if (path === '/auth/verify-email' && method === 'GET') return send(res, 200, { message: 'Email verified' });
  if (path === '/auth/forgot-password' && method === 'POST') return send(res, 200, { message: 'Reset link sent' });
  if (path === '/auth/reset-password' && method === 'POST') return send(res, 200, { message: 'Password updated' });
  if (path === '/auth/profile' && method === 'GET') return ok(res, demoUser, 'Profile');
  if (path === '/auth/profile' && method === 'PATCH') {
    const body = await readBody(req);
    return ok(res, { ...demoUser, name: body.name ?? demoUser.name }, 'Profile updated');
  }
  if (path === '/auth/profile/change-password' && method === 'POST') {
    return send(res, 200, { success: true, message: 'Password updated' });
  }

  /* ---- catalogue ---- */
  if (path === '/categories' && method === 'GET') {
    return ok(
      res,
      categories.map((c) => ({
        ...c,
        productCount: products.filter((p) => p.categoryId === c.id).length,
        _count: { products: products.filter((p) => p.categoryId === c.id).length },
      })),
      'Categories retrieved',
    );
  }

  if (path === '/products' && method === 'GET') {
    let list = [...products];
    const search = q.get('search');
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(s) ||
          p.description.toLowerCase().includes(s) ||
          (p.category?.name ?? '').toLowerCase().includes(s),
      );
    }
    const cats = q.get('categories');
    if (cats) {
      const ids = cats.split(',').map(Number).filter(Boolean);
      list = list.filter((p) => ids.includes(p.categoryId));
    }
    if (q.get('minPrice')) list = list.filter((p) => effective(p) >= Number(q.get('minPrice')));
    if (q.get('maxPrice')) list = list.filter((p) => effective(p) <= Number(q.get('maxPrice')));
    if (q.get('isOrganic') === 'true') list = list.filter((p) => p.isOrganic);
    if (q.get('isFeatured') === 'true') list = list.filter((p) => p.isFeatured);

    const sortBy = q.get('sortBy') ?? 'featured';
    const dir = q.get('sortOrder') === 'desc' ? -1 : 1;
    if (sortBy === 'price') list.sort((a, b) => (effective(a) - effective(b)) * dir);
    else if (sortBy === 'name') list.sort((a, b) => a.name.localeCompare(b.name));
    else if (sortBy === 'newest') list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    else list.sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured) || a.name.localeCompare(b.name));

    const limit = Number(q.get('limit') ?? 12);
    const page = Number(q.get('page') ?? 1);
    const total = list.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const slice = list.slice((page - 1) * limit, page * limit);

    return send(res, {
      success: true,
      message: 'Products retrieved successfully',
      data: slice,
      pagination: {
        currentPage: page,
        totalPages,
        totalProducts: total,
        productsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        nextPage: page < totalPages ? page + 1 : null,
        prevPage: page > 1 ? page - 1 : null,
      },
      filters: { totalResults: total, appliedFilters: {} },
    });
  }

  const productMatch = path.match(/^\/products\/(\d+)$/);
  if (productMatch && method === 'GET') {
    const p = products.find((x) => x.id === Number(productMatch[1]));
    if (!p) return send(res, 404, { success: false, message: 'Product not found' });
    return ok(res, p, 'Product retrieved');
  }
  if (productMatch && method === 'PUT') {
    return ok(res, { ...products.find((x) => x.id === Number(productMatch[1])), changedFields: [] }, 'Updated');
  }
  if (productMatch && method === 'DELETE') {
    return send(res, 200, { success: true, message: 'Deleted', deletedProduct: { id: Number(productMatch[1]) } });
  }
  if (path === '/products' && method === 'POST') {
    return ok(res, { id: 99, ...(await readBody(req)) }, 'Created');
  }

  /* ---- cart ---- */
  if (path === '/cart' && method === 'GET') return ok(res, cartPayload(), 'Cart retrieved');
  if (path === '/cart/add' && method === 'POST') {
    const { productId, quantity = 1 } = await readBody(req);
    const p = products.find((x) => x.id === Number(productId));
    if (!p) return send(res, 404, { success: false, message: 'Product not found' });
    const line = cart.items.find((i) => i.productId === p.id);
    if (line) line.quantity = Math.min(99, line.quantity + quantity);
    else cart.items.push({ id: Date.now(), cartId: 1, productId: p.id, quantity, price: effective(p) });
    return ok(res, cartPayload(), 'Added to cart');
  }
  const cartItemMatch = path.match(/^\/cart\/(\d+)$/);
  if (cartItemMatch && method === 'PUT') {
    const { quantity } = await readBody(req);
    const line = cart.items.find((i) => i.id === Number(cartItemMatch[1]));
    if (line) line.quantity = Math.max(1, Math.min(99, quantity));
    return ok(res, { updatedItem: line, ...cartPayload() }, 'Cart updated');
  }
  if (cartItemMatch && method === 'DELETE') {
    const gone = cart.items.find((i) => i.id === Number(cartItemMatch[1]));
    cart.items = cart.items.filter((i) => i.id !== Number(cartItemMatch[1]));
    return ok(res, { removedItem: gone, ...cartPayload() }, 'Removed');
  }
  if (path === '/cart/clear' && method === 'DELETE') {
    cart.items = [];
    return ok(res, { ...cartPayload(), clearedItemsCount: 0 }, 'Cart cleared');
  }

  /* ---- orders ---- */
  if (path === '/orders' && method === 'GET') {
    const status = q.get('status');
    const list = status ? ORDERS.filter((o) => o.status === status) : ORDERS;
    return send(res, {
      success: true,
      message: 'Orders retrieved',
      data: list,
      pagination: {
        currentPage: Number(q.get('page') ?? 1),
        totalPages: 1,
        totalOrders: list.length,
        ordersPerPage: 10,
        hasNextPage: false,
        hasPrevPage: false,
        nextPage: null,
        prevPage: null,
      },
      filters: { totalResults: list.length, appliedFilters: {} },
    });
  }
  if (path === '/orders/create' && method === 'POST') {
    const payload = cartPayload();
    const subtotal = payload.totalAmount;
    const deliveryFee = subtotal >= 500 ? 0 : 40;
    const tax = Math.round(subtotal * 0.18 * 100) / 100;
    cart.items = [];
    return ok(
      res,
      {
        order: { id: 99, status: 'PENDING' },
        orderNumber: 'PF-2026-000099',
        totalAmount: subtotal + deliveryFee + tax,
        itemsCount: payload.itemsCount,
        estimatedDelivery: new Date(Date.now() + 86_400_000).toISOString(),
        paymentMethod: 'COD',
      },
      'Order placed',
    );
  }
  const orderMatch = path.match(/^\/orders\/(PF-\d{4}-\d+)$/);
  if (orderMatch && method === 'GET') {
    const o = ORDERS.find((x) => x.orderNumber === orderMatch[1]);
    if (!o) return send(res, 404, { success: false, message: 'Order not found' });
    return ok(res, o, 'Order retrieved');
  }

  /* ---- user ---- */
  if (path === '/user/address' && method === 'GET') {
    return send(res, { success: true, data: [demoAddress] });
  }
  if (path === '/user/address' && method === 'POST') {
    return send(res, 200, { success: true, data: { ...demoAddress, ...(await readBody(req)) } });
  }
  if (path.match(/^\/user\/address\/\d+$/) && method === 'DELETE') {
    return send(res, 200, { success: true, message: 'Address deleted' });
  }

  /* ---- admin ---- */
  if (path === '/admin/dashboard/stats' && method === 'GET') {
    return ok(res, {
      totalRevenue: 486320,
      totalOrders: 1284,
      totalCustomers: 873,
      recentOrders: ORDERS,
      salesData: Array.from({ length: 14 }, (_, i) => ({
        date: new Date(Date.now() - (13 - i) * 86_400_000).toISOString().slice(0, 10),
        sales: 14000 + Math.round(Math.sin(i / 2) * 5200) + i * 900,
      })),
      topProduce: products.slice(0, 5).map((p, i) => ({
        productId: p.id,
        productName: p.name,
        _sum: { totalSold: 420 - i * 57, revenue: effective(p) * (420 - i * 57) },
      })),
    });
  }
  if (path === '/admin/inventory/low-stock' && method === 'GET') {
    const t = Number(q.get('threshold') ?? 10);
    return send(res, {
      success: true,
      count: products.filter((p) => p.stock <= t).length,
      threshold: t,
      data: products.filter((p) => p.stock <= t),
    });
  }
  if (path === '/admin/categories' && method === 'GET') {
    return ok(res, { categories }, 'Categories');
  }

  /* ---- auth guard for anything else ---- */
  if (path.startsWith('/cart') || path.startsWith('/orders') || path.startsWith('/admin')) {
    if (!isAuthed(req)) {
      return send(res, 401, { error: 'Invalid or expired token' });
    }
  }

  return send(res, 404, { success: false, message: `No mock route for ${method} ${path}` });
}).listen(PORT, () => {
  console.log(`\n  🥦 PradhanFresh mock API on http://localhost:${PORT}`);
  console.log(`     ${products.length} products · ${categories.length} categories · ${ORDERS.length} orders`);
  console.log(`     sign in with user@test.com (any password)\n`);
});
