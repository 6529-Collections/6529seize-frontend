import React from 'react';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EditDropLexical from '@/components/waves/drops/EditDropLexical';
import type { ApiDropMentionedUser } from '@/generated/models/ApiDropMentionedUser';

type MentionSelectHandler = (user: {
  mentioned_profile_id: string;
  handle_in_content: string;
}) => void;

const rootMock = {
  getChildren: jest.fn(() => [] as unknown[]),
  getAllTextNodes: jest.fn(() => [] as unknown[]),
  selectEnd: jest.fn(),
};
const getRootMock = jest.fn(() => rootMock);
const editorMock = {
  update: jest.fn(),
  getEditorState: jest.fn(() => ({
    read: (fn: () => void) => fn(),
  })),
  registerCommand: jest.fn(() => jest.fn()),
  focus: jest.fn(),
};

let mentionSelectHandler: MentionSelectHandler | null = null;

jest.mock('@lexical/list', () => ({
  ListNode: class MockListNode {},
  ListItemNode: class MockListItemNode {},
}));
jest.mock('@lexical/rich-text', () => ({
  HeadingNode: class MockHeadingNode {},
  QuoteNode: class MockQuoteNode {},
}));
jest.mock('@lexical/react/LexicalHorizontalRuleNode', () => ({
  HorizontalRuleNode: class MockHorizontalRuleNode {},
}));
jest.mock('@lexical/code', () => ({
  CodeHighlightNode: class MockCodeHighlightNode {},
  CodeNode: class MockCodeNode {},
  $isCodeNode: () => false,
}));
jest.mock('@lexical/link', () => ({
  AutoLinkNode: class MockAutoLinkNode {},
  LinkNode: class MockLinkNode {},
}));
jest.mock('@lexical/react/LexicalComposer', () => ({
  LexicalComposer: ({ children }: any) => (
    <div data-testid="lexical-composer">{children}</div>
  ),
}));
jest.mock('@lexical/react/LexicalRichTextPlugin', () => ({
  RichTextPlugin: ({ contentEditable, placeholder }: any) => (
    <div data-testid="rich-text-plugin">
      {contentEditable}
      {placeholder}
    </div>
  ),
}));
jest.mock('@lexical/react/LexicalContentEditable', () => ({
  ContentEditable: ({ className, style }: any) => (
    <div
      data-testid="content-editable"
      className={className}
      style={style}
      contentEditable="true"
      suppressContentEditableWarning
    />
  ),
}));
jest.mock('@lexical/react/LexicalErrorBoundary', () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock('@lexical/react/LexicalHistoryPlugin', () => ({
  HistoryPlugin: () => null,
}));
jest.mock('@lexical/react/LexicalOnChangePlugin', () => ({
  OnChangePlugin: ({ onChange }: any) => {
    React.useEffect(() => {
      const mockEditorState = {
        read: (fn: () => void) => fn(),
      };
      onChange(mockEditorState);
    }, [onChange]);
    return null;
  },
}));
jest.mock('@lexical/react/LexicalMarkdownShortcutPlugin', () => ({
  MarkdownShortcutPlugin: () => null,
}));
jest.mock('@lexical/react/LexicalListPlugin', () => ({
  ListPlugin: () => null,
}));
jest.mock('@lexical/react/LexicalLinkPlugin', () => ({
  LinkPlugin: () => null,
}));
jest.mock('@/components/drops/create/lexical/plugins/PlainTextPastePlugin', () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock('@/components/drops/create/lexical/plugins/emoji/EmojiPlugin', () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock('@/components/waves/CreateDropEmojiPicker', () => ({
  __esModule: true,
  default: () => <div data-testid="emoji-picker" />,
}));
jest.mock('@/hooks/useDeviceInfo', () => ({
  __esModule: true,
  default: () => ({ isApp: false }),
}));
jest.mock('@/components/drops/create/lexical/plugins/mentions/MentionsPlugin', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: React.forwardRef(({ onSelect }: any, ref: any) => {
      mentionSelectHandler = onSelect;
      React.useImperativeHandle(ref, () => ({
        isMentionsOpen: jest.fn(() => false),
      }));
      return <div data-testid="mentions-plugin" />;
    }),
  };
});
jest.mock('@/components/drops/create/lexical/nodes/MentionNode', () => ({
  MentionNode: class MockMentionNode {},
  $createMentionNode: jest.fn(() => ({ type: 'mention' })),
}));
jest.mock('@/components/drops/create/lexical/nodes/HashtagNode', () => ({
  HashtagNode: class MockHashtagNode {},
}));
jest.mock('@/components/drops/create/lexical/nodes/EmojiNode', () => ({
  EmojiNode: class MockEmojiNode {},
}));
jest.mock('@/components/drops/create/lexical/ExampleTheme', () => ({
  __esModule: true,
  default: {},
}));
jest.mock('@/components/drops/create/lexical/transformers/MentionTransformer', () => ({
  MENTION_TRANSFORMER: {},
}));
jest.mock('@/components/drops/create/lexical/transformers/HastagTransformer', () => ({
  HASHTAG_TRANSFORMER: {},
}));
jest.mock('@/components/drops/create/lexical/transformers/markdownTransformers', () => ({
  SAFE_MARKDOWN_TRANSFORMERS_WITHOUT_CODE: [],
}));
jest.mock('@lexical/react/LexicalComposerContext', () => ({
  useLexicalComposerContext: () => [editorMock],
}));
jest.mock('@lexical/markdown', () => ({
  __esModule: true,
  $convertFromMarkdownString: jest.fn(),
  $convertToMarkdownString: jest.fn(() => 'mock markdown'),
}));
const {
  $convertFromMarkdownString: convertFromMarkdownStringMock,
  $convertToMarkdownString: convertToMarkdownStringMock,
} = jest.requireMock('@lexical/markdown') as {
  $convertFromMarkdownString: jest.Mock;
  $convertToMarkdownString: jest.Mock;
};
jest.mock('lexical', () => ({
  $getRoot: getRootMock,
  COMMAND_PRIORITY_HIGH: 4,
  KEY_ENTER_COMMAND: 'KEY_ENTER_COMMAND',
  KEY_ESCAPE_COMMAND: 'KEY_ESCAPE_COMMAND',
  TextNode: class MockTextNode {},
  $createParagraphNode: jest.fn(() => ({
    append: jest.fn(),
    replace: jest.fn(),
  })),
  $createTextNode: jest.fn(() => ({
    setTextContent: jest.fn(),
    insertAfter: jest.fn(),
    insertBefore: jest.fn(),
    remove: jest.fn(),
    getTextContent: jest.fn(() => ''),
  })),
  $isElementNode: jest.fn(() => false),
  $isCodeNode: jest.fn(() => false),
}));

describe('EditDropLexical', () => {
  const defaultProps = {
    initialContent: 'Initial content here',
    initialMentions: [] as ApiDropMentionedUser[],
    waveId: 'wave-123',
    isSaving: false,
    onSave: jest.fn(),
    onCancel: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    convertToMarkdownStringMock.mockReturnValue('mock markdown');
    convertFromMarkdownStringMock.mockReset();
    rootMock.getChildren.mockReturnValue([]);
    rootMock.getAllTextNodes.mockReturnValue([]);
    mentionSelectHandler = null;
  });

  it('renders placeholder text and emoji picker', () => {
    render(<EditDropLexical {...defaultProps} />);
    expect(screen.getByText('Edit message...')).toBeInTheDocument();
    expect(screen.getByTestId('emoji-picker')).toBeInTheDocument();
  });

  it('saves updated markdown together with unique mentions', async () => {
    const user = userEvent.setup();
    const onSave = jest.fn();
    const onCancel = jest.fn();
    convertToMarkdownStringMock.mockReturnValue('updated markdown');

    render(<EditDropLexical {...defaultProps} onSave={onSave} onCancel={onCancel} />);

    expect(mentionSelectHandler).toBeTruthy();
    const mention = { mentioned_profile_id: 'profile-1', handle_in_content: 'user1' };

    await act(async () => {
      mentionSelectHandler?.(mention);
      mentionSelectHandler?.(mention);
    });

    const saveButton = screen.getByRole('button', { name: /save/i });
    await user.click(saveButton);

    expect(onSave).toHaveBeenCalledWith('updated markdown', [
      { mentioned_profile_id: 'profile-1', handle_in_content: 'user1' },
    ]);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('calls onCancel when markdown has not changed', async () => {
    const user = userEvent.setup();
    const onSave = jest.fn();
    const onCancel = jest.fn();
    convertToMarkdownStringMock.mockReturnValue('Initial content here');

    render(<EditDropLexical {...defaultProps} onSave={onSave} onCancel={onCancel} />);

    const saveButton = screen.getByRole('button', { name: /save/i });
    await user.click(saveButton);

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onSave).not.toHaveBeenCalled();
  });

  it('invokes keyboard command handlers', async () => {
    const onSave = jest.fn();
    const onCancel = jest.fn();
    convertToMarkdownStringMock.mockReturnValue('changed content');

    render(<EditDropLexical {...defaultProps} onSave={onSave} onCancel={onCancel} />);

    await act(async () => {});

    const escapeCall = editorMock.registerCommand.mock.calls.find(
      ([command]) => command === 'KEY_ESCAPE_COMMAND'
    );
    const enterCall = editorMock.registerCommand.mock.calls.find(
      ([command]) => command === 'KEY_ENTER_COMMAND'
    );

    expect(escapeCall).toBeDefined();
    expect(enterCall).toBeDefined();

    const escapeHandler = escapeCall?.[1] as () => boolean;
    const enterHandler = enterCall?.[1] as (event?: { shiftKey?: boolean }) => boolean;

    await act(async () => {
      escapeHandler?.();
    });
    expect(onCancel).toHaveBeenCalledTimes(1);

    let handled = false;
    await act(async () => {
      handled = enterHandler?.({ shiftKey: false }) ?? false;
    });
    expect(handled).toBe(true);
    expect(convertToMarkdownStringMock).toHaveBeenCalled();
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
