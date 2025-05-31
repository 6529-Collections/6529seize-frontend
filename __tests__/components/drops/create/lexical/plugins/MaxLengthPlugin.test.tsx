import { renderHook } from '@testing-library/react';
import { MaxLengthPlugin } from '../../../../../../components/drops/create/lexical/plugins/MaxLengthPlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getSelection } from 'lexical';

jest.mock('@lexical/react/LexicalComposerContext', () => ({ useLexicalComposerContext: jest.fn() }));
jest.mock('lexical', () => ({
  $getSelection: jest.fn(),
  $isRangeSelection: () => true,
  RootNode: class {},
}));
jest.mock('@lexical/selection', () => ({ trimTextContentFromAnchor: jest.fn() }));
jest.mock('@lexical/utils', () => ({ $restoreEditorState: jest.fn() }));

const useLexicalComposerContextMock = useLexicalComposerContext as jest.Mock;
const trimTextContentFromAnchor = require('@lexical/selection').trimTextContentFromAnchor as jest.Mock;
const $restoreEditorState = require('@lexical/utils').$restoreEditorState as jest.Mock;

function setup(prevSize: number, newSize: number) {
  const root = { getTextContentSize: () => newSize } as any;
  const prevState = { read: (fn: any) => prevSize } as any;
  const editor = { registerNodeTransform: jest.fn((_: any, cb: any) => { cb(root); return () => {}; }), getEditorState: () => prevState };
  useLexicalComposerContextMock.mockReturnValue([editor]);
  ($getSelection as jest.Mock).mockReturnValue({ isCollapsed: () => true, anchor: 'a' });
  renderHook(() => MaxLengthPlugin({ maxLength: 5 }));
}

test('trims text when exceeding max length', () => {
  setup(4, 7);
  expect(trimTextContentFromAnchor).toHaveBeenCalledWith(expect.anything(), 'a', 2);
});

test('restores state when previous size was max', () => {
  setup(5, 6);
  expect($restoreEditorState).toHaveBeenCalled();
});
