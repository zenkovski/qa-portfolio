import { test, expect, APIRequestContext } from '@playwright/test';

// API tests against Restful-Booker (https://restful-booker.herokuapp.com), a public practice API for testers.
// Covers: status codes, response shape, create -> read -> update -> delete flow, auth, validation, response time.
// Data created by a test is deleted by the same test. Names are tagged "QA-Lukas" so they are easy to recognise.

const BASE = 'https://restful-booker.herokuapp.com';
const TAG = 'QA-Lukas';

const booking = (over: Record<string, unknown> = {}) => ({
  firstname: TAG,
  lastname: 'Testovic',
  totalprice: 1234,
  depositpaid: true,
  bookingdates: { checkin: '2026-12-01', checkout: '2026-12-05' },
  additionalneeds: 'Breakfast',
  ...over,
});

// admin / password123 are the public credentials printed in the Restful-Booker documentation (practice API)
async function token(request: APIRequestContext) {
  const res = await request.post(`${BASE}/auth`, { data: { username: 'admin', password: 'password123' } });
  return (await res.json()).token as string;
}

const json = { Accept: 'application/json', 'Content-Type': 'application/json' };

test.describe('API-HEALTH', () => {
  test('TC-API-01 /ping answers 201 (this API returns 201 for a healthy server)', { tag: '@api' }, async ({ request }) => {
    expect((await request.get(`${BASE}/ping`)).status()).toBe(201);
  });

  test('TC-API-02 the booking list is an array of ids and answers within 3 s', { tag: '@api' }, async ({ request }) => {
    const t0 = Date.now();
    const res = await request.get(`${BASE}/booking`, { headers: json });
    expect(Date.now() - t0).toBeLessThan(3000);
    expect(res.status()).toBe(200);
    const list = await res.json();
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBeGreaterThan(0);
    expect(typeof list[0].bookingid).toBe('number');
  });
});

test.describe('API-CRUD: full life of one booking', () => {
  test.describe.configure({ mode: 'serial' });
  let id: number;
  let tok: string;

  test.beforeAll(async ({ playwright }) => {
    const ctx = await playwright.request.newContext();
    tok = await token(ctx);
    await ctx.dispose();
  });

  test('TC-API-10 create: the response echoes the data and gives an id', { tag: '@api' }, async ({ request }) => {
    const res = await request.post(`${BASE}/booking`, { data: booking(), headers: json });
    expect(res.status()).toBe(200);
    const body = await res.json();
    id = body.bookingid;
    expect(typeof id).toBe('number');
    expect(body.booking).toMatchObject(booking());
  });

  test('TC-API-11 read: what was created comes back unchanged (round trip)', { tag: '@api' }, async ({ request }) => {
    const res = await request.get(`${BASE}/booking/${id}`, { headers: json });
    expect(res.status()).toBe(200);
    expect(await res.json()).toEqual(booking());
  });

  test('TC-API-12 response has the right field types (contract)', { tag: '@api' }, async ({ request }) => {
    const b = await (await request.get(`${BASE}/booking/${id}`, { headers: json })).json();
    expect(typeof b.firstname).toBe('string');
    expect(typeof b.lastname).toBe('string');
    expect(typeof b.totalprice).toBe('number');
    expect(typeof b.depositpaid).toBe('boolean');
    expect(b.bookingdates.checkin).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(b.bookingdates.checkout).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test('TC-API-13 filter by first name finds the booking', { tag: '@api' }, async ({ request }) => {
    const list = await (await request.get(`${BASE}/booking?firstname=${TAG}`, { headers: json })).json();
    expect(list.map((x: any) => x.bookingid)).toContain(id);
  });

  test('TC-API-14 update without a token is refused with 403', { tag: '@api' }, async ({ request }) => {
    const res = await request.put(`${BASE}/booking/${id}`, { data: booking({ totalprice: 1 }), headers: json });
    expect(res.status()).toBe(403);
  });

  test('TC-API-15 full update with a token changes the data', { tag: '@api' }, async ({ request }) => {
    const res = await request.put(`${BASE}/booking/${id}`, { data: booking({ totalprice: 999 }), headers: { ...json, Cookie: `token=${tok}` } });
    expect(res.status()).toBe(200);
    expect((await res.json()).totalprice).toBe(999);
  });

  test('TC-API-16 partial update changes only the sent field', { tag: '@api' }, async ({ request }) => {
    const res = await request.patch(`${BASE}/booking/${id}`, { data: { lastname: 'Zmenovic' }, headers: { ...json, Cookie: `token=${tok}` } });
    expect(res.status()).toBe(200);
    const b = await res.json();
    expect(b.lastname).toBe('Zmenovic');
    expect(b.firstname).toBe(TAG);
    expect(b.totalprice).toBe(999);
  });

  test('TC-API-17 delete removes the booking and a later read gives 404', { tag: '@api' }, async ({ request }) => {
    const del = await request.delete(`${BASE}/booking/${id}`, { headers: { ...json, Cookie: `token=${tok}` } });
    expect([200, 201, 204]).toContain(del.status());
    expect((await request.get(`${BASE}/booking/${id}`, { headers: json })).status()).toBe(404);
  });

  test('BUG-API-03 a successful delete answers 204 or 200, not 201 Created', { tag: '@api' }, async ({ request }) => {
    test.fail(true, 'BUG-API-03');
    const created = await (await request.post(`${BASE}/booking`, { data: booking(), headers: json })).json();
    const del = await request.delete(`${BASE}/booking/${created.bookingid}`, { headers: { ...json, Cookie: `token=${tok}` } });
    expect([200, 204]).toContain(del.status());
  });
});

test.describe('API-NEG: wrong input and bad credentials', () => {
  test('BUG-API-01 wrong password answers 401, not 200', { tag: '@api' }, async ({ request }) => {
    test.fail(true, 'BUG-API-01');
    const res = await request.post(`${BASE}/auth`, { data: { username: 'admin', password: 'wrong' } });
    expect(res.status()).toBe(401);
  });

  test('TC-API-20 wrong password gives no token', { tag: '@api' }, async ({ request }) => {
    const body = await (await request.post(`${BASE}/auth`, { data: { username: 'admin', password: 'wrong' } })).json();
    expect(body.token).toBeUndefined();
  });

  test('BUG-API-02 missing required fields answer 400, not 500', { tag: '@api' }, async ({ request }) => {
    test.fail(true, 'BUG-API-02');
    const res = await request.post(`${BASE}/booking`, { data: { firstname: TAG }, headers: json });
    expect(res.status()).toBe(400);
  });

  test('TC-API-21 reading a booking that does not exist gives 404', { tag: '@api' }, async ({ request }) => {
    expect((await request.get(`${BASE}/booking/99999999`, { headers: json })).status()).toBe(404);
  });

  test('TC-API-22 delete without a token is refused with 403', { tag: '@api' }, async ({ request }) => {
    expect((await request.delete(`${BASE}/booking/1`, { headers: json })).status()).toBe(403);
  });
});
