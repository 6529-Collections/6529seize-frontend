# NFT Picker Quick Checklist

- Contract-scoped outputs with `tokenIdsRaw` mirrored for parity.
- Internal selection uses `bigint`; output mode controls `number[]` vs `string[]`.
- `tokenIdsRaw` parity: number mode emits `number[]`, bigint mode emits `string[]` plus `bigint[]` mirror.
- All Alchemy traffic remains server-side via `services/alchemy-api.ts` helpers; no client API key exposure.
- Spam collections hidden by default with optional reveal toggle.
- Component uses Tailwind container queries for responsive layout.
- Keyboard and accessibility support for combobox, lists, and controls.
- Virtualized suggestion and token lists with windowed range expansion.
- “Edit as text” canonical ranges stay synced with chips and parsing logic.
- No submit button; always emit changes through `onChange`.
- Mobile/Capacitor touch targets meet minimum sizing.

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | `NftPickerValue` | – | Controlled value (contract, selected IDs, all flag). |
| `defaultValue` | `Partial<NftPickerValue>` | – | Initial value for uncontrolled usage. |
| `onChange` | `(selection: NftPickerSelection \| null) => void` | required | Fired on contract or selection updates. Emits `null` when the contract is cleared. |
| `onContractChange` | `(meta: ContractOverview \| null) => void` | – | Invoked when the active contract metadata changes. |
| `chain` | `'ethereum'` | `'ethereum'` | Chain identifier passed to the Alchemy client. |
| `outputMode` | `'number' \| 'bigint'` | `'number'` | Determines emitted `tokenIds` representation. |
| `hideSpam` | `boolean` | `true` | Whether to hide spam suggestions by default. |
| `allowAll` | `boolean` | `true` | Enables the “All tokens” mode. |
| `allowRanges` | `boolean` | `true` | Enables bucket mode with range parsing. |
| `debounceMs` | `number` | `250` | Debounce duration for search queries. |
| `overscan` | `number` | `8` | Overscan applied to virtualized lists. |
| `placeholder` | `string` | Search placeholder text. |
| `className` | `string` | – | Optional root className. |
| `renderTokenExtra` | `(tokenId: bigint, metadata?: TokenMetadata) => ReactNode` | – | Custom renderer appended to each token row. |

## Events

- `onChange(selection)` — triggered whenever the contract selection or token list changes. Emits empty arrays when mode is `all`.
- `onContractChange(meta)` — exposes the resolved contract metadata or `null` when cleared.

## Example Usage

```tsx
"use client";
import { useState } from "react";
import { NftPicker } from "@/components/nft-picker/NftPicker";
import type { NftPickerSelection } from "@/components/nft-picker/NftPicker.types";

export default function Demo() {
  const [selection, setSelection] = useState<NftPickerSelection | null>(null);

  return (
    <div className="tw-@container tw-max-w-3xl tw-space-y-4">
      <NftPicker onChange={setSelection} allowAll allowRanges />
      <pre className="tw-rounded tw-bg-iron-900 tw-p-3 tw-text-xs tw-text-iron-200">
        {JSON.stringify(selection, null, 2)}
      </pre>
    </div>
  );
}
```

## Edge Cases & Limitations

- `outputMode="number"` suppresses `onChange` when unsafe token IDs are present; surface guidance to switch to bigint mode.
- `parseTokenExpressionToBigints` throws an array of `ParseError` objects describing invalid segments. Bucket mode shows these messages beneath the textarea.
- Very large ranges rely on windowed expansion; virtualization assumes totals fit within JavaScript `number` limits.
- Contract metadata is fetched lazily; suggestions hydrate cache entries but floor price may be missing when marketplaces do not expose it.
- Spam toggle only affects the current query session; subsequent searches revert to the configured default.
