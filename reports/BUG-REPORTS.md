# Bug reports — Sauce Demo (https://www.saucedemo.com)

Found by running the automated suite (`tests/known-bugs.spec.ts`, `a11y`, `security`, `boundary`, `visual`, `api`) plus manual exploration.
UI bugs were reproduced on **desktop Chrome, Firefox, WebKit (Safari engine) and a Pixel 7 emulation**.
Severity and priority are my own assessment.

Password for all test accounts: `secret_sauce` (published on the login page of this practice app).

| ID | Account | Area | Summary | Severity |
|---|---|---|---|---|
| BUG-001 | problem_user | Catalog | All 6 products show the same wrong image (a dog photo) | Medium |
| BUG-002 | problem_user | Catalog | Sorting has no effect | Medium |
| BUG-003 | problem_user | Cart | Only 3 of 6 products can be added to the cart | High |
| BUG-004 | problem_user | Checkout | Typing a last name overwrites the first name field | High |
| BUG-005 | error_user | Catalog | Sorting shows a "Sorting is broken!" alert and does not sort | Medium |
| BUG-006 | error_user | Cart | Only 3 of 6 products can be added to the cart | High |
| BUG-007 | error_user | Checkout | Last name field loses the typed value; checkout continues with it empty | High |
| BUG-008 | visual_user | Catalog | Prices do not match the price list | High |
| BUG-009 | visual_user | Catalog | First product shows the wrong image (a dog photo) | Low |
| BUG-010 | performance_glitch_user | Login | Login takes about 5.5 s instead of under 1 s | Medium |
| BUG-011 | all | Security | A made-up session cookie opens the catalog without login | High |
| BUG-012 | all | Security | Session cookie has no HttpOnly / Secure flag | Medium |
| BUG-013 | all | Accessibility | No main heading, content outside landmarks | Low |
| BUG-014 | standard_user | Checkout | Fields with only spaces pass the required check | Medium |
| BUG-015 | visual_user | Catalog | Cart icon moved out of place in the header | Low |
| BUG-API-01 | API | Auth | Wrong password answers 200 instead of 401 | Medium |
| BUG-API-02 | API | Validation | Missing fields answer 500 instead of 400 | Medium |
| BUG-API-03 | API | Delete | Successful delete answers 201 instead of 204 | Low |

---

## BUG-001 — All products show the same wrong image, a dog photo (problem_user)

**Steps**
1. Open https://www.saucedemo.com.
2. Log in as `problem_user` / `secret_sauce`.
3. Look at the product images on the catalog page.

**Expected:** each of the 6 products has its own image (6 different image sources, as for `standard_user`).
**Actual:** all 6 products use the same dog photo (`sl-404…jpg`, 1 unique image source).
**Evidence:** `evidence/BUG-001-desktop-chrome.png`, `evidence/BUG-001-mobile-pixel.png`
**Test:** `BUG-001`

## BUG-002 — Sorting does nothing (problem_user)

**Steps**
1. Log in as `problem_user`.
2. Open the sort menu and choose "Name (Z to A)". Then try "Price (low to high)".

**Expected:** the list is reordered.
**Actual:** the order stays A–Z / unchanged. After "Price (low to high)" the prices were `$29.99, $9.99, $15.99, $49.99, $7.99, $15.99`.
**Evidence:** `evidence/BUG-002-*.png`
**Test:** `BUG-002`

## BUG-003 — Only 3 of 6 products can be added to the cart (problem_user)

**Steps**
1. Log in as `problem_user`.
2. Click "Add to cart" on all 6 products.

**Expected:** the cart badge shows 6 and all 6 buttons change to "Remove".
**Actual:** the cart badge shows 3 and only 3 buttons change to "Remove". The other clicks have no effect and no message is shown.
**Evidence:** `evidence/BUG-003-*.png`
**Test:** `BUG-003`

## BUG-004 — Last name field writes into the first name field (problem_user)

**Steps**
1. Log in as `problem_user`, add a product, open the cart, click Checkout.
2. Type `Jan` into First Name, then `Novák` into Last Name.

