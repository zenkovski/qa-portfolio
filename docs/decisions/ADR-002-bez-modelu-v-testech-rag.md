# ADR-002: Tests of the RAG demo never call the model

**Status:** accepted · **Date:** 9. 10. 2026

## Context

The RAG demo answers questions with a paid language model. The owner's API key has a small budget. The page also has a public question form.

## Decision

All tests in `tests/rag/` follow three rules:

1. **The question form is never used.** Only preset questions and categories, which show stored answers.
2. **API tests send only requests the server must reject before the model** (wrong method, missing header, foreign origin, bad length, honeypot, invalid proof of work). No request is valid.
3. **`/api/hit` (click counter) is stubbed** in every browser test with `route.fulfill({ status: 204 })`, so the production statistics stay clean. One API test sends a request with a foreign origin to prove that the counter refuses it.

## Consequences

- The tests cost nothing and are safe to run every week from CI.
- Behaviour that needs a real answer cannot be tested this way (rate limit, answer quality, prompt injection). It is listed in [limitations.md](../limitations.md).
- If the server checked things in a different order, a "rejected" request could start to reach the model. Mitigation: the invalid requests fail on checks that come first by design (method, headers, length). If a test ever returns 200, it must be stopped and looked at, not retried.
