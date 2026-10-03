# QA portfolio — AI-assisted testing of a web shop

An automated test suite and bug reports for **Sauce Demo** (https://www.saucedemo.com), a public web shop
built for practising test automation. I built it with Claude Code as a demonstration of how I use AI
for testing: reading the product, writing scenarios, generating Playwright tests, and writing
bug reports that a developer can reproduce in minutes.

I am a beginner in testing. This is a practice project, not commercial experience.
I wrote it to learn and to show how I work.

## Result

- **60 test runs** (30 tests × desktop Chrome and Pixel 7 emulation) in about 16 seconds. All pass.
- **20 regression tests** cover login, catalog, cart and checkout for the correct behaviour.
- **10 bugs found** in the accounts that are broken on purpose, each with steps, expected and actual result,
  evidence and an automated test: [reports/BUG-REPORTS.md](reports/BUG-REPORTS.md).

## Reliability note

The tests run against a public site over the internet. In 6 full runs, 4 were completely green and 2 had one
failure each. Both times it was the same test, **BUG-010** (login speed of `performance_glitch_user`). It is a timing
test, so it depends on how long the page takes to answer, and the delay in this account is not always the same.
All other tests were stable. I added one automatic retry, so such a test is shown as "flaky" in the report
instead of failing the whole run.

## What is inside

| File | What it is |
|---|---|
| `docs/PRODUCT-CONTEXT.md` | Description of the product written for AI tools, so they do not have to guess |
| `docs/TEST-SCENARIOS.md` | Structured scenarios with priorities, and an honest list of what is not covered |
| `tests/regression.spec.ts` | Automated regression tests (Playwright, TypeScript) |
| `tests/known-bugs.spec.ts` | Tests for known bugs, marked as expected failures until fixed |
| `reports/BUG-REPORTS.md` | Bug reports: BUG-001 to BUG-010 |
| `evidence/` | Screenshots taken by the bug tests |

## How to run

```bash
npm install
npx playwright install chromium
npx playwright test            # all tests, both devices
npx playwright show-report reports/html
```

## How I used AI

1. The AI explored the application with a script and wrote `docs/PRODUCT-CONTEXT.md` from what it saw.
2. From that file the AI proposed scenarios in `docs/TEST-SCENARIOS.md`.
3. The AI generated the Playwright tests. They were run against the live application, and every
   failure was checked: is it a product bug or a test bug?
4. Bugs are written in a fixed format so that anyone can reproduce them.

What needs a human and is not left to the AI: deciding what counts as a bug and how severe it is, and
checking that a "passing" test really tests something. The tests were run against the broken
accounts to confirm that they fail when they should.

## Next steps

- Visual regression and accessibility checks.
- Cross-browser (Firefox, WebKit).
- Native mobile flows with Maestro or Appium.
