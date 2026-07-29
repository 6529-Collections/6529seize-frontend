import { $getRoot, type EditorState } from "lexical";

import { getMentionedGroupsFromText } from "@/helpers/waves/drop-group-mentions";
import type { ApiDropGroupMention } from "@/generated/models/ApiDropGroupMention";
import { isInsideCodeOrLink } from "./mentionContext";

export const getMentionedGroupsFromEditorState = (
  editorState: EditorState,
  canMentionAll: boolean
): ApiDropGroupMention[] => {
  return editorState.read(() => {
    const content = $getRoot()
      .getAllTextNodes()
      .filter((node) => !isInsideCodeOrLink(node))
      .map((node) => node.getTextContent())
      .join("\n");
    return getMentionedGroupsFromText(content, canMentionAll);
  });
};
