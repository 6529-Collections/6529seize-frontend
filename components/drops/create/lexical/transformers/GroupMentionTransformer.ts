import type { TextMatchTransformer } from "@lexical/markdown";

import {
  getMentionedGroupsFromText,
  GROUP_MENTION_TEXT,
} from "@/helpers/waves/drop-group-mentions";
import {
  $createGroupMentionNode,
  $isGroupMentionNode,
  GroupMentionNode,
} from "../nodes/GroupMentionNode";

const GROUP_MENTION_IMPORT_REGEXP =
  /(^|[^A-Za-z0-9_@])(@(?:all|contributors|admins|devs6529))(?![A-Za-z0-9_@])/i;
const GROUP_MENTION_SHORTCUT_REGEXP =
  /(^|[^A-Za-z0-9_@])(@(?:all|contributors|admins|devs6529))(?![A-Za-z0-9_@])$/i;

export const GROUP_MENTION_TRANSFORMER: TextMatchTransformer = {
  dependencies: [GroupMentionNode],
  export: (node) => {
    if (!$isGroupMentionNode(node)) {
      return null;
    }

    return node.getTextContent();
  },
  regExp: GROUP_MENTION_SHORTCUT_REGEXP,
  importRegExp: GROUP_MENTION_IMPORT_REGEXP,
  replace: (textNode, match) => {
    const [, prefix = "", token = ""] = match;

    const nodeToReplace = prefix.length
      ? textNode.splitText(prefix.length)[1]
      : textNode;

    if (!nodeToReplace) {
      return;
    }

    const [group] = getMentionedGroupsFromText(token, true);
    if (!group) return;
    const groupMentionNode = $createGroupMentionNode(GROUP_MENTION_TEXT[group]);
    nodeToReplace.replace(groupMentionNode);
  },
  trigger: "l",
  type: "text-match",
};
