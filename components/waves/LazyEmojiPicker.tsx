"use client";

import { useEffect, useState, type ComponentType } from "react";

import {
  useEmoji,
  type EmojiCategory,
  type EmojiMartData,
} from "@/contexts/EmojiContext";

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
}

interface LazyEmojiPickerProps {
  readonly onEmojiSelect: (emoji: EmojiPickerSelection) => void;
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
}: LazyEmojiPickerProps) {
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
        const [nativeEmojiData, PickerComponent] = await Promise.all([
          loadNativeEmojis(),
          loadCustomEmojis().then(() => loadEmojiMartPicker()),
        ]);
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
  }, [loadCustomEmojis, loadNativeEmojis]);

  const Picker = pickerLoadState.Picker;

  if (!Picker || !emojiData) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="tw-p-3 tw-text-sm tw-text-iron-300"
      >
        {pickerLoadState.status === "error"
          ? "Emoji picker is unavailable."
          : "Loading emoji picker..."}
      </div>
    );
  }

  return (
    <Picker
      theme="dark"
      data={emojiData}
      onEmojiSelect={onEmojiSelect}
      custom={emojiMap}
      categories={categories}
      categoryIcons={categoryIcons}
    />
  );
}
