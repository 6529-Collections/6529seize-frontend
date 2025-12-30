---

# AGENTS.md – Agent Playbook for Next.js Frontend

This document is the contract for any coding agent (e.g. codex‑cli) working in this repo. It describes **how to run checks**, **what “good” looks like**, and the **modernization rules** tied to our stack (Next.js 16 + React 19.2).

---

## Quickstart

### Setup

```bash
npm install
```

### Test

```bash
npm run test
```

### Lint & Format

```bash
npm run lint
```

> **Note on Next.js 16 & ESLint:** Starting with Next 16, `next lint` is removed. Use the ESLint CLI driven by `eslint-config-next` (flat config). Remove any `eslint` options from `next.config.*`. ([Next.js][1])

---

## Programmatic Checks (must pass before completing any task)

Run all the following (unless you are only editing docs or non-code, in which case tests may be skipped):

```bash
npm run test
npm run lint
```

* `npm run test`: Executes all Jest tests and enforces **≥ 80% line coverage for files changed since `main`**. Fails if tests fail or coverage threshold is not met.
* `npm run lint`: Code must satisfy ESLint (Next’s Core Web Vitals + React Hooks).

If tests fail due to coverage, write meaningful tests until coverage ≥ 80%. If a test fails functionally, fix root cause (code or test) and re‑run until green.

---

## MCP: Enable Next.js DevTools for Agents (highly recommended)

Enable the **Next DevTools MCP server** so agents can query live routes, errors, logs, and Server Actions from a running `next dev`:

```jsonc
// .mcp.json (project root)
{
  "mcpServers": {
    "next-devtools": {
      "command": "npx",
      "args": ["-y", "next-devtools-mcp@latest"]
    }
  }
}
```

* When `next dev` is running, `next-devtools-mcp` auto‑discovers and connects to the app.
* Available tools include: `get_errors`, `get_logs`, `get_page_metadata`, `get_project_metadata`, and `get_server_action_by_id`. Agents should use them **before** changing code when fixes might affect routing, hydration, or Server Actions. ([Next.js][2])

---

## Agent Operating Principles

1. **Fix with modernization** (no “make the warning go away”). Don’t add `// eslint-disable` unless explicitly instructed. Prefer refactors aligned with **React 19.2**, **React Compiler**, and **Next.js 16** conventions. ([React][3])
2. **Prefer Server over Client** where possible. Data reads: Server Components with inline fetches. Mutations: Server Functions / Server Actions (`'use server'`). Avoid client Effects for data fetching unless truly needed. ([Next.js][4])
3. **Effects are last resort.** If there’s no external system, remove the Effect and compute during render. If you must listen to external events but need the latest props/state without re‑running the Effect, use **`useEffectEvent`**. ([React][5])
4. **Use framework APIs:** internal links → `<Link>`, images → `next/image`, and adopt Next’s ESLint rules (Core Web Vitals). ([Next.js][1])
5. **Cache explicitly where it helps.** With Next 16, caching is **opt-in** via the `"use cache"` directive and related Cache Components features (see below). ([Next.js][6])
6. **Commit small, surgical diffs.** If you uncover a broader refactor, open a follow‑up ticket rather than ballooning a lint‑fix PR.

---

## Sentry Error Handling

When addressing issues reported by Sentry, **always attempt to fix the root cause first**. Silencing errors should only be considered as a last resort when fixing is genuinely not possible.

### Default Workflow

1. **Fix the code to prevent the issue** (primary action)
   * Analyze the error stack trace and identify the root cause
   * Implement a proper fix that addresses the underlying problem
   * Add appropriate error handling, validation, or defensive checks
   * Update tests to cover the fix

2. **Ask about silencing only if fixing is not possible** (fallback)
   * Only proceed to silencing if the error is genuinely unfixable, such as:
     * Third-party library errors that cannot be patched
     * Browser extension noise (e.g., injected scripts)
     * Known browser bugs that cannot be worked around
     * Expected errors that are already handled gracefully in the UI

### Where Silencing Happens

If silencing is necessary, errors are filtered in the `beforeSend` callback of Sentry initialization:

