import { test, expect } from '@playwright/test';
import { RAG } from './rag.helpers';

// Contract and negative tests of the two serverless functions of the RAG demo.
// SAFETY: every request here is one the server must reject BEFORE it calls the model
// (wrong method, missing header, foreign origin, bad length, honeypot, invalid proof of work).
// No request is valid, so the owner's API budget is never spent. A valid request is never sent.

const ok = { Origin: RAG, 'x-rag-client': 'web', 'Content-Type': 'application/json' };
const ask = (request: any, headers: Record<string, string>, data: unknown, method = 'POST') =>
  request.fetch(`${RAG}/api/ask`, { method, headers, data, failOnStatusCode: false });

test.describe('RAG-API: /api/ask rejects bad requests before the model', () => {
  test('TC-RAG-20 GET is not allowed (405)', { tag: '@rag' }, async ({ request }) => {
    const res = await request.get(`${RAG}/api/ask`, { failOnStatusCode: false });
    expect(res.status()).toBe(405);
  });

  test('TC-RAG-21 missing client header is refused (403)', { tag: '@rag' }, async ({ request }) => {
    const res = await ask(request, { Origin: RAG, 'Content-Type': 'application/json' }, { q: 'Kolik dní dovolené mám?' });
    expect(res.status()).toBe(403);
  });

  test('TC-RAG-22 foreign Origin is refused (403)', { tag: '@rag', annotation: { type: 'note', description: 'The Origin header can be forged by a script; this check stops browsers of other sites only' } }, async ({ request }) => {
    const res = await ask(request, { ...ok, Origin: 'https://evil.example' }, { q: 'Kolik dní dovolené mám?' });
    expect(res.status()).toBe(403);
  });

  test('TC-RAG-23 a question shorter than 8 characters is refused (400)', { tag: '@rag' }, async ({ request }) => {
    expect((await ask(request, ok, { q: 'ahoj' })).status()).toBe(400);
  });

  test('TC-RAG-24 a question longer than 300 characters is refused (400)', { tag: '@rag' }, async ({ request }) => {
    expect((await ask(request, ok, { q: 'a'.repeat(301) })).status()).toBe(400);
  });

  test('TC-RAG-25 boundary: 300 characters pass the length check but fail on proof of work (400)', { tag: '@rag' }, async ({ request }) => {
    const res = await ask(request, ok, { q: 'a'.repeat(300) });
    expect(res.status()).toBe(400);
    expect(JSON.stringify(await res.json().catch(() => ({})))).not.toMatch(/délk|length|short|long/i);
  });

  test('TC-RAG-26 the honeypot field "website" makes a request fail (400)', { tag: '@rag' }, async ({ request }) => {
    expect((await ask(request, ok, { q: 'Kolik dní dovolené mám?', website: 'http://spam.example' })).status()).toBe(400);
  });

  test('TC-RAG-27 an invalid proof of work is refused (400)', { tag: '@rag' }, async ({ request }) => {
    const res = await ask(request, ok, { q: 'Kolik dní dovolené mám?', pow: { nonce: 'x', salt: 'y' } });
    expect(res.status()).toBe(400);
  });

  test('TC-RAG-28 malformed JSON gives a client error, not a server crash', { tag: '@rag' }, async ({ request }) => {
    const res = await request.fetch(`${RAG}/api/ask`, { method: 'POST', headers: ok, data: '{not json', failOnStatusCode: false });
    expect(res.status()).toBeGreaterThanOrEqual(400);
    expect(res.status()).toBeLessThan(500);
  });

  test('TC-RAG-29 error responses do not leak internals (stack traces, paths, keys)', { tag: '@rag' }, async ({ request }) => {
    const res = await ask(request, ok, { q: 'ahoj' });
    const body = await res.text();
    expect(body).not.toMatch(/at \w+.*\(.*:\d+:\d+\)|node_modules|\/var\/task|sk-or-|OPENROUTER|Bearer /i);
  });
});

test.describe('RAG-API: /api/hit (click counter) is protected', () => {
  test('TC-RAG-30 a foreign Origin is refused (403) and nothing is counted', { tag: '@rag' }, async ({ request }) => {
    const res = await request.fetch(`${RAG}/api/hit`, {
      method: 'POST',
      headers: { Origin: 'https://evil.example', 'Content-Type': 'application/json' },
      data: { q: 'QA-Lukas' },
      failOnStatusCode: false,
    });
    expect(res.status()).toBe(403);
  });
});
