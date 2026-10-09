import { Page } from '@playwright/test';

// Target: the public RAG demo (labour-law assistant). Black-box tests only.
// Rule of this folder: NO test may start a model call. The live question form is never used,
// and the API tests only send requests that the server rejects before it reaches the model.
export const RAG = 'https://lukas-rag.vercel.app';

export type RagQuestion = {
  q: string;
  answer: string;
  hits: [number, number][]; // [position in chunks[], similarity]
  test: { set: string; correct: boolean; hit5: boolean; gold_chunks: string[] } | null;
};
export type RagData = {
  sources: { law: string; chunks: number }[];
  chunks: { id: string; law: string; title: string; text: string }[]; // id is the legal reference, e.g. "ZP § 56 odst. 1"
  questions: RagQuestion[];
  top_k: number;
};

/** Blocks the click counter so that tests never change the statistics of the production site. */
export async function stubHit(page: Page) {
  await page.route('**/api/hit', (route) => route.fulfill({ status: 204, body: '' }));
}

/** Opens the demo and collects console errors and failed requests. */
export async function openRag(page: Page) {
  const consoleErrors: string[] = [];
  const failed: string[] = [];
  page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text()));
  page.on('pageerror', (e) => consoleErrors.push(e.message));
  page.on('response', (r) => r.status() >= 400 && failed.push(`${r.status()} ${new URL(r.url()).pathname}`));
  await stubHit(page);
  await page.goto(RAG + '/', { waitUntil: 'load' });
  await page.locator('#cats button').first().waitFor(); // chips are hidden on a phone, categories are not
  return { consoleErrors, failed };
}
