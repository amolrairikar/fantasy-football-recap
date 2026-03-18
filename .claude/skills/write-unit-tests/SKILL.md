---
name: write-unit-tests
description: Write unit tests following CLAUDE.md — 100% branch coverage, ruff clean, all passing. Use when asked to write, generate, or add tests.
---

# Write Unit Tests

## Context
Read `tests/unit/CLAUDE.md` in full before writing any tests. It defines all rules for
coverage, ruff compliance, mocking, and the iterative fix loop.

## Steps

1. **Identify the target** — use $ARGUMENTS if provided, otherwise ask.
2. **Read the source file** — understand every function, branch, and edge case.
3. **Write tests** — create `tests/unit/test_<module>.py` following AGENTS.md conventions.
4. **Format**: `ruff format tests/unit`
5. **Lint**: `ruff check --fix tests/unit` then re-run to confirm clean.
6. **Run with coverage**:
```bash
   pytest --cov=<module> --cov-branch --cov-report=term-missing --cov-fail-under=100 tests/
```
7. **Iterate** — fix failures and coverage gaps per the protocols in AGENTS.md.
8. **Done** only when all four gates in AGENTS.md's "Definition of Done" are green.
```
