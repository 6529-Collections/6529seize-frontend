import {
  $getRoot,
  $isElementNode,
  $isLineBreakNode,
  $isTextNode,
  type EditorState,
  type ElementNode,
  type LexicalNode,
} from "lexical";

import { getMentionedGroupsFromText } from "@/helpers/waves/drop-group-mentions";
import type { ApiDropGroupMention } from "@/generated/models/ApiDropGroupMention";
import { isInsideCodeOrLink } from "./mentionContext";

const getInlineText = (node: LexicalNode): string => {
  if ($isTextNode(node)) {
    return isInsideCodeOrLink(node) ? " " : node.getTextContent();
  }
  if ($isLineBreakNode(node)) {
    return "\n";
  }
  if ($isElementNode(node)) {
    return node.getChildren().map(getInlineText).join("");
  }

  // Keep custom/decorator node text token-delimited so it cannot combine with
  // adjacent plain text into a different group mention.
  const text = node.getTextContent();
  return text ? ` ${text} ` : " ";
};

const getMentionTextSegments = (element: ElementNode): string[] => {
  const segments: string[] = [];
  let inlineText = "";

  const flushInlineText = () => {
    if (inlineText) {
      segments.push(inlineText);
      inlineText = "";
    }
  };

  for (const child of element.getChildren()) {
    if ($isElementNode(child) && !child.isInline()) {
      flushInlineText();
      segments.push(...getMentionTextSegments(child));
    } else {
      inlineText += getInlineText(child);
    }
  }
  flushInlineText();

  return segments;
};

export const getMentionedGroupsFromEditorState = (
  editorState: EditorState,
  canMentionAdminOnlyGroups: boolean
): ApiDropGroupMention[] => {
  return editorState.read(() => {
    const content = getMentionTextSegments($getRoot()).join("\n");
    return getMentionedGroupsFromText(content, canMentionAdminOnlyGroups);
  });
};
