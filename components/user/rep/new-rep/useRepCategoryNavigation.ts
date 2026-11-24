"use client";

import { useId, useLayoutEffect, useState, type KeyboardEvent } from "react";

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
  const activeSuggestionIndex =
    highlightedCategory === null ? 0 : categories.indexOf(highlightedCategory);
  const hasSelectableSuggestions = enabled && categories.length > 0;
  const activeSuggestionId =
    hasSelectableSuggestions && activeSuggestionIndex >= 0
      ? `${optionIdPrefix}${activeSuggestionIndex}`
      : undefined;

  // Reordered results must reveal the rendered active option before paint.
  useLayoutEffect(() => {
    if (!activeSuggestionId) return;
    document.getElementById(activeSuggestionId)?.scrollIntoView({
      block: "nearest",
      inline: "nearest",
    });
  }, [activeSuggestionId]);

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
      const currentIndex =
        activeSuggestionIndex < 0 && direction < 0 ? 0 : activeSuggestionIndex;
      const index =
        (currentIndex + direction + categories.length) % categories.length;
      setHighlightedCategory(categories[index] ?? null);
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
    activeSuggestionId,
    handleSearchKeyDown,
    resetHighlightedCategory: () => setHighlightedCategory(null),
  };
}
