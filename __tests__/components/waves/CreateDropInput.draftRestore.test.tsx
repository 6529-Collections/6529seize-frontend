import React, { createRef } from "react";
import { render, screen, waitFor } from "@testing-library/react";

import CreateDropInput, {
  type CreateDropInputHandles,
} from "@/components/waves/CreateDropInput";
import { clearWaveDraft } from "@/helpers/waves/wave-draft.helpers";

jest.unmock("lexical");

jest.mock("@/helpers/waves/wave-draft.helpers", () => ({
  clearWaveDraft: jest.fn(),
}));
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
jest.mock("@/components/waves/EditLastDropArrowUpPlugin", () => () => null);

const clearWaveDraftMock = clearWaveDraft as jest.Mock;

const WAVE_ID = "wave-draft-restore";

const RESTORABLE_DRAFT = JSON.stringify({
  root: {
    children: [
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: "normal",
            style: "",
            text: "restored draft",
            type: "text",
            version: 1,
          },
        ],
        direction: "ltr",
        format: "",
        indent: 0,
        type: "paragraph",
        version: 1,
      },
    ],
    direction: "ltr",
    format: "",
    indent: 0,
    type: "root",
    version: 1,
  },
});

const renderInput = (initialEditorStateJson: string | null) =>
  render(
    <CreateDropInput
      ref={createRef<CreateDropInputHandles>()}
      waveId={WAVE_ID}
      editorState={null}
      initialEditorStateJson={initialEditorStateJson}
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

beforeEach(() => {
  jest.clearAllMocks();
});

it("seeds a fresh editor from a restorable draft", async () => {
  renderInput(RESTORABLE_DRAFT);

  const editor = screen.getByRole("textbox");
  await waitFor(() => expect(editor.textContent).toContain("restored draft"));
  expect(clearWaveDraftMock).not.toHaveBeenCalled();
});

it("clears a draft that fails to parse and mounts an empty editor", async () => {
  renderInput('{"this is": "not a lexical editor state"');

  const editor = screen.getByRole("textbox");
  await waitFor(() => expect(editor.querySelector("p")).not.toBeNull());
  expect(editor.textContent ?? "").not.toContain("not a lexical");
  expect(clearWaveDraftMock).toHaveBeenCalledWith(WAVE_ID);
});
