# Bug reports — Sauce Demo (https://www.saucedemo.com)

Found by running the automated suite in `tests/known-bugs.spec.ts` plus manual exploration.
Every bug below was reproduced on **desktop Chrome and a Pixel 7 emulation**.
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

**Expected:** under 2 seconds (`standard_user`: about 0.4 s in my runs).
**Actual:** about **5.5 seconds** (5511 ms on desktop, 5497 ms on the mobile emulation). The sort menu is also not usable right after the page appears.
**Test:** `BUG-010`

---

## How these tests stay useful

Each bug test is marked `test.fail()`. The suite stays green while the bug exists. When a developer fixes a bug, its test starts to "unexpectedly pass" and the run reports it, so the test can be moved into the normal regression suite.
