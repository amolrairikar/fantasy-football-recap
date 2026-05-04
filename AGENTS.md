# Agent Guidelines
Follow the instructions below to assist with development.

## Project Stack
- AWS infrastructure managed via Terraform
- FastAPI backend (Python 3.13)
- React frontend

# Appendix

## Running Tests

### Unit Tests

Install dev dependencies first:

```bash
pipenv install --dev
```

Run the full unit test suite:

```bash
pipenv run pytest tests/unit
```

Run with branch coverage for a specific module:

```bash
pipenv run pytest --cov=<module> --cov-branch --cov-report=term-missing tests/unit
```

Replace `<module>` with the module name (e.g. `espn_client`, `handler`, `transformer`).

Enforce the 100% coverage threshold:

```bash
pipenv run pytest --cov=<module> --cov-branch --cov-fail-under=100 tests/unit
```