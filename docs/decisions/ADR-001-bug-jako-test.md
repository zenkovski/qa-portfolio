# ADR-001: A known bug is written as a test marked `test.fail()`

**Status:** accepted · **Date:** 9. 10. 2026

## Context

The suite runs against targets I do not own, so I cannot fix the bugs. A red suite that stays red for ever is ignored. A suite that does not mention the bugs hides what it found.

## Decision

Every confirmed bug gets one test with the ID `BUG-xxx`. The test asserts the **correct** behaviour and is marked `test.fail(true, 'BUG-xxx')`. While the bug exists, the test fails as expected and the run is green. When someone fixes the bug, the test passes and Playwright reports an *unexpected pass*, so the test can move to the normal suite.

## Alternatives

| Option | Why not |
|---|---|
| Leave the failing test red | The CI is red for ever, real regressions get lost in the noise |
| Delete the test and keep only the written report | Nobody learns when the bug is fixed, and the evidence can rot |
| `test.skip()` | A skipped test never runs, so it cannot report the fix |

## Consequences

- The site counts these separately ("bug confirmed by a test"), so a green run is not presented as "everything works".
- A test that fails for the wrong reason also looks like an expected failure. Mitigation: every bug test was first run as a normal test and its failure message was read, and the report lists the exact observed values.
