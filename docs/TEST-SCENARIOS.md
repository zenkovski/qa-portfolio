# Test scenarios — Sauce Demo

Structured scenarios. Automated ones have the same ID in `tests/regression.spec.ts`.
Priority: P1 = must work for the shop to be usable, P2 = important, P3 = nice to have.

## AUTH — Login

| ID | Scenario | Expected | Prio | Automated |
|---|---|---|---|---|
| TC-AUTH-01 | Log in as `standard_user` | Catalog opens | P1 | yes |
| TC-AUTH-02 | Log in as `locked_out_user` | Error says the user is locked out, no access | P1 | yes |
| TC-AUTH-03 | Wrong password | Error "do not match", no access | P1 | yes |
| TC-AUTH-04 | Empty username | Error "Username is required" | P2 | yes |
| TC-AUTH-05 | Empty password | Error "Password is required" | P2 | yes |
| TC-AUTH-06 | Open `/inventory.html` without login | Error, redirected to login | P1 | yes |
| TC-AUTH-07 | Log out from the menu | Login page shown | P2 | yes |
| TC-AUTH-08 | Username with leading/trailing space | Not logged in, or clear message | P3 | no |
| TC-AUTH-09 | Back button after logout | Catalog is not shown again | P2 | no |

## CAT — Catalog

| ID | Scenario | Expected | Prio | Automated |
|---|---|---|---|---|
| TC-CAT-01 | Open catalog | 6 products, 6 different images | P1 | yes |
| TC-CAT-02 | Sort A–Z and Z–A | Order matches sort | P2 | yes |
| TC-CAT-03 | Sort by price both ways | Prices ascending / descending | P2 | yes |
| TC-CAT-04 | Open product detail | Name and price equal the catalog | P2 | yes |
| TC-CAT-05 | Product detail with a wrong id in the URL | No crash, clear message | P3 | no |

## CART — Cart

| ID | Scenario | Expected | Prio | Automated |
|---|---|---|---|---|
| TC-CART-01 | Add all 6 products | Badge shows 6 | P1 | yes |
| TC-CART-02 | Add 2, remove 1 | Badge shows 1 | P1 | yes |
| TC-CART-03 | Open cart after adding one product | Only that product is listed | P1 | yes |
| TC-CART-04 | Reload page with items in cart | Badge and items stay | P2 | yes |
| TC-CART-05 | Open cart empty and click Checkout | Checkout is blocked or clear message | P3 | no |

## CHK — Checkout

| ID | Scenario | Expected | Prio | Automated |
|---|---|---|---|---|
| TC-CHK-01 | Full purchase | "Thank you for your order!" | P1 | yes |
| TC-CHK-02 | Missing first name / last name / postal code | Error naming the missing field, stays on step one | P1 | yes (3 cases) |
| TC-CHK-03 | Overview totals | Total = subtotal + tax | P1 | yes |
| TC-CHK-04 | Very long values (255+ chars) | Handled without layout break | P3 | no |
| TC-CHK-05 | Special characters and diacritics (`Novák`, `Žižka`) | Accepted and shown correctly | P2 | no |
| TC-CHK-06 | Postal code with letters | Accepted or rejected consistently | P3 | no |

## Behaviour per user (bug hunting)

See `reports/BUG-REPORTS.md` (BUG-001 to BUG-015, BUG-API-01 to 03). They are automated in `tests/known-bugs.spec.ts` and the specs above.

## CHK-DATA / CHK-FLOW: data and state in checkout

| ID | Scenario | Expected | Prio | Automated |
|---|---|---|---|---|
| TC-CHK-10 | Czech diacritics, 1-char values, 300-char values, special characters, emoji, markup typed as text | Accepted, overview opens | P2 | yes (6 cases) |
| TC-CHK-20 | Cancel on step 1 | Back in the cart, item kept | P2 | yes |
| TC-CHK-21 | After a finished order | Cart is empty | P1 | yes |
| TC-CHK-22 | Overview content | Chosen product and its price | P1 | yes |
| TC-CHK-23 | Tax | 8% of the item total, rounded to cents | P2 | yes |
| BUG-014 | Name or postal code made of spaces | Error "required" | P2 | yes (bug) |

## A11Y: accessibility

| ID | Scenario | Expected | Prio | Automated |
|---|---|---|---|---|
| TC-A11Y-01 | axe-core WCAG 2.0/2.1 A+AA on login, catalog, cart, checkout step 1 | Zero violations | P2 | yes (4 pages) |
| TC-A11Y-02 | Login with the keyboard only (Tab, type, Enter) | Catalog opens | P2 | yes |
| TC-A11Y-03 | Product images | All have alt text | P2 | yes |
| BUG-013 | axe best-practice rules | No findings | P3 | yes (bug) |

## SEC: basic security

| ID | Scenario | Expected | Prio | Automated |
|---|---|---|---|---|
| BUG-011 | Catalog opened with a hand-made session cookie | Refused | P1 | yes (bug) |
| BUG-012 | Cookie flags | HttpOnly and Secure | P2 | yes (bug) |
| TC-SEC-03 | Open the site over http | Redirect to https | P2 | yes |
| TC-SEC-04 | Script in the login fields | Not executed, not rendered as HTML | P1 | yes |
| TC-SEC-05 | Script and SQL text in checkout fields | Not executed | P1 | yes |
| TC-SEC-06 | Cart and checkout URLs without login | Error, no access | P1 | yes |
| TC-SEC-07 | Open the catalog after logout | Error, no access | P1 | yes |

## VIS and PERF

| ID | Scenario | Expected | Prio | Automated |
|---|---|---|---|---|
| TC-VIS-01 | Same page loaded twice | 0 different pixels (proves the check is stable) | P3 | yes |
| BUG-015 | visual_user header against standard_user | 0 different pixels | P3 | yes (bug) |
| TC-PERF-01 | Login time, 5 runs per account | Median under 1.5 s (except the slow account) | P2 | yes (5 accounts) |
| TC-PERF-02 | Login page load | Under 3 s | P3 | yes |
| BUG-010 | Slow account, median of 5 runs | Under 2 s | P2 | yes (bug) |

## API: Restful-Booker

| ID | Scenario | Expected | Prio | Automated |
|---|---|---|---|---|
| TC-API-01/02 | Health and list | 201 ping; list of ids under 3 s | P1 | yes |
| TC-API-10..12 | Create, read back, field types | Round trip equal; types correct | P1 | yes |
| TC-API-13 | Filter by first name | Booking found | P2 | yes |
| TC-API-14..16 | Update without token, with token, partial | 403; data changed; only one field changed | P1 | yes |
| TC-API-17 | Delete | Gone, later read gives 404 | P1 | yes |
| TC-API-20..22 | Wrong password gives no token; unknown id 404; delete without token 403 | as listed | P1 | yes |
| BUG-API-01..03 | Status codes for bad credentials, bad input, delete | 401, 400, 204 | P2 | yes (bugs) |

## Not covered yet (honest list)

- Real mobile devices (iOS, Android). For native apps I would use Maestro or Appium.
- Load and stress testing (a public site I do not own).
- Manual screen-reader testing (NVDA, VoiceOver). Automated tools cannot find every accessibility problem; the rest needs a person.
- Test data management and a staging environment (the practice app has neither).
