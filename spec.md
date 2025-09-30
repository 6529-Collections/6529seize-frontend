
# NFT Picker — Full Implementation Spec

**Goal**
Reusable, accessible component to select either:

* **a single NFT**, or
* **a bucket** of NFTs by manually entered token IDs and/or ranges, or
* **“All”** tokens for a contract (represented by an empty list of IDs).

**Output (contract-scoped):**

```ts
{
  contractAddress: `0x${string}`;
  tokenIds: number[]; // empty = all
}
```

> Internally we use `bigint` for token IDs (IDs can exceed JS safe integers). See **Output modes & bigint**.

**Tech**: Next.js 15 (App Router), TypeScript, Tailwind CSS 3.4 with `tw-` prefix, existing Alchemy REST wrapper in `services/alchemy-api.ts` (uses `config/env.schema.ts:28` `ALCHEMY_API_KEY`), virtualization patterns built on `hooks/useVirtualizedWaves.ts` / `hooks/useVirtualizedWaveMessages.ts`, responsive via **container queries** (Tailwind plugin). Multi‑chain design, but **initial chain = Ethereum**.

---

## 0) Key UX/Behavior

1. A **single input (combobox)** where the user types **collection name or contract address**.

   * Autocomplete suggestions show **thumbnail**, **name**, **short address**, **token type (ERC‑721/1155)** pills, **supply**, and **floor** (compact).
   * Scam-prevention signals (flagged/spam, OpenSea safelist status) are surfaced to help users avoid scams (see **Scam prevention**).
   * Keyboard (↑/↓/Enter/Esc) and mouse support.

2. After a contract is selected, the header shows **selected collection** (avatar + name + address + standard + supply + floor). Clear/change contract via a button.

3. Picker **mode**:

   * **Single**: enter a specific token ID; add to list.
   * **Bucket**: enter **IDs and ranges** (e.g., `1,2,4-6,8,0x1A-0x1F`), add/merge; list is virtualized with thumbnails fetched on demand.
   * **All**: choose “All tokens in this contract” → `tokenIds=[]`.

4. The **selected tokens** area:

   * Always shows a **canonical, compact representation** like `1,2,4-6,8-14,51,89-398`.
   * Users can **toggle “Edit as text”** to edit the canonical string directly. Editing **either** the chips/list **or** the canonical text **keeps them in sync**.
   * Each chip/list row has a remove button; ranges can be edited as ranges (not just by removing items one-by-one).
   * Virtual scrolling for long lists; **lazy-load** NFT thumbnails/metadata only for visible rows.

5. **No submit button**. Every change emits `onChange(...)` to the parent (contract selection or token list changes).

6. **Responsive everywhere** using **container queries** so the component can drop into narrow sidebars or full-width modals. Works in Capacitor (mobile).

---

## 1) External APIs & Docs (authoritative)

* **Search collections by name / contract keywords**: `searchContractMetadata` (v3) returns `address`, `name`, `tokenType`, `totalSupply`, and `openseaMetadata` (incl. `floorPrice`) — supports ETH, Polygon, Arbitrum, Optimism, Base. Wrap via helpers in `services/alchemy-api.ts`. ([Alchemy][1])
* **Contract NFTs listing** (for preview / on-demand metadata): `getNFTsForContract` with pagination and optional metadata (also returns spam flags on the `contract`). Extend `services/alchemy-api.ts` to expose paginated helpers. ([Alchemy][2])
* **Single token metadata**: `getNFTMetadata` (v3). Use for precise token rows on demand; add REST calls under `services/alchemy-api.ts`. ([Alchemy][3])
* **Batch token metadata**: `getNFTMetadataBatch` (v3) for viewport prefetch, keeping fetch logic in `services/alchemy-api.ts`. ([Alchemy][4])
* **Floor price** by marketplace: `getFloorPrice` (REST) is optional; fall back to `openseaMetadata.floorPrice`. No SDK import. ([Alchemy][5])
* **Spam detection** (hide spam by default): Alchemy exposes spam detection (`isSpam`/`spamClassifications`). Surface results already returned from REST calls. ([Alchemy][2])
* **Tailwind container queries** (v3 requires plugin; use `tw-@container` & `@md:` variants with prefix). ([GitHub][7])

