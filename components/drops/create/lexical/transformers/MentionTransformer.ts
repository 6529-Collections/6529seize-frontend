import type { TextMatchTransformer } from "@lexical/markdown";
import { $createMentionNode, $isMentionNode, MentionNode } from "../nodes/MentionNode";

export const MENTION_TRANSFORMER: TextMatchTransformer = {
  dependencies: [MentionNode],
  export: (node) => {
    if (!$isMentionNode(node)) {
      return null;
    }

    const textContent = node.getTextContent();
    return `@[${textContent.substring(1)}]`;
  },
  // Only process bracketed format to avoid conflicts.
  //
  // NOT global: `@lexical/markdown` matches these with `String.prototype.match`
  // and then reads `match.index` to split the text node. With the `g` flag
  // `match` returns every match and `index` is `undefined`, so the split falls
  // back to offset 0 and lands in the wrong place — any mention that is not at
  // the very start of the text was silently left as literal `@[handle]` text.
  regExp: /@\[\w+\]/,
  importRegExp: /@\[\w+\]/,
  replace: (textNode, match) => {
    const [fullMatch] = match;
    const fullText = textNode.getTextContent();
    
    // Only process if the full match is actually in this text node
    if (!fullText.includes(fullMatch)) {
      return;
    }
    
    const handle = fullMatch.slice(2, -1); // Remove @[ and ]
    const mentionNode = $createMentionNode(`@${handle}`);
    textNode.replace(mentionNode);
  },
  trigger: "@",
  type: "text-match",
};
