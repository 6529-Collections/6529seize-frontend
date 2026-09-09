import { EMOJI_TRANSFORMER } from "./EmojiTransformer";
import { GROUP_MENTION_TRANSFORMER } from "./GroupMentionTransformer";
import { HASHTAG_TRANSFORMER } from "./HastagTransformer";
import { IMAGE_TRANSFORMER } from "./ImageTransformer";
import { SAFE_MARKDOWN_TRANSFORMERS } from "./markdownTransformers";
import { MENTION_TRANSFORMER } from "./MentionTransformer";
import { WAVE_MENTION_TRANSFORMER } from "./WaveMentionTransformer";

export const CREATE_DROP_MARKDOWN_TRANSFORMERS = [
  ...SAFE_MARKDOWN_TRANSFORMERS,
  MENTION_TRANSFORMER,
  GROUP_MENTION_TRANSFORMER,
  HASHTAG_TRANSFORMER,
  WAVE_MENTION_TRANSFORMER,
  IMAGE_TRANSFORMER,
  EMOJI_TRANSFORMER,
];

export const CREATE_DROP_MARKDOWN_SHORTCUT_TRANSFORMERS =
  CREATE_DROP_MARKDOWN_TRANSFORMERS.filter(
    (transformer) => transformer !== GROUP_MENTION_TRANSFORMER
  );
