import React, { createRef } from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";

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
jest.mock(
  "@/components/drops/create/lexical/plugins/MaxLengthPlugin",
  () => ({ MaxLengthPlugin: () => null })
);
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
jest.mock("@/components/waves/EditLastDropArrowUpPlugin", () => () => null);

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
