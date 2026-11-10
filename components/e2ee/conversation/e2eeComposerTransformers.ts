import type { EditorState } from "lexical";
import { $convertFromMarkdownString } from "@lexical/markdown";
import { exportDropMarkdown } from "@/components/waves/drops/normalizeDropMarkdown";
import {
  addBlankLinePlaceholders,
  removeBlankLinePlaceholders,
} from "@/components/waves/drops/blankLinePlaceholders";
import { SAFE_MARKDOWN_TRANSFORMERS } from "@/components/drops/create/lexical/transformers/markdownTransformers";
import { EMOJI_TRANSFORMER } from "@/components/drops/create/lexical/transformers/EmojiTransformer";

export const E2EE_COMPOSER_TRANSFORMERS = [
  ...SAFE_MARKDOWN_TRANSFORMERS,
  EMOJI_TRANSFORMER,
];

/** Match ordinary chat's blank-line export without turning a cleared box into a draft. */
export function exportE2eeComposerMarkdown(state: EditorState): string {
  const markdown = removeBlankLinePlaceholders(
    exportDropMarkdown(state, E2EE_COMPOSER_TRANSFORMERS)
  );
  return markdown.trim() ? markdown : "";
}

/** Lexical otherwise removes empty lines when restoring a formatted message. */
export function importE2eeComposerMarkdown(markdown: string): void {
  $convertFromMarkdownString(
    addBlankLinePlaceholders(markdown),
    E2EE_COMPOSER_TRANSFORMERS
  );
}
