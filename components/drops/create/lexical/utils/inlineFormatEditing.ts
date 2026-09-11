import type { Transformer, TextFormatTransformer } from "@lexical/markdown";
import { $dfs, $restoreEditorState, mergeRegister } from "@lexical/utils";
import {
  $addUpdateTag,
  $getRoot,
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  BLUR_COMMAND,
  CLICK_COMMAND,
  COMMAND_PRIORITY_HIGH,
  DELETE_CHARACTER_COMMAND,
  FORMAT_TEXT_COMMAND,
  KEY_DOWN_COMMAND,
  type EditorState,
  type LexicalEditor,
  type TextFormatType,
} from "lexical";

const INLINE_FORMATS: TextFormatType[] = [
  "bold",
  "italic",
  "underline",
  "strikethrough",
  "code",
  "highlight",
  "subscript",
  "superscript",
];

function readCursor(state: EditorState) {
  return state.read(() => {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) {
      return null;
    }
    const node = selection.anchor.getNode();
    return {
      selection,
      text: $isTextNode(node) ? node.getTextContent() : null,
      previousKey: node.getPreviousSibling()?.getKey(),
      formats:
        $isTextNode(node) && node.getTextContentSize() > 0
          ? node.getFormat()
          : 0,
      nodeFormats: $isTextNode(node)
        ? new Set(INLINE_FORMATS.filter((format) => node.hasFormat(format)))
        : new Set<TextFormatType>(),
      size: $getRoot().getTextContentSize(),
      touchedFormats: selection
        .getNodes()
        .reduce(
          (formats, selected) =>
            $isTextNode(selected) ? formats | selected.getFormat() : formats,
          0
        ),
    };
  });
}

type Cursor = NonNullable<ReturnType<typeof readCursor>>;

function isMarkerInsertion(
  previous: Cursor,
  current: Cursor,
  marker: string
): boolean {
  const before = previous.selection.anchor;
  const after = current.selection.anchor;
  if (
    !previous.selection.isCollapsed() ||
    !current.selection.isCollapsed() ||
    previous.text === null ||
    current.size !== previous.size + 1
  ) {
    return false;
  }
  if (before.key === after.key) {
    return (
      after.offset === before.offset + 1 &&
      current.text ===
        previous.text.slice(0, before.offset) +
          marker +
          previous.text.slice(before.offset)
    );
  }
  // Typing a closing marker after nested formatting can create a new text
  // node. The cursor still advances by exactly one character.
  return (
    current.previousKey === before.key &&
    before.offset === previous.text.length &&
    after.offset === 1 &&
    current.text?.startsWith(marker) === true
  );
}

function resetDeletedFormats(
  editor: LexicalEditor,
  previous: Cursor,
  current: Cursor
) {
  // Only clear formats carried by deleted text that are absent from the
  // surviving text at the cursor. Nested and neighboring formats survive.
  const removedFormats = previous.touchedFormats & ~current.formats;
  if (
    previous.size > current.size &&
    current.selection.isCollapsed() &&
    (current.selection.format & removedFormats) !== 0
  ) {
    editor.update(
      () => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          selection.format &= ~removedFormats;
          selection.dirty = true;
        }
      },
      { tag: "history-merge" }
    );
  }
}

function hasSameCursor(previous: Cursor, current: Cursor): boolean {
  return (
    previous.selection.isCollapsed() &&
    current.selection.isCollapsed() &&
    previous.selection.anchor.is(current.selection.anchor)
  );
}

function $hasSameNodes(previous: EditorState): boolean {
  const currentNodes = $dfs().map(({ node }) => node);
  const previousNodes = previous.read(() => $dfs().map(({ node }) => node));
  return (
    previousNodes.length === currentNodes.length &&
    previousNodes.every((node, index) => node === currentNodes[index])
  );
}

