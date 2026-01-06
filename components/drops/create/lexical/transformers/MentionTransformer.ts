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
  // Only process bracketed format to avoid conflicts
  regExp: /@\[\w+\]/g,
  importRegExp: /@\[\w+\]/g,
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
