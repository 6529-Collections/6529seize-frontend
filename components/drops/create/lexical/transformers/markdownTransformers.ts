import { TRANSFORMERS } from "@lexical/markdown";

const UNDERSCORE_TAGS = new Set(["__", "___", "_"]);

// Strip underscore-triggered shortcuts so pasting code keeps underscores intact.
export const SAFE_MARKDOWN_TRANSFORMERS = TRANSFORMERS.filter((transformer) => {
  if (typeof transformer !== "object" || transformer === null) {
    return true;
  }

  const maybeTag = (transformer as { tag?: unknown }).tag;
  if (typeof maybeTag !== "string") {
    return true;
  }

  return !UNDERSCORE_TAGS.has(maybeTag);
});