* **Client-side**: [`instrumentation-client.ts`](instrumentation-client.ts) — contains `noisyPatterns`, `referenceErrors`, and `filenameExceptions` arrays
* **Server-side**: [`sentry.server.config.ts`](sentry.server.config.ts) — server runtime configuration
* **Edge runtime**: [`sentry.edge.config.ts`](sentry.edge.config.ts) — edge runtime configuration

### Examples

**Fixable (default action):**
* Null reference errors → add null checks or optional chaining
* Type errors → fix type definitions or add runtime validation
* Network errors → implement retry logic or better error handling
* Missing dependencies → add proper dependency arrays or fix imports

**Non-fixable (ask about silencing):**
* Browser extension injecting scripts (`inpage.js` errors)
* Known browser bugs (e.g., `ResizeObserver loop limit exceeded` in some browsers)
* Third-party library errors that cannot be patched without forking

This aligns with the "Fix with modernization" principle: prioritize meaningful fixes over suppressing symptoms.

---

## Next.js 16: What this means for agents

* **Proxy instead of Middleware:** `middleware.ts` is **renamed to** `proxy.ts` (Node runtime). If you touch request‑boundary logic, ensure the file and exported function are named `proxy`. Legacy `middleware.ts` still exists for edge‑only cases but our default is `proxy.ts`. ([Next.js][6])
* **ESLint changes:** `next lint` removed; use ESLint CLI with `eslint-config-next` flat config. ([Next.js][1])
* **React Compiler (stable):** Supported in Next 16. It **auto‑memoizes components**, reducing the need for manual `useMemo`/`useCallback`. You may see lints originating from the compiler surfaced via `eslint-plugin-react-hooks`. Consider enabling the compiler in `next.config.ts` when CI is green:

  ```ts
  // next.config.ts
  export default { reactCompiler: true }
  ```

  ([Next.js][6])
* **Cache Components / `"use cache"`:** Caching is explicit. You can place `"use cache"` at the top of a Server Component, route, or function to opt-in caching; configure `cacheComponents: true` in `next.config.ts` as needed. Prefer tagging/expiration APIs over ad-hoc hacks. ([Next.js][7])
* **Turbopack default:** Dev and build use Turbopack by default in v16—don’t pass `--turbopack`. ([Next.js][8])

---

## React 19.2: Effects guidance for agents

* **Remove unnecessary Effects.** If the Effect’s only job is to derive or sync internal state, calculate during render or use `useMemo` if truly expensive (the **Compiler** may remove that need). ([React][5])
* **Use `useEffectEvent`** for non‑reactive logic inside Effects so you can read the latest props/state without turning them into dependencies or causing needless re‑runs. Keep the Effect’s dependency array minimal and stable. ([React][3])
* **Let lints guide you.** `eslint-plugin-react-hooks` v6+ ships flat-config presets and **compiler‑powered** rules; don’t suppress—refactor. ([React][9])

**Example (pattern to prefer):**

```tsx
// BEFORE: re-runs on theme change, reconnects unnecessarily
useEffect(() => {
  const c = connect(roomId)
  c.on('connected', () => showToast('Connected!', theme))
  return () => c.disconnect()
}, [roomId, theme])

// AFTER: stable effect with an Effect Event
import { useEffectEvent } from 'react'
const onConnected = useEffectEvent(() => showToast('Connected!', theme))
useEffect(() => {
  const c = connect(roomId)
  c.on('connected', onConnected)
  return () => c.disconnect()
}, [roomId])
```

---

## Lint Rules → Modern Fixes (cheat‑sheet)

* **`react-hooks/exhaustive-deps`**

  * If the Effect only derives state → **remove the Effect** and compute during render.
  * If listening to an external system and you need fresh props/state → wrap non‑reactive logic in **`useEffectEvent`**. ([React][5])

* **`@next/next/no-img-element`** → replace `<img>` with `<Image />` from `next/image`. ([Next.js][1])

* **`@next/next/no-html-link-for-pages`** → use `<Link href="/path">` for internal navigation. ([Next.js][1])

