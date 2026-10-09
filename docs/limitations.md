# Limitations

What this suite does not do, and what I did not measure. Written so that nothing here surprises a reader.

## What the results do not prove

- **A green run is not proof of quality.** 117 test cases show that the things I thought of work today. They say nothing about what I did not think of.
- **Public targets change without a commit here.** Sauce Demo, Restful-Booker and the RAG demo can change or be offline. That is why the CI runs every Monday and why a short outage shows as "flaky", not as a silent pass.
- **Most Sauce Demo "bugs" are placed there on purpose.** The value is the method, not the discovery.
- **The RAG demo is my own project.** The findings on it (BUG-RAG-01 to 04) are real, but I tested my own work, so I know where to look. A tester who did not build it would probably find other things. I did not change the demo to hide or fix anything.

## What is not tested

| Area | Why not |
|---|---|
| Is a RAG answer legally correct? | A QA test from outside cannot judge law. The test checks the structure of the data (every citation points to a delivered source, counts match). Answer quality is measured in the [rag-demo](https://github.com/zenkovski/rag-demo) project with a labelled question set |
| Behaviour of the live model | Every valid request to `/api/ask` costs money from the owner's key. The API tests send only requests that the server must reject before the model |
| Rate limit (10 questions per IP per day) | A test for it would need valid requests, so it would spend the budget |
| Real phones, native apps | Only an emulated Pixel 7. For native apps I would use Maestro or Appium |
| Load and stress | The targets are public sites I do not own |
| Screen readers | axe-core finds roughly a third of accessibility problems. The rest needs a person with NVDA or VoiceOver |
| Visual regression with stored baselines | Screenshots differ between operating systems. I compare two screenshots from the same run instead |

## Weak spots of the suite itself

- **No linter.** The code is type-checked (`npm run typecheck`, runs in CI), but there is no ESLint. `typescript-eslint` does not support TypeScript 7 yet (its peer range ends below 6.1). I preferred the newer compiler to a linter that forces an old one. See [ADR-003](decisions/ADR-003-typecheck-bez-eslint.md).
- **Tests use the live internet.** One retry per test hides a short outage. A second consecutive failure is reported.
- **Performance numbers depend on the network of the machine that ran them.** The site shows the numbers of the last local run, not a benchmark.
- **The accessibility test of the RAG demo runs in Chromium only.** In Firefox and WebKit, axe-core needs more than 30 s for the 2475 points of the map. The rules do not depend on the browser.
- **The RAG demo tests depend on its page structure** (`#chips`, `#cats`, `#log`, `.cite`). A redesign breaks them. They would break in a visible way, not silently.
- **Not every test was run against a deliberately broken target.** I did this for the UI tests (broken accounts of Sauce Demo). For the RAG data checks I did not break the data to see them fail, so a bug in a data check itself is possible.
