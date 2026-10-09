# QA Lab — automated tests for a web shop and a public API

Automated tests, scenarios and bug reports for two practice targets:

- **Sauce Demo** (https://www.saucedemo.com), a web shop made for practising test automation
- **Restful-Booker** (https://restful-booker.herokuapp.com), a booking API made for practising API testing

Everything is built with Playwright and TypeScript. I built it with Claude Code to show how I work with AI:
the AI writes and explores, I decide what is a bug and check every result.

I am a beginner in testing. This is a practice project, not commercial experience.

**Live page with the test report:** https://lukas-qa.vercel.app

## What is inside

| Kind | Tests | What it checks |
|---|---|---|
| UI regression + smoke | 30 | Login, catalog, cart, checkout. 5 smoke tests tell in seconds whether the shop is alive |
| API | 16 | Create, read, update, delete, auth, field types, bad input, response time |
| Accessibility | 7 | axe-core, WCAG 2.0/2.1 A+AA on 4 pages, keyboard-only login, image alt text |
| Security (basic) | 7 | Forged session cookie, cookie flags, script in inputs, https, pages without login |
| Visual | 2 | Pixel comparison inside one run (no stored baseline images) |
| Performance | 7 | Login time, median of 5 runs per account |
| Known bugs as tests | 20 | A bug written as a test, so the suite stays green and speaks up when it is fixed |

81 test cases, about 250 runs across **Chromium, Firefox, WebKit (Safari engine), a Pixel 7 phone emulation and the API**, in under 2 minutes.

**18 bugs found**, each with steps, expected and actual result, evidence and a test: [reports/BUG-REPORTS.md](reports/BUG-REPORTS.md).
Highlights: a session that is only a typed cookie (BUG-011), checkout accepts blank names (BUG-014), a moved cart icon found by pixel comparison (BUG-015), an API that answers 200 to a wrong password (BUG-API-01).

## How to run

```bash
npm install
npx playwright install        # downloads the browsers
npm run test:smoke            # 5 tests, a few seconds
npx playwright test           # everything
npm run report                # opens the HTML report
```

Other scripts: `npm run test:api`, `npm run test:a11y`, `npm run test:security`.
Tags (`@smoke`, `@regression`, `@api`, `@a11y`, `@security`, `@visual`, `@perf`, `@bug`) can be combined with `--grep`.

To rebuild the web page after a run: `python build_site.py` (needs Python and Pillow). It reads `reports/results.json` and `reports/perf.json`.

## How the suite is built

- **Page Objects** (`tests/pages/`): selectors in one place, tests read like sentences.
- **Stable selectors:** only `data-test` attributes.
- **Independent tests:** each logs in and creates its own data, so everything runs in parallel.
- **Test IDs** (`TC-AUTH-01`, `BUG-004`) match the scenario list and the bug reports.
- **Bug tests** use `test.fail()`. They pass while the bug exists, and report "unexpected pass" after the fix.
- **Visual tests without baseline images:** a stored screenshot from one OS never matches another, so two screenshots from the same run are compared.
- **API tests clean up:** whatever a test creates, it deletes. Names start with `QA-Lukas`.
- **CI:** `.github/workflows/tests.yml` runs smoke on every push, then the full suite, and every Monday (the public targets can change without any commit here). The report is saved as an artifact.

## Documents

| File | What it is |
|---|---|
| [docs/TEST-STRATEGY.md](docs/TEST-STRATEGY.md) | Scope, risk-based priorities, test types and why, flaky policy, what I would do next |
| [docs/TEST-SCENARIOS.md](docs/TEST-SCENARIOS.md) | Scenarios with priority and an honest list of what is not covered |
| [docs/PRODUCT-CONTEXT.md](docs/PRODUCT-CONTEXT.md) | Description of the product written for AI tools, so they do not have to guess |
| [reports/BUG-REPORTS.md](reports/BUG-REPORTS.md) | BUG-001 to BUG-015 and BUG-API-01 to 03 |

## Reliability

The tests run against public sites over the internet. Two things I learned:

- **The only flaky test is a timing test** (BUG-010, login speed of `performance_glitch_user`). It shows as "flaky" in the report instead of hiding. Speed is judged on the median of 5 runs, not on one run.
- **A bug in my own test:** after adding WebKit, one test failed in 4 of 10 attempts. The shop was fine. My test read the product list before the page had drawn it. I fixed it by waiting for the page to be drawn; 15 of 15 attempts then passed. This is why I run more than one browser.

## How I used AI

1. The AI explored the application with a script and wrote `docs/PRODUCT-CONTEXT.md` from what it saw.
2. From that file the AI proposed scenarios in `docs/TEST-SCENARIOS.md`. I set the priorities by risk.
3. The AI generated the tests. I ran them against the live targets and checked every failure: product bug or test bug?
4. I ran every new test against the broken accounts too, because a test that never fails proves nothing.

What stays with a human: deciding what counts as a bug and how severe it is, and checking that a passing test really tests something.

## Limits

- The targets are practice apps, so many bugs are placed there on purpose. The value is the method, not the discovery.
- Not covered: real mobile devices and native apps (I would use Maestro or Appium), load testing, manual screen-reader testing.
- Security checks are only those a tester can do from the browser. This is not a penetration test.
