"use client";

import { registerMarkdownShortcuts, type Transformer } from "@lexical/markdown";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { mergeRegister } from "@lexical/utils";
import { useEffect } from "react";

import { registerInlineFormatEditing } from "../utils/inlineFormatEditing";

export function MarkdownShortcutPlugin({
  transformers,
}: {
  readonly transformers: Transformer[];
}): null {
  const [editor] = useLexicalComposerContext();

  useEffect(
    () =>
      mergeRegister(
        registerInlineFormatEditing(editor, transformers),
        registerMarkdownShortcuts(editor, transformers)
      ),
    [editor, transformers]
  );

  return null;
}
