import React from "react";
import { render, screen } from "@testing-library/react";
import { KEY_ARROW_UP_COMMAND } from "lexical";
import CreateDropInput from "@/components/waves/CreateDropInput";
import EditLastDropArrowUpPlugin from "@/components/waves/EditLastDropArrowUpPlugin";
import { ActiveDropAction } from "@/types/dropInteractionTypes";

const mockRegisterCommand = jest.fn(() => jest.fn());

// Mock all lexical plugins and context
jest.mock("@lexical/react/LexicalComposer", () => ({
  LexicalComposer: (p: any) => <div>{p.children}</div>,
}));
jest.mock("@lexical/react/LexicalComposerContext", () => ({
  useLexicalComposerContext: () => [
    {
      registerCommand: mockRegisterCommand,
      update: jest.fn(),
    },
  ],
}));
jest.mock("@lexical/react/LexicalRichTextPlugin", () => ({
  RichTextPlugin: (p: any) => (
    <div data-testid="placeholder">{p.placeholder}</div>
  ),
}));
jest.mock("@lexical/react/LexicalContentEditable", () => ({
  ContentEditable: (p: any) => (
    <div data-testid="content-editable" className={p.className} />
  ),
}));
jest.mock("@lexical/react/LexicalErrorBoundary", () => ({
  __esModule: true,
  default: () => <div />,
}));
jest.mock("@lexical/react/LexicalHistoryPlugin", () => ({
  HistoryPlugin: () => <div />,
}));
jest.mock("@lexical/react/LexicalOnChangePlugin", () => ({
  OnChangePlugin: () => <div />,
}));
jest.mock("@lexical/react/LexicalMarkdownShortcutPlugin", () => ({
  MarkdownShortcutPlugin: () => <div />,
}));
jest.mock("@lexical/react/LexicalTabIndentationPlugin", () => ({
  TabIndentationPlugin: () => <div />,
}));
jest.mock("@lexical/react/LexicalListPlugin", () => ({
  ListPlugin: () => <div />,
}));
jest.mock("@lexical/react/LexicalLinkPlugin", () => ({
  LinkPlugin: () => <div />,
}));

// Mock custom plugins
jest.mock("@/components/waves/CreateDropEmojiPicker", () => () => <div />);
jest.mock(
  "@/components/drops/create/lexical/plugins/emoji/EmojiPlugin",
  () => ({ __esModule: true, default: () => <div /> })
);
jest.mock(
  "@/components/drops/create/lexical/plugins/ClearEditorPlugin",
  () => ({
    __esModule: true,
    default: React.forwardRef<any, {}>(() => <div />),
  })
);
jest.mock(
  "@/components/drops/create/lexical/plugins/mentions/MentionsPlugin",
  () => ({
    __esModule: true,
    default: React.forwardRef<any, any>(() => <div />),
  })
);
jest.mock(
  "@/components/drops/create/lexical/plugins/hashtags/HashtagsPlugin",
  () => ({
    __esModule: true,
    default: React.forwardRef<any, any>(() => <div />),
  })
);
jest.mock(
  "@/components/drops/create/lexical/plugins/waves/WaveMentionsPlugin",
  () => ({
    __esModule: true,
    default: React.forwardRef<any, any>(() => <div />),
  })
);
jest.mock("@/components/drops/create/lexical/plugins/MaxLengthPlugin", () => ({
  MaxLengthPlugin: () => <div />,
}));
jest.mock(
  "@/components/drops/create/lexical/plugins/DragDropPastePlugin",
  () => ({ __esModule: true, default: () => <div /> })
);
jest.mock(
  "@/components/drops/create/lexical/plugins/enter/EnterKeyPlugin",
  () => ({ __esModule: true, default: () => <div /> })
);

jest.mock("@/hooks/useCapacitor", () => ({
  __esModule: true,
  default: () => ({ isCapacitor: false }),
}));

const getArrowUpHandler = () => {
  const call = mockRegisterCommand.mock.calls.find(
    ([command]) => command === KEY_ARROW_UP_COMMAND
  );
  return call?.[1] as ((event: KeyboardEvent) => boolean) | undefined;
};

const createKeyboardEvent = (
  overrides: Partial<KeyboardEvent> = {}
): KeyboardEvent =>
  ({
    ctrlKey: false,
    metaKey: false,
    altKey: false,
    shiftKey: false,
    preventDefault: jest.fn(),
    ...overrides,
  }) as unknown as KeyboardEvent;

beforeEach(() => {
  mockRegisterCommand.mockClear();
});

it("shows storm placeholder", () => {
  render(
    <CreateDropInput
      waveId="w"
      editorState={null}
      type={null}
      canSubmit={false}
      isStormMode={true}
      stormPartNumber={2}
      isDropMode={false}
      submitting={false}
      onEditorState={jest.fn()}
      onReferencedNft={jest.fn()}
      onMentionedUser={jest.fn()}
      onMentionedWave={jest.fn()}
    />
  );
  expect(screen.getByTestId("placeholder")).toHaveTextContent("Write part 2");
});

