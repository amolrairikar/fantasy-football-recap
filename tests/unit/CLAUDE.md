# AGENTS.md — Unit Test Writing Agent

This file contains instructions for AI agents tasked with writing, running, and fixing unit tests for this codebase.

---

## Objective

Write unit tests that:

1. **Pass** — all tests must succeed when executed.
2. **Cover 100% of lines and branches** — verified via `coverage`.
3. **Pass ruff linting and formatting** — tests must be clean before being considered done.
4. **Are iteratively fixed** — if any test fails, the agent must diagnose and fix it before moving on.

---

## Environment Setup

Before writing or running tests, ensure the environment is ready:

```bash
# Install dependencies
pipenv install --dev

# Confirm tools are available
pipenv run pytest --version
pipenv run ruff --version
pipenv run coverage --version
```

---

## Workflow

Follow this exact loop for every module under test:

```
1. Read source file(s)
2. Write tests
3. Run ruff format → fix all issues
4. Run ruff check → fix all issues
5. Run pytest with coverage
6. If any test fails → diagnose → fix → go to step 3
7. If coverage < 100% → add missing tests → go to step 3
8. Done only when: all tests pass AND coverage is 100% AND ruff is clean
```

Do **not** mark a task complete until all three gates are green.

---

## Commands

### Run all tests with coverage

```bash
pipenv run pytest --cov=<module_or_package> --cov-branch --cov-report=term-missing tests/unit
```

- Replace `<module_or_package>` with the name of the module being tested (e.g. `src/myapp`).
- `--cov-branch` enables branch coverage — **this is required**.
- `--cov-report=term-missing` prints uncovered lines so the agent knows exactly what to target.

### Check coverage threshold

```bash
pipenv run pytest --cov=<module_or_package> --cov-branch --cov-fail-under=100 tests/unit
```

This will exit non-zero if coverage is below 100%. Treat a non-zero exit as a failure.

### Format with ruff

```bash
pipenv run ruff format tests/unit
```

Run this **before** linting. Ruff format is the formatter; ruff check is the linter.

### Lint with ruff

```bash
pipenv run ruff check tests/unit
```

Fix automatically where possible:

```bash
pipenv run ruff check --fix tests/unit
```

After auto-fix, re-run `ruff check` to confirm no remaining issues. If issues remain, fix them manually.

---

## Test File Conventions

| Convention | Rule |
|---|---|
| Location | `tests/unit/` directory at the project root |
| Naming | `test_<source_module_name>.py` |
| Function names | `test_<what_is_being_tested>` |
| Class names (if grouped) | `Test<ClassName>` |
| One file per source module | Do not mix tests for different modules in one file |
| No `__init__.py` needed | Unless the project already uses it in `tests/unit/` |
| Imports | No sys.path updates! Always use absolute imports |

---

## Writing Tests

### Cover every line and branch

After the first test run, read the "missing" column from the coverage report. Each listed line or branch **must** be covered by a dedicated test case.

Common patterns for branch coverage:

```python
# Source has: if condition:
# You need tests where condition is True AND False

# Source has: for item in collection:
# You need a test with an empty collection AND a non-empty one

# Source has: x = value or default
# You need tests where value is truthy AND falsy

# Source has: try/except:
# You need tests that trigger the exception AND tests that don't
```

### Mocking external dependencies

Use `unittest.mock` to isolate units from I/O, network, and filesystem:

```python
from unittest.mock import patch, MagicMock

def test_calls_external_service(mocker):
    with patch("myapp.module.requests.get") as mock_get:
        mock_get.return_value.json.return_value = {"status": "ok"}
        result = my_function()
    assert result == "ok"
```

Never let tests make real network calls, write to disk, or mutate shared state.

### Parametrize to cover branches efficiently

```python
import pytest

@pytest.mark.parametrize("input,expected", [
    (0, "zero"),
    (1, "positive"),
    (-1, "negative"),
])
def test_classify(input, expected):
    assert classify(input) == expected
```

### Testing exceptions

```python
def test_raises_on_invalid_input():
    with pytest.raises(ValueError, match="must be positive"):
        my_function(-1)
```

---

## Ruff Compliance Rules

Tests must follow the same ruff config as the rest of the project (see `pyproject.toml` or `ruff.toml`).

Key rules that commonly trip up generated tests:

- **No unused imports** — remove any `import` that isn't referenced.
- **No bare `except:`** — always specify the exception type.
- **No `assert` with a tuple** — `assert (x == 1, "msg")` is always truthy; use `assert x == 1, "msg"`.
- **Consistent quotes** — follow the project's quote style (single vs double).
- **Line length** — respect `line-length` from config (default 88).
- **No shadowing builtins** — don't name variables `list`, `type`, `id`, etc.

Always run `ruff format` before `ruff check`. Format first, then lint.

---

## Iterative Fix Protocol

When a test fails, follow this diagnosis loop:

```
1. Read the full pytest failure output — do not guess.
2. Identify the failure type:
   a. AssertionError → the expected value is wrong; re-read the source logic.
   b. ImportError / ModuleNotFoundError → wrong import path; check project structure.
   c. AttributeError / TypeError → wrong mock setup or wrong API usage.
   d. Exception from source code → the test triggered a real error; decide if it's
      expected behavior (add pytest.raises) or a test setup problem.
3. Fix only the failing test — do not rewrite passing tests.
4. Re-run the full suite after each fix.
5. Repeat until exit code is 0.
```

Never suppress failures with `pytest.mark.skip` or `pytest.mark.xfail` unless the source code itself is known-broken and skipping is explicitly approved.

---

## Coverage Gaps Protocol

When coverage is below 100%, follow this loop:

```
1. Read the "missing" lines from the coverage report.
2. Open the source file and read those exact lines in context.
3. Determine what input or state is required to reach those lines.
4. Write a new test case that exercises that path.
5. Re-run coverage.
6. Repeat until --cov-fail-under=100 passes.
```

Acceptable exceptions (must be explicitly excluded in `pyproject.toml`, not silently ignored):

- `if TYPE_CHECKING:` blocks
- Abstract method stubs with only `...` or `raise NotImplementedError`
- `__main__` entry points (can be excluded via `# pragma: no cover`)

To add a pragma exclusion (use sparingly):

```python
if __name__ == "__main__":  # pragma: no cover
    main()
```

---

## Definition of Done

A module's tests are complete when **all** of the following are true:

- [ ] `ruff format tests/unit` exits 0 with no changes
- [ ] `ruff check tests/unit` exits 0 with no warnings
- [ ] `pytest tests/unit` exits 0 (all tests pass)
- [ ] `pytest --cov=<module> --cov-branch --cov-fail-under=100 tests/unit` exits 0

Do not proceed to the next module until the current one satisfies all four checks.