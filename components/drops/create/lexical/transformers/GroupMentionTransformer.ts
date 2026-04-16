import type { TextMatchTransformer } from "@lexical/markdown";

import { ALL_GROUP_MENTION_TEXT } from "@/helpers/waves/drop-group-mentions";
import {
  $createGroupMentionNode,
  $isGroupMentionNode,
  GroupMentionNode,
} from "../nodes/GroupMentionNode";

const GROUP_MENTION_IMPORT_REGEXP = /(^|[^A-Za-z0-9_@])(@all)(?![A-Za-z0-9_@])/;
const GROUP_MENTION_SHORTCUT_REGEXP =
  /(^|[^A-Za-z0-9_@])(@all)(?![A-Za-z0-9_@])$/;

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
    const [, prefix = ""] = match;

    const nodeToReplace = prefix.length
      ? textNode.splitText(prefix.length)[1]
      : textNode;

    if (!nodeToReplace) {
      return;
    }

    const groupMentionNode = $createGroupMentionNode(ALL_GROUP_MENTION_TEXT);
    nodeToReplace.replace(groupMentionNode);
  },
  trigger: "l",
  type: "text-match",
};
