import { TextMatchTransformer } from "@lexical/markdown";
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
  regExp: /@[\w]+/g,
  replace: (node) => {
    return node;
  },
  importRegExp: /@\[[\w]+\]/g,
  replace: (textNode, match) => {
    // Extract handle from @[handle] format  
    const handle = match[0].slice(2, -1); // Remove @[ and ]
    const mentionNode = $createMentionNode(`@${handle}`);
    textNode.replace(mentionNode);
  },
  trigger: "@",
  type: "text-match",
};
