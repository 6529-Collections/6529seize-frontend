import React, { createRef } from "react";
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
  type LexicalEditor,
} from "lexical";
import { getMentionedGroupsFromEditorState } from "@/components/drops/create/lexical/utils/groupMentionDetection";
import { ApiDropGroupMention } from "@/generated/models/ApiDropGroupMention";
import CreateDropInput, {
  type CreateDropInputHandles,
} from "@/components/waves/CreateDropInput";

jest.unmock("lexical");

jest.mock("@/components/waves/CreateDropEmojiPicker", () => () => null);
jest.mock("@/hooks/useCapacitor", () => ({
  __esModule: true,
  default: () => ({ isCapacitor: false }),
}));

function createNoopPluginMock() {
  const { forwardRef } = jest.requireActual<typeof React>("react");
  return {
    __esModule: true,
    default: forwardRef(() => null),
  };
}

jest.mock(
  "@/components/drops/create/lexical/plugins/ClearEditorPlugin",
  createNoopPluginMock
);
jest.mock(
  "@/components/drops/create/lexical/plugins/mentions/MentionsPlugin",
  createNoopPluginMock
);
jest.mock(
  "@/components/drops/create/lexical/plugins/hashtags/HashtagsPlugin",
  createNoopPluginMock
);
jest.mock(
  "@/components/drops/create/lexical/plugins/waves/WaveMentionsPlugin",
  createNoopPluginMock
);
jest.mock("@/components/drops/create/lexical/plugins/MaxLengthPlugin", () => ({
  MaxLengthPlugin: () => null,
}));
jest.mock(
  "@/components/drops/create/lexical/plugins/DragDropPastePlugin",
  createNoopPluginMock
);
jest.mock(
  "@/components/drops/create/lexical/plugins/enter/EnterKeyPlugin",
  createNoopPluginMock
);
jest.mock(
  "@/components/drops/create/lexical/plugins/PlainTextPastePlugin",
  createNoopPluginMock
);
jest.mock(
  "@/components/drops/create/lexical/plugins/emoji/EmojiPlugin",
  createNoopPluginMock
);

let mockLexicalEditor: LexicalEditor | null = null;
jest.mock("@/components/waves/EditLastDropArrowUpPlugin", () => {
  const React = jest.requireActual<typeof import("react")>("react");
  const { useLexicalComposerContext } = jest.requireActual<
    typeof import("@lexical/react/LexicalComposerContext")
  >("@lexical/react/LexicalComposerContext");

  return function CaptureEditorPlugin() {
    const [editor] = useLexicalComposerContext();
    React.useEffect(() => {
      mockLexicalEditor = editor;
      return () => {
        mockLexicalEditor = null;
      };
    }, [editor]);
    return null;
  };
});

const renderInput = (ref: React.RefObject<CreateDropInputHandles | null>) =>
  render(
    <CreateDropInput
      ref={ref}
      waveId="wave"
      editorState={null}
      type={null}
      canSubmit={false}
      isStormMode={false}
      isDropMode={false}
      submitting={false}
      onEditorState={jest.fn()}
      onReferencedNft={jest.fn()}
      onMentionedUser={jest.fn()}
      onMentionedWave={jest.fn()}
    />
  );

it("keeps an empty-selection click inside a Lexical block", async () => {
  const ref = createRef<CreateDropInputHandles>();
  renderInput(ref);

  const editor = screen.getByRole("textbox");
  await waitFor(() => expect(editor.querySelector("p")).not.toBeNull());

  window.getSelection()?.removeAllRanges();
  act(() => ref.current?.focus());
  fireEvent.click(editor);
  await act(async () => Promise.resolve());

  await waitFor(() => {
    const anchorNode = window.getSelection()?.anchorNode ?? null;
    expect(anchorNode).not.toBe(editor);
    expect(editor.contains(anchorNode)).toBe(true);
  });
});

it("imports global mention tokens for ordinary chat authors", async () => {
  const ref = createRef<CreateDropInputHandles>();
  const onEditorState = jest.fn();
  render(
    <CreateDropInput
      ref={ref}
      waveId="wave"
      editorState={null}
      type={null}
      canSubmit={false}
      isStormMode={false}
      isDropMode={false}
      submitting={false}
      canMentionAll={false}
      onEditorState={onEditorState}
      onReferencedNft={jest.fn()}
      onMentionedUser={jest.fn()}
      onMentionedWave={jest.fn()}
    />
  );

  act(() => ref.current?.setMarkdown("@contributors"));

  await waitFor(() =>
    expect(screen.getByText("@contributors")).toHaveClass(
      "editor-group-mention"
    )
  );
});

it.each(["@allexpop", "@alligator", "@AllExPop", "@ALLexPop"])(
  "keeps the %s handle open for autocomplete",
  async (handle) => {
    const ref = createRef<CreateDropInputHandles>();
    renderInput(ref);

    const editor = screen.getByRole("textbox");
    await waitFor(() => expect(editor.querySelector("p")).not.toBeNull());
    await waitFor(() => expect(mockLexicalEditor).not.toBeNull());

    act(() => {
      mockLexicalEditor?.update(
        () => {
          $getRoot().selectEnd();
        },
        { discrete: true }
      );
    });

    for (const character of handle) {
      act(() => {
        mockLexicalEditor?.update(
          () => {
            const selection = $getSelection();
            if (!$isRangeSelection(selection)) {
              throw new Error("Expected a range selection while typing");
            }
            selection.insertText(character);
          },
          { discrete: true }
        );
      });
    }

    await waitFor(() => expect(editor).toHaveTextContent(handle));
    expect(editor.querySelector(".editor-group-mention")).toBeNull();
  }
);

it("keeps exact @all metadata detectable without live shortcut conversion", async () => {
  const ref = createRef<CreateDropInputHandles>();
  renderInput(ref);

  const editor = screen.getByRole("textbox");
  await waitFor(() => expect(editor.querySelector("p")).not.toBeNull());
  await waitFor(() => expect(mockLexicalEditor).not.toBeNull());

  act(() => {
    mockLexicalEditor?.update(
      () => {
        $getRoot().selectEnd();
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) {
          throw new Error("Expected a range selection while typing");
        }
        selection.insertText("@all,");
      },
      { discrete: true }
    );
  });

  await waitFor(() => expect(editor).toHaveTextContent("@all,"));
  expect(editor.querySelector(".editor-group-mention")).toBeNull();
  expect(
    getMentionedGroupsFromEditorState(
      mockLexicalEditor!.getEditorState(),
      true
    )
  ).toEqual([ApiDropGroupMention.All]);
});
