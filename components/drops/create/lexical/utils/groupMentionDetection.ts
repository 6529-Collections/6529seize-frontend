import { $getRoot, type EditorState } from "lexical";

import { getMentionedGroupsFromText } from "@/helpers/waves/drop-group-mentions";
import type { ApiDropGroupMention } from "@/generated/models/ApiDropGroupMention";

export const getMentionedGroupsFromEditorState = (
  editorState: EditorState,
  canMentionAll: boolean
): ApiDropGroupMention[] => {
  return editorState.read(() => {
    const content = $getRoot()
      .getAllTextNodes()
      .map((node) => node.getTextContent())
      .join("\n");
    return getMentionedGroupsFromText(content, canMentionAll);
  });
};
