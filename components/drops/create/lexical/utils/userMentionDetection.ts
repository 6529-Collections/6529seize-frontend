import { $getRoot, type EditorState } from "lexical";

import { $isMentionNode } from "@/components/drops/create/lexical/nodes/MentionNode";
import type { MentionedUser } from "@/entities/IDrop";

export type EditorMentionedUser = Omit<MentionedUser, "current_handle">;

/**
 * Reads the user mentions straight out of the editor, mirroring
 * `getMentionedGroupsFromEditorState`.
 *
 * The mention nodes are the source of truth: each one carries the profile id it
 * was created with, and that id survives the editor-state JSON round trip a
 * draft is persisted through. A side registry of "users picked from the
 * autocomplete this session" does not survive it, so anything restored from a
 * draft used to submit with no `mentioned_users` entry — the tag rendered as
 * literal `@[handle]` text and the person was never notified.
 *
 * Nodes whose profile id is null (e.g. produced by a markdown import that could
 * not resolve the handle) are skipped: there is no id to send, and inventing one
 * would be worse than leaving the mention unregistered.
 */
export const getMentionedUsersFromEditorState = (
  editorState: EditorState
): EditorMentionedUser[] => {
  return editorState.read(() => {
    const seenProfileIds = new Set<string>();
    const mentions: EditorMentionedUser[] = [];

    for (const node of $getRoot().getAllTextNodes()) {
      if (!$isMentionNode(node)) {
        continue;
      }
      const mentionedProfileId = node.getMentionedProfileId();
      if (!mentionedProfileId || seenProfileIds.has(mentionedProfileId)) {
        continue;
      }
      // Mention nodes render as "@handle"; the stored token is "@[handle]".
      const handleInContent = node.getTextContent().replace(/^@/, "");
      if (!handleInContent) {
        continue;
      }
      seenProfileIds.add(mentionedProfileId);
      mentions.push({
        mentioned_profile_id: mentionedProfileId,
        handle_in_content: handleInContent,
      });
    }

    return mentions;
  });
};

/**
 * Merges editor-derived mentions over a session registry, preferring the editor
 * because it is the one that survives a draft restore. Registry entries are kept
 * so a mention that is momentarily absent from the editor state (mid-edit) is not
 * dropped from a part that still references it.
 */
export const mergeMentionedUsers = (
  editorMentions: readonly EditorMentionedUser[],
  registryMentions: readonly EditorMentionedUser[]
): EditorMentionedUser[] => {
  const byProfileId = new Map<string, EditorMentionedUser>();
  for (const mention of [...registryMentions, ...editorMentions]) {
    if (mention.mentioned_profile_id) {
      byProfileId.set(mention.mentioned_profile_id, mention);
    }
  }
  return [...byProfileId.values()];
};
