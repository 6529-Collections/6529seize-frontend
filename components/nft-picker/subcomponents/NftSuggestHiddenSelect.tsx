import { useId, type ChangeEvent } from "react";
import type { Suggestion } from "../types";
import { getSuggestionOptionLabel } from "../utils/formatting";

interface NftSuggestNativeSelectProps {
  readonly items: Suggestion[];
  readonly onSelect: (item: Suggestion) => void;
}

const ACCESSIBLE_SELECT_PLACEHOLDER_VALUE = "__nft_suggest_placeholder__";
const ACCESSIBLE_SELECT_MAX_SIZE = 10;

type SuggestionOptionValue =
  | typeof ACCESSIBLE_SELECT_PLACEHOLDER_VALUE
  | Suggestion["address"];

const isSuggestionAddress = (
  value: SuggestionOptionValue
): value is Suggestion["address"] => value !== ACCESSIBLE_SELECT_PLACEHOLDER_VALUE;

export function NftSuggestHiddenSelect({ items, onSelect }: NftSuggestNativeSelectProps) {
  const nativeSelectDescriptionId = useId();
  const nativeSelectSize = Math.min(Math.max(items.length || 0, 1), ACCESSIBLE_SELECT_MAX_SIZE);
  const hasSuggestions = items.length > 0;

  const handleNativeSelectChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = event.target.value as SuggestionOptionValue;
    if (!isSuggestionAddress(selectedValue)) {
      return;
    }
    const selectedSuggestion = items.find((item) => item.address === selectedValue);
    if (selectedSuggestion) {
      onSelect(selectedSuggestion);
    }
  };

  return (
    <>
      <p id={nativeSelectDescriptionId} className="tw-sr-only">
        Choose an NFT collection from the following suggestions.
      </p>
      <select
        id="nft-picker-suggest-list"
        aria-label="NFT collections suggestions"
        aria-describedby={nativeSelectDescriptionId}
        className="tw-sr-only"
        size={nativeSelectSize}
        defaultValue={ACCESSIBLE_SELECT_PLACEHOLDER_VALUE}
        onChange={handleNativeSelectChange}
      >
        <option value={ACCESSIBLE_SELECT_PLACEHOLDER_VALUE} disabled>
          {hasSuggestions ? "Select a suggestion" : "No suggestions available"}
        </option>
        {items.map((suggestion) => (
          <option
            key={suggestion.address}
            value={suggestion.address}
            disabled={suggestion.tokenType !== "ERC721"}
          >
            {getSuggestionOptionLabel(suggestion)}
          </option>
        ))}
      </select>
    </>
  );
}
