/**
 * Exercises the previously-broken order paths against the real database.
 * Run from backend/ with a valid .env.
 */
process.env.NODE_ENV = process.env.NODE_ENV || 'test';

const request = require('supertest');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../prisma/client');
const app = require('../server');

let pass = 0;
let fail = 0;
const failures = [];

const check = (name, cond, extra = '') => {
  if (cond) {
    pass++;
    console.log(`  ✅ ${name}`);
  } else {
    fail++;
    failures.push(name + (extra ? ` — ${extra}` : ''));
    console.log(`  ❌ ${name} ${extra}`);
  }
};

const auth = (user) =>
  jwt.sign({ userId: user.id, email: user.email, role: user.role }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: '30m',
  });

(async () => {
  console.log('\n=== setup ===');
  const email = `fix-${Date.now()}@test.local`;
  const hash = await bcrypt.hash('secret123', 10);
  const user = await prisma.user.create({
    data: { name: 'Fix Tester', email, password: hash, isEmailVerified: true },
  });
  const admin = await prisma.user.create({
    data: { name: 'Fix Admin', email: `admin-${Date.now()}@test.local`, password: hash, role: 'ADMIN', isEmailVerified: true },
  });
  const token = auth(user);
  const T = { Authorization: `Bearer ${token}` };

  const products = await prisma.product.findMany({ take: 3, include: { category: true } });
  check('seeded products available', products.length >= 3, `${products.length}`);
  const p = products[0];

  console.log('\n=== 1. POST /api/orders/create (was 500: OrderItem missing required fields) ===');
  await request(app)
    .post('/api/cart/add')
    .set(T)
    .send({ productId: p.id, quantity: 2 })
    .expect(200);

  const created = await request(app)
    .post('/api/orders/create')
    .set(T)
    .send({
      deliveryAddress: {
        fullName: 'Fix Tester',
        phone: '9876543210',
        addressLine1: '402 Green Meadows',
        addressLine2: '',
        city: 'Pune',
        state: 'Maharashtra',
        pincode: '411045',
        landmark: '',
      },
      paymentMethod: 'COD',
      deliverySlot: 'MORNING',
    });

  check('create order returns 201', created.status === 201, `got ${created.status}`);
  if (created.status !== 201) {
    console.log('     body:', JSON.stringify(created.body).slice(0, 300));
  }
  const orderNumber = created.body?.data?.orderNumber;
  check('order number returned', !!orderNumber, String(orderNumber));

  const item = created.body?.data?.order?.items?.[0];
  check('orderItem.productName persisted', !!item?.productName, String(item?.productName));
  check('orderItem.productSku persisted', !!item?.productSku, String(item?.productSku));
  check('orderItem.unit persisted', !!item?.unit, String(item?.unit));
  const myCart = await prisma.cart.findUnique({ where: { userId: user.id } });
  check('cart emptied after order', (await prisma.cartItem.count({ where: { cartId: myCart.id } })) === 0,
    `${await prisma.cartItem.count({ where: { cartId: myCart.id } })} items left`);

  console.log('\n=== 2. GET /api/orders/:orderNumber (was 500: statusHistory + User.phone) ===');
  const detail = await request(app).get(`/api/orders/${orderNumber}`).set(T);
  check('order detail returns 200', detail.status === 200, `got ${detail.status}`);
  if (detail.status !== 200) console.log('     body:', JSON.stringify(detail.body).slice(0, 300));
  check('statusHistory is an array', Array.isArray(detail.body?.data?.statusHistory));
  check('user object present', !!detail.body?.data?.user);
  check('orderSummary present', !!detail.body?.data?.orderSummary);
  check('deliveryAddress is an object', typeof detail.body?.data?.deliveryAddress === 'object');

  console.log('\n=== 3. PUT /api/orders/:orderNumber/status (was 500) ===');
  const upd = await request(app)
    .put(`/api/orders/${orderNumber}/status`)
    .set({ Authorization: `Bearer ${auth(admin)}` })
    .send({ status: 'CONFIRMED', adminNotes: 'auto test' });
  check('status update returns 200', upd.status === 200, `got ${upd.status}`);
  if (upd.status !== 200) console.log('     body:', JSON.stringify(upd.body).slice(0, 300));
  const hist = await prisma.orderStatusHistory.findFirst({
    where: { orderId: created.body?.data?.order?.id },
    orderBy: { changedAt: 'desc' },
  });
  check('history row written', !!hist);
  check('history oldStatus correct', hist?.oldStatus === 'PENDING', String(hist?.oldStatus));
  check('history newStatus correct', hist?.newStatus === 'CONFIRMED', String(hist?.newStatus));
  check('history changedByUserId set', hist?.changedByUserId === admin.id, `${hist?.changedByUserId} (want ${admin.id})`);

  console.log('\n=== 4. PUT /api/orders/:orderNumber/cancel (was 500: cancellationReason) ===');
  await request(app).post('/api/cart/add').set(T).send({ productId: p.id, quantity: 1 }).expect(200);
  const ord2 = await request(app)
    .post('/api/orders/create')
    .set(T)
    .send({
      deliveryAddress: {
        fullName: 'Fix Tester',
        phone: '9876543210',
        addressLine1: '402 Green Meadows',
        city: 'Pune',
        state: 'Maharashtra',
        pincode: '411045',
      },
      paymentMethod: 'COD',
    });
  const num2 = ord2.body?.data?.orderNumber;
  if (!num2) { console.log('     ord2 body:', JSON.stringify(ord2.body).slice(0,200)); }
  const stockBefore = (await prisma.product.findUnique({ where: { id: p.id } })).stock;

  const cancel = await request(app)
    .put(`/api/orders/${num2}/cancel`)
    .set(T)
    .send({ reason: 'Changed my mind' });
  check('cancel returns 200', cancel.status === 200, `got ${cancel.status}`);
  if (cancel.status !== 200) console.log('     body:', JSON.stringify(cancel.body).slice(0, 300));
  const cancelled = num2 ? await prisma.order.findUnique({ where: { orderNumber: num2 } }) : null;
  check('status is CANCELLED', cancelled?.status === 'CANCELLED', String(cancelled?.status));
  check('cancellationReason persisted', cancelled?.cancellationReason === 'Changed my mind', String(cancelled?.cancellationReason));
  const stockAfter = (await prisma.product.findUnique({ where: { id: p.id } })).stock;
  check('stock restored on cancel', stockAfter > stockBefore, `${stockBefore} → ${stockAfter}`);

  console.log('\n=== 5. GET /api/orders (list) ===');
  const list = await request(app).get('/api/orders').set(T);
  check('order list returns 200', list.status === 200, `got ${list.status}`);
  check('list contains created order', JSON.stringify(list.body).includes(orderNumber));

  console.log('\n=== 6. Wishlist ===');
  const wlAdd = await request(app).post('/api/user/wishlist/add').set(T).send({ productId: p.id });
  check('wishlist add 200/201', [200, 201].includes(wlAdd.status), `got ${wlAdd.status}`);
  const wl = await request(app).get('/api/user/wishlist').set(T);
  check('wishlist returns items', wl.status === 200 && wl.body?.data?.length === 1, JSON.stringify(wl.body).slice(0, 160));


  console.log('\n=== 7. Auth: refresh token keeps role + works over plain http ===');
  {
    const loginRes = await request(app).post('/api/auth/login').send({
      email: admin.email,
      password: 'secret123',
    });
    check('login returns 200', loginRes.status === 200, `got ${loginRes.status}`);
    const setCookie = (loginRes.headers['set-cookie'] || []).join(';');
    check('refresh cookie set', /refreshToken=/.test(setCookie), setCookie.slice(0, 80));
    check('cookie NOT secure on http (dev fix)', !/;\s*Secure/i.test(setCookie), setCookie.slice(0, 120));

    const refresh = await request(app).post('/api/auth/refresh-token').set('Cookie', setCookie.split(';')[0]);
    check('refresh returns 200', refresh.status === 200, `got ${refresh.status} ${JSON.stringify(refresh.body).slice(0,120)}`);
    const decoded = jwt.decode(refresh.body?.token || '');
    check('refreshed token carries role (was missing)', decoded?.role === 'ADMIN', `role=${decoded?.role}`);
    check('refresh returns user role', refresh.body?.user?.role === 'ADMIN');

    // A refreshed ADMIN token must still pass requireAdmin.
    const adminProbe = await request(app)
      .get('/api/admin/dashboard/stats')
      .set({ Authorization: `Bearer ${refresh.body.token}` });
    check('refreshed token passes requireAdmin (was 403)', adminProbe.status === 200, `got ${adminProbe.status}`);
  }

  console.log('\n=== 8. Addresses ===');
  {
    const bad = await request(app).post('/api/user/address').set(T).send({ fullName: 'X' });
    check('invalid address returns 400 (was 500)', bad.status === 400, `got ${bad.status}`);
    check('400 carries success:false', bad.body?.success === false);

    const good = await request(app)
      .post('/api/user/address')
      .set(T)
      .send({ fullName: 'Ananya P', phone: '9876543210', addressLine1: '402 Green Meadows', city: 'Pune', state: 'Maharashtra', pincode: '411045' });
    check('create address returns 201 (was 200)', good.status === 201, `got ${good.status}`);
    check('create carries message key', typeof good.body?.message === 'string');
    const addrId = good.body?.data?.id;

    const upd = await request(app)
      .put(`/api/user/address/${addrId}`)
      .set(T)
      .send({ landmark: 'Near the temple' });
    check('PUT address works (route was unmounted)', upd.status === 200, `got ${upd.status}`);
    check('landmark persisted', upd.body?.data?.landmark === 'Near the temple', upd.body?.data?.landmark);

    const list = await request(app).get('/api/user/address').set(T);
    check('GET addresses returns 200 + message', list.status === 200 && !!list.body?.message);

    const del = await request(app).delete(`/api/user/address/${addrId}`).set(T);
    check('DELETE address returns 200 (was 500)', del.status === 200, `got ${del.status}`);
  }

  console.log('\n=== 9. Error envelopes ===');
  {
    const noAuth = await request(app).get('/api/orders');
    check('401 has success:false', noAuth.body?.success === false, JSON.stringify(noAuth.body).slice(0, 100));
    const notAdmin = await request(app).get('/api/admin/dashboard/stats').set(T);
    check('403 has success:false', notAdmin.body?.success === false, JSON.stringify(notAdmin.body).slice(0, 100));
    const badId = await request(app).get('/api/products/abc').set(T);
    check('404 has success:false', badId.body?.success === false, JSON.stringify(badId.body).slice(0, 100));
  }

  console.log('\n=== 10. Helmet permits cross-origin product images ===');
  {
    const res = await request(app).get('/');
    const corp = res.headers['cross-origin-resource-policy'];
    check('CORP is cross-origin (was same-origin)', corp === 'cross-origin', String(corp));
  }

  console.log('\n=== 11. Wishlist remove ===');
  {
    const del = await request(app).delete(`/api/user/wishlist/${p.id}`).set(T);
    check('wishlist delete 200', del.status === 200, `got ${del.status}`);
    const after = await request(app).get('/api/user/wishlist').set(T);
    check('wishlist now empty', after.body?.data?.length === 0, String(after.body?.data?.length));
  }

  console.log('\n=== cleanup ===');
  await prisma.orderStatusHistory.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.cartItem.deleteMany({});
  await prisma.wishlistItem.deleteMany({});
  await prisma.wishlist.deleteMany({});
  await prisma.user.deleteMany({ where: { id: { in: [user.id, admin.id] } } }).catch(() => {});

  console.log(`\n================  ${pass} passed, ${fail} failed  ================`);
  if (fail) failures.forEach((f) => console.log('  ✗ ' + f));
  await prisma.$disconnect();
  process.exit(fail ? 1 : 0);
})().catch(async (e) => {
  console.error('harness error:', e);
  await prisma.$disconnect().catch(() => {});
  process.exit(1);
});