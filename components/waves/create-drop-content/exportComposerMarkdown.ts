import { CREATE_DROP_MARKDOWN_TRANSFORMERS } from "@/components/drops/create/lexical/transformers/createDropMarkdownTransformers";
import { exportDropMarkdown } from "@/components/waves/drops/normalizeDropMarkdown";
import { normalizeTypedEmojiShortcuts } from "@/helpers/waves/typed-emoji-shortcuts";
import type { EditorState } from "lexical";

export const exportComposerMarkdown = (editorState: EditorState) =>
  normalizeTypedEmojiShortcuts(
    exportDropMarkdown(editorState, CREATE_DROP_MARKDOWN_TRANSFORMERS)
  );
