import { $getRoot, type EditorState } from "lexical";

import { $isGroupMentionNode } from "@/components/drops/create/lexical/nodes/GroupMentionNode";
import { ALL_GROUP_MENTION_TEXT } from "@/helpers/waves/drop-group-mentions";
import { ApiDropGroupMention } from "@/generated/models/ApiDropGroupMention";

export const getMentionedGroupsFromEditorState = (
  editorState: EditorState,
  canMentionAll: boolean
): ApiDropGroupMention[] => {
  if (!canMentionAll) {
    return [];
  }

  return editorState.read(() => {
    const hasAllGroupMentionNode = $getRoot()
      .getAllTextNodes()
      .some(
        (node) =>
          $isGroupMentionNode(node) &&
          node.getTextContent() === ALL_GROUP_MENTION_TEXT
      );

    return hasAllGroupMentionNode ? [ApiDropGroupMention.All] : [];
  });
};
