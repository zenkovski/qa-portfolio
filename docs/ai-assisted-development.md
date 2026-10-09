# AI-assisted development: who did what, and where the AI was wrong

This project is built with Claude Code. It does not pretend that a human typed the code. What counts is **what was checked, by whom, and what the checks found.**

## Who did what

| Part | Done by | How it was checked |
|---|---|---|
| Exploration of the targets, product description, first scenarios | Claude Code | I read the scenarios and set the priorities by risk |
| Test code (Sauce Demo, API, accessibility, visual, security, performance) | Claude Code, directed by me | Every test ran against the live target. A failure was classified: product bug or test bug. New tests also ran against the broken accounts |
| Test code for the RAG demo, data checks, ADRs, incident notes, this file (9. 10. 2026) | Claude Code (Sonnet 5.5) | Run against the live demo in 4 browsers and the API project; the bug reports contain the measured values |
| Decisions: what is a bug, how severe, what is out of scope | me | – |

**What was not done:** the material added on 9. 10. 2026 was **not read line by line by me before it was published**. "Verified" in the documents means "a test or a script ran", not "a human reviewed it". The ADRs and the incident notes are the AI's text from the facts of the run.

## Where the AI was wrong

| When | What happened | How it showed | What changed |
|---|---|---|---|
| 9. 10. | A test read the product list before the page had drawn it (WebKit only) | failed 4 of 10 times in one browser | [incident](incidents/2026-10-09-webkit-test-cetl-driv.md), wait for the thing the test reads |
| 9. 10. | A single-run test assumed the slow login is always slow | failed on the first CI run | [incident](incidents/2026-10-09-bug-010-obcas-rychly.md), median of 5 |
| 9. 10. | The first RAG data test used the number in `hits` as the chunk `id`. It is the position in the list, the `id` is a text like `ZP § 56 odst. 1`. The test "found" about 410 broken sources that did not exist | the failure list was suspiciously long | data model read again, test rewritten and checked against the stored data |
| 9. 10. | The first RAG tests waited for the preset buttons. On a phone they are hidden by design, so all phone tests timed out | every phone test failed with the same timeout | wait for the categories (visible on both layouts); tests that need the buttons skip on a phone with the reason |
| 9. 10. | The first lint attempt failed because of a peer-dependency conflict. The type check in the same step found 14 real errors in my Page Objects | `npm i` error, then `tsc` output | [ADR-003](decisions/ADR-003-typecheck-bez-eslint.md) |

## What I can explain without the AI

If I am asked about this project, I should be able to say: why a bug is a `test.fail()` test and what "unexpected pass" means ([ADR-001](decisions/ADR-001-bug-jako-test.md)); why a failure in one browser is first a hint about the test; why the RAG tests never use the question form ([ADR-002](decisions/ADR-002-bez-modelu-v-testech-rag.md)); the difference between the median and a single measurement. If I cannot explain a claim, it should be removed from the presentation.
