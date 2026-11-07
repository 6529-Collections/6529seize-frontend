import { useEffect } from "react";
import { act, render, waitFor } from "@testing-library/react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import LexicalErrorBoundary from "@lexical/react/LexicalErrorBoundary";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  type LexicalEditor,
} from "lexical";
import { EmojiNode } from "@/components/drops/create/lexical/nodes/EmojiNode";
import EmojiPlugin from "@/components/drops/create/lexical/plugins/emoji/EmojiPlugin";
import { EmojiProvider } from "@/contexts/EmojiContext";

// Real provider, real plugin, real Lexical: the loop needed all three.
jest.unmock("lexical");

jest.mock("@emoji-mart/data", () => ({
  __esModule: true,
  default: {
    emojis: {
      fire: {
        id: "fire",
        name: "Fire",
        keywords: "flame",
        skins: [{ native: "\u{1F525}" }],
      },
    },
  },
}));

function CaptureEditor({
  onEditor,
}: {
  readonly onEditor: (editor: LexicalEditor) => void;
}) {
  const [editor] = useLexicalComposerContext();
  useEffect(() => onEditor(editor), [editor, onEditor]);
  return null;
}

const renderComposer = (onEditor: (editor: LexicalEditor) => void) =>
  render(
    <EmojiProvider>
      <LexicalComposer
        initialConfig={{
          namespace: "emoji-list-failure",
          nodes: [EmojiNode],
          onError: (error: Error) => {
            throw error;
          },
        }}
      >
        <RichTextPlugin
          contentEditable={<ContentEditable aria-label="Message" />}
          placeholder={null}
          ErrorBoundary={LexicalErrorBoundary}
        />
        <EmojiPlugin />
        <CaptureEditor onEditor={onEditor} />
      </LexicalComposer>
    </EmojiProvider>
  );

const countEmojiNodes = (editor: LexicalEditor) =>
  JSON.stringify(editor.getEditorState().toJSON()).split('"type":"emoji"')
    .length - 1;

describe("EmojiPlugin when the custom emoji list fails", () => {
  const originalFetch = globalThis.fetch;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    globalThis.__resetEmojiContextCachesForTests?.();
    consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    consoleErrorSpy.mockRestore();
  });

  it("requests the list once instead of refetching in a loop, and native emoji still work", async () => {
    // Fails fast, like a blocked, offline or 5xx request.
    const fetchMock = jest.fn().mockResolvedValue({ ok: false });
    globalThis.fetch = fetchMock;
    const captured: { editor: LexicalEditor | null } = { editor: null };

    renderComposer((editor) => {
      captured.editor = editor;
    });

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    // Give a re-triggering effect plenty of turns to show up.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 300));
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // The composer keeps working with native emoji only.
    const activeEditor = captured.editor;
    if (!activeEditor) throw new Error("editor not captured");
    await act(async () => {
      activeEditor.update(() => {
        $getRoot().append(
          $createParagraphNode().append($createTextNode("hot :fire: take"))
        );
      });
    });
    await waitFor(() => expect(countEmojiNodes(activeEditor)).toBe(1));
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
