import type { Transformer, TextFormatTransformer } from "@lexical/markdown";
import { $dfs, $restoreEditorState, mergeRegister } from "@lexical/utils";
import {
  $addUpdateTag,
  $getRoot,
  $getSelection,
  $isElementNode,
  $isRangeSelection,
  $isTextNode,
  BLUR_COMMAND,
  CLICK_COMMAND,
  COMMAND_PRIORITY_HIGH,
  DELETE_CHARACTER_COMMAND,
  FORMAT_TEXT_COMMAND,
  KEY_DOWN_COMMAND,
  type EditorState,
  type LexicalNode,
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
const PLAIN_SUFFIX_TAG = "inline-format-plain-suffix";

function $getCursorPoint(node: LexicalNode, offset: number): number {
  let point = 0;
  let foundPoint = false;
  const visit = (current: LexicalNode) => {
    if (foundPoint) return;
    if (current === node) {
      if ($isTextNode(current)) {
        point += offset;
      } else if ($isElementNode(current)) {
        point += current
          .getChildren()
          .slice(0, offset)
          .reduce((size, child) => size + child.getTextContentSize(), 0);
      }
      foundPoint = true;
      return;
    }
    if ($isTextNode(current)) {
      point += current.getTextContentSize();
    } else if ($isElementNode(current)) {
      for (const child of current.getChildren()) visit(child);
    }
  };
  visit($getRoot());
  return point;
}

function readCursor(state: EditorState) {
  return state.read(() => {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) {
      return null;
    }
    const node = selection.anchor.getNode();
    const previous =
      selection.anchor.type === "element" && $isElementNode(node)
        ? node.getChildAtIndex(selection.anchor.offset - 1)
        : node.getPreviousSibling();
    const formatNodes = [node, previous].filter($isTextNode);
    let point: number | undefined;
    return {
      selection,
      // Ordinary typing needs only the local anchor. Walk the tree once, on
      // demand, when a tracked shortcut actually needs its document offset.
      // Committed EditorStates are immutable. Re-entering this exact snapshot
      // resolves its original node/selection even inside a newer editor update;
      // Lexical restores the caller's active state when read() returns.
      get point(): number {
        point ??= state.read(() =>
          $getCursorPoint(node, selection.anchor.offset)
        );
        return point;
      },
      rootText: $getRoot().getTextContent(),
      text: $isTextNode(node) ? node.getTextContent() : null,
      previousKey: previous?.getKey(),
      formats:
        $isTextNode(node) && node.getTextContentSize() > 0
          ? node.getFormat()
          : 0,
      nodeFormats: new Set(
        INLINE_FORMATS.filter((format) =>
          formatNodes.some((formatNode) => formatNode.hasFormat(format))
        )
      ),
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

type Shortcut = {
  before: EditorState;
  converted: EditorState;
  signature: string;
  size: number;
  point: number;
  detour: boolean;
  exitFormats: readonly TextFormatType[];
};

type PendingShortcut = {
  before: EditorState;
  typed: EditorState;
  matches: TextFormatTransformer[];
};

type InlineFormatEditingState = {
  pending: PendingShortcut | null;
  shortcut: Shortcut | null;
};

type CursorUpdate = {
  previous: Cursor;
  current: Cursor;
  prevEditorState: EditorState;
  editorState: EditorState;
};

type EditorUpdate = {
  editorState: EditorState;
  prevEditorState: EditorState;
  tags: Set<string>;
};

function contentSignature(state: EditorState): string {
  return JSON.stringify(state.toJSON().root);
}

function isShortcutBoundary(
  shortcut: Shortcut,
  current: Cursor,
  editorState: EditorState
): boolean {
  if (
    !current.selection.isCollapsed() ||
    current.size !== shortcut.size ||
    current.point !== shortcut.point
  ) {
    return false;
  }
  // Ordinary suffix typing/deletion fails the cheap guards above. Serialize
  // only when a changed document actually returns to the saved boundary.
  // Re-arming stores that state in converted, so repeated reads are free.
  // A later suffix round-trip creates a different state and must be checked
  // again: matching size/caret alone cannot prove its content is unchanged.
  return (
    editorState === shortcut.converted ||
    contentSignature(editorState) === shortcut.signature
  );
}

function normalizeInsertedSuffix(
  editor: LexicalEditor,
  length: number,
  formats: readonly TextFormatType[]
) {
  // Do not enqueue a tagged no-op when a later suffix already starts plain.
  // Lexical can carry that unused tag into the next real deletion update.
  const needsNormalization = editor.getEditorState().read(() => {
    const selection = $getSelection();
    if (
      !$isRangeSelection(selection) ||
      !selection.isCollapsed() ||
      selection.anchor.type !== "text"
    ) {
      return false;
    }
    const node = selection.anchor.getNode();
    return (
      $isTextNode(node) &&
      formats.some(
        (format) => node.hasFormat(format) || selection.hasFormat(format)
      )
    );
  });
  if (!needsNormalization) return;

  editor.update(
    () => {
      const selection = $getSelection();
      if (
        !$isRangeSelection(selection) ||
        !selection.isCollapsed() ||
        selection.anchor.type !== "text"
      ) {
        return;
      }
      const node = selection.anchor.getNode();
      if (!$isTextNode(node)) return;
      const end = selection.anchor.offset;
      const start = end - length;
      if (start < 0) return;
      let suffix = start === 0 ? node : node.splitText(start)[1];
      if (!suffix) return;
      if (suffix.getTextContentSize() > length) {
        const splitSuffix = suffix.splitText(length)[0];
        if (!splitSuffix) return;
        suffix = splitSuffix;
      }
      for (const format of formats) {
        if (suffix.hasFormat(format)) suffix.toggleFormat(format);
      }
      const nextSelection = suffix.selectEnd();
      nextSelection.format = suffix.getFormat();
      nextSelection.dirty = true;
    },
    { tag: PLAIN_SUFFIX_TAG }
  );
}

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
  // Identity checks walk both snapshots only while tracking a shortcut (or
  // attempting reversal). Cursor offsets are lazy; full JSON comparisons run
  // only at matching boundaries. Keep ordinary untracked typing off these paths.
  const currentNodes = $dfs().map(({ node }) => node);
  const previousNodes = previous.read(() => $dfs().map(({ node }) => node));
  return (
    previousNodes.length === currentNodes.length &&
    previousNodes.every((node, index) => node === currentNodes[index])
  );
}

function clearEditingState(state: InlineFormatEditingState): false {
  state.pending = null;
  state.shortcut = null;
  return false;
}

function retainEditingState(
  state: InlineFormatEditingState,
  previous: Cursor,
  current: Cursor,
  prevEditorState: EditorState,
  editorState: EditorState
): boolean {
  if (
    state.pending &&
    previous.selection.isCollapsed() &&
    current.selection.isCollapsed() &&
    previous.rootText === current.rootText
  ) {
    state.pending.typed = editorState;
    return true;
  }
  if (
    !(state.pending || state.shortcut) ||
    !hasSameCursor(previous, current) ||
    !editorState.read(() => $hasSameNodes(prevEditorState))
  ) {
    return false;
  }
  if (state.pending?.typed === prevEditorState) {
    state.pending.typed = editorState;
  }
  if (state.shortcut?.converted === prevEditorState && !state.shortcut.detour) {
    state.shortcut.converted = editorState;
  }
  return true;
}

function findConvertedTransformer(
  candidate: PendingShortcut | null,
  previous: Cursor,
  current: Cursor,
  prevEditorState: EditorState
): TextFormatTransformer | undefined {
  const removed = previous.size - current.size;
  return candidate?.matches.find(
    (transformer) =>
      candidate.typed === prevEditorState &&
      current.selection.isCollapsed() &&
      removed === transformer.tag.length * 2 &&
      transformer.format.every((format) => current.nodeFormats.has(format))
  );
}

function updateTrackedShortcut(
  editor: LexicalEditor,
  textFormats: TextFormatTransformer[],
  state: InlineFormatEditingState,
  update: CursorUpdate
) {
  // Re-arm after suffix deletion reaches the original content/caret boundary;
  // equal-sized plugin replacements must invalidate even if JSON is identical.
  // A new closing marker starts its own pending shortcut. Otherwise retain a
  // suffix detour only across text edits. Navigation, format changes and
  // unrelated updates invalidate it.
  const { previous, current, prevEditorState, editorState } = update;
  const shortcut = state.shortcut;
  if (
    shortcut?.detour &&
    current.size < previous.size &&
    isShortcutBoundary(shortcut, current, editorState)
  ) {
    shortcut.converted = editorState;
    shortcut.detour = false;
    return;
  }

  const beforeCursor =
    current.text?.slice(0, current.selection.anchor.offset) ?? "";
  const marker = beforeCursor.slice(-1);
  const matches = textFormats.filter(
    ({ tag }) => beforeCursor.endsWith(tag) && tag.endsWith(marker)
  );
  if (matches.length > 0 && isMarkerInsertion(previous, current, marker)) {
    state.shortcut = null;
    state.pending = { before: prevEditorState, typed: editorState, matches };
    return;
  }

  const changedSize = current.size - previous.size;
  const startedAtBoundary =
    shortcut && isShortcutBoundary(shortcut, previous, prevEditorState);
  if (
    shortcut &&
    shortcut.exitFormats.length > 0 &&
    changedSize > 0 &&
    current.point === previous.point + changedSize &&
    startedAtBoundary
  ) {
    shortcut.detour = true;
    normalizeInsertedSuffix(editor, changedSize, shortcut.exitFormats);
    return;
  }
  if (
    shortcut &&
    current.selection.isCollapsed() &&
    changedSize !== 0 &&
    (shortcut.detour || startedAtBoundary)
  ) {
    shortcut.detour = true;
    return;
  }
  state.shortcut = null;
}

function handleEditorUpdate(
  editor: LexicalEditor,
  textFormats: TextFormatTransformer[],
  state: InlineFormatEditingState,
  update: EditorUpdate
) {
  const { editorState, prevEditorState, tags } = update;
  if (tags.has(PLAIN_SUFFIX_TAG)) return;
  if (
    tags.has("historic") ||
    tags.has("collaboration") ||
    editor.isComposing()
  ) {
    clearEditingState(state);
    return;
  }
  const previous = readCursor(prevEditorState);
  const current = readCursor(editorState);
  if (!previous || !current) {
    clearEditingState(state);
    return;
  }
  if (
    retainEditingState(state, previous, current, prevEditorState, editorState)
  ) {
    return;
  }

  const candidate = state.pending;
  state.pending = null;
  const convertedBy = findConvertedTransformer(
    candidate,
    previous,
    current,
    prevEditorState
  );
  if (candidate && convertedBy) {
    state.shortcut = {
      before: candidate.before,
      converted: editorState,
      // One full signature at conversion; later comparisons are lazy and
      // occur only when the saved size and caret match again.
      signature: contentSignature(editorState),
      size: current.size,
      point: current.point,
      detour: false,
      // Strike ends at its closing marker. Preserve existing bold/italic/code
      // continuation, including their use inside an outer Markdown shortcut.
      exitFormats: convertedBy.format.includes("strikethrough")
        ? convertedBy.format
        : [],
    };
  } else {
    updateTrackedShortcut(editor, textFormats, state, {
      previous,
      current,
      prevEditorState,
      editorState,
    });
  }
  resetDeletedFormats(editor, previous, current);
}

function handleDeleteCharacter(
  editor: LexicalEditor,
  state: InlineFormatEditingState,
  backward: boolean
): boolean {
  const saved = state.shortcut;
  const selection = $getSelection();
  const editorState = editor.getEditorState();
  const current = readCursor(editorState);
  if (
    !backward ||
    !saved ||
    editor.isComposing() ||
    !$isRangeSelection(selection) ||
    !selection.isCollapsed() ||
    !current ||
    !isShortcutBoundary(saved, current, editorState) ||
    !selection.anchor.is(current.selection.anchor) ||
    !$hasSameNodes(editorState)
  ) {
    if (!backward || !saved || editor.isComposing()) clearEditingState(state);
    return false;
  }
  clearEditingState(state);
  $restoreEditorState(editor, saved.before);
  $addUpdateTag("history-push");
  return true;
}

export function registerInlineFormatEditing(
  editor: LexicalEditor,
  transformers: Transformer[]
): () => void {
  const textFormats = transformers.filter(
    (transformer): transformer is TextFormatTransformer =>
      transformer.type === "text-format"
  );
  const state: InlineFormatEditingState = { pending: null, shortcut: null };
  const clear = () => clearEditingState(state);

  return mergeRegister(
    editor.registerUpdateListener(({ editorState, prevEditorState, tags }) =>
      handleEditorUpdate(editor, textFormats, state, {
        editorState,
        prevEditorState,
        tags,
      })
    ),
    editor.registerCommand(
      DELETE_CHARACTER_COMMAND,
      (backward) => handleDeleteCharacter(editor, state, backward),
      COMMAND_PRIORITY_HIGH
    ),
    editor.registerCommand(
      KEY_DOWN_COMMAND,
      (event) => {
        // Printable keys (including Shift-produced markers) must reach the
        // update listener without losing the saved conversion boundary.
        // Browsers may report AltGraph typing as Ctrl+Alt. Preserve only
        // explicitly identified AltGraph characters; command chords still clear.
        const altGraphTyping =
          (event.key.length === 1 || event.key === "AltGraph") &&
          event.getModifierState("AltGraph");
        // Some layouts send Control before AltGraph. A modifier alone does
        // not edit; defer invalidation until the following command key.
        const controlModifier =
          event.key === "Control" && !event.altKey && !event.metaKey;
        const preservesModifier =
          (altGraphTyping && !event.metaKey) || controlModifier;
        if (
          !preservesModifier &&
          ((event.key.length !== 1 &&
            event.key !== "Backspace" &&
            event.key !== "Shift") ||
            event.altKey ||
            event.ctrlKey ||
            event.metaKey ||
            (event.key === "Backspace" && event.shiftKey))
        ) {
          clear();
        }
        return false;
      },
      COMMAND_PRIORITY_HIGH
    ),
    editor.registerCommand(FORMAT_TEXT_COMMAND, clear, COMMAND_PRIORITY_HIGH),
    editor.registerCommand(CLICK_COMMAND, clear, COMMAND_PRIORITY_HIGH),
    editor.registerCommand(BLUR_COMMAND, clear, COMMAND_PRIORITY_HIGH)
  );
}
