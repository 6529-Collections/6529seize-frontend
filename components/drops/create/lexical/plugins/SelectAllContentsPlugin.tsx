"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { mergeRegister } from "@lexical/utils";
import {
  $selectAll,
  COMMAND_PRIORITY_CRITICAL,
  SELECTION_CHANGE_COMMAND,
} from "lexical";
import { useEffect } from "react";

/**
 * Whether the page's selection spans the editor's contents by the editor
 * element's own boundaries, as a browser's Select All (or a range made with
 * `selectNodeContents`) does.
 */
function selectsAllContents(root: HTMLElement): boolean {
  const selection = root.ownerDocument.getSelection();
  return (
    selection !== null &&
    selection.anchorNode === root &&
    selection.focusNode === root &&
    selection.anchorOffset === 0 &&
    selection.focusOffset === root.childNodes.length
  );
}

/**
 * Lexical 0.14 resolves the end of such a selection one node short when the
 * last line ends in an inline decorator, such as a custom emoji: typing over
 * it then replaced only the first character. Selecting everything through
 * Lexical gives the right range and moves the page's selection to points
 * Lexical reads back correctly.
 *
 * This happens when the selection changes, and again before input, because
 * typing can arrive before the browser has reported the selection change.
 */
export default function SelectAllContentsPlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    let listeningRoot: HTMLElement | null = null;
    const normalizeBeforeInput = (event: Event) => {
      const root = event.currentTarget as HTMLElement;
      if (selectsAllContents(root)) {
        editor.update(() => $selectAll(), { discrete: true });
      }
    };
    return mergeRegister(
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          const root = editor.getRootElement();
          if (root && selectsAllContents(root)) $selectAll();
          return false;
        },
        COMMAND_PRIORITY_CRITICAL
      ),
      // Capture, so it runs before Lexical's own beforeinput handling.
      editor.registerRootListener((root) => {
        listeningRoot?.removeEventListener(
          "beforeinput",
          normalizeBeforeInput,
          true
        );
        listeningRoot = root;
        listeningRoot?.addEventListener(
          "beforeinput",
          normalizeBeforeInput,
          true
        );
      }),
      () =>
        listeningRoot?.removeEventListener(
          "beforeinput",
          normalizeBeforeInput,
          true
        )
    );
  }, [editor]);

  return null;
}
