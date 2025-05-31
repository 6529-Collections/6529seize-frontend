# Mocking Guidelines for Codex

## Purpose and Structure

The `__mocks__` folder contains modules used to replace external dependencies during testing. Mock files mirror the names of the real modules so that Jest automatically uses them when `jest.mock()` is called without a path.

Current mocks include stubs for static assets, style imports and certain libraries such as `react-use` and `nano-css`.

## Mocking Frameworks and Tools

- Jest's built‑in mocking capabilities handle module replacement.
- Manual mock implementations are kept simple and lightweight.

## Mock Creation and Usage

- Mock only external dependencies or heavy functionality. Avoid over‑mocking internal logic.
- Keep implementations minimal – enough to satisfy test scenarios.
- Document expected behaviour in the mock file when it is not obvious.
- Organise mocks to mirror the real module structure so imports remain consistent.

## Best Practices

- Keep mocks up to date with the real implementations they represent.
- Collaborate with other developers when updating mocks to ensure accuracy.
- Review mocks regularly for relevance and remove unused ones.

## Integration with Tests

Mocks are loaded automatically when a test calls `jest.mock('module')` and a matching file exists under `__mocks__`. This allows tests to focus on component behaviour without hitting real APIs or complex dependencies.

## Maintenance

Review and update mocks whenever related modules change. Accurate mocks lead to reliable tests and reduce false positives or negatives.
