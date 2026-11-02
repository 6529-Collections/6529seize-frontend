"use client";

import {
  createDropGifPickerLoader,
  type CreateDropGifPickerProps,
} from "./CreateDropGifPickerLoader";

const LoadedCreateDropGifPicker = createDropGifPickerLoader.Loaded;

// The Giphy components are only needed once someone opens the picker, so they
// are neither fetched nor mounted until then. The GIF buttons warm the chunk on
// hover and focus, which makes the usual open instant. Until the chunk arrives
// nothing renders, and the composer's own Escape handler still closes the
// pending picker. A chunk that fails to load closes it again so the next click
// retries.
export default function LazyCreateDropGifPicker(
  props: Readonly<CreateDropGifPickerProps>
) {
  const isReady = createDropGifPickerLoader.useIsReady({
    enabled: props.show,
    onError: () => props.setShow(false),
  });

  if (!isReady) {
    return null;
  }

  return <LoadedCreateDropGifPicker {...props} />;
}