**Expected:** First Name = `Jan`, Last Name = `Novák`.
**Actual:** First Name becomes `Novák` and Last Name stays empty. Continue then fails with "Error: Last Name is required", so the user cannot finish an order.
**Evidence:** `evidence/BUG-004-*.png`
**Test:** `BUG-004`

## BUG-005 — Sorting shows an error alert (error_user)

**Steps**
1. Log in as `error_user`.
2. Choose any sort option.

**Expected:** the list is sorted, no error.
**Actual:** a browser alert appears: "Sorting is broken! This error has been reported to Backtrace." The list is not sorted.
**Evidence:** `evidence/BUG-005-*.png`
**Test:** `BUG-005`

## BUG-006 — Only 3 of 6 products can be added to the cart (error_user)

Same steps and result as BUG-003, with the account `error_user`. Badge shows 3 instead of 6.
**Evidence:** `evidence/BUG-006-*.png`
**Test:** `BUG-006`

## BUG-007 — Last name is lost and checkout continues without it (error_user)

**Steps**
1. Log in as `error_user`, add a product, open the cart, click Checkout.
2. Fill First Name `Jan`, Last Name `Novák`, Postal Code `11000`, click Continue.

**Expected:** the typed last name is kept. If it were empty, an error should block the step.
**Actual:** the Last Name field is empty after typing, yet Continue moves to the order overview (`checkout-step-two`) without any validation error. Two defects in one flow: the field loses its value, and required-field validation is bypassed.
**Evidence:** `evidence/BUG-007-*.png`
**Test:** `BUG-007`

## BUG-008 — Prices do not match the price list (visual_user)

**Steps**
1. Log in as `visual_user`.
2. Read the prices on the catalog page.

**Expected:** `$29.99, $9.99, $15.99, $49.99, $7.99, $15.99` (as for `standard_user`).
**Actual:** different prices are shown (for example `$21.13`, `$69.88`, `$54.66`, `$55.10`, `$43.95`, `$25.20` after sorting by price). Sorting by price low to high is also not in ascending order.
**Evidence:** `evidence/BUG-008-*.png`
**Test:** `BUG-008`

## BUG-009 — First product shows the wrong image (a dog photo) (visual_user)

**Steps:** log in as `visual_user` and look at the first product.
**Expected:** the backpack image.
**Actual:** the dog photo (`sl-404`) is shown for the first product only.
**Test:** `BUG-009`

## BUG-010 — Login is slow (performance_glitch_user)

**Steps**
1. Open the login page, enter `performance_glitch_user` / `secret_sauce`, click Login.
2. Measure the time until the catalog page loads.

**Expected:** under 2 seconds (`standard_user`: about 0.15 s in my runs).
**Actual:** about **5.2 seconds** (median of 5 runs). The delay is **not constant**: on the first GitHub Actions run, three attempts took only 0.23 to 0.38 s and the others about 5.4 s. A single-run test is therefore unreliable, so the test judges the median of 5 runs.
**Test:** `BUG-010` (`tests/performance.spec.ts`)

---

## BUG-011 — A made-up session cookie opens the catalog without a login (all accounts)

**Severity:** High (security: authentication can be skipped)

**Steps**
1. Open https://www.saucedemo.com in a fresh browser profile (not logged in).
2. In developer tools set a cookie: name `session-username`, value `standard_user`, path `/`.
3. Open https://www.saucedemo.com/inventory.html.

**Expected:** access is refused, because no login happened ("You can only access '/inventory.html' when you are logged in.").
**Actual:** the catalog opens and the shop works as `standard_user`. The "session" is only a plain user name stored in a cookie that anyone can type, so anyone can act as any known account.
**Note:** Sauce Demo is a practice shop with public passwords, so this is a design weakness, not a real leak. In a real product this would be a top-priority finding.
**Test:** `BUG-011` (`tests/security.spec.ts`) · **Evidence:** `evidence/BUG-011-*.png`

---

## BUG-012 — The session cookie has no HttpOnly and no Secure flag

**Severity:** Medium (security)

**Steps**
1. Log in as `standard_user`.
2. In developer tools open Application → Cookies → `session-username`.

