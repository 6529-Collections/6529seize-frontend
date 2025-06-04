import React from 'react';
import { render, screen } from '@testing-library/react';
import CreateDropInput from '../../../components/waves/CreateDropInput';
import { ActiveDropAction } from '../../../types/dropInteractionTypes';

// Mock all lexical plugins and context
jest.mock('@lexical/react/LexicalComposer', () => ({ LexicalComposer: (p: any) => <div>{p.children}</div> }));
jest.mock('@lexical/react/LexicalComposerContext', () => ({ 
  useLexicalComposerContext: () => [{ 
    registerCommand: jest.fn(() => jest.fn()),
    update: jest.fn()
  }] 
}));
jest.mock('@lexical/react/LexicalRichTextPlugin', () => ({ RichTextPlugin: (p: any) => <div data-testid="placeholder">{p.placeholder}</div> }));
jest.mock('@lexical/react/LexicalContentEditable', () => ({ ContentEditable: () => <div /> }));
jest.mock('@lexical/react/LexicalErrorBoundary', () => ({ __esModule: true, default: () => <div /> }));
jest.mock('@lexical/react/LexicalHistoryPlugin', () => ({ HistoryPlugin: () => <div /> }));
jest.mock('@lexical/react/LexicalOnChangePlugin', () => ({ OnChangePlugin: () => <div /> }));
jest.mock('@lexical/react/LexicalMarkdownShortcutPlugin', () => ({ MarkdownShortcutPlugin: () => <div /> }));
jest.mock('@lexical/react/LexicalTabIndentationPlugin', () => ({ TabIndentationPlugin: () => <div /> }));
jest.mock('@lexical/react/LexicalListPlugin', () => ({ ListPlugin: () => <div /> }));
jest.mock('@lexical/react/LexicalLinkPlugin', () => ({ LinkPlugin: () => <div /> }));

// Mock custom plugins
jest.mock('../../../components/waves/CreateDropEmojiPicker', () => () => <div />);
jest.mock('../../../components/drops/create/lexical/plugins/emoji/EmojiPlugin', () => ({ __esModule: true, default: () => <div /> }));
jest.mock('../../../components/drops/create/lexical/plugins/ClearEditorPlugin', () => ({ 
  __esModule: true, 
  default: React.forwardRef<any, {}>(() => <div />) 
}));
jest.mock('../../../components/drops/create/lexical/plugins/mentions/MentionsPlugin', () => ({ 
  __esModule: true, 
  default: React.forwardRef<any, any>(() => <div />) 
}));
jest.mock('../../../components/drops/create/lexical/plugins/hashtags/HashtagsPlugin', () => ({ 
  __esModule: true, 
  default: React.forwardRef<any, any>(() => <div />) 
}));
jest.mock('../../../components/drops/create/lexical/plugins/MaxLengthPlugin', () => ({ MaxLengthPlugin: () => <div /> }));
jest.mock('../../../components/drops/create/lexical/plugins/DragDropPastePlugin', () => ({ __esModule: true, default: () => <div /> }));
jest.mock('../../../components/drops/create/lexical/plugins/enter/EnterKeyPlugin', () => ({ __esModule: true, default: () => <div /> }));

jest.mock('../../../hooks/useCapacitor', () => ({ __esModule: true, default: () => ({ isCapacitor: false }) }));

it('shows storm placeholder', () => {
  render(<CreateDropInput waveId="w" editorState={null} type={null} canSubmit={false} isStormMode={true} isDropMode={false} submitting={false} onEditorState={jest.fn()} onReferencedNft={jest.fn()} onMentionedUser={jest.fn()} />);
  expect(screen.getByTestId('placeholder')).toHaveTextContent('Add to the storm');
});

it('shows reply placeholder', () => {
  render(<CreateDropInput waveId="w" editorState={null} type={ActiveDropAction.REPLY} canSubmit={false} isStormMode={false} isDropMode={false} submitting={false} onEditorState={jest.fn()} onReferencedNft={jest.fn()} onMentionedUser={jest.fn()} />);
  expect(screen.getByTestId('placeholder')).toHaveTextContent('Post a reply');
});
