import type { TextMatchTransformer } from "@lexical/markdown";
import { EmojiNode } from "../nodes/EmojiNode";
import { $applyNodeReplacement } from "lexical";
// The non-global twin: `@lexical/markdown` reads `match.index`, which a global
// regex does not provide. EMOJI_MATCH_REGEX keeps `g` for EmojiPlugin's matchAll.
import { EMOJI_SINGLE_MATCH_REGEX } from "../plugins/emoji/EmojiPlugin";

export const EMOJI_TRANSFORMER: TextMatchTransformer = {
  dependencies: [EmojiNode],

  export: (node): string | null => {
    if (node instanceof EmojiNode) {
      return `:${node.__emojiId}:`;
    }
    return null;
  },

  importRegExp: EMOJI_SINGLE_MATCH_REGEX,
  regExp: EMOJI_SINGLE_MATCH_REGEX,

  replace: (textNode, match) => {
    const [, emojiId] = match;
    const emojiNode = $applyNodeReplacement(new EmojiNode(emojiId!));
    textNode.replace(emojiNode);
  },

  trigger: "space",
  type: "text-match",
};
