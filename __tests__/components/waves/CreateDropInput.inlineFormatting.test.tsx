import React, { useState } from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import {
  $getRoot,
  $getSelection,
  $isRangeSelection,
  DELETE_CHARACTER_COMMAND,
  type EditorState,
  type LexicalEditor,
} from "lexical";
import CreateDropInput from "@/components/waves/CreateDropInput";

jest.unmock("lexical");

const originalRangeRect = Object.getOwnPropertyDescriptor(
  Range.prototype,
  "getBoundingClientRect"
);
beforeAll(() => {
  // jsdom has no range layout; Lexical reads this when scrolling the caret.
  Object.defineProperty(Range.prototype, "getBoundingClientRect", {
    configurable: true,
    value: () => new DOMRect(),
  });
});
afterAll(() => {
  if (originalRangeRect) {
    Object.defineProperty(
      Range.prototype,
      "getBoundingClientRect",
      originalRangeRect
    );
  } else {
    Reflect.deleteProperty(Range.prototype, "getBoundingClientRect");
  }
});

// Keep every editor plugin real. Stub external data and the picker UI only.
jest.mock("@/hooks/useCapacitor", () => ({
  __esModule: true,
  default: () => ({ isCapacitor: false }),
}));
jest.mock("@/hooks/useIdentitiesSearch", () => ({
  IDENTITY_SEARCH_MIN_HANDLE_LENGTH: 3,
  useIdentitiesSearch: () => ({ identities: [] }),
}));
jest.mock("@/hooks/useMentionAliases", () => ({
  useMentionAliases: () => ({ aliases: [], enabled: false, isFetched: true }),
}));
jest.mock("@/hooks/useWavesSearch", () => ({
  useWavesSearch: () => ({ waves: [] }),
}));
jest.mock("@/hooks/useAlchemyNftQueries", () => ({
  useTokenMetadataQuery: () => ({ data: [] }),
}));
jest.mock("@/contexts/EmojiContext", () => {
  const value = {
    emojiMap: [],
    findNativeEmoji: () => null,
    loadEmojiData: async () => undefined,
  };
  return { useEmoji: () => value };
});

let mockEditor: LexicalEditor | null = null;
jest.mock("@/components/waves/CreateDropEmojiPicker", () => {
  const React = jest.requireActual<typeof import("react")>("react");
  const { useLexicalComposerContext } = jest.requireActual<
    typeof import("@lexical/react/LexicalComposerContext")
  >("@lexical/react/LexicalComposerContext");
  return function CaptureEditor() {
    const [editor] = useLexicalComposerContext();
    React.useEffect(() => {
      mockEditor = editor;
      return () => {
        mockEditor = null;
      };
    }, [editor]);
    return null;
  };
});

function Composer() {
  const [state, setState] = useState<EditorState | null>(null);
  return (
    <CreateDropInput
      waveId="wave"
      editorState={state}
      type={null}
      canSubmit={false}
      isStormMode={false}
      isDropMode={false}
      submitting={false}
      onEditorState={setState}
      onReferencedNft={jest.fn()}
      onMentionedUser={jest.fn()}
      onMentionedWave={jest.fn()}
    />
  );
}

async function mountComposer() {
  render(<Composer />);
  await waitFor(() => expect(mockEditor).not.toBeNull());
  const editor = mockEditor;
  if (!editor) throw new Error("Expected the real composer editor");
  await act(async () => {
    screen.getByRole("textbox").focus();
    editor.update(
      () => {
        $getRoot().selectEnd();
      },
      { discrete: true }
    );
  });
  return editor;
}

async function typeText(editor: LexicalEditor, text: string) {
  for (const character of text) {
    // Flush parent rerenders and plugin effects between actual text updates.
    await act(async () => {
      editor.update(
        () => {
          const selection = $getSelection();
          if (!$isRangeSelection(selection))
            throw new Error("Expected text selection");
          selection.insertText(character);
        },
        { discrete: true }
      );
    });
  }
}

it.each(["~test~", "~~test~~", "**test**", "*test*", "`test`", "==test=="])(
  "reverses %s with real composer plugins and parent rerenders",
  async (markdown) => {
    const editor = await mountComposer();
    // This prefix also exercises the emoji plugin's text listener and its
    // no-op editor updates while the Markdown shortcut is being completed.
    await typeText(editor, ":unknown: " + markdown);
    const input = screen.getByRole("textbox");
    expect(input).toHaveTextContent(":unknown: test");
    await act(async () => {
      fireEvent.keyDown(input, { key: "Backspace", keyCode: 8 });
    });
    expect(input.textContent).toBe(":unknown: " + markdown.slice(0, -1));
  }
);

it("bounds format normalization and allows plain typing after deleting a word", async () => {
  const editor = await mountComposer();
  await typeText(editor, "plain ~word~");
  const normalization = jest.fn();
  const unregister = editor.registerUpdateListener(
    ({ editorState, prevEditorState }) => {
      const previous = prevEditorState.read($getSelection);
      const current = editorState.read($getSelection);
      if (
        $isRangeSelection(previous) &&
        $isRangeSelection(current) &&
        previous.isCollapsed() &&
        current.isCollapsed() &&
        previous.hasFormat("strikethrough") &&
        !current.hasFormat("strikethrough")
      )
        normalization();
    }
  );
  try {
    await act(async () => {
      editor.update(
        () => {
          const node = $getRoot()
            .getAllTextNodes()
            .find((text) => text.hasFormat("strikethrough"));
          if (!node) throw new Error("Expected struck text");
          const selection = node.select(node.getTextContentSize(), 0);
          selection.format = node.getFormat();
          editor.dispatchCommand(DELETE_CHARACTER_COMMAND, true);
        },
        { discrete: true }
      );
    });
    expect(normalization).toHaveBeenCalledTimes(1);
    await typeText(editor, "normal");
    const input = screen.getByRole("textbox");
    expect(input.textContent).toBe("plain normal");
    expect(input.querySelector(".editor-text-strikethrough")).toBeNull();
  } finally {
    unregister();
  }
});