---

## 2) Project Structure (suggested)

```
/components/nft-picker/
  NftPicker.tsx                // client component (combobox + modes + selected list)
  NftPicker.types.ts           // exported types
  NftPicker.utils.ts           // parsing, formatting, ranges, bigint-safe helpers
  NftContractHeader.tsx        // shows selected contract summary
  NftSuggestList.tsx           // virtualized suggestion list
  NftTokenList.tsx             // virtualized selected tokens list
  NftEditRanges.tsx            // "Edit as text" + parser/formatter
  useAlchemyClient.ts          // hook wrapping helpers in `services/alchemy-api.ts`
/services/alchemy-api.ts       // extend with search/metadata helpers
/services/6529api.ts           // reuse existing fetch helpers
```

> **Security**: keep Alchemy requests centralized in `services/alchemy-api.ts` so the API key stays in one place (no new Next.js API routes required).

---

## 3) Tailwind & Responsiveness

* Tailwind 3.4 with prefix `tw-` in `tailwind.config.js`:

  ```js
  module.exports = {
    prefix: 'tw-',
    plugins: [require('@tailwindcss/container-queries')],
  }
  ```
* Mark containers with `tw-@container`. With prefixing, **you must prefix the container class and any utilities** inside container queries:

  ```jsx
  <div className="tw-@container tw-w-full tw-rounded-lg tw-border tw-border-iron-800 tw-bg-iron-900">
    <div className="tw-flex tw-flex-col @md:tw-flex-row">
      ...
    </div>
  </div>
  ```

  (Tailwind’s plugin docs explicitly note prefixing both `@container` and container‑query variants.) ([GitHub][7])

---

## 4) Types

```ts
// NftPicker.types.ts
import type { ReactNode } from 'react';

export type SupportedChain =
  | 'ethereum'; // extend later: 'polygon' | 'arbitrum' | 'optimism' | 'base'

export type OutputMode = 'number' | 'bigint'; // default 'number' to match your output contract

export type TokenIdBigInt = bigint;

export type TokenRange = { start: TokenIdBigInt; end: TokenIdBigInt }; // inclusive
export type TokenSelection = TokenIdBigInt[]; // deduped

export type NftSelectionOutput = {
  contractAddress: `0x${string}`;
  tokenIds: number[]; // empty = all
};

export type NftPickerValue = {
  chain: SupportedChain;
  contractAddress?: `0x${string}`;
  // if 'all' => selectedIds can be empty and allSelected=true
  selectedIds: TokenSelection; // internal as bigint[]
  allSelected: boolean;
};

export type Suggestion = {
  address: `0x${string}`;
  name?: string;
  symbol?: string;
  tokenType?: 'ERC721' | 'ERC1155';
  totalSupply?: string; // from API
  floorPriceEth?: number | null;
  imageUrl?: string | null;
  isSpam?: boolean;
  safelist?: 'verified' | 'approved' | 'requested' | 'not_requested' | undefined;
};

export type NftPickerProps = {
  value?: NftPickerValue; // controlled
  defaultValue?: Partial<NftPickerValue>;
  onChange: (output: NftSelectionOutput) => void;
  onContractChange?: (meta: Suggestion | null) => void;

  // data / behavior
  chain?: SupportedChain;                // default 'ethereum'
  outputMode?: OutputMode;               // default 'number' — see bigint notes
  hideSpam?: boolean;                    // default true
  allowAll?: boolean;                    // default true
  allowRanges?: boolean;                 // default true
  debounceMs?: number;                   // default 250
  overscan?: number;                     // default 8

  // customization
  placeholder?: string;
  className?: string;
  renderTokenExtra?: (tokenId: bigint) => ReactNode; // optional trailing info per row
};
```

---

## 5) Parsing & Canonicalization (IDs & Ranges)

### Accepted input

* Comma/space separated tokens and ranges:
  `1, 2, 5-12, 18, 0x1A-0x1F`
* Decimal or Hex (`0x…`) per endpoint behavior.
* No quantities for ERC‑1155 (each tokenId is unique ID, not amount).