* **Data fetching in client Effects** → move reads to **Server Components**; mutations go through **Server Functions / Server Actions** (`'use server'`). ([Next.js][4])

* **Request boundary logic** touching legacy `middleware.ts` → **rename to `proxy.ts`** and export `proxy`. ([Next.js][6])

---

## Next.js Directory Structure

All production routes live under the App Router (`app/`). Add new routes there.

Routes in `app/` should export `generateMetadata` using our helper:

```ts
import { getAppMetadata } from "@/components/providers/metadata";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata({ title: "My Page" });
}
```

If you add or modify `proxy.ts`, keep it at the root (or `src/`) alongside `app/`/`pages/` and export `proxy`. ([Next.js][10])

---

## Coding Conventions

* TypeScript + React functional components with hooks.
* Follow existing code style and naming conventions.
* Maintain clean code standards (measured by SonarQube).
* Tests live in `__tests__/` or `ComponentName.test.tsx`.
* Mock external dependencies and APIs in tests.
* When parsing Seize URLs (or similar), **do not** fall back to placeholder origins; fail fast if base origin is unavailable.
* **React imports:** Prefer direct named imports (`useMemo`, `useRef`, `FC`, etc.) over `React.` namespace usage (`React.useMemo`, `React.useRef`, `React.FC`, etc.). Import hooks and types directly: `import { useMemo, useRef, FC, memo } from "react"` rather than `import React from "react"` and using `React.useMemo`.

---

## Codex Workspace

Use the `/codex/` directory as the source of truth for planning and ticket execution.

* Review `codex/STATE.md` at the start of every workstream; keep tickets in sync with `codex/tickets/`.
* Author new tickets with the provided template, keep alphabetical YAML front matter, and log timestamped updates.
* Put broader plans in `codex/plans/` and evergreen docs in `codex/docs/`, following `codex/agents.md` and `codex/docs/README.md`.
* Link PRs back to tickets and mirror merged PRs in both the ticket log and `STATE.md`.
* Never edit tickets marked **Done**; open a new ticket for new scope.

---

## Commit Guidelines

* Use **Conventional Commits** (`feat:`, `fix:`, etc.).
* **Do not squash**; keep a clear history.
* One logical change per commit.
* **DCO required** on every commit:

  ```text
  Signed-off-by: Your Full Name <your-GH-ID+username@users.noreply.github.com>
  ```

---

### Why the policy

* **Next DevTools MCP** gives agents live, app‑specific context (routes, errors, actions) for accurate fixes. ([Next.js][2])
* **React 19.2 + Hooks v6** align lints with modern patterns, including `useEffectEvent` and compiler‑powered guidance. ([React][3])
* **Next 16** introduces explicit caching (`"use cache"`), a clearer network boundary (`proxy.ts`), and stable React Compiler support, so “lint fixes” often become meaningful improvements. ([Next.js][6])


[1]: https://nextjs.org/docs/app/api-reference/config/eslint "Configuration: ESLint | Next.js"
[2]: https://nextjs.org/docs/app/guides/mcp "Guides: Next.js MCP Server | Next.js"
[3]: https://react.dev/reference/react/experimental_useEffectEvent "useEffectEvent – React"
[4]: https://nextjs.org/docs/app/getting-started/server-and-client-components?utm_source=chatgpt.com "Getting Started: Server and Client Components"
[5]: https://react.dev/learn/you-might-not-need-an-effect "You Might Not Need an Effect – React"
[6]: https://nextjs.org/blog/next-16?utm_source=chatgpt.com "Next.js 16"
[7]: https://nextjs.org/docs/app/api-reference/directives/use-cache?utm_source=chatgpt.com "Directives: use cache"
[8]: https://nextjs.org/docs/app/guides/upgrading/version-16?utm_source=chatgpt.com "Upgrading: Version 16"
[9]: https://react.dev/blog/2025/10/01/react-19-2?utm_source=chatgpt.com "React 19.2"
[10]: https://nextjs.org/docs/app/getting-started/proxy?utm_source=chatgpt.com "Getting Started: Proxy"
