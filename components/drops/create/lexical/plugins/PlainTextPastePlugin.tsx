"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  COMMAND_PRIORITY_LOW,
  PASTE_COMMAND,
  $getSelection,
  $isRangeSelection,
  type RangeSelection,
} from "lexical";
import { useEffect } from "react";

const TEXT_MIME_TYPE = "text/plain";
const URI_LIST_MIME_TYPE = "text/uri-list";
const NEWLINE_OR_TAB_REGEX = /(\r?\n|\t)/;

const getClipboardText = (clipboardData: DataTransfer): string =>
  clipboardData.getData(TEXT_MIME_TYPE) ||
  clipboardData.getData(URI_LIST_MIME_TYPE);

const insertRangeSelectionText = (
  selection: RangeSelection,
  text: string
): void => {
  const parts = text.split(NEWLINE_OR_TAB_REGEX);
  if (parts[parts.length - 1] === "") {
    parts.pop();
  }

  for (const part of parts) {
    if (part === "\n" || part === "\r\n") {
      selection.insertParagraph();
      continue;
    }

    if (part === "\t") {
      selection.insertText(part);
      continue;
    }

    if (part.length === 0) {
      continue;
    }

    selection.insertText(part);
  }
};

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

        const text = getClipboardText(clipboardData);
        if (!text.length) {
          return false;
        }

        event.preventDefault();

        editor.update(() => {
          const selection = $getSelection();
          if (!selection) {
            return;
          }

          if ($isRangeSelection(selection)) {
            insertRangeSelectionText(selection, text);
            return;
          }

          selection.insertRawText(text);
        });

        return true;
      },
      COMMAND_PRIORITY_LOW
    );
  }, [editor]);

  return null;
}
