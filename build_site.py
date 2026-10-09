# -*- coding: utf-8 -*-
"""Builds the static web page into site/ from site_template.html + the results of the last test run.

Run order:   npx playwright test     (makes reports/results.json, reports/perf.json, evidence/)
             python build_site.py    (makes site/)
Deploy the folder site/ (see README).
"""
import json, re, shutil, zipfile
from datetime import datetime
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).parent
SITE = ROOT / "site"
if SITE.exists():
    shutil.rmtree(SITE)
(SITE / "img").mkdir(parents=True)

# ---------- evidence: PNG -> WebP (only desktop Chrome and phone; other browsers stay local) ----------
for p in sorted((ROOT / "evidence").glob("*.png")):
    if "firefox" in p.stem or "webkit" in p.stem:
        continue
    Image.open(p).convert("RGB").save(SITE / "img" / (p.stem + ".webp"), "WEBP", quality=80)

# ---------- Playwright HTML report ----------
shutil.copytree(ROOT / "reports" / "html", SITE / "report")

# ---------- results of the last run ----------
res = json.loads((ROOT / "reports" / "results.json").read_text(encoding="utf-8"))
perf = json.loads((ROOT / "reports" / "perf.json").read_text(encoding="utf-8"))

specs = []


def walk(suite):
    for sp in suite.get("specs", []):
        specs.append(sp)
    for s in suite.get("suites", []):
        walk(s)


walk({"suites": res["suites"]})

KINDS = ["rag", "smoke", "perf", "a11y", "security", "visual", "api", "regression"]
by_title = {}
runs = 0
counts = {"passed": 0, "expected": 0, "flaky": 0, "failed": 0}
for sp in specs:
    title = sp["title"]
    m = re.match(r"^((?:TC|BUG)-[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*)\s+(.*)$", title)
    tid, name = (m.group(1), m.group(2)) if m else ("", title)
    tags = set(sp.get("tags", []))
    kind = next((k for k in KINDS if k in tags), "regression")
    entry = by_title.setdefault(title, {"id": tid, "title": name, "kind": kind, "bug": tid.startswith("BUG"), "s": {}})
    for t in sp["tests"]:
        st = t["status"]
        if st == "skipped":
            continue
        runs += 1
        if st == "flaky":
            cell = "flaky"
            counts["flaky"] += 1
        elif st == "unexpected":
            cell = "bug"
            counts["failed"] += 1
        elif t["expectedStatus"] == "failed":
            cell = "bug"
            counts["expected"] += 1
        else:
            cell = "ok"
            counts["passed"] += 1
        entry["s"][t["projectName"]] = cell

tests = sorted(by_title.values(), key=lambda e: (e["bug"], e["id"]))
by_kind = {}
for e in tests:
    by_kind[e["kind"]] = by_kind.get(e["kind"], 0) + 1
by_kind["ui"] = sum(1 for e in tests if e["kind"] in ("smoke", "regression") and not e["bug"])
by_kind["bug"] = sum(1 for e in tests if e["bug"])

