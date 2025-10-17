# Codex Testing Guidelines

## Purpose & Structure

* All tests live in `__tests__`, mirroring source folders (`components`, `contexts`, `hooks`, `utils`).
* API integration tests: `app/api`.
* Shared fixtures & helpers: relevant subfolders.
* Jest automatically picks up mocks from `__mocks__`.

## Tools

* **Jest** + `ts-jest` (TypeScript).
* **@testing-library/react** + **user-event** (React tests).
* Coverage reports in `coverage/`.

## Writing Tests

* Focus on business value, not raw coverage.
* Follow **Arrange – Act – Assert**.
* One behaviour per test; clear, descriptive names.
* Keep tests independent, deterministic, and fast.
* Use realistic data.

### Test Types

* **Happy Path** – expected workflows.
* **Errors** – invalid input, unexpected scenarios.
* **Edge Cases** – boundaries, rare conditions.
* **Integration** – components & API interactions.
* **Performance/Security** – when relevant.

Prioritise high-risk areas first when time-boxed.

## Time-Boxed Cycle (20 min)

1. **5–7 min**: core flows.
2. **5–7 min**: edge cases & branches.
3. **5–6 min**: clean up & refine.

## Quality Checklist

* [ ] Clear, descriptive names
* [ ] Arrange – Act – Assert used
* [ ] Independent & fast
* [ ] One behaviour per test
* [ ] Production-like data

## Running Tests

```bash
npm run test:cov:changed   # changed files only
npm run test               # full suite
npm run lint
npm run type-check
```

---

# Coding Standards

### Complexity

* Functions ≤ 15 cognitive complexity.
* Extract deep ternaries (>3 levels).
* Break down complex logic.

### Modern Patterns

**Iteration**

```ts
// ❌ Avoid
items.forEach(item => processItem(item));

// ✅ Prefer
for (const item of items) {
  processItem(item);
}
```

* Allows `break/continue`.
* Works with async/await.

**Array Access**

```ts
// ✅ Prefer
const last = array.at(-1);
const secondLast = array.at(-2);
```

**Strings**

```ts
// ✅ Prefer
str.replaceAll('old', 'new');
```

**Globals**

```ts
// ✅ Prefer
globalThis.fetch(url);
```

**Imports**

* One import per module.
* Order: external → internal → types.
* No duplicates.

**Accessibility**

* Use semantic HTML (`<label>`, `<output>`) over ARIA when possible.
* Every form control must have a label.
* Test with keyboard + screen reader.

**Modern DOM**

```ts
element.remove(); // instead of parent.removeChild(element)
```

**Error Handling**

* Catch only when meaningful.
* No empty `catch`.
* Log with context.

**Clarity**

* Avoid double negatives.
* Prefer explicit, remove redundant annotations.
* Use optional chaining (`?.`).
