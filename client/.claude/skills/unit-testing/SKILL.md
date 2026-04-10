---
name: unit-testing
description: Automatically generate unit tests for code being developed. Use this skill whenever writing new code, modifying existing functions, or completing a feature — to ensure test coverage is created alongside the implementation.
---

## Unit Testing Skill

This skill generates unit tests for code you are developing. It activates automatically when you write or modify code, and can also be invoked explicitly.

### When to Trigger

- After writing or modifying a Python module, class, or function
- When the user asks for tests or says "test this"
- After completing a feature or bugfix (before commit)
- When reviewing code that lacks test coverage

### Test Framework & Conventions

- **Framework:** `pytest` (with `pytest-asyncio` for async code)
- **Mocking:** `unittest.mock` (prefer `pytest-mock` fixture when available)
- **Test location:** Tests live in `tests/unit/` and `tests/integration/` at the repo root
  - Source: `core/tools/calculator.py` → Test: `tests/unit/test_calculator.py`
  - Source: `agents/ic_memo/agent.py` → Test: `tests/integration/test_deals_workflow.py`
  - Source: `core/middleware/audit_logger.py` → Test: `tests/unit/test_audit_logger.py`
- **File naming:** Always prefix test files with `test_`
- **Test naming:** `test_<function_name>_<scenario>` (e.g., `test_validate_input_missing_field`)

### Test Structure

Each test file should follow this structure:

```python
"""Tests for <module_path>."""

import pytest
# imports ...

class TestClassName:
    """Tests for ClassName."""

    def test_method_happy_path(self):
        ...

    def test_method_edge_case(self):
        ...

    def test_method_error_handling(self):
        ...
```

- Group related tests in classes named `Test<ClassName>` or `Test<FunctionName>`
- Use `pytest.fixture` for shared setup — define fixtures in the test file or in `tests/conftest.py` for cross-module fixtures
- Use `pytest.mark.parametrize` when testing multiple input/output combinations
- Use `pytest.raises` for expected exceptions

### What to Test

For each function/method, generate tests covering:

1. **Happy path:** Normal inputs produce expected outputs
2. **Edge cases:** Empty inputs, boundary values, None/null, large inputs
3. **Error cases:** Invalid inputs raise appropriate exceptions
4. **Return types:** Verify the shape/type of returned data (especially for Pydantic models)

### Project-Specific Patterns

Since this is a FastAPI + LangGraph + Celery project, follow these patterns:

#### FastAPI Endpoints (Integration Tests)
```python
# tests/integration/test_api_lifecycle.py
# Use the shared fixtures from tests/conftest.py
import pytest

@pytest.mark.asyncio
async def test_endpoint(client):
    response = await client.post(
        "/agents/echo/run",
        json={"message": "hello"},
        headers={"Authorization": "dev-token"},
    )
    assert response.status_code == 202
```

#### Celery Tasks (Integration Tests)
```python
# Integration tests use celery_app.conf.update(task_always_eager=True) from conftest.py
# This runs tasks synchronously without needing a real Celery worker
```

#### LangGraph Nodes (Unit Tests)
```python
# tests/unit/test_calculator.py
from core.tools.calculator import calculate_moic

def test_calculate_moic():
    result = calculate_moic.invoke({"invested": 1_000_000, "returned": 2_500_000})
    assert result == 2.5
```

#### Mocking External Services
```python
# Use respx for HTTP mocking (RAG Gateway), unittest.mock for others
import respx
from unittest.mock import AsyncMock, patch

@pytest.mark.asyncio
async def test_rag_extract(respx_mock):
    respx_mock.post("http://rag-gateway/api/ExtractFields").respond(json={...})
    result = await rag_client.extract_fields(...)
    assert result["fields"][0]["value"] == 18.5
```

### What NOT to Test

- Don't test third-party library internals (e.g., don't test that `pydantic` validates correctly — test YOUR schema)
- Don't test private methods directly — test them through the public interface
- Don't write tests that just mirror the implementation (tautological tests)
- Don't mock everything — if a unit is simple and has no side effects, test it directly

### Mocking Guidelines

- **Always mock:** External API calls (LLM providers, RAG Gateway, Tavily, MCP servers), database sessions, Redis connections, Celery broker
- **Never mock:** Pure functions, Pydantic model validation, simple data transformations, calculator tools
- **Use `mocker.patch` target:** Patch where the thing is *used*, not where it's *defined*
  - Correct: `mocker.patch("agents.ic_memo.agent.get_llm")`
  - Wrong: `mocker.patch("langchain.chat_models.ChatOpenAI.invoke")`

### conftest.py Setup

The project already has a comprehensive `tests/conftest.py` with shared fixtures:

- `client` — async HTTPX test client with the FastAPI app
- `db_session` — async SQLAlchemy session (rolls back after each test)
- `auth_header` — dev-token authorization header
- `celery_app` — Celery app in eager mode (tasks run synchronously)
- `clean_redis` — Redis cleanup between tests

Use these fixtures rather than creating new ones. Only add fixtures to `conftest.py` if they are reusable across multiple test files.

### Running Tests

After generating tests, remind the user to run:
```bash
pytest tests/ -v
# or for a specific file:
pytest tests/unit/test_calculator.py -v
# with coverage:
pytest tests/ --cov=core --cov=agents --cov=api --cov-report=term-missing
```

### Behavior

When this skill activates:

1. **Identify what changed:** Look at the functions/classes that were just written or modified
2. **Check for existing tests:** Look in the corresponding `tests/` path — update existing tests if the function signature or behavior changed
3. **Generate tests:** Create or update the test file with comprehensive test cases
4. **Create conftest.py if needed:** If shared fixtures are required and `tests/conftest.py` doesn't exist, create it
5. **Report:** Tell the user what tests were created and how to run them
