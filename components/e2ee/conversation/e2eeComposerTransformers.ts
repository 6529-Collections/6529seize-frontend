import { SAFE_MARKDOWN_TRANSFORMERS } from "@/components/drops/create/lexical/transformers/markdownTransformers";
import { EMOJI_TRANSFORMER } from "@/components/drops/create/lexical/transformers/EmojiTransformer";

export const E2EE_COMPOSER_TRANSFORMERS = [
  ...SAFE_MARKDOWN_TRANSFORMERS,
  EMOJI_TRANSFORMER,
];
