import React, { createRef } from "react";
import { render } from "@testing-library/react";
import CreateDropContent from "@/components/drops/create/utils/CreateDropContent";
import {
  CreateDropType,
  CreateDropViewType,
} from "@/components/drops/create/types";

jest.mock("@lexical/react/LexicalComposer", () => ({
  LexicalComposer: ({ children }: any) => (
    <div data-testid="composer">{children}</div>
  ),
}));
jest.mock("@lexical/react/LexicalRichTextPlugin", () => ({
  RichTextPlugin: (props: any) => (
    <div>
      {props.placeholder}
      {props.contentEditable}
    </div>
  ),
}));
jest.mock("@lexical/react/LexicalContentEditable", () => ({
  ContentEditable: (props: any) => {
    mockContentEditableProps = props;
    return <div data-testid="editable" />;
  },
}));
jest.mock("@lexical/react/LexicalErrorBoundary", () => () => <div />);
jest.mock("@lexical/react/LexicalHistoryPlugin", () => ({
  HistoryPlugin: () => null,
}));
jest.mock("@lexical/react/LexicalOnChangePlugin", () => ({
  OnChangePlugin: (props: any) => {
    mockOnChangeProps = props;
    return null;
  },
}));
jest.mock("@lexical/react/LexicalMarkdownShortcutPlugin", () => ({
  MarkdownShortcutPlugin: () => null,
}));
jest.mock("@lexical/react/LexicalTabIndentationPlugin", () => ({
  TabIndentationPlugin: () => null,
}));
jest.mock("@lexical/react/LexicalListPlugin", () => ({
  ListPlugin: () => null,
}));
jest.mock("@lexical/react/LexicalLinkPlugin", () => ({
  LinkPlugin: (props: any) => {
    linkProps = props;
    return null;
  },
}));
jest.mock(
  "@/components/drops/create/lexical/plugins/ToggleViewButtonPlugin",
  () => (props: any) => {
    mockToggleViewProps = props;
    return <div data-testid="toggle" />;
  }
);
jest.mock("@/components/drops/create/lexical/plugins/MaxLengthPlugin", () => ({
  MaxLengthPlugin: () => null,
}));
jest.mock(
  "@/components/drops/create/lexical/plugins/mentions/MentionsPlugin",
  () => React.forwardRef(() => null)
);
jest.mock(
  "@/components/drops/create/lexical/plugins/hashtags/HashtagsPlugin",
  () => React.forwardRef(() => null)
);
jest.mock(
  "@/components/drops/create/lexical/plugins/waves/WaveMentionsPlugin",
  () => React.forwardRef(() => null)
);
jest.mock("@/components/drops/create/lexical/plugins/ClearEditorPlugin", () =>
  React.forwardRef((props, ref) => {
    mockClear = jest.fn();
    React.useImperativeHandle(ref, () => ({ clearEditorState: mockClear }));
    return null;
  })
);
jest.mock(
  "@/components/drops/create/lexical/plugins/DragDropPastePlugin",
  () => (props: any) => {
    mockDragDropPasteProps = props;
    return null;
  }
);
jest.mock(
  "@/components/drops/create/lexical/plugins/enter/EnterKeyPlugin",
  () => (props: any) => {
    mockEnterKeyProps = props;
    return null;
  }
);
jest.mock("@/components/drops/create/lexical/plugins/AutoFocusPlugin", () => {
  function MockAutoFocusPlugin() {
    React.useEffect(() => {
      mockAutoFocusMounts += 1;
      return () => {
        mockAutoFocusUnmounts += 1;
      };
    }, []);
    return null;
  }

  return MockAutoFocusPlugin;
});
jest.mock(
  "@/components/drops/create/lexical/plugins/emoji/EmojiPlugin",
  () => (props: any) => {
    mockEmojiPluginProps = props;
    return null;
  }
);
jest.mock(
  "@/components/drops/create/lexical/plugins/PlainTextPastePlugin",
  () => (props: any) => {
    mockPlainTextPasteProps = props;
    return null;
  }
);
jest.mock(
  "@/components/drops/create/lexical/plugins/EditablePlugin",
  () => (props: any) => {
    mockEditablePluginProps = props;
    return null;
  }
);
jest.mock(
  "@/components/drops/create/lexical/plugins/RootBlockGuardPlugin",
  () => ({
    __esModule: true,
    default: () => null,
  })
);
jest.mock("@/components/waves/CreateDropEmojiPicker", () => (props: any) => {
  mockEmojiPickerProps = props;
  return <div />;
});
jest.mock("@/components/drops/create/utils/storm/CreateDropParts", () => () => (
  <div data-testid="parts" />
));
jest.mock(
  "@/components/drops/create/utils/CreateDropActionsRow",
  () => (props: any) => {
    mockActionsRowProps = props;
    return <div data-testid="actions" />;
  }
);
jest.mock(
  "@/components/drops/create/utils/storm/CreateDropContentMissingMediaWarning",
  () => () => <div />
);
jest.mock(
  "@/components/drops/create/utils/storm/CreateDropContentMissingMetadataWarning",
  () => () => <div />
);
jest.mock("@/components/waves/drops/normalizeDropMarkdown", () => ({
  __esModule: true,
  default: (value: string) => value,
  normalizeDropMarkdown: (value: string) => value,
  exportDropMarkdown: () => "",
}));

let linkProps: any = null;
let mockClear: any;
let mockActionsRowProps: any = null;
let mockAutoFocusMounts = 0;
let mockAutoFocusUnmounts = 0;
let mockContentEditableProps: any = null;
let mockDragDropPasteProps: any = null;
let mockEditablePluginProps: any = null;
let mockEmojiPickerProps: any = null;
let mockEmojiPluginProps: any = null;
let mockEnterKeyProps: any = null;
let mockOnChangeProps: any = null;
let mockPlainTextPasteProps: any = null;
let mockToggleViewProps: any = null;

