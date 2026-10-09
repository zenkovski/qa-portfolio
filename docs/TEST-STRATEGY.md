# Test strategy

One page that answers: what do we test, how, why this way, and what do we knowingly leave out.
Written for a practice project, but built the way I would start on a real product.

## 1. Goal

Find the problems a user or a developer would care about, as early and as cheaply as possible, and keep the answer
repeatable: the same command gives the same verdict on any computer.

## 2. Scope

| In scope | Out of scope (and why) |
|---|---|
| Web UI of Sauce Demo: login, catalog, cart, checkout | Real payments (none exist) |
| Behaviour per user account (6 accounts) | Load testing: a public site I do not own must not be loaded |
| REST API of Restful-Booker: CRUD, auth, validation | Penetration testing: only checks a tester can do from the browser |
| Accessibility (WCAG 2.0/2.1 A+AA via axe-core) | Manual screen-reader testing (needs a human and real software) |
| Basic security checks (session, XSS in inputs, https) | Native iOS/Android apps (would need Maestro or Appium) |
| Visual comparison and login speed | Real devices (emulation only) |

## 3. Risk-based priorities

I rank areas by **what hurts most if it breaks × how likely it is to break**.

| Area | Impact | Likelihood | Priority | Why |
|---|---|---|---|---|
| Login and session | High | Medium | P1 | Everything else depends on it; security flaw found (BUG-011) |
| Cart | High | High | P1 | Two accounts lose items (BUG-003, BUG-006) |
| Checkout | High | High | P1 | This is where the money is; 3 bugs found in forms |
| Prices | High | Medium | P1 | Wrong price = legal and trust problem (BUG-008) |
| Catalog sort and images | Medium | High | P2 | Visible, annoying, no data loss |
| Accessibility | Medium | Medium | P2 | Legal requirement in many places, cheap to check automatically |
| Visual layout | Low | Medium | P3 | Needs a pixel check, a text locator cannot see it |
| Login speed | Medium | Low | P2 | Users leave after a few seconds (BUG-010) |

## 4. Test types and why each one is here

| Type | Tool | Tag | What it catches that the others do not |
|---|---|---|---|
| Smoke (5 tests) | Playwright | `@smoke` | "Is the shop alive?" in 3 seconds, before anything slower runs |
| Regression | Playwright | `@regression` | Correct behaviour stays correct after a change |
| Known bugs | Playwright `test.fail()` | `@bug` | Documents a bug as a test. It turns "unexpectedly passes" when fixed |
| Data-driven / boundary | Playwright, table of cases | `@regression` | Diacritics, 300-character values, emoji, spaces-only input |
| API | Playwright `request` | `@api` | Status codes, contract (field types), flow, auth, bad input. Much faster than a UI test |
| Accessibility | axe-core | `@a11y` | Missing labels, contrast, landmarks, keyboard-only use |
| Security (basic) | Playwright | `@security` | Forged session, cookie flags, script in inputs, https |
| Visual | pixelmatch | `@visual` | Moved or changed elements that locators cannot see |
| Performance | Playwright timing | `@perf` | Login speed (median of 5 runs per account) |
| Cross-browser | Chromium, Firefox, WebKit, Pixel 7 | all UI | Differences between engines |

The API tests deliberately run next to the UI tests: a bug found at the API level has a cheaper and more precise fix.

## 5. How the suite is built

- **Page Objects** (`tests/pages/`): selectors live in one place, so a changed button is one edit.
- **Stable selectors:** only `data-test` attributes, never CSS classes or text positions.
- **Independent tests:** each test logs in on its own and creates its own data. Order does not matter, so tests run in parallel.
- **Every test has an ID** (`TC-AUTH-01`, `BUG-004`) that matches `docs/TEST-SCENARIOS.md` and the bug reports.
- **Evidence:** bug tests save a screenshot to `evidence/`.
- **No stored screenshots to compare against.** A baseline image from one OS never matches another. Visual tests compare two screenshots from the same run.
- **API data is cleaned up:** a test deletes what it created.

## 6. Bugs: how I decide

| Severity | Meaning | Example |
|---|---|---|
| High | Money, data or security is affected, or a core flow is blocked | BUG-004 (no order possible), BUG-011 (login bypass) |
| Medium | A feature is wrong, but there is a way around | BUG-002 (sorting broken) |
| Low | Cosmetic or best-practice | BUG-015 (icon moved) |

Every bug report has: account and area, numbered steps, expected result, actual result, evidence and the test ID.
I check whether a failure is a **product bug or a test bug** before I report it. A bug that I cannot reproduce twice is not reported.

## 7. Flaky tests

A flaky test fails sometimes without a change in the product. Here the only candidate is a timing test.

- One automatic retry (`retries: 1`). A test that passes on the retry is shown as **flaky** in the report, not hidden.
- Timing is judged on the **median of 5 runs**, not on one run.
- A flaky test that keeps flaking gets fixed or removed. It is not left to teach people to ignore red.

## 8. Entry and exit

- **Start testing** when the build opens and the smoke tests pass.
- **Stop and report** when smoke fails: nothing else is worth running until the shop is alive.
- **Release recommendation** (if this were a real product): no open High bug, Medium bugs known and accepted, zero WCAG A/AA violations.

## 9. What I would do next on a real product

1. Talk to the developers and the product owner about the **questions below** before I call anything a bug.
2. Run smoke on every push and the full suite every night (workflow already in `.github/workflows/tests.yml`).
3. Add test data management (a fixed seed per environment) and a staging environment.
4. Add contract tests if more than one service shares the API.
5. Add Maestro or Appium for native mobile.

### Questions I would ask the product owner (not bugs until answered)

- Should the postal code be validated (digits, length)? It accepts anything now, including 300 characters.
- Is a 300-character name acceptable, or should there be a limit?
- Are the same prices expected for every user account? (`visual_user` shows different ones, which I treat as a bug.)

## 10. Third target: an AI system (RAG demo)

The RAG demo answers questions with a language model and promises that every sentence has a source. From outside, QA can test three things without judging the law:

1. **Does the promise hold in the data?** `/data.json` is checked: every citation `[n]` points to a delivered source, every source exists, counts match, every answer has a citation or is a refusal (`TC-RAG-01` to `10`).
2. **Does the API refuse what it must refuse?** Wrong method, missing header, foreign origin, bad length, honeypot, invalid proof of work, malformed JSON (`TC-RAG-20` to `30`).
3. **Does the page work for a visitor?** Presets, citation click, filters, map, disclaimer, phone layout, speed, accessibility, headers (`TC-RAG-40` to `55`, `BUG-RAG-01` to `04`).

Rule that shapes all of it: **no test may call the model** ([ADR-002](decisions/ADR-002-bez-modelu-v-testech-rag.md)). Whether an answer is *right* is a different question, measured with a labelled question set in the rag-demo project.

## 11. Honest limits

- The target is a practice app, so many "bugs" are placed there on purpose. The value here is the **method**, not the discovery.
- I am a beginner in testing. I use AI to write and explore, and I check every result myself (see README, "How I used AI").
- The RAG demo is my own project. Full list of what is not tested: [limitations.md](limitations.md).
- A suite of this size is small. It shows the structure, not the effort of a real product.
