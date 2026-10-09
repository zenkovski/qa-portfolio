# Incident: a test failed in WebKit, the shop was fine

**Date:** 9. 10. 2026 · **Found by:** adding a fourth browser · **Cause:** a bug in my own test

## Symptom

After I added WebKit (the engine of Safari), `TC-CAT-04` failed in about 4 of 10 attempts. The other three browsers passed every time.

## Investigation

1. Run the test 10 times in WebKit only: 4 failures. The failure was a wrong list of product names (empty or partial).
2. Read the trace of a failed run: the test read the product list **before** the page had drawn it. WebKit reports the URL `inventory.html` earlier than the other browsers.
3. Conclusion: not a bug in the shop. The test assumed "URL is right" means "page is ready".

## Fix

- `loginOk()` in `tests/helpers.ts` now waits until the first product is visible, not only for the URL.
- The product detail test waits for the "back to products" button.
- Result: 15 of 15 attempts pass.

## What I would do differently

- Wait for the thing the test reads, never for a proxy (a URL, a fixed time).
- A test failing in one browser only is a hint to look at the test first.

## Why it is written down

It is a real example of the difference between "the test failed" and "the product failed". It is also the reason the suite runs in four browsers.
