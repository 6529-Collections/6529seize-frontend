# Lint-First Refactor Guide (Next.js 16 + React 19.2)

This document is the single source of truth for how we fix ESLint issues and make **small, safe** improvements while adopting React 19.2 and Next.js 16 features.

---

## Principles

- **Preserve behavior.** Changes must not alter UI or API outputs.
- **Prefer deletion to indirection.** Remove unused code first.
- **Minimize Effects.** If something can be expressed as derived data or an event handler, do that instead.
- **Server-first.** Default to Server Components; opt into Client Components only when browser APIs or interactivity require it.
- **Document intent.** When you suppress a rule, add a one-line reason.

---

## React 19.2: What we use

- **Effect Events (`useEffectEvent`)** — Extract event-like logic out of `useEffect` so the effect’s dependencies stay minimal. Lint v6 understands that Effect Events are not dependencies.  
  Docs: <https://react.dev/reference/react/useEffectEvent>  
  Release notes: <https://react.dev/blog/2025/10/01/react-19-2>  ← see sections on `useEffectEvent` and `eslint-plugin-react-hooks v6`.

- **“You might not need an Effect”** — Most state derivations and event responses should not be in Effects.  
  Guide: <https://react.dev/learn/you-might-not-need-an-effect>

- **Server rendering + caching primitives** — `cache()` and `cacheSignal()` may appear in RSC utilities. Use sparingly and only where obvious.  
  `cacheSignal`: <https://react.dev/reference/react/cacheSignal>

**Notes**
- When converting code to `useEffectEvent`, call the event only from within Effects. Don’t pass it as a prop or store it; treat it like an effect-local event. See the release post for constraints.  
  <https://react.dev/blog/2025/10/01/react-19-2>

---

## Next.js 16: What we use

- **Cache Components & `"use cache"`** (opt‑in)  
  - Enable in `next.config.ts`: `cacheComponents: true`.  
  - Apply `"use cache"` to routes/components/functions that return stable, serializable results safe to cache.  
  - Prefer **no change** unless the gain is obvious and inputs are pure.  
  Blog: <https://nextjs.org/blog/next-16>  
  Directive docs: <https://nextjs.org/docs/app/api-reference/directives/use-cache>  
  Config: <https://nextjs.org/docs/app/api-reference/config/next-config-js/cacheComponents>

- **Next.js Devtools MCP** (required tool)  
  - We have `next-devtools-mcp` installed. Use it for project metadata, page rendering info, unified logs, and error surfacing.  
  Guide: <https://nextjs.org/docs/app/guides/mcp>

- **Server & Client Components**  
  - Default to Server Components; use `"use client"` only for stateful interactive UI or browser-only APIs.  
  Docs: <https://nextjs.org/docs/app/getting-started/server-and-client-components>

**Optional (case-by-case)**  
- Updated `revalidateTag` and `updateTag` APIs exist; do not change unless the file already uses these. See release blog for details: <https://nextjs.org/blog/next-16>

---

## Playbook: Fixing Common ESLint Issues

### 1) `unused-imports/no-unused-vars`
- **Remove** the symbol if truly unused.
- If it’s a placeholder or doc-only type, **rename with a leading underscore** (e.g., `_WarpcastFrameResponse`) to satisfy our rule.
- For public exported types used elsewhere, **do not rename**. Keep the export and add:
  ```ts
  // eslint-disable-next-line unused-imports/no-unused-vars -- exported API, referenced outside this file
  export type AllowlistWalletPool = { ... }
  ```

* Prefer `import type {...}` and `export type` for type-only symbols.

### 2) `react-hooks/exhaustive-deps`

#### Step A: Remove unnecessary Effects

* If the Effect only derives state from props/state, compute it during render or with `useMemo`.

#### Step B: Extract event-like logic with `useEffectEvent`

* **Before**

  ```ts
  useEffect(() => {
    socket.on('connected', () => notify(theme));
    return () => socket.off('connected');
  }, [roomId]) // linter asks for `theme`
  ```
* **After**

  ```ts
  const onConnected = useEffectEvent(() => notify(theme));
  useEffect(() => {
    socket.on('connected', onConnected);
    return () => socket.off('connected', onConnected);
  }, [roomId]); // correct and stable
  ```
