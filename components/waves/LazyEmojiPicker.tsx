"use client";

import { useEffect, useState, type ComponentType } from "react";

import {
  useEmoji,
  type EmojiCategory,
  type EmojiMartData,
} from "@/contexts/EmojiContext";

import { notifyReactionHistoryChange } from "@/helpers/reactions/reactionHistory";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { prepareEmojiMartData } from "./prepareEmojiMartData";

export interface EmojiPickerSelection {
  native?: string | undefined;
  id?: string | undefined;
}

interface EmojiMartPickerProps {
  readonly theme: "dark";
  readonly data: EmojiMartData;
  readonly onEmojiSelect: (emoji: EmojiPickerSelection) => void;
  readonly custom: EmojiCategory[];
  readonly categories: string[];
  readonly categoryIcons: Record<string, { src: string }>;
  readonly autoFocus?: boolean | undefined;
  readonly maxFrequentRows?: number | undefined;
  readonly perLine?: number | undefined;
}

interface LazyEmojiPickerProps {
  readonly onEmojiSelect: (emoji: EmojiPickerSelection) => void;
  readonly autoFocus?: boolean | undefined;
  /** Encrypted chats supply only inline assets and do not save reaction history. */
  readonly customEmojis?: EmojiCategory[] | undefined;
  readonly privateMode?: boolean | undefined;
  readonly perLine?: number | undefined;
  readonly loadingLabel?: string | undefined;
  readonly errorLabel?: string | undefined;
}

type EmojiMartPickerComponent = ComponentType<EmojiMartPickerProps>;
type EmojiPickerLoadStatus = "loading" | "ready" | "error";
interface EmojiPickerLoadState {
  readonly Picker: EmojiMartPickerComponent | null;
  readonly status: EmojiPickerLoadStatus;
}

let emojiMartPickerPromise: Promise<EmojiMartPickerComponent> | null = null;

const loadEmojiMartPicker = async (): Promise<EmojiMartPickerComponent> => {
  emojiMartPickerPromise ??= (async () => {
    try {
      const emojiMartReactModule = await import("@emoji-mart/react");
      return emojiMartReactModule.default as EmojiMartPickerComponent;
    } catch (error) {
      emojiMartPickerPromise = null;
      throw error;
    }
  })();

  return emojiMartPickerPromise;
};

export default function LazyEmojiPicker({
  onEmojiSelect,
  autoFocus,
  customEmojis,
  privateMode = false,
  perLine,
  loadingLabel,
  errorLabel,
}: LazyEmojiPickerProps) {
  const locale = useBrowserLocale();
  const {
    categories,
    categoryIcons,
    emojiMap,
    emojiData,
    loadCustomEmojis,
    loadNativeEmojis,
  } = useEmoji();
  const [pickerLoadState, setPickerLoadState] = useState<EmojiPickerLoadState>({
    Picker: null,
    status: "loading",
  });

  useEffect(() => {
    const loadState = { cancelled: false };

    void (async () => {
      try {
        const [nativeEmojiData, custom] = await Promise.all([
          loadNativeEmojis(),
          customEmojis === undefined
            ? loadCustomEmojis()
            : Promise.resolve(customEmojis),
        ]);
        const PickerComponent = await loadEmojiMartPicker();
        if (loadState.cancelled) return;
        if (nativeEmojiData)
          await prepareEmojiMartData(nativeEmojiData, custom);
        if (!loadState.cancelled) {
          setPickerLoadState(
            nativeEmojiData
              ? { Picker: PickerComponent, status: "ready" }
              : { Picker: null, status: "error" }
          );
        }
      } catch (error) {
        if (!loadState.cancelled) {
          setPickerLoadState({ Picker: null, status: "error" });
        }
        console.error("Error loading emoji picker:", error);
      }
    })();

    return () => {
      loadState.cancelled = true;
    };
  }, [loadCustomEmojis, loadNativeEmojis, customEmojis]);

  const Picker = pickerLoadState.Picker;

  if (!Picker || !emojiData) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="tw-p-3 tw-text-sm tw-text-iron-300"
      >
        {pickerLoadState.status === "error"
          ? (errorLabel ?? t(locale, "emoji.picker.unavailable"))
          : (loadingLabel ?? t(locale, "emoji.picker.loading"))}
      </div>
    );
  }

  return (
    <Picker
      theme="dark"
      data={emojiData}
      onEmojiSelect={(emoji) => {
        // Emoji Mart has already recorded this selection. Notify same-tab
        // quick reactions, including when the selection came from a composer.
        if (!privateMode) notifyReactionHistoryChange();
        onEmojiSelect(emoji);
      }}
      custom={customEmojis ?? emojiMap}
      categories={
        privateMode
          ? categories.filter((category) => category !== "frequent")
          : categories
      }
      categoryIcons={privateMode ? {} : categoryIcons}
      autoFocus={autoFocus}
      maxFrequentRows={privateMode ? 0 : undefined}
      perLine={perLine}
    />
  );
}
