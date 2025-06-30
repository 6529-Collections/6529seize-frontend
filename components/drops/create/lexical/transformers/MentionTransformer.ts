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
  // Only process bracketed format to avoid conflicts
  regExp: /@\[[\w]+\]/g,
  importRegExp: /@\[[\w]+\]/g,
  replace: (textNode, match) => {
    const [fullMatch] = match;
    const fullText = textNode.getTextContent();
    
    console.log("🔥 [MentionTransformer] REPLACE CALLED!");
    console.log("🔥 Full match found by regex:", JSON.stringify(fullMatch));
    console.log("🔥 Match object:", match);
    console.log("🔥 Match index:", match.index);
    console.log("🔥 TextNode content:", JSON.stringify(fullText));
    console.log("🔥 TextNode length:", fullText.length);
    console.log("🔥 Does textNode contain fullMatch?", fullText.includes(fullMatch));
    
    // Only process if the full match is actually in this text node
    if (!fullText.includes(fullMatch)) {
      console.log("🔥 SKIPPING: fullMatch not found in textNode");
      return;
    }
    
    console.log("🔥 PROCESSING: Creating mention node");
    const handle = fullMatch.slice(2, -1); // Remove @[ and ]
    const mentionNode = $createMentionNode(`@${handle}`);
    textNode.replace(mentionNode);
    console.log("🔥 COMPLETED: Replaced textNode with mentionNode");
  },
  trigger: "@",
  type: "text-match",
};