# ---------- bugs (text is English, as bug reports usually are) ----------
BUGS = [
    dict(id="BUG-001", type="ui", sev="Medium", where="Account problem_user · Catalog", title="All 6 products show the same wrong image (a dog photo)",
         steps=["Open saucedemo.com and log in as problem_user / secret_sauce.", "Look at the product images."],
         exp="Each of the 6 products has its own image.", act="All 6 use the same dog photo (1 unique image source).", test="BUG-001",
         ev=[("BUG-001-desktop-chrome", "desktop"), ("BUG-001-mobile-pixel", "phone")]),
    dict(id="BUG-002", type="ui", sev="Medium", where="Account problem_user · Catalog", title="Sorting has no effect",
         steps=["Log in as problem_user.", "Choose “Name (Z to A)”, then “Price (low to high)”."],
         exp="The list is reordered.", act="The order does not change. After “Price (low to high)”: $29.99, $9.99, $15.99, $49.99, $7.99, $15.99.", test="BUG-002",
         ev=[("BUG-002-desktop-chrome", "desktop"), ("BUG-002-mobile-pixel", "phone")]),
    dict(id="BUG-003", type="ui", sev="High", where="Account problem_user · Cart", title="Only 3 of 6 products can be added to the cart",
         steps=["Log in as problem_user.", "Click “Add to cart” on all 6 products."],
         exp="Cart badge shows 6, all 6 buttons change to “Remove”.", act="Badge shows 3 and only 3 buttons change. The other clicks do nothing and no message is shown.", test="BUG-003",
         ev=[("BUG-003-desktop-chrome", "desktop"), ("BUG-003-mobile-pixel", "phone")]),
    dict(id="BUG-004", type="ui", sev="High", where="Account problem_user · Checkout", title="Typing a last name overwrites the first name field",
         steps=["Log in as problem_user, add a product, open the cart, click Checkout.", "Type “Jan” in First Name, then “Novák” in Last Name."],
         exp="First Name = Jan, Last Name = Novák.", act="First Name becomes “Novák”, Last Name stays empty. Continue fails with “Last Name is required”, so no order can be finished.", test="BUG-004",
         ev=[("BUG-004-desktop-chrome", "desktop"), ("BUG-004-mobile-pixel", "phone")]),
    dict(id="BUG-005", type="ui", sev="Medium", where="Account error_user · Catalog", title="Sorting shows an error alert and does not sort",
         steps=["Log in as error_user.", "Choose any sort option."],
         exp="The list is sorted, no error.", act="An alert appears: “Sorting is broken! This error has been reported to Backtrace.” The list is not sorted.", test="BUG-005",
         ev=[("BUG-005-desktop-chrome", "desktop"), ("BUG-005-mobile-pixel", "phone")]),
    dict(id="BUG-006", type="ui", sev="High", where="Account error_user · Cart", title="Only 3 of 6 products can be added to the cart",
         steps=["Log in as error_user.", "Click “Add to cart” on all 6 products."],
         exp="Cart badge shows 6.", act="Cart badge shows 3.", test="BUG-006",
         ev=[("BUG-006-desktop-chrome", "desktop"), ("BUG-006-mobile-pixel", "phone")]),
    dict(id="BUG-007", type="ui", sev="High", where="Account error_user · Checkout", title="Last name is lost and checkout continues without it",
         steps=["Log in as error_user, add a product, open the cart, click Checkout.", "Fill First Name “Jan”, Last Name “Novák”, Postal Code “11000”, click Continue."],
         exp="The last name is kept. If it were empty, an error would block the step.",
         act="The Last Name field is empty after typing, yet Continue goes to the overview with no validation error. Two defects: input is lost, and required-field validation is bypassed.", test="BUG-007",
         ev=[("BUG-007-desktop-chrome", "desktop"), ("BUG-007-mobile-pixel", "phone")]),
    dict(id="BUG-008", type="ui", sev="High", where="Account visual_user · Catalog", title="Prices do not match the price list",
         steps=["Log in as visual_user.", "Read the prices on the catalog page."],
         exp="$29.99, $9.99, $15.99, $49.99, $7.99, $15.99 (as for standard_user).",
         act="Different prices are shown, for example $10.68, $57.46, $63.74, $70.15 in the first rows. The values change from load to load. Sorting by price is not in ascending order.", test="BUG-008",
         ev=[("BUG-008-desktop-chrome", "desktop"), ("BUG-008-mobile-pixel", "phone")]),
    dict(id="BUG-009", type="ui", sev="Low", where="Account visual_user · Catalog", title="First product shows the wrong image (a dog photo)",
         steps=["Log in as visual_user.", "Look at the first product."],
         exp="The backpack image.", act="A dog photo is shown for the first product.", test="BUG-009",
         ev=[("BUG-015-desktop-chrome", "visual_user catalog")]),
    dict(id="BUG-010", type="perf", sev="Medium", where="Account performance_glitch_user · Login", title="Login takes about 5 seconds",
         steps=["Open the login page, enter performance_glitch_user / secret_sauce, click Login.", "Measure the time until the catalog loads."],
         exp="Under 2 seconds (standard_user: well under 1 s).", act="About 5 seconds in most runs (median of 5 runs in the chart on this page). The delay is not constant: on the first GitHub Actions run, three attempts took only 0.23 to 0.38 s, the rest about 5.4 s. That is why the test judges the median of 5 runs and is the one that can show as flaky.", test="BUG-010 (tests/performance.spec.ts)", ev=[]),
    dict(id="BUG-011", type="security", sev="High", where="All accounts · Session", title="A made-up session cookie opens the catalog without a login",
         steps=["Open saucedemo.com in a fresh browser profile (not logged in).", "In developer tools set a cookie: name session-username, value standard_user, path /.", "Open /inventory.html."],
         exp="Access is refused, because no login happened.", act="The catalog opens and the shop works as standard_user. The “session” is just a user name in a cookie anyone can type.",
         note="Sauce Demo is a practice shop with public passwords, so this is a design weakness, not a real leak. In a real product it would be a top-priority finding.",
         test="BUG-011 (tests/security.spec.ts)", ev=[("BUG-011-desktop-chrome", "catalog opened with a typed cookie")]),
    dict(id="BUG-012", type="security", sev="Medium", where="All accounts · Session", title="The session cookie has no HttpOnly and no Secure flag",
         steps=["Log in as standard_user.", "Open developer tools → Application → Cookies → session-username."],
         exp="HttpOnly and Secure are set, so scripts cannot read the cookie and it is never sent over plain http.",
         act="Both are false. Together with BUG-011, a script on the page can read and reuse the session value.", test="BUG-012 (tests/security.spec.ts)", ev=[]),
    dict(id="BUG-013", type="a11y", sev="Low", where="All pages · Accessibility", title="No main heading and content outside landmarks",
         steps=["Open the login page and run an axe-core scan."],
         exp="No findings.", act="Two findings: page-has-heading-one (no h1) and region (content not inside landmarks such as main). The catalog page has the missing h1 too.",
         note="Good news: zero violations of the WCAG A and AA rules on login, catalog, cart and checkout; all product images have alt text; login works with the keyboard only.",
         test="BUG-013 (tests/a11y.spec.ts)", ev=[]),
    dict(id="BUG-014", type="ui", sev="Medium", where="Account standard_user · Checkout", title="Checkout accepts fields that contain only spaces",
         steps=["Log in as standard_user, add a product, open the cart, click Checkout.", "Type five spaces in First Name, “Novák” in Last Name, “11000” in Postal Code. Click Continue."],
         exp="Error “First Name is required” (same for Postal Code).", act="The overview opens and the order can be finished. The required check only tests for an empty field, not for blank text.",
         test="BUG-014, BUG-014b (tests/boundary.spec.ts)", ev=[("BUG-014-desktop-chrome", "overview opened with a blank name")]),
    dict(id="BUG-015", type="visual", sev="Low", where="Account visual_user · Catalog", title="The cart icon is moved out of its place in the header",
         steps=["Log in as visual_user, then as standard_user. Compare the header of the catalog."],
         exp="The cart icon sits at the top right, as for standard_user.",
         act="The cart icon is displaced down and to the left, above the sort menu, and the menu icon is drawn slightly differently. A pixel comparison of the header strip finds 344 different pixels at 1280×800, the same number on every run, so the defect is deterministic.",
         note="Easy to miss by eye and impossible to catch with a text locator, since the element is still there. The comparison is done inside one run (no stored baseline image), so it works on any computer.",
         test="BUG-015 (tests/visual.spec.ts)", ev=[("BUG-015-desktop-chrome", "visual_user catalog"), ("BUG-015-desktop-chrome-diff", "top: standard_user · middle: visual_user · bottom: difference (red = changed pixels)")]),
    dict(id="BUG-API-01", type="api", sev="Medium", where="Restful-Booker · POST /auth", title="Wrong password answers HTTP 200",
         steps=["POST /auth with {\"username\":\"admin\",\"password\":\"wrong\"}."],
         exp="401 Unauthorized.", act="200 OK with the body {\"reason\":\"Bad credentials\"}. A client that checks only the status code treats the login as successful. (There is no token in the body, see TC-API-20.)",
         test="BUG-API-01 (tests/api/booker.api.spec.ts)", ev=[]),
    dict(id="BUG-API-02", type="api", sev="Medium", where="Restful-Booker · POST /booking", title="Missing required fields answer HTTP 500",
         steps=["POST /booking with only {\"firstname\":\"QA-Lukas\"}."],
         exp="400 Bad Request naming the missing fields.", act="500 Internal Server Error with a plain text body. Bad input from a client is reported as a server crash.",
         test="BUG-API-02 (tests/api/booker.api.spec.ts)", ev=[]),
    dict(id="BUG-API-03", type="api", sev="Low", where="Restful-Booker · DELETE /booking/{id}", title="A successful delete answers 201 Created",
         steps=["Create a booking, then DELETE /booking/{id} with a valid token."],
         exp="204 No Content (or 200 OK).", act="201 Created, a status that means “something was created”. The delete itself works (a later GET gives 404, see TC-API-17).",
         test="BUG-API-03 (tests/api/booker.api.spec.ts)", ev=[]),
    dict(id="BUG-RAG-01", type="rag", sev="Low", where="RAG demo (my own project) · Every page load", title="A script request fails with 404 on every page load",
         steps=["Open https://lukas-rag.vercel.app with the developer tools open, tab Network."],
         exp="No failed request and no console error.", act="GET /_vercel/insights/script.js answers 404 and the console shows an error on every load. The page includes the Vercel Analytics tag, but the feature is not switched on for the project.",
         test="BUG-RAG-01 (tests/rag/rag.ui.spec.ts)", ev=[]),
    dict(id="BUG-RAG-02", type="rag", sev="Medium", where="RAG demo · Accessibility", title="Low contrast, and icon-only controls without a name on a phone",
         steps=["Open the page and run an axe-core scan (WCAG 2.0/2.1 A and AA) at 1280×800 and at Pixel 7 size."],
         exp="No violations.", act="Desktop: color-contrast (serious) on 15 elements, grey #4e6460 on #040a0b has a ratio of 3.14 (minimum 4.5). Phone: color-contrast x1, button-name (critical) x2 and link-name (serious) x6: buttons and links that show only an icon have their text hidden, so a screen reader announces nothing.",
         note="Desktop and phone layouts have different findings, so a scan at one size is not enough.", test="BUG-RAG-02 (tests/rag/rag.ui.spec.ts)", ev=[]),
    dict(id="BUG-RAG-03", type="rag", sev="Low", where="RAG demo · Response headers", title="No Content-Security-Policy, X-Content-Type-Options or frame protection",
         steps=["Request / and read the response headers."],
         exp="Content-Security-Policy, X-Content-Type-Options: nosniff and X-Frame-Options (or frame-ancestors) are set.", act="Only Strict-Transport-Security is set. The page can be framed by another site, and nothing limits where scripts may load from.",
         note="The page shows no private data, so the impact is small. It matters because the page has a form that calls a paid API.", test="BUG-RAG-03 (tests/rag/rag.ui.spec.ts)", ev=[]),
    dict(id="BUG-RAG-04", type="rag", sev="Low", where="RAG demo · Third-party scripts", title="Two third-party scripts load without a Subresource Integrity hash",
         steps=["Read the script tags of /."],
         exp="Every script from another domain has an integrity attribute.", act="unpkg.com (Phosphor icons) and cdnjs.cloudflare.com (d3) are loaded without one. If a CDN served a changed file, the page would run it.",
         test="BUG-RAG-04 (tests/rag/rag.ui.spec.ts)", ev=[]),
]
for b in BUGS:
    b.setdefault("note", "")
    b["ev"] = [(f, c) for f, c in b["ev"] if (SITE / "img" / (f + ".webp")).exists()]

