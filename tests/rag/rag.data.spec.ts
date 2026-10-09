import { test, expect } from '@playwright/test';
import { RAG, RagData } from './rag.helpers';

// Data integrity of /data.json, the file that feeds the demo page.
// These are consistency checks from outside: they do not judge if an answer is legally right,
// they check that what the page promises (every sentence has a source) holds in the data.

let data: RagData;
test.beforeAll(async ({ request }) => {
  data = await (await request.get(`${RAG}/data.json`)).json();
});

test.describe('RAG-DATA: consistency of the published data', () => {
  test('TC-RAG-01 data.json is served as JSON with the 4 laws', { tag: '@rag' }, async ({ request }) => {
    const res = await request.get(`${RAG}/data.json`);
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toContain('application/json');
    expect(data.sources.map((s) => s.law).sort()).toEqual(['NV 590', 'ZNP', 'ZP', 'ZZ']);
  });

  test('TC-RAG-02 chunk counts per law match the declared numbers', { tag: '@rag' }, async () => {
    for (const s of data.sources) {
      const n = data.chunks.filter((c) => c.law === s.law).length;
      expect(n, `law ${s.law}`).toBe(s.chunks);
    }
  });

  test('TC-RAG-03 chunk ids are unique and no chunk is empty', { tag: '@rag' }, async () => {
    const ids = data.chunks.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(data.chunks.filter((c) => !c.text || c.text.trim().length < 5)).toEqual([]);
  });

  test('TC-RAG-04 every answered question has exactly top_k sources', { tag: '@rag' }, async () => {
    const wrong = data.questions.filter((q) => q.hits.length !== data.top_k).map((q) => q.q);
    expect(wrong).toEqual([]);
  });

  test('TC-RAG-05 every source of every question points to an existing chunk', { tag: '@rag' }, async () => {
    const n = data.chunks.length;
    const broken = data.questions.flatMap((q) => q.hits.filter(([i]) => !Number.isInteger(i) || i < 0 || i >= n).map(([i]) => `${i} in "${q.q}"`));
    expect(broken).toEqual([]);
  });

  test('TC-RAG-06 every citation [n] in an answer points to a source that was delivered', { tag: '@rag' }, async () => {
    const bad = data.questions.filter((q) => {
      const cites = [...q.answer.matchAll(/\[(\d+)\]/g)].map((m) => +m[1]);
      return cites.some((n) => n < 1 || n > q.hits.length);
    });
    expect(bad.map((q) => q.q)).toEqual([]);
  });

  test('TC-RAG-07 every answer is either a refusal ("nevím") or carries at least one citation', { tag: '@rag' }, async () => {
    const uncited = data.questions.filter((q) => !/\[\d+\]/.test(q.answer) && !/nev[íi]m|nelze|neobsahuj|není v|nenašel/i.test(q.answer));
    expect(uncited.map((q) => q.answer.slice(0, 80))).toEqual([]);
  });

  test('TC-RAG-08 an answer never cites the same source number in a broken form (e.g. [0], [1.2])', { tag: '@rag' }, async () => {
    const odd = data.questions.filter((q) => /\[0\]|\[\d+[.,]\d+\]|\[\]/.test(q.answer));
    expect(odd.map((q) => q.q)).toEqual([]);
  });

  test('TC-RAG-09 published self-evaluation is consistent: "hit5" means a correct paragraph is among the 5 sources', { tag: '@rag' }, async () => {
    const wrong: string[] = [];
    for (const q of data.questions) {
      if (!q.test || !q.test.gold_chunks.length) continue;
      const shown = q.hits.map(([i]) => data.chunks[i].id);
      const found = q.test.gold_chunks.some((g) => shown.includes(g));
      if (q.test.hit5 !== found) wrong.push(`${q.q} (flag ${q.test.hit5}, real ${found})`);
    }
    expect(wrong).toEqual([]);
  });

  test('TC-RAG-10 test set: the share of correct answers is published and above 80 %', { tag: '@rag' }, async () => {
    const graded = data.questions.filter((q) => q.test);
    const ok = graded.filter((q) => q.test!.correct).length;
    expect(graded.length).toBeGreaterThanOrEqual(60);
    expect(ok / graded.length).toBeGreaterThan(0.8);
  });
});
