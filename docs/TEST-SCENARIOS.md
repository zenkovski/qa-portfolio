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

See `reports/BUG-REPORTS.md` (BUG-001 to BUG-010). They are automated in `tests/known-bugs.spec.ts`.

## Not covered yet (honest list)

- Accessibility (keyboard navigation, screen reader labels).
- Visual regression (screenshots compared to a baseline).
- Cross-browser (only Chromium desktop and Pixel 7 emulation).
- Real mobile devices (iOS, Android). For native apps I would use Maestro or Appium.