export function registerInlineFormatEditing(
  editor: LexicalEditor,
  transformers: Transformer[]
): () => void {
  const textFormats = transformers.filter(
    (transformer): transformer is TextFormatTransformer =>
      transformer.type === "text-format"
  );
  let pending: {
    before: EditorState;
    typed: EditorState;
    matches: TextFormatTransformer[];
  } | null = null;
  let shortcut: { before: EditorState; converted: EditorState } | null = null;
  const clearShortcut = () => {
    pending = null;
    shortcut = null;
    return false;
  };

  const retainShortcut = (
    previous: Cursor,
    current: Cursor,
    prevEditorState: EditorState,
    editorState: EditorState
  ): boolean => {
    // Selection reconciliation and no-op plugin updates may create a new
    // EditorState without changing any document node or moving the cursor.
    // Retain the shortcut only across those updates, never across content edits.
    if (
      !(pending || shortcut) ||
      !hasSameCursor(previous, current) ||
      !editorState.read(() => $hasSameNodes(prevEditorState))
    )
      return false;
    if (pending?.typed === prevEditorState) pending.typed = editorState;
    if (shortcut?.converted === prevEditorState)
      shortcut.converted = editorState;
    return true;
  };

  return mergeRegister(
    editor.registerUpdateListener(({ editorState, prevEditorState, tags }) => {
      if (
        tags.has("historic") ||
        tags.has("collaboration") ||
        editor.isComposing()
      ) {
        clearShortcut();
        return;
      }
      const previous = readCursor(prevEditorState);
      const current = readCursor(editorState);
      if (!previous || !current) {
        clearShortcut();
        return;
      }
      if (retainShortcut(previous, current, prevEditorState, editorState)) {
        return;
      }
      const candidate = pending;
      clearShortcut();
      const removed = previous.size - current.size;
      if (
        candidate?.typed === prevEditorState &&
        current.selection.isCollapsed() &&
        candidate.matches.some(
          (transformer) =>
            removed === transformer.tag.length * 2 &&
            transformer.format.every((format) =>
              current.nodeFormats.has(format)
            )
        )
      ) {
        shortcut = { before: candidate.before, converted: editorState };
      } else {
        const beforeCursor =
          current.text?.slice(0, current.selection.anchor.offset) ?? "";
        const marker = beforeCursor.slice(-1);
        const matches = textFormats.filter(
          ({ tag }) => beforeCursor.endsWith(tag) && tag.endsWith(marker)
        );
        if (
          matches.length > 0 &&
          isMarkerInsertion(previous, current, marker)
        ) {
          pending = { before: prevEditorState, typed: editorState, matches };
        }
      }

      resetDeletedFormats(editor, previous, current);
    }),
    editor.registerCommand(
      DELETE_CHARACTER_COMMAND,
      (backward) => {
        const saved = shortcut;
        clearShortcut();
        const selection = $getSelection();
        const convertedSelection = saved?.converted.read($getSelection);
        if (
          !backward ||
          !saved ||
          editor.isComposing() ||
          !$isRangeSelection(selection) ||
          !selection.isCollapsed() ||
          !$isRangeSelection(convertedSelection) ||
          !selection.anchor.is(convertedSelection.anchor) ||
          editor.getEditorState() !== saved.converted ||
          !$hasSameNodes(saved.converted)
        ) {
          return false;
        }
        // Restore the exact pre-keystroke state, including nested formats and
        // the original Markdown spelling, as one undoable action.
        $restoreEditorState(editor, saved.before);
        $addUpdateTag("history-push");
        return true;
      },
      COMMAND_PRIORITY_HIGH
    ),
    editor.registerCommand(
      KEY_DOWN_COMMAND,
      (event) => {
        if (
          event.key !== "Backspace" ||
          event.altKey ||
          event.ctrlKey ||
          event.metaKey ||
          event.shiftKey
        ) {
          clearShortcut();
        }
        return false;
      },
      COMMAND_PRIORITY_HIGH
    ),
    editor.registerCommand(
      FORMAT_TEXT_COMMAND,
      clearShortcut,
      COMMAND_PRIORITY_HIGH
    ),
    editor.registerCommand(CLICK_COMMAND, clearShortcut, COMMAND_PRIORITY_HIGH),
    editor.registerCommand(BLUR_COMMAND, clearShortcut, COMMAND_PRIORITY_HIGH)
  );
}
