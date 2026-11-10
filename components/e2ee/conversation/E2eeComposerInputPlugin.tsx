"use client";

import { useEffect, useLayoutEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getSelection,
  $getRoot,
  $isRangeSelection,
  $setSelection,
  COMMAND_PRIORITY_CRITICAL,
  KEY_DOWN_COMMAND,
  PASTE_COMMAND,
} from "lexical";
import { mergeRegister } from "@lexical/utils";
import {
  exportE2eeComposerMarkdown,
  importE2eeComposerMarkdown,
} from "./e2eeComposerTransformers";
import { getPastedImages } from "./useE2eeComposerParts";

/** Private input adapters never mount public uploads, HTML media import or remote mention search. */
export function E2eeComposerInputPlugin({
  value,
  canAttach,
  onPasteImages,
  onKeyDown,
}: {
  readonly value: string;
  readonly canAttach: boolean;
  readonly onPasteImages: (images: readonly File[]) => void;
  readonly onKeyDown: (event: KeyboardEvent) => boolean;
}) {
  const [editor] = useLexicalComposerContext();
  useLayoutEffect(() => {
    const currentValue = exportE2eeComposerMarkdown(editor.getEditorState());
    if (currentValue === value) return;
    const wasFocused = document.activeElement === editor.getRootElement();
    editor.update(
      () => {
        importE2eeComposerMarkdown(value);
        if (!wasFocused) $setSelection(null);
      },
      { discrete: true }
    );
  }, [editor, value]);

  useEffect(
    () =>
      mergeRegister(
        editor.registerCommand(
          KEY_DOWN_COMMAND,
          (event) => {
            if (editor.isComposing() || event.isComposing) return false;
            return onKeyDown(event);
          },
          COMMAND_PRIORITY_CRITICAL
        ),
        editor.registerCommand(
          PASTE_COMMAND,
          (event) => {
            // Always consume private pastes so the rich editor cannot import remote HTML images.
            event.preventDefault();
            const data = "clipboardData" in event ? event.clipboardData : null;
            if (canAttach) onPasteImages(getPastedImages(data));
            const text = data?.getData("text/plain") ?? "";
            const selection = $getSelection() ?? $getRoot().selectEnd();
            if ($isRangeSelection(selection) && text)
              selection.insertRawText(text.replaceAll(/\r\n?/g, "\n"));
            return true;
          },
          COMMAND_PRIORITY_CRITICAL
        )
      ),
    [canAttach, editor, onKeyDown, onPasteImages]
  );
  return null;
}
