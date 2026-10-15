import type { ComponentProps } from "react";

import { createLazyComponentLoader } from "@/components/utils/lazy-load/createLazyComponentLoader";

import type CreateDropGifPicker from "./CreateDropGifPicker";

export type CreateDropGifPickerProps = ComponentProps<
  typeof CreateDropGifPicker
>;

// Kept apart from LazyCreateDropGifPicker so the GIF buttons can warm the
// Giphy chunk on hover or focus without importing the picker itself.
export const createDropGifPickerLoader =
  createLazyComponentLoader<CreateDropGifPickerProps>(
    () => import("./CreateDropGifPicker")
  );