### Rules

* **Convert to `bigint`** internally.
* Validate **non-negative**; forbid leading `+`/`-`.
* Ranges are **inclusive**; if `start > end` → swap and warn in UI.
* Deduplicate and **merge contiguous** ranges (1,2,3 → 1‑3).
* A canonical string is generated from merged ranges, **sorted asc**:

  * singletons as `X`, ranges as `A-B`, joined by commas.

### Helpers (implement in `NftPicker.utils.ts`)

```ts
export function parseTokenExpressionToBigints(input: string): bigint[]; // throws ParseError[]
export function mergeAndSort(ids: bigint[]): bigint[]; // merge contiguous as ranges but returns expanded ids
export function toCanonicalRanges(ids: bigint[]): TokenRange[]; // merged range model
export function fromCanonicalRanges(ranges: TokenRange[]): bigint[]; // expand
export function formatCanonical(ranges: TokenRange[]): string; // e.g., "1,2,4-6,8-14"
export function tryToNumberArray(ids: bigint[]): { numbers: number[]; unsafeCount: number };
export function bigintCompare(a: bigint, b: bigint): number;
export const MAX_SAFE = BigInt(Number.MAX_SAFE_INTEGER);
```

> **Performance**: For very large ranges (e.g., `0-100_000`), **do not expand** for rendering. Keep both forms:
>
> * `ranges: TokenRange[]` (sources of truth for editing as ranges/text)
> * `ids: bigint[]` only if you actually need enumeration (e.g., to preview visible rows). Use a **windowed expansion** function for virtual rows to avoid allocating huge arrays.

---

## 6) Component Anatomy

### 6.1 Combobox (Search)

* **Input** with `role="combobox"` + `aria-controls`, `aria-expanded`, `aria-activedescendant`.
* Debounced query (default 250ms) → call `searchContractMetadata` helper exposed from `services/alchemy-api.ts` via `useAlchemyClient` (wrap in `@tanstack/react-query`).
* If input matches **valid address**, bypass search and fetch contract metadata with an address helper (re-use `isValidEthAddress` from `helpers/Helpers.ts:218`).
* **Suggestion rows** (virtualized when > ~12 results) show:

  * 32px image (from `openseaMetadata.imageUrl` or fallback), name, short address, `ERC721`/`ERC1155` pill, supply, floor (Ξ) small; optional verified check; spam warning.
* **Keyboard**: ↑/↓ to move, Enter to select, Esc to close, Tab moves focus.
* **Mouse**: hover highlights, click selects.

**API specifics**

* Search uses **`searchContractMetadata`** (v3). Pull: `address`, `name`, `tokenType`, `totalSupply`, `openseaMetadata.floorPrice`, `openseaMetadata.safelistRequestStatus`, `openseaMetadata.imageUrl`. ([Alchemy][1])
* For **floor**, optionally call `getFloorPrice` (SDK) for more marketplaces and fallback to OpenSea’s value. Cache per address (stale 5 min). ([Alchemy][5])
* **Spam**: If `contract.isSpam` or spam classifications present, mark as “⚠️ Suspected spam” and **hide** by default (`hideSpam=true`). Allow “Show anyway” affordance. (Spam fields appear in contract metadata responses; Alchemy also documents spam detection and filtering.) ([Alchemy][2]) Keep the data path confined to `services/alchemy-api.ts`.

### 6.2 Selected Contract Header

* Displays thumbnail, name, checksummed address, standard, supply and floor.
* Actions: **Change** (re-opens combobox), **Clear** (resets component state).
* Layout: row on wide containers, column on narrow (container queries).

### 6.3 Mode Switch

Tabs or segmented control:

* **Single** | **Bucket** | **All** (if `allowAll`)
* `tw-@container` responsive layout to keep compact on narrow parents.

### 6.4 Single Mode

* Small input for **one token ID** + **Add** button.
* Validation inline. On add → appears in selected list (deduped).

### 6.5 Bucket Mode

* “Add tokens or ranges” input + **Add**.
* Below input:

  * **Canonical summary** (always visible): `tokens: 1,2,4-6,...` (truncate with horizontal scroll if needed).
  * **“Edit as text”** toggle → textarea with canonical string. When confirmed, reparses and diffs set.
