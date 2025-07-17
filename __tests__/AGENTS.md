# Test Guidelines for Codex

## Purpose and Structure

The `__tests__` directory contains Jest test suites for this Next.js project. Tests mirror the source folders such as `components`, `contexts`, `hooks` and `utils` to keep structure familiar. Integration tests for API routes live under `app/api`. Fixtures and helpers used across tests reside in their respective subfolders.

## Testing Frameworks and Tools

- **Jest** with the `ts-jest` preset for TypeScript support.
- **@testing-library/react** and **@testing-library/user-event** for React component tests.
- Additional mocks live in `__mocks__` and are automatically picked up by Jest.

## Test Writing Guidelines

- Prioritise meaningful coverage that validates business requirements over achieving raw coverage numbers.
- Use the **Arrange – Act – Assert** pattern and keep assertions focused on behaviour, not implementation details.
- Give each test a clear, descriptive name that conveys the scenario and expected outcome.
- Tests should remain independent, deterministic and fast.

## Test Categorisation and Prioritisation

Consider the following categories when writing tests:

- **Happy Path Tests** – standard workflows with valid inputs.
- **Error Handling Tests** – behaviour with invalid inputs or unexpected scenarios.
- **Edge Case Tests** – boundary conditions and uncommon situations.
- **Integration Tests** – interactions between components or with API routes.
- **Performance & Security Tests** – only when relevant.

When time‑boxed, focus on high‑risk areas first, then fill coverage gaps and polish.

## Time‑Boxed Testing Approach

A suggested 20‑minute cycle:

1. **Initial Phase (5‑7 min)** – target high‑impact paths and core functionality.
2. **Middle Phase (5‑7 min)** – add tests for edge cases or missing branches.
3. **Final Phase (5‑6 min)** – clean up, improve readability and verify results.

## Test Quality Checklist

- [ ] Clear, descriptive test names
- [ ] Proper Arrange – Act – Assert structure
- [ ] Independent and deterministic
- [ ] Execute quickly and focus on one behaviour
- [ ] Use realistic, production‑like data

## Execution Instructions

Run tests with:

```bash
npm run test:cov:changed
```

This command runs Jest only on files changed since `main`. Use `npm run test` if
you need to execute the entire suite.

This command also checks coverage for modified files. Linting and type‑checking should pass as well:

```bash
npm run lint
npm run type-check
```

Coverage reports are generated in the `coverage` directory. A summary is printed in the terminal after tests complete.
