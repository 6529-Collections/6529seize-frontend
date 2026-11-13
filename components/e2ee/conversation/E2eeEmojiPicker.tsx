"use client";

import { useCallback, useState } from "react";

import LazyEmojiPicker, {
  type EmojiPickerSelection,
} from "@/components/waves/LazyEmojiPicker";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { CUSTOM_EMOJI_ID } from "@/lib/e2ee/emoji-pack";
import { EmojiPickerControl } from "@/components/waves/CreateDropEmojiPicker";
import { E2eeDialog } from "../ui/E2eeDialog";
import { useE2eeEmojis } from "./E2eeEmojiProvider";

function emojiSelectionText(emoji: EmojiPickerSelection): string | null {
  if (emoji.native) return emoji.native;
  return emoji.id && CUSTOM_EMOJI_ID.test(emoji.id) ? `:${emoji.id}:` : null;
}

export function E2eeEmojiPicker({
  open,
  onClose,
  onSelect,
}: {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onSelect: (text: string) => void;
}) {
  const locale = useBrowserLocale();
  const { categories, failed, retry } = useE2eeEmojis();
  const [columns, setColumns] = useState(6);
  const containerRef = useCallback((container: HTMLDivElement | null) => {
    if (!container) return;
    // Emoji Mart's dynamicWidth includes its 28px padding/sidebar in the grid
    // calculation, which clips the last column. Reserve that space explicitly.
    const resize = () =>
      setColumns(Math.max(1, Math.floor((container.clientWidth - 28) / 36)));
    resize();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);
  return (
    <E2eeDialog
      open={open}
      onClose={onClose}
      title={t(locale, "e2ee.emoji.title")}
      closeLabel={t(locale, "e2ee.action.close")}
    >
      {failed ? (
        <output className="tw-mb-3 tw-block tw-text-sm tw-text-iron-400">
          {t(locale, "e2ee.emoji.customUnavailable")}{" "}
          <button
            type="button"
            onClick={retry}
            className="tw-rounded-md tw-border-0 tw-bg-transparent tw-text-primary-300 tw-underline focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
          >
            {t(locale, "e2ee.action.retry")}
          </button>
        </output>
      ) : null}
      {open ? (
        <div ref={containerRef} className="tw-flex tw-justify-center">
          <LazyEmojiPicker
            customEmojis={categories}
            privateMode
            perLine={columns}
            autoFocus
            loadingLabel={t(locale, "e2ee.emoji.loading")}
            errorLabel={t(locale, "e2ee.emoji.unavailable")}
            onEmojiSelect={(emoji) => {
              const text = emojiSelectionText(emoji);
              if (text) onSelect(text);
              onClose();
            }}
          />
        </div>
      ) : null}
    </E2eeDialog>
  );
}

/** Keep the normal composer presentation without recording private emoji use. */
export function E2eeComposerEmojiPicker({
  onOpen,
  onSelect,
  onClosedAfterSelect,
}: {
  readonly onOpen: () => void;
  readonly onSelect: (text: string) => void;
  /** The mobile panel closed after a selection: restore the caret. */
  readonly onClosedAfterSelect?: (() => void) | undefined;
}) {
  const locale = useBrowserLocale();
  const { categories, failed, retry } = useE2eeEmojis();
  return (
    <EmojiPickerControl
      verticalAlignment="center"
      label={t(locale, "e2ee.emoji.insert")}
      onOpen={onOpen}
      onClosedAfterSelect={onClosedAfterSelect}
      onEmojiSelect={(emoji) => {
        const text = emojiSelectionText(emoji);
        if (text) onSelect(text);
      }}
      pickerProps={{
        customEmojis: categories,
        privateMode: true,
        loadingLabel: t(locale, "e2ee.emoji.loading"),
        errorLabel: t(locale, "e2ee.emoji.unavailable"),
      }}
      pickerNotice={
        failed ? (
          <output className="tw-m-2 tw-block tw-text-sm tw-text-iron-400">
            {t(locale, "e2ee.emoji.customUnavailable")}{" "}
            <button
              type="button"
              onClick={retry}
              className="tw-border-0 tw-bg-transparent tw-text-primary-300 tw-underline"
            >
              {t(locale, "e2ee.action.retry")}
            </button>
          </output>
        ) : null
      }
    />
  );
}
