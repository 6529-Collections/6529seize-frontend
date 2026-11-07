"use client";

import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import type { FocusEvent } from "react";

export type WaveDropActionsInitialFocus = "first" | "last";

/**
 * Stands in for a row's hover toolbar until the row is first hovered or
 * focused, so keyboard users can still reach the toolbar: tabbing onto this
 * button mounts the toolbar and moves focus to its first action, or its last
 * one when tabbing backwards.
 */
export default function WaveDropActionsSentinel({
  onActivate,
}: {
  readonly onActivate: (initialFocus: WaveDropActionsInitialFocus) => void;
}) {
  const locale = useBrowserLocale();

  const handleFocus = (event: FocusEvent<HTMLButtonElement>) => {
    const previous = event.relatedTarget;
    const isFromLaterElement =
      previous instanceof Node &&
      (event.currentTarget.compareDocumentPosition(previous) &
        Node.DOCUMENT_POSITION_FOLLOWING) !==
        0;
    onActivate(isFromLaterElement ? "last" : "first");
  };

  return (
    <button
      type="button"
      className="tw-sr-only"
      aria-label={t(locale, "waves.drop.actions.menuLabel")}
      onFocus={handleFocus}
      onClick={() => onActivate("first")}
    />
  );
}