* **Selected tokens list** (virtualized):

  * Each row shows: **thumbnail**, **#tokenId**, optional token name, and a **Remove** button.
  * Clicking a **range badge** opens an **inline editor** (start/end inputs). Save merges/dedupes.
* **Data fetch**: **lazy** token metadata per visible window using `getNFTMetadataBatch` on demand; image uses `image.thumbnailUrl/cachedUrl`. ([Alchemy][4])

### 6.6 All Mode

* Shows clear “All tokens in this contract are selected.”
* Output `tokenIds: []`.

---

## 7) Output modes & bigint

* **Internal**: `bigint` for IDs.
* **Prop** `outputMode?: 'number' | 'bigint'` (default `'number'` to match your target shape).

  * If `'number'`: We **only emit safe integers** (`<= Number.MAX_SAFE_INTEGER`). If an unsafe ID is present, display an inline error **and do not emit changes** until resolved; suggest switching to `'bigint'`.
  * If `'bigint'`: We still emit `{ contractAddress, tokenIds: number[] }` to the parent **by converting** only safe IDs; if any are unsafe, we emit `[]` there and include a **console.warn** (and we fire `onContractChange` so the parent can react).

    > If you want, the agent can also add a parallel `onChangeRaw({ contractAddress, tokenIds: bigint[] })`.
* **“All”** always emits `tokenIds: []`.

---

## 8) Accessibility

* Combobox follows WAI‑ARIA pattern: `role="combobox"` + `role="listbox"`/`role="option"`, `aria-selected`, `aria-activedescendant`.
* Roving tabindex in token list; **Remove** buttons are accessible (aria‑label includes the tokenId).
* Live regions (`aria-live="polite"`) for validation and async feedback (“Fetching contract…”, “No results”, “Spam filtered: N hidden”).
* Hit target ≥ 44px on touch (Capacitor).
* Color contrast ≥ 4.5:1 for text, ≥ 3:1 for UI.

---

## 9) Keyboard interactions

* Input: ↑/↓ open & move; Enter select; Esc clear/close suggestions.
* Token list: ↑/↓ moves focus between rows; Delete removes focused token; Enter opens range editor for range items.
* “Edit as text” textarea: Ctrl+Enter (or Cmd+Enter) to apply.

---

## 10) Virtualization

* Reuse the primitives from `hooks/useVirtualizedWaves.ts` / `hooks/useVirtualizedWaveMessages.ts` (extract a shared helper if it keeps the picker self-contained).
* Apply the same fixed-row math (overscan default 8) already used in those hooks so scroll restoration and sentinel behaviour stay consistent across the app.
* For token thumbnails, trigger metadata fetches when items enter the overscan window and cancel via the existing abort-handling patterns in our hooks.

---

## 11) Data fetching & services

> Keep network access inside the existing REST helpers so credentials and retry logic stay centralized.

* Extend `services/alchemy-api.ts` with typed helpers for collection search, contract metadata, and batched token metadata. Follow the patterns already used in `getNftsForContractAndOwner` (respecting pagination via `pageKey`).
* Normalise responses with types from `components/rememes/alchemy-sdk-types.ts`; expose only the fields the picker needs (address, token type, supply, safelist, spam flags, thumbnails, etc.).
* Reuse fetch utilities in `services/6529api.ts` / `commonApiFetchWithRetry` for consistent headers (staging auth, wallet auth) and error handling.
* `useAlchemyClient.ts` should map these helpers into `@tanstack/react-query` hooks (standardised cache keys, retries, cancellation via AbortController).
* Continue reading the `ALCHEMY_API_KEY` from `publicEnv` (`config/env.schema.ts:28`)—no new server routes required, but avoid exposing raw responses beyond what the UI consumes.

---

## 12) Client Implementation Details

### 12.1 NftPicker.tsx (client)

* `use client`
* Local state:

  * `query`, `isOpen`, `activeIndex` for combobox.
  * `selectedContract` (Suggestion | null).
  * `mode`: `'single' | 'bucket' | 'all'`.
  * `ranges: TokenRange[]`, `idsVisibleWindow: bigint[]` (optional if using windowed expansion).
