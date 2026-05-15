"use client";

import type { ReactNode } from "react";
import { createContext, useContext, useMemo } from "react";

interface CreateDropEmojiPickerLayer {
  readonly desktopZIndex: number;
  readonly mobileZIndexClassName: string;
}

const DEFAULT_CREATE_DROP_EMOJI_PICKER_LAYER: CreateDropEmojiPickerLayer = {
  desktopZIndex: 1000,
  mobileZIndexClassName: "tw-z-[1010]",
};

const CreateDropEmojiPickerLayerContext =
  createContext<CreateDropEmojiPickerLayer>(
    DEFAULT_CREATE_DROP_EMOJI_PICKER_LAYER
  );

export function CreateDropEmojiPickerLayerProvider({
  children,
  desktopZIndex = DEFAULT_CREATE_DROP_EMOJI_PICKER_LAYER.desktopZIndex,
  mobileZIndexClassName = DEFAULT_CREATE_DROP_EMOJI_PICKER_LAYER.mobileZIndexClassName,
}: {
  readonly children: ReactNode;
  readonly desktopZIndex?: number | undefined;
  readonly mobileZIndexClassName?: string | undefined;
}) {
  const value = useMemo(
    () => ({ desktopZIndex, mobileZIndexClassName }),
    [desktopZIndex, mobileZIndexClassName]
  );

  return (
    <CreateDropEmojiPickerLayerContext.Provider value={value}>
      {children}
    </CreateDropEmojiPickerLayerContext.Provider>
  );
}

export function useCreateDropEmojiPickerLayer(): CreateDropEmojiPickerLayer {
  return useContext(CreateDropEmojiPickerLayerContext);
}