const renderCreateDropContent = (
  props: Partial<React.ComponentProps<typeof CreateDropContent>> = {}
) => (
  <CreateDropContent
    waveId={null}
    viewType={CreateDropViewType.COMPACT}
    editorState={null as any}
    type={CreateDropType.DROP}
    drop={null}
    loading={false}
    canAddPart={false}
    canSubmit={false}
    missingMedia={[]}
    missingMetadata={[]}
    onEditorState={jest.fn()}
    onReferencedNft={jest.fn()}
    onMentionedUser={jest.fn()}
    onMentionedWave={jest.fn()}
    setFiles={jest.fn()}
    onViewClick={jest.fn()}
    onDropPart={jest.fn()}
    onUploadEditorStateChange={jest.fn()}
    {...props}
  />
);

describe("CreateDropContent basic", () => {
  beforeEach(() => {
    linkProps = null;
    mockActionsRowProps = null;
    mockAutoFocusMounts = 0;
    mockAutoFocusUnmounts = 0;
    mockContentEditableProps = null;
    mockDragDropPasteProps = null;
    mockEditablePluginProps = null;
    mockEmojiPickerProps = null;
    mockEmojiPluginProps = null;
    mockEnterKeyProps = null;
    mockOnChangeProps = null;
    mockPlainTextPasteProps = null;
    mockToggleViewProps = null;
  });

  it("exposes clearEditorState and sets placeholder", () => {
    const ref = createRef<any>();
    const { getByText } = render(
      <CreateDropContent
        ref={ref}
        waveId={null}
        viewType={CreateDropViewType.COMPACT}
        editorState={null as any}
        type={CreateDropType.DROP}
        drop={null}
        loading={false}
        canAddPart={false}
        canSubmit={false}
        missingMedia={[]}
        missingMetadata={[]}
        onEditorState={jest.fn()}
        onReferencedNft={jest.fn()}
        onMentionedUser={jest.fn()}
        onMentionedWave={jest.fn()}
        setFiles={jest.fn()}
        onViewClick={jest.fn()}
        onDropPart={jest.fn()}
        onUploadEditorStateChange={jest.fn()}
      />
    );
    expect(getByText("Drop a post")).toBeInTheDocument();
    ref.current.clearEditorState();
    expect(mockClear).toHaveBeenCalled();
    expect(linkProps.validateUrl("https://example.com")).toBe(true);
    expect(linkProps.validateUrl("ftp:/bad")).toBe(false);
  });

  it("passes loading as a read-only lock to editor controls", () => {
    const onEditorState = jest.fn();
    const onUploadEditorStateChange = jest.fn();
    render(
      <CreateDropContent
        waveId={null}
        viewType={CreateDropViewType.COMPACT}
        editorState={null as any}
        type={CreateDropType.DROP}
        drop={null}
        loading={true}
        canAddPart={true}
        canSubmit={true}
        missingMedia={[]}
        missingMetadata={[]}
        onEditorState={onEditorState}
        onReferencedNft={jest.fn()}
        onMentionedUser={jest.fn()}
        onMentionedWave={jest.fn()}
        setFiles={jest.fn()}
        onViewClick={jest.fn()}
        onDropPart={jest.fn()}
        onUploadEditorStateChange={onUploadEditorStateChange}
      />
    );

    expect(mockContentEditableProps["aria-disabled"]).toBe(true);
    expect(mockEditablePluginProps.editable).toBe(false);
    expect(mockEmojiPickerProps.disabled).toBe(true);
    expect(mockEmojiPluginProps.disabled).toBe(true);
    expect(mockDragDropPasteProps.disabled).toBe(true);
    expect(mockPlainTextPasteProps.disabled).toBe(true);
    expect(mockEnterKeyProps.disabled).toBe(true);
    expect(mockActionsRowProps.disabled).toBe(true);
    expect(mockToggleViewProps.disabled).toBe(true);

    const lockedEditorState = { id: "locked-editor-state" } as any;
    mockOnChangeProps.onChange(lockedEditorState);
    expect(onEditorState).not.toHaveBeenCalled();

    expect(mockDragDropPasteProps.onUploadEditorStateChange).toBe(
      onUploadEditorStateChange
    );
    mockDragDropPasteProps.onUploadEditorStateChange(lockedEditorState);
    expect(onUploadEditorStateChange).toHaveBeenCalledWith(lockedEditorState);
    expect(onEditorState).not.toHaveBeenCalled();
  });

  it("keeps autofocus mounted while loading toggles", () => {
    const { rerender } = render(renderCreateDropContent({ loading: false }));

    expect(mockAutoFocusMounts).toBe(1);
    expect(mockAutoFocusUnmounts).toBe(0);

    rerender(renderCreateDropContent({ loading: true }));

    expect(mockAutoFocusMounts).toBe(1);
    expect(mockAutoFocusUnmounts).toBe(0);

    rerender(renderCreateDropContent({ loading: false }));

    expect(mockAutoFocusMounts).toBe(1);
    expect(mockAutoFocusUnmounts).toBe(0);
  });

  it("allows Enter submit by default when suggestion menus are closed", () => {
    render(renderCreateDropContent());

    expect(mockEnterKeyProps.canSubmitWithEnter()).toBe(true);
  });

  it("lets the editor handle Enter when submitOnEnter is false", () => {
    render(renderCreateDropContent({ submitOnEnter: false }));

    expect(mockEnterKeyProps.canSubmitWithEnter()).toBe(false);
  });
});
