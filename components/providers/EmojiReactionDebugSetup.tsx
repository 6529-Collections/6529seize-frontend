"use client";

import { enableEmojiReactionDebugFromUrl } from "@/helpers/reactions/emojiReactionDebug";
import { useEffect } from "react";

export default function EmojiReactionDebugSetup() {
  useEffect(() => {
    enableEmojiReactionDebugFromUrl();
  }, []);

  return null;
}
