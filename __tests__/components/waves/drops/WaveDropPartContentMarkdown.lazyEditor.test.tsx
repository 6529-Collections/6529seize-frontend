import { render, screen } from "@testing-library/react";

import WaveDropPartContentMarkdown from "@/components/waves/drops/WaveDropPartContentMarkdown";

let mockEditorModuleLoads = 0;
let mockEditorProps: any;

jest.mock("@/components/waves/drops/EditDropLexical", () => {
  mockEditorModuleLoads += 1;
  const { useEffect, useRef } = require("react");

  function MockEditDropLexical(props: any) {
    mockEditorProps = props;
    const inputRef = useRef(null as HTMLTextAreaElement | null);
    // The real editor focuses itself on mount; the lazy wrapper must not get
    // in the way of that.
    useEffect(() => {
      inputRef.current?.focus();
    }, []);
    return (
      <textarea
        ref={inputRef}
        aria-label="Edit drop"
        data-testid="edit-drop-lexical"
        defaultValue={props.initialContent}
      />
    );
  }

  return { __esModule: true, default: MockEditDropLexical };
});

jest.mock(
  "@/components/drops/view/part/DropPartMarkdownWithPropLogger",
  () => (props: any) => <div data-testid="md">{props.partContent}</div>
);

const part: any = { content: "hello world", quoted_drop: null };
const wave: any = { id: "wave-1" };
const drop: any = {
  id: "drop-1",
  serial_no: 3,
  author: { handle: "alice" },
  wave: { id: "wave-1", authenticated_user_admin: true },
  created_at: 0,
  updated_at: null,
  parts: [],
};

const renderMarkdown = (isEditing: boolean) =>
  render(
    <WaveDropPartContentMarkdown
      mentionedUsers={[]}
      mentionedWaves={[]}
      referencedNfts={[]}
      part={part}
      wave={wave}
      drop={drop}
      onQuoteClick={jest.fn()}
      isEditing={isEditing}
      onSave={jest.fn()}
      onCancel={jest.fn()}
    />
  );

describe("WaveDropPartContentMarkdown lazy editor", () => {
  it("does not load the Lexical editor until a drop enters edit mode", async () => {
    const view = renderMarkdown(false);

    expect(screen.getByTestId("md")).toHaveTextContent("hello world");
    expect(mockEditorModuleLoads).toBe(0);

    view.rerender(
      <WaveDropPartContentMarkdown
        mentionedUsers={[]}
        mentionedWaves={[]}
        referencedNfts={[]}
        part={part}
        wave={wave}
        drop={drop}
        onQuoteClick={jest.fn()}
        isEditing
        onSave={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    // The chunk is still in flight: a same-size status box holds the layout.
    expect(screen.getByRole("status")).toHaveTextContent("Loading editor");
    expect(screen.queryByTestId("md")).toBeNull();
    expect(screen.queryByTestId("edit-drop-lexical")).toBeNull();

    const editor = await screen.findByTestId("edit-drop-lexical");
    expect(mockEditorModuleLoads).toBe(1);
    expect(screen.queryByRole("status")).toBeNull();
    expect(editor).toHaveFocus();
    expect(mockEditorProps).toMatchObject({
      initialContent: "hello world",
      canMentionAll: true,
      waveId: "wave-1",
      isSaving: false,
    });
  });
});
