# Incident: the login-delay test failed in CI but not on my computer

**Date:** 9. 10. 2026 · **Found by:** the first GitHub Actions run · **Cause:** an assumption about the target

## Symptom

`BUG-010` ("login of `performance_glitch_user` takes about 5 seconds") passed on my computer for days. On the first CI run it failed: the test is marked `test.fail()`, so "the login was fast" counted as an *unexpected pass*.

## Investigation

1. Read the timings in the CI log: three single attempts took 0.23 to 0.38 s, the rest about 5.4 s.
2. The delay of this account is **not constant**. My single-run test treated one measurement as the truth.

## Fix

- The test now measures **5 logins and judges the median**. The median is stable when most runs are slow.
- The test can still show as "flaky" in the report. I left it that way on purpose: hiding it with more retries would hide the fact that the target is not deterministic.
- README and the bug report say that the delay is intermittent.

## What I would do differently

- Measure a time-based behaviour more than once before turning it into a pass/fail rule.
- Run the first CI as early as possible. A suite that is only run on one machine has one set of assumptions.