* Effects:

  * Debounced search → issue `useQuery` calls backed by `services/alchemy-api.ts` helpers (wrap with `react-use`'s `useDebounce`).
  * On `selectedContract` change: reset selection; fire `onContractChange`.
  * On any selection change: **emit to parent** using `emitSelection()` (see Output modes).
* Accessibility attributes update as ARIA spec.

### 12.2 Suggestions (NftSuggestList.tsx)

* Receives `items: Suggestion[]`, `activeIndex`, `onHover`, `onClick`.
* Reuse virtualization helpers from `hooks/useVirtualizedWaves.ts` (or extract shared util) if `items.length > 12`. Row content shows compact pills:

  * `ERC721`/`ERC1155`.
  * Floor: `Ξ1.23` or `—`.
  * Supply: short format (e.g., `10k`).
  * Safelist: green check (verified/approved).
  * Spam: yellow shield (hidden if `hideSpam` true; toggle).

### 12.3 Selected list (NftTokenList.tsx)

* Input area for Single/Bucket + canonical summary + “Edit as text” toggle.
* Virtualized rows using the same primitives as `useVirtualizedWaveMessages`. Each row:

  * 40px image (lazy), tokenId badge, optional name (ellipsize), remove button.
* On viewport change, call a memoized helper in `services/alchemy-api.ts` that batches token metadata (up to 100) and cache results with `@tanstack/react-query`.

---

## 13) Styling (Tailwind w/ `tw-` prefix)

* Root: `tw-@container tw-w-full tw-rounded-lg tw-border tw-border-iron-800 tw-bg-iron-900 tw-p-3 tw-shadow-sm`
* Input: `tw-w-full tw-rounded-md tw-border tw-border-iron-700 tw-bg-iron-950 tw-px-3 tw-py-[.625rem] focus:tw-ring-2 focus:tw-ring-primary-500`
* Suggest row: `tw-flex tw-items-center tw-gap-3 tw-px-3 tw-py-2 hover:tw-bg-iron-800 @md:tw-gap-4`
* Pills: `tw-text-[11px] tw-rounded tw-bg-iron-800 tw-px-1.5 tw-py-0.5`
* Container queries:

  * `@md:` for switching list item layout from stacked → inline.
  * Example: thumbnails hidden below `@sm`, shown `@sm` and above: `tw-hidden @sm:tw-block`

---

## 14) Scam Prevention (built-in)

* Mark and **hide spam** by default; surface a toggle “Show suspected spam results” when present.
  Rationale & guidance per Alchemy spam docs; `isSpam` and classifications are available in contract/nft responses. ([Alchemy][2])
* Show **OpenSea safelist** status badge (verified/approved). (From `openseaMetadata.safelistRequestStatus`.) ([Alchemy][1])
* Show **deployer address** (if provided by API) in suggestion details (hover tooltip).
* Never auto‑execute actions; no external links automatically followed.

---

## 15) Performance

* All network calls funnel through `services/alchemy-api.ts`; let `@tanstack/react-query` manage caching (`staleTime` ≈ 60s for search, 5 min for contract details).
* Client keeps a local Map keyed by `query+chain` to avoid duplicate network requests within a session (mirror caching used elsewhere in the app).
* Virtual lists overscan = 8; only load token metadata for visible/overscanned rows (via the batched helper backed by `getNFTMetadataBatch`).
* Avoid expanding massive ranges fully; use **windowed expansion** (only expand tokenIds for rows to be shown).

---

## 16) Capacitor & Mobile

* Detect via `isCapacitor()`; prefer native scrolling; increase hit areas; avoid position:fixed tooltips that conflict with iOS viewport quirks.
* Touch gestures: long‑press on row opens range editor or context menu.

---

## 17) Errors & Empty States

* Search: “Type to search collections or paste a contract address.”
* No matches: “No collections found.” Offer “Paste address” suggestion.
* Spam hidden: “Filtered suspected spam collections (N). Show.”
* Invalid token expression: inline red helper under the input and mark offending segment(s).
* When outputMode is `'number'` and unsafe IDs present: “ID exceeds safe integer range; switch to bigint output or remove those IDs.”

---

## 18) Testing Plan

* **Unit**: parsing (`parseTokenExpressionToBigints`, merge/sort, canonical formatting), number safety conversion.
* **Service**: helpers in `services/alchemy-api.ts` (mock `fetchUrl` / `postData`) covering spam flags, pagination, floor-price fallback.
* **Component**: render picker pieces with `renderWithProviders` from `__tests__/utils/testContexts.tsx` (focus management, chip editing, virtualization hand-off).
* **E2E (Playwright)**: keyboard interactions (combobox), long lists virtualization, mobile viewport, Capacitor UA.
* **Accessibility**: `jest-axe` basic checks; manual VoiceOver/NVDA pass.

---

## 19) Example Usage (Parent)

```tsx
// app/demo/page.tsx
'use client';
import { useState } from 'react';
import { NftPicker } from '@/components/nft-picker/NftPicker';
import type { NftSelectionOutput } from '@/components/nft-picker/NftPicker.types';

export default function Demo() {
  const [selection, setSelection] = useState<NftSelectionOutput | null>(null);

  return (
    <div className="tw-@container tw-max-w-3xl tw-mx-auto tw-p-4">
      <NftPicker
        chain="ethereum"
        outputMode="number" // switch to 'bigint' if needed
        onChange={setSelection}
        hideSpam
        allowAll
        allowRanges
        placeholder="Search by collection name or paste contract address…"
      />
      <pre className="tw-mt-4 tw-text-xs tw-bg-iron-900 tw-border tw-border-iron-800 tw-p-3 tw-rounded">
        {JSON.stringify(selection, null, 2)}
      </pre>
    </div>
  );
}
```

---

## 20) Service helper sketches

> **Note**: Keep these within `services/alchemy-api.ts`; the snippets highlight patterns to follow, not exact code.

### `searchNftCollections`

```ts
export async function searchNftCollections(query: string, chain: SupportedChain = 'ethereum') {
  if (!query.trim()) return [];
  const encoded = encodeURIComponent(query.trim());
  const url = `https://${resolveNetwork(chain)}.g.alchemy.com/nft/v3/${publicEnv.ALCHEMY_API_KEY}/searchContractMetadata?query=${encoded}`;
  const response = await fetchUrl(url); // reuse existing helper that injects auth headers
  return response.contracts?.map(toSuggestion) ?? [];
}
```

* `resolveNetwork` mirrors `getNftsForContractAndOwner`’s path mapping (`eth-mainnet`, `eth-sepolia`, etc.).
* `toSuggestion` should map to `Suggestion` from `NftPicker.types.ts`, filling spam/safelist fields from OpenSea metadata when available.

### `getContractOverview`

```ts
export async function getContractOverview(address: `0x${string}`, chain: SupportedChain = 'ethereum') {
  const url = `https://${resolveNetwork(chain)}.g.alchemy.com/nft/v3/${publicEnv.ALCHEMY_API_KEY}/getContractMetadata?contractAddress=${address}`;
  const meta = await fetchUrl(url);
  return normaliseContract(meta);
}
```

* Wrap checksum/validation with `helpers/Helpers.ts:isValidEthAddress` & `viem`’s `getAddress` if needed.
* Optionally call the REST `getFloorPrice` endpoint and merge values before returning.

### `getTokensMetadata`

```ts
export async function getTokensMetadata(params: { address: `0x${string}`; tokenIds: readonly string[]; chain?: SupportedChain }) {
  if (!params.tokenIds.length) return [];
  const batchUrl = `https://${resolveNetwork(params.chain ?? 'ethereum')}.g.alchemy.com/nft/v3/${publicEnv.ALCHEMY_API_KEY}/getNFTMetadataBatch`;
  const body = {
    tokens: params.tokenIds.slice(0, 100).map((tokenId) => ({ contractAddress: params.address, tokenId })),
  };
  const response = await postData(batchUrl, body); // reuse 6529 API helper so staging auth headers apply
  return response.tokens?.map(toTokenSummary) ?? [];
}
```

* Support pagination windows by accepting an optional `pageKey` argument; mirror that behaviour in `useAlchemyClient` so virtualization can request further pages.
* `toTokenSummary` should return `{ tokenId, name, imageUrl, isSpam, ... }` for the picker.

These helpers keep HTTP logic in one place, can be unit tested, and plug directly into `@tanstack/react-query` hooks.

---

## 21) Security Notes

* Use `publicEnv.ALCHEMY_API_KEY` via `services/alchemy-api.ts` only—never log or expose it directly in the DOM.
* Validate user inputs (addresses, query length, token IDs) with helpers like `isValidEthAddress`.
* Sanitize any text coming from APIs before display (no `dangerouslySetInnerHTML`).
* Apply `AbortController` + retry backoff in service helpers to protect against runaway requests.
* Handle timeouts gracefully (show non-blocking toasts; don’t crash combobox).

---

## 22) Edge Cases & Decisions

* **“All” + additional IDs**: if user adds IDs after choosing All, **switch out of All** and use explicit IDs/ranges. “All” strictly means **empty list**.
* **ERC‑1155**: treat IDs just like 721; **no quantity** UI. We only return token IDs.
* **Unknown image/metadata**: show deterministic placeholder; continue to fetch lazily.
* **Huge ranges**: avoid enumerating; rely on range model + windowed expansion for previews.

---

## 23) Acceptance Criteria

* Keyboard/mouse navigable combobox with suggestions, including spam/verified signals and compact metrics.
* Can select contract by name **or** by pasting 0x address.
* Can switch between **Single**, **Bucket**, **All** modes.
* Bucket supports manual IDs **and** ranges; canonical string is editable and stays in sync with list.
* Virtualized selected list; thumbnails load on demand.
* Every change fires `onChange({ contractAddress, tokenIds })` **without a submit button**.
* **Responsive** via container queries, usable in **mobile/Capacitor**.
* Spam hidden by default but can be revealed.
* API key usage stays confined to `services/alchemy-api.ts` helpers with caching via `@tanstack/react-query`.

---

### Quick rationale links

* Search by collection name/keywords & OpenSea metadata → `searchContractMetadata` (v3). ([Alchemy][1])
* Browse or preview full collection & contract spam flags → `getNFTsForContract`. ([Alchemy][2])
* Fetch specific token(s) lazily in viewport → `getNFTMetadata` & `getNFTMetadataBatch`. ([Alchemy][3])
* Surface floor price → `getFloorPrice` or OpenSea metadata fallback. ([Alchemy][5])
* Hide scams by default; expose toggle → Alchemy spam guidance and flags. ([Alchemy][8])
* Tailwind container queries with `tw-` prefix → plugin guidance. ([GitHub][7])

[1]: https://www.alchemy.com/docs/reference/nft-api-endpoints/nft-api-endpoints/nft-metadata-endpoints/search-contract-metadata-v-3 "Search Contract Metadata | Alchemy Docs"
[2]: https://www.alchemy.com/docs/reference/nft-api-endpoints/nft-api-endpoints/nft-metadata-endpoints/get-nf-ts-for-contract-v-3 "NFTs By Contract | Alchemy Docs"
[3]: https://www.alchemy.com/docs/reference/nft-api-endpoints/nft-api-endpoints/nft-metadata-endpoints/get-nft-metadata-v-3?utm_source=chatgpt.com "NFT Metadata By Token ID"
[4]: https://alchemy.com/docs/data/nft-api/api-reference/nft-metadata-endpoints/get-nft-metadata-batch-v-3?utm_source=chatgpt.com "NFT Metadata By Token ID [Batch]"
[5]: https://www.alchemy.com/docs/reference/getfloorprice-sdk-v3?utm_source=chatgpt.com "getFloorPrice - SDK | Alchemy Docs"
[7]: https://github.com/tailwindlabs/tailwindcss-container-queries?utm_source=chatgpt.com "tailwindlabs/tailwindcss-container-queries: A plugin for ..."
[8]: https://www.alchemy.com/overviews/spam-nfts?utm_source=chatgpt.com "Spam NFTs and How to Fix Them"