when = datetime.fromisoformat(res["stats"]["startTime"].replace("Z", "+00:00")).astimezone().strftime("%d. %m. %Y %H:%M")
stats = dict(
    cases=len(tests), runs=runs, bugs=len(BUGS), browsers="4+API", minutes=round(res["stats"]["duration"] / 60000, 1),
    when=when, passed=counts["passed"], expected=counts["expected"], flaky=counts["flaky"], failed=counts["failed"], byKind=by_kind,
)

html = (ROOT / "site_template.html").read_text(encoding="utf-8")
for tok, data in [("{{TESTS_JSON}}", tests), ("{{BUGS_JSON}}", BUGS), ("{{PERF_JSON}}", perf), ("{{STATS_JSON}}", stats)]:
    html = html.replace(tok, json.dumps(data, ensure_ascii=False))
(SITE / "index.html").write_text(html, encoding="utf-8")
(SITE / "vercel.json").write_text(json.dumps({"cleanUrls": True}), encoding="utf-8")

# ---------- zip of the project ----------
with zipfile.ZipFile(SITE / "qa-portfolio.zip", "w", zipfile.ZIP_DEFLATED) as z:
    for rel in ["README.md", "package.json", "package-lock.json", "playwright.config.ts", "tsconfig.json", ".gitignore", "build_site.py", "site_template.html"]:
        z.write(ROOT / rel, rel)
    for folder in ["tests", "docs", ".github", "evidence"]:
        for f in (ROOT / folder).rglob("*"):
            if f.is_file() and not ("firefox" in f.name or "webkit" in f.name):
                z.write(f, f.relative_to(ROOT).as_posix())
    z.write(ROOT / "reports" / "BUG-REPORTS.md", "reports/BUG-REPORTS.md")

print("site/ ready:", stats)
