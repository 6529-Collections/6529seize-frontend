import { SAFE_MARKDOWN_TRANSFORMERS } from "@/components/drops/create/lexical/transformers/markdownTransformers";
import { EMOJI_TRANSFORMER } from "@/components/drops/create/lexical/transformers/EmojiTransformer";
import { GROUP_MENTION_TRANSFORMER } from "@/components/drops/create/lexical/transformers/GroupMentionTransformer";
import { HASHTAG_TRANSFORMER } from "@/components/drops/create/lexical/transformers/HastagTransformer";
import { IMAGE_TRANSFORMER } from "@/components/drops/create/lexical/transformers/ImageTransformer";
import { MENTION_TRANSFORMER } from "@/components/drops/create/lexical/transformers/MentionTransformer";
import { WAVE_MENTION_TRANSFORMER } from "@/components/drops/create/lexical/transformers/WaveMentionTransformer";
import { exportDropMarkdown } from "@/components/waves/drops/normalizeDropMarkdown";
import { normalizeTypedEmojiShortcuts } from "@/helpers/waves/typed-emoji-shortcuts";
import type { EditorState } from "lexical";

export const exportComposerMarkdown = (
  editorState: EditorState,
  canMentionAll: boolean
) =>
  normalizeTypedEmojiShortcuts(
    exportDropMarkdown(editorState, [
      ...SAFE_MARKDOWN_TRANSFORMERS,
      MENTION_TRANSFORMER,
      ...(canMentionAll ? [GROUP_MENTION_TRANSFORMER] : []),
      HASHTAG_TRANSFORMER,
      WAVE_MENTION_TRANSFORMER,
      IMAGE_TRANSFORMER,
      EMOJI_TRANSFORMER,
    ])
  );
