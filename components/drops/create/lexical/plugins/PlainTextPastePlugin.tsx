"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  COMMAND_PRIORITY_LOW,
  PASTE_COMMAND,
  $getSelection,
  $isRangeSelection,
} from "lexical";
import { useEffect } from "react";

const TEXT_MIME_TYPE = "text/plain";

export default function PlainTextPastePlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand<ClipboardEvent>(
      PASTE_COMMAND,
      (event) => {
        const clipboardData = event.clipboardData;
        if (!clipboardData) {
          return false;
        }

        if (clipboardData.files.length > 0) {
          return false;
        }

        const text = clipboardData.getData(TEXT_MIME_TYPE);
        if (!text.length) {
          return false;
        }

        event.preventDefault();

        editor.update(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            selection.insertRawText(text);
          }
        });

        return true;
      },
      COMMAND_PRIORITY_LOW
    );
  }, [editor]);

  return null;
}
