import React, { createRef } from 'react';
import { render } from '@testing-library/react';
import CreateDropContent from '@/components/drops/create/utils/CreateDropContent';
import { CreateDropType, CreateDropViewType } from '@/components/drops/create/types';

jest.mock('@lexical/react/LexicalComposer', () => ({ LexicalComposer: ({children}: any) => <div data-testid="composer">{children}</div> }));
jest.mock('@lexical/react/LexicalRichTextPlugin', () => ({ RichTextPlugin: (props: any) => <div>{props.placeholder}{props.contentEditable}</div> }));
jest.mock('@lexical/react/LexicalContentEditable', () => ({ ContentEditable: () => <div data-testid="editable" /> }));
jest.mock('@lexical/react/LexicalErrorBoundary', () => () => <div />);
jest.mock('@lexical/react/LexicalHistoryPlugin', () => ({ HistoryPlugin: () => null }));
jest.mock('@lexical/react/LexicalOnChangePlugin', () => ({ OnChangePlugin: () => null }));
jest.mock('@lexical/react/LexicalMarkdownShortcutPlugin', () => ({ MarkdownShortcutPlugin: () => null }));
jest.mock('@lexical/react/LexicalTabIndentationPlugin', () => ({ TabIndentationPlugin: () => null }));
jest.mock('@lexical/react/LexicalListPlugin', () => ({ ListPlugin: () => null }));
jest.mock('@lexical/react/LexicalLinkPlugin', () => ({ LinkPlugin: (props: any) => { linkProps = props; return null; } }));
jest.mock('@/components/drops/create/lexical/plugins/ToggleViewButtonPlugin', () => () => <div data-testid="toggle" />);
jest.mock('@/components/drops/create/lexical/plugins/MaxLengthPlugin', () => ({ MaxLengthPlugin: () => null }));
jest.mock('@/components/drops/create/lexical/plugins/mentions/MentionsPlugin', () => React.forwardRef(() => null));
jest.mock('@/components/drops/create/lexical/plugins/hashtags/HashtagsPlugin', () => React.forwardRef(() => null));
jest.mock('@/components/drops/create/lexical/plugins/ClearEditorPlugin', () => React.forwardRef((props, ref) => { mockClear = jest.fn(); React.useImperativeHandle(ref, () => ({ clearEditorState: mockClear })); return null; }));
jest.mock('@/components/drops/create/lexical/plugins/DragDropPastePlugin', () => () => null);
jest.mock('@/components/drops/create/lexical/plugins/enter/EnterKeyPlugin', () => () => null);
jest.mock('@/components/drops/create/lexical/plugins/AutoFocusPlugin', () => () => null);
jest.mock('@/components/drops/create/lexical/plugins/emoji/EmojiPlugin', () => () => null);
jest.mock('@/components/drops/create/lexical/plugins/PlainTextPastePlugin', () => () => null);
jest.mock('@/components/waves/CreateDropEmojiPicker', () => () => <div />);
jest.mock('@/components/drops/create/utils/storm/CreateDropParts', () => () => <div data-testid="parts" />);
jest.mock('@/components/drops/create/utils/CreateDropActionsRow', () => () => <div data-testid="actions" />);
jest.mock('@/components/drops/create/utils/storm/CreateDropContentMissingMediaWarning', () => () => <div />);
jest.mock('@/components/drops/create/utils/storm/CreateDropContentMissingMetadataWarning', () => () => <div />);

let linkProps: any = null;
let mockClear: any;

describe('CreateDropContent basic', () => {
  it('exposes clearEditorState and sets placeholder', () => {
    const ref = createRef<any>();
    const { getByText } = render(
      <CreateDropContent
        ref={ref}
        waveId={null}
        viewType={CreateDropViewType.COMPACT}
        editorState={null as any}
        type={CreateDropType.DROP}
        drop={null}
        canAddPart={false}
        canSubmit={false}
        missingMedia={[]}
        missingMetadata={[]}
        onEditorState={jest.fn()}
        onReferencedNft={jest.fn()}
        onMentionedUser={jest.fn()}
        setFiles={jest.fn()}
        onViewClick={jest.fn()}
        onDropPart={jest.fn()}
      />
    );
    expect(getByText('Drop a post')).toBeInTheDocument();
    ref.current.clearEditorState();
    expect(mockClear).toHaveBeenCalled();
    expect(linkProps.validateUrl('https://example.com')).toBe(true);
    expect(linkProps.validateUrl('ftp:/bad')).toBe(false);
  });
});
