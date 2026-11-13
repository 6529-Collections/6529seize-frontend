"use client";

import Image from "next/image";
import { CUSTOM_EMOJI_ID } from "@/lib/e2ee/emoji-pack";
import { useE2eeEmojis } from "./E2eeEmojiProvider";

/** Known catalog images and bundled native glyphs only. No URLs are resolved. */
export function E2eeEmojiText({
  text,
  size = "md",
}: {
  readonly text: string;
  readonly size?: "sm" | "md";
}) {
  const { sources, native } = useE2eeEmojis();
  const dimension = size === "sm" ? 16 : 24;
  const sizeClass = size === "sm" ? "tw-size-4" : "tw-size-6";
  return text.split(/(:[A-Za-z0-9_+-]{1,62}:)/u).map((part, index) => {
    const id = part.slice(1, -1);
    const shortcode =
      part.startsWith(":") && part.endsWith(":") && CUSTOM_EMOJI_ID.test(id);
    const src = shortcode ? sources.get(id) : undefined;
    const glyph = shortcode ? native.get(id) : undefined;
    return src ? (
      <Image
        key={index}
        src={src}
        alt={part}
        width={dimension}
        height={dimension}
        unoptimized
        className={`tw-inline-block tw-object-contain tw-align-middle ${sizeClass}`}
      />
    ) : (
      (glyph ?? part)
    );
  });
}
