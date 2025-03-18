import { TextMatchTransformer } from "@lexical/markdown";
import { EmojiNode } from "../nodes/EmojiNode";
import { $applyNodeReplacement } from "lexical";

export const EMOJI_TRANSFORMER: TextMatchTransformer = {
  dependencies: [EmojiNode],

  // ✅ Export function to convert EmojiNode into ":id:" format
  export: (node): string | null => {
    if (node instanceof EmojiNode) {
      return `:${node.__emojiId}:`;
    }
    return null;
  },

  // ✅ Regex pattern for detecting ":id:" in imported text
  importRegExp: /:([a-zA-Z0-9_]+):/g,

  // ✅ Replace matched text with an EmojiNode
  replace: (textNode, match) => {
    const [, emojiId] = match;
    const emojiNode = $applyNodeReplacement(new EmojiNode(emojiId));
    textNode.replace(emojiNode);
  },

  // ✅ Defines when the transformation should trigger (e.g., on space)
  trigger: "space",

  // ✅ Defines the pattern that activates transformation inside Lexical
  regExp: /:([a-zA-Z0-9_]+):/,
  type: "text-match",
};