it("shows reply placeholder", () => {
  render(
    <CreateDropInput
      waveId="w"
      editorState={null}
      type={ActiveDropAction.REPLY}
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
  expect(screen.getByTestId("placeholder")).toHaveTextContent("Post a reply");
});

it("shows chat message placeholder for the base chat composer", () => {
  render(
    <CreateDropInput
      waveId="w"
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

  expect(screen.getByTestId("placeholder")).toHaveTextContent(
    "Write a chat message"
  );
  expect(screen.getByText("Write a chat message")).toHaveClass(
    "tw-whitespace-nowrap",
    "tw-overflow-hidden",
    "tw-text-ellipsis"
  );
});

it("renders validation helper text when provided", () => {
  render(
    <CreateDropInput
      waveId="w"
      editorState={null}
      type={null}
      canSubmit={false}
      isStormMode={false}
      isDropMode={true}
      submitting={false}
      onEditorState={jest.fn()}
      onReferencedNft={jest.fn()}
      onMentionedUser={jest.fn()}
      onMentionedWave={jest.fn()}
      hasValidationError={true}
      validationHelperText="URL must be from superrare.com, manifold.xyz, opensea.io, transient.xyz, or foundation.app."
    />
  );

  expect(screen.getByRole("alert")).toHaveTextContent(
    "URL must be from superrare.com, manifold.xyz, opensea.io, transient.xyz, or foundation.app."
  );
});

describe("EditLastDropArrowUpPlugin", () => {
  it("triggers the callback and prevents default when enabled", () => {
    const onRequestEditLastDrop = jest.fn(() => true);
    render(
      <EditLastDropArrowUpPlugin
        canEditLastDropWithArrow={true}
        onRequestEditLastDrop={onRequestEditLastDrop}
        canUseArrowUpShortcut={() => true}
      />
    );

    const event = createKeyboardEvent();
    const handled = getArrowUpHandler()?.(event);

    expect(handled).toBe(true);
    expect(onRequestEditLastDrop).toHaveBeenCalledTimes(1);
    expect(event.preventDefault).toHaveBeenCalledTimes(1);
  });

  it("does nothing when disabled", () => {
    const onRequestEditLastDrop = jest.fn(() => true);
    render(
      <EditLastDropArrowUpPlugin
        canEditLastDropWithArrow={false}
        onRequestEditLastDrop={onRequestEditLastDrop}
        canUseArrowUpShortcut={() => true}
      />
    );

    const event = createKeyboardEvent();
    const handled = getArrowUpHandler()?.(event);

    expect(handled).toBe(false);
    expect(onRequestEditLastDrop).not.toHaveBeenCalled();
    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  it("does nothing with modifier keys", () => {
    const modifiers: Array<"ctrlKey" | "metaKey" | "altKey" | "shiftKey"> = [
      "ctrlKey",
      "metaKey",
      "altKey",
      "shiftKey",
    ];

    for (const modifier of modifiers) {
      mockRegisterCommand.mockClear();
      const onRequestEditLastDrop = jest.fn(() => true);
      render(
        <EditLastDropArrowUpPlugin
          canEditLastDropWithArrow={true}
          onRequestEditLastDrop={onRequestEditLastDrop}
          canUseArrowUpShortcut={() => true}
        />
      );

      const event = createKeyboardEvent({ [modifier]: true });
      const handled = getArrowUpHandler()?.(event);

      expect(handled).toBe(false);
      expect(onRequestEditLastDrop).not.toHaveBeenCalled();
      expect(event.preventDefault).not.toHaveBeenCalled();
    }
  });

  it("does nothing while a suggestion menu is open", () => {
    const onRequestEditLastDrop = jest.fn(() => true);
    render(
      <EditLastDropArrowUpPlugin
        canEditLastDropWithArrow={true}
        onRequestEditLastDrop={onRequestEditLastDrop}
        canUseArrowUpShortcut={() => false}
      />
    );

    const event = createKeyboardEvent();
    const handled = getArrowUpHandler()?.(event);

    expect(handled).toBe(false);
    expect(onRequestEditLastDrop).not.toHaveBeenCalled();
    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  it("does not prevent default when the callback returns false", () => {
    const onRequestEditLastDrop = jest.fn(() => false);
    render(
      <EditLastDropArrowUpPlugin
        canEditLastDropWithArrow={true}
        onRequestEditLastDrop={onRequestEditLastDrop}
        canUseArrowUpShortcut={() => true}
      />
    );

    const event = createKeyboardEvent();
    const handled = getArrowUpHandler()?.(event);

    expect(handled).toBe(false);
    expect(onRequestEditLastDrop).toHaveBeenCalledTimes(1);
    expect(event.preventDefault).not.toHaveBeenCalled();
  });
});
