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
  $createParagraphNode,
  $createTextNode,
  $getNodeByKey,
  $getSelection,
  $isRangeSelection,
  type LexicalEditor,
} from "lexical";
import {
  $createImageNode,
  type ImageNode,
} from "@/components/drops/create/lexical/nodes/ImageNode";
import { getMentionedGroupsFromEditorState } from "@/components/drops/create/lexical/utils/groupMentionDetection";
import { ApiDropGroupMention } from "@/generated/models/ApiDropGroupMention";
import CreateDropInput, {
  type CreateDropInputHandles,
} from "@/components/waves/CreateDropInput";

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

const renderInput = (
  ref: React.RefObject<CreateDropInputHandles | null>,
  onEditorState = jest.fn()
) =>
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
      onEditorState={onEditorState}
      onReferencedNft={jest.fn()}
      onMentionedUser={jest.fn()}
      onMentionedWave={jest.fn()}
    />
  );

it("reports upload completion even when it merges into the current undo step", async () => {
  const onEditorState = jest.fn();
  renderInput(createRef<CreateDropInputHandles>(), onEditorState);
  await waitFor(() => expect(mockLexicalEditor).not.toBeNull());
  const editor = mockLexicalEditor!;
  let imageKey = "";
  await act(async () => {
    editor.update(
      () => {
        const image = $createImageNode({ src: "loading" });
        imageKey = image.getKey();
        $getRoot().append($createParagraphNode().append(image));
      },
      { discrete: true }
    );
  });
  onEditorState.mockClear();
  await act(async () => {
    editor.update(
      () => {
        $getNodeByKey<ImageNode>(imageKey)?.setSrc(
          "https://example.com/image.png"
        );
      },
      { discrete: true, tag: "history-merge" }
    );
  });
  expect(onEditorState).toHaveBeenCalledWith(editor.getEditorState());
});

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
    getMentionedGroupsFromEditorState(mockLexicalEditor!.getEditorState(), true)
  ).toEqual([ApiDropGroupMention.All]);
});

it("keeps the focused chat editor editable while locking pending submission edits", async () => {
  const ref = createRef<CreateDropInputHandles>();
  const props = {
    waveId: "wave",
    editorState: null,
    type: null,
    canSubmit: true,
    isStormMode: false,
    isDropMode: false,
    onEditorState: jest.fn(),
    onReferencedNft: jest.fn(),
    onMentionedUser: jest.fn(),
    onMentionedWave: jest.fn(),
  };
  const { rerender } = render(
    <CreateDropInput {...props} ref={ref} submitting={false} />
  );
  await act(async () =>
    mockLexicalEditor!.update(
      () => {
        $getRoot()
          .clear()
          .append(
            $createParagraphNode().append($createTextNode("submitted draft"))
          );
      },
      { discrete: true }
    )
  );
  const input = screen.getByRole("textbox");
  await act(async () => ref.current?.focus());
  expect(input).toHaveFocus();
  rerender(<CreateDropInput {...props} ref={ref} submitting />);
  expect(screen.getByRole("textbox")).toBe(input);
  expect(input).toHaveAttribute("contenteditable", "true");
  expect(input).toHaveAttribute("aria-readonly", "true");
  expect(input).toHaveFocus();
  const beforeInput = new InputEvent("beforeinput", {
    bubbles: true,
    cancelable: true,
    inputType: "insertText",
    data: "x",
  });
  fireEvent(input, beforeInput);
  expect(beforeInput.defaultPrevented).toBe(true);
  // Safari can report an IME/autocorrection edit only after changing the DOM.
  act(() => {
    input.querySelector("p")!.textContent = "unexpected replacement";
    fireEvent.input(input, { inputType: "insertReplacementText" });
  });
  expect(input).toHaveTextContent("submitted draft");
  await act(async () => ref.current?.clearEditorState({ resetHistory: true }));
  expect(input).toHaveTextContent("");
  expect(input).toHaveFocus();
  rerender(<CreateDropInput {...props} ref={ref} submitting={false} />);
  await act(async () =>
    mockLexicalEditor!.update(
      () => {
        $getRoot()
          .clear()
          .append($createParagraphNode().append($createTextNode("next draft")));
      },
      { discrete: true }
    )
  );
  expect(input).toHaveTextContent("next draft");
});

it("does not submit an unfinished IME composition", async () => {
  const ref = createRef<CreateDropInputHandles>();
  renderInput(ref);
  const composing = jest
    .spyOn(mockLexicalEditor!, "isComposing")
    .mockReturnValue(true);
  await expect(ref.current!.expandMentionAliases()).resolves.toMatchObject({
    completed: false,
  });
  composing.mockRestore();
});

it("does not reapply Lexical focus to an already focused input", async () => {
  const ref = createRef<CreateDropInputHandles>();
  renderInput(ref);
  await waitFor(() => expect(mockLexicalEditor).not.toBeNull());
  const editor = mockLexicalEditor!;
  await act(async () =>
    editor.update(
      () => {
        $getRoot()
          .clear()
          .append($createParagraphNode().append($createTextNode("Draft text")));
      },
      { discrete: true }
    )
  );
  // WebKit focuses the editing host when a DOM selection moves into it.
  // JSDOM lacks that side effect; retain the real selection update here.
  const selection = window.getSelection()!;
  const setBaseAndExtent = selection.setBaseAndExtent.bind(selection);
  const selectionFocus = jest
    .spyOn(selection, "setBaseAndExtent")
    .mockImplementation((...args) => {
      setBaseAndExtent(...args);
      const root = editor.getRootElement();
      if (root?.contains(args[0])) root.focus({ preventScroll: true });
    });
  const focus = jest.spyOn(editor, "focus");
  try {
    await act(async () => ref.current?.focus());
    expect(screen.getByRole("textbox")).toHaveFocus();
    expect(focus).toHaveBeenCalledTimes(1);
    focus.mockClear();
    await act(async () => ref.current?.focus());
    expect(screen.getByRole("textbox")).toHaveFocus();
    expect(focus).not.toHaveBeenCalled();
    await act(async () => ref.current?.blur());
    expect(screen.getByRole("textbox")).not.toHaveFocus();
    await act(async () => ref.current?.focus());
    await waitFor(() => expect(screen.getByRole("textbox")).toHaveFocus());
    expect(focus).toHaveBeenCalledTimes(1);
  } finally {
    focus.mockRestore();
    selectionFocus.mockRestore();
  }
});
