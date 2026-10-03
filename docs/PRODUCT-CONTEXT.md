# Product context for AI tools — Sauce Demo

> This file is written so that an AI assistant (Claude, ChatGPT, Copilot) can read it first and then
> help write or review tests without guessing how the product works. Keep it up to date.

## What the product is

Sauce Demo (https://www.saucedemo.com) is a small web shop made by Sauce Labs **for practising test
automation**. A user logs in, browses six products, fills a cart and completes a checkout.
It is not a real shop and no payment is taken.

## Users (all use the password `secret_sauce`, published on the login page)

| User | Purpose |
|---|---|
| `standard_user` | Normal behaviour. Reference for what is correct |
| `locked_out_user` | Login is blocked on purpose |
| `problem_user` | Contains functional and image bugs |
| `error_user` | Shows errors and loses input |
| `visual_user` | Contains visual and price differences |
| `performance_glitch_user` | Slow responses |

## Pages and flow

1. `/` Login. Fields: username, password. Error box `[data-test="error"]`.
2. `/inventory.html` Catalog. 6 products, sort menu (A–Z, Z–A, price low–high, price high–low),
   cart icon with badge, burger menu (logout).
3. `/inventory-item.html?id=N` Product detail.
4. `/cart.html` Cart. Remove button, Continue shopping, Checkout.
5. `/checkout-step-one.html` Customer information: first name, last name, postal code (all required).
6. `/checkout-step-two.html` Overview: items, subtotal, tax, total. Finish button.
7. `/checkout-complete.html` Confirmation: "Thank you for your order!".

## Business rules to test

- Login needs both fields. Wrong credentials and a locked user give a clear error.
- Pages other than login are not reachable without logging in.
- Cart badge equals the number of added items. The cart is kept after a page reload.
- Checkout needs first name, last name and postal code. Total = subtotal + tax.
- Prices (standard): backpack 29.99, bike light 9.99, bolt T-shirt 15.99, fleece jacket 49.99,
  onesie 7.99, red T-shirt 15.99.

## Stable selectors

The app uses `data-test` attributes. Prefer them: `username`, `password`, `login-button`, `error`,
`inventory-item`, `inventory-item-name`, `inventory-item-price`, `product-sort-container`,
`add-to-cart-<product-id>`, `remove-<product-id>`, `shopping-cart-link`, `shopping-cart-badge`,
`checkout`, `firstName`, `lastName`, `postalCode`, `continue`, `finish`, `complete-header`.

## Known risks

- Several accounts are broken on purpose, so a failing test is not always a test problem.
- Test data does not persist on the server. State lives in the browser.
- Real products of a customer (video relay platform with web, admin, iOS and Android) have the same
  kinds of risks: flows that cross pages, forms with required fields, different behaviour per user.

## How to ask an AI for help here

- "Read `docs/PRODUCT-CONTEXT.md` and `docs/TEST-SCENARIOS.md`, then write a Playwright test for TC-CHK-03."
- "Here is a failing test and its trace. Is it a product bug or a test bug?"
- "List edge cases for the checkout form that are not yet in TEST-SCENARIOS.md."