* Add real reactive inputs (IDs, query, flags) to the dependencies. Event payload values belong in the Effect Event.
  Docs: [https://react.dev/reference/react/useEffectEvent](https://react.dev/reference/react/useEffectEvent)

#### Step C: Router/search params patterns

* Prefer server-side defaults (redirects in Server Components or default params) instead of client `useEffect` to push/replace.
* If you must react to URL changes client-side, it’s fine for the Effect to depend on `searchParams`. Keep navigation calls inside an Effect Event to avoid dependency bloat.

---

## When to consider `"use cache"` (Cache Components)

Add **only** when all are true:

* The code runs on the server and returns **pure, serializable** data.
* Cache keys are clear from the inputs (no hidden header/cookie dependence).
* There is a real win (expensive read, stable result).

#### Examples

* Route handler assembling a public, static OG image response: OK to cache if inputs are explicit.
* Server utility fetching immutable docs by ID: OK to cache at function level.

#### How

```ts
// At file or function top:
'use cache'

export async function getStableThing(id: string) { ... }
```

Docs: [https://nextjs.org/docs/app/api-reference/directives/use-cache](https://nextjs.org/docs/app/api-reference/directives/use-cache)

Avoid `"use cache: private"` and `"use cache: remote"` unless you clearly match their semantics. Docs:

* Private: [https://nextjs.org/docs/app/api-reference/directives/use-cache-private](https://nextjs.org/docs/app/api-reference/directives/use-cache-private)
* Remote:  [https://nextjs.org/docs/app/api-reference/directives/use-cache-remote](https://nextjs.org/docs/app/api-reference/directives/use-cache-remote)

---

## Live Testing Checklist (per file)

1. **Dev server**: `npm run dev`.
2. **Next Devtools MCP**:

   * `get_errors`: ensure zero hydration/runtime errors.
   * `get_page_metadata`: confirm which route(s) use the changed file and whether they render as Server/Client.
   * `get_logs`: scan for warnings after interacting with the page.
3. **Manual route check**: open the affected URL(s), hard refresh, interact with UI paths that exercise the changes.
4. **Effects**: if you changed an Effect, test the dependency that previously caused re-runs (e.g., change theme, switch roomId) to confirm no reconnection loop.
5. **Caching (if added)**: reload twice and verify stable behavior; look for improved render time or logged cache hits.

---

## Examples tailored to our repo warnings

> Use these patterns when the agent receives the file + lint lines below.

* `app/api/farcaster/route.ts` — `'WarpcastFrameResponse' is defined but never used`

  * Remove type or rename to `_WarpcastFrameResponse` if intentionally kept. If it’s part of a public API consumed elsewhere, keep the name and add a one-line rule suppression with a reason.

* `components/6529Gradient/6529Gradient.tsx` — missing deps on `searchParams`, `router`, `nftsRaw`

  * First check if the logic can be derived or moved to an event handler (no Effect).
  * If subscribing or navigating on mount, wrap notification/navigation in `useEffectEvent` and keep the Effect deps minimal and correct (e.g., `[criticalId]`). See `useEffectEvent` guidance above.

* `components/about/AboutPrimaryAddress.tsx` — missing dep `populateData`

  * If `populateData` is an event-like function (e.g., fetch + setState), convert it to an Effect Event and reference it from the Effect; keep deps to the wiring inputs.

* `allowlist-tool.types.ts` — several unused exported types

  * Check for cross-file references. If none, delete or underscore-prefix. If used, keep exports and add targeted inline disables with a short reason.

---

## Links (authoritative)

* **React 19.2 Release** (Activity, useEffectEvent, cacheSignal, hooks lint v6):
  [https://react.dev/blog/2025/10/01/react-19-2](https://react.dev/blog/2025/10/01/react-19-2)

* **Effect Events**:
  [https://react.dev/reference/react/useEffectEvent](https://react.dev/reference/react/useEffectEvent)

* **You might not need an Effect**:
  [https://react.dev/learn/you-might-not-need-an-effect](https://react.dev/learn/you-might-not-need-an-effect)

* **cacheSignal**:
  [https://react.dev/reference/react/cacheSignal](https://react.dev/reference/react/cacheSignal)

* **Next.js 16 Release (Cache Components, Devtools MCP)**:
  [https://nextjs.org/blog/next-16](https://nextjs.org/blog/next-16)

* **Next.js MCP**:
  [https://nextjs.org/docs/app/guides/mcp](https://nextjs.org/docs/app/guides/mcp)

* **Cache Components & Directives**:
  [https://nextjs.org/docs/app/api-reference/directives/use-cache](https://nextjs.org/docs/app/api-reference/directives/use-cache)
  [https://nextjs.org/docs/app/api-reference/config/next-config-js/cacheComponents](https://nextjs.org/docs/app/api-reference/config/next-config-js/cacheComponents)

* **Server & Client Components**:
  [https://nextjs.org/docs/app/getting-started/server-and-client-components](https://nextjs.org/docs/app/getting-started/server-and-client-components)

---

```text
- React 19.2 introduces **`useEffectEvent`** to split event-like logic from Effects; the **hooks linter v6** understands that Effect Events are not dependencies. This prevents unnecessary reconnections/re-subscriptions when unrelated values (like theme) change. :contentReference[oaicite:1]{index=1}
- The **“You might not need an Effect”** doc emphasizes removing Effects used for pure derivations or event handling to reduce bugs and improve performance. :contentReference[oaicite:2]{index=2}
- Next.js 16 ships **Cache Components** (opt-in) centered on the `"use cache"` directive; enable via `cacheComponents: true`. Use only when safe and inputs are serializable. :contentReference[oaicite:3]{index=3}
- **Next.js Devtools MCP** exposes project/runtime insights to AI agents (errors, logs, page metadata, server actions). It’s designed for exactly this workflow. :contentReference[oaicite:4]{index=4}
```