**Expected:** `HttpOnly` and `Secure` are set, so scripts cannot read the cookie and it is never sent over plain http.
**Actual:** both are `false`. Together with BUG-011, a script on the page can read and reuse the session value.
**Test:** `BUG-012` (`tests/security.spec.ts`)

---

## BUG-013 — Pages have no main heading and content sits outside landmarks (accessibility)

**Severity:** Low (accessibility, best practice)

**Steps**
1. Open the login page and run an axe-core scan (browser extension or `@axe-core/playwright`).

**Expected:** no findings.
**Actual:** two findings, `page-has-heading-one` (the page has no `<h1>`) and `region` (the page content is not inside landmark elements such as `<main>`). Screen-reader users cannot jump to the main content. The catalog page has the missing `<h1>` too.
**Good news:** zero violations of the WCAG 2.0/2.1 A and AA rules on login, catalog, cart and checkout (colour contrast, labels, alt text); all 6 product images have alt text; login works with the keyboard only.
**Test:** `BUG-013` (`tests/a11y.spec.ts`)

---

## BUG-014 — Checkout accepts fields that contain only spaces

**Severity:** Medium (order with an empty name is possible)

**Steps**
1. Log in as `standard_user`, add a product, open the cart, click Checkout.
2. Type five spaces in First Name, `Novák` in Last Name, `11000` in Postal Code (or: valid names and spaces in Postal Code). Click Continue.

**Expected:** error "First Name is required" (or "Postal Code is required").
**Actual:** the overview page opens and the order can be finished. The "required" check only tests for an empty field, not for blank text.
**Test:** `BUG-014`, `BUG-014b` (`tests/boundary.spec.ts`) · **Evidence:** `evidence/BUG-014-*.png`

---

## BUG-015 — visual_user: the cart icon is moved out of its place in the header

**Severity:** Low (visual)

**Steps**
1. Log in as `visual_user`, then as `standard_user`. Compare the header of the catalog.

**Expected:** the cart icon sits at the top right, as for `standard_user`.
**Actual:** the cart icon is displaced down and to the left, above the sort menu. The menu icon is also drawn slightly differently. A pixel comparison of the header strip finds 344 different pixels at 1280×800, the same number on every run, so the defect is deterministic.
**Why a pixel test:** this is easy to miss when looking at the page and impossible to check with a text locator, since the element is still there. Comparison is done inside one run (no stored baseline image), so it works on any computer.
**Test:** `BUG-015` (`tests/visual.spec.ts`) · **Evidence:** `evidence/BUG-015-desktop-chrome.png` (page), `…-diff.png` (red = different pixels)

---

# API bugs — Restful-Booker (https://restful-booker.herokuapp.com)

A public practice API for testers. Tests are in `tests/api/booker.api.spec.ts`. Every booking a test creates is deleted by the test, and all names start with `QA-Lukas`.

## BUG-API-01 — Wrong password answers HTTP 200

**Severity:** Medium

**Steps:** `POST /auth` with `{"username":"admin","password":"wrong"}`.
**Expected:** `401 Unauthorized`.
**Actual:** `200 OK` with the body `{"reason":"Bad credentials"}`. A client that checks only the status code treats the login as successful. (There is no token in the body, which `TC-API-20` confirms.)

---

## BUG-API-02 — Missing required fields answer HTTP 500

**Severity:** Medium

**Steps:** `POST /booking` with only `{"firstname":"QA-Lukas"}`.
**Expected:** `400 Bad Request` with a message naming the missing fields.
**Actual:** `500 Internal Server Error` and the plain text body `Internal Server Error`. Bad input from a client is reported as a server crash, so it is hard to tell a client mistake from a real outage.

---

## BUG-API-03 — A successful delete answers 201 Created

**Severity:** Low

**Steps:** create a booking, then `DELETE /booking/{id}` with a valid token.
**Expected:** `204 No Content` (or `200 OK`).
**Actual:** `201 Created`, a status that means "something was created". The delete itself works (a later `GET` gives 404, see `TC-API-17`).

---

## How these tests stay useful

Each bug test is marked `test.fail()`. The suite stays green while the bug exists. When a developer fixes a bug, its test starts to "unexpectedly pass" and the run reports it, so the test can be moved into the normal regression suite.
