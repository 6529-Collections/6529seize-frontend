import { TextMatchTransformer } from "@lexical/markdown";
import { $createMentionNode, $isMentionNode, MentionNode } from "../nodes/MentionNode";

export const MENTION_TRANSFORMER: TextMatchTransformer = {
  dependencies: [MentionNode],
  export: (node) => {
    if (!$isMentionNode(node)) {
      return null;
    }

    const textContent = node.getTextContent();
    // textContent is already "@handle", so we need to wrap it
    return `@[${textContent.substring(1)}]`;
  },
  // Match user input format for creating mentions
  regExp: /@[\w]+/g,
  // Match stored bracketed format for importing existing mentions
  importRegExp: /@\[[^\]]+\]/g,
  replace: (textNode, match) => {
    const [fullMatch] = match;
    let handle: string;
    
    // Handle both formats: @username (user input) and @[username] (stored format)
    if (fullMatch.startsWith('@[') && fullMatch.endsWith(']')) {
      // Extract handle from @[handle] format
      handle = fullMatch.slice(2, -1); // Remove @[ and ]
    } else {
      // Extract handle from @handle format
      handle = fullMatch.slice(1); // Remove @
    }
    
    // Create mention node with @handle format
    const mentionNode = $createMentionNode(`@${handle}`);
    textNode.replace(mentionNode);
  },
  trigger: "@",
  type: "text-match",
};
