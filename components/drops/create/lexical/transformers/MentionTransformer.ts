import { TextMatchTransformer } from "@lexical/markdown";
import { $createMentionNode, $isMentionNode, MentionNode } from "../nodes/MentionNode";

export const MENTION_TRANSFORMER: TextMatchTransformer = {
  dependencies: [MentionNode],
  export: (node) => {
    if (!$isMentionNode(node)) {
      return null;
    }

    const textContent = node.getTextContent();
    console.log("[MentionTransformer] Export - node text:", textContent);
    console.log("[MentionTransformer] Export - text char codes:", Array.from(textContent).map(c => c.charCodeAt(0)));
    const result = `@[${textContent.substring(1)}]`;
    console.log("[MentionTransformer] Export - result:", result);
    return result;
  },
  // Only process bracketed format to avoid conflicts
  regExp: /@\[[\w]+\]/g,
  importRegExp: /@\[[\w]+\]/g,
  replace: (textNode, match) => {
    const [fullMatch] = match;
    console.log("[MentionTransformer] Replace - processing:", fullMatch);
    console.log("[MentionTransformer] Replace - match object:", match);
    console.log("[MentionTransformer] Replace - match index:", match.index);
    console.log("[MentionTransformer] Replace - textNode content before:", textNode.getTextContent());
    
    const handle = fullMatch.slice(2, -1); // Remove @[ and ]
    console.log("[MentionTransformer] Replace - extracted handle:", handle);
    
    const mentionNode = $createMentionNode(`@${handle}`);
    console.log("[MentionTransformer] Replace - created node text:", mentionNode.getTextContent());
    
    // Get the full text content and find the exact position of our match
    const fullText = textNode.getTextContent();
    const matchStartIndex = fullText.indexOf(fullMatch);
    
    if (matchStartIndex === -1) {
      console.error("[MentionTransformer] Replace - could not find match in text!");
      return;
    }
    
    console.log("[MentionTransformer] Replace - match found at index:", matchStartIndex);
    
    // If the match is at the beginning of the text node
    if (matchStartIndex === 0) {
      // Split after the match and replace the first part
      const endIndex = fullMatch.length;
      if (endIndex < fullText.length) {
        // There's text after the match, split it
        const splitNodes = textNode.splitText(endIndex);
        console.log("[MentionTransformer] Replace - split at index:", endIndex);
        console.log("[MentionTransformer] Replace - first node after split:", textNode.getTextContent());
        console.log("[MentionTransformer] Replace - second node after split:", splitNodes[0]?.getTextContent());
      }
      textNode.replace(mentionNode);
    } else {
      // Match is in the middle or at the end, split before it
      const splitNodes = textNode.splitText(matchStartIndex);
      console.log("[MentionTransformer] Replace - split at index:", matchStartIndex);
      console.log("[MentionTransformer] Replace - first part after split:", textNode.getTextContent());
      console.log("[MentionTransformer] Replace - second part after split:", splitNodes[0]?.getTextContent());
      
      // The node containing our match is now in splitNodes[0]
      const nodeWithMatch = splitNodes[0];
      if (!nodeWithMatch) {
        console.error("[MentionTransformer] Replace - no node after split!");
        return;
      }
      
      // Now split after the match if there's remaining text
      const matchEndIndex = fullMatch.length;
      if (matchEndIndex < nodeWithMatch.getTextContent().length) {
        nodeWithMatch.splitText(matchEndIndex);
        console.log("[MentionTransformer] Replace - split match node at index:", matchEndIndex);
      }
      
      nodeWithMatch.replace(mentionNode);
    }
    
    console.log("[MentionTransformer] Replace - completed");
  },
  trigger: "@",
  type: "text-match",
};
