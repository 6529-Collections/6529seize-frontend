"use client";

import { useId, useState, type KeyboardEvent } from "react";

export default function useRepCategoryNavigation({
  categories,
  enabled,
  onSelect,
}: {
  readonly categories: readonly string[];
  readonly enabled: boolean;
  readonly onSelect: (category: string) => void | Promise<void>;
}) {
  const searchListId = useId();
  const optionIdPrefix = `${searchListId}-option-`;
  const [highlightedCategory, setHighlightedCategory] = useState<string | null>(
    null
  );
  const activeSuggestionIndex = Math.max(
    0,
    categories.indexOf(highlightedCategory ?? "")
  );
  const hasSelectableSuggestions = enabled && categories.length > 0;

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (
      event.nativeEvent.isComposing ||
      event.metaKey ||
      event.ctrlKey ||
      event.altKey ||
      !hasSelectableSuggestions
    ) {
      return;
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const direction = event.key === "ArrowDown" ? 1 : -1;
      const index =
        (activeSuggestionIndex + direction + categories.length) %
        categories.length;
      setHighlightedCategory(categories[index] ?? null);
      document.getElementById(`${optionIdPrefix}${index}`)?.scrollIntoView({
        block: "nearest",
        inline: "nearest",
      });
    } else if (event.key === "Enter") {
      event.preventDefault();
      const category = categories[activeSuggestionIndex];
      if (category) void onSelect(category);
    }
  };

  return {
    searchListId,
    optionIdPrefix,
    activeSuggestionIndex,
    activeSuggestionId: hasSelectableSuggestions
      ? `${optionIdPrefix}${activeSuggestionIndex}`
      : undefined,
    handleSearchKeyDown,
    resetHighlightedCategory: () => setHighlightedCategory(null),
  };
}
