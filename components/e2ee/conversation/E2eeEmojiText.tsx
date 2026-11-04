"use client";

import Image from "next/image";
import { useE2eeEmojis } from "./E2eeEmojiProvider";

/** Only known catalog shortcodes become inline images. No URLs are resolved. */
export function E2eeEmojiText({ text }: { readonly text: string }) {
  const { sources } = useE2eeEmojis();
  return text.split(/(:[A-Za-z0-9_+-]{1,62}:)/u).map((part, index) => {
    const src = part.startsWith(":")
      ? sources.get(part.slice(1, -1))
      : undefined;
    return src ? (
      <Image
        key={index}
        src={src}
        alt={part}
        width={24}
        height={24}
        unoptimized
        className="tw-inline-block tw-size-6 tw-object-contain tw-align-middle"
      />
    ) : (
      part
    );
  });
}
